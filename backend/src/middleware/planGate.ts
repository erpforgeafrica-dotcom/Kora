import type { NextFunction, Request, Response } from "express";
import { queryDb } from "../db/client.js";
import { respondError } from "../shared/response.js";
import { logger } from "../shared/logger.js";

/**
 * Plan Feature Gate Middleware
 *
 * Usage:
 *   router.get("/crm", requireAuth, requireFeature("module_crm"), handler)
 *   router.post("/bookings", requireAuth, requireFeature("module_bookings"), checkLimit("bookings"), handler)
 *
 * Checks the organization's active plan against plan_features.
 * Returns 402 Payment Required if the feature is not included in their plan.
 * Returns 429 Too Many Requests if a usage limit is exceeded.
 */

type FeatureFlag = keyof PlanFeatures;

interface PlanFeatures {
  module_bookings: boolean;
  module_clients: boolean;
  module_staff: boolean;
  module_services: boolean;
  module_payments: boolean;
  module_crm: boolean;
  module_inventory: boolean;
  module_delivery: boolean;
  module_clinical: boolean;
  module_emergency: boolean;
  module_ai_insights: boolean;
  module_ai_orchestration: boolean;
  module_analytics: boolean;
  module_marketing: boolean;
  module_social: boolean;
  module_video: boolean;
  module_automation: boolean;
  module_content: boolean;
  module_support: boolean;
  module_white_label: boolean;
  module_api_access: boolean;
  module_custom_roles: boolean;
  module_audit_logs: boolean;
  module_sso: boolean;
  max_locations: number;
  max_staff: number;
  max_clients: number;
  max_bookings_per_month: number;
  max_ai_requests_per_month: number;
  max_api_calls_per_day: number;
  plan_id: string;
  plan_name: string;
  support_tier: string;
}

// Cache plan features per org for 5 minutes to avoid DB hit on every request
const planCache = new Map<string, { features: PlanFeatures; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getOrgPlanFeatures(organizationId: string): Promise<PlanFeatures | null> {
  const cached = planCache.get(organizationId);
  if (cached && cached.expiresAt > Date.now()) return cached.features;

  const rows = await queryDb(
    `SELECT
       pf.*,
       sp.id AS plan_id,
       sp.name AS plan_name,
       sp.support_tier
     FROM subscriptions s
     JOIN subscription_plans sp ON sp.id = s.plan_id
     JOIN plan_features pf ON pf.plan_id = sp.id
     WHERE s.organization_id = $1
       AND s.status IN ('active', 'trialing')
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [organizationId]
  ).catch(() => [] as any[]);

  if (!rows[0]) {
    // No active subscription — apply Starter (free) limits
    const starterRows = await queryDb(
      `SELECT pf.*, sp.id AS plan_id, sp.name AS plan_name, sp.support_tier
       FROM plan_features pf
       JOIN subscription_plans sp ON sp.id = pf.plan_id
       WHERE pf.plan_id = 'starter'`
    ).catch(() => [] as any[]);
    if (!starterRows[0]) return null;
    const features = starterRows[0] as PlanFeatures;
    planCache.set(organizationId, { features, expiresAt: Date.now() + CACHE_TTL_MS });
    return features;
  }

  const features = rows[0] as PlanFeatures;
  planCache.set(organizationId, { features, expiresAt: Date.now() + CACHE_TTL_MS });
  return features;
}

export function invalidatePlanCache(organizationId: string) {
  planCache.delete(organizationId);
}

/**
 * requireFeature(flag) — blocks access if the org's plan does not include this module.
 * Returns 402 with upgrade information.
 */
export function requireFeature(flag: FeatureFlag) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = res.locals.auth?.organizationId;
    if (!organizationId) return next(); // no org context — let requireAuth handle it

    try {
      const features = await getOrgPlanFeatures(organizationId);
      if (!features) return next(); // can't determine plan — allow through, log warning

      const value = features[flag];
      if (typeof value === "boolean" && !value) {
        logger.info("Plan feature gate blocked", { organizationId, flag, plan: features.plan_id });
        return respondError(res, "PLAN_FEATURE_NOT_INCLUDED",
          `Your current plan (${features.plan_name}) does not include this feature. Upgrade to access it.`,
          402,
          { feature: flag, current_plan: features.plan_id, upgrade_url: "/app/settings?section=billing" }
        );
      }
    } catch (err: any) {
      logger.warn("Plan feature check failed — allowing through", { err: err?.message });
    }

    return next();
  };
}

/**
 * checkUsageLimit(metric) — blocks if the org has exceeded their plan's usage limit.
 * Returns 429 with current usage and limit.
 */
export function checkUsageLimit(metric: "bookings" | "ai_requests" | "staff" | "clients" | "locations") {
  const limitField: Record<string, keyof PlanFeatures> = {
    bookings:    "max_bookings_per_month",
    ai_requests: "max_ai_requests_per_month",
    staff:       "max_staff",
    clients:     "max_clients",
    locations:   "max_locations",
  };

  const usageQuery: Record<string, string> = {
    bookings:    `SELECT COUNT(*)::int AS n FROM bookings WHERE organization_id=$1 AND created_at >= date_trunc('month', now())`,
    ai_requests: `SELECT COALESCE(SUM(ai_requests_count),0)::int AS n FROM subscription_usage WHERE organization_id=$1 AND period_start >= date_trunc('month', now())`,
    staff:       `SELECT COUNT(*)::int AS n FROM staff_members WHERE organization_id=$1 AND status='active'`,
    clients:     `SELECT COUNT(*)::int AS n FROM clients WHERE organization_id=$1`,
    locations:   `SELECT COUNT(*)::int AS n FROM tenant_branches WHERE organization_id=$1`,
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = res.locals.auth?.organizationId;
    if (!organizationId) return next();

    try {
      const features = await getOrgPlanFeatures(organizationId);
      if (!features) return next();

      const limit = features[limitField[metric]] as number;
      if (limit === -1) return next(); // unlimited

      const rows = await queryDb(usageQuery[metric], [organizationId]).catch(() => [{ n: 0 }]);
      const current = rows[0]?.n ?? 0;

      if (current >= limit) {
        logger.info("Plan usage limit reached", { organizationId, metric, current, limit, plan: features.plan_id });
        return respondError(res, "PLAN_USAGE_LIMIT_REACHED",
          `You have reached your ${metric} limit (${current}/${limit}) for your ${features.plan_name} plan.`,
          429,
          { metric, current, limit, current_plan: features.plan_id, upgrade_url: "/app/settings?section=billing" }
        );
      }
    } catch (err: any) {
      logger.warn("Usage limit check failed — allowing through", { err: err?.message });
    }

    return next();
  };
}
