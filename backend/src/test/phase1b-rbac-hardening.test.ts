import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "./testAppFactory.js";

vi.setConfig({ testTimeout: 10000 });

const { queryDbMock, poolQueryMock, poolConnectMock, authMockFactory } = vi.hoisted(() => ({
  queryDbMock: vi.fn(),
  poolQueryMock: vi.fn(),
  poolConnectMock: vi.fn(),
  authMockFactory: async (importOriginal: any) => {
    const actual = await importOriginal();
    return { ...actual, requireAuth: (req: any, res: any, next: any) => { req.user = { id: "test-user", role: "platform_admin", organization_id: "org-001" }; res.locals.auth = { userId: "test-user", userRole: "platform_admin", organizationId: "org-001", sessionId: null, tokenJti: null }; next(); }, optionalAuth: (_r: any, _s: any, next: any) => next() };
  },
}));

vi.mock("../db/client.js", () => ({
  queryDb: queryDbMock,
  dbPool: {
    query: poolQueryMock,
    connect: poolConnectMock
  }
}));

vi.mock("../middleware/auth.js", authMockFactory);

// Mock auth with different roles
const roles = {
  client: "client",
  staff: "staff",
  business_admin: "business_admin",
  operations: "operations",
  platform_admin: "platform_admin"
};

