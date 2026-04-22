import { Router } from "express";
import Stripe from "stripe";
import { respondSuccess, respondError } from "../../shared/response.js";
import { logger } from "../../shared/logger.js";
import {
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handleInvoicePaymentFailed,
} from "../payments/webhookHandler.js";
import { queryDb } from "../../db/client.js";

/**
 * Stripe Webhook Handler — signature-verified
 * Mounted at: POST /api/webhooks/stripe
 * Required env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 */
export const stripeWebhookRoutes = Router();

stripeWebhookRoutes.post("/stripe", async (req, res) => {
  const stripeKey     = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    logger.warn("Stripe webhook env vars not set");
    return respondError(res, "WEBHOOK_NOT_CONFIGURED", "Stripe webhook not configured", 500);
  }

  const rawBody: Buffer | undefined = (req as any).rawBody;
  if (!rawBody) return respondError(res, "MISSING_BODY", "Raw body not available", 400);

  const sig = req.header("stripe-signature");
  if (!sig) return respondError(res, "MISSING_SIGNATURE", "Missing stripe-signature header", 400);

  // Use "as any" for apiVersion — the installed stripe package version determines the correct literal
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-01-27.acacia" as any });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    logger.warn("Stripe webhook signature verification failed", { err: err?.message });
    return respondError(res, "INVALID_SIGNATURE", `Webhook signature verification failed: ${err?.message}`, 400);
  }

  logger.info("Stripe webhook received", { type: event.type, id: event.id });

  const getOrgId = (obj: any): string | null =>
    obj?.metadata?.organization_id ?? obj?.metadata?.organizationId ?? null;

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orgId = getOrgId(pi);
        if (orgId) {
          await handlePaymentIntentSucceeded(
            orgId, pi.id,
            typeof pi.payment_method === "string" ? pi.payment_method : null,
            (pi as any).latest_charge as string | null,
            null
          );
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orgId = getOrgId(pi);
        if (orgId) {
          await handlePaymentIntentFailed(
            orgId, pi.id,
            pi.last_payment_error?.code ?? null,
            pi.last_payment_error?.message ?? null
          );
        }
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as any;
        const orgId = getOrgId(inv);
        const subId = typeof inv.subscription === "string" ? inv.subscription : null;
        if (orgId && subId) await handleInvoicePaymentFailed(orgId, subId);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = getOrgId(sub);
        if (orgId) {
          const status = sub.status === "active"   ? "active"
            : sub.status === "trialing"            ? "trialing"
            : sub.status === "past_due"            ? "past_due"
            : sub.status === "canceled"            ? "cancelled"
            : "expired";
          await queryDb(
            `UPDATE subscriptions SET status=$1, updated_at=now()
             WHERE provider_subscription_id=$2 AND organization_id=$3`,
            [status, sub.id, orgId]
          ).catch((e: any) => logger.warn("subscription status update skipped", { err: e?.message }));
        }
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logger.info("Checkout session completed", { orgId: getOrgId(session), sessionId: session.id });
        break;
      }
      default:
        logger.info("Stripe webhook event not handled", { type: event.type });
    }

    return respondSuccess(res, { received: true, type: event.type });
  } catch (err: any) {
    logger.error("Stripe webhook processing error", { type: event.type, err: err?.message });
    return respondError(res, "WEBHOOK_PROCESSING_ERROR", "Failed to process webhook event", 500);
  }
});
