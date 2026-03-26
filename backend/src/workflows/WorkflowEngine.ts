/**
 * Workflow Engine - Base state machine implementation
 * Handles state validation, transition tracking, and event emission
 */

import { queryDb } from "../db/client.js";
import { logger } from "../shared/logger.js";

export interface TransitionResult {
  success: boolean;
  from_state?: string | null;
  to_state?: string;
  transitionId?: string;
  error?: string;
}

export interface StateTransitionRequest {
  organizationId: string;
  entityType: string;
  entityId: string;
  toState: string;
  triggeredBy: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export class WorkflowEngine {
  /**
   * Instance method: Transition entity to a new state
   */
  async transitionState(
    request: StateTransitionRequest
  ): Promise<TransitionResult> {
    const {
      organizationId,
      entityType,
      entityId,
      toState,
      triggeredBy,
      reason,
      metadata
    } = request;

    try {
      // Get current state
      const currentStateRows = await queryDb<{ current_state: string }>(
        `SELECT current_state FROM workflow_states 
         WHERE organization_id = $1 AND entity_type = $2 AND entity_id = $3`,
        [organizationId, entityType, entityId]
      );

      const fromState = currentStateRows[0]?.current_state || null;

      // Upsert state record
      if (fromState === null) {
        // Create new state record
        await queryDb(
          `INSERT INTO workflow_states 
           (id, organization_id, entity_type, entity_id, current_state, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())`,
          [organizationId, entityType, entityId, toState]
        );
      } else {
        // Update existing state
        await queryDb(
          `UPDATE workflow_states 
           SET current_state = $1, updated_at = NOW()
           WHERE organization_id = $2 AND entity_type = $3 AND entity_id = $4`,
          [toState, organizationId, entityType, entityId]
        );
      }

      // Record transition in audit trail
      const transitionRows = await queryDb<{ id: string }>(
        `INSERT INTO workflow_transitions 
         (id, organization_id, entity_type, entity_id, from_state, to_state, 
          triggered_by, reason, metadata, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING id`,
        [
          organizationId,
          entityType,
          entityId,
          fromState,
          toState,
          triggeredBy,
          reason || "No reason provided",
          JSON.stringify(metadata || {})
        ]
      );

      const transitionId = transitionRows[0]?.id;

      logger.info("State transition recorded", {
        organizationId,
        entityType,
        entityId,
        fromState,
        toState,
        triggeredBy,
        transitionId
      });

      return {
        success: true,
        from_state: fromState,
        to_state: toState,
        transitionId
      };
    } catch (err) {
      logger.error("State transition failed", {
        error: err instanceof Error ? err.message : String(err),
        organizationId,
        entityType,
        entityId,
        toState
      });

      return {
        success: false,
        error: err instanceof Error ? err.message : "Transition failed"
      };
    }
  }

  /**
   * Get current state of an entity
   */
  async getCurrentState(
    organizationId: string,
    entityType: string,
    entityId: string
  ): Promise<string | null> {
    const rows = await queryDb<{ current_state: string }>(
      `SELECT current_state FROM workflow_states 
       WHERE organization_id = $1 AND entity_type = $2 AND entity_id = $3`,
      [organizationId, entityType, entityId]
    );

    return rows[0]?.current_state || null;
  }

  /**
   * Get transition history for an entity
   */
  async getTransitionHistory(
    organizationId: string,
    entityType: string,
    entityId: string,
    limit = 50
  ) {
    const history = await queryDb(
      `SELECT id, from_state, to_state, triggered_by, reason, metadata, created_at
       FROM workflow_transitions
       WHERE organization_id = $1 AND entity_type = $2 AND entity_id = $3
       ORDER BY created_at DESC
       LIMIT $4`,
      [organizationId, entityType, entityId, limit]
    );

    return history;
  }
}
