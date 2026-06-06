-- =====================================================================================
-- KORA DATABASE REPAIR SCRIPT
-- =====================================================================================
-- Purpose: Fix RLS, policies, and missing components in existing database
-- Safe to run multiple times (uses IF NOT EXISTS checks)
-- =====================================================================================

BEGIN;

-- =====================================================================================
-- STEP 1: ENSURE HELPER FUNCTION EXISTS
-- =====================================================================================

CREATE OR REPLACE FUNCTION kora_current_tenant_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT tenant_id
  FROM   entity_graph
  WHERE  auth_user_id = auth.uid()
  LIMIT  1;
$$;

GRANT EXECUTE ON FUNCTION kora_current_tenant_id() TO authenticated;

-- =====================================================================================
-- STEP 2: ENABLE RLS ON ALL TENANT-SCOPED TABLES (MIGRATION 001)
-- =====================================================================================

-- Foundation tables
ALTER TABLE IF EXISTS tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entity_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_subscriptions ENABLE ROW LEVEL SECURITY;

-- Financial tables
ALTER TABLE IF EXISTS wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ledger_entries ENABLE ROW LEVEL SECURITY;

-- AI tables
ALTER TABLE IF EXISTS ai_orchestrator ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_actions ENABLE ROW LEVEL SECURITY;

-- Billing tables
ALTER TABLE IF EXISTS tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usage_metering ENABLE ROW LEVEL SECURITY;

-- Governance tables
ALTER TABLE IF EXISTS audit_control_plane ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS compliance_rules ENABLE ROW LEVEL SECURITY;

-- Franchise tables
ALTER TABLE IF EXISTS franchise_tree ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS revenue_share_rules ENABLE ROW LEVEL SECURITY;

-- Business domain tables
ALTER TABLE IF EXISTS services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- STEP 3: ENABLE RLS ON MDM TABLES (MIGRATION 003)
-- =====================================================================================

ALTER TABLE IF EXISTS addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_members ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- STEP 4: CREATE MISSING RLS POLICIES (DROP EXISTING FIRST TO AVOID CONFLICTS)
-- =====================================================================================

-- MIGRATION 001 POLICIES
-- ---------------------

-- tenants
DROP POLICY IF EXISTS policy_tenants_isolation ON tenants;
CREATE POLICY policy_tenants_isolation ON tenants
  FOR ALL TO authenticated
  USING (id = kora_current_tenant_id());

-- entity_graph (special: uses subquery to avoid circular reference)
DROP POLICY IF EXISTS policy_entity_graph_isolation ON entity_graph;
CREATE POLICY policy_entity_graph_isolation ON entity_graph
  FOR ALL TO authenticated
  USING (
    tenant_id = (
      SELECT eg.tenant_id FROM entity_graph eg
      WHERE  eg.auth_user_id = auth.uid()
      LIMIT  1
    )
  );

-- entity_relationships
DROP POLICY IF EXISTS policy_entity_relationships_isolation ON entity_relationships;
CREATE POLICY policy_entity_relationships_isolation ON entity_relationships
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- event_stream
DROP POLICY IF EXISTS policy_event_stream_isolation ON event_stream;
CREATE POLICY policy_event_stream_isolation ON event_stream
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- event_subscriptions
DROP POLICY IF EXISTS policy_event_subscriptions_isolation ON event_subscriptions;
CREATE POLICY policy_event_subscriptions_isolation ON event_subscriptions
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- wallets
DROP POLICY IF EXISTS policy_wallets_isolation ON wallets;
CREATE POLICY policy_wallets_isolation ON wallets
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- ledger_entries
DROP POLICY IF EXISTS policy_ledger_entries_isolation ON ledger_entries;
CREATE POLICY policy_ledger_entries_isolation ON ledger_entries
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- ai_orchestrator
DROP POLICY IF EXISTS policy_ai_orchestrator_isolation ON ai_orchestrator;
CREATE POLICY policy_ai_orchestrator_isolation ON ai_orchestrator
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- ai_actions
DROP POLICY IF EXISTS policy_ai_actions_isolation ON ai_actions;
CREATE POLICY policy_ai_actions_isolation ON ai_actions
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- tenant_subscriptions
DROP POLICY IF EXISTS policy_tenant_subscriptions_isolation ON tenant_subscriptions;
CREATE POLICY policy_tenant_subscriptions_isolation ON tenant_subscriptions
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- usage_metering
DROP POLICY IF EXISTS policy_usage_metering_isolation ON usage_metering;
CREATE POLICY policy_usage_metering_isolation ON usage_metering
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- audit_control_plane
DROP POLICY IF EXISTS policy_audit_control_plane_isolation ON audit_control_plane;
CREATE POLICY policy_audit_control_plane_isolation ON audit_control_plane
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- compliance_rules
DROP POLICY IF EXISTS policy_compliance_rules_isolation ON compliance_rules;
CREATE POLICY policy_compliance_rules_isolation ON compliance_rules
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- franchise_tree
DROP POLICY IF EXISTS policy_franchise_tree_isolation ON franchise_tree;
CREATE POLICY policy_franchise_tree_isolation ON franchise_tree
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- revenue_share_rules
DROP POLICY IF EXISTS policy_revenue_share_rules_isolation ON revenue_share_rules;
CREATE POLICY policy_revenue_share_rules_isolation ON revenue_share_rules
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- services
DROP POLICY IF EXISTS policy_services_isolation ON services;
CREATE POLICY policy_services_isolation ON services
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- products
DROP POLICY IF EXISTS policy_products_isolation ON products;
CREATE POLICY policy_products_isolation ON products
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- business_profiles
DROP POLICY IF EXISTS policy_business_profiles_isolation ON business_profiles;
CREATE POLICY policy_business_profiles_isolation ON business_profiles
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- bookings
DROP POLICY IF EXISTS policy_bookings_isolation ON bookings;
CREATE POLICY policy_bookings_isolation ON bookings
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- MIGRATION 003 POLICIES
-- ----------------------

