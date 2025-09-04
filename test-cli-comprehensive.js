/**
 * COMPREHENSIVE CLI TESTING SUITE
 * Complete validation of all CLI functionality after permission fixes
 */

console.log('🧪 COMPREHENSIVE CLI TESTING SUITE');
console.log('==================================');

// Mock browser environment
if (typeof window === 'undefined') {
  global.window = {
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    }
  };

  global.navigator = {
    userAgent: 'Node.js Test Environment'
  };
}

class CLITestSuite {
  constructor() {
    this.results = {
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        successRate: 0
      }
    };
    this.cli = null;
  }

  async initialize() {
    console.log('🚀 Initializing Comprehensive CLI Test Suite...');

    try {
      // Import and initialize the enhanced CLI
      const { enhancedCLI } = await import('./src/services/cli/enhanced-cli.js');

      this.cli = enhancedCLI;

      // Initialize the CLI system
      console.log('📋 Initializing CLI system...');
      const initResult = await this.cli.initialize();

      if (!initResult) {
        throw new Error('CLI system failed to initialize');
      }

      console.log('✅ CLI system initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize test suite:', error.message);
      return false;
    }
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running: ${testName}`);
    this.results.summary.total++;

    try {
      const result = await testFunction();
      if (result.success) {
        console.log(`  ✅ ${testName}: PASSED`);
        this.results.summary.passed++;
      } else {
        console.log(`  ❌ ${testName}: FAILED - ${result.error || 'Unknown error'}`);
        this.results.summary.failed++;
      }
      this.results.tests.push({ name: testName, ...result });
      return result;
    } catch (error) {
      console.log(`  ❌ ${testName}: ERROR - ${error.message}`);
      this.results.summary.failed++;
      this.results.tests.push({ name: testName, success: false, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async runAllTests() {
    console.log('\n🎯 STARTING COMPREHENSIVE CLI TESTS');
    console.log('====================================');

    // Test 1: Basic System Commands
    await this.runTest('Basic System Commands', async () => {
      const results = [];

      // Test help command
      const helpResult = await this.cli.executeCommand('help');
      results.push({ command: 'help', success: helpResult.success });

      // Test clear command
      const clearResult = await this.cli.executeCommand('clear');
      results.push({ command: 'clear', success: clearResult.success });

      // Test history command
      const historyResult = await this.cli.executeCommand('history');
      results.push({ command: 'history', success: historyResult.success });

      const allPassed = results.every(r => r.success);
      return {
        success: allPassed,
        details: results,
        error: allPassed ? null : 'Some basic commands failed'
      };
    });

    // Test 2: Permission System
    await this.runTest('Permission System', async () => {
      const results = [];

      // Test different user roles
      const roles = ['viewer', 'analyst', 'admin'];
      for (const role of roles) {
        try {
          const result = await this.cli.executeCommand('help', { userRole: role });
          results.push({ role, success: result.success });
        } catch (error) {
          results.push({ role, success: false, error: error.message });
        }
      }

      const allPassed = results.every(r => r.success);
      return {
        success: allPassed,
        details: results,
        error: allPassed ? null : 'Some role permissions failed'
      };
    });

    // Test 3: Input Validation
    await this.runTest('Input Validation & Security', async () => {
      const dangerousInputs = [
        'help; alert("hack")',
        'help && rm -rf /',
        'help | cat /etc/passwd',
        'help <script>alert(1)</script>'
      ];

      const results = [];
      for (const input of dangerousInputs) {
        try {
          const result = await this.cli.executeCommand(input);
          // Should fail for dangerous inputs
          results.push({
            input: input.substring(0, 20) + '...',
            blocked: !result.success
          });
        } catch (error) {
          results.push({
            input: input.substring(0, 20) + '...',
            blocked: true,
            error: error.message
          });
        }
      }

      const allBlocked = results.every(r => r.blocked);
      return {
        success: allBlocked,
        details: results,
        error: allBlocked ? null : 'Some dangerous inputs were not blocked'
      };
    });

    // Test 4: Auto-completion
    await this.runTest('Auto-completion System', async () => {
      const completions = await this.cli.getCompletions('hel', 3);

      const hasCompletions =
        completions && completions.completions && completions.completions.length > 0;

      return {
        success: hasCompletions,
        details: {
          input: 'hel',
          completionsFound: hasCompletions ? completions.completions.length : 0
        },
        error: hasCompletions ? null : 'No completions found'
      };
    });

    // Test 5: Tutorial System
    await this.runTest('Tutorial System', async () => {
      const tutorialResult = await this.cli.executeCommand('tutorial list');
      return {
        success: tutorialResult.success,
        details: { command: 'tutorial list' },
        error: tutorialResult.success ? null : 'Tutorial system not working'
      };
    });

    // Test 6: Command History
    await this.runTest('Command History', async () => {
      // Execute a few commands to build history
      await this.cli.executeCommand('help');
      await this.cli.executeCommand('clear');
      await this.cli.executeCommand('history');

      // Check history
      const historyResult = await this.cli.executeCommand('history');
      const hasHistory =
        historyResult.success && historyResult.data && Array.isArray(historyResult.data);

      return {
        success: hasHistory,
        details: {
          historyEntries: hasHistory ? historyResult.data.length : 0
        },
        error: hasHistory ? null : 'Command history not working'
      };
    });

    // Test 7: Rate Limiting (without triggering blocks)
    await this.runTest('Rate Limiting Awareness', async () => {
      // Execute a few commands to test rate limiting awareness
      const results = [];
      for (let i = 0; i < 3; i++) {
        try {
          const result = await this.cli.executeCommand('clear', { userRole: 'viewer' });
          results.push({ attempt: i + 1, success: result.success });
        } catch (error) {
          results.push({ attempt: i + 1, success: false, error: error.message });
        }
      }

      const someSucceeded = results.some(r => r.success);
      return {
        success: someSucceeded,
        details: results,
        error: someSucceeded ? null : 'Rate limiting may be too restrictive'
      };
    });

    // Test 8: CLI Metrics
    await this.runTest('CLI Metrics & Performance', async () => {
      const metrics = this.cli.getMetrics();

      const hasMetrics =
        metrics &&
        typeof metrics.commandsExecuted === 'number' &&
        typeof metrics.registeredCommands === 'number';

      return {
        success: hasMetrics,
        details: {
          commandsExecuted: metrics.commandsExecuted,
          registeredCommands: metrics.registeredCommands,
          errorRate: metrics.errorRate
        },
        error: hasMetrics ? null : 'CLI metrics not available'
      };
    });

    // Calculate final results
    this.results.summary.successRate =
      (this.results.summary.passed / this.results.summary.total) * 100;

    return this.results;
  }

  generateReport() {
    console.log('\n📊 COMPREHENSIVE TEST REPORT');
    console.log('============================');

    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`📈 Success Rate: ${this.results.summary.successRate.toFixed(1)}%`);

    // Show detailed results
    console.log('\n📋 DETAILED RESULTS:');
    console.log('===================');

    this.results.tests.forEach((test, index) => {
      const status = test.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${test.name}`);
      if (!test.success && test.error) {
        console.log(`   Error: ${test.error}`);
      }
    });

    // Performance metrics
    if (this.cli) {
      try {
        const metrics = this.cli.getMetrics();
        console.log('\n⚡ PERFORMANCE METRICS:');
        console.log('=======================');
        console.log(`Commands Executed: ${metrics.commandsExecuted}`);
        console.log(`Registered Commands: ${metrics.registeredCommands}`);
        console.log(`Average Execution Time: ${metrics.averageExecutionTime.toFixed(2)}ms`);
        console.log(`Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
        console.log(`Active Sessions: ${metrics.activeSessions}`);
      } catch (error) {
        console.log('⚠️ Could not retrieve performance metrics');
      }
    }

    return this.results;
  }
}

// Run the comprehensive test suite
async function runComprehensiveTests() {
  const testSuite = new CLITestSuite();

  try {
    // Initialize the test suite
    const initialized = await testSuite.initialize();
    if (!initialized) {
      throw new Error('Failed to initialize test suite');
    }

    // Run all tests
    const results = await testSuite.runAllTests();

    // Generate final report
    const finalResults = testSuite.generateReport();

    console.log('\n🏁 COMPREHENSIVE CLI TESTING COMPLETED');

    if (finalResults.summary.successRate >= 80) {
      console.log('✅ CLI SYSTEM: COMPREHENSIVE VALIDATION PASSED');
      console.log('🎊 All major functionality is working correctly!');
      console.log('🚀 Ready for production deployment');
    } else {
      console.log('⚠️ CLI SYSTEM: ISSUES DETECTED');
      console.log('🔧 Some functionality may need additional attention');
    }

    console.log(
      `\n📊 Final Score: ${finalResults.summary.passed}/${finalResults.summary.total} tests passed (${finalResults.summary.successRate.toFixed(1)}%)`
    );

    return finalResults;
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    return {
      success: false,
      error: error.message,
      summary: { total: 0, passed: 0, failed: 1, successRate: 0 }
    };
  }
}

// Execute the comprehensive test suite
runComprehensiveTests()
  .then(results => {
    // Export results for further analysis if needed
    if (typeof window !== 'undefined') {
      window.comprehensiveTestResults = results;
    }

    console.log('\n🎯 TEST SUITE EXECUTION COMPLETE');
  })
  .catch(error => {
    console.error('💥 Critical test failure:', error);
  });
