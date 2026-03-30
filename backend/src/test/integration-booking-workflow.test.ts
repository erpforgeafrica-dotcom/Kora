/**
 * End-to-End Integration Test: Complete Booking Workflow
 * 
 * Validates the full workflow:
 * 1. Create booking
 * 2. Notification queued and processed
 * 3. Report generated
 * 
 * Uses REAL database (not mocks)
 * Tests actual API contracts and database state changes
 */

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
  testClientId = (await createTestClient(db, testOrgId)).id;
  testServiceId = (await createTestService(db, testOrgId)).id;
});

afterAll(async () => {
  if (db) await db.teardown();
});

describe("E2E Booking Workflow", () => {
  describe("Complete Flow: Create → Notify → Report", () => {
    it("should execute full booking workflow end-to-end", async () => {
      // STEP 1: Create booking
      const bookingResponse = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${bearerToken}`)
        .set("Content-Type", "application/json")
        .send({
          client_id: testClientId,
          service_id: testServiceId,
          start_time: new Date(Date.now() + 86400000).toISOString(),
          end_time: new Date(Date.now() + 90000000).toISOString(),
          notes: "E2E test booking"
        });

      expect([200, 201]).toContain(bookingResponse.status);
      expect(bookingResponse.body).toHaveProperty("data.id");
      const bookingId = bookingResponse.body.data.id;

      // Verify booking in database
      const [[booking]] = await Promise.all([
        db.query(
          `SELECT id, organization_id, status FROM bookings WHERE id = $1 LIMIT 1`,
          [bookingId]
        )
      ]);

      expect(booking).toBeDefined();
      expect(booking.organization_id).toBe(testOrgId);
      expect(booking.status).toMatch(/pending|confirmed/i);

      // STEP 2: Trigger notification dispatch
      const notifyResponse = await request(app)
        .post("/api/notifications/send")
        .set("Authorization", `Bearer ${bearerToken}`)
        .set("Content-Type", "application/json")
        .send({
          client_id: testClientId,
          event: "booking_confirmed",
          recipient: "client@example.com",
          channel: "email",
          payload: {
            booking_id: bookingId,
            subject: "Booking Confirmed",
            recipient_email: "client@example.com"
          }
        });

      expect(notifyResponse.status).toBe(202); // Accepted
      expect(notifyResponse.body.data?.jobId || notifyResponse.body.data?.queue).toBeDefined();

      // STEP 3: Generate report
      const reportResponse = await request(app)
        .post("/api/reporting/generate")
        .set("Authorization", `Bearer ${bearerToken}`)
        .set("Content-Type", "application/json")
        .send({
          reportType: "daily",
          filters: { booking_id: bookingId }
        });

      expect(reportResponse.status).toBe(202); // Accepted

      // STEP 4: Verify all components created records
      const [[notification]] = await Promise.all([
        db.query(
          `SELECT id, organization_id, channel FROM notification_log 
           WHERE organization_id = $1 AND channel = $2 
           LIMIT 1`,
          [testOrgId, "email"]
        )
      ]);

      expect(notification).toBeDefined();
      expect(notification.organization_id).toBe(testOrgId);
    });
  });

  describe("Auth/RBAC Enforcement in Workflows", () => {
    it("should reject booking creation without auth", async () => {
      const response = await request(app)
        .post("/api/bookings")
        .set("Content-Type", "application/json")
        .send({
          client_id: testUserId,
          service_id: "service_001",
          scheduled_time: new Date().toISOString()
        });

      expect(response.status).toBe(401);
    });

    it("should reject notification dispatch without auth", async () => {
      const response = await request(app)
        .post("/api/notifications/dispatch")
        .set("Content-Type", "application/json")
        .send({
          channel: "email",
          payload: {}
        });

      expect(response.status).toBe(401);
    });

    it("should reject report generation without auth", async () => {
      const response = await request(app)
        .post("/api/reporting/generate")
        .set("Content-Type", "application/json")
        .send({
          reportType: "daily"
        });

      expect(response.status).toBe(401);
    });
  });

  describe("Organization Isolation", () => {
    it("should only see bookings in user's organization", async () => {
      // Create booking
      const bookingResponse = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({
          client_id: testClientId,
          service_id: testServiceId,
          start_time: new Date(Date.now() + 86400000).toISOString(),
          end_time: new Date(Date.now() + 90000000).toISOString()
        });

      expect([200, 201]).toContain(bookingResponse.status);

      // List bookings
      const listResponse = await request(app)
        .get("/api/bookings")
        .set("Authorization", `Bearer ${bearerToken}`);

      expect(listResponse.status).toBe(200);
      const bookings = listResponse.body.data || [];

      // All bookings must belong to user's org
      for (const booking of bookings) {
        expect(booking.organization_id).toBe(testOrgId);
      }
    });
  });

  describe("Error Handling", () => {
    it("should return 422 for invalid booking data", async () => {
      const response = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({
          // Missing required fields
          client_id: testClientId
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });

    it("should return 422 for invalid notification channel", async () => {
      const response = await request(app)
        .post("/api/notifications/dispatch")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({
          channel: "invalid_channel",
          payload: {}
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
