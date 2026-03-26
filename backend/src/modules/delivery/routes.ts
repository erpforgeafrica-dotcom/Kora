import { Router } from "express";
import { requireRole } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { bookingCreateSchema, bookingUpdateSchema, assignmentSchema, podSchema } from "./validators.js";
import * as svc from "./service.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { respondSuccess, respondError, respondList } from "../../shared/response.js";
import { DELIVERY_TRANSITIONS, isValidTransition } from "../../shared/stateMachines.js";

const router = Router();
const dispatchRoles = requireRole("dispatcher", "operations", "business_admin", "platform_admin");

// requireAuth is applied globally in app.ts — do NOT add it here again

router.get("/bookings", dispatchRoles, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const rows = await svc.listBookings(orgId);
    respondList(req, res, rows, { count: rows.length, limit: 200, page: 1 });
  } catch (err) { next(err); }
});

router.post("/bookings", dispatchRoles, validateBody(bookingCreateSchema), async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const row = await svc.createBooking(orgId, req.body);
    respondSuccess(res, row, 201);
  } catch (err) { next(err); }
});

router.patch("/bookings/:id", dispatchRoles, validateBody(bookingUpdateSchema), async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const row = await svc.updateBooking(orgId, req.params.id, req.body);
    if (!row) return respondError(res, "NOT_FOUND", "Delivery booking not found", 404);
    respondSuccess(res, row);
  } catch (err) { next(err); }
});

router.get("/agents", dispatchRoles, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const rows = await svc.listAgents(orgId);
    respondList(req, res, rows, { count: rows.length, limit: 200, page: 1 });
  } catch (err) { next(err); }
});

router.post("/agents", dispatchRoles, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const row = await svc.createAgent(orgId, req.body);
    respondSuccess(res, row, 201);
  } catch (err) { next(err); }
});

router.get("/bookings/:id/assignments", dispatchRoles, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const rows = await svc.listAssignments(orgId, req.params.id);
    respondList(req, res, rows, { count: rows.length, limit: 100, page: 1 });
  } catch (err) { next(err); }
});

router.post("/bookings/:id/assignments", dispatchRoles, validateBody(assignmentSchema), async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const row = await svc.assign(orgId, req.params.id, req.body, res.locals.auth);
    respondSuccess(res, row, 201);
  } catch (err) { next(err); }
});

router.post("/bookings/:id/status", dispatchRoles, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const { status, notes } = req.body;
    if (!status) return respondError(res, "MISSING_STATUS", "Status is required", 400);
    // Enforce delivery state machine
    const current = await svc.getBooking(orgId, req.params.id);
    if (!current) return respondError(res, "NOT_FOUND", "Delivery booking not found", 404);
    if (!isValidTransition(DELIVERY_TRANSITIONS, current.status as any, status)) {
      const allowed = DELIVERY_TRANSITIONS[current.status as keyof typeof DELIVERY_TRANSITIONS] ?? [];
      return respondError(res, "INVALID_TRANSITION",
        `Cannot transition delivery from '${current.status}' to '${status}'`,
        422, { allowed }
      );
    }
    await svc.addStatus(orgId, req.params.id, status, notes);
    res.status(204).end();
  } catch (err) { next(err); }
});

router.post("/bookings/:id/pod", dispatchRoles, validateBody(podSchema), async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const row = await svc.recordPOD(orgId, req.params.id, req.body);
    respondSuccess(res, row, 201);
  } catch (err) { next(err); }
});

export { router as deliveryRoutes };
