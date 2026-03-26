import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestApp } from "./testAppFactory.js";

const { scheduleVideoSessionMock, getVideoSessionMock, createRecordingMock, getRecordingMock, scoreRecordingQualityMock, getSessionAnalyticsMock, authMockFactory } = vi.hoisted(() => ({
  scheduleVideoSessionMock: vi.fn(),
  getVideoSessionMock: vi.fn(),
  createRecordingMock: vi.fn(),
  getRecordingMock: vi.fn(),
  scoreRecordingQualityMock: vi.fn(),
  getSessionAnalyticsMock: vi.fn(),
  authMockFactory: async (importOriginal: any) => {
    const actual = await importOriginal();
    return { ...actual, requireAuth: (req: any, res: any, next: any) => { req.user = { id: "test-user", role: "platform_admin", organization_id: "org-001" }; res.locals.auth = { userId: "test-user", userRole: "platform_admin", organizationId: "org-001", sessionId: null, tokenJti: null }; next(); }, optionalAuth: (_r: any, _s: any, next: any) => next() };
  },
}));

vi.mock("../services/video/streaming.js", () => ({
  scheduleVideoSession: scheduleVideoSessionMock,
  getVideoSession: getVideoSessionMock,
}));
vi.mock("../services/video/recording.js", () => ({
  createRecording: createRecordingMock,
  getRecording: getRecordingMock,
}));
vi.mock("../services/video/analytics.js", () => ({
  scoreRecordingQuality: scoreRecordingQualityMock,
  getSessionAnalytics: getSessionAnalyticsMock,
}));
vi.mock("../middleware/auth.js", authMockFactory);

const SESSION = {
  id: "sess-1",
  booking_id: null,
  provider: "twilio",
  room_name: "kora-org-001-1234",
  status: "scheduled",
  starts_at: null,
  created_at: "2025-01-01T00:00:00.000Z",
  join_url: "https://video.kora.local/room/kora-org-001-1234",
  host_token: "host_sess-1",
  participant_token: "guest_sess-1",
};

const RECORDING = {
  id: "rec-1",
  session_id: "sess-1",
  storage_key: "recordings/sess-1.mp4",
  playback_url: null,
  transcript_text: null,
  duration_seconds: 1800,
  created_at: "2025-01-01T01:00:00.000Z",
};

describe("POST /api/video/sessions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a session and returns 201 with join_url", async () => {
    scheduleVideoSessionMock.mockResolvedValue(SESSION);

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/video/sessions")
      .set("Authorization", "Bearer test")
      .send({ provider: "twilio", starts_at: "2025-06-01T10:00:00Z" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.join_url).toContain("video.kora.local");
    expect(res.body.data.host_token).toBeDefined();
    expect(scheduleVideoSessionMock).toHaveBeenCalledWith(
      "org-1",
      "test-user",
      expect.objectContaining({ provider: "twilio" })
    );
  });
});

describe("GET /api/video/sessions/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns session when found", async () => {
    getVideoSessionMock.mockResolvedValue(SESSION);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/video/sessions/sess-1")
      .set("Authorization", "Bearer test")
;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe("sess-1");
    expect(res.body.data.join_url).toBeDefined();
  });

  it("returns 404 when session not found", async () => {
    getVideoSessionMock.mockResolvedValue(null);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/video/sessions/missing")
      .set("Authorization", "Bearer test")
;

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("VIDEO_SESSION_NOT_FOUND");
  });
});

describe("POST /api/video/recordings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a recording and returns 201", async () => {
    createRecordingMock.mockResolvedValue(RECORDING);

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/video/recordings")
      .set("Authorization", "Bearer test")
      .send({ session_id: "sess-1", storage_key: "recordings/sess-1.mp4", duration_seconds: 1800 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.session_id).toBe("sess-1");
    expect(res.body.data.storage_key).toBe("recordings/sess-1.mp4");
  });
});

describe("GET /api/video/recordings/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns recording when found", async () => {
    getRecordingMock.mockResolvedValue(RECORDING);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/video/recordings/rec-1")
      .set("Authorization", "Bearer test")
;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe("rec-1");
  });

  it("returns 404 when recording not found", async () => {
    getRecordingMock.mockResolvedValue(null);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/video/recordings/missing")
      .set("Authorization", "Bearer test")
;

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe("POST /api/video/recordings/:id/score", () => {
  beforeEach(() => vi.clearAllMocks());

  it("scores a recording and returns result", async () => {
    scoreRecordingQualityMock.mockResolvedValue({ recording_id: "rec-1", quality_score: 88 });

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/video/recordings/rec-1/score")
      .set("Authorization", "Bearer test")

      .send({ quality_score: 88 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.quality_score).toBe(88);
    expect(scoreRecordingQualityMock).toHaveBeenCalledWith(
      expect.any(String), "rec-1", 88
    );
  });
});

describe("GET /api/video/analytics/:sessionId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns session analytics", async () => {
    getSessionAnalyticsMock.mockResolvedValue({
      session_id: "sess-1",
      recordings: 2,
      avg_quality_score: 85,
      total_duration_seconds: 3600,
    });

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/video/analytics/sess-1")
      .set("Authorization", "Bearer test")
;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.session_id).toBe("sess-1");
    expect(typeof res.body.data.recordings).toBe("number");
    expect(typeof res.body.data.avg_quality_score).toBe("number");
  });
});
