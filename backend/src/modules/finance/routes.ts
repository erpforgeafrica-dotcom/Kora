import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { requireRole } from "../../middleware/rbac.js";
import { respondError, respondList, respondSuccess } from "../../shared/response.js";

export const financeRoutes = Router();

const VALID_INVOICE_STATUSES = ["pending", "paid", "overdue", "cancelled"] as const;

// ── KPIs ──────────────────────────────────────────────────────────────────────

financeRoutes.get("/kpis", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);

    const [summary, overdue] = await Promise.all([
      queryDb(
        `SELECT
           COALESCE(SUM(amount_cents) FILTER (WHERE status = 'paid'), 0)::bigint AS revenue_cents,
           COALESCE(SUM(amount_cents) FILTER (WHERE status = 'pending'), 0)::bigint AS pending_cents,
           COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_count,
           COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_count,
           COUNT(*) FILTER (WHERE status = 'overdue')::int AS overdue_count,
           COUNT(*)::int AS total_count
         FROM invoices WHERE organization_id = $1
           AND created_at >= date_trunc('month', now())`,
        [organizationId]
      ),
      queryDb(
        `SELECT COALESCE(SUM(amount_cents),0)::bigint AS overdue_cents
         FROM invoices WHERE organization_id = $1 AND status = 'overdue'`,
        [organizationId]
      ),
    ]);

    const s = summary[0] ?? {};
    const revenueC = Number(s.revenue_cents ?? 0);
    const pendingC = Number(s.pending_cents ?? 0);
    const totalC = revenueC + pendingC;
    const collectionRate = totalC > 0 ? Math.round((revenueC / totalC) * 100) : 0;

    return respondSuccess(res, {
      module: "finance",
      organization_id: organizationId,
      revenue_cents: revenueC,
      pending_cents: pendingC,
      overdue_cents: Number(overdue[0]?.overdue_cents ?? 0),
      paid_count: s.paid_count ?? 0,
      pending_count: s.pending_count ?? 0,
      overdue_count: s.overdue_count ?? 0,
      total_invoices: s.total_count ?? 0,
      collection_rate_pct: collectionRate,
    });
  } catch (err) { return next(err); }
});

// ── Invoices ──────────────────────────────────────────────────────────────────

financeRoutes.get("/invoices", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);

    const status = typeof req.query.status === "string" ? req.query.status : null;
    const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));
    const offset = Math.max(0, Number(req.query.offset ?? 0));

    const params: unknown[] = [organizationId];
    let filter = "";
    if (status && VALID_INVOICE_STATUSES.includes(status as typeof VALID_INVOICE_STATUSES[number])) {
      filter = " AND i.status = $2";
      params.push(status);
    }
    params.push(limit, offset);
    const li = params.length;

    const rows = await queryDb(
      `SELECT i.id::text, i.organization_id::text,
              i.amount_cents, i.tax_amount_cents, i.discount_amount_cents,
              i.status, i.due_date::text, i.created_at::text,
              c.full_name AS client_name, c.email AS client_email
         FROM invoices i
         LEFT JOIN clients c ON c.id = i.client_id AND c.organization_id = i.organization_id
        WHERE i.organization_id = $1${filter}
        ORDER BY i.due_date ASC, i.created_at DESC
        LIMIT $${li - 1} OFFSET $${li}`,
      params
    );
    return respondList(req, res, rows, { count: rows.length, limit, offset });
  } catch (err) { return next(err); }
});

financeRoutes.post("/invoices", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);

    const { client_id, amount_cents, due_date, tax_amount_cents, discount_amount_cents } = req.body;
    if (!amount_cents || !due_date) {
      return respondError(res, "MISSING_AMOUNT_CENTS_OR_DUE_DATE", "Missing amount cents or due date", 400);
    }
    if (!Number.isFinite(Number(amount_cents)) || Number(amount_cents) <= 0) {
      return respondError(res, "INVALID_AMOUNT_CENTS", "Invalid amount cents", 400);
    }
    const dueDate = new Date(due_date);
    if (Number.isNaN(dueDate.getTime())) {
      return respondError(res, "INVALID_DUE_DATE", "Invalid due date", 400);
    }

    const row = await queryDb(
      `INSERT INTO invoices (id, organization_id, client_id, amount_cents, tax_amount_cents,
         discount_amount_cents, status, due_date)
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,'pending',$6::date)
       RETURNING id::text, organization_id::text, amount_cents, status, due_date::text, created_at::text`,
      [organizationId, client_id ?? null, Number(amount_cents),
       Number(tax_amount_cents ?? 0), Number(discount_amount_cents ?? 0),
       dueDate.toISOString().slice(0, 10)]
    );

    await queryDb(
      `INSERT INTO audit_logs (id, organization_id, actor_id, action, metadata)
       VALUES (gen_random_uuid(),$1,$2,'invoice.created',$3::jsonb)`,
      [organizationId, res.locals.auth?.userId ?? null,
       JSON.stringify({ invoice_id: row[0].id, amount_cents })]
    );

    return respondSuccess(res, row[0], 201);
  } catch (err) { return next(err); }
});

financeRoutes.patch("/invoices/:id/status", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);

    const status = String(req.body.status ?? "");
    if (!VALID_INVOICE_STATUSES.includes(status as typeof VALID_INVOICE_STATUSES[number])) {
      return respondError(res, "INVALID_STATUS", "Invalid status", 400, { valid: VALID_INVOICE_STATUSES });
    }

    const rows = await queryDb(
      `UPDATE invoices SET status = $1
        WHERE id = $2 AND organization_id = $3
        RETURNING id::text, status, due_date::text`,
      [status, req.params.id, organizationId]
    );
    if (!rows[0]) return respondError(res, "INVOICE_NOT_FOUND", "Invoice not found", 404);

    await queryDb(
      `INSERT INTO audit_logs (id, organization_id, actor_id, action, metadata)
       VALUES (gen_random_uuid(),$1,$2,'invoice.status_changed',$3::jsonb)`,
      [organizationId, res.locals.auth?.userId ?? null,
       JSON.stringify({ invoice_id: req.params.id, status })]
    );

    return respondSuccess(res, rows[0]);
  } catch (err) { return next(err); }
});

// ── Payouts ───────────────────────────────────────────────────────────────────

financeRoutes.get("/payouts", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);

    const rows = await queryDb(
      `SELECT p.id::text, p.organization_id::text, p.staff_id::text,
              p.period_start::text, p.period_end::text,
              p.gross_amount_cents, p.commission_rate, p.commission_amount_cents,
              p.net_amount_cents, p.status, p.paid_at::text,
              sm.full_name AS staff_name
         FROM payouts p
         LEFT JOIN staff_members sm ON sm.id = p.staff_id
        WHERE p.organization_id = $1
        ORDER BY p.period_end DESC
        LIMIT 100`,
      [organizationId]
    );
    return respondList(req, res, rows, { count: rows.length, limit: 100, page: 1 });
  } catch (err) { return next(err); }
});

// ── Tax Records ───────────────────────────────────────────────────────────────

financeRoutes.get("/tax", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);

    const rows = await queryDb(
      `SELECT id::text, organization_id::text, tax_period, tax_type,
              taxable_amount_cents, tax_rate, tax_amount_cents, status,
              filed_at::text, created_at::text
         FROM tax_records WHERE organization_id = $1
         ORDER BY created_at DESC LIMIT 50`,
      [organizationId]
    );
    return respondList(req, res, rows, { count: rows.length, limit: 50, page: 1 });
  } catch (err) { return next(err); }
});
