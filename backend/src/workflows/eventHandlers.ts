/**
 * Workflow Event Handlers
 * Integrations with payments, notifications, finance, and other modules
 * 
 * Subscribed to:
 * - Payment events (success, failure)
 * - Notification delivery status
 * - Finance invoice events
 */

import { logger } from "../shared/logger.js";
import { subscriptionWorkflow } from "./SubscriptionWorkflow.js";

/**
 * Payment success event handler
 * Triggered by: POST /api/payments/webhooks (payment gateway)
 */
export async function handlePaymentSuccess(event: {
  paymentId: string;
  organizationId: string;
  amount: number;
  currency: string;
  metadata?: {
    subscriptionId?: string;
    invoiceId?: string;
  };
}) {
  const { paymentId, organizationId, amount, metadata } = event;
  const subscriptionId = metadata?.subscriptionId;

  logger.info("Payment success event received", {
    organizationId,
    paymentId,
    subscriptionId
  });

  if (!subscriptionId) {
    logger.warn("Payment success without subscription ID", {
      paymentId,
      organizationId
    });
    return;
  }

  try {
    // Check subscription current state
    const subscription = await subscriptionWorkflow.getSubscription(
      organizationId,
      subscriptionId
    );

    if (!subscription) {
      logger.error("Subscription not found for payment", {
        organizationId,
        subscriptionId
      });
      return;
    }

    if (subscription.current_state === "trialing") {
      await subscriptionWorkflow.activateSubscription({
        organizationId,
        subscriptionId,
        reason: `Payment ${paymentId} processed`
      });
    } else if (subscription.current_state === "past_due") {
      await subscriptionWorkflow.completeRenewal(
        organizationId,
        subscriptionId,
        "system"
      );
    }

    logger.info("Payment success handled", {
      organizationId,
      subscriptionId,
      previousState: subscription.current_state
    });
  } catch (err) {
    logger.error("Error handling payment success", {
      error: err instanceof Error ? err.message : String(err),
      organizationId,
      subscriptionId
    });
  }
}

/**
 * Payment failure event handler
 * Triggered by: POST /api/payments/webhooks (payment gateway)
 */
export async function handlePaymentFailure(event: {
  paymentId: string;
  organizationId: string;
  failureReason: string;
  metadata?: {
    subscriptionId?: string;
    attemptNumber?: number;
  };
}) {
  const { paymentId, organizationId, failureReason, metadata } = event;
  const subscriptionId = metadata?.subscriptionId;
  const attemptNumber = metadata?.attemptNumber || 1;

  logger.warn("Payment failure event received", {
    organizationId,
    paymentId,
    subscriptionId,
    failureReason
  });

  if (!subscriptionId) {
    logger.warn("Payment failure without subscription ID", {
      paymentId,
      organizationId
    });
    return;
  }

  try {
    const subscription = await subscriptionWorkflow.getSubscription(
      organizationId,
      subscriptionId
    );

    if (!subscription) {
      logger.error("Subscription not found for payment failure", {
        organizationId,
        subscriptionId
      });
      return;
    }

    // If dunning limit reached (3 attempts), cancel subscription
    const MAX_DUNNING_ATTEMPTS = 3;
    if (attemptNumber >= MAX_DUNNING_ATTEMPTS) {
      await subscriptionWorkflow.cancelSubscription({
        organizationId,
        subscriptionId,
        reason: `Automatic cancellation after ${MAX_DUNNING_ATTEMPTS} failed payment attempts`
      });

      logger.info("Subscription cancelled due to max dunning attempts", {
        organizationId,
        subscriptionId
      });
      return;
    }

    // Move into past_due from active on payment failure.
    if (subscription.current_state === "active") {
      await subscriptionWorkflow.enterDunning(
        organizationId,
        subscriptionId,
        "system"
      );
    }

    logger.info("Payment failure handled", {
      organizationId,
      subscriptionId,
      attemptNumber
    });
  } catch (err) {
    logger.error("Error handling payment failure", {
      error: err instanceof Error ? err.message : String(err),
      organizationId,
      subscriptionId
    });
  }
}

/**
 * Subscription expiry event handler
 * Triggered by: Scheduled job (check for expired subscriptions)
 */
