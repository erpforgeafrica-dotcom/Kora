/**
 * backend/src/middleware/threatEventCapture.ts
 * 
 * Capture security-relevant events for threat detection
 * Hooks into auth, API logging, and database queries
 */

import { Request, Response, NextFunction } from "express";
import { getThreatEngine } from "../services/threatDetection/threatEngine.js";
import { logger } from "../shared/logger.js";

/**
 * Middleware to capture API access events for threat detection
 */
export function captureThreatEvents(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const threatEngine = getThreatEngine();
  const originalJson = res.json;

  // Intercept response to capture events
  res.json = function (data: any) {
    // Capture threat events after response is sent
    setImmediate(() => {
      try {
        captureThreatContext(req, res, threatEngine);
      } catch (err) {
        logger.error("Failed to capture threat event", err);
      }
    });

    return originalJson.call(this, data);
  };

  next();
}

/**
 * Capture threat context from request/response
 */
async function captureThreatContext(
  req: Request,
  res: Response,
  threatEngine: any
): Promise<void> {
  const auth = res.locals.auth;
  if (!auth) return; // Skip unauthenticated requests for now

  const threatEvent = {
    organizationId: auth.organizationId,
    userId: auth.userId,
    eventType: "api_access",
    source: "api" as const,
    severity: "low" as const,
    threatScore: 0,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    sessionId: auth.sessionId,
    requestId: res.locals.requestId || req.headers["x-request-id"],
    metadata: {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      userRole: auth.role,
      timestamp: Date.now()
    }
  };

  // Only capture events for sensitive operations
  if (isSensitiveEndpoint(req.path, req.method)) {
    await threatEngine.ingestEvent(threatEvent);
  }
}

/**
 * Determine if endpoint is sensitive
 */
function isSensitiveEndpoint(path: string, method: string): boolean {
  const sensitivePatterns = [
    /^\/api\/auth\/.*/,
    /^\/api\/.*\/admin\/.*/,
    /^\/api\/bookings\/.*\/delete/,
    /^\/api\/clients\/.*\/data/,
    /^\/api\/finance\/.*\/export/,
    /^\/api\/schema\/.*/,
    { path: "/api/billing", methods: ["POST", "DELETE"] }
  ];

  return sensitivePatterns.some((pattern) => {
    if (typeof pattern === "string") {
      return path.includes(pattern);
    }
    if (pattern instanceof RegExp) {
      return pattern.test(path);
    }
    if (pattern.path && pattern.methods) {
      return path.startsWith(pattern.path) && pattern.methods.includes(method);
    }
    return false;
  });
}

/**
 * Capture login failure events
 */
