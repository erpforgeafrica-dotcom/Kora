import type { ScoredAction } from "./orchestration";

/**
 * PHASE B1 — Audience Type Contracts
 * Agent B consumes endpoints from Agent A (Phase A1–A4)
 */

export type MembershipTier = "none" | "silver" | "gold" | "platinum";
export type AppointmentStatus = "confirmed" | "checked_in" | "in_progress" | "completed" | "no_show";
export type StaffRole = "therapist" | "receptionist" | "manager" | "admin";
export type ServiceVertical = "hair" | "spa" | "nails" | "barbers" | "medspa" | "fitness" | "wellness" | "other";

/**
 * Client Profile — consumed by ClientPortal from GET /api/clients/:id
 */
export interface ClientProfile {
  id: string;
  customer_id?: string | null;
  tenant_id?: string | null;
  email: string;
  full_name: string;
  phone: string | null;
  loyalty_points: number;
  membership_tier: MembershipTier;
  telehealth_consent: boolean;
  preferences: Record<string, unknown>;
  photo_url: string | null;
  balance_due: number;
  upcoming_bookings: Array<{
    id: string;
    start_time: string;
    end_time: string;
    status: AppointmentStatus;
    room: string | null;
    service: { name: string };
    staff: {
      id: string | null;
      full_name: string | null;
      photo_url: string | null;
    };
  }>;
  booking_history: Array<{
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    room: string | null;
    service_name: string | null;
    staff_name: string | null;
  }>;
  invoices: Array<{
    id: string;
    amount_cents: number;
    status: string;
    due_date: string;
  }>;
}

/**
 * Appointment with full context for display
 */
export interface Appointment {
  appointment_id: string;
  tenant_id?: string | null;
  customer_id?: string | null;
  staff_profile_id?: string | null;
  start_time: string; // ISO8601
  end_time: string; // ISO8601
  room: string | null;
  status: AppointmentStatus;
  client: {
    id: string | null;
    name: string | null;
    phone: string | null;
    photo_url: string | null;
    preferences: Record<string, unknown>;
  };
  service: {
    name: string;
    duration_minutes: number;
    notes: string | null;
  };
}

/**
 * Payment Invoice — for balances tab
 */
export interface Invoice {
  id: string;
  amount_cents: number;
  due_date: string;
  status: string;
}

/**
 * Transaction record — for payment history
 */
export interface Transaction {
  id: string;
  client_id: string;
  org_id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  method: "card" | "cash" | "split" | "insurance";
  created_at: string;
  invoice_id: string | null;
  receipt_url: string | null;
}

/**
 * Loyalty Point Event — for loyalty history
 */
export interface LoyaltyEvent {
  id: string;
  type: "earn" | "redeem" | "adjust";
  points: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

/**
 * Service Category — for booking discovery
 */
export interface ServiceCategory {
  id: string;
  slug: ServiceVertical;
  label: string;
  icon: string;
  vertical: ServiceVertical;
}

/**
 * Service — for booking display
 */
export interface Service {
  id: string;
  organization_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  currency: string;
  is_active: boolean;
}

/**
 * Staff Member — for staff selection in booking
 */
export interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  role: StaffRole;
  specializations: string[];
  availability: Record<string, unknown>; // JSONB from DB
  rating: number; // 0–5 star rating
  is_active: boolean;
  created_at?: string;
}

/**
 * Slot — available time slot
 */
export interface TimeSlot {
  start_time: string; // ISO8601
  end_time: string; // ISO8601
  available: boolean;
  staff_id: string;
}

/**
 * Business Metrics — consumed by BusinessAdminDashboard from GET /api/analytics/business-summary
 */
export interface BusinessSummary {
  tenant_id?: string | null;
  tenant?: { id: string };
  revenue: {
    today: number;
    this_week: number;
    this_month: number;
    vs_last_month_pct: number;
  };
  bookings: {
    today_total: number;
    no_show_rate_pct: number;
    cancellation_rate_pct: number;
    avg_booking_value: number;
  };
  staff: {
    utilisation_rate_pct: number;
    top_performer_id: string;
    understaffed_slots: number;
  };
  clients: {
    active_count: number;
    at_churn_risk: number;
    new_this_month: number;
    avg_lifetime_value: number;
  };
  customers?: {
    active_count: number;
    at_churn_risk: number;
    new_this_month: number;
    avg_lifetime_value: number;
  };
  staff_profiles?: {
    utilisation_rate_pct: number;
    top_performer_id: string;
    understaffed_slots: number;
  };
  ai_alerts: ScoredAction[];
}

/**
 * Staff Performance Metrics — consumed by StaffPerformanceDrawer from GET /api/analytics/staff-performance/:id
 */
export interface StaffPerformance {
  tenant_id?: string | null;
  staff_profile_id?: string | null;
  bookings_completed: number;
  avg_session_rating: number;
  revenue_generated: number;
  no_show_contribution_pct: number;
  client_retention_rate: number;
  top_services: string[];
  availability_this_week: Record<string, unknown>;
}

/**
 * Tenant Health — for KÓRA admin dashboard from GET /api/platform/tenant-health
 */
export interface TenantHealth {
  org_id: string;
  tenant_id?: string;
  org_name: string;
  status: "healthy" | "degraded" | "critical";
  monthly_active_users: number;
  ai_spend_this_month_usd: number;
  ai_budget_utilisation_pct: number;
  queue_failures_last_24h: number;
  last_login: string; // ISO8601
}

/**
 * AI Spend Summary — for KÓRA admin dashboard from GET /api/platform/ai-spend-summary
 */
export interface AiSpendSummary {
  tenant_id?: string | null;
  total_spend_usd: number;
  by_provider: {
    claude: number;
    openai: number;
    gemini: number;
    mistral: number;
  };
  by_org: Array<{
    org_id: string;
    tenant_id?: string;
    org_name: string;
    spend_usd: number;
    pct_of_total: number;
  }>;
  top_task_types: Array<{
    task: string;
    token_count: number;
    cost_usd: number;
  }>;
  budget_alerts: Array<{
    org_id: string;
    tenant_id?: string;
    org_name: string;
    utilisation_pct: number;
  }>;
}

/**
 * AI Client Brief — from GET /api/staff/client-brief/:appointment_id
 */
export interface ClientBrief {
  client_name: string;
  brief_summary: string;
  last_service: string | null;
  preferences: string[];
  contraindications: string[];
  suggested_upsells: string[];
}

/**
 * Today's Staff Schedule — from GET /api/staff/today-schedule
 */
export interface TodaysSchedule extends Appointment {}

export interface LoyaltySummary {
  points: number;
  tier: MembershipTier;
  redemption_history: LoyaltyEvent[];
}
