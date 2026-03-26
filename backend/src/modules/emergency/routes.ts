import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { requireRole } from "../../middleware/rbac.js";
import { respondSuccess, respondError, respondList } from "../../shared/response.js";

export const emergencyRoutes = Router();

const VALID_SEVERITIES = ["critical", "high", "medium", "low"] as const;
const VALID_STATUSES   = ["open", "dispatched", "en_route", "on_scene", "resolved", "cancelled"] as const;

// State machine — forbidden transitions are anything not in this map
const STATUS_TRANSITIONS: Record<string, string[]> = {
  open:       ["dispatched", "cancelled"],
  dispatched: ["en_route",   "cancelled"],
  en_route:   ["on_scene",   "cancelled"],
  on_scene:   ["resolved",   "cancelled"],
  resolved:   [],
  cancelled:  [],
};

const dispatchRoles = requireRole("business_admin", "platform_admin", "operations");
const readRoles     = requireRole("business_admin", "platform_admin", "operations", "staff", "dispatcher");

// ── Emergency Requests ────────────────────────────────────────────────────────

emergencyRoutes.get("/requests", readRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const status = typeof req.query.status === "string" ? req.query.status : null;
    const params: unknown[] = [organizationId];
    let filter = "";
    if (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      filter = " AND er.status = $2";
      params.push(status);
    }
    const rows = await queryDb(
      `SELECT er.id::text, er.organization_id::text, er.customer_id::text,
              er.request_type, er.location_lat, er.location_lng, er.address,
              er.severity, er.caller_name, er.caller_phone, er.status,
              er.assigned_unit_id::text, er.response_time_seconds, er.notes,
              er.created_at::text, er.resolved_at::text,
              c.full_name AS caller_client_name,
              du.unit_name AS assigned_unit_name
         FROM emergency_requests er
         LEFT JOIN clients c ON c.id = er.customer_id
         LEFT JOIN dispatch_units du ON du.id = er.assigned_unit_id
        WHERE er.organization_id = $1${filter}
        ORDER BY
          CASE er.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
          er.created_at DESC
        LIMIT 200`,
      params
    );
    return respondList(req, res, rows, { count: rows.length, limit: 200, page: 1 });
  } catch (err) { return next(err); }
});

emergencyRoutes.post("/requests", readRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { request_type, severity, address, location_lat, location_lng,
            caller_name, caller_phone, customer_id, notes } = req.body;
    if (!request_type) return respondError(res, "MISSING_REQUEST_TYPE", "Request type is required", 400);
    if (severity && !VALID_SEVERITIES.includes(severity)) return respondError(res, "INVALID_SEVERITY", "Invalid severity", 400);
    const row = await queryDb(
      `INSERT INTO emergency_requests
         (organization_id, customer_id, request_type, location_lat, location_lng,
          address, severity, caller_name, caller_phone, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'open',$10)
       RETURNING id::text, organization_id::text, request_type, severity, status,
                 caller_name, address, created_at::text`,
      [organizationId, customer_id ?? null, request_type,
       location_lat ?? null, location_lng ?? null, address ?? null,
       severity ?? "high", caller_name ?? null, caller_phone ?? null, notes ?? null]
    );
    await queryDb(
      `INSERT INTO audit_logs (id, organization_id, actor_id, action, metadata)
       VALUES (gen_random_uuid(),$1,$2,'emergency_request.created',$3::jsonb)`,
      [organizationId, res.locals.auth?.userId ?? null,
       JSON.stringify({ request_id: row[0].id, severity: row[0].severity })]
    );
    return respondSuccess(res, row[0], 201);
  } catch (err) { return next(err); }
});

emergencyRoutes.patch("/requests/:id/status", dispatchRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const newStatus = String(req.body.status ?? "");
    if (!VALID_STATUSES.includes(newStatus as typeof VALID_STATUSES[number])) {
      return respondError(res, "INVALID_STATUS", "Invalid status", 400, { valid: VALID_STATUSES });
    }
    // Enforce state machine
    const current = await queryDb(
      `SELECT status FROM emergency_requests WHERE id = $1 AND organization_id = $2`,
      [req.params.id, organizationId]
    );
    if (!current[0]) return respondError(res, "REQUEST_NOT_FOUND", "Request not found", 404);
    const allowed = STATUS_TRANSITIONS[current[0].status] ?? [];
    if (!allowed.includes(newStatus)) {
      return respondError(res, "INVALID_TRANSITION", `Cannot transition from ${current[0].status} to ${newStatus}`, 422, { allowed });
    }
    const resolvedAt = newStatus === "resolved" ? "now()" : "resolved_at";
    const rows = await queryDb(
      `UPDATE emergency_requests
          SET status = $1, resolved_at = ${resolvedAt}
        WHERE id = $2 AND organization_id = $3
        RETURNING id::text, status, resolved_at::text`,
      [newStatus, req.params.id, organizationId]
    );
    return respondSuccess(res, rows[0]);
  } catch (err) { return next(err); }
});

emergencyRoutes.post("/requests/:id/assign", dispatchRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { unit_id } = req.body;
    if (!unit_id) return respondError(res, "MISSING_UNIT_ID", "Unit ID is required", 400);
    const unit = await queryDb(
      `SELECT id FROM dispatch_units WHERE id = $1 AND organization_id = $2`,
      [unit_id, organizationId]
    );
    if (!unit[0]) return respondError(res, "DISPATCH_UNIT_NOT_FOUND", "Dispatch unit not found", 404);
    const rows = await queryDb(
      `UPDATE emergency_requests
          SET assigned_unit_id = $1, status = 'dispatched'
        WHERE id = $2 AND organization_id = $3
        RETURNING id::text, status, assigned_unit_id::text`,
      [unit_id, req.params.id, organizationId]
    );
    if (!rows[0]) return respondError(res, "REQUEST_NOT_FOUND", "Request not found", 404);
    await queryDb(
      `UPDATE dispatch_units SET status = 'dispatched', last_updated = now() WHERE id = $1`,
      [unit_id]
    );
    return respondSuccess(res, rows[0]);
  } catch (err) { return next(err); }
});

