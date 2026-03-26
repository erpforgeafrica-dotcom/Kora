import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { requireRole } from "../../middleware/rbac.js";
import { respondSuccess, respondError, respondList } from "../../shared/response.js";

export const clinicalRoutes = Router();

// Clinical actor roles — all roles that may access clinical data
const clinicalRead  = requireRole("business_admin", "platform_admin", "staff", "doctor", "nurse", "pharmacist", "lab_scientist", "caregiver");
const clinicalWrite = requireRole("business_admin", "platform_admin", "doctor", "nurse");
const adminOnly     = requireRole("business_admin", "platform_admin");

// ── Patients ──────────────────────────────────────────────────────────────────

clinicalRoutes.get("/patients", clinicalRead, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const params: unknown[] = [organizationId];
    let where = "p.organization_id = $1";
    if (search) {
      where += " AND (c.full_name ILIKE $2 OR c.email ILIKE $2)";
      params.push(`%${search}%`);
    }
    const rows = await queryDb(
      `SELECT p.id::text, p.organization_id::text, p.customer_id::text,
              p.patient_number, p.blood_type, p.allergies, p.current_medications,
              p.conditions, p.insurance_provider, p.insurance_number,
              p.emergency_contact_name, p.emergency_contact_phone,
              p.created_at::text,
              c.full_name AS client_name, c.email AS client_email, c.phone AS client_phone
         FROM patients p
         LEFT JOIN clients c ON c.id = p.customer_id AND c.organization_id = p.organization_id
        WHERE ${where}
        ORDER BY p.created_at DESC
        LIMIT 200`,
      params
    );
    return respondList(req, res, rows, { count: rows.length, limit: 200, page: 1 });
  } catch (err) { return next(err); }
});

clinicalRoutes.post("/patients", clinicalWrite, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { customer_id, blood_type, allergies, current_medications, conditions,
            insurance_provider, insurance_number, emergency_contact_name, emergency_contact_phone } = req.body;
    const row = await queryDb(
      `INSERT INTO patients (organization_id, customer_id, blood_type, allergies,
         current_medications, conditions, insurance_provider, insurance_number,
         emergency_contact_name, emergency_contact_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id::text, organization_id::text, customer_id::text, patient_number,
                 blood_type, allergies, current_medications, conditions,
                 insurance_provider, emergency_contact_name, created_at::text`,
      [organizationId, customer_id ?? null, blood_type ?? null,
       allergies ?? [], current_medications ?? [], conditions ?? [],
       insurance_provider ?? null, insurance_number ?? null,
       emergency_contact_name ?? null, emergency_contact_phone ?? null]
    );
    return respondSuccess(res, row[0], 201);
  } catch (err) { return next(err); }
});

clinicalRoutes.patch("/patients/:id", clinicalWrite, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const fields = ["blood_type", "allergies", "current_medications", "conditions",
                    "insurance_provider", "insurance_number", "emergency_contact_name", "emergency_contact_phone"];
    const updates: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(req.body[f]); }
    }
    if (!updates.length) return respondError(res, "NO_UPDATES_PROVIDED", "No updates provided", 400);
    params.push(organizationId, req.params.id);
    const rows = await queryDb(
      `UPDATE patients SET ${updates.join(", ")} WHERE organization_id = $${i++} AND id = $${i} RETURNING id::text`,
      params
    );
    if (!rows[0]) return respondError(res, "PATIENT_NOT_FOUND", "Patient not found", 404);
    return respondSuccess(res, { updated: true, id: rows[0].id });
  } catch (err) { return next(err); }
});

// ── Clinical Appointments ─────────────────────────────────────────────────────

clinicalRoutes.get("/appointments", clinicalRead, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb(
      `SELECT ca.id::text, ca.organization_id::text, ca.patient_id::text, ca.booking_id::text,
              ca.appointment_type, ca.chief_complaint, ca.diagnosis_codes, ca.status,
              ca.created_at::text,
              p.patient_number,
              c.full_name AS patient_name
         FROM clinical_appointments ca
         LEFT JOIN patients p ON p.id = ca.patient_id
         LEFT JOIN clients c ON c.id = p.customer_id
        WHERE ca.organization_id = $1
        ORDER BY ca.created_at DESC
        LIMIT 200`,
      [organizationId]
    );
    return respondList(req, res, rows, { count: rows.length, limit: 200, page: 1 });
  } catch (err) { return next(err); }
});

