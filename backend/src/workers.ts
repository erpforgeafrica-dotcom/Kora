import "dotenv/config";
import { Worker } from "bullmq";
import { queueConnection } from "./queues/index.js";
import { queryDb } from "./db/client.js";
import { enqueueAnomalyScanJobs, processAnomalyDetection } from "./workers/anomalyDetector.js";
import { runGlobalSignalAggregationCycle } from "./modules/ai/orchestration/signalAggregator.js";
import { logger } from "./shared/logger.js";

// Circuit breaker state
let isAnomalyScanRunning = false;
let isSignalAggregationRunning = false;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 5;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

const notificationsWorker = new Worker(
  "notifications",
  async (job) => {
    const jobLogger = logger.child({ 
      worker: "notifications", 
      jobId: job.id, 
      jobName: job.name 
    });
    
    jobLogger.info("Processing notification job");

    if (job.name === "dispatch_notification") {
      const payload = job.data.payload ?? {};
      const logId = typeof payload.notification_log_id === "string" ? payload.notification_log_id : null;
      if (logId) {
        await queryDb(
          `update notification_log
              set status = 'delivered',
                  sent_at = now(),
                  provider_id = coalesce(provider_id, $2)
            where id = $1`,
          [logId, `mock-${job.id}`]
        );
      }
      return { delivered: true };
    }

    if (job.name === "campaign_send") {
      const campaignRows = await queryDb<{
        id: string;
        organization_id: string;
        name: string;
        channel: "sms" | "email";
        subject: string | null;
        body: string;
        audience: Record<string, unknown> | null;
      }>(
        `select id::text, organization_id::text, name, channel, subject, body, audience
           from campaigns
          where id = $1 and organization_id = $2
          limit 1`,
        [job.data.campaignId, job.data.organizationId]
      );

      const campaign = campaignRows[0];
      if (!campaign) {
        throw new Error(`Campaign not found: ${job.data.campaignId}`);
      }

      const audience = campaign.audience ?? {};
      const tierFilter = typeof audience.tier === "string" && audience.tier !== "all" ? audience.tier : null;
      const clientRows = await queryDb<{
        id: string;
        full_name: string;
        email: string | null;
        phone: string | null;
      }>(
        `select id::text, full_name, email, phone
           from clients
          where organization_id = $1
            and ($2::text is null or membership_tier = $2)
          order by created_at desc
          limit 250`,
        [campaign.organization_id, tierFilter]
      );

      for (const client of clientRows) {
        const recipient = campaign.channel === "email" ? client.email : client.phone;
        if (!recipient) {
          continue;
        }

        await queryDb(
          `insert into notification_log (
             id, organization_id, client_id, channel, event, recipient, status, provider_id, sent_at, payload
           ) values (
             gen_random_uuid(), $1, $2, $3, $4, $5, 'delivered', $6, now(), $7::jsonb
           )`,
          [
            campaign.organization_id,
            client.id,
            campaign.channel,
            "campaign_send",
            recipient,
            `campaign-${campaign.id}-${job.id}`,
            JSON.stringify({ campaign_id: campaign.id, campaign_name: campaign.name })
          ]
        );
      }

      await queryDb(
        `update campaigns
            set status = 'sent',
                sent_count = $3,
                updated_at = now()
          where id = $1 and organization_id = $2`,
        [campaign.id, campaign.organization_id, clientRows.length]
      );

      return { delivered: true, count: clientRows.length };
    }

    throw new Error(`Unknown job type: ${job.name}`);
  },
  { 
    connection: queueConnection,
    concurrency: 5,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 }
  }
);

const reportingWorker = new Worker(
  "reporting",
  async (job) => {
    const jobLogger = logger.child({ 
      worker: "reporting", 
      jobId: job.id, 
      jobName: job.name 
    });
    
    jobLogger.info("Processing reporting job");
    
    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Job timeout after 30 seconds')), 30000);
    });
    
    const workPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ generated: true }), 200);
    });
    
    return Promise.race([workPromise, timeoutPromise]);
  },
  { 
    connection: queueConnection,
    concurrency: 3,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 }
  }
);

const anomalyWorker = new Worker(
  "anomaly-detector",
  async (job) => {
    const jobLogger = logger.child({ 
      worker: "anomaly-detector", 
      jobId: job.id, 
      jobName: job.name 
    });
    
    jobLogger.info("Processing anomaly detection job");
    await processAnomalyDetection(job.data);
    return { analyzed: true };
  },
  { 
    connection: queueConnection,
    concurrency: 2,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 }
  }
);

// Enhanced error handling with proper logging
notificationsWorker.on("completed", (job) => {
  logger.info("Notification job completed", { 
    worker: "notifications", 
    jobId: job.id,
    jobName: job.name
  });
});

