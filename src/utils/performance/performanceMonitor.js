// Performance Monitor - Optimization and Analytics
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.thresholds = {
      fcp: 1800, // First Contentful Paint
      lcp: 2500, // Largest Contentful Paint
      fid: 100,  // First Input Delay
      cls: 0.1,  // Cumulative Layout Shift
      ttfb: 600, // Time to First Byte
      memoryUsage: 50 * 1024 * 1024, // 50MB
      bundleSize: 2 * 1024 * 1024     // 2MB
    };
    this.isMonitoring = false;
    this.reportQueue = [];
    this.initialize();
  }

  initialize() {
    if (typeof window === 'undefined') return;

    // Initialize Web Vitals monitoring
    this.initializeWebVitals();
    
    // Initialize memory monitoring
    this.initializeMemoryMonitoring();
    
    // Initialize network monitoring
    this.initializeNetworkMonitoring();
    
    // Initialize bundle analysis
    this.initializeBundleAnalysis();
    
    // Initialize real user monitoring
    this.initializeRUM();

    this.isMonitoring = true;
  }

  initializeWebVitals() {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('fcp', entry.startTime, {
              threshold: this.thresholds.fcp,
              critical: entry.startTime > this.thresholds.fcp
            });
          }
        });
      });

      try {
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('fcp', fcpObserver);
      } catch (error) {
        console.warn('FCP observation not supported:', error);
      }

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordMetric('lcp', lastEntry.startTime, {
          threshold: this.thresholds.lcp,
          critical: lastEntry.startTime > this.thresholds.lcp,
          element: lastEntry.element?.tagName
        });
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (error) {
        console.warn('LCP observation not supported:', error);
      }

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric('fid', entry.processingStart - entry.startTime, {
            threshold: this.thresholds.fid,
            critical: (entry.processingStart - entry.startTime) > this.thresholds.fid,
            eventType: entry.name
          });
        });
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (error) {
        console.warn('FID observation not supported:', error);
      }

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });

        this.recordMetric('cls', clsValue, {
          threshold: this.thresholds.cls,
          critical: clsValue > this.thresholds.cls,
          accumulated: true
        });
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (error) {
        console.warn('CLS observation not supported:', error);
      }
    }
  }

  initializeMemoryMonitoring() {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = performance.memory;
        const usage = memory.usedJSHeapSize;
        
        this.recordMetric('memory', usage, {
          threshold: this.thresholds.memoryUsage,
          critical: usage > this.thresholds.memoryUsage,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          percentage: (usage / memory.jsHeapSizeLimit) * 100
        });
      };

      // Check memory every 30 seconds
      const memoryInterval = setInterval(checkMemory, 30000);
      this.observers.set('memory', { disconnect: () => clearInterval(memoryInterval) });
      
      // Initial check
      checkMemory();
    }
  }

  initializeNetworkMonitoring() {
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const ttfb = entry.responseStart - entry.requestStart;
          
          this.recordMetric('ttfb', ttfb, {
            threshold: this.thresholds.ttfb,
            critical: ttfb > this.thresholds.ttfb,
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            tcp: entry.connectEnd - entry.connectStart,
            ssl: entry.secureConnectionStart ? entry.connectEnd - entry.secureConnectionStart : 0
          });

          // DOM metrics
          this.recordMetric('domComplete', entry.domComplete - entry.navigationStart);
          this.recordMetric('loadComplete', entry.loadEventEnd - entry.navigationStart);
        });
      });

      try {
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);
      } catch (error) {
        console.warn('Navigation observation not supported:', error);
      }

      // Resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.initiatorType) {
            this.recordMetric(`resource_${entry.initiatorType}`, entry.duration, {
              name: entry.name,
              size: entry.transferSize,
              cached: entry.transferSize === 0,
              compressed: entry.encodedBodySize < entry.decodedBodySize
            });
          }
        });
      });

      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (error) {
        console.warn('Resource observation not supported:', error);
      }
    }
  }

  initializeBundleAnalysis() {
    // Monitor bundle size and chunks
    if (typeof window !== 'undefined' && window.__webpack_require__) {
      const bundleInfo = this.analyzeBundleSize();
      this.recordMetric('bundleSize', bundleInfo.totalSize, {
        threshold: this.thresholds.bundleSize,
        critical: bundleInfo.totalSize > this.thresholds.bundleSize,
        chunks: bundleInfo.chunks,
        modules: bundleInfo.moduleCount
      });
    }
  }

  initializeRUM() {
    // Real User Monitoring - track user interactions
    const trackInteraction = (event) => {
      const startTime = performance.now();
      
      requestAnimationFrame(() => {
        const duration = performance.now() - startTime;
        this.recordMetric('interaction', duration, {
          type: event.type,
          target: event.target?.tagName,
          critical: duration > 16 // 60fps threshold
        });
      });
    };

    ['click', 'scroll', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, trackInteraction, { passive: true });
    });
  }

  recordMetric(name, value, metadata = {}) {
    const timestamp = Date.now();
    const metric = {
      name,
      value,
      timestamp,
      metadata,
      sessionId: this.getSessionId()
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name);
    metrics.push(metric);

    // Keep only last 100 entries per metric
    if (metrics.length > 100) {
      metrics.shift();
    }

    // Add to report queue if critical
    if (metadata.critical) {
      this.queueReport(metric);
    }

    // Emit event for real-time monitoring
    this.emit('metric:recorded', metric);
  }

  analyzeBundleSize() {
    let totalSize = 0;
    let moduleCount = 0;
    const chunks = {};

    if (typeof window !== 'undefined' && window.__webpack_require__) {
      try {
        const webpackStats = window.__webpack_require__.cache || {};
        
        Object.values(webpackStats).forEach(module => {
          if (module && module.exports) {
            const moduleSize = JSON.stringify(module.exports).length;
            totalSize += moduleSize;
            moduleCount++;
          }
        });
      } catch (error) {
        console.warn('Bundle analysis failed:', error);
      }
    }

    return { totalSize, moduleCount, chunks };
  }

  getPerformanceReport() {
    const report = {
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      metrics: {},
      summary: {
        critical: 0,
        warnings: 0,
        passed: 0
      }
    };

    this.metrics.forEach((values, name) => {
      const latestMetric = values[values.length - 1];
      const average = values.reduce((sum, m) => sum + m.value, 0) / values.length;
      
      report.metrics[name] = {
        current: latestMetric.value,
        average: Math.round(average * 100) / 100,
        trend: this.calculateTrend(values),
        threshold: this.thresholds[name],
        status: this.getMetricStatus(name, latestMetric.value),
        metadata: latestMetric.metadata
      };

      // Update summary
      const status = report.metrics[name].status;
      if (status === 'critical') report.summary.critical++;
      else if (status === 'warning') report.summary.warnings++;
      else report.summary.passed++;
    });

    return report;
  }

  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-10);
    const older = values.slice(-20, -10);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 10) return 'improving';
    if (change < -10) return 'degrading';
    return 'stable';
  }

  getMetricStatus(name, value) {
    const threshold = this.thresholds[name];
    if (!threshold) return 'unknown';
    
    // Special handling for different metrics
    if (name === 'cls') {
      if (value <= 0.1) return 'good';
      if (value <= 0.25) return 'warning';
      return 'critical';
    }
    
    if (value <= threshold * 0.8) return 'good';
    if (value <= threshold) return 'warning';
    return 'critical';
  }

  queueReport(metric) {
    this.reportQueue.push(metric);
    
    // Send queued reports every 10 seconds
    if (!this.reportTimer) {
      this.reportTimer = setTimeout(() => {
        this.sendQueuedReports();
        this.reportTimer = null;
      }, 10000);
    }
  }

  async sendQueuedReports() {
    if (this.reportQueue.length === 0) return;
    
    try {
      const reports = [...this.reportQueue];
      this.reportQueue = [];
      
      // Send to analytics endpoint
      await this.sendToAnalytics(reports);
      
    } catch (error) {
      console.error('Failed to send performance reports:', error);
      // Re-queue failed reports
      this.reportQueue.unshift(...this.reportQueue);
    }
  }

  async sendToAnalytics(reports) {
    // Implementation would send to your analytics service
    // For now, just log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('Performance Reports');
      reports.forEach(report => {
        console.log(`${report.name}: ${report.value}ms`, report.metadata);
      });
      console.groupEnd();
    }
    
    // In production, send to analytics service
    if (process.env.REACT_APP_ANALYTICS_ENDPOINT) {
      await fetch(process.env.REACT_APP_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'performance', reports })
      });
    }
  }

  optimizeForDevice() {
    const deviceInfo = this.getDeviceInfo();
    
    // Apply device-specific optimizations
    if (deviceInfo.isMobile) {
      this.applyMobileOptimizations();
    }
    
    if (deviceInfo.isLowEnd) {
      this.applyLowEndOptimizations();
    }
    
    if (deviceInfo.isSlowNetwork) {
      this.applyNetworkOptimizations();
    }
  }

  getDeviceInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 2;
    
    return {
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isLowEnd: memory <= 2 || cores <= 2,
      isSlowNetwork: connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'),
      memory,
      cores,
      connection: connection ? {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      } : null
    };
  }

  applyMobileOptimizations() {
    // Reduce animation complexity
    document.documentElement.style.setProperty('--animation-duration', '200ms');
    
    // Lazy load images more aggressively
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => img.setAttribute('loading', 'lazy'));
  }

  applyLowEndOptimizations() {
    // Disable non-essential animations
    document.documentElement.style.setProperty('--animation-duration', '0ms');
    
    // Reduce complexity of visualizations
    this.emit('optimize:lowend', { reduceComplexity: true });
  }

  applyNetworkOptimizations() {
    // Increase compression
    // Defer non-critical resources
    this.emit('optimize:network', { deferNonCritical: true });
  }

  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    return this.sessionId;
  }

  emit(event, data) {
    if (this.eventHandlers && this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in performance monitor event handler for ${event}:`, error);
        }
      });
    }
  }

  on(event, handler) {
    if (!this.eventHandlers) {
      this.eventHandlers = {};
    }
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  destroy() {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Error disconnecting observer:', error);
      }
    });
    
    this.observers.clear();
    this.metrics.clear();
    
    if (this.reportTimer) {
      clearTimeout(this.reportTimer);
    }
    
    this.isMonitoring = false;
  }
}

export const performanceMonitor = new PerformanceMonitor();
