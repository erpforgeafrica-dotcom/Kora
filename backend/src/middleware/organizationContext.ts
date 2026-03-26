import type { NextFunction, Request, Response } from "express";
import { respondError } from "../shared/response.js";

/**
 * Canonical organization context resolver for KORA multi-tenancy
 * 
 * Sets res.locals.organizationId from:
 * 1. res.locals.auth?.organizationId (JWT tenantId)
 * 2. Headers: x-org-id, x-organization-id, X-Org-Id, X-Organization-Id
 * 
 * Returns 403 ORG_CONTEXT_REQUIRED if neither available.
 * 
 * Usage: Mount after requireAuth, before route handlers:
 * router.use(requireAuth);
 * router.use(resolveOrganizationContext);
 * router.get("/", requireRole("admin"), handler);
 */
export function resolveOrganizationContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const organizationId = res.locals.auth?.organizationId;

  if (!organizationId) {
    return respondError(res, "ORG_CONTEXT_REQUIRED", "Organization context from JWT is required", 403);
  }

  // Canonical single source of truth
  res.locals.organizationId = organizationId;
  next();
}

