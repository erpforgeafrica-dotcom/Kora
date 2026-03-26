// Payment Transactions, Methods, and Configuration Repository
import { queryDb } from "../client.js";

export const PaymentsRepository = {
  // === TRANSACTIONS ===
  
  async getTransactionById(transactionId: string, organizationId: string) {
    const result = await queryDb(
      `SELECT * FROM payment_transactions 
       WHERE id = $1 AND organization_id = $2`,
      [transactionId, organizationId]
    );
    return result[0] || null;
  },

  async listTransactionsForOrg(organizationId: string, filters: { status?: string; limit?: number; offset?: number } = {}) {
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const statusFilter = filters.status ? " AND status = $2" : "";
    
    const params = filters.status ? [organizationId, filters.status, limit, offset] : [organizationId, limit, offset];
    const result = await queryDb(
      `SELECT * FROM payment_transactions 
       WHERE organization_id = $1${statusFilter}
       ORDER BY created_at DESC
       LIMIT $${filters.status ? 3 : 2} OFFSET $${filters.status ? 4 : 3}`,
      params
    );
    return result;
  },

  async countTransactions(organizationId: string, status?: string) {
    const statusFilter = status ? " AND status = $2" : "";
    const params = status ? [organizationId, status] : [organizationId];
    const result = await queryDb(
      `SELECT COUNT(*) as count FROM payment_transactions 
       WHERE organization_id = $1${statusFilter}`,
      params
    );
    return parseInt(result[0]?.count || "0");
  },

  async createTransaction(data: {
    organization_id: string;
    user_id: string;
    amount_cents: number;
    currency: string;
    gateway: string;
    gateway_transaction_id: string;
    status: string;
    metadata?: Record<string, unknown>;
  }) {
    const result = await queryDb(
      `INSERT INTO payment_transactions 
       (organization_id, user_id, amount_cents, currency, gateway, gateway_transaction_id, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.organization_id,
        data.user_id,
        data.amount_cents,
        data.currency,
        data.gateway,
        data.gateway_transaction_id,
        data.status,
        JSON.stringify(data.metadata || {})
      ]
    );
    return result[0];
  },

  async updateTransactionStatus(transactionId: string, status: string, organizationId: string) {
    const result = await queryDb(
      `UPDATE payment_transactions 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [status, transactionId, organizationId]
    );
    return result[0] || null;
  },

  // === PAYMENT METHODS ===

  async listPaymentMethods(organizationId: string, userId?: string) {
    let query = `SELECT * FROM payment_methods WHERE organization_id = $1`;
    const params = [organizationId];
    
    if (userId) {
      query += ` AND user_id = $2`;
      params.push(userId);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const result = await queryDb(query, params);
    return result;
  },

  async attachPaymentMethod(data: {
    organization_id: string;
    user_id: string;
    type: string;
    gateway_method_id: string;
    is_default: boolean;
  }) {
    const result = await queryDb(
      `INSERT INTO payment_methods 
       (organization_id, user_id, type, gateway_method_id, is_default)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.organization_id, data.user_id, data.type, data.gateway_method_id, data.is_default]
    );
    return result[0];
  },

  async deletePaymentMethod(methodId: string, organizationId: string) {
    await queryDb(
      `DELETE FROM payment_methods WHERE id = $1 AND organization_id = $2`,
      [methodId, organizationId]
    );
  },

  // === PAYMENT INTENTS ===

  async createPaymentIntent(data: {
    organization_id: string;
    user_id: string;
    amount_cents: number;
    currency: string;
    gateway: string;
    gateway_intent_id: string;
    status: string;
  }) {
    const result = await queryDb(
      `INSERT INTO payment_intents 
       (organization_id, user_id, amount_cents, currency, gateway, gateway_intent_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.organization_id, data.user_id, data.amount_cents, data.currency, data.gateway, data.gateway_intent_id, data.status]
    );
    return result[0];
  },

  async getPaymentIntent(intentId: string, organizationId: string) {
    const result = await queryDb(
      `SELECT * FROM payment_intents WHERE id = $1 AND organization_id = $2`,
      [intentId, organizationId]
    );
    return result[0] || null;
  },

  // === REVENUE METRICS ===

  async getRevenueSummary(organizationId: string, periodDays: number = 30) {
    const result = await queryDb(
      `SELECT 
        SUM(amount_cents) as total_revenue_cents,
        COUNT(*) as transaction_count,
        AVG(amount_cents) as avg_transaction_cents
       FROM payment_transactions 
       WHERE organization_id = $1 
       AND status = 'completed'
       AND created_at > NOW() - INTERVAL '${periodDays} days'`,
      [organizationId]
    );
    return result[0] || { total_revenue_cents: 0, transaction_count: 0, avg_transaction_cents: 0 };
  },

  // === CONFIGURATION ===

  async getPaymentConfig(organizationId: string) {
    const result = await queryDb(
      `SELECT * FROM payment_configurations WHERE organization_id = $1`,
      [organizationId]
    );
    return result[0] || null;
  },

  async updatePaymentConfig(data: {
    organization_id: string;
    stripe_enabled: boolean;
    paypal_enabled: boolean;
    flutterwave_enabled: boolean;
    paystack_enabled: boolean;
  }) {
    const existing = await this.getPaymentConfig(data.organization_id);
    
    if (existing) {
      const result = await queryDb(
        `UPDATE payment_configurations 
         SET stripe_enabled = $1, paypal_enabled = $2, flutterwave_enabled = $3, paystack_enabled = $4, updated_at = NOW()
         WHERE organization_id = $5
         RETURNING *`,
        [data.stripe_enabled, data.paypal_enabled, data.flutterwave_enabled, data.paystack_enabled, data.organization_id]
      );
      return result[0];
    }
    
    const result = await queryDb(
      `INSERT INTO payment_configurations 
       (organization_id, stripe_enabled, paypal_enabled, flutterwave_enabled, paystack_enabled)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.organization_id, data.stripe_enabled, data.paypal_enabled, data.flutterwave_enabled, data.paystack_enabled]
    );
    return result[0];
  }
};