notificationsWorker.on("failed", (job, err) => {
  logger.error("Notification job failed", { 
    worker: "notifications", 
    jobId: job?.id,
    jobName: job?.name,
    organizationId: job?.data?.organizationId
  }, err);
});

reportingWorker.on("completed", (job) => {
  logger.info("Reporting job completed", { 
    worker: "reporting", 
    jobId: job.id,
    jobName: job.name
  });
});

reportingWorker.on("failed", (job, err) => {
  logger.error("Reporting job failed", { 
    worker: "reporting", 
    jobId: job?.id,
    jobName: job?.name,
    organizationId: job?.data?.organizationId
  }, err);
});

anomalyWorker.on("completed", (job) => {
  logger.info("Anomaly detection job completed", { 
    worker: "anomaly-detector", 
    jobId: job.id,
    jobName: job.name
  });
});

anomalyWorker.on("failed", (job, err) => {
  logger.error("Anomaly detection job failed", { 
    worker: "anomaly-detector", 
    jobId: job?.id,
    jobName: job?.name,
    organizationId: job?.data?.organizationId
  }, err);
});

logger.info("Workers started successfully", {
  workers: ['notifications', 'reporting', 'anomaly-detector'],
  timestamp: new Date().toISOString()
});

// Circuit breaker for anomaly scanning
async function safeAnomalyScan(): Promise<void> {
  if (isAnomalyScanRunning) {
    logger.debug("Anomaly scan already running, skipping");
    return;
  }
  
  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    logger.warn("Anomaly scan circuit breaker open", { 
      consecutiveFailures,
      nextRetryIn: CIRCUIT_BREAKER_TIMEOUT 
    });
    return;
  }
  
  isAnomalyScanRunning = true;
  
  try {
    await enqueueAnomalyScanJobs();
    consecutiveFailures = 0; // Reset on success
    logger.debug("Anomaly scan jobs enqueued successfully");
  } catch (error) {
    consecutiveFailures++;
    logger.error("Anomaly scan failed", { 
      consecutiveFailures,
      error: error instanceof Error ? error.message : String(error)
    }, error instanceof Error ? error : undefined);
    
    // If circuit breaker opens, set timeout to reset
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      setTimeout(() => {
        consecutiveFailures = 0;
        logger.info("Anomaly scan circuit breaker reset");
      }, CIRCUIT_BREAKER_TIMEOUT);
    }
  } finally {
    isAnomalyScanRunning = false;
  }
}

// Circuit breaker for signal aggregation
async function safeSignalAggregation(): Promise<void> {
  if (isSignalAggregationRunning) {
    logger.debug("Signal aggregation already running, skipping");
    return;
  }
  
  isSignalAggregationRunning = true;
  
  try {
    await runGlobalSignalAggregationCycle();
    logger.debug("Signal aggregation cycle completed successfully");
  } catch (error) {
    logger.error("Signal aggregation failed", {
      error: error instanceof Error ? error.message : String(error)
    }, error instanceof Error ? error : undefined);
  } finally {
    isSignalAggregationRunning = false;
  }
}

// Session cleanup scheduler
async function safeSessionCleanup(): Promise<void> {
  try {
    const result = await queryDb<{ rows_deleted: number }>(
      `WITH deleted_sessions AS (
        DELETE FROM login_sessions
        WHERE expires_at < NOW()
           OR (revoked_at IS NOT NULL AND revoked_at < NOW() - interval '30 days')
        RETURNING id
      )
      SELECT COUNT(*) as rows_deleted FROM deleted_sessions`,
      []
    );

    const deletedCount = result[0]?.rows_deleted ?? 0;
    if (deletedCount > 0) {
      logger.info("Session cleanup completed", {
        sessionsDeleted: deletedCount,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error("Session cleanup failed", {
      error: error instanceof Error ? error.message : String(error)
    }, error instanceof Error ? error : undefined);
  }
}

// Initial runs with proper error handling
safeAnomalyScan();
safeSignalAggregation();
safeSessionCleanup();

// Scheduled runs with circuit breakers
const anomalyScanIntervalMs = Number(process.env.ANOMALY_SCAN_INTERVAL_MS ?? 60000);
const signalAggregationIntervalMs = Number(process.env.SIGNAL_AGG_INTERVAL_MS ?? 45000);
const sessionCleanupIntervalMs = Number(process.env.SESSION_CLEANUP_INTERVAL_MS ?? 3600000); // 1 hour default

setInterval(safeAnomalyScan, anomalyScanIntervalMs);
setInterval(safeSignalAggregation, signalAggregationIntervalMs);
setInterval(safeSessionCleanup, sessionCleanupIntervalMs);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down workers gracefully');
  
  await Promise.all([
    notificationsWorker.close(),
    reportingWorker.close(),
    anomalyWorker.close()
  ]);
  
  logger.info('All workers shut down successfully');
  process.exit(0);
});
