/**
 * Performance monitoring and bundle size optimization utilities
 * Tracks loading performance and provides insights for optimization
 */
import { forwardRef, useEffect, createElement } from 'react';

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      loadTimes: {},
      bundleSizes: {},
      renderTimes: {},
      memoryUsage: []
    };

    this.thresholds = {
      slowComponent: 100, // ms
      largeBundleWarning: 500000, // bytes (500kb)
      memoryLeakWarning: 50000000 // bytes (50mb)
    };

    // Safe performance reference for browser and Node/Vitest
    this.perf =
      typeof globalThis !== 'undefined' && globalThis.performance
        ? globalThis.performance
        : typeof performance !== 'undefined'
          ? performance
          : null;
  }

  /**
   * Monitor component loading time
   */
  measureComponentLoad(componentName, loadPromise) {
    const startTime = this.perf ? this.perf.now() : Date.now();

    return loadPromise.then(component => {
      const end = this.perf ? this.perf.now() : Date.now();
      const loadTime = end - startTime;
      this.metrics.loadTimes[componentName] = loadTime;

      if (loadTime > this.thresholds.slowComponent) {
        console.warn(`Slow component load: ${componentName} took ${loadTime.toFixed(2)}ms`);
      }

      return component;
    });
  }

  /**
   * Monitor component render performance
   */
  measureRender(componentName, renderFunction) {
    const startTime = this.perf ? this.perf.now() : Date.now();
    const result = renderFunction();
    const end = this.perf ? this.perf.now() : Date.now();
    const renderTime = end - startTime;

    this.metrics.renderTimes[componentName] = renderTime;

    if (renderTime > this.thresholds.slowComponent) {
      console.warn(`Slow render: ${componentName} took ${renderTime.toFixed(2)}ms to render`);
    }

    return result;
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage() {
    if (this.perf && this.perf.memory) {
      const usage = {
        timestamp: Date.now(),
        used: this.perf.memory.usedJSHeapSize,
        total: this.perf.memory.totalJSHeapSize,
        limit: this.perf.memory.jsHeapSizeLimit
      };

      this.metrics.memoryUsage.push(usage);

      // Keep only last 100 measurements
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
      }

      // Check for memory leak warning
      if (usage.used > this.thresholds.memoryLeakWarning) {
        console.warn(`High memory usage: ${(usage.used / 1024 / 1024).toFixed(2)}MB`);
      }

      return usage;
    }
    return null;
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    const report = {
      loadTimes: this.metrics.loadTimes,
      renderTimes: this.metrics.renderTimes,
      averageLoadTime: this.calculateAverageLoadTime(),
      slowestComponents: this.getSlowestComponents(),
      memoryTrend: this.getMemoryTrend(),
      recommendations: this.getOptimizationRecommendations()
    };

    return report;
  }

  /**
   * Calculate performance metrics
   */
  calculateAverageLoadTime() {
    const times = Object.values(this.metrics.loadTimes);
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  getSlowestComponents() {
    const combined = {
      ...this.metrics.loadTimes,
      ...this.metrics.renderTimes
    };

    return Object.entries(combined)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, time]) => ({ name, time: Math.round(time) }));
  }

  getMemoryTrend() {
    if (this.metrics.memoryUsage.length < 2) return 'insufficient_data';

    const recent = this.metrics.memoryUsage.slice(-10);
    const trend = recent[recent.length - 1].used - recent[0].used;

    if (trend > 5000000) return 'increasing'; // 5MB increase
    if (trend < -5000000) return 'decreasing';
    return 'stable';
  }

  getOptimizationRecommendations() {
    const recommendations = [];

    // Check for slow loading components
    Object.entries(this.metrics.loadTimes).forEach(([name, time]) => {
      if (time > this.thresholds.slowComponent) {
        recommendations.push({
          type: 'performance',
          component: name,
          issue: 'slow_load',
          suggestion: `Consider code splitting or lazy loading for ${name}`,
          impact: 'medium'
        });
      }
    });

    // Check for slow rendering components
    Object.entries(this.metrics.renderTimes).forEach(([name, time]) => {
      if (time > this.thresholds.slowComponent) {
        recommendations.push({
          type: 'performance',
          component: name,
          issue: 'slow_render',
          suggestion: `Optimize render performance for ${name} - consider memoization`,
          impact: 'high'
        });
      }
    });

    // Memory recommendations
    const memoryTrend = this.getMemoryTrend();
    if (memoryTrend === 'increasing') {
      recommendations.push({
        type: 'memory',
        issue: 'memory_leak',
        suggestion:
          'Potential memory leak detected - check for uncleared intervals and event listeners',
        impact: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Bundle size analysis
   */
  analyzeBundleSize(chunks) {
    const analysis = {
      totalSize: 0,
      chunks: [],
      recommendations: []
    };

    chunks.forEach(chunk => {
      analysis.totalSize += chunk.size;
      analysis.chunks.push({
        name: chunk.name,
        size: chunk.size,
        sizeFormatted: this.formatBytes(chunk.size)
      });

      if (chunk.size > this.thresholds.largeBundleWarning) {
        analysis.recommendations.push({
          type: 'bundle_size',
          chunk: chunk.name,
          size: chunk.size,
          suggestion: `Consider further splitting ${chunk.name} (${this.formatBytes(chunk.size)})`,
          impact: 'medium'
        });
      }
    });

    analysis.totalSizeFormatted = this.formatBytes(analysis.totalSize);
    analysis.chunks.sort((a, b) => b.size - a.size);

    return analysis;
  }

  /**
   * Utility functions
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Performance monitoring hooks
   */
  startPerformanceMonitoring() {
    // Track memory usage every 30 seconds
    this.memoryInterval = setInterval(() => {
      this.trackMemoryUsage();
    }, 30000);

    // Monitor navigation performance
    if (this.perf && typeof this.perf.getEntriesByType === 'function') {
      const entries = this.perf.getEntriesByType('navigation');
      const nav = entries && entries[0];
      if (nav) {
        console.log('Page load performance:', {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          loadComplete: nav.loadEventEnd - nav.loadEventStart,
          totalTime: nav.loadEventEnd - nav.fetchStart
        });
      }
    }
  }

  stopPerformanceMonitoring() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
  }

  /**
   * React component performance wrapper
   */
  withPerformanceTracking(WrappedComponent, componentName) {
    const Tracked = forwardRef((props, ref) => {
      const renderStart = performance.now();

      useEffect(() => {
        const renderTime = performance.now() - renderStart;
        this.metrics.renderTimes[componentName] = renderTime;
      }, []);

      return createElement(WrappedComponent, { ...props, ref });
    });
    Tracked.displayName = `WithPerformance(${componentName})`;
    return Tracked;
  }

  /**
   * Lazy loading with performance tracking
   */
  trackLazyLoad(importFunction, componentName) {
    const startTime = this.perf ? this.perf.now() : Date.now();

    return importFunction().then(module => {
      const end = this.perf ? this.perf.now() : Date.now();
      const loadTime = end - startTime;
      this.metrics.loadTimes[componentName] = loadTime;

      console.log(`Lazy loaded ${componentName} in ${loadTime.toFixed(2)}ms`);

      return module;
    });
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export convenience functions
export const measureComponentLoad = (name, promise) =>
  performanceMonitor.measureComponentLoad(name, promise);
export const measureRender = (name, fn) => performanceMonitor.measureRender(name, fn);
export const trackMemoryUsage = () => performanceMonitor.trackMemoryUsage();
export const getPerformanceReport = () => performanceMonitor.getPerformanceReport();
export const analyzeBundleSize = chunks => performanceMonitor.analyzeBundleSize(chunks);
export const startPerformanceMonitoring = () => performanceMonitor.startPerformanceMonitoring();
export const stopPerformanceMonitoring = () => performanceMonitor.stopPerformanceMonitoring();
export const withPerformanceTracking = (component, name) =>
  performanceMonitor.withPerformanceTracking(component, name);
export const trackLazyLoad = (importFn, name) => performanceMonitor.trackLazyLoad(importFn, name);

export default performanceMonitor;
