import { vi } from 'vitest';
import type { Role } from '../middleware/auth.js';
import { createApp } from '../app.js';

function makeAuthMiddleware(role: Role, userId = 'test-user', organizationId = 'org-1') {
  return (req: any, res: any, next: any) => {
    req.user = { id: userId, role, organization_id: organizationId };
    res.locals.auth = { userId, userRole: role, organizationId, tokenJti: null, sessionId: null };
    next();
  };
}

vi.mock('../middleware/auth.js', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    requireAuth: makeAuthMiddleware('platform_admin'),
    optionalAuth: (_req: any, _res: any, next: any) => next(),
    authenticateRequest: makeAuthMiddleware('platform_admin'),
  };
});

export async function createTestApp(overrides: { role?: Role } = {}) {
  if (overrides.role) {
    const mw = makeAuthMiddleware(overrides.role);
    vi.doMock('../middleware/auth.js', async (importOriginal) => {
      const actual = await importOriginal() as any;
      return { ...actual, requireAuth: mw, optionalAuth: (_r: any, _s: any, n: any) => n(), authenticateRequest: mw };
    });
  }
  return createApp();
}

export function resetTestMocks() {
  vi.clearAllMocks();
}

