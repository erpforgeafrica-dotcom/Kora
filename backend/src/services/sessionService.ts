import crypto from "node:crypto";
import { logger } from "../shared/logger.js";
import { makeLazyRedis, recordSuccess, recordFailure } from "../shared/redisCircuitBreaker.js";
import type { Role } from "../middleware/auth.js";

// ── Redis ─────────────────────────────────────────────────────────────────────

const getRedis = makeLazyRedis("session");

// ── Config ────────────────────────────────────────────────────────────────────

const SESSION_CONFIG = {
  TTL_SECONDS:          86_400,  // 24 h absolute max
  IDLE_TIMEOUT_SECONDS: 3_600,   // 1 h idle
  REFRESH_THRESHOLD:    1_800,   // roll TTL when < 30 min remain
  SIGNATURE_ALGORITHM:  "sha256",
} as const;

export const sessionConfig = SESSION_CONFIG;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SessionData {
  userId:         string;
  organizationId: string;
  userRole:       Role;
  csrfToken:      string;
  createdAt:      number;
  expiresAt:      number;
  ipAddress?:     string;
  userAgent?:     string;
  lastActivity?:  number;
  /** Incremented on every rolling refresh — used to detect replay across servers */
  version:        number;
}

// ── In-memory fallback ────────────────────────────────────────────────────────

const sessionMemory = new Map<string, SessionData>();

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) logger.warn("SESSION_SECRET not set — using insecure dev fallback");
  return s ?? "dev-only-insecure-secret-change-in-production";
}

export function generateSessionId(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function generateSessionSignature(sessionId: string): string {
  return crypto
    .createHmac(SESSION_CONFIG.SIGNATURE_ALGORITHM, getSessionSecret())
    .update(sessionId)
    .digest("base64url");
}

export function verifySessionSignature(sessionId: string, signature: string): boolean {
  const expected = generateSessionSignature(sessionId);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected,  "base64url"),
      Buffer.from(signature, "base64url"),
    );
  } catch {
    return false;
  }
}

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function isSessionExpired(s: SessionData): boolean {
  return Math.floor(Date.now() / 1000) > s.expiresAt;
}

export function isSessionIdle(s: SessionData): boolean {
  if (!s.lastActivity) return false;
  return Math.floor(Date.now() / 1000) - s.lastActivity > SESSION_CONFIG.IDLE_TIMEOUT_SECONDS;
}

// ── Lua: atomic rolling refresh ───────────────────────────────────────────────
//
// Reads the current session, bumps lastActivity + expiresAt + version,
// writes back — all in one round trip. Safe across multiple Node processes.
//
const ROLLING_REFRESH_SCRIPT = `
local data = redis.call('GET', KEYS[1])
if not data then return nil end
local s = cjson.decode(data)
local now = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
s['lastActivity'] = now
s['expiresAt']    = now + ttl
s['version']      = (s['version'] or 0) + 1
local encoded = cjson.encode(s)
redis.call('SETEX', KEYS[1], ttl, encoded)
return encoded
`;

// ── Public API ────────────────────────────────────────────────────────────────

export async function createSession(
  userId:         string,
  organizationId: string,
  userRole:       Role,
  ipAddress?:     string,
  userAgent?:     string,
): Promise<{ sessionId: string; sessionSignature: string; sessionData: SessionData }> {
  const sessionId        = generateSessionId();
  const sessionSignature = generateSessionSignature(sessionId);
  const now              = Math.floor(Date.now() / 1000);

  const sessionData: SessionData = {
    userId, organizationId, userRole,
    csrfToken:    generateCSRFToken(),
    createdAt:    now,
    expiresAt:    now + SESSION_CONFIG.TTL_SECONDS,
    lastActivity: now,
    version:      1,
    ipAddress,
    userAgent,
  };

  const key     = `sessions:${sessionId}`;
  const payload = JSON.stringify(sessionData);
  const client  = getRedis();

  if (client) {
    try {
      // SET NX — only succeeds if key doesn't exist (distributed-safe creation)
      const ok = await client.set(key, payload, "EX", SESSION_CONFIG.TTL_SECONDS, "NX");
      if (!ok) {
        // Collision (astronomically rare with 32-byte IDs) — retry once
        return createSession(userId, organizationId, userRole, ipAddress, userAgent);
      }
      recordSuccess("session");
      logger.info("Session created", { userId, sessionId: sessionId.slice(0, 8) + "…", ipAddress });
    } catch (err) {
      recordFailure("session");
      logger.warn("Redis session create failed, falling back to memory", { error: String(err) });
      sessionMemory.set(key, sessionData);
    }
  } else {
    sessionMemory.set(key, sessionData);
  }

  return { sessionId, sessionSignature, sessionData };
}

