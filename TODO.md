# KORA GOVERNANCE TODO.md - SYSTEM STABILIZATION PLAN

## STATUS: EXECUTING (Step 1/8 ✅)

**Objective**: Lock contracts, eliminate overlaps, enforce QA.

### PLAN BREAKDOWN:

1. ✅ **Create this TODO.md** - Tracking active
2. 🔲 **Fix optionalAuth silent failures** - backend/src/middleware/auth.ts
3. 🔲 **Create responseWrapper middleware** - Enforce {success, data, meta}
4. 🔲 **Mount responseWrapper in app.ts** - Before all /api/* modules
5. 🔲 **Add pagination to ALL list endpoints** - Standard meta
6. 🔲 **Consolidate duplicate routes** - Remove /tenant, /platform → /tenants only
7. 🔲 **Canonicalize workflows/routes.ts** - Use {success, error} format
8. 🔲 **Update tests + FE types** - Verify contracts
9. 🔲 **QA validation + completion**

### TEAM OWNERSHIP:
- **BACKEND**: 2-7 (API contracts)
- **QA**: 8-9 (validation)
- **FRONTEND**: Adapt to new contracts (no invention)

### PROGRESS TRACKER:
```
Step 1: TODO.md [✅ DONE]
Step 2: auth.ts fix [⬜ PENDING]
...
```

**Next Command**: After each step completes, update this file + proceed.

**NON-NEGOTIABLE**: No deviations. QA blocks merges.
