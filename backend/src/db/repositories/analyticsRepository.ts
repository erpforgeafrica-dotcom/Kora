import { queryDb } from "../client.js";

type BookingSummaryRow = {
  total: string;
  checked_in: string;
  pending: string;
};

type FinanceKpisRow = {
  mrr_cents: string;
  overdue_invoices: string;
};

type ReportingRow = {
  active_users: string;
  avg_response_ms: string;
  automation_rate: string;
  csat: string;
};

export async function getTodayBookingSummary(organizationId: string) {
  const rows = await queryDb<BookingSummaryRow>(
    `
      select
        count(*)::int::text as total,
        count(*) filter (where status = 'checked_in')::int::text as checked_in,
        count(*) filter (where status = 'pending')::int::text as pending
      from bookings
      where organization_id = $1
        and start_time::date = current_date
    `,
    [organizationId]
  );

  const yesterdayRows = await queryDb<BookingSummaryRow>(
    `
      select count(*)::int::text as total
      from bookings
      where organization_id = $1
        and start_time::date = current_date - interval '1 day'
    `,
    [organizationId]
  );

  const row = rows[0] ?? { total: "0", checked_in: "0", pending: "0" };
  const yesterday = Number(yesterdayRows[0]?.total ?? "0");
  const today = Number(row.total);
  const vs_yesterday_pct = yesterday > 0 ? ((today - yesterday) / yesterday) * 100 : 0;

  return {
    today_total: today,
    completed: Number(row.checked_in),
    pending: Number(row.pending),
    vs_yesterday_pct
  };
}

export async function getFinanceKpis(organizationId: string) {
  const rows = await queryDb<FinanceKpisRow>(
    `
      select
        coalesce(sum(amount_cents) filter (where status = 'paid'), 0)::bigint::text as mrr_cents,
        count(*) filter (where status = 'overdue')::int::text as overdue_invoices
      from invoices
      where organization_id = $1
    `,
    [organizationId]
  );

  const row = rows[0] ?? { mrr_cents: "0", overdue_invoices: "0" };
  return {
    mrr: Number(row.mrr_cents) / 100,
    growthRate: 0,
    overdueInvoices: Number(row.overdue_invoices)
  };
}

export async function getReportingSummary(organizationId: string) {
  const rows = await queryDb<ReportingRow>(
    `
      with recent_ai as (
        select coalesce(avg(latency_ms), 0)::numeric(10,2) as avg_response_ms
        from ai_requests
        where organization_id = $1
      ),
      recent_audit as (
        select
          count(distinct actor_id)::int as active_users,
          coalesce(avg((metadata->>'automation_rate')::numeric), 0)::numeric(10,2) as automation_rate,
          coalesce(avg((metadata->>'csat')::numeric), 0)::numeric(10,2) as csat
        from audit_logs
        where organization_id = $1
      )
      select
        recent_audit.active_users::text as active_users,
        recent_ai.avg_response_ms::text as avg_response_ms,
        recent_audit.automation_rate::text as automation_rate,
        recent_audit.csat::text as csat
      from recent_ai, recent_audit
    `,
    [organizationId]
  );

  const row = rows[0] ?? { active_users: "0", avg_response_ms: "0", automation_rate: "0", csat: "0" };
  return {
    generatedAt: new Date().toISOString(),
    metrics: [
      { key: "active_users", value: Number(row.active_users) },
      { key: "avg_response_ms", value: Number(row.avg_response_ms) },
      { key: "automation_rate", value: Number(row.automation_rate) },
      { key: "csat", value: Number(row.csat) }
    ]
  };
}
