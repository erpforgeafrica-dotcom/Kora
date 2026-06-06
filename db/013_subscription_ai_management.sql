-- =====================================================================================
-- Migration 013: Subscription Access Control & AI Resource Management
-- =====================================================================================
-- Fine-grained module access based on subscription tier
-- AI token allocation, usage tracking, and rate limiting
-- Customer activity learning, predictions, and suggestions
-- =====================================================================================

-- =====================================================================================
-- SUBSCRIPTION MODULE ACCESS CONTROL
-- =====================================================================================

-- subscription_module_access (What each plan can access)
CREATE TABLE subscription_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  plan_id UUID NOT NULL REFERENCES billing_plans(id) ON DELETE CASCADE,
  
  module_name VARCHAR(100) NOT NULL,
  module_category VARCHAR(50) CHECK (module_category IN (
    'core', 'business', 'industry', 'advanced', 'enterprise'
  )),
  
  -- Access levels
  can_read BOOLEAN DEFAULT TRUE,
  can_write BOOLEAN DEFAULT TRUE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_export BOOLEAN DEFAULT FALSE,
  can_import BOOLEAN DEFAULT FALSE,
  
  -- Limits
  max_records INTEGER, -- NULL = unlimited
  max_users_per_module INTEGER,
  
  -- Feature flags
  features_enabled JSONB DEFAULT '{}', -- {feature: true/false}
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(plan_id, module_name)
);

CREATE INDEX idx_subscription_module_access_plan ON subscription_module_access(plan_id);
CREATE INDEX idx_subscription_module_access_module ON subscription_module_access(module_name);

-- Default access for all plans
INSERT INTO subscription_module_access (plan_id, module_name, module_category, can_read, can_write, can_delete, can_export, max_records) 
SELECT 
  bp.id,
  module,
  category,
  read_access,
  write_access,
  delete_access,
  export_access,
  record_limit
FROM billing_plans bp
CROSS JOIN (VALUES
  -- BASIC plan
  ('home', 'core', TRUE, TRUE, FALSE, FALSE, NULL),
  ('bookings', 'core', TRUE, TRUE, FALSE, FALSE, 100),
  ('money', 'core', TRUE, TRUE, FALSE, FALSE, 500),
  ('customers', 'core', TRUE, TRUE, FALSE, FALSE, 100),
  ('profile', 'core', TRUE, TRUE, FALSE, TRUE, NULL),
  
  -- ESSENTIAL adds
  ('team', 'business', TRUE, TRUE, FALSE, TRUE, 5),
  ('stock', 'business', TRUE, TRUE, FALSE, TRUE, 500),
  ('crm', 'business', TRUE, TRUE, FALSE, TRUE, 1000),
  ('reports', 'business', TRUE, FALSE, FALSE, TRUE, NULL),
  
  -- PROFESSIONAL adds
  ('procurement', 'advanced', TRUE, TRUE, TRUE, TRUE, NULL),
  ('finance_erp', 'advanced', TRUE, TRUE, TRUE, TRUE, NULL),
  ('hrm_advanced', 'advanced', TRUE, TRUE, TRUE, TRUE, 50),
  ('workflow', 'advanced', TRUE, TRUE, TRUE, TRUE, NULL),
  ('industry_health', 'industry', TRUE, TRUE, TRUE, TRUE, NULL),
  ('industry_education', 'industry', TRUE, TRUE, TRUE, TRUE, NULL),
  
  -- ENTERPRISE adds
  ('franchise', 'enterprise', TRUE, TRUE, TRUE, TRUE, NULL),
  ('blockchain', 'enterprise', TRUE, TRUE, TRUE, TRUE, NULL),
  ('white_label', 'enterprise', TRUE, TRUE, TRUE, TRUE, NULL),
  ('api_access', 'enterprise', TRUE, TRUE, TRUE, TRUE, NULL)
) AS modules(module, category, read_access, write_access, delete_access, export_access, record_limit)
WHERE 
  (bp.name = 'BASIC' AND category = 'core')
  OR (bp.name = 'ESSENTIAL' AND category IN ('core', 'business'))
  OR (bp.name = 'PROFESSIONAL' AND category IN ('core', 'business', 'advanced', 'industry'))
  OR (bp.name = 'ENTERPRISE') -- Enterprise gets everything
ON CONFLICT (plan_id, module_name) DO NOTHING;

-- =====================================================================================
-- AI RESOURCE ALLOCATION & USAGE
-- =====================================================================================

-- ai_resource_allocations (Per-tenant AI limits)
CREATE TABLE ai_resource_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Monthly allocations
  monthly_token_limit BIGINT NOT NULL,
  monthly_image_gen_limit INTEGER DEFAULT 0,
  monthly_video_gen_limit INTEGER DEFAULT 0,
  
  -- Current period usage
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  tokens_used BIGINT DEFAULT 0,
  images_generated INTEGER DEFAULT 0,
  videos_generated INTEGER DEFAULT 0,
  
  -- Rate limiting
  requests_per_minute INTEGER DEFAULT 10,
  requests_per_hour INTEGER DEFAULT 100,
  
  -- Overages
  allow_overages BOOLEAN DEFAULT FALSE,
  overage_rate_per_1k_tokens DECIMAL(10,4) DEFAULT 0.002,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, period_start)
);

