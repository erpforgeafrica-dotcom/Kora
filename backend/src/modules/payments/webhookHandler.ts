import { handleSubscriptionDeleted, markPaymentIntentFailed, markPaymentIntentSucceeded } from "./service.js";

export async function handlePaymentIntentSucceeded(
  organizationId: string,
  paymentIntentId: string,
  paymentMethodId?: string | null,
  chargeId?: string | null,
  receiptUrl?: string | null
) {
  return markPaymentIntentSucceeded({
    organizationId,
    paymentIntentId,
    paymentMethodId,
    chargeId,
    receiptUrl
  });
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
