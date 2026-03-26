import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../middleware/auth.js';

function makeMockAuth(role: Role, userId = "test-user", organizationId = "org-1") {
  return (req: Request, res: Response, next: NextFunction) => {
    req.user = { id: userId, role, organization_id: organizationId };
    res.locals.auth = { userId, userRole: role, organizationId, sessionId: null, tokenJti: null };
    next();
  };
}

/**
 * Canonical test auth mock - preserves exact contract from auth.ts
 * Use in all tests: vi.mock('../middleware/auth.js', authMockFactory);
 */
export const authMockFactory = async (importOriginal: any) => {
  const actual = await importOriginal();
  return {
    ...actual,
    requireAuth: makeMockAuth("platform_admin"),
    optionalAuth: (_req: Request, _res: Response, next: NextFunction) => next(),
  };
};

/**
 * Role-specific mock helper
 */
export const authMockWithRole = (role: Role = "platform_admin") => async (importOriginal: any) => {
  const actual = await importOriginal();
  return {
    ...actual,
    requireAuth: makeMockAuth(role),
    optionalAuth: (_req: Request, _res: Response, next: NextFunction) => next(),
  };
};

