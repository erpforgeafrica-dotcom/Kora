# PHASE 5 PART 3: TENANT ISOLATION HARDENING - IMPLEMENTATION

**Date**: March 15, 2026  
**Phase**: 5 Part 3 (Tenant Isolation - CRITICAL Fix)  
**Severity**: CRITICAL - Cross-org data access vulnerability  
**Status**: 🔄 BEGINNING IMPLEMENTATION  

---

## VULNERABILITY OVERVIEW

### The Problem: Org Context from Headers
```typescript
// VULNERABLE CODE FOUND IN:
// - shared/http.ts (line 7)
// - shared/org.ts (line 3)
// - modules/analytics/routes.ts (4 instances)
// - middleware/enhancedErrorHandler.ts
// - middleware/rateLimiter.ts

// CURRENT (UNSAFE):
export function getRequiredOrganizationId(res: Response, headerOrganizationId?: string) {
  const organizationId = res.locals.auth?.organizationId || headerOrganizationId;
  if (!organizationId) throw new AppError("Missing organization context", 401);
  return organizationId;
}

// ❌ ATTACK SCENARIO:
// 1. Attacker authenticates as User A (org: org-acme)
// 2. Attacker calls GET /api/bookings/999
// 3. With header: x-org-id: org-evil
// 4. getRequiredOrganizationId() returns "org-evil"
// 5. Query runs: SELECT * FROM bookings WHERE id = 999 AND organization_id = 'org-evil'
// 6. Attacker sees org-evil's bookings without authorization!
```

### Root Cause Analysis

**Why This Happened:**
- Initial implementation tried to be flexible for testing/debugging
- Header fallback was added "just in case" JWT parsing fails
- Code was copied to multiple locations without revisiting its safety
- No security review before codebase expansion

**Why It's Critical:**
- Multi-tenancy isolation is foundational assumption
- Affects ALL routes in ALL modules
- Can expose: bookings, bookings, staff, services, clients, payments, clinical records, etc.
- No real audit trail (attacker looks like authorized user)

---

## REMEDIATION PLAN

### Phase 3A: Fix Core Vulnerability (THIS IMPLEMENTATION)

**Step 1: Update getRequiredOrganizationId() Function** (30 min)
- File: `shared/http.ts` (primary implementation)
- Remove header fallback parameter
- Make organizationId JWT-only

**Step 2: Update getRequiredOrganizationId() Function** (10 min)
- File: `shared/org.ts` (if duplicate, align with http.ts)

**Step 3: Fix Routes Using Vulnerable Pattern** (30 min)
- File: `modules/analytics/routes.ts` (4 instances)
- Remove header parameter from getRequiredOrganizationId() calls

**Step 4: Fix Middleware** (15 min)
- File: `middleware/enhancedErrorHandler.ts` - Don't trust x-org-id header
- File: `middleware/rateLimiter.ts` - Use JWT org context for rate limiting

**Step 5: Update Tests** (30 min)
- Remove `.set("x-org-id", "...")` header usage
- Ensure tests pass org context via JWT only
- Files: `__tests__/`, `test/` directories

**Estimated Effort**: 2.5 hours

### Phase 3B: Verify No Remaining Vulnerabilities (NOT THIS SESSION)

- Comprehensive grep for remaining x-org-id usage
- Archive code cleanup (move to disabled or delete)
- New code review checklist: "Never trust x-org-id header"

---

## IMPLEMENTATION: STEP 1-2 (Fix Core Functions)

### File: shared/http.ts

**CURRENT (VULNERABLE):**
```typescript
export function getRequiredOrganizationId(res: Response, headerOrganizationId?: string) {
  const organizationId = res.locals.auth?.organizationId || headerOrganizationId;
  if (!organizationId) throw new AppError("Missing organization context", 401);
  return organizationId;
}
```

**CORRECTED:**
```typescript
export function getRequiredOrganizationId(res: Response): string {
  const organizationId = res.locals.auth?.organizationId;
  if (!organizationId) throw new AppError("Unauthorized: missing organization context", 401);
  return organizationId;
  // ✅ Org context ONLY from JWT (via authenticated middleware)
  // ✅ No header fallback possible
}
```

### File: shared/org.ts

**STATUS**: Check if duplicate of http.ts
- If yes: Delete this file, import from http.ts instead
- If no: Apply same fix as above

---

## IMPLEMENTATION: STEP 3 (Fix Routes)

### File: modules/analytics/routes.ts (4 instances to fix)

