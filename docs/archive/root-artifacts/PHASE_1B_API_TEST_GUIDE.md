# KORA Phase 1B: API Contract Tests & Manual Testing Guide

## Test Strategy

Phase 1B implements core CRUD operations for 5 modules with JWT-based authentication:
1. **Auth** - User registration, login, session management
2. **Businesses** - Business entity CRUD + ownership
3. **Users** - User profile CRUD
4. **Services** - Service catalog CRUD + search
5. **Bookings** - Booking management with context-aware access

## Setup Prerequisites

```bash
# 1. Start Docker containers (if Docker available)
docker compose up -d postgres redis

# 2. Apply database migrations
cd backend
npm run db:migrate

# 3. Start backend server
npm run dev
# Server will listen on http://localhost:3000

# 4. In another terminal, start frontend
cd frontend
npm run dev
# Frontend will be on http://localhost:5173
```

## Phase 1B API Endpoints - Complete Test Suite

### 1. AUTH MODULE (`/api/auth`)

#### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "founder@example.com",
    "password": "SecurePassword123!",
    "full_name": "John Founder"
  }'
```

**Expected Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "founder@example.com",
    "full_name": "John Founder",
    "role": "business_admin",
    "created_at": "2026-03-14T20:00:00Z"
  },
  "business": {
    "id": "uuid",
    "name": "John Founder's Business",
    "status": "active"
  },
  "tokens": {
    "accessToken": "jwt.token.here",
    "refreshToken": "jwt.refresh.token"
  }
}
```

**Error Cases:**
- 400: Invalid email/password format
- 409: Email already exists
- 422: Missing required fields

---

#### Login User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "founder@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response (200 OK):**
```json
{
  "user": { ... },
  "tokens": {
    "accessToken": "jwt.token.here",
    "refreshToken": "jwt.refresh.token"
  }
}
```

**Save the accessToken - needed for all protected routes!**

---

#### Get Current User
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "user": { ... },
  "business": { ... }
}
```

---

#### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK):**
```json
{ "message": "Logged out successfully" }
```

---

### 2. BUSINESSES MODULE (`/api/businesses`)

#### List All Businesses (PUBLIC)
```bash
curl -X GET "http://localhost:3000/api/businesses?limit=10&offset=0"
```

**Expected Response (200 OK):**
```json
{
  "businesses": [ ... ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

---

#### Get Business by ID (PUBLIC - basic info)
```bash
curl -X GET "http://localhost:3000/api/businesses/BUSINESS_UUID"
```

**Expected Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Business Name",
  "slug": "business-name",
  "status": "active",
  "created_at": "2026-03-14T20:00:00Z"
}
```

---

#### Update Business (OWNER ONLY)
```bash
curl -X PATCH http://localhost:3000/api/businesses/BUSINESS_UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Updated Business Name",
    "description": "New description"
  }'
```

**Expected Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Updated Business Name",
  "description": "New description",
  ...
}
```

**Error Cases:**
- 401: Not authenticated
- 403: Not business owner
- 404: Business not found

---

### 3. USERS MODULE (`/api/users`)

#### Get User Profile
```bash
curl -X GET http://localhost:3000/api/users/USER_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "User Name",
  "role": "staff",
  "phone": "+1234567890",
  "created_at": "2026-03-14T20:00:00Z"
}
```

---

#### Update User Profile
```bash
curl -X PATCH http://localhost:3000/api/users/USER_UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "full_name": "Updated Name",
    "phone": "+9876543210"
  }'
```

**Expected Response (200 OK):**
```json
{
  "id": "uuid",
  "full_name": "Updated Name",
  "phone": "+9876543210",
  ...
}
```

---

#### List Users by Business
```bash
curl -X GET "http://localhost:3000/api/users?role=staff&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "users": [ ... ],
  "total": 5,
  "limit": 10
}
```

---

### 4. SERVICES MODULE (`/api/services`)

#### List All Services (PUBLIC - paginated)
```bash
curl -X GET "http://localhost:3000/api/services?limit=10&offset=0"
```

**Expected Response (200 OK):**
```json
{
  "services": [ ... ],
  "total": 0,
  "limit": 10,
  "offset": 0
}
```

---

#### Search Services (PUBLIC)
```bash
curl -X GET "http://localhost:3000/api/services/search?q=haircut&limit=10"
```

**Expected Response (200 OK):**
```json
{
  "services": [ ... ],
  "total": 0,
  "query": "haircut"
}
```

---

#### Get Services by Business (PUBLIC)
```bash
curl -X GET "http://localhost:3000/api/services/business/BUSINESS_UUID?limit=10"
```

**Expected Response (200 OK):**
```json
{
  "services": [ ... ],
  "businessId": "uuid",
  "total": 0
}
```

---

#### Create Service (BUSINESS OWNER ONLY)
```bash
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Haircut",
    "description": "Professional haircut service",
    "price": 35.99,
    "duration_minutes": 30,
    "category": "hair-care",
    "business_id": "BUSINESS_UUID"
  }'
```

**Expected Response (201 CREATED):**
```json
{
  "id": "uuid",
  "name": "Haircut",
  "price": 35.99,
  "duration_minutes": 30,
  "status": "active",
  "created_at": "2026-03-14T20:00:00Z"
}
```

---

#### Update Service (OWNER ONLY)
```bash
curl -X PATCH http://localhost:3000/api/services/SERVICE_UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "price": 39.99,
    "description": "Premium haircut service"
  }'
```

**Expected Response (200 OK):**
```json
{
  "id": "uuid",
  "price": 39.99,
  "description": "Premium haircut service",
  ...
}
```

---

