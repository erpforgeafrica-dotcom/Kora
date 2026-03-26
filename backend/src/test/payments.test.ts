import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestApp } from "./testAppFactory.js";

const { queryDbMock, createPaymentIntentMock, attachPaymentMethodMock, listPaymentMethodsMock, createRefundMock, listTransactionsMock, getRevenueCycleMetricsMock, getStripeConfigurationSummaryMock, authMockFactory } = vi.hoisted(() => ({
  queryDbMock: vi.fn(),
  createPaymentIntentMock: vi.fn(),
  attachPaymentMethodMock: vi.fn(),
  listPaymentMethodsMock: vi.fn(),
  createRefundMock: vi.fn(),
  listTransactionsMock: vi.fn(),
  getRevenueCycleMetricsMock: vi.fn(),
  getStripeConfigurationSummaryMock: vi.fn(),
  authMockFactory: async (importOriginal: any) => {
    const actual = await importOriginal();
    return { ...actual, requireAuth: (req: any, res: any, next: any) => { req.user = { id: "test-user", role: "platform_admin", organization_id: "org-001" }; res.locals.auth = { userId: "test-user", userRole: "platform_admin", organizationId: "org-001", sessionId: null, tokenJti: null }; next(); }, optionalAuth: (_r: any, _s: any, next: any) => next() };
  },
}));

vi.mock("../db/client.js", () => ({ queryDb: queryDbMock, dbPool: { connect: vi.fn(), query: vi.fn() } }));
vi.mock("../modules/payments/service.js", () => ({
  createPaymentIntent: createPaymentIntentMock,
  attachPaymentMethod: attachPaymentMethodMock,
  listPaymentMethods: listPaymentMethodsMock,
  createRefund: createRefundMock,
  listTransactions: listTransactionsMock,
  getRevenueCycleMetrics: getRevenueCycleMetricsMock,
}));
vi.mock("../modules/payments/stripeClient.js", () => ({
  isStripeConfigured: vi.fn(() => true),
  getStripeClient: vi.fn(),
  getStripeConfigurationSummary: getStripeConfigurationSummaryMock,
}));

vi.mock("../middleware/auth.js", authMockFactory);

describe("GET /api/payments/config", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns payment config with stripe summary", async () => {
    getStripeConfigurationSummaryMock.mockReturnValue({ configured: true, mode: "test" });

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/payments/config")
      .set("Authorization", "Bearer test")
;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stripe).toBeDefined();
  });
});

describe("POST /api/payments/intent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates payment intent and returns 201 with client_secret", async () => {
    createPaymentIntentMock.mockResolvedValue({
      clientSecret: "pi_test_secret",
      paymentIntentId: "pi_test_123",
      provider: "stripe",
    });

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/payments/intent")
      .set("Authorization", "Bearer test")
      .send({ amount_cents: 5000, currency: "usd", client_id: "c1" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.client_secret).toBe("pi_test_secret");
    expect(res.body.data.payment_intent_id).toBe("pi_test_123");
    expect(res.body.data.provider).toBe("stripe");
  });

  it("returns 400 for invalid amount_cents", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post("/api/payments/intent")
      .set("Authorization", "Bearer test")
      .send({ amount_cents: -100, currency: "usd" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/payments/confirm", () => {
  it("returns confirmed: true (flow symmetry endpoint)", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post("/api/payments/confirm")
      .set("Authorization", "Bearer test")
      .send({ payment_intent_id: "pi_test_123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.confirmed).toBe(true);
  });
});

describe("GET /api/payments/transactions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns transactions list", async () => {
    listTransactionsMock.mockResolvedValue([
      { id: "txn_001", amount_cents: 5000, currency: "usd", status: "succeeded", client_id: "c1" },
    ]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/payments/transactions")
      .set("Authorization", "Bearer test")
;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].id).toBe("txn_001");
  });
});

describe("GET /api/payments/methods/:clientId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns payment methods for client", async () => {
    listPaymentMethodsMock.mockResolvedValue([
      { id: "pm-1", type: "card", brand: "visa", last4: "4242", is_default: true },
    ]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/payments/methods/c1")
      .set("Authorization", "Bearer test")
;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].brand).toBe("visa");
  });
});

describe("GET /api/payments/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns payment by id", async () => {
    queryDbMock.mockResolvedValueOnce([
      { id: "txn-1", amount_cents: 5000, currency: "usd", status: "succeeded" },
    ]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/payments/txn-1")
      .set("Authorization", "Bearer test")
;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe("txn-1");
  });

  it("returns 404 when payment not found", async () => {
    queryDbMock.mockResolvedValueOnce([]);

    const app = await createTestApp();
    const res = await request(app)
      .get("/api/payments/missing")
      .set("Authorization", "Bearer test")
;

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PAYMENT_NOT_FOUND");
  });
});

describe("PATCH /api/payments/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates payment status", async () => {
    queryDbMock.mockResolvedValueOnce([{ id: "txn-1", status: "succeeded" }]);

    const app = await createTestApp();
    const res = await request(app)
      .patch("/api/payments/txn-1")
      .set("Authorization", "Bearer test")

      .send({ status: "succeeded" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.updated).toBe(true);
  });

  it("returns 400 when no fields provided", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .patch("/api/payments/txn-1")
      .set("Authorization", "Bearer test")

      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
