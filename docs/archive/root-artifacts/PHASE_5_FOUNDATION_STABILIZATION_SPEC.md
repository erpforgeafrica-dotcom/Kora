# PHASE 5: FOUNDATION STABILIZATION SPECIFICATION

**Phase**: 5 (Foundation Hardening)  
**Duration**: 2-3 weeks of systematic work  
**Priority**: CRITICAL — Must complete before Phase B domain expansion  
**Status**: 🔴 NOT STARTED  

---

## Executive Summary

Current codebase assessment: **Foundation is structured but fragmented**

✅ **What Works**:
- Database schema exists (migrations 001-012)
- JWT auth middleware + RBAC roles defined
- 5 core API modules registered (clients, staff, services, bookings, payments)
- Backend CRUD routes partially implemented
- Frontend routing structure exists

❌ **What's Broken/Missing**:
- **Schema Integrity**: Prisma doesn't exist; raw SQL migrations out of sync with code expectations
- **RBAC Enforcement**: Roles defined but not consistently applied; tenant isolation fragile
- **Auth Flow**: No complete sign-up → verification → org assignment flow
- **Navigation**: Frontend sidebar has placeholder pages; role-based nav not wired
- **CRUD Completeness**: Backend has list/create but missing detail/update/delete flows; frontend CRUD components missing
- **Dead Code**: 30+ archive pages, unregistered routes, placeholder components
- **Tenant Isolation**: organizationId checks inconsistent; org boundaries permeable

**The Core Problem**: System feels incomplete because foundation is incomplete.

---

## PART 1: SCHEMA AUDIT & INTEGRITY

### Current State

**Database Migrations**: 12 migration files (001-012)
- 001_init: Organizations, users, bookings, clinical_records
- 002-012: Additive layers (AI, orchestration, payments, services, etc.)
- **Issue**: Migrations chain together via `\i` includes; order unclear; maintenance is fragile

**Expected Schema Entities** (should exist and be scoped by organization_id):
```
✅ organizations (tenant root)
   ├─ id (UUID PK)
   ├─ name (text)
   └─ created_at

✅ users (person authenticated)
   ├─ id (UUID PK)
   ├─ organization_id (UUID FK) ← **Must have for tenant isolation**
   ├─ email (unique per org, not globally)
   ├─ full_name
   ├─ role (client|staff|business_admin|operations|platform_admin)
   └─ status (active|inactive|etc)

✅ services (what can be booked)
   ├─ id (UUID PK)
   ├─ organization_id (UUID FK) ← **MUST SCOPE**
   ├─ name
   ├─ description
   ├─ duration_minutes
   ├─ price_cents
   └─ is_active

✅ bookings (actual reservations)
   ├─ id (UUID PK)
   ├─ organization_id (UUID FK) ← **MUST SCOPE**
   ├─ client_id (UUID FK → users)
   ├─ staff_member_id (UUID FK → staff_members)
   ├─ service_id (UUID FK → services)
   ├─ start_time
   ├─ end_time
   ├─ status (pending|confirmed|completed|cancelled)
   └─ notes

✅ staff_members (who delivers services)
   ├─ id (UUID PK)
   ├─ organization_id (UUID FK) ← **MUST SCOPE**
   ├─ user_id (UUID FK → users)
   ├─ full_name
   ├─ role
   ├─ status
   └─ hourly_rate

❓ clients (customers)
   ├─ id (UUID PK)
   ├─ organization_id (UUID FK) ← **Status unclear — exists?**
   ├─ full_name
   ├─ email
   ├─ phone
   └─ profile_data (JSON)

❓ payments / invoices
   ├─ id (UUID PK)
   ├─ organization_id (UUID FK)
   ├─ booking_id (UUID FK)
   ├─ amount_cents
   ├─ status
   └─ gateway (stripe|paypal|etc)
```

### TASK 1.1: Verify Schema Integrity

**Deliverable**: Audit report + remediation plan

**Steps**:
1. **Run all migrations locally**:
   ```bash
   cd backend
   npm run db:migrate
   ```
