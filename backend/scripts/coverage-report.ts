#!/usr/bin/env node

/**
 * Coverage Report Generator
 * Generates UI and Services test coverage reports
 * Targets: UI ≥95%, Services ≥90%
 * Run: npm run coverage or npm run coverage:report
 */

import { exec } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CoverageMetrics {
  lines: number;
  statements: number;
  functions: number;
  branches: number;
}

interface CoverageResult {
  total: CoverageMetrics;
  frontend?: {
    total: CoverageMetrics;
    directories: Record<string, CoverageMetrics>;
  };
  backend?: {
    total: CoverageMetrics;
    directories: Record<string, CoverageMetrics>;
  };
}

const COVERAGE_DIR = 'coverage';
const REPORTS_DIR = 'coverage-reports';
const THRESHOLDS = {
  frontend: { lines: 95, statements: 95, functions: 95, branches: 90 },
  backend: { lines: 90, statements: 90, functions: 85, branches: 80 }
};

/**
 * Run frontend tests with coverage
 */
async function runFrontendCoverage(): Promise<void> {
  console.log('🧪 Running frontend tests with coverage...\n');
  try {
    const { stdout } = await execAsync('npm run test:coverage', {
      cwd: join(process.cwd(), 'frontend'),
      env: { ...process.env, COVERAGE: 'true' }
    });
    console.log(stdout);
  } catch (error: any) {
    console.error('Frontend coverage failed:', error.message);
    throw error;
  }
}

/**
 * Run backend tests with coverage
 */
async function runBackendCoverage(): Promise<void> {
  console.log('🧪 Running backend tests with coverage...\n');
  try {
    const { stdout } = await execAsync('npm run test:coverage', {
      cwd: join(process.cwd(), 'backend'),
      env: { ...process.env, COVERAGE: 'true' }
    });
    console.log(stdout);
  } catch (error: any) {
    console.error('Backend coverage failed:', error.message);
    throw error;
  }
}

/**
 * Parse coverage JSON summary
 */
function parseCoverageSummary(filePath: string): CoverageMetrics {
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    return {
      lines: data.lines.pct,
      statements: data.statements.pct,
      functions: data.functions.pct,
      branches: data.branches.pct
    };
  } catch {
    return { lines: 0, statements: 0, functions: 0, branches: 0 };
  }
}

/**
 * Check if coverage meets threshold
 */
function checkThreshold(
  actual: CoverageMetrics,
  threshold: Record<string, number>,
  type: string
): { passed: boolean; failures: string[] } {
  const failures: string[] = [];

  Object.entries(threshold).forEach(([metric, target]) => {
    const actualValue = actual[metric as keyof CoverageMetrics];
    if (actualValue < target) {
      failures.push(
        `${metric}: ${actualValue.toFixed(1)}% (target: ${target}%)`
      );
    }
  });

  return {
    passed: failures.length === 0,
    failures
  };
}

/**
 * Generate HTML coverage report
 */
