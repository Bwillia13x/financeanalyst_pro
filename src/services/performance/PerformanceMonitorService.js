/**
 * Performance Monitor Service
 * Advanced performance monitoring and optimization system
 * Tracks Core Web Vitals, bundle performance, and user experience metrics
 */

class PerformanceMonitorService {
  constructor(options = {}) {
    this.options = {
      enableRealUserMonitoring: true,
      enableBundleAnalysis: true,
      enableMemoryMonitoring: true,
      enableNetworkMonitoring: true,
      performanceBudget: {
        // Core Web Vitals thresholds
        lcp: 2500, // Largest Contentful Paint (ms)
        fid: 100, // First Input Delay (ms)
        cls: 0.1, // Cumulative Layout Shift
        fcp: 1800, // First Contentful Paint (ms)
        ttfb: 800, // Time to First Byte (ms)

        // Bundle size thresholds
        bundleSize: 1024 * 1024, // 1MB
        chunkSize: 512 * 1024, // 512KB per chunk

        // Memory thresholds
        heapUsed: 50 * 1024 * 1024, // 50MB
        heapTotal: 100 * 1024 * 1024 // 100MB
      },
      reportingInterval: 30000, // 30 seconds
      ...options
    };

    this.metrics = {
      coreWebVitals: new Map(),
      bundleMetrics: new Map(),
      memoryMetrics: new Map(),
      networkMetrics: new Map(),
      customMetrics: new Map()
    };

    this.observers = new Map();
    this.performanceObserver = null;
    this.isInitialized = false;

    // Performance budgets tracking
    this.budgets = {
      exceeded: new Set(),
      warnings: new Set()
    };
  }

  /**
   * Initialize performance monitoring
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.setupCoreWebVitals();
      this.setupBundleMonitoring();
      this.setupMemoryMonitoring();
      this.setupNetworkMonitoring();
      this.setupReporting();

      this.isInitialized = true;
      console.log('Performance Monitor Service initialized');
    } catch (error) {
      console.error('Failed to initialize Performance Monitor:', error);
    }
  }

  /**
   * Setup Core Web Vitals monitoring
   */
  setupCoreWebVitals() {
    if (!this.options.enableRealUserMonitoring) return;

    // Largest Contentful Paint (LCP)
    this.observePerformance('largest-contentful-paint', entry => {
      const value = entry.startTime;
      this.recordMetric('coreWebVitals', 'lcp', value);
      this.checkBudget('lcp', value);
    });

    // First Input Delay (FID)
    this.observePerformance('first-input', entry => {
      const value = entry.processingStart - entry.startTime;
      this.recordMetric('coreWebVitals', 'fid', value);
      this.checkBudget('fid', value);
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.observePerformance('layout-shift', entry => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        this.recordMetric('coreWebVitals', 'cls', clsValue);
        this.checkBudget('cls', clsValue);
      }
    });

    // First Contentful Paint (FCP)
    this.observePerformance('paint', entry => {
      if (entry.name === 'first-contentful-paint') {
        const value = entry.startTime;
        this.recordMetric('coreWebVitals', 'fcp', value);
        this.checkBudget('fcp', value);
      }
    });

    // Time to First Byte (TTFB)
    this.observePerformance('navigation', entry => {
      const value = entry.responseStart - entry.requestStart;
      this.recordMetric('coreWebVitals', 'ttfb', value);
      this.checkBudget('ttfb', value);
    });
  }

  /**
   * Setup bundle performance monitoring
   */
  setupBundleMonitoring() {
    if (!this.options.enableBundleAnalysis) return;

    // Monitor resource loading
    this.observePerformance('resource', entry => {
      if (entry.name.includes('.js') && entry.name.includes('chunk')) {
        const chunkSize = entry.transferSize;
        this.recordMetric('bundleMetrics', entry.name, {
          size: chunkSize,
          loadTime: entry.responseEnd - entry.requestStart,
          cached: entry.transferSize === 0
        });

        this.checkBudget('chunkSize', chunkSize);
      }
    });

    // Monitor navigation timing for initial bundle
    this.observePerformance('navigation', entry => {
      const bundleLoadTime = entry.loadEventEnd - entry.fetchStart;
      const domContentTime = entry.domContentLoadedEventEnd - entry.fetchStart;

      this.recordMetric('bundleMetrics', 'initialLoad', {
        totalTime: bundleLoadTime,
        domContentTime,
        domInteractive: entry.domInteractive - entry.fetchStart
      });
    });
  }

