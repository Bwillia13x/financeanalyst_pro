// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  preloadCriticalResources,
  createImageObserver,
  measurePerformance,
  loadChartLibrary,
  loadD3Library,
  loadAnimationLibrary,
  addResourceHints,
  initializePerformanceOptimizations
} from '../performanceOptimizations.js';

// Mock document and window for DOM manipulation tests
const mockDocument = {
  head: {
    appendChild: vi.fn()
  },
  readyState: 'complete',
  addEventListener: vi.fn()
};

const mockWindow = {
  IntersectionObserver: vi.fn(),
  performance: {
    mark: vi.fn(),
    measure: vi.fn()
  }
};

describe('Performance Optimizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document and window mocks
    Object.defineProperty(document, 'head', {
      value: mockDocument.head,
      writable: true
    });
    Object.defineProperty(document, 'readyState', {
      value: mockDocument.readyState,
      writable: true
    });
    Object.defineProperty(document, 'addEventListener', {
      value: mockDocument.addEventListener,
      writable: true
    });
    Object.defineProperty(window, 'IntersectionObserver', {
      value: mockWindow.IntersectionObserver,
      writable: true,
      configurable: true
    });
    Object.defineProperty(window, 'performance', {
      value: mockWindow.performance,
      writable: true
    });
  });

  describe('preloadCriticalResources', () => {
    it('should create and append critical style preload link', () => {
      const originalCreateElement = document.createElement;
      const mockLinks = [];
      document.createElement = vi.fn().mockImplementation(() => {
        const link = { rel: '', as: '', href: '', type: '', crossOrigin: '' };
        mockLinks.push(link);
        return link;
      });

      preloadCriticalResources();

      expect(document.createElement).toHaveBeenCalledWith('link');
      const styleLink = mockLinks.find(link => link.as === 'style');
      expect(styleLink.rel).toBe('preload');
      expect(styleLink.as).toBe('style');
      expect(styleLink.href).toBe('/assets/critical.css');
      expect(mockDocument.head.appendChild).toHaveBeenCalledWith(styleLink);

      document.createElement = originalCreateElement;
    });

    it('should create and append font preload links with CORS', () => {
      const originalCreateElement = document.createElement;
      const mockLinks = [];
      document.createElement = vi.fn().mockImplementation(() => {
        const link = { rel: '', as: '', href: '', type: '', crossOrigin: '' };
        mockLinks.push(link);
        return link;
      });

      preloadCriticalResources();

      expect(mockLinks.length).toBeGreaterThan(1); // Style + fonts
      const fontLinks = mockLinks.filter(link => link.as === 'font');
      expect(fontLinks).toHaveLength(2);
      expect(fontLinks[0].type).toBe('font/woff2');
      expect(fontLinks[0].crossOrigin).toBe('anonymous');

      document.createElement = originalCreateElement;
    });
  });

  describe('createImageObserver', () => {
    it('should create IntersectionObserver when supported', () => {
      const mockObserver = { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
      mockWindow.IntersectionObserver.mockReturnValue(mockObserver);

      const callback = vi.fn();
      const observer = createImageObserver(callback);

      expect(mockWindow.IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
        rootMargin: '50px 0px',
        threshold: 0.01
      });
      expect(observer).toBe(mockObserver);
    });

    it('should return null when IntersectionObserver is not supported', () => {
      const originalIntersectionObserver = window.IntersectionObserver;
      delete window.IntersectionObserver;

      const callback = vi.fn();
      const observer = createImageObserver(callback);

      expect(observer).toBe(null);

      // Restore
      window.IntersectionObserver = originalIntersectionObserver;
    });

    it('should call callback when intersection occurs', () => {
      const mockObserver = { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
      mockWindow.IntersectionObserver.mockImplementation(callback => {
        // Store the callback to test it
        mockObserver._callback = callback;
        return mockObserver;
      });

      const userCallback = vi.fn();
      createImageObserver(userCallback);

      const mockEntry = { isIntersecting: true, target: { src: 'test.jpg' } };
      mockObserver._callback([mockEntry]);

      expect(userCallback).toHaveBeenCalledWith(mockEntry.target);
    });
  });

  describe('measurePerformance', () => {
    it('should measure performance when performance API is available', () => {
      const mockFn = vi.fn().mockReturnValue('result');
      const result = measurePerformance('test', mockFn);

      expect(mockWindow.performance.mark).toHaveBeenCalledWith('test-start');
      expect(mockFn).toHaveBeenCalled();
      expect(result).toBe('result');
      expect(mockWindow.performance.mark).toHaveBeenCalledWith('test-end');
      expect(mockWindow.performance.measure).toHaveBeenCalledWith('test', 'test-start', 'test-end');
    });

    it('should execute function when performance API is not available', () => {
      const originalPerformance = window.performance;
      delete window.performance;

      const mockFn = vi.fn().mockReturnValue('result');
      const result = measurePerformance('test', mockFn);

      expect(mockFn).toHaveBeenCalled();
      expect(result).toBe('result');

      // Restore
      window.performance = originalPerformance;
    });

    it('should handle performance.mark errors gracefully', () => {
      mockWindow.performance.mark.mockImplementation(() => {
        throw new Error('Performance not supported');
      });

      const mockFn = vi.fn().mockReturnValue('result');
      const result = measurePerformance('test', mockFn);

      expect(mockFn).toHaveBeenCalled();
      expect(result).toBe('result');
    });
  });

  describe('Dynamic imports', () => {
    it('should export dynamic import functions', () => {
      expect(typeof loadChartLibrary).toBe('function');
      expect(typeof loadD3Library).toBe('function');
      expect(typeof loadAnimationLibrary).toBe('function');
    });

    it('should return import promises', async () => {
      // These are dynamic imports that should return promises
      const chartPromise = loadChartLibrary();
      const d3Promise = loadD3Library();
      const animationPromise = loadAnimationLibrary();

      expect(chartPromise).toBeInstanceOf(Promise);
      expect(d3Promise).toBeInstanceOf(Promise);
      expect(animationPromise).toBeInstanceOf(Promise);

      // Test that they handle errors gracefully
      try {
        await chartPromise;
      } catch (error) {
        // Expected in test environment
        expect(error).toBeDefined();
      }
    });
  });

  describe('addResourceHints', () => {
    it('should add DNS prefetch links for external domains', () => {
      const originalCreateElement = document.createElement;
      const mockLinks = [];
      document.createElement = vi.fn().mockImplementation(() => {
        const link = { rel: '', href: '' };
        mockLinks.push(link);
        return link;
      });

      addResourceHints();

      const dnsPrefetchLinks = mockLinks.filter(link => link.rel === 'dns-prefetch');
      expect(dnsPrefetchLinks).toHaveLength(3);
      expect(dnsPrefetchLinks.some(link => link.href === '//fonts.googleapis.com')).toBe(true);

      document.createElement = originalCreateElement;
    });

    it('should add preconnect links for critical third parties', () => {
      const originalCreateElement = document.createElement;
      const mockLinks = [];
      document.createElement = vi.fn().mockImplementation(() => {
        const link = { rel: '', href: '', crossOrigin: '' };
        mockLinks.push(link);
        return link;
      });

      addResourceHints();

      const preconnectLinks = mockLinks.filter(link => link.rel === 'preconnect');
      expect(preconnectLinks).toHaveLength(2);
      expect(preconnectLinks[0].crossOrigin).toBe('anonymous');

      document.createElement = originalCreateElement;
    });
  });

  describe('initializePerformanceOptimizations', () => {
    it('should initialize immediately when document is ready', () => {
      // Set up mocks for document operations
      const originalCreateElement = document.createElement;
      const mockLinks = [];
      document.createElement = vi.fn().mockImplementation(() => {
        const link = { rel: '', as: '', href: '', type: '', crossOrigin: '' };
        mockLinks.push(link);
        return link;
      });

      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true
      });

      initializePerformanceOptimizations();

      // Should have called functions that create links
      expect(mockDocument.head.appendChild).toHaveBeenCalled();
      expect(mockLinks.length).toBeGreaterThan(0);

      document.createElement = originalCreateElement;
    });

    it('should add event listener when document is loading', () => {
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true
      });

      const addEventListenerSpy = vi.fn();
      Object.defineProperty(document, 'addEventListener', {
        value: addEventListenerSpy,
        writable: true
      });

      initializePerformanceOptimizations();

      expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
    });
  });
});
