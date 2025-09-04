/**
 * Quick CLI Validation Test
 * Fast validation of CLI permission fixes
 */

console.log('🔧 QUICK CLI VALIDATION TEST');
console.log('===========================');

// Mock browser environment for testing
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

  // Use existing crypto if available, otherwise mock
  if (typeof global.crypto === 'undefined') {
    global.crypto = {
      randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
    };
  }
}

async function quickCLITest() {
  try {
    console.log('🚀 Testing CLI Permission Fixes...');

    // Import and test the security manager directly
    const { SecurityManager } = await import('./src/services/cli/security-manager.js');

    const securityManager = new SecurityManager();
    await securityManager.initialize();

    console.log('✅ Security Manager initialized');

    // Test permission resolution for different commands
    const testCases = [
      { name: 'HELP', expectedPermission: 'system:read' },
      { name: 'CLEAR', expectedPermission: 'system:read' },
      { name: 'HISTORY', expectedPermission: 'system:read' },
      { name: 'QUOTE', expectedPermission: 'market:read' }
    ];

    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
      const requiredPerms = securityManager.getCommandRequiredPermissions({
        name: testCase.name,
        category: testCase.name === 'QUOTE' ? 'market' : 'system'
      });

      const hasPermission = securityManager.hasPermission(
        securityManager.rolePermissions.get('viewer') || [],
        testCase.expectedPermission
      );

      if (requiredPerms.includes(testCase.expectedPermission) && hasPermission) {
        console.log(`✅ ${testCase.name}: Permission check PASSED`);
        passed++;
      } else {
        console.log(`❌ ${testCase.name}: Permission check FAILED`);
        console.log(`   Required: ${testCase.expectedPermission}`);
        console.log(`   User has: ${securityManager.rolePermissions.get('viewer') || []}`);
        failed++;
      }
    }

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
      console.log('🎉 ALL PERMISSION TESTS PASSED!');
      console.log('✅ CLI permission fixes are working correctly');
    } else {
      console.log('⚠️ SOME TESTS FAILED - Permission issues may still exist');
    }

    return { passed, failed, success: failed === 0 };
  } catch (error) {
    console.error('❌ Quick validation failed:', error.message);
    return { passed: 0, failed: 1, success: false, error: error.message };
  }
}

// Run the test
quickCLITest()
  .then(result => {
    console.log('\n🏁 QUICK VALIDATION COMPLETED');
    if (result.success) {
      console.log('✅ CLI PERMISSION FIXES: VERIFIED');
    } else {
      console.log('❌ CLI PERMISSION FIXES: ISSUES DETECTED');
    }
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
  });
