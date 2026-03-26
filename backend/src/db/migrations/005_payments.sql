create extension if not exists pgcrypto;

create table if not exists stripe_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid,
  user_id uuid references users(id) on delete set null,
  stripe_customer_id text not null unique,
  email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  invoice_id uuid references invoices(id) on delete set null,
  booking_id uuid references bookings(id) on delete set null,
  client_id uuid,
  stripe_payment_intent_id text unique,
  stripe_charge_id text,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null check (status in ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
  payment_method text not null check (payment_method in ('card_present', 'card', 'bank_transfer', 'cash', 'loyalty_points', 'split')),
  receipt_url text,
  receipt_sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  processed_by uuid references users(id) on delete set null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists transaction_splits (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  method text not null,
  amount_cents integer not null check (amount_cents > 0),
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

create table if not exists subscription_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  interval text not null check (interval in ('daily', 'weekly', 'monthly', 'quarterly', 'annually')),
  trial_days integer not null default 0 check (trial_days >= 0),
  stripe_price_id text,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid,
  plan_id uuid not null references subscription_plans(id) on delete restrict,
  stripe_subscription_id text unique,
  status text not null check (status in ('active', 'past_due', 'canceled', 'paused', 'trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  trial_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists insurance_claims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid,
  booking_id uuid references bookings(id) on delete set null,
  invoice_id uuid references invoices(id) on delete set null,
  payer_name text not null,
  payer_id text,
  claim_number text,
  status text not null default 'draft' check (
    status in ('draft', 'submitted', 'pending', 'approved', 'partially_approved', 'denied', 'resubmitted', 'paid', 'written_off')
  ),
  billed_amount_cents integer not null check (billed_amount_cents >= 0),
  approved_amount_cents integer,
  paid_amount_cents integer,
  denial_reason text,
  denial_code text,
  submitted_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists currency_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency text not null default 'usd',
  target_currency text not null,
  rate numeric(20, 8) not null,
  date date not null,
  created_at timestamptz not null default now(),
  unique (base_currency, target_currency, date)
);

create index if not exists idx_stripe_customers_org_created
  on stripe_customers(organization_id, created_at desc);
create index if not exists idx_transactions_org_created
  on transactions(organization_id, created_at desc);
create index if not exists idx_transactions_invoice
  on transactions(invoice_id);
create index if not exists idx_transactions_booking
  on transactions(booking_id);
create index if not exists idx_transactions_status_method
  on transactions(organization_id, status, payment_method);
create index if not exists idx_subscription_plans_org_active
  on subscription_plans(organization_id, is_active);
create index if not exists idx_subscriptions_org_status
  on subscriptions(organization_id, status);
create index if not exists idx_claims_org_status
  on insurance_claims(organization_id, status);
create index if not exists idx_currency_rates_lookup
  on currency_rates(base_currency, target_currency, date desc);
