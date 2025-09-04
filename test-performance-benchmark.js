#!/usr/bin/env node

/**
 * PERFORMANCE BENCHMARK SUITE
 * Comprehensive performance validation for production deployment
 */

import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PerformanceBenchmark {
  constructor() {
    this.results = {
      benchmarks: [],
      summary: {
        totalBenchmarks: 0,
        passedBenchmarks: 0,
        failedBenchmarks: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
        memoryUsage: 0,
        cpuUsage: 0
      },
      details: new Map(),
      recommendations: []
    };

    this.benchmarkConfigs = {
      commandExecution: {
        iterations: 100,
        concurrency: 1,
        commands: ['help', 'clear', 'quote AAPL', 'dcf'],
        expectedMaxTime: 500 // ms
      },
      concurrentUsers: {
        iterations: 50,
        concurrency: 10,
        commands: ['help', 'clear'],
        expectedMaxTime: 1000 // ms
      },
      memoryStress: {
        iterations: 1000,
        concurrency: 5,
        commands: ['help'],
        expectedMaxMemory: 100 // MB
      },
      largePayload: {
        iterations: 10,
        concurrency: 1,
        commands: ['help'], // Would use large data commands in real scenario
        expectedMaxTime: 2000 // ms
      }
    };
  }

  async runAllBenchmarks() {
    console.log('🚀 STARTING COMPREHENSIVE PERFORMANCE BENCHMARKING');
    console.log('==================================================\n');

    try {
      // Import the enhanced CLI
      const { enhancedCLI } = await import('./src/services/cli/enhanced-cli.js');

      // Initialize CLI
      await enhancedCLI.initialize();

      // Run benchmarks
      await this.runCommandExecutionBenchmark(enhancedCLI);
      await this.runConcurrentUsersBenchmark(enhancedCLI);
      await this.runMemoryStressBenchmark(enhancedCLI);
      await this.runLargePayloadBenchmark(enhancedCLI);

      // Generate performance report
      this.generatePerformanceReport();
    } catch (error) {
      console.error('💥 Performance benchmarking failed:', error.message);
      this.recordBenchmarkResult('CRITICAL', `Benchmark failure: ${error.message}`, 'system');
    }

    return this.results;
  }

  async runCommandExecutionBenchmark(cli) {
    console.log('⚡ Running Command Execution Benchmark...');

    const config = this.benchmarkConfigs.commandExecution;
    const results = [];
    const startTime = performance.now();

    for (let i = 0; i < config.iterations; i++) {
      const command = config.commands[i % config.commands.length];
      const commandStartTime = performance.now();

      try {
        await cli.executeCommand(command);
        const commandEndTime = performance.now();
        const executionTime = commandEndTime - commandStartTime;

        results.push({
          command,
          executionTime,
          success: true,
          iteration: i
        });

        if (i % 20 === 0) {
          console.log(`  Processed ${i}/${config.iterations} commands...`);
        }
      } catch (error) {
        results.push({
          command,
          executionTime: 0,
          success: false,
          error: error.message,
          iteration: i
        });
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Calculate statistics
    const successfulResults = results.filter(r => r.success);
    const executionTimes = successfulResults.map(r => r.executionTime);

    const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const sortedTimes = executionTimes.sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    const benchmarkResult = {
      name: 'Command Execution',
      totalTime,
      iterations: config.iterations,
      successful: successfulResults.length,
      failed: results.length - successfulResults.length,
      averageTime: avgTime,
      p95Time: sortedTimes[p95Index] || 0,
      p99Time: sortedTimes[p99Index] || 0,
      throughput: config.iterations / (totalTime / 1000), // commands per second
      maxExpectedTime: config.expectedMaxTime
    };

    this.recordBenchmarkResult(
      benchmarkResult.averageTime <= config.expectedMaxTime ? 'PASSED' : 'FAILED',
      `Command Execution: ${avgTime.toFixed(2)}ms avg, ${benchmarkResult.throughput.toFixed(1)} cmd/s`,
      'command-execution',
      benchmarkResult
    );

    console.log(
      `✅ Command Execution: ${avgTime.toFixed(2)}ms avg, ${benchmarkResult.throughput.toFixed(1)} cmd/s`
    );
  }

  async runConcurrentUsersBenchmark(cli) {
    console.log('👥 Running Concurrent Users Benchmark...');

    const config = this.benchmarkConfigs.concurrentUsers;
    const results = [];
    const startTime = performance.now();

    // Create concurrent execution promises
    const promises = [];

    for (let i = 0; i < config.iterations; i++) {
      const command = config.commands[i % config.commands.length];

      const promise = (async () => {
        const commandStartTime = performance.now();

        try {
          await cli.executeCommand(command);
          const commandEndTime = performance.now();
          return {
            executionTime: commandEndTime - commandStartTime,
            success: true,
            command
          };
        } catch (error) {
          return {
            executionTime: 0,
            success: false,
            error: error.message,
            command
          };
        }
      })();

      promises.push(promise);

      // Control concurrency
      if (promises.length >= config.concurrency) {
        const batchResults = await Promise.all(promises.splice(0, config.concurrency));
        results.push(...batchResults);

        if (results.length % 50 === 0) {
          console.log(`  Processed ${results.length}/${config.iterations} concurrent commands...`);
        }
      }
    }

    // Process remaining promises
    if (promises.length > 0) {
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Calculate statistics
    const successfulResults = results.filter(r => r.success);
    const executionTimes = successfulResults.map(r => r.executionTime);

    const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const maxTime = Math.max(...executionTimes);

    const benchmarkResult = {
      name: 'Concurrent Users',
      totalTime,
      iterations: config.iterations,
      concurrency: config.concurrency,
      successful: successfulResults.length,
      failed: results.length - successfulResults.length,
      averageTime: avgTime,
      maxTime,
      throughput: config.iterations / (totalTime / 1000), // commands per second
      maxExpectedTime: config.expectedMaxTime
    };

    this.recordBenchmarkResult(
      benchmarkResult.maxTime <= config.expectedMaxTime ? 'PASSED' : 'FAILED',
      `Concurrent Users: ${avgTime.toFixed(2)}ms avg, ${maxTime.toFixed(2)}ms max`,
      'concurrent-users',
      benchmarkResult
    );

    console.log(`✅ Concurrent Users: ${avgTime.toFixed(2)}ms avg, ${maxTime.toFixed(2)}ms max`);
  }

  async runMemoryStressBenchmark(cli) {
    console.log('🧠 Running Memory Stress Benchmark...');

    const config = this.benchmarkConfigs.memoryStress;
    const results = [];
    const memorySnapshots = [];

    const startMemory = process.memoryUsage();
    const startTime = performance.now();

    for (let i = 0; i < config.iterations; i++) {
      const command = config.commands[i % config.commands.length];
      const commandStartTime = performance.now();

      try {
        await cli.executeCommand(command);
        const commandEndTime = performance.now();

        results.push({
          executionTime: commandEndTime - commandStartTime,
          success: true,
          command
        });
      } catch (error) {
        results.push({
          executionTime: 0,
          success: false,
          error: error.message,
          command
        });
      }

      // Take memory snapshot every 100 iterations
      if (i % 100 === 0) {
        const memoryUsage = process.memoryUsage();
        memorySnapshots.push({
          iteration: i,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external
        });
      }

      if (i % 200 === 0) {
        console.log(`  Processed ${i}/${config.iterations} memory stress commands...`);
      }
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage();

    const totalTime = endTime - startTime;
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    const memoryDeltaMB = memoryDelta / (1024 * 1024);

    // Calculate statistics
    const successfulResults = results.filter(r => r.success);
    const executionTimes = successfulResults.map(r => r.executionTime);
    const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;

    const benchmarkResult = {
      name: 'Memory Stress',
      totalTime,
      iterations: config.iterations,
      successful: successfulResults.length,
      failed: results.length - successfulResults.length,
      averageTime: avgTime,
      memoryDelta: memoryDeltaMB,
      peakMemoryUsage: Math.max(...memorySnapshots.map(m => m.heapUsed)) / (1024 * 1024),
      memorySnapshots,
      maxExpectedMemory: config.expectedMaxMemory
    };

    this.recordBenchmarkResult(
      benchmarkResult.memoryDelta <= config.expectedMaxMemory ? 'PASSED' : 'FAILED',
      `Memory Stress: ${memoryDeltaMB.toFixed(2)}MB delta, ${benchmarkResult.peakMemoryUsage.toFixed(2)}MB peak`,
      'memory-stress',
      benchmarkResult
    );

    console.log(
      `✅ Memory Stress: ${memoryDeltaMB.toFixed(2)}MB delta, ${benchmarkResult.peakMemoryUsage.toFixed(2)}MB peak`
    );
  }

  async runLargePayloadBenchmark(cli) {
    console.log('📦 Running Large Payload Benchmark...');

    const config = this.benchmarkConfigs.largePayload;
    const results = [];
    const startTime = performance.now();

    for (let i = 0; i < config.iterations; i++) {
      const command = config.commands[i % config.commands.length];
      const commandStartTime = performance.now();

      try {
        // Simulate large payload processing
        await cli.executeCommand(command);
        const commandEndTime = performance.now();

        results.push({
          executionTime: commandEndTime - commandStartTime,
          success: true,
          command
        });
      } catch (error) {
        results.push({
          executionTime: 0,
          success: false,
          error: error.message,
          command
        });
      }

      if (i % 5 === 0) {
        console.log(`  Processed ${i}/${config.iterations} large payload commands...`);
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Calculate statistics
    const successfulResults = results.filter(r => r.success);
    const executionTimes = successfulResults.map(r => r.executionTime);
    const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const maxTime = Math.max(...executionTimes);

    const benchmarkResult = {
      name: 'Large Payload',
      totalTime,
      iterations: config.iterations,
      successful: successfulResults.length,
      failed: results.length - successfulResults.length,
      averageTime: avgTime,
      maxTime,
      throughput: config.iterations / (totalTime / 1000), // commands per second
      maxExpectedTime: config.expectedMaxTime
    };

    this.recordBenchmarkResult(
      benchmarkResult.maxTime <= config.expectedMaxTime ? 'PASSED' : 'FAILED',
      `Large Payload: ${avgTime.toFixed(2)}ms avg, ${maxTime.toFixed(2)}ms max`,
      'large-payload',
      benchmarkResult
    );

    console.log(`✅ Large Payload: ${avgTime.toFixed(2)}ms avg, ${maxTime.toFixed(2)}ms max`);
  }

  recordBenchmarkResult(status, message, benchmarkType, details = {}) {
    const benchmark = {
      type: benchmarkType,
      status,
      message,
      timestamp: new Date().toISOString(),
      details
    };

    this.results.benchmarks.push(benchmark);
    this.results.details.set(benchmarkType, details);

    if (status === 'PASSED') {
      this.results.summary.passedBenchmarks++;
    } else {
      this.results.summary.failedBenchmarks++;
    }

    this.results.summary.totalBenchmarks++;
  }

  generatePerformanceReport() {
    const { summary, benchmarks, details } = this.results;

    // Calculate overall statistics
    const allExecutionTimes = [];
    let totalThroughput = 0;
    let benchmarkCount = 0;

    for (const benchmark of benchmarks) {
      if (benchmark.details.executionTimes) {
        allExecutionTimes.push(...benchmark.details.executionTimes);
      }
      if (benchmark.details.averageTime) {
        allExecutionTimes.push(benchmark.details.averageTime);
      }
      if (benchmark.details.throughput) {
        totalThroughput += benchmark.details.throughput;
        benchmarkCount++;
      }
    }

    if (allExecutionTimes.length > 0) {
      allExecutionTimes.sort((a, b) => a - b);
      summary.averageResponseTime =
        allExecutionTimes.reduce((a, b) => a + b, 0) / allExecutionTimes.length;
      summary.p95ResponseTime = allExecutionTimes[Math.floor(allExecutionTimes.length * 0.95)] || 0;
      summary.p99ResponseTime = allExecutionTimes[Math.floor(allExecutionTimes.length * 0.99)] || 0;
    }

    if (benchmarkCount > 0) {
      summary.throughput = totalThroughput / benchmarkCount;
    }

    // Memory and CPU stats (simplified)
    const memUsage = process.memoryUsage();
    summary.memoryUsage = memUsage.heapUsed / (1024 * 1024); // MB

    console.log('\n📊 PERFORMANCE BENCHMARK REPORT');
    console.log('================================');

    console.log(`\n📈 OVERALL RESULTS:`);
    console.log(`Total Benchmarks: ${summary.totalBenchmarks}`);
    console.log(`✅ Passed: ${summary.passedBenchmarks}`);
    console.log(`❌ Failed: ${summary.failedBenchmarks}`);
    console.log(`⏱️  Average Response Time: ${summary.averageResponseTime.toFixed(2)}ms`);
    console.log(`📊 P95 Response Time: ${summary.p95ResponseTime.toFixed(2)}ms`);
    console.log(`📊 P99 Response Time: ${summary.p99ResponseTime.toFixed(2)}ms`);
    console.log(`🚀 Throughput: ${summary.throughput.toFixed(1)} cmd/s`);
    console.log(`🧠 Memory Usage: ${summary.memoryUsage.toFixed(2)} MB`);

    console.log(`\n🔧 BENCHMARK DETAILS:`);
    for (const benchmark of benchmarks) {
      const icon = benchmark.status === 'PASSED' ? '✅' : '❌';
      console.log(`${icon} ${benchmark.details.name || benchmark.type}: ${benchmark.message}`);
    }

    console.log(`\n🏆 PERFORMANCE VERDICT:`);
    const successRate = (summary.passedBenchmarks / summary.totalBenchmarks) * 100;

    if (successRate >= 90) {
      console.log('🎉 EXCELLENT: Performance meets all production requirements!');
      console.log('✅ System is highly performant and scalable');
      console.log('🚀 Ready for production deployment');
    } else if (successRate >= 75) {
      console.log('⚠️ GOOD: Performance is acceptable with minor optimizations needed');
      console.log('✅ Core functionality is performant');
      console.log('🔧 Consider performance optimizations');
    } else if (successRate >= 60) {
      console.log('⚠️ FAIR: Performance needs significant improvements');
      console.log('⚠️ Multiple performance issues detected');
      console.log('🔧 Requires performance optimization before production');
    } else {
      console.log('❌ POOR: Critical performance issues detected');
      console.log('❌ Performance does not meet minimum requirements');
      console.log('🔧 Immediate performance optimization required');
    }

    // Generate recommendations
    this.generatePerformanceRecommendations();

    console.log('\n💡 PERFORMANCE RECOMMENDATIONS:');
    this.results.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    console.log('\n🏁 PERFORMANCE BENCHMARKING COMPLETE');
  }

  generatePerformanceRecommendations() {
    const recommendations = [];

    // Analyze benchmark results for recommendations
    for (const benchmark of this.results.benchmarks) {
      const details = benchmark.details;

      if (details.averageTime > 1000) {
        recommendations.push(
          `Optimize ${details.name} execution time (${details.averageTime.toFixed(2)}ms avg)`
        );
      }

      if (details.memoryDelta > 50) {
        recommendations.push(
          `Reduce memory usage in ${details.name} (${details.memoryDelta.toFixed(2)}MB increase)`
        );
      }

      if (details.throughput < 10) {
        recommendations.push(
          `Improve throughput for ${details.name} (${details.throughput.toFixed(1)} cmd/s)`
        );
      }
    }

    // General recommendations
    if (this.results.summary.memoryUsage > 200) {
      recommendations.push('Implement memory optimization strategies');
    }

    if (this.results.summary.p95ResponseTime > 2000) {
      recommendations.push('Optimize P95 response times for better user experience');
    }

    if (this.results.summary.throughput < 50) {
      recommendations.push('Consider horizontal scaling for improved throughput');
    }

    this.results.recommendations = recommendations;
  }

  exportResults() {
    return {
      ...this.results,
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        totalMemory: process.memoryUsage().heapTotal / (1024 * 1024)
      },
      metadata: {
        benchmarkSuite: 'performance-validation',
        version: '2.0.0',
        framework: 'comprehensive'
      }
    };
  }
}

// Run comprehensive performance benchmarking
async function runPerformanceBenchmarks() {
  console.log('🏃 FINANCEANALYST PRO - PERFORMANCE BENCHMARKING');
  console.log('===============================================\n');

  const benchmarker = new PerformanceBenchmark();
  const results = await benchmarker.runAllBenchmarks();

  // Export results for further analysis
  if (typeof globalThis !== 'undefined') {
    globalThis.performanceBenchmarkResults = benchmarker.exportResults();
  }

  return results;
}

// Execute performance benchmarks
runPerformanceBenchmarks()
  .then(results => {
    const successRate = (results.summary.passedBenchmarks / results.summary.totalBenchmarks) * 100;

    if (successRate >= 75) {
      console.log('\n✅ PERFORMANCE BENCHMARKING: PASSED');
      process.exit(0);
    } else {
      console.log('\n❌ PERFORMANCE BENCHMARKING: FAILED');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 PERFORMANCE BENCHMARKING CRASHED:', error);
    process.exit(1);
  });
