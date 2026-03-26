import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "./testAppFactory.js";

const { queryDbMock } = vi.hoisted(() => ({
  queryDbMock: vi.fn(),
}));

vi.mock("../db/client.js", () => ({
  queryDb: queryDbMock,
}));

describe("Support routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists support cases with canonical pagination metadata", async () => {
    queryDbMock
      .mockResolvedValueOnce([{ total: "2" }])
      .mockResolvedValueOnce([
        {
          id: "case-1",
          customer_id: "client-1",
          customer_name: "Ada",
          channel: "email",
          event: "booking_dispute",
          description: "Client reported a billing issue",
          status: "open",
          priority: "high",
          assignee_id: null,
          assignee_name: null,
          resolution_note: null,
          created_at: "2026-03-25T00:00:00Z",
          updated_at: "2026-03-25T00:00:00Z",
        },
        {
          id: "case-2",
          customer_id: "client-2",
          customer_name: "Bola",
          channel: "chat",
          event: "refund_request",
          description: "Customer asked for a refund",
          status: "assigned",
          priority: "medium",
          assignee_id: "staff-1",
          assignee_name: "Support Lead",
          resolution_note: null,
          created_at: "2026-03-24T00:00:00Z",
          updated_at: "2026-03-25T01:00:00Z",
        },
      ]);

    const app = await createTestApp({ role: "operations" });
    const res = await request(app)
      .get("/api/support/cases?status=open,assigned&limit=10&page=1")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({
      page: 1,
      limit: 10,
      total: 2,
      total_pages: 1,
    });
  });

  it("rejects invalid support status updates", async () => {
    const app = await createTestApp({ role: "operations" });
    const res = await request(app)
      .patch("/api/support/cases/case-1/status")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1")
      .send({ status: "done" });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("records a resolution and marks the case resolved", async () => {
    queryDbMock
      .mockResolvedValueOnce([
        {
          id: "case-1",
          customer_id: "client-1",
          customer_name: "Ada",
          channel: "email",
          event: "booking_dispute",
          description: "Client reported a billing issue",
          status: "open",
          priority: "high",
          assignee_id: null,
          assignee_name: null,
          resolution_note: null,
          created_at: "2026-03-25T00:00:00Z",
          updated_at: "2026-03-25T00:00:00Z",
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "case-1",
          customer_id: "client-1",
          customer_name: "Ada",
          channel: "email",
          event: "booking_dispute",
          description: "Client reported a billing issue",
          status: "resolved",
          priority: "high",
          assignee_id: null,
          assignee_name: null,
          resolution_note: "Refund approved",
          created_at: "2026-03-25T00:00:00Z",
          updated_at: "2026-03-25T02:00:00Z",
          resolved_at: "2026-03-25T02:00:00Z",
        },
      ]);

    const app = await createTestApp({ role: "operations" });
    const res = await request(app)
      .post("/api/support/cases/case-1/resolution")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1")
      .send({ resolution_note: "Refund approved" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("resolved");
    expect(res.body.data.resolution_note).toBe("Refund approved");
  });

  it("exposes the canonical /tickets alias", async () => {
    queryDbMock
      .mockResolvedValueOnce([{ total: "1" }])
      .mockResolvedValueOnce([
        {
          id: "case-1",
          customer_id: "client-1",
          customer_name: "Ada",
          channel: "email",
          event: "booking_dispute",
          description: "Client reported a billing issue",
          status: "open",
          priority: "high",
          assignee_id: null,
          assignee_name: null,
          resolution_note: null,
          created_at: "2026-03-25T00:00:00Z",
          updated_at: "2026-03-25T00:00:00Z",
        },
      ]);

    const app = await createTestApp({ role: "operations" });
    const res = await request(app)
      .get("/api/support/tickets?limit=20")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta).toMatchObject({
      page: 1,
      limit: 20,
      total: 1,
      total_pages: 1,
    });
    expect(res.body.data[0].id).toBe("case-1");
  });

  it("returns ticket timeline from the canonical timeline endpoint", async () => {
    queryDbMock.mockResolvedValueOnce([
      {
        id: "evt-1",
        event_type: "resolved",
        actor_user_id: "user-1",
        details: {
          from_status: "open",
          to_status: "resolved",
        },
        created_at: "2026-03-25T02:00:00Z",
      },
    ]);

    const app = await createTestApp({ role: "operations" });
    const res = await request(app)
      .get("/api/support/tickets/case-1/timeline")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].event_type).toBe("resolved");
  });
});
