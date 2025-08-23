// Real User Monitoring, Web Vitals Tracking, and Sentry Performance Integration
// Note: Sentry is dynamically imported to avoid bundle bloat

// Web Vitals metrics tracking
const webVitalsData = {
  CLS: null,
  FID: null,
  FCP: null,
  LCP: null,
  TTFB: null,
  INP: null
};

// Performance observer for tracking metrics
const _performanceEntries = [];
let _performanceObserver;

// Initialize performance monitoring
export function initializePerformanceMonitoring() {
  // Initialize Web Vitals tracking
  initializeWebVitals();

  // Initialize custom performance tracking
  initializeCustomMetrics();

  // Initialize navigation timing
  trackNavigationTiming();

  // Initialize resource timing
  trackResourceTiming();

  // Initialize user interactions
  trackUserInteractions();

  console.log('Performance monitoring initialized');
}

// Web Vitals implementation
function initializeWebVitals() {
  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  const clsEntries = [];

  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        clsEntries.push(entry);
      }
    }
    webVitalsData.CLS = clsValue;
    reportWebVital('CLS', clsValue, clsEntries);
  }).observe({ type: 'layout-shift', buffered: true });

  // First Input Delay (FID) / Interaction to Next Paint (INP)
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      if (entry.name === 'first-input-delay') {
        webVitalsData.FID = entry.processingStart - entry.startTime;
        reportWebVital('FID', webVitalsData.FID, [entry]);
      }

      // Track INP for better user interaction measurement
      if (entry.interactionId) {
        const duration = entry.processingEnd - entry.startTime;
        if (!webVitalsData.INP || duration > webVitalsData.INP) {
          webVitalsData.INP = duration;
          reportWebVital('INP', duration, [entry]);
        }
      }
    }
  }).observe({ type: 'event', buffered: true });

  // First Contentful Paint (FCP)
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        webVitalsData.FCP = entry.startTime;
        reportWebVital('FCP', entry.startTime, [entry]);
      }
    }
  }).observe({ type: 'paint', buffered: true });

  // Largest Contentful Paint (LCP)
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    webVitalsData.LCP = lastEntry.startTime;
    reportWebVital('LCP', lastEntry.startTime, [lastEntry]);
  }).observe({ type: 'largest-contentful-paint', buffered: true });

  // Time to First Byte (TTFB)
  const navigationEntry = performance.getEntriesByType('navigation')[0];
  if (navigationEntry) {
    webVitalsData.TTFB = navigationEntry.responseStart - navigationEntry.requestStart;
    reportWebVital('TTFB', webVitalsData.TTFB, [navigationEntry]);
  }
}

// Custom metrics for financial application
function initializeCustomMetrics() {
  // Track when critical financial components load
  const criticalComponents = [
    'financial-spreadsheet',
    'dcf-calculator',
    'chart-rendering',
    'market-data-fetch'
  ];

  criticalComponents.forEach(component => {
    performance.mark(`${component}-start`);
  });

  // Track component rendering times
  window.trackComponentRender = (componentName, renderTime) => {
    performance.mark(`${componentName}-end`);
    performance.measure(
      `${componentName}-render`,
      `${componentName}-start`,
      `${componentName}-end`
    );

    reportCustomMetric('component-render', {
      component: componentName,
      renderTime,
      timestamp: Date.now()
    });
  };

  // Track financial calculation performance
  window.trackCalculationPerformance = (calculationType, duration, complexity) => {
    reportCustomMetric('financial-calculation', {
      type: calculationType,
      duration,
      complexity,
      timestamp: Date.now()
    });
  };
}

// Navigation timing tracking
function trackNavigationTiming() {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        const timings = {
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          ssl: navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
          ttfb: navigation.responseStart - navigation.requestStart,
          download: navigation.responseEnd - navigation.responseStart,
          domProcessing: navigation.domComplete - navigation.domLoading,
          totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
        };

        reportNavigationTiming(timings);
      }
    }, 0);
  });
}

// Resource timing tracking
function trackResourceTiming() {
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // Track important resource types
      if (entry.initiatorType === 'script' ||
          entry.initiatorType === 'css' ||
          entry.initiatorType === 'img' ||
          entry.initiatorType === 'fetch') {

        const resourceData = {
          name: entry.name,
          type: entry.initiatorType,
          size: entry.transferSize || entry.encodedBodySize,
          duration: entry.duration,
          cached: entry.transferSize === 0 && entry.encodedBodySize > 0,
          timestamp: Date.now()
        };

        // Only report large resources or slow loads
        if (resourceData.size > 50000 || resourceData.duration > 1000) {
          reportResourceTiming(resourceData);
        }
      }
    }
  }).observe({ entryTypes: ['resource'] });
}

