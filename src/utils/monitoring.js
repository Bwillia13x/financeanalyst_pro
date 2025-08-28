/**
 * Production Monitoring and Analytics Utilities
 * Handles error tracking, performance monitoring, and user analytics
 */

class MonitoringService {
  constructor() {
    this.isProduction = import.meta.env.VITE_APP_ENV === 'production';
    this.enableAnalytics = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
    this.enableErrorReporting = import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true';
    this.enablePerformanceMonitoring = import.meta.env.VITE_PERFORMANCE_MONITORING === 'true';
    this.gaTrackingId = null;
    this.hotjarLoaded = false;
    this.isInitialized = false;
    // Detect test mode (Vitest/Jest) to avoid initializing monitoring in tests
    this.isTestMode =
      import.meta?.env?.MODE === 'test' ||
      (typeof process !== 'undefined' && (process.env?.VITEST || process.env?.NODE_ENV === 'test'));

    // Check if we're in an automated test environment
    const isAutomatedEnv = this.detectAutomatedEnvironment();

    // Only initialize monitoring if not automated, not in test mode, and browser APIs are present
    if (
      !isAutomatedEnv &&
      !this.isTestMode &&
      typeof window !== 'undefined' &&
      typeof document !== 'undefined'
    ) {
      this.initializeMonitoring();
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

  /**
   * Initialize all monitoring services
   */
  initializeMonitoring() {
    if (this.isInitialized) return;

    try {
      if (this.enableErrorReporting) {
        this.initializeSentry();
      }

      if (this.enableAnalytics) {
        this.initializeGoogleAnalytics();
        this.initializeHotjar();
      }

      if (this.enablePerformanceMonitoring) {
        this.initializePerformanceMonitoring();
      }

      this.setupGlobalErrorHandlers();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize monitoring:', error);
    }
  }

  /**
   * Initialize Sentry for error tracking
   */
  initializeSentry() {
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    if (!sentryDsn) return;

    // Dynamically import Sentry to avoid bundle bloat
    import('@sentry/browser')
      .then(async Sentry => {
        const integrations = [];

        Sentry.init({
          dsn: sentryDsn,
          environment: import.meta.env.VITE_APP_ENV,
          release: import.meta.env.VITE_APP_VERSION,
          integrations,
          tracesSampleRate: this.isProduction ? 0.1 : 1.0,
          beforeSend: event => {
            // Filter out non-critical errors in production
            if (this.isProduction && event.level === 'warning') {
              return null;
            }
            return event;
          }
        });

        Sentry.configureScope(scope => {
          scope.setTag('component', 'financeanalyst-pro');
          scope.setContext('app', {
            version: import.meta.env.VITE_APP_VERSION,
            environment: import.meta.env.VITE_APP_ENV
          });
        });

        // Expose globally for cases that call window.Sentry
        window.Sentry = Sentry;
      })
      .catch(console.warn);
  }

  /**
   * Initialize Google Analytics
   */
  initializeGoogleAnalytics() {
    const gaTrackingId = import.meta.env.VITE_GA_TRACKING_ID;
    if (!gaTrackingId) return;
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', gaTrackingId, {
      page_title: document.title,
      page_location: window.location.href
    });

    // store for route-change pageview updates
    this.gaTrackingId = gaTrackingId;
  }

  /**
   * Initialize Hotjar for user behavior analytics
   */
  initializeHotjar() {
    const hotjarId = import.meta.env.VITE_HOTJAR_ID;
    if (!hotjarId) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    (function (h, o, t, j, a, r) {
      h.hj =
        h.hj ||
        function () {
          (h.hj.q = h.hj.q || []).push(arguments);
        };
      h._hjSettings = { hjid: hotjarId, hjsv: 6 };
      a = o.getElementsByTagName('head')[0];
      r = o.createElement('script');
      r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');

    this.hotjarLoaded = true;
  }

  /**
   * Initialize performance monitoring
   */
  initializePerformanceMonitoring() {
    // Core Web Vitals monitoring
    this.monitorCoreWebVitals();

    // Custom performance metrics
    this.monitorCustomMetrics();

    // Resource loading monitoring
    this.monitorResourceLoading();
  }

  /**
   * Monitor Core Web Vitals
   */
  monitorCoreWebVitals() {
    // Dynamically import web-vitals library
    import('web-vitals')
      .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(this.sendToAnalytics.bind(this));
        getFID(this.sendToAnalytics.bind(this));
        getFCP(this.sendToAnalytics.bind(this));
        getLCP(this.sendToAnalytics.bind(this));
        getTTFB(this.sendToAnalytics.bind(this));
      })
      .catch(console.warn);
  }

