import crypto from "node:crypto";
import { queryDb } from "../../../db/client.js";
import { logger } from "../../../shared/logger.js";
import type { CausalityInsight, ModuleSignalSnapshot, NormalizedCommandCandidate } from "./types.js";

type NumberRow = { value: string };

function toNum(v: string | number | null | undefined) {
  return Number(v ?? 0);
}

function mkFingerprint(organizationId: string, sourceModule: string, title: string, context: string) {
  return crypto
    .createHash("sha256")
    .update(`${organizationId}:${sourceModule}:${title}:${context}`)
    .digest("hex");
}

function mkCandidate(
  organizationId: string,
  sourceModule: NormalizedCommandCandidate["sourceModule"],
  title: string,
  context: string,
  severity: NormalizedCommandCandidate["severity"],
  dependencies: string[],
  slaRisk: number,
  metadata: Record<string, unknown> = {}
): NormalizedCommandCandidate {
  return {
    id: crypto.randomUUID(),
    organizationId,
    sourceModule,
    title,
    context,
    severity,
    dependencies,
    slaRisk,
    commandFingerprint: mkFingerprint(organizationId, sourceModule, title, context),
    metadata,
    detectedAt: new Date().toISOString()
  };
}

export async function loadModuleSignalSnapshot(organizationId: string): Promise<ModuleSignalSnapshot> {
  const [
    activeUsersRows,
    adminUsersRows,
    pendingBookingsRows,
    totalBookingsRows,
    clinicalRows,
    openIncidentsRows,
    criticalIncidentsRows,
    overdueInvoicesRows,
    overdueAmountRows,
    aiLatencyRows,
    aiCountRows,
    pendingNotificationsRows,
    staleReportsRows
  ] = await Promise.all([
    queryDb<NumberRow>(
      `select count(distinct actor_id)::text as value
       from audit_logs
       where organization_id = $1 and created_at > now() - interval '24 hours'`,
      [organizationId]
    ),
    queryDb<NumberRow>(
      `select count(*)::text as value
       from users
       where organization_id = $1 and role in ('admin', 'owner', 'super_admin')`,
      [organizationId]
    ),
    queryDb<NumberRow>(
      `select count(*)::text as value
       from bookings
       where organization_id = $1 and start_time::date = current_date and status = 'pending'`,
      [organizationId]
    ),
    queryDb<NumberRow>(
      `select count(*)::text as value
       from bookings
       where organization_id = $1 and start_time::date = current_date`,
      [organizationId]
    ),
    queryDb<NumberRow>(
      `select count(*)::text as value
       from clinical_records
       where organization_id = $1 and created_at > now() - interval '24 hours'`,
      [organizationId]
    ),
    queryDb<NumberRow>(
      `select count(*)::text as value
       from incidents
       where organization_id = $1 and status in ('open', 'active')`,
      [organizationId]
    ),
    queryDb<NumberRow>(
      `select count(*)::text as value
       from incidents
       where organization_id = $1 and status in ('open', 'active') and severity = 'critical'`,
      [organizationId]
    ),
    queryDb<NumberRow>(
      `select count(*)::text as value
       from invoices
       where organization_id = $1 and status = 'overdue'`,
      [organizationId]
    ),
    queryDb<NumberRow>(
      `select coalesce(sum(amount_cents), 0)::text as value
       from invoices
       where organization_id = $1 and status = 'overdue'`,
      [organizationId]
    ),
    queryDb<NumberRow>(
      `select coalesce(avg(latency_ms), 0)::text as value
       from ai_requests
       where organization_id = $1 and created_at > now() - interval '1 hour'`,
      [organizationId]
    ),
    queryDb<NumberRow>(
      `select count(*)::text as value
       from ai_requests
       where organization_id = $1 and created_at > now() - interval '1 hour'`,
      [organizationId]
    ),
    queryDb<NumberRow>(
      `select count(*)::text as value
       from notifications
       where organization_id = $1 and status != 'sent'`,
      [organizationId]
    ),
    queryDb<NumberRow>(
      `select count(*)::text as value
       from reports
       where organization_id = $1 and created_at < now() - interval '24 hours'`,
      [organizationId]
    )
  ]);

  return {
    auth: {
      activeUsers24h: toNum(activeUsersRows[0]?.value),
      adminUsers: toNum(adminUsersRows[0]?.value)
    },
    bookings: {
      pendingToday: toNum(pendingBookingsRows[0]?.value),
      totalToday: toNum(totalBookingsRows[0]?.value)
    },
    clinical: {
      recordsToday: toNum(clinicalRows[0]?.value)
    },
    emergency: {
      openIncidents: toNum(openIncidentsRows[0]?.value),
      criticalIncidents: toNum(criticalIncidentsRows[0]?.value)
    },
    finance: {
      overdueInvoices: toNum(overdueInvoicesRows[0]?.value),
      overdueAmountCents: toNum(overdueAmountRows[0]?.value)
    },
    ai: {
      avgLatencyMs1h: toNum(aiLatencyRows[0]?.value),
      totalRequests1h: toNum(aiCountRows[0]?.value)
    },
    notifications: {
      pendingNotifications: toNum(pendingNotificationsRows[0]?.value)
    },
    reporting: {
      staleReports24h: toNum(staleReportsRows[0]?.value)
    }
  };
}

