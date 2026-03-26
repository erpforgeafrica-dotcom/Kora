# SYSTEM SNAPSHOT & GOVERNANCE RECONCILIATION
**Date**: March 25, 2026  
**Status**: IN GOVERNANCE CONTROL  
**Authority**: System Governance Controller  

---

## SECTION 1: CURRENT STATE RECONCILIATION COMPLETE

### Part 1.1: What is Currently TRUE (Not Assumed)

#### A. Authentication Middleware Status
✅ **requireAuth** - EXPORTED
- Location: `src/middleware/auth.ts:82`
- Behavior: Rejects with 401 if token invalid/missing
- Sets: `res.locals.auth: { userId, userRole, organizationId, tokenJti }`
- Implementation: JWT verification via jsonwebtoken library

✅ **optionalAuth** - EXPORTED
- Location: `src/middleware/auth.ts:151`
- Behavior: Does NOT throw on missing token
- **ISSUE**: Silently fails on INVALID token (logs nowhere)
- Sets: `res.locals.auth` if token valid, undefined otherwise

✅ **Test Mode Auth Injection** - ACTIVE
- Location: `src/middleware/auth.ts:50`
- Method: Injects via headers (x-test-user-id, x-test-role, x-test-org-id)
- Fallback: Synchronous default auth if headers missing
- **ISSUE**: Synchronous test auth differs from async production JWT flow

---

#### B. Response Handling Status

✅ **respondSuccess()** - EXPORTED
- Location: `src/shared/response.ts:50`
- Current Behavior: Spreads flat objects `{...(data as any)}`
- Alternative: Wraps arrays as `{ data: [...] }`
- **ISSUE**: Two different response patterns; not standardized

✅ **respondList()** - EXPORTED
- Location: `src/shared/response.ts:61`
- Behavior: Returns `{ data: [...], meta: { pagination: {...}, timestamp, requestId } }`
- Standard: Proper pagination structure

✅ **respondError()** - EXPORTED
- Location: `src/shared/response.ts:85`
- Behavior: Returns `{ error: { code, message, context? } }`
- Error code format: MOSTLY correct but has edge cases (see audit)

---

#### C. API Route Registration Status

**Mounted Routes** (app.ts):
```
✅ /api/auth - public, no cache
✅ /api/clients - requireAuth, 300s cache
✅ /api/staff - requireAuth, 300s cache
✅ /api/services - requireAuth, 300s cache
✅ /api/bookings - requireAuth, 180s cache
✅ /api/payments - requireAuth, 60s cache + webhook handler
✅ /api/health - public, no cache
✅ /api/docs - public OpenAPI spec

🟡 /api/tenant - requireAuth, 600s cache (DUPLICATE)
🟡 /api/tenants - requireAuth, 600s cache (DUPLICATE)
🟡 /api/platform - requireAuth + resolveOrganizationContext (DUPLICATE)

✅ /api/discovery - optionalAuth, no cache (PUBLIC)
✅ /api/clinical - requireAuth
✅ /api/emergency - requireAuth
✅ /api/finance - requireAuth
✅ /api/ai - requireAuth + rate limit
✅ /api/notifications - requireAuth
✅ /api/reporting - requireAuth
✅ /api/analytics - requireAuth
✅ /api/workflows - requireAuth

🟡 /api/services/enhanced - requireAuth (DUPLICATE of /api/services)
🟡 /api/bookings/workflow - requireAuth (overlaps /api/bookings)
🟡 /api/payments/multi - requireAuth (overlaps /api/payments)
🟡 /api/payments/pos - requireAuth (overlaps /api/payments)
🟡 /api/video - requireAuth
🟡 /api/chatbot - requireAuth
🟡 /api/canva - requireAuth
... and 15+ more mounted routes
```

---

#### D. Database Schema Status

###### Migrations Applied: 43 total
- 001-043 define canonical schema
- Latest: `043_workflow_state_source_of_truth.sql`

