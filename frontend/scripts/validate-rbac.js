#!/usr/bin/env node

/**
 * RBAC Security Matrix Validation Script
 * Scans all JSX files for RequireRole usage and validates route protection
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const REQUIRED_ROLES = ['client', 'business_admin', 'staff', 'operations', 'kora_admin'];
const PROTECTED_ROUTES = [
  '/app/client/*',
  '/app/business-admin/*', 
  '/app/staff/*',
  '/app/operations/*',
  '/app/kora-admin/*'
];

function scanForUnprotectedRoutes() {
  const routeFiles = glob.sync('src/pages/**/*.tsx', { cwd: process.cwd() });
  const violations = [];

  routeFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check if route component is wrapped with RequireRole or withAuth
    if (!content.includes('RequireRole') && !content.includes('withAuth')) {
      // Skip non-route files (components, utils, etc.)
      if (file.includes('/pages/') && !file.includes('components/')) {
        violations.push({
          file,
          issue: 'Route component not protected with RequireRole/withAuth'
        });
      }
    }
  });

  return violations;
}

function validateNavigationPermissions() {
  const navFile = 'src/config/navigation.ts';
  if (!fs.existsSync(navFile)) {
    return [{ file: navFile, issue: 'Navigation config file missing' }];
  }

  const content = fs.readFileSync(navFile, 'utf8');
  const violations = [];

  REQUIRED_ROLES.forEach(role => {
    if (!content.includes(role)) {
      violations.push({
        file: navFile,
        issue: `Role '${role}' not found in navigation config`
      });
    }
  });

  return violations;
}

function main() {
  console.log('🔒 Running RBAC Security Matrix Validation...\n');

  const routeViolations = scanForUnprotectedRoutes();
  const navViolations = validateNavigationPermissions();
  
  const allViolations = [...routeViolations, ...navViolations];

  if (allViolations.length === 0) {
    console.log('✅ All security checks passed!');
    process.exit(0);
  } else {
    console.log('❌ Security violations found:\n');
    allViolations.forEach(violation => {
      console.log(`  ${violation.file}: ${violation.issue}`);
    });
    console.log(`\n${allViolations.length} violation(s) must be fixed before merge.`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scanForUnprotectedRoutes, validateNavigationPermissions };