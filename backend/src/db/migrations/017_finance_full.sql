-- 017_finance_full.sql
-- Finance extensions: subscriptions, payouts, tax; invoice enrich

alter table invoices
  add column if not exists tax_amount_cents int default 0,
  add column if not exists discount_amount_cents int default 0,
  add column if not exists insurance_claim_id uuid;

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  customer_id uuid references clients(id),
  plan_name text not null,
  plan_type text,
  amount_cents int not null,
  currency text default 'GBP',
  status text default 'active',
  stripe_subscription_id text unique,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  staff_id uuid references staff_members(id),
  period_start date,
  period_end date,
  gross_amount_cents int,
  commission_rate numeric(4,2),
  commission_amount_cents int,
  net_amount_cents int,
  status text default 'pending',
  stripe_payout_id text,
  paid_at timestamptz
);

create table if not exists tax_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  tax_period text,
  tax_type text,
  taxable_amount_cents bigint,
  tax_rate numeric(6,4),
  tax_amount_cents bigint,
  status text default 'draft',
  filed_at timestamptz,
  created_at timestamptz default now()
);
