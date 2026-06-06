-- =====================================================================================
-- Migration 011: AI Personal Assistant, Blockchain, Smart Contracts, Security
-- =====================================================================================
-- Comprehensive PA with global context awareness, fraud monitoring, content generation
-- Multi-currency, multi-language, location-based, subscription access control
-- =====================================================================================

-- =====================================================================================
-- AI PERSONAL ASSISTANT ENHANCEMENT
-- =====================================================================================

-- ai_assistant_contexts (Global awareness and learning)
CREATE TABLE ai_assistant_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  
  context_type VARCHAR(100) NOT NULL CHECK (context_type IN (
    'customer_preferences', 'business_patterns', 'fraud_indicators',
    'content_style', 'scheduling_preferences', 'communication_style',
    'product_recommendations', 'service_suggestions', 'pricing_optimization'
  )),
  
  context_data JSONB NOT NULL DEFAULT '{}',
  
  -- Learning and prediction
  confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  times_used INTEGER DEFAULT 0,
  
  -- Global awareness
  applies_to_all_tenants BOOLEAN DEFAULT FALSE,
  region_specific VARCHAR(50),
  industry_specific VARCHAR(100),
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_assistant_contexts_tenant ON ai_assistant_contexts(tenant_id);
CREATE INDEX idx_ai_assistant_contexts_entity ON ai_assistant_contexts(entity_id);
CREATE INDEX idx_ai_assistant_contexts_type ON ai_assistant_contexts(context_type);

ALTER TABLE ai_assistant_contexts ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_ai_assistant_contexts_isolation ON ai_assistant_contexts
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- BLOCKCHAIN & SMART CONTRACTS
-- =====================================================================================

-- blockchain_blocks (Immutable chain)
CREATE TABLE blockchain_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  block_number BIGSERIAL UNIQUE NOT NULL,
  previous_hash TEXT NOT NULL,
  current_hash TEXT NOT NULL UNIQUE,
  
  -- Block content
  transactions JSONB NOT NULL DEFAULT '[]',
  transaction_count INTEGER DEFAULT 0,
  
  -- Merkle tree root
  merkle_root TEXT NOT NULL,
  
  -- Mining/validation
  nonce BIGINT,
  difficulty INTEGER DEFAULT 1,
  
  -- Validator
  validator_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blockchain_blocks_tenant ON blockchain_blocks(tenant_id);
CREATE INDEX idx_blockchain_blocks_number ON blockchain_blocks(block_number);
CREATE INDEX idx_blockchain_blocks_hash ON blockchain_blocks(current_hash);

ALTER TABLE blockchain_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_blockchain_blocks_select ON blockchain_blocks
  FOR SELECT TO authenticated USING (tenant_id = kora_current_tenant_id());

-- No UPDATE or DELETE - blockchain is immutable
CREATE POLICY policy_blockchain_blocks_insert ON blockchain_blocks
  FOR INSERT TO authenticated WITH CHECK (tenant_id = kora_current_tenant_id());

-- blockchain_transactions (Individual transactions)
CREATE TABLE blockchain_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  block_id UUID REFERENCES blockchain_blocks(id) ON DELETE CASCADE,
  
  transaction_type VARCHAR(100) NOT NULL CHECK (transaction_type IN (
    'financial_record', 'contract_execution', 'document_signature',
    'verification_proof', 'audit_log', 'ownership_transfer',
    'compliance_record', 'certification_issue'
  )),
  
  -- Transaction data
  from_entity_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  to_entity_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  transaction_data JSONB NOT NULL,
  transaction_hash TEXT NOT NULL UNIQUE,
  
  -- Signature and verification
  digital_signature TEXT,
  signed_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  -- Smart contract reference
  smart_contract_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blockchain_transactions_tenant ON blockchain_transactions(tenant_id);
CREATE INDEX idx_blockchain_transactions_block ON blockchain_transactions(block_id);
CREATE INDEX idx_blockchain_transactions_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX idx_blockchain_transactions_type ON blockchain_transactions(transaction_type);

ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_blockchain_transactions_isolation ON blockchain_transactions
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- smart_contracts (Self-executing contracts)
CREATE TABLE smart_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  contract_name TEXT NOT NULL,
  contract_type VARCHAR(100) NOT NULL CHECK (contract_type IN (
    'payment_escrow', 'subscription_auto_renew', 'commission_split',
    'franchise_royalty', 'service_level_agreement', 'insurance_claim',
    'supply_chain_milestone', 'employment_contract', 'lease_agreement'
  )),
  
  -- Contract parties
  parties JSONB NOT NULL, -- Array of entity_ids
  
  -- Contract terms (executable logic)
  terms JSONB NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  
  -- Contract status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
    'draft', 'active', 'executed', 'breached', 'terminated', 'expired'
  )),
  
  -- Execution
  auto_execute BOOLEAN DEFAULT TRUE,
  execution_trigger VARCHAR(100), -- 'time_based', 'event_based', 'condition_met'
  
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Blockchain reference
  blockchain_hash TEXT,
  
  created_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_smart_contracts_tenant ON smart_contracts(tenant_id);
