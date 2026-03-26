import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { requireRole } from "../../middleware/rbac.js";
import { respondSuccess, respondError, respondList } from "../../shared/response.js";

export const contentRoutes = Router();
export const publicContentRoutes = Router();

const VALID_STATUSES = ["draft", "pending_review", "approved", "published", "retracted"] as const;
type ArticleStatus = typeof VALID_STATUSES[number];

// State machine — locked contract
const STATUS_TRANSITIONS: Record<ArticleStatus, ArticleStatus[]> = {
  draft:          ["pending_review"],
  pending_review: ["approved", "draft"],
  approved:       ["published", "draft"],
  published:      ["retracted"],
  retracted:      ["draft"],
};

const authorRoles  = requireRole("business_admin", "platform_admin", "staff");
const moderateRoles = requireRole("business_admin", "platform_admin");

function parsePositiveInt(value: unknown, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

function buildPublicArticleFilter(organizationId: string | null) {
  const params: unknown[] = [];
  let where = `WHERE a.status = 'published' AND a.published_at IS NOT NULL`;

  if (organizationId) {
    params.push(organizationId);
    where += ` AND a.organization_id = $${params.length}`;
  }

  return { where, params };
}

// ── Public published articles ────────────────────────────────────────────────
publicContentRoutes.get("/articles", async (req, res, next) => {
  try {
    const organizationId = typeof req.query.organization_id === "string" ? req.query.organization_id : null;
    const limit = parsePositiveInt(req.query.limit, 20, 100);
    const page = parsePositiveInt(req.query.page, 1, 10_000);
    const offset = (page - 1) * limit;
    const { where, params } = buildPublicArticleFilter(organizationId);

    const countRows = await queryDb(
      `SELECT COUNT(*)::int AS total
         FROM content_articles a
         ${where}`,
      params
    );

    const rows = await queryDb(
      `SELECT a.id::text,
              a.organization_id::text,
              o.name AS organization_name,
              a.title,
              a.slug,
              a.category,
              a.excerpt,
              a.tags,
              a.published_at::text,
              a.created_at::text,
              sm.full_name AS author_name
         FROM content_articles a
         JOIN organizations o ON o.id = a.organization_id
         LEFT JOIN staff_members sm ON sm.id = a.author_id
         ${where}
        ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC
        LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return respondList(req, res, rows, {
      count: Number(countRows[0]?.total ?? rows.length),
      limit,
      page,
      offset,
    });
  } catch (err) {
    return next(err);
  }
});

publicContentRoutes.get("/articles/:id", async (req, res, next) => {
  try {
    const rows = await queryDb(
      `SELECT a.id::text,
              a.organization_id::text,
              o.name AS organization_name,
              a.title,
              a.slug,
              a.category,
              a.excerpt,
              a.body,
              a.tags,
              a.published_at::text,
              a.created_at::text,
              sm.full_name AS author_name
         FROM content_articles a
         JOIN organizations o ON o.id = a.organization_id
         LEFT JOIN staff_members sm ON sm.id = a.author_id
        WHERE a.id = $1
          AND a.status = 'published'
          AND a.published_at IS NOT NULL`,
      [req.params.id]
    );

    if (!rows[0]) {
      return respondError(res, "ARTICLE_NOT_FOUND", "Published article not found", 404);
    }

    return respondSuccess(res, rows[0]);
  } catch (err) {
    return next(err);
  }
});

// ── List articles ─────────────────────────────────────────────────────────────
contentRoutes.get("/articles", authorRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const status = typeof req.query.status === "string" ? req.query.status : null;
    const params: unknown[] = [organizationId];
    let filter = "";
    if (status && VALID_STATUSES.includes(status as ArticleStatus)) {
      filter = " AND a.status = $2";
      params.push(status);
    }
    const rows = await queryDb(
      `SELECT a.id::text, a.organization_id::text, a.author_id::text,
              a.title, a.slug, a.category, a.excerpt, a.status, a.tags,
              a.published_at::text, a.created_at::text, a.updated_at::text,
              sm.full_name AS author_name
         FROM content_articles a
         LEFT JOIN staff_members sm ON sm.id = a.author_id
        WHERE a.organization_id = $1${filter}
        ORDER BY a.created_at DESC
        LIMIT 200`,
      params
    );
    return respondList(req, res, rows, { count: rows.length, limit: 200, page: 1 });
  } catch (err) { return next(err); }
});

// ── Get single article ────────────────────────────────────────────────────────
contentRoutes.get("/articles/:id", authorRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb(
      `SELECT a.id::text, a.organization_id::text, a.author_id::text,
              a.title, a.slug, a.category, a.excerpt, a.body, a.status, a.tags,
              a.published_at::text, a.retracted_at::text, a.created_at::text,
              sm.full_name AS author_name
         FROM content_articles a
         LEFT JOIN staff_members sm ON sm.id = a.author_id
        WHERE a.organization_id = $1 AND a.id = $2`,
      [organizationId, req.params.id]
    );
    if (!rows[0]) return respondError(res, "ARTICLE_NOT_FOUND", "Article not found", 404);
    return respondSuccess(res, rows[0]);
  } catch (err) { return next(err); }
});

// ── Create article (draft) ────────────────────────────────────────────────────
contentRoutes.post("/articles", authorRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { title, category, excerpt, body, tags } = req.body;
    if (!title?.trim()) return respondError(res, "MISSING_TITLE", "Title is required", 400);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const authorId = res.locals.auth?.userId ?? null;
    const row = await queryDb(
      `INSERT INTO content_articles
         (organization_id, author_id, title, slug, category, excerpt, body, tags, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'draft')
       RETURNING id::text, title, slug, status, created_at::text`,
      [organizationId, authorId, title.trim(), slug,
       category ?? null, excerpt ?? null, body ?? null, tags ?? []]
    ).catch((e: any) => {
      if (e?.code === "23505") throw Object.assign(new Error("An article with this title already exists in your organization"), { statusCode: 409, code: "SLUG_CONFLICT" });
      throw e;
    });
    await queryDb(
      `INSERT INTO content_article_audit (article_id, actor_id, action, to_status)
       VALUES ($1,$2,'created','draft')`,
      [row[0].id, authorId]
    );
    return respondSuccess(res, row[0], 201);
  } catch (err) { return next(err); }
});

// ── Update article body/metadata ──────────────────────────────────────────────
contentRoutes.patch("/articles/:id", authorRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const fields = ["title", "category", "excerpt", "body", "tags"];
    const updates: string[] = ["updated_at = now()"];
    const params: unknown[] = [];
    let i = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(req.body[f]); }
    }
    params.push(organizationId, req.params.id);
    const rows = await queryDb(
      `UPDATE content_articles SET ${updates.join(", ")}
        WHERE organization_id = $${i++} AND id = $${i} AND status = 'draft'
        RETURNING id::text, title, status, updated_at::text`,
      params
    );
    if (!rows[0]) return respondError(res, "ARTICLE_NOT_FOUND_OR_LOCKED", "Article not found or cannot be edited in current status", 404);
    // Audit the edit
    await queryDb(
      `INSERT INTO content_article_audit (article_id, actor_id, action, from_status, to_status)
       VALUES ($1,$2,'edited',$3,$3)`,
      [req.params.id, res.locals.auth?.userId ?? null, rows[0].status]
    );
    return respondSuccess(res, rows[0]);
  } catch (err) { return next(err); }
});

// ── Advance status (workflow transition) ──────────────────────────────────────
contentRoutes.patch("/articles/:id/status", authorRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const newStatus = String(req.body.status ?? "") as ArticleStatus;
    if (!VALID_STATUSES.includes(newStatus)) {
      return respondError(res, "INVALID_STATUS", "Invalid status", 400, { valid: VALID_STATUSES });
    }
    // Fetch current status
    const current = await queryDb(
      `SELECT id, status FROM content_articles WHERE organization_id = $1 AND id = $2`,
      [organizationId, req.params.id]
    );
    if (!current[0]) return respondError(res, "ARTICLE_NOT_FOUND", "Article not found", 404);
    const currentStatus = current[0].status as ArticleStatus;
    const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];
    // Authors can only submit for review or retract to draft; moderators can do all transitions
    const isModerator = ["business_admin", "platform_admin"].includes(res.locals.auth?.userRole);
    const authorAllowed = ["pending_review", "draft"];
    if (!allowed.includes(newStatus)) {
      return respondError(res, "INVALID_TRANSITION",
        `Cannot transition article from '${currentStatus}' to '${newStatus}'`,
        422, { allowed }
      );
    }
    if (!isModerator && !authorAllowed.includes(newStatus)) {
      return respondError(res, "FORBIDDEN", "Only moderators can perform this transition", 403);
    }
    const publishedAt = newStatus === "published" ? "now()" : "published_at";
    const retractedAt = newStatus === "retracted" ? "now()" : "retracted_at";
    const rows = await queryDb(
      `UPDATE content_articles
          SET status = $1, published_at = ${publishedAt}, retracted_at = ${retractedAt}, updated_at = now()
        WHERE organization_id = $2 AND id = $3
        RETURNING id::text`,
      [newStatus, organizationId, req.params.id]
    );
    // Audit trail
    await queryDb(
      `INSERT INTO content_article_audit (article_id, actor_id, action, from_status, to_status)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.params.id, res.locals.auth?.userId ?? null, `status_changed`, currentStatus, newStatus]
    );
    // Re-fetch full article so frontend gets complete object
    const updated = await queryDb(
      `SELECT a.id::text, a.organization_id::text, a.author_id::text,
              a.title, a.slug, a.category, a.excerpt, a.status, a.tags,
              a.published_at::text, a.retracted_at::text, a.created_at::text, a.updated_at::text,
              sm.full_name AS author_name
         FROM content_articles a
         LEFT JOIN staff_members sm ON sm.id = a.author_id
        WHERE a.organization_id = $1 AND a.id = $2`,
      [organizationId, req.params.id]
    );
    return respondSuccess(res, updated[0]);
  } catch (err) { return next(err); }
});

