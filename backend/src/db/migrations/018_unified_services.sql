-- 018_unified_services.sql
-- Unified service extensions across vehicle/equipment/inventory

create table if not exists service_vehicles (
  service_id uuid references services(id) on delete cascade,
  vehicle_id uuid not null,
  primary key (service_id, vehicle_id)
);

create table if not exists service_equipment (
  service_id uuid references services(id) on delete cascade,
  equipment_name text not null
);

create table if not exists service_inventory_requirements (
  service_id uuid references services(id) on delete cascade,
  product_id uuid references products(id),
  quantity_per_service numeric(8,2) default 1
);

alter table services
  add column if not exists service_type text default 'wellness',
  add column if not exists requires_vehicle boolean default false,
  add column if not exists requires_medical_record boolean default false,
  add column if not exists requires_inventory boolean default false;
