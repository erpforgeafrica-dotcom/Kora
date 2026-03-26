# KORA Backend Reconstruction - Phase A: Contract & Schema Truth Recovery

Status: [IN PROGRESS]

## Valid Surviving Backend Domains (from app.ts mounts & audit)
Confirmed real modules (do not build new ones yet):
- ✅ auth (register/login/logout/me - workflows real)
- ✅ tenants/tenant (CRUD real, platform_admin)
- ✅ billing (init/verify/subscription - partial workflow)
- ✅ clients, staff, services, bookings (core business)
- ✅ payments (multi/webhook)
- ✅ platform, ai, notifications, reporting, analytics
- ✅ crm, inventory, delivery, reviews
- Others: clinical/emergency/finance (niche real)

**Rule**: Only standardize these. Defer support/feature-flags/subscriptions schema.

## Step-by-Step Implementation Checklist

### 1. Contract Standardization (SUCCESS: {data?, meta?} | ERROR: {error: {code, message, context?}})
- [ ] backend/src/modules/auth/routes.ts → {data: {accessToken, user}} preserve semantics
- [ ] backend/src/modules/tenants/routes.ts → {data: tenants, meta: {count}}
- [ ] backend/src/modules/billing/billingRoutes.ts → {data: ...}
- [ ] Core: clients/staff/services/bookings/payments/platform/ai
- [ ] Apply to all mounted modules
- Validate: No raw arrays/objects, consistent shapes

### 2. JSON-Safe API 404 Handler
- [ ] backend/src/app.ts: Add app.use('/api/*', notFoundHandler) before static
- notFoundHandler: res.status(404).json({error: {code: 'NOT_FOUND', message: 'API endpoint not found'}})

### 3. Schema/Seed Reconciliation
- [ ] backend/src/db/schema.sql: Verify no legacy 'businesses'; align indexes
- [ ] backend/src/db/seed.ts: Remove 'businesses' inserts/queries → use organizations only
- [ ] Add org-scoped demo data for core tables
- [ ] New migration if schema drift (007_org_truth.sql)

### 4. RBAC/Org Enforcement
- [ ] backend/src/middleware/organizationContext.ts: Enforce req.user.organization_id match
- [ ] Apply requireRole/requireAuth consistently to all /api/*
- [ ] Audit res.locals.auth usage

### 5. Verification & Testing
- [ ] cd backend && npm run db:migrate && npm run db:seed
- [ ] npm run typecheck && npm test && npm run validate:contracts
- [ ] Manual: curl /health, POST /api/auth/login → /api/tenants, test 403/404 JSON
- [ ] Logs: Check no HTML, contracts deterministic

### 6. Phase Complete Criteria
