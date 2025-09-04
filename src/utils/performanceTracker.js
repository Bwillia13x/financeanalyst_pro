/**
 * Performance Tracking Utilities
 * Monitors and reports performance metrics for optimization
 */

class PerformanceTracker {
  constructor() {
    this.metrics = new Map();
    this.observers = new Set();
    this.isEnabled = !this.isAutomatedEnvironment();
  }

  // Check if running in automated environment (Lighthouse, CI, etc.)
  isAutomatedEnvironment() {
    try {
      const params = new URLSearchParams(window.location.search);
      return (
        navigator.webdriver === true ||
        params.has('lhci') ||
        params.has('ci') ||
        params.has('audit') ||
        params.get('pwa') === '0'
      );
    } catch {
      return navigator.webdriver === true;
    }
  }

  // Start tracking a performance metric
  start(metricName) {
    if (!this.isEnabled) return;

    const startTime = performance.now();
    this.metrics.set(`${metricName}_start`, startTime);

    if (window.performance.mark) {
      window.performance.mark(`${metricName}_start`);
    }
  }

  // End tracking and calculate duration
  end(metricName) {
    if (!this.isEnabled) return null;

    const startKey = `${metricName}_start`;
    const startTime = this.metrics.get(startKey);

    if (!startTime) {
      console.warn(`Performance metric '${metricName}' was not started`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    this.metrics.set(metricName, duration);
    this.metrics.delete(startKey);

    if (window.performance.mark && window.performance.measure) {
      window.performance.mark(`${metricName}_end`);
      window.performance.measure(metricName, `${metricName}_start`, `${metricName}_end`);
    }

    this.notifyObservers(metricName, duration);

    return duration;
  }

  // Track custom metrics
  track(metricName, value, unit = 'ms') {
    if (!this.isEnabled) return;

    this.metrics.set(metricName, { value, unit, timestamp: Date.now() });
    this.notifyObservers(metricName, value, unit);
  }

  // Get metric value
  get(metricName) {
    return this.metrics.get(metricName);
  }

  // Get all metrics
  getAll() {
    return Object.fromEntries(this.metrics);
  }

  // Add observer for metric updates
  addObserver(callback) {
    this.observers.add(callback);
  }

  // Remove observer
  removeObserver(callback) {
    this.observers.delete(callback);
  }

  // Notify observers
  notifyObservers(metricName, value, unit = 'ms') {
    this.observers.forEach(callback => {
      try {
        callback(metricName, value, unit);
      } catch (error) {
        console.error('Performance observer error:', error);
      }
    });
  }

  // Clear all metrics
  clear() {
    this.metrics.clear();
  }

  // Export metrics for analysis
  export() {
    const exportData = {
      timestamp: Date.now(),
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        memory: this.getMemoryInfo(),
        connection: this.getConnectionInfo()
      },
      metrics: Object.fromEntries(this.metrics),
      webVitals: this.getWebVitals()
    };

    return exportData;
  }

  // Get memory information
  getMemoryInfo() {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  // Get connection information
  getConnectionInfo() {
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      };
    }
    return null;
  }

  // Get Web Vitals metrics
  getWebVitals() {
    const vitals = {};

    // Check for stored Web Vitals
    if (window.webVitalsMetrics) {
      vitals.cls = window.webVitalsMetrics.cls;
      vitals.fid = window.webVitalsMetrics.fid;
      vitals.fcp = window.webVitalsMetrics.fcp;
      vitals.lcp = window.webVitalsMetrics.lcp;
      vitals.ttfb = window.webVitalsMetrics.ttfb;
    }

    return vitals;
  }

  // Performance budget checker
  checkBudget(metricName, value, budget) {
    if (!budget) return null;

    const exceeded = value > budget.max;
    const percentage = (value / budget.max) * 100;

    if (exceeded) {
      console.warn(`🚨 Performance budget exceeded for ${metricName}:`, {
        actual: value,
        budget: budget.max,
        exceeded: value - budget.max,
        percentage: `${percentage.toFixed(1)}%`
      });
    }

    return {
      metric: metricName,
      value,
      budget: budget.max,
      exceeded,
      percentage
    };
  }
}

// Performance budgets
export const PERFORMANCE_BUDGETS = {
  // Core Web Vitals
  fcp: { max: 1800 }, // First Contentful Paint < 1.8s
  lcp: { max: 2500 }, // Largest Contentful Paint < 2.5s
  cls: { max: 0.1 }, // Cumulative Layout Shift < 0.1
  fid: { max: 100 }, // First Input Delay < 100ms
  ttfb: { max: 800 }, // Time to First Byte < 800ms

  // Bundle sizes
  'main-bundle': { max: 500 * 1024 }, // 500KB
  'vendor-bundle': { max: 1000 * 1024 }, // 1MB
  'total-bundle': { max: 2000 * 1024 }, // 2MB

  // Runtime performance
  'js-execution-time': { max: 100 }, // 100ms per frame
  'render-time': { max: 16 }, // 60fps target
  'memory-usage': { max: 100 * 1024 * 1024 } // 100MB
};

