-- Migration 029: Booking-to-Staff Workflow Module
-- Creates staff assignment tracking, preferences, and scheduling workflow

DROP TABLE IF EXISTS staff_shifts CASCADE;
DROP TABLE IF EXISTS booking_waitlist CASCADE;
DROP TABLE IF EXISTS customer_staff_preferences CASCADE;
DROP TABLE IF EXISTS booking_staff_assignments CASCADE;

CREATE TABLE booking_staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('primary', 'support', 'observer')), -- primary=main provider, support=assistant, observer=learning
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by_user_id UUID,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'confirmed', 'in_progress', 'completed', 'no_show', 'cancelled')),
  confirmation_status TEXT DEFAULT 'pending' CHECK (confirmation_status IN ('pending', 'confirmed', 'declined', 'no_response')),
  confirmed_at TIMESTAMPTZ,
  confirmed_by_user_id UUID,
  start_actual_time TIMESTAMPTZ,
  end_actual_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  rating_from_staff NUMERIC(3,2),
  rating_from_customer NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_staff_assignments_booking ON booking_staff_assignments(booking_id);
CREATE INDEX idx_booking_staff_assignments_staff ON booking_staff_assignments(staff_member_id, status);
CREATE INDEX idx_booking_staff_assignments_status ON booking_staff_assignments(booking_id, status);
CREATE INDEX idx_booking_staff_assignments_confirmation ON booking_staff_assignments(staff_member_id, confirmation_status);

-- Customer preferences for staff (preferred/preferred-not-to-use)
CREATE TABLE customer_staff_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL CHECK (preference_type IN ('preferred', 'not_preferred')),
  reason TEXT,
  strength INTEGER DEFAULT 5 CHECK (strength BETWEEN 1 AND 10), -- 1=weak, 10=strong
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, staff_member_id)
);

CREATE INDEX idx_customer_staff_preferences_customer ON customer_staff_preferences(customer_id);
CREATE INDEX idx_customer_staff_preferences_staff ON customer_staff_preferences(staff_member_id);

-- Waitlist/queue: when no staff available, queue for next available
CREATE TABLE booking_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  service_id UUID NOT NULL,
  preferred_staff_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  requested_date DATE,
  requested_time_window TEXT, -- e.g., "morning", "afternoon", "evening"
  position_in_queue INTEGER,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'confirmed', 'expired', 'cancelled')),
  notified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_waitlist_organization ON booking_waitlist(organization_id, status);
CREATE INDEX idx_booking_waitlist_customer ON booking_waitlist(customer_id);
CREATE INDEX idx_booking_waitlist_service ON booking_waitlist(service_id);
CREATE INDEX idx_booking_waitlist_date ON booking_waitlist(requested_date);

-- Staff shift assignments: explicit shifts for staff at location
CREATE TABLE staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  break_duration_minutes INTEGER DEFAULT 0,
  assigned_location TEXT, -- location name/id if multi-location
  shift_status TEXT NOT NULL DEFAULT 'scheduled' CHECK (shift_status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_shifts_organization ON staff_shifts(organization_id, shift_date);
CREATE INDEX idx_staff_shifts_staff ON staff_shifts(staff_member_id, shift_date);
CREATE INDEX idx_staff_shifts_status ON staff_shifts(staff_member_id, shift_status);
