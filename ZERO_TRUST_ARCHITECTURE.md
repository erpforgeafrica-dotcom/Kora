# Zero Trust Architecture for KORA Platform

**Date**: April 29, 2026  
**Phase**: Security Hardening (Phase 10+)  
**Scope**: Full platform (frontend + backend + database)  
**Threat Model**: Multi-tenant data leaks, API abuse, insider threats, DDoS, cross-org access  
**Timeline**: 8 weeks implementation  

---

## Executive Summary

Zero Trust is a security paradigm that **assumes no trust by default**—every request, user, and system must be verified and authorized, regardless of origin. For KORA's multi-tenant healthcare platform, this is critical to prevent:

- ✅ Cross-organization data leaks
- ✅ Privilege escalation attacks
- ✅ Insider threats (compromised employee credentials)
- ✅ API abuse and lateral movement
- ✅ Database injection and unauthorized queries

**Implementation Strategy**: 5-tier model covering frontend → network → API → database → analytics

---

## 1. Zero Trust Policy Architecture

### 1.1 Core Principles

```
┌─────────────────────────────────────────────────────────────┐
│ ZERO TRUST POLICY MODEL                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. Verify Every Request (Never Trust by Default)           │
│    - Every API call requires valid auth + org context      │
│    - Every database query must be org-scoped               │
│    - Frontend must validate auth state on every route      │
│                                                             │
│ 2. Least Privilege Access (Minimum Permissions)            │
│    - Users get only permissions they need, nothing more    │
│    - Roles: admin, business_admin, staff, customer         │
│    - Actions scoped to organization + resource types       │
│                                                             │
│ 3. Continuous Verification (Monitor + Revoke)              │
│    - Session validation on every request                   │
│    - Real-time threat detection for anomalies              │
│    - Automatic session revocation on suspicious activity   │
│                                                             │
│ 4. Assume Breach (Defense in Depth)                        │
│    - Encrypt data at rest and in transit                   │
│    - Segment network by trust zone (frontend/API/DB)       │
│    - Audit all access attempts (success + failure)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Trust Zones & Boundaries

```typescript
// Trust Zone Model: Verify at Each Boundary

enum TrustZone {
  FRONTEND = "frontend",           // User device (untrusted)
  EDGE = "edge",                   // CDN / reverse proxy
  API_GATEWAY = "api-gateway",     // Request validation
  SERVICE_MESH = "service-mesh",   // Inter-service auth
  DATABASE = "database",           // Data access control
  ANALYTICS = "analytics"          // Audit logging
}

interface ZeroTrustRequest {
  // Tier 1: Frontend → API Gateway
  userId: string;                   // verified in JWT
  organizationId: string;          // extracted from session
  sessionId: string;               // cryptographically signed
  
  // Tier 2: API Gateway → Service
  requestId: string;               // correlation for audit
  ipAddress: string;               // geoIP validation
  userAgent: string;               // device fingerprinting
  csrfToken?: string;              // double-submit cookie
  
  // Tier 3: Service → Database
  orgScope: string;                // org_id filter on all queries
  userScope: string;               // user_id filter where applicable
  actionType: "read" | "write" | "delete";
  resourceType: string;            // entity being accessed
  
  // Tier 4: Audit Trail
  timestamp: string;               // ISO 8601
  outcome: "success" | "failure";
  threatScore?: number;            // risk assessment
}
```

---

## 2. Implementation Layers

### Layer 1: Frontend Trust Verification

```typescript
// frontend/src/middleware/zeroTrust.ts

import { useAuth } from "@clerk/clerk-react";
import { useContext } from "react";

/**
 * Zero Trust Frontend Guard
 * Verifies auth state, session validity, and org context
 */