// User interaction tracking
function trackUserInteractions() {
  let interactionCount = 0;
  let totalInteractionTime = 0;

  const interactionEvents = ['click', 'keydown', 'touchstart'];

  interactionEvents.forEach(eventType => {
    document.addEventListener(eventType, (event) => {
      const startTime = performance.now();

      // Track interaction delay
      requestAnimationFrame(() => {
        const endTime = performance.now();
        const interactionTime = endTime - startTime;

        interactionCount++;
        totalInteractionTime += interactionTime;

        // Report slow interactions
        if (interactionTime > 100) {
          reportSlowInteraction({
            type: eventType,
            target: event.target.tagName,
            duration: interactionTime,
            timestamp: Date.now()
          });
        }
      });
    }, { passive: true });
  });

  // Report interaction summary periodically
  setInterval(() => {
    if (interactionCount > 0) {
      reportInteractionSummary({
        count: interactionCount,
        averageTime: totalInteractionTime / interactionCount,
        timestamp: Date.now()
      });

      // Reset counters
      interactionCount = 0;
      totalInteractionTime = 0;
    }
  }, 30000); // Every 30 seconds
}

// Reporting functions
function reportWebVital(name, value, entries) {
  const data = {
    metric: name,
    value: Math.round(value),
    entries: entries.map(entry => ({
      startTime: entry.startTime,
      duration: entry.duration || 0
    })),
    url: window.location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    connection: getConnectionInfo()
  };

  console.log(`Web Vital - ${name}:`, value);

  // Send to Sentry Performance if available
  if (window.Sentry) {
    window.Sentry.addBreadcrumb({
      category: 'performance',
      message: `Web Vital ${name}: ${Math.round(value)}`,
      level: value > getPerformanceThreshold(name) ? 'warning' : 'info',
      data: { metric: name, value: Math.round(value) }
    });

    // Report as Sentry measurement
    window.Sentry.setMeasurement(name, Math.round(value), name === 'CLS' ? '' : 'millisecond');
  }

  sendToAnalytics('web-vital', data);
}

function reportCustomMetric(type, data) {
  const metricData = {
    type,
    ...data,
    url: window.location.href,
    userAgent: navigator.userAgent
  };

  console.log(`Custom Metric - ${type}:`, data);
  sendToAnalytics('custom-metric', metricData);
}

function reportNavigationTiming(timings) {
  const data = {
    ...timings,
    url: window.location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    connection: getConnectionInfo()
  };

  console.log('Navigation Timing:', timings);
  sendToAnalytics('navigation-timing', data);
}

function reportResourceTiming(resourceData) {
  console.log('Resource Timing:', resourceData);
  sendToAnalytics('resource-timing', resourceData);
}

function reportSlowInteraction(interactionData) {
  console.log('Slow Interaction:', interactionData);
  sendToAnalytics('slow-interaction', interactionData);
}

function reportInteractionSummary(summaryData) {
  console.log('Interaction Summary:', summaryData);
  sendToAnalytics('interaction-summary', summaryData);
}

// Error tracking
export function trackError(error, errorInfo) {
  const errorData = {
    message: error.message,
    stack: error.stack,
    url: window.location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    componentStack: errorInfo?.componentStack,
    errorBoundary: errorInfo?.errorBoundary
  };

  console.error('Application Error:', errorData);
  sendToAnalytics('error', errorData);
}

// Performance budget monitoring
export function checkPerformanceBudgets() {
  const budgets = {
    LCP: 2500,  // 2.5s
    FID: 100,   // 100ms
    CLS: 0.1,   // 0.1
    FCP: 1800,  // 1.8s
    TTFB: 800   // 800ms
  };

  const violations = [];

  Object.entries(budgets).forEach(([metric, budget]) => {
    const value = webVitalsData[metric];
    if (value !== null && value > budget) {
      violations.push({
        metric,
        value,
        budget,
        overBy: value - budget
      });
    }
  });

  if (violations.length > 0) {
    console.warn('Performance Budget Violations:', violations);
    sendToAnalytics('budget-violations', {
      violations,
      timestamp: Date.now(),
      url: window.location.href
    });
  }

  return violations;
}

// Utility functions
function getPerformanceThreshold(metricName) {
  const thresholds = {
    LCP: 2500,  // 2.5s
    FID: 100,   // 100ms
    CLS: 0.1,   // 0.1
    FCP: 1800,  // 1.8s
    TTFB: 800,  // 800ms
    INP: 200    // 200ms
  };
  return thresholds[metricName] || 1000;
}

function getConnectionInfo() {
  if ('connection' in navigator) {
    return {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    };
  }
  return null;
}

