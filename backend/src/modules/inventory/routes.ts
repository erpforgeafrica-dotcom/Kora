import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { createItemSchema, updateItemSchema, movementSchema, createBatchSchema } from "./validators.js";
import * as svc from "./service.js";
import { getRequiredOrganizationId } from "../../shared/org.js";
import { respondSuccess, respondError } from "../../shared/response.js";

const router = Router();
const canManageInventory = requireRole("inventory_manager", "business_admin", "platform_admin");

router.use(requireAuth);

router.get("/items", async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const items = await svc.listItems(orgId);
    respondSuccess(res, items);
  } catch (err) {
    next(err);
  }
});

router.get("/items/:id", async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const item = await svc.getItem(orgId, req.params.id);
    if (!item) return respondError(res, "NOT_FOUND", "Not found", 404);
    respondSuccess(res, item);
  } catch (err) {
    next(err);
  }
});

router.post("/items", canManageInventory, validateBody(createItemSchema), async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const created = await svc.createItem(orgId, req.body, res.locals.auth);
    respondSuccess(res, created, 201);
  } catch (err) {
    next(err);
  }
});

router.patch("/items/:id", canManageInventory, validateBody(updateItemSchema), async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const updated = await svc.updateItem(orgId, req.params.id, req.body);
    if (!updated) return respondError(res, "NOT_FOUND", "Not found", 404);
    respondSuccess(res, updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/items/:id", canManageInventory, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    await svc.deleteItem(orgId, req.params.id);
    return respondSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

router.get("/movements", canManageInventory, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const movements = await svc.listMovements(orgId, req.query.item_id as string | undefined);
    respondSuccess(res, movements);
  } catch (err) {
    next(err);
  }
});

router.post("/movements", canManageInventory, validateBody(movementSchema), async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const created = await svc.createMovement(orgId, req.body, res.locals.auth);
    respondSuccess(res, created, 201);
  } catch (err) {
    next(err);
  }
});

router.get("/alerts/low-stock", canManageInventory, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const alerts = await svc.listLowStock(orgId);
    respondSuccess(res, alerts);
  } catch (err) {
    next(err);
  }
});

// New reservation endpoints (Phase 2)
router.post("/reservations", canManageInventory, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const { booking_id, requirements } = req.body;
    const reservations = await svc.reserveForBooking(orgId, booking_id, requirements);
    respondSuccess(res, reservations, 201);
  } catch (err) {
    next(err);
  }
});

router.patch("/reservations/:id/consume", canManageInventory, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const consumed = await svc.consumeReservation(orgId, req.params.id);
    return respondSuccess(res, consumed);
  } catch (err) {
    next(err);
  }
});

router.post("/alerts/reorder", canManageInventory, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const alerts = await svc.generateReorderAlerts(orgId);
    respondSuccess(res, { generated: alerts.length });
  } catch (err) {
    next(err);
  }
});

// Stock batches CRUD (Phase 2 complete)
router.get("/batches", canManageInventory, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const itemId = req.query.item_id as string | undefined;
    const batches = await svc.listBatches(orgId, itemId);
    respondSuccess(res, batches);
  } catch (err) {
    next(err);
  }
});

router.post("/batches", canManageInventory, validateBody(createBatchSchema), async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const batch = await svc.createBatch(orgId, req.body);
    respondSuccess(res, batch, 201);
  } catch (err) {
    next(err);
  }
});

export { router as inventoryRoutes };
