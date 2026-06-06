// ============================================================
// KORA DATABASE TYPES
// Source: KORA_UNIFIED_SOURCE_OF_TRUTH.md v2.0
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type TenantTier          = 'BASIC' | 'ESSENTIAL' | 'PROFESSIONAL' | 'ENTERPRISE';
export type TenantStatus        = 'ACTIVE' | 'SUSPENDED' | 'FROZEN';
export type EntityType          = 'BUSINESS_OWNER' | 'CONSUMER' | 'STAFF' | 'AI_AGENT' | 'DEVICE';
export type EntityRole          = 'OWNER' | 'MANAGER' | 'STAFF' | 'CONSUMER';
export type BookingStatus       = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type BookingChannel      = 'IN_PERSON' | 'VIDEO' | 'AUDIO' | 'HOME_VISIT';
export type AgentType           = 'BOOKING' | 'FINANCE' | 'CRM' | 'COMPLIANCE' | 'DISPATCH';
export type AiActionStatus      = 'PENDING' | 'EXECUTED' | 'FAILED';
export type UsageMetric         = 'AI_TOKENS' | 'API_CALLS' | 'STORAGE_MB';
export type ComplianceFramework = 'GDPR' | 'HIPAA' | 'PCI_DSS' | 'NDPR';
export type RevenueShareType    = 'ROYALTY' | 'MARKETING_FUND' | 'TECH_FEE';
export type RelationshipType    = 'FRANCHISE_PARENT' | 'REPORTS_TO' | 'OWNS';
export type ReferenceType       = 'INVOICE' | 'PAYROLL' | 'REFUND' | 'ESCROW_RELEASE' | 'PLATFORM_FEE';

// ── Foundation ───────────────────────────────────────────────

export interface GlobalCurrency {
  code: string; name: string; symbol: string; decimal_places: number;
}
export interface ExchangeRate {
  id: string; base_currency: string; target_currency: string;
  rate: number; effective_date: string; created_at: string;
}
export interface BillingPlan {
  id: string; name: TenantTier; max_users: number | null;
  storage_mb: number | null; ai_tokens_mo: number | null;
  price_monthly: number; price_annual: number; features: Json; created_at: string;
}

// ── Layer A ──────────────────────────────────────────────────

export interface Tenant {
  id: string; name: string; tenant_code: string; domain: string | null;
  base_currency: string; plan_id: string | null; industry: string | null;
  region: string | null; tier: TenantTier; status: TenantStatus;
  metadata: Json; settings: Json; created_at: string;
}
export type TenantInsert = Omit<Tenant, 'id' | 'created_at'> & { id?: string; created_at?: string };

// ── Layer B ──────────────────────────────────────────────────

export interface EntityGraph {
  id: string; auth_user_id: string | null; tenant_id: string;
  entity_type: EntityType; did: string | null; first_name: string | null;
  last_name: string | null; email: string | null; phone: string | null;
  timezone: string; role: EntityRole | null; metadata: Json; created_at: string;
}
export type EntityGraphInsert = Omit<EntityGraph, 'id' | 'created_at'> & { id?: string; created_at?: string };

export interface EntityRelationship {
  id: string; tenant_id: string; parent_id: string; child_id: string;
  relationship: RelationshipType; created_at: string;
}

// ── Layer C ──────────────────────────────────────────────────

export interface EventStream {
  id: string; tenant_id: string; event_type: string; entity_id: string | null;
  entity_type: string | null; payload: Json; occurred_at: string;
  processed_at: string | null; created_at: string;
}
export type EventStreamInsert = Omit<EventStream, 'id' | 'created_at'> & { id?: string; created_at?: string };

export interface EventSubscription {
  id: string; tenant_id: string; event_type: string;
  handler_url: string | null; is_active: boolean; created_at: string;
}

// ── Layer E ──────────────────────────────────────────────────

export interface Wallet {
  id: string; tenant_id: string; entity_id: string; account_code: string;
  currency: string; is_active: boolean; created_at: string;
}

export interface LedgerEntry {
  id: string; tenant_id: string; debit_account: string; credit_account: string;
  amount: number; currency: string; fx_rate: number;
  reference_type: ReferenceType | null; reference_id: string | null;
  description: string | null; created_at: string;
}
export type LedgerEntryInsert = Omit<LedgerEntry, 'id' | 'created_at'> & { id?: string; created_at?: string };

// ── Layer H ──────────────────────────────────────────────────

export interface AiOrchestrator {
  id: string; tenant_id: string; agent_name: string; agent_type: AgentType;
  model: string; system_prompt: string | null; memory: Json;
  is_active: boolean; created_at: string;
}
export interface AiAction {
  id: string; tenant_id: string; agent_id: string; action_type: string;
  payload: Json; status: AiActionStatus; executed_at: string | null; created_at: string;
}

