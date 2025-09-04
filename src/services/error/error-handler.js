/**
 * Comprehensive Error Handling System for FinanceAnalyst Pro CLI
 * Advanced error classification, recovery, and user-friendly messaging
 */

export class ErrorHandler {
  constructor(cli, options = {}) {
    this.cli = cli;
    this.options = {
      enableErrorRecovery: true,
      enableDetailedLogging: true,
      enableUserFriendlyMessages: true,
      maxRetries: 3,
      retryDelay: 1000,
      errorClassification: true,
      userMessageTemplates: true,
      ...options
    };

    // Error classification
    this.errorTypes = {
      NETWORK: 'network',
      PERMISSION: 'permission',
      VALIDATION: 'validation',
      EXECUTION: 'execution',
      SECURITY: 'security',
      RESOURCE: 'resource',
      CONFIGURATION: 'configuration',
      UNKNOWN: 'unknown'
    };

    // Error recovery strategies
    this.recoveryStrategies = new Map([
      ['network', this.handleNetworkError.bind(this)],
      ['permission', this.handlePermissionError.bind(this)],
      ['validation', this.handleValidationError.bind(this)],
      ['execution', this.handleExecutionError.bind(this)],
      ['security', this.handleSecurityError.bind(this)],
      ['resource', this.handleResourceError.bind(this)],
      ['configuration', this.handleConfigurationError.bind(this)]
    ]);

    // User-friendly error messages
    this.userMessages = {
      network: {
        ECONNREFUSED:
          'Unable to connect to the service. Please check your internet connection and try again.',
        ENOTFOUND: 'Service not found. Please verify the service URL and try again.',
        ETIMEDOUT:
          'Request timed out. The service may be experiencing high load. Please try again later.',
        default: 'Network error occurred. Please check your connection and try again.'
      },
      permission: {
        MISSING_PERMISSION:
          "You don't have permission to perform this action. Please contact your administrator.",
        INSUFFICIENT_ROLE:
          "Your current role doesn't allow this operation. Please upgrade your access level.",
        SESSION_EXPIRED: 'Your session has expired. Please log in again.',
        default: 'Permission denied. You may not have the required access rights.'
      },
      validation: {
        INVALID_COMMAND:
          'The command you entered is not valid. Use "help" to see available commands.',
        INVALID_ARGUMENTS:
          'The arguments provided are not valid. Check the command usage with "help <command>".',
        MISSING_REQUIRED:
          'Required information is missing. Please provide all necessary parameters.',
        default: 'Invalid input provided. Please check your command and try again.'
      },
      execution: {
        COMMAND_NOT_FOUND:
          'The requested command was not found. Use "help" to see available commands.',
        COMMAND_FAILED: 'The command execution failed. Please try again or contact support.',
        SANDBOX_ERROR: 'Command execution encountered an error. Please try a different approach.',
        default: 'Command execution failed. Please try again.'
      },
      security: {
        RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment before trying again.',
        SUSPICIOUS_ACTIVITY:
          'Suspicious activity detected. Your request has been blocked for security.',
        INVALID_INPUT: 'Potentially unsafe input detected. Please review your command.',
        default: 'Security error occurred. Your request has been blocked.'
      },
      resource: {
        OUT_OF_MEMORY: 'System is running low on memory. Please try again later.',
        DISK_FULL: 'Storage space is full. Please free up space and try again.',
        CPU_OVERLOAD: 'System is experiencing high load. Please try again later.',
        default: 'Resource limitation encountered. Please try again later.'
      },
      configuration: {
        CONFIG_MISSING: 'System configuration is incomplete. Please contact support.',
        SERVICE_UNAVAILABLE: 'Required service is currently unavailable. Please try again later.',
        FEATURE_DISABLED: 'This feature is currently disabled. Please contact your administrator.',
        default: 'Configuration error occurred. Please contact support.'
      }
    };

    // Error statistics
    this.statistics = {
      totalErrors: 0,
      errorsByType: new Map(),
      errorsByCommand: new Map(),
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      recentErrors: []
    };

    console.log('🛠️ Error Handler initialized');
  }

  /**
   * Handle error with classification and recovery
   */
  async handleError(error, context = {}) {
    this.statistics.totalErrors++;

    // Classify the error
    const classification = this.classifyError(error, context);

    // Update statistics
    this.updateErrorStatistics(classification, context);

    // Log the error
    this.logError(error, classification, context);

    // Attempt recovery if enabled
    if (this.options.enableErrorRecovery) {
      const recoveryResult = await this.attemptRecovery(error, classification, context);
      if (recoveryResult.success) {
        this.statistics.successfulRecoveries++;
        return recoveryResult.result;
      }
    }

    // Generate user-friendly response
    const userResponse = this.generateUserResponse(error, classification, context);

    // Record error in monitoring if available
    if (this.cli.monitor) {
      this.cli.monitor.recordError(error, context);
    }

    return userResponse;
  }

