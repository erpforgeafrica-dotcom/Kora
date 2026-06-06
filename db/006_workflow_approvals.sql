-- =====================================================================================
-- Migration 006: Workflow & Approval Engine
-- =====================================================================================
-- Workflow Templates, Steps, Instances, Actions, Approvals
-- =====================================================================================

-- =====================================================================================
-- WORKFLOW TEMPLATES
-- =====================================================================================
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  workflow_name TEXT NOT NULL,
  workflow_code TEXT UNIQUE NOT NULL,
  
  description TEXT,
  
  module_name VARCHAR(100), -- e.g., 'procurement', 'leave', 'expense', 'purchase'
  
  is_active BOOLEAN DEFAULT TRUE,
  is_global BOOLEAN DEFAULT FALSE, -- platform-level templates
  
  created_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_templates_tenant ON workflow_templates(tenant_id);
CREATE INDEX idx_workflow_templates_module ON workflow_templates(module_name);

ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_workflow_templates_isolation ON workflow_templates
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- WORKFLOW STEPS
-- =====================================================================================
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  
  step_type VARCHAR(50) NOT NULL CHECK (step_type IN (
    'start', 'approval', 'notification', 'condition', 'action', 'end'
  )),
  
  -- Approval Settings
  approver_role VARCHAR(100), -- e.g., 'manager', 'finance', 'ceo'
  approver_user_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  approval_required BOOLEAN DEFAULT FALSE,
  
  -- Condition Logic
  condition_expression TEXT, -- e.g., 'amount > 10000'
  
  -- Action Settings
  action_type VARCHAR(100), -- e.g., 'send_email', 'create_record', 'update_status'
  action_config JSONB,
  
  -- Notification Settings
  notification_template TEXT,
  notification_recipients JSONB, -- array of user_ids or roles
  
  -- Escalation
  escalation_timeout_hours INTEGER DEFAULT 24,
  escalate_to_role VARCHAR(100),
  escalate_to_user_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_steps_tenant ON workflow_steps(tenant_id);
CREATE INDEX idx_workflow_steps_template ON workflow_steps(workflow_template_id);
CREATE INDEX idx_workflow_steps_order ON workflow_steps(workflow_template_id, step_order);

ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_workflow_steps_isolation ON workflow_steps
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- WORKFLOW INSTANCES
-- =====================================================================================
CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  
  instance_name TEXT,
  
  -- Related Record
  record_type VARCHAR(100), -- e.g., 'purchase_request', 'leave_request'
  record_id UUID NOT NULL,
  
  current_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'completed'
  )),
  
  started_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  rejection_reason TEXT,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_instances_tenant ON workflow_instances(tenant_id);
CREATE INDEX idx_workflow_instances_template ON workflow_instances(workflow_template_id);
CREATE INDEX idx_workflow_instances_record ON workflow_instances(record_type, record_id);
CREATE INDEX idx_workflow_instances_status ON workflow_instances(status);

ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_workflow_instances_isolation ON workflow_instances
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- WORKFLOW ACTIONS
-- =====================================================================================
CREATE TABLE workflow_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  workflow_step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'submitted', 'approved', 'rejected', 'escalated', 'notified', 'completed', 'cancelled'
  )),
  
  performed_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  
  comments TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_actions_tenant ON workflow_actions(tenant_id);
CREATE INDEX idx_workflow_actions_instance ON workflow_actions(workflow_instance_id);
CREATE INDEX idx_workflow_actions_step ON workflow_actions(workflow_step_id);

ALTER TABLE workflow_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_workflow_actions_isolation ON workflow_actions
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- APPROVAL POLICIES
-- =====================================================================================
CREATE TABLE approval_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  policy_name TEXT NOT NULL,
  policy_code TEXT UNIQUE NOT NULL,
  
  module_name VARCHAR(100) NOT NULL, -- e.g., 'procurement', 'finance', 'hr'
  
  description TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_policies_tenant ON approval_policies(tenant_id);
CREATE INDEX idx_approval_policies_module ON approval_policies(module_name);

ALTER TABLE approval_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_approval_policies_isolation ON approval_policies
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- APPROVAL LEVELS
-- =====================================================================================
CREATE TABLE approval_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  approval_policy_id UUID NOT NULL REFERENCES approval_policies(id) ON DELETE CASCADE,
  
  level_order INTEGER NOT NULL,
  level_name TEXT NOT NULL,
  
  approver_role VARCHAR(100),
  approver_user_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  is_required BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_levels_tenant ON approval_levels(tenant_id);
CREATE INDEX idx_approval_levels_policy ON approval_levels(approval_policy_id);
CREATE INDEX idx_approval_levels_order ON approval_levels(approval_policy_id, level_order);

ALTER TABLE approval_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_approval_levels_isolation ON approval_levels
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- APPROVAL RULES
-- =====================================================================================
CREATE TABLE approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  approval_policy_id UUID NOT NULL REFERENCES approval_policies(id) ON DELETE CASCADE,
  
  rule_name TEXT NOT NULL,
  
  -- Condition (e.g., "amount > 10000", "category = 'equipment'")
  condition_field VARCHAR(100),
  condition_operator VARCHAR(20) CHECK (condition_operator IN ('=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN')),
  condition_value TEXT,
  
  -- Required Approval Level
  required_approval_level_id UUID REFERENCES approval_levels(id) ON DELETE SET NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_rules_tenant ON approval_rules(tenant_id);
CREATE INDEX idx_approval_rules_policy ON approval_rules(approval_policy_id);

ALTER TABLE approval_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_approval_rules_isolation ON approval_rules
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- APPROVALS
-- =====================================================================================
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Related Record
  record_type VARCHAR(100) NOT NULL, -- e.g., 'purchase_request', 'expense_claim'
  record_id UUID NOT NULL,
  
  workflow_instance_id UUID REFERENCES workflow_instances(id) ON DELETE SET NULL,
  approval_level_id UUID REFERENCES approval_levels(id) ON DELETE SET NULL,
  
  approver_user_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'escalated'
  )),
  
  approved_at TIMESTAMPTZ,
  comments TEXT,
  
  escalated_to UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  escalated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approvals_tenant ON approvals(tenant_id);
CREATE INDEX idx_approvals_record ON approvals(record_type, record_id);
CREATE INDEX idx_approvals_workflow ON approvals(workflow_instance_id);
CREATE INDEX idx_approvals_approver ON approvals(approver_user_id);
CREATE INDEX idx_approvals_status ON approvals(status);

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_approvals_isolation ON approvals
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- END OF MIGRATION 006
-- =====================================================================================
