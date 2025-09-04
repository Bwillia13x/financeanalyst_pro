/**
 * Production Monitoring System for FinanceAnalyst Pro CLI
 * Comprehensive monitoring, logging, and alerting for production deployment
 */

export class ProductionMonitor {
  constructor(options = {}) {
    this.options = {
      enableMetrics: true,
      enableLogging: true,
      enableAlerts: true,
      enableHealthChecks: true,
      logLevel: 'info',
      metricsInterval: 30000, // 30 seconds
      alertThresholds: {
        errorRate: 0.15, // 15% error rate (more reasonable for testing/development)
        responseTime: 5000, // 5 seconds (more lenient)
        memoryUsage: 0.9, // 90% memory usage (higher threshold)
        commandRate: 200 // commands per minute (higher threshold)
      },
      ...options
    };

    // Monitoring state
    this.metrics = {
      commands: {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        ratePerMinute: 0
      },
      users: {
        active: 0,
        total: 0,
        peakConcurrent: 0
      },
      security: {
        blockedRequests: 0,
        rateLimitHits: 0,
        suspiciousPatterns: 0,
        authFailures: 0
      },
      performance: {
        memoryUsage: 0,
        cpuUsage: 0,
        networkRequests: 0,
        cacheHitRate: 0
      },
      errors: {
        total: 0,
        byType: new Map(),
        recent: []
      }
    };

    // Monitoring intervals
    this.intervals = new Map();

    // Alert state
    this.alerts = {
      active: new Map(),
      history: [],
      thresholds: this.options.alertThresholds
    };

    // Health check state
    this.health = {
      status: 'healthy',
      lastCheck: null,
      checks: new Map(),
      uptime: 0
    };

    console.log('📊 Production Monitor initialized');
  }

  /**
   * Start monitoring system
   */
  async start() {
    console.log('🚀 Starting production monitoring...');

    // Start metrics collection
    if (this.options.enableMetrics) {
      this.startMetricsCollection();
    }

    // Start health checks
    if (this.options.enableHealthChecks) {
      this.startHealthChecks();
    }

    // Initialize uptime tracking
    this.startTime = Date.now();

    console.log('✅ Production monitoring started');
  }

  /**
   * Stop monitoring system
   */
  async stop() {
    console.log('🛑 Stopping production monitoring...');

    // Clear all intervals
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();

    console.log('✅ Production monitoring stopped');
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    // Collect metrics every 30 seconds
    const metricsInterval = setInterval(() => {
      this.collectMetrics();
      this.checkThresholds();
    }, this.options.metricsInterval);

    this.intervals.set('metrics', metricsInterval);

    // Collect performance metrics every 10 seconds
    const performanceInterval = setInterval(() => {
      this.collectPerformanceMetrics();
    }, 10000);

    this.intervals.set('performance', performanceInterval);

    console.log('📈 Metrics collection started');
  }

  /**
   * Start health checks
   */
  startHealthChecks() {
    // Health check every 60 seconds
    const healthInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000);

    this.intervals.set('health', healthInterval);

    // Initial health check
    this.performHealthCheck();

