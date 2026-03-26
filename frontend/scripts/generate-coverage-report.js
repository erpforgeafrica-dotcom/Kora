#!/usr/bin/env node

/**
 * Coverage Report Generator
 * Generates and validates test coverage against thresholds
 * Outputs summary for CI/CD pipeline
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COVERAGE_THRESHOLDS = {
  ui: { lines: 95, functions: 95, branches: 95, statements: 95 },
  services: { lines: 90, functions: 90, branches: 90, statements: 90 },
  hooks: { lines: 95, functions: 95, branches: 95, statements: 95 },
  pages: { lines: 85, functions: 85, branches: 85, statements: 85 }
};

function getCoverageByCategory() {
  try {
    // Run coverage collection
    console.log('📊 Collecting coverage data...\n');
    
    execSync('npm run test:coverage -- --reporter=json --outputFile=coverage/coverage-final.json', {
      stdio: 'inherit'
    });

    const coverageFile = path.resolve(process.cwd(), 'coverage/coverage-final.json');
    
    if (!fs.existsSync(coverageFile)) {
      console.error('❌ Coverage file not generated');
      return null;
    }

    const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
    
    // Categorize coverage by file path
    const categories = {
      ui: { files: [], coverage: { lines: 0, functions: 0, branches: 0, statements: 0 } },
      services: { files: [], coverage: { lines: 0, functions: 0, branches: 0, statements: 0 } },
      hooks: { files: [], coverage: { lines: 0, functions: 0, branches: 0, statements: 0 } },
      pages: { files: [], coverage: { lines: 0, functions: 0, branches: 0, statements: 0 } }
    };

    Object.entries(coverage).forEach(([filePath, fileCoverage]) => {
      let category = 'pages';
      
      if (filePath.includes('components/ui')) category = 'ui';
      else if (filePath.includes('services')) category = 'services';
      else if (filePath.includes('hooks')) category = 'hooks';
      else if (filePath.includes('pages')) category = 'pages';

      categories[category].files.push({
        path: filePath,
        coverage: fileCoverage.summary
      });

      // Aggregate coverage
      Object.keys(categories[category].coverage).forEach(metric => {
        categories[category].coverage[metric] += fileCoverage.summary[metric].pct || 0;
      });
    });

    // Average coverage per category
    Object.keys(categories).forEach(category => {
      const fileCount = categories[category].files.length;
      if (fileCount > 0) {
        Object.keys(categories[category].coverage).forEach(metric => {
          categories[category].coverage[metric] /= fileCount;
        });
      }
    });

    return categories;
  } catch (error) {
    console.error('Error collecting coverage:', error.message);
    return null;
  }
}

function validateThresholds(coverage) {
  const violations = [];

  Object.entries(coverage).forEach(([category, data]) => {
    const threshold = COVERAGE_THRESHOLDS[category];
    
    Object.entries(threshold).forEach(([metric, minValue]) => {
      const actualValue = Math.round(data.coverage[metric] * 100) / 100;
      
      if (actualValue < minValue) {
        violations.push({
          category,
          metric,
          actual: actualValue,
          required: minValue,
          gap: minValue - actualValue
        });
      }
    });
  });

  return violations;
}

function generateReport(coverage, violations) {
  console.log('\n' + '='.repeat(70));
  console.log('📈 TEST COVERAGE REPORT');
  console.log('='.repeat(70) + '\n');

  // Coverage by category
  console.log('Coverage by Category:\n');
  
  Object.entries(coverage).forEach(([category, data]) => {
    const threshold = COVERAGE_THRESHOLDS[category];
    console.log(`${category.toUpperCase()}`);
    console.log(`  Files: ${data.files.length}`);
    
    Object.entries(threshold).forEach(([metric, minValue]) => {
      const actual = Math.round(data.coverage[metric] * 100) / 100;
      const status = actual >= minValue ? '✅' : '❌';
      console.log(`  ${metric.padEnd(12)} ${status} ${actual}% (required: ${minValue}%)`);
    });
    console.log('');
  });

  // Violations
  if (violations.length > 0) {
    console.log('❌ THRESHOLD VIOLATIONS:\n');
    violations.forEach(v => {
      console.log(`  ${v.category}/${v.metric}`);
      console.log(`    Actual: ${v.actual}% | Required: ${v.required}% | Gap: -${v.gap}%`);
    });
    console.log('');
  }

  // Summary
  console.log('='.repeat(70));
  if (violations.length === 0) {
    console.log('✅ ALL COVERAGE THRESHOLDS MET');
  } else {
    console.log(`❌ ${violations.length} THRESHOLD VIOLATION(S) DETECTED`);
  }
  console.log('='.repeat(70) + '\n');

  return violations.length === 0;
}

function generateJsonReport(coverage, violations) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalViolations: violations.length,
      passed: violations.length === 0
    },
    coverage,
    violations,
    thresholds: COVERAGE_THRESHOLDS
  };

  const reportPath = path.resolve(process.cwd(), 'coverage/report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📄 Detailed report saved to: ${reportPath}\n`);
  
  return report;
}

function main() {
  console.log('🔍 Running Coverage Validation\n');

  const coverage = getCoverageByCategory();
  
  if (!coverage) {
    console.error('Failed to collect coverage data');
    process.exit(1);
  }

  const violations = validateThresholds(coverage);
  const passed = generateReport(coverage, violations);
  const report = generateJsonReport(coverage, violations);

  // Output for CI/CD
  console.log('CI/CD Output:');
  console.log(`COVERAGE_PASSED=${passed}`);
  console.log(`COVERAGE_VIOLATIONS=${violations.length}`);
  console.log(`UI_COVERAGE=${Math.round(coverage.ui.coverage.lines * 100) / 100}%`);
  console.log(`SERVICES_COVERAGE=${Math.round(coverage.services.coverage.lines * 100) / 100}%`);
  console.log(`HOOKS_COVERAGE=${Math.round(coverage.hooks.coverage.lines * 100) / 100}%`);
  console.log(`PAGES_COVERAGE=${Math.round(coverage.pages.coverage.lines * 100) / 100}%\n`);

  process.exit(passed ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { getCoverageByCategory, validateThresholds, generateReport };