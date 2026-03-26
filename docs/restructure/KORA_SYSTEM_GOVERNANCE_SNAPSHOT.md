# KORA System Governance Snapshot

Date audited: 2026-03-25

## 1. Current System Snapshot

### What is currently true

- Mounted backend modules are defined in `backend/src/app.ts`.
- `requireAuth` and `optionalAuth` are both exported from `backend/src/middleware/auth.ts`.
- `optionalAuth` currently never throws and only enriches request context when a token is valid.
- Unknown `/api/*` paths are routed through `backend/src/middleware/apiNotFound.ts`.
- A shared API response normalizer is now mounted at the app boundary in `backend/src/middleware/apiResponseContract.ts`.
- Shared response helpers now emit the canonical envelope from `backend/src/shared/response.ts`.
- Targeted backend contract verification passed on 2026-03-25:
  - `src/__tests__/shell-stabilization.test.ts`
  - `src/test/apiContracts.test.ts`
  - Result: 24 tests passed, 0 failed

### Existing API surface currently mounted

- Core auth and identity: `/api/auth`
- Core tenant operations: `/api/clients`, `/api/staff`, `/api/services`, `/api/bookings`
- Payments and billing: `/api/payments`, `/api/payments/multi`, `/api/billing`, `/api/subscriptions`, `/api/finance`
- Operational domains: `/api/clinical`, `/api/emergency`, `/api/delivery`, `/api/inventory`, `/api/crm`, `/api/notifications`
- Platform and admin: `/api/tenant`, `/api/tenants`, `/api/platform`, `/api/reporting`, `/api/analytics`
- Extended modules also mounted: `/api/reviews`, `/api/social`, `/api/media`, `/api/video`, `/api/automation`, `/api/workflows`, `/api/schema`, `/api/canva`, `/api/categories`, `/api/marketplace`, `/api/geofence`, `/api/providers`, `/api/chatbot`
- Public content surface is now mounted at `/api/content/public` for published article reads, while authoring and moderation remain on authenticated `/api/content/*`

### Existing schema status

- The live schema source of truth is the migration chain under `backend/src/db/migrations`.
- Schema drift still exists, especially around `subscriptions`, `users`, `organizations`, `reviews`, and `invoices`.
- Active code still references tables/contracts not fully present in migrations, including support-case tables, some payment repository tables, and social integration tables.

### Current frontend usage

- Frontend support pages still depend on `/api/support/*`.
- Backend now mounts canonical `/api/support/*` routes, and the old `/api/notifications/support-queue` path has been removed from the mounted runtime surface.
- Frontend navigation and pages also reference platform-admin, content, support, billing, delivery, and monitoring flows that depend on consistent backend envelopes.

### Current test expectations

- Updated stabilization tests now enforce `success: true|false` on API responses.
- Updated contract tests now enforce:
  - `GET /api/auth/me` returns `{ success: true, data, meta }`
  - auth failures return `{ success: false, error }`
  - list responses return `data: []` plus pagination `meta`

## 2. Inconsistencies Detected

### Response format mismatches

- Before this correction pass, KORA emitted three competing response styles:
  - raw `res.json(...)`
  - old shared helpers that flattened object payloads
  - error middleware that returned a different envelope
- Several modules still contain direct `res.json(...)` or `res.status(...).json(...)` calls, but the new API response middleware now normalizes those for mounted `/api/*` routes.

### Auth inconsistencies

- `requireAuth` correctly returns 401 for missing or invalid tokens.
- `optionalAuth` is present and non-throwing.
- 401/403 behavior was inconsistent in RBAC and organization-context middleware before normalization.
- Some non-auth middleware still returns raw JSON errors and relies on boundary normalization instead of shared helpers.

### Duplicated modules and parallel implementations

- CRM:
  - canonical mounted router: `backend/src/modules/crm/routes.ts`
  - legacy duplicate router has been removed from the repo
