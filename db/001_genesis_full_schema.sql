-- =============================================================================
-- KORA UNIFIED MIGRATION: 001_genesis_full_schema
-- Source: KORA_UNIFIED_SOURCE_OF_TRUTH.md v2.0
-- Target: Supabase (PostgreSQL 15+)
-- Rules:
--   1. Zero data bleed — every tenant_id table has RLS + policy_<table>_isolation
--   2. Double-entry only — no mutable balance columns
--   3. UUID only — no serial/autoincrement
--   4. JSONB for all multilingual user-facing text
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- HELPER: resolves the calling user's tenant_id from entity_graph
-- Used by every RLS policy to avoid per-row subquery repetition overhead
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION kora_current_tenant_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT tenant_id
  FROM   entity_graph
  WHERE  auth_user_id = auth.uid()
  LIMIT  1;
$$;

-- =============================================================================
-- FOUNDATION (no tenant_id — no RLS required)
-- =============================================================================

-- global_currencies --------------------------------------------------------
CREATE TABLE IF NOT EXISTS global_currencies (
  code           VARCHAR(3)  PRIMARY KEY,
  name           VARCHAR(50) NOT NULL,
  symbol         VARCHAR(5)  NOT NULL,
  decimal_places INT         NOT NULL DEFAULT 2
);

INSERT INTO global_currencies (code, name, symbol, decimal_places) VALUES
  ('USD', 'US Dollar',        '$',  2),
  ('EUR', 'Euro',             '€',  2),
  ('GBP', 'British Pound',    '£',  2),
  ('NGN', 'Nigerian Naira',   '₦',  2),
  ('GHS', 'Ghanaian Cedi',    '₵',  2),
  ('KES', 'Kenyan Shilling',  'KSh',2),
  ('ZAR', 'South African Rand','R', 2),
  ('AED', 'UAE Dirham',       'د.إ',2),
  ('INR', 'Indian Rupee',     '₹',  2),
  ('CNY', 'Chinese Yuan',     '¥',  2)
ON CONFLICT (code) DO NOTHING;

