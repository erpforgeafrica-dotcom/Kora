import { Router } from 'express';
import { billingService } from './billingService.js';
import { requireAuth } from '../../middleware/auth.js';
import { queryDb } from '../../db/index.js';
import { respondError } from '../../shared/response.js';

export const billingRoutes = Router();

billingRoutes.use(requireAuth);

billingRoutes.post('/initialize', async (req, res, next) => {
  try {
    const { plan } = req.body;
    const organizationId = res.locals.auth?.organizationId;
    const userId = res.locals.auth?.userId;

    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }
    if (!plan) {
      return respondError(res, "MISSING_PLAN", "plan is required", 400);
    }

    // Securely acquire the user's verified email out of local JWT bounds
    // mapping strictly to internal systems rather than trusting client UI values.
    const userRows = await queryDb<{email: string}>(`SELECT email FROM users WHERE id = $1`, [userId]);
    const email = userRows[0]?.email;
    if (!email) {
       return respondError(res, "USER_EMAIL_UNRESOLVABLE", "The authenticated identity lacks a verifiable mapped email", 400);
    }

    const initData = await billingService.initializePayment(email, plan, organizationId);
    res.json(initData);
  } catch (err) {
    next(err);
  }
});

billingRoutes.post('/verify', async (req, res, next) => {
  try {
    const { reference } = req.body;
    const organizationId = res.locals.auth?.organizationId;

    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }
    if (!reference) {
       return respondError(res, "MISSING_REFERENCE", "missing reference", 400);
    }

    const verifyData = await billingService.verifyPayment(reference, organizationId);
    res.json(verifyData);
  } catch (err) {
    // Return 400 for generic validation failures so UI can render them
    res.status(400).json({ error: "verification_failed", details: err instanceof Error ? err.message : "Unknown error" });
  }
});

billingRoutes.get('/subscription', async (req, res, next) => {
  try {
    const organizationId = res.locals.auth?.organizationId;
    if (!organizationId) return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);

    // Retrieve active subscription bounding limits robustly
    const rows = await queryDb(`
      SELECT plan, status, start_date, end_date, provider_subscription_id 
      FROM subscriptions 
      WHERE organization_id = $1 AND status = 'active'
      ORDER BY end_date DESC NULLS LAST LIMIT 1
    `, [organizationId]);

    if (!rows.length) {
      return res.json({
        hasActiveSubscription: false,
        plan: "basic" // free fallback default tier
      });
    }

    res.json({
      hasActiveSubscription: true,
      plan: rows[0].plan,
      status: rows[0].status,
      startDate: rows[0].start_date,
      endDate: rows[0].end_date,
      reference: rows[0].provider_subscription_id
    });
  } catch (err) { next(err); }
});

billingRoutes.get('/subscription/dashboard', async (req, res, next) => {
  try {
    const organizationId = res.locals.auth?.organizationId;
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

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
        where organization_id = $1
        order by created_at desc
        limit 1`,
      [organizationId]
    );

    return res.json({
      current_subscription: rows[0] ?? null,
      billing_history: [],
      plan_limits: null
    });
  } catch (err) {
    next(err);
  }
});
