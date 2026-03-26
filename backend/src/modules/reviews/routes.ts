import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { respondSuccess, respondError } from "../../shared/response.js";

export const reviewsRoutes = Router();

// Submit review (client only, after completed booking)
reviewsRoutes.post("/", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const clientId = res.locals.auth?.userId;
    const { booking_id, rating, content, media_urls = [] } = req.body;

    if (!booking_id || !rating) {
      return respondError(res, "BOOKING_ID_AND_RATING_REQUIRED", "Booking ID and rating required", 400);
    }

    if (rating < 1 || rating > 5) {
      return respondError(res, "RATING_OUT_OF_RANGE", "Rating must be between 1 and 5", 400);
    }

    // Verify booking exists, is completed, and belongs to client
    const bookings = await queryDb<{ staff_member_id: string }>(
      `SELECT staff_member_id FROM bookings 
       WHERE id = $1 AND organization_id = $2 AND client_id = $3 AND status = 'completed'`,
      [booking_id, organizationId, clientId]
    );

    if (bookings.length === 0) {
      return respondError(res, "BOOKING_NOT_FOUND_OR_NOT_COMPLETED", "Booking not found or not completed", 404);
    }

    // Check if review already exists
    const existing = await queryDb(
      `SELECT id FROM reviews WHERE booking_id = $1`,
      [booking_id]
    );

    if (existing.length > 0) {
      return respondError(res, "REVIEW_ALREADY_SUBMITTED", "Review already submitted for this booking", 409);
    }

    // Insert review
    const result = await queryDb<{ id: string }>(
      `INSERT INTO reviews (organization_id, booking_id, client_id, staff_member_id, rating, content, media_urls, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        organizationId,
        booking_id,
        clientId,
        bookings[0].staff_member_id,
        rating,
        content || null,
        JSON.stringify(media_urls),
        rating <= 2 ? "flagged" : "published"
      ]
    );

    return res.status(201).json({
      review_id: result[0].id,
      status: rating <= 2 ? "flagged" : "published",
      message: rating <= 2 ? "Review submitted for moderation" : "Review published"
    });
  } catch (err) {
    return next(err);
  }
});

// Get reviews for organization (with 1:10 negative ratio)
reviewsRoutes.get("/", async (req, res, next) => {
  try {
    const orgId = req.query.orgId as string;
    if (!orgId) {
      return respondError(res, "ORGID_QUERY_PARAMETER_REQUIRED", "OrgId query parameter required", 400);
    }

    // Count positive and negative reviews
    const counts = await queryDb<{ positive: string; negative: string }>(
      `SELECT 
         COUNT(*) FILTER (WHERE rating >= 4 AND status = 'published') as positive,
         COUNT(*) FILTER (WHERE rating <= 2 AND status = 'published') as negative
       FROM reviews WHERE organization_id = $1`,
      [orgId]
    );

    const positiveCount = parseInt(counts[0]?.positive || "0");
    const negativeCount = parseInt(counts[0]?.negative || "0");
    const negativeLimit = Math.floor(positiveCount / 10);

    // Get all positive reviews
    const positiveReviews = await queryDb(
      `SELECT r.id, r.rating, r.content, r.media_urls, r.created_at, r.resolution_status,
              c.full_name as client_name,
              (SELECT json_agg(json_build_object('content', rr.content, 'created_at', rr.created_at, 'is_kora_admin', rr.is_kora_admin))
               FROM review_responses rr WHERE rr.review_id = r.id) as responses
       FROM reviews r
       LEFT JOIN clients c ON r.client_id = c.id
       WHERE r.organization_id = $1 AND r.rating >= 4 AND r.status = 'published'
       ORDER BY r.created_at DESC`,
      [orgId]
    );

    // Get limited negative reviews (prioritize responded ones)
    const negativeReviews = await queryDb(
      `SELECT r.id, r.rating, r.content, r.media_urls, r.created_at, r.resolution_status,
              c.full_name as client_name,
              (SELECT json_agg(json_build_object('content', rr.content, 'created_at', rr.created_at, 'is_kora_admin', rr.is_kora_admin))
               FROM review_responses rr WHERE rr.review_id = r.id) as responses
       FROM reviews r
       LEFT JOIN clients c ON r.client_id = c.id
       WHERE r.organization_id = $1 AND r.rating <= 2 AND r.status = 'published'
       ORDER BY 
         CASE WHEN r.resolution_status = 'responded' THEN 0 ELSE 1 END,
         r.created_at DESC
       LIMIT $2`,
      [orgId, negativeLimit]
    );

    // Get neutral reviews
    const neutralReviews = await queryDb(
      `SELECT r.id, r.rating, r.content, r.media_urls, r.created_at, r.resolution_status,
              c.full_name as client_name,
              (SELECT json_agg(json_build_object('content', rr.content, 'created_at', rr.created_at, 'is_kora_admin', rr.is_kora_admin))
               FROM review_responses rr WHERE rr.review_id = r.id) as responses
       FROM reviews r
       LEFT JOIN clients c ON r.client_id = c.id
       WHERE r.organization_id = $1 AND r.rating = 3 AND r.status = 'published'
       ORDER BY r.created_at DESC`,
      [orgId]
    );

    const allReviews = [...positiveReviews, ...neutralReviews, ...negativeReviews];

    respondSuccess(res, {
      reviews: allReviews,
      stats: {
        positive_count: positiveCount,
        negative_count: negativeCount,
        negative_shown: Math.min(negativeCount, negativeLimit),
        avg_rating: allReviews.length > 0
          ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
          : "0.0"
      }
    });
  } catch (err) {
    return next(err);
  }
});

reviewsRoutes.get("/:id", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb(
      `SELECT id, booking_id, client_id, staff_member_id, rating, content, media_urls, status, resolution_status, created_at
         FROM reviews
        WHERE organization_id = $1 AND id = $2
        LIMIT 1`,
      [organizationId, req.params.id]
    );
    if (rows.length === 0) {
      return respondError(res, "REVIEW_NOT_FOUND", "Review not found", 404);
    }

    return respondSuccess(res, { review: rows[0] });
  } catch (err) {
    return next(err);
  }
});

// Business responds to review
reviewsRoutes.post("/:id/respond", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const userId = res.locals.auth?.userId;
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return respondError(res, "CONTENT_REQUIRED", "Content required", 400);
    }

    // Verify review belongs to organization
    const reviews = await queryDb(
      `SELECT id FROM reviews WHERE id = $1 AND organization_id = $2`,
      [id, organizationId]
    );

    if (reviews.length === 0) {
      return respondError(res, "REVIEW_NOT_FOUND", "Review not found", 404);
    }

    // Insert response
    await queryDb(
      `INSERT INTO review_responses (review_id, organization_id, content, created_by)
       VALUES ($1, $2, $3, $4)`,
      [id, organizationId, content.trim(), userId]
    );

    // Update review resolution status
    await queryDb(
      `UPDATE reviews SET resolution_status = 'responded' WHERE id = $1`,
      [id]
    );

    return respondSuccess(res, { responded: true });
  } catch (err) {
    return next(err);
  }
});

// Get reviews for business admin (includes flagged)
reviewsRoutes.get("/admin", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const reviews = await queryDb(
      `SELECT r.id, r.rating, r.content, r.media_urls, r.status, r.resolution_status, r.created_at,
              c.full_name as client_name,
              (SELECT json_agg(json_build_object('content', rr.content, 'created_at', rr.created_at))
               FROM review_responses rr WHERE rr.review_id = r.id) as responses
       FROM reviews r
       LEFT JOIN clients c ON r.client_id = c.id
       WHERE r.organization_id = $1
       ORDER BY r.created_at DESC
       LIMIT 100`,
      [organizationId]
    );

    return respondSuccess(res, reviews);
  } catch (err) {
    return next(err);
  }
});

reviewsRoutes.get("/moderation/queue", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const reviews = await queryDb(
      `SELECT r.id, r.rating, r.content, r.media_urls, r.status, r.resolution_status, r.ai_sentiment, r.created_at,
              c.full_name as client_name,
              b.start_time,
              s.full_name as staff_name
       FROM reviews r
       LEFT JOIN clients c ON r.client_id = c.id
       LEFT JOIN bookings b ON r.booking_id = b.id
       LEFT JOIN staff_members s ON r.staff_member_id = s.id
       WHERE r.organization_id = $1 AND r.status IN ('pending', 'flagged')
       ORDER BY r.created_at DESC
       LIMIT 100`,
      [organizationId]
    );

    return respondSuccess(res, reviews);
  } catch (err) {
    return next(err);
  }
});

reviewsRoutes.post("/:id/approve", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { id } = req.params;

    const result = await queryDb<{ id: string }>(
      `UPDATE reviews
          SET status = 'published',
              resolution_status = COALESCE(resolution_status, 'resolved')
        WHERE id = $1 AND organization_id = $2
        RETURNING id`,
      [id, organizationId]
    );

    if (result.length === 0) {
      return respondError(res, "REVIEW_NOT_FOUND", "Review not found", 404);
    }

    return respondSuccess(res, { approved: true, review_id: id, status: "published" });
  } catch (err) {
    return next(err);
  }
});

reviewsRoutes.post("/:id/reject", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { id } = req.params;
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : null;

    const result = await queryDb<{ id: string }>(
      `UPDATE reviews
          SET status = 'removed',
              resolution_status = CASE WHEN $3 IS NOT NULL THEN 'resolved' ELSE resolution_status END
        WHERE id = $1 AND organization_id = $2
        RETURNING id`,
      [id, organizationId, reason]
    );

    if (result.length === 0) {
      return respondError(res, "REVIEW_NOT_FOUND", "Review not found", 404);
    }

    return respondSuccess(res, { rejected: true, review_id: id, status: "removed", reason });
  } catch (err) {
    return next(err);
  }
});

reviewsRoutes.patch("/:id", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const updates: string[] = [];
    const params: unknown[] = [];
    let index = 1;
    for (const field of ["rating", "content", "status", "resolution_status"]) {
      if (req.body?.[field] !== undefined) {
        updates.push(`${field} = $${index++}`);
        params.push(req.body[field]);
      }
    }
    if (req.body?.media_urls !== undefined) {
      updates.push(`media_urls = $${index++}`);
      params.push(JSON.stringify(req.body.media_urls));
    }
    if (updates.length === 0) {
      return respondError(res, "NO_UPDATES_PROVIDED", "No updates provided", 400);
    }
    params.push(organizationId, req.params.id);
    const result = await queryDb<{ id: string }>(
      `UPDATE reviews
          SET ${updates.join(", ")}
        WHERE organization_id = $${index++} AND id = $${index}
        RETURNING id`,
      params
    );
    if (result.length === 0) {
      return respondError(res, "REVIEW_NOT_FOUND", "Review not found", 404);
    }
    return respondSuccess(res, { updated: true, review_id: result[0].id });
  } catch (err) {
    return next(err);
  }
});

reviewsRoutes.delete("/:id", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const result = await queryDb<{ id: string }>(
      `UPDATE reviews
          SET status = 'removed', resolution_status = 'resolved'
        WHERE organization_id = $1 AND id = $2
        RETURNING id`,
      [organizationId, req.params.id]
    );
    if (result.length === 0) {
      return respondError(res, "REVIEW_NOT_FOUND", "Review not found", 404);
    }
    return respondSuccess(res, { deleted: true, review_id: result[0].id });
  } catch (err) {
    return next(err);
  }
});

