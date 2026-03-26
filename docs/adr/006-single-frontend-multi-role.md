# ADR 006: Single Frontend Instance with Multi-Role Routing

**Status**: Accepted  
**Date**: 2024-03-10  
**Context**: Disk space constraints preventing multiple Vite dev server instances

## Context

KÓRA platform has 5 role-based dashboards:
- Client
- Business Admin
- Staff
- Operations
- Platform Admin

Initial implementation spawned 5 separate Vite dev servers (ports 5174-5178), but:
- Drive C: had 0 GB free space
- Vite instances failed unpredictably (esbuild spawn errors)
- Only 1-2 ports stayed stable
- Development workflow broken

## Decision

**Implement single frontend instance with URL-based role switching.**

### Solution
1. Run one Vite dev server on port 5174
2. Accept `?role=` query parameter for role override
3. Maintain existing Clerk auth + role detection
4. Fallback to query param when auth unavailable

### Implementation
```typescript
// frontend/src/auth/dashboardAccess.ts
export function getUserRole(): UserRole {
  const { user } = useUser();
  
  // 1. Check URL query param (dev override)
  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get("role");
  if (roleParam) return roleParam as UserRole;
  
  // 2. Check Clerk metadata
  return user?.publicMetadata?.role || "client";
}
```

### Access Pattern
```
http://localhost:5174/app/client?role=client
http://localhost:5174/app/business-admin?role=business_admin
http://localhost:5174/app/staff?role=staff
http://localhost:5174/app/operations?role=operations
http://localhost:5174/app/kora-admin?role=platform_admin
```

## Consequences

### Positive ✅
- **Disk space**: Reduced from 5 Vite instances to 1
- **Stability**: Single process = no spawn failures
- **Development**: Faster startup, easier debugging
- **Resource usage**: Lower memory/CPU consumption
- **Deterministic**: URL-based role always works

### Negative ⚠️
- **Security**: Query param can override auth (dev only)
- **Production**: Must disable query param override
- **Testing**: Need to test role switching explicitly

### Neutral
- **Auth model**: Unchanged (Clerk still primary)
- **Routing**: Unchanged (same route structure)
- **Components**: Unchanged (no code changes needed)

## Alternatives Considered

### Alternative 1: Free Disk Space
- **Rejected**: Outside repo control, temporary fix

### Alternative 2: Use Production Build
- **Rejected**: Loses hot reload, slower iteration

### Alternative 3: Remote Dev Server
- **Rejected**: Network latency, complexity

## Implementation Notes

### Production Safety
```typescript
// Disable query param override in production
if (process.env.NODE_ENV === "production") {
  // Ignore ?role= param, use Clerk only
}
```

### Testing Strategy
```typescript
// E2E tests should use query param
cy.visit("/app/business-admin?role=business_admin");
cy.get("[data-testid=dashboard-title]").should("contain", "Business Admin");
```

### Monitoring
- Track role switches in analytics
- Alert if query param used in production

## References
- Issue: Disk space constraint (0 GB free)
- PR: [Link to implementation PR]
- Related: ADR 002 (Clerk Authentication)

## Review Schedule
- **Next Review**: After production deployment
- **Success Criteria**: Zero spawn failures, stable dev experience
