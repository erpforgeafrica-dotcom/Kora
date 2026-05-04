#!/usr/bin/env node

/**
 * KORA Railway Deployment Validation Script
 * Validates all required environment variables and services before deployment
 * 
 * Usage: node validate-railway-deployment.js
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Validation state
let passed = 0;
let failed = 0;
let warnings = 0;

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  passed++;
  log(`✅ ${message}`, 'green');
}

function error(message) {
  failed++;
  log(`❌ ${message}`, 'red');
}

function warn(message) {
  warnings++;
  log(`⚠️  ${message}`, 'yellow');
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

// Validation functions
function checkEnvFile(path, name) {
  if (!existsSync(path)) {
    warn(`${name} not found at ${path}`);
    return null;
  }
  success(`${name} exists`);
  return readFileSync(path, 'utf-8');
}

function checkVariable(envContent, varName, required = false) {
  if (!envContent) {
    if (required) {
      error(`Cannot check ${varName} - .env file not found`);
    }
    return false;
  }

  const regex = new RegExp(`^${varName}=`, 'm');
  if (regex.test(envContent)) {
    success(`${varName} is configured`);
    return true;
  }

  if (required) {
    error(`${varName} is REQUIRED but not configured`);
  } else {
    warn(`${varName} is optional but not configured`);
  }
  return false;
}

function checkFileExists(path, description) {
  if (existsSync(path)) {
    success(`${description} found`);
    return true;
  }
  error(`${description} not found at ${path}`);
  return false;
}

function checkDatabaseConnection(dbUrl) {
  if (!dbUrl) {
    error('DATABASE_URL not configured - cannot test connection');
    return false;
  }

  try {
    // Basic URL validation
    new URL(dbUrl);
    success('DATABASE_URL format is valid');
    return true;
  } catch (e) {
    error(`DATABASE_URL format is invalid: ${e.message}`);
    return false;
  }
}

// Main validation
async function validate() {
  log('\n', 'cyan');
  log('🚂 KORA Railway Deployment Validator', 'cyan');
  log('Checking configuration before Railway deployment...\n', 'cyan');

  // 1. Check Backend Configuration
  section('Backend Configuration');
  const backendEnvPath = join(__dirname, 'backend', '.env');
  const backendEnv = checkEnvFile(backendEnvPath, 'backend/.env');

  if (backendEnv) {
    checkVariable(backendEnv, 'DATABASE_URL', true);
    checkVariable(backendEnv, 'REDIS_URL', true);
    checkVariable(backendEnv, 'JWT_SECRET', true);
    checkVariable(backendEnv, 'SESSION_SECRET', true);
    checkVariable(backendEnv, 'CLERK_SECRET_KEY', true);
    checkVariable(backendEnv, 'NODE_ENV', true);
    checkVariable(backendEnv, 'ANTHROPIC_API_KEY', false);
    checkVariable(backendEnv, 'OPENAI_API_KEY', false);
    checkVariable(backendEnv, 'STRIPE_SECRET_KEY', false);
  }

  // 2. Check Frontend Configuration
  section('Frontend Configuration');
  const frontendEnvPath = join(__dirname, 'frontend', '.env');
  const frontendEnv = checkEnvFile(frontendEnvPath, 'frontend/.env');

  if (frontendEnv) {
    checkVariable(frontendEnv, 'VITE_API_BASE_URL', true);
    checkVariable(frontendEnv, 'VITE_CLERK_PUBLISHABLE_KEY', true);
    checkVariable(frontendEnv, 'VITE_ORG_ID', false);
  }

  // 3. Check Project Files
  section('Project Files & Structure');
  checkFileExists(join(__dirname, 'backend', 'package.json'), 'Backend package.json');
  checkFileExists(join(__dirname, 'frontend', 'package.json'), 'Frontend package.json');
  checkFileExists(join(__dirname, 'backend', 'Dockerfile'), 'Backend Dockerfile');
  checkFileExists(join(__dirname, 'frontend', 'Dockerfile'), 'Frontend Dockerfile');
  checkFileExists(join(__dirname, 'railway.yaml'), 'railway.yaml');

  // 4. Check Docker Configuration
  section('Docker & Build Configuration');
  try {
    const dockerfileBackend = readFileSync(join(__dirname, 'backend', 'Dockerfile'), 'utf-8');
    if (dockerfileBackend.includes('FROM node')) {
      success('Backend Dockerfile has proper Node.js base image');
    } else {
      error('Backend Dockerfile may have issues');
    }
  } catch (e) {
    error(`Cannot read Backend Dockerfile: ${e.message}`);
  }

  try {
    const dockerfileFrontend = readFileSync(join(__dirname, 'frontend', 'Dockerfile'), 'utf-8');
    if (dockerfileFrontend.includes('VITE_CLERK_PUBLISHABLE_KEY')) {
      success('Frontend Dockerfile accepts VITE_CLERK_PUBLISHABLE_KEY');
    } else {
      warn('Frontend Dockerfile may not be configured for environment variables');
    }
  } catch (e) {
    error(`Cannot read Frontend Dockerfile: ${e.message}`);
  }

  // 5. NPM Dependencies
  section('NPM Dependencies');
  try {
    const backendPackage = JSON.parse(
      readFileSync(join(__dirname, 'backend', 'package.json'), 'utf-8')
    );
    if (backendPackage.scripts?.build && backendPackage.scripts?.start) {
      success('Backend has required build and start scripts');
    } else {
      error('Backend package.json missing build or start scripts');
    }
  } catch (e) {
    error(`Cannot read Backend package.json: ${e.message}`);
  }

  try {
    const frontendPackage = JSON.parse(
      readFileSync(join(__dirname, 'frontend', 'package.json'), 'utf-8')
    );
    if (frontendPackage.scripts?.build && frontendPackage.scripts?.dev) {
      success('Frontend has required build and dev scripts');
    } else {
      error('Frontend package.json missing build or dev scripts');
    }
  } catch (e) {
    error(`Cannot read Frontend package.json: ${e.message}`);
  }

  // 6. Railway Configuration
  section('Railway Configuration');
  try {
    const railwayConfig = readFileSync(join(__dirname, 'railway.yaml'), 'utf-8');
    if (railwayConfig.includes('kora-backend') && railwayConfig.includes('kora-worker')) {
      success('railway.yaml has backend and worker services configured');
    } else {
      warn('railway.yaml may be missing some services');
    }
    if (railwayConfig.includes('postgres') || railwayConfig.includes('redis')) {
      success('railway.yaml has database services configured');
    } else {
      warn('railway.yaml may not have database services configured');
    }
  } catch (e) {
    error(`Cannot read railway.yaml: ${e.message}`);
  }

  // Summary
  section('Validation Summary');
  const total = passed + failed + warnings;
  const successRate = Math.round((passed / total) * 100);

  log(`\n  Passed:  ${passed}`, 'green');
  log(`  Failed:  ${failed}`, failed > 0 ? 'red' : 'reset');
  log(`  Warnings: ${warnings}`, warnings > 0 ? 'yellow' : 'reset');
  log(`  Total:   ${total}\n`, 'reset');
  log(`  Success Rate: ${successRate}%\n`, successRate === 100 ? 'green' : 'yellow');

  if (failed === 0) {
    log('✅ All critical checks passed!', 'green');
    log('You can proceed with Railway deployment.', 'green');
    return true;
  } else {
    log('❌ Some critical checks failed!', 'red');
    log('Please fix the errors above before deploying to Railway.', 'red');
    return false;
  }
}

// Run validation
validate().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  log(`\nValidation error: ${err.message}`, 'red');
  process.exit(1);
});
