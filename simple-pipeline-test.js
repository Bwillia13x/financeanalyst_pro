#!/usr/bin/env node

/**
 * Simple Pipeline Test
 * Test just the pipeline parsing and basic functionality
 */

import { CommandPipeline } from './src/services/cli/command-pipeline.js';

// Mock CLI
const mockCLI = {
  executeCommand: async (input, context) => {
    console.log(`Mock executing: ${input}`);
    return { success: true, data: `Result of ${input}` };
  }
};

async function testPipelineParsing() {
  console.log('🧪 Testing Pipeline Parsing...');

  const pipeline = new CommandPipeline(mockCLI);

  // Test 1: Parse single command
  console.log('\n📋 Test 1: Single Command');
  const singleCmd = pipeline.parseCommandString('help');
  console.log('Parsed single command:', singleCmd);
  console.log('Steps:', singleCmd.steps.length);

  // Test 2: Parse sequential commands
  console.log('\n📋 Test 2: Sequential Commands (&&)');
  const sequentialCmd = pipeline.parseCommandString('help && help');
  console.log('Parsed sequential commands:', sequentialCmd);
  console.log('Steps:', sequentialCmd.steps.length);
  console.log('Operators:', sequentialCmd.operators);

  // Test 3: Parse command with arguments
  console.log('\n📋 Test 3: Command with Arguments');
  const argsCmd = pipeline.parseCommandString('quote AAPL --detailed');
  console.log('Parsed command with args:', argsCmd);
  console.log('Steps:', argsCmd.steps.length);
  if (argsCmd.steps[0]) {
    console.log('Command:', argsCmd.steps[0].command);
    console.log('Args:', argsCmd.steps[0].args);
    console.log('Options:', argsCmd.steps[0].options);
  }

  // Test 4: Create and execute batch operation
  console.log('\n📋 Test 4: Batch Operation');
  const operations = [
    { command: 'help', args: [], description: 'First help' },
    { command: 'help', args: [], description: 'Second help' }
  ];

  const batchId = await pipeline.createBatchOperation(operations);
  console.log('Created batch operation:', batchId);

  const batch = pipeline.getBatchOperation(batchId);
  console.log('Retrieved batch operation:', batch ? 'SUCCESS' : 'FAILED');
  if (batch) {
    console.log('Batch pipelines:', batch.pipelines);
  }

  // Test 5: Create and execute pipeline
  console.log('\n📋 Test 5: Pipeline Creation');
  const pipelineId = pipeline.createPipeline('test-pipeline', 'Test pipeline');
  console.log('Created pipeline:', pipelineId);

  pipeline.addStep(pipelineId, {
    command: 'help',
    args: [],
    options: {}
  });

  console.log('Added step to pipeline');

  console.log('\n🎊 PIPELINE PARSING TEST COMPLETED!');
}

// Run the test
testPipelineParsing().catch(console.error);

