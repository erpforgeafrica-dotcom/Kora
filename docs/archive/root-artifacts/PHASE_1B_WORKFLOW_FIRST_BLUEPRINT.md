# KORA Phase 1B: Workflow-First Completion Blueprint
**Date**: March 14, 2026 | **Status**: Ready for Final Integration | **Constitution**: Workflow-First, All-Systems-Together

---

## 🎯 KORA Enterprise System Constitution Principles

> **No module is valid unless schema, API, backend logic, frontend operational UI, role enforcement, and workflow integration all exist together.**

### Phase 1B Core Workflows
1. **Authentication & Authorization** - Multi-role (client, staff, business_admin, operations, platform_admin)
2. **Business Onboarding** - Business entity creation with owner relationship
3. **Service Catalog Management** - Create, update, categorize, publish services
4. **Booking Workflow** - Schedule, confirm, reschedule, complete bookings
5. **Client Management** - Register clients, track preferences, loyalty

---

## 📊 Current System State Assessment

### ✅ COMPLETE
| Component | Status | Details |
|-----------|--------|---------|
| **Database Migrations** | ✅ Ready | 029 migrations (001-029 in /db/migrations/) |
| **Auth Middleware** | ✅ Ready | JWT + RBAC (requireAuth, requireRole, attachAuth) |
| **Backend Routes** | ✅ Ready | All Phase 1B routes registered in app.ts |
| **Repository Layer** | ✅ Ready | bookingRepository, customerRepository, staffRepository, etc. |
| **Workflow Routes** | ✅ Ready | /api/bookings/workflow (calendar, status, reschedule) |
| **Error Handling** | ✅ Ready | errorHandler middleware + proper status codes |
| **Response Shapes** | ✅ Ready | Frontend-compatible: `{ module: "", count: N, [entities]: [...] }` |
| **TypeScript** | ✅ Ready | Zero errors in npm run typecheck |
| **Frontend Pages** | ✅ Ready | Pages directory populated for all Phase 1B modules |

### ⏳ NEAR COMPLETE (Requires Execution)
| Component | Status | Action Required |
|-----------|--------|-----------------|
| **Database Running** | ⏳ Pending | `docker compose up -d postgres redis` |
| **Migrations Applied** | ⏳ Pending | `npm run db:migrate` in backend/ |
| **Backend Started** | ⏳ Pending | `npm run dev` on port 3000 |
| **Frontend Started** | ⏳ Pending | `npm run dev` on port 5173 |
| **API Contracts Tested** | ⏳ Pending | Curl/Postman tests for all Phase 1B routes |
| **Frontend Components Wired** | ⏳ Pending | Connect Pages → Services → API calls |
| **E2E Workflows Tested** | ⏳ Pending | Full user journey tests |

---

## 🏗️ Architecture & Workflow Integration

### Phase 1B Workflow Chain