function generateHTMLReport(coverage: CoverageResult): void {
  mkdirSync(REPORTS_DIR, { recursive: true });

  const frontendCheck = coverage.frontend
    ? checkThreshold(coverage.frontend.total, THRESHOLDS.frontend, 'frontend')
    : { passed: false, failures: ['Frontend coverage data not found'] };

  const backendCheck = coverage.backend
    ? checkThreshold(coverage.backend.total, THRESHOLDS.backend, 'backend')
    : { passed: false, failures: ['Backend coverage data not found'] };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>KORA Coverage Report</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    .header p {
      opacity: 0.9;
      font-size: 1.1em;
    }
    .content {
      padding: 40px;
    }
    .summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }
    .card {
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 30px;
      transition: all 0.3s ease;
    }
    .card.pass {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.05);
    }
    .card.fail {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.05);
    }
    .card h2 {
      font-size: 1.5em;
      margin-bottom: 20px;
      color: #1f2937;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .metric:last-child {
      border-bottom: none;
    }
    .metric-name {
      color: #6b7280;
      font-weight: 500;
    }
    .metric-value {
      font-weight: bold;
      font-size: 1.1em;
    }
    .metric-value.good {
      color: #10b981;
    }
    .metric-value.warning {
      color: #f59e0b;
    }
    .metric-value.bad {
      color: #ef4444;
    }
    .status {
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }
    .status-icon {
      font-size: 2em;
      margin-bottom: 10px;
    }
    .status-text {
      font-size: 1.1em;
      font-weight: bold;
    }
    .status-text.pass {
      color: #10b981;
    }
    .status-text.fail {
      color: #ef4444;
    }
    .failures {
      background: #fff5f5;
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin-top: 15px;
      border-radius: 4px;
    }
    .failures ul {
      list-style: none;
      margin-left: 0;
    }
    .failures li {
      color: #b91c1c;
      padding: 5px 0;
      font-size: 0.95em;
    }
    .timestamp {
      color: #9ca3af;
      font-size: 0.9em;
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    @media (max-width: 768px) {
      .summary {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 KORA Test Coverage Report</h1>
      <p>Phase 6 Quality Assurance Dashboard</p>
    </div>

    <div class="content">
      <div class="summary">
        <!-- Frontend Coverage -->
        <div class="card ${frontendCheck.passed ? 'pass' : 'fail'}">
          <h2>Frontend Coverage</h2>
          <div class="metric">
            <span class="metric-name">Lines</span>
            <span class="metric-value ${coverage.frontend?.total.lines || 0 >= THRESHOLDS.frontend.lines ? 'good' : 'bad'}">
              ${coverage.frontend?.total.lines.toFixed(1) || 0}%
            </span>
          </div>
          <div class="metric">
            <span class="metric-name">Statements</span>
            <span class="metric-value ${coverage.frontend?.total.statements || 0 >= THRESHOLDS.frontend.statements ? 'good' : 'bad'}">
              ${coverage.frontend?.total.statements.toFixed(1) || 0}%
            </span>
          </div>
          <div class="metric">
            <span class="metric-name">Functions</span>
            <span class="metric-value ${coverage.frontend?.total.functions || 0 >= THRESHOLDS.frontend.functions ? 'good' : 'bad'}">
              ${coverage.frontend?.total.functions.toFixed(1) || 0}%
            </span>
          </div>
          <div class="metric">
            <span class="metric-name">Branches</span>
            <span class="metric-value ${coverage.frontend?.total.branches || 0 >= THRESHOLDS.frontend.branches ? 'good' : 'bad'}">
              ${coverage.frontend?.total.branches.toFixed(1) || 0}%
            </span>
          </div>
          <div class="status">
            <div class="status-icon">${frontendCheck.passed ? '✅' : '⚠️'}</div>
            <div class="status-text ${frontendCheck.passed ? 'pass' : 'fail'}">
              ${frontendCheck.passed ? 'Threshold Met' : 'Below Threshold'}
            </div>
            ${!frontendCheck.passed && frontendCheck.failures.length > 0 ? `
              <div class="failures">
                <ul>
                  ${frontendCheck.failures.map(f => `<li>• ${f}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Backend Coverage -->
        <div class="card ${backendCheck.passed ? 'pass' : 'fail'}">
          <h2>Backend Coverage</h2>
          <div class="metric">
            <span class="metric-name">Lines</span>
            <span class="metric-value ${coverage.backend?.total.lines || 0 >= THRESHOLDS.backend.lines ? 'good' : 'bad'}">
              ${coverage.backend?.total.lines.toFixed(1) || 0}%
            </span>
          </div>
          <div class="metric">
            <span class="metric-name">Statements</span>
            <span class="metric-value ${coverage.backend?.total.statements || 0 >= THRESHOLDS.backend.statements ? 'good' : 'bad'}">
              ${coverage.backend?.total.statements.toFixed(1) || 0}%
            </span>
          </div>
          <div class="metric">
            <span class="metric-name">Functions</span>
            <span class="metric-value ${coverage.backend?.total.functions || 0 >= THRESHOLDS.backend.functions ? 'good' : 'bad'}">
              ${coverage.backend?.total.functions.toFixed(1) || 0}%
            </span>
          </div>
          <div class="metric">
            <span class="metric-name">Branches</span>
            <span class="metric-value ${coverage.backend?.total.branches || 0 >= THRESHOLDS.backend.branches ? 'good' : 'bad'}">
              ${coverage.backend?.total.branches.toFixed(1) || 0}%
            </span>
          </div>
          <div class="status">
            <div class="status-icon">${backendCheck.passed ? '✅' : '⚠️'}</div>
            <div class="status-text ${backendCheck.passed ? 'pass' : 'fail'}">
              ${backendCheck.passed ? 'Threshold Met' : 'Below Threshold'}
            </div>
            ${!backendCheck.passed && backendCheck.failures.length > 0 ? `
              <div class="failures">
                <ul>
                  ${backendCheck.failures.map(f => `<li>• ${f}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <div class="timestamp">
        Generated: ${new Date().toLocaleString()}
      </div>
    </div>
  </div>
</body>
</html>
  `;

  writeFileSync(join(REPORTS_DIR, 'coverage-report.html'), html);
  console.log(`✅ HTML report written to: ${join(REPORTS_DIR, 'coverage-report.html')}`);
}

/**
 * Generate text coverage report
 */
function generateTextReport(coverage: CoverageResult): void {
  mkdirSync(REPORTS_DIR, { recursive: true });

  const frontendCheck = coverage.frontend
    ? checkThreshold(coverage.frontend.total, THRESHOLDS.frontend, 'frontend')
    : { passed: false, failures: [] };

  const backendCheck = coverage.backend
    ? checkThreshold(coverage.backend.total, THRESHOLDS.backend, 'backend')
    : { passed: false, failures: [] };

  let report = '═══════════════════════════════════════════════════════\n';
  report += '          KORA TEST COVERAGE REPORT - Phase 6\n';
  report += '═══════════════════════════════════════════════════════\n\n';

  // Frontend Report
  report += '📱 FRONTEND COVERAGE\n';
  report += '───────────────────────────────────────────────────────\n';
  if (coverage.frontend) {
    report += `Lines:       ${coverage.frontend.total.lines.toFixed(1)}% (target: ${THRESHOLDS.frontend.lines}%)\n`;
    report += `Statements:  ${coverage.frontend.total.statements.toFixed(1)}% (target: ${THRESHOLDS.frontend.statements}%)\n`;
    report += `Functions:   ${coverage.frontend.total.functions.toFixed(1)}% (target: ${THRESHOLDS.frontend.functions}%)\n`;
    report += `Branches:    ${coverage.frontend.total.branches.toFixed(1)}% (target: ${THRESHOLDS.frontend.branches}%)\n`;
    report += `Status:      ${frontendCheck.passed ? '✅ PASS' : '❌ FAIL'}\n`;
    if (!frontendCheck.passed) {
      report += `Failures:    \n`;
      frontendCheck.failures.forEach(f => (report += `  - ${f}\n`));
    }
  }

  report += '\n';

  // Backend Report
  report += '⚙️  BACKEND COVERAGE\n';
  report += '───────────────────────────────────────────────────────\n';
  if (coverage.backend) {
    report += `Lines:       ${coverage.backend.total.lines.toFixed(1)}% (target: ${THRESHOLDS.backend.lines}%)\n`;
    report += `Statements:  ${coverage.backend.total.statements.toFixed(1)}% (target: ${THRESHOLDS.backend.statements}%)\n`;
    report += `Functions:   ${coverage.backend.total.functions.toFixed(1)}% (target: ${THRESHOLDS.backend.functions}%)\n`;
    report += `Branches:    ${coverage.backend.total.branches.toFixed(1)}% (target: ${THRESHOLDS.backend.branches}%)\n`;
    report += `Status:      ${backendCheck.passed ? '✅ PASS' : '❌ FAIL'}\n`;
    if (!backendCheck.passed) {
      report += `Failures:    \n`;
      backendCheck.failures.forEach(f => (report += `  - ${f}\n`));
    }
  }

  report += '\n';
  report += '═══════════════════════════════════════════════════════\n';
  report += `Overall Status: ${frontendCheck.passed && backendCheck.passed ? '✅ ALL TESTS PASSED' : '❌ TESTS FAILED'}\n`;
  report += `Generated: ${new Date().toISOString()}\n`;
  report += '═══════════════════════════════════════════════════════\n';

  writeFileSync(join(REPORTS_DIR, 'coverage-report.txt'), report);
  console.log(`✅ Text report written to: ${join(REPORTS_DIR, 'coverage-report.txt')}`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('📊 KORA Coverage Report Generator\n');

  try {
    // Create coverage object
    const coverage: CoverageResult = {
      total: { lines: 0, statements: 0, functions: 0, branches: 0 }
    };

    // Run frontend tests
    try {
      await runFrontendCoverage();
      const frontendSummary = parseCoverageSummary(
        join(process.cwd(), 'frontend', COVERAGE_DIR, 'coverage-summary.json')
      );
      coverage.frontend = {
        total: frontendSummary,
        directories: {}
      };
      console.log('✅ Frontend coverage collected\n');
    } catch (error) {
      console.warn('⚠️  Frontend coverage collection failed\n');
    }

    // Run backend tests
    try {
      await runBackendCoverage();
      const backendSummary = parseCoverageSummary(
        join(process.cwd(), 'backend', COVERAGE_DIR, 'coverage-summary.json')
      );
      coverage.backend = {
        total: backendSummary,
        directories: {}
      };
      console.log('✅ Backend coverage collected\n');
    } catch (error) {
      console.warn('⚠️  Backend coverage collection failed\n');
    }

    // Generate reports
    console.log('\n📝 Generating reports...\n');
    generateHTMLReport(coverage);
    generateTextReport(coverage);

    // Print summary
    const frontendCheck = coverage.frontend
      ? checkThreshold(coverage.frontend.total, THRESHOLDS.frontend, 'frontend')
      : { passed: false };
    const backendCheck = coverage.backend
      ? checkThreshold(coverage.backend.total, THRESHOLDS.backend, 'backend')
      : { passed: false };

    console.log('\n📊 Summary:');
    console.log(`   Frontend: ${frontendCheck.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Backend:  ${backendCheck.passed ? '✅ PASS' : '❌ FAIL'}`);

    process.exit(frontendCheck.passed && backendCheck.passed ? 0 : 1);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
