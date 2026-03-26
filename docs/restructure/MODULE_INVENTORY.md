# Backend Module Inventory (Org-Scoped vs Business-Scoped)

**Status:** Canonical supporting artifact  
**Last updated:** 2026-03-13  

This inventory classifies backend modules by which tenancy/auth model they currently depend on.

**Key**
- `business_id` model: uses `authenticateRequest` and/or references `business_id` fields. This is non-operational under the enabled migration chain.
- `organization_id` model: uses `getRequiredOrganizationId` and is intended to be org-scoped, but may still be wired to the wrong auth middleware.

---

## 1. Summary Classification

### Non-canonical (business_id / authenticateRequest)

These must be archived or rewritten to org-scoped tenancy:
- `backend/src/modules/auth/routes.ts`
- `backend/src/modules/businesses/routes.ts`
- `backend/src/modules/users/routes.ts`
- `backend/src/modules/services/routes.ts`
- `backend/src/modules/bookings/routes.ts`

### Org-scoped but auth-incompatible (requireAuth from middleware/auth.ts)

These must be updated to canonical auth shape (do not keep `requireAuth` that sets `role/businessId`):
- `backend/src/modules/clients/routes.ts`
- `backend/src/modules/staff/routes.ts`

### Org-scoped (organization_id-first)

These are candidates to remain canonical once auth and mounts are corrected:
- `backend/src/modules/appointments/routes.ts`
- `backend/src/modules/availability/routes.ts`
- `backend/src/modules/payments/routes.ts`
- `backend/src/modules/tenant/routes.ts`
- Many platform/audience modules that already use `getRequiredOrganizationId`.

---

## 2. Known Schema Conflicts (Must Be Resolved)

### Categories

- `backend/src/modules/categories/routes.ts` assumes an org-scoped `service_categories` table with `organization_id`, `name`, `slug`, etc.
- Enabled migrations create `service_categories` as global with `slug`, `label`, `vertical` and no `organization_id`.

Action: pick one canonical category model.
- Canonical for v1.2: global `service_categories` (platform-wide) + optional org override table if needed.
- Rewrite the categories module accordingly (do not enable disabled migration that redefines the table).

### Enhanced Services and Booking Workflow

- `backend/src/modules/services/enhancedRoutes.ts` and `backend/src/modules/bookings/workflowRoutes.ts` reference tables/columns defined only in `012_service_management.sql.disabled`.

Action: create new enabled additive migrations that add only the missing columns/tables (do not redefine `service_categories`, do not introduce duplicate availability tables).

### Reviews/Media/Messages

- Disabled migration `011_advanced_integrations.sql.disabled` defines `media_assets`, `review_responses`, `conversations`, `messages`, but also redefines `reviews`.

Action: create enabled additive migrations that add `media_assets`, `review_responses`, `conversations`, `messages` and `alter table reviews` to add missing columns when required. Never redefine `reviews`.

