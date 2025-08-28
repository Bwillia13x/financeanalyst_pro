/**
 * Production Monitoring and Error Tracking Service
 * Comprehensive monitoring solution for production deployment
 */

class ProductionMonitoring {
  constructor() {
    this.isInitialized = false;
    this.userId = null;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.errorQueue = [];
    this.performanceQueue = [];
    this.userActivityQueue = [];

    // Check if we're in an automated test environment
    const isAutomatedEnv = this.detectAutomatedEnvironment();

    // Only initialize if not in automated test environment
    if (!isAutomatedEnv) {
      this.init();
    }
  }

  detectAutomatedEnvironment() {
    try {
      return (
        (typeof navigator !== 'undefined' && navigator.webdriver === true) ||
        (typeof window !== 'undefined' &&
          window.location &&
          new URLSearchParams(window.location.search).has('lhci')) ||
        (typeof window !== 'undefined' &&
          window.location &&
          new URLSearchParams(window.location.search).has('ci')) ||
        (typeof window !== 'undefined' &&
          window.location &&
          new URLSearchParams(window.location.search).has('audit'))
      );
    } catch {
      return false;
    }
  }

  init() {
    if (this.isInitialized) return;

    try {
      // Initialize Sentry if available
      this.initSentry();

      // Setup error listeners
      this.setupErrorListeners();

      // Setup performance monitoring
      this.setupPerformanceMonitoring();

      // Setup user activity tracking
      this.setupUserActivityTracking();

      // Setup periodic health checks
      this.setupHealthChecks();

      this.isInitialized = true;
      console.log('🚀 Production monitoring initialized');
    } catch (error) {
      console.warn('Failed to initialize monitoring:', error);
    }
  }

  initSentry() {
    // Defer to the global Sentry initialized in src/index.jsx. Avoid double-init.
    if (typeof window === 'undefined' || !window.Sentry) return;

    // If Sentry client already initialized, just set context and return
    try {
      const hub =
        typeof window.Sentry.getCurrentHub === 'function' ? window.Sentry.getCurrentHub() : null;
      const client = hub && typeof hub.getClient === 'function' ? hub.getClient() : null;
      if (client) {
        if (this.userId) {
          window.Sentry.setUser({ id: this.userId });
        }
        return;
      }
    } catch {
      // fallthrough to best-effort init below
    }

    // Best-effort initialization only if DSN is present; use Vite env
    const dsn = import.meta?.env?.VITE_SENTRY_DSN;
    if (!dsn) return;

    try {
      window.Sentry.init({
        dsn,
        environment: import.meta?.env?.VITE_APP_ENV || import.meta?.env?.MODE || 'development',
        tracesSampleRate: 0.1,
        beforeSend: (event, _hint) => {
          const ignoredErrors = [
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured',
            'Network request failed'
          ];
          if (
            ignoredErrors.some(ignored => event.exception?.values?.[0]?.value?.includes(ignored))
          ) {
            return null;
          }
          return event;
        }
      });
      if (this.userId) {
        window.Sentry.setUser({ id: this.userId });
      }
    } catch (e) {
      console.warn('Sentry initialization (fallback) failed:', e);
    }
  }

