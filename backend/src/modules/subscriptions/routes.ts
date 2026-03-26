import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { requireRole } from "../../middleware/rbac.js";
import { respondSuccess, respondError, respondList } from "../../shared/response.js";
import { SUBSCRIPTION_TRANSITIONS, isValidTransition } from "../../shared/stateMachines.js";

export const subscriptionsRoutes = Router();

/**
 * Canonical v1.2 Subscriptions (platform-admin) API.
 *
 * NOTE: The repo currently contains multiple historical `subscriptions` shapes across migrations.
 * This router provides a minimal, stable platform_admin list surface so the platform can operate.
 */

subscriptionsRoutes.get("/", requireRole("platform_admin"), async (req, res, next) => {
  try {
    // Intentionally not org-scoped — platform_admin sees all subscriptions across all orgs
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
        order by created_at desc
        limit 500`
    );
    return respondList(req, res, rows, { count: rows.length, limit: 500, page: 1 });
  } catch (error) {
    return next(error);
  }
});

subscriptionsRoutes.get("/:id", requireRole("platform_admin"), async (req, res, next) => {
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
        where id = $1
        limit 1`,
      [req.params.id]
    );
    if (!rows[0]) return respondError(res, "SUBSCRIPTION_NOT_FOUND", "Subscription not found", 404);
    return respondSuccess(res, rows[0]);
  } catch (error) {
    return next(error);
  }
});

subscriptionsRoutes.post("/", requireRole("platform_admin"), async (req, res, next) => {
  try {
    const organizationId = String(req.body?.organization_id ?? "").trim();
    const plan = String(req.body?.plan ?? "").trim();
    // Initial status must be trialing or active — never an arbitrary string
    const rawStatus = String(req.body?.status ?? "trialing").trim();
    const status = ["trialing", "active"].includes(rawStatus) ? rawStatus : "trialing";
    const currentPeriodStart = req.body?.current_period_start ? new Date(req.body.current_period_start) : new Date();
    const currentPeriodEnd = req.body?.current_period_end ? new Date(req.body.current_period_end) : null;
    const providerSubscriptionId = req.body?.provider_subscription_id ? String(req.body.provider_subscription_id).trim() : null;

    if (!organizationId || !plan) {
      return respondError(res, "MISSING_SUBSCRIPTION_FIELDS", "organization_id and plan are required", 400);
    }

    const rows = await queryDb(
      `insert into subscriptions (
          id,
          organization_id,
          plan,
          status,
          start_date,
          end_date,
          provider_subscription_id,
          created_at,
          updated_at
       ) values (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          now(),
          now()
       )
       returning id::text,
                 organization_id::text,
                 plan,
                 status,
                 start_date::text as current_period_start,
                 end_date::text as current_period_end,
                 provider_subscription_id,
                 created_at::text`,
      [organizationId, plan, status, currentPeriodStart.toISOString(), currentPeriodEnd ? currentPeriodEnd.toISOString() : null, providerSubscriptionId]
    );

    return respondSuccess(res, rows[0], 201);
  } catch (error) {
    return next(error);
  }
});

subscriptionsRoutes.patch("/:id", requireRole("platform_admin"), async (req, res, next) => {
  try {
    // Enforce subscription state machine when status is being changed
    if (req.body?.status !== undefined) {
      const current = await queryDb(
        `SELECT status FROM subscriptions WHERE id = $1`,
        [req.params.id]
      );
      if (!current[0]) return respondError(res, "SUBSCRIPTION_NOT_FOUND", "Subscription not found", 404);
      const newStatus = String(req.body.status).trim();
      if (!isValidTransition(SUBSCRIPTION_TRANSITIONS, current[0].status as any, newStatus as any)) {
        const allowed = SUBSCRIPTION_TRANSITIONS[current[0].status as keyof typeof SUBSCRIPTION_TRANSITIONS] ?? [];
        return respondError(res, "INVALID_TRANSITION",
          `Cannot transition subscription from '${current[0].status}' to '${newStatus}'`,
          422, { allowed }
        );
      }
    }
    const rows = await queryDb(
      `update subscriptions
          set plan = coalesce($2, plan),
              status = coalesce($3, status),
              start_date = coalesce($4, start_date),
              end_date = coalesce($5, end_date),
              provider_subscription_id = coalesce($6, provider_subscription_id),
              updated_at = now()
        where id = $1
        returning id::text,
                  organization_id::text,
                  plan,
                  status,
                  start_date::text as current_period_start,
                  end_date::text as current_period_end,
                  provider_subscription_id,
                  created_at::text`,
      [
        req.params.id,
        req.body?.plan !== undefined ? String(req.body.plan).trim() : null,
        req.body?.status !== undefined ? String(req.body.status).trim() : null,
        req.body?.current_period_start ? new Date(req.body.current_period_start).toISOString() : null,
        req.body?.current_period_end ? new Date(req.body.current_period_end).toISOString() : null,
        req.body?.provider_subscription_id !== undefined ? String(req.body.provider_subscription_id).trim() : null
      ]
    );

    if (!rows[0]) return respondError(res, "SUBSCRIPTION_NOT_FOUND", "Subscription not found", 404);
    return respondSuccess(res, rows[0]);
  } catch (error) {
    return next(error);
  }
});
