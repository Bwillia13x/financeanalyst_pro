/**
 * Performance monitoring and optimization utilities
 */

// Performance metrics collection
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isSupported = typeof window !== 'undefined' && 'performance' in window;
  }

  // Start timing a operation
  startTiming(name) {
    if (!this.isSupported) return;

    const startTime = performance.now();
    this.metrics.set(name, { startTime, endTime: null, duration: null });

    // Also use Performance API mark if available
    if (performance.mark) {
      performance.mark(`${name}-start`);
    }
  }

  // End timing and calculate duration
  endTiming(name) {
    if (!this.isSupported) return null;

    const endTime = performance.now();
    const metric = this.metrics.get(name);

    if (!metric) {
      console.warn(`No start time found for metric: ${name}`);
      return null;
    }

    const duration = endTime - metric.startTime;
    metric.endTime = endTime;
    metric.duration = duration;

    // Use Performance API measure if available
    if (performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }

    return duration;
  }

  // Get metric data
  getMetric(name) {
    return this.metrics.get(name);
  }

  // Get all metrics
  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear();
    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
  }

  // Monitor Core Web Vitals
  observeWebVitals() {
    if (!this.isSupported) return;

    // Largest Contentful Paint (LCP)
    this.observeLCP();

    // First Input Delay (FID)
    this.observeFID();

    // Cumulative Layout Shift (CLS)
    this.observeCLS();

    // First Contentful Paint (FCP)
    this.observeFCP();
  }

  observeLCP() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      this.reportMetric('LCP', lastEntry.startTime);
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.set('lcp', observer);
  }

  observeFID() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.reportMetric('FID', entry.processingStart - entry.startTime);
      });
    });

    observer.observe({ entryTypes: ['first-input'] });
    this.observers.set('fid', observer);
  }

  observeCLS() {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.reportMetric('CLS', clsValue);
        }
      });
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('cls', observer);
  }

  observeFCP() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.reportMetric('FCP', entry.startTime);
        }
      });
    });

    observer.observe({ entryTypes: ['paint'] });
    this.observers.set('fcp', observer);
  }

  // Report metric to console and external services
  reportMetric(name, value) {
    console.log(`Performance Metric - ${name}: ${value.toFixed(2)}ms`);

    // Send to analytics service in production
    if (import.meta.env.PROD && import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      this.sendToAnalytics(name, value);
    }
  }

  // Send metrics to external analytics service
  async sendToAnalytics(name, value) {
    try {
      await fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance_metric',
          metric: name,
          value,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      });
    } catch (error) {
      console.warn('Failed to send performance metric:', error);
    }
  }

  // Disconnect all observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Memory usage monitoring
export const getMemoryUsage = () => {
  if (!('memory' in performance)) {
    return null;
  }

  const memory = performance.memory;
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
  };
};

// Bundle size analysis
export const getBundleInfo = () => {
  if (!('getEntriesByType' in performance)) {
    return null;
  }

  const resources = performance.getEntriesByType('resource');
  const jsResources = resources.filter(
    resource => resource.name.endsWith('.js') || resource.name.endsWith('.mjs')
  );
  const cssResources = resources.filter(resource => resource.name.endsWith('.css'));

  return {
    totalResources: resources.length,
    jsFiles: jsResources.length,
    cssFiles: cssResources.length,
    totalTransferSize: resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0),
    jsTransferSize: jsResources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0),
    cssTransferSize: cssResources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0)
  };
};

// React component performance wrapper
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return function PerformanceMonitoredComponent(props) {
    const monitor = new PerformanceMonitor();

    React.useEffect(() => {
      monitor.startTiming(`${componentName}-mount`);

      return () => {
        monitor.endTiming(`${componentName}-mount`);
        const metric = monitor.getMetric(`${componentName}-mount`);
        if (metric && metric.duration > 100) {
          // Warn if mount takes > 100ms
          console.warn(
            `Slow component mount: ${componentName} took ${metric.duration.toFixed(2)}ms`
          );
        }
      };
    }, []);

    return React.createElement(WrappedComponent, props);
  };
};

// Debounce utility for performance
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Throttle utility for performance
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Create global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize monitoring in browser environment
if (typeof window !== 'undefined') {
  performanceMonitor.observeWebVitals();

  // Log performance info on page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      console.log('Memory Usage:', getMemoryUsage());
      console.log('Bundle Info:', getBundleInfo());
    }, 1000);
  });
}
