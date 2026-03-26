import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { leadCreateSchema, leadUpdateSchema, dealCreateSchema, dealUpdateSchema, activityCreateSchema, qualifySchema } from "./validators.js";
import * as svc from "./service.js";
import { getRequiredOrganizationId } from "../../shared/org.js";
import { respondSuccess, respondError } from "../../shared/response.js";

const router = Router();
const salesRoles = requireRole("sales_manager", "sales_agent", "business_admin", "platform_admin");

router.use(requireAuth);

// Leads
router.get("/leads", salesRoles, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const rows = await svc.listLeads(orgId);
    respondSuccess(res, rows);
  } catch (err) { next(err); }
});

router.post("/leads", salesRoles, validateBody(leadCreateSchema), async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const row = await svc.createLead(orgId, req.body, res.locals.auth);
    respondSuccess(res, row, 201);
  } catch (err) { next(err); }
});

router.patch("/leads/:id", salesRoles, validateBody(leadUpdateSchema), async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const row = await svc.updateLead(orgId, req.params.id, req.body);
    if (!row) return respondError(res, "LEAD_NOT_FOUND", "Lead not found", 404);
    respondSuccess(res, row);
  } catch (err) { next(err); }
});

// Deals
router.get("/deals", salesRoles, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const rows = await svc.listDeals(orgId);
    respondSuccess(res, rows);
  } catch (err) { next(err); }
});

router.post("/deals", salesRoles, validateBody(dealCreateSchema), async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const row = await svc.createDeal(orgId, req.body, res.locals.auth);
    respondSuccess(res, row, 201);
  } catch (err) { next(err); }
});

router.patch("/deals/:id", salesRoles, validateBody(dealUpdateSchema), async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const row = await svc.updateDeal(orgId, req.params.id, req.body);
    if (!row) return respondError(res, "DEAL_NOT_FOUND", "Deal not found", 404);
    respondSuccess(res, row);
  } catch (err) { next(err); }
});

// Activities
router.get("/activities", salesRoles, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const rows = await svc.listActivities(orgId);
    respondSuccess(res, rows);
  } catch (err) { next(err); }
});

router.post("/activities", salesRoles, validateBody(activityCreateSchema), async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const row = await svc.createActivity(orgId, req.body, res.locals.auth);
    respondSuccess(res, row, 201);
  } catch (err) { next(err); }
});

router.patch("/activities/:id/complete", salesRoles, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const row = await svc.completeActivity(orgId, req.params.id);
    if (!row) return respondError(res, "ACTIVITY_NOT_FOUND", "Activity not found", 404);
    respondSuccess(res, row);
  } catch (err) { next(err); }
});

// Phase 3 CRM workflows
router.post("/leads/:id/qualify", salesRoles, validateBody(qualifySchema), async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const { score, notes } = req.body;
    const lead = await svc.qualifyLead(orgId, req.params.id, score, notes);
    respondSuccess(res, lead);
  } catch (err) { next(err); }
});

router.post("/leads/:id/convert", salesRoles, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const { account_id } = req.body;
    const result = await svc.convertToContact(orgId, req.params.id, account_id);
    respondSuccess(res, result, 201);
  } catch (err) { next(err); }
});

router.get("/pipeline", salesRoles, async (req, res, next) => {
  try {
    const orgId = getRequiredOrganizationId(res);
    const stages = await svc.getPipelineStages(orgId);
    respondSuccess(res, stages);
  } catch (err) { next(err); }
});

export { router as crmRoutesV2, router as crmRoutes };
