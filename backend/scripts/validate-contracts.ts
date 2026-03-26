#!/usr/bin/env node

/**
 * API Contract Validation Script
 * Ensures frontend ↔ backend API contracts remain stable
 * Run: npm run validate:contracts or node scripts/validate-contracts.ts
 */

import axios, { AxiosError } from 'axios';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const BEARER_TOKEN = process.env.BEARER_TOKEN || '';

interface ContractTest {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  expectedStatus: number;
  expectedFields?: string[];
  description?: string;
  body?: Record<string, unknown>;
}

interface ValidationResult {
  passed: number;
  failed: number;
  errors: Array<{ test: string; error: string }>;
}

const headers = {
  'Content-Type': 'application/json',
  ...(BEARER_TOKEN && { Authorization: `Bearer ${BEARER_TOKEN}` })
};

/**
 * Validate a single endpoint contract
 */
async function validateContract(test: ContractTest): Promise<{ passed: boolean; error?: string }> {
  try {
    const url = `${API_BASE}${test.endpoint}`;
    
    let response;
    switch (test.method) {
      case 'GET':
        response = await axios.get(url, { headers });
        break;
      case 'POST':
        response = await axios.post(url, test.body || {}, { headers });
        break;
      case 'PUT':
        response = await axios.put(url, test.body || {}, { headers });
        break;
      case 'PATCH':
        response = await axios.patch(url, test.body || {}, { headers });
        break;
      case 'DELETE':
        response = await axios.delete(url, { headers });
        break;
    }

    // Check status code
    if (response.status !== test.expectedStatus) {
      return {
        passed: false,
        error: `Expected status ${test.expectedStatus}, got ${response.status}`
      };
    }

    // Check response fields if specified
    if (test.expectedFields && response.data) {
      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      const missingFields = test.expectedFields.filter(field => !(field in data));
      
      if (missingFields.length > 0) {
        return {
          passed: false,
          error: `Missing fields: ${missingFields.join(', ')}`
        };
      }
    }

    return { passed: true };
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      passed: false,
      error: axiosError.message || 'Unknown error'
    };
  }
}

/**
 * All API contract tests
 */
