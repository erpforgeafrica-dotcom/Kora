import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import {
  respondError,
  respondNotFound,
  respondSuccess,
  respondValidationError,
} from "../../shared/response.js";
import {
  BOOKING_TRANSITIONS,
  assertValidTransition,
  type BookingStatus,
} from "../../shared/stateMachines.js";
import { WorkflowEngine } from "../../workflows/WorkflowEngine.js";

export const bookingWorkflowRoutes = Router();

const workflowEngine = new WorkflowEngine();

async function getBooking(organizationId: string, bookingId: string) {
  const rows = await queryDb<{
    id: string;
    status: BookingStatus;
  }>(
    `
      SELECT id::text, status
      FROM bookings
      WHERE id = $1
        AND organization_id = $2
      LIMIT 1
    `,
    [bookingId, organizationId]
  );

  return rows[0] ?? null;
}

async function recordWorkflowTransition(
  organizationId: string,
  bookingId: string,
  status: BookingStatus,
  triggeredBy: string,
  reason?: string,
  metadata: Record<string, unknown> = {}
) {
  const result = await workflowEngine.transitionState({
    organizationId,
    entityType: "booking",
    entityId: bookingId,
    toState: status,
    triggeredBy,
    reason,
    metadata,
  });

  if (!result.success) {
    throw new Error(result.error ?? "Failed to record booking workflow transition");
  }
}

function ensureTransition(from: BookingStatus, to: BookingStatus) {
  try {
    assertValidTransition(BOOKING_TRANSITIONS, from, to, "booking");
    return null;
  } catch (error) {
    return (error as Error).message;
  }
}

bookingWorkflowRoutes.get("/calendar", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { start_date, end_date, view = "month" } = req.query;

    const bookings = await queryDb(
      `SELECT b.id, b.start_time, b.end_time, b.status, b.amount_cents,
              c.full_name as client_name,
              sm.full_name as staff_name,
              s.name as service_name,
              s.duration_minutes
       FROM bookings b
       LEFT JOIN clients c ON b.client_id = c.id
       LEFT JOIN staff_members sm ON b.staff_member_id = sm.id
       LEFT JOIN services s ON b.service_id = s.id
       WHERE b.organization_id = $1
         AND b.start_time >= $2
         AND b.start_time <= $3
       ORDER BY b.start_time ASC`,
      [
        organizationId,
        start_date || new Date().toISOString(),
        end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      ]
    );

    return respondSuccess(res, { view, bookings });
  } catch (err) {
    return next(err);
  }
});

bookingWorkflowRoutes.post("/:id/status", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { id } = req.params;
    const { status, reason } = req.body as { status?: BookingStatus; reason?: string };

    if (typeof status !== "string" || !(status in BOOKING_TRANSITIONS)) {
      return respondValidationError(res, "Invalid booking status", {
        allowed: Object.keys(BOOKING_TRANSITIONS),
      });
    }

    const booking = await getBooking(organizationId, id);
    if (!booking) {
      return respondNotFound(res, "Booking not found");
    }

    const transitionError = ensureTransition(booking.status, status);
    if (transitionError) {
      return respondError(res, "INVALID_TRANSITION", transitionError, 422);
    }

    await queryDb(
      `UPDATE bookings
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2
         AND organization_id = $3`,
      [status, id, organizationId]
    );

    await recordWorkflowTransition(
      organizationId,
      id,
      status,
      res.locals.auth?.userId ?? "api",
      reason,
      { source: "bookingWorkflowRoutes.status" }
    );

    return respondSuccess(res, { updated: true, status });
  } catch (err) {
    return next(err);
  }
});

