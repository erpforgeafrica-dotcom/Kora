# Threat Detection System Integration Guide

**Date**: May 1, 2026  
**Status**: Ready for Implementation  
**Integration Complexity**: Medium  
**Estimated Time**: 4-6 hours  

---

## 1. Database Setup

### Step 1a: Apply Migration

```bash
# The migration 050_threat_detection.sql has been created and includes:
# - threat_events table (stores all security events)
# - threat_signals table (aggregated threat signals)
# - ip_reputation table (IP tracking and blocking)
# - user_anomalies table (baseline behavior tracking)
# - login_failures table (enhanced brute force detection)
# - threat_detectors table (detector registry)
# - security_incidents table (incident tracking)
# - audit_logs enhancements (threat_signal_id linking)

# Run migrations:
cd backend
npm run db:migrate
```

### Step 1b: Verify Tables

```bash
psql -U kora -d kora -c "\dt threat_* security_* login_failures ip_reputation user_anomalies"
```

Expected output: All 7 tables should be created.

---

## 2. App Initialization

### Step 2a: Modify `backend/src/server.ts`

Add threat detection initialization:

```typescript
import initializeThreatDetection from "./services/threatDetection/init.js";

// After app is created
const app = createApp();

// Initialize threat detection system
await initializeThreatDetection(app);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
```

### Step 2b: Verify Initialization

On server start, you should see:

```
[INFO] Initializing threat detection system...
[INFO] Initializing Threat Detection Engine
[INFO] Loaded 8 threat detectors
[INFO] ✓ Registered 8 threat detectors
[INFO] ✓ Threat detection system initialized
```

---

## 3. Auth Module Integration

### Step 3a: Modify `backend/src/modules/auth/service.ts`

Add threat event capture calls:

**Before**: In `loginUser()` function, after failed login check:

```typescript
if (!passwordValid) {
  await incrementFailureCount(user.id);
  const failureCount = await countRecentFailures(normalizedEmail);
  if (shouldLockAccount(failureCount)) {
    await markUserLocked(user.id);
  }
  throw new UnauthorizedError("Invalid email or password");
}
```

**After**: Import and call threat integration:

```typescript
import { onLoginFailure, onLoginSuccess } from "./threatIntegration.js";

if (!passwordValid) {
  // ... existing code ...
  
  // Capture threat event
  await onLoginFailure(
    normalizedEmail,
    user?.organization_id || null,
    ipAddress || "unknown",
    userAgent || "unknown",
    "invalid_password"
  );
  
  throw new UnauthorizedError("Invalid email or password");
}

// After successful password verification:
await resetUserLockState(user.id);

// Capture successful login
await onLoginSuccess(user.id, user.organization_id, ipAddress || "unknown", userAgent || "unknown");

// ... rest of code ...
```

### Step 3b: Modify `backend/src/modules/auth/routes.ts`

Capture user-not-found login attempts:

```typescript
const rows = await queryDb<UserRow>(
  `SELECT id, email, password_hash, role, organization_id, locked_until, failed_attempts
   FROM users
  WHERE lower(email) = lower($1)
  LIMIT 1`,
  [normalizedEmail]
);

const user = rows[0];

// NEW: Capture threat event for non-existent user
if (!user) {
  await onLoginFailure(
    normalizedEmail,
    null,
    req.ip || "unknown",
    req.header("user-agent") || "unknown",
    "user_not_found"
  );
  
  throw new UnauthorizedError("Invalid email or password");
}
```

---

## 4. Middleware Integration

### Step 4a: Global Event Capture

Already added via `captureThreatEvents` middleware in `init.ts`, but verify it's mounted:

```typescript
// In backend/src/services/threatDetection/init.ts
const { captureThreatEvents } = await import("../../middleware/threatEventCapture.js");
app.use(captureThreatEvents);  // ✓ Already included
```

### Step 4b: Specific Event Capture (Optional)

For sensitive endpoints, add targeted capture:

```typescript
// In booking routes
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const orgId = res.locals.auth.organizationId;
    const bookingId = req.params.id;
    
    // Check privilege
    if (res.locals.auth.role !== "admin" && res.locals.auth.role !== "business_admin") {
      await capturePrivilegeEscalation(
        res.locals.auth.userId,
        orgId,
        res.locals.auth.role,
        "DELETE_BOOKING",
        req.ip || "unknown"
      );
      throw new ForbiddenError("Not permitted");
    }
    
    // ... rest of deletion logic ...
  } catch (err) {
    next(err);
  }
});
```

---

## 5. Database Query Event Capture (Optional)

For SQL injection detection, you can optionally wrap queries:

