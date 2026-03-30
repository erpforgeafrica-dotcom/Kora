/**
 * Real Integration Test Example - Payments Workflow
 * 
 * This test uses a REAL database (not mocked).
 * It validates actual API contracts and database state changes.
 * 
 * To run:
 *   npm run test -- src/test/payments-real-integration.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { createTestClient, createTestDb, createTestOrgAndUser, generateTestToken } from "./testDbFactory.js";
import type { TestDbConnection } from "./testDbFactory.js";

let db: TestDbConnection;
let app: any;
let testOrgId: string;
let testUserId: string;
let bearerToken: string;
let testClientId: string;

beforeAll(async () => {
  // Initialize test database
  db = await createTestDb();
  
  // Create test organization and user
  const { orgId, userId } = await createTestOrgAndUser(db);
  testOrgId = orgId;
  testUserId = userId;
  
  // Generate JWT token
  bearerToken = generateTestToken(testUserId, testOrgId, "business_admin");
  
  // Create Express app
  app = createApp();
  testClientId = (await createTestClient(db, testOrgId)).id;
});

afterAll(async () => {
  // Clean up
  if (db) {
    await db.teardown();
  }
});

describe("Payments Integration Tests", () => {
  describe("POST /api/payments/intent", () => {
    it("should create payment intent and persist to database", async () => {
      const response = await request(app)
        .post("/api/payments/intent")
        .set("Authorization", `Bearer ${bearerToken}`)
        .set("Content-Type", "application/json")
        .send({
          amount_cents: 50000,
          currency: "USD",
          client_id: testClientId
        });

      // Verify API response
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("data.payment_intent_id");
      expect(response.body).toHaveProperty("data.client_secret");
      
      const paymentIntentId = response.body.data.payment_intent_id;

      // Query REAL database to verify persistence
      const [[transaction]] = await Promise.all([
        db.query(
          `SELECT id, organization_id, amount_cents, currency, status 
           FROM transactions 
           WHERE stripe_payment_intent_id = $1 
           LIMIT 1`,
          [paymentIntentId]
        )
      ]);

      expect(transaction).toBeDefined();
      expect(transaction.organization_id).toBe(testOrgId);
      expect(transaction.amount_cents).toBe(50000);
      expect(transaction.currency).toMatch(/usd/i);
      expect(transaction.status).toMatch(/pending|new/i);
    });

    it("should reject invalid currency", async () => {
      const response = await request(app)
        .post("/api/payments/intent")
        .set("Authorization", `Bearer ${bearerToken}`)
        .set("Content-Type", "application/json")
        .send({
          amount_cents: 50000,
          currency: "INVALID_CURRENCY"
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });

    it("should reject negative amounts", async () => {
      const response = await request(app)
        .post("/api/payments/intent")
        .set("Authorization", `Bearer ${bearerToken}`)
        .set("Content-Type", "application/json")
        .send({
          amount_cents: -1000,
          currency: "USD"
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe("GET /api/payments/transactions", () => {
    it("should list transactions for authenticated user's organization", async () => {
      // Create a transaction first
      await db.query(
        `INSERT INTO transactions (id, organization_id, amount_cents, currency, status, payment_method)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
        [testOrgId, 25000, "USD", "pending", "card"]
      );

      // Fetch transactions
      const response = await request(app)
        .get("/api/payments/transactions")
        .set("Authorization", `Bearer ${bearerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Verify organization isolation
      const allTransactions = response.body.data;
      for (const txn of allTransactions) {
        expect(txn.organization_id ?? txn.tenant_id).toBe(testOrgId);
      }
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/api/payments/transactions")
        .query({ limit: 10, page: 1 })
        .set("Authorization", `Bearer ${bearerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("meta");
    });
  });

  describe("Notification Queue Integration", () => {
    it("should queue notification when payment is processed", async () => {
      const response = await request(app)
        .post("/api/notifications/dispatch")
        .set("Authorization", `Bearer ${bearerToken}`)
        .set("Content-Type", "application/json")
        .send({
          channel: "email",
          payload: {
            subject: "Payment Received",
            recipient: "test@example.com"
          }
        });

      expect(response.status).toBe(202); // Accepted
      expect(response.body.data?.jobId || response.body.data?.queue).toBeDefined();
    });
  });
});
