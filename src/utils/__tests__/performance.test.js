import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  PerformanceMonitor,
  performanceMonitor,
  getMemoryUsage,
  getBundleInfo,
  withPerformanceMonitoring,
  debounce,
  throttle
} from '../performance.js';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => [{ duration: 100 }]),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000
  }
};

global.performance = mockPerformance;

describe('Performance Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PerformanceMonitor', () => {
    it('should create a new instance with correct initial state', () => {
      const monitor = new PerformanceMonitor();

      expect(monitor.metrics).toBeInstanceOf(Map);
      expect(monitor.observers).toBeInstanceOf(Map);
      expect(typeof monitor.isSupported).toBe('boolean');
    });

    it('should start and end timing correctly', () => {
      const monitor = new PerformanceMonitor();

      monitor.startTiming('test-operation');
      expect(monitor.metrics.has('test-operation')).toBe(true);

      const duration = monitor.endTiming('test-operation');
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should return null when ending timing without start', () => {
      const monitor = new PerformanceMonitor();

      const duration = monitor.endTiming('non-existent');
      expect(duration).toBeNull();
    });

    it('should get metric data', () => {
      const monitor = new PerformanceMonitor();

      monitor.startTiming('test');
      monitor.endTiming('test');

      const metric = monitor.getMetric('test');
      expect(metric).toBeDefined();
      expect(metric.duration).toBeGreaterThanOrEqual(0);
    });

    it('should get all metrics', () => {
      const monitor = new PerformanceMonitor();

      monitor.startTiming('test1');
      monitor.endTiming('test1');
      monitor.startTiming('test2');
      monitor.endTiming('test2');

      const allMetrics = monitor.getAllMetrics();
      expect(Object.keys(allMetrics)).toContain('test1');
      expect(Object.keys(allMetrics)).toContain('test2');
    });

    it('should clear metrics', () => {
      const monitor = new PerformanceMonitor();

      monitor.startTiming('test');
      monitor.clearMetrics();

      expect(monitor.metrics.size).toBe(0);
    });
  });

  describe('getMemoryUsage', () => {
    it('should return memory usage when available', () => {
      const memoryInfo = getMemoryUsage();

      expect(memoryInfo).toEqual({
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
        usagePercentage: 25
      });
    });

    it('should return null when memory API is not available', () => {
      const originalMemory = mockPerformance.memory;
      delete mockPerformance.memory;

      const memoryInfo = getMemoryUsage();

      expect(memoryInfo).toBeNull();

      mockPerformance.memory = originalMemory;
    });
  });

  describe('getBundleInfo', () => {
    it('should return bundle information when available', () => {
      const mockResources = [
        { name: 'app.js', transferSize: 1000 },
        { name: 'styles.css', transferSize: 500 },
        { name: 'vendor.js', transferSize: 2000 }
      ];

      mockPerformance.getEntriesByType = vi.fn().mockReturnValue(mockResources);

      const bundleInfo = getBundleInfo();

      expect(bundleInfo).toEqual({
        totalResources: 3,
        jsFiles: 2,
        cssFiles: 1,
        totalTransferSize: 3500,
        jsTransferSize: 3000,
        cssTransferSize: 500
      });
    });

    it('should return null when performance API is not available', () => {
      const originalGetEntriesByType = mockPerformance.getEntriesByType;
      delete mockPerformance.getEntriesByType;

      const bundleInfo = getBundleInfo();

      expect(bundleInfo).toBeNull();

      mockPerformance.getEntriesByType = originalGetEntriesByType;
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async() => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to debounced function', async() => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 50);

      debouncedFn('arg1', 'arg2');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should handle immediate execution', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100, true);

      debouncedFn();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async() => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      await new Promise(resolve => setTimeout(resolve, 150));

      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments correctly', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('test', 123);

      expect(mockFn).toHaveBeenCalledWith('test', 123);
    });
  });

  describe('performanceMonitor global instance', () => {
    it('should be an instance of PerformanceMonitor', () => {
      expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('should have initialized metrics and observers', () => {
      expect(performanceMonitor.metrics).toBeInstanceOf(Map);
      expect(performanceMonitor.observers).toBeInstanceOf(Map);
    });

    it('should support timing operations', () => {
      performanceMonitor.startTiming('global-test');
      const duration = performanceMonitor.endTiming('global-test');

      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });
});
