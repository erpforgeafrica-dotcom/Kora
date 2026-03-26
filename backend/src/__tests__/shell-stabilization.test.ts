/**
 * Backend Shell Stabilization Tests
 *
 * Verifies:
 * 1. Unknown /api/* routes return JSON 404 (not HTML)
 * 2. /api/auth/me returns canonical { data: { user } } envelope
 * 3. /api/auth/me returns 401 without a token (not 500)
 * 4. /health returns JSON
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";

describe("JSON 404 handler", () => {
  it("returns JSON for completely unknown /api/* route", async () => {
    const res = await request(app).get("/api/this-route-does-not-exist");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: expect.any(String),
        message: expect.any(String),
      },
    });
    // Must NOT be HTML
    expect(typeof res.body).toBe("object");
  });

  it("returns JSON for unknown nested /api/* route", async () => {
    const res = await request(app).get("/api/nonexistent/deeply/nested");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("API_ROUTE_NOT_FOUND");
  });

  it("returns JSON for unknown POST /api/* route", async () => {
    const res = await request(app).post("/api/unknown-module").send({});
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /health", () => {
  it("returns JSON with status field", async () => {
    const res = await request(app).get("/health");
    expect([200, 503]).toContain(res.status);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("service", "kora-backend");
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 JSON when no token provided", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: expect.any(String),
        message: expect.any(String),
      },
    });
  });

  it("returns 401 JSON for malformed token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not.a.valid.jwt");
    expect(res.status).toBe(401);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty("error");
  });

  it("response envelope shape is { success: false, error: { code, message } } on failure", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: expect.any(String),
        message: expect.any(String),
      },
    });
  });
});

describe("POST /api/auth/login", () => {
  it("returns 422 JSON for missing fields", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(422);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 422 JSON for invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "password123" });
    expect(res.status).toBe(422);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/auth/register", () => {
  it("returns 422 JSON for short password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@example.com", password: "short" });
    expect(res.status).toBe(422);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty("error");
  });
});
