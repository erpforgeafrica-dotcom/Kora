/**
 * Subscription Workflow State Machine
 * Canonical lifecycle: trialing -> active -> past_due -> active
 *                                   active -> cancelled -> expired
 */

import { queryDb } from "../db/client.js";
import { logger } from "../shared/logger.js";
import { WorkflowEngine, type TransitionResult } from "./WorkflowEngine.js";
import { enqueueNotification } from "../queues/index.js";

export type SubscriptionState =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

const ALLOWED_TRANSITIONS: Record<SubscriptionState, SubscriptionState[]> = {
  trialing: ["active"],
  active: ["past_due", "cancelled"],
  past_due: ["active"],
  cancelled: ["expired"],
  expired: []
};

const SUBSCRIPTION_STATES = new Set<SubscriptionState>([
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "expired"
]);

export interface SubscriptionTransitionPayload {
  organizationId: string;
  subscriptionId: string;
  userId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

interface SubscriptionRecord {
  id: string;
  organization_id: string;
  client_id: string;
  service_id: string;
  plan: string;
  current_state?: string;
  status: string;
  billing_cycle_start: string;
  billing_cycle_end: string;
  auto_renew: boolean;
  payment_method_id: string | null;
  failed_payment_attempts: number;
  start_date: string;
  end_date: string | null;
  provider_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionDetails extends SubscriptionRecord {
  current_state: SubscriptionState;
}

export class SubscriptionWorkflowError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 422,
    public subscriptionId?: string
  ) {
    super(message);
    this.name = "SubscriptionWorkflowError";
  }
}

export class SubscriptionWorkflow {
  private workflowEngine: WorkflowEngine;

  constructor() {
    this.workflowEngine = new WorkflowEngine();
  }

  private isSubscriptionState(value: string | null | undefined): value is SubscriptionState {
    return value !== undefined && value !== null && SUBSCRIPTION_STATES.has(value as SubscriptionState);
  }

  private assertValidState(
    state: string | null | undefined,
    subscriptionId: string
  ): SubscriptionState {
    if (!this.isSubscriptionState(state)) {
      throw new SubscriptionWorkflowError(
        `Subscription ${subscriptionId} is missing a canonical workflow state`,
        "WORKFLOW_STATE_MISSING",
        422,
        subscriptionId
      );
    }

    return state;
  }

  private ensureWorkflowSuccess(
    result: TransitionResult,
    subscriptionId: string
  ): TransitionResult {
    if (!result.success) {
      throw new SubscriptionWorkflowError(
        result.error || "Workflow transition failed",
        "TRANSITION_FAILED",
        500,
        subscriptionId
      );
    }

    return result;
  }

  private buildInvalidTransitionError(
    fromState: SubscriptionState,
    toState: SubscriptionState,
    subscriptionId: string
  ) {
    const allowed = ALLOWED_TRANSITIONS[fromState] || [];
    return new SubscriptionWorkflowError(
      `Cannot transition subscription from ${fromState} to ${toState}. Allowed: ${allowed.join(", ") || "none"}`,
      "INVALID_TRANSITION",
      422,
      subscriptionId
    );
  }

  private async getSubscriptionRecord(
    organizationId: string,
    subscriptionId: string
  ): Promise<SubscriptionRecord | null> {
    const rows = await queryDb<SubscriptionRecord>(
      `SELECT *
       FROM subscriptions
       WHERE id = $1 AND organization_id = $2`,
      [subscriptionId, organizationId]
    );

    return rows[0] || null;
  }

  private async requireSubscriptionRecord(
    organizationId: string,
    subscriptionId: string
  ): Promise<SubscriptionRecord> {
    const subscription = await this.getSubscriptionRecord(organizationId, subscriptionId);

    if (!subscription) {
      throw new SubscriptionWorkflowError(
        "Subscription not found",
        "SUBSCRIPTION_NOT_FOUND",
        404,
        subscriptionId
      );
    }

    return subscription;
  }

  private async requireSubscriptionWithState(
    organizationId: string,
    subscriptionId: string
  ): Promise<SubscriptionDetails> {
    const subscription = await this.getSubscription(organizationId, subscriptionId);

    if (!subscription) {
      const rawSubscription = await this.getSubscriptionRecord(organizationId, subscriptionId);
      if (!rawSubscription) {
        throw new SubscriptionWorkflowError(
          "Subscription not found",
          "SUBSCRIPTION_NOT_FOUND",
          404,
          subscriptionId
        );
      }

      throw new SubscriptionWorkflowError(
        "Subscription is missing a workflow_states row",
        "WORKFLOW_STATE_MISSING",
        422,
        subscriptionId
      );
    }

    return subscription;
  }

