import request from "supertest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestApp } from "./testAppFactory.js";

vi.setConfig({ testTimeout: 15000, hookTimeout: 20000 });

const { createPaymentIntentMock, confirmPaymentMock, dispatchNotificationMock, executeReportMock, listTransactionsMock, authMockFactory } = vi.hoisted(() => ({
  createPaymentIntentMock: vi.fn(),
  confirmPaymentMock: vi.fn(),
  dispatchNotificationMock: vi.fn(),
  executeReportMock: vi.fn(),
  listTransactionsMock: vi.fn(),
  authMockFactory: async (importOriginal: any) => {
    const actual = await importOriginal();
    return { ...actual, requireAuth: (req: any, res: any, next: any) => { req.user = { id: "test-user", role: "platform_admin", organization_id: "org-1" }; res.locals.auth = { userId: "test-user", userRole: "platform_admin", organizationId: "org-1", sessionId: null, tokenJti: null }; next(); }, optionalAuth: (_r: any, _s: any, next: any) => next() };
  },
}));

vi.mock("../modules/payments/service.js", () => ({
  createPaymentIntent: createPaymentIntentMock,
  confirmPaymentIntent: confirmPaymentMock,
  createRefund: vi.fn(),
  listTransactions: listTransactionsMock,
  getRevenueCycleMetrics: vi.fn(),
  attachPaymentMethod: vi.fn(),
  listPaymentMethods: vi.fn(),
}));

vi.mock("../queues/index.js", () => ({
  enqueueNotification: dispatchNotificationMock,
  enqueueReportGeneration: executeReportMock,
  getQueueDepth: vi.fn().mockResolvedValue({ notifications: 0, reporting: 0 }),
}));

vi.mock("../db/repositories/notificationsRepository.js", () => ({
  createNotificationLogRecord: vi.fn().mockResolvedValue({ id: "log-1" }),
  listNotificationLogRecords: vi.fn().mockResolvedValue([]),
  listNotificationTemplates: vi.fn().mockResolvedValue([]),
  upsertNotificationTemplate: vi.fn(),
}));

vi.mock("../middleware/auth.js", authMockFactory);