export async function handleSubscriptionExpiry(event: {
  organizationId: string;
  subscriptionId: string;
}) {
  const { organizationId, subscriptionId } = event;

  logger.info("Subscription expiry event received", {
    organizationId,
    subscriptionId
  });

  try {
    const subscription = await subscriptionWorkflow.getSubscription(
      organizationId,
      subscriptionId
    );

    if (!subscription) {
      logger.error("Subscription not found for expiry", {
        organizationId,
        subscriptionId
      });
      return;
    }

    if (subscription.current_state === "cancelled") {
      await subscriptionWorkflow.expireSubscription({
        organizationId,
        subscriptionId,
        userId: "system",
        reason: "Subscription reached expiry after cancellation"
      });

      logger.info("Subscription marked as expired", {
        organizationId,
        subscriptionId
      });
    } else {
      logger.warn("Skipping expiry transition for non-cancelled subscription", {
        organizationId,
        subscriptionId,
        currentState: subscription.current_state,
        autoRenew: subscription.auto_renew
      });
    }
  } catch (err) {
    logger.error("Error handling subscription expiry", {
      error: err instanceof Error ? err.message : String(err),
      organizationId,
      subscriptionId
    });
  }
}

/**
 * Invoice payment event handler
 * Triggered by: Finance module when invoice is paid
 */
export async function handleInvoicePaid(event: {
  organizationId: string;
  invoiceId: string;
  subscriptionId?: string;
  amount: number;
}) {
  const { organizationId, invoiceId, subscriptionId, amount } = event;

  logger.info("Invoice paid event received", {
    organizationId,
    invoiceId,
    subscriptionId
  });

  if (!subscriptionId) {
    // Not subscription-related
    return;
  }

  try {
    const subscription = await subscriptionWorkflow.getSubscription(
      organizationId,
      subscriptionId
    );

    if (!subscription) {
      return;
    }

    if (subscription.current_state === "past_due") {
      await subscriptionWorkflow.completeRenewal(
        organizationId,
        subscriptionId,
        "system"
      );

      logger.info("Renewal completed via invoice payment", {
        organizationId,
        subscriptionId,
        invoiceId
      });
    }
  } catch (err) {
    logger.error("Error handling invoice paid", {
      error: err instanceof Error ? err.message : String(err),
      organizationId,
      subscriptionId
    });
  }
}

/**
 * Notification delivery status event
 * Triggered by: Notifications module when email/SMS delivered
 */
export async function handleNotificationDelivered(event: {
  organizationId: string;
  notificationId: string;
  notificationType: string;
  subscriptionId?: string;
  deliveryStatus: "delivered" | "failed" | "bounced";
}) {
  const { organizationId, notificationType, subscriptionId, deliveryStatus } =
    event;

  if (!subscriptionId || deliveryStatus !== "failed") {
    // Not subscription-related or successful delivery
    return;
  }

  logger.warn("Notification delivery failed for subscription", {
    organizationId,
    subscriptionId,
    notificationType
  });

  // For critical notifications (payment reminders, dunning), log for manual follow-up
  if (
    notificationType.includes("payment") ||
    notificationType.includes("dunning")
  ) {
    // Could trigger escalation workflow or admin alert
    logger.error("Critical subscription notification failed to deliver", {
      organizationId,
      subscriptionId,
      notificationType
    });
  }
}

/**
 * Refund processed event handler
 * Triggered by: Payments module after refund processing
 */
export async function handleRefundProcessed(event: {
  organizationId: string;
  refundId: string;
  originalPaymentId: string;
  amount: number;
  subscriptionId?: string;
}) {
  const { organizationId, refundId, subscriptionId, amount } = event;

  logger.info("Refund processed event received", {
    organizationId,
    refundId,
    subscriptionId
  });

  if (!subscriptionId) {
    return;
  }

  try {
    // Log refund for accounting/audit purposes
    const subscription = await subscriptionWorkflow.getSubscription(
      organizationId,
      subscriptionId
    );

    if (!subscription) {
      return;
    }

    // If subscription was just cancelled, this refund is for proration
    if (subscription.current_state === "cancelled") {
      logger.info("Proration refund processed for cancelled subscription", {
        organizationId,
        subscriptionId,
        refundId,
        amount
      });
    }
  } catch (err) {
    logger.error("Error handling refund", {
      error: err instanceof Error ? err.message : String(err),
      organizationId,
      subscriptionId
    });
  }
}

/**
 * Register all event handlers
 * Can be called from event emitter/pub-sub system
 */
export function registerWorkflowEventHandlers() {
  logger.info("Registering workflow event handlers");

  // In a real system, these would be registered with an event bus:
  // eventBus.on("payment:success", handlePaymentSuccess);
  // eventBus.on("payment:failure", handlePaymentFailure);
  // eventBus.on("subscription:expiry", handleSubscriptionExpiry);
  // eventBus.on("invoice:paid", handleInvoicePaid);
  // eventBus.on("notification:delivered", handleNotificationDelivered);
  // eventBus.on("refund:processed", handleRefundProcessed);
}
