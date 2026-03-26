/**
 * Subscription Workflow Routes
 * REST API for managing subscription state transitions
 */

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  SubscriptionWorkflowError,
  subscriptionWorkflow
} from "./SubscriptionWorkflow.js";

export const workflowRoutes = Router();

function handleWorkflowRouteError(
  res: any,
  err: unknown,
  subscriptionId: string
) {
  if (!(err instanceof SubscriptionWorkflowError)) {
    return false;
  }

  return res.status(err.statusCode).json({
    status: "error",
    code: err.code,
    message: err.message,
    data: { subscriptionId }
  });
}

/**
 * Initialize subscription (POST /api/workflows/subscriptions/:id/initialize)
 * Seeds the canonical workflow state for the subscription
 */
workflowRoutes.post(
  "/subscriptions/:id/initialize",
  requireAuth,
  async (req, res, next) => {
    try {
      const { id: subscriptionId } = req.params;
      const { reason } = req.body;
      const organizationId = res.locals.auth.organizationId;
      const userId = res.locals.auth.userId;

      const result = await subscriptionWorkflow.initializeSubscription({
        organizationId,
        subscriptionId,
        userId,
        reason
      });

      if (!result.success) {
        return res.status(400).json({
          status: "error",
          code: "TRANSITION_FAILED",
          message: result.error,
          data: { subscriptionId }
        });
      }

      const subscription = await subscriptionWorkflow.getSubscription(
        organizationId,
        subscriptionId
      );

      return res.status(200).json({
        status: "success",
        code: "SUBSCRIPTION_INITIALIZED",
        message: "Subscription initialized",
        data: {
          subscriptionId,
          currentState: subscription?.current_state,
          transitionId: result.transitionId
        }
      });
    } catch (err) {
      if (handleWorkflowRouteError(res, err, req.params.id)) {
        return;
      }
      next(err);
    }
  }
);

/**
 * Activate subscription (POST /api/workflows/subscriptions/:id/activate)
 * Moves subscription from "trialing" or "past_due" to "active"
 */
workflowRoutes.post(
  "/subscriptions/:id/activate",
  requireAuth,
  async (req, res, next) => {
    try {
      const { id: subscriptionId } = req.params;
      const { reason } = req.body;
      const organizationId = res.locals.auth.organizationId;
      const userId = res.locals.auth.userId;

      const result = await subscriptionWorkflow.activateSubscription({
        organizationId,
        subscriptionId,
        userId,
        reason: reason || "Payment completed"
      });

      if (!result.success) {
        return res.status(400).json({
          status: "error",
          code: "ACTIVATION_FAILED",
          message: result.error,
          data: { subscriptionId }
        });
      }

      const subscription = await subscriptionWorkflow.getSubscription(
        organizationId,
        subscriptionId
      );

      return res.status(200).json({
        status: "success",
        code: "SUBSCRIPTION_ACTIVATED",
        message: "Subscription activated",
        data: {
          subscriptionId,
          currentState: subscription?.current_state,
          billingCycleEnd: subscription?.billing_cycle_end,
          transitionId: result.transitionId
        }
      });
    } catch (err) {
      if (handleWorkflowRouteError(res, err, req.params.id)) {
        return;
      }
      next(err);
    }
  }
);

/**
 * Pause subscription (POST /api/workflows/subscriptions/:id/pause)
 */
workflowRoutes.post(
  "/subscriptions/:id/pause",
  requireAuth,
  async (req, res, next) => {
    try {
      const { id: subscriptionId } = req.params;
      const { reason } = req.body;
      const organizationId = res.locals.auth.organizationId;
      const userId = res.locals.auth.userId;

      const result = await subscriptionWorkflow.pauseSubscription({
        organizationId,
        subscriptionId,
        userId,
        reason: reason || "Customer requested pause"
      });

      if (!result.success) {
        return res.status(400).json({
          status: "error",
          code: "PAUSE_FAILED",
          message: result.error,
          data: { subscriptionId }
        });
      }

      return res.status(200).json({
        status: "success",
        code: "SUBSCRIPTION_PAUSED",
        message: "Subscription paused",
        data: {
          subscriptionId,
          currentState: result.to_state,
          transitionId: result.transitionId
        }
      });
    } catch (err) {
      if (handleWorkflowRouteError(res, err, req.params.id)) {
        return;
      }
      next(err);
    }
  }
);

/**
 * Resume subscription (POST /api/workflows/subscriptions/:id/resume)
 */
