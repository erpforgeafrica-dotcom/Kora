import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { BadRequestError, NotFoundError } from "../../middleware/enhancedErrorHandler.js";
import { requireRole } from "../../middleware/rbac.js";
import { respondSuccess, respondError, respondList } from "../../shared/response.js";
import { BOOKING_TRANSITIONS, isValidTransition } from "../../shared/stateMachines.js";

export const bookingsRoutes = Router();

/**
 * Canonical v1.2 Bookings CRUD (organization_id scoped).
 *
 * This endpoint family is the operational backbone of the platform workflow.
 * List responses are shaped for existing frontend `useCrud` parsing:
 * - list returns `{ bookings: [...] }`
 */

bookingsRoutes.get("/", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const rows = await queryDb(
      `select b.id::text,
              b.organization_id::text,
              b.client_id::text,
              b.staff_member_id::text as staff_id,
              b.service_id::text,
              b.start_time::text,
              b.end_time::text,
              b.status,
              b.notes,
              c.full_name as client_name,
              sm.full_name as staff_name,
              s.name as service_name,
              b.created_at::text
         from bookings b
         left join clients c
           on c.id = b.client_id and c.organization_id = b.organization_id
         left join staff_members sm
           on sm.id = b.staff_member_id and sm.organization_id = b.organization_id
         left join services s
           on s.id = b.service_id and s.organization_id = b.organization_id
        where b.organization_id = $1
        order by b.start_time desc
        limit 500`,
      [organizationId]
    );

    return respondList(req, res, rows, { count: rows.length, limit: 500, page: 1 });
  } catch (error) {
    return next(error);
  }
});

bookingsRoutes.post("/", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const serviceId = String(req.body?.service_id ?? "").trim();
    const clientId = req.body?.client_id ? String(req.body.client_id).trim() : null;
    const staffMemberId = req.body?.staff_id
      ? String(req.body.staff_id).trim()
      : req.body?.staff_member_id
        ? String(req.body.staff_member_id).trim()
        : null;
    const startTimeRaw = String(req.body?.start_time ?? "").trim();
    const endTimeRaw = String(req.body?.end_time ?? "").trim();
    const notes = req.body?.notes ? String(req.body.notes) : null;

    if (!serviceId) return next(new BadRequestError("Service id is required", "missing_service_id"));
    if (!startTimeRaw) return next(new BadRequestError("Start time is required", "missing_start_time"));
    if (!endTimeRaw) return next(new BadRequestError("End time is required", "missing_end_time"));

    const startTime = new Date(startTimeRaw);
    const endTime = new Date(endTimeRaw);
    if (Number.isNaN(startTime.getTime())) return next(new BadRequestError("Invalid start time", "invalid_start_time"));
    if (Number.isNaN(endTime.getTime())) return next(new BadRequestError("Invalid end time", "invalid_end_time"));
    if (endTime <= startTime) return next(new BadRequestError("End time must be after start time", "end_time_must_be_after_start_time"));

    const created = await queryDb(
      `insert into bookings (
         id,
         organization_id,
         client_id,
         staff_member_id,
         service_id,
         start_time,
         end_time,
         status,
         notes,
         created_at
       )
       values (gen_random_uuid(), $1, $2, $3, $4, $5::timestamptz, $6::timestamptz, 'pending', $7, now())
       returning id::text, organization_id::text, client_id::text, staff_member_id::text, service_id::text, start_time::text, end_time::text, status, notes, created_at::text`,
      [organizationId, clientId, staffMemberId, serviceId, startTime.toISOString(), endTime.toISOString(), notes]
    );

    return respondSuccess(res, created[0], 201);
  } catch (error) {
    return next(error);
  }
});

