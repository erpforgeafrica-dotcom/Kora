import type { Request, Response } from "express";
import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { requireRole } from "../../middleware/rbac.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import {
  respondError, respondList, respondNotFound,
  respondSuccess, respondValidationError,
} from "../../shared/response.js";

export const supportRoutes = Router();

const SUPPORT_STATUSES = ["open","assigned","in_progress","resolved","closed","escalated"] as const;
const SUPPORT_PRIORITIES = ["low","medium","high","critical"] as const;

type SupportStatus = (typeof SUPPORT_STATUSES)[number];
type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];

const SUPPORT_TRANSITIONS: Record<SupportStatus, SupportStatus[]> = {
  open:        ["assigned","in_progress","resolved","closed","escalated"],
  assigned:    ["in_progress","resolved","closed","escalated"],
  in_progress: ["resolved","closed","escalated"],
  resolved:    ["closed","open"],
  closed:      ["open"],
  escalated:   ["assigned","in_progress","resolved","closed"],
};

type SupportCaseRow = {
  id: string; organization_id: string; customer_id: string | null;
  customer_name: string; channel: string; event: string; description: string;
  status: SupportStatus; priority: SupportPriority;
  assignee_id: string | null; assignee_name: string | null;
  resolution_note: string | null; created_at: string; updated_at: string;
  resolved_at?: string | null; closed_at?: string | null;
};

function isSupportStatus(v: unknown): v is SupportStatus {
  return typeof v === "string" && SUPPORT_STATUSES.includes(v as SupportStatus);
}
function isSupportPriority(v: unknown): v is SupportPriority {
  return typeof v === "string" && SUPPORT_PRIORITIES.includes(v as SupportPriority);
}
function parseLimit(v: unknown) { const n = Number(v); return (!Number.isFinite(n) || n <= 0) ? 20 : Math.min(100, Math.floor(n)); }
function parsePage(v: unknown) { const n = Number(v); return (!Number.isFinite(n) || n <= 0) ? 1 : Math.floor(n); }
function parseStatuses(v: unknown): SupportStatus[] {
  if (typeof v !== "string" || !v.trim()) return [];
  return v.split(",").map(s => s.trim()).filter((s): s is SupportStatus => isSupportStatus(s));
}
function buildOrderBy(sort: unknown) {
  if (typeof sort !== "string") return "st.created_at DESC";
  const [field, dir] = sort.split(":");
  const d = dir?.toLowerCase() === "asc" ? "ASC" : "DESC";
  if (field === "updated_at") return `st.updated_at ${d}`;
  if (field === "priority") return `st.priority ${d}`;
  return `st.created_at ${d}`;
}
function getActorUserId(res: Response) {
  return res.locals.auth?.userId ? String(res.locals.auth.userId) : null;
}

function supportCaseSelectSql() {
  return `
    SELECT st.id::text, st.organization_id::text, st.client_id::text AS customer_id,
      COALESCE(c.full_name, st.customer_name, 'Unknown customer') AS customer_name,
      st.channel, st.event, st.description, st.status, st.priority,
      st.assignee_staff_id::text AS assignee_id, sm.full_name AS assignee_name,
      st.resolution_note, st.created_at::text, st.updated_at::text,
      st.resolved_at::text, st.closed_at::text
    FROM support_tickets st
    LEFT JOIN clients c ON c.id = st.client_id AND c.organization_id = st.organization_id
    LEFT JOIN staff_members sm ON sm.id = st.assignee_staff_id AND sm.organization_id = st.organization_id
  `;
}

async function fetchSupportCase(organizationId: string, ticketId: string) {
  const rows = await queryDb<SupportCaseRow>(
    `${supportCaseSelectSql()} WHERE st.organization_id = $1 AND st.id = $2 LIMIT 1`,
    [organizationId, ticketId]
  );
  return rows[0] ?? null;
}

async function writeSupportEvent(
  organizationId: string, ticketId: string, eventType: string,
  actorUserId: string | null, details: Record<string, unknown> = {}
) {
  await queryDb(
    `INSERT INTO support_ticket_events (id, organization_id, support_ticket_id, event_type, actor_user_id, details, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, NOW())`,
    [organizationId, ticketId, eventType, actorUserId, JSON.stringify(details)]
  );
}

