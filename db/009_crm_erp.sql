-- =====================================================================================
-- Migration 009: CRM ERP
-- =====================================================================================
-- Leads, Opportunities, Accounts, Contacts, Customer Notes, Interactions, Loyalty
-- =====================================================================================

-- =====================================================================================
-- CRM LEADS
-- =====================================================================================
CREATE TABLE crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  lead_number TEXT UNIQUE NOT NULL,
  
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  
  company_name TEXT,
  job_title TEXT,
  
  email TEXT,
  phone TEXT,
  
  lead_source VARCHAR(100) CHECK (lead_source IN (
    'website', 'referral', 'social_media', 'advertisement', 'event', 'cold_call', 'other'
  )),
  
  lead_status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (lead_status IN (
    'new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost'
  )),
  
  industry VARCHAR(100),
  
  estimated_value DECIMAL(15,2),
  
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  converted_to_account_id UUID,
  converted_at TIMESTAMPTZ,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_leads_tenant ON crm_leads(tenant_id);
CREATE INDEX idx_crm_leads_number ON crm_leads(lead_number);
CREATE INDEX idx_crm_leads_status ON crm_leads(lead_status);
CREATE INDEX idx_crm_leads_assigned ON crm_leads(assigned_to);
CREATE INDEX idx_crm_leads_email ON crm_leads(email);

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_crm_leads_isolation ON crm_leads
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- CRM OPPORTUNITIES
-- =====================================================================================
CREATE TABLE crm_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  opportunity_number TEXT UNIQUE NOT NULL,
  opportunity_name TEXT NOT NULL,
  
  account_id UUID, -- will reference crm_accounts
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  
  opportunity_value DECIMAL(15,2) NOT NULL,
  
  stage VARCHAR(50) NOT NULL DEFAULT 'prospecting' CHECK (stage IN (
    'prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
  )),
  
  probability DECIMAL(5,2) CHECK (probability >= 0 AND probability <= 100),
  
  expected_close_date DATE,
  actual_close_date DATE,
  
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  lost_reason TEXT,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_opportunities_tenant ON crm_opportunities(tenant_id);
CREATE INDEX idx_crm_opportunities_number ON crm_opportunities(opportunity_number);
CREATE INDEX idx_crm_opportunities_stage ON crm_opportunities(stage);
CREATE INDEX idx_crm_opportunities_assigned ON crm_opportunities(assigned_to);

ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_crm_opportunities_isolation ON crm_opportunities
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- CRM ACCOUNTS (CUSTOMERS)
-- =====================================================================================
CREATE TABLE crm_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  account_number TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  
  account_type VARCHAR(50) CHECK (account_type IN (
    'individual', 'business', 'government', 'ngo', 'other'
  )),
  
  industry VARCHAR(100),
  
  primary_email TEXT,
  primary_phone TEXT,
  website TEXT,
  
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  
  account_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (account_status IN (
    'active', 'inactive', 'suspended', 'closed'
  )),
  
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  
  account_manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  total_lifetime_value DECIMAL(15,2) DEFAULT 0,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_accounts_tenant ON crm_accounts(tenant_id);
CREATE INDEX idx_crm_accounts_number ON crm_accounts(account_number);
CREATE INDEX idx_crm_accounts_status ON crm_accounts(account_status);
CREATE INDEX idx_crm_accounts_manager ON crm_accounts(account_manager_id);

ALTER TABLE crm_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_crm_accounts_isolation ON crm_accounts
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- Add foreign key constraint for opportunities
ALTER TABLE crm_opportunities ADD CONSTRAINT fk_crm_opportunities_account 
  FOREIGN KEY (account_id) REFERENCES crm_accounts(id) ON DELETE SET NULL;

-- =====================================================================================
-- CRM CONTACTS
-- =====================================================================================
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  account_id UUID REFERENCES crm_accounts(id) ON DELETE CASCADE,
  
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  
  job_title TEXT,
  department TEXT,
  
  email TEXT,
  phone TEXT,
  mobile TEXT,
  
  is_primary BOOLEAN DEFAULT FALSE,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_contacts_tenant ON crm_contacts(tenant_id);
