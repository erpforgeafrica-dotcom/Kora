import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { BadRequestError, NotFoundError } from "../../middleware/enhancedErrorHandler.js";
import { requireRole } from "../../middleware/rbac.js";
import { embeddingService } from "../../services/ai/embeddingService.js";
import { respondList, respondSuccess } from "../../shared/response.js";

export const servicesRoutes = Router();

/**
 * Canonical v1.2 Services CRUD (organization_id scoped).
 *
 * This router intentionally matches the enabled migration chain where `services` is scoped by:
 * - services.organization_id (required)
 * - services.is_active (boolean)
 *
 * List responses follow the canonical shared response contract.
 */

servicesRoutes.get("/", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const limit = Math.min(500, Math.max(1, Number(req.query.limit ?? 20) || 20));
    const page = Math.max(1, Number(req.query.page ?? 1) || 1);
    const offset = (page - 1) * limit;

    const rows = await queryDb(
      `select id::text,
              organization_id::text,
              category_id::text,
              name,
              description,
              duration_minutes,
              price_cents,
              currency,
              notes,
              is_active,
              created_at::text,
              updated_at::text
         from services
        where organization_id = $1
        order by created_at desc
        limit $2
       offset $3`,
      [organizationId, limit, offset]
    );

    // Provide `active` alias for legacy frontend columns.
    const services = rows.map((row: any) => ({
      ...row,
      active: row.is_active
    }));

    return respondList(req, res, services, {
      count: services.length,
      limit,
      page,
      offset,
    });
  } catch (error) {
    return next(error);
  }
});

servicesRoutes.post("/", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const name = String(req.body?.name ?? "").trim();
    const description = req.body?.description ? String(req.body.description) : null;
    const categoryId = req.body?.category_id ? String(req.body.category_id) : null;
    const durationMinutes = Number(req.body?.duration_minutes);
    const priceCents = Number(req.body?.price_cents);
    const currency = String(req.body?.currency ?? "GBP");
    const notes = req.body?.notes ? String(req.body.notes) : null;
    const isActive = req.body?.is_active !== undefined ? Boolean(req.body.is_active) : true;

    if (!name) return next(new BadRequestError("Service name is required", "missing_service_name"));
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return next(new BadRequestError("Duration must be a positive number", "invalid_duration_minutes"));
    }
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      return next(new BadRequestError("Price must be non-negative", "invalid_price_cents"));
    }

    const rows = await queryDb(
      `insert into services (
         organization_id, category_id, name, description, duration_minutes, price_cents, currency, notes, is_active
       )
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       returning id::text, organization_id::text, category_id::text, name, description, duration_minutes, price_cents, currency, notes, is_active, created_at::text, updated_at::text`,
      [organizationId, categoryId, name, description, durationMinutes, priceCents, currency, notes, isActive]
    );

    const created: any = rows[0];

    // Fire-and-forget embedding generation
    embeddingService.generateAndStoreEmbedding(
      'service',
      created.id,
      `${created.name} ${created.description || ''} ${created.category_id || ''}`,
      { organizationId: created.organization_id }
    );

    return respondSuccess(res, { ...created, active: created.is_active }, 201);
  } catch (error) {
    return next(error);
  }
});

servicesRoutes.get("/:id", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const rows = await queryDb(
      `select id::text,
              organization_id::text,
              category_id::text,
              name,
              description,
              duration_minutes,
              price_cents,
              currency,
              notes,
              is_active,
              created_at::text,
              updated_at::text
         from services
        where organization_id = $1 and id = $2
        limit 1`,
      [organizationId, req.params.id]
    );

    const row: any = rows[0];
    if (!row) return next(new NotFoundError("Service not found", "service_not_found"));
    return respondSuccess(res, { ...row, active: row.is_active });
  } catch (error) {
    return next(error);
  }
});

servicesRoutes.patch("/:id", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const updates: string[] = [];
    const params: unknown[] = [];
    let index = 1;

    for (const field of ["name", "description", "notes", "currency"]) {
      if (req.body?.[field] !== undefined) {
        updates.push(`${field} = $${index++}`);
        params.push(req.body[field]);
      }
    }

    if (req.body?.category_id !== undefined) {
      updates.push(`category_id = $${index++}`);
      params.push(req.body.category_id);
    }

    if (req.body?.duration_minutes !== undefined) {
      const durationMinutes = Number(req.body.duration_minutes);
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        return next(new BadRequestError("Duration must be a positive number", "invalid_duration_minutes"));
      }
      updates.push(`duration_minutes = $${index++}`);
      params.push(durationMinutes);
    }

    if (req.body?.price_cents !== undefined) {
      const priceCents = Number(req.body.price_cents);
      if (!Number.isFinite(priceCents) || priceCents < 0) {
        return next(new BadRequestError("Price must be non-negative", "invalid_price_cents"));
      }
      updates.push(`price_cents = $${index++}`);
      params.push(priceCents);
    }

    // Support legacy `active` updates while canonical field is `is_active`.
    if (req.body?.is_active !== undefined) {
      updates.push(`is_active = $${index++}`);
      params.push(Boolean(req.body.is_active));
    } else if (req.body?.active !== undefined) {
      updates.push(`is_active = $${index++}`);
      params.push(Boolean(req.body.active));
    }

    if (updates.length === 0) {
      return next(new BadRequestError("No updates provided", "no_updates_provided"));
    }

    params.push(organizationId, req.params.id);

    const rows = await queryDb(
      `update services
          set ${updates.join(", ")},
              updated_at = now()
        where organization_id = $${index++} and id = $${index}
        returning id::text, organization_id::text, category_id::text, name, description, duration_minutes, price_cents, currency, notes, is_active, created_at::text, updated_at::text`,
      params
    );

    const updated: any = rows[0];
    if (!updated) return next(new NotFoundError("Service not found", "service_not_found"));

    // Fire-and-forget embedding generation
    embeddingService.generateAndStoreEmbedding(
      'service',
      updated.id,
      `${updated.name} ${updated.description || ''} ${updated.category_id || ''}`,
      { organizationId: updated.organization_id }
    );

    return respondSuccess(res, { ...updated, active: updated.is_active });
  } catch (error) {
    return next(error);
  }
});

servicesRoutes.delete("/:id", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const rows = await queryDb(
      `update services
          set is_active = false,
              updated_at = now()
        where organization_id = $1 and id = $2
        returning id::text`,
      [organizationId, req.params.id]
    );
    if (!rows[0]) return next(new NotFoundError("Service not found", "service_not_found"));
    return respondSuccess(res, { deleted: true, id: rows[0].id });
  } catch (error) {
    return next(error);
  }
});
