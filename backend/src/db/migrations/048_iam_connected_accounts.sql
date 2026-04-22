-- Migration 048: IAM Connected Accounts
-- Creates table for OAuth/social login providers (Google, GitHub, Apple, etc.)
-- Resolves: Issue #3 - connected_accounts table referenced in code

CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'github', 'apple', 'microsoft', 'facebook', 'linkedin', 'clerk')),
  external_id TEXT NOT NULL,
  external_email TEXT,
  external_name TEXT,
  external_data JSONB DEFAULT '{}',
  is_primary BOOLEAN DEFAULT false,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider),
  UNIQUE(provider, external_id)
);

-- Indexes for OAuth flow performance
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_organization_id ON connected_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_provider ON connected_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_external_id ON connected_accounts(provider, external_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_primary ON connected_accounts(user_id, is_primary);

-- Partial index for active connections
CREATE INDEX IF NOT EXISTS idx_connected_accounts_active ON connected_accounts(user_id, created_at DESC) 
  WHERE disconnected_at IS NULL;
