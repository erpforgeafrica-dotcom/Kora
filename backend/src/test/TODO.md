# Integration Test Mock Fix TODO

## Test Status (March 23, 2026)
- **Current**: 241/307 tests passing (78.5%)
- **Goal**: 300+/307 (pass all or majority)
- **Main Issues**: 
  1. Tests expect old error format (string codes) vs new canonical format (objects with code/message)
  2. Tests expect `res.body.module` field which endpoints don't include
  3. Some mock setup issues (vi.mock hoisting)

## Recent Fixes
- ✅ Fixed: payments.test.ts error codes to use `.code` property
- ✅ Fixed: ai.test.ts error codes to use `.code` property  
- ✅ Fixed: emergency.test.ts error codes to use `.code` property
- ✅ Fixed: video.test.ts error codes to use `.code` property
- ✅ Fixed: finance.test.ts error codes (already standardized)

## Remaining Work
- [ ] Remove .module assertions from success responses (not in API)
- [ ] Fix notifications.test.ts error assertions
- [ ] Fix orchestration.test.ts error assertions
- [ ] Fix phase1b-rbac-hardening.test.ts auth failures
- [ ] Fix phase2-reporting-integration.test.ts
- [ ] Fix remaining test mock issues
- [ ] Run full test suite to verify 300+/307 pass

## Plan
1. ✅ Identify all tests using old error format
2. ✅ Update error assertions to use new canonical format
3. ⏳ Remove invalid module field expectations
4. ⏳ Handle remaining auth/mock issues
5. ⏳ Full test run verification

