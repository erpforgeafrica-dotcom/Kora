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