2. **Query actual schema**:
   ```sql
   SELECT table_name, column_name, data_type 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
3. **Audit checklist**:
   - [ ] All 5 core tables exist (organizations, users, services, bookings, staff_members)
   - [ ] Every table has `organization_id` FK (except organizations itself)
   - [ ] Foreign keys are properly defined
   - [ ] No unused/orphaned tables
   - [ ] Indexes exist on (`organization_id`, `id`) for performance
   - [ ] Timestamps (created_at, updated_at) are consistent

4. **Create remediation migration if needed**:
   ```sql
   -- Migration 013_foundation_hardening.sql
   -- Add missing indexes on organization_id
   -- Fix foreign key constraints
   -- Ensure all tables scoped by org
   ```

**Acceptance Criteria**:
- [ ] Schema audit document created
- [ ] All core tables verified
- [ ] All tables scoped by organization_id
- [ ] Migration runs cleanly from scratch
- [ ] No orphaned columns or tables

---

## PART 2: RBAC AUDIT & ENFORCEMENT

### Current State

**Roles Defined** (in `src/middleware/rbac.ts`):
```typescript
type UserRole = "client" | "staff" | "business_admin" | "operations" | "platform_admin";
```

**RBAC Middleware**:
```typescript
requireRole(...allowedRoles: UserRole[]) // Route protection
requireAdmin() // business_admin OR platform_admin
requirePlatformAdmin() // platform_admin only
```

**Problem**: Middleware exists but **inconsistently applied**

**Current Usage** (grep results show):
```
✅ /api/clients        → requireRole("business_admin", "platform_admin")
✅ /api/staff          → requireRole("business_admin", "platform_admin", "staff")
✅ /api/services       → requireRole("business_admin", "platform_admin", "staff")
✅ /api/bookings       → requireRole("business_admin", "platform_admin", "staff")
❌ /api/payments       → requireAuth ONLY (risky!)
❌ /api/crm            → requireAuth ONLY (risky!)
❌ /api/discovery      → NO AUTH (public?!)
```

### TASK 2.1: RBAC Enforcement Matrix

**Deliverable**: Authorization matrix + updated route guards

**Authorization Matrix** (Who can do what):

| Endpoint | client | staff | business_admin | operations | platform_admin |
|----------|--------|-------|----------------|------------|-----------------|
| GET /services | ✅ READ ONLY | ✅ | ✅ | ✅ | ✅ |
| POST /services | ❌ | ❌ | ✅ | ❌ | ✅ |
| PATCH /services/:id | ❌ | ❌ | ✅ OWNER | ❌ | ✅ |
| DELETE /services/:id | ❌ | ❌ | ✅ OWNER | ❌ | ✅ |
| GET /bookings | ✅ OWN | ✅ ASSIGNED | ✅ ALL ORG | ✅ ALL ORG | ✅ ALL |
| POST /bookings | ✅ SELF | ✅ | ✅ | ✅ | ✅ |
| DELETE /bookings/:id | ✅ OWNER | ❌ | ✅ OWNER | ✅ | ✅ |
| GET /payments | ✅ OWN | ❌ | ✅ ALL ORG | ✅ ALL ORG | ✅ ALL |
| POST /payments/charge | ❌ | ❌ | ✅ | ❌ | ✅ |

**Steps**:
1. Review all 30+ route files in `src/modules/*/routes.ts`
2. For each route, add appropriate `requireRole()` guard
3. Add data ownership checks (client can only see own bookings, not other clients')
4. Test matrix with test cases (already partially done in phase1b-rbac-hardening.test.ts)

**Acceptance Criteria**:
- [ ] Authorization matrix documented in code
- [ ] All protected routes have requireRole() applied
- [ ] Ownership checks in place (client can't see other clients' data)
- [ ] Test cases cover all matrix cells
- [ ] No unprotected sensitive endpoints

---

## PART 3: TENANT ISOLATION HARDENING

### Current State

**How Organization Scoping Works**:
```typescript
// Backend route helper
const organizationId = getRequiredOrganizationId(res, req.header("x-org-id"));

// All queries MUST filter by organization_id
const rows = await queryDb(
  `SELECT * FROM bookings WHERE organization_id = $1`,
  [organizationId]
);
```

**Problem**: organizationId comes from **TWO** sources:
1. `res.locals.auth.organizationId` (from JWT, trusted)
2. `req.header("x-org-id")` (from client, **UNTRUSTED**)

Current code does this:
```typescript
getRequiredOrganizationId(res, req.header("x-org-id"))
// Falls back to header if auth.organizationId missing
// VULNERABLE: User can spoof x-org-id header!
```

### TASK 3.1: Enforce Tenant Isolation

**Deliverable**: Hardened isolation + tests

**Steps**:
1. **Eliminate header-based org selection**:
   ```typescript
   // WRONG (current):
   const organizationId = getRequiredOrganizationId(res, req.header("x-org-id"));
   
   // RIGHT (new):
   const organizationId = res.locals.auth?.organizationId;
   if (!organizationId) return res.status(401).json({ error: "unauthorized" });
   ```

2. **Fix all routes** that currently accept x-org-id header:
   - [ ] grep for `x-org-id` in all route files
   - [ ] Replace with `res.locals.auth.organizationId`
   - [ ] Remove header as override

3. **Add query-level isolation tests**:
   ```typescript
   // Test: User from org-A cannot query org-B data
   it("staff from org-A cannot list bookings in org-B", async () => {
     // Simulate user from org-A
     res.locals.auth = { organizationId: "org-A", userId: "user-1", userRole: "staff" };
     
     // Attempt to query org-B
     const result = await queryDb(
       `SELECT * FROM bookings WHERE organization_id = $1`,
       ["org-B"] // Different org!
     );
     
     // Should return empty, not throw error
     expect(result.length).toBe(0);
   });
   ```

4. **Audit database indexes**:
   ```sql
   -- Should have indexes like:
   CREATE INDEX idx_bookings_org_id ON bookings(organization_id);
   CREATE INDEX idx_bookings_org_client ON bookings(organization_id, client_id);
   ```

**Acceptance Criteria**:
- [ ] organizationId always from res.locals.auth, never header
- [ ] All queries filter by organization_id
- [ ] Cross-org data access impossible
- [ ] 10+ isolation test cases passing
- [ ] No user can list/modify data from other orgs

---

## PART 4: AUTH FLOW END-TO-END

### Current State

**Auth Route Implementation** (archived in `src/_archive/v12-noncanonical/modules/auth/routes.ts`):
```typescript
POST /api/auth/register
  Input: {email, password, full_name, phone}
  Output: {user, business, tokens}

POST /api/auth/login
  Input: {email, password}
  Output: {user, business, tokens}

POST /api/auth/logout
  // Clears cookies
```

**Problem**: Auth routes are in `_archive/` folder — **NOT REGISTERED in app.ts**

Current app.ts shows **no auth routes mounted**.

### TASK 4.1: Implement Complete Auth Flow

**Deliverable**: Full sign-up → login → org assignment → role-based permission flow

**Steps**:

1. **Move auth routes from archive to active**:
   ```bash
   # Restore routes
   cp backend/src/_archive/v12-noncanonical/modules/auth/routes.ts \
      backend/src/modules/auth/routes.ts
   ```

2. **Register in app.ts**:
   ```typescript
   import { authRoutes } from "./modules/auth/routes.js";
   // Should be BEFORE requireAuth middleware to allow public signup
   app.use("/api/auth", authRoutes);
   ```

3. **Test complete flow**:
   ```bash
   # 1. Register
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"SecurePwd123","full_name":"Test User"}'
   # Returns: {tokens, user, business}
   
   # 2. Extract accessToken from response
   TOKEN="<accessToken from response>"
   
   # 3. Login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"SecurePwd123"}'
   
   # 4. Use token on protected route
   curl http://localhost:3000/api/bookings \
     -H "Authorization: Bearer $TOKEN"
   ```

4. **Signup → Org Assignment Flow**:
   - [ ] User registers with email/password
   - [ ] User's organization auto-created (1:1 mapping for now)
   - [ ] User assigned `business_admin` role in that org
   - [ ] Token issued with org context
   - [ ] All subsequent requests scoped to that org

5. **Email Verification** (defer to later, but plan now):
   - [ ] Send verification email on signup
   - [ ] Modal blocks dashboard access until verified
   - [ ] Resend verification email endpoint

**Test Cases**:
- [ ] User can register new account
- [ ] Can't register duplicate email
- [ ] Invalid passwords rejected (< 8 chars)
- [ ] Login succeeds with correct credentials
- [ ] Login fails with wrong password
- [ ] Token expires correctly
- [ ] Refresh token works
- [ ] Logout clears session

**Acceptance Criteria**:
- [ ] Auth routes registered in app.ts
- [ ] Complete flow works: register → login → access protected route
- [ ] Tokens contain organization_id
- [ ] Organization auto-created on signup
- [ ] User assigned correct role
- [ ] 15+ integration tests passing

---

## PART 5: NAVIGATION & SIDEBAR FIX

### Current State

**Frontend Navigation**:
- Located in: `frontend/src/components/`, `frontend/src/pages/`
- Navigation files: `_archive/masterDashboardNavigation.ts`, `_archive/platformNavigation.ts`, `_archive/AccordionNavigation.tsx`
- **Issues**:
  - 80% of nav files in `_archive/` (not active code)
  - Role-based nav defined but not connected to actual routes
  - 30+ placeholder/empty pages
  - Sidebar doesn't hide/show based on verified permissions

### TASK 5.1: Build Role-Based Sidebar Navigation

**Deliverable**: Dynamic sidebar that shows/hides modules by role

**Step 1: Create Canonical Navigation Structure**

File: `frontend/src/data/navigationStructure.ts`
```typescript
import type { UserRole } from "../types/auth";

export type NavItem = {
  label: string;
  path: string;
  icon: string;
  requiredRoles: UserRole[];
  children?: NavItem[];
};

export const navigationStructure: NavItem[] = [
  {
    label: "Dashboard",
    path: "/app",
    icon: "◈",
    requiredRoles: ["client", "staff", "business_admin", "operations", "platform_admin"]
  },
  {
    label: "Bookings",
    path: "/app/bookings",
    icon: "◆",
    requiredRoles: ["client", "staff", "business_admin", "operations"],
    children: [
      { label: "Calendar", path: "/app/bookings/calendar", icon: "◇", requiredRoles: ["business_admin", "staff"] },
      { label: "My Bookings", path: "/app/bookings/mine", icon: "◆", requiredRoles: ["client"] },
      { label: "Queue", path: "/app/bookings/queue", icon: "◐", requiredRoles: ["business_admin", "operations"] }
    ]
  },
  {
    label: "Services",
    path: "/app/services",
    icon: "▲",
    requiredRoles: ["business_admin", "staff"],
    children: [
      { label: "Manage", path: "/app/services/manage", icon: "▲", requiredRoles: ["business_admin"] },
      { label: "Browse", path: "/app/services/browse", icon: "△", requiredRoles: ["staff", "client"] }
    ]
  },
  {
    label: "Staff",
    path: "/app/staff",
    icon: "▼",
    requiredRoles: ["business_admin", "operations"]
  },
  {
    label: "Payments",
    path: "/app/payments",
    icon: "◉",
    requiredRoles: ["business_admin", "operations"],
    children: [
      { label: "Transactions", path: "/app/payments/transactions", icon: "◎", requiredRoles: ["business_admin"] },
      { label: "Invoices", path: "/app/payments/invoices", icon: "◈", requiredRoles: ["business_admin", "client"] }
    ]
  },
  {
    label: "Settings",
    path: "/app/settings",
    icon: "⚙",
    requiredRoles: ["business_admin", "platform_admin"]
  }
  // More modules as Phase B domains are added
];

// Filter navigation by user role
export function getNavForRole(role: UserRole): NavItem[] {
  return navigationStructure
    .filter(item => item.requiredRoles.includes(role))
    .map(item => ({
      ...item,
      children: item.children?.filter(child => child.requiredRoles.includes(role))
    }));
}
```

**Step 2: Create Dynamic Sidebar Component**

File: `frontend/src/components/Sidebar.tsx`
```typescript
import { useAuth } from "../hooks/useAuth";
import { getNavForRole } from "../data/navigationStructure";
import { Link, useLocation } from "react-router-dom";

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const navItems = getNavForRole(user?.role ?? "client");

  return (
    <nav className="sidebar">
      {navItems.map(item => (
        <NavItemComponent
          key={item.path}
          item={item}
          isActive={location.pathname === item.path}
        />
      ))}
    </nav>
  );
}
```

**Step 3: Update Main Layout**

File: `frontend/src/layouts/AppLayout.tsx`
- Import Sidebar
- Show/hide based on authenticated state
- Show current user + org
- Logout button

**Step 4: Remove Placeholder Pages**

**Candidate Pages to Delete**:
```
frontend/src/pages/
├─ _archive/ (entire folder, NOT active code)
├─ platform/GeneratedModulePage.tsx (placeholder "not implemented")
├─ platform/OperationsModuleRouter.tsx (empty placeholder)
├─ platform/PlatformAdminModuleRouter.tsx (empty placeholder)
├─ NotYetImplementedPage.tsx (if exists)
└─ ... other stub pages
```

**Action**: Delete archive folder and placeholder pages post-verification

**Acceptance Criteria**:
- [ ] Navigation structure defined in `navigationStructure.ts`
- [ ] Sidebar dynamically shows/hides based on role
- [ ] All role-specific nav tested
- [ ] Active page highlighted
- [ ] Placeholder pages removed
- [ ] No 404s on valid nav links

---

## PART 6: CRUD COMPLETION

### Current State

**Backend CRUD Status**:

| Resource | GET list | GET detail | POST create | PATCH update | DELETE |
|----------|----------|-----------|------------|-------------|--------|
| services | ✅ | ⚠️ partial | ✅ | ⚠️ partial | ❌ |
| bookings | ✅ | ⚠️ partial | ✅ | ⚠️ partial | ⚠️ partial |
| clients | ✅ | ❌ | ✅ | ❌ | ❌ |
| staff | ✅ | ❌ | ✅ | ❌ | ❌ |
| payments | ✅ | ❌ | ✅ | ❌ | ❌ |

**Frontend CRUD Status**:
- List views: 40% implemented
- Detail views: 20% implemented
- Create forms: 30% implemented
- Update forms: 10% implemented  
- Delete confirmations: 5% implemented

### TASK 6.1: Complete Backend CRUD for Core Modules

**Modules to Complete**: services, bookings, clients, staff, payments

**Template for Each Module**:

```typescript
// GET /:id - Fetch single record with ownership check
router.get("/:id", requireAuth, requireRole(...), async (req, res, next) => {
  try {
    const orgId = res.locals.auth.organizationId;
    const record = await queryDb(
      `SELECT * FROM ${table} WHERE id = $1 AND organization_id = $2`,
      [req.params.id, orgId]
    );
    if (!record[0]) return res.status(404).json({ error: "not_found" });
    
    // Ownership check: client can only see own records
    if (res.locals.auth.userRole === "client") {
      if (record[0].client_id !== res.locals.auth.userId) {
        return res.status(403).json({ error: "forbidden" });
      }
    }
    
    return res.json(record[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /:id - Update record with validation
router.patch("/:id", requireAuth, requireRole(...), async (req, res, next) => {
  try {
    const orgId = res.locals.auth.organizationId;
    
    // Ownership check for client
    if (res.locals.auth.userRole === "client") {
      const existing = await queryDb(
        `SELECT client_id FROM ${table} WHERE id = $1 AND organization_id = $2`,
        [req.params.id, orgId]
      );
      if (existing[0]?.client_id !== res.locals.auth.userId) {
        return res.status(403).json({ error: "forbidden" });
      }
    }
    
    // Update with only allowed fields
    const updated = await queryDb(
      `UPDATE ${table} SET name = $1, updated_at = now()
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [req.body.name, req.params.id, orgId]
    );
    
    return res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /:id - Soft delete with ownership check
router.delete("/:id", requireAuth, requireRole(...), async (req, res, next) => {
  try {
    const orgId = res.locals.auth.organizationId;
    
    // Ownership check
    if (res.locals.auth.userRole === "client") {
      const existing = await queryDb(
        `SELECT client_id FROM ${table} WHERE id = $1 AND organization_id = $2`,
        [req.params.id, orgId]
      );
      if (existing[0]?.client_id !== res.locals.auth.userId) {
        return res.status(403).json({ error: "forbidden" });
      }
    }
    
    await queryDb(
      `UPDATE ${table} SET status = 'archived', updated_at = now()
       WHERE id = $1 AND organization_id = $2`,
      [req.params.id, orgId]
    );
    
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});
```

**Specific Tasks**:
- [ ] /api/services/:id GET (detail)
- [ ] /api/services/:id PATCH (update)
- [ ] /api/services/:id DELETE (archive)
- [ ] /api/bookings/:id GET (detail with joins)
- [ ] /api/bookings/:id PATCH (update status)
- [ ] /api/bookings/:id DELETE (cancel)
- [ ] /api/clients/:id GET (profile)
- [ ] /api/clients/:id PATCH (update profile)
- [ ] /api/clients/:id DELETE (soft delete)
- [ ] /api/staff/:id GET
- [ ] /api/staff/:id PATCH
- [ ] /api/staff/:id DELETE
- [ ] /api/payments/:id GET
- [ ] /api/payments/:id PATCH
- [ ] /api/payments/:id DELETE

**Test Each**: Ownership checks + role checks + 404 handling

### TASK 6.2: Complete Frontend CRUD Flows

For each module (services, bookings, clients, staff, payments):

1. **List View** (`/app/{module}`)
   - GET list: ✅ working
   - Pagination: working
   - Filter/search: working
   - Create button
   - Edit/Delete row actions

2. **Detail View** (`/app/{module}/:id`)
   - GET detail
   - Show all fields
   - Edit button

3. **Create Form** (`/app/{module}/create`)
   - Modal or dedicated page
   - Form validation
   - Submit to POST /api/{module}
   - Redirect after success

4. **Update Form** (`/app/{module}/:id/edit`)
   - Load existing data
   - Edit allowed fields
   - Submit to PATCH /api/{module}/:id

5. **Delete Confirmation**
   - Confirm before DELETE
   - On success, return to list

**Example**: Services CRUD in React
```typescript
// frontend/src/pages/ServicesPage.tsx
import { useEffect, useState } from "react";
import { useApi } from "../hooks/useApi";

export function ServicesPage() {
  const [services, setServices] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const { get, post, patch, delete: deleteApi } = useApi();

  // Load list
  useEffect(() => {
    get("/api/services").then(setServices);
  }, []);

  // Create
  const handleCreate = async (data) => {
    await post("/api/services", data);
    const updated = await get("/api/services");
    setServices(updated);
    setShowCreate(false);
  };

  // Update
  const handleUpdate = async (id, data) => {
    await patch(`/api/services/${id}`, data);
    const updated = await get("/api/services");
    setServices(updated);
  };

  // Delete
  const handleDelete = async (id) => {
    if (confirm("Delete this service?")) {
      await deleteApi(`/api/services/${id}`);
      setServices(services.filter(s => s.id !== id));
    }
  };

  return (
    <div>
      <button onClick={() => setShowCreate(true)}>Create Service</button>
      {showCreate && <ServiceCreateForm onSubmit={handleCreate} />}
      <ServicesList
        services={services}
        onEdit={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] All CRUD operations working end-to-end
- [ ] Ownership checks preventing cross-user access
- [ ] Role checks preventing unauthorized operations
- [ ] Error handling with user feedback
- [ ] 50+ integration tests passing
- [ ] UI smooth and responsive

---

## PART 7: CLEANUP & DEAD CODE REMOVAL

### Current State

**Dead/Archive Code Locations**:
```
backend/src/_archive/
├─ v12-noncanonical/
│  ├─ modules/  (auth, old services, old bookings)
│  └─ services/ (authService.ts with old JWT logic)

frontend/src/_archive/
├─ GeneratedModulePage.tsx
├─ CanonicalModulePage.tsx
├─ PlatformModuleRouter.tsx
├─ AccordionNavigation.tsx
├─ masterDashboardNavigation.ts
├─ platformNavigation.ts
└─ ... 20+ more placeholder pages
```

### TASK 7.1: Code Cleanup

**Step 1: Backup & Verify** (Safety first)
```bash
# Create backup tag
git tag backup/pre-phase5-cleanup

# List all files in archive
find backend/src/_archive -type f | wc -l
find frontend/src/_archive -type f | wc -l
```

**Step 2: Delete Confirmed Dead Code**

After task 4 (auth flow) is complete:
```bash
# Archive folder is safe to delete (code migrated to active)
rm -rf backend/src/_archive

# Frontend archive (placeholder pages not used)
rm -rf frontend/src/_archive
rm frontend/src/pages/platform/GeneratedModulePage.tsx
rm frontend/src/pages/platform/OperationsModuleRouter.tsx
rm frontend/src/pages/platform/PlatformAdminModuleRouter.tsx
```

**Step 3: Remove Unused Route Registrations in app.ts**

Current app.ts has 30+ registered routes. Audit which are actually used:
```typescript
// Check each against Phase 1B core modules:
// ✅ Keep: /api/clients, /api/staff, /api/services, /api/bookings, /api/payments
// ❌ Remove: Unregistered placeholder routes
// ⚠️ Review: Experimental routes (AI, video, etc.) - keep for now
```

**Step 4: Remove Placeholder Pages**

Placeholder pages that can be deleted:
```
frontend/src/pages/
├─ LandingPage.tsx (landing, keep)
├─ NotFoundPage.tsx (404, keep)
├─ platform/GeneratedModulePage.tsx ❌ DELETE
├─ platform/OperationsModuleRouter.tsx ❌ DELETE
├─ platform/PlatformAdminModuleRouter.tsx ❌ DELETE
├─ VideoSessionPage.tsx (if not used) ❌ REVIEW
└─ ... other empty pages
```

**Step 5: Import Cleanup**

Remove unused imports from:
- app.ts (cleanup route imports)
- App.tsx (frontend, cleanup route imports)

```bash
# Find unused imports
npm install --save-dev eslint-plugin-unused-imports
npm run lint -- --fix
```

**Acceptance Criteria**:
- [ ] Archive folders deleted
- [ ] Placeholder pages removed
- [ ] Dead imports cleaned up
- [ ] app.ts streamlined to only active modules
- [ ] No orphaned references in App.tsx
- [ ] Build passes: no missing imports
- [ ] Tests pass: no broken references

---

## PHASE 5 EXECUTION ROADMAP

### Week 1: Schema & RBAC

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Schema audit | Audit report, migrations run cleanly |
| 2 | RBAC matrix | Authorization spreadsheet, requireRole() added to all routes |
| 3 | Tenant isolation | Header-based org removed, tests passing |
| **Friday** | **Tests** | **40+ RBAC tests passing** |

### Week 2: Auth & Navigation

| Day | Task | Deliverable |
|-----|------|-------------|
| 4 | Auth flow | Sign-up → login → org assignment working |
| 5 | Navigation structure | navigationStructure.ts + Sidebar component |
| 6 | Dynamic nav | Sidebar shows/hides by role |
| 7 | Cleanup | Archive deleted, dead code removed |
| **Friday** | **Tests** | **Complete auth flow + nav tests passing** |

### Week 3: CRUD Completion

| Day | Task | Deliverable |
|-----|------|-------------|
| 8 | Backend: Detail/PATCH/DELETE | All CRUD endpoints complete for 5 core modules |
| 9 | Frontend: List/Detail/Create | UI components working for all modules |
| 10 | Frontend: Update/Delete | Full form flows + delete confirmations |
| 11 | Integration tests | 50+ end-to-end tests |
| **Friday** | **Validation** | **Full CRUD working, all tests passing** |

---

## SUCCESS CRITERIA (Phase 5 Complete)

✅ **Schema**:
- All migrations run cleanly
- All core tables exist and scoped by org_id
- Indexes optimized

✅ **RBAC**:
- Authorization matrix documented
- All routes protected with requireRole()
- Ownership checks enforce data boundaries
- 40+ authorization tests passing

✅ **Auth Flow**:
- Register: new user + auto-org creation
- Login: JWT tokens with org context
- Logout: session cleanup
- Token expiry + refresh working

✅ **Navigation**:
- Dynamic sidebar by role
- Archive folders deleted
- Placeholder pages removed
- No dead code

✅ **CRUD**:
- All 5 modules: services, bookings, clients, staff, payments
- GET list, GET detail, POST create, PATCH update, DELETE working
- Frontend forms + validation + error handling
- 50+ integration tests

✅ **Overall**:
- All tests passing (~100+ combined)
- No unprotected sensitive routes
- No cross-org data access possible
- Frontend flows smooth and complete
- Ready for Phase B domain expansion

---

## Next: Phase B Domain Expansion

Once Phase 5 is complete, proceed in this order:

1. **Phase 6**: CRM Domain (leads, contacts, opportunities)
2. **Phase 7**: Inventory Domain (items, stock, reservations)
3. **Phase 8**: Delivery Domain (orders, routes, fulfillment)
4. **Phase 9**: Analytics & Reporting

Each phase will consume existing foundation and add new domain-specific tables, APIs, and UI.

---

**Phase 5 Status**: 🔴 NOT STARTED  
**Estimated Effort**: 2-3 weeks  
**Priority**: CRITICAL

