# KORA Platform - IMMEDIATE ACTION PLAN
**Start Today - Week 1 Execution**

---

## TODAY (Monday Morning)

### 1. Read & Understand (1 hour)
- [ ] Read `ENTERPRISE_SYSTEM_AUDIT_REPORT.md` (30 min)
- [ ] Read `DEPLOYMENT_STRATEGY_FOR_TEAM.md` (30 min)

### 2. Audit Current Routes (2 hours)
**Task**: Understand what routes exist and where duplicates are

**Command**:
```bash
# List all backend routes
grep -r "Router()" backend/src/modules/*/routes.ts | wc -l
grep -r "\.get\|\.post\|\.patch\|\.delete" backend/src/modules/*/routes.ts | wc -l
```

**Create**: `ROUTE_AUDIT.md` documenting:
- All routes by module
- Duplicate routes
- Conflicting routes
- Missing routes

### 3. Create Week 1 Checklist (30 min)
**Create**: `WEEK_1_CHECKLIST.md`

```markdown
# Week 1 Checklist

## Day 1-2: Route Consolidation (16 hours)
- [ ] Audit all routes
- [ ] Identify duplicates
- [ ] Create consolidation plan
- [ ] Merge duplicate routes
- [ ] Update frontend references
- [ ] Test all routes

## Day 3: Navigation Registry (12 hours)
- [ ] Create navigation.config.ts
- [ ] Define all routes per role
- [ ] Update AppShell
- [ ] Remove hardcoded navigation
- [ ] Test navigation

## Day 4: Tenant Model (12 hours)
- [ ] Create TenantContext
- [ ] Create tenant middleware
- [ ] Standardize headers
- [ ] Update all routes
- [ ] Test tenant isolation

## Day 5: Documentation (4 hours)
- [ ] Document canonical architecture
- [ ] Create decision records
- [ ] Share with team
- [ ] Get approval
```

---

## THIS WEEK (Days 1-5)

### Day 1-2: Route Consolidation

#### Step 1: Audit Routes (2 hours)
```bash
cd backend/src/modules

# Find all route files
find . -name "routes.ts" -o -name "*Routes.ts"

# Count endpoints per module
for file in */routes.ts; do
  echo "=== $file ==="
  grep -c "\.get\|\.post\|\.patch\|\.delete" "$file"
done
```

#### Step 2: Create Consolidation Plan (4 hours)
**Document in**: `docs/ROUTE_CONSOLIDATION_PLAN.md`

**For each module, list**:
- Current routes
- Duplicate routes
- Conflicts
- Consolidation strategy

**Example**:
```markdown
## Bookings Module

### Current Routes
- GET /api/bookings
- POST /api/bookings
- PATCH /api/bookings/:id
- DELETE /api/bookings/:id
- POST /api/bookings/:bookingId/assign-staff/:staffId
- GET /api/bookings/:bookingId/assignments
- PATCH /api/bookings/:bookingId/assignments/:assignmentId/confirm
- POST /api/bookings/:bookingId/staff-preferences
- GET /api/bookings/:customerId/staff-preferences
- POST /api/bookings/waitlist/add
- GET /api/bookings/waitlist
- POST /api/bookings/shifts/add
- GET /api/bookings/staff/:staffId/shifts

### Consolidation Strategy
- Keep main CRUD routes (GET /, POST /, PATCH /:id, DELETE /:id)
- Move workflow routes to sub-resources
- Consolidate shift management into staff module
- Consolidate waitlist into bookings module
```

#### Step 3: Merge Duplicate Routes (6 hours)
**For each module**:
1. Open `backend/src/modules/{module}/routes.ts`
2. Consolidate duplicate endpoints
3. Ensure all functionality is preserved
4. Test with Postman/curl

**Example consolidation**:
```typescript
// BEFORE: Multiple route files
// bookingsRoutes.ts
// bookingWorkflowRoutes.ts
// bookingShiftRoutes.ts

// AFTER: Single routes file
export const bookingsRoutes = Router();

// CRUD
bookingsRoutes.get("/", ...);
bookingsRoutes.post("/", ...);
bookingsRoutes.patch("/:id", ...);
bookingsRoutes.delete("/:id", ...);

// Workflow sub-resources
bookingsRoutes.post("/:id/assign-staff/:staffId", ...);
bookingsRoutes.get("/:id/assignments", ...);

// Shift management (move to staff module)
// bookingsRoutes.post("/shifts/add", ...); // MOVE TO STAFF

// Waitlist management
bookingsRoutes.post("/waitlist/add", ...);
bookingsRoutes.get("/waitlist", ...);
```

