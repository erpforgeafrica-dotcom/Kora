/**
 * QA CONTRACT ENFORCEMENT SUITE
 * ─────────────────────────────
 * Authority: QA Team
 * Validates ALL outputs against locked contracts.
 * Any failure here BLOCKS merge.
 *
 * Contracts enforced:
 * 1. API response envelope — { success, data, meta? } / { success: false, error: { code, message } }
 * 2. Error code format — UPPER_SNAKE_CASE only
 * 3. Auth behavior — 401 vs 403 correctness
 * 4. Pagination structure — { page, limit, total, total_pages }
 * 5. State machine transitions — no forbidden transitions
 */

import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import {
  BOOKING_TRANSITIONS,
  EMERGENCY_TRANSITIONS,
  DELIVERY_TRANSITIONS,
  SUBSCRIPTION_TRANSITIONS,
  isValidTransition,
} from "../shared/stateMachines.js";

const app = createApp();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(role = "business_admin", orgId = "00000000-0000-0000-0000-000000000001") {
  return {
    "x-test-user-id": "qa-user-1",
    "x-test-role": role,
    "x-test-org-id": orgId,
  };
}

function assertSuccessEnvelope(body: any) {
  expect(body).toHaveProperty("success", true);
  expect(body).toHaveProperty("data");
}

function assertErrorEnvelope(body: any) {
  expect(body).toHaveProperty("success", false);
  expect(body).toHaveProperty("error");
  expect(body.error).toHaveProperty("code");
  expect(body.error).toHaveProperty("message");
  // Error code MUST be UPPER_SNAKE_CASE
  expect(body.error.code).toMatch(/^[A-Z][A-Z0-9_]*$/);
}

function assertPaginationMeta(meta: any) {
  expect(meta).toHaveProperty("page");
  expect(meta).toHaveProperty("limit");
  expect(meta).toHaveProperty("total");
  expect(meta).toHaveProperty("total_pages");
  expect(typeof meta.page).toBe("number");
  expect(typeof meta.limit).toBe("number");
  expect(typeof meta.total).toBe("number");
  expect(typeof meta.total_pages).toBe("number");
}

// ─── CONTRACT 1: Response Envelope ───────────────────────────────────────────

describe("QA: API Response Envelope Contract", () => {
  it("GET /health returns status object (non-API, no envelope required)", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status");
  });

  it("GET /api/bookings returns success envelope", async () => {
    const res = await request(app)
      .get("/api/bookings")
      .set(authHeaders());
    expect([200, 500]).toContain(res.status); // 500 = no DB in test, still must be envelope
    if (res.status === 200) assertSuccessEnvelope(res.body);
    if (res.status >= 400) assertErrorEnvelope(res.body);
  });

  it("GET /api/emergency/requests returns success envelope", async () => {
    const res = await request(app)
      .get("/api/emergency/requests")
      .set(authHeaders());
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) assertSuccessEnvelope(res.body);
    if (res.status >= 400) assertErrorEnvelope(res.body);
  });

  it("GET /api/delivery/bookings returns success envelope", async () => {
    const res = await request(app)
      .get("/api/delivery/bookings")
      .set(authHeaders());
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) assertSuccessEnvelope(res.body);
    if (res.status >= 400) assertErrorEnvelope(res.body);
  });

  it("GET /api/clinical/patients returns success envelope", async () => {
    const res = await request(app)
      .get("/api/clinical/patients")
      .set(authHeaders("doctor"));
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) assertSuccessEnvelope(res.body);
    if (res.status >= 400) assertErrorEnvelope(res.body);
  });
});

// ─── CONTRACT 2: Error Code Format ───────────────────────────────────────────

