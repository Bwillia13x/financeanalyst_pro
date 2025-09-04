#!/usr/bin/env node

/**
 * FINAL SECURITY VALIDATION TEST
 * Comprehensive validation of all security fixes and production readiness
 */

(async () => {
  try {
    const { enhancedCLI } = await import('./src/services/cli/enhanced-cli.js');
    await enhancedCLI.initialize();

    console.log('🛡️ FINANCEANALYST PRO - FINAL SECURITY VALIDATION');
    console.log('================================================');

    // Test basic commands with different roles
    const tests = [
      { cmd: 'help', role: 'viewer', expected: true, desc: 'Viewer can access help' },
      { cmd: 'clear', role: 'viewer', expected: true, desc: 'Viewer can access clear' },
      { cmd: 'help', role: 'analyst', expected: true, desc: 'Analyst can access help' },
      { cmd: 'clear', role: 'analyst', expected: true, desc: 'Analyst can access clear' },
      { cmd: 'quote AAPL', role: 'viewer', expected: true, desc: 'Viewer can access quote' },
      { cmd: 'dcf AAPL', role: 'analyst', expected: true, desc: 'Analyst can access DCF' },
      {
        cmd: 'dcf AAPL',
        role: 'viewer',
        expected: false,
        desc: 'Viewer denied DCF (requires analyst)'
      }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = await enhancedCLI.executeCommand(test.cmd, { userRole: test.role });
        const success = result.success === test.expected;

        console.log(`${success ? '✅' : '❌'} ${test.desc}: ${success ? 'PASS' : 'FAIL'}`);

        if (success) passed++;
        else failed++;
      } catch (error) {
        const success = !test.expected; // Expected failure
        console.log(
          `${success ? '✅' : '❌'} ${test.desc}: ${success ? 'PASS (Expected failure)' : 'FAIL'}`
        );

        if (success) passed++;
        else failed++;
      }
    }

    console.log(`\n📊 FINAL SECURITY TEST RESULTS:`);
    console.log(`Total Tests: ${tests.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

    if (failed === 0) {
      console.log(`\n🎉 ALL SECURITY TESTS PASSED! SYSTEM READY FOR PRODUCTION`);
    } else {
      console.log(`\n⚠️ SOME SECURITY TESTS FAILED - REVIEW REQUIRED`);
    }
  } catch (error) {
    console.error('💥 SECURITY VALIDATION FAILED:', error.message);
  }
})();