**Key Tables**:
```
✅ users - email, password_hash, role, organization_id
✅ organizations - id, name (formerly business)
✅ clients - id, organization_id, full_name, email, phone
✅ services - id, organization_id, name, price_cents, duration_minutes, is_active
✅ bookings - id, organization_id, client_id, staff_member_id, service_id, start_time, end_time, status
✅ staff_members - id, organization_id, full_name, role, email, status
✅ booking_staff_assignments - booking_id, staff_member_id, assignment_type, status, confirmation_status
✅ workflow_states - entity_type, entity_id, current_state (SOT for state machines)
✅ workflow_transitions - from_state, to_state, triggered_by, metadata
✅ sessions - user_id, organization_id, token_jti, expires_at
✅ login_attempts - user_id, identifier, success, reason, ip_address, created_at
✅ password_history - user_id, password_hash, created_at
```

**State Machine Columns**:
```
bookings.status:
  - pending, confirmed, completed, cancelled, rescheduled

booking_staff_assignments.status:
  - assigned, confirmed, in_progress, completed, no_show, cancelled

booking_staff_assignments.confirmation_status:
  - pending, confirmed, declined, no_response

staff_shifts.shift_status:
  - scheduled, confirmed, in_progress, completed, cancelled, no_show

booking_waitlist.status:
  - waiting, notified, confirmed, expired, cancelled

workflow_states.current_state:
  - Flexible; defined per entity_type in workflow_definitions
```

---

#### E. Frontend Type Expectations

**File**: `frontend/src/types/index.ts`

Frontend defines and expects these TypeScript interfaces:
```typescript
Client {
  id, full_name, email, phone,
  loyalty_points, membership_tier, risk_score,
  preferred_staff_id, telehealth_consent, preferences,
  photo_url, balance_due,
  upcoming_bookings: [], booking_history: [], invoices: []
}

Booking {
  id, client_id, client_name,
  service_id, service_name,
  staff_id || staff_member_id, staff_name,
  start_time, end_time, status, notes
}

Service {
  id, name, category_id, description,
  duration_minutes, price_cents, currency,
  notes, is_active || active,
  created_at, updated_at
}

StaffMember {
  id, full_name, role, email, phone,
  bio, status, ...
}
```

**API Call Pattern** (`frontend/src/services/api.ts`):
```typescript
axiosInstance.create({
  baseURL: "http://localhost:3000",
  timeout: 15000,
  headers: { "Content-Type": "application/json" }
})

// GET /api/clients
// POST /api/clients
// GET /api/clients/:id
// PUT /api/clients/:id
// GET /api/bookings
// POST /api/bookings
// GET /api/services
// POST /api/services
```

Frontend assumes:
- Bearer token auth via Authorization header
- JSON response bodies
- Flattened response shapes for single resources
- List responses with `data` array
- Error responses with `error.code` field

---

#### F. Test Expectations & Mock Reality

**Test Files** (25 total):
```
✅ phase1b-contract-validation.test.ts - validates API contracts
✅ phase1b-rbac-hardening.test.ts - validates RBAC
✅ phase1c-integration.test.ts - integration tests
✅ phase2-payments-integration.test.ts - payment flows
✅ phase2-notifications-integration.test.ts - notification flows
✅ phase2-reporting-integration.test.ts - reporting workflows
✅ phase2-cross-module-integration.test.ts - 20 E2E tests
🟡 phase2-production-hardening.test.ts - stress/hardening tests
... and 17 more
```

**Test Auth Mocking** (from phase1b-contract-validation.test.ts):
```typescript
vi.mock("../middleware/auth.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    requireAuth: async (req, res, next) => {
      // ✅ Properly validates Bearer token
      // ✅ Sets res.locals.auth
      // ✅ Returns 401 on missing/invalid token
    },
    optionalAuth: (_req, _res, next) => next(), // ✅ Exported
    authenticateRequest: (req, res, next) => {
      // ✅ Default authenticated context
      req.user = { id: "user-001", role: "business_admin", organization_id: "org-001" };
      res.locals.auth = { userId, userRole, organizationId, ... };
      next();
    }
  };
});
```

