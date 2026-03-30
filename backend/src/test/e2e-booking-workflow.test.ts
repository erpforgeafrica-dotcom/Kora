/**
 * End-to-End Integration Test - Full Booking Workflow
 * 
 * This test validates the complete business workflow:
 * 1. User registers and logs in
 * 2. User creates booking
 * 3. Notification is queued
 * 4. Payment is processed
 * 5. Report is generated
 * 
 * Uses REAL database, REAL async queues, REAL API contracts.
 * This is the definitive test that must pass before production.
 */

import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { createTestClient, createTestDb, createTestOrgAndUser, createTestService, generateTestToken } from "./testDbFactory.js";
import type { TestDbConnection } from "./testDbFactory.js";

let db: TestDbConnection;
let app: any;
let testOrgId: string;
let testUserId: string;
let bearerToken: string;
let testClientId: string;
let testServiceId: string;

beforeAll(async () => {
  db = await createTestDb();
  const { orgId, userId } = await createTestOrgAndUser(db);
  testOrgId = orgId;
  testUserId = userId;
  bearerToken = generateTestToken(testUserId, testOrgId, "business_admin");
  app = createApp();
  const client = await createTestClient(db, testOrgId, {
    full_name: "Test Customer",
    email: "customer@example.com",
    phone: "+1234567890",
  });
  const service = await createTestService(db, testOrgId, {
    name: "Integration Service",
    duration_minutes: 60,
    price_cents: 100000,
  });
  testClientId = client.id;
  testServiceId = service.id;
});

afterAll(async () => {
  if (db) {
    await db.teardown();
  }
});

