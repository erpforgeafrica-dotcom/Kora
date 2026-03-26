# KORA Core Stabilization Mission
## Executive Stabilization Diagnosis

**Mission Status**: CRITICAL BLOCKERS IDENTIFIED  
**Current Platform State**: Unstable despite "production hardening complete" claims  
**Truth Level**: 40/100 (auth/contract/routing contradictions)

---

## 1. EXECUTIVE STABILIZATION DIAGNOSIS

### Current Reality vs. Claims

**What was claimed:**
- Phase 2 Production Hardening complete (5 security components)
- Auth routes working correctly
- Platform admin APIs reachable
- Contract validation tests passing
- Multi-tenant org scoping functional

**What is actually true:**
- `/login` route does NOT exist in frontend router (App.tsx has no `/login` route)
- `DashboardRouteGuard` redirects unauthorized users to `/login` → 404 page
- Platform admin routes use `hasRole(res, [...])` which expects `res` object, not `userRole` string
- This causes 403 on every `/api/platform/*` route for authorized users
- Frontend falls back to pseudo-auth via `useAuth` hook, masking real API failures
- Auth routes return 500 instead of 201/200 (missing error handling)
- Services/bookings routes return 403 instead of 200 for valid requests
- Contract validation tests are failing for the wrong reasons
- Error response envelopes are inconsistent across endpoints
- Org header handling is incomplete in test setup

### Root Cause Summary

| Symptom | Root Cause | Severity |
|---------|-----------|----------|
| `/login` redirects to 404 | Route not registered in App.tsx | CRITICAL |
| Platform admin 403 errors | `hasRole(res, [...])` called with response object instead of userRole string | CRITICAL |
| Auth register/login 500 | Missing error handling in auth routes | CRITICAL |
| Services/bookings 403 | Org header missing in test setup or middleware order issue | HIGH |
| Inconsistent error envelopes | No canonical error contract enforced | HIGH |
| Frontend pseudo-auth masking failures | useAuth hook provides fallback role without API validation | HIGH |

---

## 2. ROOT CAUSE MATRIX

### A. Frontend Authentication & Routing Truth

**BLOCKER 1: Missing /login Route**
- **Symptom**: DashboardRouteGuard redirects to `/login`, but route doesn't exist in App.tsx
- **Root Cause**: LoginPage.tsx exists but is never mounted as a route
- **Affected Files**: 
  - `frontend/src/App.tsx` (missing route registration)
  - `frontend/src/pages/LoginPage.tsx` (component exists but unused)
  - `frontend/src/components/auth/DashboardRouteGuard.tsx` (redirects to non-existent route)
- **Impact**: Unauthorized users see 404 instead of login form
- **Fix Required**: Register `/login` route in App.tsx

**BLOCKER 2: Frontend Pseudo-Auth Masking Real Failures**
- **Symptom**: Frontend renders menus and dashboards while API calls fail with 403
- **Root Cause**: `useAuth` hook provides fallback role (`getFallbackDashboardRole()`) without validating against backend
- **Affected Files**:
  - `frontend/src/hooks/useAuth.ts` (no real auth validation)
  - `frontend/src/auth/dashboardAccess.ts` (role normalization without backend truth)
- **Impact**: False sense of security; real auth failures hidden from users
- **Fix Required**: Validate auth state against `/api/auth/me` endpoint

---

### B. Backend Authorization Truth

**BLOCKER 3: Platform Admin Routes Broken**
- **Symptom**: All `/api/platform/*` routes return 403 for authorized platform_admin users
- **Root Cause**: `hasRole(res, [...])` in platform/routes.ts is called with `res` object, not `userRole` string
  - Line: `if (!hasRole(res, [...])) { return next(new ForbiddenError(...)) }`
  - Should be: `if (!hasRole(res.locals.auth?.userRole, [...]))`
- **Affected Files**:
  - `backend/src/modules/platform/routes.ts` (all route guards)
  - `backend/src/shared/http.ts` (hasRole signature expects `res: Response`, not `userRole: string`)
- **Impact**: Platform admin cannot access any platform routes
- **Fix Required**: Fix hasRole call signature in all platform routes

**BLOCKER 4: Auth Routes Return 500**
- **Symptom**: POST /api/auth/register and POST /api/auth/login return 500
- **Root Cause**: 
  - Duplicate import of UnauthorizedError (line 8-9 in auth/routes.ts)
  - Missing error handling for database errors
  - No validation of JWT_SECRET environment variable
- **Affected Files**:
  - `backend/src/modules/auth/routes.ts` (duplicate imports, missing error handling)