**What Tests Expect**:
- ✅ requireAuth export + mock
- ✅ optionalAuth export + mock
- ✅ authenticateRequest (alias)
- ✅ 401 on invalid token
- ✅ 403 on forbidden role
- ✅ res.locals.auth populated
- ✅ JWT payload: { sub, role, organizationId, jti, permissions_version }

---

### Part 1.2: What is Currently BROKEN (Critical Issues)

#### BREAKING ISSUE #1: Bookings POST Returns Raw Array
**File**: `src/modules/bookings/routes.ts:98`
**Current Code**:
```typescript
return res.status(201).json(created[0]); // ← Returns SINGLE OBJECT, not wrapped
```
**Expected by respondSuccess**: Object or array with standard wrapping
**Impact**: Frontend cannot parse consistently; breaks useCrud hook expectations
**Severity**: 🔴 CRITICAL

---

#### BREAKING ISSUE #2: optionalAuth Silently Fails on Invalid Token
**File**: `src/middleware/auth.ts:182`
**Current Code**:
```typescript
catch (err) {} // ← SILENT FAILURE
return next();
```
**Expected**: Either reject or log
**Impact**: Malformed tokens accepted as unauthenticated access; security/audit issue
**Severity**: 🔴 CRITICAL

---

#### BREAKING ISSUE #3: Error Codes Are Mixed Case
**Files**: Throughout all modules
**Examples**:
- ✅ `UNAUTHORIZED` (correct)
- ❌ `COMMANDS MUST BE AN ARRAY` (wrong)
- ❌ `conflict` (lowercase, wrong)
- ❌ `MISSING_ORGANIZATION_ID` mixed with `missing_service_id`

**Expected**: ALL UPPER_SNAKE_CASE
**Severity**: 🔴 CRITICAL

---

#### BREAKING ISSUE #4: Response Shapes Inconsistent
**Pattern Mismatch**:
```
GET /api/clients → { module: "clients", count: 5, clients: [...] }  ← Custom
POST /api/clients → { id, full_name, email, ... }                  ← Flat
GET /api/services → { module: "services", count: N, services: [...] } ← Custom
POST /api/services → { id, name, description, ..., active }        ← Flat
POST /api/bookings → [{ id, ... }]                                ← RAW ARRAY 🔴
GET /api/discovery → { count, categories: [...] }                 ← Custom
GET /api/ai/insights → { type, ranked, generatedAt }              ← Non-standard
```

**Expected**: Single standardized envelope for all responses
**Severity**: 🔴 CRITICAL

---

#### BREAKING ISSUE #5: Duplicate Routes Cause Ambiguity
**Routes**:
```
/api/tenant     ← Tenant module
/api/tenants    ← Tenants module  
/api/platform   ← Platform module
```
All three are mounted. Unclear which is canonical.

```
/api/services          ← Services CRUD
/api/services/enhanced ← Services enhanced features
```
Both use requireAuth; unclear which frontend should call.

```
/api/bookings          ← Bookings CRUD
/api/bookings/workflow ← Bookings workflow
```
Routing ambiguity.

```
/api/payments        ← Payments main  
/api/payments/multi  ← Multi-gateway
/api/payments/pos    ← Point-of-sale
```
Unclear which is primary.

**Severity**: 🟡 HIGH

---

#### BREAKING ISSUE #6: Test-Production Auth Asymmetry
**Test Mode** (src/middleware/auth.ts:50):
```typescript
if (process.env.NODE_ENV !== "test") return false;
const userId = req.header("x-test-user-id");
const role = req.header("x-test-role");
const orgId = req.header("x-test-org-id");
if (!userId || !role || !orgId) return false;
req.user = { id: userId, role: normalizeRole(role), organization_id: orgId };
res.locals.auth = { ... }; // ← SYNCHRONOUS
return true;
```