describe("QA: Error Code Format Contract (UPPER_SNAKE_CASE)", () => {
  it("401 response has UPPER_SNAKE_CASE code", async () => {
    const res = await request(app).get("/api/bookings");
    expect(res.status).toBe(401);
    assertErrorEnvelope(res.body);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("403 response has UPPER_SNAKE_CASE code", async () => {
    // client role cannot access bookings admin endpoint
    const res = await request(app)
      .get("/api/bookings")
      .set(authHeaders("client"));
    expect(res.status).toBe(403);
    assertErrorEnvelope(res.body);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("404 on unknown API route has UPPER_SNAKE_CASE code", async () => {
    const res = await request(app)
      .get("/api/nonexistent-route-xyz")
      .set(authHeaders());
    expect(res.status).toBe(404);
    assertErrorEnvelope(res.body);
    expect(res.body.error.code).toMatch(/^[A-Z][A-Z0-9_]*$/);
  });

  it("400 validation error has UPPER_SNAKE_CASE code", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set(authHeaders())
      .send({}); // missing required fields
    expect([400, 422, 500]).toContain(res.status);
    if (res.status < 500) assertErrorEnvelope(res.body);
  });
});

// ─── CONTRACT 3: Auth Behavior — 401 vs 403 ──────────────────────────────────

describe("QA: Auth Contract — 401 vs 403", () => {
  it("missing token → 401 UNAUTHORIZED (not 403)", async () => {
    const res = await request(app).get("/api/bookings");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("valid token, wrong role → 403 FORBIDDEN (not 401)", async () => {
    const res = await request(app)
      .get("/api/bookings")
      .set(authHeaders("client"));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("valid token, correct role → not 401 or 403", async () => {
    const res = await request(app)
      .get("/api/bookings")
      .set(authHeaders("business_admin"));
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it("optionalAuth route never returns 401 without token", async () => {
    // /api/discovery is public (no requireAuth)
    const res = await request(app).get("/api/discovery/categories");
    expect(res.status).not.toBe(401);
  });

  it("clinical routes accessible by doctor role", async () => {
    const res = await request(app)
      .get("/api/clinical/patients")
      .set(authHeaders("doctor"));
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it("clinical routes accessible by nurse role", async () => {
    const res = await request(app)
      .get("/api/clinical/patients")
      .set(authHeaders("nurse"));
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it("clinical write routes blocked for caregiver (read-only role)", async () => {
    const res = await request(app)
      .post("/api/clinical/patients")
      .set(authHeaders("caregiver"))
      .send({ customer_id: "test" });
    expect(res.status).toBe(403);
  });
});

// ─── CONTRACT 4: No HTML under /api/* ────────────────────────────────────────

describe("QA: No HTML responses under /api/*", () => {
  it("unknown /api/* route returns JSON not HTML", async () => {
    const res = await request(app)
      .get("/api/does-not-exist-at-all")
      .set(authHeaders());
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.status).toBe(404);
  });
});

// ─── CONTRACT 5: State Machine Transitions ───────────────────────────────────

describe("QA: State Machine Contract", () => {
  describe("Booking transitions", () => {
    it("pending → confirmed is valid", () => {
      expect(isValidTransition(BOOKING_TRANSITIONS, "pending", "confirmed")).toBe(true);
    });
    it("pending → completed is FORBIDDEN", () => {
      expect(isValidTransition(BOOKING_TRANSITIONS, "pending", "completed")).toBe(false);
    });
    it("completed → cancelled is FORBIDDEN", () => {
      expect(isValidTransition(BOOKING_TRANSITIONS, "completed", "cancelled")).toBe(false);
    });
    it("confirmed → checked_in is valid", () => {
      expect(isValidTransition(BOOKING_TRANSITIONS, "confirmed", "checked_in")).toBe(true);
    });
    it("checked_in → in_progress is valid", () => {
      expect(isValidTransition(BOOKING_TRANSITIONS, "checked_in", "in_progress")).toBe(true);
    });
  });

  describe("Emergency transitions", () => {
    it("open → dispatched is valid", () => {
      expect(isValidTransition(EMERGENCY_TRANSITIONS, "open", "dispatched")).toBe(true);
    });
    it("open → resolved is FORBIDDEN", () => {
      expect(isValidTransition(EMERGENCY_TRANSITIONS, "open", "resolved")).toBe(false);
    });
    it("resolved → cancelled is FORBIDDEN", () => {
      expect(isValidTransition(EMERGENCY_TRANSITIONS, "resolved", "cancelled")).toBe(false);
    });
    it("on_scene → resolved is valid", () => {
      expect(isValidTransition(EMERGENCY_TRANSITIONS, "on_scene", "resolved")).toBe(true);
    });
  });

  describe("Delivery transitions", () => {
    it("pending → assigned is valid", () => {
      expect(isValidTransition(DELIVERY_TRANSITIONS, "pending", "assigned")).toBe(true);
    });
    it("pending → delivered is FORBIDDEN", () => {
      expect(isValidTransition(DELIVERY_TRANSITIONS, "pending", "delivered")).toBe(false);
    });
    it("delivered → failed is FORBIDDEN", () => {
      expect(isValidTransition(DELIVERY_TRANSITIONS, "delivered", "failed")).toBe(false);
    });
    it("in_transit → delivered is valid", () => {
      expect(isValidTransition(DELIVERY_TRANSITIONS, "in_transit", "delivered")).toBe(true);
    });
  });

  describe("Subscription transitions", () => {
    it("trialing → active is valid", () => {
      expect(isValidTransition(SUBSCRIPTION_TRANSITIONS, "trialing", "active")).toBe(true);
    });
    it("cancelled → active is FORBIDDEN", () => {
      expect(isValidTransition(SUBSCRIPTION_TRANSITIONS, "cancelled", "active")).toBe(false);
    });
    it("expired → active is FORBIDDEN", () => {
      expect(isValidTransition(SUBSCRIPTION_TRANSITIONS, "expired", "active")).toBe(false);
    });
  });
});

// ─── CONTRACT 6: success field always present ─────────────────────────────────

describe("QA: success field always present in API responses", () => {
  it("error response always has success: false", async () => {
    const res = await request(app).get("/api/bookings"); // no auth
    expect(res.body).toHaveProperty("success", false);
  });

  it("no response under /api/* is missing the success field", async () => {
    const endpoints = [
      { method: "get", path: "/api/bookings", headers: authHeaders() },
      { method: "get", path: "/api/emergency/requests", headers: authHeaders() },
      { method: "get", path: "/api/clinical/patients", headers: authHeaders("doctor") },
    ];
    for (const ep of endpoints) {
      const res = await (request(app) as any)[ep.method](ep.path).set(ep.headers);
      expect(res.body).toHaveProperty("success");
    }
  });
});
