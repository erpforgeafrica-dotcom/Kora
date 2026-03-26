import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "./testAppFactory.js";

vi.setConfig({ testTimeout: 10000 });

const { queryDbMock, enqueueNotificationMock, getQueueDepthMock, getCachedJsonMock, setCachedJsonMock, deleteCachedPrefixMock, executeTaskMock, poolQueryMock, poolConnectMock, releaseMock, authMockFactory } = vi.hoisted(() => ({
  queryDbMock: vi.fn(),
  enqueueNotificationMock: vi.fn(),
  getQueueDepthMock: vi.fn(),
  getCachedJsonMock: vi.fn(),
  setCachedJsonMock: vi.fn(),
  deleteCachedPrefixMock: vi.fn(),
  executeTaskMock: vi.fn(),
  poolQueryMock: vi.fn(),
  poolConnectMock: vi.fn(),
  releaseMock: vi.fn(),
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

vi.mock("../queues/index.js", () => ({
  enqueueNotification: enqueueNotificationMock,
  getQueueDepth: getQueueDepthMock
}));

vi.mock("../shared/cache.js", () => ({
  getCachedJson: getCachedJsonMock,
  setCachedJson: setCachedJsonMock,
  deleteCachedPrefix: deleteCachedPrefixMock
}));

vi.mock("../services/aiClient.js", () => ({
  AIClientFactory: {
    createClient: vi.fn(async () => ({
      executeTask: executeTaskMock
    }))
  }
}));

vi.mock("../middleware/auth.js", authMockFactory);

describe("Audience backend module contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCachedJsonMock.mockResolvedValue(null);
    getQueueDepthMock.mockResolvedValue({ notifications: 0, reporting: 0, anomaly: 0 });
    deleteCachedPrefixMock.mockResolvedValue(undefined);
    poolQueryMock.mockResolvedValue({ rows: [] });
    poolConnectMock.mockResolvedValue({
      query: vi.fn(),
      release: releaseMock
    });
  });

  it("GET /api/clients/:id returns client profile contract", async () => {
    queryDbMock
      .mockResolvedValueOnce([
        {
          id: "c1",
          full_name: "Amara Stone",
          email: "amara@example.com",
          phone: "+2348000000000",
          loyalty_points: "240",
          membership_tier: "silver",
          telehealth_consent: true,
          preferences: { lighting: "dim" },
          photo_url: null
        }
      ])
      .mockResolvedValueOnce([
        {
          id: "b1",
          start_time: new Date(Date.now() + 3600_000).toISOString(),
          end_time: new Date(Date.now() + 7200_000).toISOString(),
          status: "confirmed",
          room: "Room A",
          service_name: "Deep Tissue Massage",
          staff_id: "s1",
          staff_name: "Mira",
          staff_photo_url: null
        }
      ])
      .mockResolvedValueOnce([{ id: "i1", amount_cents: "5500", status: "open", due_date: "2026-03-07" }]);

    const app = await createTestApp();
    const res = await request(app).get("/api/clients/c1").set("Authorization", "Bearer test");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("full_name", "Amara Stone");
    expect(Array.isArray(res.body.data.upcoming_bookings)).toBe(true);
    expect(typeof res.body.data.balance_due).toBe("number");
  });

  it("GET /api/analytics/business-summary returns numeric business dashboard fields", async () => {
    queryDbMock
      .mockResolvedValueOnce([{ today: "1000", this_week: "5000", this_month: "12000", last_month: "10000" }])
      .mockResolvedValueOnce([{ today_total: "8", no_show_rate_pct: "12.5", cancellation_rate_pct: "5", avg_booking_value: "3200" }])
      .mockResolvedValueOnce([{ utilisation_rate_pct: "81.5", top_performer_id: "s1", understaffed_slots: "2" }])
      .mockResolvedValueOnce([{ active_count: "50", at_churn_risk: "4", new_this_month: "12", avg_lifetime_value: "9500" }])
      .mockResolvedValueOnce([{ id: "a1", source_module: "finance", title: "Review overdue invoices", context: "4 overdue", severity: "high", sla_risk: "0.9" }]);

    const app = await createTestApp();
    const res = await request(app).get("/api/analytics/business-summary").set("Authorization", "Bearer test");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.revenue.today).toBe("number");
    expect(typeof res.body.data.bookings.no_show_rate_pct).toBe("number");
    expect(Array.isArray(res.body.data.ai_alerts)).toBe(true);
  });

  it("GET /api/platform/ai-spend-summary returns provider keys", async () => {
    queryDbMock
      .mockResolvedValueOnce([
        { provider: "anthropic", spend_usd: "14.2" },
        { provider: "openai", spend_usd: "3.1" }
      ])
      .mockResolvedValueOnce([{ org_id: "o1", org_name: "Kora Spa", spend_usd: "17.3" }])
      .mockResolvedValueOnce([{ task: "compliance_advisory", token_count: "1200", cost_usd: "7.4" }]);

    const app = await createTestApp();
    const res = await request(app).get("/api/platform/ai-spend-summary").set("Authorization", "Bearer test");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.by_provider).toHaveProperty("claude");
    expect(res.body.data.by_provider).toHaveProperty("openai");
    expect(res.body.data.by_provider).toHaveProperty("gemini");
    expect(res.body.data.by_provider).toHaveProperty("mistral");
  });

  // NOTE: `/api/appointments` was part of a non-canonical availability subsystem.
  // Appointment move/resize contracts are reintroduced when availability is rebuilt
  // against the enabled `availability_rules/availability_overrides` schema.
});