function ensureSupportTransition(from: SupportStatus, to: SupportStatus): string | null {
  const allowed = SUPPORT_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    return `Invalid support transition: ${from} -> ${to}. Allowed: [${allowed.join(", ")}]`;
  }
  return null;
}

type UpdateResult =
  | { error: "NOT_FOUND"; payload: string }
  | { error: "INVALID_TRANSITION"; payload: string }
  | { ticket: SupportCaseRow | null };

async function updateTicketStatus(
  organizationId: string, ticketId: string, nextStatus: SupportStatus,
  actorUserId: string | null, extraEventDetails: Record<string, unknown> = {}
): Promise<UpdateResult> {
  const current = await fetchSupportCase(organizationId, ticketId);
  if (!current) return { error: "NOT_FOUND", payload: "Support ticket not found" };

  const transitionError = ensureSupportTransition(current.status, nextStatus);
  if (transitionError) return { error: "INVALID_TRANSITION", payload: transitionError };

  const resolvedAt = nextStatus === "resolved" ? "NOW()" : nextStatus === "open" ? "NULL" : "resolved_at";
  const closedAt   = nextStatus === "closed"   ? "NOW()" : nextStatus === "open" ? "NULL" : "closed_at";

  await queryDb(
    `UPDATE support_tickets SET status=$1, resolved_at=${resolvedAt}, closed_at=${closedAt}, updated_at=NOW()
     WHERE organization_id=$2 AND id=$3`,
    [nextStatus, organizationId, ticketId]
  );
  await writeSupportEvent(organizationId, ticketId, "status_changed", actorUserId, {
    from_status: current.status, to_status: nextStatus, ...extraEventDetails,
  });
  return { ticket: await fetchSupportCase(organizationId, ticketId) };
}

// ── Route handlers ────────────────────────────────────────────────────────────

