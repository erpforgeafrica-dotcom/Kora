-- Add ai_plan to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS ai_plan VARCHAR(20) DEFAULT 'basic';

-- Create table for tracking AI usage
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL,
  tokens INTEGER DEFAULT 0,
  cost NUMERIC(10, 4) DEFAULT 0.0000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_org ON ai_usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_action ON ai_usage_logs(action_type);

-- Create table for tracking AI decisions for explainability and auditing
CREATE TABLE IF NOT EXISTS ai_decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  input_summary TEXT,
  output TEXT,
  score NUMERIC(5, 4),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_decision_org ON ai_decision_logs(organization_id);
