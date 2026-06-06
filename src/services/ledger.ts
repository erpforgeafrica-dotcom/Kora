// ============================================================
// KORA LEDGER SERVICE — Layer E
// Rule: No balance column is ever updated directly.
//       Every financial movement = one ledger_entries INSERT.
// ============================================================

import { supabase } from '../lib/supabase';
import type { LedgerEntryInsert, ReferenceType } from '../lib/types/database';

export interface PostTransactionParams {
  tenantId:      string;
  debitAccount:  string;
  creditAccount: string;
  amount:        number;       // positive, base currency units (e.g. 15000.00 NGN)
  currency:      string;
  fxRate?:       number;
  referenceType?: ReferenceType;
  referenceId?:   string;
  description?:   string;
}

export interface SplitPaymentParams {
  tenantId:       string;
  grossAmount:    number;
  currency:       string;
  referenceId:    string;
  platformFeePct: number;      // e.g. 5 = 5%
  payerAccount:   string;      // e.g. 'CLIENT_GATEWAY'
  vendorAccount:  string;      // e.g. 'MERCHANT_WALLET'
  escrowAccount:  string;      // e.g. 'ESCROW'
  platformAccount: string;     // e.g. 'PLATFORM_FEE'
}

// ── Core: single atomic double-entry post ────────────────────
export async function postTransaction(params: PostTransactionParams) {
  const entry: LedgerEntryInsert = {
    tenant_id:      params.tenantId,
    debit_account:  params.debitAccount,
    credit_account: params.creditAccount,
    amount:         params.amount,
    currency:       params.currency,
    fx_rate:        params.fxRate ?? 1.0,
    reference_type: params.referenceType ?? null,
    reference_id:   params.referenceId   ?? null,
    description:    params.description   ?? null,
  };

  const { data, error } = await (supabase as any)
    .from('ledger_entries')
    .insert(entry)
    .select()
    .single();

  if (error) throw new Error(`Ledger post failed: ${error.message}`);
  return data;
}

// ── Split payment: 3 atomic entries (client→escrow, escrow→vendor, escrow→platform) ─
export async function postSplitPayment(params: SplitPaymentParams) {
  const platformAmt = Number((params.grossAmount * (params.platformFeePct / 100)).toFixed(4));
  const vendorAmt   = Number((params.grossAmount - platformAmt).toFixed(4));

  const entries: LedgerEntryInsert[] = [
    // 1. Client pays into escrow
    {
      tenant_id:      params.tenantId,
      debit_account:  params.payerAccount,
      credit_account: params.escrowAccount,
      amount:         params.grossAmount,
      currency:       params.currency,
      fx_rate:        1.0,
      reference_type: 'INVOICE',
      reference_id:   params.referenceId,
      description:    'Payment received into escrow',
    },
    // 2. Escrow releases to vendor
    {
      tenant_id:      params.tenantId,
      debit_account:  params.escrowAccount,
      credit_account: params.vendorAccount,
      amount:         vendorAmt,
      currency:       params.currency,
      fx_rate:        1.0,
      reference_type: 'ESCROW_RELEASE',
      reference_id:   params.referenceId,
      description:    `Vendor payout (${100 - params.platformFeePct}%)`,
    },
    // 3. Escrow releases platform fee
    {
      tenant_id:      params.tenantId,
      debit_account:  params.escrowAccount,
      credit_account: params.platformAccount,
      amount:         platformAmt,
      currency:       params.currency,
      fx_rate:        1.0,
      reference_type: 'PLATFORM_FEE',
      reference_id:   params.referenceId,
      description:    `Platform fee (${params.platformFeePct}%)`,
    },
  ];

  const { data, error } = await (supabase as any)
    .from('ledger_entries')
    .insert(entries)
    .select();

  if (error) throw new Error(`Split payment failed: ${error.message}`);
  return data;
}

// ── Balance: derived from ledger rows, never a stored column ─
export async function getAccountBalance(
  tenantId:    string,
  accountCode: string,
  currency:    string
): Promise<number> {
  const { data, error } = await (supabase as any)
    .from('ledger_entries')
    .select('debit_account, credit_account, amount')
    .eq('tenant_id', tenantId)
    .eq('currency', currency);

  if (error) throw new Error(`Balance query failed: ${error.message}`);

  return (data ?? []).reduce((bal, row) => {
    if (row.credit_account === accountCode) return bal + Number(row.amount);
    if (row.debit_account  === accountCode) return bal - Number(row.amount);
    return bal;
  }, 0);
}

// ── Ledger history for a tenant ──────────────────────────────
export async function getLedgerHistory(tenantId: string, limit = 50) {
  const { data, error } = await (supabase as any)
    .from('ledger_entries')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Ledger history failed: ${error.message}`);
  return data ?? [];
}
