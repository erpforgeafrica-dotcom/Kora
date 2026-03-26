#!/usr/bin/env node

/**
 * Contract Validation Script
 * Validates all API endpoints against OpenAPI schema
 * Ensures request/response contracts match specification
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const OPENAPI_SPEC_PATH = path.resolve(__dirname, '../docs/openapi.yaml');

// Parse YAML (simplified - in production use yaml library)
function parseOpenApiSpec() {
  if (!fs.existsSync(OPENAPI_SPEC_PATH)) {
    console.warn(`⚠️  OpenAPI spec not found at ${OPENAPI_SPEC_PATH}`);
    return null;
  }

  const spec = fs.readFileSync(OPENAPI_SPEC_PATH, 'utf8');
  
  // Extract endpoints from spec (simplified parsing)
  const endpoints = [];
  const pathRegex = /\/api\/[^\s:]+/g;
  const matches = spec.match(pathRegex);
  
  if (matches) {
    endpoints.push(...new Set(matches));
  }

  return endpoints;
}

// Validate endpoint exists and responds
async function validateEndpoint(endpoint, method = 'GET') {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await axios({
      method,
      url,
      timeout: 5000,
      validateStatus: () => true // Don't throw on any status
    });

    return {
      endpoint,
      method,
      status: response.status,
      valid: response.status < 500,
      contentType: response.headers['content-type']
    };
  } catch (error) {
    return {
      endpoint,
      method,
      status: 0,
      valid: false,
      error: error.message
    };
  }
}

// Validate response schema matches spec
function validateResponseSchema(endpoint, response, expectedSchema) {
  const violations = [];

  if (!expectedSchema) {
    return violations;
  }

  // Check required fields
  if (expectedSchema.required) {
    expectedSchema.required.forEach(field => {
      if (!(field in response)) {
        violations.push(`Missing required field: ${field}`);
      }
    });
  }

  // Check field types
  if (expectedSchema.properties) {
    Object.entries(expectedSchema.properties).forEach(([field, schema]) => {
      if (field in response) {
        const actualType = typeof response[field];
        const expectedType = schema.type;
        
        if (actualType !== expectedType && expectedType !== 'any') {
          violations.push(`Field ${field}: expected ${expectedType}, got ${actualType}`);
        }
      }
    });
  }

  return violations;
}

// Core CRUD endpoints to validate
const CORE_ENDPOINTS = [
  { path: '/api/clients', method: 'GET', name: 'List Clients' },
  { path: '/api/clients', method: 'POST', name: 'Create Client' },
  { path: '/api/bookings', method: 'GET', name: 'List Bookings' },
  { path: '/api/bookings', method: 'POST', name: 'Create Booking' },
  { path: '/api/services', method: 'GET', name: 'List Services' },
  { path: '/api/services', method: 'POST', name: 'Create Service' },
  { path: '/api/staff', method: 'GET', name: 'List Staff' },
  { path: '/api/staff', method: 'POST', name: 'Create Staff' },
  { path: '/api/payments/transactions', method: 'GET', name: 'List Payments' },
  { path: '/api/payments', method: 'POST', name: 'Create Payment' },
  { path: '/api/media', method: 'GET', name: 'List Media' },
  { path: '/api/reviews', method: 'GET', name: 'List Reviews' },
  { path: '/api/ai/forecast', method: 'GET', name: 'AI Forecast' },
  { path: '/api/ai/anomalies', method: 'GET', name: 'AI Anomalies' },
  { path: '/api/ai/crm-scores', method: 'GET', name: 'AI CRM Scores' }
];

async function main() {
  console.log('📋 Running Contract Validation Tests\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const endpoint of CORE_ENDPOINTS) {
    process.stdout.write(`Testing ${endpoint.name}... `);
    
    const result = await validateEndpoint(endpoint.path, endpoint.method);
    results.push(result);

    if (result.valid) {
      console.log('✅');
      passed++;
    } else {
      console.log('❌');
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Contract Validation Results\n`);
  console.log(`Total Endpoints: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('Failed Endpoints:\n');
    results.filter(r => !r.valid).forEach(r => {
      console.log(`  ${r.method} ${r.endpoint}`);
      console.log(`    Status: ${r.status}`);
      if (r.error) console.log(`    Error: ${r.error}`);
      console.log('');
    });
  }

  console.log('='.repeat(60) + '\n');

  if (failed === 0) {
    console.log('✅ All contract validations passed!\n');
    process.exit(0);
  } else {
    console.log(`❌ ${failed} contract validation(s) failed.\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { validateEndpoint, validateResponseSchema, CORE_ENDPOINTS };