**Location 1 (line 13):**
```typescript
// BEFORE:
const organizationId = getRequiredOrganizationId(res, req.header("x-org-id"));

// AFTER:
const organizationId = getRequiredOrganizationId(res);
```

**Locations 2-4**: Same pattern at lines 198, 266 (adjust as needed)

---

## IMPLEMENTATION: STEP 4 (Fix Middleware)

### File: middleware/enhancedErrorHandler.ts (line 86)

**BEFORE:**
```typescript
organizationId: req.headers["x-org-id"],
```

**AFTER:**
```typescript
organizationId: res.locals.auth?.organizationId || "unknown",
// ✅ Use JWT org context, fallback to "unknown" for logging (safe)
```

### File: middleware/rateLimiter.ts (line 62)

**BEFORE:**
```typescript
const orgId = req.headers["x-org-id"] as string;
```

**AFTER:**
```typescript
const orgId = res.locals.auth?.organizationId || "anonymous";
// ✅ Rate limit per JWT-authenticated org, fallback for anonymous users
```

---

## IMPLEMENTATION: STEP 5 (Update Tests)

### Test Files Affected

**Files with x-org-id headers** (remove from test calls):
- `__tests__/crudRoutes.test.ts` (4 instances)
- `__tests__/crud-integration.test.ts` (16 instances)
- `test/ai.test.ts` (6 instances)
- `test/analytics.test.ts` (7 instances)
- `test/emergency.test.ts` (16 instances)

**Action**: Remove all `.set("x-org-id", "...")` lines
- Tests should pass org context via JWT token only (already in auth headers)
- Example: If test uses `businessAdminToken`, org is already in JWT

**Expected Result**: Tests still pass with org isolated via JWT

---

## SECURITY TESTS TO ADD AFTER FIX

### Test: Cannot Override Org via Header
```typescript
describe("SECURITY: Tenant Isolation", () => {
  it("Cannot access other org's data via x-org-id header override", async () => {
    // Setup: User A in org-acme, User B in org-evil
    const userAToken = generateToken({ userId: "user-a", organizationId: "org-acme" });
    const userBBooking = await createBooking(org: "org-evil", id: "booking-999");
    
    // Attack: User A tries to spoof org-evil
    const res = await request(app)
      .get("/api/bookings/booking-999")
      .set("Authorization", `Bearer ${userAToken}`)
      .set("x-org-id", "org-evil");  // ← Attacker tries to override
    
    // ✅ Expected: 404 or 403 (org-acme booking doesn't exist, org-evil not accessible)
    expect([403, 404]).toContain(res.status);
  });
  
  it("Header x-org-id is completely ignored", async () => {
    const res = await request(app)
      .get("/api/bookings")
      .set("Authorization", `Bearer ${userAToken}`)
      .set("x-org-id", "randomorgid123");
    
    // Should return bookings for org-acme ONLY (from JWT), not random org
    expect(res.body.bookings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ organizationId: "org-acme" })
      ])
    );
    expect(res.body.bookings).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ organizationId: "randomorgid123" })
      ])
    );
  });
});
```

---

## VERIFICATION CHECKLIST

After implementing Phase 3:

- [ ] `shared/http.ts` - getRequiredOrganizationId() no longer accepts header parameter
- [ ] `shared/org.ts` - Aligned or deleted
- [ ] `modules/analytics/routes.ts` - All 4 getRequiredOrganizationId() calls fixed
- [ ] `middleware/enhancedErrorHandler.ts` - Uses JWT org only
- [ ] `middleware/rateLimiter.ts` - Uses JWT org only
- [ ] All tests pass without x-org-id headers
- [ ] No compilation errors
- [ ] Security tests added for tenant isolation
- [ ] Code review: Grep confirms no remaining `req.header.*org` in active code

---

## RISK MITIGATION

**Deploy Plan** (for production):
1. ✅ Fix complete before Part 4
2. ✅ Security tests pass
3. ✅ Deploy to staging first
4. ✅ Manual penetration test: attempt header override attack
5. ✅ Monitor logs for any x-org-id header usage
6. ✅ Deploy to production with confidence

**Rollback Plan**:
- If issue found: Revert this commit, escalate to security team
- Logs will show any attempts to use header override (will be logged as "org-acme tried to access org-evil")

---

## SUMMARY

**Vulnerability**: Org context accepted from untrusted headers  
**Risk**: Cross-tenant data access, unauditable  
**Fix**: JWT-only org context (remove header fallback)  
**Effort**: ~2.5 hours  
**Status**: Ready to implement immediately  
**Confidence**: HIGH - straightforward security fix  