export function buildCommandCandidates(organizationId: string, signals: ModuleSignalSnapshot): NormalizedCommandCandidate[] {
  const out: NormalizedCommandCandidate[] = [];

  if (signals.emergency.criticalIncidents > 0) {
    out.push(
      mkCandidate(
        organizationId,
        "emergency",
        "Resolve critical incident queue",
        `${signals.emergency.criticalIncidents} critical incidents open`,
        "critical",
        ["clinical", "notifications"],
        0.98,
        { openIncidents: signals.emergency.openIncidents }
      )
    );
  }

  if (signals.finance.overdueInvoices > 0) {
    out.push(
      mkCandidate(
        organizationId,
        "finance",
        "Address overdue receivables",
        `${signals.finance.overdueInvoices} overdue invoices totaling ${Math.round(signals.finance.overdueAmountCents / 100)} USD`,
        signals.finance.overdueInvoices > 10 ? "high" : "medium",
        signals.emergency.openIncidents > 0 ? ["emergency"] : [],
        0.79,
        { overdueAmountCents: signals.finance.overdueAmountCents }
      )
    );
  }

  if (signals.bookings.pendingToday > 25) {
    out.push(
      mkCandidate(
        organizationId,
        "bookings",
        "Reduce pending bookings backlog",
        `${signals.bookings.pendingToday} pending bookings today`,
        "high",
        ["notifications", "clinical"],
        0.82
      )
    );
  }

  if (signals.clinical.recordsToday < Math.max(1, Math.floor(signals.bookings.totalToday * 0.35))) {
    out.push(
      mkCandidate(
        organizationId,
        "clinical",
        "Investigate clinical throughput drift",
        `Clinical records (${signals.clinical.recordsToday}) trailing booking volume (${signals.bookings.totalToday})`,
        "high",
        ["bookings"],
        0.86
      )
    );
  }

  if (signals.ai.avgLatencyMs1h > 1800) {
    out.push(
      mkCandidate(
        organizationId,
        "ai",
        "Mitigate AI inference latency",
        `Average AI latency is ${Math.round(signals.ai.avgLatencyMs1h)}ms in last hour`,
        "medium",
        ["reporting"],
        0.62
      )
    );
  }

  if (signals.notifications.pendingNotifications > 60) {
    out.push(
      mkCandidate(
        organizationId,
        "notifications",
        "Drain outbound notification queue",
        `${signals.notifications.pendingNotifications} unsent notifications`,
        "medium",
        ["bookings", "finance"],
        0.58
      )
    );
  }

  if (signals.reporting.staleReports24h > 0) {
    out.push(
      mkCandidate(
        organizationId,
        "reporting",
        "Regenerate stale operational reports",
        `${signals.reporting.staleReports24h} reports are older than 24h`,
        "medium",
        ["ai", "finance"],
        0.53
      )
    );
  }

  if (signals.auth.activeUsers24h > 0 && signals.auth.adminUsers === 0) {
    out.push(
      mkCandidate(
        organizationId,
        "auth",
        "Restore admin access coverage",
        "Active users detected with no admin coverage",
        "high",
        [],
        0.9
      )
    );
  }

  return out;
}

