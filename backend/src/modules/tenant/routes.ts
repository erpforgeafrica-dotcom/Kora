import { Router } from "express";
import { createTenantBranch, listTenantBranchesForOrganization } from "../../db/repositories/tenantBranchRepository.js";
import { withTenantAlias } from "../../shared/blueprintAliases.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { requireRole } from "../../middleware/rbac.js";
import { respondSuccess, respondError, respondList } from "../../shared/response.js";
import { queryDb } from "../../db/client.js";

export const tenantRoutes = Router();

// ── GET /api/tenant/settings ──────────────────────────────────────────────────
tenantRoutes.get("/settings", requireRole("business_admin","platform_admin","operations"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb(
      `SELECT name, email, phone, timezone, currency, country, logo_url, website,
              ai_plan, status, updated_at::text
       FROM organizations WHERE id=$1 LIMIT 1`,
      [organizationId]
    );
    if (!rows[0]) return respondError(res, "ORG_NOT_FOUND", "Organization not found", 404);
    return respondSuccess(res, rows[0]);
  } catch (err) { return next(err); }
});

// ── PATCH /api/tenant/settings ────────────────────────────────────────────────
tenantRoutes.patch("/settings", requireRole("business_admin","platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const allowed = ["name","email","phone","timezone","currency","country","logo_url","website"];
    const updates: string[] = ["updated_at=now()"];
    const params: unknown[] = [];
    let i = 1;
    for (const field of allowed) {
      if (req.body[field] !== undefined) { updates.push(`${field}=$${i++}`); params.push(req.body[field]); }
    }
    if (params.length === 0) return respondError(res, "NO_UPDATES", "No valid fields provided", 400);
    params.push(organizationId);
    const rows = await queryDb(
      `UPDATE organizations SET ${updates.join(",")} WHERE id=$${i} RETURNING name, email, updated_at::text`,
      params
    );
    // Audit
    await queryDb(
      `INSERT INTO audit_logs (id, organization_id, actor_id, action, metadata)
       VALUES (gen_random_uuid(),$1,$2,'settings.updated',$3::jsonb)`,
      [organizationId, res.locals.auth?.userId ?? null, JSON.stringify(req.body)]
    ).catch(() => {});
    return respondSuccess(res, rows[0]);
  } catch (err) { return next(err); }
});

tenantRoutes.get("/branches", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const branches = await listTenantBranchesForOrganization(organizationId);
    return respondSuccess(res,
      withTenantAlias(
        {
          count: branches.length,
          branches: branches.map((branch) => ({
            ...branch,
            tenant_id: branch.organization_id
          }))
        },
        organizationId
      )
    );
  } catch (error) {
    return next(error);
  }
});

tenantRoutes.post("/branches", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const name = String(req.body?.name ?? "").trim();
    if (!name) {
      return respondError(res, "MISSING_BRANCH_NAME", "Missing branch name", 400);
    }

    const branch = await createTenantBranch({
      organizationId,
      name,
      address: req.body?.address ? String(req.body.address) : null,
      city: req.body?.city ? String(req.body.city) : null,
      country: req.body?.country ? String(req.body.country) : null,
      latitude: typeof req.body?.latitude === "number" ? req.body.latitude : null,
      longitude: typeof req.body?.longitude === "number" ? req.body.longitude : null,
      phone: req.body?.phone ? String(req.body.phone) : null
    });

    return res.status(201).json(withTenantAlias(branch ?? {}, organizationId));
  } catch (error) {
    return next(error);
  }
});

