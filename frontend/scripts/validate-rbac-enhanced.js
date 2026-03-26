#!/usr/bin/env node

/**
 * Enhanced RBAC Security Matrix Validation Script
 * Scans routes AND UI actions (buttons, links) for RequireRole usage
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

const PROTECTED_ACTIONS = [
  'delete', 'edit', 'create', 'update', 'remove', 
  'approve', 'reject', 'cancel', 'confirm'
];

function scanForUnprotectedRoutes() {
  const routeFiles = glob.sync('src/pages/**/*.tsx', { cwd: process.cwd() });
  const violations = [];

  routeFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    if (!content.includes('RequireRole') && !content.includes('withAuth')) {
      if (file.includes('/pages/') && !file.includes('components/')) {
        violations.push({
          file,
          issue: 'Route component not protected with RequireRole/withAuth',
          severity: 'HIGH'
        });
      }
    }
  });

  return violations;
}

function scanForUnprotectedUIActions() {
  const componentFiles = glob.sync('src/{pages,components}/**/*.tsx', { cwd: process.cwd() });
  const violations = [];

  componentFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for action buttons without permission checks
      PROTECTED_ACTIONS.forEach(action => {
        const buttonPattern = new RegExp(`<button[^>]*data-testid=["']${action}-`, 'i');
        const onClickPattern = new RegExp(`onClick.*${action}`, 'i');
        
        if (buttonPattern.test(line) || onClickPattern.test(line)) {
          // Look for permission check in surrounding lines
          const contextStart = Math.max(0, index - 5);
          const contextEnd = Math.min(lines.length, index + 5);
          const context = lines.slice(contextStart, contextEnd).join('\n');
          
          if (!context.includes('hasPermission') && 
              !context.includes('canPerform') && 
              !context.includes('RequireRole') &&
              !context.includes('checkRole')) {
            violations.push({
              file,
              line: index + 1,
              issue: `Action button '${action}' may not have permission check`,
              severity: 'MEDIUM',
              snippet: line.trim()
            });
          }
        }
      });
    });
  });

  return violations;
}

function validateNavigationPermissions() {
  const navFile = 'src/config/navigation.ts';
  if (!fs.existsSync(navFile)) {
    return [{ 
      file: navFile, 
      issue: 'Navigation config file missing',
      severity: 'HIGH'
    }];
  }

  const content = fs.readFileSync(navFile, 'utf8');
  const violations = [];

  REQUIRED_ROLES.forEach(role => {
    if (!content.includes(role)) {
      violations.push({
        file: navFile,
        issue: `Role '${role}' not found in navigation config`,
        severity: 'HIGH'
      });
    }
  });

  return violations;
}

function generateReport(violations) {
  const high = violations.filter(v => v.severity === 'HIGH');
  const medium = violations.filter(v => v.severity === 'MEDIUM');
  
  console.log('\n📊 RBAC Security Validation Report\n');
  console.log(`Total Violations: ${violations.length}`);
  console.log(`  🔴 High Severity: ${high.length}`);
  console.log(`  🟡 Medium Severity: ${medium.length}\n`);

  if (high.length > 0) {
    console.log('🔴 HIGH SEVERITY VIOLATIONS:\n');
    high.forEach(v => {
      console.log(`  ${v.file}${v.line ? `:${v.line}` : ''}`);
      console.log(`    ${v.issue}`);
      if (v.snippet) console.log(`    Code: ${v.snippet}`);
      console.log('');
    });
  }

  if (medium.length > 0) {
    console.log('🟡 MEDIUM SEVERITY VIOLATIONS:\n');
    medium.forEach(v => {
      console.log(`  ${v.file}${v.line ? `:${v.line}` : ''}`);
      console.log(`    ${v.issue}`);
      if (v.snippet) console.log(`    Code: ${v.snippet}`);
      console.log('');
    });
  }
}

function main() {
  console.log('🔒 Running Enhanced RBAC Security Matrix Validation...\n');

  const routeViolations = scanForUnprotectedRoutes();
  const uiActionViolations = scanForUnprotectedUIActions();
  const navViolations = validateNavigationPermissions();
  
  const allViolations = [...routeViolations, ...uiActionViolations, ...navViolations];

  if (allViolations.length === 0) {
    console.log('✅ All security checks passed!');
    console.log('   - All routes protected');
    console.log('   - All UI actions have permission checks');
    console.log('   - Navigation config complete');
    process.exit(0);
  } else {
    generateReport(allViolations);
    console.log(`\n❌ ${allViolations.length} violation(s) must be fixed before merge.`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  scanForUnprotectedRoutes, 
  scanForUnprotectedUIActions,
  validateNavigationPermissions 
};