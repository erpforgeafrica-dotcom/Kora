# KÓRA v1.2 - Quick Verification Guide

## One-Command Verification

### Backend
```bash
cd backend && npm run typecheck
```
**Expected Output**: Zero errors

### Frontend
```bash
cd frontend && npm run build
```
**Expected Output**: Build succeeds, dist/ folder created

---

## Detailed Verification

### 1. Backend TypeScript Check
```bash
cd backend
npm run typecheck
```
✅ Should show: `0 errors`

### 2. Frontend Build
```bash
cd frontend
npm run build
```
✅ Should show: `✓ built in X.XXs`

### 3. Backend Tests
```bash
cd backend
npm run test
```
✅ Should show: All tests passing

### 4. Frontend Tests
```bash
cd frontend
npm run test
```
✅ Should show: All tests passing

---

## Schema Migration Verification

### Check no legacy fields remain
```bash
cd frontend
grep -r "first_name\|last_name" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".test"
```
✅ Should show: No results

### Check full_name is used
```bash
cd frontend
grep -r "full_name" src/pages/clients/ src/pages/crm/ --include="*.tsx"
```
✅ Should show: Multiple results

---

## Type System Verification

### Check Client interface
```bash
cd frontend
grep -A 10 "export interface Client" src/types/index.ts
```
✅ Should show: `full_name: string;`

### Check no TypeScript errors
```bash
cd frontend
npm run typecheck 2>&1 | grep -i error
```
✅ Should show: No results

---

## Build Artifacts Verification

### Backend
```bash
cd backend
ls -la src/app.ts
grep "export const app" src/app.ts
```
✅ Should show: `export const app = createApp();`

### Frontend
```bash
cd frontend
ls -la dist/
```
✅ Should show: dist/ folder with index.html and assets

---

## Pre-Deployment Checklist

Run this sequence before deploying:

```bash
# 1. Backend typecheck
cd backend && npm run typecheck && echo "✓ Backend typecheck passed"

# 2. Backend tests
cd backend && npm run test && echo "✓ Backend tests passed"

# 3. Frontend build
cd frontend && npm run build && echo "✓ Frontend build passed"

# 4. Frontend tests
cd frontend && npm run test && echo "✓ Frontend tests passed"

# 5. Schema verification
cd frontend && grep -r "first_name\|last_name" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".test" && echo "✗ Legacy fields found" || echo "✓ No legacy fields"

# 6. Type verification
cd frontend && grep -A 10 "export interface Client" src/types/index.ts | grep "full_name" && echo "✓ Client type correct" || echo "✗ Client type incorrect"
```

---

## Troubleshooting

### If Backend TypeCheck Fails
```bash
cd backend
npm run typecheck 2>&1 | head -20
# Check if app export is present in src/app.ts
grep "export const app" src/app.ts
```

### If Frontend Build Fails
```bash
cd frontend
npm run build 2>&1 | head -30
# Check tsconfig.json for Vitest globals
grep "vitest/globals" tsconfig.json
# Check for archive exclusion
grep "_archive" tsconfig.json
```

### If Tests Fail
```bash
cd frontend
npm run test 2>&1 | head -30
# Check test setup file
cat src/test/setup.ts | grep -A 5 "useFakeTimers"
```

### If Schema Migration Incomplete
```bash
cd frontend
# Find any remaining first_name references
grep -r "first_name" src/pages/clients/ src/pages/crm/
# Find any remaining last_name references
grep -r "last_name" src/pages/clients/ src/pages/crm/
```

---

## Files Modified (Quick Reference)

### Backend (1 file)
- `src/app.ts` - Added app export

### Frontend (7 files)
- `tsconfig.json` - Added Vitest globals, excluded archive
- `src/test/setup.ts` - Fixed timer functions
- `src/pages/services/CreatePage.tsx` - Removed duplicate import
- `src/pages/clients/CreatePage.tsx` - Migrated to full_name
- `src/pages/clients/EditPage.tsx` - Migrated to full_name
- `src/pages/clients/ListPage.tsx` - Updated columns
- `src/pages/crm/CRMCustomersPage.tsx` - Migrated to full_name

---

## Deployment Commands

### Build for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Deploy Backend
```bash
cd backend
# Deploy dist/ or run with npm start
npm start
```

### Deploy Frontend
```bash
cd frontend
# Upload dist/ to CDN or web server
# Or use your deployment tool
```

### Verify Deployment
```bash
# Backend health check
curl http://localhost:3000/health

# Frontend check
curl http://localhost:5173/
```

---

## Rollback Commands

If deployment fails:

### Backend Rollback
```bash
cd backend
git checkout src/app.ts
npm run typecheck
```

### Frontend Rollback
```bash
cd frontend
git checkout tsconfig.json src/test/setup.ts src/pages/
npm run build
```

---

## Success Indicators

✅ **Backend Ready**:
- `npm run typecheck` returns 0 errors
- `npm run test` all pass
- `src/app.ts` exports app instance

✅ **Frontend Ready**:
- `npm run build` succeeds
- `npm run test` all pass
- No first_name/last_name references
- full_name used everywhere
- dist/ folder created

✅ **Integration Ready**:
- Backend and frontend types aligned
- All CRUD operations properly typed
- No schema mismatches
- Tests passing end-to-end

---

## Support

For issues:
1. Check the troubleshooting section above
2. Review FINAL_BUILD_FIXES.md for detailed changes
3. Review BUILD_FIXES_VERIFICATION.md for verification steps
4. Check git diff for exact changes made

---

**Status**: ✅ Ready for production deployment
**Last Verified**: 2024
