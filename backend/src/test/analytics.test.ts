import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestApp } from "./testAppFactory.js";

const { queryDbMock, getCachedJsonMock, setCachedJsonMock, getTenantByIdMock, executeTaskMock, authMockFactory } = vi.hoisted(() => ({
  queryDbMock: vi.fn(),
  getCachedJsonMock: vi.fn(),
  setCachedJsonMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  executeTaskMock: vi.fn(),
  authMockFactory: async (importOriginal: any) => {
    const actual = await importOriginal();
    return { ...actual, requireAuth: (req: any, res: any, next: any) => { req.user = { id: "test-user", role: "platform_admin", organization_id: "org-001" }; res.locals.auth = { userId: "test-user", userRole: "platform_admin", organizationId: "org-001", sessionId: null, tokenJti: null }; next(); }, optionalAuth: (_r: any, _s: any, next: any) => next() };
  },
}));

vi.mock("../db/client.js", () => ({ queryDb: queryDbMock }));
vi.mock("../shared/cache.js", () => ({
  getCachedJson: getCachedJsonMock,
  setCachedJson: setCachedJsonMock,
  deleteCachedPrefix: vi.fn(),
}));
vi.mock("../db/repositories/tenantRepository.js", () => ({
  getTenantById: getTenantByIdMock,
}));
vi.mock("../services/aiClient.js", () => ({
  AIClientFactory: {
    createClient: vi.fn(async () => ({ executeTask: executeTaskMock })),
  },
}));
vi.mock("../middleware/auth.js", authMockFactory);

describe("GET /api/analytics/business-summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCachedJsonMock.mockResolvedValue(null);
    getTenantByIdMock.mockResolvedValue({ id: "org-001", name: "Test Org" });
  });

  it("returns full business summary with numeric fields", async () => {
    queryDbMock
      .mockResolvedValueOnce([{ today: "1000", this_week: "5000", this_month: "12000", last_month: "10000" }])
      .mockResolvedValueOnce([{ today_total: "8", no_show_rate_pct: "12.5", cancellation_rate_pct: "5", avg_booking_value: "3200" }])
      .mockResolvedValueOnce([{ utilisation_rate_pct: "81.5", top_performer_id: "s1", understaffed_slots: "2" }])
      .mockResolvedValueOnce([{ active_count: "50", at_churn_risk: "4", new_this_month: "12", avg_lifetime_value: "9500" }])
      .mockResolvedValueOnce([{ id: "a1", source_module: "finance", title: "Review overdue", context: "4 overdue", severity: "high", sla_risk: "0.9" }]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/analytics/business-summary")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.revenue.today).toBe("number");
    expect(typeof res.body.data.revenue.vs_last_month_pct).toBe("number");
    expect(typeof res.body.data.bookings.no_show_rate_pct).toBe("number");
    expect(typeof res.body.data.staff.utilisation_rate_pct).toBe("number");
    expect(typeof res.body.data.clients.active_count).toBe("number");
    expect(Array.isArray(res.body.data.ai_alerts)).toBe(true);
    expect(res.body.data.ai_alerts[0]).toMatchObject({ id: "a1", severity: "high", sourceModule: "finance" });
  });

  it("returns empty ai_alerts array when no candidates", async () => {
    queryDbMock
      .mockResolvedValueOnce([{ today: "0", this_week: "0", this_month: "0", last_month: "0" }])
      .mockResolvedValueOnce([{ today_total: "0", no_show_rate_pct: "0", cancellation_rate_pct: "0", avg_booking_value: "0" }])
      .mockResolvedValueOnce([{ utilisation_rate_pct: "0", top_performer_id: null, understaffed_slots: "0" }])
      .mockResolvedValueOnce([{ active_count: "0", at_churn_risk: "0", new_this_month: "0", avg_lifetime_value: "0" }])
      .mockResolvedValueOnce([]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/analytics/business-summary")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ai_alerts).toEqual([]);
  });

  it("calculates vs_last_month_pct as 100 when last_month is 0", async () => {
    queryDbMock
      .mockResolvedValueOnce([{ today: "500", this_week: "2000", this_month: "5000", last_month: "0" }])
      .mockResolvedValueOnce([{ today_total: "0", no_show_rate_pct: "0", cancellation_rate_pct: "0", avg_booking_value: "0" }])
      .mockResolvedValueOnce([{ utilisation_rate_pct: "0", top_performer_id: null, understaffed_slots: "0" }])
      .mockResolvedValueOnce([{ active_count: "0", at_churn_risk: "0", new_this_month: "0", avg_lifetime_value: "0" }])
      .mockResolvedValueOnce([]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/analytics/business-summary")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.revenue.vs_last_month_pct).toBe(100);
  });
});

describe("GET /api/analytics/staff-performance/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTenantByIdMock.mockResolvedValue({ id: "org-001", name: "Test Org" });
  });

  it("returns staff performance metrics", async () => {
    queryDbMock
      .mockResolvedValueOnce([{
        bookings_completed: "24",
        avg_session_rating: "4.8",
        revenue_generated: "120000",
        no_show_contribution_pct: "2",
        client_retention_rate: "91.5",
      }])
      .mockResolvedValueOnce([{ name: "Deep Tissue" }, { name: "Swedish" }])
      .mockResolvedValueOnce([{ availability: { mon: "9-17" } }]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/analytics/staff-performance/s1")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.bookings_completed).toBe("number");
    expect(typeof res.body.data.avg_session_rating).toBe("number");
    expect(Array.isArray(res.body.data.top_services)).toBe(true);
  });

  it("returns 404 when staff not found", async () => {
    queryDbMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/analytics/staff-performance/nonexistent")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("STAFF_NOT_FOUND");
  });
});

describe("POST /api/analytics/churn-prediction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCachedJsonMock.mockResolvedValue(null);
    setCachedJsonMock.mockResolvedValue(undefined);
    getTenantByIdMock.mockResolvedValue({ id: "org-001", name: "Test Org" });
    executeTaskMock.mockRejectedValue(new Error("AI unavailable")); // fallback path
  });

  it("returns at_risk_clients array using heuristic fallback", async () => {
    queryDbMock.mockResolvedValueOnce([
      { id: "c1", name: "Jane Doe", days_since_visit: "50", visit_count: "3", outstanding_balance_cents: "0", risk_score: null },
      { id: "c2", name: "John Smith", days_since_visit: "20", visit_count: "10", outstanding_balance_cents: "5000", risk_score: "30" },
    ]);

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/analytics/churn-prediction")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({ lookback_days: 60 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // c1 has 50 days since visit → predicted_churn_pct >= 72 → included
    const c1 = res.body.data.find((c: { id: string }) => c.id === "c1");
    expect(c1).toBeDefined();
    expect(c1.predicted_churn_pct).toBeGreaterThanOrEqual(50);
  });

  it("returns cached result on second call", async () => {
    const cached = { at_risk_clients: [{ id: "c-cached", predicted_churn_pct: 80 }] };
    getCachedJsonMock.mockResolvedValue(cached);

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/analytics/churn-prediction")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-001")
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].id).toBe("c-cached");
    expect(queryDbMock).not.toHaveBeenCalled();
  });
});
