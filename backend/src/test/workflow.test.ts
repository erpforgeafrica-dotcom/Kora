/**
 * Workflow Engine & Subscription Workflow Tests
 */

import { randomUUID } from "crypto";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { queryDb } from "../db/client.js";

const { enqueueNotificationMock } = vi.hoisted(() => ({
  enqueueNotificationMock: vi.fn().mockResolvedValue({ id: "job-1" })
}));

vi.mock("../queues/index.js", () => ({
  enqueueNotification: enqueueNotificationMock
}));

import { WorkflowEngine } from "../workflows/WorkflowEngine.js";
import { subscriptionWorkflow } from "../workflows/SubscriptionWorkflow.js";

async function ensureWorkflowSchema() {
  await queryDb(
    `CREATE TABLE IF NOT EXISTS workflow_states (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
       entity_type TEXT NOT NULL,
       entity_id TEXT NOT NULL,
       current_state TEXT NOT NULL,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`
  );

  await queryDb(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_states_entity_unique
     ON workflow_states(entity_type, entity_id)`
  );

  await queryDb(
    `ALTER TABLE workflow_transitions
     ADD COLUMN IF NOT EXISTS organization_id UUID,
     ADD COLUMN IF NOT EXISTS entity_type TEXT,
     ADD COLUMN IF NOT EXISTS entity_id TEXT,
     ADD COLUMN IF NOT EXISTS reason TEXT,
     ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
     ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  );

  await queryDb(
    `ALTER TABLE workflow_transitions
     ALTER COLUMN triggered_by TYPE TEXT USING triggered_by::text`
  );

  await queryDb(
    `ALTER TABLE workflow_transitions
     ALTER COLUMN workflow_instance_id DROP NOT NULL`
  );

  await queryDb(
    `ALTER TABLE workflow_transitions
     ALTER COLUMN from_state DROP NOT NULL`
  );
}

beforeAll(async () => {
  await ensureWorkflowSchema();
});

describe("WorkflowEngine", () => {
  let engine: WorkflowEngine;
  let testOrgId: string;
  let testEntityId: string;

  beforeEach(async () => {
    engine = new WorkflowEngine();
    testOrgId = randomUUID();
    testEntityId = randomUUID();

    await queryDb(
      `INSERT INTO organizations (id, name)
       VALUES ($1, $2)`,
      [testOrgId, `Workflow Engine ${testOrgId}`]
    );
  });

  afterEach(async () => {
    await queryDb(
      "DELETE FROM workflow_transitions WHERE organization_id = $1",
      [testOrgId]
    );
    await queryDb(
      "DELETE FROM workflow_states WHERE organization_id = $1",
      [testOrgId]
    );
    await queryDb(
      "DELETE FROM organizations WHERE id = $1",
      [testOrgId]
    );
    enqueueNotificationMock.mockClear();
  });

  describe("transitionState", () => {
    it("creates an initial workflow state row and returns from/to state", async () => {
      const result = await engine.transitionState({
        organizationId: testOrgId,
        entityType: "subscription",
        entityId: testEntityId,
        toState: "trialing",
        triggeredBy: "user_123",
        reason: "Initial subscription"
      });

      expect(result.success).toBe(true);
      expect(result.from_state).toBeNull();
      expect(result.to_state).toBe("trialing");

      const stateRows = await queryDb<{ current_state: string }>(
        `SELECT current_state
         FROM workflow_states
         WHERE organization_id = $1
           AND entity_type = 'subscription'
           AND entity_id = $2`,
        [testOrgId, testEntityId]
      );

      expect(stateRows[0]?.current_state).toBe("trialing");
    });

    it("records transitions with triggered_by stored as text", async () => {
      await engine.transitionState({
        organizationId: testOrgId,
        entityType: "subscription",
        entityId: testEntityId,
        toState: "trialing",
        triggeredBy: "user_123",
        reason: "Seed"
      });

      const result = await engine.transitionState({
        organizationId: testOrgId,
        entityType: "subscription",
        entityId: testEntityId,
        toState: "active",
        triggeredBy: "staff:test-user",
        reason: "Activation"
      });

      expect(result.success).toBe(true);
      expect(result.from_state).toBe("trialing");
      expect(result.to_state).toBe("active");

      const rows = await queryDb<{
        from_state: string | null;
        to_state: string;
        triggered_by: string;
      }>(
        `SELECT from_state, to_state, triggered_by
         FROM workflow_transitions
         WHERE organization_id = $1
           AND entity_type = 'subscription'
           AND entity_id = $2
         ORDER BY created_at DESC`,
        [testOrgId, testEntityId]
      );

      expect(rows[0]?.from_state).toBe("trialing");
      expect(rows[0]?.to_state).toBe("active");
      expect(rows[0]?.triggered_by).toBe("staff:test-user");
    });

    it("updates workflow_states deterministically across sequential transitions", async () => {
      await engine.transitionState({
        organizationId: testOrgId,
        entityType: "subscription",
        entityId: testEntityId,
        toState: "trialing",
        triggeredBy: "system"
      });

      await engine.transitionState({
        organizationId: testOrgId,
        entityType: "subscription",
        entityId: testEntityId,
        toState: "active",
        triggeredBy: "system"
      });

      await engine.transitionState({
        organizationId: testOrgId,
        entityType: "subscription",
        entityId: testEntityId,
        toState: "past_due",
        triggeredBy: "system"
      });

      const state = await engine.getCurrentState(
        testOrgId,
        "subscription",
        testEntityId
      );

      expect(state).toBe("past_due");
    });
  });

  describe("getTransitionHistory", () => {
    it("returns transitions newest-first for the entity", async () => {
      await engine.transitionState({
        organizationId: testOrgId,
        entityType: "subscription",
        entityId: testEntityId,
        toState: "trialing",
        triggeredBy: "user_123",
        reason: "Step 1"
      });

      await engine.transitionState({
        organizationId: testOrgId,
        entityType: "subscription",
        entityId: testEntityId,
        toState: "active",
        triggeredBy: "user_123",
        reason: "Step 2"
      });

      const history = await engine.getTransitionHistory(
        testOrgId,
        "subscription",
        testEntityId
      );

      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[0].to_state).toBe("active");
      expect(history[1].to_state).toBe("trialing");
    });
  });
});

