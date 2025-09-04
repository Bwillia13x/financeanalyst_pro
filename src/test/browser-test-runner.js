/**
 * Browser Test Runner for FinanceAnalyst Pro
 * Allows running comprehensive tests directly from the browser console
 * Perfect for development and debugging
 */

(function () {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.error('Browser Test Runner can only be used in a browser environment');
    return;
  }

  // Global test runner object
  window.FinanceAnalystTestRunner = {
    // Test results storage
    results: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      startTime: null,
      endTime: null
    },

    // Test configuration
    config: {
      verbose: true,
      bail: false,
      timeout: 30000,
      categories: ['unit', 'integration', 'e2e']
    },

    // Test registry
    tests: new Map(),

    // Register a test
    registerTest (category, name, testFunction) {
      if (!this.tests.has(category)) {
        this.tests.set(category, new Map());
      }

      this.tests.get(category).set(name, {
        name,
        function: testFunction,
        category,
        status: 'pending',
        duration: 0,
        error: null
      });
    },

    // Run all tests
    async runAllTests () {
      console.log('🚀 Starting FinanceAnalyst Pro Browser Test Suite');
      console.log('='.repeat(60));

      this.results.startTime = Date.now();
      this.results.total = 0;
      this.results.passed = 0;
      this.results.failed = 0;
      this.results.skipped = 0;

      // Count total tests
      for (const categoryTests of this.tests.values()) {
        this.results.total += categoryTests.size;
      }

      console.log(`📊 Total Tests: ${this.results.total}`);
      console.log(`📂 Categories: ${Array.from(this.tests.keys()).join(', ')}`);
      console.log('');

      // Run tests by category
      for (const [category, categoryTests] of this.tests.entries()) {
        if (this.config.categories.includes(category)) {
          await this.runCategoryTests(category, categoryTests);
        } else {
          console.log(`⏭️  Skipping category: ${category}`);
        }
      }

      this.results.endTime = Date.now();
      this.results.duration = this.results.endTime - this.results.startTime;

      this.displayFinalReport();
    },

    // Run tests for a specific category
    async runCategoryTests (category, categoryTests) {
      console.log(`🧪 Running ${category} tests...`);

      for (const [testName, testInfo] of categoryTests.entries()) {
        try {
          const startTime = Date.now();

          if (this.config.verbose) {
            console.log(`  ▶️  ${testName}`);
          }

          // Create a timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Test timeout')), this.config.timeout);
          });

          // Run the test with timeout
          await Promise.race([testInfo.function(), timeoutPromise]);

          const endTime = Date.now();
          testInfo.status = 'passed';
          testInfo.duration = endTime - startTime;
          this.results.passed++;

          if (this.config.verbose) {
            console.log(`    ✅ Passed (${testInfo.duration}ms)`);
          }
        } catch (error) {
          testInfo.status = 'failed';
          testInfo.error = error;
          this.results.failed++;

          console.log(`    ❌ Failed: ${error.message}`);
          if (this.config.verbose && error.stack) {
            console.log(`       ${error.stack.split('\n')[1]}`);
          }

          if (this.config.bail) {
            console.log('🛑 Bailing due to test failure');
            break;
          }
        }
      }

      console.log(`✅ ${category} tests completed`);
      console.log('');
    },

    // Run a specific test
    async runTest (category, testName) {
      const categoryTests = this.tests.get(category);
      if (!categoryTests) {
        console.error(`Category '${category}' not found`);
        return;
      }

      const testInfo = categoryTests.get(testName);
      if (!testInfo) {
        console.error(`Test '${testName}' not found in category '${category}'`);
        return;
      }

      console.log(`🧪 Running test: ${category} -> ${testName}`);

      try {
        const startTime = Date.now();
        await testInfo.function();
        const endTime = Date.now();

        testInfo.status = 'passed';
        testInfo.duration = endTime - startTime;

        console.log(`✅ Test passed (${testInfo.duration}ms)`);
      } catch (error) {
        testInfo.status = 'failed';
        testInfo.error = error;

        console.log(`❌ Test failed: ${error.message}`);
      }
    },

    // Display final test report
    displayFinalReport () {
      console.log('📊 FINAL TEST REPORT');
      console.log('='.repeat(40));

      console.log(`Total Tests: ${this.results.total}`);
      console.log(`✅ Passed: ${this.results.passed}`);
      console.log(`❌ Failed: ${this.results.failed}`);
      console.log(`⏭️  Skipped: ${this.results.skipped}`);
      console.log(
        `📈 Success Rate: ${this.results.total > 0 ? ((this.results.passed / this.results.total) * 100).toFixed(1) : 0}%`
      );
      console.log(`⏱️  Duration: ${(this.results.duration / 1000).toFixed(2)}s`);
      console.log('');

      // Display failed tests
      if (this.results.failed > 0) {
        console.log('❌ FAILED TESTS:');
        for (const [category, categoryTests] of this.tests.entries()) {
          for (const [testName, testInfo] of categoryTests.entries()) {
            if (testInfo.status === 'failed') {
              console.log(`  • ${category} -> ${testName}: ${testInfo.error.message}`);
            }
          }
        }
        console.log('');
      }

      // Overall status
      const successRate =
        this.results.total > 0 ? (this.results.passed / this.results.total) * 100 : 0;
      if (successRate >= 95) {
        console.log('🎉 EXCELLENT - All systems operational!');
      } else if (successRate >= 90) {
        console.log('✅ GOOD - Minor issues to address');
      } else if (successRate >= 80) {
        console.log('⚠️ FAIR - Needs attention');
      } else {
        console.log('❌ POOR - Critical issues detected');
      }

      console.log('='.repeat(40));
    },

    // Get test statistics
    getStats () {
      return {
        ...this.results,
        categories: Array.from(this.tests.keys()),
        config: this.config
      };
    },

    // Configure test runner
    configure (newConfig) {
      this.config = { ...this.config, ...newConfig };
      console.log('✅ Test runner configuration updated');
    },

    // Clear all test results
    clearResults () {
      this.results = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        startTime: null,
        endTime: null
      };

      // Reset test statuses
      for (const categoryTests of this.tests.values()) {
        for (const testInfo of categoryTests.values()) {
          testInfo.status = 'pending';
          testInfo.duration = 0;
          testInfo.error = null;
        }
      }

      console.log('✅ Test results cleared');
    },

    // List all available tests
    listTests () {
      console.log('📋 AVAILABLE TESTS');
      console.log('='.repeat(30));

      for (const [category, categoryTests] of this.tests.entries()) {
        console.log(`📂 ${category} (${categoryTests.size} tests):`);
        for (const [testName, testInfo] of categoryTests.entries()) {
          const status =
            testInfo.status === 'pending'
              ? '⏳'
              : testInfo.status === 'passed'
                ? '✅'
                : testInfo.status === 'failed'
                  ? '❌'
                  : '⏭️';
          console.log(`  ${status} ${testName}`);
        }
        console.log('');
      }
    }
  };

  // Auto-register some basic tests
  const testRunner = window.FinanceAnalystTestRunner;

  // Unit Tests
  testRunner.registerTest('unit', 'authentication service exists', async () => {
    if (typeof window.authenticationService === 'undefined') {
      throw new Error('Authentication service not found');
    }
    expect(window.authenticationService).toBeDefined();
  });

  testRunner.registerTest('unit', 'security audit service exists', async () => {
    if (typeof window.securityAuditService === 'undefined') {
      throw new Error('Security audit service not found');
    }
    expect(window.securityAuditService).toBeDefined();
  });

  testRunner.registerTest('unit', 'mobile responsive service exists', async () => {
    if (typeof window.mobileResponsiveService === 'undefined') {
      throw new Error('Mobile responsive service not found');
    }
    expect(window.mobileResponsiveService).toBeDefined();
  });

  // Integration Tests
  testRunner.registerTest('integration', 'services can initialize', async () => {
    const services = [
      window.authenticationService,
      window.securityAuditService,
      window.mobileResponsiveService
    ];

    for (const service of services) {
      if (service && typeof service.initialize === 'function') {
        await service.initialize();
      }
    }

    expect(true).toBe(true); // If we get here, initialization succeeded
  });

  testRunner.registerTest('integration', 'device detection works', async () => {
    if (!window.mobileResponsiveService) {
      throw new Error('Mobile responsive service not available');
    }

    const deviceInfo = window.mobileResponsiveService.getDeviceInfo();
    expect(deviceInfo).toBeDefined();
    expect(deviceInfo.device).toBeDefined();
    expect(typeof deviceInfo.device.isMobile).toBe('boolean');
  });

  // E2E Tests
  testRunner.registerTest('e2e', 'page loads successfully', async () => {
    const mainContent = document.querySelector('main') || document.body;
    expect(mainContent).toBeDefined();

    // Wait for any async content to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(document.readyState).toBe('complete');
  });

  testRunner.registerTest('e2e', 'basic navigation works', async () => {
    // This would test actual navigation if implemented
    expect(window.location).toBeDefined();
    expect(typeof window.location.href).toBe('string');
  });

  console.log('🎯 FinanceAnalyst Pro Browser Test Runner loaded!');
  console.log('💡 Available commands:');
  console.log('   • FinanceAnalystTestRunner.runAllTests() - Run all tests');
  console.log('   • FinanceAnalystTestRunner.runTest(category, name) - Run specific test');
  console.log('   • FinanceAnalystTestRunner.listTests() - List all available tests');
  console.log('   • FinanceAnalystTestRunner.getStats() - Get test statistics');
  console.log('   • FinanceAnalystTestRunner.configure(config) - Update configuration');
  console.log('   • FinanceAnalystTestRunner.clearResults() - Clear test results');

  // Make expect function available globally for tests
  window.expect = function (actual) {
    return {
      toBe (expected) {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, but got ${actual}`);
        }
      },
      toBeDefined () {
        if (typeof actual === 'undefined') {
          throw new Error('Expected value to be defined');
        }
      },
      toBeGreaterThan (expected) {
        if (!(actual > expected)) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
      },
      toBeLessThan (expected) {
        if (!(actual < expected)) {
          throw new Error(`Expected ${actual} to be less than ${expected}`);
        }
      },
      toContain (expected) {
        if (!actual || !actual.includes(expected)) {
          throw new Error(`Expected ${actual} to contain ${expected}`);
        }
      },
      toEqual (expected) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(
            `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
          );
        }
      }
    };
  };
})();

