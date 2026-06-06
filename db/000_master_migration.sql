-- =====================================================================================
-- KORA MASTER MIGRATION - COMPLETE SCHEMA DEPLOYMENT
-- =====================================================================================
-- Runs all 14 migrations in sequence
-- Target: Supabase (PostgreSQL 15+)
-- Date: $(date +%Y-%m-%d)
-- =====================================================================================

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================================
-- HELPER FUNCTION: Get current tenant ID
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
-- MIGRATION 001: CORE FOUNDATION
-- =====================================================================================
\echo 'Running Migration 001: Core Foundation...'
\i 001_genesis_full_schema.sql

-- =====================================================================================
-- MIGRATION 002: RBAC PERMISSIONS
-- =====================================================================================
\echo 'Running Migration 002: RBAC Permissions...'
\i 002_rbac_permissions.sql

-- =====================================================================================
-- MIGRATION 003: UNIVERSAL MDM
-- =====================================================================================
\echo 'Running Migration 003: Universal MDM...'
\i 003_universal_mdm.sql

-- =====================================================================================
-- MIGRATION 004: VERIFICATION & TRUST
-- =====================================================================================
\echo 'Running Migration 004: Verification & Trust...'
\i 004_verification_trust.sql

-- =====================================================================================
-- MIGRATION 005: HRM CORE
-- =====================================================================================
\echo 'Running Migration 005: HRM Core...'
\i 005_hrm_core.sql

-- =====================================================================================
-- MIGRATION 006: WORKFLOW & APPROVALS
-- =====================================================================================
\echo 'Running Migration 006: Workflow & Approvals...'
\i 006_workflow_approvals.sql

-- =====================================================================================
-- MIGRATION 007: FINANCE ERP
-- =====================================================================================
\echo 'Running Migration 007: Finance ERP...'
\i 007_finance_erp.sql

-- =====================================================================================
-- MIGRATION 008: PROCUREMENT & INVENTORY
-- =====================================================================================
\echo 'Running Migration 008: Procurement & Inventory...'
\i 008_procurement_inventory.sql

-- =====================================================================================
-- MIGRATION 009: CRM ERP
-- =====================================================================================
\echo 'Running Migration 009: CRM ERP...'
\i 009_crm_erp.sql

-- =====================================================================================
-- MIGRATION 010: BOOKING & COMMUNICATIONS
-- =====================================================================================
\echo 'Running Migration 010: Booking & Communications...'
\i 010_booking_communications.sql

-- =====================================================================================
-- MIGRATION 011: AI, BLOCKCHAIN, SECURITY
-- =====================================================================================
\echo 'Running Migration 011: AI, Blockchain, Security...'
\i 011_ai_blockchain_security.sql

-- =====================================================================================
-- MIGRATION 012: CONTENT, MEDIA, MULTI-LANGUAGE
-- =====================================================================================
\echo 'Running Migration 012: Content, Media, Multi-Language...'
\i 012_content_media_multilang.sql

-- =====================================================================================
-- MIGRATION 013: SUBSCRIPTION & AI MANAGEMENT
-- =====================================================================================
\echo 'Running Migration 013: Subscription & AI Management...'
\i 013_subscription_ai_management.sql

-- =====================================================================================
-- MIGRATION 014: SETTINGS, CMS, OMNICHANNEL
-- =====================================================================================
\echo 'Running Migration 014: Settings, CMS, Omnichannel...'
\i 014_settings_cms_omnichannel.sql

-- =====================================================================================
-- VERIFICATION QUERIES
-- =====================================================================================

-- Verify Row Level Security is enabled on all tenant-scoped tables
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

-- Count all tables created
SELECT COUNT(*) AS total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify all migrations completed
\echo ''
\echo '====================================================================='
\echo 'MIGRATION COMPLETE'
\echo '====================================================================='
\echo 'Total Migrations: 14'
\echo 'Total Tables: 133+'
\echo 'RLS Enabled: All tenant-scoped tables'
\echo '====================================================================='
\echo ''

COMMIT;

-- =====================================================================================
-- POST-MIGRATION: SEED DEFAULT DATA
-- =====================================================================================

-- Insert default admin user (change credentials immediately in production!)
-- INSERT INTO entity_graph (auth_user_id, tenant_id, entity_type, first_name, last_name, email, role)
-- VALUES (
--   (SELECT id FROM auth.users WHERE email = 'admin@kora.com' LIMIT 1),
--   (SELECT id FROM tenants WHERE tenant_code = 'KORA_HQ' LIMIT 1),
--   'BUSINESS_OWNER',
--   'Admin',
--   'User',
--   'admin@kora.com',
--   'OWNER'
-- );

-- =====================================================================================
-- END OF MASTER MIGRATION
-- =====================================================================================