clinicalRoutes.post("/appointments", clinicalWrite, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { patient_id, booking_id, appointment_type, chief_complaint, diagnosis_codes } = req.body;
    if (!patient_id) return respondError(res, "MISSING_PATIENT_ID", "Patient ID is required", 400);
    const row = await queryDb(
      `INSERT INTO clinical_appointments (organization_id, patient_id, booking_id, appointment_type, chief_complaint, diagnosis_codes, status)
       VALUES ($1,$2,$3,$4,$5,$6,'scheduled')
       RETURNING id::text, organization_id::text, patient_id::text, appointment_type, chief_complaint, status, created_at::text`,
      [organizationId, patient_id, booking_id ?? null, appointment_type ?? null,
       chief_complaint ?? null, diagnosis_codes ?? []]
    );
    return respondSuccess(res, row[0], 201);
  } catch (err) { return next(err); }
});

clinicalRoutes.patch("/appointments/:id/status", clinicalWrite, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const validStatuses = ["scheduled", "in_progress", "completed", "cancelled", "no_show"];
    const status = String(req.body.status ?? "");
    if (!validStatuses.includes(status)) return respondError(res, "INVALID_STATUS", "Invalid status", 400);
    const rows = await queryDb(
      `UPDATE clinical_appointments SET status = $1
        WHERE id = $2 AND organization_id = $3
        RETURNING id::text, status`,
      [status, req.params.id, organizationId]
    );
    if (!rows[0]) return respondError(res, "APPOINTMENT_NOT_FOUND", "Appointment not found", 404);
    return respondSuccess(res, rows[0]);
  } catch (err) { return next(err); }
});

// ── Clinical Notes ────────────────────────────────────────────────────────────

clinicalRoutes.get("/appointments/:appointmentId/notes", clinicalRead, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb(
      `SELECT cn.id::text, cn.appointment_id::text, cn.author_id::text,
              cn.subjective, cn.objective, cn.assessment, cn.plan,
              cn.ai_draft, cn.ai_draft_accepted, cn.created_at::text,
              sm.full_name AS author_name
         FROM clinical_notes cn
         LEFT JOIN staff_members sm ON sm.id = cn.author_id
         JOIN clinical_appointments ca ON ca.id = cn.appointment_id AND ca.organization_id = $1
        WHERE cn.appointment_id = $2
        ORDER BY cn.created_at DESC`,
      [organizationId, req.params.appointmentId]
    );
    return respondSuccess(res, { count: rows.length, notes: rows });
  } catch (err) { return next(err); }
});

clinicalRoutes.post("/appointments/:appointmentId/notes", clinicalWrite, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { subjective, objective, assessment, plan, author_id } = req.body;
    const appt = await queryDb(
      `SELECT id FROM clinical_appointments WHERE id = $1 AND organization_id = $2`,
      [req.params.appointmentId, organizationId]
    );
    if (!appt[0]) return respondError(res, "APPOINTMENT_NOT_FOUND", "Appointment not found", 404);
    const row = await queryDb(
      `INSERT INTO clinical_notes (appointment_id, organization_id, author_id, subjective, objective, assessment, plan)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id::text, appointment_id::text, subjective, objective, assessment, plan, created_at::text`,
      [req.params.appointmentId, organizationId, author_id ?? null,
       subjective ?? null, objective ?? null, assessment ?? null, plan ?? null]
    );
    await queryDb(
      `INSERT INTO audit_logs (id, organization_id, actor_id, action, metadata)
       VALUES (gen_random_uuid(),$1,$2,'clinical_note.created',$3::jsonb)`,
      [organizationId, res.locals.auth?.userId ?? null,
       JSON.stringify({ appointment_id: req.params.appointmentId })]
    );
    return respondSuccess(res, row[0], 201);
  } catch (err) { return next(err); }
});

// ── Compliance summary ────────────────────────────────────────────────────────

clinicalRoutes.get("/compliance", adminOnly, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const [patients, appointments, notes] = await Promise.all([
      queryDb(`SELECT COUNT(*)::int AS n FROM patients WHERE organization_id = $1`, [organizationId]),
      queryDb(`SELECT COUNT(*)::int AS n FROM clinical_appointments WHERE organization_id = $1`, [organizationId]),
      queryDb(`SELECT COUNT(*)::int AS n FROM clinical_notes WHERE organization_id = $1`, [organizationId]),
    ]);
    return respondSuccess(res, {
      module: "clinical",
      organization_id: organizationId,
      patient_count: patients[0]?.n ?? 0,
      appointment_count: appointments[0]?.n ?? 0,
      note_count: notes[0]?.n ?? 0,
    });
  } catch (err) { return next(err); }
});
