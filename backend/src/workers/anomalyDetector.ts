import { queryDb } from "../db/client.js";
import { enqueueAnomalyDetection, enqueueNotification } from "../queues/index.js";
import { AIClient } from "../services/aiClient.js";
import { logger } from "../shared/logger.js";

export interface AnomalyDetectionJob {
  organizationId: string;
  metricName: string;
  currentValue: number;
  timestamp: string;
}

type SeriesPoint = { ts: string; value: string };

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]) {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

async function loadHourlySeries(organizationId: string, metricName: string): Promise<Array<{ ts: Date; value: number }>> {
  let rows: SeriesPoint[] = [];
  if (metricName === "avg_response_ms") {
    rows = await queryDb<SeriesPoint>(
      `select date_trunc('hour', created_at)::text as ts, coalesce(avg(latency_ms), 0)::text as value
       from ai_requests
       where organization_id = $1 and created_at > now() - interval '7 days'
       group by 1 order by 1`,
      [organizationId]
    );
  } else if (metricName === "daily_bookings") {
    rows = await queryDb<SeriesPoint>(
      `select date_trunc('hour', start_time)::text as ts, count(*)::text as value
       from bookings
       where organization_id = $1 and start_time > now() - interval '7 days'
       group by 1 order by 1`,
      [organizationId]
    );
  } else if (metricName === "overdue_invoices") {
    rows = await queryDb<SeriesPoint>(
      `select date_trunc('hour', created_at)::text as ts, count(*)::text as value
       from invoices
       where organization_id = $1 and status = 'overdue' and created_at > now() - interval '7 days'
       group by 1 order by 1`,
      [organizationId]
    );
  }

  return rows.map((r) => ({ ts: new Date(r.ts), value: Number(r.value) }));
}

export async function processAnomalyDetection(job: AnomalyDetectionJob) {
  const { organizationId, metricName, currentValue } = job;

  try {
    const hourly = await loadHourlySeries(organizationId, metricName);
    const values = hourly.map((h) => h.value);
    const rollingMean = mean(values);
    const rollingStd = Math.max(0.0001, stddev(values));
    const zThreshold = 2.5;
    const zScore = (currentValue - rollingMean) / rollingStd;
    const zAnomaly = Math.abs(zScore) > zThreshold;

    const targetHour = new Date(job.timestamp);
    const weekAgo = new Date(targetHour);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const sameHourPoint = hourly.find((p) => Math.abs(p.ts.getTime() - weekAgo.getTime()) <= 60 * 60 * 1000);
    const weekAgoValue = sameHourPoint?.value ?? rollingMean;
    const rateOfChange = weekAgoValue === 0 ? 0 : (currentValue - weekAgoValue) / Math.abs(weekAgoValue);
    const rocAnomaly = Math.abs(rateOfChange) > 0.4;

    if (!zAnomaly && !rocAnomaly) return;

    const aiClient = new AIClient(organizationId);
    const analysis = await aiClient.analyzeAnomaly(metricName, rollingMean, currentValue, {
      zScore,
      threshold: zThreshold,
      rateOfChange,
      timestamp: job.timestamp
    });

    await queryDb(
      `insert into ai_insights (organization_id, insight_type, content, confidence_score, generated_by, expires_at)
       values ($1, $2, $3, $4, $5, now() + interval '1 hour')`,
      [organizationId, "anomaly_detection", JSON.stringify(analysis), 0.95, "anomaly-detector"]
    );

    const expectedLow = rollingMean - zThreshold * rollingStd;
    const expectedHigh = rollingMean + zThreshold * rollingStd;
    await queryDb(
      `insert into anomaly_events (
         id, organization_id, metric_name, current_value, expected_range, explanation_text, severity, created_at
       ) values (
         gen_random_uuid(), $1, $2, $3, $4::jsonb, $5, $6, now()
       )`,
      [
        organizationId,
        metricName,
        currentValue,
        JSON.stringify({ low: Number(expectedLow.toFixed(3)), high: Number(expectedHigh.toFixed(3)), zScore, rateOfChange }),
        `${analysis.rootCause}. ${analysis.recommendation}`,
        analysis.severity
      ]
    );

    await enqueueNotification({
      organizationId,
      channel: "push",
      payload: {
        type: "anomaly_alert",
        metricName,
        severity: analysis.severity,
        rootCause: analysis.rootCause,
        recommendation: analysis.recommendation,
        expectedRange: { low: Number(expectedLow.toFixed(3)), high: Number(expectedHigh.toFixed(3)) },
        zScore,
        rateOfChange,
        timeDetected: new Date().toISOString()
      }
    });

    logger.info(`Anomaly detected: ${metricName} in org ${organizationId}`, { zScore, rateOfChange, severity: analysis.severity });
  } catch (error) {
    logger.error(`Anomaly detection job failed: ${error}`, { job });
    throw error;
  }
}

export async function enqueueAnomalyScanJobs() {
  const orgRows = await queryDb<{ organization_id: string }>(
    `select distinct organization_id::text as organization_id from anomaly_baselines`
  );

  for (const row of orgRows) {
    const organizationId = row.organization_id;
    const [avgResponseRows, bookingsRows, overdueRows] = await Promise.all([
      queryDb<{ value: string }>(
        `select coalesce(avg(latency_ms), 0)::text as value
         from ai_requests where organization_id = $1 and created_at > now() - interval '1 hour'`,
        [organizationId]
      ),
      queryDb<{ value: string }>(
        `select count(*)::text as value
         from bookings where organization_id = $1 and start_time::date = current_date`,
        [organizationId]
      ),
      queryDb<{ value: string }>(
        `select count(*)::text as value
         from invoices where organization_id = $1 and status = 'overdue'`,
        [organizationId]
      )
    ]);

    await Promise.all([
      enqueueAnomalyDetection({
        organizationId,
        metricName: "avg_response_ms",
        currentValue: Number(avgResponseRows[0]?.value ?? 0),
        timestamp: new Date().toISOString()
      }),
      enqueueAnomalyDetection({
        organizationId,
        metricName: "daily_bookings",
        currentValue: Number(bookingsRows[0]?.value ?? 0),
        timestamp: new Date().toISOString()
      }),
      enqueueAnomalyDetection({
        organizationId,
        metricName: "overdue_invoices",
        currentValue: Number(overdueRows[0]?.value ?? 0),
        timestamp: new Date().toISOString()
      })
    ]);
  }

  logger.info("Anomaly scan jobs enqueued", { organizationCount: orgRows.length });
}
