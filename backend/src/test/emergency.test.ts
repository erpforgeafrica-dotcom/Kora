import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestApp } from "./testAppFactory.js";

const { queryDbMock, authMockFactory } = vi.hoisted(() => ({
  queryDbMock: vi.fn(),
  authMockFactory: async (importOriginal: any) => {
    const actual = await importOriginal();
    return { ...actual, requireAuth: (req: any, res: any, next: any) => { req.user = { id: "test-user", role: "platform_admin", organization_id: "org-001" }; res.locals.auth = { userId: "test-user", userRole: "platform_admin", organizationId: "org-001", sessionId: null, tokenJti: null }; next(); }, optionalAuth: (_r: any, _s: any, next: any) => next() };
  },
}));

vi.mock("../db/client.js", () => ({ queryDb: queryDbMock }));

describe("GET /api/emergency/requests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns emergency requests list ordered by severity", async () => {
    queryDbMock.mockResolvedValue([
      { id: "er1", severity: "critical", status: "open", request_type: "medical" },
      { id: "er2", severity: "high", status: "dispatched", request_type: "fire" },
    ]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/emergency/requests")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].severity).toBe("critical");
    expect(res.body.meta.total).toBe(2);
  });

  it("filters by status query param", async () => {
    queryDbMock.mockResolvedValue([{ id: "er1", status: "open" }]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/emergency/requests?status=open")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1");

    expect(res.status).toBe(200);
    expect(queryDbMock).toHaveBeenCalledWith(
      expect.stringContaining("er.status = $2"),
      expect.arrayContaining(["open"])
    );
  });
});

describe("POST /api/emergency/requests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates emergency request and returns 201", async () => {
    queryDbMock
      .mockResolvedValueOnce([{
        id: "er3", organization_id: "org-001", request_type: "medical",
        severity: "high", status: "open", caller_name: "Alice",
        address: "123 Main St", created_at: "2025-01-01T00:00:00Z",
      }])
      .mockResolvedValueOnce([]); // audit log insert

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/emergency/requests")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1")
      .send({ request_type: "medical", severity: "high", caller_name: "Alice", address: "123 Main St" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("open");
    expect(res.body.data.severity).toBe("high");
  });

  it("returns 400 when request_type is missing", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post("/api/emergency/requests")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1")
      .send({ severity: "high" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_REQUEST_TYPE");
  });

  it("returns 400 for invalid severity", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post("/api/emergency/requests")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({ request_type: "medical", severity: "extreme" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_SEVERITY");
  });
});

describe("PATCH /api/emergency/requests/:id/status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates request status", async () => {
    queryDbMock
      .mockResolvedValueOnce([{ status: "open" }])
      .mockResolvedValueOnce([{ id: "er1", status: "dispatched", resolved_at: null }]);

    const app = await createTestApp();
    const res = await request(app)
      .patch("/api/emergency/requests/er1/status")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({ status: "dispatched" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("dispatched");
  });

  it("returns 400 for invalid status", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .patch("/api/emergency/requests/er1/status")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({ status: "flying" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_STATUS");
  });

  it("returns 404 when request not found", async () => {
    queryDbMock.mockResolvedValue([]);

    const app = await createTestApp();
    const res = await request(app)
      .patch("/api/emergency/requests/missing/status")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({ status: "dispatched" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("REQUEST_NOT_FOUND");
  });

  it("returns 422 for invalid state transition", async () => {
    queryDbMock.mockResolvedValueOnce([{ status: "open" }]);

    const app = await createTestApp();
    const res = await request(app)
      .patch("/api/emergency/requests/er1/status")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({ status: "resolved" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("INVALID_TRANSITION");
    expect(res.body.error.details.allowed).toEqual(["dispatched", "cancelled"]);
  });
});

describe("POST /api/emergency/requests/:id/assign", () => {
  beforeEach(() => vi.clearAllMocks());

  it("assigns dispatch unit and returns dispatched status", async () => {
    queryDbMock
      .mockResolvedValueOnce([{ id: "unit-1" }])           // unit lookup
      .mockResolvedValueOnce([{ id: "er1", status: "dispatched", assigned_unit_id: "unit-1" }]) // update request
      .mockResolvedValueOnce([]);                           // update unit status

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/emergency/requests/er1/assign")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({ unit_id: "unit-1" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("dispatched");
  });

  it("returns 400 when unit_id is missing", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post("/api/emergency/requests/er1/assign")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_UNIT_ID");
  });

  it("returns 404 when dispatch unit not found", async () => {
    queryDbMock.mockResolvedValueOnce([]); // unit not found

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/emergency/requests/er1/assign")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({ unit_id: "bad-unit" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("DISPATCH_UNIT_NOT_FOUND");
  });
});

describe("GET /api/emergency/units", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns dispatch units list", async () => {
    queryDbMock.mockResolvedValue([
      { id: "u1", unit_name: "Alpha-1", unit_type: "ambulance", status: "available" },
    ]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/emergency/units")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].unit_name).toBe("Alpha-1");
    expect(res.body.meta.total).toBe(1);
  });
});

describe("POST /api/emergency/units", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates dispatch unit and returns 201", async () => {
    queryDbMock.mockResolvedValue([{ id: "u2", unit_name: "Bravo-2", unit_type: "fire_truck", status: "available" }]);

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/emergency/units")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({ unit_name: "Bravo-2", unit_type: "fire_truck" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unit_name).toBe("Bravo-2");
    expect(res.body.data.status).toBe("available");
  });

  it("returns 400 when unit_name is missing", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post("/api/emergency/units")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({ unit_type: "ambulance" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_UNIT_NAME");
  });
});

describe("GET /api/emergency/incidents/active", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns active incident summary counts", async () => {
    queryDbMock.mockResolvedValue([{
      active_count: 3, critical_count: 1, high_count: 2, unassigned_count: 1,
    }]);

    const { createApp } = await import("../app.js");
    const res = await request(createApp())
      .get("/api/emergency/incidents/active")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.active_count).toBe(3);
    expect(res.body.data.critical_count).toBe(1);
  });
});
