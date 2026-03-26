import type { QueryResultRow } from "pg";
import type { UserRole } from "../middleware/rbac.js";

export interface UserRow extends QueryResultRow {
  id: string;
  email: string;
  password_hash: string | null;
  role: UserRole;
  organization_id: string | null;
  locked_until: string | null;
  failed_attempts: number;
  created_at?: string;
}

export interface RoleRow extends QueryResultRow {
  id: string;
  name: string;
  description?: string | null;
  organization_id: string;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface PermissionRow extends QueryResultRow {
  id: string;
  name: string;
  description?: string | null;
  resource: string;
  action: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceContract {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  duration_minutes: number;
  price_cents?: number | null;
  currency?: string | null;
}

export interface EmbeddingRow extends QueryResultRow {
  id: string;
  entity_type: 'staff' | 'service' | 'booking';
  entity_id: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  created_at: Date;
}

export type AiPlan = 'basic' | 'pro' | 'business' | 'enterprise';

export interface AiUsageLog extends QueryResultRow {
  id: string;
  organization_id: string;
  user_id: string | null;
  action_type: string;
  tokens: number;
  cost: number;
  created_at: Date;
}

export interface AiDecisionLog extends QueryResultRow {
  id: string;
  organization_id: string;
  action: string;
  input_summary: string | null;
  output: string | null;
  score: number | null;
  reason: string | null;
  created_at: Date;
}
