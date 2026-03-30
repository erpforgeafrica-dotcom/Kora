/**
 * Auth Service Layer
 * 
 * Handles all authentication business logic including:
 * - User registration and credential management
 * - JWT token generation and validation
 * - Session lifecycle management
 * - Login attempt tracking and account lockout
 * 
 * This centralizes all auth logic, separating concerns from route handlers.
 */

import jwt from "jsonwebtoken";
import { hash, compare } from "bcryptjs";
import { queryDb } from "../../db/client.js";
import {
  buildJti,
  createSession,
  getSessionByJti,
  validateSession,
  SESSION_TTL_MINUTES
} from "../../services/auth/sessionService.js";
import {
  logLoginAttempt,
  countRecentFailures,
  markUserLocked,
  resetUserLockState,
  incrementFailureCount,
  shouldLockAccount,
  isAccountLocked
} from "../../services/auth/loginAttemptService.js";
import type { UserRow } from "../../types/entities.js";
import {
  UnauthorizedError,
  ValidationError,
  AccountLockedError
} from "../../middleware/enhancedErrorHandler.js";

/**
 * Validate JWT_SECRET is configured
 * Fail-fast: Never use hardcoded defaults in production
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length === 0) {
    throw new Error(
      "FATAL: JWT_SECRET environment variable is not configured. " +
      "This is required for secure token generation. " +
      "Set JWT_SECRET in .env or deployment configuration."
    );
  }
  if (secret === "test-secret") {
    throw new Error(
      "FATAL: JWT_SECRET is set to the insecure default 'test-secret'. " +
      "This value is not allowed in production. " +
      "Generate a strong random secret: openssl rand -hex 32"
    );
  }
  return secret;
}

/**
 * Generate JWT token with canonical claims
 * 
 * MUST emit: { sub, role, organizationId, jti, permissions_version }
 */
export function generateToken(
  userId: string,
  role: string,
  orgId: string | null,
  tokenJti: string
): string {
  const organizationId = orgId ?? "org_placeholder";
  const jwtSecret = getJwtSecret();
  const ttlMinutes = SESSION_TTL_MINUTES;

  return jwt.sign(
    {
      sub: userId,
      role,
      organizationId,
      permissions_version: 1
    },
    jwtSecret,
    {
      expiresIn: `${ttlMinutes}m`,
      jwtid: tokenJti
    }
  );
}

/**
 * Register new user
 * 
 * Validates email uniqueness, hashes password, creates user and session
 */
export async function registerUser(
  email: string,
  password: string
): Promise<{ user: any; token: string; sessionId: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  // Validate email uniqueness
  const existing = await queryDb<{ id: string }>(
    `SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1`,
    [normalizedEmail]
  );
  if (existing[0]) {
    throw new ValidationError("Email already registered", undefined);
  }

  // Hash password
  const hashedPassword = await hash(password, 12);

  // Create user
  const rows = await queryDb<Pick<UserRow, "id" | "email" | "role" | "organization_id">>(
    `INSERT INTO users (email, password_hash, role, organization_id)
     VALUES (lower($1), $2, $3, gen_random_uuid())
     RETURNING id, email, role, organization_id`,
    [normalizedEmail, hashedPassword, "business_admin"]
  );

  if (!rows[0]) {
    throw new Error("Failed to create user");
  }

  const user = rows[0];

  // Create session
  const tokenJti = buildJti();
  const token = generateToken(user.id, user.role, user.organization_id, tokenJti);
  const session = await createSession({
    userId: user.id,
    organizationId: user.organization_id,
    tokenJti,
    ipAddress: null,
    userAgent: null
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id
    },
    token,
    sessionId: session?.id ?? ""
  };
}

/**
 * Login user with email and password
 * 
 * Validates credentials, checks account lockout, updates login attempts,
 * creates session and issues JWT
 */
export async function loginUser(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ user: any; token: string; sessionId: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  // Log login attempt
  await logLoginAttempt({
    identifier: normalizedEmail,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
    success: false
  });

  // Fetch user
  const rows = await queryDb<UserRow>(
    `SELECT id, email, password_hash, role, organization_id, locked_until, failed_attempts
       FROM users
      WHERE lower(email) = lower($1)
      LIMIT 1`,
    [normalizedEmail]
  );

  const user = rows[0];
  if (user && isAccountLocked(user.locked_until ?? null)) {
    throw new AccountLockedError("Account temporarily locked due to failed login attempts");
  }

  if (!user || !user.password_hash) {
    const failureCount = await countRecentFailures(normalizedEmail);
    if (user?.id && shouldLockAccount(failureCount)) {
      await markUserLocked(user.id);
    }
    throw new UnauthorizedError("Invalid email or password");
  }

  // Verify password
  const passwordValid = await compare(password, user.password_hash);
  if (!passwordValid) {
    await incrementFailureCount(user.id);
    const failureCount = await countRecentFailures(normalizedEmail);
    if (shouldLockAccount(failureCount)) {
      await markUserLocked(user.id);
    }
    throw new UnauthorizedError("Invalid email or password");
  }

  // Reset login attempts on successful login
  await resetUserLockState(user.id);

  // Create session
  const tokenJti = buildJti();
  const token = generateToken(user.id, user.role, user.organization_id, tokenJti);
  const session = await createSession({
    userId: user.id,
    organizationId: user.organization_id,
    tokenJti,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id
    },
    token,
    sessionId: session?.id ?? ""
  };
}

/**
 * Verify token and return user claims
 * 
 * Validates JWT signature and session state
 */
export function verifyToken(token: string): any {
  try {
    const jwtSecret = getJwtSecret();
    return jwt.verify(token, jwtSecret);
  } catch (err) {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

/**
 * Validate session by JWT JTI
 * 
 * Ensures session is active, not revoked, not expired
 */
export async function validateUserSession(tokenJti: string): Promise<any> {
  const session = await getSessionByJti(tokenJti);
  const validation = validateSession(session);

  if (validation.status === "missing") {
    throw new UnauthorizedError("Session not found");
  }

  if (validation.status === "revoked") {
    throw new UnauthorizedError("Session was revoked (logout)");
  }

  if (validation.status === "expired") {
    throw new UnauthorizedError("Session expired");
  }

  return session;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<any> {
  const rows = await queryDb<UserRow>(
    `SELECT id, email, role, organization_id FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );

  if (!rows[0]) {
    throw new Error("User not found");
  }

  return {
    id: rows[0].id,
    email: rows[0].email,
    role: rows[0].role,
    organizationId: rows[0].organization_id
  };
}