export async function loadSession(sessionId: string): Promise<SessionData | null> {
  const key    = `sessions:${sessionId}`;
  const client = getRedis();

  if (!client) return sessionMemory.get(key) ?? null;

  try {
    const raw = await client.get(key);
    if (!raw) return null;
    const session = JSON.parse(raw) as SessionData;
    recordSuccess("session");

    // Rolling refresh: if TTL is running low, extend atomically
    const now       = Math.floor(Date.now() / 1000);
    const remaining = session.expiresAt - now;
    if (remaining > 0 && remaining < SESSION_CONFIG.REFRESH_THRESHOLD) {
      const refreshed = await client.eval(
        ROLLING_REFRESH_SCRIPT, 1, key,
        String(now), String(SESSION_CONFIG.TTL_SECONDS),
      ) as string | null;
      if (refreshed) return JSON.parse(refreshed) as SessionData;
    }

    return session;
  } catch (err) {
    recordFailure("session");
    logger.debug("Redis session load failed, trying memory", { sessionId, error: String(err) });
    return sessionMemory.get(key) ?? null;
  }
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  const key    = `sessions:${sessionId}`;
  const client = getRedis();
  const now    = Math.floor(Date.now() / 1000);

  if (!client) {
    const s = sessionMemory.get(key);
    if (s) { s.lastActivity = now; s.expiresAt = now + SESSION_CONFIG.TTL_SECONDS; }
    return;
  }

  try {
    const result = await client.eval(
      ROLLING_REFRESH_SCRIPT, 1, key,
      String(now), String(SESSION_CONFIG.TTL_SECONDS),
    ) as string | null;
    if (result) recordSuccess("session");
  } catch (err) {
    recordFailure("session");
    logger.warn("Redis session activity update failed", { sessionId, error: String(err) });
  }
}

export async function invalidateSession(sessionId: string): Promise<void> {
  const key    = `sessions:${sessionId}`;
  const client = getRedis();

  sessionMemory.delete(key); // always clear local copy

  if (!client) return;
  try {
    await client.del(key);
    recordSuccess("session");
    logger.info("Session invalidated", { sessionId: sessionId.slice(0, 8) + "…" });
  } catch (err) {
    recordFailure("session");
    logger.warn("Redis session delete failed", { sessionId, error: String(err) });
  }
}

export async function refreshSessionCSRFToken(sessionId: string): Promise<string | null> {
  const session = await loadSession(sessionId);
  if (!session) return null;

  const newToken = generateCSRFToken();
  session.csrfToken = newToken;

  const key    = `sessions:${sessionId}`;
  const client = getRedis();

  if (client) {
    try {
      await client.setex(key, SESSION_CONFIG.TTL_SECONDS, JSON.stringify(session));
      recordSuccess("session");
    } catch (err) {
      recordFailure("session");
      logger.warn("Redis CSRF refresh failed", { sessionId, error: String(err) });
      sessionMemory.set(key, session);
    }
  } else {
    sessionMemory.set(key, session);
  }

  return newToken;
}

export async function getSessionHealth(): Promise<{ active: number; expired: number; idle: number }> {
  const client = getRedis();
  if (!client) return { active: 0, expired: 0, idle: 0 };

  try {
    const keys = await client.keys("sessions:*");
    let active = 0, expired = 0, idle = 0;
    // Use pipeline to batch GETs — one round trip per 100 keys
    for (let i = 0; i < keys.length; i += 100) {
      const batch  = keys.slice(i, i + 100);
      const pipe   = client.pipeline();
      batch.forEach(k => pipe.get(k));
      const results = await pipe.exec();
      results?.forEach(([, raw]) => {
        if (!raw) return;
        const s = JSON.parse(raw as string) as SessionData;
        if (isSessionExpired(s)) expired++;
        else if (isSessionIdle(s)) idle++;
        else active++;
      });
    }
    recordSuccess("session");
    return { active, expired, idle };
  } catch (err) {
    recordFailure("session");
    logger.error("Failed to get session health", { error: String(err) });
    return { active: 0, expired: 0, idle: 0 };
  }
}

export async function cleanupExpiredSessions(): Promise<number> {
  const client = getRedis();
  if (!client) return 0;

  try {
    const keys    = await client.keys("sessions:*");
    const pipe    = client.pipeline();
    let   cleaned = 0;

    for (let i = 0; i < keys.length; i += 100) {
      const batch   = keys.slice(i, i + 100);
      const getPipe = client.pipeline();
      batch.forEach(k => getPipe.get(k));
      const results = await getPipe.exec();
      results?.forEach(([, raw], idx) => {
        if (!raw) return;
        const s = JSON.parse(raw as string) as SessionData;
        if (isSessionExpired(s)) { pipe.del(batch[idx]); cleaned++; }
      });
    }

    if (cleaned > 0) await pipe.exec();
    recordSuccess("session");
    logger.info("Cleaned expired sessions", { count: cleaned });
    return cleaned;
  } catch (err) {
    recordFailure("session");
    logger.error("Failed to cleanup expired sessions", { error: String(err) });
    return 0;
  }
}