-- exchange_rates -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS exchange_rates (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency   VARCHAR(3)  NOT NULL REFERENCES global_currencies(code),
  target_currency VARCHAR(3)  NOT NULL REFERENCES global_currencies(code),
  rate            NUMERIC(18,6) NOT NULL,
  effective_date  TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_base     ON exchange_rates(base_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_eff_date ON exchange_rates(effective_date);

-- billing_plans (global — not per-tenant, no RLS) -------------------------
CREATE TABLE IF NOT EXISTS billing_plans (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(50)  UNIQUE NOT NULL,  -- BASIC|ESSENTIAL|PROFESSIONAL|ENTERPRISE
  max_users      INT,
  storage_mb     INT,
  ai_tokens_mo   BIGINT,
  price_monthly  NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_annual   NUMERIC(10,2) NOT NULL DEFAULT 0,
  features       JSONB        NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO billing_plans (name, max_users, storage_mb, ai_tokens_mo, price_monthly, price_annual, features) VALUES
  ('BASIC',        1,   512,        5000,       0,      0,      '{"marketplace":true,"booking":true,"pos":true}'::jsonb),
  ('ESSENTIAL',    5,   10240,      100000,     29,     290,    '{"marketplace":true,"booking":true,"pos":true,"crm":"full","hrm":"basic","inventory":"light"}'::jsonb),
  ('PROFESSIONAL', 50,  256000,     2000000,    99,     990,    '{"marketplace":true,"booking":true,"pos":true,"crm":"full","hrm":"advanced","inventory":"full","erp":true,"workflow":true,"industry_clouds":true}'::jsonb),
  ('ENTERPRISE',   NULL,5242880,    50000000,   499,    4990,   '{"marketplace":true,"booking":true,"pos":true,"crm":"full","hrm":"full","inventory":"warehouse","erp":true,"workflow":true,"industry_clouds":true,"franchise":true,"blockchain_audit":true,"white_label":true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- LAYER A — TENANCY
-- =============================================================================

CREATE TABLE IF NOT EXISTS tenants (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  tenant_code   VARCHAR(100) UNIQUE NOT NULL,
  domain        VARCHAR(255),
  base_currency VARCHAR(3)   REFERENCES global_currencies(code) DEFAULT 'USD',
  plan_id       UUID         REFERENCES billing_plans(id),
  industry      VARCHAR(100),          -- HEALTHCARE|BEAUTY|LOGISTICS|EDUCATION|RETAIL|FINANCE
  region        VARCHAR(50),           -- NG|EU|US|GCC (drives compliance routing)
  tier          VARCHAR(20)  NOT NULL DEFAULT 'BASIC',   -- BASIC|ESSENTIAL|PROFESSIONAL|ENTERPRISE
  status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE|SUSPENDED|FROZEN
  metadata      JSONB        NOT NULL DEFAULT '{}',
  settings      JSONB        NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_tenants_isolation ON tenants
  FOR ALL
  USING (id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_tenants_tier   ON tenants(tier);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- =============================================================================
-- LAYER B — IDENTITY & ENTITY GRAPH
-- =============================================================================

CREATE TABLE IF NOT EXISTS entity_graph (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID         REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id    UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type  VARCHAR(50)  NOT NULL,  -- BUSINESS_OWNER|CONSUMER|STAFF|AI_AGENT|DEVICE
  did          VARCHAR(255) UNIQUE,    -- Decentralized Identity
  first_name   VARCHAR(100),
  last_name    VARCHAR(100),
  email        VARCHAR(255),
  phone        VARCHAR(50),
  timezone     VARCHAR(50)  NOT NULL DEFAULT 'UTC',
  role         VARCHAR(50),            -- OWNER|MANAGER|STAFF|CONSUMER
  metadata     JSONB        NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE entity_graph ENABLE ROW LEVEL SECURITY;

-- NOTE: policy uses a direct column check to avoid circular self-reference
CREATE POLICY policy_entity_graph_isolation ON entity_graph
  FOR ALL
  USING (
    tenant_id = (
      SELECT eg.tenant_id FROM entity_graph eg
      WHERE  eg.auth_user_id = auth.uid()
      LIMIT  1
    )
  );

CREATE INDEX IF NOT EXISTS idx_entity_graph_tenant_id    ON entity_graph(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entity_graph_auth_user_id ON entity_graph(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_entity_graph_created_at   ON entity_graph(created_at);

-- entity_relationships -----------------------------------------------------
CREATE TABLE IF NOT EXISTS entity_relationships (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id     UUID        NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  child_id      UUID        NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  relationship  VARCHAR(50) NOT NULL,  -- FRANCHISE_PARENT|REPORTS_TO|OWNS
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE entity_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_entity_relationships_isolation ON entity_relationships
  FOR ALL
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_entity_relationships_tenant_id ON entity_relationships(tenant_id);

-- =============================================================================
-- LAYER C — EVENT-DRIVEN CORE
-- =============================================================================

CREATE TABLE IF NOT EXISTS event_stream (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type   VARCHAR(100) NOT NULL,   -- invoice.paid|appointment.booked|etc.
  entity_id    UUID,
  entity_type  VARCHAR(50),
  payload      JSONB        NOT NULL DEFAULT '{}',
  occurred_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE event_stream ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_event_stream_isolation ON event_stream
  FOR ALL
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_event_stream_tenant_id   ON event_stream(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_stream_event_type  ON event_stream(event_type);
CREATE INDEX IF NOT EXISTS idx_event_stream_occurred_at ON event_stream(occurred_at);

-- event_subscriptions ------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_subscriptions (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type  VARCHAR(100) NOT NULL,
  handler_url TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE event_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_event_subscriptions_isolation ON event_subscriptions
  FOR ALL
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_event_subscriptions_tenant_id ON event_subscriptions(tenant_id);

-- =============================================================================
-- LAYER E — FINANCIAL LEDGER (DOUBLE-ENTRY ONLY)
-- =============================================================================

-- wallets: account metadata — NO balance column ---------------------------
CREATE TABLE IF NOT EXISTS wallets (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_id    UUID        NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  account_code VARCHAR(50) NOT NULL,   -- REVENUE|ESCROW|PLATFORM_FEE|PAYROLL|TAX
  currency     VARCHAR(3)  REFERENCES global_currencies(code) DEFAULT 'USD',
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, entity_id, account_code)
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_wallets_isolation ON wallets
  FOR ALL
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_wallets_tenant_id ON wallets(tenant_id);

-- ledger_entries: the ONLY source of financial truth ----------------------
CREATE TABLE IF NOT EXISTS ledger_entries (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  debit_account  VARCHAR(50)  NOT NULL,   -- account_code being debited
  credit_account VARCHAR(50)  NOT NULL,   -- account_code being credited
  amount         NUMERIC(18,4) NOT NULL CHECK (amount > 0),
  currency       VARCHAR(3)   NOT NULL REFERENCES global_currencies(code),
  fx_rate        NUMERIC(18,6) NOT NULL DEFAULT 1.0,
  reference_type VARCHAR(50),             -- INVOICE|PAYROLL|REFUND|ESCROW_RELEASE|PLATFORM_FEE
  reference_id   UUID,
  description    TEXT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_ledger_entries_isolation ON ledger_entries
  FOR ALL
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_ledger_entries_tenant_id    ON ledger_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_created_at   ON ledger_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_reference_id ON ledger_entries(reference_id);

-- =============================================================================
-- LAYER H — AI ORCHESTRATION
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_orchestrator (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_name   VARCHAR(100) NOT NULL,
  agent_type   VARCHAR(50)  NOT NULL,   -- BOOKING|FINANCE|CRM|COMPLIANCE|DISPATCH
  model        VARCHAR(100) NOT NULL DEFAULT 'gemini-2.0-flash',
  system_prompt TEXT,
  memory       JSONB        NOT NULL DEFAULT '{}',
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE ai_orchestrator ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_ai_orchestrator_isolation ON ai_orchestrator
  FOR ALL
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_ai_orchestrator_tenant_id ON ai_orchestrator(tenant_id);

-- ai_actions ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_actions (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id    UUID         NOT NULL REFERENCES ai_orchestrator(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,   -- BOOK_APPOINTMENT|SEND_MESSAGE|CREATE_INVOICE
  payload     JSONB        NOT NULL DEFAULT '{}',
  status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING',  -- PENDING|EXECUTED|FAILED
  executed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE ai_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_ai_actions_isolation ON ai_actions
  FOR ALL
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_ai_actions_tenant_id  ON ai_actions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_actions_created_at ON ai_actions(created_at);

-- =============================================================================
-- LAYER I — MONETIZATION ENGINE
-- =============================================================================

-- tenant_subscriptions -----------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id    UUID        NOT NULL REFERENCES billing_plans(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_tenant_subscriptions_isolation ON tenant_subscriptions
  FOR ALL
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id);

-- usage_metering -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_metering (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric       VARCHAR(50) NOT NULL,   -- AI_TOKENS|API_CALLS|STORAGE_MB
  quantity     BIGINT      NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE usage_metering ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_usage_metering_isolation ON usage_metering
  FOR ALL
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_usage_metering_tenant_id  ON usage_metering(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_metering_created_at ON usage_metering(created_at);

-- =============================================================================
-- LAYER J — GOVERNANCE & CONTROL
-- =============================================================================

-- audit_control_plane: immutable, hash-chained ----------------------------
CREATE TABLE IF NOT EXISTS audit_control_plane (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id         UUID         REFERENCES entity_graph(id),
  action           VARCHAR(100) NOT NULL,
  resource_type    VARCHAR(50),
  resource_id      UUID,
  diff             JSONB,
  ip_address       INET,
  blockchain_hash  VARCHAR(255),
  occurred_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE audit_control_plane ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_audit_control_plane_isolation ON audit_control_plane
  FOR ALL
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_audit_control_plane_tenant_id   ON audit_control_plane(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_control_plane_occurred_at ON audit_control_plane(occurred_at);

-- compliance_rules ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS compliance_rules (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  framework  VARCHAR(50)  NOT NULL,  -- GDPR|HIPAA|PCI_DSS|NDPR
  rule_key   VARCHAR(100) NOT NULL,
  rule_value JSONB        NOT NULL DEFAULT '{}',
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_compliance_rules_isolation ON compliance_rules
  FOR ALL
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_compliance_rules_tenant_id ON compliance_rules(tenant_id);

-- =============================================================================
-- LAYER K — FRANCHISE & HIERARCHY
-- =============================================================================

CREATE TABLE IF NOT EXISTS franchise_tree (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_tenant_id UUID        REFERENCES tenants(id),
  name             JSONB       NOT NULL DEFAULT '{}',  -- multilingual
  level            INT         NOT NULL DEFAULT 0,     -- 0=HQ, 1=Region, 2=Branch
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE franchise_tree ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_franchise_tree_isolation ON franchise_tree
  FOR ALL
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_franchise_tree_tenant_id ON franchise_tree(tenant_id);

-- revenue_share_rules ------------------------------------------------------
CREATE TABLE IF NOT EXISTS revenue_share_rules (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  franchise_id     UUID         NOT NULL REFERENCES franchise_tree(id) ON DELETE CASCADE,
  share_percentage NUMERIC(5,2) NOT NULL CHECK (share_percentage BETWEEN 0 AND 100),
  rule_type        VARCHAR(50)  NOT NULL,  -- ROYALTY|MARKETING_FUND|TECH_FEE
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE revenue_share_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_revenue_share_rules_isolation ON revenue_share_rules
  FOR ALL
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_revenue_share_rules_tenant_id ON revenue_share_rules(tenant_id);

-- =============================================================================
-- BUSINESS DOMAIN TABLES (Services, Products, Bookings, Profiles)
-- =============================================================================

-- services -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name             JSONB        NOT NULL DEFAULT '{}',  -- {"en":"Haircut","fr":"Coupe"}
  description      JSONB        NOT NULL DEFAULT '{}',
  price            NUMERIC(18,2) NOT NULL,
  currency         VARCHAR(3)   REFERENCES global_currencies(code) DEFAULT 'USD',
  duration_minutes INT          NOT NULL DEFAULT 30,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_services_isolation ON services
  FOR ALL
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_services_tenant_id  ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at);

-- products -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        JSONB        NOT NULL DEFAULT '{}',
  description JSONB        NOT NULL DEFAULT '{}',
  sku         VARCHAR(100),
  price       NUMERIC(18,2) NOT NULL,
  currency    VARCHAR(3)   REFERENCES global_currencies(code) DEFAULT 'USD',
  stock_qty   INT          NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_products_isolation ON products
  FOR ALL
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_products_tenant_id  ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- business_profiles --------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_profiles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_id   UUID        NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  bio         JSONB       NOT NULL DEFAULT '{}',   -- multilingual
  address     JSONB       NOT NULL DEFAULT '{}',   -- structured address
  gallery_urls TEXT[]     NOT NULL DEFAULT ARRAY[]::TEXT[],
  social_links JSONB      NOT NULL DEFAULT '{}',
  verified    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_business_profiles_isolation ON business_profiles
  FOR ALL
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_business_profiles_tenant_id ON business_profiles(tenant_id);

-- bookings -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id    UUID         NOT NULL REFERENCES entity_graph(id),
  provider_id  UUID         NOT NULL REFERENCES entity_graph(id),
  service_id   UUID         NOT NULL REFERENCES services(id),
  scheduled_at TIMESTAMPTZ  NOT NULL,
  channel      VARCHAR(50)  NOT NULL DEFAULT 'IN_PERSON',  -- IN_PERSON|VIDEO|AUDIO|HOME_VISIT
  status       VARCHAR(30)  NOT NULL DEFAULT 'PENDING',    -- PENDING|CONFIRMED|COMPLETED|CANCELLED
  price_agreed NUMERIC(18,2) NOT NULL,
  currency     VARCHAR(3)   REFERENCES global_currencies(code) DEFAULT 'USD',
  notes        TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_bookings_isolation ON bookings
  FOR ALL
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id    ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at   ON bookings(created_at);

-- =============================================================================
-- GRANT HELPER FUNCTION TO AUTHENTICATED ROLE (Supabase standard)
-- =============================================================================
GRANT EXECUTE ON FUNCTION kora_current_tenant_id() TO authenticated;

-- =============================================================================
-- VERIFICATION QUERY (run after migration to confirm RLS state)
-- =============================================================================
-- SELECT tablename, rowsecurity
-- FROM   pg_tables
-- WHERE  schemaname = 'public'
--   AND  tablename IN (
--     'tenants','entity_graph','entity_relationships',
--     'event_stream','event_subscriptions',
--     'wallets','ledger_entries',
--     'ai_orchestrator','ai_actions',
--     'tenant_subscriptions','usage_metering',
--     'audit_control_plane','compliance_rules',
--     'franchise_tree','revenue_share_rules',
--     'services','products','business_profiles','bookings'
--   )
-- ORDER BY tablename;
-- Expected: rowsecurity = true for ALL rows above.

COMMIT;
