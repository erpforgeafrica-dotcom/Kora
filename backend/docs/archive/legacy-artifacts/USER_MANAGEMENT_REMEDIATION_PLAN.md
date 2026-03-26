# USER MANAGEMENT REMEDIATION PLAN

**Project**: KORA Platform  
**Current Score**: 40/100  
**Target Score**: 95/100  
**Timeline**: 14 weeks  
**Effort**: ~560 hours  

---

## PHASE 1: CRITICAL SECURITY (Weeks 1-2, 80 hours)

### 1.1 Password Management Implementation

**Files to Create**:
- `backend/src/services/passwordService.ts`
- `backend/src/middleware/passwordPolicy.ts`
- `backend/src/db/migrations/001_add_password_fields.sql`

**Implementation**:
```typescript
// backend/src/services/passwordService.ts
import bcrypt from 'bcrypt';
import { generateId } from '../shared/utils.js';

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expiryDays: number;
  historyCount: number;
}

const DEFAULT_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  expiryDays: 90,
  historyCount: 5
};

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordPolicy(password: string, policy: PasswordPolicy = DEFAULT_POLICY): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters');
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters');
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain numbers');
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain special characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export async function checkPasswordHistory(userId: string, newPassword: string, historyCount: number = 5): Promise<boolean> {
  const history = await queryDb(
    `SELECT password_hash FROM password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, historyCount]
  );

  for (const entry of history) {
    if (await verifyPassword(newPassword, entry.password_hash)) {
      return false; // Password was used before
    }
  }

  return true; // Password is new
}

export async function setPassword(userId: string, newPassword: string): Promise<void> {
  const policy = DEFAULT_POLICY;
  const validation = validatePasswordPolicy(newPassword, policy);

  if (!validation.valid) {
    throw new Error(`Password policy violation: ${validation.errors.join(', ')}`);
  }

  const isNew = await checkPasswordHistory(userId, newPassword, policy.historyCount);
  if (!isNew) {
    throw new Error('Password was used recently. Please choose a different password.');
  }

  const hash = await hashPassword(newPassword);
  const expiresAt = new Date(Date.now() + policy.expiryDays * 24 * 60 * 60 * 1000);

  // Update user password
  await queryDb(
    `UPDATE users SET password_hash = $1, password_expires_at = $2, password_changed_at = NOW() WHERE id = $3`,
    [hash, expiresAt, userId]
  );

  // Add to history
  await queryDb(
    `INSERT INTO password_history (id, user_id, password_hash, created_at) VALUES ($1, $2, $3, NOW())`,
    [generateId(), userId, hash]
  );
}
```

**Database Migration**:
```sql
-- Add password fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ;

-- Create password history table
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);
```

**Effort**: 20 hours

---

### 1.2 Session Management Implementation

**Files to Create**:
- `backend/src/services/sessionService.ts`
- `backend/src/db/migrations/002_create_sessions_table.sql`

**Implementation**:
```typescript
// backend/src/services/sessionService.ts
import { generateId } from '../shared/utils.js';
import { queryDb } from '../db/client.js';

export interface Session {
  id: string;
  userId: string;
  organizationId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  status: 'active' | 'expired' | 'revoked';
}

const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export async function createSession(userId: string, organizationId: string, req: any): Promise<Session> {
  const session: Session = {
    id: generateId(),
    userId,
    organizationId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_TIMEOUT_MS),
    lastActivityAt: new Date(),
    ipAddress: req.ip || '',
    userAgent: req.get('user-agent') || '',
    status: 'active'
  };

  await queryDb(
    `INSERT INTO sessions (id, user_id, organization_id, created_at, expires_at, last_activity_at, ip_address, user_agent, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [session.id, userId, organizationId, session.createdAt, session.expiresAt, session.lastActivityAt, session.ipAddress, session.userAgent, session.status]
  );

  return session;
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const result = await queryDb(
    `SELECT * FROM sessions WHERE id = $1`,
    [sessionId]
  );

  if (!result.length) return null;

  const row = result[0];
  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
    lastActivityAt: new Date(row.last_activity_at),
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    deviceId: row.device_id,
    status: row.status
  };
}

export async function validateSession(sessionId: string): Promise<boolean> {
  const session = await getSession(sessionId);

  if (!session) return false;
  if (session.status !== 'active') return false;
  if (new Date() > session.expiresAt) return false;
  if (new Date(Date.now() - IDLE_TIMEOUT_MS) > session.lastActivityAt) return false;

  return true;
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  await queryDb(
    `UPDATE sessions SET last_activity_at = NOW() WHERE id = $1`,
    [sessionId]
  );
}

export async function revokeSession(sessionId: string): Promise<void> {
  await queryDb(
    `UPDATE sessions SET status = 'revoked' WHERE id = $1`,
    [sessionId]
  );
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await queryDb(
    `UPDATE sessions SET status = 'revoked' WHERE user_id = $1 AND status = 'active'`,
    [userId]
  );
}

export async function cleanupExpiredSessions(): Promise<void> {
  await queryDb(
    `DELETE FROM sessions WHERE expires_at < NOW() OR (status = 'revoked' AND created_at < NOW() - INTERVAL '7 days')`
  );
}
```

**Database Migration**:
```sql
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  device_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  CHECK (status IN ('active', 'expired', 'revoked'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
```

**Effort**: 20 hours

---

### 1.3 Audit Logging Implementation

**Files to Create**:
- `backend/src/services/auditService.ts`
- `backend/src/middleware/auditMiddleware.ts`

**Implementation**:
```typescript
// backend/src/services/auditService.ts
import { generateId } from '../shared/utils.js';
import { queryDb } from '../db/client.js';

export interface AuditLog {
  id: string;
  organizationId: string;
  actorId?: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  result: 'success' | 'failure';
  errorMessage?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export async function logAuditEvent(log: AuditLog): Promise<void> {
  await queryDb(
    `INSERT INTO audit_logs (id, organization_id, actor_id, action, resource, resource_id, changes, result, error_message, ip_address, user_agent, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      log.id,
      log.organizationId,
      log.actorId,
      log.action,
      log.resource,
      log.resourceId,
      JSON.stringify(log.changes),
      log.result,
      log.errorMessage,
      log.ipAddress,
      log.userAgent,
      log.timestamp
    ]
  );
}