export function useZeroTrustGuard() {
  const { isLoaded, isSignedIn, user, sessionId } = useAuth();
  
  return {
    isValidated: isLoaded && isSignedIn && !!sessionId && !!user?.organizationId,
    
    // Verify org context on every navigation
    validateOrgContext: (requiredOrgId: string) => {
      if (!user?.organizationId) {
        throw new SecurityError("Organization context missing");
      }
      if (user.organizationId !== requiredOrgId) {
        throw new SecurityError("Cross-org access attempt detected");
      }
      return true;
    },
    
    // Validate session still active
    validateSession: async () => {
      const response = await fetch("/api/auth/validate-session", {
        method: "POST",
        credentials: "include", // httpOnly cookies
        headers: { "Content-Type": "application/json" }
      });
      
      if (!response.ok) {
        // Session expired/revoked - log out
        window.location.href = "/login";
        throw new SecurityError("Session invalid or revoked");
      }
      
      return response.json();
    },
    
    // Block untrusted JavaScript
    checkForXSS: () => {
      // Verify localStorage doesn't contain sensitive tokens
      if (localStorage.getItem("jwt_token")) {
        throw new SecurityError("XSS vulnerability: JWT in localStorage");
      }
    }
  };
}

// Route-level enforcement
export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredOrgId 
}: {
  children: React.ReactNode;
  requiredRole?: string;
  requiredOrgId?: string;
}) {
  const guard = useZeroTrustGuard();
  
  if (!guard.isValidated) {
    return <RedirectToLogin />;
  }
  
  if (requiredOrgId) {
    guard.validateOrgContext(requiredOrgId);
  }
  
  if (requiredRole && !hasRole(requiredRole)) {
    return <AccessDenied />;
  }
  
  return <>{children}</>;
}
```

### Layer 2: API Gateway & Request Validation

```typescript
// backend/src/middleware/zeroTrustGateway.ts

import { Request, Response, NextFunction } from "express";
import { createHash, randomBytes } from "crypto";
import { logger } from "../shared/logger.js";

interface ZeroTrustContext {
  userId: string;
  organizationId: string;
  sessionId: string;
  role: string;
  threatScore: number;
  requestId: string;
  timestamp: Date;
  ipAddress: string;
}

/**
 * Zero Trust Gateway: Validate every request at entry point
 */
export async function zeroTrustGateway(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = randomBytes(16).toString("hex");
  const startTime = Date.now();
  
  try {
    // 1. Extract and validate JWT from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return logSecurityEvent("MISSING_AUTH", req, requestId, 100);
    }
    
    const token = authHeader.slice(7);
    const decoded = verifyJWT(token);
    
    if (!decoded) {
      return logSecurityEvent("INVALID_TOKEN", req, requestId, 100);
    }
    
    // 2. Validate session signature (httpOnly cookie)
    const sessionId = req.cookies.session_id;
    const sessionSig = req.cookies.session_sig;
    
    if (!validateSessionSignature(sessionId, sessionSig)) {
      return logSecurityEvent("INVALID_SESSION", req, requestId, 100);
    }
    
    // 3. Load and validate session state
    const session = await loadSession(sessionId);
    if (!session || isSessionExpired(session)) {
      return logSecurityEvent("SESSION_EXPIRED", req, requestId, 100);
    }
    
    // 4. Verify JWT claims match session
    if (decoded.sub !== session.userId) {
      return logSecurityEvent("TOKEN_MISMATCH", req, requestId, 100);
    }
    
    // 5. Check IP reputation (threat detection)
    const ipThreatScore = await checkIPReputation(req.ip);
    if (ipThreatScore > 80) {
      return logSecurityEvent("MALICIOUS_IP", req, requestId, 95);
    }
    
    // 6. Check for rate limit violations
    const rateLimitViolation = await checkRateLimit(
      session.userId,
      session.organizationId
    );
    if (rateLimitViolation) {
      return logSecurityEvent("RATE_LIMIT_EXCEEDED", req, requestId, 70);
    }
    
    // 7. Build zero trust context
    const ztContext: ZeroTrustContext = {
      userId: decoded.sub,
      organizationId: decoded.organizationId,
      sessionId,
      role: decoded.role,
      threatScore: Math.max(
        ipThreatScore,
        rateLimitViolation ? 60 : 0,
        detectAnomalies(session) ? 50 : 0
      ),
      requestId,
      timestamp: new Date(),
      ipAddress: req.ip
    };
    
    // Store in request context
    res.locals.zt = ztContext;
    
    // 8. Log valid request
    logger.info("ZeroTrust Gateway: Request validated", {
      requestId,
      userId: ztContext.userId,
      organizationId: ztContext.organizationId,
      threatScore: ztContext.threatScore,
      latency: Date.now() - startTime
    });
    
    next();
    
  } catch (err) {
    logSecurityEvent("GATEWAY_ERROR", req, requestId, 80, err);
  }
}