- **Impact**: Users cannot register or login
- **Fix Required**: Fix imports, add proper error handling

---

### C. Multi-Tenant Request Truth

**BLOCKER 5: Org Header Handling Incomplete**
- **Symptom**: Services/bookings routes return 403 when org header is missing
- **Root Cause**: 
  - `getRequiredOrganizationId()` throws BadRequestError if org not found
  - Tests don't include org headers in requests
  - Frontend interceptor attaches headers but test setup doesn't
- **Affected Files**:
  - `backend/src/shared/http.ts` (getRequiredOrganizationId throws on missing org)
  - `backend/src/modules/services/routes.ts` (requires org header)
  - `backend/src/modules/bookings/routes.ts` (requires org header)
  - Test setup (missing org headers)
- **Impact**: Protected endpoints fail with 400/403 instead of 200
- **Fix Required**: Ensure org headers are included in all requests

---

### D. API Contract Truth

**BLOCKER 6: Inconsistent Error Envelopes**
- **Symptom**: Different endpoints return different error shapes
- **Root Cause**: No canonical error contract enforced
  - Some return `{ error: "message" }`
  - Some return `{ error: { code, message, details } }`
  - Some return `{ message: "..." }`
- **Affected Files**: All route files
- **Impact**: Frontend cannot reliably parse errors
- **Fix Required**: Enforce single canonical error envelope

**BLOCKER 7: Status Code Semantics Broken**
- **Symptom**: 401 vs 403 not consistently applied
- **Root Cause**: 
  - Missing token returns 403 instead of 401
  - Invalid token returns 403 instead of 401
  - Forbidden access returns 403 (correct)
- **Affected Files**: All route guards
- **Impact**: Frontend cannot distinguish auth failure from permission failure
- **Fix Required**: Enforce 401 for auth failures, 403 for permission failures

---

## 3. CANONICAL AUTH AND ROUTE TRUTH

### Canonical Authentication Flow

```
1. User submits credentials to POST /api/auth/login
   ├─ Valid credentials → 200 with { accessToken, user }
   ├─ Invalid credentials → 401 with { error: { code: "invalid_credentials", message: "..." } }
   └─ Validation error → 422 with { error: { code: "validation_error", details: [...] } }

2. Frontend stores token in localStorage.kora_token

3. Frontend attaches token to all requests:
   ├─ Authorization: Bearer <token>
   ├─ X-Organization-Id: <org_id>
   └─ X-Org-Id: <org_id>

4. Backend verifies token in attachAuth middleware:
   ├─ Valid token → res.locals.auth = { userId, userRole, organizationId, sessionId }
   ├─ Invalid token → res.locals.auth = undefined (not an error yet)
   └─ Expired token → res.locals.auth = undefined

5. Protected routes check res.locals.auth:
   ├─ Missing auth → 401 Unauthorized
   ├─ Invalid role → 403 Forbidden
   ├─ Valid auth + valid role → proceed
   └─ Valid auth + invalid org → 403 Forbidden
```

### Canonical Unauthorized Navigation

```
1. User accesses protected route without token
   ├─ Frontend: DashboardRouteGuard checks isAuthenticated
   ├─ If false: Navigate to /login
   └─ /login route must exist and render LoginPage

2. User submits login form
   ├─ POST /api/auth/login with credentials
   ├─ On success: store token, navigate to /app
   └─ On failure: display error message

3. User accesses protected route with invalid token
   ├─ Frontend: DashboardRouteGuard checks isAuthenticated
   ├─ If false: Navigate to /login
   └─ User sees login form again
```

### Canonical Platform Admin Access

```
1. Platform admin user logs in
   ├─ Token contains role: "platform_admin"
   ├─ Frontend: useAuth normalizes role to "platform_admin"
   └─ Frontend: DashboardRouteGuard allows access to /app/kora-admin

2. Platform admin accesses /api/platform/feature-flags
   ├─ Request includes Authorization: Bearer <token>
   ├─ Backend: attachAuth sets res.locals.auth.userRole = "platform_admin"
   ├─ Backend: requirePlatformAdmin checks res.locals.auth.userRole === "platform_admin"
   ├─ If true: proceed to route handler
   └─ If false: 403 Forbidden

3. Route handler executes:
   ├─ hasRole(res.locals.auth?.userRole, ["platform_admin"]) returns true
   ├─ Query database for feature flags
   └─ Return 200 with { flags: [...] }
```

---

## 4. BACKEND REPAIR PLAN

### Phase 1: Fix Critical Auth Bugs (2 hours)