  private async transitionSubscription(
    payload: SubscriptionTransitionPayload,
    toState: SubscriptionState,
    metadata: Record<string, unknown>
  ): Promise<{ subscription: SubscriptionDetails; result: TransitionResult }> {
    const { organizationId, subscriptionId, userId, reason } = payload;
    const subscription = await this.requireSubscriptionWithState(
      organizationId,
      subscriptionId
    );
    const currentState = this.assertValidState(
      subscription.current_state,
      subscriptionId
    );

    if (
      toState === "active" &&
      !subscription.payment_method_id
    ) {
      throw new SubscriptionWorkflowError(
        "Cannot activate subscription without payment method",
        "PAYMENT_METHOD_REQUIRED",
        422,
        subscriptionId
      );
    }

    const validation = await this.validateTransition(
      organizationId,
      subscriptionId,
      currentState,
      toState
    );

    if (!validation.valid) {
      throw this.buildInvalidTransitionError(currentState, toState, subscriptionId);
    }

    const result = this.ensureWorkflowSuccess(
      await this.workflowEngine.transitionState({
        organizationId,
        entityType: "subscription",
        entityId: subscriptionId,
        toState,
        triggeredBy: userId || "system",
        reason,
        metadata
      }),
      subscriptionId
    );

    const updatedSubscription = await this.requireSubscriptionWithState(
      organizationId,
      subscriptionId
    );

    return {
      subscription: updatedSubscription,
      result
    };
  }

  async initializeSubscription(
    payload: SubscriptionTransitionPayload
  ): Promise<TransitionResult> {
    const { organizationId, subscriptionId, userId, reason = "Subscription initialized" } = payload;

    logger.info("Initializing subscription", { organizationId, subscriptionId, userId });

    await this.requireSubscriptionRecord(organizationId, subscriptionId);

    const existingState = await this.workflowEngine.getCurrentState(
      organizationId,
      "subscription",
      subscriptionId
    );

    if (existingState) {
      this.assertValidState(existingState, subscriptionId);
      return {
        success: true,
        from_state: existingState,
        to_state: existingState
      };
    }

    const result = this.ensureWorkflowSuccess(
      await this.workflowEngine.transitionState({
        organizationId,
        entityType: "subscription",
        entityId: subscriptionId,
        toState: "trialing",
        triggeredBy: userId || "system",
        reason,
        metadata: {
          initiator: "subscription.initialize",
          ...(payload.metadata || {})
        }
      }),
      subscriptionId
    );

    const subscription = await this.requireSubscriptionWithState(
      organizationId,
      subscriptionId
    );

    await enqueueNotification({
      organizationId,
      channel: "email",
      payload: {
        type: "subscription_trialing",
        subscriptionId,
        clientId: subscription.client_id,
        cycleName: `${new Date(subscription.billing_cycle_start).toLocaleDateString()} - ${new Date(subscription.billing_cycle_end).toLocaleDateString()}`
      }
    });

    return result;
  }

  async activateSubscription(
    payload: SubscriptionTransitionPayload
  ): Promise<TransitionResult> {
    const { organizationId, subscriptionId } = payload;

    logger.info("Activating subscription", { organizationId, subscriptionId });

    const currentSubscription = await this.requireSubscriptionWithState(
      organizationId,
      subscriptionId
    );

    const { subscription, result } = await this.transitionSubscription(
      {
        ...payload,
        reason: payload.reason || "Subscription activated"
      },
      "active",
      {
        initiator: "subscription.activate",
        activatedAt: new Date().toISOString(),
        ...(payload.metadata || {})
      }
    );

    await queryDb(
      `UPDATE subscriptions
       SET failed_payment_attempts = 0,
           updated_at = NOW()
       WHERE id = $1 AND organization_id = $2`,
      [subscriptionId, organizationId]
    );

    await enqueueNotification({
      organizationId,
      channel: "email",
      payload: {
        type:
          currentSubscription.current_state === "past_due"
            ? "subscription_reactivated"
            : "subscription_activated",
        subscriptionId,
        clientId: subscription.client_id,
        renewalDate: subscription.billing_cycle_end
      }
    });

    return result;
  }

  async pauseSubscription(
    payload: SubscriptionTransitionPayload
  ): Promise<TransitionResult> {
    throw new SubscriptionWorkflowError(
      "Pause is not supported by the canonical subscription state machine",
      "INVALID_TRANSITION",
      422,
      payload.subscriptionId
    );
  }

  async resumeSubscription(
    payload: SubscriptionTransitionPayload
  ): Promise<TransitionResult> {
    return this.activateSubscription({
      ...payload,
      reason: payload.reason || "Subscription reactivated"
    });
  }

  async triggerRenewal(
    payload: SubscriptionTransitionPayload
  ): Promise<TransitionResult> {
    throw new SubscriptionWorkflowError(
      "Renewal staging is not supported by the canonical subscription state machine",
      "INVALID_TRANSITION",
      422,
      payload.subscriptionId
    );
  }

  async completeRenewal(
    organizationId: string,
    subscriptionId: string,
    userId: string
  ): Promise<TransitionResult> {
    const subscription = await this.requireSubscriptionWithState(
      organizationId,
      subscriptionId
    );
    const oldEnd = new Date(subscription.billing_cycle_end);
    const newStart = oldEnd.toISOString();
    const newEnd = new Date(oldEnd.getTime() + 30 * 24 * 60 * 60 * 1000);

    const result = await this.activateSubscription({
      organizationId,
      subscriptionId,
      userId,
      reason: "Renewal payment successful",
      metadata: {
        initiator: "subscription.renewal_complete",
        renewedAt: new Date().toISOString(),
        newEnd: newEnd.toISOString()
      }
    });

    await queryDb(
      `UPDATE subscriptions
       SET billing_cycle_start = $1,
           billing_cycle_end = $2,
           failed_payment_attempts = 0,
           updated_at = NOW()
       WHERE id = $3 AND organization_id = $4`,
      [newStart, newEnd.toISOString(), subscriptionId, organizationId]
    );

    return result;
  }

