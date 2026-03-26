import { Request, Response, NextFunction } from 'express';
import { queryDb } from '../db/index.js';

const PLAN_HIERARCHY = {
  basic: 0,
  pro: 1,
  business: 2,
  enterprise: 3
};

// We intercept here to ensure the plan allows access.
export function requirePlan(minimumPlan: keyof typeof PLAN_HIERARCHY) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = res.locals.auth?.organizationId;
      if (!organizationId) {
        return res.status(401).json({ error: 'unauthorized', message: 'Organization ID is required for this action.' });
      }

      const rows = await queryDb<{ ai_plan: string }>('SELECT ai_plan FROM organizations WHERE id = $1', [organizationId]);
      
      const currentPlan = (rows[0]?.ai_plan || 'basic') as keyof typeof PLAN_HIERARCHY;
      const currentLevel = PLAN_HIERARCHY[currentPlan] ?? 0;
      const requiredLevel = PLAN_HIERARCHY[minimumPlan] ?? 0;

      if (currentLevel < requiredLevel) {
        return res.status(403).json({
          error: 'upgrade_required',
          message: `This feature requires the ${minimumPlan.toUpperCase()} plan. You are currently on the ${currentPlan.toUpperCase()} plan.`
        });
      }

      // Stash plan for downstream usage trackers if necessary
      res.locals.auth.ai_plan = currentPlan;
      next();
    } catch (error) {
      next(error);
    }
  };
}
