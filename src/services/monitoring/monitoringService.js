// Comprehensive Monitoring and Observability Service
// Provides real-time metrics, logging, error tracking, and performance monitoring
class MonitoringService {
  constructor() {
    this.metrics = new Map();
    this.performanceMarks = new Map();
    this.errorQueue = [];
    this.isInitialized = false;

    // Monitoring configuration
    this.config = {
      enableMetrics: true,
      enablePerformance: true,
      enableErrorTracking: true,
      enableUserTracking: true,
      metricsInterval: 60000, // 1 minute
      performanceThresholds: {
        fcp: 2000, // First Contentful Paint
        lcp: 2500, // Largest Contentful Paint
        fid: 100, // First Input Delay
        cls: 0.1 // Cumulative Layout Shift
      },
      errorSampling: 0.1, // 10% error sampling
      userSampling: 0.01 // 1% user tracking sampling
    };

    // Initialize monitoring
    this.initialize();
  }

  // Initialize monitoring services
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize performance observer
      if (this.config.enablePerformance && typeof window !== 'undefined') {
        this.initializePerformanceObserver();
      }

      // Initialize error tracking
      if (this.config.enableErrorTracking) {
        this.initializeErrorTracking();
      }

      // Initialize user tracking
      if (this.config.enableUserTracking) {
        this.initializeUserTracking();
      }

      // Start metrics collection
      if (this.config.enableMetrics) {
        this.startMetricsCollection();
      }

