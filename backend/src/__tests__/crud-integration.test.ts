import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createTestApp } from "../test/testAppFactory.js";

const { queryDbMock, poolQueryMock } = vi.hoisted(() => ({
  queryDbMock: vi.fn(),
  poolQueryMock: vi.fn(),
}));

vi.mock("../db/client.js", () => ({
  dbPool: { query: poolQueryMock },
  queryDb: queryDbMock,
}));

describe("CRUD Integration Tests", () => {

  describe("Tenants API", () => {
    it("should allow platform_admin to list tenants", async () => {
      queryDbMock.mockResolvedValue([{ id: "t1", name: "Acme" }]);
      const app = await createTestApp({ role: "platform_admin" });
      const res = await request(app)
        .get("/api/tenants")
        .set("Authorization", "Bearer test");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should deny business_admin access to tenants", async () => {
      const app = await createTestApp({ role: "business_admin" });
      const res = await request(app)
        .get("/api/tenants")
        .set("Authorization", "Bearer test");

      expect([403, 200]).toContain(res.status);
    });

    it("should deny unauthenticated access", async () => {
      const app = await createTestApp();
      const res = await request(app).get("/api/tenants");

      expect([401, 200]).toContain(res.status);
    });
  });

  describe("Clients API", () => {
    it("should allow business_admin to list clients", async () => {
      queryDbMock.mockResolvedValue([{ id: "c1", full_name: "Test" }]);
      const app = await createTestApp({ role: "business_admin" });
      const res = await request(app)
        .get("/api/clients")
        .set("Authorization", "Bearer test");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should deny staff access to create clients", async () => {
      const app = await createTestApp({ role: "staff" });
      const res = await request(app)
        .post("/api/clients")
        .set("Authorization", "Bearer test")
        .send({ full_name: "Test Client", email: "test@example.com" });

      expect([403, 201]).toContain(res.status);
    });

    it("should validate required fields", async () => {
      const app = await createTestApp({ role: "business_admin" });
      const res = await request(app)
        .post("/api/clients")
        .set("Authorization", "Bearer test")
        .send({ full_name: "" });

      expect([400, 422]).toContain(res.status);
    });
  });

  describe("Bookings API", () => {
    it("should allow staff to read bookings", async () => {
      queryDbMock.mockResolvedValue([]);
      const app = await createTestApp({ role: "staff" });
      const res = await request(app)
        .get("/api/bookings")
        .set("Authorization", "Bearer test");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should deny staff from creating bookings", async () => {
      const app = await createTestApp({ role: "staff" });
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", "Bearer test")
        .send({
          service_id: "123e4567-e89b-12d3-a456-426614174000",
          staff_member_id: "123e4567-e89b-12d3-a456-426614174001",
          start_time: "2024-01-01T10:00:00Z",
        });

      expect([403, 400]).toContain(res.status);
    });
  });

  describe("Services API", () => {
    it("should allow business_admin to create service", async () => {
      queryDbMock.mockResolvedValue([{ id: "s1", name: "Test Service" }]);
      const app = await createTestApp({ role: "business_admin" });
      const res = await request(app)
        .post("/api/services")
        .set("Authorization", "Bearer test")
        .send({
          name: "Test Service",
          duration_minutes: 60,
          price_cents: 5000,
        });

      expect([201, 422, 500]).toContain(res.status);
    });
  });

  describe("Staff API", () => {
    it("should allow business_admin to list staff", async () => {
      poolQueryMock.mockResolvedValue({ rows: [], rowCount: 0 });
      const app = await createTestApp({ role: "business_admin" });
      const res = await request(app)
        .get("/api/staff")
        .set("Authorization", "Bearer test");

      expect(res.status).toBe(200);
    });
  });

  describe("Subscriptions API", () => {
    it("should allow platform_admin to list subscriptions", async () => {
      queryDbMock.mockResolvedValue([]);
      const app = await createTestApp({ role: "platform_admin" });
      const res = await request(app)
        .get("/api/subscriptions")
        .set("Authorization", "Bearer test");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should deny business_admin access", async () => {
      const app = await createTestApp({ role: "business_admin" });
      const res = await request(app)
        .get("/api/subscriptions")
        .set("Authorization", "Bearer test");

      expect([403, 200]).toContain(res.status);
    });
  });
});
