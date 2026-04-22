import { Request, Response, NextFunction } from "express";
import { respondError } from "../shared/response.js";

/**
 * DEPRECATED — use requireFeature() from middleware/planGate.ts instead.
 *
 * This file is kept for backwards compatibility with ai/routes.ts which
 * uses requirePlan('basic'|'pro'|'business'|'enterprise').
 *
 * Mapping to new plan IDs:
 *   basic      → starter
 *   pro        → growth
 *   business   → professional
 *   enterprise → enterprise
 */

const PLAN_MAP: Record<string, string> = {
  basic:      "starter",
  pro:        "growth",
  business:   "professional",
  enterprise: "enterprise",
};

const PLAN_ORDER = ["starter", "growth", "professional", "enterprise"];

export function requirePlan(minimumPlan: "basic" | "pro" | "business" | "enterprise") {
  const mappedMinimum = PLAN_MAP[minimumPlan] ?? "starter";
  const requiredLevel = PLAN_ORDER.indexOf(mappedMinimum);

  return async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = res.locals.auth?.organizationId;
    if (!organizationId) {
      return respondError(res, "UNAUTHORIZED", "Organization context required", 401);
    }

    try {
      // Import planGate dynamically to avoid circular deps
      const { invalidatePlanCache } = await import("./planGate.js");
      const { queryDb } = await import("../db/client.js");

      const rows = await queryDb(
        `SELECT s.plan_id FROM subscriptions s
         WHERE s.organization_id = $1 AND s.status IN ('active','trialing')
         ORDER BY s.created_at DESC LIMIT 1`,
        [organizationId]
      ).catch(() => [] as any[]);

      const currentPlanId = rows[0]?.plan_id ?? "starter";
      const currentLevel = PLAN_ORDER.indexOf(currentPlanId);

      // Store for downstream use (ai/routes.ts reads res.locals.auth.ai_plan)
      res.locals.auth.ai_plan = currentPlanId;

      if (currentLevel < requiredLevel) {
        return respondError(res, "UPGRADE_REQUIRED",
          `This feature requires the ${mappedMinimum} plan. You are on ${currentPlanId}.`,
          402,
          { current_plan: currentPlanId, required_plan: mappedMinimum, upgrade_url: "/app/settings?section=billing" }
        );
      }

      return next();
    } catch {
      // If plan check fails, allow through — don't block on infrastructure errors
      return next();
    }
  };
}
