-- ============================================================================
-- AUTH HOOK: Set tenant_id in JWT claims
-- ============================================================================
-- This trigger function automatically adds tenant_id to the JWT token
-- when a user authenticates, enabling RLS policies to work seamlessly
-- ============================================================================

CREATE OR REPLACE FUNCTION auth.set_tenant_claim()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get tenant_id from entity_graph for this user
  SELECT eg.tenant_id INTO tenant_uuid
  FROM public.entity_graph eg
  WHERE eg.auth_user_id = NEW.id
  LIMIT 1;
  
  -- Set in app_metadata if tenant found
  IF tenant_uuid IS NOT NULL THEN
    NEW.raw_app_meta_data = 
      COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('tenant_id', tenant_uuid::text);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created_set_tenant'
  ) THEN
    CREATE TRIGGER on_auth_user_created_set_tenant
      BEFORE INSERT OR UPDATE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION auth.set_tenant_claim();
  END IF;
END $$;

-- For existing users, run a one-time update to populate tenant_id in JWT
UPDATE auth.users u
SET raw_app_meta_data = 
  COALESCE(u.raw_app_meta_data, '{}'::jsonb) || 
  jsonb_build_object('tenant_id', (
    SELECT eg.tenant_id::text 
    FROM public.entity_graph eg 
    WHERE eg.auth_user_id = u.id 
    LIMIT 1
  ))
WHERE EXISTS (
  SELECT 1 FROM public.entity_graph eg 
  WHERE eg.auth_user_id = u.id
)
AND (u.raw_app_meta_data->>'tenant_id') IS NULL;