  /**
   * Classify error based on type and characteristics
   */
  classifyError(error, context = {}) {
    const errorMessage = error.message || '';
    const errorName = error.name || '';
    const errorCode = error.code || '';

    // Network errors
    if (this.isNetworkError(error)) {
      return {
        type: this.errorTypes.NETWORK,
        subtype: errorCode || 'UNKNOWN',
        severity: 'medium',
        recoverable: true
      };
    }

    // Permission errors
    if (this.isPermissionError(error, context)) {
      return {
        type: this.errorTypes.PERMISSION,
        subtype: errorCode || 'MISSING_PERMISSION',
        severity: 'medium',
        recoverable: false
      };
    }

    // Validation errors
    if (this.isValidationError(error, context)) {
      return {
        type: this.errorTypes.VALIDATION,
        subtype: 'INVALID_ARGUMENTS',
        severity: 'low',
        recoverable: false
      };
    }

    // Security errors
    if (this.isSecurityError(error, context)) {
      return {
        type: this.errorTypes.SECURITY,
        subtype: errorCode || 'INVALID_INPUT',
        severity: 'high',
        recoverable: false
      };
    }

    // Resource errors
    if (this.isResourceError(error)) {
      return {
        type: this.errorTypes.RESOURCE,
        subtype: errorCode || 'RESOURCE_LIMIT',
        severity: 'high',
        recoverable: true
      };
    }

    // Execution errors
    if (this.isExecutionError(error, context)) {
      return {
        type: this.errorTypes.EXECUTION,
        subtype: 'COMMAND_FAILED',
        severity: 'medium',
        recoverable: true
      };
    }

    // Configuration errors
    if (this.isConfigurationError(error)) {
      return {
        type: this.errorTypes.CONFIGURATION,
        subtype: 'CONFIG_ERROR',
        severity: 'high',
        recoverable: false
      };
    }

    // Unknown error
    return {
      type: this.errorTypes.UNKNOWN,
      subtype: 'UNKNOWN',
      severity: 'medium',
      recoverable: false
    };
  }

  /**
   * Check if error is network-related
   */
  isNetworkError(error) {
    const networkCodes = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 'EPIPE'];
    const networkMessages = ['network', 'connection', 'timeout', 'dns'];

