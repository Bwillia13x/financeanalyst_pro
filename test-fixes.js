#!/usr/bin/env node

/**
 * Test CLI Fixes
 * Quick test to verify rate limiting and tutorial system fixes
 */

import { EnhancedCLI } from './src/services/cli/enhanced-cli.js';

// Set up global mocks
if (typeof crypto === 'undefined') {
  global.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
  };
}

if (typeof localStorage === 'undefined') {
  const storage = new Map();
  global.localStorage = {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
    clear: () => storage.clear()
  };
}

if (typeof navigator === 'undefined') {
  global.navigator = {
    userAgent: 'Mock Browser/1.0',
    onLine: true,
    hardwareConcurrency: 4,
    deviceMemory: 8
  };
}

if (typeof window === 'undefined') {
  global.window = {
    innerWidth: 1920,
    innerHeight: 1080
  };
}

if (typeof document === 'undefined') {
  global.document = {
    referrer: 'https://financeanalyst-pro.com',
    createElement: () => ({})
  };
}

async function testFixes() {
  console.log('🧪 Testing CLI Fixes...');

  try {
    // Initialize CLI
    const cli = new EnhancedCLI({
      enablePlugins: true,
      enableSecurity: true,
      enableCaching: true,
      enableRealTime: true
    });

    await cli.initialize();
    console.log('✅ CLI initialized');

    // Test 1: Basic command (should work without rate limiting)
    console.log('\n📋 Test 1: Basic Command');
    const basicResult1 = await cli.executeCommand('help', { userId: 'test-user' });
    console.log('✅ First help command result:', basicResult1.success ? 'SUCCESS' : 'FAILED');

    const basicResult2 = await cli.executeCommand('help', { userId: 'test-user' });
    console.log('✅ Second help command result:', basicResult2.success ? 'SUCCESS' : 'FAILED');

    // Test 2: Check tutorial system
    console.log('\n📋 Test 2: Tutorial System');
    const availableTutorials = cli.helpSystem.interactiveTutorials.size;
    console.log('✅ Available tutorials:', availableTutorials);

    if (availableTutorials > 0) {
      const tutorials = Array.from(cli.helpSystem.interactiveTutorials.entries());
      tutorials.forEach(([id, tutorial]) => {
        console.log(`  • ${id}: ${tutorial.title}`);
      });
    }

    // Test 3: Sequential commands (should work now)
    console.log('\n📋 Test 3: Sequential Commands');
    try {
      const sequentialResult = await cli.executeCommand('help && help', { userId: 'test-user' });
      console.log('✅ Sequential command result:', sequentialResult.success ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      console.log('❌ Sequential command error:', error.message);
    }

    // Test 4: Batch operations
    console.log('\n📋 Test 4: Batch Operations');
    try {
      const operations = [
        { command: 'help', args: [], description: 'First help' },
        { command: 'help', args: [], description: 'Second help' }
      ];

      const batchId = await cli.pipelineSystem.createBatchOperation(operations);
      console.log('✅ Created batch operation:', batchId);

      const batch = cli.pipelineSystem.getBatchOperation(batchId);
      console.log('✅ Retrieved batch operation:', batch ? 'SUCCESS' : 'FAILED');

      if (batch) {
        const result = await cli.pipelineSystem.executeBatchOperation(batchId, {
          userId: 'test-user'
        });
        console.log('✅ Executed batch operation:', result.status);
      }
    } catch (error) {
      console.log('❌ Batch operation error:', error.message);
    }

    console.log('\n🎊 CLI FIXES TEST COMPLETED!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFixes().catch(console.error);
