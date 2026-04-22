import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { requireRole } from "../../middleware/rbac.js";
import { respondSuccess, respondError, respondList } from "../../shared/response.js";

export const gdprRoutes = Router();
const adminRoles = requireRole("business_admin", "platform_admin");

// POST /api/gdpr/requests
gdprRoutes.post("/requests", adminRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { client_id, request_type, requested_by, notes } = req.body;
    if (!["export","erasure","rectification"].includes(request_type)) {
      return respondError(res, "INVALID_REQUEST_TYPE", "request_type must be export, erasure, or rectification", 400);
    }
    const row = await queryDb(
      `INSERT INTO gdpr_requests (organization_id, client_id, request_type, requested_by, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING id::text, request_type, status, created_at::text`,
      [organizationId, client_id ?? null, request_type, requested_by ?? null, notes ?? null]
    );
    return respondSuccess(res, row[0], 201);
  } catch (err) { return next(err); }
});

// GET /api/gdpr/requests
gdprRoutes.get("/requests", adminRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb(
      `SELECT id::text, client_id::text, request_type, status, requested_by, completed_at::text, created_at::text
       FROM gdpr_requests WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 100`,
      [organizationId]
    );
    return respondList(req, res, rows, { count: rows.length, limit: 100, page: 1 });
  } catch (err) { return next(err); }
});

// GET /api/gdpr/export/:clientId
gdprRoutes.get("/export/:clientId", adminRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { clientId } = req.params;
    const [client, bookings, transactions, clinicalNotes] = await Promise.all([
      queryDb(`SELECT id::text, full_name, email, phone, created_at::text FROM clients WHERE id=$1 AND organization_id=$2`, [clientId, organizationId]),
      queryDb(`SELECT id::text, start_time::text, end_time::text, status, notes FROM bookings WHERE client_id=$1 AND organization_id=$2 ORDER BY start_time DESC`, [clientId, organizationId]),
      queryDb(`SELECT id::text, amount_cents, currency, status, created_at::text FROM transactions WHERE client_id=$1 AND organization_id=$2 ORDER BY created_at DESC`, [clientId, organizationId]),
      queryDb(`SELECT cn.subjective, cn.objective, cn.assessment, cn.plan, cn.created_at::text
               FROM clinical_notes cn
               JOIN clinical_appointments ca ON ca.id=cn.appointment_id
               JOIN patients p ON p.customer_id=$1
               WHERE cn.organization_id=$2`, [clientId, organizationId]).catch(() => [] as any[]),
    ]);
    if (!client[0]) return respondError(res, "CLIENT_NOT_FOUND", "Client not found", 404);
    await queryDb(
      `UPDATE gdpr_requests SET status='completed', completed_at=now()
       WHERE organization_id=$1 AND client_id=$2 AND request_type='export' AND status='pending'`,
      [organizationId, clientId]
    ).catch(() => {});
    return respondSuccess(res, {
      exported_at: new Date().toISOString(),
      client: client[0],
      bookings,
      transactions,
      clinical_notes: clinicalNotes,
      total_records: bookings.length + transactions.length + clinicalNotes.length,
    });
  } catch (err) { return next(err); }
});

// POST /api/gdpr/erase/:clientId
gdprRoutes.post("/erase/:clientId", adminRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { clientId } = req.params;
    const client = await queryDb(`SELECT id FROM clients WHERE id=$1 AND organization_id=$2`, [clientId, organizationId]);
    if (!client[0]) return respondError(res, "CLIENT_NOT_FOUND", "Client not found", 404);
    // Anonymise — never hard delete (audit trail must be preserved)
    await queryDb(
      `UPDATE clients SET full_name='ERASED', email='erased_'||id::text||'@erased.invalid',
       phone=NULL, deleted_at=now(), updated_at=now() WHERE id=$1 AND organization_id=$2`,
      [clientId, organizationId]
    );
    await queryDb(
      `UPDATE clinical_notes SET subjective=NULL, objective=NULL, assessment=NULL, plan=NULL
       WHERE organization_id=$1 AND appointment_id IN (
         SELECT ca.id FROM clinical_appointments ca
         JOIN patients p ON p.id=ca.patient_id
         WHERE p.customer_id=$2 AND p.organization_id=$1
       )`,
      [organizationId, clientId]
    ).catch(() => {});
    await queryDb(
      `INSERT INTO gdpr_requests (organization_id, client_id, request_type, status, requested_by, completed_at, notes)
       VALUES ($1,$2,'erasure','completed',$3,now(),$4)`,
      [organizationId, clientId, res.locals.auth?.userId ?? null, req.body?.reason ?? "Right to erasure"]
    );
    await queryDb(
      `INSERT INTO audit_logs (id, organization_id, actor_id, action, metadata)
       VALUES (gen_random_uuid(),$1,$2,'gdpr.erasure',$3::jsonb)`,
      [organizationId, res.locals.auth?.userId ?? null, JSON.stringify({ client_id: clientId })]
    );
    return respondSuccess(res, { erased: true, client_id: clientId, erased_at: new Date().toISOString() });
  } catch (err) { return next(err); }
});
