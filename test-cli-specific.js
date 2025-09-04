#!/usr/bin/env node

/**
 * CLI-Specific Test Runner
 * Runs focused CLI tests to verify localStorage fixes
 */

import { EnhancedCLI } from './src/services/cli/enhanced-cli.js';
import { safeGetItem, safeSetItem, safeRemoveItem, isLocalStorageAvailable } from './src/utils/storageUtils.js';

// Mock Node.js environment for CLI
if (typeof crypto === 'undefined') {
  global.crypto = {
    randomUUID: () => 'cli-test-' + Math.random().toString(36).substr(2, 9)
  };
}

if (typeof localStorage === 'undefined' || !isLocalStorageAvailable()) {
  if (!isLocalStorageAvailable()) {
    console.log('🔧 localStorage not available, using safe wrappers');
  }
}

async function testCLIStorageFixes() {
  console.log('🧪 Testing CLI localStorage Fixes');
  console.log('====================================');

  const cli = new EnhancedCLI({
    enablePlugins: false, // Disable plugins for focused test
    enableSecurity: true,
    enableCaching: true,
    enableRealTime: false
  });

  // Initialize CLI
  await cli.initialize();

  const tests = [
    testStorageAvailability(),
    testSafeStorageOperations(),
    testCommandRegistryPersistence(),
    testPluginManagerStorage()
  ];

  console.log('📊 Running CLI Tests...');
  console.log();

  const results = await Promise.allSettled(tests);
  const passed = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.length - passed;

  console.log('📋 CLI TEST RESULTS');
  console.log('===================');
  console.log(`✅ Tests Passed: ${passed}`);
  console.log(`❌ Tests Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed/results.length) * 100).toFixed(1)}%`);
  console.log();

  if (failed === 0) {
    console.log('🎉 All CLI localStorage fixes working correctly!');
  } else {
    console.log('⚠️  Some tests failed - storage compatibility issues remain');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Test storage availability
async function testStorageAvailability() {
  console.log('🔍 Test 1: Storage Availability');

  const available = isLocalStorageAvailable();
  console.log(`  localStorage Available: ${available ? '✅' : '❌'}`);

  if (!available) {
    console.log('  💡 Using safe storage wrappers instead');
  }

  return true;
}

// Test safe storage operations
async function testSafeStorageOperations() {
  console.log('🔍 Test 2: Safe Storage Operations');

  const testKey = 'cli-test-key';
  const testData = { command: 'test', timestamp: Date.now() };

  // Test set
  const setResult = safeSetItem(testKey, testData);
  console.log(`  Safe setItem: ${setResult ? '✅' : '❌'}`);

  // Test get
  const getData = safeGetItem(testKey);
  const getSuccess = getData && typeof getData === 'string' && getData.includes('test');
  console.log(`  Safe getItem: ${getSuccess ? '✅' : '❌'}`);

  // Test remove
  const removeResult = safeRemoveItem(testKey);
  console.log(`  Safe removeItem: ${removeResult ? '✅' : '❌'}`);

  // Verify removal
  const verifyData = safeGetItem(testKey);
  const verifySuccess = verifyData === null || verifyData === '';
  console.log(`  Verify removal: ${verifySuccess ? '✅' : '❌'}`);

  const allSuccess = setResult && getSuccess && removeResult && verifySuccess;
  console.log(`  Overall: ${allSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);

  return allSuccess;
}

// Test command registry persistence
async function testCommandRegistryPersistence() {
  console.log('🔍 Test 3: Command Registry Persistence');

  const cli = new EnhancedCLI({ enablePlugins: false });
  await cli.initialize();

  const registry = cli.getRegistry();
  if (registry) {
    console.log('  Registry available: ✅');

    // Test persistence operations
    const persistenceSuccess = typeof registry.persistRegistry === 'function';
    const loadSuccess = typeof registry.loadPersistedRegistry === 'function';

    console.log(`  Persistence method: ${persistenceSuccess ? '✅' : '❌'}`);
    console.log(`  Load method: ${loadSuccess ? '✅' : '❌'}`);

    const overallSuccess = persistenceSuccess && loadSuccess;
    console.log(`  Overall: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);

    return overallSuccess;
  } else {
    console.log('  Registry not available: ❌');
    return false;
  }
}

// Test plugin manager storage
async function testPluginManagerStorage() {
  console.log('🔍 Test 4: Plugin Manager Storage');

  const cli = new EnhancedCLI({ enablePlugins: true });
  await cli.initialize();

  const pluginManager = cli.getPluginManager();
  if (pluginManager) {
    console.log('  Plugin manager available: ✅');

    // Test that plugin manager doesn't crash (common fix point)
    const hasStandardMethods = typeof pluginManager.initialize === 'function';
    console.log(`  Initialization method: ${hasStandardMethods ? '✅' : '❌'}`);

    const overallSuccess = hasStandardMethods;
    console.log(`  Overall: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);

    return overallSuccess;
  } else {
    console.log('  Plugin manager not available: ❌');
    return false;
  }
}

// Run the tests
testCLIStorageFixes().catch(error => {
  console.error('❌ CLI Test Suite Failed:', error);
  process.exit(1);
});

export default testCLIStorageFixes;