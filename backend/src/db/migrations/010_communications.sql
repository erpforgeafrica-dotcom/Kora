create table if not exists notification_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  event text not null,
  channel text not null check (channel in ('sms', 'email', 'push')),
  subject text,
  body text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organization_id, event, channel)
);

create table if not exists notification_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  channel text not null,
  event text not null,
  recipient text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'failed')),
  provider_id text,
  sent_at timestamptz,
  error text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  channel text not null check (channel in ('sms', 'email')),
  subject text,
  body text not null,
  audience jsonb,
  send_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'paused')),
  sent_count integer default 0,
  open_count integer default 0,
  created_by uuid references staff_members(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table bookings
  add column if not exists notifications_sent boolean default false;

create index if not exists idx_notification_templates_org_event
  on notification_templates(organization_id, event, channel);

create index if not exists idx_notification_log_org_created
  on notification_log(organization_id, created_at desc);

create index if not exists idx_campaigns_org_status
  on campaigns(organization_id, status, created_at desc);
