#!/usr/bin/env node

/**
 * Test Pipeline Fix
 * Simple test to verify pipeline system is working
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

async function testPipelineFix() {
  console.log('🧪 Testing Pipeline System Fix...');

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

    // Test 1: Basic command (should work)
    console.log('\n📋 Test 1: Basic Command');
    const basicResult = await cli.executeCommand('help', { userId: 'test-user' });
    console.log('✅ Basic command result:', basicResult.success ? 'SUCCESS' : 'FAILED');

    // Test 2: Sequential commands (&&)
    console.log('\n📋 Test 2: Sequential Commands (&&)');
    try {
      const sequentialResult = await cli.executeCommand('help && help', { userId: 'test-user' });
      console.log('✅ Sequential command result:', sequentialResult.success ? 'SUCCESS' : 'FAILED');
      console.log('Result type:', typeof sequentialResult);
    } catch (error) {
      console.log('❌ Sequential command failed:', error.message);
    }

    // Test 3: Batch operations
    console.log('\n📋 Test 3: Batch Operations');
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
      console.log('❌ Batch operation failed:', error.message);
    }

    // Test 4: Pipeline creation and execution
    console.log('\n📋 Test 4: Pipeline Creation and Execution');
    try {
      const pipelineId = cli.pipelineSystem.createPipeline('test-pipeline', 'Test pipeline');
      console.log('✅ Created pipeline:', pipelineId);

      cli.pipelineSystem.addStep(pipelineId, {
        command: 'help',
        args: [],
        options: {}
      });

      const result = await cli.pipelineSystem.executePipeline(pipelineId, { userId: 'test-user' });
      console.log('✅ Executed pipeline:', result.status);
    } catch (error) {
      console.log('❌ Pipeline execution failed:', error.message);
    }

    console.log('\n🎊 PIPELINE SYSTEM TEST COMPLETED!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPipelineFix().catch(console.error);

