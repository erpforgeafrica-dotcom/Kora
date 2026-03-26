-- 037_iam_audit_extend.sql: Extend audit_logs for IAM tracking
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action_details JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES login_sessions(id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs(session_id);
