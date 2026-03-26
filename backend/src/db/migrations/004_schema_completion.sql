create extension if not exists pgcrypto;

alter table if exists ai_requests
  add column if not exists provider text;

create table if not exists anomaly_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  metric_name text not null,
  current_value numeric(20, 4) not null,
  expected_range jsonb not null,
  explanation_text text not null,
  severity text not null,
  created_at timestamptz not null default now()
);

-- Foreign key hardening checks (non-destructive)
alter table if exists ai_action_feedback
  alter column user_id drop not null;

alter table if exists ai_action_feedback
  drop constraint if exists ai_action_feedback_feedback_score_check,
  add constraint ai_action_feedback_feedback_score_check check (feedback_score between -1 and 1);

create index if not exists idx_bookings_org_start_status
  on bookings (organization_id, start_time desc, status);
create index if not exists idx_incidents_org_severity_status
  on incidents (organization_id, severity, status);
create index if not exists idx_invoices_org_status_due
  on invoices (organization_id, status, due_date);
create index if not exists idx_audit_logs_org_created
  on audit_logs (organization_id, created_at desc);
create index if not exists idx_ai_requests_org_created
  on ai_requests (organization_id, created_at desc);
create index if not exists idx_anomaly_events_org_created
  on anomaly_events (organization_id, created_at desc);