  /**
   * Setup memory monitoring
   */
  setupMemoryMonitoring() {
    if (!this.options.enableMemoryMonitoring) return;

    // Memory monitoring using Performance.memory (Chrome only)
    if (performance.memory) {
      setInterval(() => {
        const memory = performance.memory;
        this.recordMetric('memoryMetrics', 'heapUsage', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        });

        this.checkBudget('heapUsed', memory.usedJSHeapSize);
        this.checkBudget('heapTotal', memory.totalJSHeapSize);
      }, 5000); // Check every 5 seconds
    }
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    if (!this.options.enableNetworkMonitoring) return;

    // Monitor network requests
    this.observePerformance('resource', entry => {
      this.recordMetric('networkMetrics', entry.name, {
        duration: entry.responseEnd - entry.requestStart,
        size: entry.transferSize,
        cached: entry.transferSize === 0,
        type: entry.initiatorType
      });
    });
  }

  /**
   * Setup performance reporting
   */
  setupReporting() {
    // Report metrics at regular intervals
    setInterval(() => {
      this.reportMetrics();
    }, this.options.reportingInterval);

    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.reportMetrics();
    });

    // Report on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.reportMetrics();
      }
    });
  }

  /**
   * Generic performance observer setup
   */
  observePerformance(entryType, callback) {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(callback);
      });

      observer.observe({ entryTypes: [entryType] });
      this.observers.set(entryType, observer);
    } catch (error) {
      console.warn(`Failed to observe ${entryType}:`, error);
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(category, name, value, timestamp = Date.now()) {
    if (!this.metrics[category]) {
      this.metrics[category] = new Map();
    }

    const categoryMetrics = this.metrics[category];

    if (!categoryMetrics.has(name)) {
      categoryMetrics.set(name, []);
    }

    const metricHistory = categoryMetrics.get(name);
    metricHistory.push({ value, timestamp });

    // Keep only last 100 measurements per metric
    if (metricHistory.length > 100) {
      metricHistory.splice(0, metricHistory.length - 100);
    }
  }

  /**
   * Check if metric exceeds budget
   */
  checkBudget(metricName, value) {
    const budget = this.options.performanceBudget[metricName];
    if (!budget) return;

    const exceeded = this.isBudgetExceeded(metricName, value);

    if (exceeded && !this.budgets.exceeded.has(metricName)) {
      this.budgets.exceeded.add(metricName);
      this.reportBudgetViolation(metricName, value, budget);
    } else if (!exceeded && this.budgets.exceeded.has(metricName)) {
      this.budgets.exceeded.delete(metricName);
      this.reportBudgetRecovery(metricName, value, budget);
    }
  }

  /**
   * Check if budget is exceeded
   */
  isBudgetExceeded(metricName, value) {
    const budget = this.options.performanceBudget[metricName];

    // For Core Web Vitals, higher values are worse
    if (['lcp', 'fid', 'cls', 'fcp', 'ttfb', 'heapUsed', 'heapTotal'].includes(metricName)) {
      return value > budget;
    }

    // For sizes, larger values are worse
    if (['bundleSize', 'chunkSize'].includes(metricName)) {
      return value > budget;
    }

    return false;
  }

  /**
   * Report budget violation
   */
  reportBudgetViolation(metricName, value, budget) {
    const violation = {
      metric: metricName,
      value,
      budget,
      timestamp: Date.now(),
      severity: 'error'
    };

    console.warn(`Performance budget exceeded: ${metricName}`, violation);

    // In production, this would send to monitoring service
    this.emit('budgetViolation', violation);
  }

  /**
   * Report budget recovery
   */
  reportBudgetRecovery(metricName, value, budget) {
    const recovery = {
      metric: metricName,
      value,
      budget,
      timestamp: Date.now(),
      severity: 'info'
    };

    console.info(`Performance budget recovered: ${metricName}`, recovery);
    this.emit('budgetRecovery', recovery);
  }

  /**
   * Report all metrics
   */
  reportMetrics() {
    const report = {
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: {},
      budgets: {
        exceeded: Array.from(this.budgets.exceeded),
        warnings: Array.from(this.budgets.warnings)
      }
    };

    // Aggregate metrics
    for (const [category, categoryMetrics] of Object.entries(this.metrics)) {
      report.metrics[category] = {};

      for (const [metricName, metricHistory] of categoryMetrics.entries()) {
        if (metricHistory.length === 0) continue;

        const values = metricHistory.map(m => m.value);
        const latest = metricHistory[metricHistory.length - 1];

        report.metrics[category][metricName] = {
          current: latest.value,
          average: values.reduce((sum, val) => sum + val, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
          timestamp: latest.timestamp
        };
      }
    }

    // Send report (in production, this would go to analytics service)
    console.log('Performance Report:', report);
    this.emit('report', report);

    return report;
  }

  /**
   * Custom metric tracking
   */
  trackCustomMetric(name, value, category = 'custom') {
    this.recordMetric(category, name, value);
  }

  /**
   * Track user interaction performance
   */
  trackInteraction(name, startTime, endTime) {
    const duration = endTime - startTime;
    this.recordMetric('interactions', name, duration);

    // Check for slow interactions (>100ms)
    if (duration > 100) {
      console.warn(`Slow interaction detected: ${name} (${duration}ms)`);
      this.emit('slowInteraction', { name, duration, startTime, endTime });
    }
  }

  /**
   * Track route changes
   */
  trackRouteChange(from, to, navigationTime) {
    this.recordMetric('navigation', `route_${from}_to_${to}`, navigationTime);

    if (navigationTime > 1000) {
      console.warn(`Slow route change: ${from} -> ${to} (${navigationTime}ms)`);
      this.emit('slowRouteChange', { from, to, navigationTime });
    }
  }

  /**
   * Track API call performance
   */
  trackApiCall(endpoint, method, duration, status, size) {
    this.recordMetric('api', `${method}_${endpoint}`, {
      duration,
      status,
      size
    });

    if (duration > 2000) {
      console.warn(`Slow API call: ${method} ${endpoint} (${duration}ms)`);
      this.emit('slowApiCall', { endpoint, method, duration, status, size });
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const summary = {
      coreWebVitals: this.getCategorySummary('coreWebVitals'),
      bundleMetrics: this.getCategorySummary('bundleMetrics'),
      memoryMetrics: this.getCategorySummary('memoryMetrics'),
      networkMetrics: this.getCategorySummary('networkMetrics'),
      custom: this.getCategorySummary('custom'),
      budgets: {
        exceeded: Array.from(this.budgets.exceeded),
        warnings: Array.from(this.budgets.warnings)
      },
      timestamp: Date.now()
    };

    return summary;
  }

  /**
   * Get summary for a metric category
   */
  getCategorySummary(category) {
    const categoryMetrics = this.metrics[category];
    if (!categoryMetrics) return {};

    const summary = {};

    for (const [metricName, metricHistory] of categoryMetrics.entries()) {
      if (metricHistory.length === 0) continue;

      const values = metricHistory.map(m => m.value);
      const latest = metricHistory[metricHistory.length - 1];

      summary[metricName] = {
        current: latest.value,
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        trend: this.calculateTrend(values),
        timestamp: latest.timestamp
      };
    }

    return summary;
  }

  /**
   * Calculate trend (improving, degrading, stable)
   */
  calculateTrend(values, windowSize = 10) {
    if (values.length < windowSize) return 'insufficient-data';

    const recent = values.slice(-windowSize);
    const older = values.slice(-windowSize * 2, -windowSize);

    if (older.length === 0) return 'insufficient-data';

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;

    const change = recentAvg - olderAvg;
    const threshold = Math.abs(olderAvg) * 0.05; // 5% change threshold

    if (Math.abs(change) < threshold) return 'stable';

    // For most metrics, lower values are better
    return change < 0 ? 'improving' : 'degrading';
  }

  /**
   * Get session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('performance_session_id');
    if (!sessionId) {
      sessionId = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('performance_session_id', sessionId);
    }
    return sessionId;
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
        console.error(`Error in ${event} callback:`, error);
      }
    });
  }

  /**
   * Export performance data
   */
  exportData() {
    return {
      metrics: Object.fromEntries(
        Object.entries(this.metrics).map(([category, metrics]) => [
          category,
          Object.fromEntries(metrics.entries())
        ])
      ),
      budgets: {
        exceeded: Array.from(this.budgets.exceeded),
        warnings: Array.from(this.budgets.warnings)
      },
      sessionId: this.getSessionId(),
      exportTimestamp: Date.now()
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    for (const category of Object.keys(this.metrics)) {
      this.metrics[category].clear();
    }

    this.budgets.exceeded.clear();
    this.budgets.warnings.clear();
  }

  /**
   * Shutdown the service
   */
  shutdown() {
    // Disconnect all observers
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }

    this.observers.clear();
    this.clearMetrics();

    this.isInitialized = false;
    console.log('Performance Monitor Service shutdown');
  }
}

// Export singleton instance
export const performanceMonitorService = new PerformanceMonitorService();
export default PerformanceMonitorService;