describe("SubscriptionWorkflow", () => {
  let testOrgId: string;
  let testSubId: string;
  let testUserId: string;
  let testClientId: string;
  let testServiceId: string;
  let testPaymentMethodId: string;

  beforeEach(async () => {
    testOrgId = randomUUID();
    testSubId = randomUUID();
    testUserId = randomUUID();
    testClientId = randomUUID();
    testServiceId = randomUUID();
    testPaymentMethodId = randomUUID();

    await queryDb(
      `INSERT INTO organizations (id, name)
       VALUES ($1, $2)`,
      [testOrgId, `Workflow Subscription ${testOrgId}`]
    );

    await queryDb(
      `INSERT INTO subscriptions
       (id, organization_id, client_id, service_id, current_state,
        billing_cycle_start, billing_cycle_end, auto_renew, payment_method_id,
        failed_payment_attempts)
       VALUES ($1, $2, $3, $4, 'stale_mirror',
        NOW(), NOW() + INTERVAL '30 days', true, $5, 0)`,
      [testSubId, testOrgId, testClientId, testServiceId, testPaymentMethodId]
    );

    await queryDb(
      `INSERT INTO workflow_states
       (id, organization_id, entity_type, entity_id, current_state)
       VALUES (gen_random_uuid(), $1, 'subscription', $2, 'trialing')`,
      [testOrgId, testSubId]
    );
  });

  afterEach(async () => {
    await queryDb(
      "DELETE FROM workflow_transitions WHERE organization_id = $1",
      [testOrgId]
    );
    await queryDb(
      "DELETE FROM workflow_states WHERE organization_id = $1 AND entity_id = $2",
      [testOrgId, testSubId]
    );
    await queryDb(
      "DELETE FROM subscriptions WHERE id = $1",
      [testSubId]
    );
    await queryDb(
      "DELETE FROM organizations WHERE id = $1",
      [testOrgId]
    );
    enqueueNotificationMock.mockClear();
  });

  it("returns the joined workflow state instead of subscriptions.current_state", async () => {
    const subscription = await subscriptionWorkflow.getSubscription(
      testOrgId,
      testSubId
    );

    expect(subscription?.current_state).toBe("trialing");

    const rawRows = await queryDb<{ current_state: string }>(
      `SELECT current_state FROM subscriptions WHERE id = $1`,
      [testSubId]
    );

    expect(rawRows[0]?.current_state).toBe("stale_mirror");
  });

  it("activates a subscription from trialing and updates workflow_states", async () => {
    const result = await subscriptionWorkflow.activateSubscription({
      organizationId: testOrgId,
      subscriptionId: testSubId,
      userId: testUserId
    });

    expect(result.success).toBe(true);
    expect(result.from_state).toBe("trialing");
    expect(result.to_state).toBe("active");

    const workflowRows = await queryDb<{ current_state: string }>(
      `SELECT current_state
       FROM workflow_states
       WHERE organization_id = $1
         AND entity_type = 'subscription'
         AND entity_id = $2`,
      [testOrgId, testSubId]
    );

    expect(workflowRows[0]?.current_state).toBe("active");

    const subscription = await subscriptionWorkflow.getSubscription(
      testOrgId,
      testSubId
    );
    expect(subscription?.current_state).toBe("active");
  });

  it("records transition history for canonical workflow changes", async () => {
    await subscriptionWorkflow.activateSubscription({
      organizationId: testOrgId,
      subscriptionId: testSubId,
      userId: testUserId
    });

    await subscriptionWorkflow.enterDunning(
      testOrgId,
      testSubId,
      testUserId
    );

    const history = await subscriptionWorkflow.getSubscriptionHistory(
      testOrgId,
      testSubId
    );

    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[0].to_state).toBe("past_due");
    expect(history[1].to_state).toBe("active");
  });

  it("moves active subscriptions to past_due and increments failed attempts", async () => {
    await subscriptionWorkflow.activateSubscription({
      organizationId: testOrgId,
      subscriptionId: testSubId,
      userId: testUserId
    });

    const result = await subscriptionWorkflow.enterDunning(
      testOrgId,
      testSubId,
      testUserId
    );

    expect(result.success).toBe(true);
    expect(result.from_state).toBe("active");
    expect(result.to_state).toBe("past_due");

    const subscription = await subscriptionWorkflow.getSubscription(
      testOrgId,
      testSubId
    );
    expect(subscription?.current_state).toBe("past_due");
    expect(subscription?.failed_payment_attempts).toBe(1);
  });

  it("reactivates past_due subscriptions back to active", async () => {
    await subscriptionWorkflow.activateSubscription({
      organizationId: testOrgId,
      subscriptionId: testSubId,
      userId: testUserId
    });
    await subscriptionWorkflow.enterDunning(
      testOrgId,
      testSubId,
      testUserId
    );

    const result = await subscriptionWorkflow.activateSubscription({
      organizationId: testOrgId,
      subscriptionId: testSubId,
      userId: testUserId
    });

    expect(result.success).toBe(true);
    expect(result.from_state).toBe("past_due");
    expect(result.to_state).toBe("active");
  });

  it("cancels active subscriptions and then expires cancelled subscriptions", async () => {
    await subscriptionWorkflow.activateSubscription({
      organizationId: testOrgId,
      subscriptionId: testSubId,
      userId: testUserId
    });

    const cancelResult = await subscriptionWorkflow.cancelSubscription({
      organizationId: testOrgId,
      subscriptionId: testSubId,
      userId: testUserId,
      reason: "Customer requested"
    });

    expect(cancelResult.success).toBe(true);
    expect(cancelResult.to_state).toBe("cancelled");

    const expireResult = await subscriptionWorkflow.expireSubscription({
      organizationId: testOrgId,
      subscriptionId: testSubId,
      userId: testUserId
    });

    expect(expireResult.success).toBe(true);
    expect(expireResult.from_state).toBe("cancelled");
    expect(expireResult.to_state).toBe("expired");
  });

  it("rejects invalid transitions with a 422 workflow error", async () => {
    await expect(
      subscriptionWorkflow.cancelSubscription({
        organizationId: testOrgId,
        subscriptionId: testSubId,
        userId: testUserId
      })
    ).rejects.toMatchObject({
      name: "SubscriptionWorkflowError",
      code: "INVALID_TRANSITION",
      statusCode: 422
    });
  });

  it("validateTransition only allows the canonical transition map", async () => {
    const valid = await subscriptionWorkflow.validateTransition(
      testOrgId,
      testSubId,
      "trialing",
      "active"
    );

    expect(valid.valid).toBe(true);

    const invalid = await subscriptionWorkflow.validateTransition(
      testOrgId,
      testSubId,
      "trialing",
      "cancelled"
    );

    expect(invalid.valid).toBe(false);
    expect(invalid.reason).toContain("Cannot transition");
  });

  it("initializeSubscription seeds workflow_states when a subscription has no workflow row", async () => {
    await queryDb(
      `DELETE FROM workflow_states
       WHERE organization_id = $1
         AND entity_type = 'subscription'
         AND entity_id = $2`,
      [testOrgId, testSubId]
    );

    const result = await subscriptionWorkflow.initializeSubscription({
      organizationId: testOrgId,
      subscriptionId: testSubId,
      userId: testUserId
    });

    expect(result.success).toBe(true);
    expect(result.from_state).toBeNull();
    expect(result.to_state).toBe("trialing");

    const subscription = await subscriptionWorkflow.getSubscription(
      testOrgId,
      testSubId
    );

    expect(subscription?.current_state).toBe("trialing");
  });
});