**Production Mode**:
```typescript
const token = req.header("authorization");
const payload = jwt.verify(token, secret); // ← ASYNC, can throw
```

**Issue**: Test injects auth before async operations; mocks don't validate JWT properly
**Impact**: Tests may pass but production auth may fail
**Severity**: 🟡 HIGH

---

#### BREAKING ISSUE #7: respondSuccess() Spreads Objects Inconsistently
**File**: `src/shared/response.ts:50`
**Current Code**:
```typescript
export function respondSuccess<T>(res: Response, data: T, statusCode = 200) {
  const isPlainObject = typeof data === 'object' && data !== null && !Array.isArray(data);
  const responseBody: any = isPlainObject
    ? { ...(data as any) }  // ← SPREADS FLAT OBJECTS
    : { data };              // ← WRAPS ARRAYS
  return res.status(statusCode).json(responseBody);
}
```

**Problem**: Same function produces two different response shapes:
- `respondSuccess(res, { id: "1", name: "John" })` → `{ id: "1", name: "John" }`
- `respondSuccess(res, [{ id: "1" }])` → `{ data: [{ id: "1" }] }`

**Expected**: Single standardized shape for both
**Severity**: 🔴 CRITICAL

---

#### BREAKING ISSUE #8: Missing Authorization Guards on Some Routes
**Discovery Routes** (`src/modules/discovery/routes.ts`):
- All routes use `optionalAuth` (no auth guard)
- BUT they return organization-scoped data
- **Issue**: Anonymous users can call auth-required operations? Or is discovery truly public?

**Severity**: 🟡 HIGH (depends on business rules)

---

### Part 1.3: What is Currently DUPLICATED

**Route Families**:
- ✅ `/api/tenant` + `/api/tenants` + `/api/platform` (3 tenant-scoped modules)
- ✅ `/api/services` + `/api/services/enhanced`
- ✅ `/api/bookings` + `/api/bookings/workflow`
- ✅ `/api/payments` + `/api/payments/multi` + `/api/payments/pos`

**Logic Duplication**:
- Auth middleware: `requireAuth`, `optionalAuth`, `authenticateRequest` (alias)
- RBAC: `requireRole`, `authorize` (alias)
- Error handling: `BadRequestError`, `notFoundError`, `UnauthorizedError`, etc.

**Test Coverage Duplication**:
- Multiple integration test files overlapping (phase1b, phase1c, phase2)
- Similar test patterns across files (mock setup, assertions)

---

### Part 1.4: What is Currently UNDEFINED

**Undefined Responsibilities**:
- Which team owns what module? (No clear CODEOWNERS file)
- Which team modifies schema? (No clear DB team boundary)
- Which team defines API contracts? (Implied backend but unclear)
- Which team validates QA? (No explicit QA authority)

**Undefined Contracts**:
- State machine transitions: Which transitions are allowed for Booking, Staff shift, etc.?
- Pagination: What is the canonical pagination structure? (Page-based? Cursor-based? Limit-offset?)
- Error codes: What is the canonical list of error codes?
- API versioning: Why is there `extractApiVersion` middleware but no version-specific routes?

**Undefined Status**:
- Which of 40+ routes are ACTIVE vs PLACEHOLDER?
- Which modules are PHASE 1 vs PHASE 2 vs experimental?
- Which test files are authoritative vs historical?

---

## SECTION 2: LOCKED CONTRACTS (ENFORCEABLE)

### Contract 2.1: API Response Envelope (CANONICAL)

**ALL API responses must follow this structure:**