/**
 * Continuous Session Validation Middleware
 * Re-verify session every 5 minutes
 */
export function continuousSessionValidation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const zt = res.locals.zt as ZeroTrustContext;
  const session = getSession(zt.sessionId);
  
  // Check if session needs refresh
  if (Date.now() - session.lastValidated > 5 * 60 * 1000) {
    // Re-validate against database
    const valid = validateSessionAgainstDB(zt.sessionId);
    if (!valid) {
      return res.status(401).json({ error: "Session revoked" });
    }
    session.lastValidated = Date.now();
  }
  
  next();
}

/**
 * Detect anomalous patterns
 */
function detectAnomalies(session: any): boolean {
  const anomalies = [
    // 1. Impossible travel: user in NYC 2 minutes ago, now in Tokyo
    session.lastIpAddress && 
    calculateGeoDistance(session.lastIpAddress, session.ipAddress) > 2000 &&
    Date.now() - session.lastActivityTime < 2 * 60 * 1000,
    
    // 2. Off-hours access (3 AM when they normally sleep)
    isOffHoursAccess(session),
    
    // 3. Unusual user agent (mobile when always desktop)
    isUnusualUserAgent(session),
    
    // 4. Access to sensitive endpoint without recent MFA
    isSensitiveEndpointWithoutMFA(session)
  ];
  
  return anomalies.some(a => a);
}

function logSecurityEvent(
  eventType: string,
  req: Request,
  requestId: string,
  threatScore: number,
  error?: any
) {
  logger.warn(`Security Event: ${eventType}`, {
    requestId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    path: req.path,
    threatScore,
    error: error?.message
  });
  
  // Trigger real-time alert if high threat
  if (threatScore > 75) {
    notifySecurityTeam({
      eventType,
      requestId,
      ip: req.ip,
      threatScore,
      timestamp: new Date()
    });
  }
}
```

### Layer 3: Service-Level Authorization

```typescript
// backend/src/middleware/zeroTrustAuthorization.ts

/**
 * Zero Trust: Service-Level Permission Check
 * Before any business logic, verify user has permission
 */
export async function authorizeAction(
  userId: string,
  organizationId: string,
  action: "read" | "write" | "delete",
  resourceType: string,
  resourceId?: string
): Promise<void> {
  // 1. Get user role and permissions
  const user = await getUserWithPermissions(userId, organizationId);
  
  if (!user) {
    throw new SecurityError("User not found in organization");
  }
  
  // 2. Check if action is allowed by role
  const rolePermissions = getRolePermissions(user.role);
  if (!rolePermissions[resourceType]?.includes(action)) {
    logger.warn("Authorization denied", {
      userId,
      organizationId,
      action,
      resourceType
    });
    throw new ForbiddenError("Action not permitted");
  }
  
  // 3. If specific resource, verify ownership (multi-tenant check)
  if (resourceId) {
    const resource = await getResource(resourceType, resourceId);
    if (resource.organization_id !== organizationId) {
      logger.error("Cross-org access attempt", {
        userId,
        attemptedOrgId: resource.organization_id,
        actualOrgId: organizationId,
        resourceId
      });
      throw new SecurityError("Cross-organization access denied");
    }
  }
}

