// ============================================================
// KORA TENANT GUARD — Layer A enforcement (client-side)
// Every service call must pass through resolveTenant() first.
// Sprint 1 Gate: User A cannot query Tenant B's data.
// ============================================================

import { supabase } from '../lib/supabase';

let _cachedTenantId: string | null = null;

// Returns the tenant_id for the currently authenticated user.
// Throws immediately if the user has no entity_graph row — hard stop.
export async function resolveTenant(): Promise<string> {
  if (_cachedTenantId) return _cachedTenantId;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('UNAUTHENTICATED');

  const { data, error } = await (supabase as any)
    .from('entity_graph')
    .select('tenant_id')
    .eq('auth_user_id', user.id)
    .limit(1)
    .single();

  if (error || !data) throw new Error('TENANT_NOT_FOUND');

  _cachedTenantId = (data as any).tenant_id;
  return (data as any).tenant_id;
}

// Call on sign-out to clear the cache
export function clearTenantCache() {
  _cachedTenantId = null;
}

// Assertion: throws if the provided id does not match the resolved tenant.
// Use this before any operation that receives an ID from the URL/params.
export async function assertTenantOwnership(resourceTenantId: string) {
  const tenantId = await resolveTenant();
  if (resourceTenantId !== tenantId) {
    throw new Error('TENANT_ISOLATION_VIOLATION');
  }
}
