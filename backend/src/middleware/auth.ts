import type { NextFunction, Request, Response } from "express";
import { verifyToken as verifyClerkJwt } from "@clerk/backend";
import { respondError } from "../shared/response.js";
import {
  verifyToken as verifyLocalJwt,
  validateUserSession,
  getUserById,
} from "../modules/auth/service.js";

/**
 * KORA Auth Middleware — Clerk-backed
 *
 * Every protected request must carry a valid Clerk session token:
 *   Authorization: Bearer <clerk_session_token>
 *
 * Role resolution order:
 *   1. org_role from Clerk token  (set via Clerk org membership)
 *   2. publicMetadata.role        (set via Clerk dashboard / API)
 *   3. Default → "client"
 *
 * Test-mode bypass: NODE_ENV=test + x-test-user-id / x-test-role / x-test-org-id headers.
 * Never active in production.
 */

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
  platform_admin:   "platform_admin",
  platformadmin:    "platform_admin",
  kora_admin:       "platform_admin",
  kora_superadmin:  "kora_superadmin",
  business_admin:   "business_admin",
  businessadmin:    "business_admin",
  admin:            "business_admin",
  manager:          "business_admin",
  owner:            "business_admin",
  // Clerk org roles
  "org:admin":      "business_admin",
  "org:owner":      "business_admin",
  "org:member":     "staff",
  operations:       "operations",
  staff:            "staff",
  client:           "client",
  customer:         "client",
  inventory_manager: "inventory_manager",
  sales_manager:    "sales_manager",
  sales_agent:      "sales_agent",
  dispatcher:       "dispatcher",
  delivery_agent:   "delivery_agent",
  doctor:           "doctor",
  nurse:            "nurse",
  pharmacist:       "pharmacist",
  lab_scientist:    "lab_scientist",
  caregiver:        "caregiver",
};

export function normalizeRole(raw: unknown): Role {
  if (typeof raw !== "string") return "client";
  return ROLE_ALIASES[raw.trim().toLowerCase()] ?? "client";
}

// ─── Test-mode bypass ─────────────────────────────────────────────────────────
function injectTestAuth(req: Request, res: Response): boolean {
  if (process.env.NODE_ENV !== "test") return false;
  const userId = req.header("x-test-user-id");
  const role   = req.header("x-test-role");
  const orgId  = req.header("x-test-org-id");
  if (!userId || !role || !orgId) return false;
  const resolvedRole = normalizeRole(role);
  req.user = { id: userId, role: resolvedRole, organization_id: orgId };
  res.locals.auth = { userId, userRole: resolvedRole, organizationId: orgId, tokenJti: null, sessionId: null };
  return true;
}

function extractBearerToken(req: Request): string | null {
  const raw = req.header("authorization");
  return raw?.startsWith("Bearer ") ? raw.slice(7) : null;
}

// ─── Clerk token verification ─────────────────────────────────────────────────
async function verifyClerkToken(token: string): Promise<{
  userId: string; orgId: string; role: Role; sessionId: string;
} | null> {
  try {
    const payload = await verifyClerkJwt(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      authorizedParties: process.env.CLERK_AUTHORIZED_PARTIES
        ? process.env.CLERK_AUTHORIZED_PARTIES.split(",").map(s => s.trim())
        : undefined,
    });

    const userId = payload.sub;
    const orgId  = (payload as any).org_id ?? (payload as any).organizationId ?? null;
    if (!userId || !orgId) return null;

    const clerkOrgRole  = (payload as any).org_role;
    const metadataRole  = (payload as any).metadata?.role ?? (payload as any).publicMetadata?.role;
    const role = normalizeRole(clerkOrgRole ?? metadataRole ?? "client");

    return { userId, orgId, role, sessionId: (payload as any).sid ?? "" };
  } catch {
    return null;
  }
}

async function verifyLocalToken(token: string): Promise<{
  userId: string; orgId: string; role: Role; sessionId: string | null; tokenJti: string;
} | null> {
  try {
    const payload = verifyLocalJwt(token) as {
      sub?: string;
      role?: string;
      organizationId?: string;
      jti?: string;
    } | null;

    const userId = payload?.sub ?? null;
    const orgId = payload?.organizationId ?? null;
    const tokenJti = payload?.jti ?? null;
    if (!userId || !orgId || !tokenJti) {
      return null;
    }

    const session = await validateUserSession(tokenJti);
    const user = await getUserById(userId);
    const role = normalizeRole(user?.role ?? payload?.role ?? "client");

    return {
      userId,
      orgId,
      role,
      sessionId: session?.id ?? null,
      tokenJti,
    };
  } catch {
    return null;
  }
}

// ─── requireAuth ──────────────────────────────────────────────────────────────
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (injectTestAuth(req, res)) return next();

  const token = extractBearerToken(req);
  if (!token) return respondError(res, "UNAUTHORIZED", "Missing or invalid authorization token", 401);

  const verified = await verifyClerkToken(token) ?? await verifyLocalToken(token);
  if (!verified) return respondError(res, "UNAUTHORIZED", "Token verification failed", 401);

  req.user = { id: verified.userId, role: verified.role, organization_id: verified.orgId };
  res.locals.auth = {
    userId: verified.userId, userRole: verified.role,
    organizationId: verified.orgId, tokenJti: "tokenJti" in verified ? verified.tokenJti : null, sessionId: verified.sessionId,
  };
  return next();
};

// ─── optionalAuth ─────────────────────────────────────────────────────────────
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (injectTestAuth(req, res)) return next();

  const token = extractBearerToken(req);
  if (!token) return next();

  const verified = await verifyClerkToken(token) ?? await verifyLocalToken(token);
  if (verified) {
    req.user = { id: verified.userId, role: verified.role, organization_id: verified.orgId };
    res.locals.auth = {
      userId: verified.userId, userRole: verified.role,
      organizationId: verified.orgId, tokenJti: "tokenJti" in verified ? verified.tokenJti : null, sessionId: verified.sessionId,
    };
  }
  return next();
};

export const authenticateRequest = requireAuth;