export async function persistCommandCandidates(organizationId: string, candidates: NormalizedCommandCandidate[]) {
  await queryDb(
    `delete from ai_command_candidates
     where organization_id = $1 and detected_at < now() - interval '2 days'`,
    [organizationId]
  );

  for (const c of candidates) {
    await queryDb(
      `insert into ai_command_candidates (
         id, organization_id, source_module, title, context, severity, dependencies, sla_risk, command_fingerprint, metadata, detected_at, status
       )
       values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10::jsonb,$11,'open')`,
      [
        c.id,
        c.organizationId,
        c.sourceModule,
        c.title,
        c.context,
        c.severity,
        JSON.stringify(c.dependencies),
        c.slaRisk,
        c.commandFingerprint,
        JSON.stringify(c.metadata),
        c.detectedAt
      ]
    );
  }
}

export async function aggregateCommandSignals(organizationId: string) {
  const signals = await loadModuleSignalSnapshot(organizationId);
  const candidates = buildCommandCandidates(organizationId, signals);
  await persistCommandCandidates(organizationId, candidates);
  const causalityInsights = causalityAnalysis(signals);
  return { signals, candidates, causalityInsights };
}

export async function runGlobalSignalAggregationCycle() {
  const orgRows = await queryDb<{ id: string }>(`select id::text as id from organizations`);
  for (const org of orgRows) {
    try {
      await aggregateCommandSignals(org.id);
    } catch (error) {
      logger.error("Signal aggregation failed for organization", { organizationId: org.id, error });
    }
  }
}

export function causalityAnalysis(signals: ModuleSignalSnapshot): CausalityInsight[] {
  const out: CausalityInsight[] = [];

  if (signals.clinical.recordsToday < Math.max(1, signals.bookings.totalToday * 0.45) && signals.bookings.totalToday > 25) {
    out.push({
      pattern: "clinical_records lag + booking_volume spike",
      affected_modules: ["clinical", "bookings", "finance"],
      estimated_revenue_impact_usd: Math.round((signals.bookings.totalToday - signals.clinical.recordsToday) * 35),
      urgency: "24h",
      recommended_action: "Scale clinical staffing for surge window and prioritize high-value appointments."
    });
  }

  if (signals.emergency.openIncidents > 0 && signals.finance.overdueInvoices > 0) {
    out.push({
      pattern: "emergency incidents open + invoices overdue",
      affected_modules: ["emergency", "finance"],
      estimated_revenue_impact_usd: Math.round((signals.finance.overdueAmountCents / 100) * 0.08),
      urgency: "immediate",
      recommended_action: "Resolve emergency queue first, then trigger focused collections workflow."
    });
  }

  if (signals.ai.avgLatencyMs1h > 1500 && signals.notifications.pendingNotifications > 40) {
    out.push({
      pattern: "ai_latency high + anomaly_count rising proxy",
      affected_modules: ["ai", "notifications", "reporting"],
      estimated_revenue_impact_usd: null,
      urgency: "24h",
      recommended_action: "Shift to lower-latency models and scale worker throughput."
    });
  }

  if (signals.notifications.pendingNotifications > 60 && signals.bookings.totalToday > 20) {
    out.push({
      pattern: "notifications pending high + booking confirmations",
      affected_modules: ["notifications", "bookings"],
      estimated_revenue_impact_usd: Math.round(signals.notifications.pendingNotifications * 12),
      urgency: "72h",
      recommended_action: "Drain confirmation queue and activate failover channel (SMS/WhatsApp)."
    });
  }

  return out;
}
