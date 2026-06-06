// ============================================================
// KORA FORM SUBMISSION SERVICE
// Validates plan limits → posts to DB → triggers ledger split
// → writes audit_control_plane entry
// ============================================================

import { supabase } from '../lib/supabase';
import { postSplitPayment } from './ledger';
import { resolveTenant } from '../lib/tenantGuard';

// Platform fee per tier
const TIER_FEES: Record<string, number> = {
  BASIC:        5.0,
  ESSENTIAL:    3.0,
  PROFESSIONAL: 1.5,
  ENTERPRISE:   0.5,
};

// ── Staff registration submission ────────────────────────────
export async function submitStaffRegistration(data: Record<string, unknown>) {
  const tenantId = await resolveTenant();

  const { data: { user } } = await (supabase as any).auth.getUser();
  if (!user) throw new Error('UNAUTHENTICATED');

  // Check ESSENTIAL+ plan for HRM
  const { data: tenant } = await (supabase as any).from('tenants').select('tier').eq('id', tenantId).single();
  if (!tenant || tenant.tier === 'BASIC') throw new Error('UPGRADE_REQUIRED: Staff management requires ESSENTIAL plan or above.');

  // Insert entity_graph as STAFF
  const { error } = await (supabase as any).from('entity_graph').insert({
    tenant_id:   tenantId,
    entity_type: 'STAFF',
    role:        String(data.role ?? 'STAFF'),
    first_name:  String(data.first_name ?? ''),
    last_name:   String(data.last_name ?? ''),
    email:       String(data.email ?? ''),
    phone:       String(data.phone ?? ''),
    timezone:    'UTC',
    metadata:    { department: data.department, biometric_consent: data.biometric_consent },
  });
  if (error) throw new Error(error.message);

  // Emit event
  await (supabase as any).from('event_stream').insert({
    tenant_id:  tenantId,
    event_type: 'staff.registered',
    payload:    { role: data.role, department: data.department },
    occurred_at: new Date().toISOString(),
  });

  // Audit
  await writeAudit(tenantId, user.id, 'staff.registered', 'entity_graph', data);
}

// ── Service creation submission ───────────────────────────────
export async function submitServiceCreation(data: Record<string, unknown>) {
  const tenantId = await resolveTenant();
  const { data: { user } } = await (supabase as any).auth.getUser();

  const { error } = await (supabase as any).from('services').insert({
    tenant_id: tenantId,
    name:        { en: data.name_en, fr: data.name_fr ?? '' },
    description: { en: data.description },
    price:       Number(data.price),
    currency:    String(data.currency ?? 'USD'),
    duration_minutes: Number(data.duration ?? 30),
    is_active:   true,
  });
  if (error) throw new Error(error.message);

  await (supabase as any).from('event_stream').insert({
    tenant_id:  tenantId,
    event_type: 'service.created',
    payload:    { name: data.name_en, price: data.price },
    occurred_at: new Date().toISOString(),
  });

  if (user) await writeAudit(tenantId, user.id, 'service.created', 'services', data);
}

// ── Booking completion — ledger split + audit hash ────────────
export async function completeBookingPayment(params: {
  bookingId:   string;
  tenantId:    string;
  grossAmount: number;
  currency:    string;
  actorId:     string;
  tier:        string;
}) {
  const feePct = TIER_FEES[params.tier] ?? 5;

  // Double-entry split: CLIENT_GATEWAY → ESCROW → MERCHANT_WALLET + PLATFORM_FEE
  const entries = await postSplitPayment({
    tenantId:        params.tenantId,
    grossAmount:     params.grossAmount,
    currency:        params.currency,
    referenceId:     params.bookingId,
    platformFeePct:  feePct,
    payerAccount:    'CLIENT_GATEWAY',
    vendorAccount:   'MERCHANT_WALLET',
    escrowAccount:   'ESCROW',
    platformAccount: 'PLATFORM_FEE',
  });

  // Build audit hash (SHA-like string from key fields)
  const hashInput = `${params.bookingId}:${params.grossAmount}:${params.currency}:${Date.now()}`;
  const auditHash = await hashString(hashInput);

  // Write audit
  await (supabase as any).from('audit_control_plane').insert({
    tenant_id:      params.tenantId,
    actor_id:       params.actorId,
    action:         'booking.payment_split',
    resource_type:  'bookings',
    resource_id:    params.bookingId,
    diff:           { entries_count: entries?.length, gross: params.grossAmount, fee_pct: feePct },
    blockchain_hash: auditHash,
    occurred_at:    new Date().toISOString(),
  });

  return { entries, auditHash };
}

// ── Helpers ──────────────────────────────────────────────────
async function writeAudit(
  tenantId: string, actorId: string, action: string,
  resourceType: string, diff: unknown
) {
  const hash = await hashString(`${tenantId}:${action}:${Date.now()}`);
  await (supabase as any).from('audit_control_plane').insert({
    tenant_id:       tenantId,
    actor_id:        actorId,
    action,
    resource_type:   resourceType,
    diff:            diff as Record<string, unknown>,
    blockchain_hash: hash,
    occurred_at:     new Date().toISOString(),
  });
}

async function hashString(input: string): Promise<string> {
  if (typeof crypto?.subtle !== 'undefined') {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for envs without SubtleCrypto
  return btoa(input).replace(/[^a-z0-9]/gi, '').slice(0, 64);
}
