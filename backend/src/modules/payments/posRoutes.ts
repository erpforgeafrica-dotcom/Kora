import { Router } from "express";
import { withCustomerAlias, withTenantAlias } from "../../shared/blueprintAliases.js";
import { capturePosPayment, initializePosPayment } from "./service.js";
import { authorize } from "../../middleware/rbac.js";

export const posRoutes = Router();

function getOrganizationId(authOrganizationId: string | null | undefined, headerOrganizationId: string | undefined) {
  return authOrganizationId ?? headerOrganizationId ?? null;
}

posRoutes.post("/initialize", authorize("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getOrganizationId(res.locals.auth?.organizationId, req.header("x-org-id") ?? req.header("x-organization-id"));
    if (!organizationId) {
      return res.status(400).json({ error: { code: "MISSING_ORGANIZATION_ID", message: "missing organization id" } });
    }

    const gateway = String(req.body?.gateway ?? "stripe").toLowerCase() as "stripe" | "flutterwave" | "paystack" | "paypal";
    const initialized = await initializePosPayment({
      organizationId,
      amountCents: Number(req.body?.amount_cents ?? 0),
      currency: String(req.body?.currency ?? "usd"),
      gateway,
      bookingId: req.body?.booking_id ?? null,
      clientId: req.body?.client_id ?? null
    });

    return res.status(201).json(withCustomerAlias(withTenantAlias(initialized, organizationId), req.body?.client_id ?? null));
  } catch (error) {
    return next(error);
  }
});

posRoutes.post("/capture", authorize("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getOrganizationId(res.locals.auth?.organizationId, req.header("x-org-id") ?? req.header("x-organization-id"));
    if (!organizationId) {
      return res.status(400).json({ error: { code: "MISSING_ORGANIZATION_ID", message: "missing organization id" } });
    }

    const captured = await capturePosPayment({
      organizationId,
      gateway: String(req.body?.gateway ?? "stripe").toLowerCase() as "stripe" | "flutterwave" | "paystack" | "paypal",
      reference: String(req.body?.reference ?? req.body?.payment_intent_id ?? ""),
      amountCents: req.body?.amount_cents ? Number(req.body.amount_cents) : null
    });

    return res.json(withTenantAlias(captured, organizationId));
  } catch (error) {
    return next(error);
  }
});