workflowRoutes.post(
  "/subscriptions/:id/resume",
  requireAuth,
  async (req, res, next) => {
    try {
      const { id: subscriptionId } = req.params;
      const { reason } = req.body;
      const organizationId = res.locals.auth.organizationId;
      const userId = res.locals.auth.userId;

      const result = await subscriptionWorkflow.resumeSubscription({
        organizationId,
        subscriptionId,
        userId,
        reason: reason || "Customer requested resume"
      });

      if (!result.success) {
        return res.status(400).json({
          status: "error",
          code: "RESUME_FAILED",
          message: result.error,
          data: { subscriptionId }
        });
      }

      return res.status(200).json({
        status: "success",
        code: "SUBSCRIPTION_RESUMED",
        message: "Subscription resumed",
        data: {
          subscriptionId,
          currentState: result.to_state,
          transitionId: result.transitionId
        }
      });
    } catch (err) {
      if (handleWorkflowRouteError(res, err, req.params.id)) {
        return;
      }
      next(err);
    }
  }
);

/**
 * Trigger renewal (POST /api/workflows/subscriptions/:id/renew)
 */
workflowRoutes.post(
  "/subscriptions/:id/renew",
  requireAuth,
  async (req, res, next) => {
    try {
      const { id: subscriptionId } = req.params;
      const { reason } = req.body;
      const organizationId = res.locals.auth.organizationId;
      const userId = res.locals.auth.userId;

      const result = await subscriptionWorkflow.triggerRenewal({
        organizationId,
        subscriptionId,
        userId,
        reason: reason || "Scheduled renewal"
      });

      if (!result.success) {
        return res.status(400).json({
          status: "error",
          code: "RENEWAL_FAILED",
          message: result.error,
          data: { subscriptionId }
        });
      }

      return res.status(200).json({
        status: "success",
        code: "RENEWAL_TRIGGERED",
        message: "Renewal process started",
        data: {
          subscriptionId,
          currentState: result.to_state,
          transitionId: result.transitionId
        }
      });
    } catch (err) {
      if (handleWorkflowRouteError(res, err, req.params.id)) {
        return;
      }
      next(err);
    }
  }
);

/**
 * Complete renewal (POST /api/workflows/subscriptions/:id/renew/complete)
 */
workflowRoutes.post(
  "/subscriptions/:id/renew/complete",
  requireAuth,
  async (req, res, next) => {
    try {
      const { id: subscriptionId } = req.params;
      const organizationId = res.locals.auth.organizationId;
      const userId = res.locals.auth.userId;

      const result = await subscriptionWorkflow.completeRenewal(
        organizationId,
        subscriptionId,
        userId
      );

      if (!result.success) {
        return res.status(400).json({
          status: "error",
          code: "RENEWAL_COMPLETION_FAILED",
          message: result.error,
          data: { subscriptionId }
        });
      }

      const subscription = await subscriptionWorkflow.getSubscription(
        organizationId,
        subscriptionId
      );

      return res.status(200).json({
        status: "success",
        code: "RENEWAL_COMPLETED",
        message: "Subscription renewed",
        data: {
          subscriptionId,
          currentState: subscription?.current_state,
          newBillingCycleEnd: subscription?.billing_cycle_end,
          transitionId: result.transitionId
        }
      });
    } catch (err) {
      if (handleWorkflowRouteError(res, err, req.params.id)) {
        return;
      }
      next(err);
    }
  }
);

/**
 * Enter dunning (POST /api/workflows/subscriptions/:id/dunning)
 * Compatibility endpoint: maps payment failure to "past_due"
 */
workflowRoutes.post(
  "/subscriptions/:id/dunning",
  requireAuth,
  async (req, res, next) => {
    try {
      const { id: subscriptionId } = req.params;
      const organizationId = res.locals.auth.organizationId;
      const userId = res.locals.auth.userId;

      const result = await subscriptionWorkflow.enterDunning(
        organizationId,
        subscriptionId,
        userId
      );

      if (!result.success) {
        return res.status(400).json({
          status: "error",
          code: "DUNNING_FAILED",
          message: result.error,
          data: { subscriptionId }
        });
      }

      return res.status(200).json({
        status: "success",
        code: "DUNNING_ACTIVATED",
        message: "Subscription marked as past due",
        data: {
          subscriptionId,
          currentState: result.to_state,
          transitionId: result.transitionId
        }
      });
    } catch (err) {
      if (handleWorkflowRouteError(res, err, req.params.id)) {
        return;
      }
      next(err);
    }
  }
);

