import { handleSubscriptionDeleted, markPaymentIntentFailed, markPaymentIntentSucceeded } from "./service.js";
import { enqueueNotification } from "../../queues/index.js";

export async function handlePaymentIntentSucceeded(
  organizationId: string,
  paymentIntentId: string,
  paymentMethodId?: string | null,
  chargeId?: string | null,
  receiptUrl?: string | null
) {
  const result = await markPaymentIntentSucceeded({
    organizationId,
    paymentIntentId,
    paymentMethodId,
    chargeId,
    receiptUrl
  });

  // Dispatch payment receipt notification
  try {
    await enqueueNotification({
      organizationId,
      channel: "email",
      payload: {
        event_type: "payment_receipt",
        payment_intent_id: paymentIntentId,
        charge_id: chargeId,
        receipt_url: receiptUrl,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Failed to enqueue payment receipt notification", { paymentIntentId, error });
    // Don't throw - payment was successful, just failed to queue notification
  }

  return result;
}

export async function handlePaymentIntentFailed(
  organizationId: string,
  paymentIntentId: string,
  failureCode?: string | null,
  failureMessage?: string | null
) {
  return markPaymentIntentFailed({
    organizationId,
    paymentIntentId,
    failureCode,
    failureMessage
  });
}

export async function handleInvoicePaymentFailed(organizationId: string, stripeSubscriptionId: string) {
  return handleSubscriptionDeleted(organizationId, stripeSubscriptionId);
}
