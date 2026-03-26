/**
 * Workflow State Machine Types
 * Defines canonical types for state machines across all entities
 */

export enum EntityType {
  BOOKING = "booking",
  SUBSCRIPTION = "subscription",
  SERVICE = "service",
  BUSINESS = "business",
  STAFF_ASSIGNMENT = "staff_assignment",
}

export enum BookingState {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CHECKED_IN = "checked_in",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
  FAILED = "failed",
}

export enum SubscriptionState {
  TRIALING = "trialing",
  ACTIVE = "active",
  PAST_DUE = "past_due",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
}

export interface WorkflowDefinition {
  id: string;
  entity_type: EntityType;
  name: string;
  description: string;
  initial_state: string;
  terminal_states: string[];
  transitions: Record<string, string[]>; // { "state": ["nextState1", "nextState2"] }
  created_at: string;
}

export interface WorkflowInstance {
  id: string;
  business_id: string;
  entity_type: EntityType;
  entity_id: string;
  workflow_definition_id: string;
  current_state: string;
  previous_state: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTransition {
  id: string;
  workflow_instance_id: string;
  from_state: string;
  to_state: string;
  triggered_by: string; // user_id
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface StateTransitionRequest {
  to_state: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface StateTransitionResult {
  success: boolean;
  from_state: string;
  to_state: string;
  transition_id: string;
  timestamp: string;
  error?: string;
}

export class InvalidStateTransitionError extends Error {
  constructor(
    public readonly entity_id: string,
    public readonly current_state: string,
    public readonly requested_state: string,
    public readonly valid_states: string[]
  ) {
    super(
      `Invalid state transition from '${current_state}' to '${requested_state}'. Valid states: ${valid_states.join(", ")}`
    );
    this.name = "InvalidStateTransitionError";
  }
}

export class WorkflowNotFoundError extends Error {
  constructor(entity_id: string) {
    super(`No workflow instance found for entity: ${entity_id}`);
    this.name = "WorkflowNotFoundError";
  }
}