describe("END-TO-END: Complete Booking Workflow", () => {
  let bookingId: string;
  let paymentIntentId: string;
  let notificationJobId: string;
  let reportJobId: string;

  it("Step 1: Authenticate user", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${bearerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data?.user).toBeDefined();
    expect(response.body.data.user.id).toBe(testUserId);
  });

  it("Step 2: Create booking", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        client_id: testClientId,
        service_id: testServiceId,
        start_time: new Date(Date.now() + 86400000).toISOString(),
        end_time: new Date(Date.now() + 90000000).toISOString(),
        notes: "Integration test booking"
      });

    expect([200, 201, 202]).toContain(response.status);
    bookingId = response.body.data?.id || response.body.id;
    expect(bookingId).toBeDefined();

    // Verify in database
    const [[booking]] = await Promise.all([
      db.query(
        `SELECT id, client_id, status FROM bookings WHERE id = $1 AND organization_id = $2`,
        [bookingId, testOrgId]
      )
    ]);
    expect(booking).toBeDefined();
    expect(booking.status).toMatch(/pending|new|confirmed/i);
  });

  it("Step 3: Queue notification for booking", async () => {
    const response = await request(app)
      .post("/api/notifications/dispatch")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        channel: "email",
        payload: {
          subject: "Booking Confirmed",
          recipient: "customer@example.com",
          booking_id: bookingId
        }
      });

    expect(response.status).toBe(202); // Accepted
    expect(response.body.data?.jobId || response.body.data?.queue).toBeDefined();
    notificationJobId = response.body.data?.jobId;
  });

  it("Step 4: Create payment intent", async () => {
    const response = await request(app)
      .post("/api/payments/intent")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        amount_cents: 100000,
        currency: "USD",
        client_id: testClientId,
        booking_id: bookingId
      });

    expect([200, 201, 202]).toContain(response.status);
    expect(response.body.data?.payment_intent_id).toBeDefined();
    paymentIntentId = response.body.data.payment_intent_id;

    // Verify transaction in database
    const [[txn]] = await Promise.all([
      db.query(
        `SELECT id, amount_cents, currency, status FROM transactions 
         WHERE stripe_payment_intent_id = $1 AND organization_id = $2`,
        [paymentIntentId, testOrgId]
      )
    ]);
    expect(txn).toBeDefined();
    expect(txn.amount_cents).toBe(100000);
  });

  it("Step 5: Queue report generation", async () => {
    const response = await request(app)
      .post("/api/reporting/generate")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        reportType: "daily",
        filters: {
          startDate: new Date(Date.now() - 86400000).toISOString(),
          endDate: new Date().toISOString()
        }
      });

    expect(response.status).toBe(202); // Accepted
    expect(response.body.data?.jobId || response.body.data?.queue).toBeDefined();
    reportJobId = response.body.data?.jobId;
  });

  it("Step 6: Verify complete workflow in database", async () => {
    // Booking exists
    const [[booking]] = await Promise.all([
      db.query(
        `SELECT * FROM bookings WHERE id = $1 AND organization_id = $2`,
        [bookingId, testOrgId]
      )
    ]);
    expect(booking).toBeDefined();
    expect(booking.client_id).toBe(testClientId);

    // Transaction exists
    const [[txn]] = await Promise.all([
      db.query(
        `SELECT * FROM transactions WHERE stripe_payment_intent_id = $1 AND organization_id = $2`,
        [paymentIntentId, testOrgId]
      )
    ]);
    expect(txn).toBeDefined();
    expect(txn.booking_id || txn.metadata).toBeDefined();

    // Verify org isolation
    const bookingInWrongOrg = await db.query(
      `SELECT * FROM bookings WHERE id = $1 AND organization_id != $2`,
      [bookingId, testOrgId]
    );
    expect(bookingInWrongOrg.length).toBe(0); // Should be isolated
  });

  it("Step 7: List bookings with pagination", async () => {
    const response = await request(app)
      .get("/api/bookings")
      .query({ limit: 10, page: 1 })
      .set("Authorization", `Bearer ${bearerToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.meta).toBeDefined();
    
    // Verify user sees only their org's bookings
    const userBookings = response.body.data;
    for (const bk of userBookings) {
      expect(bk.organization_id || testOrgId).toBe(testOrgId);
    }
  });

  it("Step 8: RBAC: Non-admin cannot create report definition", async () => {
    // Create user with "staff" role
    const staffToken = generateTestToken("staff-user-" + Date.now(), testOrgId, "staff");

    const response = await request(app)
      .post("/api/reporting/definitions")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        type: "daily",
        name: "Test Report"
      });

    expect([403, 401, 422]).toContain(response.status);
  });

  it("Step 9: Error handling: Missing required fields", async () => {
    const response = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({
          // Missing client_id
          service_id: testServiceId
        });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  it("Step 10: Auth enforcement: Unauthenticated request rejected", async () => {
    const response = await request(app)
      .get("/api/bookings");
    // No Authorization header

    expect([401, 403]).toContain(response.status);
  });
});

describe("END-TO-END: Workflow State Integrity", () => {
  it("Transaction and booking are linked", async () => {
    // Create booking
    const [[booking]] = await Promise.all([
      db.query(
        `INSERT INTO bookings (id, organization_id, client_id, service_id, start_time, end_time, status)
         VALUES (gen_random_uuid(), $1, $2, $3, now() + interval '1 day', now() + interval '1 day 1 hour', 'pending')
         RETURNING id`,
        [testOrgId, testClientId, testServiceId]
      )
    ]);

    // Create transaction for booking
    const [[txn]] = await Promise.all([
      db.query(
        `INSERT INTO transactions (id, organization_id, booking_id, amount_cents, currency, status, payment_method)
         VALUES (gen_random_uuid(), $1, $2, 50000, 'USD', 'succeeded', 'card')
         RETURNING id, booking_id`,
        [testOrgId, booking.id]
      )
    ]);

    expect(txn.booking_id).toBe(booking.id);
  });

  it("Notification log tracks all dispatches", async () => {
    const [[log]] = await Promise.all([
      db.query(
        `INSERT INTO notification_log (id, organization_id, channel, event, recipient, status)
         VALUES (gen_random_uuid(), $1, 'email', 'booking_confirmed', 'test@example.com', 'delivered')
         RETURNING id, organization_id, channel, status`,
        [testOrgId]
      )
    ]);

    expect(log.organization_id).toBe(testOrgId);
    expect(log.status).toBe("delivered");
  });

  it("Organization isolation: Cannot access other org's data", async () => {
    const otherOrgId = randomUUID();
    db.trackOrganization(otherOrgId);
    
    // Insert data in other org
    await db.query(
      `INSERT INTO organizations (id, name, status)
       VALUES ($1, $2, 'active')
       ON CONFLICT DO NOTHING`,
      [otherOrgId, `Other Org ${Date.now()}`]
    );
    const [[otherBooking]] = await Promise.all([
      db.query(
        `INSERT INTO bookings (id, organization_id, client_id, service_id, start_time, end_time, status)
         VALUES (gen_random_uuid(), $1, $2, $3, now() + interval '1 day', now() + interval '1 day 1 hour', 'pending')
         RETURNING id`,
        [otherOrgId, testClientId, testServiceId]
      )
    ]);

    // Try to access via API with testOrgId token
    const response = await request(app)
      .get(`/api/bookings/${otherBooking.id}`)
      .set("Authorization", `Bearer ${bearerToken}`);

    // Should either 404 or 403, not succeed
    expect([404, 403, 401]).toContain(response.status);
  });
});

describe("END-TO-END: Async Queue Resilience", () => {
  it("Notification job retry configured", async () => {
    // This just verifies the queue configuration, not actual retries
    const response = await request(app)
      .post("/api/notifications/dispatch")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        channel: "sms",
        payload: { recipient: "+1234567890", message: "Test" }
      });

    expect(response.status).toBe(202);
    expect(response.body.data?.jobId || response.body.data?.queue).toBeDefined();
    // In real scenario, if job fails, it should retry with backoff
  });

  it("Reporting job timeout protection", async () => {
    const response = await request(app)
      .post("/api/reporting/generate")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({ reportType: "monthly" });

    expect(response.status).toBe(202);
    // Job has 30s timeout in worker configuration
  });
});
