create table if not exists availability_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  staff_member_id uuid not null references staff_members(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (staff_member_id, day_of_week)
);

create table if not exists availability_overrides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  staff_member_id uuid not null references staff_members(id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  reason text,
  override_type text not null check (override_type in ('block', 'leave', 'training', 'emergency')),
  created_at timestamptz default now()
);

create table if not exists rooms_resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  type text not null check (type in ('room', 'chair', 'equipment', 'station')),
  capacity integer default 1,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  preferred_staff_member_id uuid references staff_members(id) on delete set null,
  preferred_date date,
  preferred_time_from time,
  preferred_time_to time,
  notified_at timestamptz,
  status text not null default 'waiting' check (status in ('waiting', 'notified', 'booked', 'expired')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table bookings
  add column if not exists room_id uuid references rooms_resources(id) on delete set null,
  add column if not exists checked_in_at timestamptz,
  add column if not exists source text check (source in ('web', 'app', 'walk_in', 'phone', 'waitlist')) default 'web',
  add column if not exists deposit_paid boolean default false,
  add column if not exists cancellation_reason text,
  add column if not exists confirmation_code text;

create unique index if not exists idx_bookings_confirmation_code
  on bookings(confirmation_code)
  where confirmation_code is not null;

create index if not exists idx_availability_rules_staff_day
  on availability_rules(staff_member_id, day_of_week)
  where is_active = true;

create index if not exists idx_availability_overrides_staff_date
  on availability_overrides(staff_member_id, date);

create index if not exists idx_rooms_resources_org_active
  on rooms_resources(organization_id, is_active);

create index if not exists idx_waitlist_org_status
  on waitlist(organization_id, status, created_at desc);

create index if not exists idx_waitlist_service_date
  on waitlist(service_id, preferred_date);

create index if not exists idx_bookings_staff_date
  on bookings(staff_member_id, start_time);

create index if not exists idx_bookings_client_status
  on bookings(client_id, status);
