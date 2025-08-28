/**
 * Centralized error handling service for FinanceAnalyst Pro
 * Provides consistent error logging, monitoring, and user feedback
 */

class ErrorService {
  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.errorQueue = [];
    this.maxQueueSize = 100;
    this.flushInterval = 30000; // 30 seconds

    // Start periodic error flushing in production
    if (this.isProduction) {
      this.startPeriodicFlush();
    }
  }

  /**
   * Log an error with context and severity
   */
  logError(error, context = {}, severity = 'error') {
    const errorEntry = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      severity,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: context.userId || 'anonymous',
        component: context.component,
        action: context.action,
        additionalData: context.data
      },
      fingerprint: this.generateFingerprint(error)
    };

    // Add to queue for batch processing
    this.errorQueue.push(errorEntry);

    // Trim queue if too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }

    // Log to console in development
    if (!this.isProduction) {
      console.error('ErrorService:', errorEntry);
    }

    // Send immediately for critical errors
    if (severity === 'critical') {
      this.flushErrors();
    }

    return errorEntry.id;
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate error fingerprint for deduplication
   */
  generateFingerprint(error) {
    const message = error.message || '';
    const stack = (error.stack || '').split('\n').slice(0, 3).join('');
    return btoa(message + stack).substr(0, 16);
  }

  /**
   * Handle financial calculation errors
   */
  logFinancialError(error, calculationType, inputData) {
    return this.logError(
      error,
      {
        component: 'FinancialCalculator',
        action: calculationType,
        data: {
          calculationType,
          inputData: this.sanitizeFinancialData(inputData)
        }
      },
      'warning'
    );
  }

  /**
   * Handle API errors
   */
  logApiError(error, endpoint, requestData) {
    return this.logError(
      error,
      {
        component: 'ApiService',
        action: 'apiRequest',
        data: {
          endpoint,
          method: requestData?.method,
          status: error.status || error.code
        }
      },
      error.status >= 500 ? 'error' : 'warning'
    );
  }

  /**
   * Handle component rendering errors
   */
  logComponentError(error, componentName, props) {
    return this.logError(
      error,
      {
        component: componentName,
        action: 'render',
        data: {
          propsKeys: Object.keys(props || {}),
          propsSize: JSON.stringify(props || {}).length
        }
      },
      'error'
    );
  }

  /**
   * Handle data validation errors
   */
  logValidationError(error, fieldName, value) {
    return this.logError(
      error,
      {
        component: 'DataValidator',
        action: 'validation',
        data: {
          fieldName,
          valueType: typeof value,
          valueLength: value?.length || 0
        }
      },
      'warning'
    );
  }

  /**
   * Sanitize financial data for logging (remove sensitive info)
   */
  sanitizeFinancialData(data) {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };
    const sensitiveFields = ['ssn', 'accountNumber', 'routingNumber', 'taxId'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Start periodic error flushing
   */
  startPeriodicFlush() {
    setInterval(() => {
      if (this.errorQueue.length > 0) {
        this.flushErrors();
      }
    }, this.flushInterval);
  }

  /**
   * Flush errors to monitoring service
   */
  async flushErrors() {
    if (this.errorQueue.length === 0) return;

    const errorsToFlush = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // In a real implementation, send to your monitoring service
      // await this.sendToMonitoringService(errorsToFlush);

      // For now, just log in production
      if (this.isProduction) {
        console.warn('Errors would be sent to monitoring service:', errorsToFlush);
      }
    } catch (flushError) {
      console.error('Failed to flush errors:', flushError);
      // Re-add errors to queue for retry
      this.errorQueue.unshift(...errorsToFlush.slice(-10)); // Keep last 10 errors
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error, context = {}) {
    const { component, action } = context;

    // Network errors
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return 'Unable to connect to our servers. Please check your internet connection and try again.';
    }

    // API errors
    if (error.status) {
      if (error.status >= 500) {
        return 'Our servers are experiencing issues. Please try again in a few moments.';
      }
      if (error.status === 404) {
        return 'The requested data could not be found. It may have been moved or deleted.';
      }
      if (error.status === 403) {
        return 'You do not have permission to access this resource.';
      }
      if (error.status === 401) {
        return 'Your session has expired. Please log in again.';
      }
    }

    // Component-specific errors
    if (component === 'FinancialCalculator') {
      return 'There was an error processing the financial calculation. Please check your input values.';
    }

    if (component === 'FinancialSpreadsheet') {
      return 'Unable to load the spreadsheet data. Please try refreshing the page.';
    }

    if (component === 'ChartRenderer') {
      return 'Unable to display the chart. The data format may be invalid.';
    }

    // Data validation errors
    if (action === 'validation') {
      return 'The entered data is not in the expected format. Please check your input and try again.';
    }

    // Generic errors
    return 'Something unexpected happened. Our team has been notified and is working on a fix.';
  }

  /**
   * Check if error should be retried
   */
  shouldRetry(error, retryCount = 0) {
    const maxRetries = 3;

    if (retryCount >= maxRetries) return false;

    // Retry network errors
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return true;
    }

    // Retry 5xx server errors
    if (error.status >= 500) {
      return true;
    }

    // Retry timeout errors
    if (error.message?.includes('timeout')) {
      return true;
    }

    return false;
  }

  /**
   * Get recovery suggestions for errors
   */
  getRecoverySuggestions(error, context = {}) {
    const suggestions = [];

    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try refreshing the page');
      suggestions.push('Contact support if the issue persists');
    } else if (error.status >= 500) {
      suggestions.push('Try again in a few minutes');
      suggestions.push('Check our status page for known issues');
      suggestions.push('Contact support if the problem continues');
    } else if (context.component === 'FinancialSpreadsheet') {
      suggestions.push('Verify your data format is correct');
      suggestions.push('Try with a smaller dataset');
      suggestions.push('Export your data before retrying');
    } else {
      suggestions.push('Refresh the page');
      suggestions.push('Clear your browser cache');
      suggestions.push('Try again later');
    }

    return suggestions;
  }
}

// Create singleton instance
const errorService = new ErrorService();

// Export helper functions for common use cases
export const logError = (error, context, severity) =>
  errorService.logError(error, context, severity);

export const logFinancialError = (error, calculationType, inputData) =>
  errorService.logFinancialError(error, calculationType, inputData);

export const logApiError = (error, endpoint, requestData) =>
  errorService.logApiError(error, endpoint, requestData);

export const logComponentError = (error, componentName, props) =>
  errorService.logComponentError(error, componentName, props);

export const logValidationError = (error, fieldName, value) =>
  errorService.logValidationError(error, fieldName, value);

export const getUserFriendlyMessage = (error, context) =>
  errorService.getUserFriendlyMessage(error, context);

export const shouldRetry = (error, retryCount) => errorService.shouldRetry(error, retryCount);

export const getRecoverySuggestions = (error, context) =>
  errorService.getRecoverySuggestions(error, context);

export default errorService;
