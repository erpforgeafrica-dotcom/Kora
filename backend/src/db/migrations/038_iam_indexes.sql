-- 038_iam_indexes.sql: IAM performance indexes (no volatile functions in WHERE)
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);
CREATE INDEX IF NOT EXISTS idx_users_failed_attempts ON users(failed_attempts) WHERE failed_attempts > 0;
CREATE INDEX IF NOT EXISTS idx_login_sessions_user_status ON login_sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier_time ON login_attempts(identifier, attempt_time);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempt_time ON login_attempts(attempt_time);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_action ON audit_logs(actor_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_time ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_history_user_time ON password_history(user_id, created_at DESC);
