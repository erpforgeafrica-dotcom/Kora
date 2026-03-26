import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { respondSuccess, respondError } from "../../shared/response.js";

export const categoriesRoutes = Router();

categoriesRoutes.get("/", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const categories = await queryDb(
      `SELECT c.id, c.name, c.slug, c.description, c.image_url, c.icon, c.parent_id, 
              c.display_order, c.is_active, c.created_at,
              COUNT(s.id) as service_count
       FROM service_categories c
       LEFT JOIN services s ON s.category_id = c.id AND s.organization_id = c.organization_id
       WHERE c.organization_id = $1
       GROUP BY c.id
       ORDER BY c.display_order ASC, c.name ASC`,
      [organizationId]
    );

    return respondSuccess(res, { count: categories.length, categories });
  } catch (err) {
    return next(err);
  }
});

categoriesRoutes.get("/:id", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb(
      `SELECT id, name, slug, description, image_url, icon, parent_id, display_order, is_active, created_at
         FROM service_categories
        WHERE id = $1 AND organization_id = $2
        LIMIT 1`,
      [req.params.id, organizationId]
    );

    if (!rows[0]) {
      return respondError(res, "CATEGORY_NOT_FOUND", "Category not found", 404);
    }

    return respondSuccess(res, { category: rows[0] });
  } catch (err) {
    return next(err);
  }
});

categoriesRoutes.post("/", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { name, description, image_url, icon, parent_id, display_order, meta_title, meta_description } = req.body;

    if (!name) {
      return respondError(res, "NAME_REQUIRED", "Name is required", 400);
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const result = await queryDb<{ id: string }>(
      `INSERT INTO service_categories (organization_id, name, slug, description, image_url, icon, parent_id, display_order, meta_title, meta_description, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
       RETURNING id`,
      [organizationId, name, slug, description || null, image_url || null, icon || null, parent_id || null, display_order || 0, meta_title || null, meta_description || null]
    );

    return respondSuccess(res, { category_id: result[0].id, slug }, 201);
  } catch (err) {
    return next(err);
  }
});

categoriesRoutes.patch("/:id", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { id } = req.params;
    const { name, description, image_url, icon, parent_id, display_order, meta_title, meta_description, is_active } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      updates.push(`slug = $${paramIndex++}`);
      params.push(slug);
    }
    if (description !== undefined) { updates.push(`description = $${paramIndex++}`); params.push(description); }
    if (image_url !== undefined) { updates.push(`image_url = $${paramIndex++}`); params.push(image_url); }
    if (icon !== undefined) { updates.push(`icon = $${paramIndex++}`); params.push(icon); }
    if (parent_id !== undefined) { updates.push(`parent_id = $${paramIndex++}`); params.push(parent_id); }
    if (display_order !== undefined) { updates.push(`display_order = $${paramIndex++}`); params.push(display_order); }
    if (meta_title !== undefined) { updates.push(`meta_title = $${paramIndex++}`); params.push(meta_title); }
    if (meta_description !== undefined) { updates.push(`meta_description = $${paramIndex++}`); params.push(meta_description); }
    if (is_active !== undefined) { updates.push(`is_active = $${paramIndex++}`); params.push(is_active); }

    if (updates.length === 0) {
      return respondError(res, "NO_UPDATES_PROVIDED", "No updates provided", 400);
    }

    params.push(id, organizationId);

    await queryDb(
      `UPDATE service_categories SET ${updates.join(", ")} WHERE id = $${paramIndex++} AND organization_id = $${paramIndex}`,
      params
    );

    return respondSuccess(res, { updated: true });
  } catch (err) {
    return next(err);
  }
});

categoriesRoutes.delete("/:id", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    await queryDb(
      `DELETE FROM service_categories WHERE id = $1 AND organization_id = $2`,
      [req.params.id, organizationId]
    );

    return respondSuccess(res, { deleted: true });
  } catch (err) {
    return next(err);
  }
});

