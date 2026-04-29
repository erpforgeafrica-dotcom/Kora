# Architecture Consolidation: Final 5 Recommendations

---

## 7. CENTRAL ROUTE REGISTRY (Routes & Navigation)

**Problem**: Frontend routes and API paths scattered across page components; easy to create dead routes.

**Solution**: Central registry mapping UI routes to API endpoints.

### Implementation

```typescript
// frontend/src/config/routeRegistry.ts
export const ROUTES = {
  // Authentication
  login: "/login",
  register: "/register",
  logout: "/logout",
  
  // Bookings Dashboard
  bookings: "/dashboard/bookings",
  bookingDetail: (id: string) => `/dashboard/bookings/${id}`,
  bookingCreate: "/dashboard/bookings/create",
  bookingEdit: (id: string) => `/dashboard/bookings/${id}/edit`,
  
  // Appointments Dashboard
  appointments: "/dashboard/appointments",
  appointmentDetail: (id: string) => `/dashboard/appointments/${id}`,
  appointmentCreate: "/dashboard/appointments/create",
  
  // ... more routes
} as const;

export const API_ENDPOINTS = {
  // Bookings
  bookings: {
    list: "/api/bookings",
    get: (id: string) => `/api/bookings/${id}`,
    create: "/api/bookings",
    update: (id: string) => `/api/bookings/${id}`,
    delete: (id: string) => `/api/bookings/${id}`,
    getTimeslots: (date: string) => `/api/bookings/slots?date=${date}`,
  },
  
  // Appointments
  appointments: {
    list: "/api/appointments",
    get: (id: string) => `/api/appointments/${id}`,
    create: "/api/appointments",
    reschedule: (id: string) => `/api/appointments/${id}/reschedule`,
  },
  
  // Payments
  payments: {
    list: "/api/payments",
    process: "/api/payments/process",
    refund: (id: string) => `/api/payments/${id}/refund`,
  },
} as const;

// Usage in components
import { ROUTES, API_ENDPOINTS } from "../config/routeRegistry";

export function BookingsList() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  
  useEffect(() => {
    // API call using central endpoint
    fetch(API_ENDPOINTS.bookings.list).then(r => r.json()).then(setBookings);
  }, []);
  
  return (
    <div>
      {bookings.map(b => (
        <button onClick={() => navigate(ROUTES.bookingDetail(b.id))}>
          View Booking
        </button>
      ))}
      <button onClick={() => navigate(ROUTES.bookingCreate)}>Create</button>
    </div>
  );
}
```

**Benefits**:
- Single source of truth for all routes
- Easy refactoring (change route in one place)
- Type-safe route generation
- No dead routes
- Easy to document all available routes

---

## 8. MONOLITHIC FILES SPLITTING

### Problem: frontend/src/services/api.ts

**Before**: 350+ lines mixing HTTP client, interceptors, CSRF logic, type definitions

**After**: Split by domain

```
frontend/src/services/
├── api/
│   ├── client.ts         # Axios instance, interceptors, error handling
│   ├── bookings.ts       # Booking API calls
│   ├── appointments.ts   # Appointment API calls
│   ├── payments.ts       # Payment API calls
│   ├── notifications.ts  # Notification API calls
│   ├── reporting.ts      # Reporting API calls
│   └── index.ts          # Export all
├── csrf.ts              # CSRF token management
├── auth.ts              # Auth-related API calls
└── index.ts             # Main export
```

### Example: Split Structure

```typescript
// services/api/client.ts
import axios from "axios";
import { getCsrfToken, refreshCsrfToken } from "../csrf.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Interceptor: Add CSRF token
apiClient.interceptors.request.use(async (config) => {
  if (!["get", "head", "options"].includes(config.method?.toLowerCase() ?? "")) {
    const token = await getCsrfToken();
    config.headers["X-CSRF-Token"] = token;
  }
  return config;
});

// Interceptor: Error handling
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    // Centralized error handling
    if (err.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default apiClient;

// services/api/bookings.ts
import apiClient from "./client.js";
import type { Booking, CreateBookingRequest } from "../types/bookings.js";

export const bookingsAPI = {
  list: async (filters?: Record<string, unknown>) => {
    const { data } = await apiClient.get<Booking[]>("/bookings", { params: filters });
    return data;
  },

  get: async (id: string) => {
    const { data } = await apiClient.get<Booking>(`/bookings/${id}`);
    return data;
  },

  create: async (payload: CreateBookingRequest) => {
    const { data } = await apiClient.post<Booking>("/bookings", payload);
    return data;
  },

  update: async (id: string, payload: Partial<CreateBookingRequest>) => {
    const { data } = await apiClient.patch<Booking>(`/bookings/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/bookings/${id}`);
  },
};

// services/api/index.ts
export { bookingsAPI } from "./bookings.js";
export { appointmentsAPI } from "./appointments.js";
export { paymentsAPI } from "./payments.js";
export { notificationsAPI } from "./notifications.js";
export { reportingAPI } from "./reporting.js";
export { apiClient } from "./client.js";
```