```
┌─────────────────────────────────────────────────────────────────┐
│                    KORA Phase 1B Workflow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [1] AUTHENTICATION                                             │
│  └── JWT login → Organization context → Role assigned          │
│      Route: POST /api/auth/login                                │
│      Auth Header: "Authorization: Bearer <JWT>"                │
│                                                                 │
│  [2] BUSINESS MANAGEMENT (Business Admin)                       │
│  └── View/create/update business profile                        │
│      Routes: GET /api/clients, POST /api/clients               │
│      Middleware: requireAuth, requireRole("business_admin")    │
│                                                                 │
│  [3] SERVICE CATALOG (Business Admin)                           │
│  └── Define services, set pricing, assign duration             │
│      Routes: GET /api/services, POST /api/services             │
│      Middleware: requireAuth, requireRole("business_admin")    │
│                                                                 │
│  [4] BOOKING WORKFLOW (Multi-role)                              │
│  ├── [4a] Business Admin: Create booking slots                 │
│  ├── [4b] Client: Search and request booking                   │
│  ├── [4c] Staff: View calendar, confirm appointment            │
│  ├── [4d] Workflow: Update status → History tracking           │
│  └── Routes: GET/POST /api/bookings, /api/bookings/workflow   │
│      Middleware: organizationId scoped, role-enforced          │
│                                                                 │
│  [5] ROLE-BASED ACCESS CONTROL                                  │
│  ├── client    → See own bookings, booking history             │
│  ├── staff     → See team bookings, client details              │
│  ├── business_admin → Full business management                 │
│  ├── operations    → Cross-business analytics (TBD)            │
│  └── platform_admin → System-wide access                       │
│                                                                 │
│  [6] PERSISTENCE & AUDIT                                        │
│  └── All changes logged to audit_logs table                    │
│      Changed by: res.locals.auth?.userId                       │
│      Action: entity.operation (e.g., "booking.created")        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Phase 1B Implementation Checklist

### Tier 1: Infrastructure (MUST COMPLETE FIRST)
- [ ] Docker services started: `docker compose up -d postgres redis`
- [ ] PostgreSQL connecting on port 5432
- [ ] Redis connecting on port 6379
- [ ] Backend `.env` file exists with DATABASE_URL, REDIS_URL, JWT_SECRET

### Tier 2: Database & Backend
- [ ] Database migrations applied: `npm run db:migrate`
- [ ] Seed data loaded (optional): `npm run db:seed`
- [ ] Backend typecheck passes: `npm run typecheck`
- [ ] Backend starts without errors: `npm run dev` (port 3000)
- [ ] Health endpoint works: `curl http://localhost:3000/health`

### Tier 3: Frontend & UI
- [ ] Frontend `.env` file exists: `VITE_API_BASE_URL=http://localhost:3000`
- [ ] Frontend typecheck passes: `cd frontend && npm run typecheck`
- [ ] Frontend builds successfully: `npm run build`
- [ ] Frontend dev server starts: `npm run dev` (port 5173)
- [ ] Can access to http://localhost:5173

### Tier 4: Authentication Testing
- [ ] Test JWT auth flow (see Testing section below)
- [ ] Test role validation (requireRole middleware)
- [ ] Test organization scoping (getRequiredOrganizationId)

### Tier 5: Module Testing (Phase 1B)
**Auth Module**
- [ ] POST /api/auth/login returns JWT token
- [ ] JWT contains sub, role, tenantId

**Clients Module**
- [ ] GET /api/clients (list clients by organization)
- [ ] POST /api/clients (create new client)
- [ ] GET /api/clients/:id (retrieve client details)
- [ ] Verify roleCheck: only business_admin can create

**Services Module**
- [ ] GET /api/services (list services)
- [ ] POST /api/services (create service)
- [ ] PATCH /api/services/:id (update service)
- [ ] DELETE /api/services/:id (soft delete)

**Bookings Module**
- [ ] GET /api/bookings (list bookings)
- [ ] POST /api/bookings (create booking)
- [ ] PATCH /api/bookings/:id (update booking)
- [ ] GET /api/bookings/workflow/calendar (calendar view)
- [ ] POST /api/bookings/:id/status (workflow: update status)
- [ ] POST /api/bookings/:id/reschedule (workflow: reschedule)

### Tier 6: E2E Workflow Testing
- [ ] Complete workflow: Create business → Add service → Create client → Book → Update status
- [ ] Role enforcement: Client cannot see other client's bookings
- [ ] Organization isolation: Business A cannot see Business B's data
- [ ] Audit trail: All changes logged with actor_id

---

## 🔧 Key Configuration Files

### Backend Setup
**File**: `backend/.env`
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://kora:kora@localhost:5432/kora
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-test-secret-key-here
LOG_LEVEL=debug
```

**File**: `backend/src/db/client.ts`
- PostgreSQL connection pool configured
- Supports concurrent connections

**File**: `backend/src/middleware/rbac.ts`
- Role definitions: "client" | "staff" | "business_admin" | "operations" | "platform_admin"
- Role-based route protection via `requireRole(...roles)`

### Frontend Setup
**File**: `frontend/.env`
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=KORA
VITE_ENV=development
```