// Example usage in routes
router.get("/bookings/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const zt = res.locals.zt;
    
    // Verify permission before querying
    await authorizeAction(
      zt.userId,
      zt.organizationId,
      "read",
      "bookings",
      id
    );
    
    // Safe to query - org scope enforced
    const booking = await queryDb(
      `SELECT * FROM bookings 
       WHERE id = $1 AND organization_id = $2`,
      [id, zt.organizationId]
    );
    
    res.json(booking);
  } catch (err) {
    next(err);
  }
});
```

### Layer 4: Database Query Enforcement

```typescript
// backend/src/db/zeroTrustQueries.ts

/**
 * Zero Trust Database Layer
 * Every query MUST include org_id filter
 */
export class ZeroTrustRepository {
  private organizationId: string;
  
  constructor(organizationId: string) {
    if (!organizationId) {
      throw new SecurityError("Organization context required");
    }
    this.organizationId = organizationId;
  }
  
  // READ with automatic org scoping
  async findById(table: string, id: string): Promise<any> {
    const query = `
      SELECT * FROM ${this.escapeTable(table)}
      WHERE id = $1 AND organization_id = $2
      LIMIT 1
    `;
    
    const [row] = await queryDb(query, [id, this.organizationId]);
    return row;
  }
  
  // LIST with automatic org scoping
  async list(table: string, filters: Record<string, any> = {}) {
    const conditions = [`organization_id = $1`];
    const params = [this.organizationId];
    
    Object.entries(filters).forEach(([key, value], i) => {
      conditions.push(`${this.escapeColumn(key)} = $${i + 2}`);
      params.push(value);
    });
    
    const query = `
      SELECT * FROM ${this.escapeTable(table)}
      WHERE ${conditions.join(" AND ")}
      LIMIT 100
    `;
    
    return queryDb(query, params);
  }
  