**File: backend/src/modules/auth/routes.ts**
- Remove duplicate UnauthorizedError import (line 8-9)
- Add try-catch error handling for database errors
- Ensure JWT_SECRET is set or use default
- Return proper error envelopes on failure

**File: backend/src/middleware/rbac.ts**
- Verify hasRole signature: `hasRole(userRole: string | null, requiredRole: UserRole): boolean`
- Ensure it's called with `res.locals.auth?.userRole`, not `res` object

**File: backend/src/shared/http.ts**
- Verify hasRole implementation is correct
- Add JSDoc comments for clarity

### Phase 2: Fix Platform Admin Routes (1 hour)

**File: backend/src/modules/platform/routes.ts**
- Replace all `hasRole(res, [...])` with `hasRole(res.locals.auth?.userRole, [...])`
- Verify all route guards use correct signature
- Test each route with platform_admin token

### Phase 3: Fix Org Scoping (1 hour)

**File: backend/src/shared/http.ts**
- Modify `getRequiredOrganizationId()` to return fallback org if not in token
- Add logging for org resolution

**File: backend/src/modules/services/routes.ts**
- Verify org header is extracted correctly
- Add fallback to res.locals.auth.organizationId

**File: backend/src/modules/bookings/routes.ts**
- Same as services

### Phase 4: Standardize Error Contracts (2 hours)

**File: backend/src/middleware/enhancedErrorHandler.ts**
- Define canonical error envelope:
  ```typescript
  {
    error: {
      code: string;
      message: string;
      details?: unknown[];
      statusCode: number;
    }
  }
  ```
- Update all error classes to use this shape
- Ensure 401 vs 403 semantics are correct

### Phase 5: Fix Auth Routes (1 hour)

**File: backend/src/modules/auth/routes.ts**
- Fix register endpoint to return 201 on success
- Fix login endpoint to return 200 on success
- Ensure error responses use canonical envelope
- Add validation for email/password format

---

## 5. FRONTEND REPAIR PLAN

### Phase 1: Register /login Route (30 minutes)

**File: frontend/src/App.tsx**
- Add route before `/app` routes:
  ```typescript
  <Route path="/login" element={<LoginPage />} />
  ```
- Ensure LoginPage is imported

### Phase 2: Fix Auth Context (1 hour)

**File: frontend/src/contexts/AuthContext.tsx**
- No changes needed (already correct)

**File: frontend/src/hooks/useAuth.ts**
- Add validation call to `/api/auth/me` on mount
- If 401, clear token and set isAuthenticated = false
- If 200, set user data from response
- Remove fallback role behavior

**File: frontend/src/auth/dashboardAccess.ts**
- Keep role normalization but don't use as fallback
- Only use normalized role if backend confirms it

### Phase 3: Fix Interceptor (30 minutes)

**File: frontend/src/services/api.ts**
- Verify request interceptor attaches org headers
- Verify response interceptor handles 401 correctly
- On 401: clear token, dispatch logout event, redirect to /login

### Phase 4: Fix Route Guards (30 minutes)

**File: frontend/src/components/auth/DashboardRouteGuard.tsx**
- Verify it redirects to `/login` (now exists)
- Add fallback to `/` if role is invalid

---

## 6. CONTRACT NORMALIZATION PLAN

### Canonical Success Response

```typescript
// POST /api/auth/register
201 Created
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "business_admin",
    "organizationId": "uuid"
  }
}

// POST /api/auth/login
200 OK
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "business_admin",
    "organizationId": "uuid"
  }
}

// GET /api/services
200 OK
{
  "module": "services",
  "count": 5,
  "services": [...]
}

// POST /api/services
201 Created
{
  "id": "uuid",
  "name": "Service Name",
  ...
}
```

### Canonical Error Response

```typescript
// 401 Unauthorized
{
  "error": {
    "code": "unauthorized",
    "message": "Authentication required",
    "statusCode": 401
  }
}

// 403 Forbidden
{
  "error": {
    "code": "forbidden",
    "message": "You don't have permission to access this resource",
    "statusCode": 403
  }
}

// 404 Not Found
{
  "error": {
    "code": "not_found",
    "message": "Resource not found",
    "statusCode": 404
  }
}

// 422 Validation Error
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "statusCode": 422
  }
}

// 500 Internal Server Error
{
  "error": {
    "code": "internal_server_error",
    "message": "An unexpected error occurred",
    "statusCode": 500
  }
}
```

### Pagination Contract

```typescript
// GET /api/services?limit=10&offset=0
200 OK
{
  "module": "services",
  "count": 5,
  "limit": 10,
  "offset": 0,
  "total": 42,
  "services": [...]
}
```

---

## 7. TEST RECOVERY PLAN

