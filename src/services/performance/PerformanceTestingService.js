/**
 * Performance Testing Service
 * Automated performance testing and benchmarking system
 * Runs comprehensive tests and generates performance reports
 */

class PerformanceTestingService {
  constructor(options = {}) {
    this.options = {
      enableAutomatedTesting: true,
      enableBenchmarking: true,
      testInterval: 3600000, // 1 hour
      benchmarkIterations: 100,
      performanceThresholds: {
        responseTime: 1000, // 1 second
        memoryUsage: 50 * 1024 * 1024, // 50MB
        bundleSize: 1024 * 1024, // 1MB
        firstPaint: 1500, // 1.5 seconds
        largestContentfulPaint: 2500 // 2.5 seconds
      },
      reportRetention: 30, // Keep reports for 30 days
      ...options
    };

    this.testResults = new Map();
    this.benchmarks = new Map();
    this.testQueue = [];
    this.runningTests = new Set();
    this.testHistory = [];
    this.isInitialized = false;
  }

  /**
   * Initialize performance testing
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.setupAutomatedTesting();
      this.setupBenchmarkSuites();
      this.setupPerformanceBaselines();
      this.setupTestReporting();

      this.isInitialized = true;
      console.log('Performance Testing Service initialized');
    } catch (error) {
      console.error('Failed to initialize Performance Testing Service:', error);
    }
  }

  /**
   * Setup automated testing
   */
  setupAutomatedTesting() {
    if (!this.options.enableAutomatedTesting) return;

    // Run tests at regular intervals
    setInterval(() => {
      this.runAutomatedTestSuite();
    }, this.options.testInterval);

    // Run tests on page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.runAutomatedTestSuite();
      }, 5000); // Wait 5 seconds after load
    });

    // Run tests before page unload
    window.addEventListener('beforeunload', () => {
      this.runCriticalTests();
    });
  }

  /**
   * Setup benchmark test suites
   */
  setupBenchmarkSuites() {
    if (!this.options.enableBenchmarking) return;

    // Core Web Vitals Benchmark
    this.registerBenchmark('core-web-vitals', async () => {
      return this.benchmarkCoreWebVitals();
    });

    // Memory Usage Benchmark
    this.registerBenchmark('memory-usage', async () => {
      return this.benchmarkMemoryUsage();
    });

    // API Response Time Benchmark
    this.registerBenchmark('api-performance', async () => {
      return this.benchmarkApiPerformance();
    });

    // Bundle Loading Benchmark
    this.registerBenchmark('bundle-loading', async () => {
      return this.benchmarkBundleLoading();
    });

    // Component Rendering Benchmark
    this.registerBenchmark('component-rendering', async () => {
      return this.benchmarkComponentRendering();
    });

    // Database Query Benchmark
    this.registerBenchmark('database-performance', async () => {
      return this.benchmarkDatabasePerformance();
    });
  }

  /**
   * Setup performance baselines
   */
  setupPerformanceBaselines() {
    // Set baseline values for comparison
    this.baselines = {
      'core-web-vitals': {
        lcp: 2500,
        fid: 100,
        cls: 0.1
      },
      'memory-usage': {
        heapUsed: 30 * 1024 * 1024,
        heapTotal: 50 * 1024 * 1024
      },
      'api-performance': {
        averageResponseTime: 500,
        errorRate: 0.05
      },
      'bundle-loading': {
        initialLoadTime: 3000,
        chunkLoadTime: 1000
      }
    };
  }

  /**
   * Setup test reporting
   */
  setupTestReporting() {
    // Clean up old reports
    setInterval(() => {
      this.cleanupOldReports();
    }, 86400000); // Daily cleanup
  }

  /**
   * Register a benchmark test
   */
  registerBenchmark(name, testFunction, options = {}) {
    this.benchmarks.set(name, {
      name,
      testFunction,
      options: {
        iterations: this.options.benchmarkIterations,
        timeout: 30000, // 30 seconds
        ...options
      },
      registeredAt: Date.now()
    });
  }

  /**
   * Run automated test suite
   */
  async runAutomatedTestSuite() {
    console.log('Running automated performance test suite...');

    const testSuite = {
      id: `suite_${Date.now()}`,
      name: 'Automated Performance Test Suite',
      startedAt: Date.now(),
      tests: [],
      results: {},
      status: 'running'
    };

    try {
      // Run all registered benchmarks
      for (const [name, benchmark] of this.benchmarks.entries()) {
        const result = await this.runBenchmark(name);
        testSuite.tests.push(name);
        testSuite.results[name] = result;
      }

      testSuite.status = 'completed';
      testSuite.completedAt = Date.now();
      testSuite.duration = testSuite.completedAt - testSuite.startedAt;

      // Analyze results
      const analysis = this.analyzeTestResults(testSuite);
      testSuite.analysis = analysis;

      // Store test results
      this.testHistory.push(testSuite);

      // Generate report
      const report = this.generateTestReport(testSuite);
      this.emit('testSuiteCompleted', { testSuite, report, analysis });

      console.log('Automated test suite completed:', testSuite);
    } catch (error) {
      console.error('Automated test suite failed:', error);
      testSuite.status = 'failed';
      testSuite.error = error.message;
      testSuite.completedAt = Date.now();
      testSuite.duration = testSuite.completedAt - testSuite.startedAt;

      this.testHistory.push(testSuite);
      this.emit('testSuiteFailed', { testSuite, error });
    }
  }

  /**
   * Run critical tests (fast, essential checks)
   */
  async runCriticalTests() {
    const criticalTests = ['core-web-vitals', 'memory-usage'];

    const results = {};

    for (const testName of criticalTests) {
      try {
        results[testName] = await this.runBenchmark(testName);
      } catch (error) {
        results[testName] = { error: error.message };
      }
    }

    console.log('Critical tests completed:', results);
    return results;
  }

  /**
   * Run a specific benchmark
   */
  async runBenchmark(name) {
    const benchmark = this.benchmarks.get(name);
    if (!benchmark) {
      throw new Error(`Benchmark '${name}' not found`);
    }

    if (this.runningTests.has(name)) {
      throw new Error(`Benchmark '${name}' is already running`);
    }

    this.runningTests.add(name);

    try {
      const startTime = performance.now();

      // Run the benchmark function
      const result = await this.executeBenchmarkWithTimeout(benchmark);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      const benchmarkResult = {
        name,
        result,
        executionTime,
        timestamp: Date.now(),
        iterations: benchmark.options.iterations,
        status: 'completed'
      };

      // Compare with baseline
      const baseline = this.baselines[name];
      if (baseline) {
        benchmarkResult.baselineComparison = this.compareWithBaseline(result, baseline);
      }

      return benchmarkResult;
    } catch (error) {
      const benchmarkResult = {
        name,
        error: error.message,
        timestamp: Date.now(),
        status: 'failed'
      };

      throw benchmarkResult;
    } finally {
      this.runningTests.delete(name);
    }
  }

  /**
   * Execute benchmark with timeout
   */
  async executeBenchmarkWithTimeout(benchmark) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Benchmark '${benchmark.name}' timed out`));
      }, benchmark.options.timeout);

      try {
        const result = await benchmark.testFunction();
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Benchmark Core Web Vitals
   */
  async benchmarkCoreWebVitals() {
    return new Promise(resolve => {
      const vitals = {
        lcp: null,
        fid: null,
        cls: null,
        fcp: null,
        ttfb: null
      };

      let completed = 0;
      const required = Object.keys(vitals).length;

      const checkComplete = () => {
        completed++;
        if (completed >= required) {
          resolve(vitals);
        }
      };

      // Use Performance Observer to get vitals
      if ('PerformanceObserver' in window) {
        // LCP
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
          checkComplete();
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // FID
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.fid = lastEntry.processingStart - lastEntry.startTime;
          checkComplete();
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          vitals.cls = clsValue;
          checkComplete();
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // FCP
        const fcpObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
              checkComplete();
              break;
            }
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // TTFB
        const navigationObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const entry = entries[0];
            vitals.ttfb = entry.responseStart - entry.requestStart;
            checkComplete();
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
      } else {
        // Fallback values for browsers without PerformanceObserver
        setTimeout(() => {
          vitals.lcp = performance.now();
          vitals.fid = 0;
          vitals.cls = 0;
          vitals.fcp = performance.now();
          vitals.ttfb = 0;
          resolve(vitals);
        }, 100);
      }

      // Timeout fallback
      setTimeout(() => {
        resolve(vitals);
      }, 5000);
    });
  }

  /**
   * Benchmark memory usage
   */
  async benchmarkMemoryUsage() {
    const memoryStats = {
      heapUsed: 0,
      heapTotal: 0,
      heapLimit: 0,
      external: 0,
      measurements: []
    };

    if (!performance.memory) {
      return memoryStats;
    }

    // Take multiple measurements
    for (let i = 0; i < 10; i++) {
      const memory = performance.memory;
      memoryStats.measurements.push({
        timestamp: Date.now(),
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        external: memory.external || 0
      });

      // Small delay between measurements
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Calculate averages
    const measurements = memoryStats.measurements;
    memoryStats.heapUsed = measurements.reduce((sum, m) => sum + m.used, 0) / measurements.length;
    memoryStats.heapTotal = measurements.reduce((sum, m) => sum + m.total, 0) / measurements.length;
    memoryStats.heapLimit = measurements[0].limit; // Limit doesn't change
    memoryStats.external =
      measurements.reduce((sum, m) => sum + m.external, 0) / measurements.length;

    return memoryStats;
  }

  /**
   * Benchmark API performance
   */
  async benchmarkApiPerformance() {
    const apiStats = {
      endpoints: {},
      totalRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      slowestEndpoint: null,
      fastestEndpoint: null
    };

    // Mock API endpoints to test (in real implementation, this would come from actual API usage)
    const testEndpoints = [
      '/api/user/profile',
      '/api/market/data',
      '/api/analytics/report',
      '/api/portfolio/performance'
    ];

    for (const endpoint of testEndpoints) {
      const startTime = performance.now();

      try {
        // Mock API call (in real implementation, this would be actual API calls)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));

        const responseTime = performance.now() - startTime;

        apiStats.endpoints[endpoint] = {
          responseTime,
          status: 'success',
          timestamp: Date.now()
        };

        apiStats.totalRequests++;
      } catch (error) {
        apiStats.endpoints[endpoint] = {
          error: error.message,
          status: 'error',
          timestamp: Date.now()
        };
        apiStats.totalRequests++;
      }
    }

    // Calculate statistics
    const successfulRequests = Object.values(apiStats.endpoints).filter(
      e => e.status === 'success'
    );
    const responseTimes = successfulRequests.map(e => e.responseTime);

    if (responseTimes.length > 0) {
      apiStats.averageResponseTime =
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      apiStats.slowestEndpoint = successfulRequests.reduce((slowest, current) =>
        current.responseTime > slowest.responseTime ? current : slowest
      );
      apiStats.fastestEndpoint = successfulRequests.reduce((fastest, current) =>
        current.responseTime < fastest.responseTime ? current : fastest
      );
    }

    const errorCount = Object.values(apiStats.endpoints).filter(e => e.status === 'error').length;
    apiStats.errorRate = errorCount / apiStats.totalRequests;

    return apiStats;
  }

  /**
   * Benchmark bundle loading
   */
  async benchmarkBundleLoading() {
    const bundleStats = {
      initialLoadTime: 0,
      chunkLoadTimes: {},
      totalBundleSize: 0,
      cachedResources: 0,
      uncachedResources: 0
    };

    return new Promise(resolve => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.name.includes('.js')) {
              if (entry.name.includes('app') || entry.name.includes('main')) {
                bundleStats.initialLoadTime = entry.responseEnd - entry.requestStart;
              } else if (entry.name.includes('chunk')) {
                bundleStats.chunkLoadTimes[entry.name] = entry.responseEnd - entry.requestStart;
              }

              bundleStats.totalBundleSize += entry.transferSize;

              if (entry.transferSize === 0) {
                bundleStats.cachedResources++;
              } else {
                bundleStats.uncachedResources++;
              }
            }
          }
        });

        observer.observe({ entryTypes: ['resource'] });

        // Resolve after a delay to collect data
        setTimeout(() => {
          observer.disconnect();
          resolve(bundleStats);
        }, 3000);
      } else {
        resolve(bundleStats);
      }
    });
  }

  /**
   * Benchmark component rendering
   */
  async benchmarkComponentRendering() {
    const renderStats = {
      componentRenders: {},
      averageRenderTime: 0,
      slowestComponent: null,
      fastestComponent: null,
      totalRenders: 0
    };

    // Mock component rendering tests
    const components = ['Dashboard', 'Chart', 'Table', 'Form', 'Modal'];

    for (const component of components) {
      const renderTime = Math.random() * 100 + 10; // Mock render time

      renderStats.componentRenders[component] = {
        renderTime,
        timestamp: Date.now()
      };

      renderStats.totalRenders++;
    }

    // Calculate statistics
    const renderTimes = Object.values(renderStats.componentRenders).map(c => c.renderTime);
    renderStats.averageRenderTime =
      renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;

    const componentsWithTimes = Object.entries(renderStats.componentRenders);
    renderStats.slowestComponent = componentsWithTimes.reduce((slowest, [name, data]) =>
      data.renderTime > slowest.data.renderTime ? { name, data } : slowest
    );

    renderStats.fastestComponent = componentsWithTimes.reduce((fastest, [name, data]) =>
      data.renderTime < fastest.data.renderTime ? { name, data } : fastest
    );

    return renderStats;
  }

  /**
   * Benchmark database performance
   */
  async benchmarkDatabasePerformance() {
    const dbStats = {
      queryTimes: {},
      averageQueryTime: 0,
      slowestQuery: null,
      fastestQuery: null,
      totalQueries: 0,
      cacheHitRate: 0
    };

    // Mock database queries
    const queries = [
      'SELECT * FROM users',
      'SELECT * FROM portfolios WHERE user_id = ?',
      'SELECT * FROM market_data ORDER BY timestamp DESC LIMIT 100',
      'INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)',
      'UPDATE user_preferences SET theme = ? WHERE user_id = ?'
    ];

    for (const query of queries) {
      const queryTime = Math.random() * 200 + 20; // Mock query time

      dbStats.queryTimes[query] = {
        executionTime: queryTime,
        timestamp: Date.now(),
        cached: Math.random() > 0.7 // 30% cache hit rate
      };

      dbStats.totalQueries++;
    }

    // Calculate statistics
    const queryTimes = Object.values(dbStats.queryTimes).map(q => q.executionTime);
    dbStats.averageQueryTime = queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length;

    const queriesWithTimes = Object.entries(dbStats.queryTimes);
    dbStats.slowestQuery = queriesWithTimes.reduce((slowest, [query, data]) =>
      data.executionTime > slowest.data.executionTime ? { query, data } : slowest
    );

    dbStats.fastestQuery = queriesWithTimes.reduce((fastest, [query, data]) =>
      data.executionTime < fastest.data.executionTime ? { query, data } : fastest
    );

    const cachedQueries = Object.values(dbStats.queryTimes).filter(q => q.cached).length;
    dbStats.cacheHitRate = cachedQueries / dbStats.totalQueries;

    return dbStats;
  }

  /**
   * Compare results with baseline
   */
  compareWithBaseline(result, baseline) {
    const comparison = {
      improvements: [],
      regressions: [],
      status: 'stable'
    };

    for (const [metric, baselineValue] of Object.entries(baseline)) {
      const currentValue = result[metric] || result.average || result;

      if (typeof currentValue !== 'number' || typeof baselineValue !== 'number') continue;

      const change = ((currentValue - baselineValue) / baselineValue) * 100;
      const threshold = 5; // 5% change threshold

      if (Math.abs(change) > threshold) {
        const item = {
          metric,
          baseline: baselineValue,
          current: currentValue,
          changePercent: change,
          status: change > 0 ? 'regression' : 'improvement'
        };

        if (change > 0) {
          comparison.regressions.push(item);
        } else {
          comparison.improvements.push(item);
        }
      }
    }

    // Determine overall status
    if (comparison.regressions.length > 0) {
      comparison.status = 'regressed';
    } else if (comparison.improvements.length > 0) {
      comparison.status = 'improved';
    }

    return comparison;
  }

  /**
   * Analyze test results
   */
  analyzeTestResults(testSuite) {
    const analysis = {
      overallStatus: 'passed',
      criticalIssues: [],
      warnings: [],
      recommendations: [],
      score: 100
    };

    let totalScore = 0;
    let testCount = 0;

    for (const [testName, result] of Object.entries(testSuite.results)) {
      testCount++;

      if (result.status === 'failed') {
        analysis.criticalIssues.push({
          test: testName,
          error: result.error,
          severity: 'critical'
        });
        analysis.overallStatus = 'failed';
        totalScore -= 20;
        continue;
      }

      // Check against thresholds
      const thresholds = this.options.performanceThresholds;
      const testThresholds = this.getThresholdsForTest(testName);

      for (const [metric, threshold] of Object.entries(testThresholds)) {
        const value = this.getMetricValue(result.result, metric);

        if (value > threshold) {
          analysis.warnings.push({
            test: testName,
            metric,
            value,
            threshold,
            severity: 'warning'
          });
          totalScore -= 5;
        }
      }

      // Check baseline comparison
      if (result.baselineComparison) {
        if (result.baselineComparison.regressions.length > 0) {
          analysis.warnings.push({
            test: testName,
            message: 'Performance regression detected',
            details: result.baselineComparison.regressions,
            severity: 'warning'
          });
          totalScore -= 10;
        }
      }
    }

    analysis.score = Math.max(0, Math.min(100, 100 + totalScore));

    // Generate recommendations
    if (analysis.criticalIssues.length > 0) {
      analysis.recommendations.push('Fix critical performance issues immediately');
    }

    if (analysis.warnings.length > 0) {
      analysis.recommendations.push('Address performance warnings to improve user experience');
    }

    if (analysis.score < 70) {
      analysis.recommendations.push('Overall performance needs significant improvement');
    }

    return analysis;
  }

  /**
   * Get thresholds for specific test
   */
  getThresholdsForTest(testName) {
    const testThresholds = {
      'core-web-vitals': {
        lcp: this.options.performanceThresholds.largestContentfulPaint,
        fid: this.options.performanceThresholds.responseTime,
        cls: this.options.performanceThresholds.cls,
        fcp: this.options.performanceThresholds.firstPaint
      },
      'memory-usage': {
        heapUsed: this.options.performanceThresholds.memoryUsage
      },
      'bundle-loading': {
        initialLoadTime: this.options.performanceThresholds.bundleSize
      }
    };

    return testThresholds[testName] || {};
  }

  /**
   * Get metric value from result
   */
  getMetricValue(result, metric) {
    if (typeof result === 'number') return result;
    if (typeof result === 'object' && result[metric] !== undefined) return result[metric];
    if (typeof result === 'object' && result.average !== undefined) return result.average;
    return 0;
  }

  /**
   * Generate test report
   */
  generateTestReport(testSuite) {
    const report = {
      id: testSuite.id,
      title: 'Performance Test Report',
      summary: {
        status: testSuite.status,
        duration: testSuite.duration,
        testsRun: testSuite.tests.length,
        score: testSuite.analysis.score
      },
      results: testSuite.results,
      analysis: testSuite.analysis,
      recommendations: testSuite.analysis.recommendations,
      generatedAt: Date.now(),
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now()
      }
    };

    return report;
  }

  /**
   * Get test history
   */
  getTestHistory(limit = 10) {
    return this.testHistory.slice(-limit);
  }

  /**
   * Get latest test results
   */
  getLatestResults() {
    if (this.testHistory.length === 0) return null;
    return this.testHistory[this.testHistory.length - 1];
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(testName, metric, days = 7) {
    const trends = {
      metric,
      testName,
      data: [],
      trend: 'stable',
      changePercent: 0
    };

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    // Collect data points
    for (const testSuite of this.testHistory) {
      if (testSuite.completedAt < cutoff) continue;

      const result = testSuite.results[testName];
      if (result && result.result) {
        const value = this.getMetricValue(result.result, metric);
        trends.data.push({
          timestamp: testSuite.completedAt,
          value
        });
      }
    }

    // Sort by timestamp
    trends.data.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate trend
    if (trends.data.length >= 2) {
      const first = trends.data[0].value;
      const last = trends.data[trends.data.length - 1].value;
      trends.changePercent = ((last - first) / first) * 100;

      if (trends.changePercent > 5) {
        trends.trend = 'degrading';
      } else if (trends.changePercent < -5) {
        trends.trend = 'improving';
      }
    }

    return trends;
  }

  /**
   * Cleanup old reports
   */
  cleanupOldReports() {
    const cutoff = Date.now() - this.options.reportRetention * 24 * 60 * 60 * 1000;

    this.testHistory = this.testHistory.filter(report => report.completedAt > cutoff);

    console.log(`Cleaned up old performance reports. Remaining: ${this.testHistory.length}`);
  }

  /**
   * Export test data
   */
  exportTestData() {
    return {
      history: this.testHistory,
      benchmarks: Array.from(this.benchmarks.entries()),
      baselines: this.baselines,
      options: this.options,
      exportTimestamp: Date.now()
    };
  }

  /**
   * Event emitter functionality
   */
  on(event, callback) {
    if (!this.eventListeners) {
      this.eventListeners = new Map();
    }

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    if (!this.eventListeners || !this.eventListeners.has(event)) return;

    this.eventListeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in performance testing ${event} callback:`, error);
      }
    });
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      totalBenchmarks: this.benchmarks.size,
      totalTestSuites: this.testHistory.length,
      runningTests: this.runningTests.size,
      lastTestSuite: this.getLatestResults(),
      averageScore:
        this.testHistory.length > 0
          ? this.testHistory.reduce((sum, suite) => sum + (suite.analysis?.score || 0), 0) /
            this.testHistory.length
          : 0
    };
  }

  /**
   * Shutdown the service
   */
  shutdown() {
    this.runningTests.clear();
    this.testQueue = [];
    this.isInitialized = false;

    console.log('Performance Testing Service shutdown');
  }
}

// Export singleton instance
export const performanceTestingService = new PerformanceTestingService();
export default PerformanceTestingService;