    console.log('🏥 Health checks started');
  }

  /**
   * Record command execution
   */
  recordCommand(command, success, responseTime, context = {}) {
    this.metrics.commands.total++;

    if (success) {
      this.metrics.commands.successful++;
    } else {
      this.metrics.commands.failed++;
    }

    // Update average response time
    const totalTime =
      this.metrics.commands.avgResponseTime * (this.metrics.commands.total - 1) + responseTime;
    this.metrics.commands.avgResponseTime = totalTime / this.metrics.commands.total;

    // Log command execution
    this.log('info', 'Command executed', {
      command: command.name || command,
      success,
      responseTime,
      userId: context.userId,
      sessionId: context.sessionId
    });

    // Update command rate
    this.updateCommandRate();
  }

  /**
   * Record security event
   */
  recordSecurityEvent(eventType, details = {}) {
    switch (eventType) {
      case 'rate_limit_exceeded':
        this.metrics.security.rateLimitHits++;
        break;
      case 'suspicious_pattern':
        this.metrics.security.suspiciousPatterns++;
        break;
      case 'blocked_request':
        this.metrics.security.blockedRequests++;
        break;
      case 'auth_failure':
        this.metrics.security.authFailures++;
        break;
    }

    // Log security event
    this.log('warn', `Security event: ${eventType}`, details);

    // Check if this triggers an alert
    this.checkSecurityAlerts(eventType, details);
  }

  /**
   * Record error
   */
  recordError(error, context = {}) {
    this.metrics.errors.total++;

    // Track error by type
    const errorType = error.name || error.constructor.name || 'Unknown';
    const currentCount = this.metrics.errors.byType.get(errorType) || 0;
    this.metrics.errors.byType.set(errorType, currentCount + 1);

    // Add to recent errors (keep last 10)
    this.metrics.errors.recent.unshift({
      timestamp: new Date().toISOString(),
      error: error.message,
      type: errorType,
      stack: error.stack,
      context
    });

    if (this.metrics.errors.recent.length > 10) {
      this.metrics.errors.recent = this.metrics.errors.recent.slice(0, 10);
    }

    // Log error
    this.log('error', 'Error recorded', {
      message: error.message,
      type: errorType,
      stack: error.stack,
      context
    });

    // Check error rate alert
    this.checkErrorRateAlert();
  }

  /**
   * Update user activity
   */
  updateUserActivity(userId, action = 'active') {
    if (action === 'login') {
      this.metrics.users.total++;
    }

    // Update active users (simplified - in production, use session tracking)
    this.metrics.users.active = Math.max(1, this.metrics.users.active);
    this.metrics.users.peakConcurrent = Math.max(
      this.metrics.users.peakConcurrent,
      this.metrics.users.active
    );
  }

  /**
   * Collect comprehensive metrics
   */
  collectMetrics() {
    const now = Date.now();

    // Calculate uptime
    this.health.uptime = now - this.startTime;

    // Calculate error rate
    const errorRate =
      this.metrics.commands.total > 0
        ? this.metrics.commands.failed / this.metrics.commands.total
        : 0;

    // Update metrics object with calculated values
    this.metrics.commands.errorRate = errorRate;
    this.metrics.performance.uptime = this.health.uptime;

    // Log metrics summary
    if (this.metrics.commands.total > 0) {
      this.log('info', 'Metrics collected', {
        commandsTotal: this.metrics.commands.total,
        successRate:
          ((this.metrics.commands.successful / this.metrics.commands.total) * 100).toFixed(2) + '%',
        avgResponseTime: this.metrics.commands.avgResponseTime.toFixed(2) + 'ms',
        errorRate: (errorRate * 100).toFixed(2) + '%',
        activeUsers: this.metrics.users.active
      });
    }
  }

  /**
   * Collect performance metrics
   */
  collectPerformanceMetrics() {
    if (typeof performance !== 'undefined') {
      // Browser performance metrics
      const memory = performance.memory;
      if (memory) {
        this.metrics.performance.memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
      }
    }

    // Update performance metrics
    this.metrics.performance.timestamp = Date.now();
  }

  /**
   * Update command rate per minute
   */
  updateCommandRate() {
    // Simple rate calculation - in production, use sliding window
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // This is a simplified calculation - production would use proper rate calculation
    this.metrics.commands.ratePerMinute = Math.round(
      this.metrics.commands.total / Math.max(1, (now - this.startTime) / 60000)
    );
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      checks: {},
      overall: 'healthy'
    };

    try {
      // Memory health check
      const memoryHealthy = this.metrics.performance.memoryUsage < 0.9;
      healthCheck.checks.memory = {
        status: memoryHealthy ? 'healthy' : 'warning',
        value: (this.metrics.performance.memoryUsage * 100).toFixed(2) + '%'
      };

      // Error rate health check
      const errorRate =
        this.metrics.commands.total > 0
          ? this.metrics.commands.failed / this.metrics.commands.total
          : 0;
      const errorRateHealthy = errorRate < this.options.alertThresholds.errorRate;
      healthCheck.checks.errorRate = {
        status: errorRateHealthy ? 'healthy' : 'critical',
        value: (errorRate * 100).toFixed(2) + '%'
      };

      // Response time health check
      const responseTimeHealthy =
        this.metrics.commands.avgResponseTime < this.options.alertThresholds.responseTime;
      healthCheck.checks.responseTime = {
        status: responseTimeHealthy ? 'healthy' : 'warning',
        value: this.metrics.commands.avgResponseTime.toFixed(2) + 'ms'
      };

      // Overall health determination
      const criticalChecks = Object.values(healthCheck.checks).filter(
        check => check.status === 'critical'
      );
      const warningChecks = Object.values(healthCheck.checks).filter(
        check => check.status === 'warning'
      );

      if (criticalChecks.length > 0) {
        healthCheck.overall = 'critical';
      } else if (warningChecks.length > 0) {
        healthCheck.overall = 'warning';
      }

      // Update health state
      this.health.status = healthCheck.overall;
      this.health.lastCheck = healthCheck.timestamp;
      this.health.checks = healthCheck.checks;

      // Log health check results
      this.log('info', `Health check: ${healthCheck.overall}`, healthCheck.checks);

      // Trigger alerts if needed
      if (healthCheck.overall === 'critical') {
        this.triggerAlert('critical_health', 'System health is critical', healthCheck);
      } else if (healthCheck.overall === 'warning') {
        this.triggerAlert('warning_health', 'System health warnings detected', healthCheck);
      }
    } catch (error) {
      this.log('error', 'Health check failed', { error: error.message });
      this.health.status = 'unknown';
    }
  }

  /**
   * Check thresholds and trigger alerts
   */
  checkThresholds() {
    // Check error rate threshold
    const errorRate =
      this.metrics.commands.total > 0
        ? this.metrics.commands.failed / this.metrics.commands.total
        : 0;

    if (errorRate > this.options.alertThresholds.errorRate) {
      this.triggerAlert('high_error_rate', `Error rate is ${errorRate.toFixed(2)}%`, {
        errorRate: errorRate.toFixed(2) + '%',
        threshold: this.options.alertThresholds.errorRate * 100 + '%'
      });
    }

    // Check response time threshold
    if (this.metrics.commands.avgResponseTime > this.options.alertThresholds.responseTime) {
      this.triggerAlert(
        'slow_response_time',
        `Average response time is ${this.metrics.commands.avgResponseTime}ms`,
        {
          responseTime: this.metrics.commands.avgResponseTime + 'ms',
          threshold: this.options.alertThresholds.responseTime + 'ms'
        }
      );
    }

    // Check memory usage threshold
    if (this.metrics.performance.memoryUsage > this.options.alertThresholds.memoryUsage) {
      this.triggerAlert(
        'high_memory_usage',
        `Memory usage is ${(this.metrics.performance.memoryUsage * 100).toFixed(2)}%`,
        {
          memoryUsage: (this.metrics.performance.memoryUsage * 100).toFixed(2) + '%',
          threshold: this.options.alertThresholds.memoryUsage * 100 + '%'
        }
      );
    }
  }

  /**
   * Check security alerts
   */
  checkSecurityAlerts(eventType, details) {
    // Check for security alert thresholds
    if (this.metrics.security.rateLimitHits > 10) {
      this.triggerAlert('security_rate_limit_spike', 'High rate of rate limit hits detected', {
        rateLimitHits: this.metrics.security.rateLimitHits
      });
    }

    if (this.metrics.security.suspiciousPatterns > 5) {
      this.triggerAlert(
        'security_suspicious_patterns',
        'High number of suspicious patterns detected',
        {
          suspiciousPatterns: this.metrics.security.suspiciousPatterns
        }
      );
    }
  }

  /**
   * Check error rate alert
   */
  checkErrorRateAlert() {
    const errorRate =
      this.metrics.commands.total > 0
        ? this.metrics.commands.failed / this.metrics.commands.total
        : 0;

    if (errorRate > 0.1) {
      // 10% error rate
      this.triggerAlert('high_error_rate', `Error rate exceeded 10%: ${errorRate.toFixed(2)}%`, {
        errorRate: errorRate.toFixed(2) + '%'
      });
    }
  }

  /**
   * Trigger alert
   */
  triggerAlert(alertType, message, details = {}) {
    if (!this.options.enableAlerts) return;

    const alert = {
      id: crypto.randomUUID(),
      type: alertType,
      message,
      details,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(alertType),
      status: 'active'
    };

    // Store active alert
    this.alerts.active.set(alertType, alert);

    // Add to history
    this.alerts.history.unshift(alert);

    // Keep only last 100 alerts
    if (this.alerts.history.length > 100) {
      this.alerts.history = this.alerts.history.slice(0, 100);
    }

    // Log alert
    this.log('error', `ALERT: ${message}`, { alertType, details });

    // In production, this would send alerts to monitoring systems
    console.warn(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${message}`, details);
  }

  /**
   * Get alert severity
   */
  getAlertSeverity(alertType) {
    const severityMap = {
      critical_health: 'critical',
      high_error_rate: 'critical',
      security_rate_limit_spike: 'high',
      security_suspicious_patterns: 'high',
      warning_health: 'warning',
      slow_response_time: 'warning',
      high_memory_usage: 'warning'
    };

    return severityMap[alertType] || 'info';
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertType) {
    const alert = this.alerts.active.get(alertType);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date().toISOString();

      this.log('info', `Alert resolved: ${alertType}`, {
        alertId: alert.id,
        duration: Date.now() - new Date(alert.timestamp).getTime()
      });

      // Move to history
      this.alerts.active.delete(alertType);
    }
  }

  /**
   * Log message
   */
  log(level, message, data = {}) {
    if (!this.options.enableLogging) return;

    const logLevels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = logLevels.indexOf(this.options.logLevel);
    const messageLevelIndex = logLevels.indexOf(level);

    if (messageLevelIndex < currentLevelIndex) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      source: 'production-monitor'
    };

    // Console logging with appropriate level
    const consoleMethod =
      level === 'debug' ? 'debug' : level === 'info' ? 'info' : level === 'warn' ? 'warn' : 'error';

    console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data);

    // In production, this would send logs to logging service
    // this.sendToLoggingService(logEntry);
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      health: this.health,
      alerts: {
        active: Array.from(this.alerts.active.values()),
        recent: this.alerts.history.slice(0, 10)
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get health status
   */
  getHealth() {
    return {
      status: this.health.status,
      uptime: this.health.uptime,
      lastCheck: this.health.lastCheck,
      checks: this.health.checks,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get health status (alias for getHealth)
   */
  getHealthStatus() {
    return this.getHealth();
  }

  /**
   * Get alerts
   */
  getAlerts() {
    return {
      active: Array.from(this.alerts.active.values()),
      recent: this.alerts.history.slice(0, 5),
      total: this.alerts.history.length
    };
  }

  /**
   * Export monitoring data
   */
  exportData() {
    return {
      metrics: this.getMetrics(),
      health: this.getHealth(),
      alerts: this.getAlerts(),
      config: this.options,
      exportTime: new Date().toISOString()
    };
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics() {
    this.metrics = {
      commands: {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        ratePerMinute: 0
      },
      users: {
        active: 0,
        total: 0,
        peakConcurrent: 0
      },
      security: {
        blockedRequests: 0,
        rateLimitHits: 0,
        suspiciousPatterns: 0,
        authFailures: 0
      },
      performance: {
        memoryUsage: 0,
        cpuUsage: 0,
        networkRequests: 0,
        cacheHitRate: 0
      },
      errors: {
        total: 0,
        byType: new Map(),
        recent: []
      }
    };

    this.alerts.active.clear();
    this.log('info', 'Metrics reset');
  }
}

// Create singleton instance
export const productionMonitor = new ProductionMonitor();

// Auto-start in production
if (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost') {
  productionMonitor.start();
}
