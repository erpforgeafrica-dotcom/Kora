import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { Redis } from "ioredis";
import { logger } from "../shared/logger.js";
import { respondForbidden, respondSuccess } from "../shared/response.js";

interface CSRFRequest extends Request {
  csrfToken?: string;
  sessionID?: string;
}

// Redis client for CSRF token storage (DB 2)
const redisOptions = process.env.REDIS_URL 
  ? { maxRetriesPerRequest: 3 }
  : {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      db: 2, // Use DB 2 for CSRF (0 = BullMQ, 1 = cache)
      maxRetriesPerRequest: 3,
    };
const redisCsrf = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, redisOptions) 
  : new Redis(redisOptions);

redisCsrf.on("error", (err: Error) => {
  logger.error("Redis CSRF error", { 
    message: err.message,
    stack: err.stack,
  });
});

// Fallback in-memory store for test environments without Redis
const csrfTokenMemory = new Map<string, { token: string; expires: number }>();

/**
 * Get CSRF token storage helper
 */
async function getCSRFToken(sessionId: string): Promise<string | null> {
  try {
    return await redisCsrf.get(`csrf:${sessionId}`);
  } catch (err) {
    logger.warn("Redis CSRF get failed, falling back to memory", { sessionId, error: String(err) });
    const data = csrfTokenMemory.get(sessionId);
    return data && data.expires > Date.now() ? data.token : null;
  }
}

/**
 * Set CSRF token storage helper
 */
async function setCSRFToken(sessionId: string, token: string, ttlSeconds: number): Promise<void> {
  try {
    await redisCsrf.setex(`csrf:${sessionId}`, ttlSeconds, token);
  } catch (err) {
    logger.warn("Redis CSRF set failed, falling back to memory", { sessionId, error: String(err) });
    csrfTokenMemory.set(sessionId, { token, expires: Date.now() + ttlSeconds * 1000 });
  }
}

/**
 * Delete CSRF token storage helper
 */
async function deleteCSRFToken(sessionId: string): Promise<void> {
  try {
    await redisCsrf.del(`csrf:${sessionId}`);
  } catch (err) {
    logger.warn("Redis CSRF delete failed, falling back to memory", { sessionId, error: String(err) });
    csrfTokenMemory.delete(sessionId);
  }
}

/**
 * Generate CSRF token for session (Redis-backed)
 */
export async function generateCSRFToken(sessionId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const ttlSeconds = 60 * 60; // 1 hour
  await setCSRFToken(sessionId, token, ttlSeconds);
  return token;
}

/**
 * Middleware to provide CSRF token (Redis-backed)
 */
export function csrfToken(req: CSRFRequest, res: Response, next: NextFunction) {
  const sessionId = (req as any).sessionID || req.headers["x-session-id"] as string || crypto.randomBytes(16).toString("hex");
  
  (async () => {
    try {
      let token = await getCSRFToken(sessionId);
      if (!token) {
        token = await generateCSRFToken(sessionId);
      }
      req.csrfToken = token;
      res.locals.sessionId = sessionId;
      next();
    } catch (err) {
      logger.error("CSRF token generation failed", { sessionId, error: String(err) });
      next(err);
    }
  })();
}

/**
 * Middleware to validate CSRF token on state-changing requests (Redis-backed)
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

  const sessionId = res.locals.sessionId || (req as any).sessionID || req.headers["x-session-id"] as string;
  const providedToken = req.headers["x-csrf-token"] as string || req.body._csrf;
  
  if (!providedToken) {
    logger.warn("CSRF token missing", { path: req.path, method: req.method, ip: req.ip });
    return respondForbidden(res, "CSRF token required");
  }

  (async () => {
    try {
      if (!sessionId) {
        logger.warn("CSRF session not found", { path: req.path });
        return respondForbidden(res, "Invalid CSRF session");
      }

      const storedToken = await getCSRFToken(sessionId);
      if (!storedToken) {
        logger.warn("CSRF session expired or not found", { sessionId, path: req.path });
        return respondForbidden(res, "Invalid CSRF session");
      }

      if (storedToken !== providedToken) {
        logger.warn("CSRF token mismatch", { sessionId, path: req.path });
        return respondForbidden(res, "Invalid CSRF token");
      }

      next();
    } catch (err) {
      logger.error("CSRF validation error", { sessionId, error: String(err) });
      return respondForbidden(res, "CSRF validation failed");
    }
  })();
}

/**
 * Endpoint to get CSRF token
 */
export function getCSRFToken(req: CSRFRequest, res: Response) {
  const sessionId = (req as any).sessionID || req.headers["x-session-id"] as string || "anonymous";
  const token = generateCSRFToken(sessionId);
  
  return respondSuccess(res, { csrfToken: token });
}
