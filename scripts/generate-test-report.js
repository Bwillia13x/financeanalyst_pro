/**
 * Comprehensive Test Report Generator
 * FinanceAnalyst Pro Platform
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class ComprehensiveTestReport {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      platform: {
        nodeVersion: process.version,
        npmVersion: this.getNpmVersion(),
        os: process.platform,
        arch: process.arch
      },
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        errorTests: 0,
        coverage: {
          statements: 0,
          branches: 0,
          functions: 0,
          lines: 0
        },
        performance: {
          bundleSize: 0,
          lighthouseScore: 0,
          loadTime: 0
        },
        security: {
          vulnerabilities: 0,
          severity: 'unknown'
        }
      },
      sections: []
    };
  }

  getNpmVersion() {
    try {
      return execSync('npm --version').toString().trim();
    } catch (error) {
      return 'unknown';
    }
  }

  async generateReport() {
    console.log('📊 Generating Comprehensive Test Report');

    try {
      // Collect test results from various sources
      await this.collectUnitTestResults();
      await this.collectIntegrationTestResults();
      await this.collectE2eTestResults();
      await this.collectPerformanceResults();
      await this.collectSecurityResults();
      await this.collectCoverageResults();
      await this.collectAccessibilityResults();

      // Calculate summary metrics
      this.calculateSummary();

      // Generate detailed sections
      this.generateDetailedSections();

      // Save comprehensive report
      this.saveReport();

      // Generate HTML report
      this.generateHtmlReport();

      // Print summary to console
      this.printSummary();
    } catch (error) {
      console.error('❌ Error generating test report:', error);
      this.report.error = error.message;
      this.saveReport();
    }
  }

  async collectUnitTestResults() {
    console.log('📝 Collecting unit test results...');

    const vitestResultsPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    const jestResultsPath = path.join(
      process.cwd(),
      'backend',
      'coverage',
      'coverage-summary.json'
    );

    let frontendResults = null;
    let backendResults = null;

    // Frontend unit tests (Vitest)
    if (fs.existsSync(vitestResultsPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(vitestResultsPath, 'utf8'));
        frontendResults = {
          type: 'frontend',
          framework: 'vitest',
          total: data.total?.lines?.total || 0,
          covered: data.total?.lines?.covered || 0,
          percentage: data.total?.lines?.pct || 0,
          details: data
        };
      } catch (error) {
        console.warn('⚠️ Could not parse Vitest coverage results:', error.message);
      }
    }

    // Backend unit tests (Jest)
    if (fs.existsSync(jestResultsPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(jestResultsPath, 'utf8'));
        backendResults = {
          type: 'backend',
          framework: 'jest',
          total: data.total?.lines?.total || 0,
          covered: data.total?.lines?.covered || 0,
          percentage: data.total?.lines?.pct || 0,
          details: data
        };
      } catch (error) {
        console.warn('⚠️ Could not parse Jest coverage results:', error.message);
      }
    }

    this.report.unitTests = {
      frontend: frontendResults,
      backend: backendResults
    };
  }

  async collectIntegrationTestResults() {
    console.log('🔗 Collecting integration test results...');

    const integrationResults = [];

    // Check for integration test result files
    const integrationDir = path.join(process.cwd(), 'src', 'test', 'integration');
    if (fs.existsSync(integrationDir)) {
      const files = fs.readdirSync(integrationDir);
      files.forEach(file => {
        if (file.endsWith('.json') && file.includes('result')) {
          try {
            const filePath = path.join(integrationDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            integrationResults.push(data);
          } catch (error) {
            console.warn(`⚠️ Could not parse integration result file ${file}:`, error.message);
          }
        }
      });
    }

    this.report.integrationTests = integrationResults;
  }

  async collectE2eTestResults() {
    console.log('🎭 Collecting E2E test results...');

    const playwrightReportPath = path.join(process.cwd(), 'playwright-report', 'index.html');
    const e2eResults = {
      playwright: null,
      custom: []
    };

    // Check for Playwright results
    if (fs.existsSync(playwrightReportPath)) {
      e2eResults.playwright = {
        reportPath: playwrightReportPath,
        status: 'generated'
      };
    }

    // Check for custom E2E test results
    const e2eDir = path.join(process.cwd(), 'tests', 'e2e');
    if (fs.existsSync(e2eDir)) {
      const files = fs.readdirSync(e2eDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(e2eDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            e2eResults.custom.push(data);
          } catch (error) {
            console.warn(`⚠️ Could not parse E2E result file ${file}:`, error.message);
          }
        }
      });
    }

    this.report.e2eTests = e2eResults;
  }

  async collectPerformanceResults() {
    console.log('⚡ Collecting performance test results...');

    const performanceReportPath = path.join(process.cwd(), 'performance-report.json');
    const crossBrowserReportPath = path.join(process.cwd(), 'cross-browser-report.json');

    let performanceResults = null;
    let crossBrowserResults = null;

    if (fs.existsSync(performanceReportPath)) {
      try {
        performanceResults = JSON.parse(fs.readFileSync(performanceReportPath, 'utf8'));
      } catch (error) {
        console.warn('⚠️ Could not parse performance results:', error.message);
      }
    }

    if (fs.existsSync(crossBrowserReportPath)) {
      try {
        crossBrowserResults = JSON.parse(fs.readFileSync(crossBrowserReportPath, 'utf8'));
      } catch (error) {
        console.warn('⚠️ Could not parse cross-browser results:', error.message);
      }
    }

    this.report.performance = {
      loadTesting: performanceResults,
      crossBrowser: crossBrowserResults
    };
  }

  async collectSecurityResults() {
    console.log('🔒 Collecting security scan results...');

    try {
      // Run npm audit and capture results
      const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(auditOutput);

      this.report.security = {
        npmAudit: auditData,
        vulnerabilityCount: auditData.metadata?.vulnerabilities?.total || 0,
        severityBreakdown: auditData.metadata?.vulnerabilities || {}
      };
    } catch (error) {
      console.warn('⚠️ Could not run security audit:', error.message);
      this.report.security = {
        error: error.message,
        status: 'failed'
      };
    }
  }

  async collectCoverageResults() {
    console.log('📈 Collecting coverage analysis...');

    const coverageFiles = [
      'coverage/coverage-summary.json',
      'backend/coverage/coverage-summary.json'
    ];

    let combinedCoverage = {
      statements: { total: 0, covered: 0, pct: 0 },
      branches: { total: 0, covered: 0, pct: 0 },
      functions: { total: 0, covered: 0, pct: 0 },
      lines: { total: 0, covered: 0, pct: 0 }
    };

    coverageFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (data.total) {
            Object.keys(combinedCoverage).forEach(metric => {
              if (data.total[metric]) {
                combinedCoverage[metric].total += data.total[metric].total || 0;
                combinedCoverage[metric].covered += data.total[metric].covered || 0;
              }
            });
          }
        } catch (error) {
          console.warn(`⚠️ Could not parse coverage file ${filePath}:`, error.message);
        }
      }
    });

    // Calculate percentages
    Object.keys(combinedCoverage).forEach(metric => {
      const { total, covered } = combinedCoverage[metric];
      combinedCoverage[metric].pct = total > 0 ? (covered / total) * 100 : 0;
    });

    this.report.coverage = combinedCoverage;
  }

  async collectAccessibilityResults() {
    console.log('♿ Collecting accessibility test results...');

    // Check for accessibility test results
    const accessibilityResults = [];

    const accessibilityDir = path.join(process.cwd(), 'src', 'test', 'accessibility');
    if (fs.existsSync(accessibilityDir)) {
      const files = fs.readdirSync(accessibilityDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(accessibilityDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            accessibilityResults.push(data);
          } catch (error) {
            console.warn(`⚠️ Could not parse accessibility result file ${file}:`, error.message);
          }
        }
      });
    }

    this.report.accessibility = accessibilityResults;
  }

  calculateSummary() {
    console.log('🧮 Calculating summary metrics...');

    // Calculate coverage summary
    if (this.report.coverage) {
      this.report.summary.coverage = {
        statements: this.report.coverage.statements?.pct || 0,
        branches: this.report.coverage.branches?.pct || 0,
        functions: this.report.coverage.functions?.pct || 0,
        lines: this.report.coverage.lines?.pct || 0
      };
    }

    // Calculate security summary
    if (this.report.security) {
      this.report.summary.security = {
        vulnerabilities: this.report.security.vulnerabilityCount || 0,
        severity:
          this.report.security.severityBreakdown?.critical > 0
            ? 'critical'
            : this.report.security.severityBreakdown?.high > 0
              ? 'high'
              : this.report.security.severityBreakdown?.moderate > 0
                ? 'moderate'
                : 'low'
      };
    }

    // Calculate test counts
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    let errorTests = 0;

    // Count unit tests
    if (this.report.unitTests) {
      if (this.report.unitTests.frontend) totalTests++;
      if (this.report.unitTests.backend) totalTests++;
    }

    // Count integration tests
    if (this.report.integrationTests) {
      totalTests += this.report.integrationTests.length;
    }

    // Count E2E tests
    if (this.report.e2eTests) {
      if (this.report.e2eTests.playwright) totalTests++;
      totalTests += this.report.e2eTests.custom.length;
    }

    this.report.summary.totalTests = totalTests;
    this.report.summary.passedTests = passedTests;
    this.report.summary.failedTests = failedTests;
    this.report.summary.skippedTests = skippedTests;
    this.report.summary.errorTests = errorTests;
  }

  generateDetailedSections() {
    console.log('📋 Generating detailed report sections...');

    this.report.sections = [
      {
        title: 'Test Execution Summary',
        content: {
          unitTests: this.report.unitTests,
          integrationTests: this.report.integrationTests,
          e2eTests: this.report.e2eTests
        }
      },
      {
        title: 'Code Coverage Analysis',
        content: this.report.coverage
      },
      {
        title: 'Performance Metrics',
        content: this.report.performance
      },
      {
        title: 'Security Assessment',
        content: this.report.security
      },
      {
        title: 'Accessibility Compliance',
        content: this.report.accessibility
      }
    ];
  }

  saveReport() {
    const reportPath = path.join(process.cwd(), 'comprehensive-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(`✅ Comprehensive test report saved to: ${reportPath}`);
  }

  generateHtmlReport() {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FinanceAnalyst Pro - Comprehensive Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #007acc; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #007acc; }
        .metric .value { font-size: 2em; font-weight: bold; color: #333; }
        .metric .label { color: #666; font-size: 0.9em; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #007acc; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .status.pass { background: #d4edda; color: #155724; }
        .status.fail { background: #f8d7da; color: #721c24; }
        .status.warn { background: #fff3cd; color: #856404; }
        .status.skip { background: #e2e3e5; color: #383d41; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .chart { height: 200px; background: #f8f9fa; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 FinanceAnalyst Pro</h1>
            <h2>Comprehensive Test Report</h2>
            <p>Generated on: ${new Date(this.report.timestamp).toLocaleString()}</p>
            <p>Environment: ${this.report.environment}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>Test Coverage</h3>
                <div class="value">${this.report.summary.coverage.lines.toFixed(1)}%</div>
                <div class="label">Code Coverage</div>
            </div>
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${this.report.summary.totalTests}</div>
                <div class="label">Test Cases</div>
            </div>
            <div class="metric">
                <h3>Security</h3>
                <div class="value">${this.report.summary.security.vulnerabilities}</div>
                <div class="label">Vulnerabilities</div>
            </div>
            <div class="metric">
                <h3>Performance</h3>
                <div class="value">${this.report.summary.performance.bundleSize}MB</div>
                <div class="label">Bundle Size</div>
            </div>
        </div>

        <div class="section">
            <h2>📊 Test Results Summary</h2>
            <div class="summary">
                <div class="metric">
                    <h3>Passed</h3>
                    <div class="value">${this.report.summary.passedTests}</div>
                    <div class="label">Tests</div>
                </div>
                <div class="metric">
                    <h3>Failed</h3>
                    <div class="value">${this.report.summary.failedTests}</div>
                    <div class="label">Tests</div>
                </div>
                <div class="metric">
                    <h3>Skipped</h3>
                    <div class="value">${this.report.summary.skippedTests}</div>
                    <div class="label">Tests</div>
                </div>
                <div class="metric">
                    <h3>Errors</h3>
                    <div class="value">${this.report.summary.errorTests}</div>
                    <div class="label">Tests</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>📈 Code Coverage Details</h2>
            <div class="summary">
                <div class="metric">
                    <h3>Statements</h3>
                    <div class="value">${this.report.summary.coverage.statements.toFixed(1)}%</div>
                </div>
                <div class="metric">
                    <h3>Branches</h3>
                    <div class="value">${this.report.summary.coverage.branches.toFixed(1)}%</div>
                </div>
                <div class="metric">
                    <h3>Functions</h3>
                    <div class="value">${this.report.summary.coverage.functions.toFixed(1)}%</div>
                </div>
                <div class="metric">
                    <h3>Lines</h3>
                    <div class="value">${this.report.summary.coverage.lines.toFixed(1)}%</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🔒 Security Assessment</h2>
            <p><strong>Severity:</strong> <span class="status ${this.report.summary.security.severity}">${this.report.summary.security.severity}</span></p>
            <p><strong>Total Vulnerabilities:</strong> ${this.report.summary.security.vulnerabilities}</p>
        </div>

        <div class="section">
            <h2>📋 Report Sections</h2>
            <p>This comprehensive report includes:</p>
            <ul>
                <li>✅ Unit test results (frontend & backend)</li>
                <li>✅ Integration test results</li>
                <li>✅ End-to-end test results</li>
                <li>✅ Performance metrics</li>
                <li>✅ Code coverage analysis</li>
                <li>✅ Security vulnerability assessment</li>
                <li>✅ Accessibility compliance check</li>
            </ul>
        </div>

        <div class="section">
            <h2>📄 Raw Data</h2>
            <details>
                <summary>Click to view complete JSON report</summary>
                <pre>${JSON.stringify(this.report, null, 2)}</pre>
            </details>
        </div>
    </div>
</body>
</html>`;

    const htmlPath = path.join(process.cwd(), 'comprehensive-test-report.html');
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`✅ HTML test report saved to: ${htmlPath}`);
  }

  printSummary() {
    console.log('\n🎯 COMPREHENSIVE TEST REPORT SUMMARY');
    console.log('=====================================');

    console.log(`📊 Platform: ${this.report.platform.os} ${this.report.platform.arch}`);
    console.log(`🟢 Node.js: ${this.report.platform.nodeVersion}`);
    console.log(`📦 NPM: ${this.report.platform.npmVersion}`);

    console.log(`\n📈 Test Coverage:`);
    console.log(`   Statements: ${this.report.summary.coverage.statements.toFixed(1)}%`);
    console.log(`   Branches: ${this.report.summary.coverage.branches.toFixed(1)}%`);
    console.log(`   Functions: ${this.report.summary.coverage.functions.toFixed(1)}%`);
    console.log(`   Lines: ${this.report.summary.coverage.lines.toFixed(1)}%`);

    console.log(`\n🧪 Test Results:`);
    console.log(`   Total: ${this.report.summary.totalTests}`);
    console.log(`   ✅ Passed: ${this.report.summary.passedTests}`);
    console.log(`   ❌ Failed: ${this.report.summary.failedTests}`);
    console.log(`   ⚠️ Skipped: ${this.report.summary.skippedTests}`);
    console.log(`   🚨 Errors: ${this.report.summary.errorTests}`);

    console.log(`\n🔒 Security:`);
    console.log(`   Vulnerabilities: ${this.report.summary.security.vulnerabilities}`);
    console.log(`   Severity: ${this.report.summary.security.severity}`);

    console.log(`\n📁 Reports Generated:`);
    console.log(`   • JSON: comprehensive-test-report.json`);
    console.log(`   • HTML: comprehensive-test-report.html`);

    const overallScore = this.calculateOverallScore();
    console.log(`\n🎯 OVERALL QUALITY SCORE: ${overallScore}/100`);

    if (overallScore >= 90) {
      console.log('🎉 Excellent! All systems are performing optimally.');
    } else if (overallScore >= 75) {
      console.log('👍 Good performance with minor areas for improvement.');
    } else if (overallScore >= 50) {
      console.log('⚠️ Moderate performance - several areas need attention.');
    } else {
      console.log('❌ Poor performance - immediate action required.');
    }
  }

  calculateOverallScore() {
    let score = 100;

    // Coverage impact (30% weight)
    const coverageScore = this.report.summary.coverage.lines;
    score -= (100 - coverageScore) * 0.3;

    // Security impact (25% weight)
    if (this.report.summary.security.vulnerabilities > 0) {
      score -= Math.min(this.report.summary.security.vulnerabilities * 5, 25);
    }

    // Test failure impact (20% weight)
    const totalTests = this.report.summary.totalTests;
    if (totalTests > 0) {
      const failureRate =
        (this.report.summary.failedTests + this.report.summary.errorTests) / totalTests;
      score -= failureRate * 20;
    }

    // Performance impact (15% weight)
    if (this.report.summary.performance.bundleSize > 10) {
      score -= 15;
    }

    return Math.max(0, Math.round(score));
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const reportGenerator = new ComprehensiveTestReport();
  reportGenerator.generateReport().catch(console.error);
}

export default ComprehensiveTestReport;

