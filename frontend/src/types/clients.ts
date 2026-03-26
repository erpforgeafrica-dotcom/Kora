// Phase 6 — Client Portal types

export type MembershipTier = 'none' | 'silver' | 'gold' | 'platinum';
export type AppointmentStatus = 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'no_show';

export interface StaffPreview {
  id: string;
  full_name: string;
  photo_url: string | null;
  specialisations: string[];
  rating: number; // 0-5
}

export interface ServiceInfo {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description?: string;
}

export interface Appointment {
  id: string;
  appointment_id: string;
  service: ServiceInfo;
  staff: StaffPreview;
  date_time: string; // ISO8601
  end_time: string;
  room?: string;
  status: AppointmentStatus;
  ai_brief?: string; // Pre-visit AI briefing
  notes?: string;
}

export interface LoyaltyInfo {
  points: number;
  tier: MembershipTier;
  tier_points_required: { silver: number; gold: number; platinum: number };
  redemption_history: Array<{
    id: string;
    points_redeemed: number;
    discount_applied: number;
    created_at: string;
  }>;
}

export interface Invoice {
  id: string;
  amount: number;
  amount_paid: number;
  due_date: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  service_date: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  method: 'card' | 'cash' | 'insurance' | 'split';
  date: string;
  invoice_id?: string;
  status: 'completed' | 'failed' | 'pending';
}

export interface ClientProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  photo_url?: string;
  membership_tier: MembershipTier;
  loyalty_points: number;
  telehealth_consent: boolean;
  upcoming_bookings: Appointment[];
  booking_history: Appointment[];
  loyalty_info: LoyaltyInfo;
  outstanding_invoices: Invoice[];
  payment_history: PaymentRecord[];
  balance_due: number;
  preferred_staff_id?: string;
  created_at: string;
}

// Booking flow state
export interface BookingState {
  step: 1 | 2 | 3; // Service Selection | Staff & Time | Confirm
  selected_service?: ServiceInfo;
  selected_category?: string;
  selected_staff?: StaffPreview;
  selected_date?: string; // YYYY-MM-DD
  selected_time?: string; // HH:mm
  loyalty_points_applied?: number;
  notes?: string;
}

// Service discovery
export interface ServiceCategory {
  id: string;
  slug: string;
  label: string;
  icon: string;
  vertical: string;
}

export interface StaffCard {
  id: string;
  full_name: string;
  photo_url: string | null;
  specialisations: string[];
  rating: number;
  next_available?: string; // ISO8601
  total_reviews: number;
}

export interface TimeSlot {
  time: string; // HH:mm
  status: 'available' | 'booked' | 'unavailable';
}
