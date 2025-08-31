/**
 * Institutional Performance Budget Monitoring
 * Monitors and reports on performance budgets in real-time
 */

import { getContrastRatio, isContrastCompliant } from './accessibilityUtils';

// ===== PERFORMANCE BUDGET MONITOR =====

class PerformanceBudgetMonitor {
  constructor(budgets = {}) {
    this.budgets = budgets;
    this.metrics = new Map();
    this.violations = new Map();
    this.observers = new Set();

    this.initializeMonitoring();
  }

  // ===== MONITORING INITIALIZATION =====

  initializeMonitoring() {
    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();

    // Monitor bundle sizes
    this.monitorBundleSizes();

    // Monitor loading performance
    this.monitorLoadingPerformance();

    // Monitor accessibility
    this.monitorAccessibility();

    // Monitor resource usage
    this.monitorResourceUsage();

    // Setup periodic reporting
    this.setupPeriodicReporting();
  }

  // ===== CORE WEB VITALS MONITORING =====

  monitorCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];

          this.recordMetric('lcp', lastEntry.startTime, {
            element: lastEntry.element?.tagName,
            url: lastEntry.url,
            size: lastEntry.size
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.recordMetric('fid', entry.processingStart - entry.startTime, {
              eventType: entry.name,
              target: entry.target?.tagName
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver(list => {
          let clsValue = 0;
          const entries = list.getEntries();

          entries.forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });

          this.recordMetric('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // First Contentful Paint (FCP)
        const fcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.recordMetric('fcp', entry.startTime, {
              name: entry.name
            });
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // Interaction to Next Paint (INP)
        const inpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.recordMetric('inp', entry.processingEnd - entry.processingStart, {
              eventType: entry.name,
              target: entry.target?.tagName
            });
          });
        });
        inpObserver.observe({ entryTypes: ['event'] });
      } catch (error) {
        console.warn('Performance monitoring not fully supported:', error);
      }
    }
  }

  // ===== BUNDLE SIZE MONITORING =====

  monitorBundleSizes() {
    // Monitor script loading times
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          if (entry.initiatorType === 'script' || entry.name.includes('.js')) {
            this.recordMetric('script-load', entry.duration, {
              name: entry.name,
              size: entry.transferSize,
              cached: entry.transferSize === 0
            });
          }
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  // ===== LOADING PERFORMANCE MONITORING =====

  monitorLoadingPerformance() {
    // Monitor navigation timing
    if ('performance' in window && 'timing' in window.performance) {
      const timing = window.performance.timing;

      // Time to First Byte (TTFB)
      const ttfb = timing.responseStart - timing.requestStart;
      this.recordMetric('ttfb', ttfb);

      // DOM Content Loaded
      const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      this.recordMetric('dom-content-loaded', domContentLoaded);

      // Page Load Complete
      const pageLoad = timing.loadEventEnd - timing.navigationStart;
      this.recordMetric('page-load', pageLoad);
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          if (entry.duration > 50) {
            // Long task threshold
            this.recordMetric('long-task', entry.duration, {
              startTime: entry.startTime,
              name: entry.name
            });
          }
        });
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
    }
  }

  // ===== ACCESSIBILITY MONITORING =====

  monitorAccessibility() {
    // Monitor contrast ratios (sampled)
    const checkContrastRatios = () => {
      const elements = document.querySelectorAll('*');

      elements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        const color = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;

        if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)') {
          try {
            const ratio = getContrastRatio(color, backgroundColor);

            if (ratio < 3.0) {
              // Below minimum threshold
              this.recordViolation('contrast', {
                element: element.tagName,
                ratio,
                color,
                backgroundColor,
                threshold: 4.5
              });
            }
          } catch (error) {
            // Skip elements with invalid colors
          }
        }
      });
    };

    // Check contrast periodically (not too frequently for performance)
    setInterval(checkContrastRatios, 30000); // Every 30 seconds

    // Monitor keyboard accessibility
    document.addEventListener('keydown', event => {
      if (event.key === 'Tab') {
        this.recordMetric('keyboard-navigation', 1);
      }
    });
  }

  // ===== RESOURCE USAGE MONITORING =====

  monitorResourceUsage() {
    // Monitor memory usage
    if ('memory' in window.performance) {
      setInterval(() => {
        const memory = window.performance.memory;

        this.recordMetric('memory-used', memory.usedJSHeapSize);
        this.recordMetric('memory-total', memory.totalJSHeapSize);
        this.recordMetric('memory-limit', memory.jsHeapSizeLimit);
      }, 10000); // Every 10 seconds
    }

    // Monitor network requests
    if ('PerformanceObserver' in window) {
      const networkObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          if (entry.initiatorType === 'xmlhttprequest' || entry.initiatorType === 'fetch') {
            this.recordMetric('network-request', entry.duration, {
              url: entry.name,
              status: entry.responseStatus || 'unknown',
              size: entry.transferSize
            });
          }
        });
      });

      networkObserver.observe({ entryTypes: ['resource'] });
    }
  }

  // ===== METRICS RECORDING =====

  recordMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name);
    metrics.push(metric);

    // Keep only last 100 metrics per type
    if (metrics.length > 100) {
      metrics.shift();
    }

    // Check budget violation
    this.checkBudgetViolation(name, value, metadata);

    // Notify observers
    this.notifyObservers('metric', metric);
  }

  recordViolation(type, details) {
    const violation = {
      type,
      details,
      timestamp: Date.now()
    };

    if (!this.violations.has(type)) {
      this.violations.set(type, []);
    }

    const violations = this.violations.get(type);
    violations.push(violation);

    // Keep only last 50 violations per type
    if (violations.length > 50) {
      violations.shift();
    }

    // Notify observers
    this.notifyObservers('violation', violation);
  }

  // ===== BUDGET CHECKING =====

  checkBudgetViolation(metricName, value, metadata) {
    const budgets = this.budgets?.performance?.budgets || [];

    budgets.forEach(budget => {
      if (budget.metric === metricName.toUpperCase()) {
        const threshold = budget.budget.value;
        const currentValue = value;

        let violated = false;

        switch (budget.metric) {
          case 'LCP':
          case 'FCP':
          case 'FID':
          case 'INP':
          case 'TTFB':
            violated = currentValue > threshold;
            break;
          case 'CLS':
            violated = currentValue > threshold;
            break;
          default:
            violated = currentValue > threshold;
        }

        if (violated) {
          this.recordViolation('budget', {
            metric: metricName,
            budget: threshold,
            actual: currentValue,
            severity: budget.severity,
            description: budget.description
          });
        }
      }
    });
  }

  // ===== REPORTING =====

  setupPeriodicReporting() {
    // Report every 60 seconds
    setInterval(() => {
      this.generateReport();
    }, 60000);
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalMetrics: this.metrics.size,
        totalViolations: Array.from(this.violations.values()).reduce(
          (sum, arr) => sum + arr.length,
          0
        ),
        period: 'last 60 seconds'
      },
      metrics: {},
      violations: {},
      recommendations: []
    };

    // Aggregate metrics
    this.metrics.forEach((values, name) => {
      if (values.length > 0) {
        const recentValues = values.slice(-10); // Last 10 values
        const avg = recentValues.reduce((sum, m) => sum + m.value, 0) / recentValues.length;
        const max = Math.max(...recentValues.map(m => m.value));
        const min = Math.min(...recentValues.map(m => m.value));

        report.metrics[name] = {
          average: Math.round(avg * 100) / 100,
          max: Math.round(max * 100) / 100,
          min: Math.round(min * 100) / 100,
          count: recentValues.length,
          latest: recentValues[recentValues.length - 1].value
        };
      }
    });

    // Aggregate violations
    this.violations.forEach((values, type) => {
      if (values.length > 0) {
        report.violations[type] = {
          count: values.length,
          latest: values[values.length - 1],
          severity: values[0].severity || 'unknown'
        };
      }
    });

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    // Notify observers
    this.notifyObservers('report', report);

    return report;
  }

  generateRecommendations(report) {
    const recommendations = [];

    // Core Web Vitals recommendations
    if (report.metrics.lcp?.latest > 2500) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Optimize Largest Contentful Paint',
        description:
          'LCP is above 2.5s. Optimize images, remove render-blocking resources, and improve server response time.',
        impact: 'Improves page load speed by up to 30%'
      });
    }

    if (report.metrics.cls?.latest > 0.1) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Fix Layout Shift Issues',
        description:
          'CLS is above 0.1. Reserve space for dynamic content and avoid inserting content above existing content.',
        impact: 'Reduces user experience issues by preventing unexpected layout shifts'
      });
    }

    if (report.metrics.fid?.latest > 100) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Optimize First Input Delay',
        description:
          'FID is above 100ms. Reduce JavaScript execution time and minimize main thread blocking.',
        impact: 'Improves interactivity and user responsiveness'
      });
    }

    // Bundle size recommendations
    if (report.metrics['script-load']?.average > 1000) {
      recommendations.push({
        type: 'bundle',
        priority: 'medium',
        title: 'Optimize Bundle Loading',
        description:
          'Script loading is slow. Consider code splitting, tree shaking, and compression.',
        impact: 'Reduces initial load time by 20-50%'
      });
    }

    // Accessibility recommendations
    if (report.violations.contrast?.count > 0) {
      recommendations.push({
        type: 'accessibility',
        priority: 'high',
        title: 'Fix Color Contrast Issues',
        description: `${report.violations.contrast.count} contrast violations found. Ensure 4.5:1 ratio for normal text.`,
        impact: 'Makes content accessible to users with visual impairments'
      });
    }

    return recommendations;
  }

  // ===== OBSERVER PATTERN =====

  subscribe(callback) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  notifyObservers(event, data) {
    this.observers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in performance observer:', error);
      }
    });
  }

  // ===== UTILITY METHODS =====

  getMetrics(name) {
    return this.metrics.get(name) || [];
  }

  getViolations(type) {
    return this.violations.get(type) || [];
  }

  clearMetrics() {
    this.metrics.clear();
  }

  clearViolations() {
    this.violations.clear();
  }

  exportData() {
    return {
      metrics: Object.fromEntries(this.metrics),
      violations: Object.fromEntries(this.violations),
      budgets: this.budgets
    };
  }
}