#### SUCCESS RESPONSE (2xx)
```json
{
  "success": true,
  "data": <payload>,
  "meta": {
    "timestamp": "ISO8601",
    "requestId": "correlation-id",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

**Rules**:
- `success` field is **MANDATORY**; always `true` for 2xx
- `data` field contains payload (object or array)
- `meta` is **ALWAYS PRESENT** but optional sub-fields:
  - `pagination` present ONLY for list endpoints
  - `timestamp` always present
  - `requestId` always present (from correlation ID middleware)
- NO alternative shapes allowed
- NO spreading objects directly
- NO raw arrays

**Example Single Resource**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "John",
    "email": "john@example.com"
  },
  "meta": {
    "timestamp": "2026-03-25T10:30:00Z",
    "requestId": "req-123"
  }
}
```

**Example List**:
```json
{
  "success": true,
  "data": [
    { "id": "uuid-1", "full_name": "John" },
    { "id": "uuid-2", "full_name": "Jane" }
  ],
  "meta": {
    "timestamp": "2026-03-25T10:30:00Z",
    "requestId": "req-123",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "totalPages": 25
    }
  }
}
```

---

#### ERROR RESPONSE (4xx, 5xx)
```json
{
  "success": false,
  "error": {
    "code": "UPPER_SNAKE_CASE",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

**Rules**:
- `success` field is **MANDATORY**; always `false` for 4xx/5xx
- `error.code` **MUST be UPPER_SNAKE_CASE** (validated at enforcement layer)
- `error.message` is human-readable
- `error.details` is optional context (validation errors, etc.)
- NO stack traces exposed (development logging only)
- NO raw error objects

**Canonical Error Codes** (LOCKED):
```
// 401 Unauthenticated
UNAUTHORIZED
SESSION_REVOKED
INVALID_TOKEN

// 403 Forbidden
FORBIDDEN
INSUFFICIENT_ROLE
ACCESS_DENIED

// 400 Bad Request
BAD_REQUEST
VALIDATION_ERROR
MISSING_REQUIRED_FIELD
INVALID_FIELD_FORMAT

// 404 Not Found
NOT_FOUND
RESOURCE_NOT_FOUND

// 409 Conflict
CONFLICT
DUPLICATE_RESOURCE
CONSTRAINT_VIOLATION

// 422 Unprocessable
UNPROCESSABLE_ENTITY

// 429 Rate Limited
RATE_LIMITED
ACCOUNT_LOCKED

// 500 Server Error
INTERNAL_SERVER_ERROR
DATABASE_ERROR
SERVICE_UNAVAILABLE
```

**Example Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "errors": {
        "email": "Invalid email format",
        "age": "Must be >= 18"
      }
    }
  }
}
```

---

### Contract 2.2: Authentication & RBAC (LOCKED)

#### requireAuth Middleware
**Behavior** (LOCKED):
- Reads Bearer token from `Authorization` header
- Validates JWT signature and payload
- **MUST reject with 401** if token invalid/missing
- Sets `res.locals.auth = { userId, userRole, organizationId, tokenJti }`
- Token payload structure (LOCKED):
  ```typescript
  {
    sub: string,            // User ID
    role: string,           // User role (canonical)
    organizationId: string, // Org/Tenant ID
    jti?: string,           // JWT ID (for session tracking)
    permissions_version?: number
  }
  ```

**Export** (LOCKED):
```typescript
export const requireAuth;
export const authenticateRequest; // Alias for requireAuth
```

---

#### optionalAuth Middleware
**Behavior** (LOCKED after correction):
- Reads Bearer token from `Authorization` header (if present)
- Validates JWT (if token present)
- **MUST NOT throw** on invalid token
- **MUST log** invalid token attempts (for debugging)
- Sets `res.locals.auth` if token valid; leaves undefined if missing
- Proceeding unauthenticated is allowed (no error)

**Export** (LOCKED):
```typescript
export const optionalAuth;
```

**Change Required**: Add logging to invalid token case
```typescript
catch (err) {
  logger.debug("optionalAuth token verification failed", { 
    error: err.message,
    reason: "Invalid token provided",
    ip: req.ip
  });
  // Continue without auth
}
```

---

