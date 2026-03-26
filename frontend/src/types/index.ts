// Domain entity types for CRUD operations

export interface Client {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  loyalty_points?: number;
  membership_tier?: string;
  risk_score?: number | null;
  created_at?: string;
  preferred_staff_id?: string | null;
  telehealth_consent?: boolean;
  preferences?: Record<string, unknown>;
  photo_url?: string | null;
  balance_due?: number;
  upcoming_bookings?: Array<{
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    room: string | null;
    service: { name: string | null };
    staff: { id: string; full_name: string; photo_url: string | null };
  }>;
  booking_history?: Array<{
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    room: string | null;
    service_name: string | null;
    staff_name: string | null;
  }>;
  invoices?: Array<{
    id: string;
    amount_cents: number;
    status: string;
    due_date: string;
  }>;
}

export interface Booking {
  id: string;
  client_id: string;
  client_name?: string;
  service_id: string;
  service_name?: string;
  staff_id?: string;
  staff_member_id?: string;
  staff_name?: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  category_id?: string | null;
  description?: string | null;
  duration_minutes: number;
  price_cents: number;
  currency?: string;
  notes?: string | null;
  is_active?: boolean;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  email?: string;
  phone?: string;
  bio?: string;
  status: string;
}

export interface PaymentTransaction {
  id: string;
  booking_id: string;
  amount_cents: number;
  status: string;
  payment_method: string;
  created_at: string;
  receipt_url?: string | null;
  failure_code?: string | null;
  failure_message?: string | null;
}

// Existing types
export interface ReportingMetric {
  key: string;
  value: number;
}

export interface SupportCase {
  id: string;
  customer_id?: string | null;
  customer_name?: string;
  channel: string;
  event: string;
  description: string;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  assignee_id?: string | null;
  assignee_name?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  resolution_note?: string | null;
  escalated?: boolean;
}

export interface OperationsMetric {
  active_deliveries: number;
  queue_depth: number;
  agent_available: number;
  incidents: number;
  avg_dispatch_time: number;
  on_time_rate: number;
  updated_at: string;
}

export interface ReportingSummary {
  module: string;
  generatedAt: string;
  metrics: ReportingMetric[];
  // legacy fields for ReportsCenter rendering
  total_bookings?: number;
  total_revenue_cents?: number;
  active_clients?: number;
  pending_reports?: number;
}

