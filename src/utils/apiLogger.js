/**
 * Enhanced API logging and monitoring utility
 * Provides comprehensive logging, metrics collection, and performance monitoring
 */

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// Default configuration
const DEFAULT_CONFIG = {
  logLevel: LOG_LEVELS.INFO,
  enableMetrics: true,
  enablePerformanceTracking: true,
  enableErrorTracking: true,
  maxLogHistory: 1000,
  metricsRetentionPeriod: 24 * 60 * 60 * 1000 // 24 hours
};

/**
 * API Logger class for comprehensive monitoring
 */
class ApiLogger {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logs = [];
    this.metrics = new Map();
    this.performanceData = new Map();
    this.errorCounts = new Map();
    this.startTime = Date.now();
  }

  /**
   * Log a message with specified level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata
   */
  log(level, message, metadata = {}) {
    const levelValue = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;

    if (levelValue <= this.config.logLevel) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        message,
        metadata,
        id: this.generateLogId()
      };

      this.logs.push(logEntry);
      this.trimLogs();

      // Console output with formatting
      this.outputToConsole(logEntry);
    }
  }

  /**
   * Log API request start
   * @param {string} service - Service name (e.g., 'FMP', 'ALPHA_VANTAGE')
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @returns {string} Request ID for tracking
   */
  logApiRequest(service, endpoint, params = {}) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    this.log('INFO', '🚀 API Request Started', {
      requestId,
      service,
      endpoint,
      params: this.sanitizeParams(params),
      startTime
    });

    // Store performance tracking data
    this.performanceData.set(requestId, {
      service,
      endpoint,
      startTime,
      params: this.sanitizeParams(params)
    });

    return requestId;
  }

  /**
   * Log API request completion
   * @param {string} requestId - Request ID from logApiRequest
   * @param {boolean} success - Whether request was successful
   * @param {Object} response - Response data (will be sanitized)
   * @param {Error} error - Error object if request failed
   */
  logApiResponse(requestId, success, response = null, error = null) {
    const performanceData = this.performanceData.get(requestId);
    if (!performanceData) {
      this.log('WARN', 'No performance data found for request', { requestId });
      return;
    }

    const endTime = Date.now();
    const duration = endTime - performanceData.startTime;
    const { service, endpoint } = performanceData;

    if (success) {
      this.log('INFO', '✅ API Request Completed', {
        requestId,
        service,
        endpoint,
        duration,
        responseSize: this.getResponseSize(response),
        success: true
      });

      this.recordMetric(service, 'success', 1);
    } else {
      this.log('ERROR', '❌ API Request Failed', {
        requestId,
        service,
        endpoint,
        duration,
        error: error
          ? {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            statusText: error.response?.statusText
          }
          : null,
        success: false
      });

      this.recordMetric(service, 'error', 1);
      this.recordError(service, error);
    }

    // Record performance metrics
    this.recordMetric(service, 'duration', duration);
    this.recordMetric(service, 'requests', 1);

    // Clean up performance data
    this.performanceData.delete(requestId);
  }

  /**
   * Log rate limiting events
   * @param {string} service - Service name
   * @param {number} waitTime - Time to wait in milliseconds
   * @param {number} remainingRequests - Remaining requests in current period
   */
  logRateLimit(service, waitTime, remainingRequests = null) {
    this.log('WARN', '⏱️ Rate Limit Hit', {
      service,
      waitTime,
      remainingRequests,
      action: 'throttling'
    });

    this.recordMetric(service, 'rateLimitHits', 1);
  }

  /**
   * Log circuit breaker events
   * @param {string} service - Service name
   * @param {string} state - Circuit breaker state
   * @param {string} action - Action taken
   * @param {Object} metadata - Additional metadata
   */
  logCircuitBreaker(service, state, action, metadata = {}) {
    const emoji =
      {
        OPEN: '🚨',
        HALF_OPEN: '🔄',
        CLOSED: '✅'
      }[state] || '🔧';

    this.log('WARN', `${emoji} Circuit Breaker ${action}`, {
      service,
      state,
      action,
      ...metadata
    });

    this.recordMetric(service, `circuitBreaker_${state.toLowerCase()}`, 1);
  }

  /**
   * Log cache events
   * @param {string} operation - Cache operation (hit, miss, set, clear)
   * @param {string} key - Cache key
   * @param {Object} metadata - Additional metadata
   */
  logCache(operation, key, metadata = {}) {
    const emoji =
      {
        hit: '🎯',
        miss: '❌',
        set: '💾',
        clear: '🗑️'
      }[operation] || '📦';

    this.log('DEBUG', `${emoji} Cache ${operation.toUpperCase()}`, {
      operation,
      key: this.sanitizeCacheKey(key),
      ...metadata
    });

    this.recordMetric('cache', operation, 1);
  }

  /**
   * Record a metric
   * @param {string} service - Service name
   * @param {string} metric - Metric name
   * @param {number} value - Metric value
   */
  recordMetric(service, metric, value) {
    if (!this.config.enableMetrics) return;

    const key = `${service}.${metric}`;
    const now = Date.now();

    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        values: [],
        total: 0,
        count: 0,
        min: Infinity,
        max: -Infinity,
        avg: 0
      });
    }

    const metricData = this.metrics.get(key);
    metricData.values.push({ value, timestamp: now });
    metricData.total += value;
    metricData.count += 1;
    metricData.min = Math.min(metricData.min, value);
    metricData.max = Math.max(metricData.max, value);
    metricData.avg = metricData.total / metricData.count;

    // Clean old metrics
    this.cleanOldMetrics(key);
  }

  /**
   * Record an error for tracking
   * @param {string} service - Service name
   * @param {Error} error - Error object
   */
  recordError(service, error) {
    if (!this.config.enableErrorTracking || !error) return;

    const errorKey = `${service}.${error.message}`;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);
  }

  /**
   * Get comprehensive metrics summary
   * @returns {Object} Metrics summary
   */
  getMetrics() {
    const summary = {
      uptime: Date.now() - this.startTime,
      totalLogs: this.logs.length,
      services: {},
      cache: {},
      errors: {}
    };

    // Process service metrics
    for (const [key, data] of this.metrics.entries()) {
      const [service, metric] = key.split('.');

      if (service === 'cache') {
        summary.cache[metric] = {
          total: data.total,
          count: data.count,
          avg: data.avg
        };
      } else {
        if (!summary.services[service]) {
          summary.services[service] = {};
        }

        summary.services[service][metric] = {
          total: data.total,
          count: data.count,
          min: data.min === Infinity ? 0 : data.min,
          max: data.max === -Infinity ? 0 : data.max,
          avg: data.avg
        };
      }
    }

    // Process error counts
    for (const [errorKey, count] of this.errorCounts.entries()) {
      const [service, ...messageParts] = errorKey.split('.');
      const message = messageParts.join('.');

      if (!summary.errors[service]) {
        summary.errors[service] = {};
      }

      summary.errors[service][message] = count;
    }

    return summary;
  }

  /**
   * Get recent logs
   * @param {number} limit - Maximum number of logs to return
   * @param {string} level - Filter by log level
   * @returns {Array} Recent log entries
   */
  getRecentLogs(limit = 100, level = null) {
    let logs = [...this.logs];

    if (level) {
      logs = logs.filter(log => log.level === level.toUpperCase());
    }

    return logs.slice(-limit).reverse();
  }

  /**
   * Clear all logs and metrics
   */
  clear() {
    this.logs = [];
    this.metrics.clear();
    this.performanceData.clear();
    this.errorCounts.clear();
    this.startTime = Date.now();
  }

  // Private helper methods
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sanitizeParams(params) {
    const sanitized = { ...params };
    // Remove sensitive data
    if (sanitized.apikey) sanitized.apikey = '***';
    if (sanitized.api_key) sanitized.api_key = '***';
    if (sanitized.token) sanitized.token = '***';
    return sanitized;
  }

  sanitizeCacheKey(key) {
    // Truncate long cache keys for readability
    return key.length > 50 ? `${key.substring(0, 47)}...` : key;
  }

  getResponseSize(response) {
    if (!response) return 0;
    try {
      return JSON.stringify(response).length;
    } catch {
      return 0;
    }
  }

  trimLogs() {
    if (this.logs.length > this.config.maxLogHistory) {
      this.logs = this.logs.slice(-this.config.maxLogHistory);
    }
  }

  cleanOldMetrics(key) {
    const metricData = this.metrics.get(key);
    const cutoff = Date.now() - this.config.metricsRetentionPeriod;

    metricData.values = metricData.values.filter(item => item.timestamp > cutoff);
  }

  outputToConsole(logEntry) {
    // Skip console output in production
    if (import.meta.env.PROD) {
      return;
    }

    const { level, message, metadata } = logEntry;
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();

    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m', // Yellow
      INFO: '\x1b[36m', // Cyan
      DEBUG: '\x1b[35m', // Magenta
      TRACE: '\x1b[37m' // White
    };

    const reset = '\x1b[0m';
    const color = colors[level] || colors.INFO;

    // eslint-disable-next-line no-console
    console.log(
      `${color}[${timestamp}] ${level}:${reset} ${message}`,
      Object.keys(metadata).length > 0 ? metadata : ''
    );
  }
}

// Export singleton instance
export const apiLogger = new ApiLogger();
export default ApiLogger;
