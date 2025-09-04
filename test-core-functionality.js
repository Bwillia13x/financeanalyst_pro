/**
 * CORE FUNCTIONALITY TEST SUITE
 * FinanceAnalyst Pro CLI System - Complete Feature Validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CoreFunctionalityTester {
  constructor() {
    this.results = {
      basicCommands: { tests: [], passed: 0, failed: 0 },
      financialCalculations: { tests: [], passed: 0, failed: 0 },
      marketData: { tests: [], passed: 0, failed: 0 },
      portfolioManagement: { tests: [], passed: 0, failed: 0 },
      reporting: { tests: [], passed: 0, failed: 0 },
      automation: { tests: [], passed: 0, failed: 0 },
      security: { tests: [], passed: 0, failed: 0 },
      plugins: { tests: [], passed: 0, failed: 0 },
      summary: {
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        successRate: 0,
        duration: 0,
        functionalityReady: false
      }
    };

    this.startTime = Date.now();
    this.enhancedCLI = null;

    // Sample data for testing
    this.sampleData = {
      companies: {
        apple: {
          ticker: 'AAPL',
          price: 185.5,
          marketCap: 2950000000000,
          revenue: 394300000000,
          ebitda: 123136000000,
          netIncome: 97000000000,
          sharesOutstanding: 15500000000,
          pe: 28.5,
          eps: 6.25,
          beta: 1.2,
          wacc: 0.085
        },
        microsoft: {
          ticker: 'MSFT',
          price: 415.5,
          marketCap: 3100000000000,
          revenue: 245120000000,
          ebitda: 109787000000,
          netIncome: 88136000000,
          sharesOutstanding: 7450000000,
          pe: 32.1,
          eps: 11.81,
          beta: 0.9,
          wacc: 0.078
        },
        tesla: {
          ticker: 'TSLA',
          price: 248.75,
          marketCap: 792000000000,
          revenue: 96700000000,
          ebitda: 12900000000,
          netIncome: 2500000000,
          sharesOutstanding: 3180000000,
          pe: 65.8,
          eps: 0.78,
          beta: 2.1,
          wacc: 0.112
        }
      },
      portfolio: {
        name: 'Tech Growth Portfolio',
        holdings: [
          { ticker: 'AAPL', shares: 100, price: 185.5, weight: 0.4 },
          { ticker: 'MSFT', shares: 50, price: 415.5, weight: 0.35 },
          { ticker: 'TSLA', shares: 200, price: 248.75, weight: 0.25 }
        ]
      },
      financialProjections: {
        aapl: {
          year1: { revenue: 420000000000, ebitda: 135000000000, capex: 12000000000 },
          year2: { revenue: 445000000000, ebitda: 145000000000, capex: 13000000000 },
          year3: { revenue: 470000000000, ebitda: 155000000000, capex: 14000000000 },
          year4: { revenue: 495000000000, ebitda: 165000000000, capex: 15000000000 },
          year5: { revenue: 520000000000, ebitda: 175000000000, capex: 16000000000 }
        }
      }
    };
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Core Functionality Test Suite...\n');

      const { enhancedCLI } = await import('./src/services/cli/enhanced-cli.js');
      await enhancedCLI.initialize();

      // Disable rate limiting for comprehensive testing
      enhancedCLI.securityManager.config.enableRateLimiting = false;

      this.enhancedCLI = enhancedCLI;

      console.log('✅ System initialized successfully\n');
      return true;
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      return false;
    }
  }

  recordResult(category, testName, success, message, data = null) {
    this.results[category].tests.push({ name: testName, success, message, data });
    if (success) {
      this.results[category].passed++;
    } else {
      this.results[category].failed++;
    }
  }

  async runBasicCommandTests() {
    console.log('📝 Testing Basic CLI Commands...\n');

    const tests = [
      { cmd: 'help', role: 'viewer', expect: 'help content' },
      { cmd: 'clear', role: 'viewer', expect: 'clear screen' },
      { cmd: 'history', role: 'viewer', expect: 'command history' },
      { cmd: 'tutorial', role: 'viewer', expect: 'tutorial content' }
    ];

    for (const test of tests) {
      try {
        const result = await this.enhancedCLI.executeCommand(test.cmd, { userRole: test.role });
        const success = result.success !== false;
        this.recordResult(
          'basicCommands',
          test.cmd,
          success,
          success ? `${test.cmd} executed successfully` : `Failed to execute ${test.cmd}`,
          { response: result.output }
        );
        console.log(`${success ? '✅' : '❌'} ${test.cmd}: ${success ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        this.recordResult('basicCommands', test.cmd, false, error.message);
        console.log(`❌ ${test.cmd}: ${error.message}`);
      }
    }
    console.log('');
  }

  async runFinancialCalculationTests() {
    console.log('💰 Testing Financial Calculations...\n');

    const tests = [
      {
        name: 'DCF Analysis - Apple',
        cmd: `dcf AAPL --revenue 420000000000 --ebitda 135000000000 --capex 12000000000 --wacc 0.085 --growth 0.03 --periods 5`,
        role: 'analyst',
        expect: 'DCF valuation result'
      },
      {
        name: 'Comps Analysis - Tech Sector',
        cmd: `comps AAPL MSFT TSLA --metric pe`,
        role: 'analyst',
        expect: 'Comparative analysis'
      },
      {
        name: 'LBO Analysis - Tesla',
        cmd: `lbo TSLA --equity 5000000000 --debt 10000000000 --interest 0.08 --tax 0.25 --exit 8.0`,
        role: 'analyst',
        expect: 'LBO model result'
      }
    ];

    for (const test of tests) {
      try {
        const result = await this.enhancedCLI.executeCommand(test.cmd, { userRole: test.role });
        const success = result.success !== false;
        this.recordResult(
          'financialCalculations',
          test.name,
          success,
          success ? `${test.name} calculation completed` : `Failed ${test.name}`,
          { command: test.cmd, result: result.output }
        );
        console.log(`${success ? '✅' : '❌'} ${test.name}: ${success ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        this.recordResult('financialCalculations', test.name, false, error.message);
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
    console.log('');
  }

  async runMarketDataTests() {
    console.log('📊 Testing Market Data Functionality...\n');

    const tests = [
      {
        name: 'Quote - Apple',
        cmd: 'quote AAPL',
        role: 'viewer',
        expect: 'Stock quote data'
      },
      {
        name: 'Quote - Microsoft',
        cmd: 'quote MSFT',
        role: 'viewer',
        expect: 'Stock quote data'
      },
      {
        name: 'Chart Data - Apple',
        cmd: 'chart AAPL --period 1M',
        role: 'viewer',
        expect: 'Chart data points'
      },
      {
        name: 'Market News',
        cmd: 'news tech',
        role: 'viewer',
        expect: 'Market news articles'
      }
    ];

    for (const test of tests) {
      try {
        const result = await this.enhancedCLI.executeCommand(test.cmd, { userRole: test.role });
        const success = result.success !== false;
        this.recordResult(
          'marketData',
          test.name,
          success,
          success ? `${test.name} data retrieved` : `Failed to get ${test.name}`,
          { command: test.cmd, result: result.output }
        );
        console.log(`${success ? '✅' : '❌'} ${test.name}: ${success ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        this.recordResult('marketData', test.name, false, error.message);
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
    console.log('');
  }

  async runPortfolioTests() {
    console.log('📁 Testing Portfolio Management...\n');

    const tests = [
      {
        name: 'Portfolio Create',
        cmd: 'portfolio create "Test Portfolio"',
        role: 'analyst',
        expect: 'Portfolio created'
      },
      {
        name: 'Add Holdings',
        cmd: 'portfolio add AAPL 100',
        role: 'analyst',
        expect: 'Holding added'
      },
      {
        name: 'Portfolio List',
        cmd: 'portfolio list',
        role: 'analyst',
        expect: 'Portfolio holdings displayed'
      },
      {
        name: 'Portfolio Analysis',
        cmd: 'portfolio analyze',
        role: 'analyst',
        expect: 'Portfolio metrics calculated'
      },
      {
        name: 'Portfolio Export',
        cmd: 'portfolio export csv',
        role: 'analyst',
        expect: 'Portfolio data exported'
      }
    ];

    for (const test of tests) {
      try {
        const result = await this.enhancedCLI.executeCommand(test.cmd, { userRole: test.role });
        const success = result.success !== false;
        this.recordResult(
          'portfolioManagement',
          test.name,
          success,
          success ? `${test.name} operation completed` : `Failed ${test.name}`,
          { command: test.cmd, result: result.output }
        );
        console.log(`${success ? '✅' : '❌'} ${test.name}: ${success ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        this.recordResult('portfolioManagement', test.name, false, error.message);
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
    console.log('');
  }

  async runReportingTests() {
    console.log('📋 Testing Reporting Functionality...\n');

    const tests = [
      {
        name: 'Generate Report',
        cmd: 'report generate "Monthly Analysis" --format pdf',
        role: 'analyst',
        expect: 'Report generated'
      },
      {
        name: 'Export Data - Excel',
        cmd: 'export excel portfolio',
        role: 'analyst',
        expect: 'Excel export completed'
      },
      {
        name: 'Export Data - CSV',
        cmd: 'export csv holdings',
        role: 'analyst',
        expect: 'CSV export completed'
      },
      {
        name: 'Visualize Data',
        cmd: 'visualize portfolio --type pie',
        role: 'analyst',
        expect: 'Chart generated'
      }
    ];

    for (const test of tests) {
      try {
        const result = await this.enhancedCLI.executeCommand(test.cmd, { userRole: test.role });
        const success = result.success !== false;
        this.recordResult(
          'reporting',
          test.name,
          success,
          success ? `${test.name} completed` : `Failed ${test.name}`,
          { command: test.cmd, result: result.output }
        );
        console.log(`${success ? '✅' : '❌'} ${test.name}: ${success ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        this.recordResult('reporting', test.name, false, error.message);
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
    console.log('');
  }

  async runAutomationTests() {
    console.log('🤖 Testing Automation Features...\n');

    const tests = [
      {
        name: 'Create Pipeline',
        cmd: 'pipeline create "Daily Update" --schedule daily',
        role: 'analyst',
        expect: 'Pipeline created'
      },
      {
        name: 'Batch Commands',
        cmd: 'batch "quote AAPL" "quote MSFT" "quote TSLA"',
        role: 'analyst',
        expect: 'Batch executed'
      },
      {
        name: 'Workflow Execution',
        cmd: 'workflow run "data-collection"',
        role: 'analyst',
        expect: 'Workflow completed'
      },
      {
        name: 'Job Scheduling',
        cmd: 'jobs schedule "market-update" --cron "0 9 * * 1-5"',
        role: 'analyst',
        expect: 'Job scheduled'
      }
    ];

    for (const test of tests) {
      try {
        const context = {
          userRole: test.role,
          userId: `test-user-${test.role}`,
          sessionId: `test-session-${Date.now()}`
        };
        console.log(`🔍 Testing ${test.name} with role: ${test.role}`);
        const result = await this.enhancedCLI.executeCommand(test.cmd, context);
        const success = result.success !== false;
        this.recordResult(
          'automation',
          test.name,
          success,
          success ? `${test.name} completed` : `Failed ${test.name}`,
          { command: test.cmd, result: result.output, context }
        );
        console.log(`${success ? '✅' : '❌'} ${test.name}: ${success ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        this.recordResult('automation', test.name, false, error.message);
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
    console.log('');
  }

  async runSecurityTests() {
    console.log('🔒 Testing Security Features...\n');

    const tests = [
      {
        name: 'Permission Enforcement - Viewer',
        cmd: 'dcf AAPL',
        role: 'viewer',
        expect: 'Access denied',
        shouldFail: true
      },
      {
        name: 'Permission Enforcement - Analyst',
        cmd: 'dcf AAPL',
        role: 'analyst',
        expect: 'Access granted',
        shouldFail: false
      },
      {
        name: 'Input Sanitization - XSS',
        cmd: 'help <script>alert("xss")</script>',
        role: 'viewer',
        expect: 'Input blocked',
        shouldFail: true
      },
      {
        name: 'Input Sanitization - SQL Injection',
        cmd: "quote AAPL'; DROP TABLE users; --",
        role: 'viewer',
        expect: 'Input blocked',
        shouldFail: true
      }
    ];

    for (const test of tests) {
      try {
        const result = await this.enhancedCLI.executeCommand(test.cmd, { userRole: test.role });
        const success = test.shouldFail ? result.success === false : result.success !== false;
        this.recordResult(
          'security',
          test.name,
          success,
          success ? `${test.name} behaved correctly` : `${test.name} security check failed`,
          { command: test.cmd, result: result.output }
        );
        console.log(`${success ? '✅' : '❌'} ${test.name}: ${success ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        const success = test.shouldFail ? true : false;
        this.recordResult(
          'security',
          test.name,
          success,
          success ? `${test.name} correctly blocked` : `${test.name} error handling failed`,
          { command: test.cmd, error: error.message }
        );
        console.log(`${success ? '✅' : '❌'} ${test.name}: ${success ? 'PASSED' : 'FAILED'}`);
      }
    }
    console.log('');
  }

  async runPluginTests() {
    console.log('🔌 Testing Plugin System...\n');

    const tests = [
      {
        name: 'Plugin Discovery',
        check: () => this.enhancedCLI.pluginManager.loadedPlugins.size >= 3,
        expect: 'Multiple plugins loaded'
      },
      {
        name: 'Calculator Plugin',
        cmd: 'dcf AAPL',
        role: 'analyst',
        expect: 'Calculator plugin executed'
      },
      {
        name: 'Market Data Plugin',
        cmd: 'quote AAPL',
        role: 'viewer',
        expect: 'Market data plugin executed'
      },
      {
        name: 'Plugin Method Validation',
        check: () => {
          const calculatorPlugin = this.enhancedCLI.pluginManager.loadedPlugins.get('calculators');
          return calculatorPlugin && typeof calculatorPlugin.instance.dcf === 'function';
        },
        expect: 'Plugin methods accessible'
      }
    ];

    for (const test of tests) {
      try {
        let success = false;
        let message = '';

        if (test.check) {
          success = test.check();
          message = success ? `${test.name} passed` : `${test.name} failed`;
        } else {
          const result = await this.enhancedCLI.executeCommand(test.cmd, { userRole: test.role });
          success = result.success !== false;
          message = success
            ? `${test.name} executed successfully`
            : `Failed to execute ${test.name}`;
        }

        this.recordResult('plugins', test.name, success, message);
        console.log(`${success ? '✅' : '❌'} ${test.name}: ${success ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        this.recordResult('plugins', test.name, false, error.message);
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
    console.log('');
  }

  generateSummary() {
    const categories = [
      'basicCommands',
      'financialCalculations',
      'marketData',
      'portfolioManagement',
      'reporting',
      'automation',
      'security',
      'plugins'
    ];

    this.results.summary.totalTests = categories.reduce(
      (sum, cat) => sum + this.results[cat].tests.length,
      0
    );

    this.results.summary.totalPassed = categories.reduce(
      (sum, cat) => sum + this.results[cat].passed,
      0
    );

    this.results.summary.totalFailed = categories.reduce(
      (sum, cat) => sum + this.results[cat].failed,
      0
    );

    this.results.summary.successRate = (
      (this.results.summary.totalPassed / this.results.summary.totalTests) *
      100
    ).toFixed(2);
    this.results.summary.duration = Date.now() - this.startTime;

    // Determine functionality readiness
    const criticalCategories = ['basicCommands', 'security', 'plugins'];
    const criticalFailureRate =
      criticalCategories.reduce((sum, cat) => {
        const total = this.results[cat].tests.length;
        const failed = this.results[cat].failed;
        return sum + failed / total;
      }, 0) / criticalCategories.length;

    this.results.summary.functionalityReady =
      this.results.summary.successRate >= 70 && criticalFailureRate === 0;
  }

  printFinalReport() {
    console.log('🎯 CORE FUNCTIONALITY TEST RESULTS');
    console.log('='.repeat(60));

    const summary = this.results.summary;

    console.log(`\n🎯 OVERALL RESULTS:`);
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   ✅ Passed: ${summary.totalPassed}`);
    console.log(`   ❌ Failed: ${summary.totalFailed}`);
    console.log(`   📈 Success Rate: ${summary.successRate}%`);
    console.log(`   ⏱️  Duration: ${(summary.duration / 1000).toFixed(2)}s`);

    const categories = [
      'basicCommands',
      'financialCalculations',
      'marketData',
      'portfolioManagement',
      'reporting',
      'automation',
      'security',
      'plugins'
    ];

    console.log(`\n📋 CATEGORY BREAKDOWN:`);
    categories.forEach(category => {
      const cat = this.results[category];
      const rate =
        cat.tests.length > 0 ? ((cat.passed / cat.tests.length) * 100).toFixed(1) : '0.0';
      const categoryName = category
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
      console.log(`   ${categoryName}: ${cat.passed}/${cat.tests.length} (${rate}%)`);
    });

    console.log(`\n🏆 FUNCTIONALITY READINESS VERDICT:`);

    if (summary.functionalityReady) {
      console.log('   🎉 ALL CORE FEATURES OPERATIONAL');
      console.log('   ✅ Critical functionality validated');
      console.log('   ✅ Enterprise features working');
      console.log('   ✅ Security systems active');
      console.log('   ✅ Plugin architecture functional');
    } else {
      console.log('   ⚠️  CORE FEATURES NEED ATTENTION');
      console.log('   ❌ Critical functionality issues');
      if (summary.successRate < 70) {
        console.log('   ❌ Overall success rate too low');
      }

      const criticalCategories = ['basicCommands', 'security', 'plugins'];
      criticalCategories.forEach(category => {
        const cat = this.results[category];
        const rate = cat.tests.length > 0 ? cat.failed / cat.tests.length : 0;
        if (rate > 0) {
          console.log(`   ❌ ${category} has failures`);
        }
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏁 CORE FUNCTIONALITY TESTING COMPLETE');
    console.log('='.repeat(60) + '\n');

    // Detailed test results
    console.log('📋 DETAILED TEST RESULTS:\n');

    categories.forEach(category => {
      if (this.results[category].tests.length > 0) {
        const categoryName = category
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());
        console.log(`🔹 ${categoryName}:`);
        this.results[category].tests.forEach(test => {
          console.log(`   ${test.success ? '✅' : '❌'} ${test.name}: ${test.message}`);
        });
        console.log('');
      }
    });
  }

  async runAllTests() {
    console.log('🎯 STARTING COMPREHENSIVE CORE FUNCTIONALITY TESTING\n');
    console.log('='.repeat(60) + '\n');

    // Run all test suites
    await this.runBasicCommandTests();
    await this.runFinancialCalculationTests();
    await this.runMarketDataTests();
    await this.runPortfolioTests();
    await this.runReportingTests();
    await this.runAutomationTests();
    await this.runSecurityTests();
    await this.runPluginTests();

    // Generate final summary
    this.generateSummary();

    // Print final results
    this.printFinalReport();
  }
}

// Run the comprehensive functionality tests
(async () => {
  const tester = new CoreFunctionalityTester();

  if (await tester.initialize()) {
    await tester.runAllTests();
  } else {
    console.log('❌ Failed to initialize core functionality tester');
  }
})();