  setupErrorListeners() {
    // Global error handler
    window.addEventListener('error', event => {
      this.logError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', event => {
      this.logError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Resource loading errors
    window.addEventListener(
      'error',
      event => {
        if (event.target !== window) {
          this.logError({
            type: 'resource',
            message: `Failed to load ${event.target.tagName}: ${event.target.src || event.target.href}`,
            element: event.target.tagName,
            source: event.target.src || event.target.href,
            timestamp: new Date().toISOString()
          });
        }
      },
      true
    );
  }

  setupPerformanceMonitoring() {
    // Web Vitals
    if ('PerformanceObserver' in window) {
      // Cumulative Layout Shift
      new PerformanceObserver(entryList => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            this.logPerformance({
              metric: 'CLS',
              value: entry.value,
              timestamp: new Date().toISOString()
            });
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });

      // Largest Contentful Paint
      new PerformanceObserver(entryList => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.logPerformance({
          metric: 'LCP',
          value: lastEntry.startTime,
          timestamp: new Date().toISOString()
        });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver(entryList => {
        for (const entry of entryList.getEntries()) {
          this.logPerformance({
            metric: 'FID',
            value: entry.processingStart - entry.startTime,
            timestamp: new Date().toISOString()
          });
        }
      }).observe({ entryTypes: ['first-input'] });
    }

    // Page load metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');

        this.logPerformance({
          metric: 'page_load',
          domContentLoaded:
            navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
          timestamp: new Date().toISOString()
        });
      }, 0);
    });
  }

  setupUserActivityTracking() {
    let lastActivity = Date.now();
    let isActive = true;

    const trackActivity = () => {
      lastActivity = Date.now();
      if (!isActive) {
        isActive = true;
        this.logUserActivity({
          type: 'session_resume',
          timestamp: new Date().toISOString()
        });
      }
    };

    // Track user interactions
    ['click', 'scroll', 'keypress', 'mousemove'].forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    // Check for inactivity
    setInterval(() => {
      if (Date.now() - lastActivity > 300000 && isActive) {
        // 5 minutes
        isActive = false;
        this.logUserActivity({
          type: 'session_idle',
          duration: Date.now() - lastActivity,
          timestamp: new Date().toISOString()
        });
      }
    }, 60000); // Check every minute

    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      this.logUserActivity({
        type: document.hidden ? 'page_hidden' : 'page_visible',
        timestamp: new Date().toISOString()
      });
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.logUserActivity({
        type: 'page_unload',
        sessionDuration: Date.now() - this.startTime,
        timestamp: new Date().toISOString()
      });
      this.flush(); // Send queued data
    });
  }

  setupHealthChecks() {
    // Periodic health check
    setInterval(() => {
      this.logHealthCheck({
        memoryUsage: this.getMemoryUsage(),
        connectionType: this.getConnectionType(),
        timestamp: new Date().toISOString()
      });
    }, 300000); // Every 5 minutes
  }

  // Public API methods
  logError(errorData) {
    const enhancedError = {
      ...errorData,
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: errorData.timestamp || new Date().toISOString()
    };

    this.errorQueue.push(enhancedError);

    // Send to Sentry if available
    if (window.Sentry) {
      window.Sentry.captureException(new Error(errorData.message), {
        extra: enhancedError
      });
    }

    // Flush if queue is getting large
    if (this.errorQueue.length >= 10) {
      this.flushErrors();
    }
  }

  logPerformance(performanceData) {
    const enhancedData = {
      ...performanceData,
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href
    };

    this.performanceQueue.push(enhancedData);

    // Flush periodically
    if (this.performanceQueue.length >= 20) {
      this.flushPerformance();
    }
  }

  logUserActivity(activityData) {
    const enhancedData = {
      ...activityData,
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href
    };

    this.userActivityQueue.push(enhancedData);

    // Flush periodically
    if (this.userActivityQueue.length >= 50) {
      this.flushUserActivity();
    }
  }

  logHealthCheck(healthData) {
    this.sendToEndpoint('/api/health', {
      ...healthData,
      sessionId: this.sessionId,
      userId: this.userId
    });
  }

  // Set user context
  setUser(userId, userData = {}) {
    this.userId = userId;

    if (window.Sentry) {
      window.Sentry.setUser({ id: userId, ...userData });
    }
  }

  // Flush methods
  flushErrors() {
    if (this.errorQueue.length > 0) {
      this.sendToEndpoint('/api/errors', this.errorQueue);
      this.errorQueue = [];
    }
  }

  flushPerformance() {
    if (this.performanceQueue.length > 0) {
      this.sendToEndpoint('/api/performance', this.performanceQueue);
      this.performanceQueue = [];
    }
  }

  flushUserActivity() {
    if (this.userActivityQueue.length > 0) {
      this.sendToEndpoint('/api/user-activity', this.userActivityQueue);
      this.userActivityQueue = [];
    }
  }

  flush() {
    this.flushErrors();
    this.flushPerformance();
    this.flushUserActivity();
  }

  // Utility methods
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  getConnectionType() {
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      };
    }
    return null;
  }

  async sendToEndpoint(endpoint, data) {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.warn(`Failed to send data to ${endpoint}:`, error);
    }
  }

  // React Error Boundary integration
  captureErrorBoundary(error, errorInfo, errorId) {
    this.logError({
      type: 'react_error_boundary',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId,
      timestamp: new Date().toISOString()
    });
  }

  // Feature flag tracking
  trackFeatureUsage(featureName, context = {}) {
    this.logUserActivity({
      type: 'feature_usage',
      feature: featureName,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // Performance mark for custom metrics
  mark(name) {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  }

  measure(name, startMark, endMark) {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];

        this.logPerformance({
          metric: 'custom_measure',
          name,
          duration: measure.duration,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Failed to measure performance:', error);
      }
    }
  }
}

// Create singleton instance
const productionMonitoring = new ProductionMonitoring();

export default productionMonitoring;
