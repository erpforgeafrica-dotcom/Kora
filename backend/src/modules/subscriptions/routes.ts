import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { requireRole } from "../../middleware/rbac.js";
import { respondSuccess, respondError, respondList } from "../../shared/response.js";
import { SUBSCRIPTION_TRANSITIONS, isValidTransition } from "../../shared/stateMachines.js";
import { invalidatePlanCache } from "../../middleware/planGate.js";
import { logger } from "../../shared/logger.js";

export const subscriptionsRoutes = Router();

// ── Public: list all plans (no auth required) ─────────────────────────────────
subscriptionsRoutes.get("/plans", async (req, res, next) => {
  try {
    const rows = await queryDb(
      `SELECT
         sp.id, sp.name, sp.tagline,
         sp.price_monthly, sp.price_yearly, sp.currency,
         sp.is_free, sp.sort_order,
         sp.stripe_price_id_monthly, sp.stripe_price_id_yearly,
         pf.max_locations, pf.max_staff, pf.max_clients,
         pf.max_bookings_per_month, pf.max_ai_requests_per_month,
         pf.module_bookings, pf.module_clients, pf.module_staff,
         pf.module_services, pf.module_payments, pf.module_crm,
         pf.module_inventory, pf.module_delivery, pf.module_clinical,
         pf.module_emergency, pf.module_ai_insights, pf.module_ai_orchestration,
         pf.module_analytics, pf.module_marketing, pf.module_social,
         pf.module_video, pf.module_automation, pf.module_content,
         pf.module_support, pf.module_white_label, pf.module_api_access,
         pf.module_custom_roles, pf.module_audit_logs, pf.module_sso,
         pf.support_tier, pf.sla_response_hours
       FROM subscription_plans sp
       JOIN plan_features pf ON pf.plan_id = sp.id
       WHERE sp.is_active = true
       ORDER BY sp.sort_order ASC`
    );
    return respondSuccess(res, rows);
  } catch (err) { return next(err); }
});

