-- =============================================================================
-- MIGRATION 002: RBAC PERMISSION ENGINE
-- Roles, Permissions, Role-Permission Matrix, User-Role Assignment
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- ROLES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        REFERENCES tenants(id) ON DELETE CASCADE, -- NULL = platform-level role
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL,
  scope       VARCHAR(30) NOT NULL DEFAULT 'ORGANIZATION', -- PLATFORM|ORGANIZATION|BRANCH|DEPARTMENT|SELF
  description TEXT,
  is_system   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_roles_isolation ON roles
  FOR ALL TO authenticated
  USING (tenant_id IS NULL OR tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON roles(tenant_id);

-- Seed platform-level system roles (tenant_id = NULL = available to all)
INSERT INTO roles (tenant_id, name, slug, scope, is_system) VALUES
  -- Platform system roles
  (NULL, 'Platform Owner',          'platform_owner',          'PLATFORM', TRUE),
  (NULL, 'Platform Administrator',  'platform_admin',          'PLATFORM', TRUE),
  (NULL, 'Support Administrator',   'support_admin',           'PLATFORM', TRUE),
  (NULL, 'Compliance Officer',      'compliance_officer',      'PLATFORM', TRUE),
  (NULL, 'Security Auditor',        'security_auditor',        'PLATFORM', TRUE),
  (NULL, 'AI Supervisor',           'ai_supervisor',           'PLATFORM', TRUE),
  (NULL, 'Blockchain Administrator','blockchain_admin',         'PLATFORM', TRUE),
  -- Organization roles
  (NULL, 'Organization Owner',      'org_owner',               'ORGANIZATION', TRUE),
  (NULL, 'Co-Owner',                'co_owner',                'ORGANIZATION', TRUE),
  (NULL, 'CEO',                     'ceo',                     'ORGANIZATION', TRUE),
  (NULL, 'COO',                     'coo',                     'ORGANIZATION', TRUE),
  (NULL, 'CFO',                     'cfo',                     'ORGANIZATION', TRUE),
  (NULL, 'CTO',                     'cto',                     'ORGANIZATION', TRUE),
  (NULL, 'Director',                'director',                'ORGANIZATION', TRUE),
  (NULL, 'Branch Manager',          'branch_manager',          'BRANCH', TRUE),
  (NULL, 'Department Head',         'department_head',         'DEPARTMENT', TRUE),
  (NULL, 'Manager',                 'manager',                 'DEPARTMENT', TRUE),
  (NULL, 'Supervisor',              'supervisor',              'DEPARTMENT', TRUE),
  (NULL, 'Team Lead',               'team_lead',               'DEPARTMENT', TRUE),
  (NULL, 'Staff',                   'staff',                   'SELF', TRUE),
  (NULL, 'Contractor',              'contractor',              'SELF', TRUE),
  (NULL, 'Intern',                  'intern',                  'SELF', TRUE),
  -- Customer/Patient/User roles
  (NULL, 'Customer',                'customer',                'SELF', TRUE),
  (NULL, 'Patient',                 'patient',                 'SELF', TRUE),
  (NULL, 'Student',                 'student',                 'SELF', TRUE),
  (NULL, 'Parent',                  'parent',                  'SELF', TRUE),
  (NULL, 'Guest',                   'guest',                   'SELF', TRUE),
  (NULL, 'Subscriber',              'subscriber',              'SELF', TRUE),
  (NULL, 'Member',                  'member',                  'SELF', TRUE),
  -- Vendor/Partner roles
  (NULL, 'Vendor',                  'vendor',                  'SELF', TRUE),
  (NULL, 'Supplier',                'supplier',                'SELF', TRUE),
  (NULL, 'Partner',                 'partner',                 'SELF', TRUE),
  (NULL, 'Franchisee',              'franchisee',              'ORGANIZATION', TRUE),
  -- Specialist industry roles
  (NULL, 'Auditor',                 'auditor',                 'ORGANIZATION', TRUE),
  (NULL, 'Accountant',              'accountant',              'DEPARTMENT', TRUE),
  (NULL, 'Doctor',                  'doctor',                  'DEPARTMENT', TRUE),
  (NULL, 'Nurse',                   'nurse',                   'DEPARTMENT', TRUE),
  (NULL, 'Pharmacist',              'pharmacist',              'DEPARTMENT', TRUE),
  (NULL, 'Lab Scientist',           'lab_scientist',           'DEPARTMENT', TRUE),
  (NULL, 'Radiologist',             'radiologist',             'DEPARTMENT', TRUE),
  (NULL, 'Receptionist',            'receptionist',            'DEPARTMENT', TRUE),
  (NULL, 'Insurance Officer',       'insurance_officer',       'DEPARTMENT', TRUE),
  (NULL, 'Trainer',                 'trainer',                 'DEPARTMENT', TRUE),
  (NULL, 'Salon Staff',             'salon_staff',             'DEPARTMENT', TRUE),
  (NULL, 'Tattoo Artist',           'tattoo_artist',           'DEPARTMENT', TRUE),
  (NULL, 'Driver',                  'driver',                  'SELF', TRUE),
  (NULL, 'Teacher',                 'teacher',                 'DEPARTMENT', TRUE),
  (NULL, 'Lecturer',                'lecturer',                'DEPARTMENT', TRUE),
  (NULL, 'Freelancer',              'freelancer',              'SELF', TRUE),
  (NULL, 'Consultant',              'consultant',              'SELF', TRUE),
  (NULL, 'Agent',                   'agent',                   'SELF', TRUE)
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- PERMISSIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  module      VARCHAR(100) NOT NULL,
  action      VARCHAR(50)  NOT NULL,  -- view|create|edit|delete|approve|reject|export|import|print|share|lock|unlock|archive|restore|audit|configure|assign|verify|supervise|publish|execute
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(module, action)
);