/**
 * Cancel subscription (POST /api/workflows/subscriptions/:id/cancel)
 */
workflowRoutes.post(
  "/subscriptions/:id/cancel",
  requireAuth,
  async (req, res, next) => {
    try {
      const { id: subscriptionId } = req.params;
      const { reason } = req.body;
      const organizationId = res.locals.auth.organizationId;
      const userId = res.locals.auth.userId;

      const result = await subscriptionWorkflow.cancelSubscription({
        organizationId,
        subscriptionId,
        userId,
        reason: reason || "Customer requested cancellation"
      });

      if (!result.success) {
        return res.status(400).json({
          status: "error",
          code: "CANCELLATION_FAILED",
          message: result.error,
          data: { subscriptionId }
        });
      }

      return res.status(200).json({
        status: "success",
        code: "SUBSCRIPTION_CANCELLED",
        message: "Subscription cancelled",
        data: {
          subscriptionId,
          currentState: result.to_state,
          transitionId: result.transitionId
        }
      });
    } catch (err) {
      if (handleWorkflowRouteError(res, err, req.params.id)) {
        return;
      }
      next(err);
    }
  }
);

/**
 * Get subscription state history (GET /api/workflows/subscriptions/:id/history)
 */
workflowRoutes.get(
  "/subscriptions/:id/history",
  requireAuth,
  async (req, res, next) => {
    try {
      const { id: subscriptionId } = req.params;
      const { limit = "50" } = req.query;
      const organizationId = res.locals.auth.organizationId;

      const history = await subscriptionWorkflow.getSubscriptionHistory(
        organizationId,
        subscriptionId,
        parseInt(limit as string, 10)
      );

      return res.status(200).json({
        status: "success",
        code: "HISTORY_RETRIEVED",
        message: "Subscription history retrieved",
        data: {
          subscriptionId,
          transitions: history.map((h: any) => ({
            id: h.id,
            fromState: h.from_state,
            toState: h.to_state,
            reason: h.reason,
            triggeredBy: h.triggered_by,
            createdAt: h.created_at,
            metadata: h.metadata
          }))
        }
      });
    } catch (err) {
      if (handleWorkflowRouteError(res, err, req.params.id)) {
        return;
      }
      next(err);
    }
  }
);

/**
 * Get subscription current state (GET /api/workflows/subscriptions/:id)
 */
workflowRoutes.get(
  "/subscriptions/:id",
  requireAuth,
  async (req, res, next) => {
    try {
      const { id: subscriptionId } = req.params;
      const organizationId = res.locals.auth.organizationId;

      const subscription = await subscriptionWorkflow.getSubscription(
        organizationId,
        subscriptionId
      );

      if (!subscription) {
        return res.status(404).json({
          status: "error",
          code: "SUBSCRIPTION_NOT_FOUND",
          message: "Subscription not found",
          data: { subscriptionId }
        });
      }

      return res.status(200).json({
        status: "success",
        code: "SUBSCRIPTION_RETRIEVED",
        message: "Subscription retrieved",
        data: {
          subscriptionId,
          currentState: subscription.current_state,
          billingCycleStart: subscription.billing_cycle_start,
          billingCycleEnd: subscription.billing_cycle_end,
          autoRenew: subscription.auto_renew,
          failedPaymentAttempts: subscription.failed_payment_attempts,
          createdAt: subscription.created_at,
          updatedAt: subscription.updated_at
        }
      });
    } catch (err) {
      if (handleWorkflowRouteError(res, err, req.params.id)) {
        return;
      }
      next(err);
    }
  }
);

/**
 * Validate transition (POST /api/workflows/subscriptions/:id/validate-transition)
 * Check if a state transition is allowed (guard condition check)
 */
workflowRoutes.post(
  "/subscriptions/:id/validate-transition",
  requireAuth,
  async (req, res, next) => {
    try {
      const { id: subscriptionId } = req.params;
      const { fromState, toState } = req.body;
      const organizationId = res.locals.auth.organizationId;

      const validation = await subscriptionWorkflow.validateTransition(
        organizationId,
        subscriptionId,
        fromState,
        toState
      );

      return res.status(200).json({
        status: "success",
        code: "VALIDATION_RESULT",
        message: validation.valid
          ? "Transition is valid"
          : "Transition is not allowed",
        data: {
          subscriptionId,
          fromState,
          toState,
          valid: validation.valid,
          reason: validation.reason
        }
      });
    } catch (err) {
      if (handleWorkflowRouteError(res, err, req.params.id)) {
        return;
      }
      next(err);
    }
  }
);