### Backend: Platform Routes Splitting

**Before**: `backend/src/modules/platform/routes.ts` (400+ lines)
- Analytics endpoints
- Feature flags
- User management  
- Settings
- Health checks

**After**: Split into separate modules

```
backend/src/modules/
├── analytics/         (NEW)
│   ├── routes.ts
│   ├── service.ts
│   └── handler.ts
├── features/          (NEW - feature flags)
│   ├── routes.ts
│   └── service.ts
├── settings/          (NEW)
│   ├── routes.ts
│   └── service.ts
└── platform/          (Remains for core health/status)
    ├── routes.ts      (SIMPLIFIED - only /health, /status)
    └── service.ts
```

---

## 9. CENTRAL ORG-SCOPE HELPERS (Enforcement Layer)

**Current**: Org scoping mostly middleware-driven, inconsistently enforced

**Target**: Central tenant-scope helper enforced at repository/service level

### Implementation

```typescript
// shared/tenantContext.ts
export interface TenantContext {
  organizationId: string;
  userId: string;
  userRole: Role;
  ipAddress?: string;
}

/**
 * Extract tenant context from Express response locals
 * Ensures org scoping is always available
 */
export function getTenantContext(res: Response): TenantContext {
  const auth = res.locals.auth;
  if (!auth?.organizationId || !auth?.userId) {
    throw new Error("Tenant context not available - auth middleware must run first");
  }

  return {
    organizationId: auth.organizationId,
    userId: auth.userId,
    userRole: auth.userRole,
    ipAddress: res.req?.ip,
  };
}

/**
 * Verify that a resource belongs to the tenant
 */
export async function verifyResourceOwnership(
  resourceId: string,
  organizationId: string,
  resourceTable: string
): Promise<boolean> {
  const result = await queryDb(
    `SELECT id FROM ${resourceTable} WHERE id = $1 AND organization_id = $2`,
    [resourceId, organizationId]
  );
  return result.rows.length > 0;
}

/**
 * Cross-org access prevention (audit)
 */
export function logTenantViolation(
  context: TenantContext,
  attemptedOrgId: string,
  resource: string
): void {
  logger.warn("Cross-org access attempt detected", {
    userId: context.userId,
    authorizedOrg: context.organizationId,
    attemptedOrg: attemptedOrgId,
    resource,
    ip: context.ipAddress,
  });
  
  // Could trigger alerts/blocking on repeated attempts
}

// Usage in routes
bookingRoutes.get("/:id", async (req, res, next) => {
  try {
    const tenant = getTenantContext(res);
    const bookingId = req.params.id;
    
    // Repository automatically enforces org scoping
    const booking = await bookingRepository.findById(bookingId, tenant.organizationId);
    
    if (!booking) {
      return respondError(res, "NOT_FOUND", "Booking not found", 404);
    }
    
    respondSuccess(res, booking);
  } catch (err) { next(err); }
});

// Services receive tenant context
export async function updateBooking(
  tenant: TenantContext,
  bookingId: string,
  updates: UpdateBookingInput
): Promise<Booking> {
  // Service is tenant-aware
  const booking = await bookingRepository.update(
    bookingId,
    tenant.organizationId,
    updates
  );
  
  if (!booking) {
    throw new NotFoundError("Booking not found");
  }
  
  logger.info("Booking updated", {
    bookingId,
    organizationId: tenant.organizationId,
    userId: tenant.userId,
  });
  
  return booking;
}
```

---

## 10. E2E AUTH/RBAC SMOKE TESTS

**Problem**: Regression coverage depends on mocked auth; dashboard isolation isn't tested with real middleware

**Solution**: Add E2E tests with real middleware, real database, real auth

### Implementation

