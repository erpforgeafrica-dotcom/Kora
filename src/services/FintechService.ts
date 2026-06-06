/**
 * Fintech & Automated Split-Ledger Settlement Service
 * 
 * Manages dual-ledger escrow. Splitting client payments automatically upon completion:
 * - 5% Platform processing fee split routed to Admin global registry
 * - 95% Remaining settlement balance cleared to vendor wallet pool
 */

export interface TransactionRecord {
  id: string;
  bookingId: string;
  merchantId: string;
  grossAmount: number;
  platformSplit: number; // 5%
  vendorSplit: number;   // 95%
  paymentStatus: 'pending_webhook' | 'settled' | 'refunded';
  reference: string;
  timestamp: string;
}

export const FINANCIAL_LEDGER: TransactionRecord[] = [
  {
    id: 'tx-241',
    bookingId: 'bk-102',
    merchantId: 'lagos-health-node',
    grossAmount: 15000,
    platformSplit: 750,
    vendorSplit: 14250,
    paymentStatus: 'settled',
    reference: 'pst_ref_89012479',
    timestamp: new Date(Date.now() - 5 * 3605 * 1000).toISOString()
  }
];

export class FintechService {
  /**
   * Retrieves all processed financial ledger transactions
   */
  public static getLedger(): TransactionRecord[] {
    return FINANCIAL_LEDGER;
  }

  /**
   * Simulates a direct webhook landing from Paystack or Stripe processor.
   * Processes a 5% split payment instantly.
   */
  public static handlePaymentWebhook(payload: {
    reference: string;
    bookingId: string;
    merchantId: string;
    amount: number; // in NGN or cents
  }): { success: boolean; record?: TransactionRecord; message: string } {
    // Prevent duplicate processing of same transaction reference
    const duplicate = FINANCIAL_LEDGER.find(t => t.reference === payload.reference);
    if (duplicate) {
      return { 
        success: false, 
        message: `Transaction reference ${payload.reference} already settled on the ledger.` 
      };
    }

    const platformSplit = Math.round(payload.amount * 0.05);
    const vendorSplit = payload.amount - platformSplit;

    const newTx: TransactionRecord = {
      id: `tx-${Math.floor(200 + Math.random() * 800)}`,
      bookingId: payload.bookingId,
      merchantId: payload.merchantId,
      grossAmount: payload.amount,
      platformSplit,
      vendorSplit,
      paymentStatus: 'settled',
      reference: payload.reference,
      timestamp: new Date().toISOString()
    };

    FINANCIAL_LEDGER.push(newTx);

    return {
      success: true,
      record: newTx,
      message: `Direct webhook clearance verified. Split 5% (₦${platformSplit.toLocaleString()}) to Platform Wallet; 95% (₦${vendorSplit.toLocaleString()}) settled securely to Merchant ${payload.merchantId} vault.`
    };
  }

  /**
   * Calculates overall ecosystem aggregates
   */
  public static calculateAggregates() {
    const totalGross = FINANCIAL_LEDGER.reduce((sum, tx) => sum + tx.grossAmount, 0);
    const totalPlatformFees = FINANCIAL_LEDGER.reduce((sum, tx) => sum + tx.platformSplit, 0);
    const totalVendorWithdrawals = FINANCIAL_LEDGER.reduce((sum, tx) => sum + tx.vendorSplit, 0);

    return {
      totalGross,
      totalPlatformFees,
      totalVendorWithdrawals
    };
  }
}
