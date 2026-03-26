-- Migration 030: Canonical Inventory Domain (v2 rewrite for Phase 5)
-- NOTE: Migration 013 already created legacy inventory schema (products, stock_levels, etc)
-- This migration creates canonical v2 schema with improved structure
-- Both schemas coexist for now; Phase 6 will consolidate to single inventory system

-- Create new canonical inventory hierarchy 
create table if not exists inventory_categories_v2 (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_inventory_categories_v2_org on inventory_categories_v2(organization_id);

-- Canonical item definition (replaces products from 013)
create table if not exists inventory_items_v2 (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  category_id uuid references inventory_categories_v2(id) on delete set null,
  warehouse_id uuid references warehouses(id) on delete set null,
  sku text not null,
  name text not null,
  description text,
  uom text not null default 'unit',
  cost_price_cents integer,
  sell_price_cents integer,
  reorder_threshold integer not null default 0,
  track_batches boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, sku)
);
create index if not exists idx_inventory_items_v2_org on inventory_items_v2(organization_id);
create index if not exists idx_inventory_items_v2_category on inventory_items_v2(category_id);

-- Stock batch tracking (fine-grained lot/batch/expiry tracking)
create table if not exists stock_batches_v2 (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  item_id uuid not null references inventory_items_v2(id) on delete cascade,
  warehouse_id uuid references warehouses(id) on delete set null,
  lot_number text,
  expiry_date date,
  quantity integer not null default 0,
  reserved_quantity integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_stock_batches_v2_item on stock_batches_v2(item_id);
create index if not exists idx_stock_batches_v2_org on stock_batches_v2(organization_id);
create index if not exists idx_stock_batches_v2_warehouse on stock_batches_v2(warehouse_id);

-- Movement audit log for inventory_items_v2
create table if not exists inventory_movements_v2 (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  item_id uuid not null references inventory_items_v2(id) on delete cascade,
  warehouse_id uuid references warehouses(id) on delete set null,
  batch_id uuid references stock_batches_v2(id) on delete set null,
  movement_type text not null check (movement_type in ('in','out','adjust')),
  quantity integer not null,
  reference_type text,
  reference_id uuid,
  reason text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_inventory_movements_v2_item on inventory_movements_v2(item_id);
create index if not exists idx_inventory_movements_v2_org on inventory_movements_v2(organization_id);
create index if not exists idx_inventory_movements_v2_reference on inventory_movements_v2(reference_type, reference_id);

-- Reservation tracking for inventory_items_v2
create table if not exists inventory_reservations_v2 (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  item_id uuid not null references inventory_items_v2(id) on delete cascade,
  batch_id uuid references stock_batches_v2(id) on delete set null,
  quantity integer not null,
  status text not null default 'pending' check (status in ('pending','committed','released','canceled')),
  reference_type text not null,
  reference_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_inventory_reservations_v2_org on inventory_reservations_v2(organization_id);
create index if not exists idx_inventory_reservations_v2_ref on inventory_reservations_v2(reference_type, reference_id);

-- Supplier management (supplements legacy suppliers table from 013)
create table if not exists suppliers_v2 (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  contact jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_suppliers_v2_org on suppliers_v2(organization_id);

-- Purchase order management (replaces purchase_orders from 013 with better schema)
create table if not exists purchase_orders_v2 (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  supplier_id uuid references suppliers_v2(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','submitted','received','canceled')),
  expected_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_po_v2_org on purchase_orders_v2(organization_id);

-- Purchase order line items (links to inventory_items_v2)
create table if not exists purchase_order_lines_v2 (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  purchase_order_id uuid not null references purchase_orders_v2(id) on delete cascade,
  item_id uuid not null references inventory_items_v2(id) on delete cascade,
  quantity integer not null,
  cost_price_cents integer,
  received_quantity integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_pol_v2_org on purchase_order_lines_v2(organization_id);
create index if not exists idx_pol_v2_po on purchase_order_lines_v2(purchase_order_id);

-- Reorder rules for automatic purchase order generation
create table if not exists reorder_rules_v2 (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  item_id uuid not null references inventory_items_v2(id) on delete cascade,
  min_quantity integer not null default 0,
  reorder_quantity integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, item_id)
);
create index if not exists idx_reorder_rules_v2_org on reorder_rules_v2(organization_id);

-- Helper view: low-stock items alert
create or replace view inventory_low_stock_v2 as
select
  i.organization_id,
  i.id as item_id,
  i.name,
  coalesce(sum(sb.quantity - sb.reserved_quantity), 0) as available_quantity,
  i.reorder_threshold
from inventory_items_v2 i
left join stock_batches_v2 sb on sb.item_id = i.id
group by i.organization_id, i.id, i.name, i.reorder_threshold
having coalesce(sum(sb.quantity - sb.reserved_quantity), 0) <= i.reorder_threshold;

-- End Migration 030: Canonical Inventory v2
