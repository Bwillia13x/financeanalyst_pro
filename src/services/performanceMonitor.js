// Performance Monitor for Model Lab
// Tracks performance metrics, memory usage, and optimization opportunities

class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.memorySnapshots = [];
    this.errorLog = [];
    this.isMonitoring = false;
    this.thresholds = {
      slowCalculation: 1000, // ms
      memoryWarning: 50, // MB
      errorRateThreshold: 0.05 // 5% error rate
    };
  }

  // Start performance monitoring
  startMonitoring() {
    this.isMonitoring = true;
    this.startMemoryMonitoring();
    this.startErrorMonitoring();
    console.log('Performance monitoring started');
  }

  // Stop performance monitoring
  stopMonitoring() {
    this.isMonitoring = false;
    console.log('Performance monitoring stopped');
  }

  // Memory monitoring
  startMemoryMonitoring() {
    if (!performance.memory) return;

    const checkMemory = () => {
      if (!this.isMonitoring) return;

      const memory = performance.memory;
      const snapshot = {
        timestamp: Date.now(),
        usedJSHeapSize: memory.usedJSHeapSize / 1024 / 1024, // MB
        totalJSHeapSize: memory.totalJSHeapSize / 1024 / 1024, // MB
        jsHeapSizeLimit: memory.jsHeapSizeLimit / 1024 / 1024 // MB
      };

      this.memorySnapshots.push(snapshot);

      // Keep only last 100 snapshots
      if (this.memorySnapshots.length > 100) {
        this.memorySnapshots.shift();
      }

      // Check memory threshold
      if (snapshot.usedJSHeapSize > this.thresholds.memoryWarning) {
        this.logWarning('High memory usage detected', {
          usedMemory: snapshot.usedJSHeapSize,
          threshold: this.thresholds.memoryWarning
        });
      }

      setTimeout(checkMemory, 5000); // Check every 5 seconds
    };

    checkMemory();
  }

  // Error monitoring
  startErrorMonitoring() {
    window.addEventListener('error', (event) => {
      this.logError('JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  // Performance timing
  startTimer(operationName) {
    const startTime = performance.now();

    return {
      end: (metadata = {}) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        const metric = {
          operation: operationName,
          duration,
          timestamp: Date.now(),
          metadata
        };

        this.metrics.push(metric);

        // Keep only last 1000 metrics
        if (this.metrics.length > 1000) {
          this.metrics.shift();
        }

        // Check performance threshold
        if (duration > this.thresholds.slowCalculation) {
          this.logWarning('Slow operation detected', {
            operation: operationName,
            duration,
            threshold: this.thresholds.slowCalculation
          });
        }

        return metric;
      }
    };
  }

  // Log error
  logError(type, details) {
    const error = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      timestamp: Date.now(),
      details,
      severity: 'error'
    };

    this.errorLog.push(error);

    // Keep only last 500 errors
    if (this.errorLog.length > 500) {
      this.errorLog.shift();
    }

    console.error(`[${type}]`, details);
  }

  // Log warning
  logWarning(type, details) {
    const warning = {
      id: `warn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      timestamp: Date.now(),
      details,
      severity: 'warning'
    };

    this.errorLog.push(warning);

    // Keep only last 500 errors/warnings
    if (this.errorLog.length > 500) {
      this.errorLog.shift();
    }

    console.warn(`[${type}]`, details);
  }

  // Get performance summary
  getPerformanceSummary() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const recentMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    const recentErrors = this.errorLog.filter(e => e.timestamp > oneHourAgo);
    const currentMemory = this.memorySnapshots[this.memorySnapshots.length - 1];

    // Calculate statistics
    const durations = recentMetrics.map(m => m.duration);
    const avgDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const maxDuration = durations.length ? Math.max(...durations) : 0;
    const slowOperations = recentMetrics.filter(m => m.duration > this.thresholds.slowCalculation);

    // Error rate
    const totalOperations = recentMetrics.length;
    const errorCount = recentErrors.filter(e => e.severity === 'error').length;
    const errorRate = totalOperations > 0 ? errorCount / totalOperations : 0;

    // Most common operations
    const operationCounts = {};
    recentMetrics.forEach(m => {
      operationCounts[m.operation] = (operationCounts[m.operation] || 0) + 1;
    });

    const topOperations = Object.entries(operationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      timeRange: 'Last hour',
      performance: {
        totalOperations,
        averageDuration: Math.round(avgDuration),
        maxDuration: Math.round(maxDuration),
        slowOperations: slowOperations.length,
        topOperations
      },
      memory: currentMemory ? {
        current: Math.round(currentMemory.usedJSHeapSize),
        total: Math.round(currentMemory.totalJSHeapSize),
        limit: Math.round(currentMemory.jsHeapSizeLimit),
        usage: Math.round((currentMemory.usedJSHeapSize / currentMemory.jsHeapSizeLimit) * 100)
      } : null,
      errors: {
        total: recentErrors.length,
        errors: recentErrors.filter(e => e.severity === 'error').length,
        warnings: recentErrors.filter(e => e.severity === 'warning').length,
        errorRate: Math.round(errorRate * 100)
      },
      health: this.getHealthScore()
    };
  }

  // Calculate overall health score
  getHealthScore() {
    const summary = this.getPerformanceSummary();
    let score = 100;

    // Deduct for slow operations
    if (summary.performance.slowOperations > 0) {
      score -= Math.min(20, summary.performance.slowOperations * 2);
    }

    // Deduct for high error rate
    if (summary.errors.errorRate > 5) {
      score -= Math.min(30, (summary.errors.errorRate - 5) * 2);
    }

    // Deduct for high memory usage
    if (summary.memory?.usage > 80) {
      score -= Math.min(20, (summary.memory.usage - 80));
    }

    // Deduct for very slow average performance
    if (summary.performance.averageDuration > 500) {
      score -= Math.min(25, (summary.performance.averageDuration - 500) / 20);
    }

    return Math.max(0, Math.round(score));
  }

  // Get optimization recommendations
  getOptimizationRecommendations() {
    const summary = this.getPerformanceSummary();
    const recommendations = [];

    // Memory recommendations
    if (summary.memory?.usage > 70) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        title: 'High Memory Usage',
        description: 'Consider implementing pagination or data virtualization for large model sets',
        action: 'Optimize memory usage'
      });
    }

    // Performance recommendations
    if (summary.performance.slowOperations > 5) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Slow Operations Detected',
        description: 'Multiple operations are taking longer than expected. Consider debouncing or caching',
        action: 'Optimize calculations'
      });
    }

    if (summary.performance.averageDuration > 300) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Slow Average Performance',
        description: 'Consider using Web Workers for heavy calculations',
        action: 'Implement background processing'
      });
    }

    // Error recommendations
    if (summary.errors.errorRate > 3) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'High Error Rate',
        description: 'Improve input validation and error handling',
        action: 'Enhance error handling'
      });
    }

    return recommendations;
  }

  // Clear all data
  clear() {
    this.metrics = [];
    this.memorySnapshots = [];
    this.errorLog = [];
  }

  // Export performance data
  exportData() {
    return {
      metrics: this.metrics,
      memorySnapshots: this.memorySnapshots,
      errorLog: this.errorLog,
      summary: this.getPerformanceSummary(),
      recommendations: this.getOptimizationRecommendations(),
      exportedAt: new Date().toISOString()
    };
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in development
if (import.meta.env.DEV) {
  performanceMonitor.startMonitoring();
}

export default performanceMonitor;
