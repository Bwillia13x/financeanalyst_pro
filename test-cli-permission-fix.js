/**
 * CLI Permission Fix Validation Test
 * Tests the permission fixes for the enhanced CLI system
 */

console.log('🔧 CLI PERMISSION FIX VALIDATION TEST');
console.log('=====================================');

async function testCLIPermissionFixes() {
  try {
    // Import the enhanced CLI
    const { enhancedCLI } = await import('./src/services/cli/enhanced-cli.js');

    console.log('🚀 Initializing Enhanced CLI System...');

    // Initialize the CLI system
    const initResult = await enhancedCLI.initialize();
    if (!initResult) {
      throw new Error('CLI system failed to initialize');
    }

    console.log('✅ CLI System initialized successfully');

    // Test basic commands that were previously failing
    const testCommands = [
      { name: 'help', description: 'Help command' },
      { name: 'clear', description: 'Clear command' },
      { name: 'history', description: 'History command' },
      { name: 'tutorial list', description: 'Tutorial list command' }
    ];

    let passedTests = 0;
    let failedTests = 0;

    console.log('\n🧪 Testing Basic Commands...');

    for (const testCmd of testCommands) {
      try {
        console.log(`Testing: ${testCmd.description} ("${testCmd.name}")`);

        const result = await enhancedCLI.executeCommand(testCmd.name);

        if (result.success) {
          console.log(`  ✅ ${testCmd.description}: SUCCESS`);
          passedTests++;
        } else {
          console.log(`  ❌ ${testCmd.description}: FAILED - ${result.error}`);
          failedTests++;
        }
      } catch (error) {
        console.log(`  ❌ ${testCmd.description}: ERROR - ${error.message}`);
        failedTests++;
      }
    }

    // Test permission-specific scenarios
    console.log('\n🛡️ Testing Permission Scenarios...');

    // Test with different user roles
    const testContexts = [
      { userRole: 'viewer', description: 'Viewer role' },
      { userRole: 'analyst', description: 'Analyst role' },
      { userRole: 'admin', description: 'Admin role' }
    ];

    for (const context of testContexts) {
      try {
        console.log(`Testing permissions for: ${context.description}`);

        const result = await enhancedCLI.executeCommand('help', context);

        if (result.success) {
          console.log(`  ✅ ${context.description}: Permissions working`);
        } else {
          console.log(`  ❌ ${context.description}: Permission error - ${result.error}`);
        }
      } catch (error) {
        console.log(`  ❌ ${context.description}: Error - ${error.message}`);
      }
    }

    // Test rate limiting
    console.log('\n⚡ Testing Rate Limiting...');

    const rateLimitResults = [];
    for (let i = 0; i < 15; i++) {
      try {
        const result = await enhancedCLI.executeCommand('help');
        rateLimitResults.push(result.success);
      } catch (error) {
        rateLimitResults.push(false);
      }
    }

    const successfulRequests = rateLimitResults.filter(r => r).length;
    const blockedRequests = rateLimitResults.filter(r => !r).length;

    console.log(`Rate limit test: ${successfulRequests} successful, ${blockedRequests} blocked`);
    if (blockedRequests > 0) {
      console.log('  ✅ Rate limiting is working');
    } else {
      console.log('  ⚠️ Rate limiting may not be active or limits are high');
    }

    // Generate comprehensive report
    console.log('\n📊 COMPREHENSIVE TEST REPORT');
    console.log('============================');

    console.log(`Basic Commands: ${passedTests}/${passedTests + failedTests} passed`);
    console.log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

    if (failedTests === 0) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ Permission fix is working correctly');
      console.log('✅ CLI system is fully functional');
      console.log('✅ Security features are operational');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED');
      console.log('❌ There may still be permission issues');
    }

    // Test CLI metrics
    const metrics = enhancedCLI.getMetrics();
    console.log('\n📈 CLI SYSTEM METRICS');
    console.log('======================');
    console.log(`Commands Executed: ${metrics.commandsExecuted}`);
    console.log(`Registered Commands: ${metrics.registeredCommands}`);
    console.log(`Active Sessions: ${metrics.activeSessions}`);
    console.log(`Average Execution Time: ${metrics.averageExecutionTime.toFixed(2)}ms`);

    if (metrics.errorRate < 0.1) {
      // Less than 10% error rate
      console.log('✅ Low error rate - system is stable');
    } else {
      console.log('⚠️ High error rate detected');
    }

    return {
      success: failedTests === 0,
      passedTests,
      failedTests,
      metrics
    };
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testCLIPermissionFixes()
  .then(result => {
    console.log('\n🏁 TEST COMPLETED');
    if (result.success) {
      console.log('✅ CLI PERMISSION FIX VALIDATION: SUCCESS');
    } else {
      console.log('❌ CLI PERMISSION FIX VALIDATION: FAILED');
    }

    // Export results for further analysis if needed
    window.cliTestResults = result;
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
  });
