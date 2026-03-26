import type { Response } from "express";
import { BadRequestError } from "../middleware/enhancedErrorHandler.js";

/**
 * Get organization ID from authenticated context (JWT only, no fallback)
 * 
 * SECURITY: Never trust X-Organization-Id or X-Org-Id headers for tenancy.
 * Organization ID MUST come from the verified JWT token only.
 */
export function getOrganizationId(res: Response): string | null {
  return res.locals.auth?.organizationId ?? null;
}

/**
 * Get required organization ID from authenticated context (JWT only)
 * Throws error if not present - for use in protected routes.
 * 
 * SECURITY: Never pass header values to this function.
 */
export function getRequiredOrganizationId(res: Response): string {
  const orgId = res.locals.auth?.organizationId;
  if (!orgId) {
    throw new BadRequestError("Authenticated context missing organization ID", "missing_organization_id");
  }
  return orgId;
}

export function hasRole(res: Response, roles: string[]) {
  const role = res.locals.auth?.userRole;
  return typeof role === "string" && roles.includes(role);
}
