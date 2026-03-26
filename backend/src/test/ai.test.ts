import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestApp } from "./testAppFactory.js";

const { queryDbMock, rankCommandsMock, generateInsightsMock, predictOperationalMetricsMock, suggestOptimizationsMock, runLiveOrchestrationMock, saveActionFeedbackMock, loadModuleSignalSnapshotMock, executeTaskMock, authMockFactory } = vi.hoisted(() => ({
  queryDbMock: vi.fn(),
  rankCommandsMock: vi.fn(),
  generateInsightsMock: vi.fn(),
  predictOperationalMetricsMock: vi.fn(),
  suggestOptimizationsMock: vi.fn(),
  runLiveOrchestrationMock: vi.fn(),
  saveActionFeedbackMock: vi.fn(),
  loadModuleSignalSnapshotMock: vi.fn(),
  executeTaskMock: vi.fn(),
  authMockFactory: async (importOriginal: any) => {
    const actual = await importOriginal();
    return { ...actual, requireAuth: (req: any, res: any, next: any) => { req.user = { id: "test-user", role: "platform_admin", organization_id: "org-001" }; res.locals.auth = { userId: "test-user", userRole: "platform_admin", organizationId: "org-001", sessionId: null, tokenJti: null }; next(); }, optionalAuth: (_r: any, _s: any, next: any) => next() };
  },
}));

vi.mock("../db/client.js", () => ({ queryDb: queryDbMock }));
vi.mock("../modules/ai/service.js", () => ({
  AIOrchestrationService: vi.fn().mockImplementation(() => ({
    rankCommands: rankCommandsMock,
    generateInsights: generateInsightsMock,
    predictOperationalMetrics: predictOperationalMetricsMock,
    suggestOptimizations: suggestOptimizationsMock,
  })),
}));
vi.mock("../modules/ai/orchestration/liveOrchestrator.js", () => ({
  runLiveOrchestration: runLiveOrchestrationMock,
  saveActionFeedback: saveActionFeedbackMock,
}));
vi.mock("../modules/ai/orchestration/signalAggregator.js", () => ({
  loadModuleSignalSnapshot: loadModuleSignalSnapshotMock,
}));
vi.mock("../services/aiClient.js", () => ({
  AIClientFactory: {
    createClient: vi.fn(async () => ({ executeTask: executeTaskMock })),
  },
}));
vi.mock("../middleware/auth.js", authMockFactory);

describe("GET /api/ai/status", () => {
  it("returns provider availability flags", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .get("/api/ai/status")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.providers).toHaveProperty("anthropic");
    expect(res.body.data.providers).toHaveProperty("openai");
  });
});

describe("POST /api/ai/rank-commands", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns ranked commands", async () => {
    rankCommandsMock.mockResolvedValue([
      { id: "cmd-1", title: "Review overdue invoices", score: 0.92 },
    ]);

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/ai/rank-commands")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1")
      .send({ commands: [{ id: "cmd-1", title: "Review overdue invoices" }] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe("command_ranking");
    expect(Array.isArray(res.body.data.ranked)).toBe(true);
  });

  it("returns 400 when commands is not an array", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post("/api/ai/rank-commands")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1")
      .send({ commands: "not-an-array" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("commands must be an array");
  });
});

describe("POST /api/ai/orchestrate/live", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Return enterprise plan so requirePlan('enterprise') passes
    queryDbMock.mockResolvedValue([{ ai_plan: "enterprise" }]);
  });

  it("returns live orchestration result", async () => {
    queryDbMock
      .mockResolvedValueOnce([{ ai_plan: "enterprise" }]) // requirePlan check
      .mockResolvedValueOnce([{ ai_plan: "enterprise" }]); // any extra calls
    runLiveOrchestrationMock.mockResolvedValue({
      actions: [{ id: "a1", title: "Resolve critical alert", score: 0.95 }],
      executedCount: 1,
      timestamp: new Date().toISOString(),
    });

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/ai/orchestrate/live")
      .set("Authorization", "Bearer test")
      .send({ topN: 5, autoExecute: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe("live_orchestration");
    expect(Array.isArray(res.body.data.actions)).toBe(true);
    expect(runLiveOrchestrationMock).toHaveBeenCalledWith(
      expect.objectContaining({ context: expect.objectContaining({ organizationId: "org-1" }) })
    );
  });
});

describe("POST /api/ai/orchestrate/feedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepts valid feedback and returns 202", async () => {
    saveActionFeedbackMock.mockResolvedValue(undefined);

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/ai/orchestrate/feedback")
      .set("Authorization", "Bearer test")

      .send({ actionId: "a1", commandFingerprint: "fp-abc", outcome: "accepted" });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accepted).toBe(true);
  });

  it("returns 400 for invalid outcome", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post("/api/ai/orchestrate/feedback")
      .set("Authorization", "Bearer test")

      .send({ actionId: "a1", commandFingerprint: "fp-abc", outcome: "maybe" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_FEEDBACK_PAYLOAD");
  });
});

describe("GET /api/ai/anomalies", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns anomaly events list", async () => {
    queryDbMock
      .mockResolvedValueOnce([{ ai_plan: "business" }]) // requirePlan check
      .mockResolvedValueOnce([]) // config rows
      .mockResolvedValueOnce([{ avg_30d: "5", std_30d: "1", days_count: "10" }]) // stats
      .mockResolvedValueOnce([{ recent_c: "5" }]) // recent
      .mockResolvedValue([{ id: "anm-1", metric_name: "booking_rate", current_value: "2.1", severity: "high", created_at: "2025-01-01T00:00:00Z" }]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/ai/anomalies")
      .set("Authorization", "Bearer test");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe("anomaly_events");
    expect(Array.isArray(res.body.data.anomalies)).toBe(true);
  });
});
