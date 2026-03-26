create extension if not exists pgcrypto;

create table if not exists ai_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  model text not null,
  prompt_tokens int not null default 0,
  completion_tokens int not null default 0,
  total_tokens int not null default 0,
  cost_usd numeric(10, 6) not null default 0,
  latency_ms int not null default 0,
  inference_type text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ai_insights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  insight_type text not null,
  content jsonb not null,
  confidence_score numeric(3, 2),
  generated_by text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_predictions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  metric_name text not null,
  predicted_value numeric(20, 4),
  confidence_interval_lower numeric(20, 4),
  confidence_interval_upper numeric(20, 4),
  prediction_window_start timestamptz not null,
  prediction_window_end timestamptz not null,
  actual_value numeric(20, 4),
  accuracy_delta numeric(20, 4),
  created_at timestamptz not null default now(),
  validated_at timestamptz
);

create table if not exists anomaly_baselines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  metric_name text not null,
  baseline_value numeric(20, 4),
  std_dev numeric(20, 4),
  z_score_threshold numeric(5, 2) default 2.5,
  last_updated timestamptz not null default now(),
  unique(organization_id, metric_name)
);

create table if not exists ai_budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  monthly_limit_usd numeric(10, 2) not null default 100.00,
  current_month_spend_usd numeric(10, 2) default 0,
  reset_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id)
);

create index if not exists idx_ai_requests_org on ai_requests(organization_id);
create index if not exists idx_ai_requests_created_at on ai_requests(created_at);
create index if not exists idx_ai_requests_model on ai_requests(model);
create index if not exists idx_ai_insights_org_id on ai_insights(organization_id);
create index if not exists idx_ai_insights_expires_at on ai_insights(expires_at);
create index if not exists idx_ai_predictions_org_id on ai_predictions(organization_id);
create index if not exists idx_ai_predictions_metric on ai_predictions(metric_name);
create index if not exists idx_anomaly_baselines_org_id on anomaly_baselines(organization_id);
create index if not exists idx_ai_budgets_org_id on ai_budgets(organization_id);
