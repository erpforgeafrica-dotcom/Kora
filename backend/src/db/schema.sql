create table if not exists organizations (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  role text not null,
  email text not null unique,
  password_hash text,
  locked_until timestamptz,
  failed_attempts integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists clinical_records (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  patient_id text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists incidents (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  severity text not null,
  description text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  amount_cents int not null,
  status text not null,
  due_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists ai_requests (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  model text not null,
  prompt_tokens int not null default 0,
  completion_tokens int not null default 0,
  latency_ms int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  channel text not null,
  payload jsonb not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  actor_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  report_type text not null,
  payload jsonb not null,
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

-- Session lifecycle tracking
create table if not exists login_sessions (
  id uuid primary key default gen_random_uuid(),
  token_jti text not null unique,
  user_id uuid not null references users(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  ip_address text,
  user_agent text,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_activity_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoke_reason text
);

-- Login attempt tracking for brute-force protection
create table if not exists login_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  organization_id uuid references organizations(id),
  identifier text not null,
  ip_address text,
  user_agent text,
  success boolean not null,
  reason text,
  attempt_time timestamptz not null default now()
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

-- Create indexes for performance
create index if not exists idx_users_email on users(lower(email));
create index if not exists idx_users_organization on users(organization_id);
create index if not exists idx_ai_insights_org on ai_insights(organization_id);
create index if not exists idx_ai_insights_expires on ai_insights(expires_at);
create index if not exists idx_ai_predictions_org on ai_predictions(organization_id);
create index if not exists idx_ai_predictions_metric on ai_predictions(metric_name);
create index if not exists idx_anomaly_baselines_org on anomaly_baselines(organization_id);
create index if not exists idx_ai_budgets_org on ai_budgets(organization_id);
create index if not exists idx_login_sessions_jti on login_sessions(token_jti);
create index if not exists idx_login_sessions_user on login_sessions(user_id);
create index if not exists idx_login_sessions_expires on login_sessions(expires_at);
create index if not exists idx_login_attempts_identifier on login_attempts(identifier);
create index if not exists idx_login_attempts_user on login_attempts(user_id);
create index if not exists idx_login_attempts_time on login_attempts(attempt_time);
