import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestApp } from "./testAppFactory.js";

const { enqueueNotificationMock, getQueueDepthMock, createNotificationLogRecordMock, listNotificationLogRecordsMock, listNotificationTemplatesMock, upsertNotificationTemplateMock, authMockFactory } = vi.hoisted(() => ({
  enqueueNotificationMock: vi.fn(),
  getQueueDepthMock: vi.fn(),
  createNotificationLogRecordMock: vi.fn(),
  listNotificationLogRecordsMock: vi.fn(),
  listNotificationTemplatesMock: vi.fn(),
  upsertNotificationTemplateMock: vi.fn(),
  authMockFactory: async (importOriginal: any) => {
    const actual = await importOriginal();
    return { ...actual, requireAuth: (req: any, res: any, next: any) => { req.user = { id: "test-user", role: "platform_admin", organization_id: "org-001" }; res.locals.auth = { userId: "test-user", userRole: "platform_admin", organizationId: "org-001", sessionId: null, tokenJti: null }; next(); }, optionalAuth: (_r: any, _s: any, next: any) => next() };
  },
}));

vi.mock("../queues/index.js", () => ({
  enqueueNotification: enqueueNotificationMock,
  enqueueReportGeneration: vi.fn(),
  getQueueDepth: getQueueDepthMock,
}));
vi.mock("../db/repositories/notificationsRepository.js", () => ({
  createNotificationLogRecord: createNotificationLogRecordMock,
  listNotificationLogRecords: listNotificationLogRecordsMock,
  listNotificationTemplates: listNotificationTemplatesMock,
  upsertNotificationTemplate: upsertNotificationTemplateMock,
}));
vi.mock("../middleware/auth.js", authMockFactory);

describe("GET /api/notifications/channels", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns available channels and queue depth", async () => {
    getQueueDepthMock.mockResolvedValue({ notifications: 3, reporting: 0, anomaly: 0 });

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/notifications/channels")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.channels)).toBe(true);
    expect(res.body.data.channels).toContain("email");
    expect(res.body.data.channels).toContain("sms");
    expect(typeof res.body.data.queueDepth).toBe("number");
  });
});

describe("POST /api/notifications/dispatch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("enqueues notification and returns 202", async () => {
    enqueueNotificationMock.mockResolvedValue({ id: "job-n1" });

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/notifications/dispatch")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1")
      .send({ channel: "email", payload: { to: "user@example.com", subject: "Hello" } });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accepted).toBe(true);
    expect(res.body.data.queue).toBe("notifications");
    expect(res.body.data.jobId).toBe("job-n1");
    expect(enqueueNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", channel: "email" })
    );
  });

  it("returns 400 for invalid channel", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post("/api/notifications/dispatch")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1")
      .send({ channel: "fax", payload: {} });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_CHANNEL");
  });

  it("returns 400 for missing payload", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post("/api/notifications/dispatch")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1")
      .send({ channel: "sms" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_PAYLOAD");
  });
});

describe("POST /api/notifications/send", () => {
  beforeEach(() => vi.clearAllMocks());

  it("logs and enqueues notification, returns 202 with log_id", async () => {
    createNotificationLogRecordMock.mockResolvedValue({ id: "log-1" });
    enqueueNotificationMock.mockResolvedValue({ id: "job-n2" });

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/notifications/send")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1")
      .send({ channel: "sms", payload: { body: "Your appointment is confirmed" }, recipient: "+2348000000000", event: "booking_confirmed" });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accepted).toBe(true);
    expect(res.body.data.log_id).toBe("log-1");
    expect(createNotificationLogRecordMock).toHaveBeenCalled();
    expect(enqueueNotificationMock).toHaveBeenCalled();
  });
});

describe("GET /api/notifications/templates", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns templates list", async () => {
    listNotificationTemplatesMock.mockResolvedValue([
      { id: "t1", event: "booking_confirmed", channel: "email", is_active: true },
    ]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/notifications/templates")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBe(1);
  });
});

describe("PUT /api/notifications/templates/:event", () => {
  beforeEach(() => vi.clearAllMocks());

  it("upserts template and returns it", async () => {
    upsertNotificationTemplateMock.mockResolvedValue({ id: "t2", event: "booking_cancelled", channel: "email", is_active: true });

    const app = await createTestApp();
    const res = await request(app)
      .put("/api/notifications/templates/booking_cancelled")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1")
      .send({ channel: "email", body: "Your booking has been cancelled.", is_active: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.event).toBe("booking_cancelled");
  });

  it("returns 400 for invalid channel", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .put("/api/notifications/templates/booking_cancelled")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1")
      .send({ channel: "fax", body: "test" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_CHANNEL");
  });
});