```typescript
// In backend/src/db/client.ts (optional enhancement)

export async function queryDb(
  query: string,
  params: any[] = []
): Promise<any[]> {
  const startTime = Date.now();
  
  try {
    const result = await pool.query(query, params);
    
    // Optionally capture to threat detection
    // (only for authenticated requests with context)
    if (global.threatCaptureContext) {
      await captureDatabaseEvent(
        global.threatCaptureContext.userId,
        global.threatCaptureContext.organizationId,
        query,
        params,
        true
      );
    }
    
    return result.rows;
  } catch (err) {
    // Capture failed query
    if (global.threatCaptureContext) {
      await captureDatabaseEvent(
        global.threatCaptureContext.userId,
        global.threatCaptureContext.organizationId,
        query,
        params,
        false
      );
    }
    throw err;
  }
}
```

---

## 6. API Routes

The following endpoints are automatically available:

### Dashboard Endpoints

```bash
# Get active threats for organization
GET /api/security/dashboard/threats/active
  Query params: limit (default 50, max 100)
  Auth: Requires admin or security_admin role
  Response: { count, threats[] }

# Get threats grouped by type
GET /api/security/dashboard/threats/by-type
  Auth: Requires admin or security_admin role
  Response: [{ signal_type, severity, count, last_detected }]

# Get real-time metrics
GET /api/security/dashboard/metrics
  Auth: Requires admin or security_admin role
  Response: { activeThreats, failedLogins24h, crossOrgAttempts24h, sessionsRevoked24h }

# Get threat timeline
GET /api/security/dashboard/threat-timeline
  Query params: hours (default 24, max 168)
  Auth: Requires admin or security_admin role
  Response: [{ bucket, count, avg_score, max_score }]

# Get threat details
GET /api/security/dashboard/threat/:threatId
  Auth: Requires admin or security_admin role
  Response: { threat, relatedEvents[] }

# Get incidents
GET /api/security/dashboard/incidents
  Query params: status (open|investigating|resolved|closed), limit
  Auth: Requires admin or security_admin role
  Response: { count, incidents[] }

# Update incident
PATCH /api/security/dashboard/incident/:incidentId
  Body: { status, investigation_notes?, assigned_to? }
  Auth: Requires admin or security_admin role
  Response: incident

# Get IP reputation
GET /api/security/dashboard/ip-reputation/:ipAddress
  Auth: Requires admin or security_admin role
  Response: { reputation, threatEvents[], isBlocked }

# Get user anomalies
GET /api/security/dashboard/user/:userId/anomalies
  Auth: Requires admin or security_admin role
  Response: { anomalies, recentThreats[], accessHistory[] }

# Dismiss threat as false positive
POST /api/security/dashboard/threat/:threatId/dismiss
  Auth: Requires admin or security_admin role
  Response: threat

# Get detector status
GET /api/security/dashboard/detectors
  Auth: Requires admin or security_admin role
  Response: [{ id, detector_name, enabled, risk_threshold, ... }]

# Update detector configuration
PATCH /api/security/dashboard/detector/:detectorId
  Body: { enabled?, risk_threshold?, auto_response_enabled? }
  Auth: Requires admin or security_admin role
  Response: detector
```

---

## 7. Threat Detectors

### Active Detectors

| Detector | Event Type | Severity | Auto-Response |
|----------|-----------|----------|--------------|
| SQL Injection | database_query | CRITICAL | Revoke session |
| Cross-Org Access | api_access | CRITICAL | Revoke session |
| Brute Force | login_failed | HIGH/CRITICAL | Block IP |
| Impossible Travel | api_access | HIGH | Require MFA |
| Data Exfiltration | database_query | HIGH | Restrict access |
| Privilege Escalation | api_access | HIGH | Deny access |
| Token Anomaly | api_access | MEDIUM | Require re-auth |
| Rate Limit | api_access | MEDIUM | Block IP |

### Configuration

Each detector can be configured via `/api/security/dashboard/detectors`:

```json
{
  "id": "detector-uuid",
  "detector_name": "sql_injection",
  "display_name": "SQL Injection",
  "enabled": true,
  "risk_threshold": 85,
  "auto_response_enabled": true,
  "auto_response_action": "revoke_session"
}
```

---

## 8. Testing Integration

### Manual Testing

```bash
# 1. Start backend server
cd backend
npm run dev

# 2. In another terminal, trigger threat events

# Test: Failed login (brute force detection)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@test.com","password":"wrong"}'

# Repeat 6+ times to trigger brute force detection

# 3. Check dashboard
curl http://localhost:3000/api/security/dashboard/metrics \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Expected: failedLogins24h should be > 0
```

### Automated Testing

```bash
# Run threat detection tests
npm run test -- src/test/threatDetection.test.ts
```

---

## 9. Configuration

### Environment Variables

