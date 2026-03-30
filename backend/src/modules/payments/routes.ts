import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { authorize } from "../../middleware/rbac.js";
import { withCustomerAlias, withTenantAlias } from "../../shared/blueprintAliases.js";
import { respondError, respondList, respondSuccess } from "../../shared/response.js";
import {
  attachPaymentMethod,
  createPaymentIntent,
  createRefund,
  getRevenueCycleMetrics,
  listPaymentMethods,
  listTransactions
} from "./service.js";
import { getStripeClient, getStripeConfigurationSummary, isStripeConfigured } from "./stripeClient.js";
import { handleInvoicePaymentFailed, handlePaymentIntentFailed, handlePaymentIntentSucceeded } from "./webhookHandler.js";
import { posRoutes } from "./posRoutes.js";
import { refundsRoutes } from "./refundsRoutes.js";

export const paymentsRoutes = Router();
paymentsRoutes.use("/pos", posRoutes);
paymentsRoutes.use("/", refundsRoutes);

function getOrganizationId(authOrganizationId: string | null | undefined, headerOrganizationId: string | undefined) {
  return authOrganizationId ?? headerOrganizationId ?? null;
}

export async function paymentsWebhookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isStripeConfigured()) {
      return respondError(res, "STRIPE_NOT_CONFIGURED", "Stripe not configured", 503);
    }

    const signature = req.header("stripe-signature");
    if (!signature || !req.rawBody) {
      return respondError(res, "MISSING_WEBHOOK_SIGNATURE", "Missing webhook signature", 400);
    }

    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(req.rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET ?? "");
    const object = event.data.object as {
      id?: string;
      metadata?: Record<string, string>;
      payment_method?: string;
      latest_charge?: string;
      charges?: { data?: Array<{ receipt_url?: string | null }> };
      last_payment_error?: { code?: string | null; message?: string | null };
      subscription?: string;
    };

    const organizationId = object.metadata?.organization_id;
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    if (event.type === "payment_intent.succeeded" && object.id) {
      const receiptUrl = object.charges?.data?.[0]?.receipt_url ?? null;
      await handlePaymentIntentSucceeded(organizationId, object.id, object.payment_method ?? null, object.latest_charge ?? null, receiptUrl);
    }

    if (event.type === "payment_intent.payment_failed" && object.id) {
      await handlePaymentIntentFailed(
        organizationId,
        object.id,
        object.last_payment_error?.code ?? null,
        object.last_payment_error?.message ?? null
      );
    }

    if (event.type === "customer.subscription.deleted" && object.id) {
      await handleInvoicePaymentFailed(organizationId, object.id);
    }

    return respondSuccess(res, { received: true, event_type: event.type });
  } catch (error) {
    return next(error);
  }
}

paymentsRoutes.get("/config", authorize("business_admin", "platform_admin", "staff", "client"), (req, res) => {
  const organizationId = getOrganizationId(res.locals.auth?.organizationId, req.header("x-org-id") ?? req.header("x-organization-id"));
  if (!organizationId) {
    return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
  }

  return respondSuccess(res, {
    organization_id: organizationId,
    ...withTenantAlias({}, organizationId),
    stripe: getStripeConfigurationSummary()
  });
});

paymentsRoutes.post("/intent", authorize("business_admin", "platform_admin", "staff", "client"), async (req, res, next) => {
  try {
    const organizationId = getOrganizationId(res.locals.auth?.organizationId, req.header("x-org-id") ?? req.header("x-organization-id"));
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const amountCents = Number(req.body?.amount_cents);
    const currency = String(req.body?.currency ?? "usd");
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return respondError(res, "VALIDATION_ERROR", "Invalid amount_cents: must be a positive integer", 400);
    }
    if (!/^[a-z]{3}$/i.test(currency)) {
      return respondError(res, "VALIDATION_ERROR", "Invalid currency: must be a 3-letter code", 400);
    }

    const intent = await createPaymentIntent({
      organizationId,
      amountCents,
      currency,
      invoiceId: req.body?.invoice_id,
      bookingId: req.body?.booking_id,
      clientId: req.body?.client_id
    });

    return respondSuccess(
      res,
      withCustomerAlias(withTenantAlias({
        client_secret: intent.clientSecret,
        payment_intent_id: intent.paymentIntentId,
        provider: intent.provider
      }, organizationId), req.body?.client_id ? String(req.body.client_id) : null),
      201
    );
  } catch (error) {
    return next(error);
  }
});

