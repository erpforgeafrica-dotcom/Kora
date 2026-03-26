-- 015_emergency_full.sql
-- Emergency: requests, dispatch units, incident reports, response times

create table if not exists emergency_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  customer_id uuid references clients(id),
  request_type text not null,
  location_lat numeric(10,8),
  location_lng numeric(11,8),
  address text,
  severity text default 'high' check (severity in ('critical','high','medium','low')),
  caller_name text,
  caller_phone text,
  status text default 'open' check (status in ('open','dispatched','en_route','on_scene','resolved','cancelled')),
  assigned_unit_id uuid,
  response_time_seconds int,
  notes text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create table if not exists dispatch_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  unit_name text not null,
  unit_type text,
  staff_id uuid references staff_members(id),
  vehicle_id uuid,
  current_lat numeric(10,8),
  current_lng numeric(11,8),
  status text default 'available',
  last_updated timestamptz default now()
);

create table if not exists incident_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  emergency_request_id uuid references emergency_requests(id),
  report_type text,
  description text,
  actions_taken text,
  outcome text,
  reported_by uuid references staff_members(id),
  created_at timestamptz default now()
);

create table if not exists response_times (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  emergency_request_id uuid references emergency_requests(id),
  dispatch_unit_id uuid references dispatch_units(id),
  dispatched_at timestamptz,
  arrived_at timestamptz,
  resolved_at timestamptz,
  response_seconds int generated always as (extract(epoch from (arrived_at - dispatched_at))::int) stored
);
