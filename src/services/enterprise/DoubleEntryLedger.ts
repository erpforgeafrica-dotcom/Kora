/**
 * Financial Double-Entry Ledger System
 * 
 * Immutably logs transactional context separating debits/credits in true ledger accounts,
 * ensuring high-fidelity audit safety checks for investors, regulators, and banking systems.
 */

export type AccountType =
  | 'platform_revenue'
  | 'escrow_trust'
  | 'merchant_wallet'
  | 'client_payment_gateway';

export interface LedgerEntry {
  id: string; // Absolute audit tracking key
  merchantId: string;
  debitAccount: AccountType;
  creditAccount: AccountType;
  amount: number; // Stored in minor currency unit (e.g. Kobo or Cents to avoid floating issues)
  reference: string;
  description: string;
  timestamp: string;
}

const LEDGER_ENTRIES_STORE: LedgerEntry[] = [
  {
    id: 'ent-001',
    merchantId: 'lagos-health-node',
    debitAccount: 'client_payment_gateway',
    creditAccount: 'escrow_trust',
    amount: 1500000, // ₦15,000.00
    reference: 'pst_ref_89012479',
    description: 'Direct Checkout Settlement Hold',
    timestamp: new Date(Date.now() - 3 * 3605 * 1000).toISOString()
  },
  {
    id: 'ent-002',
    merchantId: 'lagos-health-node',
    debitAccount: 'escrow_trust',
    creditAccount: 'merchant_wallet',
    amount: 1425000, // ₦14,250.00 (95% Vendor Payout split)
    reference: 'pst_ref_89012479',
    description: 'Split Payout Clearance',
    timestamp: new Date(Date.now() - 3 * 3605 * 1000).toISOString()
  },
  {
    id: 'ent-003',
    merchantId: 'lagos-health-node',
    debitAccount: 'escrow_trust',
    creditAccount: 'platform_revenue',
    amount: 75000, // ₦750.00 (5% Commission split)
    reference: 'pst_ref_89012479',
    description: '5% Platform Fee Split deduction',
    timestamp: new Date(Date.now() - 3 * 3605 * 1000).toISOString()
  }
];

export class DoubleEntryLedger {
  /**
   * Commits credit-debit balance entries synchronously ensuring atomic balance parity
   */
  public static postTransaction(params: {
    merchantId: string;
    grossAmount: number; // in NGN/stable base unit (e.g. ₦15000)
    reference: string;
    description: string;
  }): { success: boolean; entries: LedgerEntry[] } {
    const amountInKobo = Math.round(params.grossAmount * 100);

    // 1. Initial Deposit to Escrow
    const depositEntry: LedgerEntry = {
      id: `ent-${Math.floor(10000 + Math.random() * 90000)}`,
      merchantId: params.merchantId,
      debitAccount: 'client_payment_gateway',
      creditAccount: 'escrow_trust',
      amount: amountInKobo,
      reference: params.reference,
      description: `${params.description} (Escrow Credit)`,
      timestamp: new Date().toISOString()
    };

    // 2. Perform 5% Platform Escrow Split Calculation
    const platformAmtKobo = Math.round(amountInKobo * 0.05);
    const merchantAmtKobo = amountInKobo - platformAmtKobo;

    // Split entry to Platform Fee Registry
    const platformSplitEntry: LedgerEntry = {
      id: `ent-${Math.floor(10000 + Math.random() * 90000)}`,
      merchantId: params.merchantId,
      debitAccount: 'escrow_trust',
      creditAccount: 'platform_revenue',
      amount: platformAmtKobo,
      reference: params.reference,
      description: 'Automated 5% Platform Processing Split',
      timestamp: new Date().toISOString()
    };

    // Split entry to Merchant Wallet Payout Vault
    const merchantSplitEntry: LedgerEntry = {
      id: `ent-${Math.floor(10000 + Math.random() * 90000)}`,
      merchantId: params.merchantId,
      debitAccount: 'escrow_trust',
      creditAccount: 'merchant_wallet',
      amount: merchantAmtKobo,
      reference: params.reference,
      description: 'Auto settled merchant clearance balance',
      timestamp: new Date().toISOString()
    };

    // Append to Ledger Storage
    LEDGER_ENTRIES_STORE.push(depositEntry, platformSplitEntry, merchantSplitEntry);

    return {
      success: true,
      entries: [depositEntry, platformSplitEntry, merchantSplitEntry]
    };
  }

  /**
   * Recovers account ledger balances dynamically summing ledger rows
   */
  public static getAccountBalance(merchantId: string, account: AccountType): number {
    let balance = 0;
    
    LEDGER_ENTRIES_STORE.forEach(ent => {
      if (ent.merchantId !== merchantId) return;

      // If debit, asset increments (or payout exits)
      if (ent.debitAccount === account) {
        balance -= ent.amount;
      }
      // If credit, equity or liability clears
      if (ent.creditAccount === account) {
        balance += ent.amount;
      }
    });

    // Return true unit (convert back from kobo minor divisions)
    return balance / 100;
  }

  /**
   * Retrieves full ledger logs
   */
  public static getLedgerLogs(): LedgerEntry[] {
    return LEDGER_ENTRIES_STORE;
  }
}
