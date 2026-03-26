# File Actions (Keep / Rewrite / Archive / Delete)

**Status:** Canonical supporting artifact  
**Last updated:** 2026-03-13  

This file enumerates exact filesystem actions required to remove duplication and enforce a single architecture.

---

## 1. Backend

### Keep (Canonical, but may require auth rewrites)

- `backend/src/middleware/rbac.ts`
- `backend/src/shared/http.ts`
- `backend/src/modules/appointments/**` (org-scoped booking operations)
- `backend/src/modules/payments/**` (org-scoped payments)
- `backend/src/modules/tenant/**` (branches/locations)
- `backend/src/modules/clients/**` (org-scoped, currently auth-incompatible)
- `backend/src/modules/staff/**` (org-scoped, currently auth-incompatible)

### Rewrite in place (Canonical target, but currently schema-mismatched)

- `backend/src/modules/categories/routes.ts` (must match global `service_categories` schema or introduce an org override table)
- `backend/src/modules/services/enhancedRoutes.ts` (must not depend on disabled migrations)
- `backend/src/modules/bookings/workflowRoutes.ts` (must not depend on disabled migrations)
- `backend/src/modules/reviews/routes.ts` and `backend/src/modules/media/routes.ts` (must match enabled migrations once additive migrations are added)

### Archive (Non-canonical architecture: business_id + authenticateRequest)

- `backend/src/middleware/auth.ts`
- `backend/src/services/authService.ts`
- `backend/src/modules/auth/**`
- `backend/src/modules/businesses/**`
- `backend/src/modules/users/**`
- `backend/src/modules/services/routes.ts` (business_id-based CRUD)
- `backend/src/modules/bookings/routes.ts` (business_id-based CRUD)
- `backend/src/db/repositories/businessRepository.ts`
- `backend/src/db/repositories/userRepository.ts`
- `backend/src/db/repositories/servicesRepository.ts`
- `backend/src/db/repositories/bookingsRepository.ts`

### Archive (Flat CRUD skeleton; not tenant-safe and targets non-existent tables)

- `backend/src/routes/**`
- `backend/src/controllers/**`
- `backend/controllers/**` (currently empty; keep only if needed as a new canonical layer, otherwise remove)

**Recommended archive location**
- `backend/src/_archive/v12-noncanonical/<moved files>`

**Git commands**
```bash
git mv backend/src/routes backend/src/_archive/v12-noncanonical/routes
git mv backend/src/controllers backend/src/_archive/v12-noncanonical/controllers
git mv backend/src/middleware/auth.ts backend/src/_archive/v12-noncanonical/auth.ts
git mv backend/src/services/authService.ts backend/src/_archive/v12-noncanonical/authService.ts
```

---

## 2. Frontend

### Keep (Canonical)

- `frontend/src/config/navigation.ts`
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/hooks/useCrud.ts` (but must be updated to canonical API response shapes)

### Rewrite in place (Canonical shell)

- `frontend/src/components/layout/AppShell.tsx` (must render `Sidebar` and stop using `AccordionNavigation` + schema nav)
- `frontend/src/App.tsx` (must stop routing into placeholder module shells; every nav path must route to a real page)

### Archive/Delete (Duplicate navigation schemas + placeholder module shells)

- `frontend/src/components/layout/AccordionNavigation.tsx`
- `frontend/src/data/masterDashboardNavigation.ts`
- `frontend/src/data/platformNavigation.ts`
- `frontend/src/pages/platform/GeneratedModulePage.tsx`
- `frontend/src/pages/platform/CanonicalModulePage.tsx`
- `frontend/src/pages/platform/PlatformModuleRouter.tsx`

**Recommended archive location**
- `frontend/src/_archive/v12-noncanonical/<moved files>`

**Git commands**
```bash
git mv frontend/src/data frontend/src/_archive/v12-noncanonical/data
git mv frontend/src/pages/platform frontend/src/_archive/v12-noncanonical/pages-platform
```

---

## 3. Documentation

### Archive (Repo-root “completion” claims)

All repo-root markdown files matching these patterns are non-canonical:
- `*_COMPLETE*.md`
- `*_FINAL*.md`
- `*_READY*.md`
- `*_REPORT*.md`

**Recommended archive location**
- `docs/_archive/status-claims/`

**Git command example**
```bash
mkdir -p docs/_archive/status-claims
git mv *_COMPLETE*.md docs/_archive/status-claims/ 2>/dev/null || true
git mv *_FINAL*.md docs/_archive/status-claims/ 2>/dev/null || true
git mv *_READY*.md docs/_archive/status-claims/ 2>/dev/null || true
git mv *_REPORT*.md docs/_archive/status-claims/ 2>/dev/null || true
```

