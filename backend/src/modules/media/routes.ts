import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { respondSuccess, respondError } from "../../shared/response.js";

export const mediaRoutes = Router();

// Get presigned upload URL
mediaRoutes.post("/", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const userId = res.locals.auth?.userId;
    const { filename, content_type, size_bytes, category = "general" } = req.body;

    if (!filename || !content_type) {
      return respondError(res, "FILENAME_AND_CONTENT_TYPE_REQUIRED", "Filename and content type required", 400);
    }

    const s3_key = `${organizationId}/${Date.now()}-${filename}`;
    const cdn_url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${s3_key}`;

    const result = await queryDb<{ id: string }>(
      `INSERT INTO media_assets (organization_id, filename, s3_key, cdn_url, content_type, size_bytes, category, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
       RETURNING id`,
      [organizationId, filename, s3_key, cdn_url, content_type, size_bytes || null, category, userId]
    );

    return respondSuccess(res, {
      asset_id: result[0].id,
      upload_url: `${cdn_url}?upload=true`,
      cdn_url
    }, 201);
  } catch (err) {
    return next(err);
  }
});

mediaRoutes.post("/upload", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const userId = res.locals.auth?.userId;
    const { filename, content_type, size_bytes, category = "general" } = req.body;

    if (!filename || !content_type) {
      return respondError(res, "FILENAME_AND_CONTENT_TYPE_REQUIRED", "Filename and content type required", 400);
    }

    const s3_key = `${organizationId}/${Date.now()}-${filename}`;
    const cdn_url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${s3_key}`;

    const result = await queryDb<{ id: string }>(
      `INSERT INTO media_assets (organization_id, filename, s3_key, cdn_url, content_type, size_bytes, category, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
       RETURNING id`,
      [organizationId, filename, s3_key, cdn_url, content_type, size_bytes || null, category, userId]
    );

    const upload_url = `${cdn_url}?upload=true`;

    return respondSuccess(res, {
      asset_id: result[0].id,
      upload_url,
      cdn_url
    }, 201);
  } catch (err) {
    return next(err);
  }
});

// List media assets
mediaRoutes.get("/", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const category = req.query.category as string | undefined;

    let query = `
      SELECT id, filename, cdn_url, content_type, size_bytes, category, alt_text, tags, created_at
      FROM media_assets
      WHERE organization_id = $1 AND status = 'ready'
    `;
    const params: unknown[] = [organizationId];

    if (category) {
      query += ` AND category = $2`;
      params.push(category);
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;

    const assets = await queryDb(query, params);

    return respondSuccess(res, {
      count: assets.length,
      assets
    });
  } catch (err) {
    return next(err);
  }
});

// Get media asset by ID
mediaRoutes.get("/:id", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb(
      `SELECT id, filename, cdn_url, content_type, size_bytes, category, alt_text, tags, status, created_at
         FROM media_assets
        WHERE organization_id = $1 AND id = $2
        LIMIT 1`,
      [organizationId, req.params.id]
    );
    if (rows.length === 0) {
      return respondError(res, "MEDIA_NOT_FOUND", "Media not found", 404);
    }

    return respondSuccess(res, { asset: rows[0] });
  } catch (err) {
    return next(err);
  }
});

// Update asset metadata
mediaRoutes.patch("/:id", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { id } = req.params;
    const { status, alt_text, tags } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (alt_text !== undefined) {
      updates.push(`alt_text = $${paramIndex++}`);
      params.push(alt_text);
    }
    if (tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      params.push(tags);
    }

    if (updates.length === 0) {
      return respondError(res, "NO_UPDATES_PROVIDED", "No updates provided", 400);
    }

    params.push(id, organizationId);

    await queryDb(
      `UPDATE media_assets SET ${updates.join(", ")} WHERE id = $${paramIndex++} AND organization_id = $${paramIndex}`,
      params
    );

    return respondSuccess(res, { updated: true });
  } catch (err) {
    return next(err);
  }
});

// Delete asset
mediaRoutes.delete("/:id", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { id } = req.params;

    await queryDb(
      `UPDATE media_assets SET status = 'deleted' WHERE id = $1 AND organization_id = $2`,
      [id, organizationId]
    );

    return respondSuccess(res, { deleted: true });
  } catch (err) {
    return next(err);
  }
});

