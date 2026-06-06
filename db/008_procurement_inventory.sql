-- =====================================================================================
-- Migration 008: Procurement & Inventory ERP
-- =====================================================================================
-- Vendors, RFQ, Purchase Requests, Purchase Orders, Warehouses, Inventory, Stock
-- =====================================================================================

-- =====================================================================================
-- VENDORS / SUPPLIERS
-- =====================================================================================
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  vendor_code TEXT UNIQUE NOT NULL,
  vendor_name TEXT NOT NULL,
  
  vendor_type VARCHAR(50) CHECK (vendor_type IN ('goods', 'services', 'both')),
  
  registration_number TEXT,
  tax_number TEXT,
  
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  
  payment_terms VARCHAR(50), -- e.g., 'net_30', 'net_60', 'cod'
  credit_limit DECIMAL(15,2) DEFAULT 0,
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'suspended', 'blacklisted'
  )),
  
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendors_tenant ON vendors(tenant_id);
CREATE INDEX idx_vendors_code ON vendors(vendor_code);
CREATE INDEX idx_vendors_status ON vendors(status);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_vendors_isolation ON vendors
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- PURCHASE REQUESTS
-- =====================================================================================
CREATE TABLE purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  pr_number TEXT UNIQUE NOT NULL,
  pr_date DATE NOT NULL,
  
  requester_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  justification TEXT NOT NULL,
  required_by_date DATE,
  
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'converted_to_po', 'cancelled'
  )),
  
  total_amount DECIMAL(15,2) DEFAULT 0,
  
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_requests_tenant ON purchase_requests(tenant_id);
CREATE INDEX idx_purchase_requests_number ON purchase_requests(pr_number);
CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_purchase_requests_requester ON purchase_requests(requester_id);

ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_purchase_requests_isolation ON purchase_requests
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- PURCHASE REQUEST ITEMS
-- =====================================================================================
CREATE TABLE purchase_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  purchase_request_id UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  
  item_description TEXT NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  unit_of_measure VARCHAR(50),
  
  estimated_unit_price DECIMAL(15,2),
  estimated_total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * estimated_unit_price) STORED,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_request_items_tenant ON purchase_request_items(tenant_id);
CREATE INDEX idx_purchase_request_items_pr ON purchase_request_items(purchase_request_id);

ALTER TABLE purchase_request_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_purchase_request_items_isolation ON purchase_request_items
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- RFQ (REQUEST FOR QUOTATION)
-- =====================================================================================
CREATE TABLE rfq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  rfq_number TEXT UNIQUE NOT NULL,
  rfq_date DATE NOT NULL,
  
  purchase_request_id UUID REFERENCES purchase_requests(id) ON DELETE SET NULL,
  
  closing_date DATE,
  
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'responses_received', 'evaluated', 'awarded', 'cancelled'
  )),
  
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rfq_tenant ON rfq(tenant_id);
CREATE INDEX idx_rfq_number ON rfq(rfq_number);
CREATE INDEX idx_rfq_pr ON rfq(purchase_request_id);

ALTER TABLE rfq ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_rfq_isolation ON rfq
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- VENDOR QUOTES
-- =====================================================================================
CREATE TABLE vendor_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rfq_id UUID NOT NULL REFERENCES rfq(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  quote_date DATE NOT NULL,
  quote_reference TEXT,
  
  total_amount DECIMAL(15,2) NOT NULL,
  
  delivery_terms TEXT,
  payment_terms TEXT,
  validity_period INTEGER, -- days
  
  is_awarded BOOLEAN DEFAULT FALSE,
  awarded_at TIMESTAMPTZ,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_quotes_tenant ON vendor_quotes(tenant_id);
CREATE INDEX idx_vendor_quotes_rfq ON vendor_quotes(rfq_id);
CREATE INDEX idx_vendor_quotes_vendor ON vendor_quotes(vendor_id);

ALTER TABLE vendor_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_vendor_quotes_isolation ON vendor_quotes
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- PURCHASE ORDERS
-- =====================================================================================
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  po_number TEXT UNIQUE NOT NULL,
  po_date DATE NOT NULL,
  
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  purchase_request_id UUID REFERENCES purchase_requests(id) ON DELETE SET NULL,
  
  delivery_date DATE,
  delivery_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  
  payment_terms TEXT,
  delivery_terms TEXT,
  
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_approval', 'approved', 'sent_to_vendor', 'partially_received', 'fully_received', 'cancelled'
  )),
  
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_tenant ON purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_number ON purchase_orders(po_number);
CREATE INDEX idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_purchase_orders_isolation ON purchase_orders
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- PURCHASE ORDER ITEMS
-- =====================================================================================
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  
  item_description TEXT NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  unit_of_measure VARCHAR(50),
  
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  quantity_received DECIMAL(15,3) DEFAULT 0,
  quantity_remaining DECIMAL(15,3) GENERATED ALWAYS AS (quantity - quantity_received) STORED,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_order_items_tenant ON purchase_order_items(tenant_id);