// ── Get org's current subscription ───────────────────────────────────────────
subscriptionsRoutes.get("/current", requireRole("business_admin", "platform_admin", "operations"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb(
      `SELECT
         s.id::text, s.organization_id::text, s.plan_id,
         s.status, s.billing_interval,
         s.current_period_start::text, s.current_period_end::text,
         s.trial_ends_at::text, s.cancel_at_period_end,
         s.cancelled_at::text, s.provider_subscription_id,
         s.created_at::text,
         sp.name AS plan_name, sp.tagline AS plan_tagline,
         sp.price_monthly, sp.price_yearly, sp.is_free,
         pf.max_locations, pf.max_staff, pf.max_clients,
         pf.max_bookings_per_month, pf.max_ai_requests_per_month,
         pf.support_tier, pf.sla_response_hours
       FROM subscriptions s
       JOIN subscription_plans sp ON sp.id = s.plan_id
       JOIN plan_features pf ON pf.plan_id = s.plan_id
       WHERE s.organization_id = $1
         AND s.status IN ('active','trialing','past_due')
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [organizationId]
    );

    if (!rows[0]) {
      // Return starter plan info even if no subscription record exists
      const starter = await queryDb(
        `SELECT sp.*, pf.* FROM subscription_plans sp
         JOIN plan_features pf ON pf.plan_id = sp.id
         WHERE sp.id = 'starter'`
      );
      return respondSuccess(res, {
        plan_id: "starter",
        status: "active",
        billing_interval: "free",
        is_free: true,
        ...(starter[0] ?? {}),
      });
    }

    return respondSuccess(res, rows[0]);
  } catch (err) { return next(err); }
});

// ── Get org's usage this period ───────────────────────────────────────────────
subscriptionsRoutes.get("/usage", requireRole("business_admin", "platform_admin", "operations"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const [bookings, staff, clients, locations, aiRequests] = await Promise.all([
      queryDb(`SELECT COUNT(*)::int AS n FROM bookings WHERE organization_id=$1 AND created_at >= date_trunc('month', now())`, [organizationId]),
      queryDb(`SELECT COUNT(*)::int AS n FROM staff_members WHERE organization_id=$1 AND status='active'`, [organizationId]),
      queryDb(`SELECT COUNT(*)::int AS n FROM clients WHERE organization_id=$1`, [organizationId]),
      queryDb(`SELECT COUNT(*)::int AS n FROM tenant_branches WHERE organization_id=$1`, [organizationId]).catch(() => [{ n: 1 }]),
      queryDb(`SELECT COALESCE(SUM(ai_requests_count),0)::int AS n FROM subscription_usage WHERE organization_id=$1 AND period_start >= date_trunc('month', now())`, [organizationId]).catch(() => [{ n: 0 }]),
    ]);

    return respondSuccess(res, {
      period: new Date().toISOString().slice(0, 7), // YYYY-MM
      bookings_this_month: bookings[0]?.n ?? 0,
      active_staff: staff[0]?.n ?? 0,
      total_clients: clients[0]?.n ?? 0,
      locations: locations[0]?.n ?? 1,
      ai_requests_this_month: aiRequests[0]?.n ?? 0,
    });
  } catch (err) { return next(err); }
});

// ── Activate free Starter plan (no payment required) ─────────────────────────
subscriptionsRoutes.post("/activate-free", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    // Check if already has active subscription
    const existing = await queryDb(
      `SELECT id FROM subscriptions WHERE organization_id=$1 AND status IN ('active','trialing') LIMIT 1`,
      [organizationId]
    );
    if (existing[0]) return respondError(res, "ALREADY_SUBSCRIBED", "Organization already has an active subscription", 409);

    const row = await queryDb(
      `INSERT INTO subscriptions (
         id, organization_id, plan_id, plan, status, billing_interval,
         current_period_start, current_period_end, created_at, updated_at
       ) VALUES (
         gen_random_uuid(), $1, 'starter', 'starter', 'active', 'free',
         now(), now() + INTERVAL '100 years', now(), now()
       ) RETURNING id::text, plan_id, status, billing_interval, current_period_start::text`,
      [organizationId]
    );

    await queryDb(
      `INSERT INTO subscription_events (organization_id, subscription_id, event_type, to_plan, actor_id)
       VALUES ($1, $2, 'created', 'starter', $3)`,
      [organizationId, row[0].id, res.locals.auth?.userId ?? null]
    ).catch(() => {});

    invalidatePlanCache(organizationId);
    logger.info("Starter plan activated", { organizationId });
    return respondSuccess(res, row[0], 201);
  } catch (err) { return next(err); }
});

// ── Upgrade / change plan ─────────────────────────────────────────────────────
subscriptionsRoutes.post("/change-plan", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const newPlanId = String(req.body?.plan_id ?? "").trim();
    const billingInterval = req.body?.billing_interval === "yearly" ? "yearly" : "monthly";

    if (!["starter", "growth", "professional", "enterprise"].includes(newPlanId)) {
      return respondError(res, "INVALID_PLAN", "Invalid plan. Must be: starter, growth, professional, enterprise", 400);
    }

    // Verify plan exists
    const plan = await queryDb(`SELECT * FROM subscription_plans WHERE id=$1 AND is_active=true`, [newPlanId]);
    if (!plan[0]) return respondError(res, "PLAN_NOT_FOUND", "Plan not found", 404);

    // Get current subscription
    const current = await queryDb(
      `SELECT id::text, plan_id, status FROM subscriptions WHERE organization_id=$1 AND status IN ('active','trialing') ORDER BY created_at DESC LIMIT 1`,
      [organizationId]
    );

    const fromPlan = current[0]?.plan_id ?? null;
    const isUpgrade = !fromPlan || ["starter","growth","professional"].indexOf(fromPlan) < ["starter","growth","professional","enterprise"].indexOf(newPlanId);

    if (plan[0].is_free) {
      // Downgrade to free — immediate
      if (current[0]) {
        await queryDb(
          `UPDATE subscriptions SET plan_id='starter', plan='starter', billing_interval='free',
           status='active', cancel_at_period_end=false, updated_at=now()
           WHERE id=$1`,
          [current[0].id]
        );
      } else {
        await queryDb(
          `INSERT INTO subscriptions (id, organization_id, plan_id, plan, status, billing_interval, current_period_start, current_period_end, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, 'starter', 'starter', 'active', 'free', now(), now() + INTERVAL '100 years', now(), now())`,
          [organizationId]
        );
      }
      invalidatePlanCache(organizationId);
      await logSubscriptionEvent(organizationId, current[0]?.id, "downgraded", fromPlan, "starter", res.locals.auth?.userId);
      return respondSuccess(res, { plan_id: "starter", status: "active", billing_interval: "free", effective: "immediate" });
    }

    // Paid plan — return Stripe checkout session URL
    // In production this creates a Stripe Checkout Session
    // For now return the plan details and signal frontend to initiate payment
    const priceId = billingInterval === "yearly"
      ? plan[0].stripe_price_id_yearly
      : plan[0].stripe_price_id_monthly;

    const price = billingInterval === "yearly" ? plan[0].price_yearly : plan[0].price_monthly;

    await logSubscriptionEvent(organizationId, current[0]?.id, isUpgrade ? "upgraded" : "downgraded", fromPlan, newPlanId, res.locals.auth?.userId);

    return respondSuccess(res, {
      plan_id: newPlanId,
      plan_name: plan[0].name,
      billing_interval: billingInterval,
      price_cents: price,
      currency: plan[0].currency,
      stripe_price_id: priceId,
      // Frontend should use this to initiate Stripe Checkout
      checkout_required: true,
      checkout_url: `/app/settings?section=billing&checkout=true&plan=${newPlanId}&interval=${billingInterval}`,
    });
  } catch (err) { return next(err); }
});

// ── Cancel subscription (at period end) ───────────────────────────────────────
subscriptionsRoutes.post("/cancel", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const immediately = req.body?.immediately === true;

    const current = await queryDb(
      `SELECT id::text, plan_id, status, current_period_end FROM subscriptions
       WHERE organization_id=$1 AND status IN ('active','trialing') ORDER BY created_at DESC LIMIT 1`,
      [organizationId]
    );
    if (!current[0]) return respondError(res, "NO_ACTIVE_SUBSCRIPTION", "No active subscription to cancel", 404);
    if (current[0].plan_id === "starter") return respondError(res, "CANNOT_CANCEL_FREE", "Free plan cannot be cancelled", 400);

    if (immediately) {
      await queryDb(
        `UPDATE subscriptions SET status='cancelled', cancelled_at=now(), cancel_at_period_end=false, updated_at=now() WHERE id=$1`,
        [current[0].id]
      );
      // Downgrade to starter immediately
      await queryDb(
        `INSERT INTO subscriptions (id, organization_id, plan_id, plan, status, billing_interval, current_period_start, current_period_end, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, 'starter', 'starter', 'active', 'free', now(), now() + INTERVAL '100 years', now(), now())`,
        [organizationId]
      );
    } else {
      await queryDb(
        `UPDATE subscriptions SET cancel_at_period_end=true, updated_at=now() WHERE id=$1`,
        [current[0].id]
      );
    }

    invalidatePlanCache(organizationId);
    await logSubscriptionEvent(organizationId, current[0].id, "cancelled", current[0].plan_id, immediately ? "starter" : null, res.locals.auth?.userId, { immediately });

    return respondSuccess(res, {
      cancelled: true,
      immediately,
      effective_date: immediately ? new Date().toISOString() : current[0].current_period_end,
      downgrade_to: "starter",
    });
  } catch (err) { return next(err); }
});

// ── Reactivate cancelled subscription ────────────────────────────────────────
subscriptionsRoutes.post("/reactivate", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb(
      `UPDATE subscriptions SET cancel_at_period_end=false, cancelled_at=null, updated_at=now()
       WHERE organization_id=$1 AND cancel_at_period_end=true AND status='active'
       RETURNING id::text, plan_id, status`,
      [organizationId]
    );
    if (!rows[0]) return respondError(res, "NOTHING_TO_REACTIVATE", "No pending cancellation found", 404);
    invalidatePlanCache(organizationId);
    await logSubscriptionEvent(organizationId, rows[0].id, "reactivated", rows[0].plan_id, rows[0].plan_id, res.locals.auth?.userId);
    return respondSuccess(res, rows[0]);
  } catch (err) { return next(err); }
});

// ── Subscription event history ────────────────────────────────────────────────
subscriptionsRoutes.get("/events", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const rows = await queryDb(
      `SELECT id::text, event_type, from_plan, to_plan, metadata, created_at::text
       FROM subscription_events WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [organizationId]
    );
    return respondList(req, res, rows, { count: rows.length, limit: 50, page: 1 });
  } catch (err) { return next(err); }
});