    return (
      networkCodes.includes(error.code) ||
      networkMessages.some(msg => error.message?.toLowerCase().includes(msg))
    );
  }

  /**
   * Check if error is permission-related
   */
  isPermissionError(error, context) {
    const permissionKeywords = ['permission', 'access', 'denied', 'unauthorized', 'forbidden'];
    const hasPermissionKeyword = permissionKeywords.some(keyword =>
      error.message?.toLowerCase().includes(keyword)
    );

    return hasPermissionKeyword || context.permissionError === true;
  }

  /**
   * Check if error is validation-related
   */
  isValidationError(error, context) {
    const validationKeywords = ['invalid', 'required', 'missing', 'format', 'parse'];
    const hasValidationKeyword = validationKeywords.some(keyword =>
      error.message?.toLowerCase().includes(keyword)
    );

    return hasValidationKeyword || context.validationError === true;
  }

  /**
   * Check if error is security-related
   */
  isSecurityError(error, context) {
    const securityKeywords = ['security', 'suspicious', 'malicious', 'unsafe', 'attack'];
    const hasSecurityKeyword = securityKeywords.some(keyword =>
      error.message?.toLowerCase().includes(keyword)
    );

    return hasSecurityKeyword || context.securityError === true;
  }

  /**
   * Check if error is resource-related
   */
  isResourceError(error) {
    const resourceCodes = ['ENOMEM', 'ENOSPC', 'EMFILE', 'EOVERFLOW'];
    const resourceMessages = ['memory', 'disk', 'cpu', 'out of'];

    return (
      resourceCodes.includes(error.code) ||
      resourceMessages.some(msg => error.message?.toLowerCase().includes(msg))
    );
  }

  /**
   * Check if error is execution-related
   */
  isExecutionError(error, context) {
    const executionKeywords = ['execution', 'command', 'sandbox', 'handler'];
    const hasExecutionKeyword = executionKeywords.some(keyword =>
      error.message?.toLowerCase().includes(keyword)
    );

    return hasExecutionKeyword || context.executionError === true;
  }

  /**
   * Check if error is configuration-related
   */
  isConfigurationError(error) {
    const configKeywords = ['config', 'configuration', 'setting', 'unavailable'];
    const hasConfigKeyword = configKeywords.some(keyword =>
      error.message?.toLowerCase().includes(keyword)
    );

    return hasConfigKeyword;
  }

  /**
   * Attempt error recovery
   */
  async attemptRecovery(error, classification, context) {
    const recoveryStrategy = this.recoveryStrategies.get(classification.type);

    if (!recoveryStrategy || !classification.recoverable) {
      return { success: false, reason: 'No recovery strategy available' };
    }

    this.statistics.recoveryAttempts++;

    try {
      const result = await recoveryStrategy(error, classification, context);
      return result;
    } catch (recoveryError) {
      console.warn('Recovery attempt failed:', recoveryError.message);
      return { success: false, reason: 'Recovery failed' };
    }
  }

  /**
   * Network error recovery
   */
  async handleNetworkError(error, classification, context) {
    const maxRetries = this.options.maxRetries;
    let attempts = 0;

    while (attempts < maxRetries) {
      attempts++;

      try {
        // Wait before retry
        await this.delay(this.options.retryDelay * attempts);

        // Attempt to re-execute the command
        if (context.retryCommand) {
          const result = await this.cli.executeCommand(context.retryCommand, context);
          if (result.success) {
            return { success: true, result, attempts };
          }
        }

        // For network errors, we might try alternative endpoints
        // This is a simplified example
        console.log(`Network recovery attempt ${attempts}/${maxRetries}`);
      } catch (retryError) {
        if (attempts >= maxRetries) {
          throw retryError;
        }
      }
    }

    return { success: false, reason: 'Max retries exceeded' };
  }

  /**
   * Permission error recovery
   */
  async handlePermissionError(error, classification, context) {
    // For permission errors, we can't recover automatically
    // But we can provide helpful guidance
    return {
      success: false,
      reason: 'Permission errors require user intervention',
      suggestion: 'Contact administrator or check user permissions'
    };
  }

  /**
   * Validation error recovery
   */
  async handleValidationError(error, classification, context) {
    // For validation errors, we can't recover automatically
    // But we can provide corrected command suggestions
    return {
      success: false,
      reason: 'Validation errors require user correction',
      suggestion: 'Check command syntax and required parameters'
    };
  }

  /**
   * Execution error recovery
   */
  async handleExecutionError(error, classification, context) {
    // For execution errors, we can retry a few times
    if (context.retryCommand && context.retryCount < 2) {
      await this.delay(500);
      context.retryCount = (context.retryCount || 0) + 1;

      try {
        const result = await this.cli.executeCommand(context.retryCommand, context);
        return { success: true, result };
      } catch (retryError) {
        return { success: false, reason: 'Retry failed' };
      }
    }

    return { success: false, reason: 'Execution recovery not possible' };
  }

  /**
   * Security error recovery
   */
  async handleSecurityError(error, classification, context) {
    // Security errors should not be automatically recovered
    return {
      success: false,
      reason: 'Security errors cannot be automatically recovered',
      suggestion: 'Review input and try a different approach'
    };
  }

  /**
   * Resource error recovery
   */
  async handleResourceError(error, classification, context) {
    // For resource errors, wait and retry
    await this.delay(2000); // Wait 2 seconds

    if (context.retryCommand) {
      try {
        const result = await this.cli.executeCommand(context.retryCommand, context);
        return { success: true, result };
      } catch (retryError) {
        return { success: false, reason: 'Resource recovery failed' };
      }
    }

    return { success: false, reason: 'Resource recovery not possible' };
  }

  /**
   * Configuration error recovery
   */
  async handleConfigurationError(error, classification, context) {
    // Configuration errors usually require manual intervention
    return {
      success: false,
      reason: 'Configuration errors require manual intervention',
      suggestion: 'Check system configuration and restart if necessary'
    };
  }

  /**
   * Generate user-friendly error response
   */
  generateUserResponse(error, classification, context) {
    let userMessage = '';
    let suggestions = [];

    if (this.options.enableUserFriendlyMessages) {
      const typeMessages = this.userMessages[classification.type];
      if (typeMessages) {
        userMessage = typeMessages[classification.subtype] || typeMessages.default;
      } else {
        userMessage = 'An error occurred while processing your request.';
      }

      // Add contextual suggestions
      suggestions = this.generateSuggestions(classification, context);
    } else {
      userMessage = error.message || 'An unknown error occurred.';
    }

    return {
      success: false,
      error: userMessage,
      type: classification.type,
      severity: classification.severity,
      suggestions,
      originalError: this.options.enableDetailedLogging ? error.message : undefined,
      commandId: context.commandId || crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate helpful suggestions based on error type
   */
  generateSuggestions(classification, context) {
    const suggestions = [];

    switch (classification.type) {
      case this.errorTypes.NETWORK:
        suggestions.push('Check your internet connection');
        suggestions.push('Try again in a few moments');
        suggestions.push('Contact support if the problem persists');
        break;

      case this.errorTypes.PERMISSION:
        suggestions.push('Verify your user permissions');
        suggestions.push('Contact your administrator for access');
        suggestions.push('Try logging out and back in');
        break;

      case this.errorTypes.VALIDATION:
        suggestions.push('Use "help" to see correct command syntax');
        suggestions.push('Check required parameters');
        suggestions.push('Use tab completion for command assistance');
        break;

      case this.errorTypes.EXECUTION:
        suggestions.push('Try the command again');
        suggestions.push('Check command arguments');
        suggestions.push('Use "help <command>" for usage information');
        break;

      case this.errorTypes.SECURITY:
        suggestions.push('Review your command for potentially unsafe content');
        suggestions.push('Avoid special characters in commands');
        suggestions.push('Use approved command patterns');
        break;

      case this.errorTypes.RESOURCE:
        suggestions.push('Try again in a few moments');
        suggestions.push('Close other applications if possible');
        suggestions.push('Contact support for resource issues');
        break;

      default:
        suggestions.push('Try the command again');
        suggestions.push('Use "help" for available commands');
        suggestions.push('Contact support if the problem continues');
    }

    return suggestions;
  }

  /**
   * Update error statistics
   */
  updateErrorStatistics(classification, context) {
    // Update error count by type
    const currentCount = this.statistics.errorsByType.get(classification.type) || 0;
    this.statistics.errorsByType.set(classification.type, currentCount + 1);

    // Update error count by command
    if (context.command) {
      const commandName =
        typeof context.command === 'string' ? context.command : context.command.name;
      const commandCount = this.statistics.errorsByCommand.get(commandName) || 0;
      this.statistics.errorsByCommand.set(commandName, commandCount + 1);
    }

    // Add to recent errors
    this.statistics.recentErrors.unshift({
      timestamp: new Date().toISOString(),
      type: classification.type,
      severity: classification.severity,
      command: context.command,
      message: context.errorMessage
    });

    // Keep only last 50 recent errors
    if (this.statistics.recentErrors.length > 50) {
      this.statistics.recentErrors = this.statistics.recentErrors.slice(0, 50);
    }
  }

  /**
   * Log error with classification
   */
  logError(error, classification, context) {
    const logData = {
      timestamp: new Date().toISOString(),
      type: classification.type,
      severity: classification.severity,
      recoverable: classification.recoverable,
      message: error.message,
      stack: error.stack,
      context: {
        command: context.command,
        userId: context.userId,
        sessionId: context.sessionId,
        userAgent: context.userAgent
      }
    };

    // Log based on severity
    if (classification.severity === 'high') {
      console.error('🚨 CRITICAL ERROR:', logData);
    } else if (classification.severity === 'medium') {
      console.warn('⚠️ ERROR:', logData);
    } else {
      console.log('ℹ️ ERROR:', logData);
    }

    // In production, this would be sent to logging service
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    return {
      total: this.statistics.totalErrors,
      byType: Object.fromEntries(this.statistics.errorsByType),
      byCommand: Object.fromEntries(this.statistics.errorsByCommand),
      recoveryRate:
        this.statistics.recoveryAttempts > 0
          ? (this.statistics.successfulRecoveries / this.statistics.recoveryAttempts) * 100
          : 0,
      recentErrors: this.statistics.recentErrors.slice(0, 10)
    };
  }

  /**
   * Get error recovery information
   */
  getRecoveryInfo() {
    return {
      attempts: this.statistics.recoveryAttempts,
      successful: this.statistics.successfulRecoveries,
      rate:
        this.statistics.recoveryAttempts > 0
          ? (this.statistics.successfulRecoveries / this.statistics.recoveryAttempts) * 100
          : 0,
      strategies: Array.from(this.recoveryStrategies.keys())
    };
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset error statistics
   */
  resetStatistics() {
    this.statistics = {
      totalErrors: 0,
      errorsByType: new Map(),
      errorsByCommand: new Map(),
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      recentErrors: []
    };

    console.log('🔄 Error statistics reset');
  }

  /**
   * Export error handling data
   */
  exportErrorData() {
    return {
      statistics: this.getErrorStatistics(),
      recovery: this.getRecoveryInfo(),
      configuration: this.options,
      timestamp: new Date().toISOString()
    };
  }
}

// Integration helper
export function integrateErrorHandler(cli) {
  const errorHandler = new ErrorHandler(cli);

  // Wrap executeCommand to add error handling
  const originalExecuteCommand = cli.executeCommand.bind(cli);
  cli.executeCommand = async function (command, context = {}) {
    try {
      return await originalExecuteCommand(command, context);
    } catch (error) {
      return await errorHandler.handleError(error, {
        ...context,
        command,
        errorMessage: error.message
      });
    }
  };

  // Add error handler to CLI
  cli.errorHandler = errorHandler;

  return errorHandler;
}