const contractTests: ContractTest[] = [
  // Auth Endpoints
  {
    name: 'Health Check',
    method: 'GET',
    endpoint: '/health',
    expectedStatus: 200,
    description: 'Verify API is running'
  },

  // User Management - CRUD Contracts
  {
    name: 'List Users',
    method: 'GET',
    endpoint: '/api/users',
    expectedStatus: 200,
    expectedFields: ['id', 'email', 'firstName', 'lastName', 'role']
  },

  {
    name: 'Create User',
    method: 'POST',
    endpoint: '/api/users',
    expectedStatus: 201,
    expectedFields: ['id', 'email', 'firstName', 'lastName'],
    body: {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'staff'
    }
  },

  // Tenant Management
  {
    name: 'List Tenants',
    method: 'GET',
    endpoint: '/api/tenants',
    expectedStatus: 200,
    expectedFields: ['id', 'name', 'organizationId', 'type', 'status']
  },

  {
    name: 'Get Tenant Detail',
    method: 'GET',
    endpoint: '/api/tenants/tenant_placeholder',
    expectedStatus: 200,
    expectedFields: ['id', 'name', 'organizationId', 'configuration']
  },

  // Services Management
  {
    name: 'List Services',
    method: 'GET',
    endpoint: '/api/services',
    expectedStatus: 200,
    expectedFields: ['id', 'name', 'description', 'pricing']
  },

  {
    name: 'Get Service Detail',
    method: 'GET',
    endpoint: '/api/services/service_placeholder',
    expectedStatus: 200,
    expectedFields: ['id', 'name', 'description', 'pricing', 'category']
  },

  // Bookings Management
  {
    name: 'List Bookings',
    method: 'GET',
    endpoint: '/api/bookings',
    expectedStatus: 200,
    expectedFields: ['id', 'clientId', 'staffId', 'serviceId', 'status', 'startTime']
  },

  {
    name: 'List Bookings - Filter by Status',
    method: 'GET',
    endpoint: '/api/bookings?status=completed',
    expectedStatus: 200,
    expectedFields: ['id', 'status']
  },

  {
    name: 'List Bookings - Pagination',
    method: 'GET',
    endpoint: '/api/bookings?limit=10&offset=0',
    expectedStatus: 200
  },

  // Payments Management
  {
    name: 'List Payments',
    method: 'GET',
    endpoint: '/api/payments',
    expectedStatus: 200,
    expectedFields: ['id', 'bookingId', 'amount', 'currency', 'status', 'gateway']
  },

  {
    name: 'List Payments - Filter by Gateway',
    method: 'GET',
    endpoint: '/api/payments?gateway=stripe',
    expectedStatus: 200,
    expectedFields: ['id', 'gateway']
  },

  {
    name: 'Get Payment Detail',
    method: 'GET',
    endpoint: '/api/payments/payment_placeholder',
    expectedStatus: 200,
    expectedFields: ['id', 'amount', 'currency', 'status', 'gateway', 'transactionId']
  },

  // Subscriptions Management
  {
    name: 'List Subscriptions',
    method: 'GET',
    endpoint: '/api/subscriptions',
    expectedStatus: 200,
    expectedFields: ['id', 'tenantId', 'planId', 'status', 'startDate', 'nextBillingDate']
  },

  // CRM - Clients
  {
    name: 'List Clients',
    method: 'GET',
    endpoint: '/api/clients',
    expectedStatus: 200,
    expectedFields: ['id', 'firstName', 'lastName', 'email', 'phone', 'status']
  },

  // Financial Dashboard
  {
    name: 'Get Finance Summary',
    method: 'GET',
    endpoint: '/api/finance/summary',
    expectedStatus: 200,
    expectedFields: ['revenue', 'expenses', 'net', 'period']
  },

  // AI Orchestration
  {
    name: 'AI Orchestration - Live',
    method: 'POST',
    endpoint: '/api/ai/orchestrate/live',
    expectedStatus: 200,
    expectedFields: ['actions', 'rankings', 'timestamp'],
    body: {
      signals: ['severity', 'dependencies', 'role_weight'],
      context: 'dashboard_refresh'
    }
  },

  {
    name: 'AI Orchestration - Feedback',
    method: 'POST',
    endpoint: '/api/ai/orchestrate/feedback',
    expectedStatus: 200,
    body: {
      actionId: 'action_1',
      decision: 'accepted',
      feedback: 'Correct suggestion'
    }
  },

  // Analytics
  {
    name: 'Get Analytics Dashboard',
    method: 'GET',
    endpoint: '/api/analytics/dashboard',
    expectedStatus: 200,
    expectedFields: ['totalBookings', 'totalRevenue', 'clientCount', 'staffCount']
  },

  // Error Handling - 404 Not Found
  {
    name: 'Non-existent Endpoint (404)',
    method: 'GET',
    endpoint: '/api/nonexistent',
    expectedStatus: 404
  },

  // Error Handling - Invalid Token (401)
  {
    name: 'Missing Auth Header (401)',
    method: 'GET',
    endpoint: '/api/protected-resource',
    expectedStatus: 401
  }
];

/**
 * Run all validation tests
 */
async function runValidation(): Promise<ValidationResult> {
  console.log('🔍 API Contract Validation Starting...\n');
  console.log(`📍 Target API: ${API_BASE}\n`);

  const result: ValidationResult = {
    passed: 0,
    failed: 0,
    errors: []
  };

  for (const test of contractTests) {
    process.stdout.write(`Testing: ${test.name} [${test.method} ${test.endpoint}]... `);

    const validation = await validateContract(test);

    if (validation.passed) {
      console.log('✅ PASS');
      result.passed++;
    } else {
      console.log('❌ FAIL');
      result.failed++;
      result.errors.push({
        test: test.name,
        error: validation.error || 'Unknown error'
      });
    }
  }

  return result;
}

/**
 * Print validation report
 */
function printReport(result: ValidationResult): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION REPORT');
  console.log('='.repeat(60) + '\n');

  console.log(`✅ Passed: ${result.passed}/${contractTests.length}`);
  console.log(`❌ Failed: ${result.failed}/${contractTests.length}`);
  console.log(`📈 Success Rate: ${((result.passed / contractTests.length) * 100).toFixed(1)}%\n`);

  if (result.errors.length > 0) {
    console.log('📋 Failed Tests:');
    result.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.test}`);
      console.log(`     Error: ${error.error}\n`);
    });
  } else {
    console.log('🎉 All contract tests passed!\n');
  }

  console.log('='.repeat(60));
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    // Wait for API to be ready
    console.log('⏳ Checking API availability...');
    let apiReady = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!apiReady && attempts < maxAttempts) {
      try {
        await axios.get(`${API_BASE}/health`, { headers });
        apiReady = true;
      } catch {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`  Attempt ${attempts}/${maxAttempts} - Waiting...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (!apiReady) {
      console.error(`❌ API not available at ${API_BASE}`);
      process.exit(1);
    }

    console.log('✅ API is ready!\n');

    // Run validation
    const result = await runValidation();

    // Print report
    printReport(result);

    // Exit with appropriate code
    process.exit(result.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error during validation:', error);
    process.exit(1);
  }
}

main();