#### Step 4: Update Frontend References (2 hours)
**Update**: `frontend/src/App.tsx`

```typescript
// BEFORE: Multiple route mounts
app.use("/api/bookings", bookingsRoutes);
app.use("/api/bookings/workflow", bookingWorkflowRoutes);
app.use("/api/bookings/shifts", bookingShiftRoutes);

// AFTER: Single route mount
app.use("/api/bookings", bookingsRoutes);
```

#### Step 5: Test All Routes (2 hours)
```bash
# Test each endpoint
curl http://localhost:3000/api/bookings
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "x-organization-id: test-org" \
  -d '{"service_id":"test","start_time":"2024-01-01T10:00:00Z","end_time":"2024-01-01T11:00:00Z"}'
```

---

### Day 3: Navigation Registry

#### Step 1: Create Navigation Config (4 hours)
**Create**: `frontend/src/config/navigation.config.ts`

```typescript
export interface NavItem {
  path: string;
  label: string;
  icon: string;
  children?: NavItem[];
}

export interface NavigationConfig {
  [role: string]: NavItem[];
}

export const navigationConfig: NavigationConfig = {
  client: [
    { path: '/app/client', label: 'Dashboard', icon: 'home' },
    { path: '/app/client/book', label: 'Book Service', icon: 'calendar' },
    { path: '/app/client/bookings', label: 'My Bookings', icon: 'list' },
    { path: '/app/client/reviews', label: 'My Reviews', icon: 'star' },
  ],
  business_admin: [
    { path: '/app/business-admin', label: 'Dashboard', icon: 'home' },
    {
      label: 'Operations',
      icon: 'briefcase',
      children: [
        { path: '/app/business-admin/clients', label: 'Clients', icon: 'users' },
        { path: '/app/business-admin/bookings', label: 'Bookings', icon: 'calendar' },
        { path: '/app/business-admin/services', label: 'Services', icon: 'briefcase' },
        { path: '/app/business-admin/staff', label: 'Staff', icon: 'users' },
      ],
    },
    {
      label: 'Management',
      icon: 'settings',
      children: [
        { path: '/app/business-admin/payments', label: 'Payments', icon: 'credit-card' },
        { path: '/app/business-admin/reviews', label: 'Reviews', icon: 'star' },
        { path: '/app/business-admin/media', label: 'Media', icon: 'image' },
      ],
    },
  ],
  staff: [
    { path: '/app/staff', label: 'Dashboard', icon: 'home' },
    { path: '/app/staff/schedule', label: 'My Schedule', icon: 'calendar' },
    { path: '/app/staff/jobs', label: 'Today\'s Jobs', icon: 'list' },
  ],
  operations: [
    { path: '/app/operations', label: 'Dashboard', icon: 'home' },
    { path: '/app/operations/dispatch', label: 'Dispatch', icon: 'map' },
    { path: '/app/operations/support', label: 'Support', icon: 'help-circle' },
  ],
  platform_admin: [
    { path: '/app/kora-admin', label: 'Dashboard', icon: 'home' },
    { path: '/app/kora-admin/tenants', label: 'Tenants', icon: 'building' },
    { path: '/app/kora-admin/users', label: 'Users', icon: 'users' },
    { path: '/app/kora-admin/subscriptions', label: 'Subscriptions', icon: 'credit-card' },
  ],
};
```

#### Step 2: Update AppShell (4 hours)
**Update**: `frontend/src/components/layout/AppShell.tsx`

```typescript
import { navigationConfig } from '../../config/navigation.config';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const navItems = navigationConfig[role] || [];

  return (
    <div className="flex">
      <Sidebar items={navItems} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

#### Step 3: Update Sidebar Component (2 hours)
**Update**: `frontend/src/components/Sidebar.tsx`

```typescript
interface SidebarProps {
  items: NavItem[];
}

