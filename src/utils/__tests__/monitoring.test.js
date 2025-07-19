import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import monitoring from '../monitoring.js';

// Mock Sentry import
vi.mock('@sentry/browser', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  configureScope: vi.fn(),
  BrowserTracing: vi.fn()
}));

// Mock web-vitals
vi.mock('web-vitals', () => ({
  getCLS: vi.fn(),
  getFID: vi.fn(),
  getFCP: vi.fn(),
  getLCP: vi.fn(),
  getTTFB: vi.fn()
}));

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_APP_ENV: 'test',
    VITE_ENABLE_ANALYTICS: 'true',
    VITE_ENABLE_ERROR_REPORTING: 'true',
    VITE_PERFORMANCE_MONITORING: 'true',
    VITE_SENTRY_DSN: 'test-sentry-dsn',
    VITE_GA_TRACKING_ID: 'GA-TEST-123',
    VITE_HOTJAR_ID: '12345',
    VITE_APP_VERSION: '1.0.0'
  }
}));

// Mock global objects
const mockGtag = vi.fn();
const mockSentry = {
  captureException: vi.fn(),
  init: vi.fn(),
  configureScope: vi.fn()
};

const mockPerformanceObserver = vi.fn();
const mockPerformance = {
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000
  },
  now: vi.fn(() => Date.now())
};

// Mock DOM methods
const mockDocument = {
  createElement: vi.fn(() => ({
    async: false,
    src: '',
    appendChild: vi.fn()
  })),
  head: {
    appendChild: vi.fn()
  },
  title: 'Test Page'
};

const mockWindow = {
  dataLayer: [],
  gtag: mockGtag,
  Sentry: mockSentry,
  location: {
    href: 'https://test.com/page'
  },
  navigator: {
    userAgent: 'Test User Agent'
  },
  addEventListener: vi.fn(),
  PerformanceObserver: mockPerformanceObserver,
  performance: mockPerformance
};

// Setup global mocks
global.window = mockWindow;
global.document = mockDocument;
global.fetch = vi.fn();
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn()
};