async function listTicketsHandler(req: Request, res: Response, next: (error?: unknown) => void) {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const limit = parseLimit(req.query.limit);
    const page = parsePage(req.query.page);
    const offset = (page - 1) * limit;
    const statuses = parseStatuses(req.query.status);
    const orderBy = buildOrderBy(req.query.sort);
    const filters = ["st.organization_id = $1"];
    const params: unknown[] = [organizationId];

    if (statuses.length > 0) { filters.push(`st.status = ANY($${params.length + 1}::text[])`); params.push(statuses); }
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      filters.push(`(st.event ILIKE $${params.length + 1} OR st.description ILIKE $${params.length + 1} OR COALESCE(st.customer_name,'') ILIKE $${params.length + 1})`);
      params.push(`%${req.query.search.trim()}%`);
    }

    const where = `WHERE ${filters.join(" AND ")}`;
    const countRows = await queryDb<{ total: string }>(`SELECT COUNT(*)::text AS total FROM support_tickets st ${where}`, params);
    const rows = await queryDb<SupportCaseRow>(
      `${supportCaseSelectSql()} ${where} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    return respondList(req, res, rows, { count: Number(countRows[0]?.total ?? rows.length), limit, page, offset });
  } catch (error) { return next(error); }
}

async function getTicketHandler(req: Request, res: Response, next: (error?: unknown) => void) {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const ticket = await fetchSupportCase(organizationId, req.params.id);
    if (!ticket) return respondNotFound(res, "Support ticket not found");
    return respondSuccess(res, ticket);
  } catch (error) { return next(error); }
}

async function getTimelineHandler(req: Request, res: Response, next: (error?: unknown) => void) {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb(
      `SELECT ste.id::text, ste.event_type, ste.actor_user_id::text, ste.details, ste.created_at::text
       FROM support_ticket_events ste
       WHERE ste.organization_id=$1 AND ste.support_ticket_id=$2 ORDER BY ste.created_at ASC`,
      [organizationId, req.params.id]
    );
    return respondSuccess(res, rows);
  } catch (error) { return next(error); }
}

async function getSummaryHandler(_req: Request, res: Response, next: (error?: unknown) => void) {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb<{ status: string; count: number }>(
      `SELECT status, COUNT(*)::int AS count FROM support_tickets WHERE organization_id=$1 GROUP BY status ORDER BY status ASC`,
      [organizationId]
    );
    return respondSuccess(res, rows);
  } catch (error) { return next(error); }
}

async function createTicketHandler(req: Request, res: Response, next: (error?: unknown) => void) {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const actorUserId = getActorUserId(res);
    const channel = typeof req.body?.channel === "string" ? req.body.channel.trim() : "";
    const event = typeof req.body?.event === "string" ? req.body.event.trim()
      : typeof req.body?.subject === "string" ? req.body.subject.trim() : "manual_case";
    const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
    const customerName = typeof req.body?.customer_name === "string" ? req.body.customer_name.trim() : "";
    const priority = isSupportPriority(req.body?.priority) ? req.body.priority : "medium";
    const customerId = typeof req.body?.customer_id === "string" && req.body.customer_id.trim() ? req.body.customer_id.trim() : null;

    if (!channel) return respondValidationError(res, "Channel is required");
    if (!description) return respondValidationError(res, "Description is required");

    const rows = await queryDb<{ id: string }>(
      `INSERT INTO support_tickets (id, organization_id, client_id, customer_name, channel, event, description, status, priority, created_at, updated_at)
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,'open',$7,NOW(),NOW()) RETURNING id::text`,
      [organizationId, customerId, customerName || null, channel, event, description, priority]
    );
    await writeSupportEvent(organizationId, rows[0].id, "created", actorUserId, { channel, event, priority });
    return respondSuccess(res, await fetchSupportCase(organizationId, rows[0].id), 201);
  } catch (error) { return next(error); }
}

async function assignTicketHandler(req: Request, res: Response, next: (error?: unknown) => void) {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const actorUserId = getActorUserId(res);
    const assigneeId = req.body?.assignee_id;

    if (assigneeId !== null && assigneeId !== undefined && typeof assigneeId !== "string") {
      return respondValidationError(res, "Assignee id must be a string or null");
    }
    if (typeof assigneeId === "string" && assigneeId.trim()) {
      const staffRows = await queryDb<{ id: string }>(
        `SELECT id::text FROM staff_members WHERE organization_id=$1 AND id=$2 LIMIT 1`,
        [organizationId, assigneeId.trim()]
      );
      if (!staffRows[0]) return respondNotFound(res, "Assignee staff member not found");
    }

    const current = await fetchSupportCase(organizationId, req.params.id);
    if (!current) return respondNotFound(res, "Support ticket not found");

    const resolvedAssigneeId = typeof assigneeId === "string" && assigneeId.trim() ? assigneeId.trim() : null;
    await queryDb(
      `UPDATE support_tickets SET assignee_staff_id=$1,
        status=CASE WHEN $1 IS NULL THEN status WHEN status='open' THEN 'assigned' ELSE status END,
        updated_at=NOW() WHERE organization_id=$2 AND id=$3`,
      [resolvedAssigneeId, organizationId, req.params.id]
    );
    await writeSupportEvent(organizationId, req.params.id, "assignee_changed", actorUserId, {
      previous_assignee_id: current.assignee_id, assignee_id: resolvedAssigneeId,
    });
    return respondSuccess(res, await fetchSupportCase(organizationId, req.params.id));
  } catch (error) { return next(error); }
}

async function genericStatusUpdateHandler(req: Request, res: Response, next: (error?: unknown) => void) {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const actorUserId = getActorUserId(res);
    const status = req.body?.status;
    if (!isSupportStatus(status)) return respondValidationError(res, "Invalid support ticket status", { allowed: SUPPORT_STATUSES });

    const result = await updateTicketStatus(organizationId, req.params.id, status, actorUserId);
    if ("error" in result) {
      if (result.error === "NOT_FOUND") return respondNotFound(res, result.payload);
      return respondError(res, "INVALID_TRANSITION", result.payload, 422);
    }
    return respondSuccess(res, result.ticket);
  } catch (error) { return next(error); }
}

async function resolveTicketHandler(req: Request, res: Response, next: (error?: unknown) => void) {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const actorUserId = getActorUserId(res);
    const resolutionNote = typeof req.body?.resolution_note === "string" ? req.body.resolution_note.trim() : "";
    if (!resolutionNote) return respondValidationError(res, "Resolution note is required");

    const current = await fetchSupportCase(organizationId, req.params.id);
    if (!current) return respondNotFound(res, "Support ticket not found");

    const transitionError = ensureSupportTransition(current.status, "resolved");
    if (transitionError) return respondError(res, "INVALID_TRANSITION", transitionError, 422);

    await queryDb(
      `UPDATE support_tickets SET resolution_note=$1, status='resolved', resolved_at=NOW(), updated_at=NOW()
       WHERE organization_id=$2 AND id=$3`,
      [resolutionNote, organizationId, req.params.id]
    );
    await writeSupportEvent(organizationId, req.params.id, "resolved", actorUserId, {
      from_status: current.status, to_status: "resolved", resolution_note: resolutionNote,
    });
    return respondSuccess(res, await fetchSupportCase(organizationId, req.params.id));
  } catch (error) { return next(error); }
}

async function commandTransitionHandler(
  req: Request, res: Response, next: (error?: unknown) => void,
  toStatus: SupportStatus, eventType: string, details: Record<string, unknown> = {}
) {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const actorUserId = getActorUserId(res);
    const result = await updateTicketStatus(organizationId, req.params.id, toStatus, actorUserId, details);
    if ("error" in result) {
      if (result.error === "NOT_FOUND") return respondNotFound(res, result.payload);
      return respondError(res, "INVALID_TRANSITION", result.payload, 422);
    }
    if (eventType !== "status_changed") {
      await writeSupportEvent(organizationId, req.params.id, eventType, actorUserId, details);
    }
    return respondSuccess(res, result.ticket);
  } catch (error) { return next(error); }
}

// ── Route registration ────────────────────────────────────────────────────────

const allRoles = requireRole("platform_admin","business_admin","operations","staff");
const adminOps = requireRole("platform_admin","business_admin","operations");

supportRoutes.get("/", allRoles, (_req, res) => respondSuccess(res, { module: "support", resources: ["cases","tickets","stats","dashboard/summary"] }));

supportRoutes.get("/cases",              allRoles, listTicketsHandler);
supportRoutes.get("/tickets",            allRoles, listTicketsHandler);
supportRoutes.get("/cases/:id",          allRoles, getTicketHandler);
supportRoutes.get("/tickets/:id",        allRoles, getTicketHandler);
supportRoutes.get("/cases/:id/timeline", allRoles, getTimelineHandler);
supportRoutes.get("/tickets/:id/timeline", allRoles, getTimelineHandler);
supportRoutes.get("/stats",              allRoles, getSummaryHandler);
supportRoutes.get("/dashboard/summary",  allRoles, getSummaryHandler);

supportRoutes.post("/cases",   allRoles, createTicketHandler);
supportRoutes.post("/tickets", allRoles, createTicketHandler);

supportRoutes.patch("/cases/:id/assignee",  adminOps, assignTicketHandler);
supportRoutes.post("/tickets/:id/assign",   adminOps, assignTicketHandler);

supportRoutes.patch("/cases/:id/status",    allRoles, genericStatusUpdateHandler);
supportRoutes.post("/cases/:id/resolution", allRoles, resolveTicketHandler);
supportRoutes.post("/tickets/:id/resolve",  allRoles, resolveTicketHandler);

supportRoutes.post("/tickets/:id/escalate", allRoles, (req, res, next) =>
  commandTransitionHandler(req, res, next, "escalated", "escalated", {
    reason: typeof req.body?.reason === "string" ? req.body.reason.trim() : null,
  })
);
supportRoutes.post("/tickets/:id/reopen", allRoles, (req, res, next) =>
  commandTransitionHandler(req, res, next, "open", "reopened")
);
supportRoutes.post("/tickets/:id/close", allRoles, (req, res, next) =>
  commandTransitionHandler(req, res, next, "closed", "closed")
);
