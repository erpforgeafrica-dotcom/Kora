import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { Redis } from "ioredis";
import { logger } from "../shared/logger.js";
import { respondForbidden, respondSuccess } from "../shared/response.js";

interface CSRFRequest extends Request {
  csrfToken?: string;
  sessionID?: string;
}

// Redis client for CSRF token storage — lazy, non-fatal
let redisCsrf: Redis | null = null;
function getCsrfRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redisCsrf) {
    redisCsrf = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableReadyCheck: false,
    });
    redisCsrf.on("error", (err: Error) => {
      logger.error("Redis CSRF error", { message: err.message });
    });
  }
  return redisCsrf;
}

// Fallback in-memory store for environments without Redis
const csrfTokenMemory = new Map<string, { token: string; expires: number }>();

// ── Internal Redis helpers (prefixed to avoid name collision) ─────────────────

async function redisGetCSRF(sessionId: string): Promise<string | null> {
  try {
    const client = getCsrfRedis();
    if (!client) return null;
    return await client.get(`csrf:${sessionId}`);
  } catch {
    const data = csrfTokenMemory.get(sessionId);
    return data && data.expires > Date.now() ? data.token : null;
  }
}

async function redisSetCSRF(sessionId: string, token: string, ttlSeconds: number): Promise<void> {
  try {
    const client = getCsrfRedis();
    if (!client) throw new Error("no redis");
    await client.setex(`csrf:${sessionId}`, ttlSeconds, token);
  } catch {
    csrfTokenMemory.set(sessionId, { token, expires: Date.now() + ttlSeconds * 1000 });
  }
}

async function redisDeleteCSRF(sessionId: string): Promise<void> {
  try {
    const client = getCsrfRedis();
    if (!client) throw new Error("no redis");
    await client.del(`csrf:${sessionId}`);
  } catch {
    csrfTokenMemory.delete(sessionId);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateCSRFToken(sessionId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await redisSetCSRF(sessionId, token, 60 * 60);
  return token;
}

export function csrfToken(req: CSRFRequest, res: Response, next: NextFunction) {
  const sessionId =
    (req as any).sessionID ||
    (req.headers["x-session-id"] as string) ||
    crypto.randomBytes(16).toString("hex");

  (async () => {
    try {
      let token = await redisGetCSRF(sessionId);
      if (!token) token = await generateCSRFToken(sessionId);
      req.csrfToken = token;
      res.locals.sessionId = sessionId;
      next();
    } catch (err) {
      logger.error("CSRF token generation failed", { sessionId, error: String(err) });
      next(err);
    }
  })();
}

export function validateCSRF(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === "test" || process.env.VITEST === "true") return next();
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.path.includes("/webhook")) return next();
  if (
    req.path.startsWith("/api/auth/login") ||
    req.path.startsWith("/api/auth/register") ||
    req.path.startsWith("/api/auth/logout")
  ) return next();

  const sessionId =
    res.locals.sessionId ||
    (req as any).sessionID ||
    (req.headers["x-session-id"] as string);
  const providedToken = (req.headers["x-csrf-token"] as string) || req.body?._csrf;

  if (!providedToken) {
    logger.warn("CSRF token missing", { path: req.path, method: req.method, ip: req.ip });
    return respondForbidden(res, "CSRF token required");
  }

  (async () => {
    try {
      if (!sessionId) return respondForbidden(res, "Invalid CSRF session");

      const storedToken = await redisGetCSRF(sessionId);
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

// ── Endpoint handler ──────────────────────────────────────────────────────────

export async function getCSRFToken(req: CSRFRequest, res: Response) {
  const sessionId =
    (req as any).sessionID ||
    (req.headers["x-session-id"] as string) ||
    "anonymous";
  const token = await generateCSRFToken(sessionId);
  return respondSuccess(res, { csrfToken: token });
}
