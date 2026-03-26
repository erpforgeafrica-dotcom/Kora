import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestApp } from "./testAppFactory.js";

const { queryDbMock, getReportingSummaryMock, enqueueReportGenerationMock, authMockFactory } = vi.hoisted(() => ({
  queryDbMock: vi.fn(),
  getReportingSummaryMock: vi.fn(),
  enqueueReportGenerationMock: vi.fn(),
  authMockFactory: async (importOriginal: any) => {
    const actual = await importOriginal();
    return { ...actual, requireAuth: (req: any, res: any, next: any) => { req.user = { id: "test-user", role: "platform_admin", organization_id: "org-001" }; res.locals.auth = { userId: "test-user", userRole: "platform_admin", organizationId: "org-001", sessionId: null, tokenJti: null }; next(); }, optionalAuth: (_r: any, _s: any, next: any) => next() };
  },
}));

vi.mock("../db/client.js", () => ({ queryDb: queryDbMock }));
vi.mock("../db/repositories/analyticsRepository.js", () => ({
  getReportingSummary: getReportingSummaryMock,
  getTodayBookingSummary: vi.fn(),
  getFinanceKpis: vi.fn(),
}));
vi.mock("../queues/index.js", () => ({
  enqueueReportGeneration: enqueueReportGenerationMock,
  enqueueNotification: vi.fn(),
  getQueueDepth: vi.fn().mockResolvedValue({ notifications: 0, reporting: 0, anomaly: 0 }),
}));
vi.mock("../middleware/auth.js", authMockFactory);

describe("GET /api/reporting/summary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns reporting summary with metrics array", async () => {
    getReportingSummaryMock.mockResolvedValue({
      generatedAt: "2025-01-01T00:00:00.000Z",
      metrics: [
        { key: "active_users", value: 42 },
        { key: "avg_response_ms", value: 120 },
        { key: "automation_rate", value: 0.85 },
        { key: "csat", value: 4.7 },
      ],
    });

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/reporting/summary")
      .set("Authorization", "Bearer test")
;

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        module: "reporting",
        metrics: expect.arrayContaining([
          expect.objectContaining({ key: "active_users", value: 42 })
        ]),
      }),
    });
    expect(getReportingSummaryMock).toHaveBeenCalledWith("org-1");
  });

  it("returns canonical summary envelope under the shared test auth context", async () => {
    getReportingSummaryMock.mockResolvedValue({
      generatedAt: "2025-01-01T00:00:00.000Z",
      metrics: [{ key: "active_users", value: 42 }],
    });

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/reporting/summary");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        module: "reporting",
        metrics: expect.arrayContaining([
          expect.objectContaining({ key: "active_users", value: 42 }),
        ]),
      }),
    });
  });
});

describe("POST /api/reporting/generate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("enqueues report and returns 202 with jobId", async () => {
    enqueueReportGenerationMock.mockResolvedValue({ id: "job-abc" });

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/reporting/generate")
      .set("Authorization", "Bearer test")
      .send({ reportType: "weekly" });

    expect(res.status).toBe(202);
    expect(res.body).toEqual({
      success: true,
      data: {
        accepted: true,
        jobId: "job-abc",
        queue: "reporting"
      },
      meta: null,
    });
    expect(enqueueReportGenerationMock).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", reportType: "weekly" })
    );
  });

  it("defaults reportType to 'daily' for unknown values", async () => {
    enqueueReportGenerationMock.mockResolvedValue({ id: "job-xyz" });

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/reporting/generate")
      .set("Authorization", "Bearer test")
      .send({ reportType: "quarterly" });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(enqueueReportGenerationMock).toHaveBeenCalledWith(
      expect.objectContaining({ reportType: "daily" })
    );
  });
});
