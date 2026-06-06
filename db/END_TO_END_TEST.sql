-- ============================================================================
-- END-TO-END TENANT ISOLATION TEST
-- Run this in Supabase SQL Editor to verify everything works
-- ============================================================================

-- Step 1: Create a test tenant
INSERT INTO tenants (id, name, slug, type, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Test Tenant A', 'test-tenant-a', 'standard', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create test user in Supabase Auth (use Dashboard or code)
-- Email: testuser@example.com
-- Password: testpassword123
-- After creation, get the auth.uid() and run:

-- Step 3: Link user to tenant (replace USER_ID with actual auth.uid())
INSERT INTO entity_graph (tenant_id, auth_user_id, entity_type, entity_id)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'USER_ID_HERE', 'user', 'USER_ID_HERE')
ON CONFLICT DO NOTHING;

-- Step 4: Create test data in multiple tables
INSERT INTO employees (tenant_id, employee_number, first_name, last_name, email, hire_date)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'EMP001', 'John', 'Doe', 'john@test-tenant-a.com', CURRENT_DATE);

INSERT INTO customers (tenant_id, customer_number, organization_id)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'CUST001', NULL);

INSERT INTO projects (tenant_id, project_code, name, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'PROJ001', 'Test Project Alpha', 'active');

-- Step 5: Verify tenant isolation
-- Log in as the test user in your app, then run these queries:

-- Should return the tenant_id
SELECT kora_current_tenant_id();

-- Should return 1 row (only your tenant)
SELECT COUNT(*) FROM tenants;

-- Should return 1 row (only your employee)
SELECT COUNT(*) FROM employees;

-- Should return 1 row (only your customer)
SELECT COUNT(*) FROM customers;

-- Should return 1 row (only your project)
SELECT COUNT(*) FROM projects;

-- Step 6: Test cross-tenant protection
-- Create second tenant
INSERT INTO tenants (id, name, slug, type, is_active)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'Test Tenant B', 'test-tenant-b', 'standard', true)
ON CONFLICT (id) DO NOTHING;

-- Insert data for Tenant B
INSERT INTO employees (tenant_id, employee_number, first_name, last_name, email, hire_date)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'EMP002', 'Jane', 'Smith', 'jane@test-tenant-b.com', CURRENT_DATE);

-- When logged in as Tenant A user, this should still return 1
-- (Tenant B's employee should be invisible)
SELECT COUNT(*) FROM employees;

-- ============================================================================
-- EXPECTED RESULTS (when logged in as Test Tenant A user):
-- ============================================================================
-- kora_current_tenant_id() → 11111111-1111-1111-1111-111111111111
-- SELECT COUNT(*) FROM tenants → 1 (only sees own tenant)
-- SELECT COUNT(*) FROM employees → 1 (only sees Tenant A employee)
-- SELECT COUNT(*) FROM customers → 1 (only sees Tenant A customer)
-- SELECT COUNT(*) FROM projects → 1 (only sees Tenant A project)
-- ============================================================================
