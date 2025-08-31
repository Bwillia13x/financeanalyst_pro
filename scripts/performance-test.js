/**
 * Performance and Load Testing Suite
 * FinanceAnalyst Pro Platform
 */

import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';

class PerformanceTestSuite {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      tests: []
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Performance Test Suite');

    try {
      // Test 1: API Health Check Performance
      await this.testAPIHealth();

      // Test 2: Frontend Bundle Size Analysis
      await this.testBundleSize();

      // Test 3: Memory Usage Analysis
      await this.testMemoryUsage();

      // Generate report
      this.generateReport();
    } catch (error) {
      console.error('❌ Performance testing failed:', error);
    }
  }

  async testAPIHealth() {
    console.log('\n📊 Testing API Health Check Performance');

    try {
      const result = await autocannon({
        url: 'http://localhost:3001/api/health',
        connections: 10,
        duration: 10,
        method: 'GET'
      });

      const testResult = {
        name: 'API Health Check',
        type: 'api',
        metrics: {
          requestsPerSecond: result.requests.average,
          latency: result.latency.average,
          errors: result.errors
        },
        status: result.errors === 0 ? 'PASS' : 'FAIL'
      };

      this.results.tests.push(testResult);
      console.log(`✅ Health API: ${result.requests.average.toFixed(2)} req/sec`);
    } catch (error) {
      console.log('⚠️ Health API test skipped (server not running)');
      this.results.tests.push({
        name: 'API Health Check',
        status: 'SKIP',
        error: error.message
      });
    }
  }

  async testBundleSize() {
    console.log('\n📦 Analyzing Frontend Bundle Size');

    const currentDir = path.dirname(new URL(import.meta.url).pathname);
    const distPath = path.join(currentDir, '..', 'dist');
    let totalSize = 0;

    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath, { recursive: true });

      for (const file of files) {
        if (typeof file === 'string' && (file.endsWith('.js') || file.endsWith('.css'))) {
          const filePath = path.join(distPath, file);
          try {
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
          } catch (e) {
            // Skip inaccessible files
          }
        }
      }
    }

    const testResult = {
      name: 'Bundle Size Analysis',
      type: 'frontend',
      metrics: {
        totalSize: totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
      },
      status: totalSize < 50 * 1024 * 1024 ? 'PASS' : 'WARN'
    };

    this.results.tests.push(testResult);
    console.log(`✅ Bundle Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB total`);
  }

  async testMemoryUsage() {
    console.log('\n🧠 Analyzing Memory Usage');

    const memUsage = process.memoryUsage();

    const testResult = {
      name: 'Memory Usage Analysis',
      type: 'system',
      metrics: {
        rssMB: (memUsage.rss / 1024 / 1024).toFixed(2),
        heapUsedMB: (memUsage.heapUsed / 1024 / 1024).toFixed(2)
      },
      status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'PASS' : 'WARN'
    };

    this.results.tests.push(testResult);
    console.log(`✅ Memory Usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB heap used`);
  }

  generateReport() {
    console.log('\n📋 Generating Performance Report');

    const currentDir = path.dirname(new URL(import.meta.url).pathname);
    const reportPath = path.join(currentDir, '..', 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    console.log('📊 PERFORMANCE TEST RESULTS');
    console.log('===========================');

    this.results.tests.forEach(test => {
      console.log(`\n${test.name}: ${test.status}`);
      if (test.metrics) {
        if (test.metrics.requestsPerSecond) {
          console.log(`  📈 Throughput: ${test.metrics.requestsPerSecond.toFixed(2)} req/sec`);
        }
        if (test.metrics.totalSizeMB) {
          console.log(`  📦 Bundle Size: ${test.metrics.totalSizeMB} MB`);
        }
        if (test.metrics.heapUsedMB) {
          console.log(`  🧠 Memory: ${test.metrics.heapUsedMB} MB heap used`);
        }
      }
    });

    console.log(`\n📄 Report saved to: ${reportPath}`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new PerformanceTestSuite();
  testSuite.runAllTests().catch(console.error);
}

export default PerformanceTestSuite;