// ===== SINGLETON INSTANCE =====

let monitorInstance = null;

export function getPerformanceMonitor(budgets = {}) {
  if (!monitorInstance) {
    monitorInstance = new PerformanceBudgetMonitor(budgets);
  }
  return monitorInstance;
}

// ===== REACT HOOK =====

export function usePerformanceMonitor() {
  const [report, setReport] = React.useState(null);

  React.useEffect(() => {
    const monitor = getPerformanceMonitor();

    const unsubscribe = monitor.subscribe((event, data) => {
      if (event === 'report') {
        setReport(data);
      }
    });

    // Generate initial report
    setTimeout(() => {
      const initialReport = monitor.generateReport();
      setReport(initialReport);
    }, 1000);

    return unsubscribe;
  }, []);

  return report;
}

// ===== UTILITY FUNCTIONS =====

export function measurePerformance(name, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  const monitor = getPerformanceMonitor();
  monitor.recordMetric(`custom-${name}`, end - start);

  return result;
}

export function markPerformance(name) {
  if (typeof window !== 'undefined' && window.performance && window.performance.mark) {
    window.performance.mark(name);
  }
}

export function measurePerformanceBetween(startMark, endMark, name) {
  if (typeof window !== 'undefined' && window.performance && window.performance.measure) {
    try {
      window.performance.measure(name, startMark, endMark);

      const entries = window.performance.getEntriesByName(name);
      if (entries.length > 0) {
        const monitor = getPerformanceMonitor();
        monitor.recordMetric(`measure-${name}`, entries[0].duration);
      }
    } catch (error) {
      console.warn('Performance measurement failed:', error);
    }
  }
}

export default PerformanceBudgetMonitor;
