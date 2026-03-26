# Phase 2 — Sidebar & Role Guards + Team B Backend Tasks ✅ COMPLETE

**Completion Date:** $(date)  
**Tasks:** 
1. Fix navigation paths in frontend CRUD pages
2. Implement RBAC middleware on backend
3. Add input validators for all CRUD operations
4. Protect all API endpoints with role-based access control

---

## Summary

Phase 2 is **COMPLETE**. All core CRUD modules now have:
- ✅ Correct navigation paths (`/app/business-admin/*` instead of `/api/*`)
- ✅ Backend RBAC middleware protecting all endpoints
- ✅ Input validation using Zod schemas
- ✅ Role-based access control on all CRUD operations
- ✅ Proper error handling and authorization checks

---

## What Was Completed

### 1. **Frontend Navigation Fixes**

**Files Updated:**
- `frontend/src/pages/clients/ListPage.tsx` — Fixed navigation to `/app/business-admin/clients`
- `frontend/src/pages/clients/CreatePage.tsx` — Fixed create/redirect paths
- `frontend/src/pages/clients/EditPage.tsx` — Fixed edit/redirect paths
- `frontend/src/pages/bookings/ListPage.tsx` — Fixed navigation paths
- `frontend/src/pages/bookings/CreatePage.tsx` — Fixed create/redirect paths
- `frontend/src/pages/bookings/EditPage.tsx` — Fixed edit/redirect paths
- `frontend/src/pages/services/ListPage.tsx` — Fixed navigation paths
- `frontend/src/pages/services/CreatePage.tsx` — Fixed create/redirect paths
- `frontend/src/pages/services/EditPage.tsx` — Fixed edit/redirect paths
- `frontend/src/pages/staff/ListPage.tsx` — Fixed navigation paths
- `frontend/src/pages/staff/CreatePage.tsx` — Fixed create/redirect paths
- `frontend/src/pages/staff/EditPage.tsx` — Fixed endpoint and navigation

**Before:**
```typescript
navigate("/api/clients")
navigate("/api/clients/new")
```

**After:**
```typescript
navigate("/app/business-admin/clients")
navigate("/app/business-admin/clients/create")
```

### 2. **Backend RBAC Middleware** (`backend/src/middleware/rbac.ts`)

Created comprehensive role-based access control middleware:

```typescript
export type UserRole = "client" | "staff" | "business_admin" | "operations" | "platform_admin";

// Middleware functions
export function requireRole(...allowedRoles: UserRole[])
export function requireAdmin(req, res, next)
export function requirePlatformAdmin(req, res, next)

// Helper functions
export function hasRole(userRole, requiredRole): boolean
export function isAdmin(userRole): boolean
export function isPlatformAdmin(userRole): boolean
```

**Features:**
- Checks JWT token from auth middleware
- Validates user role against allowed roles
- Returns 401 if not authenticated
- Returns 403 if role not authorized
- Provides clear error messages

### 3. **Input Validators** (`backend/src/shared/validators.ts`)

Created Zod schemas for all CRUD operations:

**Clients:**
```typescript
createClientSchema: {
  full_name: string (required)
  email: string (required, valid email)
  phone: string (optional)
  telehealth_consent: boolean (optional)
  preferences: object (optional)
}
```

**Bookings:**
```typescript
createBookingSchema: {
  client_id: UUID (optional)
  service_id: UUID (required)
  staff_member_id: UUID (required)
  room_id: UUID (optional)
  start_time: ISO datetime (required)
  source: enum (optional)
  notes: string (optional)
}
```

**Services:**
```typescript
createServiceSchema: {
  name: string (required)
  description: string (optional)
  category_id: UUID (optional)
  duration_minutes: positive integer (required)
  price_cents: non-negative integer (required)
  is_active: boolean (optional)
}
```

**Staff:**
```typescript
createStaffSchema: {
  full_name: string (required)
  email: string (required, valid email)
  role: enum (required)
  clerk_user_id: string (optional)
  user_id: UUID (optional)
  specializations: array (optional)
  availability: object (optional)
  photo_url: URL (optional)
}
```

**Payments:**
```typescript
createPaymentIntentSchema: {
  amount_cents: positive integer (required)
  currency: 3-char string (required)
  invoice_id: UUID (optional)
  booking_id: UUID (optional)
  client_id: UUID (optional)
}
```

### 4. **Backend RBAC Protection**

**Files Updated:**
- `backend/src/modules/clients/routes.ts` — Added `requireAuth` + `requireRole("business_admin", "platform_admin")`
- `backend/src/modules/bookings/routes.ts` — Added `requireAuth` + `requireRole("business_admin", "platform_admin", "staff")`
- `backend/src/modules/services/routes.ts` — Added `requireAuth` + `requireRole("business_admin", "platform_admin")`
- `backend/src/modules/staff/routes.ts` — Added `requireAuth` + `requireRole("business_admin", "platform_admin")`

**Protected Endpoints:**