// ── Platform admin: all subscriptions ────────────────────────────────────────
subscriptionsRoutes.get("/", requireRole("platform_admin"), async (req, res, next) => {
  try {
    const rows = await queryDb(
      `SELECT s.id::text, s.organization_id::text, s.plan_id, s.status,
              s.billing_interval, s.current_period_start::text, s.current_period_end::text,
              s.cancel_at_period_end, s.created_at::text,
              sp.name AS plan_name, sp.price_monthly
       FROM subscriptions s
       LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
       ORDER BY s.created_at DESC LIMIT 500`
    );
    return respondList(req, res, rows, { count: rows.length, limit: 500, page: 1 });
  } catch (err) { return next(err); }
});

// ── Platform admin: get single subscription ───────────────────────────────────
subscriptionsRoutes.get("/:id", requireRole("platform_admin"), async (req, res, next) => {
  try {
    const rows = await queryDb(
      `SELECT s.*, sp.name AS plan_name FROM subscriptions s
       LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
       WHERE s.id=$1 LIMIT 1`,
      [req.params.id]
    );
    if (!rows[0]) return respondError(res, "SUBSCRIPTION_NOT_FOUND", "Subscription not found", 404);
    return respondSuccess(res, rows[0]);
  } catch (err) { return next(err); }
});