CREATE INDEX idx_smart_contracts_status ON smart_contracts(status);
CREATE INDEX idx_smart_contracts_type ON smart_contracts(contract_type);

ALTER TABLE smart_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_smart_contracts_isolation ON smart_contracts
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- smart_contract_executions (Execution history)
CREATE TABLE smart_contract_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES smart_contracts(id) ON DELETE CASCADE,
  
  execution_type VARCHAR(50) CHECK (execution_type IN (
    'automatic', 'manual', 'scheduled', 'event_triggered'
  )),
  
  trigger_event TEXT,
  
  -- Execution result
  status VARCHAR(50) CHECK (status IN ('success', 'failed', 'partial')),
  result_data JSONB,
  error_message TEXT,
  
  executed_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_smart_contract_executions_tenant ON smart_contract_executions(tenant_id);
CREATE INDEX idx_smart_contract_executions_contract ON smart_contract_executions(contract_id);

ALTER TABLE smart_contract_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_smart_contract_executions_isolation ON smart_contract_executions
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- CYBERSECURITY & COMPLIANCE
-- =====================================================================================

-- security_events (Real-time threat monitoring)
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  event_type VARCHAR(100) NOT NULL CHECK (event_type IN (
    'suspicious_login', 'multiple_failed_attempts', 'unusual_activity',
    'data_breach_attempt', 'privilege_escalation', 'unusual_transaction',
    'suspicious_pattern', 'account_takeover_attempt', 'sql_injection',
    'xss_attempt', 'csrf_attempt', 'ddos_detected'
  )),
  
  severity VARCHAR(20) NOT NULL CHECK (severity IN (
    'low', 'medium', 'high', 'critical'
  )),
  
  -- Event details
  entity_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  geolocation JSONB,
  
  event_data JSONB NOT NULL,
  
  -- AI analysis
  ai_risk_score DECIMAL(5,2) CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100),
  ai_recommendation TEXT,
  
  -- Response
  auto_blocked BOOLEAN DEFAULT FALSE,
  requires_review BOOLEAN DEFAULT TRUE,
  reviewed_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  
  resolution VARCHAR(50) CHECK (resolution IN (
    'false_positive', 'legitimate_threat', 'blocked', 'allowed', 'pending'
  )),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_events_tenant ON security_events(tenant_id);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_created ON security_events(created_at);

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_security_events_isolation ON security_events
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- fraud_detection_rules (AI-powered fraud detection)
CREATE TABLE fraud_detection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  rule_name TEXT NOT NULL,
  rule_type VARCHAR(100) NOT NULL CHECK (rule_type IN (
    'account_age', 'transaction_velocity', 'location_mismatch',
    'device_change', 'unusual_hours', 'amount_threshold',
    'pattern_anomaly', 'network_analysis', 'behavior_deviation'
  )),
  
  -- Rule definition
  rule_conditions JSONB NOT NULL,
  risk_weight DECIMAL(5,2) DEFAULT 1.0,
  
  -- Actions
  auto_flag BOOLEAN DEFAULT TRUE,
  auto_block BOOLEAN DEFAULT FALSE,
  require_verification BOOLEAN DEFAULT TRUE,
  
  -- AI learning
  ml_model_version TEXT,
  false_positive_rate DECIMAL(5,2),
  true_positive_rate DECIMAL(5,2),
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fraud_detection_rules_tenant ON fraud_detection_rules(tenant_id);
CREATE INDEX idx_fraud_detection_rules_type ON fraud_detection_rules(rule_type);

ALTER TABLE fraud_detection_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_fraud_detection_rules_isolation ON fraud_detection_rules
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- fraud_alerts (Detected suspicious activity)
CREATE TABLE fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  entity_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  -- Alert details
  triggered_by_rule_id UUID REFERENCES fraud_detection_rules(id) ON DELETE SET NULL,
  alert_data JSONB NOT NULL,
  
  -- Risk scoring
  fraud_score DECIMAL(5,2) NOT NULL CHECK (fraud_score >= 0 AND fraud_score <= 100),
  confidence_level DECIMAL(5,2),
  
  -- Actions taken
  account_locked BOOLEAN DEFAULT FALSE,
  transaction_blocked BOOLEAN DEFAULT FALSE,
  verification_required BOOLEAN DEFAULT TRUE,
  
  -- Resolution
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'investigating', 'resolved', 'false_positive', 'confirmed_fraud'
  )),
  
  investigated_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  investigated_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fraud_alerts_tenant ON fraud_alerts(tenant_id);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_severity ON fraud_alerts(severity);
CREATE INDEX idx_fraud_alerts_entity ON fraud_alerts(entity_id);

ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_fraud_alerts_isolation ON fraud_alerts
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- END OF MIGRATION 011
-- =====================================================================================