paymentsRoutes.post("/confirm", authorize("business_admin", "platform_admin", "staff", "client"), async (req, res) => {
  return respondSuccess(res, {
    confirmed: true,
    payment_intent_id: req.body?.payment_intent_id ?? null,
    note: "Client-side Stripe confirmation is authoritative. This endpoint exists for flow symmetry."
  });
});

paymentsRoutes.post("/methods/attach", authorize("business_admin", "platform_admin", "staff", "client"), async (req, res, next) => {
  try {
    const organizationId = getOrganizationId(res.locals.auth?.organizationId, req.header("x-org-id") ?? req.header("x-organization-id"));
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const result = await attachPaymentMethod({
      organizationId,
      clientId: String(req.body?.client_id ?? ""),
      paymentMethodId: String(req.body?.payment_method_id ?? ""),
      setDefault: Boolean(req.body?.set_default)
    });

    return respondSuccess(
      res,
      withCustomerAlias(withTenantAlias(result, organizationId), String(req.body?.client_id ?? "")),
      201
    );
  } catch (error) {
    return next(error);
  }
});

paymentsRoutes.get("/methods/:clientId", authorize("business_admin", "platform_admin", "staff", "client"), async (req, res, next) => {
  try {
    const organizationId = getOrganizationId(res.locals.auth?.organizationId, req.header("x-org-id") ?? req.header("x-organization-id"));
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const methods = await listPaymentMethods(req.params.clientId, organizationId);
    const items = methods.map((method) =>
      withCustomerAlias(withTenantAlias({ ...method, customer_id: req.params.clientId }, organizationId), req.params.clientId)
    );
    return respondList(req, res, items, { count: items.length, limit: items.length || 1, page: 1 });
  } catch (error) {
    return next(error);
  }
});

paymentsRoutes.post("/refund", authorize("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getOrganizationId(res.locals.auth?.organizationId, req.header("x-org-id") ?? req.header("x-organization-id"));
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const refund = await createRefund({
      organizationId,
      transactionId: String(req.body?.transaction_id ?? ""),
      amountCents: Number(req.body?.amount_cents ?? 0),
      reason: req.body?.reason ?? "requested_by_customer",
      initiatedBy: null
    });

    return respondSuccess(res, withTenantAlias(refund, organizationId), 201);
  } catch (error) {
    return next(error);
  }
});

paymentsRoutes.get("/refunds", authorize("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getOrganizationId(res.locals.auth?.organizationId, req.header("x-org-id") ?? req.header("x-organization-id"));
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const refunds = await listTransactions(organizationId, {
      status: "refunded",
      start_date: typeof req.query.start_date === "string" ? req.query.start_date : undefined,
      end_date: typeof req.query.end_date === "string" ? req.query.end_date : undefined,
      method: typeof req.query.method === "string" ? req.query.method : undefined
    });

    const items = refunds.map((refund) => ({
      ...refund,
      tenant_id: organizationId,
      customer_id: "client_id" in refund ? refund.client_id : null
    }));
    return respondList(req, res, items, { count: items.length, limit: items.length || 1, page: 1 });
  } catch (error) {
    return next(error);
  }
});

