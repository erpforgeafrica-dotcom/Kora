-- 031_crm.sql
-- Add canonical CRM domain (multi-tenant)

create table if not exists crm_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  industry text,
  size text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_crm_accounts_org on crm_accounts(organization_id);

create table if not exists crm_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  account_id uuid references crm_accounts(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_crm_contacts_org on crm_contacts(organization_id);
create index if not exists idx_crm_contacts_account on crm_contacts(account_id);

create table if not exists crm_leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  status text not null default 'new' check (status in ('new','contacted','qualified','converted','lost')),
  source text,
  full_name text not null,
  email text,
  phone text,
  owner_id uuid,
  score numeric,
  notes text,
  converted_contact_id uuid references crm_contacts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_crm_leads_org on crm_leads(organization_id);
create index if not exists idx_crm_leads_status on crm_leads(status);
create index if not exists idx_crm_leads_owner on crm_leads(owner_id);

create table if not exists crm_deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  contact_id uuid references crm_contacts(id) on delete set null,
  account_id uuid references crm_accounts(id) on delete set null,
  title text not null,
  stage text not null default 'prospecting',
  value_cents integer,
  currency text not null default 'usd',
  probability numeric,
  close_date date,
  owner_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_crm_deals_org on crm_deals(organization_id);
create index if not exists idx_crm_deals_stage on crm_deals(stage);
create index if not exists idx_crm_deals_contact on crm_deals(contact_id);

create table if not exists crm_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid references crm_leads(id) on delete set null,
  contact_id uuid references crm_contacts(id) on delete set null,
  deal_id uuid references crm_deals(id) on delete set null,
  activity_type text not null,
  subject text not null,
  due_at timestamptz,
  completed_at timestamptz,
  owner_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_crm_activities_org on crm_activities(organization_id);
create index if not exists idx_crm_activities_due on crm_activities(due_at);

create table if not exists crm_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  channel text,
  status text not null default 'draft',
  started_at timestamptz,
  ended_at timestamptz,
  budget_cents integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_crm_campaigns_org on crm_campaigns(organization_id);

create table if not exists crm_lead_tags (
  lead_id uuid not null references crm_leads(id) on delete cascade,
  tag text not null,
  primary key (lead_id, tag)
);
create index if not exists idx_crm_lead_tags_lead on crm_lead_tags(lead_id);
