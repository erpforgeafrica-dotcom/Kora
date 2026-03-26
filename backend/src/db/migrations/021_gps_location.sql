-- 021_gps_location.sql
-- Service zones and customer coordinates

create table if not exists service_zones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  name text not null,
  polygon_coords jsonb,
  service_types text[],
  is_active boolean default true
);

create table if not exists customer_coordinates (
  customer_id uuid primary key references clients(id),
  lat numeric(10,8),
  lng numeric(11,8),
  accuracy float,
  updated_at timestamptz default now()
);