#### Archive Service (OWNED/ADMIN ONLY)
```bash
curl -X DELETE http://localhost:3000/api/services/SERVICE_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "message": "Service archived successfully",
  "id": "uuid"
}
```

---

### 5. BOOKINGS MODULE (`/api/bookings`)

#### List Bookings (CONTEXT-AWARE)
```bash
curl -X GET "http://localhost:3000/api/bookings?limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK):**
- If user is customer: returns own bookings
- If user is staff/owner: returns business bookings
```json
{
  "bookings": [ ... ],
  "total": 0,
  "limit": 10
}
```

---

#### Get Bookings by Business (OWNER/STAFF ONLY)
```bash
curl -X GET "http://localhost:3000/api/bookings/business/BUSINESS_UUID?limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "bookings": [ ... ],
  "businessId": "uuid",
  "total": 0
}
```

---

#### Create Booking (ANY AUTHENTICATED USER)
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "service_id": "SERVICE_UUID",
    "business_id": "BUSINESS_UUID",
    "customer_id": "YOUR_USER_UUID",
    "scheduled_time": "2026-03-15T14:00:00Z",
    "notes": "Looking forward to it!"
  }'
```

**Expected Response (201 CREATED):**
```json
{
  "id": "uuid",
  "service_id": "uuid",
  "customer_id": "uuid",
  "status": "pending",
  "scheduled_time": "2026-03-15T14:00:00Z",
  "created_at": "2026-03-14T20:00:00Z"
}
```

---

#### Update Booking Status (OWNER/STAFF ONLY)
```bash
curl -X PATCH http://localhost:3000/api/bookings/BOOKING_UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "status": "confirmed"
  }'
```

**Expected Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "confirmed",
  ...
}
```

**Valid statuses:** pending, confirmed, completed, cancelled, rescheduled

---

#### Cancel Booking
```bash
curl -X POST http://localhost:3000/api/bookings/BOOKING_UUID/cancel \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "cancelled",
  "message": "Booking cancelled successfully"
}
```

---

## Error Handling Validation

### Test Error Scenarios

#### 1. Invalid JWT Token
```bash
curl -X GET http://localhost:3000/api/services \
  -H "Authorization: Bearer invalid.token.here"
```

**Expected Response (401 UNAUTHORIZED):**
```json
{
  "error": "Invalid or expired token",
  "message": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

---

#### 2. Missing Authorization
```bash
curl -X GET http://localhost:3000/api/users/USER_UUID
```

**Expected Response (401 UNAUTHORIZED):**
```json
{
  "error": "Authorization required",
  "message": "Provide a valid JWT token",
  "code": "MISSING_AUTH"
}
```

---

#### 3. Insufficient Permissions
```bash
# Try to update someone else's profile
curl -X PATCH http://localhost:3000/api/users/OTHER_USER_UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DIFFERENT_USER_TOKEN" \
  -d '{"full_name": "Hacked"}'
```

**Expected Response (403 FORBIDDEN):**
```json
{
  "error": "Insufficient permissions",
  "message": "You don't have permission to access this resource",
  "code": "FORBIDDEN"
}
```

---

#### 4. Resource Not Found
```bash
curl -X GET http://localhost:3000/api/services/nonexistent-uuid \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (404 NOT FOUND):**
```json
{
  "error": "Service not found",
  "code": "NOT_FOUND"
}
```

---

#### 5. Validation Error
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "short"
  }'
```

**Expected Response (422 UNPROCESSABLE ENTITY):**
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ],
  "code": "VALIDATION_ERROR"
}
```

---

## Frontend Error Handling Test (TanStack Query Integration)

### What to verify in UI:

1. **Toast Notifications**
   - Register with invalid email → toast appears with error message
   - Create booking without auth → toast shows "Unauthorized"
   - Submit form with validation errors → toast shows "Validation failed"

2. **Error Storage (Zustand)**
   - Open browser DevTools Console
   - After error: `useAppStore().lastError` contains error message
   - `useAppStore().errorTimestamp` contains when error occurred

3. **Retry Behavior**
   - Network error → user can see clear message
   - Timeout error → shows "Request timed out"
   - Server error (500) → shows "Server error, please try again later"

4. **No Breaking Changes**
   - All success responses work as before
   - No API response format changes
   - Backward compatible with existing UI

---

## Contract Test Examples (Vitest)

See `backend/src/test/` for full test suite patterns:

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../app";

describe("Auth Module", () => {
  let accessToken: string;

  it("should register a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "test@example.com",
        password: "TestPassword123!",
        full_name: "Test User",
      });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("test@example.com");
    expect(res.body.tokens.accessToken).toBeDefined();
    accessToken = res.body.tokens.accessToken;
  });

  it("should login user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "TestPassword123!",
      });

    expect(res.status).toBe(200);
    expect(res.body.tokens.accessToken).toBeDefined();
  });

  it("should get current user", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("test@example.com");
  });

  it("should reject invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token");

    expect(res.status).toBe(401);
  });
});
```

---

## Performance Notes

- **Query Pagination**: All list endpoints default to limit=10, max=100
- **Search**: Indexed on name/description, case-insensitive
- **Caching**: Service listings cached for 5 minutes (Redis)
- **Connection Pooling**: Max 20 concurrent DB connections
- **Rate Limiting**: 100 requests/minute per IP on public endpoints

---

## Next Steps

1. ✅ Apply migrations: `npm run db:migrate`
2. ✅ Start backend: `npm run dev`
3. ✅ Start frontend: `npm run dev`
4. 📋 Run contract tests: `npm run test`
5. 🧪 Manual API testing using curl commands above
6. 🎨 UI error handling verification in browser
7. 📊 Load testing (Phase 2)