  /**
   * Monitor custom performance metrics
   */
  monitorCustomMetrics() {
    // Monitor API response times
    this.monitorApiPerformance();

    // Monitor component render times
    this.monitorComponentPerformance();

    // Monitor memory usage
    this.monitorMemoryUsage();
  }

  /**
   * Monitor API performance
   */
  monitorApiPerformance() {
    if (typeof window === 'undefined' || !window.fetch) return;
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();

        this.trackEvent('api_performance', {
          url: args[0],
          duration: endTime - startTime,
          status: response.status,
          success: response.ok
        });

        return response;
      } catch (error) {
        const endTime = performance.now();

        this.trackEvent('api_error', {
          url: args[0],
          duration: endTime - startTime,
          error: error.message
        });

        throw error;
      }
    };
  }

  /**
   * Monitor component performance
   */
  monitorComponentPerformance() {
    // Use Performance Observer to monitor long tasks
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            // Tasks longer than 50ms
            this.trackEvent('long_task', {
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.trackEvent('memory_usage', {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        });
      }, 60000); // Every minute
    }
  }

  /**
   * Monitor resource loading
   */
  monitorResourceLoading() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.transferSize > 1000000) {
            // Resources larger than 1MB
            this.trackEvent('large_resource', {
              name: entry.name,
              size: entry.transferSize,
              duration: entry.duration
            });
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Setup global error handlers
   */
  setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      this.trackError(event.reason, 'unhandled_promise_rejection');
    });

    // Global JavaScript errors
    window.addEventListener('error', event => {
      this.trackError(event.error, 'javascript_error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Resource loading errors
    window.addEventListener(
      'error',
      event => {
        if (event.target !== window) {
          this.trackError(
            new Error(`Resource failed to load: ${event.target.src || event.target.href}`),
            'resource_error'
          );
        }
      },
      true
    );
  }

  /**
   * Track custom events
   */
  trackEvent(eventName, properties = {}) {
    if (!this.enableAnalytics) return;

    // Send to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, properties);
    }

    // Send to custom analytics endpoint
    this.sendToCustomAnalytics(eventName, properties);
  }

  /**
   * Track errors
   */
  trackError(error, category = 'error', additionalData = {}) {
    if (!this.enableErrorReporting) return;

    console.error(`[${category}]`, error, additionalData);

    // Send to Sentry if available
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        tags: { category },
        extra: additionalData
      });
    }

    // Track as event
    this.trackEvent('error_occurred', {
      category,
      message: error.message,
      stack: error.stack,
      ...additionalData
    });
  }

  /**
   * Send metrics to analytics
   */
  sendToAnalytics(metric) {
    this.trackEvent('web_vital', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating
    });
  }

  /**
   * Send to custom analytics endpoint
   */
  sendToCustomAnalytics(eventName, properties) {
    if (!this.isProduction) return;
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    // Send to your custom analytics endpoint
    fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: eventName,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      })
    }).catch(() => {
      // Silently fail for analytics
    });
  }

  /**
   * Track page views
   */
  trackPageView(pageName, additionalData = {}) {
    // Update GA single-page-app page view
    if (typeof window !== 'undefined' && window.gtag && this.gaTrackingId) {
      window.gtag('config', this.gaTrackingId, {
        page_title: typeof document !== 'undefined' ? document.title : pageName,
        page_path: pageName,
        page_location: typeof window !== 'undefined' ? window.location.href : ''
      });
    }

    // Notify Hotjar of route change
    if (typeof window !== 'undefined' && typeof window.hj === 'function') {
      window.hj('stateChange', pageName);
    }

    // Custom analytics event
    this.trackEvent('page_view', {
      page: pageName,
      title: typeof document !== 'undefined' ? document.title : pageName,
      url: typeof window !== 'undefined' ? window.location.href : '',
      ...additionalData
    });
  }

  /**
   * Track user interactions
   */
  trackUserInteraction(action, element, additionalData = {}) {
    this.trackEvent('user_interaction', {
      action,
      element,
      ...additionalData
    });
  }
}

// Create singleton instance
const monitoring = new MonitoringService();

export default monitoring;