export function Sidebar({ items }: SidebarProps) {
  return (
    <nav className="sidebar">
      {items.map((item) => (
        <NavLink key={item.path} to={item.path}>
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
```

#### Step 4: Remove Hardcoded Navigation (1 hour)
- [ ] Remove hardcoded nav from AppShell
- [ ] Remove hardcoded nav from Sidebar
- [ ] Remove hardcoded nav from Dashboard pages

#### Step 5: Test Navigation (1 hour)
- [ ] Test navigation for each role
- [ ] Verify all links work
- [ ] Verify role-based filtering

---

### Day 4: Tenant Model

#### Step 1: Create TenantContext (4 hours)
**Create**: `frontend/src/contexts/TenantContext.tsx`

```typescript
import { createContext, useContext, ReactNode } from 'react';

interface TenantContextType {
  organizationId: string | null;
  setOrganizationId: (id: string) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  return (
    <TenantContext.Provider value={{ organizationId, setOrganizationId }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
```

#### Step 2: Create Tenant Middleware (4 hours)
**Create**: `backend/src/middleware/tenant.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const organizationId = req.header('x-organization-id');
  
  if (!organizationId) {
    return res.status(400).json({ error: 'missing_organization_id' });
  }

  res.locals.organizationId = organizationId;
  next();
}
```

#### Step 3: Standardize Headers (2 hours)
**Update all routes**:
```typescript
// BEFORE
const organizationId = req.header('x-org-id') ?? req.header('x-organization-id');

// AFTER
const organizationId = req.header('x-organization-id');
```

#### Step 4: Update All Routes (1 hour)
- [ ] Replace all header references
- [ ] Use standardized header name
- [ ] Test all routes

#### Step 5: Test Tenant Isolation (1 hour)
```bash
# Test with different organization IDs
curl http://localhost:3000/api/bookings \
  -H "x-organization-id: org-1"

curl http://localhost:3000/api/bookings \
  -H "x-organization-id: org-2"

# Verify different results
```

---

### Day 5: Documentation

#### Step 1: Document Canonical Architecture (2 hours)
**Create**: `docs/CANONICAL_ARCHITECTURE.md`

```markdown
# KORA Canonical Architecture

## Route Structure

All routes follow this pattern:
```
/api/{module}/{resource}
  GET / - list
  POST / - create
  GET /:id - detail
  PATCH /:id - update
  DELETE /:id - delete
  POST /:id/{action} - workflow action
```

## Tenant Model

All requests must include:
```
Header: x-organization-id: {organization-id}
```

All queries are filtered by organization_id.

## Navigation Registry

Navigation is defined in `frontend/src/config/navigation.config.ts`.

Each role has a set of navigation items.

Navigation is role-aware and automatically filtered.

## Error Handling

All errors follow this format:
```json
{
  "error": "error_code",
  "message": "Human readable message",
  "details": {}
}
```

## Audit Logging

All mutations are logged to audit_logs table:
```
{
  "action": "module.action",
  "actor_id": "user-id",
  "metadata": {}
}
```
```

#### Step 2: Create Decision Records (1 hour)
**Create**: `docs/adr/008-canonical-routes.md`

```markdown
# ADR 008: Canonical Route Structure

## Status
Accepted

## Context
Routes were duplicated across modules, causing confusion about canonical API.

## Decision
Establish single canonical route per entity following REST conventions.

## Consequences
- Clearer API contract
- Easier to maintain
- Easier to document
- Easier to test
```

#### Step 3: Share with Team (30 min)
- [ ] Share audit report
- [ ] Share deployment strategy
- [ ] Share action plan
- [ ] Get feedback

---

## END OF WEEK 1

### Checkpoint
- [ ] All duplicate routes consolidated
- [ ] Navigation registry created
- [ ] Tenant model established
- [ ] Architecture documented
- [ ] All tests passing

### Deliverables
- [ ] `ROUTE_CONSOLIDATION_PLAN.md`
- [ ] `frontend/src/config/navigation.config.ts`
- [ ] `frontend/src/contexts/TenantContext.tsx`
- [ ] `backend/src/middleware/tenant.ts`
- [ ] `docs/CANONICAL_ARCHITECTURE.md`
- [ ] `docs/adr/008-canonical-routes.md`

### Next Week
Start Week 2: Service Layer Extraction

---

## SUPPORT CONTACTS

**Questions about routes?**
- Contact: Senior Backend Engineer
- Slack: #backend-architecture
- Response: 2 hours

**Questions about frontend?**
- Contact: Senior Frontend Engineer
- Slack: #frontend-architecture
- Response: 2 hours

**Blocking issues?**
- Contact: Engineering Manager
- Slack: #engineering-blockers
- Response: 1 hour

**Architecture questions?**
- Contact: Principal Architect
- Slack: #architecture
- Response: 4 hours

---

## TIPS FOR SUCCESS

1. **Start small**: Don't try to consolidate all routes at once
2. **Test frequently**: Test after each change
3. **Document as you go**: Don't defer documentation
4. **Ask for help**: Don't get stuck
5. **Take breaks**: Don't burn out
6. **Celebrate wins**: Acknowledge progress

---

## YOU'VE GOT THIS

This is challenging work, but you have the skills to execute it. You have support from the team. You have a clear roadmap.

**Start today. Make progress every day. Celebrate every win.**

**Let's build something great.**

---

**Questions?** Ask immediately.  
**Stuck?** Reach out for help.  
**Ready?** Let's go.
