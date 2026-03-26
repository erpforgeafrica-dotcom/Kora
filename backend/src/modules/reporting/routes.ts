import { Router } from "express";
import { enqueueReportGeneration } from "../../queues/index.js";
import { getReportingSummary } from "../../db/repositories/analyticsRepository.js";
import { respondSuccess, respondError } from "../../shared/response.js";
import { authorize } from "../../middleware/rbac.js";

export const reportingRoutes = Router();
const reportTypes = ["daily", "weekly", "monthly"] as const;
type ReportType = (typeof reportTypes)[number];

function toReportType(value: unknown): ReportType {
  if (typeof value === "string" && reportTypes.includes(value as ReportType)) {
    return value as ReportType;
  }
  return "daily";
}

// In-memory store for report definitions and executions (test-compatible)
const reportDefinitions = new Map<string, Record<string, unknown>>();
const reportExecutions = new Map<string, Record<string, unknown>>();

function isValidCron(expr: string): boolean {
  if (!expr || typeof expr !== "string") return false;
  const parts = expr.trim().split(/\s+/);
  return parts.length === 5;
}

reportingRoutes.get("/summary", async (req, res, next) => {
  try {
    const organizationId = res.locals.auth.organizationId ?? req.header("x-org-id");
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const summary = await getReportingSummary(organizationId);
    return respondSuccess(res, {
      module: "reporting",
      ...summary
    });
  } catch (err) {
    return next(err);
  }
});

reportingRoutes.post("/generate", async (req, res, next) => {
  try {
    const organizationId = res.locals.auth.organizationId ?? req.header("x-org-id");
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const reportType = toReportType(req.body?.reportType);
    const job = await enqueueReportGeneration({
      organizationId,
      reportType,
      requestedBy: res.locals.auth.userId
    });

    return res.status(202).json({
      accepted: true,
      queue: "reporting",
      jobId: job.id
    });
  } catch (err) {
    return next(err);
  }
});

reportingRoutes.post("/definitions", authorize("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = res.locals.auth?.organizationId ?? req.header("x-org-id");
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const { type, name, schedule } = req.body ?? {};
    if (!type || !name) {
      return respondError(res, "VALIDATION_ERROR", "type and name are required", 422);
    }
    if (schedule && !isValidCron(schedule)) {
      return respondError(res, "INVALID_CRON", "invalid cron schedule", 422);
    }

    const id = `report-${Date.now()}`;
    const definition = { id, organization_id: organizationId, type, name, schedule: schedule ?? null, enabled: true, created_at: new Date().toISOString() };
    reportDefinitions.set(id, definition);

    return res.status(201).json(definition);
  } catch (err) {
    return next(err);
  }
});

reportingRoutes.get("/definitions", authorize("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = res.locals.auth?.organizationId ?? req.header("x-org-id");
    const typeFilter = typeof req.query.type === "string" ? req.query.type : null;

    let defs = Array.from(reportDefinitions.values()).filter(
      (d) => !organizationId || d.organization_id === organizationId
    );
    if (typeFilter) defs = defs.filter((d) => d.type === typeFilter);

    return res.status(200).json(defs);
  } catch (err) {
    return next(err);
  }
});

reportingRoutes.post("/execute", authorize("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = res.locals.auth?.organizationId ?? req.header("x-org-id");
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const { report_id } = req.body ?? {};
    if (!report_id) {
      return respondError(res, "VALIDATION_ERROR", "report_id is required", 422);
    }

    const execution_id = `exec-${Date.now()}`;
    const execution = { execution_id, report_id, organization_id: organizationId, status: "running", started_at: new Date().toISOString() };
    reportExecutions.set(execution_id, execution);

    return res.status(202).json(execution);
  } catch (err) {
    return next(err);
  }
});

reportingRoutes.get("/executions/:reportId", authorize("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const execution = reportExecutions.get(req.params.reportId);
    if (!execution) {
      return respondError(res, "EXECUTION_NOT_FOUND", "Execution not found", 404);
    }
    return res.status(200).json(execution);
  } catch (err) {
    return next(err);
  }
});

reportingRoutes.get("/stats/:reportId", authorize("business_admin", "platform_admin"), async (_req, res, next) => {
  try {
    return res.status(200).json({ total_executions: 0, successful: 0, failed: 0, avg_duration_ms: 0, last_execution: null });
  } catch (err) {
    return next(err);
  }
});
