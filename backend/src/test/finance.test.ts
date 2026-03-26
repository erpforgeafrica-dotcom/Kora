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

describe("GET /api/finance/kpis", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns finance KPIs with numeric fields", async () => {
    queryDbMock
      .mockResolvedValueOnce([{
        revenue_cents: "500000", pending_cents: "120000",
        paid_count: 40, pending_count: 10, overdue_count: 3, total_count: 53,
      }])
      .mockResolvedValueOnce([{ overdue_cents: "45000" }]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/finance/kpis")
      .set("Authorization", "Bearer test")
;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.revenue_cents).toBe("number");
    expect(typeof res.body.data.collection_rate_pct).toBe("number");
    expect(res.body.data.collection_rate_pct).toBe(81); // 500000 / (500000+120000) * 100 ≈ 80.6 → 81
    expect(res.body.data.overdue_cents).toBe(45000);
  });

  it("returns collection_rate_pct of 0 when no revenue or pending", async () => {
    queryDbMock
      .mockResolvedValueOnce([{ revenue_cents: "0", pending_cents: "0", paid_count: 0, pending_count: 0, overdue_count: 0, total_count: 0 }])
      .mockResolvedValueOnce([{ overdue_cents: "0" }]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/finance/kpis")
      .set("Authorization", "Bearer test")
;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.collection_rate_pct).toBe(0);
  });
});

describe("GET /api/finance/invoices", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns invoices list", async () => {
    queryDbMock.mockResolvedValue([
      { id: "inv-1", amount_cents: 5000, status: "pending", due_date: "2025-06-01", client_name: "Jane Doe" },
    ]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/finance/invoices")
      .set("Authorization", "Bearer test")
;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].id).toBe("inv-1");
    expect(res.body.meta.total).toBe(1);
  });

  it("filters by status query param", async () => {
    queryDbMock.mockResolvedValue([]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/finance/invoices?status=overdue")
      .set("Authorization", "Bearer test")
;

    expect(res.status).toBe(200);
    expect(queryDbMock).toHaveBeenCalledWith(
      expect.stringContaining("i.status = $2"),
      expect.arrayContaining(["overdue"])
    );
  });
});

describe("POST /api/finance/invoices", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates invoice and returns 201", async () => {
    queryDbMock
      .mockResolvedValueOnce([{
        id: "inv-2", organization_id: "org-001", amount_cents: 10000,
        status: "pending", due_date: "2025-07-01", created_at: "2025-01-01T00:00:00Z",
      }])
      .mockResolvedValueOnce([]); // audit log

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/finance/invoices")
      .set("Authorization", "Bearer test")

      .send({ client_id: "c1", amount_cents: 10000, due_date: "2025-07-01" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.amount_cents).toBe(10000);
  });

  it("returns 400 when amount_cents is missing", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post("/api/finance/invoices")
      .set("Authorization", "Bearer test")

      .send({ due_date: "2025-07-01" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_AMOUNT_CENTS_OR_DUE_DATE");
  });

  it("returns 400 for invalid amount_cents", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post("/api/finance/invoices")
      .set("Authorization", "Bearer test")

      .send({ amount_cents: -500, due_date: "2025-07-01" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_AMOUNT_CENTS");
  });

  it("returns 400 for invalid due_date", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post("/api/finance/invoices")
      .set("Authorization", "Bearer test")

      .send({ amount_cents: 5000, due_date: "not-a-date" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_DUE_DATE");
  });
});

describe("PATCH /api/finance/invoices/:id/status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates invoice status and returns updated record", async () => {
    queryDbMock
      .mockResolvedValueOnce([{ id: "inv-1", status: "paid", due_date: "2025-06-01" }])
      .mockResolvedValueOnce([]); // audit log

    const app = await createTestApp();
    const res = await request(app)
      .patch("/api/finance/invoices/inv-1/status")
      .set("Authorization", "Bearer test")

      .send({ status: "paid" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("paid");
  });

  it("returns 400 for invalid status", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .patch("/api/finance/invoices/inv-1/status")
      .set("Authorization", "Bearer test")

      .send({ status: "refunded" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_STATUS");
  });

  it("returns 404 when invoice not found", async () => {
    queryDbMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const app = await createTestApp();
    const res = await request(app)
      .patch("/api/finance/invoices/missing/status")
      .set("Authorization", "Bearer test")

      .send({ status: "paid" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("INVOICE_NOT_FOUND");
  });
});

describe("GET /api/finance/payouts", () => {
  it("returns payouts list", async () => {
    queryDbMock.mockReset();
    queryDbMock.mockResolvedValue([
      { id: "pay-1", staff_name: "Mira", net_amount_cents: 80000, status: "pending" },
    ]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/finance/payouts")
      .set("Authorization", "Bearer test")
;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBe(1);
  });
});

describe("GET /api/finance/tax", () => {
  it("returns tax records list", async () => {
    queryDbMock.mockReset();
    queryDbMock.mockResolvedValue([
      { id: "tax-1", tax_type: "VAT", tax_rate: "0.075", status: "filed" },
    ]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/finance/tax")
      .set("Authorization", "Bearer test")
;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty("id");
  });
});
