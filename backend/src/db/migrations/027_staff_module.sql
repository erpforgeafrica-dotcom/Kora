-- Migration 027: Staff Management Module
-- Creates staff profiles, skills, and qualifications
-- Scoped to organizations (multi-tenancy via organization_id)

-- Drop existing tables if they exist (safe cleanup for schema evolution)
DROP TABLE IF EXISTS staff_service_assignments CASCADE;
DROP TABLE IF EXISTS staff_skills CASCADE;
DROP TABLE IF EXISTS staff_members CASCADE;

CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('receptionist', 'practitioner', 'manager', 'admin')),
  specializations TEXT[],
  qualifications TEXT[],
  bio TEXT,
  profile_photo_url TEXT,
  hourly_rate NUMERIC(10,2),
  commission_percentage NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'archived')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_members_organization ON staff_members(organization_id, status);
CREATE INDEX idx_staff_members_role ON staff_members(organization_id, role);
CREATE INDEX idx_staff_members_email ON staff_members(organization_id, email);

-- Skills and certifications
CREATE TABLE staff_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  certified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_skills_member ON staff_skills(staff_member_id);
CREATE INDEX idx_staff_skills_proficiency ON staff_skills(staff_member_id, proficiency_level);

-- Service assignment: which services can each staff member provide
CREATE TABLE staff_service_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  service_id UUID NOT NULL,
  is_available BOOLEAN DEFAULT true,
  can_perform_independently BOOLEAN DEFAULT false,
  requires_supervision BOOLEAN DEFAULT false,
  min_experience_hours INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(staff_member_id, service_id)
);

CREATE INDEX idx_staff_service_assignments_staff ON staff_service_assignments(staff_member_id);
CREATE INDEX idx_staff_service_assignments_service ON staff_service_assignments(service_id);
CREATE INDEX idx_staff_service_assignments_available ON staff_service_assignments(staff_member_id, is_available);
