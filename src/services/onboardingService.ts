import { supabase } from '../lib/supabase';

/**
 * Create a new tenant and link user to it
 * RLS policies will automatically work via kora_current_tenant_id()
 */
export async function createTenantForUser(userId: string, tenantData: {
  name: string;
  slug: string;
  type?: string;
}) {
  try {
    // 1. Create tenant (service role or admin creates this)
    const { data: tenantRaw, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: tenantData.name,
        slug: tenantData.slug,
        type: tenantData.type || 'standard',
        is_active: true
      } as any)
      .select()
      .single();

    if (tenantError) throw tenantError;
    if (!tenantRaw) throw new Error('Tenant creation returned null');
    const tenant = tenantRaw as any;

    // 2. Link user to tenant in entity_graph
    const { error: graphError } = await supabase
      .from('entity_graph')
      .insert({
        tenant_id: tenant.id,
        auth_user_id: userId,
        entity_type: 'user',
        entity_id: userId
      } as any);

    if (graphError) throw graphError;

    return { success: true, tenant };
  } catch (error) {
    console.error('Tenant creation failed:', error);
    return { success: false, error };
  }
}

/**
 * Get current user's tenant_id from entity_graph
 */
export async function getCurrentTenantId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: raw } = await supabase
    .from('entity_graph')
    .select('tenant_id')
    .eq('auth_user_id', user.id)
    .single();

  return (raw as any)?.tenant_id || null;
}

/**
 * Check if user has a tenant assigned
 */
export async function userHasTenant(): Promise<boolean> {
  const tenantId = await getCurrentTenantId();
  return tenantId !== null;
}