// ── Delete (hard delete — draft only) ────────────────────────────────────────
contentRoutes.delete("/articles/:id", moderateRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb(
      `DELETE FROM content_articles
        WHERE organization_id = $1 AND id = $2 AND status = 'draft'
        RETURNING id::text`,
      [organizationId, req.params.id]
    );
    if (!rows[0]) return respondError(res, "ARTICLE_NOT_FOUND_OR_NOT_DRAFT", "Article not found or not in draft status", 404);
    return respondSuccess(res, { deleted: true, id: rows[0].id });
  } catch (err) { return next(err); }
});

// ── Audit trail for an article ────────────────────────────────────────────────
contentRoutes.get("/articles/:id/audit", moderateRoles, async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb(
      `SELECT au.id::text, au.article_id::text, au.actor_id::text,
              au.action, au.from_status, au.to_status, au.note, au.created_at::text,
              sm.full_name AS actor_name
         FROM content_article_audit au
         LEFT JOIN staff_members sm ON sm.id = au.actor_id
         JOIN content_articles a ON a.id = au.article_id AND a.organization_id = $1
        WHERE au.article_id = $2
        ORDER BY au.created_at DESC`,
      [organizationId, req.params.id]
    );
    return respondList(req, res, rows, { count: rows.length, limit: 100, page: 1 });
  } catch (err) { return next(err); }
});
