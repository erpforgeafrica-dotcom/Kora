-- 022_campaigns_social.sql
-- Campaign message targets and social accounts

create table if not exists campaign_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  channel text,
  subject text,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists campaign_targets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  customer_id uuid references clients(id),
  status text default 'pending',
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz
);

create table if not exists social_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  platform text not null,
  account_name text,
  account_id text,
  access_token text,
  token_expires_at timestamptz,
  is_active boolean default true,
  connected_at timestamptz default now(),
  unique (organization_id, platform)
);
