# KORA SYSTEM GOVERNANCE REPORT
Generated: locked state after governance pass

---

## SECTION 1 — SYSTEM SNAPSHOT (VERIFIED FACTS)

### What is TRUE
- Backend TypeScript compiles with 0 errors (verified prior session)
- `requireAuth` and `optionalAuth` are both exported from `middleware/auth.ts`
- `optionalAuth` never throws — silent on invalid token
- Test-mode auth injection works via `x-test-user-id`, `x-test-role`, `x-test-org-id` headers
- `app.ts` applies `requireAuth` globally to all protected module routes
- `vitest.config.ts` has `setupFiles: ["./src/test/setup.ts"]`
- `test/setup.ts` sets all required env vars before module load
- `test/authMock.ts` exports `authMockFactory` and `authMockWithRole`
- `test/testAppFactory.ts` mocks auth at module level via `vi.mock`
- Emergency, clinical, delivery, bookings modules all have real DB-backed routes
- State machine transitions were NOT enforced in emergency routes (now fixed)
- `shared/response.ts` existed but used flat spread (no `success` field) — now fixed

### What was BROKEN (now corrected)
| # | File | Issue | Fix Applied |
|---|------|-------|-------------|
| 1 | `shared/response.ts` | No `success` field in any response | Rewritten — all responses include `success: true/false` |
| 2 | `middleware/auth.ts` | Missing clinical roles in `Role` type and `ROLE_ALIASES` | Added: doctor, nurse, pharmacist, lab_scientist, caregiver |
| 3 | `middleware/rbac.ts` | `CANONICAL_ROLES` missing clinical roles — `requireRole` throws at startup | Added all 5 clinical roles |
| 4 | `modules/bookings/routes.ts` | 4 raw `res.status(201).json(...)` calls bypassing envelope | Replaced with `respondSuccess(..., 201)` |
| 5 | `modules/clinical/routes.ts` | Patient POST used raw `res.status(201).json(row[0])` | Fixed; clinical roles added to `requireRole` calls |
| 6 | `modules/delivery/routes.ts` | `router.use(requireAuth)` duplicated (app.ts already applies it); assignments POST and POD POST used raw `res.status(201).json(row)` | Removed duplicate auth; all calls use `respondSuccess` |
| 7 | `modules/emergency/routes.ts` | Inline `res.status(400).json({ error: {...} })` bypassing `respondError`; no state machine enforcement | Rewritten with `respondError`; state machine enforced on status transitions |
| 8 | `middleware/enhancedErrorHandler.ts` | Error response missing `success: false`; `context` key used instead of `details` | Fixed: `success: false`, `details` key, code uppercased |
| 9 | Pagination contract | `respondList` used `{ offset, hasMore }` not `{ page, total_pages }` | Rewritten to `{ page, limit, total, total_pages }` |

### What is DUPLICATED
- `shared/http.ts` and `shared/org.ts` both export `getRequiredOrganizationId` — different files used by different modules. No conflict but should be consolidated. **Deferred — DB team alignment required.**
- `modules/bookings/routes.ts` and `modules/bookings/workflowRoutes.ts` — separate files for same resource. Acceptable as workflow is a sub-domain.

### What is UNDEFINED / PENDING
- Content module (`/api/content`) — no backend routes exist. Frontend `ContentModule.tsx` uses mock data. **Hidden until wired.**
- Blog/content DB schema — no migration exists.
- `delivery_agents` table assumed to exist from migration 032. Not verified against live DB.

---

## SECTION 2 — LOCKED CONTRACTS

### API Response Contract
```
SUCCESS:  { "success": true,  "data": any,   "meta": PaginationMeta | null }
ERROR:    { "success": false, "error": { "code": "UPPER_SNAKE_CASE", "message": string, "details"?: any } }
```
**File:** `backend/src/shared/response.ts`
**Status:** LOCKED ✅

### Auth Contract
```
requireAuth  → 401 { success: false, error: { code: "UNAUTHORIZED", ... } } if missing/invalid
optionalAuth → never throws, never returns 401
Both exported from middleware/auth.ts
Both test-compatible via x-test-* headers
```
**File:** `backend/src/middleware/auth.ts`
**Status:** LOCKED ✅