// ── Platform admin: update subscription ──────────────────────────────────────
subscriptionsRoutes.patch("/:id", requireRole("platform_admin"), async (req, res, next) => {
  try {
    if (req.body?.status !== undefined) {
      const current = await queryDb(`SELECT status FROM subscriptions WHERE id=$1`, [req.params.id]);
      if (!current[0]) return respondError(res, "SUBSCRIPTION_NOT_FOUND", "Subscription not found", 404);
      const newStatus = String(req.body.status).trim();
      if (!isValidTransition(SUBSCRIPTION_TRANSITIONS, current[0].status as any, newStatus as any)) {
        const allowed = SUBSCRIPTION_TRANSITIONS[current[0].status as keyof typeof SUBSCRIPTION_TRANSITIONS] ?? [];
        return respondError(res, "INVALID_TRANSITION",
          `Cannot transition from '${current[0].status}' to '${newStatus}'`, 422, { allowed });
      }
    }
    const rows = await queryDb(
      `UPDATE subscriptions
         SET plan_id = COALESCE($2, plan_id),
             plan    = COALESCE($2, plan),
             status  = COALESCE($3, status),
             updated_at = now()
       WHERE id=$1
       RETURNING id::text, plan_id, status, updated_at::text`,
      [req.params.id,
       req.body?.plan_id ?? null,
       req.body?.status ?? null]
    );
    if (!rows[0]) return respondError(res, "SUBSCRIPTION_NOT_FOUND", "Subscription not found", 404);
    return respondSuccess(res, rows[0]);
  } catch (err) { return next(err); }
});

// ── Helper ────────────────────────────────────────────────────────────────────
async function logSubscriptionEvent(
  organizationId: string, subscriptionId: string | null,
  eventType: string, fromPlan: string | null, toPlan: string | null,
  actorId: string | null, metadata: Record<string, unknown> = {}
) {
  await queryDb(
    `INSERT INTO subscription_events (organization_id, subscription_id, event_type, from_plan, to_plan, actor_id, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
    [organizationId, subscriptionId, eventType, fromPlan, toPlan, actorId, JSON.stringify(metadata)]
  ).catch(() => {});
}
