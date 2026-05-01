-- 050_threat_detection.sql: Real-time threat detection infrastructure
-- Integrates zero trust architecture with threat monitoring

-- ===== THREAT EVENTS TABLE =====
-- Records all security-relevant events for threat detection
CREATE TABLE IF NOT EXISTS threat_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'api', 'database', 'auth', 'infrastructure'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  threat_score INTEGER DEFAULT 0, -- 0-100 risk score
  
  -- Event context
  ip_address INET,
  user_agent TEXT,
  session_id UUID REFERENCES login_sessions(id) ON DELETE SET NULL,
  request_id TEXT,
  
  -- Event details (flexible JSON for different event types)
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexing for quick queries
  CONSTRAINT valid_source CHECK (source IN ('api', 'database', 'auth', 'infrastructure')),
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX idx_threat_events_org_id ON threat_events(organization_id);
CREATE INDEX idx_threat_events_user_id ON threat_events(user_id);
CREATE INDEX idx_threat_events_detected_at ON threat_events(detected_at);
CREATE INDEX idx_threat_events_event_type ON threat_events(event_type);
CREATE INDEX idx_threat_events_severity ON threat_events(severity);
CREATE INDEX idx_threat_events_threat_score ON threat_events(threat_score);
CREATE INDEX idx_threat_events_ip_address ON threat_events(ip_address);
CREATE INDEX idx_threat_events_created_at ON threat_events(created_at DESC);

-- ===== THREAT SIGNALS TABLE =====
-- Aggregated threat signals from multiple detectors
CREATE TABLE IF NOT EXISTS threat_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Signal identification
  signal_type VARCHAR(100) NOT NULL, -- 'SQL_INJECTION', 'CROSS_ORG_ACCESS', etc.
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  combined_score INTEGER NOT NULL, -- 0-100, aggregated from multiple signals
  
  -- Contributing events
  event_ids UUID[] DEFAULT ARRAY[]::UUID[],
  detector_results JSONB DEFAULT '{}'::JSONB,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'investigating', 'resolved', 'false_positive'
  investigation_notes TEXT,
  
  -- Automated response
  auto_response_taken VARCHAR(100), -- 'session_revoked', 'ip_blocked', 'account_locked', etc.
  response_timestamp TIMESTAMPTZ,
  
  -- Timestamps
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_threat_signals_org_id ON threat_signals(organization_id);
CREATE INDEX idx_threat_signals_user_id ON threat_signals(user_id);
CREATE INDEX idx_threat_signals_detected_at ON threat_signals(detected_at);
CREATE INDEX idx_threat_signals_signal_type ON threat_signals(signal_type);
CREATE INDEX idx_threat_signals_severity ON threat_signals(severity);
CREATE INDEX idx_threat_signals_status ON threat_signals(status);
CREATE INDEX idx_threat_signals_combined_score ON threat_signals(combined_score);

-- ===== IP REPUTATION TABLE =====
-- Track IP addresses and their risk scores
CREATE TABLE IF NOT EXISTS ip_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  
  -- Reputation metrics
  risk_score INTEGER DEFAULT 0, -- 0-100
  failed_login_count INTEGER DEFAULT 0,
  blocked_until TIMESTAMPTZ,
  
  -- Geolocation
  country_code VARCHAR(2),
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Last activity
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ip_reputation_ip_address ON ip_reputation(ip_address);
CREATE INDEX idx_ip_reputation_risk_score ON ip_reputation(risk_score);
CREATE INDEX idx_ip_reputation_blocked_until ON ip_reputation(blocked_until);

-- ===== USER ANOMALIES TABLE =====
-- Track baseline behavior and detect deviations
CREATE TABLE IF NOT EXISTS user_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Baseline metrics (updated periodically)
  avg_login_time_of_day INTERVAL,
  avg_failed_attempts_24h DECIMAL,
  avg_data_access_size INTEGER,
  avg_api_calls_per_hour INTEGER,
  
  -- Device fingerprint baseline
  common_user_agents TEXT[],
  common_ip_addresses INET[],
  common_countries VARCHAR(2)[],
  
  -- Current anomaly score
  current_anomaly_score INTEGER DEFAULT 0, -- 0-100
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_anomalies_user_id ON user_anomalies(user_id);
CREATE INDEX idx_user_anomalies_organization_id ON user_anomalies(organization_id);
CREATE INDEX idx_user_anomalies_current_anomaly_score ON user_anomalies(current_anomaly_score);

