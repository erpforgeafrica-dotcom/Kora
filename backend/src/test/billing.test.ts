import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from '../../src/db/index.js';

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
vi.mock('node-fetch', () => ({ default: fetchMock }));

import { BillingService } from '../../src/modules/billing/billingService.js';

vi.mock('../../src/db/index.js', () => ({
  queryDb: vi.fn().mockResolvedValue([])
}));

describe('BillingService', () => {
    let billingService: BillingService;

    beforeEach(() => {
        billingService = new BillingService();
        vi.clearAllMocks();
    });

    it('rejects invalid plans', async () => {
        await expect(billingService.initializePayment('test@example.com', 'invalid_plan', 'org-123'))
            .rejects.toThrow("Invalid plan selection");
    });

    it('initializes a valid payment session simulating Paystack success', async () => {
        fetchMock.mockResolvedValueOnce({
            json: async () => ({
                status: true,
                data: {
                    authorization_url: 'https://checkout.paystack.com/1234',
                    access_code: 'code123',
                    reference: 'ref123'
                }
            })
        });

        const result = await billingService.initializePayment('test@example.com', 'pro', 'org-123');
        expect(result.authorization_url).toBe('https://checkout.paystack.com/1234');
        expect(result.reference).toBe('ref123');
    });

    it('verifies a payment and calls db updates', async () => {
        fetchMock.mockResolvedValueOnce({
            json: async () => ({
                status: true,
                data: {
                    status: 'success',
                    metadata: {
                        custom_fields: [
                            { variable_name: 'plan', value: 'business' },
                            { variable_name: 'org_id', value: 'org-123' }
                        ]
                    }
                }
            })
        });

        const result = await billingService.verifyPayment('ref123', 'org-123');
        
        expect(result.success).toBe(true);
        expect(result.plan).toBe('business');
        // Check if queryDb was called for UPSERT operations
        expect(db.queryDb).toHaveBeenCalledTimes(2);
    });

    it('throws error on mismatched organization verification', async () => {
        fetchMock.mockResolvedValueOnce({
            json: async () => ({
                status: true,
                data: {
                    status: 'success',
                    metadata: {
                        custom_fields: [
                            { variable_name: 'plan', value: 'pro' },
                            { variable_name: 'org_id', value: 'org-malicious' }
                        ]
                    }
                }
            })
        });

        await expect(billingService.verifyPayment('ref123', 'org-123'))
            .rejects.toThrow("Payment reference belongs to a different organization");
    });
});