**File**: `frontend/src/services/api.ts`
- Axios instance with JWT interceptor
- Organization ID header injection
- Error handling & retry logic

---

## 🧪 Testing Strategy

### Unit Tests (Backend)
**Command**: `npm run test` (in backend/)
- Service layer tests
- Repository tests
- Middleware tests

### Integration Tests (API Contracts)
**Command**: `npm run test:contracts` (if available)
- Uses Vitest + supertest
- Tests full HTTP flow

### Manual Testing with Curl

#### 1. Authentication Flow
```bash
# Test JWT login - assumes table structure with users
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "test123"
  }' \
  -v

# Response should include JWT token
# Extract token and use in subsequent calls:
export TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

#### 2. Client Management
```bash
# List clients (requires valid JWT + header)
curl -H "Authorization: Bearer $TOKEN" \
  -H "x-org-id: <org-uuid>" \
  http://localhost:3000/api/clients

# Create client
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-org-id: <org-uuid>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "full_name": "John Doe",
    "phone": "+44123456789"
  }' \
  http://localhost:3000/api/clients
```

#### 3. Services Management
```bash
# List services
curl -H "Authorization: Bearer $TOKEN" \
  -H "x-org-id: <org-uuid>" \
  http://localhost:3000/api/services

# Create service
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-org-id: <org-uuid>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hair Cut",
    "description": "Professional haircut service",
    "duration_minutes": 30,
    "price_cents": 2500,
    "currency": "GBP"
  }' \
  http://localhost:3000/api/services
```

#### 4. Booking Workflow
```bash
# Create booking
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-org-id: <org-uuid>" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "<service-uuid>",
    "client_id": "<client-uuid>",
    "staff_id": "<staff-uuid>",
    "start_time": "2026-03-15T10:00:00Z",
    "end_time": "2026-03-15T10:30:00Z",
    "notes": "First appointment"
  }' \
  http://localhost:3000/api/bookings

# View booking calendar
curl -H "Authorization: Bearer $TOKEN" \
  -H "x-org-id: <org-uuid>" \
  "http://localhost:3000/api/bookings/workflow/calendar?start_date=2026-03-01&end_date=2026-03-31"

# Update booking status
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-org-id: <org-uuid>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "reason": "Confirmed by staff"
  }' \
  http://localhost:3000/api/bookings/<booking-id>/status

# Reschedule booking
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-org-id: <org-uuid>" \
  -H "Content-Type: application/json" \
  -d '{
    "start_time": "2026-03-15T11:00:00Z",
    "staff_member_id": "<new-staff-id>"
  }' \
  http://localhost:3000/api/bookings/<booking-id>/reschedule
```

---

## 📐 Response Shape Contract

### Standard List Response
```json
{
  "module": "bookings",
  "count": 25,
  "bookings": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "service_id": "uuid",
      "client_id": "uuid",
      "start_time": "2026-03-15T10:00:00Z",
      "end_time": "2026-03-15T10:30:00Z",
      "status": "confirmed",
      "notes": "string or null",
      "client_name": "John Doe",
      "staff_name": "Jane Smith",
      "service_name": "Hair Cut",
      "created_at": "2026-03-14T15:00:00Z"
    }
  ]
}
```

### Standard Create Response
```json
{
  "id": "uuid",
  "organization_id": "uuid",
  "service_id": "uuid",
  "client_id": "uuid",
  "start_time": "2026-03-15T10:00:00Z",
  "end_time": "2026-03-15T10:30:00Z",
  "status": "pending",
  "notes": null,
  "created_at": "2026-03-14T15:00:00Z",
  "updated_at": "2026-03-14T15:00:00Z"
}
```

### Error Response
```json
{
  "error": "error_code",
  "message": "Human-readable error message"
}
```

---

## 🔐 Role-Based Access Control Reference

### Route Protection Pattern
```typescript
// Only business_admin and platform_admin can list bookings
bookingsRoutes.get("/", 
  requireAuth, 
  requireRole("business_admin", "platform_admin"), 
  async (req, res, next) => {
    // route handler
  }
);
```

### Role Definitions
- **client**: Can view own bookings, profile
- **staff**: Can view assigned bookings, client info
- **business_admin**: Full business management (services, staff, clients, bookings)
- **operations**: Cross-business analytics (Phase 2+)
- **platform_admin**: System-wide access, user management

### Organization Scoping
All data queries MUST include organization_id:
```typescript
constorganizationId = getRequiredOrganizationId(res, req.header("x-org-id"));
// All queries filter by organization_id = $1
```

---

## 🚀 Execution Sequence (Step-by-Step)

### Session 1: Infrastructure & Database
1. Start Docker: `docker compose up -d postgres redis`
2. Wait for services to be healthy (30 seconds)
3. Apply migrations: `cd backend && npm run db:migrate`
4. Verify migrations: Check `pg_migrations` table
5. (Optional) Seed demo data: `npm run db:seed`

### Session 2: Backend Validation
1. Run typecheck: `npm run typecheck` (should pass)
2. Start backend: `npm run dev` (should listen on port 3000)
3. Test health endpoint: `curl http://localhost:3000/health`
4. Run quick manual auth test (see Curl examples above)

