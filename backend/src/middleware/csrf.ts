import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { logger } from "../shared/logger.js";
import { respondForbidden, respondSuccess } from "../shared/response.js";
import { makeLazyRedis, recordSuccess, recordFailure } from "../shared/redisCircuitBreaker.js";

// ── Redis ─────────────────────────────────────────────────────────────────────

const getRedis = makeLazyRedis("csrf");

// ── Config ────────────────────────────────────────────────────────────────────

const CSRF_TTL_SECONDS   = 3_600;  // token lifetime: 1 h
const RATE_WINDOW_SECS   = 60;     // sliding window: 1 min
const RATE_MAX_REQUESTS  = 30;     // max CSRF ops per IP per window

// ── Types ─────────────────────────────────────────────────────────────────────

interface CSRFRequest extends Request {
  csrfToken?: string;
  sessionID?: string;
}

// ── In-memory fallback ────────────────────────────────────────────────────────

const csrfMemory = new Map<string, { token: string; expires: number }>();

// ── Rate limiting (sliding window via Redis INCR) ─────────────────────────────

async function checkRateLimit(ip: string): Promise<boolean> {
  const client = getRedis();
  if (!client) return true; // no Redis → allow (fail open for rate limiting only)

  const key = `csrf:rl:${ip}`;
  try {
    const pipe    = client.pipeline();
    pipe.incr(key);
    pipe.expire(key, RATE_WINDOW_SECS);
    const results = await pipe.exec();
    recordSuccess("csrf");
    const count = (results?.[0]?.[1] as number) ?? 0;
    return count <= RATE_MAX_REQUESTS;
  } catch (err) {
    recordFailure("csrf");
    logger.warn("CSRF rate-limit check failed", { ip, error: String(err) });
    return true; // fail open
  }
}

// ── Token storage ─────────────────────────────────────────────────────────────

async function getToken(sessionId: string): Promise<string | null> {
  const client = getRedis();
  if (!client) {
    const d = csrfMemory.get(sessionId);
    return d && d.expires > Date.now() ? d.token : null;
  }
  try {
    const val = await client.get(`csrf:${sessionId}`);
    recordSuccess("csrf");
    return val;
  } catch (err) {
    recordFailure("csrf");
    const d = csrfMemory.get(sessionId);
    return d && d.expires > Date.now() ? d.token : null;
  }
}

async function setToken(sessionId: string, token: string): Promise<void> {
  const client = getRedis();
  if (!client) {
    csrfMemory.set(sessionId, { token, expires: Date.now() + CSRF_TTL_SECONDS * 1000 });
    return;
  }
  try {
    await client.setex(`csrf:${sessionId}`, CSRF_TTL_SECONDS, token);
    recordSuccess("csrf");
  } catch (err) {
    recordFailure("csrf");
    csrfMemory.set(sessionId, { token, expires: Date.now() + CSRF_TTL_SECONDS * 1000 });
  }
}

async function deleteToken(sessionId: string): Promise<void> {
  csrfMemory.delete(sessionId);
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(`csrf:${sessionId}`);
    recordSuccess("csrf");
  } catch (err) {
    recordFailure("csrf");
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateCSRFToken(sessionId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await setToken(sessionId, token);
  return token;
}

/** Middleware: attach or reuse CSRF token for the session. */
export function csrfToken(req: CSRFRequest, res: Response, next: NextFunction): void {
  const sessionId =
    (req as any).sessionID ||
    (req.headers["x-session-id"] as string) ||
    crypto.randomBytes(16).toString("hex");

  (async () => {
    try {
      const ip = req.ip ?? "unknown";
      if (!(await checkRateLimit(ip))) {
        logger.warn("CSRF rate limit exceeded", { ip });
        return respondForbidden(res, "Too many requests");
      }

      let token = await getToken(sessionId);
      if (!token) token = await generateCSRFToken(sessionId);

      req.csrfToken          = token;
      res.locals.sessionId   = sessionId;
      next();
    } catch (err) {
      logger.error("CSRF token generation failed", { error: String(err) });
      next(err);
    }
  })();
}

/** Middleware: validate CSRF token on state-mutating requests, then rotate it. */
export function validateCSRF(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === "test" || process.env.VITEST === "true") return next();
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.path.includes("/webhook")) return next();
  if (
    req.path.startsWith("/api/auth/login") ||
    req.path.startsWith("/api/auth/register") ||
    req.path.startsWith("/api/auth/logout")
  ) return next();

  const sessionId    = res.locals.sessionId || (req as any).sessionID || (req.headers["x-session-id"] as string);
  const providedToken = (req.headers["x-csrf-token"] as string) || req.body?._csrf;

  if (!providedToken) {
    logger.warn("CSRF token missing", { path: req.path, method: req.method, ip: req.ip });
    return respondForbidden(res, "CSRF token required");
  }

  (async () => {
    try {
      if (!sessionId) return respondForbidden(res, "Invalid CSRF session");

      const ip = req.ip ?? "unknown";
      if (!(await checkRateLimit(ip))) {
        logger.warn("CSRF rate limit exceeded on validate", { ip, path: req.path });
        return respondForbidden(res, "Too many requests");
      }

      const storedToken = await getToken(sessionId);
      if (!storedToken) {
        logger.warn("CSRF session expired or not found", { sessionId, path: req.path });
        return respondForbidden(res, "Invalid CSRF session");
      }

      const provided = Buffer.from(providedToken, "hex");
      const stored   = Buffer.from(storedToken,   "hex");
      const valid    =
        provided.length === stored.length &&
        crypto.timingSafeEqual(provided, stored);

      if (!valid) {
        logger.warn("CSRF token mismatch", { sessionId, path: req.path });
        return respondForbidden(res, "Invalid CSRF token");
      }

      // Rotate token after successful validation (prevents token reuse)
      const newToken = await generateCSRFToken(sessionId);
      res.setHeader("x-csrf-token", newToken);

      next();
    } catch (err) {
      logger.error("CSRF validation error", { sessionId, error: String(err) });
      return respondForbidden(res, "CSRF validation failed");
    }
  })();
}

/** Endpoint: issue a fresh CSRF token for the caller's session. */
export async function getCSRFToken(req: CSRFRequest, res: Response): Promise<Response> {
  const sessionId =
    (req as any).sessionID ||
    (req.headers["x-session-id"] as string) ||
    "anonymous";

  const ip = req.ip ?? "unknown";
  if (!(await checkRateLimit(ip))) {
    return respondForbidden(res, "Too many requests");
  }

  const token = await generateCSRFToken(sessionId);
  return respondSuccess(res, { csrfToken: token });
}

export { deleteToken as deleteCSRFToken };