CREATE INDEX idx_ai_resource_allocations_tenant ON ai_resource_allocations(tenant_id);
CREATE INDEX idx_ai_resource_allocations_period ON ai_resource_allocations(period_start, period_end);

ALTER TABLE ai_resource_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_ai_resource_allocations_isolation ON ai_resource_allocations
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- ai_usage_logs (Detailed AI usage tracking)
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  usage_type VARCHAR(50) NOT NULL CHECK (usage_type IN (
    'chat_completion', 'text_generation', 'image_generation',
    'video_generation', 'content_optimization', 'translation',
    'fraud_detection', 'prediction', 'recommendation'
  )),
  
  model_used VARCHAR(100) NOT NULL,
  
  -- Resource consumption
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  
  -- Request details
  input_text TEXT,
  output_text TEXT,
  
  -- Cost calculation
  cost_usd DECIMAL(10,6),
  
  -- Quality metrics
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_logs_tenant ON ai_usage_logs(tenant_id);
CREATE INDEX idx_ai_usage_logs_type ON ai_usage_logs(usage_type);
CREATE INDEX idx_ai_usage_logs_created ON ai_usage_logs(created_at);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_ai_usage_logs_isolation ON ai_usage_logs
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- CUSTOMER ACTIVITY LEARNING & PREDICTIONS
-- =====================================================================================

-- customer_behavior_profiles (AI learning per customer)
CREATE TABLE customer_behavior_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_entity_id UUID NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  
  -- Purchase patterns
  avg_transaction_value DECIMAL(15,2),
  total_lifetime_value DECIMAL(15,2),
  purchase_frequency_days DECIMAL(10,2),
  
  -- Preferences (AI learned)
  preferred_services JSONB DEFAULT '[]',
  preferred_products JSONB DEFAULT '[]',
  preferred_booking_times JSONB DEFAULT '{}', -- {day_of_week: [hours]}
  preferred_staff_members UUID[],
  
  -- Behavioral scores
  loyalty_score DECIMAL(5,2) CHECK (loyalty_score >= 0 AND loyalty_score <= 100),
  churn_risk_score DECIMAL(5,2) CHECK (churn_risk_score >= 0 AND churn_risk_score <= 100),
  upsell_propensity DECIMAL(5,2) CHECK (upsell_propensity >= 0 AND upsell_propensity <= 100),
  
  -- Activity patterns
  last_visit_date TIMESTAMPTZ,
  avg_days_between_visits DECIMAL(10,2),
  visit_count INTEGER DEFAULT 0,
  
  -- Predictions
  predicted_next_visit_date TIMESTAMPTZ,
  predicted_next_purchase_value DECIMAL(15,2),
  predicted_services JSONB,
  
  -- AI confidence
  prediction_confidence DECIMAL(5,2),
  last_ml_update TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, customer_entity_id)
);

CREATE INDEX idx_customer_behavior_profiles_tenant ON customer_behavior_profiles(tenant_id);
CREATE INDEX idx_customer_behavior_profiles_customer ON customer_behavior_profiles(customer_entity_id);
CREATE INDEX idx_customer_behavior_profiles_churn ON customer_behavior_profiles(churn_risk_score);
CREATE INDEX idx_customer_behavior_profiles_loyalty ON customer_behavior_profiles(loyalty_score);

ALTER TABLE customer_behavior_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_customer_behavior_profiles_isolation ON customer_behavior_profiles
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- ai_recommendations (Personalized suggestions)
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  recommendation_type VARCHAR(100) NOT NULL CHECK (recommendation_type IN (
    'product_upsell', 'service_upsell', 'cross_sell', 'win_back',
    'loyalty_reward', 'price_optimization', 'inventory_reorder',
    'staffing_schedule', 'marketing_campaign', 'customer_retention'
  )),
  
  -- Target
  target_entity_id UUID REFERENCES entity_graph(id) ON DELETE CASCADE,
  target_entity_type VARCHAR(50), -- 'customer', 'business', 'product', etc.
  
  -- Recommendation details
  recommendation_title TEXT NOT NULL,
  recommendation_description TEXT,
  recommended_action JSONB NOT NULL,
  
  -- AI scoring
  confidence_score DECIMAL(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  potential_value DECIMAL(15,2), -- Estimated revenue/savings
  
  -- Priority
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'viewed', 'accepted', 'rejected', 'expired'
  )),
  
  viewed_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Feedback
  user_feedback TEXT,
  was_helpful BOOLEAN,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_recommendations_tenant ON ai_recommendations(tenant_id);
CREATE INDEX idx_ai_recommendations_type ON ai_recommendations(recommendation_type);
CREATE INDEX idx_ai_recommendations_target ON ai_recommendations(target_entity_id);
CREATE INDEX idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX idx_ai_recommendations_priority ON ai_recommendations(priority);

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_ai_recommendations_isolation ON ai_recommendations
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- BUSINESS INTELLIGENCE & PREDICTIONS
-- =====================================================================================

