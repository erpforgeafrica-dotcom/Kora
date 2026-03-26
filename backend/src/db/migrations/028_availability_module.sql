-- Migration 028: Availability Management Module
-- Creates recurring and exception-based availability for staff
-- Supports calendar-based scheduling with conflict detection

DROP TABLE IF EXISTS availability_conflicts CASCADE;
DROP TABLE IF EXISTS staff_availability_slots CASCADE;
DROP TABLE IF EXISTS staff_availability_exceptions CASCADE;
DROP TABLE IF EXISTS staff_availability_rules CASCADE;

CREATE TABLE staff_availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  max_appointments_per_day INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(staff_member_id, day_of_week)
);

CREATE INDEX idx_staff_availability_rules_staff ON staff_availability_rules(staff_member_id);
CREATE INDEX idx_staff_availability_rules_active ON staff_availability_rules(staff_member_id, is_active);

-- Availability exceptions: blockouts, special hours, time off
CREATE TABLE staff_availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  exception_type TEXT NOT NULL CHECK (exception_type IN ('blockout', 'holiday', 'training', 'day_off', 'special_hours')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT,
  notes TEXT,
  requires_approval BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_availability_exceptions_staff ON staff_availability_exceptions(staff_member_id);
CREATE INDEX idx_staff_availability_exceptions_timerange ON staff_availability_exceptions(start_time, end_time);
CREATE INDEX idx_staff_availability_exceptions_type ON staff_availability_exceptions(staff_member_id, exception_type);

-- Point-in-time availability slots (calculated from rules + exceptions)
-- Generated/refreshed periodically or on-demand
CREATE TABLE staff_availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  booking_id UUID,
  confidence_score NUMERIC(3,2) DEFAULT 1.0, -- 0.0-1.0 based on availability rules
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_staff_availability_slots_staff ON staff_availability_slots(staff_member_id);
CREATE INDEX idx_staff_availability_slots_timerange ON staff_availability_slots(slot_start, slot_end);
CREATE INDEX idx_staff_availability_slots_available ON staff_availability_slots(staff_member_id, slot_start)
  WHERE is_booked = false;

-- Conflict log: tracks when bookings conflict with other bookings/blocks
CREATE TABLE availability_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('double_booking', 'availability_violation', 'skill_mismatch')),
  booking_id UUID,
  conflicting_booking_id UUID,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

CREATE INDEX idx_availability_conflicts_staff ON availability_conflicts(staff_member_id, resolved_at);
