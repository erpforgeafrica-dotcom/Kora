-- 032_delivery.sql
-- Add Delivery Booking Center domain (multi-tenant)

create table if not exists delivery_agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  phone text,
  status text not null default 'active' check (status in ('active','inactive','off_duty')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_delivery_agents_org on delivery_agents(organization_id);

create table if not exists delivery_vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  plate text,
  vehicle_type text,
  capacity integer,
  status text not null default 'active' check (status in ('active','maintenance','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_delivery_vehicles_org on delivery_vehicles(organization_id);

create table if not exists delivery_zones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  geo jsonb,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_delivery_zones_org on delivery_zones(organization_id);

create table if not exists delivery_bookings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_name text,
  customer_phone text,
  pickup_address text not null,
  dropoff_address text not null,
  pickup_at timestamptz,
  dropoff_at timestamptz,
  price_cents integer,
  currency text not null default 'usd',
  status text not null default 'pending' check (status in ('pending','assigned','pickup_en_route','picked_up','in_transit','delivered','failed','canceled')),
  related_booking_id uuid, -- link to core bookings if applicable
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_delivery_bookings_org on delivery_bookings(organization_id);
create index if not exists idx_delivery_bookings_status on delivery_bookings(status);

create table if not exists delivery_stops (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  delivery_booking_id uuid not null references delivery_bookings(id) on delete cascade,
  sequence integer not null,
  stop_type text not null check (stop_type in ('pickup','dropoff')),
  address text not null,
  window_start timestamptz,
  window_end timestamptz,
  status text not null default 'pending',
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_delivery_stops_booking on delivery_stops(delivery_booking_id);
create index if not exists idx_delivery_stops_org on delivery_stops(organization_id);

create table if not exists delivery_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  delivery_booking_id uuid not null references delivery_bookings(id) on delete cascade,
  agent_id uuid references delivery_agents(id) on delete set null,
  vehicle_id uuid references delivery_vehicles(id) on delete set null,
  status text not null default 'assigned' check (status in ('assigned','accepted','rejected','in_progress','completed','canceled')),
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_delivery_assignments_org on delivery_assignments(organization_id);
create index if not exists idx_delivery_assignments_booking on delivery_assignments(delivery_booking_id);

create table if not exists delivery_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  delivery_booking_id uuid not null references delivery_bookings(id) on delete cascade,
  status text not null,
  occurred_at timestamptz not null default now(),
  notes text
);
create index if not exists idx_delivery_status_history_booking on delivery_status_history(delivery_booking_id);
create index if not exists idx_delivery_status_history_org on delivery_status_history(organization_id);

create table if not exists proof_of_delivery (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  delivery_booking_id uuid not null references delivery_bookings(id) on delete cascade,
  collected_by text,
  signature_url text,
  photo_url text,
  notes text,
  recorded_at timestamptz not null default now()
);
create index if not exists idx_pod_booking on proof_of_delivery(delivery_booking_id);

create table if not exists delivery_pricing_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  zone_id uuid references delivery_zones(id) on delete set null,
  base_fee_cents integer not null default 0,
  per_km_cents integer not null default 0,
  per_minute_cents integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_delivery_pricing_rules_org on delivery_pricing_rules(organization_id);