CREATE INDEX idx_purchase_order_items_po ON purchase_order_items(purchase_order_id);

ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_purchase_order_items_isolation ON purchase_order_items
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- GOODS RECEIVED NOTES (GRN)
-- =====================================================================================
CREATE TABLE goods_received_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  grn_number TEXT UNIQUE NOT NULL,
  grn_date DATE NOT NULL,
  
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  
  received_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goods_received_notes_tenant ON goods_received_notes(tenant_id);
CREATE INDEX idx_goods_received_notes_number ON goods_received_notes(grn_number);
CREATE INDEX idx_goods_received_notes_po ON goods_received_notes(purchase_order_id);

ALTER TABLE goods_received_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_goods_received_notes_isolation ON goods_received_notes
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- WAREHOUSES
-- =====================================================================================
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  warehouse_code TEXT UNIQUE NOT NULL,
  warehouse_name TEXT NOT NULL,
  
  warehouse_type VARCHAR(50) CHECK (warehouse_type IN ('main', 'branch', 'transit', 'cold_storage', 'other')),
  
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_warehouses_tenant ON warehouses(tenant_id);
CREATE INDEX idx_warehouses_code ON warehouses(warehouse_code);

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_warehouses_isolation ON warehouses
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- INVENTORY ITEMS
-- =====================================================================================
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  item_code TEXT UNIQUE NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  
  category VARCHAR(100),
  
  sku TEXT,
  barcode TEXT,
  
  unit_of_measure VARCHAR(50),
  
  reorder_level DECIMAL(15,3) DEFAULT 0,
  minimum_stock_level DECIMAL(15,3) DEFAULT 0,
  maximum_stock_level DECIMAL(15,3),
  
  unit_cost DECIMAL(15,2) DEFAULT 0,
  selling_price DECIMAL(15,2) DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_items_tenant ON inventory_items(tenant_id);
CREATE INDEX idx_inventory_items_code ON inventory_items(item_code);
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_items_barcode ON inventory_items(barcode);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_inventory_items_isolation ON inventory_items
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- STOCK MOVEMENTS
-- =====================================================================================
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  movement_date TIMESTAMPTZ DEFAULT NOW(),
  
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  
  movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN (
    'purchase', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 'return', 'damage', 'expiry'
  )),
  
  quantity DECIMAL(15,3) NOT NULL,
  
  -- Source Document
  reference_type VARCHAR(100), -- e.g., 'grn', 'invoice', 'transfer', 'adjustment'
  reference_id UUID,
  
  notes TEXT,
  
  performed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_tenant ON stock_movements(tenant_id);
CREATE INDEX idx_stock_movements_item ON stock_movements(inventory_item_id);
CREATE INDEX idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(movement_date);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_stock_movements_isolation ON stock_movements
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- INVENTORY BATCHES
-- =====================================================================================
CREATE TABLE inventory_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  
  batch_number TEXT NOT NULL,
  serial_number TEXT,
  
  manufacture_date DATE,
  expiry_date DATE,
  
  quantity DECIMAL(15,3) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(inventory_item_id, warehouse_id, batch_number)
);

CREATE INDEX idx_inventory_batches_tenant ON inventory_batches(tenant_id);
CREATE INDEX idx_inventory_batches_item ON inventory_batches(inventory_item_id);
CREATE INDEX idx_inventory_batches_expiry ON inventory_batches(expiry_date);

ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_inventory_batches_isolation ON inventory_batches
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- END OF MIGRATION 008
-- =====================================================================================