function sendToAnalytics(type, data) {
  // In production, send to your analytics service
  // For now, we'll store locally and batch send

  try {
    const analyticsData = {
      type,
      data,
      sessionId: getSessionId(),
      userId: getUserId()
    };

    // Store in localStorage for batching
    const existingData = JSON.parse(localStorage.getItem('analytics-queue') || '[]');
    existingData.push(analyticsData);

    // Keep only last 100 entries to prevent storage overflow
    if (existingData.length > 100) {
      existingData.splice(0, existingData.length - 100);
    }

    localStorage.setItem('analytics-queue', JSON.stringify(existingData));

    // Send batch if queue is full or on interval
    if (existingData.length >= 10) {
      sendAnalyticsBatch();
    }

  } catch (error) {
    console.error('Failed to queue analytics data:', error);
  }
}

function sendAnalyticsBatch() {
  try {
    const queuedData = JSON.parse(localStorage.getItem('analytics-queue') || '[]');
    if (queuedData.length === 0) return;

    // In production, replace with your analytics endpoint
    console.log('Sending analytics batch:', queuedData.length, 'items');

    // Simulate sending to analytics service
    if (window.gtag) {
      queuedData.forEach(item => {
        window.gtag('event', item.type, {
          custom_parameter: JSON.stringify(item.data)
        });
      });
    }

    // Clear queue after successful send
    localStorage.removeItem('analytics-queue');

  } catch (error) {
    console.error('Failed to send analytics batch:', error);
  }
}

// Session and user management
function getSessionId() {
  let sessionId = sessionStorage.getItem('session-id');
  if (!sessionId) {
    sessionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('session-id', sessionId);
  }
  return sessionId;
}

function getUserId() {
  let userId = localStorage.getItem('user-id');
  if (!userId) {
    userId = 'anonymous-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('user-id', userId);
  }
  return userId;
}

// Initialize batch sending on interval
setInterval(sendAnalyticsBatch, 60000); // Every minute

// Send batch before page unload
window.addEventListener('beforeunload', () => {
  sendAnalyticsBatch();
});

// Accessibility metrics reporting
export function reportPerformanceMetric(type, data) {
  const metricData = {
    type,
    ...data,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now()
  };

  console.log(`Performance Metric - ${type}:`, data);
  sendToAnalytics('performance-metric', metricData);
}

// Track accessibility test results
export function trackAccessibilityResults(results) {
  const accessibilityData = {
    violations: results.violations?.length || 0,
    passes: results.passes?.length || 0,
    incomplete: results.incomplete?.length || 0,
    score: results.score || 0,
    url: window.location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  };

  console.log('Accessibility Results:', accessibilityData);
  sendToAnalytics('accessibility-results', accessibilityData);

  // Store accessibility history
  try {
    const history = JSON.parse(localStorage.getItem('accessibility-history') || '[]');
    history.push(accessibilityData);

    // Keep only last 50 entries
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }

    localStorage.setItem('accessibility-history', JSON.stringify(history));
  } catch (error) {
    console.error('Failed to store accessibility history:', error);
  }
}

// Track financial component performance
export function trackFinancialComponentPerformance(componentName, metrics) {
  const performanceData = {
    component: componentName,
    ...metrics,
    url: window.location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  };

  console.log(`Financial Component Performance - ${componentName}:`, metrics);
  sendToAnalytics('financial-component-performance', performanceData);
}

// Get comprehensive performance dashboard data
export function getPerformanceDashboardData() {
  const accessibilityHistory = JSON.parse(localStorage.getItem('accessibility-history') || '[]');
  const analyticsQueue = JSON.parse(localStorage.getItem('analytics-queue') || '[]');

  // Calculate trends
  const recentAccessibility = accessibilityHistory.slice(-10);
  const avgScore = recentAccessibility.reduce((sum, entry) => sum + entry.score, 0) / recentAccessibility.length || 0;
  const avgViolations = recentAccessibility.reduce((sum, entry) => sum + entry.violations, 0) / recentAccessibility.length || 0;

  // Get performance metrics from queue
  const performanceMetrics = analyticsQueue
    .filter(item => item.type === 'performance-metric')
    .slice(-20)
    .map(item => item.data);

  const webVitalMetrics = analyticsQueue
    .filter(item => item.type === 'web-vital')
    .slice(-10)
    .map(item => item.data);

  return {
    webVitals: webVitalsData,
    budgetViolations: checkPerformanceBudgets(),
    accessibility: {
      currentScore: recentAccessibility[recentAccessibility.length - 1]?.score || 0,
      averageScore: Math.round(avgScore),
      averageViolations: Math.round(avgViolations),
      history: recentAccessibility,
      trends: {
        scoreImproving: recentAccessibility.length >= 2 &&
          recentAccessibility[recentAccessibility.length - 1].score >
          recentAccessibility[recentAccessibility.length - 2].score
      }
    },
    performance: {
      recentMetrics: performanceMetrics,
      webVitalHistory: webVitalMetrics
    },
    timestamp: Date.now()
  };
}

// Export current performance data
export function getPerformanceData() {
  return {
    webVitals: webVitalsData,
    budgetViolations: checkPerformanceBudgets(),
    timestamp: Date.now()
  };
}