paymentsRoutes.get("/transactions", authorize("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getOrganizationId(res.locals.auth?.organizationId, req.header("x-org-id") ?? req.header("x-organization-id"));
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const transactions = await listTransactions(organizationId, {
      start_date: typeof req.query.start_date === "string" ? req.query.start_date : undefined,
      end_date: typeof req.query.end_date === "string" ? req.query.end_date : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      method: typeof req.query.method === "string" ? req.query.method : undefined
    });
    const items = transactions.map((transaction) => ({
      ...transaction,
      tenant_id: organizationId,
      customer_id: "client_id" in transaction ? transaction.client_id : null,
      staff_profile_id: null
    }));
    const limit = Math.max(1, Number(req.query.limit ?? (items.length || 1)));
    const offset = Math.max(0, Number(req.query.offset ?? 0));
    return respondList(req, res, items, { count: items.length, limit, offset });
  } catch (error) {
    return next(error);
  }
});

paymentsRoutes.get("/:id", authorize("business_admin", "platform_admin", "staff", "client"), async (req, res, next) => {
  try {
    const organizationId = getOrganizationId(res.locals.auth?.organizationId, req.header("x-org-id") ?? req.header("x-organization-id"));
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const rows = await queryDb(
      `select id::text, organization_id::text, booking_id::text, client_id::text, amount_cents, currency, status, payment_method, receipt_url, created_at::text, processed_at::text
         from transactions
        where organization_id = $1 and id = $2
        limit 1`,
      [organizationId, req.params.id]
    );
    if (!rows[0]) {
      return respondError(res, "PAYMENT_NOT_FOUND", "Payment not found", 404);
    }

    return respondSuccess(res, withTenantAlias(rows[0], organizationId));
  } catch (error) {
    return next(error);
  }
});

paymentsRoutes.patch("/:id", authorize("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getOrganizationId(res.locals.auth?.organizationId, req.header("x-org-id") ?? req.header("x-organization-id"));
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const updates: string[] = [];
    const params: unknown[] = [];
    let index = 1;
    for (const field of ["status", "payment_method", "receipt_url"]) {
      if (req.body?.[field] !== undefined) {
        updates.push(`${field} = $${index++}`);
        params.push(req.body[field]);
      }
    }
    if (updates.length === 0) {
      return respondError(res, "VALIDATION_ERROR", "No updates provided", 400);
    }
    params.push(organizationId, req.params.id);
    const rows = await queryDb(
      `update transactions
          set ${updates.join(", ")},
              processed_at = now()
        where organization_id = $${index++} and id = $${index}
        returning id::text, status`,
      params
    );
    if (!rows[0]) {
      return respondError(res, "PAYMENT_NOT_FOUND", "Payment not found", 404);
    }

    return respondSuccess(res, withTenantAlias({ updated: true, payment: rows[0] }, organizationId));
  } catch (error) {
    return next(error);
  }
});

paymentsRoutes.delete("/:id", authorize("business_admin", "platform_admin", "staff", "client"), async (req, res, next) => {
  try {
    const organizationId = getOrganizationId(res.locals.auth?.organizationId, req.header("x-org-id") ?? req.header("x-organization-id"));
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const rows = await queryDb(
      `update transactions
          set status = 'cancelled',
              processed_at = now()
        where organization_id = $1 and id = $2 and status in ('pending', 'requires_capture')
        returning id::text`,
      [organizationId, req.params.id]
    );
    if (!rows[0]) {
      return respondError(res, "PAYMENT_NOT_CANCELLABLE", "Payment not cancellable", 404);
    }

    return respondSuccess(res, withTenantAlias({ deleted: true, id: rows[0].id }, organizationId));
  } catch (error) {
    return next(error);
  }
});

paymentsRoutes.get("/rcm", authorize("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getOrganizationId(res.locals.auth?.organizationId, req.header("x-org-id") ?? req.header("x-organization-id"));
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const metrics = await getRevenueCycleMetrics(organizationId);
    return respondSuccess(res, withTenantAlias(metrics, organizationId));
  } catch (error) {
    return next(error);
  }
});