export async function getAuditLogs(organizationId: string, filters?: {
  action?: string;
  resource?: string;
  actorId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<AuditLog[]> {
  let query = `SELECT * FROM audit_logs WHERE organization_id = $1`;
  const params: any[] = [organizationId];
  let paramIndex = 2;

  if (filters?.action) {
    query += ` AND action = $${paramIndex}`;
    params.push(filters.action);
    paramIndex++;
  }

  if (filters?.resource) {
    query += ` AND resource = $${paramIndex}`;
    params.push(filters.resource);
    paramIndex++;
  }

  if (filters?.actorId) {
    query += ` AND actor_id = $${paramIndex}`;
    params.push(filters.actorId);
    paramIndex++;
  }

  if (filters?.startDate) {
    query += ` AND created_at >= $${paramIndex}`;
    params.push(filters.startDate);
    paramIndex++;
  }

  if (filters?.endDate) {
    query += ` AND created_at <= $${paramIndex}`;
    params.push(filters.endDate);
    paramIndex++;
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
  params.push(filters?.limit || 1000);

  const results = await queryDb(query, params);
  return results.map(row => ({
    id: row.id,
    organizationId: row.organization_id,
    actorId: row.actor_id,
    action: row.action,
    resource: row.resource,
    resourceId: row.resource_id,
    changes: row.changes,
    result: row.result,
    errorMessage: row.error_message,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    timestamp: new Date(row.created_at)
  }));
}
```

**Effort**: 15 hours

---

### 1.4 Account Lockout Implementation

**Files to Create**:
- `backend/src/services/accountLockoutService.ts`

**Implementation**:
```typescript
// backend/src/services/accountLockoutService.ts
import { queryDb } from '../db/client.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export async function recordFailedLogin(userId: string, ipAddress: string): Promise<void> {
  await queryDb(
    `INSERT INTO login_attempts (id, user_id, ip_address, success, created_at)
     VALUES ($1, $2, $3, false, NOW())`,
    [generateId(), userId, ipAddress]
  );

  // Check if account should be locked
  const recentAttempts = await queryDb(
    `SELECT COUNT(*) as count FROM login_attempts 
     WHERE user_id = $1 AND success = false AND created_at > NOW() - INTERVAL '30 minutes'`,
    [userId]
  );

  if (recentAttempts[0].count >= MAX_FAILED_ATTEMPTS) {
    await lockAccount(userId);
  }
}

export async function recordSuccessfulLogin(userId: string, ipAddress: string): Promise<void> {
  await queryDb(
    `INSERT INTO login_attempts (id, user_id, ip_address, success, created_at)
     VALUES ($1, $2, $3, true, NOW())`,
    [generateId(), userId, ipAddress]
  );

  // Clear failed attempts
  await queryDb(
    `DELETE FROM login_attempts WHERE user_id = $1 AND success = false`,
    [userId]
  );
}

export async function isAccountLocked(userId: string): Promise<boolean> {
  const result = await queryDb(
    `SELECT locked_until FROM users WHERE id = $1`,
    [userId]
  );

  if (!result.length) return false;

  const lockedUntil = result[0].locked_until;
  if (!lockedUntil) return false;

  if (new Date() > new Date(lockedUntil)) {
    // Unlock account
    await queryDb(
      `UPDATE users SET locked_until = NULL WHERE id = $1`,
      [userId]
    );
    return false;
  }

  return true;
}

export async function lockAccount(userId: string): Promise<void> {
  const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
  await queryDb(
    `UPDATE users SET locked_until = $1 WHERE id = $2`,
    [lockedUntil, userId]
  );
}

export async function unlockAccount(userId: string): Promise<void> {
  await queryDb(
    `UPDATE users SET locked_until = NULL WHERE id = $1`,
    [userId]
  );
}
```

**Effort**: 15 hours

---

### 1.5 Brute Force Protection

**Files to Create**:
- `backend/src/middleware/bruteForceProtection.ts`

**Implementation**:
```typescript
// backend/src/middleware/bruteForceProtection.ts
import rateLimit from 'express-rate-limit';

export const loginBruteForceProtection = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // Rate limit by email + IP
    return `${req.body.email}:${req.ip}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'too_many_attempts',
      message: 'Too many login attempts. Please try again later.',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

export const passwordResetBruteForceProtection = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  keyGenerator: (req) => `${req.body.email}:${req.ip}`,
  handler: (req, res) => {
    res.status(429).json({
      error: 'too_many_attempts',
      message: 'Too many password reset attempts. Please try again later.'
    });
  }
});
```

**Effort**: 10 hours

---

**Phase 1 Total**: 80 hours

---

## PHASE 2: ENHANCED SECURITY (Weeks 3-4, 120 hours)

### 2.1 Token Refresh/Rotation
- Implement refresh tokens
- Add token rotation logic
- Implement token blacklist
- **Effort**: 30 hours

### 2.2 MFA/2FA Support
- Implement TOTP (Google Authenticator)
- Implement SMS verification
- Add backup codes
- **Effort**: 40 hours

### 2.3 Permission-Based Access Control
- Implement permissions table
- Add permission checking middleware
- Implement resource-level access control
- **Effort**: 30 hours

### 2.4 Data Encryption
- Implement field-level encryption
- Add encryption key management
- Implement data masking in logs
- **Effort**: 20 hours

---

## PHASE 3: COMPLIANCE (Weeks 5-8, 160 hours)

### 3.1 GDPR Compliance
- Implement data subject rights
- Add consent management
- Implement data retention policies
- **Effort**: 50 hours

### 3.2 SOC 2 Compliance
- Implement security controls
- Add change management
- Implement incident response
- **Effort**: 50 hours

### 3.3 HIPAA Compliance (if needed)
- Implement encryption requirements
- Add access controls
- Implement audit logging
- **Effort**: 40 hours

### 3.4 Compliance Reporting
- Add compliance dashboard
- Implement audit reports
- Add compliance alerts
- **Effort**: 20 hours

---

## PHASE 4: ADVANCED FEATURES (Weeks 9+, 200 hours)

### 4.1 Role Hierarchy
- Implement role inheritance
- Add role delegation
- Implement temporary role elevation
- **Effort**: 40 hours

### 4.2 Device Fingerprinting
- Implement device tracking
- Add device management
- Implement device-based access control
- **Effort**: 40 hours

### 4.3 Anomaly Detection
- Implement login anomaly detection
- Add behavior analysis
- Implement risk scoring
- **Effort**: 60 hours

### 4.4 Security Analytics
- Add security dashboard
- Implement threat detection
- Add security alerts
- **Effort**: 40 hours

### 4.5 Incident Response Automation
- Implement automated response
- Add incident tracking
- Implement remediation workflows
- **Effort**: 20 hours

---

## IMPLEMENTATION CHECKLIST

### Phase 1
- [ ] Password hashing with bcrypt
- [ ] Password policy enforcement
- [ ] Password history tracking
- [ ] Session management with timeout
- [ ] Session revocation
- [ ] Audit logging for all operations
- [ ] Account lockout after failed attempts
- [ ] Brute force protection on login

### Phase 2
- [ ] Refresh token implementation
- [ ] Token rotation logic
- [ ] Token blacklist
- [ ] TOTP implementation
- [ ] SMS verification
- [ ] Backup codes
- [ ] Permission-based access control
- [ ] Field-level encryption
- [ ] Data masking in logs

### Phase 3
- [ ] GDPR data subject rights
- [ ] Consent management
- [ ] Data retention policies
- [ ] SOC 2 security controls
- [ ] Change management process
- [ ] Incident response plan
- [ ] HIPAA encryption (if needed)
- [ ] Compliance dashboard
- [ ] Audit reports

### Phase 4
- [ ] Role hierarchy
- [ ] Role delegation
- [ ] Device fingerprinting
- [ ] Device management
- [ ] Anomaly detection
- [ ] Behavior analysis
- [ ] Security dashboard
- [ ] Threat detection
- [ ] Incident automation

---

## SUCCESS METRICS

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Security Score | 40/100 | 95/100 | 14 weeks |
| Password Security | 0% | 100% | Week 2 |
| Session Management | 0% | 100% | Week 2 |
| Audit Logging | 20% | 100% | Week 2 |
| Account Lockout | 0% | 100% | Week 2 |
| MFA Support | 0% | 100% | Week 4 |
| GDPR Compliance | 0% | 100% | Week 8 |
| SOC 2 Compliance | 0% | 100% | Week 8 |

---

## CONCLUSION

This remediation plan will bring the KORA user management module from 40/100 to 95/100 (world-class enterprise standards) in 14 weeks with ~560 hours of effort.

**Critical**: Phase 1 must be completed before production deployment.

---

**Plan Created**: 2025-01-15  
**Status**: READY FOR IMPLEMENTATION
