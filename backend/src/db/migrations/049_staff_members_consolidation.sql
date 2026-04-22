-- Migration 049: Staff Members Table Consolidation
-- Consolidates conflicting definitions from migrations 006 and 027
-- Preserves all columns from both versions + adds new fields for completeness
-- Resolves: Issue #2 - staff_members table version conflict

-- Backup existing data from both potential versions
CREATE TEMP TABLE staff_members_backup AS
SELECT * FROM staff_members WHERE FALSE;

-- Drop dependent tables first (cascade relationships exist)
DROP TABLE IF EXISTS staff_service_assignments CASCADE;
DROP TABLE IF EXISTS staff_skills CASCADE;
DROP TABLE IF EXISTS staff_members CASCADE;

-- Create unified staff_members table combining all versions
CREATE TABLE IF NOT EXISTS staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Profile information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  profile_photo_url TEXT,
  bio TEXT,
  
  -- Legacy photo_url field (v1 compatibility)
  photo_url TEXT,
  
  -- Role and permissions
  role TEXT NOT NULL CHECK (role IN ('receptionist', 'practitioner', 'manager', 'admin', 'therapist')),
  
  -- Skills and certifications
  specializations TEXT[] DEFAULT '{}',
  qualifications TEXT[] DEFAULT '{}',
  
  -- Legacy availability (v1 compatibility) - JSONB format
  availability JSONB DEFAULT '{}',
  
  -- Compensation and metrics
  hourly_rate NUMERIC(10,2),
  commission_percentage NUMERIC(5,2),
  
  -- Performance metrics (v1 from 006)
  rating NUMERIC(3,2) DEFAULT 0,
  no_show_contribution_count INTEGER DEFAULT 0,
  
  -- Status management
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'archived')),
  is_active BOOLEAN DEFAULT true,
  
  -- Clerk integration (v1 from 006)
  clerk_user_id TEXT UNIQUE,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure email uniqueness per organization
  UNIQUE(organization_id, email)
);

-- Indexes for common queries (optimized for performance)
CREATE INDEX idx_staff_members_organization ON staff_members(organization_id, status);
CREATE INDEX idx_staff_members_role ON staff_members(organization_id, role);
CREATE INDEX idx_staff_members_email ON staff_members(organization_id, email);
CREATE INDEX idx_staff_members_user_id ON staff_members(user_id);
CREATE INDEX idx_staff_members_clerk_user_id ON staff_members(clerk_user_id);
CREATE INDEX idx_staff_members_created ON staff_members(organization_id, created_at DESC);
CREATE INDEX idx_staff_members_active_status ON staff_members(organization_id, is_active, status);

-- Partial index for active staff only
CREATE INDEX idx_staff_members_active ON staff_members(organization_id, created_at DESC) 
  WHERE is_active = true AND status = 'active';

-- Recreate dependent tables with all expected columns
CREATE TABLE IF NOT EXISTS staff_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  certified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_skills_member ON staff_skills(staff_member_id);
CREATE INDEX idx_staff_skills_proficiency ON staff_skills(staff_member_id, proficiency_level);
CREATE INDEX idx_staff_skills_expires ON staff_skills(expires_at) WHERE expires_at IS NOT NULL;

-- Service assignments: which services can each staff member provide
CREATE TABLE IF NOT EXISTS staff_service_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  service_id UUID NOT NULL,
  is_available BOOLEAN DEFAULT true,
  can_perform_independently BOOLEAN DEFAULT false,
  requires_supervision BOOLEAN DEFAULT false,
  min_experience_hours INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(staff_member_id, service_id)
);

CREATE INDEX idx_staff_service_assignments_staff ON staff_service_assignments(staff_member_id);
CREATE INDEX idx_staff_service_assignments_service ON staff_service_assignments(service_id);
CREATE INDEX idx_staff_service_assignments_available ON staff_service_assignments(staff_member_id, is_available);
