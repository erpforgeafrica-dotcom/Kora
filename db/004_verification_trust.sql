-- =====================================================================================
-- Migration 004: Verification & Trust Layer
-- =====================================================================================
-- Organization Verifications, Biometric Profiles, User Documents, KYC
-- =====================================================================================

-- =====================================================================================
-- ORGANIZATION VERIFICATIONS (KYC/KYB)
-- =====================================================================================
CREATE TABLE organization_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  verification_type VARCHAR(100) NOT NULL CHECK (verification_type IN (
    'business_registration',
    'tax_registration',
    'bank_account',
    'address_proof',
    'identity_documents',
    'financial_statements',
    'licenses_permits',
    'insurance_certificates',
    'other'
  )),
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_review', 'approved', 'rejected', 'expired', 'revoked'
  )),
  
  document_type TEXT,
  document_number TEXT,
  document_url TEXT,
  issued_by TEXT,
  issued_at DATE,
  expires_at DATE,
  
  verified_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  blockchain_hash TEXT,
  
  notes TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_org_verifications_tenant ON organization_verifications(tenant_id);
CREATE INDEX idx_org_verifications_org ON organization_verifications(organization_id);
CREATE INDEX idx_org_verifications_status ON organization_verifications(status);

ALTER TABLE organization_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_org_verifications_isolation ON organization_verifications
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- BIOMETRIC PROFILES
-- =====================================================================================
CREATE TABLE biometric_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  
  biometric_type VARCHAR(50) NOT NULL CHECK (biometric_type IN (
    'face', 'fingerprint', 'iris', 'voice', 'palm', 'signature', 'other'
  )),
  
  template_data TEXT NOT NULL,
  template_format VARCHAR(50),
  quality_score DECIMAL(5,2),
  
  liveness_verified BOOLEAN DEFAULT FALSE,
  liveness_score DECIMAL(5,2),
  liveness_method VARCHAR(100),
  
  capture_device TEXT,
  capture_timestamp TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT TRUE,
  is_primary BOOLEAN DEFAULT FALSE,
  
  verified_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  blockchain_hash TEXT,
  
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(person_id, biometric_type, is_primary) WHERE is_primary = TRUE
);

CREATE INDEX idx_biometric_profiles_tenant ON biometric_profiles(tenant_id);
CREATE INDEX idx_biometric_profiles_person ON biometric_profiles(person_id);

ALTER TABLE biometric_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_biometric_profiles_isolation ON biometric_profiles
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- USER DOCUMENTS
-- =====================================================================================
CREATE TABLE user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  
  document_type VARCHAR(100) NOT NULL CHECK (document_type IN (
    'national_id', 'passport', 'drivers_license', 'residence_permit', 'work_permit',
    'birth_certificate', 'social_security', 'voter_id', 'health_card', 'student_id',
    'professional_license', 'other'
  )),
  
  document_number TEXT NOT NULL,
  issuing_country CHAR(2),
  issuing_authority TEXT,
  issued_at DATE,
  expires_at DATE,
  
  front_image_url TEXT,
  back_image_url TEXT,
  additional_images JSONB,
  extracted_data JSONB,
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_review', 'verified', 'rejected', 'expired', 'revoked'
  )),
  
  verified_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  mrz_line1 TEXT,
  mrz_line2 TEXT,
  mrz_line3 TEXT,
  blockchain_hash TEXT,
  
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_documents_tenant ON user_documents(tenant_id);
CREATE INDEX idx_user_documents_person ON user_documents(person_id);
CREATE INDEX idx_user_documents_status ON user_documents(status);

ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_user_documents_isolation ON user_documents
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- TRUST SCORES
-- =====================================================================================
CREATE TABLE trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  
  overall_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  identity_score DECIMAL(5,2) DEFAULT 0,
  document_score DECIMAL(5,2) DEFAULT 0,
  biometric_score DECIMAL(5,2) DEFAULT 0,
  activity_score DECIMAL(5,2) DEFAULT 0,
  reputation_score DECIMAL(5,2) DEFAULT 0,
  
  trust_level VARCHAR(50) CHECK (trust_level IN (
    'unverified', 'basic', 'standard', 'advanced', 'premium', 'enterprise'
  )),
  
  is_verified BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  
  last_verified_at TIMESTAMPTZ,
  next_verification_due TIMESTAMPTZ,
  score_breakdown JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_id)
);

CREATE INDEX idx_trust_scores_tenant ON trust_scores(tenant_id);
CREATE INDEX idx_trust_scores_entity ON trust_scores(entity_id);
CREATE INDEX idx_trust_scores_level ON trust_scores(trust_level);

ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_trust_scores_isolation ON trust_scores
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- END OF MIGRATION 004
-- =====================================================================================