#### requireRole Middleware
**Behavior** (LOCKED):
- Requires `requireAuth` to be applied first
- Reads `res.locals.auth.userRole`
- Checks if role is in allowed list
- **MUST return 403** if role not allowed (user authenticated but not authorized)
- **MUST return 401** if not authenticated (no auth context)

**Usage** (LOCKED):
```typescript
router.get("/", requireAuth, requireRole("business_admin", "platform_admin"), handler);
```

---

#### Test-Mode Auth Injection
**Behavior** (LOCKED - NO CHANGES):
- Active only when `NODE_ENV === "test"`
- Reads headers: `x-test-user-id`, `x-test-role`, `x-test-org-id`
- Synchronously sets auth context if all three headers present
- Fallback to default auth (user-001, business_admin, org-001) if headers missing or incomplete

**Contract**: Test mode MUST NOT differ from production; headers MUST produce same `res.locals.auth` as real JWT

---

### Contract 2.3: Canonical State Machines (LOCKED)

**Booking State Machine**:
```
States: pending → confirmed → completed
        └─ cancelled (any state)
        └─ rescheduled (from pending/confirmed)

Allowed Transitions:
├ pending → confirmed (staff accepts)
├ pending → cancelled (cancel before confirmation)
├ confirmed → completed (booking executed)
├ confirmed → cancelled (cancel after confirmation)
├ pending → rescheduled (reschedule before confirmed)
├ confirmed → rescheduled (reschedule after confirmed)
└ * → cancelled (any state can cancel)

Forbidden Transitions:
├ completed → any (terminal)
├ * → pending (cannot go backwards to pending)
```

**Staff Assignment State Machine**:
```
States: assigned → confirmed → in_progress → completed
        └─ cancelled (any state)
        └─ no_show (from in_progress)

Confirmation Sub-State: pending → confirmed | declined | no_response
```

**Staff Shift State Machine**:
```
States: scheduled → confirmed → in_progress → completed
        └─ cancelled (any state)
        └─ no_show (from in_progress)
```

**Booking Waitlist State Machine**:
```
States: waiting → notified → confirmed
        └─ expired (from waiting after TTL)
        └─ cancelled (any state)
```

**Subscription State Machine** (if subscriptions module exists):
```
States: pending → active → paused
        └─ cancelled (any state)
        └─ expired (auto-transition on end date)
```

---

### Contract 2.4: Pagination Structure (LOCKED)