// ── Layer I ──────────────────────────────────────────────────

export interface TenantSubscription {
  id: string; tenant_id: string; plan_id: string; started_at: string;
  expires_at: string | null; is_active: boolean; created_at: string;
}
export interface UsageMetering {
  id: string; tenant_id: string; metric: UsageMetric; quantity: number;
  period_start: string; period_end: string; created_at: string;
}

// ── Layer J ──────────────────────────────────────────────────

export interface AuditControlPlane {
  id: string; tenant_id: string; actor_id: string | null; action: string;
  resource_type: string | null; resource_id: string | null; diff: Json | null;
  ip_address: string | null; blockchain_hash: string | null;
  occurred_at: string; created_at: string;
}
export type AuditInsert = Omit<AuditControlPlane, 'id' | 'created_at'> & { id?: string; created_at?: string };

export interface ComplianceRule {
  id: string; tenant_id: string; framework: ComplianceFramework;
  rule_key: string; rule_value: Json; is_active: boolean; created_at: string;
}

// ── Layer K ──────────────────────────────────────────────────

export interface FranchiseTree {
  id: string; tenant_id: string; parent_tenant_id: string | null;
  name: Json; level: number; created_at: string;
}
export interface RevenueShareRule {
  id: string; tenant_id: string; franchise_id: string;
  share_percentage: number; rule_type: RevenueShareType; created_at: string;
}

// ── Business Domain ──────────────────────────────────────────

export interface Service {
  id: string; tenant_id: string; name: Json; description: Json;
  price: number; currency: string; duration_minutes: number;
  is_active: boolean; created_at: string;
}
export interface Product {
  id: string; tenant_id: string; name: Json; description: Json;
  sku: string | null; price: number; currency: string;
  stock_qty: number; is_active: boolean; created_at: string;
}
export interface BusinessProfile {
  id: string; tenant_id: string; entity_id: string; bio: Json;
  address: Json; gallery_urls: string[]; social_links: Json;
  verified: boolean; created_at: string;
}
export interface Booking {
  id: string; tenant_id: string; client_id: string; provider_id: string;
  service_id: string; scheduled_at: string; channel: BookingChannel;
  status: BookingStatus; price_agreed: number; currency: string;
  notes: string | null; created_at: string;
}
export type BookingInsert = Omit<Booking, 'id' | 'created_at'> & { id?: string; created_at?: string };

// ── Supabase Database interface ──────────────────────────────

// Supabase v2 requires Insert/Update to extend Record<string,unknown>
// We use 'any' for Insert/Update to let the runtime handle it cleanly
// Row types remain fully typed — all reads are safe
export interface Database {
  public: {
    Tables: {
      global_currencies:    { Row: GlobalCurrency;     Insert: any; Update: any };
      exchange_rates:       { Row: ExchangeRate;        Insert: any; Update: any };
      billing_plans:        { Row: BillingPlan;         Insert: any; Update: any };
      tenants:              { Row: Tenant;              Insert: any; Update: any };
      entity_graph:         { Row: EntityGraph;         Insert: any; Update: any };
      entity_relationships: { Row: EntityRelationship;  Insert: any; Update: any };
      event_stream:         { Row: EventStream;         Insert: any; Update: any };
      event_subscriptions:  { Row: EventSubscription;   Insert: any; Update: any };
      wallets:              { Row: Wallet;              Insert: any; Update: any };
      ledger_entries:       { Row: LedgerEntry;         Insert: any; Update: any };
      ai_orchestrator:      { Row: AiOrchestrator;      Insert: any; Update: any };
      ai_actions:           { Row: AiAction;            Insert: any; Update: any };
      tenant_subscriptions: { Row: TenantSubscription;  Insert: any; Update: any };
      usage_metering:       { Row: UsageMetering;       Insert: any; Update: any };
      audit_control_plane:  { Row: AuditControlPlane;   Insert: any; Update: any };
      compliance_rules:     { Row: ComplianceRule;      Insert: any; Update: any };
      franchise_tree:       { Row: FranchiseTree;       Insert: any; Update: any };
      revenue_share_rules:  { Row: RevenueShareRule;    Insert: any; Update: any };
      services:             { Row: Service;             Insert: any; Update: any };
      products:             { Row: Product;             Insert: any; Update: any };
      business_profiles:    { Row: BusinessProfile;     Insert: any; Update: any };
      bookings:             { Row: Booking;             Insert: any; Update: any };
    };
  };
}