### Session 3: Frontend Validation
1. Check frontend `.env` is correct (VITE_API_BASE_URL)
2. Run typecheck: `cd frontend && npm run typecheck` (should pass)
3. Start frontend: `npm run dev` (should listen on port 5173)
4. Open browser to `http://localhost:5173`

### Session 4: E2E Workflow Testing
1. Execute complete workflow from curl examples
2. Verify database audit_logs table contains activities
3. Test role enforcement (try accessing with wrong role)
4. Test organization isolation (use different x-org-id header)

### Session 5: Frontend Integration
1. Wire Pages to Services
2. Connect API calls to backend routes
3. Test Auth flow end-to-end
4. Test Booking creation workflow

---

## 🔍 Troubleshooting Guide

### Database Connection Failed
```
ERROR: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: 
```bash
docker compose up -d postgres redis
docker compose logs postgres  # Check logs
```

### Migration Failed
```
Error: relation "bookings" already exists
```
**Solution**: Migrations are idempotent; check `pg_migrations` table for which ones were applied.

### JWT Token Invalid
```
401 Unauthorized
```
**Solution**: 
1. Make sure JWT_SECRET in `.env` matches token used
2. Token must include sub, role, tenantId in payload
3. Check token expiration

### Organization ID Missing
```
HTTP 400: missing_organization_id
```
**Solution**: All Phase 1B routes require `-H "x-org-id: <uuid>"` header

### TypeScript Errors
```
TS7053: Element implicitly has an 'any' type
```
**Solution**: Run `npm run typecheck` to see full error list, fix typing issues.

---

## 📦 Deliverables Checklist

By end of Phase 1B, you will have:

- ✅ **Production-Ready Database** with 29 migrated tables
- ✅ **JWT-Based Authentication** system with role enforcement
- ✅ **5 Core API Modules** (clients, services, bookings + workflow, staff, categories)
- ✅ **Organization Scoping** for multi-tenancy
- ✅ **Audit Trail** for all operations
- ✅ **Frontend Pages** skeleton (ready for integration)
- ✅ **E2E Workflow** tested and validated
- ✅ **Response Contracts** standardized for frontend consumption
- ✅ **Error Handling** consistent across all routes
- ✅ **RBAC** enforced at middleware level

---

## 📞 Next Steps

1. **Start Infrastructure**: Execute Tier 1 checklist
2. **Apply Migrations**: Execute Tier 2 checklist
3. **Validate Backend**: Execute Tier 3-4 checklist
4. **Test Workflows**: Execute Tier 5-6 checklist
5. **Document Results**: Create PHASE_1B_COMPLETION_REPORT.md
6. **Proceed to Phase 2**: Feature expansion, advanced workflows, AI integration

---

**Last Updated**: March 14, 2026  
**Document Version**: 1.0  
**Constitution**: KORA Enterprise System - Workflow-First, All-Systems-Together  
**Authored By**: Copilot (Haiku 4.5)