**ALL list endpoints MUST return**:
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "pagination": {
      "page": <number>,
      "limit": <number>,
      "total": <number>,
      "totalPages": <number>
    }
  }
}
```

**Rules**:
- `page`: 1-indexed (starts at 1, not 0)
- `limit`: max items per page (20, 50, 100, etc.)
- `total`: total count of items (across all pages)
- `totalPages`: ceil(total / limit)
- Query params: `?page=1&limit=20`
- Client enforces max: `limit = Math.min(100, Math.max(1, limit))`

**Example**:
```json
{
  "success": true,
  "data": [ { "id": "1", "name": "John" }, { "id": "2", "name": "Jane" } ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "totalPages": 25
    }
  }
}
```

---

## SECTION 3: TEAM RESPONSIBILITY LOCK

### Team 3.1: BACKEND TEAM

**Owns**:
- ✅ All endpoints under `/api/*`
- ✅ `requireAuth` and `optionalAuth` middleware
- ✅ `requireRole` RBAC enforcement
- ✅ Error handling and error codes (UPPER_SNAKE_CASE enforcement)
- ✅ Request validation (zod schemas, body validation)
- ✅ Rate limiting configuration
- ✅ Pagination implementation
- ✅ Response envelope (all responses use locked contract)
- ✅ Session management
- ✅ JWT token generation/validation
- ✅ Audit logging

**Responsibilities**:
- Define endpoint contracts (request shape, response shape)
- Implement state machine transitions (enforce allowed states)
- Handle access control (requireAuth/requireRole)
- Format responses with LOCKED envelope
- Enforce error code format (UPPER_SNAKE_CASE)
- Populate `res.locals.auth` with validated context
- Log authentication/authorization decisions

**MUST NOT**:
- ❌ Change schema structure without DB team alignment
- ❌ Invent new response formats
- ❌ Add lowercase error codes
- ❌ Bypass requireAuth/requireRole middleware
- ❌ Return HTML under `/api/*` routes
- ❌ Return raw arrays without wrapper

**Enforcement**: QA validates all commits to `/api/*` routes against contract

---

### Team 3.2: DATABASE TEAM

**Owns**:
- ✅ Schema design (tables, columns, indexes)
- ✅ Migrations (numbered, tested, irreversible)
- ✅ Relationships and constraints
- ✅ Audit trail tables (audit_logs, login_attempts, password_history)
- ✅ State tracking tables (workflow_states, workflow_transitions)
- ✅ Performance (indexes, query optimization)
- ✅ Backup/restore procedures

**Responsibilities**:
- Create migrations for new schema
- Document table relationships
- Define state machine columns (enum-like constraints)
- Ensure audit trails are populated
- Validate migration reversibility (if needed)

**Current Schema** (NOT changing):
```
✅ users, organizations, clients, services, bookings, staff_members
✅ booking_staff_assignments, staff_shifts, booking_waitlist
✅ workflow_states, workflow_transitions
✅ sessions, login_attempts, password_history
```

**MUST NOT**:
- ❌ Add/change table structure without backend team alignment
- ❌ Define business logic (that's backend)
- ❌ Implement API endpoints
- ❌ Change error handling

**Enforcement**: QA validates all migrations are backward-compatible and properly indexed

---

### Team 3.3: FRONTEND TEAM

**Owns**:
- ✅ React components (pages, modals, forms, tables)
- ✅ View logic (conditional rendering, animations)
- ✅ Navigation and routing
- ✅ Client-side state (Zustand stores)
- ✅ Form validation (client-side, UX)
- ✅ CSS and styling (Tailwind)

**Responsibilities**:
- Call backend endpoints exactly as documented
- Parse responses according to LOCKED contract
- Handle 401/403 responses (auth/permission failures)
- Display request errors using error.code field
- Respect pagination structure
- Never invent API response formats

**MUST NOT**:
- ❌ Define backend response shapes
- ❌ Add ad-hoc API calls
- ❌ Bypass auth/permission checks
- ❌ Assume different response envelopes per endpoint
- ❌ Hardcode API response parsing

**Type Contract**: Must use types from `frontend/src/types/index.ts` (defined by backend team)

---

### Team 3.4: QA TEAM (AUTHORITY)

**Owns**:
- ✅ Contract enforcement
- ✅ Test validation
- ✅ Integration verification
- ✅ Merge approval/rejection
- ✅ Compliance audit

**Authority**:
- ✅ REJECT any non-compliant code
- ✅ BLOCK merges until fixed
- ✅ ENFORCE contract rules
- ✅ Request corrections before acceptance

**Validation Checklist** (every commit):
```
API Response Contracts:
  ☐ All 2xx responses have "success": true
  ☐ All 4xx/5xx responses have "success": false
  ☐ All responses have "data" or "error" field
  ☐ All error codes are UPPER_SNAKE_CASE
  ☐ No raw arrays without wrapper
  ☐ No spreading objects directly

Authentication:
  ☐ requireAuth returns 401 on invalid token
  ☐ optionalAuth does NOT throw
  ☐ res.locals.auth is populated with correct fields
  ☐ Test mode injects auth correctly

Authorization:
  ☐ Unauthenticated requests return 401
  ☐ Insufficient role returns 403
  ☐ 401 vs 403 distinction is correct

Pagination:
  ☐ List endpoints return pagination metadata
  ☐ page, limit, total, totalPages all present
  ☐ page is 1-indexed

State Machines:
  ☐ Only allowed transitions are permitted
  ☐ Forbidden transitions are rejected
  ☐ Status is updated via workflow_transitions

No Duplicates:
  ☐ No overlapping route names
  ☐ No duplicate business logic
```

**Rejection Reason Template**:
```
❌ MERGE REJECTED
Reason: <specific violation>
Location: <file:line>
Error: <exact error from contract>
Fix Required: <what to change>
Timeline: Must fix before re-submission
```

---

## SECTION 4: CURRENT SYSTEM VIOLATIONS & CORRECTIONS

### Violations Requiring IMMEDIATE Correction

#### Violation 1: Bookings POST Returns Raw Array
**Location**: `backend/src/modules/bookings/routes.ts:98`
**Current**: `return res.status(201).json(created[0]);`
**Contract Violation**: Violates response envelope contract
**Fix**: `return respondSuccess(res, created[0], 201);`
**Owner**: Backend Team
**Timeline**: IMMEDIATE

---

#### Violation 2: optionalAuth Silently Fails
**Location**: `backend/src/middleware/auth.ts:182`
**Current**: `catch (err) {} return next();`
**Contract Violation**: No logging of invalid token
**Fix**: Add logging before continuing
**Owner**: Backend Team
**Timeline**: IMMEDIATE

---

#### Violation 3: Error Codes Mixed Case
**Location**: Throughout all modules
**Examples**:
- `COMMANDS MUST BE AN ARRAY` (should be `INVALID_COMMANDS_ARRAY`)
- `conflict` (should be `CONFLICT`)

**Contract Violation**: Error codes not UPPER_SNAKE_CASE
**Fix**: Replace all mixed-case error codes
**Owner**: Backend Team
**Timeline**: IMMEDIATE

---

#### Violation 4: Duplicate Routes (Tenant/Services/Bookings/Payments)
**Location**: `backend/src/app.ts` route registration
**Current**: Multiple modules for same domain
**Contract Violation**: Route ambiguity violates CONTRACT LOCK
**Fix**: Assign single owner for each domain; deprecate duplicates
**Owner**: Backend Team + Architecture
**Timeline**: PHASE 2

---

#### Violation 5: respondSuccess() Spreads Objects
**Location**: `backend/src/shared/response.ts:50`
**Current**: Inconsistent spreading vs wrapping
**Contract Violation**: Two different response shapes
**Fix**: Always use standard envelope
**Owner**: Backend Team
**Timeline**: IMMEDIATE

---

## SECTION 5: VIOLATION AUDIT SUMMARY

| Violation | Severity | Owner | Timeline | Status |
|-----------|----------|-------|----------|--------|
| Bookings POST raw array | 🔴 CRITICAL | Backend | IMMEDIATE | 🔲 Pending |
| optionalAuth silent fail | 🔴 CRITICAL | Backend | IMMEDIATE | 🔲 Pending |
| Mixed-case error codes | 🔴 CRITICAL | Backend | IMMEDIATE | 🔲 Pending |
| Duplicate routes | 🟡 HIGH | Backend/Arch | PHASE 2 | 🔲 Pending |
| respondSuccess spreading | 🔴 CRITICAL | Backend | IMMEDIATE | 🔲 Pending |
| Test-Production asymmetry | 🟡 HIGH | Backend/QA | PHASE 2 | 🔲 Pending |
| Discovery auth ambiguity | 🟡 HIGH | Backend + Arch | PHASE 2 | 🔲 Pending |

---

## SECTION 6: FINAL STATUS

**GOVERNANCE CONTROL STATUS**: ✅ ACTIVE

**System State**: RECONCILED & LOCKED

**Contracts**: DEFINED & ENFORCEABLE

**Team Responsibilities**: ASSIGNED & CLEAR

**Violations**: ENUMERATED & READY FOR CORRECTION

**Next Step**: SECTION 2 CORRECTIONS (Backend team fixes IMMEDIATE violations)

---

**Authority**: System Governance Controller  
**Date**: March 25, 2026  
**Status**: LOCKED - NO CHANGES WITHOUT GOVERNANCE APPROVAL
