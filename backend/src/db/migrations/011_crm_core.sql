-- Migration 011: CRM Core
-- Creates customers, leads, opportunities tables

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  gender TEXT,
  dob DATE,
  loyalty_tier_id UUID,
  loyalty_points INT DEFAULT 0,
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  visit_count INT DEFAULT 0,
  no_show_count INT DEFAULT 0,
  last_visit_date DATE,
  avg_spend DECIMAL(10,2) DEFAULT 0,
  risk_score DECIMAL(4,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  sms_opt_in BOOLEAN DEFAULT true,
  email_opt_in BOOLEAN DEFAULT true,
  push_opt_in BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extend existing clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(12,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS visit_count INT DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS no_show_count INT DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_visit_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avg_spend DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS risk_score DECIMAL(4,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'home',
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_default BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS customer_preferences (
  customer_id UUID PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  preferred_staff_ids UUID[],
  preferred_service_ids UUID[],
  preferred_time_of_day TEXT,
  marketing_opt_in BOOLEAN DEFAULT true,
  preferred_language TEXT DEFAULT 'en',
  allergies TEXT[],
  contraindications TEXT[],
  insurance_provider TEXT
);

CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES clients(id),
  organization_id UUID REFERENCES organizations(id),
  staff_id UUID REFERENCES staff_members(id),
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT,
  interest TEXT,
  location TEXT,
  budget_range TEXT,
  preferred_date DATE,
  status TEXT DEFAULT 'new',
  score INT DEFAULT 0,
  assigned_staff UUID REFERENCES staff_members(id),
  converted_customer_id UUID REFERENCES clients(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  interaction_type TEXT,
  notes TEXT,
  staff_id UUID REFERENCES staff_members(id),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  lead_id UUID REFERENCES leads(id),
  customer_id UUID REFERENCES clients(id),
  title TEXT,
  service_package TEXT,
  estimated_value DECIMAL(12,2),
  probability INT DEFAULT 50,
  expected_close_date DATE,
  stage TEXT DEFAULT 'consultation',
  assigned_staff UUID REFERENCES staff_members(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunity_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  activity_type TEXT,
  notes TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id)
);