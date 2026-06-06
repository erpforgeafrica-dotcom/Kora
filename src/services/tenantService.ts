// ============================================================
// KORA TENANT SERVICE — Layer A + B bootstrap
// Handles: new tenant creation, entity_graph registration,
//          tier enforcement, audit trail on every write.
// ============================================================

import { supabase } from '../lib/supabase';
import { clearTenantCache } from '../lib/tenantGuard';
import type { TenantTier, EntityType, EntityRole } from '../lib/types/database';

export interface RegisterTenantParams {
  // Auth
  email:    string;
  password: string;
  // Tenant
  tenantName:  string;
  tenantCode:  string;
  industry:    string;
  region:      string;
  tier?:       TenantTier;
  // Owner profile
  firstName:  string;
  lastName:   string;
  phone?:     string;
  timezone?:  string;
}

// Full registration: auth signup → tenant → entity_graph
export async function registerTenant(params: RegisterTenantParams) {
  // 1. Create auth user
  const { data: authData, error: authError } = await (supabase as any).auth.signUp({
    email:    params.email,
    password: params.password,
  });
  if (authError || !authData.user) throw new Error(authError?.message ?? 'Auth signup failed');

  const userId = authData.user.id;

  // 2. Create tenant row
  const { data: tenant, error: tenantError } = await (supabase as any)
    .from('tenants')
    .insert({
      name:         params.tenantName,
      tenant_code:  params.tenantCode,
      industry:     params.industry,
      region:       params.region,
      tier:         params.tier ?? 'BASIC',
      status:       'ACTIVE',
      base_currency: 'USD',
      metadata:     {},
      settings:     {},
    })
    .select()
    .single();

  if (tenantError || !tenant) throw new Error(tenantError?.message ?? 'Tenant creation failed');

  // 3. Create entity_graph row linking auth user → tenant
  const { data: entity, error: entityError } = await (supabase as any)
    .from('entity_graph')
    .insert({
      auth_user_id: userId,
      tenant_id:    tenant.id,
      entity_type:  'BUSINESS_OWNER' as EntityType,
      role:         'OWNER' as EntityRole,
      first_name:   params.firstName,
      last_name:    params.lastName,
      email:        params.email,
      phone:        params.phone   ?? null,
      timezone:     params.timezone ?? 'UTC',
      metadata:     {},
    })
    .select()
    .single();

  if (entityError || !entity) throw new Error(entityError?.message ?? 'Entity graph creation failed');

  // 4. Emit bootstrap event
  await (supabase as any).from('event_stream').insert({
    tenant_id:   tenant.id,
    event_type:  'tenant.registered',
    entity_id:   entity.id,
    entity_type: 'BUSINESS_OWNER',
    payload:     { tenant_code: params.tenantCode, tier: params.tier ?? 'BASIC' },
    occurred_at: new Date().toISOString(),
  });

  return { tenant, entity };
}

// Fetch the current tenant's full profile
export async function getTenantProfile(tenantId: string) {
  const { data, error } = await (supabase as any)
    .from('tenants')
    .select('*, billing_plans(*)')
    .eq('id', tenantId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Freeze a tenant (God Mode / compliance action)
export async function freezeTenant(tenantId: string, actorId: string) {
  const { error } = await (supabase as any)
    .from('tenants')
    .update({ status: 'FROZEN' })
    .eq('id', tenantId);

  if (error) throw new Error(error.message);

  // Audit trail
  await (supabase as any).from('audit_control_plane').insert({
    tenant_id:     tenantId,
    actor_id:      actorId,
    action:        'tenant.frozen',
    resource_type: 'tenants',
    resource_id:   tenantId,
    occurred_at:   new Date().toISOString(),
  });

  clearTenantCache();
}

// Sign in
export async function signIn(email: string, password: string) {
  const { data, error } = await (supabase as any).auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

// Sign out
export async function signOut() {
  clearTenantCache();
  await (supabase as any).auth.signOut();
}
