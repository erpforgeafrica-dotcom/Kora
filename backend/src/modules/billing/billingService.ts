import fetch from 'node-fetch';
import { logger } from '../../shared/logger.js';
import { queryDb } from '../../db/index.js';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || 'sk_test_placeholder';

export class BillingService {
  async initializePayment(email: string, plan: string, organizationId: string) {
    // Map plans to amounts (in kobo/cents)
    const planPrices: Record<string, number> = {
      'pro': 500000,      // $50.00 equivalent
      'business': 2000000, // $200.00 equivalent
      'enterprise': 10000000 // $1000.00 equivalent
    };

    const amount = planPrices[plan.toLowerCase()];
    if (!amount) throw new Error("Invalid plan selection");

    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          amount,
          metadata: {
            custom_fields: [
              { display_name: "Plan", variable_name: "plan", value: plan },
              { display_name: "Organization ID", variable_name: "org_id", value: organizationId }
            ]
          }
        })
      });

      const data = await response.json() as any;
      if (!data.status) throw new Error(data.message || 'Payment initialization failed');

      return {
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference
      };
    } catch (error) {
      logger.error('Paystack initialization error', { error });
      throw new Error("Failed to contact payment gateway");
    }
  }

  async verifyPayment(reference: string, organizationId: string) {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET}`
        }
      });

      const data = await response.json() as any;
      
      // Paystack returns "success" in `data.data.status`
      if (!data.status || data.data.status !== 'success') {
        throw new Error('Payment verification failed');
      }

      const planFromMeta = data.data.metadata?.custom_fields?.find((f: any) => f.variable_name === 'plan')?.value || 'pro';
      const paidOrgId = data.data.metadata?.custom_fields?.find((f: any) => f.variable_name === 'org_id')?.value;

      if (paidOrgId !== organizationId) {
        throw new Error("Payment reference belongs to a different organization");
      }

      // 1) Update organization AI plan
      await queryDb(`UPDATE organizations SET ai_plan = $1 WHERE id = $2`, [planFromMeta.toLowerCase(), organizationId]);

      // 2) Upsert into subscriptions table (start a 30 day cycle)
      await queryDb(`
        INSERT INTO subscriptions (organization_id, plan, status, start_date, end_date, provider_subscription_id)
        VALUES ($1, $2, 'active', NOW(), NOW() + INTERVAL '30 days', $3)
      `, [organizationId, planFromMeta.toLowerCase(), reference]);

      logger.info('Payment verified and subscription activated', { organizationId, plan: planFromMeta });
      return { success: true, plan: planFromMeta };
    } catch (error: any) {
      logger.error('Paystack verification error', { error, reference });
      if (error.message === "Payment reference belongs to a different organization") {
          throw error;
      }
      throw new Error("Payment verification failed");
    }
  }
}

export const billingService = new BillingService();
