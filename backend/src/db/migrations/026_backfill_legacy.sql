-- Migration 026: Backfill Legacy Data
-- Populate canonical tables from legacy schema without data loss
-- Safe to run multiple times (uses INSERT ... ON CONFLICT)
-- Only runs if organizations_legacy table exists (fresh installs skip this gracefully)

-- Check if organizations_legacy table exists, then backfill
DO $$
DECLARE
  legacy_count INT;
  new_count INT;
BEGIN
  -- Check if organizations_legacy table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'organizations_legacy'
  ) THEN
    -- Insert existing organizations into businesses
    INSERT INTO businesses (
      id,
      owner_user_id,
      name,
      slug,
      created_at,
      updated_at
    )
    SELECT
      org.id,
      COALESCE(
        (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
        (SELECT id FROM users LIMIT 1)
      ),
      org.name,
      LOWER(REPLACE(REPLACE(org.name, ' ', '_'), '-', '_')),
      org.created_at,
      COALESCE(org.created_at, now())
    FROM organizations_legacy org
    ON CONFLICT (id) DO NOTHING;

    -- Log backfill completion
    INSERT INTO audit_logs (
      id,
      organization_id,
      actor_id,
      action,
      metadata,
      created_at
    )
    SELECT
      gen_random_uuid(),
      org.id,
      NULL,
      'migration_backfill_completed',
      jsonb_build_object('migration', '026_backfill_legacy'),
      now()
    FROM organizations_legacy org
    ON CONFLICT DO NOTHING;

    -- Verify data integrity
    SELECT COUNT(*) INTO legacy_count FROM organizations_legacy;
    SELECT COUNT(*) INTO new_count FROM businesses;
    
    IF legacy_count > new_count THEN
      RAISE WARNING 'Backfill mismatch: % legacy orgs vs % businesses', legacy_count, new_count;
    END IF;
  ELSE
    -- Fresh install, no legacy data to backfill
    RAISE NOTICE 'Migration 026: No organizations_legacy table found (fresh install)';
  END IF;
END $$;
