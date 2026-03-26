import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "./testAppFactory.js";

vi.setConfig({ testTimeout: 10000, hookTimeout: 20000 });

const { queryDbMock, runLiveOrchestrationMock, saveActionFeedbackMock, authMockFactory } = vi.hoisted(() => ({
  queryDbMock: vi.fn(),
  runLiveOrchestrationMock: vi.fn(),
  saveActionFeedbackMock: vi.fn(),
  authMockFactory: async (importOriginal: any) => {
    const actual = await importOriginal();
    return { ...actual, requireAuth: (req: any, res: any, next: any) => { req.user = { id: "test-user", role: "platform_admin", organization_id: "org-001" }; res.locals.auth = { userId: "test-user", userRole: "platform_admin", organizationId: "org-001", sessionId: null, tokenJti: null }; next(); }, optionalAuth: (_r: any, _s: any, next: any) => next() };
  },
}));

vi.mock("../db/client.js", () => ({
  queryDb: queryDbMock
}));

vi.mock("../modules/ai/orchestration/liveOrchestrator.js", () => ({
  runLiveOrchestration: runLiveOrchestrationMock,
  saveActionFeedback: saveActionFeedbackMock
}));

vi.mock("../middleware/auth.js", authMockFactory);

vi.mock("../services/aiClient.js", () => ({
  AIClientFactory: {
    createClient: vi.fn(async () => ({
      executeTask: vi.fn(async () => ({ content: "{}" }))
    }))
  }
}));

describe("AI Orchestration API contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/ai/orchestrate/live returns prioritized actions contract", async () => {
    const app = await createTestApp();
    queryDbMock.mockResolvedValueOnce([{ ai_plan: "enterprise" }]); // requirePlan check
    runLiveOrchestrationMock.mockResolvedValueOnce({
      generatedAt: new Date().toISOString(),
      prioritizedActions: [
        {
          id: "a1",
          organizationId: "00000000-0000-0000-0000-000000000001",
          sourceModule: "emergency",
          title: "Resolve incident",
          context: "Critical incident open",
          severity: "critical",
          dependencies: [],
          slaRisk: 0.9,
          commandFingerprint: "fp1",
          metadata: {},
          detectedAt: new Date().toISOString(),
          score: 94,
          reasoning: ["Severity high"],
          followUpChain: ["finance:Address overdue receivables"]
        }
      ],
      policyOutcomes: [],
      nextActionRecommendation: "EMERGENCY: Resolve incident",
      causalityInsights: [],
      hiddenRisk: null,
      aiCausalityInsights: []
    });

    const res = await request(app)
      .post("/api/ai/orchestrate/live")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1")
      .send({ topN: 5, autoExecute: false, userRole: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.prioritizedActions)).toBe(true);
    expect(res.body.data.prioritizedActions[0]).toHaveProperty("score");
    expect(res.body.data.prioritizedActions[0]).toHaveProperty("reasoning");
    expect(res.body.data.prioritizedActions[0]).toHaveProperty("followUpChain");
    expect(Array.isArray(res.body.data.policyOutcomes)).toBe(true);
    expect(typeof res.body.data.nextActionRecommendation).toBe("string");
  });

  it("POST /api/ai/orchestrate/feedback accepts valid payload and rejects invalid outcome", async () => {
    const app = await createTestApp();

    const ok = await request(app).post("/api/ai/orchestrate/feedback").set("Authorization", "Bearer test").send({
      actionId: "a1",
      commandFingerprint: "fp1",
      outcome: "accepted",
      feedbackScore: 1
    });
    expect(ok.status).toBe(202);

    const bad = await request(app).post("/api/ai/orchestrate/feedback").set("Authorization", "Bearer test").send({
      actionId: "a1",
      commandFingerprint: "fp1",
      outcome: "invalid"
    });
    expect(bad.status).toBe(400);
  });
});

describe("Signal aggregation + scoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buildCommandCandidates produces critical candidate and scoring applies feedback adjustment", async () => {
    const { buildCommandCandidates } = await import("../modules/ai/orchestration/signalAggregator.js");
    const { scoreCommandCandidates } = await import("../modules/ai/orchestration/scoringEngine.js");

    const signals = {
      auth: { activeUsers24h: 12, adminUsers: 1 },
      bookings: { pendingToday: 30, totalToday: 70 },
      clinical: { recordsToday: 10 },
      emergency: { openIncidents: 3, criticalIncidents: 1 },
      finance: { overdueInvoices: 7, overdueAmountCents: 300000 },
      ai: { avgLatencyMs1h: 1000, totalRequests1h: 40 },
      notifications: { pendingNotifications: 20 },
      reporting: { staleReports24h: 0 }
    };

    const candidates = buildCommandCandidates("00000000-0000-0000-0000-000000000001", signals);
    expect(candidates.some((c) => c.severity === "critical")).toBe(true);

    queryDbMock.mockResolvedValueOnce([
      {
        command_fingerprint: candidates[0]?.commandFingerprint ?? "fp",
        accepted: "9",
        total: "10"
      }
    ]);

    const result = await scoreCommandCandidates(
      candidates,
      {
        organizationId: "00000000-0000-0000-0000-000000000001",
        userId: "00000000-0000-0000-0000-000000000101",
        userRole: "admin"
      },
      signals
    );

    expect(result.rankedActions.length).toBeGreaterThan(0);
    expect(result.rankedActions[0].score).toBeGreaterThanOrEqual(result.rankedActions[result.rankedActions.length - 1].score);
  });
});
