create table if not exists tenant_branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  address text,
  city text,
  country text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tenant_branches_org on tenant_branches(organization_id);
create index if not exists idx_tenant_branches_city on tenant_branches(city);

alter table users
  add column if not exists branch_id uuid references tenant_branches(id) on delete set null;

alter table bookings
  add column if not exists branch_id uuid references tenant_branches(id) on delete set null;

create index if not exists idx_bookings_branch_id on bookings(branch_id);

create table if not exists customer_ranks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  points_threshold integer not null default 0,
  benefits jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

alter table clients
  add column if not exists rank_id uuid references customer_ranks(id) on delete set null;

create index if not exists idx_clients_rank_id on clients(rank_id);

create table if not exists loyalty_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid not null unique references clients(id) on delete cascade,
  points_balance integer not null default 0,
  tier_id uuid references customer_ranks(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_loyalty_accounts_org on loyalty_accounts(organization_id);

insert into loyalty_accounts (organization_id, client_id, points_balance, created_at, updated_at)
select c.organization_id, c.id, c.loyalty_points, now(), now()
from clients c
where not exists (
  select 1
  from loyalty_accounts la
  where la.client_id = c.id
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  source text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leads_org_status on leads(organization_id, status);
create index if not exists idx_leads_org_created_at on leads(organization_id, created_at desc);

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  value numeric(12, 2) not null default 0,
  stage text not null default 'prospecting'
    check (stage in ('prospecting', 'proposal', 'negotiation', 'won', 'lost')),
  expected_close_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_opportunities_org_stage on opportunities(organization_id, stage);
create index if not exists idx_opportunities_lead_id on opportunities(lead_id);

create table if not exists customer_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  booking_id uuid references bookings(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  review text,
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_feedback_org_created_at
  on customer_feedback(organization_id, created_at desc);
create index if not exists idx_customer_feedback_client_id
  on customer_feedback(client_id);
