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

describe("GET /api/clinical/patients", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns patients list", async () => {
    queryDbMock.mockResolvedValue([
      { id: "p1", patient_number: "PAT-001", blood_type: "O+", client_name: "Jane Doe", client_email: "jane@example.com" },
    ]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/clinical/patients")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].id).toBe("p1");
    expect(res.body.meta.total).toBe(1);
  });

  it("returns empty list when no patients", async () => {
    queryDbMock.mockResolvedValue([]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/clinical/patients")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta.total).toBe(0);
    expect(res.body.data).toEqual([]);
  });
});

describe("POST /api/clinical/patients", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a patient and returns 201", async () => {
    queryDbMock.mockResolvedValue([{
      id: "p2", organization_id: "org-001", customer_id: "c1",
      patient_number: "PAT-002", blood_type: "A+", allergies: [],
      current_medications: [], conditions: [], insurance_provider: null,
      emergency_contact_name: "Bob", created_at: "2025-01-01T00:00:00Z",
    }]);

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/clinical/patients")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({ customer_id: "c1", blood_type: "A+", emergency_contact_name: "Bob" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe("p2");
    expect(res.body.data.blood_type).toBe("A+");
  });
});

describe("PATCH /api/clinical/patients/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates patient fields and returns updated id", async () => {
    queryDbMock.mockResolvedValue([{ id: "p1" }]);

    const app = await createTestApp();
    const res = await request(app)
      .patch("/api/clinical/patients/p1")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({ blood_type: "B-", allergies: ["penicillin"] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.updated).toBe(true);
    expect(res.body.data.id).toBe("p1");
  });

  it("returns 400 when no fields provided", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .patch("/api/clinical/patients/p1")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("NO_UPDATES_PROVIDED");
  });

  it("returns 404 when patient not found", async () => {
    queryDbMock.mockResolvedValue([]);

    const app = await createTestApp();
    const res = await request(app)
      .patch("/api/clinical/patients/missing")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({ blood_type: "AB+" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PATIENT_NOT_FOUND");
  });
});

describe("GET /api/clinical/appointments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns appointments list", async () => {
    queryDbMock.mockResolvedValue([
      { id: "a1", appointment_type: "consultation", status: "scheduled", patient_name: "Jane Doe" },
    ]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/clinical/appointments")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].id).toBe("a1");
    expect(res.body.meta.total).toBe(1);
  });
});

describe("POST /api/clinical/appointments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates appointment and returns 201", async () => {
    queryDbMock.mockResolvedValue([{
      id: "a2", organization_id: "org-001", patient_id: "p1",
      appointment_type: "follow_up", chief_complaint: "headache",
      status: "scheduled", created_at: "2025-01-01T00:00:00Z",
    }]);

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/clinical/appointments")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({ patient_id: "p1", appointment_type: "follow_up", chief_complaint: "headache" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("scheduled");
  });

  it("returns 400 when patient_id is missing", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post("/api/clinical/appointments")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({ appointment_type: "consultation" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_PATIENT_ID");
  });
});

describe("PATCH /api/clinical/appointments/:id/status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates appointment status", async () => {
    queryDbMock.mockResolvedValue([{ id: "a1", status: "completed" }]);

    const app = await createTestApp();
    const res = await request(app)
      .patch("/api/clinical/appointments/a1/status")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({ status: "completed" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("completed");
  });

  it("returns 400 for invalid status", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .patch("/api/clinical/appointments/a1/status")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({ status: "unknown_status" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_STATUS");
  });
});

describe("GET /api/clinical/compliance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns compliance counts", async () => {
    queryDbMock
      .mockResolvedValueOnce([{ n: 10 }])
      .mockResolvedValueOnce([{ n: 25 }])
      .mockResolvedValueOnce([{ n: 40 }]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/clinical/compliance")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.patient_count).toBe(10);
    expect(res.body.data.appointment_count).toBe(25);
    expect(res.body.data.note_count).toBe(40);
  });
});
