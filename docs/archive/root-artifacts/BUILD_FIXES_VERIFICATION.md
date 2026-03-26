# KÓRA v1.2 - Build Fixes Verification Checklist

## Backend Verification

### ✅ App Export Fix
- [x] File: `backend/src/app.ts`
- [x] Added: `export const app = createApp();`
- [x] Reason: Tests import app directly
- [x] Impact: `npm run typecheck` passes

**Verify**:
```bash
cd backend
npm run typecheck
# Expected: Zero errors
```

---

## Frontend Verification

### ✅ 1. Vitest Globals Configuration
- [x] File: `frontend/tsconfig.json`
- [x] Added: `"types": ["vitest/globals"]`
- [x] Reason: Tests use describe/it/expect without imports
- [x] Impact: No "not defined" errors in tests

**Verify**:
```bash
cd frontend
npm run test -- subscriptions.test.tsx
npm run test -- tenants.test.tsx
# Expected: Tests pass
```

### ✅ 2. Archive Exclusion
- [x] File: `frontend/tsconfig.json`
- [x] Added: `"src/_archive"` to exclude list
- [x] Reason: Archive code shouldn't be compiled
- [x] Impact: Cleaner build, no conflicts

**Verify**:
```bash
cd frontend
npm run build
# Expected: Build succeeds, no archive warnings
```

### ✅ 3. Test Setup Fix
- [x] File: `frontend/src/test/setup.ts`
- [x] Changed: `originalUseFakeTimers(...args as [any])` → `originalUseFakeTimers()`
- [x] Changed: `originalUseRealTimers(...args as [any])` → `originalUseRealTimers()`
- [x] Reason: Functions don't accept arguments
- [x] Impact: No TypeScript errors in setup

**Verify**:
```bash
cd frontend
npm run test
# Expected: All tests pass, no setup errors
```

### ✅ 4. Duplicate Import Removal
- [x] File: `frontend/src/pages/services/CreatePage.tsx`
- [x] Removed: Duplicate `import { useNavigate } from "react-router-dom";`
- [x] Reason: Clean imports
- [x] Impact: No TypeScript warnings

**Verify**:
```bash
cd frontend
grep -n "useNavigate" src/pages/services/CreatePage.tsx
# Expected: Only one import line
```

### ✅ 5. Client Schema Migration - CreatePage
- [x] File: `frontend/src/pages/clients/CreatePage.tsx`
- [x] Changed: `first_name` + `last_name` → `full_name`
- [x] Updated: Form labels and validation
- [x] Reason: Schema alignment with backend
- [x] Impact: Proper type matching

**Verify**:
```bash
cd frontend
grep -n "full_name" src/pages/clients/CreatePage.tsx
# Expected: One occurrence in register call
grep -n "first_name\|last_name" src/pages/clients/CreatePage.tsx
# Expected: No results
```

### ✅ 6. Client Schema Migration - EditPage
- [x] File: `frontend/src/pages/clients/EditPage.tsx`
- [x] Changed: `first_name` + `last_name` → `full_name`
- [x] Updated: Form labels and validation
- [x] Reason: Schema alignment with backend
- [x] Impact: Proper type matching

**Verify**:
```bash
cd frontend
grep -n "full_name" src/pages/clients/EditPage.tsx
# Expected: One occurrence in register call
grep -n "first_name\|last_name" src/pages/clients/EditPage.tsx
# Expected: No results
```

### ✅ 7. Client Schema Migration - ListPage
- [x] File: `frontend/src/pages/clients/ListPage.tsx`
- [x] Changed: Column definitions from `first_name`, `last_name` to `full_name`
- [x] Updated: Table display
- [x] Reason: Schema alignment with backend
- [x] Impact: Proper data display

**Verify**:
```bash
cd frontend
grep -n "full_name" src/pages/clients/ListPage.tsx
# Expected: One occurrence in columns
grep -n "first_name\|last_name" src/pages/clients/ListPage.tsx
# Expected: No results
```

### ✅ 8. Client Schema Migration - CRMCustomersPage
- [x] File: `frontend/src/pages/crm/CRMCustomersPage.tsx`
- [x] Changed: Interface from `first_name`, `last_name` to `full_name`
- [x] Updated: Form state initialization
- [x] Updated: Form inputs in create modal
- [x] Updated: Form inputs in edit modal
- [x] Updated: Table display
- [x] Reason: Schema alignment with backend
- [x] Impact: Proper type matching and data display

**Verify**:
```bash
cd frontend
grep -n "full_name" src/pages/crm/CRMCustomersPage.tsx
# Expected: Multiple occurrences (interface, form, table)
grep -n "first_name\|last_name" src/pages/crm/CRMCustomersPage.tsx
# Expected: No results
```

---

## Complete Schema Migration Verification

**Verify all first_name/last_name references are gone**:
```bash
cd frontend
grep -r "first_name\|last_name" src/ --include="*.tsx" --include="*.ts"
# Expected: No results (except in comments or strings)
```

**Verify full_name is used everywhere**:
```bash
cd frontend
grep -r "full_name" src/pages/clients/ src/pages/crm/
# Expected: Multiple results in all client-related files
```

---

## Build Verification

### Backend Build
```bash
cd backend
npm run typecheck
# Expected: ✓ Zero errors
```

### Frontend Build
```bash
cd frontend
npm run build
# Expected: ✓ Build succeeds
# Expected: ✓ No TypeScript errors
# Expected: ✓ dist/ folder created
```

### Test Verification
```bash
cd backend
npm run test
# Expected: ✓ All tests pass

cd frontend
npm run test
# Expected: ✓ All tests pass
# Expected: ✓ No setup errors
```

---

## Type System Verification

### Client Type Definition
```bash
cd frontend
grep -A 15 "export interface Client" src/types/index.ts
# Expected: full_name field present
# Expected: No first_name or last_name fields
```

### All Types Aligned
```bash
cd frontend
npm run typecheck
# Expected: ✓ Zero errors
```

---

## Production Readiness Checklist

- [x] Backend typecheck passes
- [x] Frontend build succeeds
- [x] All tests passing
- [x] Schema fully migrated
- [x] No duplicate imports
- [x] Archive excluded from build
- [x] Vitest globals configured
- [x] Test setup fixed
- [x] All type definitions aligned
- [x] No legacy field references

---

## Deployment Steps

1. **Verify Builds**:
   ```bash
   cd backend && npm run typecheck
   cd frontend && npm run build
   ```

2. **Run Tests**:
   ```bash
   cd backend && npm run test
   cd frontend && npm run test
   ```

3. **Check for Warnings**:
   ```bash
   cd backend && npm run typecheck 2>&1 | grep -i warning
   cd frontend && npm run build 2>&1 | grep -i warning
   ```

4. **Deploy**:
   - Backend to production
   - Frontend to CDN
   - Run smoke tests

---

## Rollback Procedure

If issues occur:

1. **Backend**: Revert `src/app.ts` (remove app export)
2. **Frontend**: Revert `tsconfig.json` (remove Vitest globals, archive exclusion)
3. **Frontend**: Revert client schema changes (restore first_name/last_name)
4. **Frontend**: Revert test setup changes

All changes are isolated and can be reverted independently.

---

**Last Updated**: 2024
**Status**: ✅ All fixes verified and ready for production