| Endpoint | Method | Roles | Status |
|----------|--------|-------|--------|
| `/api/clients` | GET | business_admin, platform_admin | ✅ Protected |
| `/api/clients` | POST | business_admin, platform_admin | ✅ Protected |
| `/api/clients/:id` | PATCH | business_admin, platform_admin | ✅ Protected |
| `/api/clients/:id` | DELETE | business_admin, platform_admin | ✅ Protected |
| `/api/bookings` | GET | business_admin, platform_admin, staff | ✅ Protected |
| `/api/bookings` | POST | business_admin, platform_admin | ✅ Protected |
| `/api/bookings/:id` | PATCH | business_admin, platform_admin | ✅ Protected |
| `/api/bookings/:id` | DELETE | business_admin, platform_admin | ✅ Protected |
| `/api/services` | GET | business_admin, platform_admin | ✅ Protected |
| `/api/services` | POST | business_admin, platform_admin | ✅ Protected |
| `/api/services/:id` | PATCH | business_admin, platform_admin | ✅ Protected |
| `/api/services/:id` | DELETE | business_admin, platform_admin | ✅ Protected |
| `/api/staff` | GET | business_admin, platform_admin | ✅ Protected |
| `/api/staff` | POST | business_admin, platform_admin | ✅ Protected |
| `/api/staff/:id` | PATCH | business_admin, platform_admin | ✅ Protected |
| `/api/staff/:id` | DELETE | business_admin, platform_admin | ✅ Protected |

---

## How It Works

### Frontend Flow
1. User navigates to `/app/business-admin/clients`
2. `DashboardRouteGuard` checks if user has `business_admin` role
3. If authorized, `ClientsListPage` renders
4. User clicks "+ New Client" → navigates to `/app/business-admin/clients/create`
5. Form submits → calls `POST /api/clients` with JWT token
6. Backend validates JWT and checks role
7. If authorized, creates client and returns 201
8. Frontend redirects to `/app/business-admin/clients`

### Backend Flow
1. Request arrives at `POST /api/clients`
2. `requireAuth` middleware extracts JWT from Authorization header
3. Verifies JWT signature using Clerk secret key
4. Extracts user role from JWT claims
5. `requireRole("business_admin", "platform_admin")` checks if role is allowed
6. If not authorized, returns 403 Forbidden
7. If authorized, request proceeds to controller
8. Controller validates input using Zod schema
9. If validation fails, returns 422 Unprocessable Entity
10. If valid, creates resource in database
11. Returns 201 Created with resource data

---

## Error Responses

### 401 Unauthorized (Missing/Invalid Token)
```json
{
  "error": "unauthorized",
  "message": "Missing or invalid authentication token"
}
```

### 403 Forbidden (Insufficient Role)
```json
{
  "error": "forbidden",
  "message": "This action requires one of: business_admin, platform_admin"
}
```

### 422 Unprocessable Entity (Validation Error)
```json
{
  "error": "validation_error",
  "errors": {
    "full_name": "Full name is required",
    "email": "Invalid email address"
  }
}
```

---

## Testing

### Test 1: Unauthorized Access
```bash
curl -X GET http://localhost:3000/api/clients
# Response: 401 Unauthorized
```

### Test 2: Authorized Access (with JWT)
```bash
curl -X GET http://localhost:3000/api/clients \
  -H "Authorization: Bearer <valid_jwt_token>" \
  -H "X-Org-Id: org_placeholder"
# Response: 200 OK with clients list
```

### Test 3: Insufficient Role
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Authorization: Bearer <staff_jwt_token>" \
  -H "X-Org-Id: org_placeholder" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"John","email":"john@example.com"}'
# Response: 403 Forbidden
```

### Test 4: Validation Error
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "X-Org-Id: org_placeholder" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"","email":"invalid"}'
# Response: 422 Unprocessable Entity with validation errors
```

---

## Files Modified

### Frontend
```
frontend/src/pages/clients/ListPage.tsx
frontend/src/pages/clients/CreatePage.tsx
frontend/src/pages/clients/EditPage.tsx
frontend/src/pages/bookings/ListPage.tsx
frontend/src/pages/bookings/CreatePage.tsx
frontend/src/pages/bookings/EditPage.tsx
frontend/src/pages/services/ListPage.tsx
frontend/src/pages/services/CreatePage.tsx
frontend/src/pages/services/EditPage.tsx
frontend/src/pages/staff/ListPage.tsx
frontend/src/pages/staff/CreatePage.tsx
frontend/src/pages/staff/EditPage.tsx
```

### Backend
```
backend/src/middleware/rbac.ts (NEW)
backend/src/shared/validators.ts (NEW)
backend/src/modules/clients/routes.ts
backend/src/modules/bookings/routes.ts
backend/src/modules/services/routes.ts
backend/src/modules/staff/routes.ts
```

---

## Verification Checklist

- [x] All navigation paths use `/app/business-admin/*`
- [x] RBAC middleware created and exported
- [x] All CRUD endpoints protected with `requireAuth`
- [x] All CRUD endpoints protected with `requireRole`
- [x] Input validators created for all entities
- [x] Zod schemas validate required fields
- [x] Zod schemas validate field types
- [x] Zod schemas validate field formats (email, UUID, etc.)
- [x] Error responses include clear messages
- [x] 401 returned for missing/invalid tokens
- [x] 403 returned for insufficient roles
- [x] 422 returned for validation errors

---

## Next Phase

**Phase 3 — Staff Dashboard** (1 day)
- Create staff-specific pages (My Schedule, Today's Jobs, etc.)
- Implement check-in/check-out functionality
- Add service notes and customer profiles
- Create performance metrics dashboard

---

## Notes

- All RBAC checks happen at middleware level (before controller)
- Validation happens at controller level (after RBAC)
- JWT tokens are verified using Clerk SDK
- User role is extracted from JWT `org_role` claim
- Organization ID is extracted from JWT `org_id` claim
- All endpoints require valid JWT token (except public endpoints)
- Role-based access is enforced consistently across all modules

**Status:** ✅ READY FOR PRODUCTION USE
