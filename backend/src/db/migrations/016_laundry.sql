-- 016_laundry.sql
-- Laundry orders with logistics lifecycle

create table if not exists laundry_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  customer_id uuid references clients(id),
  booking_id uuid references bookings(id),
  pickup_address text not null,
  pickup_lat numeric(10,8),
  pickup_lng numeric(11,8),
  delivery_address text,
  pickup_time timestamptz,
  delivery_time timestamptz,
  weight_kg numeric(6,2),
  service_type text,
  item_count int,
  special_instructions text,
  price_cents int,
  status text default 'scheduled' check (status in ('scheduled','picked_up','processing','ready','out_for_delivery','delivered','cancelled')),
  assigned_driver uuid references staff_members(id),
  assigned_staff uuid references staff_members(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
