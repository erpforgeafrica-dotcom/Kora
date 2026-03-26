create extension if not exists pgcrypto;

create table if not exists staff_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  clerk_user_id text unique,
  email text not null,
  full_name text not null,
  role text not null check (role in ('therapist', 'receptionist', 'manager', 'admin')),
  specializations text[] not null default '{}',
  availability jsonb not null default '{}'::jsonb,
  rating numeric(3,2) not null default 0,
  no_show_contribution_count integer not null default 0,
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  preferred_staff_id uuid references staff_members(id) on delete set null,
  loyalty_points integer not null default 0,
  membership_tier text not null default 'none' check (membership_tier in ('none', 'silver', 'gold', 'platinum')),
  telehealth_consent boolean not null default false,
  preferences jsonb not null default '{}'::jsonb,
  risk_score numeric(5,2),
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table if not exists service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  icon text,
  vertical text not null check (vertical in ('hair', 'spa', 'nails', 'barbers', 'medspa', 'fitness', 'wellness', 'other')),
  created_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  category_id uuid references service_categories(id) on delete set null,
  name text not null,
  description text,
  duration_minutes integer not null,
  price_cents integer not null,
  currency text not null default 'GBP',
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  type text not null check (type in ('earn', 'redeem', 'adjust')),
  points integer not null,
  balance_after integer not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table if exists bookings
  add column if not exists client_id uuid references clients(id) on delete set null,
  add column if not exists staff_member_id uuid references staff_members(id) on delete set null,
  add column if not exists service_id uuid references services(id) on delete set null,
  add column if not exists room text,
  add column if not exists notes text;

alter table if exists invoices
  add column if not exists client_id uuid references clients(id) on delete set null;

create index if not exists idx_staff_members_org_active
  on staff_members (organization_id, is_active, created_at desc);
create index if not exists idx_clients_org_created
  on clients (organization_id, created_at desc);
create index if not exists idx_clients_org_risk
  on clients (organization_id, risk_score desc nulls last);
create index if not exists idx_services_org_active
  on services (organization_id, is_active, created_at desc);
create index if not exists idx_loyalty_transactions_client_created
  on loyalty_transactions (client_id, created_at desc);
create index if not exists idx_bookings_org_staff_start
  on bookings (organization_id, staff_member_id, start_time desc);
create index if not exists idx_bookings_org_client_start
  on bookings (organization_id, client_id, start_time desc);
create index if not exists idx_invoices_org_client_status
  on invoices (organization_id, client_id, status, due_date);
