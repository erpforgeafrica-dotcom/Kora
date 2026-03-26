import type { NextFunction, Request, Response } from "express";
import type { Role } from "./auth.js";
import { ForbiddenError, UnauthorizedError } from "./enhancedErrorHandler.js";
import { respondForbidden, respondUnauthorized } from "../shared/response.js";

// Re-export type for backwards compatibility
export type UserRole = Role;

/**
 * CANONICAL ROLES
 * Core 5 roles + extended operational roles used across modules.
 */
export const CANONICAL_ROLES = [
  "platform_admin",
  "business_admin",
  "operations",
  "staff",
  "client",
  "inventory_manager",
  "sales_manager",
  "sales_agent",
  "dispatcher",
  "delivery_agent",
  "kora_superadmin",
  "doctor",
  "nurse",
  "pharmacist",
  "lab_scientist",
  "caregiver",
] as const;

/**
 * Role-based access control middleware
 * Enforces authorization based on canonical roles.
 * 
 * Usage:
 *   router.get("/", requireRole("business_admin", "platform_admin"), handler)
 * 
 * IMPORTANT: Must be used AFTER requireAuth middleware
 */
export const requireRole = (...allowedRoles: Role[] | Role[][]) => {
  // Handle both requireRole("admin", "staff") and requireRole(["admin", "staff"])
  const roles: Role[] = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : (allowedRoles as Role[]);
  
  // Validate that all roles are canonical
  const invalidRoles = roles.filter(r => !CANONICAL_ROLES.includes(r as any));
  if (invalidRoles.length > 0) {
    throw new Error(`Invalid roles: ${invalidRoles.join(", ")}. Must use only: ${CANONICAL_ROLES.join(", ")}`);
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // Use canonical res.locals.auth (set by requireAuth middleware)
    const auth = res.locals.auth;
    
    if (!auth?.userRole) {
      return respondUnauthorized(res, "Unauthorized");
    }

    if (!roles.includes(auth.userRole)) {
      return respondForbidden(res, "Forbidden");
    }

    return next();
  };
};

export const authorize = requireRole; // Alias

/**
 * Require business admin or platform admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = res.locals.auth;
  if (!auth?.userRole) {
    return next(new UnauthorizedError("No authenticated session"));
  }

  if (auth.userRole !== "business_admin" && auth.userRole !== "platform_admin") {
    return next(new ForbiddenError("Requires admin role"));
  }

  return next();
}

/**
 * Require platform admin role only
 */
export function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = res.locals.auth;
  if (!auth?.userRole) {
    return next(new UnauthorizedError("No authenticated session"));
  }

  if (auth.userRole !== "platform_admin") {
    return next(new ForbiddenError("Requires platform admin role"));
  }

  return next();
}

export function hasRole(userRole: Role | null, requiredRole: Role): boolean {
  return userRole === requiredRole;
}

export function isAdmin(userRole: Role | null): boolean {
  return userRole === "business_admin" || userRole === "platform_admin";
}

export function isPlatformAdmin(userRole: Role | null): boolean {
  return userRole === "platform_admin";
}

export function userHasAnyRole(userRole: Role | null, allowed: Role[]): boolean {
  return !!userRole && allowed.includes(userRole);
}

/**
 * Ownership verification helper
 * Ensures user is accessing resource they own/can access
 * 
 * Usage: verifyOwnership(res, bookingOrgId, ownerUserId)
 */
export function verifyOwnership(
  res: Response,
  resourceOrgId: string | null,
  resourceOwnerId?: string | null
): boolean {
  const auth = res.locals.auth;
  
  // Tenant check: resource must belong to user's org
  if (resourceOrgId !== auth.organizationId) {
    return false;
  }
  
  // Owner check: if specified, user must own resource OR be admin
  if (resourceOwnerId && resourceOwnerId !== auth.userId) {
    if (!isAdmin(auth.userRole)) {
      return false;
    }
  }
  
  return true;
}
