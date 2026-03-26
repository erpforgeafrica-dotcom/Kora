import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getSessionByJti, validateSession, touchSessionActivity } from "../services/auth/sessionService.js";

export type Role =
  | "platform_admin"
  | "business_admin"
  | "operations"
  | "staff"
  | "client"
  | "inventory_manager"
  | "sales_manager"
  | "sales_agent"
  | "dispatcher"
  | "delivery_agent"
  | "kora_superadmin"
  | "doctor"
  | "nurse"
  | "pharmacist"
  | "lab_scientist"
  | "caregiver";

export interface AuthUser {
  id: string;
  role: Role;
  organization_id: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const ROLE_ALIASES: Record<string, Role> = {
  platform_admin: "platform_admin",
  platformadmin: "platform_admin",
  kora_admin: "platform_admin",
  kora_superadmin: "kora_superadmin",
  business_admin: "business_admin",
  businessadmin: "business_admin",
  admin: "business_admin",
  manager: "business_admin",
  owner: "business_admin",
  operations: "operations",
  staff: "staff",
  client: "client",
  customer: "client",
  inventory_manager: "inventory_manager",
  sales_manager: "sales_manager",
  sales_agent: "sales_agent",
  dispatcher: "dispatcher",
  delivery_agent: "delivery_agent",
  doctor: "doctor",
  nurse: "nurse",
  pharmacist: "pharmacist",
  lab_scientist: "lab_scientist",
  caregiver: "caregiver",
};

function normalizeRole(raw: unknown): Role {
  if (typeof raw !== "string") return "client";
  return ROLE_ALIASES[raw.trim().toLowerCase()] ?? "client";
}

/**
 * Test-mode auth injection.
 * Only active when NODE_ENV === "test".
 * Reads x-test-user-id, x-test-role, x-test-org-id headers.
 * Never active in production.
 */
function injectTestAuth(req: Request, res: Response): boolean {
  if (process.env.NODE_ENV !== "test") return false;
  const userId = req.header("x-test-user-id");
  const role = req.header("x-test-role");
  const orgId = req.header("x-test-org-id");
  if (!userId || !role || !orgId) return false;

  const resolvedRole = normalizeRole(role);
  req.user = { id: userId, role: resolvedRole, organization_id: orgId };
  res.locals.auth = {
    userId,
    userRole: resolvedRole,
    organizationId: orgId,
    tokenJti: null,
    sessionId: null,
  };
  return true;
}

/**
 * requireAuth — returns 401 if token is missing, invalid, or session is revoked.
 * Sets req.user and res.locals.auth on success.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (injectTestAuth(req, res)) return next();

  const raw = req.header("authorization");
  const token = raw?.startsWith("Bearer ") ? raw.slice(7) : null;
  const secret = process.env.JWT_SECRET ?? "test-secret";

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Missing or invalid authorization token" },
    });
  }

  try {
    const payload = jwt.verify(token, secret) as {
      sub?: string;
      role?: string;
      organizationId?: string;
      tenantId?: string;
      jti?: string;
    };

    const organizationId = payload.organizationId ?? payload.tenantId ?? null;

    if (!payload.sub || !payload.role || !organizationId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid token payload" },
      });
    }

    const tokenJti = payload.jti ?? null;
    if (tokenJti) {
      const session = await getSessionByJti(tokenJti);
      const validation = validateSession(session);
      if (validation.status === "revoked") {
        return res.status(401).json({
          success: false,
          error: { code: "SESSION_REVOKED", message: "Session has been revoked" },
        });
      }
      if (validation.status !== "active") {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Session expired or invalid" },
        });
      }
      if (session!.user_id !== payload.sub || session!.organization_id !== organizationId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Session mismatch" },
        });
      }
      await touchSessionActivity(tokenJti);
    }

    req.user = {
      id: payload.sub,
      role: normalizeRole(payload.role),
      organization_id: organizationId,
    };

    res.locals.auth = {
      userId: payload.sub,
      userRole: req.user.role,
      organizationId,
      tokenJti,
    };

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Token verification failed" },
    });
  }
};

/**
 * optionalAuth — NEVER throws. Sets req.user if token is valid, otherwise continues.
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (injectTestAuth(req, res)) return next();

  const raw = req.header("authorization");
  const token = raw?.startsWith("Bearer ") ? raw.slice(7) : null;
  const secret = process.env.JWT_SECRET ?? "test-secret";
  if (!token) return next();

  try {
    const payload = jwt.verify(token, secret) as any;
    const organizationId = payload.organizationId ?? payload.tenantId ?? null;
    req.user = {
      id: payload.sub,
      role: normalizeRole(payload.role),
      organization_id: organizationId,
    };
    res.locals.auth = {
      userId: payload.sub,
      userRole: req.user.role,
      organizationId,
      tokenJti: payload.jti ?? null,
    };
  } catch {
    // intentionally silent — optionalAuth never throws
  }
  return next();
};

export const authenticateRequest = requireAuth;
