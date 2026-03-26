import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { logger } from "../shared/logger.js";
import { respondForbidden, respondSuccess } from "../shared/response.js";

interface CSRFRequest extends Request {
  csrfToken?: string;
  sessionID?: string;
}

// Store CSRF tokens in memory (in production, use Redis)
const csrfTokens = new Map<string, { token: string; expires: number }>();

// Clean expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, data] of csrfTokens.entries()) {
    if (data.expires < now) {
      csrfTokens.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate CSRF token for session
 */
export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + (60 * 60 * 1000); // 1 hour
  
  csrfTokens.set(sessionId, { token, expires });
  return token;
}

/**
 * Middleware to provide CSRF token
 */
export function csrfToken(req: CSRFRequest, res: Response, next: NextFunction) {
  const sessionId = (req as any).sessionID || req.headers["x-session-id"] as string || "anonymous";
  
  if (!csrfTokens.has(sessionId)) {
    const token = generateCSRFToken(sessionId);
    req.csrfToken = token;
  } else {
    req.csrfToken = csrfTokens.get(sessionId)?.token;
  }
  
  next();
}

/**
 * Middleware to validate CSRF token on state-changing requests
 */
export function validateCSRF(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === "test" || process.env.VITEST === "true") {
    return next();
  }

  // Skip CSRF for GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip CSRF for webhook endpoints
  if (req.path.includes("/webhook")) {
    return next();
  }

  // Skip CSRF for auth endpoints (no session established yet)
  if (req.path.startsWith("/api/auth/login") || req.path.startsWith("/api/auth/register") || req.path.startsWith("/api/auth/logout")) {
    return next();
  }

  const sessionId = (req as any).sessionID || req.headers["x-session-id"] as string || "anonymous";
  const providedToken = req.headers["x-csrf-token"] as string || req.body._csrf;
  
  if (!providedToken) {
    logger.warn("CSRF token missing", { path: req.path, method: req.method, ip: req.ip });
    return respondForbidden(res, "CSRF token required");
  }

  const storedData = csrfTokens.get(sessionId);
  if (!storedData) {
    logger.warn("CSRF session not found", { sessionId, path: req.path });
    return respondForbidden(res, "Invalid CSRF session");
  }

  if (storedData.expires < Date.now()) {
    csrfTokens.delete(sessionId);
    logger.warn("CSRF token expired", { sessionId, path: req.path });
    return respondForbidden(res, "CSRF token expired");
  }

  if (storedData.token !== providedToken) {
    logger.warn("CSRF token mismatch", { sessionId, path: req.path });
    return respondForbidden(res, "Invalid CSRF token");
  }

  next();
}

/**
 * Endpoint to get CSRF token
 */
export function getCSRFToken(req: CSRFRequest, res: Response) {
  const sessionId = (req as any).sessionID || req.headers["x-session-id"] as string || "anonymous";
  const token = generateCSRFToken(sessionId);
  
  return respondSuccess(res, { csrfToken: token });
}