// ── Dispatch Units ────────────────────────────────────────────────────────────

emergencyRoutes.get("/units", readRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb(
      `SELECT du.id::text, du.organization_id::text, du.unit_name, du.unit_type,
              du.staff_id::text, du.current_lat, du.current_lng, du.status,
              du.last_updated::text,
              sm.full_name AS staff_name
         FROM dispatch_units du
         LEFT JOIN staff_members sm ON sm.id = du.staff_id
        WHERE du.organization_id = $1
        ORDER BY du.status, du.unit_name`,
      [organizationId]
    );
    return respondList(req, res, rows, { count: rows.length, limit: 100, page: 1 });
  } catch (err) { return next(err); }
});

emergencyRoutes.post("/units", dispatchRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { unit_name, unit_type, staff_id } = req.body;
    if (!unit_name) return respondError(res, "MISSING_UNIT_NAME", "Unit name is required", 400);
    const row = await queryDb(
      `INSERT INTO dispatch_units (organization_id, unit_name, unit_type, staff_id, status)
       VALUES ($1,$2,$3,$4,'available')
       RETURNING id::text, unit_name, unit_type, status`,
      [organizationId, unit_name, unit_type ?? null, staff_id ?? null]
    );
    return respondSuccess(res, row[0], 201);
  } catch (err) { return next(err); }
});

emergencyRoutes.patch("/units/:id/location", readRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { lat, lng, status } = req.body;
    const updates: string[] = ["last_updated = now()"];
    const params: unknown[] = [];
    let i = 1;
    if (lat !== undefined) { updates.push(`current_lat = $${i++}`); params.push(lat); }
    if (lng !== undefined) { updates.push(`current_lng = $${i++}`); params.push(lng); }
    if (status && VALID_STATUSES.includes(status)) { updates.push(`status = $${i++}`); params.push(status); }
    params.push(organizationId, req.params.id);
    const rows = await queryDb(
      `UPDATE dispatch_units SET ${updates.join(", ")}
        WHERE organization_id = $${i++} AND id = $${i}
        RETURNING id::text, current_lat, current_lng, status, last_updated::text`,
      params
    );
    if (!rows[0]) return respondError(res, "UNIT_NOT_FOUND", "Unit not found", 404);
    return respondSuccess(res, rows[0]);
  } catch (err) { return next(err); }
});

// ── Incident Reports ──────────────────────────────────────────────────────────

emergencyRoutes.get("/incidents", dispatchRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb(
      `SELECT ir.id::text, ir.organization_id::text, ir.emergency_request_id::text,
              ir.report_type, ir.description, ir.actions_taken, ir.outcome,
              ir.reported_by::text, ir.created_at::text,
              sm.full_name AS reporter_name,
              er.request_type AS incident_type, er.severity
         FROM incident_reports ir
         LEFT JOIN staff_members sm ON sm.id = ir.reported_by
         LEFT JOIN emergency_requests er ON er.id = ir.emergency_request_id
        WHERE ir.organization_id = $1
        ORDER BY ir.created_at DESC
        LIMIT 200`,
      [organizationId]
    );
    return respondSuccess(res, { module: "emergency", count: rows.length, incidents: rows });
  } catch (err) { return next(err); }
});

emergencyRoutes.post("/incidents", readRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { emergency_request_id, report_type, description, actions_taken, outcome } = req.body;
    const reported_by = res.locals.auth?.userId ?? req.body.reported_by ?? null;
    const row = await queryDb(
      `INSERT INTO incident_reports
         (organization_id, emergency_request_id, report_type, description, actions_taken, outcome, reported_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id::text, organization_id::text, emergency_request_id::text,
                 report_type, description, outcome, created_at::text`,
      [organizationId, emergency_request_id ?? null, report_type ?? null,
       description ?? null, actions_taken ?? null, outcome ?? null, reported_by]
    );
    await queryDb(
      `INSERT INTO audit_logs (id, organization_id, actor_id, action, metadata)
       VALUES (gen_random_uuid(),$1,$2,'incident_report.created',$3::jsonb)`,
      [organizationId, reported_by, JSON.stringify({ incident_id: row[0].id })]
    );
    return respondSuccess(res, row[0], 201);
  } catch (err) { return next(err); }
});

// ── Active incidents summary ──────────────────────────────────────────────────

emergencyRoutes.get("/incidents/active", readRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb(
      `SELECT
         COUNT(*) FILTER (WHERE status NOT IN ('resolved','cancelled'))::int AS active_count,
         COUNT(*) FILTER (WHERE severity = 'critical' AND status NOT IN ('resolved','cancelled'))::int AS critical_count,
         COUNT(*) FILTER (WHERE severity = 'high' AND status NOT IN ('resolved','cancelled'))::int AS high_count,
         COUNT(*) FILTER (WHERE status = 'open')::int AS unassigned_count
       FROM emergency_requests WHERE organization_id = $1`,
      [organizationId]
    );
    return respondSuccess(res, { module: "emergency", organization_id: organizationId, ...rows[0] });
  } catch (err) { return next(err); }
});