bookingWorkflowRoutes.post("/:id/reschedule", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { id } = req.params;
    const { start_time, staff_member_id } = req.body;

    if (!start_time) {
      return respondError(res, "START_TIME_REQUIRED", "Start time is required", 400);
    }

    const bookings = await queryDb<{ duration_minutes: number }>(
      `SELECT duration_minutes FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.id = $1 AND b.organization_id = $2`,
      [id, organizationId]
    );

    if (bookings.length === 0) {
      return respondNotFound(res, "Booking not found");
    }

    const duration = bookings[0].duration_minutes;
    const endTime = new Date(new Date(start_time).getTime() + duration * 60000).toISOString();

    const updates: string[] = ["start_time = $1", "end_time = $2", "status = 'confirmed'"];
    const params: unknown[] = [start_time, endTime];
    let paramIndex = 3;

    if (staff_member_id) {
      updates.push(`staff_member_id = $${paramIndex++}`);
      params.push(staff_member_id);
    }

    params.push(id, organizationId);

    await queryDb(
      `UPDATE bookings
       SET ${updates.join(", ")},
           updated_at = NOW()
       WHERE id = $${paramIndex++}
         AND organization_id = $${paramIndex}`,
      params
    );

    return respondSuccess(res, { rescheduled: true, start_time, end_time: endTime });
  } catch (err) {
    return next(err);
  }
});

bookingWorkflowRoutes.get("/:id/timeline", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const timeline = await queryDb(
      `SELECT wt.to_state AS status,
              wt.reason,
              wt.created_at AS changed_at,
              wt.triggered_by AS changed_by_name
       FROM workflow_transitions wt
       WHERE wt.organization_id = $1
         AND wt.entity_type = 'booking'
         AND wt.entity_id = $2
       ORDER BY wt.created_at ASC`,
      [organizationId, req.params.id]
    );

    return respondSuccess(res, { timeline });
  } catch (err) {
    return next(err);
  }
});

bookingWorkflowRoutes.post("/:id/checkin", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { id } = req.params;
    const { qr_code, location } = req.body;

    const booking = await getBooking(organizationId, id);
    if (!booking) {
      return respondNotFound(res, "Booking not found");
    }

    const transitionError = ensureTransition(booking.status, "checked_in");
    if (transitionError) {
      return respondError(res, "INVALID_TRANSITION", transitionError, 422);
    }

    await queryDb(
      `UPDATE bookings
       SET status = 'checked_in',
           checked_in_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
         AND organization_id = $2`,
      [id, organizationId]
    );

    await recordWorkflowTransition(
      organizationId,
      id,
      "checked_in",
      res.locals.auth?.userId ?? "api",
      "Booking checked in",
      {
        qr_code: qr_code ?? null,
        location: location ?? null,
        source: "bookingWorkflowRoutes.checkin",
      }
    );

    return respondSuccess(res, { checked_in: true, status: "checked_in" });
  } catch (err) {
    return next(err);
  }
});

bookingWorkflowRoutes.post("/:id/start", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { id } = req.params;
    const booking = await getBooking(organizationId, id);

    if (!booking) {
      return respondNotFound(res, "Booking not found");
    }

    const transitionError = ensureTransition(booking.status, "in_progress");
    if (transitionError) {
      return respondError(res, "INVALID_TRANSITION", transitionError, 422);
    }

    await queryDb(
      `UPDATE bookings
       SET status = 'in_progress',
           updated_at = NOW()
       WHERE id = $1
         AND organization_id = $2`,
      [id, organizationId]
    );

    await recordWorkflowTransition(
      organizationId,
      id,
      "in_progress",
      res.locals.auth?.userId ?? "api",
      "Service started",
      { source: "bookingWorkflowRoutes.start" }
    );

    return respondSuccess(res, { started: true, status: "in_progress" });
  } catch (err) {
    return next(err);
  }
});

bookingWorkflowRoutes.post("/:id/checkout", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { id } = req.params;
    const { photos, signature } = req.body;
    const booking = await getBooking(organizationId, id);

    if (!booking) {
      return respondNotFound(res, "Booking not found");
    }

    const transitionError = ensureTransition(booking.status, "completed");
    if (transitionError) {
      return respondError(res, "INVALID_TRANSITION", transitionError, 422);
    }

    await queryDb(
      `UPDATE bookings
       SET status = 'completed',
           updated_at = NOW()
       WHERE id = $1
         AND organization_id = $2`,
      [id, organizationId]
    );

    await recordWorkflowTransition(
      organizationId,
      id,
      "completed",
      res.locals.auth?.userId ?? "api",
      "Booking completed",
      {
        photos: photos ?? [],
        signature: signature ?? null,
        source: "bookingWorkflowRoutes.checkout",
      }
    );

    return respondSuccess(res, { checked_out: true, status: "completed" });
  } catch (err) {
    return next(err);
  }
});