- Inventory:
  - canonical mounted router: `backend/src/modules/inventory/routes.ts`
  - legacy duplicate router has been removed from the repo
- Auth / IAM:
  - canonical mounted router: `backend/src/modules/auth/routes.ts`
  - legacy/parallel IAM router has been removed from the repo
- Services:
  - `/api/services`
  - legacy `/api/services/enhanced` route family has been removed from mounted runtime paths

### Conflicting logic between teams/modules

- `subscriptions` has conflicting schema definitions across migrations while routes and workflow code expect a newer unified shape.
- Booking lifecycle logic conflicts:
  - workflow definitions include `checked_in`
  - mounted booking workflow routes now honor `confirmed -> checked_in -> in_progress`, but the booking domain still remains split across multiple workflow helpers and legacy abstractions
- Delivery states exist in schema, but `backend/src/modules/delivery/service.ts` accepts arbitrary status changes without transition guards.
- Support now has a real module and no longer exposes the old notification-derived queue as a mounted runtime path.

### Undefined or partially defined areas

- Staff lifecycle transitions are not centrally defined or enforced.
- Delivery lifecycle transitions are not centrally defined or enforced.
- Emergency lifecycle states exist, but transition rules are not enforced.
- Blog/content authoring and moderation routes now exist in backend code, and published article reads are exposed publicly at `/api/content/public/*`.

## 3. Locked Contracts

### API response contract

Success:

```json
{
  "success": true,
  "data": {},
  "meta": null
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "UPPER_SNAKE_CASE",
    "message": "message",
    "details": {}
  }
}
```

Locked rules:

- No lowercase error codes.
- No HTML responses under `/api/*`.
- No API response without `success`.
- List responses must use `data: []` and `meta`.

### Auth contract

- `requireAuth`
  - returns 401 when token is missing, invalid, mismatched, expired, or revoked
  - populates `req.user`
  - populates `res.locals.auth`
- `optionalAuth`
  - never throws
  - does not block unauthenticated requests
  - populates auth context only when a valid token is present
- JWT context must resolve user plus organization scope.

### Pagination contract

