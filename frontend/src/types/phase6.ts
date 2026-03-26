// Phase 6 — Audience & Gap Closure Types

// ========== CLIENT PORTAL TYPES ==========
export interface ClientProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  loyalty_points: number;
  membership_tier: 'none' | 'silver' | 'gold' | 'platinum';
  telehealth_consent: boolean;
  balance_due: number;
  photo_url?: string | null;
  upcoming_bookings: Appointment[];
  booking_history?: Appointment[];
  loyalty_events?: LoyaltyEvent[];
  invoices?: Invoice[];
  payment_history?: Payment[];
}

export interface Appointment {
  id: string;
  service_id: string;
  service: {
    name: string;
    duration_minutes: number;
    price: number;
  };
  staff_id: string;
  staff: {
    id: string;
    full_name: string;
    photo_url: string | null;
    rating: number;
  };
  scheduled_at: string; // ISO8601
  room: string;
  status: 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'no_show' | 'cancelled';
  notes?: string;
  ai_brief?: {
    summary: string;
    what_to_expect: string;
    bring_with_you: string;
  };
}

export interface LoyaltyEvent {
  id: string;
  type: 'earned' | 'redeemed' | 'bonus' | 'adjustment';
  points: number;
  description: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  appointment_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  issued_at: string;
  due_at: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  service_name: string;
  duration_minutes: number;
  price: number;
  quantity: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  method: 'card' | 'cash' | 'insurance' | 'split';
  status: 'completed' | 'failed' | 'pending';
  created_at: string;
}

// ========== BOOKING FLOW TYPES ==========
export interface ServiceCategory {
  id: string;
  slug: string;
  label: string;
  icon: string;
  vertical: 'hair' | 'spa' | 'nails' | 'barbers' | 'medspa' | 'fitness' | 'wellness' | 'other';
}

export interface Service {
  id: string;
  category_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  currency: string;
}

export interface StaffMember {
  id: string;
  full_name: string;
  photo_url: string | null;
  role: string;
  specialisations: string[];
  rating: number;
  next_available: string; // ISO8601
}

export interface TimeSlot {
  start: string; // ISO8601
  end: string;
  available: boolean;
}

export interface BookingState {
  step: 1 | 2 | 3;
  category_id: string | null;
  service_id: string | null;
  staff_id: string | null;
  date: string | null;
  time: string | null;
  notes: string;
  apply_loyalty: boolean;
}

// ========== LOYALTY WIDGET TYPES ==========
export interface LoyaltyWidgetProps {
  points: number;
  tier: 'none' | 'silver' | 'gold' | 'platinum';
  nextTierPoints: number;
}

// ========== MOCK DATA GENERATORS ==========
export const mockClientProfile: ClientProfile = {
  id: 'client-001',
  full_name: 'Sarah Mitchell',
  email: 'sarah@example.com',
  phone: '+44 20 7946 0958',
  loyalty_points: 340,
  membership_tier: 'gold',
  telehealth_consent: true,
  balance_due: 0,
  upcoming_bookings: [
    {
      id: 'apt-001',
      service_id: 'svc-001',
      service: {
        name: 'Balayage + Gloss',
        duration_minutes: 120,
        price: 185,
      },
      staff_id: 'staff-001',
      staff: {
        id: 'staff-001',
        full_name: 'Emma Richardson',
        photo_url: null,
        rating: 4.8,
      },
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      room: 'Studio A',
      status: 'confirmed',
      notes: 'Client prefers cool tones',
      ai_brief: {
        summary: "Emma's 8th client visit. Prefers subtle highlights, sensitive scalp near temples.",
        what_to_expect: 'Full balayage application with gloss treatment. Expect 2 hours including consultation.',
        bring_with_you: 'Bring any inspiration photos. Wear something you don\'t mind getting product on.',
      },
    },
  ],
  booking_history: [
    {
      id: 'apt-100',
      service_id: 'svc-001',
      service: {
        name: 'Cut + Blowdry',
        duration_minutes: 60,
        price: 65,
      },
      staff_id: 'staff-001',
      staff: {
        id: 'staff-001',
        full_name: 'Emma Richardson',
        photo_url: null,
        rating: 4.8,
      },
      scheduled_at: new Date(Date.now() - 604800000).toISOString(),
      room: 'Studio A',
      status: 'completed',
    },
  ],
  loyalty_events: [
    {
      id: 'ev-001',
      type: 'earned',
      points: 185,
      description: 'Balayage + Gloss service',
      created_at: new Date(Date.now() - 2592000000).toISOString(),
    },
    {
      id: 'ev-002',
      type: 'bonus',
      points: 50,
      description: 'Referral bonus - Sarah referred James',
      created_at: new Date(Date.now() - 5184000000).toISOString(),
    },
  ],
  invoices: [
    {
      id: 'inv-001',
      appointment_id: 'apt-001',
      amount: 185,
      status: 'pending',
      issued_at: new Date().toISOString(),
      due_at: new Date(Date.now() + 604800000).toISOString(),
    },
  ],
  payment_history: [
    {
      id: 'pay-001',
      invoice_id: 'inv-100',
      amount: 65,
      method: 'card',
      status: 'completed',
      created_at: new Date(Date.now() - 604800000).toISOString(),
    },
  ],
};

export const mockCategories: ServiceCategory[] = [
  { id: 'cat-1', slug: 'hair', label: 'Hair & Salon', icon: '✂️', vertical: 'hair' },
  { id: 'cat-2', slug: 'spa', label: 'Spa & Massage', icon: '🌿', vertical: 'spa' },
  { id: 'cat-3', slug: 'nails', label: 'Nails & Beauty', icon: '💅', vertical: 'nails' },
  { id: 'cat-4', slug: 'barbers', label: 'Barbers', icon: '💈', vertical: 'barbers' },
  { id: 'cat-5', slug: 'medspa', label: 'MedSpa & Aesthetics', icon: '✨', vertical: 'medspa' },
  { id: 'cat-6', slug: 'fitness', label: 'Fitness & Training', icon: '🏋️', vertical: 'fitness' },
  { id: 'cat-7', slug: 'wellness', label: 'Wellness & Recovery', icon: '🧘', vertical: 'wellness' },
  { id: 'cat-8', slug: 'other', label: 'Other Services', icon: '🌟', vertical: 'other' },
];

export const mockServices: Service[] = [
  {
    id: 'svc-1',
    category_id: 'cat-1',
    name: 'Cut + Blowdry',
    description: 'Professional cut with styling',
    duration_minutes: 60,
    price: 65,
    currency: 'GBP',
  },
  {
    id: 'svc-2',
    category_id: 'cat-1',
    name: 'Balayage + Gloss',
    description: 'Hand-painted highlights with gloss treatment',
    duration_minutes: 120,
    price: 185,
    currency: 'GBP',
  },
  {
    id: 'svc-3',
    category_id: 'cat-2',
    name: 'Swedish Massage',
    description: 'Full body relaxation massage',
    duration_minutes: 60,
    price: 75,
    currency: 'GBP',
  },
];

export const mockStaff: StaffMember[] = [
  {
    id: 'staff-1',
    full_name: 'Emma Richardson',
    photo_url: null,
    role: 'Stylist',
    specialisations: ['color', 'balayage', 'styling'],
    rating: 4.8,
    next_available: new Date(Date.now() + 3600000).toISOString(),
  },
  {
    id: 'staff-2',
    full_name: 'Marcus Chen',
    photo_url: null,
    role: 'Therapist',
    specialisations: ['massage', 'deep tissue'],
    rating: 4.9,
    next_available: new Date(Date.now() + 7200000).toISOString(),
  },
];