bookingsRoutes.patch("/:id", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const updates: string[] = [];
    const params: unknown[] = [];
    let index = 1;

    for (const field of ["status", "notes", "client_id", "service_id"]) {
      if (req.body?.[field] !== undefined) {
        updates.push(`${field} = $${index++}`);
        params.push(req.body[field]);
      }
    }

    // Support both `staff_id` (frontend canonical) and `staff_member_id` (db canonical).
    if (req.body?.staff_id !== undefined) {
      updates.push(`staff_member_id = $${index++}`);
      params.push(req.body.staff_id);
    } else if (req.body?.staff_member_id !== undefined) {
      updates.push(`staff_member_id = $${index++}`);
      params.push(req.body.staff_member_id);
    }
    for (const timeField of ["start_time", "end_time"]) {
      if (req.body?.[timeField] !== undefined) {
        const t = new Date(String(req.body[timeField]));
        if (Number.isNaN(t.getTime())) return next(new BadRequestError("Invalid time value", `invalid_${timeField}`));
        updates.push(`${timeField} = $${index++}::timestamptz`);
        params.push(t.toISOString());
      }
    }

    if (updates.length === 0) return next(new BadRequestError("No updates provided", "no_updates_provided"));

    // Enforce booking state machine when status is being changed
    if (req.body?.status !== undefined) {
      const current = await queryDb(
        `SELECT status FROM bookings WHERE id = $1 AND organization_id = $2`,
        [req.params.id, organizationId]
      );
      if (current[0] && !isValidTransition(BOOKING_TRANSITIONS, current[0].status, req.body.status)) {
        const allowed = BOOKING_TRANSITIONS[current[0].status as keyof typeof BOOKING_TRANSITIONS] ?? [];
        return respondError(res, "INVALID_TRANSITION",
          `Cannot transition booking from '${current[0].status}' to '${req.body.status}'`,
          422, { allowed }
        );
      }
    }

    params.push(organizationId, req.params.id);
    const rows = await queryDb(
      `update bookings
          set ${updates.join(", ")},
              updated_at = now()
        where organization_id = $${index++} and id = $${index}
        returning id::text, status`,
      params
    );

    if (!rows[0]) return next(new NotFoundError("Booking not found", "booking_not_found"));
    return respondSuccess(res, rows[0]);
  } catch (error) {
    return next(error);
  }
});

bookingsRoutes.delete("/:id", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const rows = await queryDb(
      `update bookings
          set status = 'cancelled',
              updated_at = now()
        where organization_id = $1 and id = $2
        returning id::text`,
      [organizationId, req.params.id]
    );
    if (!rows[0]) return next(new NotFoundError("Booking not found", "booking_not_found"));
    return respondSuccess(res, { deleted: true, id: rows[0].id });
  } catch (error) {
    return next(error);
  }
});

// ============ BOOKING-TO-STAFF WORKFLOW ============

/**
 * POST /api/bookings/:bookingId/assign-staff/:staffId
 * Assign staff member to a booking
 */
