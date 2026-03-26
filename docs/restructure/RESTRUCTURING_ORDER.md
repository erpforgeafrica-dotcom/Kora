# KORA v1.2 Operational Restructuring Order (Canonical Blueprint)

**Status:** Canonical (this document is the source of truth for the rebuild sequence)  
**Last updated:** 2026-03-13  
**Scope:** Repo-wide architecture, tenancy, auth/RBAC, route ownership, navigation consolidation, module rebuild order.  

This is not a feature backlog. This is an execution order that removes structural contradictions and produces an operational platform.

---

## 1. Executive Diagnosis

KORA is blocked by structural split-brain, not UI completeness.

**Production blockers**
- Backend serves a mounted `business_id` API stack that does not match the enabled migration chain.
- Backend simultaneously contains org-scoped operational modules and a separate flat CRUD skeleton; both are partially wired and auth-incompatible.
- Auth/RBAC is contradictory (`res.locals.auth.role` vs `res.locals.auth.userRole`, `businessId` vs `organizationId`).
- Frontend has multiple navigation/routing systems; placeholder module pages generate fake rows and claim “static route”.
- CI is non-executable (invokes scripts that do not exist, validates contracts against a backend it never starts).
- Repo-root “COMPLETE/FINAL/READY” docs overstate completion and are not authoritative.

Outcome: the required workflow cannot execute end-to-end.

---

## 2. Canonical Architecture Decisions

### 2.1 Tenancy Model (Single Tenant/Business Concept)

**Canonical concept:** Tenant == Business (one entity).  
**Canonical database table:** `organizations`.  
**Canonical foreign key:** `organization_id` on all tenant-scoped tables.

**Rules**
- Every operational record is tenant-scoped unless explicitly platform-wide.
- Tenant scoping is enforced in SQL (`where organization_id = $1`), never via frontend filtering.

**Non-canonical (retired for v1.2 operations)**
- `businesses` table and any repository/routes that require `business_id` columns in `users/services/bookings` (these columns are not created by enabled migrations).

### 2.2 Auth/RBAC (Single Shape)

**Canonical middleware contract:** `attachAuth` + `requireRole` in `backend/src/middleware/rbac.ts`.

**Canonical JWT payload**
- `sub`: user id
- `role`: `client | staff | business_admin | operations | platform_admin`
- `tenantId`: organization id

**Canonical `res.locals.auth`**
- `userId`
- `userRole`
- `organizationId`

**Rule:** Any middleware that sets a different shape is retired until rewritten to emit the canonical shape.

### 2.3 Backend API Ownership (Single Route System)

**Canonical route ownership:** `backend/src/modules/<domain>/routes.ts` owns endpoints for that domain.

**Retired systems**
- `backend/src/routes/*.ts` + `backend/src/controllers/*.ts` flat CRUD skeleton.
- Any module route tree that depends on `authenticateRequest` from `backend/src/middleware/auth.ts` (until rewritten).

### 2.4 Frontend Navigation (Single Source of Truth)

**Canonical navigation source:** `frontend/src/config/navigation.ts`  
**Canonical sidebar component:** `frontend/src/components/layout/Sidebar.tsx`

**Retired systems**
- `frontend/src/data/masterDashboardNavigation.ts`
- `frontend/src/data/platformNavigation.ts`
- `frontend/src/components/layout/AccordionNavigation.tsx`
- Placeholder module shells: `frontend/src/pages/platform/GeneratedModulePage.tsx`, `CanonicalModulePage.tsx`, and routers that route into them.

### 2.5 Workflow Backbone (Single Reality)

Canonical workflow is status + audit trail per domain:
- Bookings: `bookings.status` + `booking_status_history`
- Payments: `transactions.status` + `audit_logs`
- Subscriptions: `subscriptions.status` + `audit_logs`
- Reviews: `reviews` + `review_responses`
- Messaging: `conversations` + `messages`
- Media: `media_assets` + audit logging

---

## 3. Required End-to-End Workflow (Must Work)

1. Business registers (tenant created)
2. Business subscribes (subscription created/activated)
3. Business creates services
4. Staff added
5. Customer books service
6. Booking assigned
7. Service completed
8. Payment processed
9. Customer review submitted (and business can respond)

---

## 4. Rebuild Order (Strict Execution Sequence)

### Phase 1: Canonicalization (Stop Contradictions)

**Backend**
1. Unmount non-canonical `business_id` APIs from `backend/src/app.ts`.
2. Mount org-scoped operational modules only.
3. Enforce canonical auth shape everywhere (no mixed `role/userRole`, no `businessId`).
4. Archive the flat CRUD skeleton directories.

**Database**
1. Add enabled additive migrations for missing operational tables:
   - `media_assets`, `conversations`, `messages`
   - `review_responses` and required `reviews` columns (via `alter table`, never redefining `reviews`)
   - `booking_status_history`, `booking_checkins`, `booking_checkouts` (and any missing booking columns)
2. Normalize subscriptions schema via additive migrations (define one authoritative shape).

**Frontend**
1. Make `config/navigation.ts` the only nav authority and render `Sidebar` in `AppShell`.
2. Delete/archive placeholder module shells and their routers.
3. Ensure every nav path maps to a real React Router route and real page component.

**CI**
1. Fix workflow scripts to match package.json.
2. Start backend before contract validation and Cypress.
3. Align tests to Vitest and remove Jest-only flags.

### Phase 2: Core CRUD (Operational Modules)

Implement canonical CRUD modules with tenant scoping and RBAC:
- Tenants (organizations)
- Users + Auth issuance (login/refresh if required)
- Staff profiles
- Clients
- Services
- Bookings (including assignment)
- Payments (transactions, intent/refund where required)
- Subscriptions (plans + org subscription state)

### Phase 3: Workflow Hardening

- Booking lifecycle transitions + history
- Check-in/out and staff notes
- Reviews response + moderation
- Media upload + reuse
- Messaging module (booking/support context)

### Phase 4: UI Wiring + QA Gates

- Replace any generated CRUD page that navigates to API paths.
- Remove mock fallbacks from production routes.
- Cypress spec proves the required workflow end-to-end.

---

## 5. Non-Negotiable Rules (Enforced by Review)

- No new endpoints without tenant scoping.
- No module page may ship if it renders fake rows on API failure.
- No second navigation schema is allowed to exist in runtime code.
- No “completion” documentation is canonical unless the code and tests prove it.