-- Seed all permissions across every module
INSERT INTO permissions (module, action) VALUES
  -- Universal actions on every module
  ('*',                    'view'),('*','create'),('*','edit'),('*','delete'),
  ('*',                    'approve'),('*','reject'),('*','export'),('*','import'),
  ('*',                    'print'),('*','share'),('*','lock'),('*','unlock'),
  ('*',                    'archive'),('*','restore'),('*','audit'),('*','configure'),
  ('*',                    'assign'),('*','verify'),('*','supervise'),('*','publish'),('*','execute'),
  -- Tenants & platform
  ('tenants',              'view'),('tenants','freeze'),('tenants','unfreeze'),('tenants','configure'),
  -- Identity & Users
  ('entity_graph',         'view'),('entity_graph','create'),('entity_graph','edit'),('entity_graph','delete'),('entity_graph','verify'),
  ('biometric_profiles',   'enroll'),('biometric_profiles','verify'),('biometric_profiles','delete'),
  -- RBAC
  ('roles',                'view'),('roles','create'),('roles','edit'),('roles','delete'),('roles','assign'),
  ('permissions',          'view'),('permissions','configure'),
  -- Registration & Verification
  ('organization_verifications','view'),('organization_verifications','approve'),('organization_verifications','reject'),
  -- HRM
  ('employees',            'view'),('employees','create'),('employees','edit'),('employees','delete'),('employees','approve'),
  ('attendance',           'view'),('attendance','create'),('attendance','edit'),('attendance','approve'),
  ('shifts',               'view'),('shifts','create'),('shifts','edit'),('shifts','assign'),
  ('leave_requests',       'view'),('leave_requests','create'),('leave_requests','approve'),('leave_requests','reject'),
  ('payroll',              'view'),('payroll','create'),('payroll','approve'),('payroll','export'),
  ('performance_reviews',  'view'),('performance_reviews','create'),('performance_reviews','approve'),
  -- Finance ERP
  ('chart_of_accounts',    'view'),('chart_of_accounts','create'),('chart_of_accounts','edit'),('chart_of_accounts','configure'),
  ('journal_entries',      'view'),('journal_entries','create'),('journal_entries','approve'),('journal_entries','export'),
  ('ledger_entries',       'view'),('ledger_entries','create'),('ledger_entries','export'),
  ('budgets',              'view'),('budgets','create'),('budgets','edit'),('budgets','approve'),
  ('bank_accounts',        'view'),('bank_accounts','create'),('bank_accounts','reconcile'),
  ('invoices',             'view'),('invoices','create'),('invoices','edit'),('invoices','approve'),('invoices','export'),('invoices','print'),
  -- Procurement
  ('vendors',              'view'),('vendors','create'),('vendors','edit'),('vendors','verify'),('vendors','approve'),
  ('purchase_requests',    'view'),('purchase_requests','create'),('purchase_requests','approve'),('purchase_requests','reject'),
  ('purchase_orders',      'view'),('purchase_orders','create'),('purchase_orders','approve'),('purchase_orders','export'),
  ('goods_received',       'view'),('goods_received','create'),('goods_received','approve'),
  -- Inventory
  ('warehouses',           'view'),('warehouses','create'),('warehouses','edit'),('warehouses','configure'),
  ('inventory_items',      'view'),('inventory_items','create'),('inventory_items','edit'),('inventory_items','delete'),
  ('stock_movements',      'view'),('stock_movements','create'),('stock_movements','approve'),
  -- CRM
  ('crm_leads',            'view'),('crm_leads','create'),('crm_leads','edit'),('crm_leads','delete'),('crm_leads','assign'),
  ('crm_opportunities',    'view'),('crm_opportunities','create'),('crm_opportunities','edit'),('crm_opportunities','assign'),
  ('customers',            'view'),('customers','create'),('customers','edit'),('customers','delete'),
  -- Bookings
  ('bookings',             'view'),('bookings','create'),('bookings','edit'),('bookings','cancel'),('bookings','approve'),
  ('availability',         'view'),('availability','create'),('availability','edit'),
  -- POS & Sales
  ('pos_transactions',     'view'),('pos_transactions','create'),('pos_transactions','approve'),('pos_transactions','refund'),
  ('sales_orders',         'view'),('sales_orders','create'),('sales_orders','approve'),('sales_orders','export'),
  -- Services & Products
  ('services',             'view'),('services','create'),('services','edit'),('services','delete'),('services','publish'),
  ('products',             'view'),('products','create'),('products','edit'),('products','delete'),('products','publish'),
  -- Marketing
  ('campaigns',            'view'),('campaigns','create'),('campaigns','edit'),('campaigns','approve'),('campaigns','publish'),
  ('blogs',                'view'),('blogs','create'),('blogs','edit'),('blogs','publish'),('blogs','delete'),
  -- Documents
  ('documents',            'view'),('documents','create'),('documents','edit'),('documents','delete'),('documents','approve'),('documents','share'),
  -- Projects
  ('projects',             'view'),('projects','create'),('projects','edit'),('projects','delete'),('projects','assign'),
  ('tasks',                'view'),('tasks','create'),('tasks','edit'),('tasks','assign'),('tasks','complete'),
  -- Compliance
  ('compliance_rules',     'view'),('compliance_rules','create'),('compliance_rules','edit'),('compliance_rules','configure'),
  ('audit_control_plane',  'view'),('audit_control_plane','export'),
  -- AI
  ('ai_orchestrator',      'view'),('ai_orchestrator','configure'),('ai_orchestrator','execute'),
  -- Blockchain
  ('blockchain_transactions','view'),('blockchain_transactions','verify'),
  -- Reports & Analytics
  ('reports',              'view'),('reports','create'),('reports','export'),
  ('dashboards',           'view'),('dashboards','configure'),
  -- Industry: Health
  ('patients',             'view'),('patients','create'),('patients','edit'),('patients','delete'),
  ('encounters',           'view'),('encounters','create'),('encounters','edit'),
  ('prescriptions',        'view'),('prescriptions','create'),('prescriptions','approve'),
  ('teleconsultations',    'view'),('teleconsultations','create'),('teleconsultations','join'),
  ('patient_devices',      'view'),('patient_devices','create'),('patient_devices','configure'),
  -- Industry: Education
  ('students',             'view'),('students','create'),('students','edit'),('students','delete'),
  ('courses',              'view'),('courses','create'),('courses','edit'),('courses','publish'),
  ('exams',                'view'),('exams','create'),('exams','approve'),('exams','grade'),
  -- Industry: Transport
  ('drivers',              'view'),('drivers','create'),('drivers','edit'),('drivers','verify'),
  ('vehicles',             'view'),('vehicles','create'),('vehicles','edit'),
  ('dispatches',           'view'),('dispatches','create'),('dispatches','assign'),
  -- Notifications & Comms
  ('notifications',        'view'),('notifications','create'),('notifications','configure'),
  ('conversations',        'view'),('conversations','create'),('conversations','archive'),
  -- God Mode
  ('platform_god_mode',    'freeze_tenant'),('platform_god_mode','unfreeze_tenant'),
  ('platform_god_mode',    'view_all_tenants'),('platform_god_mode','impersonate'),
  ('platform_god_mode',    'view_global_telemetry'),('platform_god_mode','configure_platform')
ON CONFLICT (module, action) DO NOTHING;

-- ---------------------------------------------------------------------------
-- ROLE_PERMISSIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- ---------------------------------------------------------------------------
-- USER_ROLES (tenant-scoped assignment)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_id   UUID        NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  role_id     UUID        NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by  UUID        REFERENCES entity_graph(id),
  scope_type  VARCHAR(30) DEFAULT 'ORGANIZATION', -- ORGANIZATION|BRANCH|DEPARTMENT
  scope_id    UUID,        -- branch_id or department_id
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, entity_id, role_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_user_roles_isolation ON user_roles
  FOR ALL TO authenticated
  USING (tenant_id = kora_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id  ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_entity_id  ON user_roles(entity_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);

COMMIT;
