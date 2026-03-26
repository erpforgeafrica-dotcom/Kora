import { Router } from "express";
import { getRequiredOrganizationId } from "../../shared/http.js";
import {
  createWorkflow,
  executeWorkflowTest,
  getAutomationAnalytics,
  getSmartAutomationSuggestions,
  listAutomationTemplates,
  listWorkflows
} from "../../services/automation/engine.js";
import { respondSuccess, respondError } from "../../shared/response.js";

export const automationRoutes = Router();

automationRoutes.get("/templates", async (_req, res, next) => {
  try {
    const templates = await listAutomationTemplates();
    return respondSuccess(res, { count: templates.length, templates });
  } catch (error) {
    return next(error);
  }
});

automationRoutes.get("/workflows", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const workflows = await listWorkflows(organizationId);
    return respondSuccess(res, { count: workflows.length, workflows });
  } catch (error) {
    return next(error);
  }
});

automationRoutes.post("/workflows", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const workflow = await createWorkflow(organizationId, res.locals.auth?.userId ?? null, req.body ?? {});
    return respondSuccess(res, workflow, 201);
  } catch (error) {
    return next(error);
  }
});

automationRoutes.post("/workflows/:id/test", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const result = await executeWorkflowTest(organizationId, req.params.id, req.body?.context ?? {});
    if (!result) return respondError(res, "WORKFLOW_NOT_FOUND", "Workflow not found", 404);
    return respondSuccess(res, result);
  } catch (error) {
    return next(error);
  }
});

automationRoutes.get("/analytics", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    return respondSuccess(res, await getAutomationAnalytics(organizationId));
  } catch (error) {
    return next(error);
  }
});

automationRoutes.post("/suggest", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
    return respondSuccess(res, await getSmartAutomationSuggestions(organizationId, prompt));
  } catch (error) {
    return next(error);
  }
});