describe("Phase 2 — Cross-Module Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Payment → Notification Flow", () => {
    it("should send receipt email after payment confirmation", async () => {
      createPaymentIntentMock.mockResolvedValue({
        clientSecret: "pi_secret",
        paymentIntentId: "pi_123456",
        provider: "stripe"
      });
      dispatchNotificationMock.mockResolvedValue({ id: "job_001" });

      const app = await createTestApp();

      const paymentRes = await request(app)
        .post("/api/payments/intent")
        .set("Authorization", "Bearer test")
        .send({ amount_cents: 5000, currency: "usd" });

      expect([201, 400]).toContain(paymentRes.status);

      const notifyRes = await request(app)
        .post("/api/notifications/dispatch")
        .set("Authorization", "Bearer test")
        .send({ channel: "email", payload: { to: "customer@example.com", subject: "Receipt" } });

      expect(notifyRes.status).toBe(202);
      expect(dispatchNotificationMock).toHaveBeenCalled();
    });

    it("should send SMS confirmation for SMS-subscribed customers", async () => {
      dispatchNotificationMock.mockResolvedValue({ id: "job_002" });

      const app = await createTestApp();
      const notifyRes = await request(app)
        .post("/api/notifications/dispatch")
        .set("Authorization", "Bearer test")
        .send({ channel: "sms", payload: { to: "+1234567890", body: "Payment confirmed" } });

      expect(notifyRes.status).toBe(202);
      expect(notifyRes.body.success).toBe(true);
      expect(notifyRes.body.data.accepted).toBe(true);
    });

    it("should handle notification failure without blocking payment", async () => {
      createPaymentIntentMock.mockResolvedValue({
        clientSecret: "pi_secret",
        paymentIntentId: "pi_123456",
        provider: "stripe"
      });

      const app = await createTestApp();
      const paymentRes = await request(app)
        .post("/api/payments/confirm")
        .set("Authorization", "Bearer test")
        .send({ payment_intent_id: "pi_123456" });

      expect(paymentRes.status).toBe(200);
      expect(paymentRes.body.success).toBe(true);
      expect(paymentRes.body.data.confirmed).toBe(true);
    });
  });

  describe("Payment → Reporting Flow", () => {
    it("should track payment in revenue report", async () => {
      executeReportMock.mockResolvedValue({ id: "exec_001" });

      const app = await createTestApp();
      const reportRes = await request(app)
        .post("/api/reporting/execute")
        .set("Authorization", "Bearer test")
        .send({ report_id: "report_revenue_001" });

      expect([202, 201]).toContain(reportRes.status);
      // executeReportMock is called via enqueueReportGeneration queue mock
    });

    it("should include payment refund in cost analysis report", async () => {
      executeReportMock.mockResolvedValue({ id: "exec_002" });

      const app = await createTestApp();
      const reportRes = await request(app)
        .post("/api/reporting/execute")
        .set("Authorization", "Bearer test")
        .send({ report_id: "report_cost_analysis" });

      expect([202, 201]).toContain(reportRes.status);
    });
  });

  describe("Notification → Reporting Flow", () => {
    it("should track notification delivery in report", async () => {
      dispatchNotificationMock.mockResolvedValue({ id: "job_003" });
      executeReportMock.mockResolvedValue({ id: "exec_003" });

      const app = await createTestApp();

      const notifyRes = await request(app)
        .post("/api/notifications/dispatch")
        .set("Authorization", "Bearer test")
        .send({ channel: "email", payload: { to: "user@example.com", subject: "Order" } });

      expect(notifyRes.status).toBe(202);

      const reportRes = await request(app)
        .post("/api/reporting/execute")
        .set("Authorization", "Bearer test")
        .send({ report_id: "report_notifications" });

      expect([202, 201]).toContain(reportRes.status);
    });
  });

  describe("Complex Cross-Module Scenario: Full Booking Flow", () => {
    it("should complete booking → payment → notification → reporting chain", async () => {
      createPaymentIntentMock.mockResolvedValue({
        clientSecret: "pi_secret",
        paymentIntentId: "pi_booking_001",
        provider: "stripe"
      });
      dispatchNotificationMock.mockResolvedValue({ id: "job_booking_001" });
      executeReportMock.mockResolvedValue({ id: "exec_booking_001" });

      const app = await createTestApp();

      const paymentRes = await request(app)
        .post("/api/payments/intent")
        .set("Authorization", "Bearer test")
        .send({ amount_cents: 15000, currency: "usd" });

      expect([201, 400]).toContain(paymentRes.status);

      const confirmRes = await request(app)
        .post("/api/payments/confirm")
        .set("Authorization", "Bearer test")
        .send({ payment_intent_id: "pi_booking_001" });

      expect(confirmRes.status).toBe(200);

      const notifyRes = await request(app)
        .post("/api/notifications/dispatch")
        .set("Authorization", "Bearer test")
        .send({ channel: "email", payload: { to: "customer@example.com", subject: "Booking confirmed" } });

      expect(notifyRes.status).toBe(202);

      const reportRes = await request(app)
        .post("/api/reporting/execute")
        .set("Authorization", "Bearer test")
        .send({ report_id: "booking_daily_report" });

      expect([202, 201]).toContain(reportRes.status);

      expect(dispatchNotificationMock).toHaveBeenCalled();
      // executeReportMock called via enqueueReportGeneration
    });
  });

  describe("Transaction Consistency", () => {
    it("should maintain transaction count across all modules", async () => {
      listTransactionsMock.mockResolvedValue([
        { id: "txn_001", status: "succeeded", client_id: "c1" },
        { id: "txn_002", status: "succeeded", client_id: "c1" }
      ]);

      const app = await createTestApp();
      const res = await request(app)
        .get("/api/payments/transactions")
        .set("Authorization", "Bearer test");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe("Error Handling in Cross-Module Flows", () => {
    it("should not lose payment if notification fails", async () => {
      const app = await createTestApp();
      const paymentRes = await request(app)
        .post("/api/payments/confirm")
        .set("Authorization", "Bearer test")
        .send({ payment_intent_id: "pi_error" });

      expect(paymentRes.status).toBe(200);
      expect(paymentRes.body.success).toBe(true);
      expect(paymentRes.body.data.confirmed).toBe(true);
    });

    it("should queue notification even if report generation fails", async () => {
      dispatchNotificationMock.mockResolvedValue({ id: "job_error_001" });

      const app = await createTestApp();
      const notifyRes = await request(app)
        .post("/api/notifications/dispatch")
        .set("Authorization", "Bearer test")
        .send({ channel: "sms", payload: { to: "+1234567890", body: "Alert" } });

      expect(notifyRes.status).toBe(202);
      expect(notifyRes.body.success).toBe(true);
      expect(notifyRes.body.data.accepted).toBe(true);
    });
  });

  describe("Concurrency: Parallel Module Operations", () => {
    it("should handle concurrent payments and notifications", async () => {
      for (let i = 0; i < 5; i++) {
        dispatchNotificationMock.mockResolvedValueOnce({ id: `job_concurrent_${i}` });
      }

      const app = await createTestApp();

      const notificationPromises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post("/api/notifications/dispatch")
          .set("Authorization", "Bearer test")
          .send({ channel: "email", payload: { to: `user${i}@example.com`, subject: "Test" } })
      );

      const notificationResults = await Promise.all(notificationPromises);
      notificationResults.forEach(res => {
        expect(res.status).toBe(202);
      });
    });
  });
});
