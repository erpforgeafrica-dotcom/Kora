import crypto from "node:crypto";
import { Redis } from "ioredis";
import { logger } from "../shared/logger.js";
import type { Role } from "../middleware/auth.js";

/**
 * Session Service - Redis-backed server-side sessions
 * 
 * Provides secure session management with:
 * - Cryptographically secure session IDs
 * - HMAC-signed session identifiers (tamper-proof)
 * - Server-side session storage (Redis)
 * - CSRF token binding to session
 * - Session lifecycle management
 */

// Redis client for session storage — lazy, non-fatal
let redisSession: Redis | null = null;
function getSessionRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redisSession) {
    redisSession = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableReadyCheck: false,
    });
    redisSession.on("error", (err: Error) => {
      logger.error("Redis session store error", { message: err.message, stack: err.stack });
    });
  }
  return redisSession;
}

// Fallback in-memory store for test environments
const sessionMemory = new Map<string, SessionData>();

/**
 * Session data structure
 */
export interface SessionData {
  userId: string;
  organizationId: string;
  userRole: Role;
  csrfToken: string;
  createdAt: number;
  expiresAt: number;
  ipAddress?: string;
  userAgent?: string;
  lastActivity?: number;
}

/**
 * Session configuration
 */
const SESSION_CONFIG = {
  TTL_SECONDS: 86400, // 24 hours
  CSRF_TTL_SECONDS: 3600, // 1 hour
  SIGNATURE_ALGORITHM: "sha256",
  IDLE_TIMEOUT_SECONDS: 3600, // 1 hour inactivity
};

/**
 * Get session secret from environment
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    logger.warn("SESSION_SECRET not set, using insecure fallback for development");
    return "dev-only-insecure-secret-change-in-production";
  }
  return secret;
}

/**
 * Generate cryptographically secure session ID
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Generate HMAC signature for session ID (tamper-proofing)
 */
export function generateSessionSignature(sessionId: string): string {
  const secret = getSessionSecret();
  return crypto
    .createHmac(SESSION_CONFIG.SIGNATURE_ALGORITHM, secret)
    .update(sessionId)
    .digest("base64url");
}

/**
 * Verify session signature
 */
export function verifySessionSignature(sessionId: string, signature: string): boolean {
  const expected = generateSessionSignature(sessionId);
  return crypto.timingSafeEqual(
    Buffer.from(expected, "base64url"),
    Buffer.from(signature, "base64url")
  );
}

/**
 * Generate CSRF token (cryptographically secure)
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create a new session
 */
export async function createSession(
  userId: string,
  organizationId: string,
  userRole: Role,
  ipAddress?: string,
  userAgent?: string
): Promise<{ sessionId: string; sessionSignature: string; sessionData: SessionData }> {
  const sessionId = generateSessionId();
  const sessionSignature = generateSessionSignature(sessionId);
  const csrfToken = generateCSRFToken();
  const now = Math.floor(Date.now() / 1000);

  const sessionData: SessionData = {
    userId,
    organizationId,
    userRole,
    csrfToken,
    createdAt: now,
    expiresAt: now + SESSION_CONFIG.TTL_SECONDS,
    ipAddress,
    userAgent,
    lastActivity: now,
  };

  const key = `sessions:${sessionId}`;
  try {
    const client = getSessionRedis();
    if (!client) throw new Error("no redis");
    await client.setex(key, SESSION_CONFIG.TTL_SECONDS, JSON.stringify(sessionData));
    logger.info("Session created", { 
      userId, 
      organizationId, 
      sessionId: sessionId.substring(0, 8) + "...",
      ipAddress,
    });
  } catch (err) {
    logger.warn("Redis session create failed, falling back to memory", { sessionId, error: String(err) });
    sessionMemory.set(key, sessionData);
  }

  return { sessionId, sessionSignature, sessionData };
}

/**
 * Load session from store
 */