  // CREATE with automatic org scoping
  async create(table: string, data: Record<string, any>) {
    const columns = ["organization_id", ...Object.keys(data)];
    const values = [this.organizationId, ...Object.values(data)];
    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
    
    const query = `
      INSERT INTO ${this.escapeTable(table)} (${columns.join(", ")})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const [row] = await queryDb(query, values);
    return row;
  }
  
  // UPDATE with automatic org scoping
  async update(table: string, id: string, data: Record<string, any>) {
    const setClause = Object.keys(data)
      .map((key, i) => `${this.escapeColumn(key)} = $${i + 3}`)
      .join(", ");
    
    const query = `
      UPDATE ${this.escapeTable(table)}
      SET ${setClause}
      WHERE id = $1 AND organization_id = $2
      RETURNING *
    `;
    
    const params = [id, this.organizationId, ...Object.values(data)];
    const [row] = await queryDb(query, params);
    return row;
  }
  
  // DELETE with automatic org scoping + soft delete
  async delete(table: string, id: string) {
    const query = `
      UPDATE ${this.escapeTable(table)}
      SET deleted_at = NOW(), deleted_by = $1
      WHERE id = $2 AND organization_id = $3
      RETURNING *
    `;
    
    const [row] = await queryDb(query, [this.deletedByUserId, id, this.organizationId]);
    return row;
  }
  
  private escapeTable(name: string): string {
    if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
      throw new Error(`Invalid table name: ${name}`);
    }
    return `"${name}"`;
  }
  
  private escapeColumn(name: string): string {
    if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
      throw new Error(`Invalid column name: ${name}`);
    }
    return `"${name}"`;
  }
}

// Usage in services
export const bookingService = {
  async getBooking(organizationId: string, bookingId: string) {
    const repo = new ZeroTrustRepository(organizationId);
    return repo.findById("bookings", bookingId); // org_id automatically filtered!
  }
};
```

---

## 3. Real-Time Threat Detection

### 3.1 Threat Detection Engine

```typescript
// backend/src/services/threatDetection.ts

interface ThreatSignal {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  userId: string;
  organizationId: string;
  timestamp: Date;
  details: Record<string, any>;
}

/**
 * Real-Time Threat Detection Engine
 * Monitors and aggregates security events
 */
export class ThreatDetectionEngine {
  private signals: Map<string, ThreatSignal[]> = new Map();
  
  /**
   * Detect cross-organization access attempts
   */
  async detectCrossOrgAccess(event: any): Promise<void> {
    if (event.attemptedOrgId !== event.actualOrgId) {
      const signal: ThreatSignal = {
        type: "CROSS_ORG_ACCESS",
        severity: "critical",
        userId: event.userId,
        organizationId: event.actualOrgId,
        timestamp: new Date(),
        details: {
          attemptedOrgId: event.attemptedOrgId,
          resourceId: event.resourceId,
          resourceType: event.resourceType
        }
      };
      
      await this.escalateThreat(signal);
    }
  }
  
  /**
   * Detect privilege escalation (user suddenly accessing admin resources)
   */
  async detectPrivilegeEscalation(
    userId: string,
    organizationId: string,
    action: string
  ): Promise<void> {
    const userHistory = await getUserAccessHistory(userId, organizationId);
    const userRole = userHistory[0]?.role;
    
    // Flag if non-admin user accesses admin endpoint
    if (userRole !== "admin" && action.includes("admin")) {
      const signal: ThreatSignal = {
        type: "PRIVILEGE_ESCALATION",
        severity: "high",
        userId,
        organizationId,
        timestamp: new Date(),
        details: {
          userRole,
          attemptedAction: action
        }
      };
      
      await this.escalateThreat(signal);
    }
  }
  
  /**
   * Detect impossible travel (user in two locations too quickly)
   */
  async detectImpossibleTravel(
    userId: string,
    currentIp: string,
    timestamp: Date
  ): Promise<void> {
    const lastAccess = await getLastUserAccess(userId);
    
    if (!lastAccess) return;
    
    const distance = calculateGeoDistance(lastAccess.ip, currentIp);
    const timeDelta = timestamp.getTime() - lastAccess.timestamp.getTime();
    const maxSpeed = 900; // km/h (max commercial flight speed)
    
    if (distance / (timeDelta / 3600000) > maxSpeed) {
      const signal: ThreatSignal = {
        type: "IMPOSSIBLE_TRAVEL",
        severity: "high",
        userId,
        organizationId: lastAccess.organizationId,
        timestamp,
        details: {
          lastLocation: lastAccess.ip,
          currentLocation: currentIp,
          distance,
          timeDelta
        }
      };
      
      await this.escalateThreat(signal);
    }
  }
  
  /**
   * Detect brute force attacks (multiple failed logins)
   */
  async detectBruteForce(email: string): Promise<void> {
    const recentFailures = await getRecentLoginFailures(email);
    
    if (recentFailures.length > 5) {
      // 5+ failures in 15 minutes = brute force
      const signal: ThreatSignal = {
        type: "BRUTE_FORCE_ATTACK",
        severity: "critical",
        userId: email,
        organizationId: "SYSTEM",
        timestamp: new Date(),
        details: {
          failureCount: recentFailures.length,
          timeWindow: "15 minutes",
          ips: [...new Set(recentFailures.map(f => f.ip))]
        }
      };
      
      await this.escalateThreat(signal);
      
      // Automatically lock account
      await lockAccountTemporarily(email);
    }
  }
  
  /**
   * Detect data exfiltration (unusual data access patterns)
   */
  async detectDataExfiltration(
    userId: string,
    organizationId: string,
    dataSize: number
  ): Promise<void> {
    const baseline = await getUserDataAccessBaseline(userId, organizationId);
    
    // Flag if user suddenly accessing 10x more data
    if (dataSize > baseline.avgAccessSize * 10) {
      const signal: ThreatSignal = {
        type: "DATA_EXFILTRATION_ATTEMPT",
        severity: "high",
        userId,
        organizationId,
        timestamp: new Date(),
        details: {
          dataSize,
          baselineSize: baseline.avgAccessSize,
          multiplier: dataSize / baseline.avgAccessSize
        }
      };
      
      await this.escalateThreat(signal);
    }
  }
  
  /**
   * Escalate threat: log, alert, revoke session if critical
   */
  private async escalateThreat(signal: ThreatSignal): Promise<void> {
    // 1. Log to audit trail
    await logThreatSignal(signal);
    
    // 2. Send real-time alert to security team
    if (signal.severity === "critical" || signal.severity === "high") {
      await notifySecurityTeam(signal);
    }
    
    // 3. Revoke session if critical
    if (signal.severity === "critical") {
      await revokeUserSession(signal.userId);
    }
  }
}
```

### 3.2 Real-Time Alerting

```typescript
// backend/src/services/realtimeAlerts.ts

/**
 * Real-Time Alert System
 * Sends immediate notifications for high-severity threats
 */
export class RealtimeAlertService {
  private wsServer: WebSocketServer;
  private alertChannels = new Map<string, Set<string>>();
  
  constructor(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
  }
  
  /**
   * Subscribe security team to threat alerts
   */
  subscribeSecurityTeam(userId: string): void {
    if (!this.alertChannels.has("security-team")) {
      this.alertChannels.set("security-team", new Set());
    }
    this.alertChannels.get("security-team")?.add(userId);
  }
  
  /**
   * Broadcast alert to all connected security team members
   */
  async broadcastThreatAlert(threat: ThreatSignal): Promise<void> {
    const team = this.alertChannels.get("security-team") || new Set();
    
    const payload = {
      type: "THREAT_ALERT",
      threat: {
        type: threat.type,
        severity: threat.severity,
        userId: threat.userId,
        organizationId: threat.organizationId,
        timestamp: threat.timestamp,
        details: threat.details
      },
      timestamp: new Date()
    };
    
    // Send via WebSocket
    team.forEach(userId => {
      this.wsServer.to(userId).emit("threat-alert", payload);
    });
    
    // Send email if critical
    if (threat.severity === "critical") {
      await sendCriticalAlertEmail(payload);
    }
    
    // Send SMS if critical + on-call
    if (threat.severity === "critical") {
      const onCallSecurityLead = await getOnCallSecurityLead();
      if (onCallSecurityLead) {
        await sendSMSAlert(onCallSecurityLead.phone, threat);
      }
    }
  }
}

// Usage in threat detection
threatEngine.on("threat-detected", async (threat: ThreatSignal) => {
  await alertService.broadcastThreatAlert(threat);
});
```

---

## 4. Monitoring & Observability

### 4.1 Security Dashboard

```typescript
// backend/src/modules/security/dashboardService.ts

/**
 * Real-Time Security Dashboard Metrics
 */
export const securityDashboard = {
  // Last 24 hours metrics
  getSecurityMetrics: async (organizationId?: string) => ({
    activeThreats: await getActiveThreatCount(organizationId),
    failedLogins: await getFailedLoginCount(organizationId),
    crossOrgAttempts: await getCrossOrgAttemptCount(organizationId),
    sessionRevocations: await getSessionRevocationCount(organizationId),
    anomalies: await getAnomalyCount(organizationId),
    
    timeline: {
      // Threats over time (1-hour buckets)
      threatTimeline: await getThreatTimeline(organizationId, "1 hour"),
      
      // Access patterns
      accessPatterns: await getAccessPatternTimeline(organizationId),
      
      // Failed authentication attempts
      failedAuthTimeline: await getFailedAuthTimeline(organizationId)
    },
    
    topThreats: await getTopThreats(organizationId, 10),
    topAttackedResources: await getTopAttackedResources(organizationId, 10),
    topAttackers: await getTopAttackingIps(organizationId, 10)
  }),
  
  // Endpoint for real-time dashboard
  router: (app) => {
    app.get("/api/security/dashboard", requireAuth, async (req, res) => {
      const orgId = res.locals.auth.organizationId;
      
      // Only admins can view security dashboard
      if (res.locals.auth.role !== "admin") {
        throw new ForbiddenError("Requires admin role");
      }
      
      const metrics = await securityDashboard.getSecurityMetrics(orgId);
      res.json(metrics);
    });
  }
};
```

---

## 5. Rollout Plan (8 Weeks)

### Week 1-2: Foundation
- [ ] Implement zero trust gateway middleware
- [ ] Deploy session validation
- [ ] Enable continuous session monitoring
- [ ] Set up threat detection engine

### Week 3-4: Authorization
- [ ] Implement service-level authorization checks
- [ ] Add role-based permission enforcement
- [ ] Audit all existing routes for org scoping

### Week 5-6: Database Security
- [ ] Migrate repositories to ZeroTrustRepository pattern
- [ ] Add audit logging to all queries
- [ ] Enable query encryption

### Week 7-8: Detection & Response
- [ ] Deploy real-time threat detection
- [ ] Configure security dashboards
- [ ] Set up automated alerting
- [ ] Train security team on new tools

---

## 6. Configuration

```bash
# .env

# Zero Trust Configuration
ZERO_TRUST_ENABLED=true
ZERO_TRUST_STRICT_MODE=false  # Enabled in prod only

# Threat Detection
THREAT_DETECTION_ENABLED=true
THREAT_ALERT_THRESHOLD=70
THREAT_CRITICAL_THRESHOLD=85
THREAT_REVOKE_SESSION_THRESHOLD=95

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_BURST_ALLOWED=150

# IP Reputation
IP_REPUTATION_CHECK_ENABLED=true
IP_REPUTATION_API=https://api.abuseipdb.com/api/v2/

# Session Validation
SESSION_VALIDATION_INTERVAL_MS=300000  # 5 minutes
SESSION_TIMEOUT_MS=86400000             # 24 hours
SESSION_IDLE_TIMEOUT_MS=3600000         # 1 hour
```

---

## 7. Testing Strategy

```typescript
// backend/src/test/zeroTrust.test.ts

describe("Zero Trust Architecture", () => {
  it("should block requests without valid JWT", async () => {
    const res = await request(app)
      .get("/api/bookings")
      .set("Authorization", "Bearer invalid");
    
    expect(res.status).toBe(401);
  });
  
  it("should block cross-org access attempts", async () => {
    const user = createTestUser("org_1");
    const booking = createTestBooking("org_2");
    
    const res = await request(app)
      .get(`/api/bookings/${booking.id}`)
      .set("Authorization", `Bearer ${user.token}`);
    
    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Cross-organization");
  });
  
  it("should detect impossible travel", async () => {
    const user = createTestUser("org_1");
    
    // First request from NYC
    await request(app)
      .get("/api/bookings")
      .set("X-Forwarded-For", "1.1.1.1") // NYC IP
      .set("Authorization", `Bearer ${user.token}`);
    
    // Immediate request from Tokyo
    const res = await request(app)
      .get("/api/bookings")
      .set("X-Forwarded-For", "2.2.2.2") // Tokyo IP
      .set("Authorization", `Bearer ${user.token}`);
    
    // Should be blocked
    expect(res.status).toBe(401);
  });
});
```

---

## Next Steps

1. **Review & Approve**: Share this with security team
2. **Pilot Phase**: Deploy to staging (1 week)
3. **Production Rollout**: Gradual rollout with feature flags
4. **Training**: Security team workshop on new tools
5. **Continuous Improvement**: Monitor metrics, adjust thresholds

---

**Security Team Lead**: Please review and validate threat detection thresholds  
**DevOps Lead**: Prepare staging environment for pilot deployment  
**Product Lead**: Communicate to customers about enhanced security
