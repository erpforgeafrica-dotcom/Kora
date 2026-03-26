# Sprint 3: Options D-E Preview for Teammate

## Quick Summary: What Teammate Will Tackle

While you completed **A-C (Frontend + Backend Testing)**, your teammate will tackle **D-E (CI/CD + Test Coverage)**:

---

## **OPTION D: CI Pipeline Setup** (10-15 min)

### What It Is
Automated testing on every GitHub push via GitHub Actions workflow

### What Gets Built
**File**: `.github/workflows/ci.yml` (60-80 lines)

```yaml
name: CI Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: kora
          POSTGRES_DB: kora_test
      redis:
        image: redis:7
    
    steps:
      - uses: actions/checkout@v3
      
      # Backend tests
      - name: Backend Setup
        run: cd backend && npm install
      
      - name: Backend Lint
        run: cd backend && npm run typecheck
      
      - name: Backend Tests
        run: cd backend && npm run test
      
      # Frontend tests
      - name: Frontend Setup
        run: cd frontend && npm install
      
      - name: Frontend Lint
        run: cd frontend && npm run typecheck
      
      - name: Frontend Tests
        run: cd frontend && npm run test
      
      # Coverage reporting
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

### Coverage
- ✅ TypeScript compilation on every commit
- ✅ All 59 + 80 new tests run automatically
- ✅ Database migrations validated
- ✅ Coverage reports generated
- ✅ Fails PR if tests break

### Why It Matters
- **Catches bugs early**: Before code reaches production
- **Prevents regression**: Existing tests run automatically
- **Team visibility**: Everyone sees test status
- **Quality gate**: PRs blocked if tests fail

### Implementation Steps
1. Create `.github/workflows/ci.yml`
2. Add service containers (Postgres, Redis)
3. Run backend tests with `npm run test`
4. Run frontend tests with `npm run test`
5. Configure codecov integration

---

## **OPTION E: Missing Module Tests** (30 min)

### What It Is
Comprehensive test coverage for backend modules missing integration tests

### Current Status
```
✅ Covered:
  - audience-modules (59 tests)
  - auth (Phase 1B)
  - services (Phase 1B)
  - bookings (Phase 1B)

❌ Missing:
  - payments (Stripe/PayPal/etc)
  - notifications (BullMQ)
  - reporting (Analytics + generation)
  - clinical (Patient records)
  - emergency (Critical incidents)
  - finance (Invoicing)
  - video (Video calls)
  - analytics (Dashboard)
  - 15+ other modules
```

### What Gets Built

**Pattern**: Similar to existing tests

```typescript
// For each module:
// src/test/{module}-routes.test.ts

describe("Payments Module - Response Contracts", () => {
  it("POST /api/payments/charge returns transaction", async () => {
    // Mock payment provider
    // Test charge creation
    // Validate response shape
  });
  
  it("GET /api/payments/:id returns full transaction", async () => {
    // Test retrieval
    // Check transaction status
  });
});

describe("Payments Module - RBAC", () => {
  it("client can charge only their own card", async () => {
    // Test ownership
  });
  
  it("staff cannot charge", async () => {
    // Test role restriction
  });
});

