-- Kora SBOS Workspace SQL Database Migration Schema
-- Target: PostgreSQL 14+ (High-Performance Polymorphic Blueprint)
-- Sets up the Unified double-helix architecture supporting both Selfcare & DigiCare tenants.

BEGIN;

-- Enable UUID extension for robust distributed keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS DEFINITION
CREATE TYPE kora_vertical AS ENUM ('selfcare', 'digicare');
CREATE TYPE kora_merchant_status AS ENUM ('pending_kyc', 'active', 'suspended');
CREATE TYPE kora_appointment_channel AS ENUM ('in_person', 'video', 'audio', 'walk_in', 'home_visit');
CREATE TYPE kora_appointment_status AS ENUM ('pending', 'approved', 'completed', 'cancelled');
CREATE TYPE kora_dispatch_status AS ENUM ('Dispatched', 'En Route', 'On Site', 'Completed');
CREATE TYPE kora_user_role AS ENUM ('superadmin', 'merchant_owner', 'specialist_staff', 'client');

-- 2. CORE ENGINES: MERCHANTS (The Common Root)
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    vertical kora_vertical NOT NULL,
    status kora_merchant_status NOT NULL DEFAULT 'pending_kyc',
    wallet_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. EXTENSIBLE METADATA (Polymorphic Profile)
CREATE TABLE IF NOT EXISTS merchant_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE UNIQUE,
    bio_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- bio_data stores:
    --   Selfcare: { "gallery_urls": [...], "instagram_handle": "@..." }
    --   DigiCare: { "license_verification_number": "...", "practice_permit_url": "...", "specialty": "..." }
    amenities VARCHAR(100)[] DEFAULT ARRAY[]::VARCHAR[],
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. IDENTITY PLATFORM: USERS & RBAC MATRICES
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role kora_user_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dual-link table to associate staff with their merchant tenant nodes
CREATE TABLE IF NOT EXISTS merchant_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_title VARCHAR(100) NOT NULL, -- e.g. 'Senior Barber', 'Consultant Gynecologist'
    on_duty BOOLEAN DEFAULT true,
    payout_basis VARCHAR(50) DEFAULT 'commission', -- 'commission' or 'hourly_salary'
    basis_value NUMERIC(10, 2) DEFAULT 0.00, -- percentage or flat naira hourly rate
    UNIQUE(merchant_id, user_id)
);

-- 5. THE UNIFIED CATALOG: SERVICES & PRODUCTS
CREATE TABLE IF NOT EXISTS services_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL, -- in NGN or stable values
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    channel kora_appointment_channel NOT NULL DEFAULT 'in_person',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS retail_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    safety_threshold INTEGER NOT NULL DEFAULT 10,
    emoji VARCHAR(20) DEFAULT '🧴',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(merchant_id, sku)
);

-- 6. APPOINTMENTS (Unified Service Bridge)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES merchant_staff(id) ON DELETE SET NULL,
    service_id UUID NOT NULL REFERENCES services_catalog(id) ON DELETE SET NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status kora_appointment_status NOT NULL DEFAULT 'pending',
    channel kora_appointment_channel NOT NULL DEFAULT 'in_person',
    price_paid NUMERIC(12, 2) NOT NULL,
    clinical_notes TEXT, -- Encrypted context. Decrypted only in authorized secure clinical contexts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. FIELD WORK FORCE DISPATCH
CREATE TABLE IF NOT EXISTS field_dispatches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES merchant_staff(id) ON DELETE SET NULL,
    dest_address TEXT NOT NULL,
    dest_lat NUMERIC(9, 6),
    dest_lon NUMERIC(9, 6),
    status kora_dispatch_status NOT NULL DEFAULT 'Dispatched',
    eta_minutes INTEGER NOT NULL DEFAULT 30,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 8. PROCUREMENT & SUPPLIER TRACKING
CREATE TABLE IF NOT EXISTS inventory_procurement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    product_id UUID REFERENCES retail_products(id) ON DELETE SET NULL,
    order_quantity INTEGER NOT NULL DEFAULT 50,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, dispatched, delivered
    ordered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. SPLIT-LEDGER ESCROWS & COMMISSIONS
CREATE TABLE IF NOT EXISTS split_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    gross_amount NUMERIC(15, 2) NOT NULL,
    platform_fee NUMERIC(15, 2) NOT NULL, -- 5% automation split
    net_payout NUMERIC(15, 2) NOT NULL, -- 95% settlement
    status VARCHAR(50) NOT NULL DEFAULT 'pending_payout', -- pending_payout, paid
    settled_at TIMESTAMP WITH TIME ZONE
);

-- 10. ROW-LEVEL SECURITY & PERFORMANCE OPTIMIZATION
-- Create indexes on hot columns for multi-tenant isolation
CREATE INDEX IF NOT EXISTS idx_merchants_vertical ON merchants (vertical);
CREATE INDEX IF NOT EXISTS idx_services_merchant ON services_catalog (merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_merchant ON retail_products (merchant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_merchant ON appointments (merchant_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_merchant ON field_dispatches (merchant_id);

-- Turn on Row Level Security for critical tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_products ENABLE ROW LEVEL SECURITY;

-- Dynamic tenant policy enforcing isolation context
-- Policy checks if current_setting('kora.current_tenant_id') equals the row's owner column.
CREATE POLICY tenant_appointment_isolation ON appointments
    FOR ALL
    USING (merchant_id::text = current_setting('kora.current_tenant_id', true));

CREATE POLICY tenant_product_isolation ON retail_products
    FOR ALL
    USING (merchant_id::text = current_setting('kora.current_tenant_id', true));

COMMIT;