```typescript
// test/e2e/auth.rbac.spec.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { createApp } from "../../src/app.js";
import { createSession, generateSessionSignature } from "../../src/services/sessionService.js";
import type { Role } from "../../src/middleware/auth.js";

describe("E2E: Auth & RBAC with Real Middleware", () => {
  let app: any;
  let request: any;
  let testOrgId: string;
  let sessionCookie: string;

  beforeAll(() => {
    app = createApp();
    request = supertest(app);
    testOrgId = "org-test-" + Date.now();
  });

  async function authenticateAs(role: Role) {
    const { sessionId, sessionSignature } = await createSession(
      "user-" + Date.now(),
      testOrgId,
      role
    );

    return {
      sessionId,
      sessionSignature,
      cookie: `session_id=${sessionId}; session_sig=${sessionSignature}`,
    };
  }

  describe("Dashboard Isolation", () => {
    it("business_admin can access bookings dashboard", async () => {
      const auth = await authenticateAs("business_admin");
      
      const res = await request
        .get("/api/bookings")
        .set("Cookie", auth.cookie)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it("client cannot access admin-only endpoints", async () => {
      const auth = await authenticateAs("client");
      
      await request
        .post("/api/bookings/define-rules")
        .set("Cookie", auth.cookie)
        .send({ rules: [] })
        .expect(403);
    });

    it("prevents cross-org data access", async () => {
      const auth1 = await authenticateAs("business_admin");
      const auth2 = await authenticateAs("business_admin");

      // Create resource as org1
      const booking1 = await request
        .post("/api/bookings")
        .set("Cookie", auth1.cookie)
        .send({
          clientId: "client-1",
          date: "2026-04-30",
          slotId: "slot-1",
        })
        .expect(201);

      // Try to access from org2 (different session, different org)
      await request
        .get(`/api/bookings/${booking1.body.id}`)
        .set("Cookie", auth2.cookie)
        .expect(404);
    });

    it("expires idle sessions", async () => {
      const auth = await authenticateAs("business_admin");
      
      // Manipulate session TTL for testing
      // (set to 1 second in test env)
      await new Promise(r => setTimeout(r, 1100));

      await request
        .get("/api/bookings")
        .set("Cookie", auth.cookie)
        .expect(401);
    });
  });

  describe("CSRF Protection", () => {
    it("rejects requests without CSRF token", async () => {
      const auth = await authenticateAs("business_admin");
      
      await request
        .post("/api/bookings")
        .set("Cookie", auth.cookie)
        .send({
          clientId: "client-1",
          date: "2026-04-30",
          slotId: "slot-1",
        })
        .expect(403);
    });

    it("accepts POST with valid CSRF token", async () => {
      const auth = await authenticateAs("business_admin");
      
      // Get CSRF token
      const csrfRes = await request
        .get("/api/csrf")
        .set("Cookie", auth.cookie)
        .expect(200);

      const csrfToken = csrfRes.body.token;

      // POST with token
      await request
        .post("/api/bookings")
        .set("Cookie", auth.cookie)
        .set("X-CSRF-Token", csrfToken)
        .send({
          clientId: "client-1",
          date: "2026-04-30",
          slotId: "slot-1",
        })
        .expect(201);
    });
  });

  describe("Multi-Org Isolation", () => {
    it("users can only see their org's data", async () => {
      const org1Auth = await authenticateAs("business_admin");
      const org2Auth = await authenticateAs("business_admin");

      // org1 creates booking
      const booking = await request
        .post("/api/bookings")
        .set("Cookie", org1Auth.cookie)
        .set("X-CSRF-Token", "token")
        .send({ /* ... */ })
        .expect(201);

      // org2 tries to list
      const list = await request
        .get("/api/bookings")
        .set("Cookie", org2Auth.cookie)
        .expect(200);

      // Should not see org1's booking
      expect(list.body).not.toContainEqual(
        expect.objectContaining({ id: booking.body.id })
      );
    });
  });
});
```

---

## EXECUTION TIMELINE

### Week 1-2: Complete Critical Fixes
- ✅ Fix org ID fallbacks
- ✅ Migrate CSRF to Redis
- ✅ Auth consolidation strategy + session foundation

### Week 3: Route Validation & Persistence
- [ ] Zod validation schemas (core modules)
- [ ] Repository migration (high-priority modules)
- [ ] Org-scope helpers enforcement

### Week 4: Architecture Cleanup
- [ ] Split monolithic files (api.ts, platform/routes.ts)
- [ ] Central route registry
- [ ] E2E auth/RBAC tests

### Week 5: Rollout & Docs
- [ ] Feature flag for new auth (parallel run)
- [ ] Comprehensive documentation
- [ ] Migration guide for team
- [ ] Deprecation of old auth model

---

## Success Criteria (All 10 Recommendations)

- [ ] **#1**: Org ID only from JWT (100% compliance)
- [ ] **#2**: CSRF Redis-backed (survives restarts, scales horizontally)
- [ ] **#3**: Auth cookie-based (no localStorage tokens)
- [ ] **#4**: One auth strategy documented (Zod contracts)
- [ ] **#5**: All routes have Zod validation (70+ routes)
- [ ] **#6**: Raw SQL moved to repositories (0 SQL in routes)
- [ ] **#7**: Central route registry (UI + API in one place)
- [ ] **#8**: Monolithic files split (api.ts < 100 lines, platform/routes split)
- [ ] **#9**: Org-scope helpers enforced (TenantContext everywhere)
- [ ] **#10**: E2E tests with real middleware (100% dashboard isolation verified)