describe("Notifications Module - Queue", () => {
  it("POST /api/notifications/dispatch enqueues job", async () => {
    // Verify BullMQ job
  });
});
```

### Coverage Goals
**Per Module** (repeat for all 8 core + 20+ modules):
- ✅ CRUD routes (GET, POST, PATCH, DELETE)
- ✅ Error scenarios (404, 400, 422, 500)
- ✅ RBAC authorization (role access)
- ✅ Business boundary validation
- ✅ Job queue verification (async ops)
- ✅ Cache behavior

### Expected Result
- **8 core modules** × 6-8 tests each = 50-60 tests
- **20+ additional modules** × 3-5 tests each = 60-100 tests
- **Total**: 110-160 new tests
- **Grand Total Phase 1B**: 234-274 tests across all modules ✅

### Implementation Steps
1. Create `src/test/payments-routes.test.ts` (200 lines)
2. Create `src/test/notifications-routes.test.ts` (180 lines)
3. Create `src/test/reporting-routes.test.ts` (200 lines)
4. Create `src/test/clinical-routes.test.ts` (200 lines)
5. Create `src/test/emergency-routes.test.ts` (150 lines)
6. Create `src/test/finance-routes.test.ts` (180 lines)
7. Create `src/test/video-routes.test.ts` (150 lines)
8. Create `src/test/analytics-routes.test.ts` (150 lines)
9. Optional: Extended modules (crm, clients, staff, providers, etc.)

---

## Implementation Timeline

### Option D (CI/CD) - 10-15 min
- Minimal setup (copy existing workflow patterns)
- Immediate ROI: Auto-testing on every push
- No changes to existing code

### Option E (Test Coverage) - 30 min
- 8 test files for 8 core modules
- Uses exact same pattern as A+B+C
- Each file replicates: auth mock → route setup → contract validation → RBAC checks

---

## Team Handoff Checklist

**Your Part (A-C) ✅ COMPLETE**:
```
☑ Frontend Integration Tests (useQueryErrorHandler, CRUD error flow)
☑ E2E Contract Validation (API response shape validation)
☑ Auth & RBAC Hardening (5 roles × 40+ scenarios)
☑ Created 80+ new tests
☑ Documented in SPRINT_3_A_C_IMPLEMENTATION_COMPLETE.md
```

**Teammate's Part (D-E) ⏳ PENDING**:
```
☑ CI Pipeline Setup (.github/workflows/ci.yml)
☑ Module Test Coverage (8 core + 20+ additional modules)
☑ Create 110-160 additional tests
☑ Document in SPRINT_3_D_E_IMPLEMENTATION.md
```

---

## How to Run Tests

### All Frontend Tests (A)
```bash
cd frontend && npm run test
```

### All Backend Tests (B+C)
```bash
cd backend && npm run test
```

### Just the New Tests
```bash
# Frontend
cd frontend && npm run test -- __tests__/useQueryErrorHandler.test.ts
cd frontend && npm run test -- __tests__/crud-error-integration.test.tsx

# Backend
cd backend && npm run test -- phase1b-contract-validation.test.ts
cd backend && npm run test -- phase1b-rbac-hardening.test.ts
```

### Watch Mode (During Development)
```bash
npm run test:watch
```

---

## Collaboration Notes

### Shared Context
- Both teams use **Vitest** with **supertest** (backend) / **React Testing Library** (frontend)
- Both follow **MSW** for HTTP mocking
- Both use **vi.mock()** for dependency injection
- Same error handling patterns (400/401/403/404/422/500)
- Same RBAC roles: client, staff, business_admin, operations, platform_admin

### File Locations
- Frontend tests: `frontend/src/__tests__/*.test.ts(x)`
- Backend tests: `backend/src/test/*.test.ts`
- CI config: `.github/workflows/ci.yml`

### Git Integration
```bash
# After both teams complete work
git checkout -b sprint-3-complete
git add frontend/src/__tests__/ backend/src/test/
git add .github/workflows/ci.yml
git commit -m "Sprint 3: Options A-E complete (A-C by S1, D-E by S2)"
git push origin sprint-3-complete
# Create PR, review, merge
```

---

## Success Criteria

### For You (A-C) ✅
- [x] 80+ new tests created
- [x] Frontend error handling tested
- [x] API contracts validated
- [x] RBAC authorization matrix verified
- [x] All tests follow KORA patterns
- [x] Documentation complete

### For Teammate (D-E) ⏳ PENDING
- [ ] CI workflow auto-runs on every PR
- [ ] 110-160 new module tests created
- [ ] All core modules have test coverage
- [ ] RBAC matrix extended to modules
- [ ] Tests fail PR if they don't pass
- [ ] Code coverage >80%

### Sprint 3 Overall
- [ ] 190-240 total new tests
- [ ] Phase 1B 100% covered
- [ ] CI/CD pipeline operational
- [ ] Ready for Phase 2

---

## Notes for Teammate

### D - CI Pipeline
- Copy patterns from existing GitHub repos
- Use `postgres:16` and `redis:7` service containers
- Run `npm run test` in backend, frontend separately
- Add `npm run typecheck` for pre-commit validation
- Easy win: 10-15 minutes, huge ROI

### E - Module Tests
- Teammate can parallelize: Do 4 modules while checking code
- Each module follows same 6-step pattern
- Copy-paste from phase1b-rbac-hardening.test.ts structure
- Run `npm run test:watch` for quick feedback
- Takes ~4 min per module, runs in parallel

---

**Next Sync**: After D-E complete, all Phase 1B testing will be comprehensive and production-ready! 🚀