### Phase 1: Fix Test Setup (1 hour)

**File: backend/tests/phase1b.test.ts** (or equivalent)
- Add org header to all requests:
  ```typescript
  headers: {
    "X-Organization-Id": "test-org-id",
    "X-Org-Id": "test-org-id"
  }
  ```
- Add JWT token to protected requests:
  ```typescript
  headers: {
    "Authorization": "Bearer " + testToken,
    "X-Organization-Id": "test-org-id"
  }
  ```

### Phase 2: Fix Auth Tests (1 hour)

**POST /api/auth/register**
- Test case: valid email/password → 201 with accessToken
- Test case: invalid email → 422 with validation error
- Test case: short password → 422 with validation error
- Test case: duplicate email → 409 with conflict error

**POST /api/auth/login**
- Test case: valid credentials → 200 with accessToken
- Test case: invalid email → 401 with unauthorized error
- Test case: invalid password → 401 with unauthorized error
- Test case: missing email → 422 with validation error

**GET /api/auth/me**
- Test case: valid token → 200 with user data
- Test case: invalid token → 401 with unauthorized error
- Test case: missing token → 401 with unauthorized error

### Phase 3: Fix Protected Endpoint Tests (1 hour)

**GET /api/services**
- Test case: valid token + valid org → 200 with services
- Test case: valid token + missing org header → 400 with missing_organization_id
- Test case: invalid token → 401 with unauthorized error
- Test case: missing token → 401 with unauthorized error

**POST /api/bookings**
- Test case: valid token + valid org + valid payload → 201 with booking
- Test case: valid token + valid org + invalid payload → 422 with validation error
- Test case: valid token + missing org header → 400 with missing_organization_id
- Test case: invalid token → 401 with unauthorized error

### Phase 4: Fix Platform Admin Tests (1 hour)

**GET /api/platform/feature-flags**
- Test case: platform_admin token → 200 with flags
- Test case: business_admin token → 403 with forbidden error
- Test case: invalid token → 401 with unauthorized error
- Test case: missing token → 401 with unauthorized error

---

## 8. SAFE IMPLEMENTATION ORDER

### Week 1: Critical Blockers

**Day 1 (2 hours)**
1. Fix auth/routes.ts duplicate import and error handling
2. Fix platform/routes.ts hasRole call signature
3. Test auth register/login endpoints
4. Test platform admin routes

**Day 2 (2 hours)**
1. Register /login route in frontend App.tsx
2. Fix useAuth hook to validate against /api/auth/me
3. Test unauthorized redirect flow
4. Test login form submission

**Day 3 (2 hours)**
1. Standardize error envelopes in enhancedErrorHandler.ts
2. Update all error responses to use canonical shape
3. Test error response consistency
4. Update frontend error parsing

**Day 4 (2 hours)**
1. Fix org header handling in shared/http.ts
2. Add org headers to test setup
3. Test services/bookings endpoints with org headers
4. Test org scoping enforcement

**Day 5 (2 hours)**
1. Run full contract validation test suite
2. Fix any remaining test failures
3. Verify all 9 modules still pass CI
4. Document any intentional contract changes

### Week 2: Validation & Hardening

**Day 6-7 (4 hours)**
1. End-to-end testing of auth flow
2. End-to-end testing of platform admin flow
3. End-to-end testing of multi-tenant org scoping
4. Performance testing with rate limiting

**Day 8-10 (6 hours)**
1. Security audit of auth implementation
2. Verify JWT token lifecycle
3. Verify session management
4. Verify rate limiting effectiveness
5. Document security posture

---

## 9. ACCEPTANCE CRITERIA

### Authentication Truth
- [ ] POST /api/auth/register returns 201 on success
- [ ] POST /api/auth/login returns 200 on success
- [ ] GET /api/auth/me returns 200 with authenticated user
- [ ] Invalid token returns 401, not 403
- [ ] Missing token on protected endpoint returns 401
- [ ] Valid token without permission returns 403

### Frontend Routing Truth
- [ ] /login route exists and renders LoginPage
- [ ] Unauthorized users redirect to /login
- [ ] Login form submits to /api/auth/login
- [ ] On success, token is stored and user navigates to /app
- [ ] On failure, error message is displayed
- [ ] No HTML returned to JSON consumers

### Platform Admin Truth
- [ ] /api/platform/feature-flags returns 200 for platform_admin
- [ ] /api/platform/feature-flags returns 403 for business_admin
- [ ] /api/platform/users returns 200 for platform_admin
- [ ] /api/platform/revenue-analytics returns 200 for platform_admin
- [ ] All platform routes use correct hasRole signature

