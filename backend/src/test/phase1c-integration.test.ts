import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { queryDb } from "../db/client.js";
import { randomUUID } from "crypto";

/**
 * Phase 1C Integration Tests
 * Uses x-test-* headers for auth injection (NODE_ENV=test bypass).
 */

const TEST_ORG_ID = randomUUID();
const TEST_USER_ID = randomUUID();

const TEST_HEADERS: Record<string, string> = {
  "x-test-user-id": TEST_USER_ID,
  "x-test-role": "business_admin",
  "x-test-org-id": TEST_ORG_ID,
};

let staffId: string;
let staffId2: string;
const serviceId = "00000000-0000-0000-0000-000000000001";
let bookingId: string;
let customerId: string;
let availabilityRuleId: string;
let availabilityExceptionId: string;
let assignmentId: string;

beforeAll(async () => {
  // Seed org + service so FK constraints pass
  try {
    await queryDb(
      `INSERT INTO organizations (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
      [TEST_ORG_ID, "Test Org"]
    );
  } catch (_) {}
  try {
    await queryDb(
      `INSERT INTO services (id, organization_id, name, duration_minutes, price_cents, currency, is_active)
       VALUES ($1, $2, 'Test Service', 60, 5000, 'GBP', true) ON CONFLICT (id) DO NOTHING`,
      [serviceId, TEST_ORG_ID]
    );
  } catch (_) {}
  customerId = "00000000-0000-0000-0000-000000000002";
});

afterAll(async () => {
  try {
    await queryDb(
      `DELETE FROM booking_staff_assignments WHERE booking_id IN
       (SELECT id FROM bookings WHERE organization_id = $1)`,
      [TEST_ORG_ID]
    );
    await queryDb(`DELETE FROM bookings WHERE organization_id = $1`, [TEST_ORG_ID]);
    await queryDb(`DELETE FROM staff_members WHERE organization_id = $1`, [TEST_ORG_ID]);
    await queryDb(`DELETE FROM organizations WHERE id = $1`, [TEST_ORG_ID]);
  } catch (_) {}
});

describe("Phase 1C: Staff Management", () => {
  it("POST /api/staff - Create staff member", async () => {
    const res = await request(app)
      .post("/api/staff")
      .set(TEST_HEADERS)
      .send({
        full_name: "Dr. John Smith",
        email: "john@test.local",
        phone: "+1-555-0001",
        role: "practitioner",
        specializations: ["massage", "relaxation"],
        bio: "Experienced practitioner",
        hourly_rate: 75,
        commission_percentage: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.email).toBe("john@test.local");
    expect(res.body.data.role).toBe("practitioner");
    staffId = res.body.data.id;
  });

  it("GET /api/staff - List staff members", async () => {
    const res = await request(app).get("/api/staff").set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/staff/:id - Get staff details", async () => {
    const res = await request(app).get(`/api/staff/${staffId}`).set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(staffId);
    expect(res.body.data).toHaveProperty("skills");
    expect(res.body.data).toHaveProperty("services");
  });

  it("PATCH /api/staff/:id - Update staff member", async () => {
    const res = await request(app)
      .patch(`/api/staff/${staffId}`)
      .set(TEST_HEADERS)
      .send({ bio: "Senior practitioner with 10+ years experience" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bio).toContain("Senior");
  });

  it("POST /api/staff - Create second staff member", async () => {
    const res = await request(app)
      .post("/api/staff")
      .set(TEST_HEADERS)
      .send({ full_name: "Sarah Johnson", email: "sarah@test.local", role: "receptionist" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    staffId2 = res.body.data.id;
  });

  it("GET /api/staff?role=practitioner - Filter by role", async () => {
    const res = await request(app).get("/api/staff?role=practitioner").set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.data.some((s: any) => s.role === "practitioner")).toBe(true);
  });

  it("GET /api/staff?status=active - Filter by status", async () => {
    const res = await request(app).get("/api/staff?status=active").set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.data.every((s: any) => s.status === "active")).toBe(true);
  });
});

describe("Phase 1C: Staff Skills", () => {
  it("POST /api/staff/:id/skills - Add skill", async () => {
    const res = await request(app)
      .post(`/api/staff/${staffId}/skills`)
      .set(TEST_HEADERS)
      .send({ skill_name: "Swedish Massage", proficiency_level: "expert" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.skill_name).toBe("Swedish Massage");
    expect(res.body.data.proficiency_level).toBe("expert");
  });

  it("GET /api/staff/:id/skills - List skills", async () => {
    const res = await request(app).get(`/api/staff/${staffId}/skills`).set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty("skill_name");
  });

  it("POST /api/staff/:id/skills - Add multiple skills", async () => {
    await request(app)
      .post(`/api/staff/${staffId}/skills`)
      .set(TEST_HEADERS)
      .send({ skill_name: "Deep Tissue", proficiency_level: "advanced" });
    const res = await request(app).get(`/api/staff/${staffId}/skills`).set(TEST_HEADERS);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Phase 1C: Service Assignments", () => {
  it("POST /api/staff/:id/services - Assign service", async () => {
    const res = await request(app)
      .post(`/api/staff/${staffId}/services`)
      .set(TEST_HEADERS)
      .send({ service_id: serviceId, can_perform_independently: true, min_experience_hours: 100 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service_id).toBe(serviceId);
  });

  it("GET /api/staff/:id/services - List assigned services", async () => {
    const res = await request(app).get(`/api/staff/${staffId}/services`).set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("DELETE /api/staff/:id/services/:serviceId - Remove service assignment", async () => {
    const res = await request(app)
      .delete(`/api/staff/${staffId}/services/${serviceId}`)
      .set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.removed).toBe(true);
  });
});

describe("Phase 1C: Availability Rules", () => {
  it("PUT /api/staff/:id/availability/rules - Create availability rule", async () => {
    const res = await request(app)
      .put(`/api/staff/${staffId}/availability/rules`)
      .set(TEST_HEADERS)
      .send({
        day_of_week: 1,
        start_time: "09:00",
        end_time: "17:00",
        break_start: "12:00",
        break_end: "13:00",
        max_appointments_per_day: 8,
        is_active: true,
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.day_of_week).toBe(1);
    expect(res.body.data.start_time).toBe("09:00:00");
    availabilityRuleId = res.body.data.id;
  });

  it("GET /api/staff/:id/availability/rules - List rules", async () => {
    const res = await request(app)
      .get(`/api/staff/${staffId}/availability/rules`)
      .set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty("day_of_week");
  });

  it("PUT /api/staff/:id/availability/rules - Update rule for different day", async () => {
    const res = await request(app)
      .put(`/api/staff/${staffId}/availability/rules`)
      .set(TEST_HEADERS)
      .send({ day_of_week: 2, start_time: "10:00", end_time: "18:00", is_active: true });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.day_of_week).toBe(2);
  });
});

describe("Phase 1C: Availability Exceptions", () => {
  it("POST /api/staff/:id/availability/exceptions - Add holiday", async () => {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 7);
    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + 5);
    const res = await request(app)
      .post(`/api/staff/${staffId}/availability/exceptions`)
      .set(TEST_HEADERS)
      .send({
        exception_type: "holiday",
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        reason: "Vacation",
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.exception_type).toBe("holiday");
    availabilityExceptionId = res.body.data.id;
  });

  it("POST /api/staff/:id/availability/exceptions - Add day off", async () => {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 1);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(23, 59, 59, 999);
    const res = await request(app)
      .post(`/api/staff/${staffId}/availability/exceptions`)
      .set(TEST_HEADERS)
      .send({
        exception_type: "day_off",
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        reason: "Personal day",
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.exception_type).toBe("day_off");
  });

  it("GET /api/staff/:id/availability/exceptions - List exceptions", async () => {
    const res = await request(app)
      .get(`/api/staff/${staffId}/availability/exceptions`)
      .set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe("Phase 1C: Availability Queries", () => {
  it("GET /api/staff/:id/available-slots?date=YYYY-MM-DD - Get available slots", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    const res = await request(app)
      .get(`/api/staff/${staffId}/available-slots?date=${dateStr}`)
      .set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("data");
    expect(res.body.data.date).toBe(dateStr);
  });

  it("GET /api/staff/:id/day-schedule?date=YYYY-MM-DD - Get day schedule", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    const res = await request(app)
      .get(`/api/staff/${staffId}/day-schedule?date=${dateStr}`)
      .set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("date");
    expect(res.body.data).toHaveProperty("day_of_week");
    expect(res.body.data).toHaveProperty("recurring_rule");
    expect(res.body.data).toHaveProperty("exceptions");
  });

  it("GET /api/staff/:id/conflicts - List conflicts", async () => {
    const res = await request(app)
      .get(`/api/staff/${staffId}/conflicts`)
      .set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("data");
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  it("POST /api/staff/:id/check-availability - Check time window", async () => {
    const startTime = new Date();
    startTime.setHours(14, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(15, 0, 0, 0);
    const res = await request(app)
      .post(`/api/staff/${staffId}/check-availability`)
      .set(TEST_HEADERS)
      .send({ start_time: startTime.toISOString(), end_time: endTime.toISOString() });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("is_available");
    expect(typeof res.body.data.is_available).toBe("boolean");
  });
});

describe("Phase 1C: Booking-to-Staff Workflow", () => {
  it("POST /api/bookings/:bookingId/assign-staff/:staffId - Assign staff", async () => {
    const bookingRes = await request(app)
      .post("/api/bookings")
      .set(TEST_HEADERS)
      .send({
        service_id: serviceId,
        start_time: new Date(Date.now() + 86400000).toISOString(),
        end_time: new Date(Date.now() + 90000000).toISOString(),
      });

    if (bookingRes.status === 201) {
      bookingId = bookingRes.body.data.id;
    }

    const res = await request(app)
      .post(`/api/bookings/${bookingId}/assign-staff/${staffId}`)
      .set(TEST_HEADERS)
      .send({ assignment_type: "primary", notes: "Primary provider for this service" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.assignment_type).toBe("primary");
    assignmentId = res.body.data.id;
  });

  it("GET /api/bookings/:bookingId/assignments - Get assignments", async () => {
    const res = await request(app)
      .get(`/api/bookings/${bookingId}/assignments`)
      .set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("PATCH /api/bookings/:bookingId/assignments/:assignmentId/confirm - Confirm assignment", async () => {
    const res = await request(app)
      .patch(`/api/bookings/${bookingId}/assignments/${assignmentId}/confirm`)
      .set(TEST_HEADERS)
      .send({ confirmation_status: "confirmed" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.confirmation_status).toBe("confirmed");
  });

  it("POST /api/bookings/:bookingId/staff-preferences - Add preference", async () => {
    const res = await request(app)
      .post(`/api/bookings/${bookingId}/staff-preferences`)
      .set(TEST_HEADERS)
      .send({
        customer_id: customerId,
        staff_member_id: staffId,
        preference_type: "preferred",
        reason: "Great service",
        strength: 9,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.preference_type).toBe("preferred");
  });

  it("GET /api/bookings/:customerId/staff-preferences - Get preferences", async () => {
    const res = await request(app)
      .get(`/api/bookings/${customerId}/staff-preferences`)
      .set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /api/bookings/waitlist/add - Add to waitlist", async () => {
    const res = await request(app)
      .post("/api/bookings/waitlist/add")
      .set(TEST_HEADERS)
      .send({
        customer_id: customerId,
        service_id: serviceId,
        requested_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        requested_time_window: "morning",
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("position_in_queue");
    expect(res.body.data.status).toBe("waiting");
  });

  it("GET /api/bookings/waitlist - List waitlist", async () => {
    const res = await request(app).get("/api/bookings/waitlist").set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/bookings/waitlist?status=waiting - Filter by status", async () => {
    const res = await request(app).get("/api/bookings/waitlist?status=waiting").set(TEST_HEADERS);
    expect(res.status).toBe(200);
  });

  it("POST /api/bookings/shifts/add - Add shift", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    const res = await request(app)
      .post("/api/bookings/shifts/add")
      .set(TEST_HEADERS)
      .send({
        staff_member_id: staffId,
        shift_date: dateStr,
        shift_start: "09:00",
        shift_end: "17:00",
        break_duration_minutes: 60,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.shift_status).toBe("scheduled");
  });

  it("GET /api/bookings/staff/:staffId/shifts - Get shifts", async () => {
    const res = await request(app)
      .get(`/api/bookings/staff/${staffId}/shifts`)
      .set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/bookings/staff/:staffId/shifts?date=YYYY-MM-DD - Filter by date", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    const res = await request(app)
      .get(`/api/bookings/staff/${staffId}/shifts?date=${dateStr}`)
      .set(TEST_HEADERS);
    expect(res.status).toBe(200);
  });
});

describe("Phase 1C: Staff Archival", () => {
  it("DELETE /api/staff/:id - Archive staff member", async () => {
    const res = await request(app).delete(`/api/staff/${staffId2}`).set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("archived");
  });

  it("GET /api/staff?status=archived - Filter archived staff", async () => {
    const res = await request(app).get("/api/staff?status=archived").set(TEST_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.data.some((s: any) => s.status === "archived")).toBe(true);
  });
});