List endpoints must normalize to:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 0,
    "total_pages": 1
  }
}
```

Current enforcement note:

- The boundary middleware now guarantees this shape for mounted API list responses.
- For many handlers, `total` still equals returned row count because the handlers do not yet execute separate count queries.

### State machine contract

#### Booking

- Grounded states:
  - `pending`
  - `confirmed`
  - `checked_in`
  - `in_progress`
  - `completed`
  - `cancelled`
  - `no_show`
  - `failed`
- Grounded canonical transition map from workflow definition:
  - `pending -> confirmed, cancelled`
  - `confirmed -> checked_in, cancelled`
  - `checked_in -> in_progress, no_show`
  - `in_progress -> completed, failed`
  - `failed -> pending`
  - terminal: `completed`, `cancelled`, `no_show`
- Current status:
  - mounted workflow routes now enforce the `checked_in` step
  - duplicate `BookingWorkflow.ts` authority has been removed
  - remaining risk is still split booking lifecycle knowledge between `workflowRoutes.ts`, `stateMachines.ts`, and `WorkflowEngine.ts`

#### Subscription

- Grounded states from `SubscriptionWorkflow.ts`:
  - `trialing`
  - `active`
  - `past_due`
  - `cancelled`
  - `expired`
- Allowed transitions:
  - `trialing -> active`
  - `active -> past_due, cancelled`
  - `past_due -> active`
  - `cancelled -> expired`
  - `expired ->` none
- Forbidden:
  - any transition not listed above

#### Emergency

- Grounded states from `emergency/routes.ts`:
  - `open`
  - `dispatched`
  - `en_route`
  - `on_scene`
  - `resolved`
  - `cancelled`
- Current enforcement status:
  - valid states are enforced
  - transition order is not enforced in code
- Governance lock:
  - no implicit transitions should be introduced until a route-level or workflow-level transition map is added

#### Delivery

- Grounded states from schema:
  - `pending`
  - `assigned`
  - `pickup_en_route`
  - `picked_up`
  - `in_transit`
  - `delivered`
  - `failed`
  - `canceled`
- Current enforcement status:
  - statuses exist in schema
  - service layer currently accepts arbitrary status writes
- Governance lock:
  - current transition guard is undefined and remains a blocking violation

#### Staff

- Grounded states observed in code:
  - `active`
  - `inactive`
  - `on_leave`
  - `archived`
- Current enforcement status:
  - create path initializes `active`
  - delete path archives
  - no central transition map exists
- Governance lock:
  - staff lifecycle remains partially undefined and must not be expanded without backend plus DB agreement

## 4. Responsibility Lock

### Backend Team

- Owns:
  - API endpoints
  - auth middleware
  - RBAC
  - response contracts
  - pagination behavior
  - state transition enforcement
- Must not:
  - redefine database schema alone
  - invent frontend-only payload formats

### Database Team

- Owns:
  - schema
  - migrations
  - constraints
  - relationships
  - audit tables
- Must not:
  - redefine API contracts
  - encode workflow/business logic in ad hoc schema changes

### Frontend Team

- Owns:
  - views
  - form flows
  - navigation
  - user workflows
- Must not:
  - invent backend response shapes
  - bypass auth or tenant context
  - ship UI against routes that do not exist

### QA Team

- Owns:
  - contract enforcement
  - integration verification
  - auth behavior validation
  - pagination validation
- Authority:
  - reject non-compliant output
  - block merges
  - require correction before merge

## 5. Conflicts Detected

- Duplicate CRM, inventory, and IAM route families remain in-repo.
- Support frontend and support backend are not aligned.
- Subscription schema and subscription workflow expectations are not aligned.
- Booking workflow definition and booking route behavior are not aligned.
- Delivery schema defines lifecycle states, but service layer does not enforce them.
- Several mounted modules still contain direct JSON responses and rely on boundary normalization instead of shared helpers.

## 6. Corrections Applied In This Pass

- Added canonical shared response helpers in `backend/src/shared/response.ts`
- Added boundary response normalization middleware in `backend/src/middleware/apiResponseContract.ts`
- Mounted response normalization in `backend/src/app.ts`
- Normalized RBAC and organization-context responses
- Normalized CSRF responses and CSRF token endpoint
- Patched mounted no-content contract leaks in:
  - `backend/src/modules/inventory/routes.ts`
  - `backend/src/modules/delivery/routes.ts`
- Updated targeted QA suites:
  - `backend/src/__tests__/shell-stabilization.test.ts`
  - `backend/src/test/apiContracts.test.ts`
- Verified targeted contract suites passed

## 7. Remaining Violations

- Support-case backend module is still missing; frontend support pages remain ahead of backend reality.
- Duplicate legacy modules still exist in the repo and can still cause ownership confusion.
- Delivery lifecycle transitions are not yet enforced.
- Emergency lifecycle ordering is not yet enforced.
- Staff lifecycle transitions are not centrally enforced.
- Booking route behavior still diverges from the canonical booking workflow state map.
- List endpoint `total` values are not authoritative everywhere because many handlers do not issue separate count queries.
- Schema drift remains unresolved in the migration chain, especially `subscriptions`.

## 8. Final Compliance Status

Status: Partial compliance, stabilized at API boundary

What is compliant now:

- API success/error envelope for mounted `/api/*` routes
- JSON-only API 404 behavior
- `requireAuth` 401 behavior
- `optionalAuth` non-throw behavior
- Targeted QA enforcement for core auth and response contracts

What is not yet fully compliant:

- complete support workflow alignment
- full state-machine enforcement across booking, staff, emergency, and delivery
- removal of duplicate legacy modules
- schema cleanup and contract-backed count pagination for every list endpoint
