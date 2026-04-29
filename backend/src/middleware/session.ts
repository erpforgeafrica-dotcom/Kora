import type { Request, Response, NextFunction } from "express";
import { logger } from "../shared/logger.js";
import {
  loadSession,
  updateSessionActivity,
  verifySessionSignature,
  isSessionExpired,
  isSessionIdle,
} from "../services/sessionService.js";

/**
 * Session Middleware
 * 
 * Validates session cookies and populates res.locals.auth with session data
 * Works alongside auth middleware (Clerk-based or local JWT)
 * 
 * Cookies expected:
 * - session_id: base64url-encoded session ID
 * - session_sig: HMAC-SHA256 signature (tamper-proof)
 */

export async function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = req.cookies?.session_id;
    const sessionSig = req.cookies?.session_sig;

    // If no session cookies, continue (will be handled by auth middleware)
    if (!sessionId || !sessionSig) {
      return next();
    }

    // Verify session signature (tamper-proof check)
    if (!verifySessionSignature(sessionId, sessionSig)) {
      logger.warn("Session signature verification failed", { 
        sessionId: sessionId.substring(0, 8) + "...",
        ip: req.ip 
      });
      res.clearCookie("session_id", { httpOnly: true, path: "/" });
      res.clearCookie("session_sig", { httpOnly: true, path: "/" });
      return res.status(401).json({ error: "Invalid session" });
    }

    // Load session from store
    const session = await loadSession(sessionId);
    if (!session) {
      logger.debug("Session not found or expired", { sessionId: sessionId.substring(0, 8) + "..." });
      res.clearCookie("session_id", { httpOnly: true, path: "/" });
      res.clearCookie("session_sig", { httpOnly: true, path: "/" });
      return res.status(401).json({ error: "Session expired" });
    }

    // Check expiration
    if (isSessionExpired(session)) {
      logger.debug("Session has expired", { 
        sessionId: sessionId.substring(0, 8) + "...",
        userId: session.userId 
      });
      res.clearCookie("session_id", { httpOnly: true, path: "/" });
      res.clearCookie("session_sig", { httpOnly: true, path: "/" });
      return res.status(401).json({ error: "Session expired" });
    }

    // Check idle timeout
    if (isSessionIdle(session)) {
      logger.info("Session idle timeout exceeded", { 
        sessionId: sessionId.substring(0, 8) + "...",
        userId: session.userId 
      });
      res.clearCookie("session_id", { httpOnly: true, path: "/" });
      res.clearCookie("session_sig", { httpOnly: true, path: "/" });
      return res.status(401).json({ error: "Session idle timeout" });
    }

    // Populate auth context
    res.locals.auth = {
      userId: session.userId,
      userRole: session.userRole,
      organizationId: session.organizationId,
      sessionId,
      csrfToken: session.csrfToken,
      sessionData: session,
    };

    // Update session activity (refresh TTL)
    await updateSessionActivity(sessionId);

    next();
  } catch (err) {
    logger.error("Session middleware error", { error: String(err) });
    next(err);
  }
}

/**
 * Session-required middleware
 * 
 * Ensures a valid session exists (for protected routes)
 * Use alongside auth middleware
 */
export function requireSession(req: Request, res: Response, next: NextFunction) {
  if (!res.locals.auth?.sessionId) {
    return res.status(401).json({ error: "Session required" });
  }
  next();
}

/**
 * CSRF validation middleware (session-aware)
 * 
 * Validates CSRF token against session's stored token
 */
export async function validateSessionCSRF(req: Request, res: Response, next: NextFunction) {
  // Skip for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip for endpoints that don't require CSRF
  if (
    req.path.includes("/webhook") ||
    req.path.startsWith("/api/auth/callback") ||
    req.path.startsWith("/api/auth/register")
  ) {
    return next();
  }

  // Require session
  if (!res.locals.auth?.sessionId) {
    return res.status(401).json({ error: "Session required for CSRF validation" });
  }

  const providedToken = req.headers["x-csrf-token"] as string || req.body?._csrf;
  const sessionToken = res.locals.auth?.csrfToken;

  if (!providedToken) {
    logger.warn("CSRF token missing", { path: req.path, userId: res.locals.auth.userId });
    return res.status(403).json({ error: "CSRF token required" });
  }

  if (!sessionToken) {
    logger.warn("Session CSRF token missing", { path: req.path, userId: res.locals.auth.userId });
    return res.status(403).json({ error: "Invalid session" });
  }

  if (providedToken !== sessionToken) {
    logger.warn("CSRF token mismatch", { 
      path: req.path, 
      userId: res.locals.auth.userId,
      sessionId: res.locals.auth.sessionId.substring(0, 8) + "..."
    });
    return res.status(403).json({ error: "CSRF token invalid" });
  }

  next();
}