      this.isInitialized = true;
      console.log('🔍 Monitoring service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize monitoring service:', error);
    }
  }

  // Performance Monitoring
  initializePerformanceObserver() {
    try {
      // Web Vitals tracking
      if ('web-vitals' in window) {
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getCLS(this.trackWebVital.bind(this));
          getFID(this.trackWebVital.bind(this));
          getFCP(this.trackWebVital.bind(this));
          getLCP(this.trackWebVital.bind(this));
          getTTFB(this.trackWebVital.bind(this));
        });
      }

      // Performance observer for navigation and resources
      if ('PerformanceObserver' in window) {
        // Navigation timing
        const navObserver = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            this.trackPerformance('navigation', {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart
            });
          });
        });
        navObserver.observe({ type: 'navigation', buffered: true });

        // Resource timing
        const resourceObserver = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            if (entry.duration > 1000) {
              // Only track slow resources
              this.trackPerformance('resource', {
                name: entry.name,
                duration: entry.duration,
                size: entry.transferSize,
                type: entry.initiatorType
              });
            }
          });
        });
        resourceObserver.observe({ type: 'resource', buffered: true });

        // Long tasks
        const longTaskObserver = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            this.trackPerformance('longtask', {
              duration: entry.duration,
              startTime: entry.startTime,
              attribution: entry.attribution
            });
          });
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });
      }
    } catch (error) {
      console.error('❌ Failed to initialize performance observer:', error);
    }
  }

  // Track Web Vitals
  trackWebVital({ name, value, id }) {
    const vital = {
      name,
      value: Math.round(value),
      id,
      timestamp: Date.now(),
      url: window.location.href
    };

    this.trackPerformance('web-vital', vital);

    // Alert on poor performance
    const threshold = this.config.performanceThresholds[name.toLowerCase()];
    if (threshold && value > threshold) {
      this.alert('performance', {
        type: 'web-vital-threshold-exceeded',
        vital: name,
        value,
        threshold,
        url: window.location.href
      });
    }
  }

  // Error Tracking
  initializeErrorTracking() {
    // Global error handler
    window.addEventListener('error', event => {
      this.trackError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', event => {
      this.trackError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: Date.now()
      });
    });

    // React error boundary integration
    this.setupReactErrorBoundary();
  }

  setupReactErrorBoundary() {
    // Store original console methods
    const originalError = console.error;

    console.error = (...args) => {
      // Check if it's a React error
      if (
        args[0]?.includes?.('Warning: ReactDOM.render is no longer supported') ||
        args[0]?.includes?.('Warning: Each child in a list should have a unique')
      ) {
        return; // Ignore common React warnings
      }

      // Track React errors
      if (args[0]?.includes?.('Error:') || args[0]?.includes?.('Warning:')) {
        this.trackError({
          type: 'react',
          message: args.join(' '),
          stack: new Error().stack,
          url: window.location.href,
          timestamp: Date.now()
        });
      }

      originalError.apply(console, args);
    };
  }

  // User Tracking and Analytics
  initializeUserTracking() {
    // Page view tracking
    this.trackPageView();

    // User interaction tracking
    this.trackUserInteractions();

    // Session tracking
    this.trackSession();
  }

  trackPageView() {
    const pageView = {
      url: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`
    };

    this.trackEvent('page_view', pageView);
  }

  trackUserInteractions() {
    let interactionCount = 0;
    const maxInteractions = 100; // Limit tracking to prevent performance issues

    const trackInteraction = event => {
      if (interactionCount >= maxInteractions) return;

      const interaction = {
        type: event.type,
        target: event.target?.tagName?.toLowerCase(),
        timestamp: Date.now(),
        url: window.location.href
      };

      this.trackEvent('user_interaction', interaction);
      interactionCount++;
    };

    // Track clicks
    document.addEventListener('click', trackInteraction, { passive: true });

    // Track form submissions
    document.addEventListener(
      'submit',
      event => {
        trackInteraction(event);
        this.trackEvent('form_submission', {
          formId: event.target.id || event.target.name,
          timestamp: Date.now(),
          url: window.location.href
        });
      },
      { passive: true }
    );
  }

  trackSession() {
    const sessionId = this.getOrCreateSessionId();
    const sessionStart = Date.now();

    // Track session start
    this.trackEvent('session_start', {
      sessionId,
      timestamp: sessionStart,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    });

    // Track session end on page unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('session_end', {
        sessionId,
        duration: Date.now() - sessionStart,
        timestamp: Date.now()
      });
    });

    // Track session activity
    let lastActivity = Date.now();
    const activityEvents = ['click', 'scroll', 'keydown', 'mousemove'];

    activityEvents.forEach(eventType => {
      document.addEventListener(
        eventType,
        () => {
          lastActivity = Date.now();
        },
        { passive: true }
      );
    });

    // Check for inactivity every minute
    setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      if (inactiveTime > 30 * 60 * 1000) {
        // 30 minutes
        this.trackEvent('session_inactive', {
          sessionId,
          inactiveTime,
          timestamp: Date.now()
        });
      }
    }, 60000);
  }

  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('fa_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('fa_session_id', sessionId);
    }
    return sessionId;
  }

  // Metrics Collection
  startMetricsCollection() {
    // Collect system metrics every minute
    setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.metricsInterval);

    // Collect application metrics
    setInterval(() => {
      this.collectApplicationMetrics();
    }, this.config.metricsInterval);
  }

  collectSystemMetrics() {
    if (typeof window === 'undefined') return;

    const metrics = {
      timestamp: Date.now(),
      memory: {
        used: performance.memory?.usedJSHeapSize,
        total: performance.memory?.totalJSHeapSize,
        limit: performance.memory?.jsHeapSizeLimit
      },
      timing: {
        navigationStart: performance.timing?.navigationStart,
        loadEventEnd: performance.timing?.loadEventEnd,
        domContentLoaded: performance.timing?.domContentLoadedEventEnd
      },
      connection: {
        effectiveType: navigator.connection?.effectiveType,
        downlink: navigator.connection?.downlink,
        rtt: navigator.connection?.rtt
      }
    };

    this.trackMetric('system', metrics);
  }

  collectApplicationMetrics() {
    const metrics = {
      timestamp: Date.now(),
      reactVersion: window.React?.version,
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };

    this.trackMetric('application', metrics);
  }

  // Core Tracking Methods
  trackError(error) {
    // Sample errors based on configuration
    if (Math.random() > this.config.errorSampling) return;

    const enrichedError = {
      ...error,
      sessionId: this.getOrCreateSessionId(),
      userId: this.getUserId(),
      environment: process.env.NODE_ENV || 'production'
    };

    this.errorQueue.push(enrichedError);

    // Send errors in batches
    if (this.errorQueue.length >= 10) {
      this.flushErrors();
    }

    // Immediate alerting for critical errors
    if (this.isCriticalError(error)) {
      this.alert('error', enrichedError);
    }
  }

  trackPerformance(type, data) {
    const performanceData = {
      ...data,
      type,
      sessionId: this.getOrCreateSessionId(),
      userId: this.getUserId(),
      timestamp: Date.now()
    };

    this.trackEvent('performance', performanceData);
  }

  trackEvent(eventType, data) {
    const event = {
      type: eventType,
      data,
      timestamp: Date.now(),
      sessionId: this.getOrCreateSessionId(),
      userId: this.getUserId()
    };

    // Send to monitoring backend
    this.sendToBackend('/api/monitoring/events', event);
  }

  trackMetric(metricType, data) {
    const metric = {
      type: metricType,
      data,
      timestamp: Date.now(),
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
    };

    this.metrics.set(`${metricType}_${Date.now()}`, metric);

    // Send to monitoring backend
    this.sendToBackend('/api/monitoring/metrics', metric);
  }

  // Alerting System
  alert(type, data) {
    const alert = {
      type,
      data,
      timestamp: Date.now(),
      severity: this.calculateSeverity(type, data),
      environment: process.env.NODE_ENV || 'production'
    };

    // Send alert to monitoring backend
    this.sendToBackend('/api/monitoring/alerts', alert);

    // Log alert locally
    console.warn('🚨 Alert triggered:', alert);
  }

  calculateSeverity(type, data) {
    switch (type) {
      case 'error':
        if (data.type === 'javascript' && data.message?.includes('TypeError')) {
          return 'high';
        }
        return 'medium';
      case 'performance':
        if (data.type === 'web-vital' && data.value > 5000) {
          return 'high';
        }
        return 'medium';
      default:
        return 'low';
    }
  }

  isCriticalError(error) {
    return (
      error.type === 'javascript' &&
      (error.message?.includes('TypeError') || error.message?.includes('ReferenceError'))
    );
  }

  // API Communication
  async sendToBackend(endpoint, data) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        console.warn('Failed to send monitoring data:', response.status);
      }
    } catch (error) {
      // Silently fail to avoid monitoring loops
      console.debug('Monitoring API error:', error);
    }
  }

  // Error batching
  flushErrors() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    this.sendToBackend('/api/monitoring/errors', { errors });
  }

  // User identification
  getUserId() {
    // In a real application, this would get the authenticated user ID
    return localStorage.getItem('fa_user_id') || 'anonymous';
  }

  // Performance marks and measures
  mark(name) {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
      this.performanceMarks.set(name, Date.now());
    }
  }

  measure(name, startMark, endMark) {
    if (typeof performance !== 'undefined') {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];

        this.trackPerformance('measure', {
          name,
          duration: measure.duration,
          startTime: measure.startTime
        });
      } catch (error) {
        console.warn('Performance measure error:', error);
      }
    }
  }

  // Public API
  startTransaction(name) {
    this.mark(`${name}_start`);
    return {
      end: () => {
        this.mark(`${name}_end`);
        this.measure(name, `${name}_start`, `${name}_end`);
      }
    };
  }

  // Cleanup
  destroy() {
    // Flush any remaining errors
    this.flushErrors();

    // Clear intervals
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.isInitialized = false;
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

// Export for use in components
export default monitoringService;

// Export class for testing
export { MonitoringService };

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  window.monitoringService = monitoringService;
}