export async function captureLoginFailure(
  email: string,
  organizationId: string,
  ipAddress: string,
  userAgent: string,
  failureReason: string
): Promise<void> {
  try {
    const threatEngine = getThreatEngine();

    // Store in database
    const { queryDb } = await import("../db/client.js");
    await queryDb(
      `INSERT INTO login_failures (identifier, organization_id, ip_address, user_agent, failure_reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [email, organizationId || null, ipAddress, userAgent, failureReason]
    );

    // Ingest for threat detection
    const threatEvent = {
      organizationId: organizationId || "SYSTEM",
      userId: email,
      eventType: "login_failed",
      source: "auth" as const,
      severity: "low" as const,
      threatScore: 10,
      ipAddress,
      userAgent,
      metadata: {
        email,
        failureReason,
        timestamp: Date.now()
      }
    };

    await threatEngine.ingestEvent(threatEvent);
  } catch (err) {
    logger.error("Failed to capture login failure", err);
  }
}

/**
 * Capture successful login events
 */
export async function captureLoginSuccess(
  userId: string,
  organizationId: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  try {
    const threatEngine = getThreatEngine();

    // Reset failure counter
    const { getRedisClient } = await import("../shared/redis.js");
    const redis = getRedisClient();
    
    const { queryDb } = await import("../db/client.js");
    const userEmail = (
      await queryDb(`SELECT email FROM users WHERE id = $1`, [userId])
    )[0]?.email;

    if (userEmail) {
      await redis.del(`login:failures:${userEmail}`);
    }

    // Ingest for threat detection
    const threatEvent = {
      organizationId,
      userId,
      eventType: "login_success",
      source: "auth" as const,
      severity: "low" as const,
      threatScore: 0,
      ipAddress,
      userAgent,
      metadata: {
        timestamp: Date.now()
      }
    };

    await threatEngine.ingestEvent(threatEvent);
  } catch (err) {
    logger.error("Failed to capture login success", err);
  }
}

/**
 * Capture database query events (for SQL injection detection)
 */
export async function captureDatabaseEvent(
  userId: string,
  organizationId: string,
  query: string,
  params: any[],
  success: boolean
): Promise<void> {
  try {
    const threatEngine = getThreatEngine();

    const threatEvent = {
      organizationId,
      userId,
      eventType: "database_query",
      source: "database" as const,
      severity: success ? "low" : "medium",
      threatScore: success ? 0 : 20,
      metadata: {
        query: query.substring(0, 200), // Truncate for storage
        params: params.slice(0, 5), // Only first 5 params
        paramCount: params.length,
        success,
        timestamp: Date.now()
      }
    };

    await threatEngine.ingestEvent(threatEvent);
  } catch (err) {
    logger.error("Failed to capture database event", err);
  }
}

/**
 * Capture cross-org access attempts
 */
export async function captureCrossOrgAttempt(
  userId: string,
  userOrgId: string,
  attemptedOrgId: string,
  resourceType: string,
  resourceId: string,
  ipAddress: string
): Promise<void> {
  try {
    const threatEngine = getThreatEngine();

    const threatEvent = {
      organizationId: userOrgId,
      userId,
      eventType: "cross_org_access_attempt",
      source: "api" as const,
      severity: "critical" as const,
      threatScore: 95,
      ipAddress,
      metadata: {
        userOrgId,
        attemptedOrgId,
        resourceType,
        resourceId,
        timestamp: Date.now()
      }
    };

    await threatEngine.ingestEvent(threatEvent);
  } catch (err) {
    logger.error("Failed to capture cross-org attempt", err);
  }
}

/**
 * Capture suspicious data access
 */
export async function captureSuspiciousDataAccess(
  userId: string,
  organizationId: string,
  resourceType: string,
  rowsReturned: number,
  ipAddress: string
): Promise<void> {
  try {
    const threatEngine = getThreatEngine();

    const threatEvent = {
      organizationId,
      userId,
      eventType: "data_access",
      source: "database" as const,
      severity: rowsReturned > 10000 ? "high" : "medium",
      threatScore: Math.min(rowsReturned / 100, 80),
      ipAddress,
      metadata: {
        resourceType,
        rowsReturned,
        timestamp: Date.now()
      }
    };

    await threatEngine.ingestEvent(threatEvent);
  } catch (err) {
    logger.error("Failed to capture data access", err);
  }
}

/**
 * Capture privilege escalation attempts
 */
export async function capturePrivilegeEscalation(
  userId: string,
  organizationId: string,
  userRole: string,
  attemptedAction: string,
  ipAddress: string
): Promise<void> {
  try {
    const threatEngine = getThreatEngine();

    const threatEvent = {
      organizationId,
      userId,
      eventType: "privilege_escalation_attempt",
      source: "api" as const,
      severity: "high" as const,
      threatScore: 80,
      ipAddress,
      metadata: {
        userRole,
        attemptedAction,
        timestamp: Date.now()
      }
    };

    await threatEngine.ingestEvent(threatEvent);
  } catch (err) {
    logger.error("Failed to capture privilege escalation", err);
  }
}

/**
 * Capture rate limit violations
 */
export async function captureRateLimitViolation(
  identifier: string,
  ipAddress: string,
  requestCount: number
): Promise<void> {
  try {
    const threatEngine = getThreatEngine();

    const threatEvent = {
      organizationId: "SYSTEM",
      eventType: "rate_limit_exceeded",
      source: "api" as const,
      severity: requestCount > 200 ? "high" : "medium",
      threatScore: Math.min(requestCount / 2, 70),
      ipAddress,
      metadata: {
        identifier,
        requestCount,
        timestamp: Date.now()
      }
    };

    await threatEngine.ingestEvent(threatEvent);
  } catch (err) {
    logger.error("Failed to capture rate limit", err);
  }
}
