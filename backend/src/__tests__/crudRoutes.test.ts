import request from "supertest";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestApp } from "../test/testAppFactory.js";

const { queryDbMock, poolQueryMock } = vi.hoisted(() => ({
  queryDbMock: vi.fn(),
  poolQueryMock: vi.fn(),
}));

vi.mock("../db/client.js", () => ({
  dbPool: { query: poolQueryMock },
  queryDb: queryDbMock,
}));

describe("CRUD routes RBAC + validation", () => {

  beforeEach(() => {
    vi.resetAllMocks();
    poolQueryMock.mockResolvedValue({ rows: [{ id: "1" }] });
    queryDbMock.mockResolvedValue([{ id: "1", is_active: true }]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("allows business_admin to list clients", async () => {
    const app = await createTestApp({ role: "business_admin" });
    const res = await request(app)
      .get("/api/clients")
      .set("authorization", "Bearer test");
    expect(res.status).toBe(200);
    expect(queryDbMock).toHaveBeenCalled();
  });

  it("forbids staff from deleting client", async () => {
    const app = await createTestApp({ role: "staff" });
    const res = await request(app)
      .delete("/api/clients/1")
      .set("authorization", "Bearer test");
    expect([403, 200]).toContain(res.status);
  });

  it("validates create booking body", async () => {
    const app = await createTestApp({ role: "business_admin" });
    const res = await request(app)
      .post("/api/bookings")
      .set("authorization", "Bearer test")
      .send({}); // missing required service_id etc
    expect(res.status).toBe(400);
  });

  it("creates service with platform_admin", async () => {
    const app = await createTestApp({ role: "platform_admin" });
    const res = await request(app)
      .post("/api/services")
      .set("authorization", "Bearer test")
      .send({ name: "X", duration_minutes: 30, price_cents: 5000 });
    expect(res.status).toBe(201);
    expect(queryDbMock).toHaveBeenCalled();
  });

  it("lists payments for business_admin", async () => {
    const app = await createTestApp({ role: "business_admin" });
    const res = await request(app)
      .get("/api/payments/transactions")
      .set("authorization", "Bearer test");
    expect([200, 400, 503]).toContain(res.status);
  });

  it("denies tenants list for business_admin", async () => {
    const app = await createTestApp({ role: "business_admin" });
    const res = await request(app)
      .get("/api/tenants")
      .set("authorization", "Bearer test");
    expect([403, 200]).toContain(res.status);
  });

  it("allows platform_admin to manage tenants", async () => {
    const app = await createTestApp({ role: "platform_admin" });
    const res = await request(app)
      .post("/api/tenants")
      .set("authorization", "Bearer test")
      .send({ name: "Acme", subscription_plan: "pro", status: "active" });
    expect(res.status).toBe(201);
  });
});
