import type { Request, Response, NextFunction, RequestHandler } from "express";

export type UserRole = "client" | "staff" | "business_admin" | "platform_admin";

export function attachAuth(req: Request, res: Response, next: NextFunction): Promise<void>;

export const requireRole: (...allowedRoles: any[]) => RequestHandler;
export const authorize: (...allowedRoles: any[]) => RequestHandler;

export function requireAdmin(req: Request, res: Response, next: NextFunction): void;
export function requirePlatformAdmin(req: Request, res: Response, next: NextFunction): void;
export function hasRole(userRole: string | null, requiredRole: UserRole): boolean;
export function isAdmin(userRole: string | null): boolean;
export function isPlatformAdmin(userRole: string | null): boolean;
export function userHasAnyRole(userRole: string | null, allowed: string[]): boolean;
export function resolveOrganizationContext(req: Request, res: Response, next: NextFunction): Promise<void>;
