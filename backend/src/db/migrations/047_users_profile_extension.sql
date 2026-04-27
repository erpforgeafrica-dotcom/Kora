-- Migration 047: Users Profile Extension
-- Adds missing user profile columns referenced throughout codebase
-- Resolves: Issue #1 - 10+ missing columns in users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'archived', 'pending'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id UUID;

-- Add foreign key constraint for branch_id if branches table exists
-- Note: branches table must be created separately if needed
-- ALTER TABLE users ADD CONSTRAINT fk_users_branch_id FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization_status ON users(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_users_status_created ON users(status, created_at DESC);
-- role_id index only if column exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id)';
  END IF;
END $$;

-- Composite indexes for filtering operations
CREATE INDEX IF NOT EXISTS idx_users_org_email ON users(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_users_org_phone ON users(organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON users(phone, phone_verified);