bookingsRoutes.post("/:bookingId/assign-staff/:staffId", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
    try {
      const organizationId = getRequiredOrganizationId(res);

    const { bookingId, staffId } = req.params;
    const assignmentType = req.body?.assignment_type || "primary";
    const notes = req.body?.notes || null;

    // Verify booking exists and belongs to org
    const bookingRows = await queryDb(
      `SELECT id FROM bookings WHERE id = $1 AND organization_id = $2`,
      [bookingId, organizationId]
    );
      if (!bookingRows[0]) return next(new NotFoundError("Booking not found", "booking_not_found"));

    // Verify staff exists and belongs to org
    const staffRows = await queryDb(
      `SELECT id FROM staff_members WHERE id = $1 AND organization_id = $2`,
      [staffId, organizationId]
    );
      if (!staffRows[0]) return next(new NotFoundError("Staff member not found", "staff_member_not_found"));

    // Create assignment
    const assignment = await queryDb(
      `INSERT INTO booking_staff_assignments 
       (booking_id, staff_member_id, assignment_type, status, assigned_at, notes)
       VALUES ($1, $2, $3, 'assigned', now(), $4)
       RETURNING id::text, booking_id::text, staff_member_id::text, assignment_type, status, assigned_at::text`,
      [bookingId, staffId, assignmentType, notes]
    );

    return respondSuccess(res, assignment[0], 201);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/bookings/:bookingId/assignments
 * Get all staff assignments for a booking
 */
bookingsRoutes.get("/:bookingId/assignments", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { bookingId } = req.params;

    const assignments = await queryDb(
      `SELECT bsa.id::text, bsa.booking_id::text, bsa.staff_member_id::text, bsa.assignment_type, 
              bsa.status, bsa.confirmation_status, bsa.assigned_at::text, bsa.confirmed_at::text, 
              sm.full_name as staff_name, sm.email as staff_email
       FROM booking_staff_assignments bsa
       JOIN bookings b ON b.id = bsa.booking_id AND b.organization_id = $1
       LEFT JOIN staff_members sm ON sm.id = bsa.staff_member_id
       WHERE bsa.booking_id = $2
       ORDER BY bsa.assigned_at DESC`,
      [organizationId, bookingId]
    );

    return respondSuccess(res, assignments);
  } catch (error) {
    return next(error);
  }
});

/**
 * PATCH /api/bookings/:bookingId/assignments/:assignmentId/confirm
 * Confirm staff assignment
 */