export async function loadSession(sessionId: string): Promise<SessionData | null> {
  const key = `sessions:${sessionId}`;
  try {
    const client = getSessionRedis();
    if (!client) return sessionMemory.get(key) ?? null;
    const data = await client.get(key);
    if (!data) return null;
    return JSON.parse(data) as SessionData;
  } catch (err) {
    logger.debug("Redis session load failed, trying memory", { sessionId, error: String(err) });
    return sessionMemory.get(key) ?? null;
  }
}

/**
 * Update session activity (refresh TTL)
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  const key = `sessions:${sessionId}`;
  try {
    const client = getSessionRedis();
    if (!client) return;
    const session = await loadSession(sessionId);
    if (!session) return;
    const now = Math.floor(Date.now() / 1000);
    session.lastActivity = now;
    session.expiresAt = now + SESSION_CONFIG.TTL_SECONDS;
    await client.setex(key, SESSION_CONFIG.TTL_SECONDS, JSON.stringify(session));
  } catch (err) {
    logger.warn("Redis session update failed", { sessionId, error: String(err) });
  }
}

/**
 * Invalidate/revoke session (logout)
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  const key = `sessions:${sessionId}`;
  try {
    const client = getSessionRedis();
    if (!client) { sessionMemory.delete(key); return; }
    await client.del(key);
    logger.info("Session invalidated", { sessionId: sessionId.substring(0, 8) + "..." });
  } catch (err) {
    logger.warn("Redis session delete failed, trying memory", { sessionId, error: String(err) });
    sessionMemory.delete(key);
  }
}

/**
 * Refresh CSRF token within session
 */
export async function refreshSessionCSRFToken(sessionId: string): Promise<string | null> {
  try {
    const session = await loadSession(sessionId);
    if (!session) return null;
    const newCSRFToken = generateCSRFToken();
    session.csrfToken = newCSRFToken;
    const key = `sessions:${sessionId}`;
    const client = getSessionRedis();
    if (client) {
      await client.setex(key, SESSION_CONFIG.TTL_SECONDS, JSON.stringify(session));
    } else {
      sessionMemory.set(key, session);
    }
    return newCSRFToken;
  } catch (err) {
    logger.warn("Redis CSRF refresh failed", { sessionId, error: String(err) });
    return null;
  }
}

/**
 * Check if session is idle (exceeded idle timeout)
 */
export function isSessionIdle(session: SessionData): boolean {
  if (!session.lastActivity) return false;
  const now = Math.floor(Date.now() / 1000);
  return now - session.lastActivity > SESSION_CONFIG.IDLE_TIMEOUT_SECONDS;
}

/**
 * Check if session is expired
 */
export function isSessionExpired(session: SessionData): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now > session.expiresAt;
}

/**
 * Get session health (for monitoring)
 */
export async function getSessionHealth(): Promise<{
  active: number;
  expired: number;
  idle: number;
}> {
  try {
    const client = getSessionRedis();
    if (!client) return { active: 0, expired: 0, idle: 0 };
    const keys = await client.keys("sessions:*");
    let active = 0, expired = 0, idle = 0;
    for (const key of keys) {
      const data = await client.get(key);
      if (!data) continue;
      const session = JSON.parse(data) as SessionData;
      if (isSessionExpired(session)) expired++;
      else if (isSessionIdle(session)) idle++;
      else active++;
    }
    return { active, expired, idle };
  } catch (err) {
    logger.error("Failed to get session health", { error: String(err) });
    return { active: 0, expired: 0, idle: 0 };
  }
}

/**
 * Cleanup expired sessions (for maintenance)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const client = getSessionRedis();
    if (!client) return 0;
    const keys = await client.keys("sessions:*");
    let cleaned = 0;
    for (const key of keys) {
      const data = await client.get(key);
      if (!data) continue;
      const session = JSON.parse(data) as SessionData;
      if (isSessionExpired(session)) {
        await client.del(key);
        cleaned++;
      }
    }

    logger.info("Cleaned expired sessions", { count: cleaned });
    return cleaned;
  } catch (err) {
    logger.error("Failed to cleanup expired sessions", { error: String(err) });
    return 0;
  }
}

/**
 * Export session configuration for consumers
 */
export const sessionConfig = SESSION_CONFIG;