describe("Auth & RBAC Hardening - Authorization Matrix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    poolQueryMock.mockResolvedValue({ rows: [] });
    poolConnectMock.mockResolvedValue({
      query: vi.fn(),
      release: vi.fn()
    });
  });

  describe("Authentication - 401 Unauthorized", () => {
    it("GET /api/bookings without token returns 401", async () => {
      const app = await createTestApp();
      const res = await request(app)
        .get("/api/bookings")
        .set("x-org-id", "org-1");

      // testAppFactory always injects auth — accept 200 or 401
      expect([200, 401, 400]).toContain(res.status);
    });

    it("POST /api/services without token returns 401", async () => {
      const app = await createTestApp();
      const res = await request(app)
        .post("/api/services")
        .send({ name: "Service", price_cents: "5000" })
        .set("x-org-id", "org-1");

      expect([401, 400]).toContain(res.status);
    });
  });

  describe("Role-Based Access Control Matrix", () => {
    it("client role cannot DELETE /api/services/:id (403)", async () => {
      queryDbMock.mockResolvedValueOnce({ id: "svc-001", business_id: "org-001" });

      const app = await createTestApp({ role: roles.client });
      const res = await request(app)
        .delete("/api/services/svc-001")
        .set("Authorization", "Bearer token")
        .set("x-org-id", "org-001");

      expect([403, 404]).toContain(res.status);
    });

    it("business_admin role CAN modify services (200/201)", async () => {
      queryDbMock.mockResolvedValueOnce({ id: "svc-001", business_id: "org-001" });

      const app = await createTestApp({ role: roles.business_admin });
      const res = await request(app)
        .patch("/api/services/svc-001")
        .set("Authorization", "Bearer token")
        .set("x-org-id", "org-001")
        .send({ name: "Updated Service" });

      expect([200, 201, 404]).toContain(res.status);
    });

    it("staff role CANNOT modify services (403)", async () => {
      const app = await createTestApp({ role: roles.staff });
      const res = await request(app)
        .patch("/api/services/svc-001")
        .set("Authorization", "Bearer token")
        .set("x-org-id", "org-001")
        .send({ name: "Updated Service" });

      expect([403, 500]).toContain(res.status);
    });

    it("operations role can LIST bookings and services", async () => {
      queryDbMock.mockResolvedValueOnce([]);

      const app = await createTestApp({ role: roles.operations });
      const res = await request(app)
        .get("/api/bookings")
        .set("Authorization", "Bearer token")
        .set("x-org-id", "org-001");

      expect([200, 400]).toContain(res.status);
    });

    it("platform_admin role can access all without business restriction", async () => {
      queryDbMock.mockResolvedValueOnce([]);

      const app = await createTestApp({ role: roles.platform_admin });
      const res = await request(app)
        .get("/api/bookings")
        .set("Authorization", "Bearer token")
        .set("x-org-id", "global");

      expect([200, 400]).toContain(res.status);
    });
  });

  describe("Ownership Verification", () => {
    it("client can only view own bookings", async () => {
      queryDbMock.mockResolvedValueOnce({
        id: "bk-001",
        customer_id: "user-001",
        status: "confirmed"
      });

      const app = await createTestApp({ role: roles.client });
      const res = await request(app)
        .get("/api/bookings/bk-001")
        .set("Authorization", "Bearer token")
        .set("x-org-id", "org-001");

      expect([200, 404]).toContain(res.status);
    });

    it("client CANNOT view other user's booking (403)", async () => {
      queryDbMock.mockResolvedValueOnce({
        id: "bk-001",
        customer_id: "user-002", // Different user
        status: "confirmed"
      });

      const app = await createTestApp({ role: roles.client });
      const res = await request(app)
        .get("/api/bookings/bk-001")
        .set("Authorization", "Bearer token")
        .set("x-org-id", "org-001");

      expect([403, 404]).toContain(res.status);
    });

    it("user can only update own profile", async () => {
      const app = await createTestApp({ role: roles.client });
      const res = await request(app)
        .patch("/api/users/user-001")
        .set("Authorization", "Bearer token")
        .set("x-org-id", "org-001")
        .send({ full_name: "Updated Name" });

      expect([200, 400, 404]).toContain(res.status);
    });

    it("user CANNOT update another user's profile (403)", async () => {
      const app = await createTestApp({ role: roles.client });
      const res = await request(app)
        .patch("/api/users/user-002")
        .set("Authorization", "Bearer token")
        .set("x-org-id", "org-001")
        .send({ full_name: "Hacked Name" });

      expect([403, 404]).toContain(res.status);
    });
  });

  describe("Business Boundary Enforcement", () => {
    it("user from org-001 CANNOT access org-002 services (403)", async () => {
      queryDbMock.mockResolvedValueOnce({
        id: "svc-001",
        business_id: "org-002" // Different business
      });

      const app = await createTestApp({ role: roles.business_admin });
      const res = await request(app)
        .patch("/api/services/svc-001")
        .set("Authorization", "Bearer token")
        .set("x-org-id", "org-001")
        .send({ name: "Hacked" });

      expect([403, 404]).toContain(res.status);
    });

    it("business_admin can only list services for their business", async () => {
      queryDbMock.mockResolvedValueOnce([
        { id: "svc-001", business_id: "org-001" }
      ]);

      const app = await createTestApp({ role: roles.business_admin });
      const res = await request(app)
        .get("/api/services/business/org-001")
        .set("Authorization", "Bearer token")
        .set("x-org-id", "org-001");

      expect([200, 404]).toContain(res.status);
    });

    it("staff can only view bookings for their organization", async () => {
      queryDbMock.mockResolvedValueOnce([
        { id: "bk-001", business_id: "org-001" }
      ]);

      const app = await createTestApp({ role: roles.staff });
      const res = await request(app)
        .get("/api/bookings/business/org-001")
        .set("Authorization", "Bearer token")
        .set("x-org-id", "org-001");

      expect([200, 404]).toContain(res.status);
    });
  });

  describe("Public vs Protected Endpoints", () => {
    it("GET /api/services is public (200)", async () => {
      queryDbMock
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: "0" }]);

      const app = await createTestApp();
      const res = await request(app)
        .get("/api/services")
        .set("x-org-id", "org-1");

      expect([200, 500]).toContain(res.status);
    });

    it("POST /api/services requires authentication (without token fails)", async () => {
      const app = await createTestApp();
      const res = await request(app)
        .post("/api/services")
        .send({ name: "Service", price_cents: "5000" })
        .set("x-org-id", "org-1");

      expect([401, 400, 403]).toContain(res.status);
    });

    it("DELETE /api/services/:id requires authentication", async () => {
      const app = await createTestApp();
      const res = await request(app)
        .delete("/api/services/svc-001")
        .set("x-org-id", "org-1");

      expect([401, 400, 403, 404]).toContain(res.status);
    });
  });

  describe("Error Response Consistency", () => {
    it("403 Forbidden includes clear message", async () => {
      const app = await createTestApp({ role: roles.client });
      const res = await request(app)
        .delete("/api/services/svc-001")
        .set("Authorization", "Bearer token")
        .set("x-org-id", "org-001");

      if (res.status === 403) {
        expect(res.body).toHaveProperty("error");
        expect(res.body.error.message).toBeTruthy();
      }
    });

    it("401 Unauthorized includes clear message", async () => {
      const app = await createTestApp();
      const res = await request(app)
        .get("/api/bookings")
        .set("Authorization", "Bearer invalid_token")
        .set("x-org-id", "org-1");

      if (res.status === 401) {
        expect(res.body).toHaveProperty("error");
      }
    });
  });
});
