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
    this.gaTrackingId = import.meta.env.VITE_GA_TRACKING_ID;
    this.hotjarId = import.meta.env.VITE_HOTJAR_ID;
    this.sentryDsn = import.meta.env.VITE_SENTRY_DSN;
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
      this.initializeProductionMonitoring();
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
    if (!hotjarId || hotjarId.includes('your_') || hotjarId.includes('_id_here')) {
      console.warn('Hotjar ID not configured, skipping Hotjar initialization');
      return;
    }
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
    // Dynamically import web-vitals library with correct syntax for v3+
    import('web-vitals')
      .then((webVitals) => {
        const { getCLS, getFID, getFCP, getLCP, getTTFB } = webVitals;
        if (getCLS) getCLS(this.sendToAnalytics.bind(this));
        if (getFID) getFID(this.sendToAnalytics.bind(this));
        if (getFCP) getFCP(this.sendToAnalytics.bind(this));
        if (getLCP) getLCP(this.sendToAnalytics.bind(this));
        if (getTTFB) getTTFB(this.sendToAnalytics.bind(this));
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

  /**
   * ===== ADVANCED PRODUCTION MONITORING FEATURES =====
   */

  /**
   * Initialize Sentry error tracking for production
   */
  initializeSentry() {
    if (this.isProduction && this.enableErrorReporting && this.sentryDsn && !this.isTestMode) {
      try {
        // Dynamic import to avoid bundling Sentry in development
        import('@sentry/react')
          .then(({ init, BrowserTracing, Replay }) => {
            init({
              dsn: this.sentryDsn,
              environment: import.meta.env.MODE,
              release: import.meta.env.VITE_APP_VERSION || '1.0.0',
              integrations: [
                new BrowserTracing({
                  tracePropagationTargets: ['localhost', /^https:\/\/.*\.financeanalyst\.pro/]
                }),
                new Replay({
                  maskAllText: true,
                  blockAllMedia: true
                })
              ],
              tracesSampleRate: 0.1,
              replaysSessionSampleRate: 0.1,
              replaysOnErrorSampleRate: 1.0,
              beforeSend: event => {
                // Sanitize sensitive data
                if (event.exception) {
                  event.exception.values = event.exception.values?.map(value => {
                    if (value.stacktrace) {
                      value.stacktrace.frames = value.stacktrace.frames?.map(frame => {
                        // Remove sensitive file paths
                        if (frame.filename?.includes('api') || frame.filename?.includes('auth')) {
                          frame.filename = '[REDACTED]';
                        }
                        return frame;
                      });
                    }
                    return value;
                  });
                }
                return event;
              }
            });

            console.log('Sentry error tracking initialized');
          })
          .catch(error => {
            console.warn('Failed to initialize Sentry:', error);
          });
      } catch (error) {
        console.warn('Sentry initialization failed:', error);
      }
    }
  }

  /**
   * Track Core Web Vitals
   */
  trackCoreWebVitals() {
    if (this.isProduction && this.enablePerformanceMonitoring && !this.isTestMode) {
      try {
        // Dynamic import for web-vitals with correct syntax for v3+
        import('web-vitals')
          .then((webVitals) => {
            const { getCLS, getFID, getFCP, getLCP, getTTFB } = webVitals;
            if (getCLS) {
              getCLS(metric => {
                this.trackPerformanceMetric('CLS', metric.value, 'score');
              });
            }

            if (getFID) {
              getFID(metric => {
                this.trackPerformanceMetric('FID', metric.value, 'ms');
              });
            }

            if (getFCP) {
              getFCP(metric => {
                this.trackPerformanceMetric('FCP', metric.value, 'ms');
              });
            }

            if (getLCP) {
              getLCP(metric => {
                this.trackPerformanceMetric('LCP', metric.value, 'ms');
              });
            }

            if (getTTFB) {
              getTTFB(metric => {
                this.trackPerformanceMetric('TTFB', metric.value, 'ms');
              });
            }

            console.log('Core Web Vitals tracking initialized');
          })
          .catch(error => {
            console.warn('Failed to initialize Core Web Vitals:', error);
          });
      } catch (error) {
        console.warn('Core Web Vitals initialization failed:', error);
      }
    }
  }

  /**
   * Monitor long tasks and performance issues
   */
  monitorPerformanceIssues() {
    if (this.isProduction && this.enablePerformanceMonitoring && !this.isTestMode) {
      try {
        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            // Track long tasks (>50ms)
            if (entry.entryType === 'longtask') {
              this.trackEvent('performance_issue', {
                type: 'long_task',
                duration: Math.round(entry.duration),
                start_time: entry.startTime,
                name: entry.name
              });

              console.warn('Long task detected:', entry);
            }

            // Track navigation timing
            if (entry.entryType === 'navigation') {
              const navTiming = entry;
              this.trackPerformanceMetric(
                'navigation_timing',
                {
                  dom_content_loaded:
                    navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart,
                  load_complete: navTiming.loadEventEnd - navTiming.loadEventStart,
                  total_time: navTiming.loadEventEnd - navTiming.fetchStart
                },
                'ms'
              );
            }

            // Track resource loading issues
            if (entry.entryType === 'resource' && entry.duration > 5000) {
              this.trackEvent('performance_issue', {
                type: 'slow_resource',
                name: entry.name,
                duration: Math.round(entry.duration),
                size: entry.transferSize
              });
            }
          }
        });

        observer.observe({
          entryTypes: ['longtask', 'navigation', 'resource', 'measure']
        });

        console.log('Performance monitoring initialized');
      } catch (error) {
        console.warn('Performance monitoring initialization failed:', error);
      }
    }
  }

  /**
   * Track feature usage and adoption
   */
  trackFeatureUsage(featureName, action = 'used', metadata = {}) {
    if (this.enableAnalytics && !this.isTestMode) {
      this.trackEvent('feature_usage', {
        feature_name: featureName,
        action,
        session_id: this.getSessionId(),
        timestamp: new Date().toISOString(),
        ...metadata
      });
    }
  }

  /**
   * Track user journey and funnel analytics
   */
  trackUserJourney(step, funnel = 'main', metadata = {}) {
    if (this.enableAnalytics && !this.isTestMode) {
      this.trackEvent('user_journey', {
        step,
        funnel,
        session_id: this.getSessionId(),
        timestamp: new Date().toISOString(),
        ...metadata
      });
    }
  }

  /**
   * Monitor application health
   */
  performHealthCheck() {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      viewport:
        typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
      memory_usage:
        typeof performance !== 'undefined' && performance.memory
          ? {
              used: performance.memory.usedJSHeapSize,
              total: performance.memory.totalJSHeapSize,
              limit: performance.memory.jsHeapSizeLimit
            }
          : null,
      connection:
        typeof navigator !== 'undefined' && navigator.connection
          ? {
              effective_type: navigator.connection.effectiveType,
              downlink: navigator.connection.downlink,
              rtt: navigator.connection.rtt
            }
          : null
    };

    this.trackEvent('health_check', healthStatus);

    // Log to console in development
    if (!this.isProduction) {
      console.log('Health Check:', healthStatus);
    }

    return healthStatus;
  }

  /**
   * Track business metrics
   */
  trackBusinessMetric(metricName, value, unit = 'count', metadata = {}) {
    if (this.enableAnalytics && !this.isTestMode) {
      this.trackEvent('business_metric', {
        metric_name: metricName,
        value,
        unit,
        session_id: this.getSessionId(),
        timestamp: new Date().toISOString(),
        ...metadata
      });
    }
  }

  /**
   * Enhanced error tracking with context
   */
  trackError(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      ...context
    };

    this.trackEvent('error', errorData);

    // Send to Sentry if available
    if (this.isProduction && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          custom_context: context,
          error_data: errorData
        }
      });
    }

    console.error('Error tracked:', errorData);
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    if (typeof window === 'undefined') return null;

    let sessionId = sessionStorage.getItem('fa_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('fa_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Enhanced initialization with all production features
   */
  initializeProductionMonitoring() {
    if (!this.isInitialized && !this.isTestMode) {
      // Initialize all production monitoring features
      this.initializeSentry();
      this.trackCoreWebVitals();
      this.monitorPerformanceIssues();

      // Perform initial health check
      this.performHealthCheck();

      // Set up periodic health checks
      if (this.isProduction) {
        setInterval(() => {
          this.performHealthCheck();
        }, 300000); // Every 5 minutes
      }

      this.isInitialized = true;
      console.log('Production monitoring fully initialized');
    }
  }
}

// Create singleton instance
const monitoring = new MonitoringService();

export default monitoring;
