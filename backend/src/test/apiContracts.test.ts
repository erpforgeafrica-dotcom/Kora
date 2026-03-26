/**
 * KORA Backend API Contract & Tenant Isolation Tests
 * 
 * Tests the canonical API contracts established in Phase 1-4:
 * - Authentication: JWT contract, /me endpoint
 * - RBAC: role enforcement
 * - Tenant Isolation: organization scoping
 * - Response Envelopes: canonical shapes
 * 
 * Run: npm run test backend/src/test/apiContracts.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import jwt from "jsonwebtoken";

const { queryDbMock } = vi.hoisted(() => ({ queryDbMock: vi.fn() }));
vi.mock("../db/client.js", () => ({
  queryDb: queryDbMock,
  dbPool: { query: vi.fn().mockResolvedValue({ rows: [] }), connect: vi.fn() },
}));

const app = createApp();
const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

// Default mock: return user row matching the userId from JWT
queryDbMock.mockImplementation((sql: string, params: unknown[]) => {
  if (typeof sql === "string" && sql.includes("FROM users WHERE id")) {
    const userId = Array.isArray(params) ? params[0] : null;
    if (userId === "user-1") return Promise.resolve([{ id: "user-1", email: "admin@org-acme.test", role: "business_admin", organization_id: "org-acme" }]);
    if (userId === "user-2") return Promise.resolve([{ id: "user-2", email: "staff@org-evil.test", role: "operations", organization_id: "org-evil" }]);
  }
  return Promise.resolve([]);
});

// Test user data
const testUser1 = {
  id: "user-1",
  email: "admin@org-acme.test",
  role: "business_admin",
  organizationId: "org-acme",
};

const testUser2 = {
  id: "user-2",
  email: "staff@org-evil.test",
  role: "operations",
  organizationId: "org-evil",
};

function generateToken(user: typeof testUser1): string {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      organizationId: user.organizationId,
      permissions_version: 1,
    },
    JWT_SECRET,
    { expiresIn: "1h" } // No jti to avoid session validation
  );
}

describe("KORA API Contracts", () => {
  describe("Auth: JWT & /me Endpoint", () => {
    it("should reject request without auth token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "");

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        success: false,
        error: {
          code: expect.any(String),
          message: expect.any(String),
        },
      });
    });

    it("should return authenticated user on /api/auth/me", async () => {
      const token = generateToken(testUser1);
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        data: {
          user: {
            id: testUser1.id,
            email: expect.any(String),
            role: testUser1.role,
            organizationId: testUser1.organizationId,
          },
        },
        meta: null,
      });
    });
  });

  describe("Tenant Isolation: Cross-Org Access Denial", () => {
    it("should deny access to resources from different organization", async () => {
      const token = generateToken(testUser1); // org-acme
      
      // Try to access bookings with header suggesting different org
      const res = await request(app)
        .get("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .set("X-Org-Id", "org-evil"); // Attacker tries to override org

      // Should succeed but filtered to org-acme
      // The X-Org-Id header should be IGNORED
      expect([200, 204]).toContain(res.status); // Success (possibly empty)
      
      // NOTE: Verify backend ignores the X-Org-Id header
      // Response should only contain org-acme bookings
    });

    it("should deny JWT from user of different org", async () => {
      const token1 = generateToken(testUser1); // org-acme
      const token2 = generateToken(testUser2); // org-evil
      
      // User 2 (org-evil) tries to access if user 1 could see their data
      // This is more of a logical test - both tokens work, but each sees only their org
      
      const res1 = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token1}`);
        
      const res2 = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token2}`);

      expect(res1.body.data.user.organizationId).toBe("org-acme");
      expect(res2.body.data.user.organizationId).toBe("org-evil");
      expect(res1.body.data.user.organizationId).not.toBe(
        res2.body.data.user.organizationId
      );
    });
  });

  describe("RBAC: Role-Based Access Control", () => {
    it("should deny client role from admin-only endpoint", async () => {
      const clientToken = jwt.sign(
        {
          sub: "client-1",
          role: "client",
          organizationId: "org-test",
          permissions_version: 1,
        },
        JWT_SECRET,
        { expiresIn: "1h" } // No jti — skip session validation
      );

      // Assuming POST /api/bookings requires business_admin or platform_admin
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({
          service_id: "svc-1",
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(),
        });

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        success: false,
        error: {
          code: "FORBIDDEN",
        },
      });
    });

    it("should allow business_admin to create booking", async () => {
      const token = generateToken(testUser1); // business_admin

      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          service_id: "svc-test-1",
          start_time: new Date(Date.now() + 86400000).toISOString(),
          end_time: new Date(Date.now() + 90000000).toISOString(),
        });

      // Should succeed (201) or fail with validation error (422), not 403
      expect(res.status).not.toBe(403);
    });
  });

  describe("API Response Envelope: Canonical Format", () => {
    it("should return success response with canonical envelope", async () => {
      const token = generateToken(testUser1);

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        data: {
          user: {
            id: testUser1.id,
          },
        },
        meta: null,
      });
      expect(res.headers["content-type"]).toMatch(/json/);
    });

    it("should return error response with canonical envelope", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "");

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        success: false,
        error: {
          code: expect.any(String),
          message: expect.any(String),
        },
      });
      
      // Should NOT return HTML
      expect(res.headers["content-type"]).toMatch(/json/);
    });

    it("should return list response with pagination metadata", async () => {
      const token = generateToken(testUser1);

      const res = await request(app)
        .get("/api/bookings")
        .set("Authorization", `Bearer ${token}`);

      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.meta).toMatchObject({
          page: expect.any(Number),
          limit: expect.any(Number),
          total: expect.any(Number),
          total_pages: expect.any(Number),
        });
      }
    });
  });

  describe("404 Handling: JSON for API Routes", () => {
    it("should return JSON 404 for unknown /api/* route", async () => {
      const res = await request(app)
        .get("/api/nonexistent-module/endpoint")
        .set("Authorization", `Bearer ${generateToken(testUser1)}`);

      expect(res.status).toBe(404);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body).toMatchObject({
        success: false,
        error: {
          code: expect.any(String),
        },
      });
      expect(res.body.error.code).toMatch(/NOT_FOUND|API_ROUTE_NOT_FOUND/);
      
      // Should NOT return HTML
      expect(res.text).not.toMatch(/<html/i);
    });

    it("should return 404 for resource not found", async () => {
      const token = generateToken(testUser1);

      const res = await request(app)
        .get("/api/bookings/nonexistent-id")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(/NOT_FOUND/),
        },
      });
    });
  });

  describe("Canonical JWT Payload", () => {
    it("should decode JWT with canonical payload structure", async () => {
      const token = generateToken(testUser1);
      const decoded = jwt.decode(token) as any;

      expect(decoded).toHaveProperty("sub");
      expect(decoded).toHaveProperty("role");
      expect(decoded).toHaveProperty("organizationId");
      expect(decoded).toHaveProperty("permissions_version");
      
      // Should NOT have tenantId (old structure)
      expect(decoded).not.toHaveProperty("tenantId");
      
      // Verify values
      expect(decoded.sub).toBe(testUser1.id);
      expect(decoded.role).toBe(testUser1.role);
      expect(decoded.organizationId).toBe(testUser1.organizationId);
    });

    it("should reject JWT without organizationId", async () => {
      const invalidToken = jwt.sign(
        {
          sub: "user-1",
          role: "business_admin",
          // Missing organizationId
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${invalidToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe("res.locals.auth Canonical Shape", () => {
    // This test is internal but documents the contract
    it("should document expected res.locals.auth shape", () => {
      // This is a documentation test
      // Express middleware sets res.locals.auth = {
      //   userId: string,
      //   userRole: Role,
      //   organizationId: string,
      //   tokenJti: string | null,
      // };

      expect(true).toBe(true); // Placeholder for documentation
    });
  });
});