### Pagination Contract
```
{ "success": true, "data": [], "meta": { "page": number, "limit": number, "total": number, "total_pages": number } }
```
**File:** `backend/src/shared/response.ts` → `respondList()`
**Status:** LOCKED ✅

### State Machine Contract
**File:** `backend/src/shared/stateMachines.ts`

| Module | States | Enforced |
|--------|--------|----------|
| Booking | pending→confirmed→in_progress→completed | ✅ defined |
| Emergency | open→dispatched→en_route→on_scene→resolved | ✅ enforced in routes |
| Delivery | pending→assigned→picked_up→in_transit→delivered | ✅ defined |
| Subscription | trialing→active→past_due→cancelled/expired | ✅ defined |

**Status:** LOCKED ✅

---

## SECTION 3 — TEAM RESPONSIBILITY MAP

### Backend Team — OWNS
- `backend/src/modules/*/routes.ts`
- `backend/src/middleware/auth.ts`, `rbac.ts`, `enhancedErrorHandler.ts`
- `backend/src/shared/response.ts`, `stateMachines.ts`
- State machine enforcement in route handlers
- Error code format (UPPER_SNAKE_CASE)

### Backend Team — MUST NOT
- Change UI logic or frontend files
- Change DB schema without DB team sign-off

### Database Team — OWNS
- `backend/src/db/migrations/*.sql`
- Table relationships, indexes, audit logs

### Database Team — MUST NOT
- Change API contracts
- Define business logic in SQL beyond constraints

### Frontend Team — OWNS
- `frontend/src/pages/**`
- `frontend/src/components/**`
- `frontend/src/config/navigation.ts`
- `frontend/src/App.tsx` route wiring

### Frontend Team — MUST NOT
- Invent API response formats
- Bypass `{ success, data, meta }` envelope when parsing responses
- Add roles not defined in `dashboardAccess.ts`

### QA Team — AUTHORITY LAYER
- `backend/src/test/qa-contract-enforcement.test.ts` — MUST pass before any merge
- Has power to reject non-compliant output
- Validates: envelope, error codes, 401/403 correctness, pagination, state machines

---

## SECTION 4 — CONFLICTS DETECTED AND RESOLVED

| Conflict | Resolution |
|----------|------------|
| `delivery/routes.ts` applied `requireAuth` internally while `app.ts` also applied it | Removed internal duplicate |
| Clinical roles existed in frontend `navigation.ts` but not in backend `Role` type or `CANONICAL_ROLES` | Added to both |
| `respondSuccess` spread objects flat — no `success` field | Rewritten with strict envelope |
| Emergency status transitions had no guard — any status could be set to any value | State machine enforced in PATCH handler |
| Error responses used `context` key — contract requires `details` | Standardized to `details` |

---

## SECTION 5 — VIOLATIONS REMAINING

| # | Location | Violation | Owner | Priority |
|---|----------|-----------|-------|----------|
| 1 | All other module routes not audited in this pass (payments, crm, staff, clients, etc.) | May still use raw `res.json()` without `success` field | Backend Team | HIGH |
| 2 | `shared/http.ts` vs `shared/org.ts` — duplicate `getRequiredOrganizationId` | Consolidation needed | Backend Team | MEDIUM |
| 3 | Content module has no backend routes | Frontend uses mock data | Backend Team | LOW (deferred) |
| 4 | `respondList` not yet used by any route — all lists use `respondSuccess` with inline count | Adopt `respondList` for paginated endpoints | Backend Team | MEDIUM |

---

## SECTION 6 — FINAL COMPLIANCE STATUS

| Contract | Status |
|----------|--------|
| API response envelope (`success` field) | ✅ LOCKED |
| Error code format (UPPER_SNAKE_CASE) | ✅ LOCKED |
| Auth — 401 vs 403 correctness | ✅ LOCKED |
| optionalAuth never throws | ✅ LOCKED |
| Pagination structure | ✅ LOCKED |
| State machines defined | ✅ LOCKED |
| State machine enforced in emergency routes | ✅ DONE |
| Clinical roles in backend Role type | ✅ DONE |
| Duplicate auth middleware removed | ✅ DONE |
| QA enforcement test suite | ✅ CREATED |
| Remaining module routes audited | ⚠️ PENDING |
| Content backend routes | ⚠️ DEFERRED |