bookingsRoutes.patch("/:bookingId/assignments/:assignmentId/confirm", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { assignmentId } = req.params;
    const confirmationStatus = req.body?.confirmation_status || "confirmed";

    const updated = await queryDb(
      `UPDATE booking_staff_assignments
       SET confirmation_status = $3,
           confirmed_at = now(),
           status = CASE WHEN $3 = 'confirmed' THEN 'confirmed' ELSE status END,
           updated_at = now()
       WHERE id = $1
         AND booking_id IN (SELECT id FROM bookings WHERE organization_id = $2)
       RETURNING id::text, status, confirmation_status, confirmed_at::text`,
      [assignmentId, organizationId, confirmationStatus]
    );

    if (!updated[0]) return next(new NotFoundError("Assignment not found", "assignment_not_found"));
    return respondSuccess(res, updated[0]);
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/bookings/:bookingId/staff-preferences
 * Add customer staff preference
 */
bookingsRoutes.post("/:bookingId/staff-preferences", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { bookingId } = req.params;
    const { customer_id, staff_member_id, preference_type, reason, strength } = req.body;

    if (!customer_id || !staff_member_id || !preference_type) {
      return next(new BadRequestError("Customer, staff member, and preference type are required", "missing_required_fields"));
    }

    const preference = await queryDb(
      `INSERT INTO customer_staff_preferences 
       (customer_id, staff_member_id, preference_type, reason, strength)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (customer_id, staff_member_id) DO UPDATE SET
         preference_type = EXCLUDED.preference_type,
         reason = EXCLUDED.reason,
         strength = EXCLUDED.strength
       RETURNING id::text, customer_id::text, staff_member_id::text, preference_type, strength`,
      [customer_id, staff_member_id, preference_type, reason || null, strength || 5]
    );

    return respondSuccess(res, preference[0], 201);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/bookings/:customerId/staff-preferences
 * Get customer staff preferences
 */
bookingsRoutes.get("/:customerId/staff-preferences", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { customerId } = req.params;

    const preferences = await queryDb(
      `SELECT csp.id::text, csp.customer_id::text, csp.staff_member_id::text, csp.preference_type, 
              csp.strength, sm.full_name as staff_name, sm.email as staff_email
       FROM customer_staff_preferences csp
       LEFT JOIN staff_members sm ON sm.id = csp.staff_member_id AND sm.organization_id = $1
       WHERE csp.customer_id = $2
       ORDER BY csp.preference_type DESC, csp.strength DESC`,
      [organizationId, customerId]
    );

    return respondSuccess(res, preferences);
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/bookings/waitlist/add
 * Add customer to booking waitlist
 */
bookingsRoutes.post("/waitlist/add", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { customer_id, service_id, requested_date, requested_time_window, preferred_staff_id, notes } = req.body;

    if (!customer_id || !service_id) {
      return next(new BadRequestError("Customer and service ids are required", "missing_customer_or_service_id"));
    }

    const waitlistEntry = await queryDb(
      `INSERT INTO booking_waitlist 
       (organization_id, customer_id, service_id, preferred_staff_id, requested_date, requested_time_window, 
        position_in_queue, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, 
               (SELECT COALESCE(MAX(position_in_queue), 0) + 1 FROM booking_waitlist WHERE organization_id = $1 AND status = 'waiting'),
               'waiting', $7)
       RETURNING id::text, organization_id::text, customer_id::text, service_id::text, position_in_queue, status`,
      [organizationId, customer_id, service_id, preferred_staff_id || null, requested_date || null, 
       requested_time_window || null, notes || null]
    );

    return respondSuccess(res, waitlistEntry[0], 201);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/bookings/waitlist?status=waiting
 * List waitlist entries
 */
bookingsRoutes.get("/waitlist", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const status = req.query.status as string | undefined;

    let query = `
      SELECT bw.id::text, bw.organization_id::text, bw.customer_id::text, bw.service_id::text,
             bw.position_in_queue, bw.status, bw.requested_date, bw.created_at::text,
             c.full_name as customer_name, s.name as service_name
      FROM booking_waitlist bw
      LEFT JOIN clients c ON c.id = bw.customer_id
      LEFT JOIN services s ON s.id = bw.service_id
      WHERE bw.organization_id = $1
    `;
    const params: unknown[] = [organizationId];

    if (status && ["waiting", "notified", "confirmed", "expired", "cancelled"].includes(status)) {
      query += ` AND bw.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY bw.position_in_queue ASC`;

    const rows = await queryDb(query, params);
    return respondSuccess(res, rows);
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/bookings/shifts/add
 * Add staff shift
 */
bookingsRoutes.post("/shifts/add", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { staff_member_id, shift_date, shift_start, shift_end, break_duration_minutes, assigned_location } = req.body;

    if (!staff_member_id || !shift_date || !shift_start || !shift_end) {
      return next(new BadRequestError("Staff, date, start, and end are required for shifts", "missing_required_shift_fields"));
    }

    const shift = await queryDb(
      `INSERT INTO staff_shifts 
       (organization_id, staff_member_id, shift_date, shift_start, shift_end, 
        break_duration_minutes, assigned_location, shift_status)
       VALUES ($1, $2, $3::date, $4::time, $5::time, $6, $7, 'scheduled')
       RETURNING id::text, staff_member_id::text, shift_date, shift_start, shift_end, shift_status`,
      [organizationId, staff_member_id, shift_date, shift_start, shift_end, 
       break_duration_minutes || 0, assigned_location || null]
    );

    return respondSuccess(res, shift[0], 201);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/bookings/staff/:staffId/shifts?date=YYYY-MM-DD
 * Get staff shifts for date
 */
bookingsRoutes.get("/staff/:staffId/shifts", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { staffId } = req.params;
    const date = req.query.date as string | undefined;

    let query = `
      SELECT id::text, staff_member_id::text, shift_date, shift_start, shift_end, 
             break_duration_minutes, assigned_location, shift_status
      FROM staff_shifts
      WHERE organization_id = $1 AND staff_member_id = $2
    `;
    const params: unknown[] = [organizationId, staffId];

    if (date) {
      query += ` AND shift_date = $3::date`;
      params.push(date);
    }

    query += ` ORDER BY shift_date DESC, shift_start ASC`;

    const rows = await queryDb(query, params);
    return respondSuccess(res, rows);
  } catch (error) {
    return next(error);
  }
});