// Singleton instance
export const performanceTracker = new PerformanceTracker();

// Web Vitals tracking
export const trackWebVitals = () => {
  if (!performanceTracker.isEnabled) return;

  // Track Core Web Vitals
  import('web-vitals')
    .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(cls => {
        window.webVitalsMetrics = window.webVitalsMetrics || {};
        window.webVitalsMetrics.cls = cls.value;
        performanceTracker.track('cls', cls.value);
        performanceTracker.checkBudget('cls', cls.value, PERFORMANCE_BUDGETS.cls);
      });

      getFID(fid => {
        window.webVitalsMetrics = window.webVitalsMetrics || {};
        window.webVitalsMetrics.fid = fid.value;
        performanceTracker.track('fid', fid.value);
        performanceTracker.checkBudget('fid', fid.value, PERFORMANCE_BUDGETS.fid);
      });

      getFCP(fcp => {
        window.webVitalsMetrics = window.webVitalsMetrics || {};
        window.webVitalsMetrics.fcp = fcp.value;
        performanceTracker.track('fcp', fcp.value);
        performanceTracker.checkBudget('fcp', fcp.value, PERFORMANCE_BUDGETS.fcp);
      });

      getLCP(lcp => {
        window.webVitalsMetrics = window.webVitalsMetrics || {};
        window.webVitalsMetrics.lcp = lcp.value;
        performanceTracker.track('lcp', lcp.value);
        performanceTracker.checkBudget('lcp', lcp.value, PERFORMANCE_BUDGETS.lcp);
      });

      getTTFB(ttfb => {
        window.webVitalsMetrics = window.webVitalsMetrics || {};
        window.webVitalsMetrics.ttfb = ttfb.value;
        performanceTracker.track('ttfb', ttfb.value);
        performanceTracker.checkBudget('ttfb', ttfb.value, PERFORMANCE_BUDGETS.ttfb);
      });
    })
    .catch(error => {
      console.warn('Failed to load web-vitals:', error);
    });
};

// Bundle size monitoring
export const trackBundleSize = () => {
  if (!performanceTracker.isEnabled) return;

  // Track initial bundle load time
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    performanceTracker.track('bundle-load-time', loadTime);

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memoryUsage = performance.memory.usedJSHeapSize;
        performanceTracker.track('memory-usage', memoryUsage, 'bytes');
        performanceTracker.checkBudget(
          'memory-usage',
          memoryUsage,
          PERFORMANCE_BUDGETS['memory-usage']
        );
      }, 10000); // Every 10 seconds
    }
  });
};

// React performance monitoring
export const trackReactPerformance = () => {
  if (!performanceTracker.isEnabled) return;

  // Track React renders (if React DevTools is available)
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

    // Track fiber updates
    const originalOnCommitFiberRoot = hook.onCommitFiberRoot;
    if (originalOnCommitFiberRoot) {
      hook.onCommitFiberRoot = (...args) => {
        performanceTracker.track('react-render', performance.now(), 'timestamp');
        return originalOnCommitFiberRoot(...args);
      };
    }
  }
};

// Performance reporting
export const reportPerformance = () => {
  if (!performanceTracker.isEnabled) return;

  const report = performanceTracker.export();

  // Log to console in development
  if (import.meta.env.DEV) {
    console.group('🚀 Performance Report');
    console.log('Metrics:', report.metrics);
    console.log('Web Vitals:', report.webVitals);
    console.log('Environment:', report.environment);
    console.groupEnd();
  }

  // Send to analytics service (if available)
  if (window.gtag) {
    // Send key metrics to Google Analytics
    Object.entries(report.metrics).forEach(([key, value]) => {
      if (typeof value === 'number') {
        window.gtag('event', 'performance_metric', {
          metric_name: key,
          value
        });
      }
    });
  }

  return report;
};

// Initialize performance tracking
export const initializePerformanceTracking = () => {
  trackWebVitals();
  trackBundleSize();
  trackReactPerformance();

  // Report performance on page unload
  window.addEventListener('beforeunload', reportPerformance);

  // Report performance periodically
  setInterval(reportPerformance, 60000); // Every minute

  console.log('🚀 Performance tracking initialized');
};

export default performanceTracker;
