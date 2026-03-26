# ADR 007: Canonical Tenant, Auth/RBAC, Navigation, and Route Ownership (v1.2)

**Status**: Accepted  
**Date**: 2026-03-13  

## Context

The repo contains multiple incompatible architectures:
- Database schema is primarily tenant-scoped via `organizations` and `organization_id`.
- Mounted backend APIs depend on a `business_id` model that is not created by enabled migrations.
- Auth/RBAC uses multiple incompatible `res.locals.auth` shapes (`role/businessId` vs `userRole/organizationId`).
- Frontend runtime navigation is driven by multiple schemas and placeholder module surfaces that generate fake rows.

This prevents KORA from functioning as an operational business platform.

## Decision

### Tenant Model

- Tenant == Business (single concept).
- Canonical DB tenant table: `organizations`.
- Canonical tenant scoping key: `organization_id`.
- The `businesses` table and `business_id`-dependent APIs are non-canonical for v1.2 operations.

### Auth/RBAC Contract

- Canonical backend auth context is defined by `backend/src/middleware/rbac.ts`:
  - `res.locals.auth.userId`
  - `res.locals.auth.userRole`
  - `res.locals.auth.organizationId`
- JWT payload schema for canonical routes:
  - `{ sub, role, tenantId }`
  - `role` is one of `client | staff | business_admin | operations | platform_admin`.

### Backend Route Ownership

- Canonical routes live under `backend/src/modules/<domain>/routes.ts`.
- Flat CRUD skeleton under `backend/src/routes` + `backend/src/controllers` is retired.

### Frontend Navigation

- Canonical navigation source: `frontend/src/config/navigation.ts`.
- Canonical sidebar component: `frontend/src/components/layout/Sidebar.tsx`.
- Runtime navigation must not depend on:
  - `frontend/src/data/masterDashboardNavigation.ts`
  - `frontend/src/data/platformNavigation.ts`
  - `frontend/src/components/layout/AccordionNavigation.tsx`
  - Placeholder module shells (`GeneratedModulePage`, `CanonicalModulePage`)

## Consequences

### Positive
- One tenant model and one RBAC model eliminates cross-tenant leakage and broken authorization.
- Backend endpoints align to enabled migrations and become deployable from a clean install.
- Frontend routes become explicit and testable.
- CI can be made deterministic (no placeholder pages masking missing APIs).

### Negative
- Non-canonical APIs and placeholder surfaces must be archived or deleted, which will reduce “apparent coverage” but increases operational truth.

## Implementation Order (Enforced)

1. Canonicalization (unmount non-canonical routes, unify auth shape, consolidate nav).
2. Core CRUD for required entities with tenant scoping.
3. Workflow history + operational hardening.
4. UI wiring and E2E workflow proof.