```bash
# .env (backend)

# Threat Detection
THREAT_DETECTION_ENABLED=true
THREAT_EVENT_RETENTION_DAYS=30
THREAT_AUTO_RESPONSE_ENABLED=true

# Detector Thresholds
THREAT_DETECTOR_SQL_INJECTION_THRESHOLD=85
THREAT_DETECTOR_BRUTE_FORCE_THRESHOLD=70
THREAT_DETECTOR_CROSS_ORG_THRESHOLD=90

# Rate Limiting for Threat Detection
THREAT_DETECTION_EVENTS_PER_SECOND=1000
THREAT_DETECTION_SIGNALS_BUFFER_SIZE=10000
```

---

## 10. Monitoring

### Key Metrics to Track

```sql
-- Total threats detected today
SELECT COUNT(*) FROM threat_signals WHERE detected_at > NOW() - INTERVAL '24 hours';

-- By severity
SELECT severity, COUNT(*) FROM threat_signals 
WHERE detected_at > NOW() - INTERVAL '24 hours'
GROUP BY severity;

-- False positive rate
SELECT 
  COUNT(CASE WHEN status = 'false_positive' THEN 1 END) * 100.0 / COUNT(*) as fp_rate
FROM threat_signals
WHERE detected_at > NOW() - INTERVAL '7 days';

-- Response latency
SELECT AVG(EXTRACT(EPOCH FROM (response_timestamp - detected_at))) as avg_response_time_sec
FROM threat_signals
WHERE auto_response_taken IS NOT NULL
AND detected_at > NOW() - INTERVAL '24 hours';
```

### Prometheus Metrics

```yaml
# These are automatically exported:
- threat_signals_total (counter)
- threat_signals_active (gauge)
- threat_events_ingested (counter)
- threat_detection_latency_ms (histogram)
- threat_detector_{name}_executions (counter)
- threat_detector_{name}_detections (counter)
```

---

## 11. Security Team Onboarding

### Checklist for Security Team

- [ ] Access to `/api/security/dashboard/` endpoints
- [ ] Dashboard user role is `security_admin`
- [ ] Understand threat severity levels
- [ ] Know how to view incident details
- [ ] Can update incident status and notes
- [ ] Understand auto-response actions
- [ ] Can dismiss false positives
- [ ] Know incident escalation procedure

### Incident Response Workflow

1. **Alert** → Threat detected (score > 70) → Real-time notification
2. **Investigate** → View threat details, related events, user history
3. **Classify** → Confirm threat or mark as false positive
4. **Respond** → If confirmed, take manual action (block IP, revoke sessions)
5. **Document** → Update incident with investigation notes
6. **Close** → Mark incident as resolved

---

## 12. Performance Considerations

### Database Indexing

All threat detection tables are pre-indexed for common queries:

```sql
-- Verify indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename LIKE 'threat_%' OR tablename IN ('ip_reputation', 'user_anomalies', 'login_failures')
ORDER BY tablename, indexname;
```

### Event Stream Limits

- **Max events/second**: Configurable via `THREAT_DETECTION_EVENTS_PER_SECOND`
- **Event retention**: 30 days (configurable)
- **Signal buffer**: Up to 10,000 active signals

### Scaling

For high-volume deployments, consider:

1. **Partitioning** `threat_events` by date
2. **Archiving** old events to S3
3. **Separate worker** for event processing (see `threatWorker.ts`)
4. **Redis Streams** for distributed processing

---

## 13. Troubleshooting

### No threats detected

```bash
# Check if threat engine initialized
curl http://localhost:3000/api/security/dashboard/detectors

# Verify detectors are enabled
SELECT * FROM threat_detectors WHERE enabled = true;

# Check event logs
SELECT * FROM threat_events ORDER BY detected_at DESC LIMIT 10;
```

### High false positive rate

```sql
-- Query false positives
SELECT signal_type, COUNT(*) 
FROM threat_signals 
WHERE status = 'false_positive'
GROUP BY signal_type;

-- Adjust threshold for problematic detector
UPDATE threat_detectors SET risk_threshold = 80 WHERE detector_name = 'rate_limit';
```

### Performance issues

```sql
-- Check largest threat tables
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE tablename LIKE 'threat_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Archive old events
DELETE FROM threat_events WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## 14. Next Steps

1. ✅ Apply database migration
2. ✅ Integrate with app server initialization
3. ✅ Wire auth module events
4. ✅ Deploy to staging
5. ✅ Validate threat detection with manual tests
6. ✅ Train security team
7. ✅ Gradual production rollout

---

## Support & Contact

- **Security Lead**: For threat response procedures
- **DevOps**: For monitoring and alerting setup
- **Database Team**: For performance tuning