  async enterDunning(
    organizationId: string,
    subscriptionId: string,
    userId: string
  ): Promise<TransitionResult> {
    logger.info("Marking subscription as past_due", { organizationId, subscriptionId });

    const subscription = await this.requireSubscriptionWithState(
      organizationId,
      subscriptionId
    );
    const attemptCount = (subscription.failed_payment_attempts || 0) + 1;

    const { result } = await this.transitionSubscription(
      {
        organizationId,
        subscriptionId,
        userId,
        reason: `Payment failed (attempt ${attemptCount})`
      },
      "past_due",
      {
        initiator: "subscription.past_due",
        failedAttempts: attemptCount,
        enteredPastDueAt: new Date().toISOString()
      }
    );

    await queryDb(
      `UPDATE subscriptions
       SET failed_payment_attempts = $1,
           updated_at = NOW()
       WHERE id = $2 AND organization_id = $3`,
      [attemptCount, subscriptionId, organizationId]
    );

    await enqueueNotification({
      organizationId,
      channel: "email",
      payload: {
        type: "subscription_past_due",
        subscriptionId,
        clientId: subscription.client_id,
        attemptNumber: attemptCount
      }
    });

    return result;
  }

  async cancelSubscription(
    payload: SubscriptionTransitionPayload
  ): Promise<TransitionResult> {
    const { organizationId, subscriptionId } = payload;

    logger.info("Cancelling subscription", { organizationId, subscriptionId });

    const { subscription, result } = await this.transitionSubscription(
      {
        ...payload,
        reason: payload.reason || "Subscription cancelled"
      },
      "cancelled",
      {
        initiator: "subscription.cancel",
        cancelledAt: new Date().toISOString(),
        ...(payload.metadata || {})
      }
    );

    await enqueueNotification({
      organizationId,
      channel: "email",
      payload: {
        type: "subscription_cancelled",
        subscriptionId,
        clientId: subscription.client_id,
        reason: payload.reason || "Subscription cancelled"
      }
    });

    return result;
  }

  async expireSubscription(
    payload: SubscriptionTransitionPayload
  ): Promise<TransitionResult> {
    const { organizationId, subscriptionId } = payload;

    logger.info("Expiring subscription", { organizationId, subscriptionId });

    const { result } = await this.transitionSubscription(
      {
        ...payload,
        reason: payload.reason || "Subscription expired"
      },
      "expired",
      {
        initiator: "subscription.expire",
        expiredAt: new Date().toISOString(),
        ...(payload.metadata || {})
      }
    );

    return result;
  }

  async getSubscription(
    organizationId: string,
    subscriptionId: string
  ): Promise<SubscriptionDetails | null> {
    const rows = await queryDb<SubscriptionDetails>(
      `SELECT s.*, ws.current_state
       FROM subscriptions s
       JOIN workflow_states ws
         ON ws.entity_id = s.id::text
        AND ws.entity_type = 'subscription'
        AND ws.organization_id = s.organization_id
       WHERE s.id = $1 AND s.organization_id = $2`,
      [subscriptionId, organizationId]
    );

    return rows[0] || null;
  }

  async getSubscriptionHistory(
    organizationId: string,
    subscriptionId: string,
    limit = 50
  ) {
    const history = await queryDb(
      `SELECT
        id, from_state, to_state, triggered_by, reason,
        metadata, created_at
       FROM workflow_transitions
       WHERE organization_id = $1
         AND entity_type = 'subscription'
         AND entity_id = $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [organizationId, subscriptionId, limit]
    );

    return history;
  }

  async validateTransition(
    organizationId: string,
    subscriptionId: string,
    fromState: SubscriptionState,
    toState: SubscriptionState
  ): Promise<{ valid: boolean; reason?: string }> {
    if (!this.isSubscriptionState(fromState) || !this.isSubscriptionState(toState)) {
      return {
        valid: false,
        reason: `Unknown subscription state transition from ${fromState} to ${toState}`
      };
    }

    const subscription = await this.getSubscription(organizationId, subscriptionId);
    if (!subscription) {
      return {
        valid: false,
        reason: "Subscription not found"
      };
    }

    if (subscription.current_state !== fromState) {
      return {
        valid: false,
        reason: `Subscription is in state ${subscription.current_state}, not ${fromState}`
      };
    }

    const allowed = ALLOWED_TRANSITIONS[fromState] || [];
    if (!allowed.includes(toState)) {
      return {
        valid: false,
        reason: `Cannot transition from ${fromState} to ${toState}`
      };
    }

    return { valid: true };
  }
}

export const subscriptionWorkflow = new SubscriptionWorkflow();