-- business_predictions (AI forecasting)
CREATE TABLE business_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  prediction_type VARCHAR(100) NOT NULL CHECK (prediction_type IN (
    'revenue_forecast', 'demand_forecast', 'churn_prediction',
    'inventory_requirement', 'staff_requirement', 'busy_periods',
    'slow_periods', 'seasonal_trends', 'price_elasticity'
  )),
  
  -- Time period
  forecast_period_start TIMESTAMPTZ NOT NULL,
  forecast_period_end TIMESTAMPTZ NOT NULL,
  
  -- Predicted values
  predicted_value DECIMAL(15,2),
  predicted_range_min DECIMAL(15,2),
  predicted_range_max DECIMAL(15,2),
  
  -- AI model info
  model_used VARCHAR(100),
  confidence_level DECIMAL(5,2) CHECK (confidence_level >= 0 AND confidence_level <= 100),
  
  -- Actual vs predicted (for model improvement)
  actual_value DECIMAL(15,2),
  prediction_accuracy DECIMAL(5,2),
  
  -- Metadata
  prediction_metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_business_predictions_tenant ON business_predictions(tenant_id);
CREATE INDEX idx_business_predictions_type ON business_predictions(prediction_type);
CREATE INDEX idx_business_predictions_period ON business_predictions(forecast_period_start, forecast_period_end);

ALTER TABLE business_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_business_predictions_isolation ON business_predictions
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- AI MODEL TRAINING & IMPROVEMENT
-- =====================================================================================

-- ml_training_data (Feedback loop for model improvement)
CREATE TABLE ml_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  model_type VARCHAR(100) NOT NULL,
  
  -- Training features
  input_features JSONB NOT NULL,
  target_label JSONB NOT NULL,
  
  -- Model evaluation
  prediction_made JSONB,
  was_accurate BOOLEAN,
  
  -- Usage in training
  used_in_training BOOLEAN DEFAULT FALSE,
  training_batch_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ml_training_data_tenant ON ml_training_data(tenant_id);
CREATE INDEX idx_ml_training_data_type ON ml_training_data(model_type);
CREATE INDEX idx_ml_training_data_training ON ml_training_data(used_in_training);

ALTER TABLE ml_training_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_ml_training_data_isolation ON ml_training_data
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- SUBSCRIPTION UPGRADE SUGGESTIONS
-- =====================================================================================

-- subscription_upgrade_triggers (AI-detected need for upgrade)
CREATE TABLE subscription_upgrade_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  trigger_type VARCHAR(100) NOT NULL CHECK (trigger_type IN (
    'limit_reached', 'feature_requested', 'usage_pattern', 'growth_detected'
  )),
  
  current_plan VARCHAR(50),
  recommended_plan VARCHAR(50),
  
  -- Reasoning
  trigger_reason TEXT NOT NULL,
  value_proposition TEXT,
  
  -- Metrics that triggered
  metrics_data JSONB NOT NULL,
  
  -- Potential ROI
  estimated_benefit TEXT,
  estimated_monthly_value DECIMAL(10,2),
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
    'active', 'dismissed', 'upgraded', 'expired'
  )),
  
  presented_to_user BOOLEAN DEFAULT FALSE,
  presented_at TIMESTAMPTZ,
  
  user_response VARCHAR(50),
  actioned_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_upgrade_triggers_tenant ON subscription_upgrade_triggers(tenant_id);
CREATE INDEX idx_subscription_upgrade_triggers_status ON subscription_upgrade_triggers(status);

ALTER TABLE subscription_upgrade_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_subscription_upgrade_triggers_isolation ON subscription_upgrade_triggers
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- FUNCTION: Check if tenant has access to module
-- =====================================================================================
CREATE OR REPLACE FUNCTION can_access_module(
  p_tenant_id UUID,
  p_module_name TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM tenant_subscriptions ts
    JOIN subscription_module_access sma ON sma.plan_id = ts.plan_id
    WHERE ts.tenant_id = p_tenant_id
      AND ts.is_active = TRUE
      AND sma.module_name = p_module_name
      AND sma.is_active = TRUE
      AND sma.can_read = TRUE
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$;

-- =====================================================================================
-- FUNCTION: Check AI token availability
-- =====================================================================================
CREATE OR REPLACE FUNCTION has_ai_tokens_available(
  p_tenant_id UUID,
  p_tokens_needed INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_available BOOLEAN;
BEGIN
  SELECT (monthly_token_limit - tokens_used) >= p_tokens_needed
  INTO v_available
  FROM ai_resource_allocations
  WHERE tenant_id = p_tenant_id
    AND period_start <= NOW()
    AND period_end >= NOW()
  LIMIT 1;
  
  RETURN COALESCE(v_available, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION can_access_module(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION has_ai_tokens_available(UUID, INTEGER) TO authenticated;

-- =====================================================================================
-- END OF MIGRATION 013
-- =====================================================================================