-- ===== LOGIN FAILURES TABLE (Enhanced) =====
-- Detailed login attempt tracking for brute force detection
CREATE TABLE IF NOT EXISTS login_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- email or username attempted
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  ip_address INET NOT NULL,
  user_agent TEXT,
  
  -- Failure details
  failure_reason VARCHAR(100), -- 'invalid_password', 'user_not_found', 'account_locked'
  attempt_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- For rate limiting
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_failures_identifier ON login_failures(identifier);
CREATE INDEX idx_login_failures_ip_address ON login_failures(ip_address);
CREATE INDEX idx_login_failures_attempt_timestamp ON login_failures(attempt_timestamp);
CREATE INDEX idx_login_failures_created_at ON login_failures(created_at);

-- Cleanup old failures (for efficient querying)
-- Note: Partial index removed due to NOW() immutability constraint
-- Use regular index and filter in queries instead
CREATE INDEX idx_login_failures_recent ON login_failures(attempt_timestamp DESC);

-- ===== THREAT DETECTOR REGISTRY =====
-- Track which detectors are enabled and their configurations
CREATE TABLE IF NOT EXISTS threat_detectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Detector metadata
  detector_name VARCHAR(100) NOT NULL UNIQUE, -- 'sql_injection', 'cross_org_access', etc.
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Configuration
  enabled BOOLEAN DEFAULT TRUE,
  risk_threshold INTEGER DEFAULT 70, -- Alert if score above this
  auto_response_enabled BOOLEAN DEFAULT FALSE,
  auto_response_action VARCHAR(100), -- 'revoke_session', 'block_ip', etc.
  
  -- Performance metrics
  avg_processing_time_ms INTEGER,
  last_triggered_at TIMESTAMPTZ,
  false_positive_count INTEGER DEFAULT 0,
  true_positive_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_threat_detectors_enabled ON threat_detectors(enabled);
CREATE INDEX idx_threat_detectors_detector_name ON threat_detectors(detector_name);

-- ===== SECURITY INCIDENTS TABLE =====
-- High-level incidents aggregating multiple threat signals
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Incident details
  incident_type VARCHAR(100) NOT NULL, -- 'privilege_escalation', 'data_exfiltration', etc.
  severity VARCHAR(20) NOT NULL,
  description TEXT,
  
  -- Related signals and events
  threat_signal_ids UUID[] DEFAULT ARRAY[]::UUID[],
  affected_users UUID[] DEFAULT ARRAY[]::UUID[],
  affected_resources JSONB DEFAULT '{}'::JSONB,
  
  -- Investigation
  status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  investigation_notes TEXT,
  
  -- Timeline
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_incidents_org_id ON security_incidents(organization_id);
CREATE INDEX idx_security_incidents_status ON security_incidents(status);
CREATE INDEX idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX idx_security_incidents_detected_at ON security_incidents(detected_at);

-- ===== AUDIT TRAIL ENHANCEMENTS =====
-- Enhance existing audit_logs for threat detection
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS threat_signal_id UUID REFERENCES threat_signals(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_audit_logs_threat_signal_id ON audit_logs(threat_signal_id);
CREATE INDEX idx_audit_logs_flagged_for_review ON audit_logs(flagged_for_review);

-- ===== PARTITIONING FOR SCALABILITY =====
-- Partition threat_events by organization for better query performance
-- (Optional: implement if performance issues arise)
-- CREATE TABLE threat_events_2026_04 PARTITION OF threat_events
-- FOR VALUES FROM ('2026-04-01'::date) TO ('2026-05-01'::date);