CREATE INDEX idx_crm_contacts_account ON crm_contacts(account_id);
CREATE INDEX idx_crm_contacts_email ON crm_contacts(email);

ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_crm_contacts_isolation ON crm_contacts
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- CUSTOMER NOTES
-- =====================================================================================
CREATE TABLE customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  account_id UUID REFERENCES crm_accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  
  note_type VARCHAR(50) CHECK (note_type IN (
    'general', 'meeting', 'call', 'email', 'issue', 'feedback', 'other'
  )),
  
  note TEXT NOT NULL,
  
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_notes_tenant ON customer_notes(tenant_id);
CREATE INDEX idx_customer_notes_account ON customer_notes(account_id);
CREATE INDEX idx_customer_notes_contact ON customer_notes(contact_id);

ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_customer_notes_isolation ON customer_notes
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- CUSTOMER INTERACTIONS
-- =====================================================================================
CREATE TABLE customer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  account_id UUID REFERENCES crm_accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN (
    'phone_call', 'email', 'meeting', 'chat', 'video_call', 'social_media', 'other'
  )),
  
  interaction_date TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INTEGER,
  
  subject TEXT,
  description TEXT,
  
  outcome VARCHAR(100),
  
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_interactions_tenant ON customer_interactions(tenant_id);
CREATE INDEX idx_customer_interactions_account ON customer_interactions(account_id);
CREATE INDEX idx_customer_interactions_date ON customer_interactions(interaction_date);
CREATE INDEX idx_customer_interactions_type ON customer_interactions(interaction_type);

ALTER TABLE customer_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_customer_interactions_isolation ON customer_interactions
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- LOYALTY ACCOUNTS
-- =====================================================================================
CREATE TABLE loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  account_id UUID NOT NULL REFERENCES crm_accounts(id) ON DELETE CASCADE,
  
  loyalty_number TEXT UNIQUE NOT NULL,
  
  points_balance INTEGER DEFAULT 0,
  
  tier_level VARCHAR(50) DEFAULT 'bronze' CHECK (tier_level IN (
    'bronze', 'silver', 'gold', 'platinum', 'diamond'
  )),
  
  member_since TIMESTAMPTZ DEFAULT NOW(),
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id)
);

CREATE INDEX idx_loyalty_accounts_tenant ON loyalty_accounts(tenant_id);
CREATE INDEX idx_loyalty_accounts_account ON loyalty_accounts(account_id);
CREATE INDEX idx_loyalty_accounts_number ON loyalty_accounts(loyalty_number);

ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_loyalty_accounts_isolation ON loyalty_accounts
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- LOYALTY TRANSACTIONS
-- =====================================================================================
CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  loyalty_account_id UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
  
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
    'earned', 'redeemed', 'expired', 'adjusted', 'bonus'
  )),
  
  points INTEGER NOT NULL,
  
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  
  reference_type VARCHAR(100), -- e.g., 'invoice', 'booking', 'referral'
  reference_id UUID,
  
  description TEXT,
  
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loyalty_transactions_tenant ON loyalty_transactions(tenant_id);
CREATE INDEX idx_loyalty_transactions_account ON loyalty_transactions(loyalty_account_id);
CREATE INDEX idx_loyalty_transactions_date ON loyalty_transactions(transaction_date);

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_loyalty_transactions_isolation ON loyalty_transactions
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- REFERRALS
-- =====================================================================================
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  referrer_account_id UUID NOT NULL REFERENCES crm_accounts(id) ON DELETE CASCADE,
  referred_account_id UUID REFERENCES crm_accounts(id) ON DELETE SET NULL,
  
  referral_code TEXT UNIQUE NOT NULL,
  
  referral_date TIMESTAMPTZ DEFAULT NOW(),
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'signed_up', 'qualified', 'rewarded', 'expired'
  )),
  
  reward_points INTEGER DEFAULT 0,
  reward_amount DECIMAL(15,2) DEFAULT 0,
  
  rewarded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referrals_tenant ON referrals(tenant_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_account_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_referrals_isolation ON referrals
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- END OF MIGRATION 009
-- =====================================================================================
