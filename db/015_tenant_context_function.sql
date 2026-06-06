-- ============================================================================
-- TENANT CONTEXT FUNCTION - JWT-based tenant resolution
-- ============================================================================
-- This function extracts tenant_id from the JWT token's app_metadata
-- It's used by all RLS policies to enforce tenant isolation
-- ============================================================================

CREATE OR REPLACE FUNCTION kora_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Extract tenant_id from JWT app_metadata
  -- Pattern: auth.jwt() -> 'app_metadata' -> 'tenant_id'
  tenant_uuid := NULLIF(
    current_setting('request.jwt.claims', true)::json->'app_metadata'->>'tenant_id',
    ''
  )::uuid;
  
  -- If not in app_metadata, try to resolve from entity_graph
  IF tenant_uuid IS NULL THEN
    SELECT eg.tenant_id INTO tenant_uuid
    FROM entity_graph eg
    WHERE eg.auth_user_id = auth.uid()
    LIMIT 1;
  END IF;
  
  RETURN tenant_uuid;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION kora_current_tenant_id() TO authenticated;

-- Verify function exists
SELECT 
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'kora_current_tenant_id';