describe.skip('MonitoringService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct environment settings', () => {
      expect(monitoring.isProduction).toBe(false); // test environment
      expect(monitoring.enableAnalytics).toBe(true);
      expect(monitoring.enableErrorReporting).toBe(true);
      expect(monitoring.enablePerformanceMonitoring).toBe(true);
    });

    it('should setup global error handlers', () => {
      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      );
      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
    });
  });

  describe('Google Analytics Integration', () => {
    it('should initialize Google Analytics with correct tracking ID', () => {
      monitoring.initializeGoogleAnalytics();

      expect(mockDocument.createElement).toHaveBeenCalledWith('script');
      expect(mockDocument.head.appendChild).toHaveBeenCalled();
      expect(mockWindow.dataLayer).toBeDefined();
    });

    it('should not initialize GA without tracking ID', () => {
      const originalEnv = import.meta.env.VITE_GA_TRACKING_ID;
      import.meta.env.VITE_GA_TRACKING_ID = '';

      const createElementSpy = vi.spyOn(mockDocument, 'createElement');
      monitoring.initializeGoogleAnalytics();

      expect(createElementSpy).not.toHaveBeenCalled();

      import.meta.env.VITE_GA_TRACKING_ID = originalEnv;
    });
  });

  describe('Error Tracking', () => {
    it('should track errors with Sentry when available', () => {
      const testError = new Error('Test error');
      const additionalData = { context: 'test' };

      monitoring.trackError(testError, 'test_error', additionalData);

      expect(mockSentry.captureException).toHaveBeenCalledWith(testError, {
        tags: { category: 'test_error' },
        extra: additionalData
      });
    });

    it('should log errors to console', () => {
      const testError = new Error('Test error');

      monitoring.trackError(testError, 'test_error');

      expect(console.error).toHaveBeenCalledWith(
        '[test_error]',
        testError,
        {}
      );
    });

    it('should not track errors when error reporting is disabled', () => {
      const originalSetting = monitoring.enableErrorReporting;
      monitoring.enableErrorReporting = false;

      const testError = new Error('Test error');
      monitoring.trackError(testError);

      expect(mockSentry.captureException).not.toHaveBeenCalled();

      monitoring.enableErrorReporting = originalSetting;
    });
  });

  describe('Event Tracking', () => {
    it('should track events with Google Analytics', () => {
      const eventName = 'test_event';
      const properties = { value: 123 };

      monitoring.trackEvent(eventName, properties);

      expect(mockGtag).toHaveBeenCalledWith('event', eventName, properties);
    });

    it('should send events to custom analytics endpoint', () => {
      const originalProduction = monitoring.isProduction;
      monitoring.isProduction = true;

      const eventName = 'test_event';
      const properties = { value: 123 };

      monitoring.trackEvent(eventName, properties);

      expect(global.fetch).toHaveBeenCalledWith('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining(eventName)
      });

      monitoring.isProduction = originalProduction;
    });

    it('should not track events when analytics is disabled', () => {
      const originalSetting = monitoring.enableAnalytics;
      monitoring.enableAnalytics = false;

      monitoring.trackEvent('test_event');

      expect(mockGtag).not.toHaveBeenCalled();

      monitoring.enableAnalytics = originalSetting;
    });
  });

  describe('Page View Tracking', () => {
    it('should track page views with correct data', () => {
      const pageName = 'test-page';
      const additionalData = { section: 'dashboard' };

      monitoring.trackPageView(pageName, additionalData);

      expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
        page: pageName,
        title: mockDocument.title,
        url: mockWindow.location.href,
        ...additionalData
      });
    });
  });

  describe('User Interaction Tracking', () => {
    it('should track user interactions correctly', () => {
      const action = 'click';
      const element = 'button';
      const additionalData = { buttonId: 'submit' };

      monitoring.trackUserInteraction(action, element, additionalData);

      expect(mockGtag).toHaveBeenCalledWith('event', 'user_interaction', {
        action,
        element,
        ...additionalData
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should monitor memory usage when available', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      monitoring.monitorMemoryUsage();

      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        60000
      );
    });

    it('should monitor API performance', () => {
      const originalFetch = global.fetch;

      monitoring.monitorApiPerformance();

      // Verify that fetch has been wrapped
      expect(global.fetch).not.toBe(originalFetch);
    });

    it('should track Core Web Vitals metrics', () => {
      const mockMetric = {
        name: 'CLS',
        value: 0.1,
        rating: 'good'
      };

      monitoring.sendToAnalytics(mockMetric);

      expect(mockGtag).toHaveBeenCalledWith('event', 'web_vital', {
        name: 'CLS',
        value: 0.1,
        rating: 'good'
      });
    });
  });

  describe('Custom Analytics', () => {
    it('should send data to custom analytics endpoint in production', () => {
      const originalProduction = monitoring.isProduction;
      monitoring.isProduction = true;

      const eventName = 'custom_event';
      const properties = { customProp: 'value' };

      monitoring.sendToCustomAnalytics(eventName, properties);

      expect(global.fetch).toHaveBeenCalledWith('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining(eventName)
      });

      monitoring.isProduction = originalProduction;
    });

    it('should not send to custom analytics in non-production', () => {
      monitoring.sendToCustomAnalytics('test_event', {});

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle analytics endpoint failures gracefully', async() => {
      const originalProduction = monitoring.isProduction;
      monitoring.isProduction = true;

      global.fetch.mockRejectedValue(new Error('Network error'));

      // Should not throw
      expect(() => {
        monitoring.sendToCustomAnalytics('test_event', {});
      }).not.toThrow();

      monitoring.isProduction = originalProduction;
    });
  });

  describe('Resource Monitoring', () => {
    it('should monitor resource loading when PerformanceObserver is available', () => {
      const mockObserver = {
        observe: vi.fn()
      };
      mockPerformanceObserver.mockReturnValue(mockObserver);

      monitoring.monitorResourceLoading();

      expect(mockPerformanceObserver).toHaveBeenCalled();
      expect(mockObserver.observe).toHaveBeenCalledWith({
        entryTypes: ['resource']
      });
    });
  });

  describe('Global Error Handling', () => {
    it('should handle unhandled promise rejections', () => {
      const errorHandlers = {};
      mockWindow.addEventListener.mockImplementation((event, handler) => {
        errorHandlers[event] = handler;
      });

      monitoring.setupGlobalErrorHandlers();

      const mockRejectionEvent = {
        reason: new Error('Unhandled promise rejection')
      };

      const trackErrorSpy = vi.spyOn(monitoring, 'trackError');
      errorHandlers['unhandledrejection'](mockRejectionEvent);

      expect(trackErrorSpy).toHaveBeenCalledWith(
        mockRejectionEvent.reason,
        'unhandled_promise_rejection'
      );
    });

    it('should handle JavaScript errors', () => {
      const errorHandlers = {};
      mockWindow.addEventListener.mockImplementation((event, handler) => {
        errorHandlers[event] = handler;
      });

      monitoring.setupGlobalErrorHandlers();

      const mockErrorEvent = {
        error: new Error('JavaScript error'),
        filename: 'test.js',
        lineno: 10,
        colno: 5
      };

      const trackErrorSpy = vi.spyOn(monitoring, 'trackError');
      errorHandlers['error'](mockErrorEvent);

      expect(trackErrorSpy).toHaveBeenCalledWith(
        mockErrorEvent.error,
        'javascript_error',
        {
          filename: 'test.js',
          lineno: 10,
          colno: 5
        }
      );
    });
  });

  describe('Hotjar Integration', () => {
    it('should initialize Hotjar with correct ID', () => {
      const originalHj = global.window.hj;

      monitoring.initializeHotjar();

      expect(global.window.hj).toBeDefined();
      expect(global.window._hjSettings).toEqual({
        hjid: '12345',
        hjsv: 6
      });

      global.window.hj = originalHj;
    });

    it('should not initialize Hotjar without ID', () => {
      const originalEnv = import.meta.env.VITE_HOTJAR_ID;
      import.meta.env.VITE_HOTJAR_ID = '';

      const originalHj = global.window.hj;
      monitoring.initializeHotjar();

      expect(global.window.hj).toBe(originalHj);

      import.meta.env.VITE_HOTJAR_ID = originalEnv;
    });
  });

  describe('Component Performance Monitoring', () => {
    it('should monitor component performance', () => {
      const mockObserver = {
        observe: vi.fn()
      };
      mockPerformanceObserver.mockReturnValue(mockObserver);

      monitoring.monitorComponentPerformance();

      expect(mockPerformanceObserver).toHaveBeenCalled();
      expect(mockObserver.observe).toHaveBeenCalledWith({
        entryTypes: ['measure']
      });
    });
  });
});