-- addresses
DROP POLICY IF EXISTS policy_addresses_isolation ON addresses;
CREATE POLICY policy_addresses_isolation ON addresses
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- contacts
DROP POLICY IF EXISTS policy_contacts_isolation ON contacts;
CREATE POLICY policy_contacts_isolation ON contacts
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- persons
DROP POLICY IF EXISTS policy_persons_isolation ON persons;
CREATE POLICY policy_persons_isolation ON persons
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- organizations
DROP POLICY IF EXISTS policy_organizations_isolation ON organizations;
CREATE POLICY policy_organizations_isolation ON organizations
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- branches
DROP POLICY IF EXISTS policy_branches_isolation ON branches;
CREATE POLICY policy_branches_isolation ON branches
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- departments
DROP POLICY IF EXISTS policy_departments_isolation ON departments;
CREATE POLICY policy_departments_isolation ON departments
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- teams
DROP POLICY IF EXISTS policy_teams_isolation ON teams;
CREATE POLICY policy_teams_isolation ON teams
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- team_members
DROP POLICY IF EXISTS policy_team_members_isolation ON team_members;
CREATE POLICY policy_team_members_isolation ON team_members
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- STEP 5: VERIFICATION QUERIES
-- =====================================================================================

-- Check helper function exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'kora_current_tenant_id') THEN
    RAISE EXCEPTION 'REPAIR FAILED: Helper function kora_current_tenant_id() does not exist';
  END IF;
  RAISE NOTICE 'SUCCESS: Helper function kora_current_tenant_id() exists';
END $$;

-- Count tables with RLS enabled
DO $$
DECLARE
  rls_count INT;
  total_count INT;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname IN (
      'tenants', 'entity_graph', 'entity_relationships',
      'event_stream', 'event_subscriptions',
      'wallets', 'ledger_entries',
      'ai_orchestrator', 'ai_actions',
      'tenant_subscriptions', 'usage_metering',
      'audit_control_plane', 'compliance_rules',
      'franchise_tree', 'revenue_share_rules',
      'services', 'products', 'business_profiles', 'bookings',
      'addresses', 'contacts', 'persons', 'organizations',
      'branches', 'departments', 'teams', 'team_members'
    );

  SELECT COUNT(*) INTO rls_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true
    AND c.relname IN (
      'tenants', 'entity_graph', 'entity_relationships',
      'event_stream', 'event_subscriptions',
      'wallets', 'ledger_entries',
      'ai_orchestrator', 'ai_actions',
      'tenant_subscriptions', 'usage_metering',
      'audit_control_plane', 'compliance_rules',
      'franchise_tree', 'revenue_share_rules',
      'services', 'products', 'business_profiles', 'bookings',
      'addresses', 'contacts', 'persons', 'organizations',
      'branches', 'departments', 'teams', 'team_members'
    );

  RAISE NOTICE 'RLS STATUS: % out of % expected tables have RLS enabled', rls_count, total_count;
  
  IF rls_count < total_count THEN
    RAISE WARNING 'Some tables still missing RLS. Check which tables exist in your database.';
  END IF;
END $$;

COMMIT;

-- =====================================================================================
-- POST-REPAIR VERIFICATION (Run this separately after REPAIR completes)
-- =====================================================================================
/*

-- 1. Check helper function
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'kora_current_tenant_id';

-- 2. Check all tables and their RLS status
SELECT 
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  COUNT(pol.polname) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy pol ON pol.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'tenants', 'entity_graph', 'entity_relationships',
    'event_stream', 'event_subscriptions',
    'wallets', 'ledger_entries',
    'ai_orchestrator', 'ai_actions',
    'tenant_subscriptions', 'usage_metering',
    'audit_control_plane', 'compliance_rules',
    'franchise_tree', 'revenue_share_rules',
    'services', 'products', 'business_profiles', 'bookings',
    'addresses', 'contacts', 'persons', 'organizations',
    'branches', 'departments', 'teams', 'team_members'
  )
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;

-- 3. List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

*/
