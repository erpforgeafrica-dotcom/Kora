# KORA CODEBASE CLEANUP MATRIX

## INVENTORY SUMMARY
**Root MD Docs**: 200+ (PHASE_*, AUDIT_*, AGENT_* → **docs/**)
**Backend src/**: 300+ TS (app.ts mounts 40 modules → **KEEP core**, DELETE empty/dups)
**Frontend src/**: 200+ TSX (pages/, components/ → **KEEP used**, DELETE _archive/)
**Scripts/Logs**: 50+ (**DELETE**)

## CLASSIFICATION & ACTIONS

### KEEP (Active/Referenced - 40%)
```
backend/src/app.ts (mounts all)
backend/src/middleware/* (auth, error, rbac)
backend/src/modules/clients/staff/bookings/payments/services/*routes.ts
backend/src/db/* (client.ts, optimized.ts)
frontend/src/pages/clients/bookings/payments/support/*Page.tsx
frontend/src/components/TableActionsMenu.tsx (used everywhere)
frontend/src/config/navigation.ts (role maps)
frontend/src/types/index.ts
package.json, docker-compose.yml, tsconfig.json
```

### DELETE (Unused/Dead - 30%)
```
ALL root *.md (PHASE_*, AGENT_*, SPRINT_* → move to docs/)
backend/src/test/*test.ts (80% mock-only, delete)
frontend/src/_archive/* (old nav/pages)
frontend/src/pages/dev/StubPage.tsx (placeholder)
*.log files (test_output.log, vitest*.log)
Untitled-1.ts
cookies.txt
l -d Ubuntu... (shell snippet)
backend/src/modules/empty-folders/ (analytics, campaigns - no routes.ts)
```

### MERGE/REPLACE (Duplicates - 15%)
```
BACKEND ROUTES:
tenant/ + tenants/ + platform/ → KEEP tenants/, DELETE tenant/platform/
services/ + services/enhanced/ → MERGE to services/
bookings/ + bookings/workflow → MERGE workflow to bookings/
payments/ + payments/multi → MERGE to payments/

FRONTEND PAGES:
