import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { requireRole } from "../../middleware/rbac.js";
import { respondError, respondList, respondSuccess } from "../../shared/response.js";

export const tenantsRoutes = Router();

/**
 * Canonical v1.2 Tenants (platform-admin) API.
 *
 * Backed by `organizations` as the tenant root. This is the only tenant concept for v1.2.
 */

tenantsRoutes.get("/", requireRole("platform_admin"), async (_req, res, next) => {
  try {
    const rows = await queryDb(
      `select id::text,
              name,
              industry,
              coalesce(status, 'active') as status,
              created_at::text
         from organizations
        order by created_at desc
        limit 500`
    );
    return respondList(_req, res, rows, { count: rows.length, limit: 500, page: 1 });
  } catch (error) {
    return next(error);
  }
});

tenantsRoutes.post("/", requireRole("platform_admin"), async (req, res, next) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    const industry = req.body?.industry !== undefined ? String(req.body.industry).trim() || null : null;
    const status = req.body?.status !== undefined ? String(req.body.status).trim() || "active" : "active";
    if (!name) return respondError(res, "MISSING_TENANT_NAME", "Missing tenant name", 400);

    const created = await queryDb(
      `insert into organizations (id, name, industry, status, created_at)
       values (gen_random_uuid(), $1, $2, $3, now())
       returning id::text, name, industry, status, created_at::text`,
      [name, industry, status]
    );
    return respondSuccess(res, { tenant: created[0] }, 201);
  } catch (error) {
    return next(error);
  }
});

tenantsRoutes.get("/:id", requireRole("platform_admin"), async (req, res, next) => {
  try {
    const rows = await queryDb(
      `select id::text,
              name,
              industry,
              coalesce(status, 'active') as status,
              created_at::text
         from organizations
        where id = $1
        limit 1`,
      [req.params.id]
    );
    if (!rows[0]) return respondError(res, "TENANT_NOT_FOUND", "Tenant not found", 404);
    return respondSuccess(res, { tenant: rows[0] });
  } catch (error) {
    return next(error);
  }
});

tenantsRoutes.patch("/:id", requireRole("platform_admin"), async (req, res, next) => {
  try {
    const name = req.body?.name !== undefined ? String(req.body.name).trim() : null;
    const industry = req.body?.industry !== undefined ? String(req.body.industry).trim() || null : undefined;
    if (!name && req.body?.industry === undefined) {
      return respondError(res, "MISSING_TENANT_FIELDS", "Name or industry is required", 400);
    }

    const rows = await queryDb(
      `update organizations
          set name = coalesce($1, name),
              industry = case when $2::text is null then industry else $2 end
        where id = $3
        returning id::text, name, industry, coalesce(status, 'active') as status, created_at::text`,
      [name, industry ?? null, req.params.id]
    );
    if (!rows[0]) return respondError(res, "TENANT_NOT_FOUND", "Tenant not found", 404);
    return respondSuccess(res, { updated: true, tenant: rows[0] });
  } catch (error) {
    return next(error);
  }
});

tenantsRoutes.patch("/:id/status", requireRole("platform_admin"), async (req, res, next) => {
  try {
    const status = String(req.body?.status ?? "").trim();
    if (!status) {
      return respondError(res, "MISSING_TENANT_STATUS", "Missing tenant status", 400);
    }

    const rows = await queryDb(
      `update organizations
          set status = $2
        where id = $1
        returning id::text, name, industry, status, created_at::text`,
      [req.params.id, status]
    );
    if (!rows[0]) return respondError(res, "TENANT_NOT_FOUND", "Tenant not found", 404);
    return respondSuccess(res, { tenant: rows[0] });
  } catch (error) {
    return next(error);
  }
});

tenantsRoutes.get("/:id/subscription", requireRole("platform_admin"), async (req, res, next) => {
  try {
    const rows = await queryDb(
      `select id::text,
              organization_id::text,
              plan,
              status,
              start_date::text as current_period_start,
              end_date::text as current_period_end,
              provider_subscription_id,
              created_at::text
         from subscriptions
        where organization_id = $1
        order by created_at desc
        limit 1`,
      [req.params.id]
    );

    return respondSuccess(res, { subscription: rows[0] ?? null });
  } catch (error) {
    return next(error);
  }
});

tenantsRoutes.delete("/:id", requireRole("platform_admin"), async (req, res, next) => {
  try {
    const rows = await queryDb(
      `delete from organizations
        where id = $1
        returning id::text`,
      [req.params.id]
    );
    if (!rows[0]) return respondError(res, "TENANT_NOT_FOUND", "Tenant not found", 404);
    return respondSuccess(res, { deleted: true, id: rows[0].id });
  } catch (error) {
    return next(error);
  }
});
