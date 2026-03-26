import { Router } from "express";
import { withTenantAlias } from "../../shared/blueprintAliases.js";
import { createRefund, getReceiptByTransactionId } from "./service.js";
import { authorize } from "../../middleware/rbac.js";

export const refundsRoutes = Router();

function getOrganizationId(authOrganizationId: string | null | undefined, headerOrganizationId: string | undefined) {
  return authOrganizationId ?? headerOrganizationId ?? null;
}

refundsRoutes.post("/refund", authorize("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getOrganizationId(res.locals.auth?.organizationId, req.header("x-org-id") ?? req.header("x-organization-id"));
    if (!organizationId) {
      return res.status(400).json({ error: { code: "MISSING_ORGANIZATION_ID", message: "missing organization id" } });
    }

    const refund = await createRefund({
      organizationId,
      transactionId: String(req.body?.transaction_id ?? ""),
      amountCents: Number(req.body?.amount_cents ?? 0),
      reason: req.body?.reason ?? "requested_by_customer",
      initiatedBy: res.locals.auth?.userId ?? null
    });

    return res.status(201).json(withTenantAlias(refund, organizationId));
  } catch (error) {
    return next(error);
  }
});

refundsRoutes.get("/receipt/:id", authorize("business_admin", "platform_admin", "staff", "client"), async (req, res, next) => {
  try {
    const organizationId = getOrganizationId(res.locals.auth?.organizationId, req.header("x-org-id") ?? req.header("x-organization-id"));
    if (!organizationId) {
      return res.status(400).json({ error: { code: "MISSING_ORGANIZATION_ID", message: "missing organization id" } });
    }

    const receipt = await getReceiptByTransactionId(req.params.id, organizationId);
    if (!receipt) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "not found" } });
    }

    return res.json(
      withTenantAlias(
        {
          id: receipt.id,
          amount_cents: Number(receipt.amount_cents),
          currency: receipt.currency,
          status: receipt.status,
          processed_at: receipt.processed_at,
          receipt_url: receipt.receipt_url,
          booking_id: receipt.booking_id,
          client_id: receipt.client_id,
          provider: receipt.provider
        },
        organizationId
      )
    );
  } catch (error) {
    return next(error);
  }
});