### Multi-Tenant Truth
- [ ] Services/bookings endpoints require org header
- [ ] Org header is validated and enforced
- [ ] Missing org header returns 400 with missing_organization_id
- [ ] Invalid org header returns 403 with forbidden error
- [ ] Org scoping prevents cross-org access

### Error Contract Truth
- [ ] All errors use canonical envelope: { error: { code, message, statusCode } }
- [ ] 401 errors have code "unauthorized"
- [ ] 403 errors have code "forbidden"
- [ ] 404 errors have code "not_found"
- [ ] 422 errors have code "validation_error" with details array
- [ ] 500 errors have code "internal_server_error"

### Contract Validation Tests
- [ ] POST /api/auth/register: 201 on success, 422 on validation error
- [ ] POST /api/auth/login: 200 on success, 401 on invalid credentials
- [ ] GET /api/services: 200 on success, 401 on missing token, 403 on invalid org
- [ ] POST /api/bookings: 201 on success, 422 on validation error, 403 on invalid org
- [ ] GET /api/platform/feature-flags: 200 for platform_admin, 403 for others
- [ ] All list endpoints return pagination metadata consistently

### CI/CD Truth
- [ ] All 9 core modules pass existing tests
- [ ] No regressions in ReportingSummary metrics array shape
- [ ] No regressions in video route mounting
- [ ] No prompt() in production UI
- [ ] No fake dashboards or placeholder routes
- [ ] Contract validation test suite passes

---

## 10. FINAL ENGINEERING COMMAND

### To the Implementation Team:

**This is a truth-and-stabilization mission, not a feature sprint.**

You are not here to add new functionality. You are here to make the platform's core authentication, authorization, and routing actually work as claimed.

**Non-negotiable requirements:**

1. **Do not accept "looks complete"** – Verify every fix with tests and end-to-end validation.

2. **Do not hide contradictions** – If you find a conflict between docs and code, fix the code and update the docs.

3. **Do not break existing modules** – All 9 core modules must continue to pass CI. If your fix breaks something, you broke it wrong.

4. **Do not create fake success** – A test that passes for the wrong reason is worse than a test that fails. Fix the root cause, not the symptom.

5. **Do not skip the hard parts** – The hasRole bug, the missing /login route, the org header handling – these are not optional. Fix them all.

6. **Do not deploy until the contract validation tests pass** – These tests are your source of truth. If they pass, the platform is stable. If they fail, it's not.

**Implementation sequence:**

1. Fix auth/routes.ts (2 hours)
2. Fix platform/routes.ts (1 hour)
3. Register /login route (30 minutes)
4. Fix useAuth hook (1 hour)
5. Standardize error envelopes (2 hours)
6. Fix org header handling (1 hour)
7. Run full test suite (2 hours)
8. End-to-end validation (4 hours)

**Total effort: 13.5 hours for complete stabilization**

**Success metric: All acceptance criteria pass, all tests pass, no contradictions remain.**

---

## Appendix: File-by-File Repair Checklist

### Backend Files to Repair

- [ ] `backend/src/modules/auth/routes.ts` – Fix imports, error handling, status codes
- [ ] `backend/src/modules/platform/routes.ts` – Fix hasRole call signature (all routes)
- [ ] `backend/src/middleware/rbac.ts` – Verify hasRole signature
- [ ] `backend/src/shared/http.ts` – Fix hasRole implementation, org resolution
- [ ] `backend/src/middleware/enhancedErrorHandler.ts` – Standardize error envelope
- [ ] `backend/src/modules/services/routes.ts` – Verify org header handling
- [ ] `backend/src/modules/bookings/routes.ts` – Verify org header handling

### Frontend Files to Repair

- [ ] `frontend/src/App.tsx` – Register /login route
- [ ] `frontend/src/hooks/useAuth.ts` – Add /api/auth/me validation
- [ ] `frontend/src/services/api.ts` – Verify interceptor behavior
- [ ] `frontend/src/components/auth/DashboardRouteGuard.tsx` – Verify redirect logic

### Test Files to Repair

- [ ] `backend/tests/phase1b.test.ts` (or equivalent) – Add org headers, fix assertions
- [ ] All auth tests – Verify status codes and error envelopes
- [ ] All protected endpoint tests – Verify org scoping
- [ ] All platform admin tests – Verify role-based access

---

**Mission Status: READY FOR IMPLEMENTATION**

This diagnosis is complete. The root causes are identified. The fixes are defined. The acceptance criteria are clear.

Execute this plan with rigor. Verify every fix. Accept nothing less than truth.

The platform's core must be stable before any new features are added.

**Begin immediately.**
