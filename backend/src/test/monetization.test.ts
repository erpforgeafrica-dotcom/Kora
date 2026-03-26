import { describe, it, expect } from 'vitest';
import { requirePlan } from '../../src/middleware/planValidation.js';
import { Request, Response, NextFunction } from 'express';

describe('Monetization Plan Enforcement', () => {
    it('blocks access if organization is missing', async () => {
        const middleware = requirePlan('pro');
        const req = {} as Request;
        let finalStatus = 0;
        let finalData: any = {};
        
        const res = {
            locals: { auth: {} },
            status: (s: number) => { finalStatus = s; return res; },
            json: (d: any) => { finalData = d; return res; }
        } as unknown as Response;
        const next = (() => {}) as NextFunction;

        await middleware(req, res, next);
        
        expect(finalStatus).toBe(401);
        expect(finalData.error).toBe('unauthorized');
    });
});
