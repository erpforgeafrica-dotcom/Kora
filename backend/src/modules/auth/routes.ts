import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { respondSuccess, respondError } from "../../shared/response.js";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { hash, compare } from "bcryptjs";
import { queryDb } from "../../db/client.js";
import {
  UnauthorizedError,
  ValidationError,
  AccountLockedError
} from "../../middleware/enhancedErrorHandler.js";
import {
  buildJti,
  createSession,
  revokeSessionByToken,
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

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const mapUserRow = (row: Pick<UserRow, "id" | "email" | "role" | "organization_id">) => ({
  id: row.id,
  email: row.email,
  role: row.role,
  organizationId: row.organization_id,
});

const normalizeIdentifier = (email: string) => email.trim().toLowerCase();

/**
 * Generate canonical JWT token.
 * MUST emit: { sub, role, organizationId, jti, permissions_version }
 */
const generateToken = (userId: string, role: string, orgId: string | null, tokenJti: string) => {
  const ttlMinutes = SESSION_TTL_MINUTES;
  const organizationId = orgId ?? "org_placeholder";
  return jwt.sign(
    { sub: userId, role, organizationId, permissions_version: 1 },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: `${ttlMinutes}m`, jwtid: tokenJti }
  );
};

router.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeIdentifier(email);

    const existing = await queryDb<{ id: string }>(
      `SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1`,
      [normalizedEmail]
    );
    if (existing[0]) {
      return next(new ValidationError("Email already registered", undefined));
    }

    const hashedPassword = await hash(password, 12);

    const rows = await queryDb<Pick<UserRow, "id" | "email" | "role" | "organization_id">>(
      `INSERT INTO users (email, password_hash, role, organization_id)
       VALUES (lower($1), $2, $3, gen_random_uuid())
       RETURNING id, email, role, organization_id`,
      [normalizedEmail, hashedPassword, "business_admin"]
    );

    if (!rows[0]) throw new Error("Failed to create user");

    const user = rows[0];
    const tokenJti = buildJti();
    const token = generateToken(user.id, user.role, user.organization_id, tokenJti);
    await createSession({
      userId: user.id,
      organizationId: user.organization_id,
      tokenJti,
      ipAddress: req.ip,
      userAgent: req.header("user-agent") ?? null,
    });

    respondSuccess(res, {
      accessToken: token,
      user: mapUserRow(user),
    }, 201);
  } catch (err) {
    next(err);
  }
});

router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const identifier = normalizeIdentifier(email);
    const ipAddress = req.ip;
    const userAgent = req.header("user-agent") ?? null;

    const rows = await queryDb<UserRow>(
      `SELECT id, email, password_hash, role, organization_id, locked_until, failed_attempts
       FROM users
      WHERE lower(email) = lower($1)
      LIMIT 1`,
      [identifier]
    );

    const user = rows[0];
    if (!user) {
      await logLoginAttempt({
        identifier,
        success: false,
        reason: "user_not_found",
        ipAddress,
        userAgent,
      });
      return next(new UnauthorizedError("Invalid credentials"));
    }

    if (!user.password_hash) {
      await logLoginAttempt({
        identifier,
        userId: user.id,
        organizationId: user.organization_id,
        success: false,
        reason: "no_password_set",
        ipAddress,
        userAgent,
      });
      return next(new UnauthorizedError("Invalid credentials"));
    }

    if (isAccountLocked(user.locked_until)) {
      await logLoginAttempt({
        identifier,
        userId: user.id,
        organizationId: user.organization_id,
        success: false,
        reason: "account_locked",
        ipAddress,
        userAgent,
      });
      return next(new AccountLockedError("Account temporarily locked due to too many failed login attempts"));
    }

    const isValid = await compare(password, user.password_hash);
    if (!isValid) {
      await logLoginAttempt({
        identifier,
        userId: user.id,
        organizationId: user.organization_id,
        success: false,
        reason: "invalid_credentials",
        ipAddress,
        userAgent,
      });
      await incrementFailureCount(user.id);
      const failureCount = await countRecentFailures(identifier);
      if (shouldLockAccount(failureCount)) {
        await markUserLocked(user.id);
      }
      return next(new UnauthorizedError("Invalid credentials"));
    }

    await logLoginAttempt({
      identifier,
      userId: user.id,
      organizationId: user.organization_id,
      success: true,
      ipAddress,
      userAgent,
    });
    await resetUserLockState(user.id);

    const tokenJti = buildJti();
    const token = generateToken(user.id, user.role, user.organization_id, tokenJti);
    await createSession({
      userId: user.id,
      organizationId: user.organization_id,
      tokenJti,
      ipAddress,
      userAgent,
    });

    respondSuccess(res, {
      accessToken: token,
      user: mapUserRow(user),
    }, 200);
  } catch (err) {
    next(err);
  }
});

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const auth = res.locals.auth;
    if (!auth?.tokenJti) {
      return next(new UnauthorizedError("Invalid session"));
    }
    await revokeSessionByToken(auth.tokenJti, "user_logout");
    respondSuccess(res, { revoked: true }, 200);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * CANONICAL SOURCE OF TRUTH for user identity and permissions.
 * Frontend MUST rely ONLY on this endpoint for user state.
 */
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const auth = res.locals.auth;
    if (!auth?.userId) {
      return next(new UnauthorizedError("No authenticated session"));
    }

    const userRows = await queryDb<Pick<UserRow, "id" | "email" | "role" | "organization_id">>(  
      `SELECT id, email, role, organization_id FROM users WHERE id = $1 LIMIT 1`,
      [auth.userId]
    );
    
    if (!userRows[0]) {
      return next(new UnauthorizedError("User not found"));
    }

    const user = userRows[0];
    respondSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id,
      },
    }, 200);
  } catch (err) {
    next(err);
  }
});

export { router as authRoutes };
