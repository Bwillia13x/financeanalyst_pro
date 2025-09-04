/**
 * CLI Security Manager
 * Handles input validation, rate limiting, permissions, and security features
 */

export class SecurityManager {
  constructor(cli) {
    this.cli = cli;

    // Rate limiting
    this.rateLimiter = new Map();
    this.rateLimitConfig = {
      default: { requests: 100, window: 60000 }, // 100 requests per minute
      strict: { requests: 10, window: 60000 }, // 10 requests per minute
      lenient: { requests: 500, window: 60000 } // 500 requests per minute
    };

    // Input validation
    this.validators = {
      command: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
      symbol: /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/,
      number: /^-?\d+(\.\d+)?$/,
      percentage: /^(100|\d{1,2}(\.\d{1,2})?)%?$/,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      date: /^\d{4}-\d{2}-\d{2}$/,
      url: /^https?:\/\/[^\s/$.?#].[^\s]*$/
    };

    // Permissions system
    this.permissions = new Map();
    this.rolePermissions = new Map();

    // Security monitoring
    this.securityEvents = [];
    this.maxSecurityEvents = 1000;

    // Configuration
    this.config = {
      enableRateLimiting: true,
      enableInputValidation: true,
      enablePermissionChecking: true,
      enableAuditLogging: true,
      enableSandboxing: true,
      maxCommandLength: 1000,
      maxArguments: 50,
      maxExecutionTime: 30000, // 30 seconds
      suspiciousPatterns: [
        /\b(rm|del|delete|drop|truncate)\b/i,
        /\b(script|eval|exec)\b/i,
        /\b(password|secret|key|token)\b.*=/i,
        /\b(alert|confirm|prompt)\b/i,
        /\b(document|window|localStorage|sessionStorage)\b.*=/i
      ]
    };

    // Sandbox environment
    this.sandbox = {
      allowedGlobals: [
        'console',
        'Math',
        'Date',
        'JSON',
        'Array',
        'Object',
        'String',
        'Number',
        'Boolean'
      ],
      blockedProperties: [
        'eval',
        'Function',
        'setTimeout',
        'setInterval',
        'XMLHttpRequest',
        'fetch'
      ],
      executionTimeout: this.config.maxExecutionTime
    };
  }

  /**
   * Initialize security manager
   */
  async initialize() {
    console.log('🔒 Security Manager initializing...');

    // Initialize default permissions
    await this.initializePermissions();

    // Load security settings from storage
    await this.loadSecuritySettings();

    console.log('✅ Security Manager initialized');
  }

  /**
   * Initialize default permissions
   */
  async initializePermissions() {
    // Define roles and their permissions
    this.rolePermissions.set('admin', [
      'system:*',
      'financial:*',
      'market:*',
      'portfolio:*',
      'esg:*',
      'derivatives:*',
      'automation:*',
      'data:*',
      'reporting:*',
      'analytics:*',
      'security:*',
      'user:*'
    ]);

    this.rolePermissions.set('analyst', [
      'system:read',
      'financial:read',
      'financial:analyze',
      'financial:write',
      'market:read',
      'portfolio:read',
      'portfolio:analyze',
      'portfolio:write',
      'esg:read',
      'reporting:read',
      'reporting:write',
      'data:export',
      'data:import',
      'automation:read',
      'automation:write'
    ]);

    this.rolePermissions.set('trader', [
      'market:*',
      'portfolio:read',
      'portfolio:trade',
      'portfolio:write',
      'derivatives:*',
      'reporting:read',
      'reporting:write'
    ]);

    this.rolePermissions.set('viewer', [
      'financial:read',
      'market:read',
      'portfolio:read',
      'esg:read',
      'reporting:read',
      'system:read'
    ]);

    // Define command-specific permissions
    this.commandPermissions = {
      quote: ['market:read'],
      chart: ['market:read'],
      news: ['market:read'],
      analyze: ['financial:analyze'],
      dcf: ['financial:read', 'financial:analyze'],
      comps: ['financial:read', 'financial:analyze'],
      lbo: ['financial:analyze'],
      portfolio: ['portfolio:read', 'portfolio:write'],
      export: ['data:export', 'reporting:write'],
      import: ['data:import'],
      report: ['reporting:read', 'reporting:write'],
      visualize: ['reporting:read'],
      settings: ['system:read', 'system:write'],
      alias: ['system:read', 'system:write'],
      session: ['system:read', 'system:write'],
      clear: ['system:read'],
      history: ['system:read'],
      help: ['system:read'],
      tutorial: ['system:read'],
      interactive: ['system:read'],
      complete: ['system:read'],
      pipeline: ['automation:read', 'automation:write'],
      batch: ['automation:read', 'automation:write'],
      jobs: ['automation:read'],
      workflow: ['automation:read', 'automation:write'],
      learn: ['system:read']
    };

    // Initialize rate limits for different user types
    this.initializeRateLimits();
  }

  /**
   * Initialize rate limits
   */
  initializeRateLimits() {
    // Default rate limits by user role
    const rateLimits = {
      admin: this.rateLimitConfig.lenient,
      analyst: this.rateLimitConfig.default,
      trader: this.rateLimitConfig.default,
      viewer: this.rateLimitConfig.strict
    };

    // Initialize rate limiters for each role
    for (const [role, limit] of Object.entries(rateLimits)) {
      this.rateLimiter.set(role, {
        limit: limit.requests,
        window: limit.window,
        requests: [],
        lastReset: Date.now(),
        blockedUntil: null,
        violations: 0
      });
    }

    // Initialize command-specific rate limits
    this.commandRateLimits = new Map([
      ['quote', { limit: 30, window: 60000, requests: [] }], // 30 quotes per minute
      ['chart', { limit: 10, window: 60000, requests: [] }], // 10 charts per minute
      ['dcf', { limit: 5, window: 60000, requests: [] }], // 5 DCF calculations per minute
      ['analyze', { limit: 20, window: 60000, requests: [] }], // 20 analyses per minute
      ['export', { limit: 3, window: 60000, requests: [] }], // 3 exports per minute
      ['import', { limit: 2, window: 60000, requests: [] }] // 2 imports per minute
    ]);

    // Start cleanup interval
    this.startRateLimitCleanup();
  }

  /**
   * Start rate limit cleanup interval
   */
  startRateLimitCleanup() {
    // Clean up old rate limit entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupRateLimits();
    }, 60000);
  }

  /**
   * Clean up expired rate limit entries
   */
  cleanupRateLimits() {
    const now = Date.now();

    // Clean up role-based rate limiters
    for (const [role, limiter] of this.rateLimiter) {
      limiter.requests = limiter.requests.filter(timestamp => now - timestamp < limiter.window);

      // Reset block if expired
      if (limiter.blockedUntil && now > limiter.blockedUntil) {
        limiter.blockedUntil = null;
        limiter.violations = 0;
      }
    }

    // Clean up command-specific rate limiters
    for (const [command, limiter] of this.commandRateLimits) {
      if (limiter.requests && Array.isArray(limiter.requests)) {
        limiter.requests = limiter.requests.filter(timestamp => now - timestamp < limiter.window);
      }
    }
  }

  /**
   * Validate command execution
   */
  async validateCommand(parsedCommand, context) {
    const validation = {
      valid: true,
      warnings: [],
      securityContext: {}
    };

    try {
      // Check command length
      if (parsedCommand.original.length > this.config.maxCommandLength) {
        validation.valid = false;
        validation.warnings.push(
          `Command too long (max ${this.config.maxCommandLength} characters)`
        );
      }

      // Check argument count
      const totalArgs =
        parsedCommand.args.positional.length +
        Object.keys(parsedCommand.args.options).length +
        Object.keys(parsedCommand.args.flags).length;

      if (totalArgs > this.config.maxArguments) {
        validation.valid = false;
        validation.warnings.push(`Too many arguments (max ${this.config.maxArguments})`);
      }

      // Validate command name
      if (!this.validators.command.test(parsedCommand.name)) {
        validation.valid = false;
        validation.warnings.push('Invalid command name format');
      }

      // Sanitize input to block malicious content
      if (this.config.enableInputValidation) {
        try {
          this.sanitizeInput(parsedCommand.original);
        } catch (error) {
          validation.valid = false;
          validation.warnings.push(`Security violation: ${error.message}`);
          this.logSecurityEvent('blocked_request', {
            reason: error.message,
            command: parsedCommand.original,
            userId: context.userId
          });
          return validation; // Return early to block the command
        }

        // Check for suspicious patterns (additional layer)
        const suspiciousCheck = this.checkSuspiciousPatterns(parsedCommand.original);
        if (suspiciousCheck.suspicious) {
          validation.valid = false;
          validation.warnings.push(...suspiciousCheck.warnings);
          this.logSecurityEvent('blocked_request', {
            reason: `Suspicious pattern detected: ${suspiciousCheck.patterns.join(', ')}`,
            command: parsedCommand.original,
            patterns: suspiciousCheck.patterns,
            userId: context.userId
          });
          return validation; // Return early to block the command
        }
      }

      // Validate arguments
      if (validation.valid) {
        const argValidation = await this.validateArguments(parsedCommand);
        if (!argValidation.valid) {
          validation.warnings.push(...argValidation.errors);
        }
      }

      // Set security context
      validation.securityContext = {
        validatedAt: new Date().toISOString(),
        userId: context.userId,
        sessionId: context.sessionId,
        commandRisk: this.assessCommandRisk(parsedCommand),
        validationWarnings: validation.warnings.length
      };
    } catch (error) {
      validation.valid = false;
      validation.warnings.push(`Validation error: ${error.message}`);
    }

    return validation;
  }

  /**
   * Check permissions for command execution
   */
  async checkPermissions(command, args, context) {
    if (!this.config.enablePermissionChecking) {
      return { allowed: true };
    }

    const userRole = context && context.userRole ? context.userRole : 'viewer';
    const userPermissions = this.rolePermissions.get(userRole) || [];

    // Get required permissions for this command
    const requiredPermissions = this.getCommandRequiredPermissions(command);

    // Check each required permission
    for (const permission of requiredPermissions) {
      if (!this.hasPermission(userPermissions, permission)) {
        return {
          allowed: false,
          reason: `Missing permission: ${permission}`,
          required: permission,
          userPermissions,
          userRole,
          command: command.name
        };
      }
    }

    // Check argument-specific permissions
    const argPermissions = this.checkArgumentPermissions(command, args, userPermissions);
    if (!argPermissions.allowed) {
      return argPermissions;
    }

    // Check context-specific permissions
    const contextPermissions = this.checkContextPermissions(command, args, context);
    if (!contextPermissions.allowed) {
      return contextPermissions;
    }

    return { allowed: true };
  }

  /**
   * Get required permissions for a command
   */
  getCommandRequiredPermissions(command) {
    // First, check if command has permissions defined in its metadata
    if (
      command.permissions &&
      Array.isArray(command.permissions) &&
      command.permissions.length > 0
    ) {
      return command.permissions;
    }

    // Then check if command has specific permissions defined in security manager (case-insensitive)
    if (this.commandPermissions && this.commandPermissions[command.name.toLowerCase()]) {
      return this.commandPermissions[command.name.toLowerCase()];
    }

    // Fall back to default permissions based on command category
    return this.getDefaultPermissions(command);
  }

  /**
   * Check context-specific permissions
   */
  checkContextPermissions(command, args, context) {
    // Check for sensitive operations that require additional verification
    const sensitiveCommands = ['export', 'import', 'settings', 'session'];

    if (sensitiveCommands.includes(command.name)) {
      // Require additional authentication for sensitive operations
      if (!context.authenticated || !context.sessionVerified) {
        return {
          allowed: false,
          reason: `Additional authentication required for ${command.name}`,
          type: 'authentication_required'
        };
      }
    }

    // Check for role-based command restrictions
    const adminOnlyCommands = ['settings', 'session'];
    const analystCommands = ['analyze', 'quote', 'dcf', 'lbo', 'comps'];

    const userRole = context.userRole || 'viewer';

    if (adminOnlyCommands.includes(command.name)) {
      if (userRole !== 'admin' && userRole !== 'analyst') {
        return {
          allowed: false,
          reason: `Admin or analyst privileges required for ${command.name}`,
          type: 'elevated_privileges_required'
        };
      }
    }

    if (analystCommands.includes(command.name)) {
      if (userRole === 'viewer') {
        return {
          allowed: false,
          reason: `Analyst privileges required for ${command.name}`,
          type: 'analyst_required'
        };
      }
    }

    // Basic commands like 'help' and 'clear' should be available to all roles
    const basicCommands = ['help', 'clear'];
    if (basicCommands.includes(command.name)) {
      return { allowed: true };
    }

    return { allowed: true };
  }

  /**
   * Check rate limits
   */
  async checkRateLimit(userId, commandName, context = {}) {
    if (!this.config.enableRateLimiting) {
      return { allowed: true };
    }

    const userRole = context.userRole || 'viewer';
    const now = Date.now();

    // Check role-based rate limiting
    const roleLimitResult = await this.checkRoleRateLimit(userId, userRole, commandName);
    if (!roleLimitResult.allowed) {
      return roleLimitResult;
    }

    // Check command-specific rate limiting
    const commandLimitResult = await this.checkCommandRateLimit(userId, commandName);
    if (!commandLimitResult.allowed) {
      return commandLimitResult;
    }

    // Record the request
    await this.recordRateLimitRequest(userId, userRole, commandName, now);

    return { allowed: true };
  }

  /**
   * Check role-based rate limiting
   */
  async checkRoleRateLimit(userId, userRole, commandName) {
    const limiter = this.rateLimiter.get(userRole);

    if (!limiter) {
      return { allowed: true };
    }

    const now = Date.now();

    // Check if user is currently blocked
    if (limiter.blockedUntil && now < limiter.blockedUntil) {
      const remainingTime = Math.ceil((limiter.blockedUntil - now) / 1000);
      return {
        allowed: false,
        reason: `Rate limit exceeded. Try again in ${remainingTime} seconds.`,
        blockedUntil: limiter.blockedUntil,
        type: 'role_block'
      };
    }

    // Clean old requests
    limiter.requests = limiter.requests.filter(timestamp => now - timestamp < limiter.window);

    // Check if limit exceeded
    if (limiter.requests.length >= limiter.limit) {
      // Increment violations and potentially block
      limiter.violations++;

      const blockDuration = this.calculateBlockDuration(limiter.violations);
      limiter.blockedUntil = now + blockDuration;

      this.logSecurityEvent('rate_limit_exceeded', {
        userId,
        command: commandName,
        userRole,
        requestCount: limiter.requests.length,
        limit: limiter.limit,
        violations: limiter.violations,
        blockDuration
      });

      return {
        allowed: false,
        reason: `Rate limit exceeded (${limiter.requests.length}/${limiter.limit}). Blocked for ${Math.ceil(blockDuration / 1000)} seconds.`,
        blockDuration,
        violations: limiter.violations,
        type: 'role_limit'
      };
    }

    return { allowed: true };
  }

  /**
   * Check command-specific rate limiting
   */
  async checkCommandRateLimit(userId, commandName) {
    const limiter = this.commandRateLimits.get(commandName);

    if (!limiter) {
      return { allowed: true };
    }

    const now = Date.now();

    // Initialize requests array if not exists
    if (!limiter.requests) {
      limiter.requests = [];
    }

    // Clean old requests
    limiter.requests = limiter.requests.filter(timestamp => now - timestamp < limiter.window);

    // Check if limit exceeded
    if (limiter.requests.length >= limiter.limit) {
      this.logSecurityEvent('command_rate_limit_exceeded', {
        userId,
        command: commandName,
        requestCount: limiter.requests.length,
        limit: limiter.limit
      });

      return {
        allowed: false,
        reason: `Command rate limit exceeded for '${commandName}' (${limiter.requests.length}/${limiter.limit}).`,
        type: 'command_limit'
      };
    }

    return { allowed: true };
  }

  /**
   * Record rate limit request
   */
  async recordRateLimitRequest(userId, userRole, commandName, timestamp) {
    // Record role-based request
    const roleLimiter = this.rateLimiter.get(userRole);
    if (roleLimiter) {
      roleLimiter.requests.push(timestamp);
    }

    // Record command-specific request
    const commandLimiter = this.commandRateLimits.get(commandName);
    if (commandLimiter) {
      if (!commandLimiter.requests) {
        commandLimiter.requests = [];
      }
      commandLimiter.requests.push(timestamp);
    }
  }

  /**
   * Calculate block duration based on violations
   */
  calculateBlockDuration(violations) {
    // Progressive blocking: 30s, 2min, 5min, 15min, 30min
    const durations = [30000, 120000, 300000, 900000, 1800000];
    return durations[Math.min(violations - 1, durations.length - 1)];
  }

  /**
   * Validate command arguments
   */
  async validateArguments(parsedCommand) {
    const validation = { valid: true, errors: [] };
    const command = this.cli.registry.getCommand(parsedCommand.name);

    if (!command) return validation;

    const args = parsedCommand.args;

    // Validate positional arguments
    if (command.parameters?.positional) {
      command.parameters.positional.forEach((param, index) => {
        const value = args.positional[index];
        if (param.required && (value === undefined || value === null)) {
          validation.valid = false;
          validation.errors.push(`Missing required argument: ${param.name}`);
        } else if (value !== undefined && param.type) {
          const typeValidation = this.validateValueType(value, param.type, param);
          if (!typeValidation.valid) {
            validation.valid = false;
            validation.errors.push(`${param.name}: ${typeValidation.error}`);
          }
        }
      });
    }

    // Validate option arguments
    if (command.parameters?.options) {
      Object.entries(command.parameters.options).forEach(([key, param]) => {
        const value = args.options[key];
        if (param.required && value === undefined) {
          validation.valid = false;
          validation.errors.push(`Missing required option: --${key}`);
        } else if (value !== undefined && param.type) {
          const typeValidation = this.validateValueType(value, param.type, param);
          if (!typeValidation.valid) {
            validation.valid = false;
            validation.errors.push(`--${key}: ${typeValidation.error}`);
          }
        }
      });
    }

    return validation;
  }

  /**
   * Validate value type
   */
  validateValueType(value, type, constraints = {}) {
    const validator = this.validators[type];
    if (!validator) {
      return { valid: true }; // Unknown type, assume valid
    }

    if (!validator.test(value)) {
      return {
        valid: false,
        error: `Invalid ${type} format. Expected: ${this.getTypeExample(type)}`
      };
    }

    // Check constraints
    if (constraints.min !== undefined && value < constraints.min) {
      return { valid: false, error: `Value must be >= ${constraints.min}` };
    }

    if (constraints.max !== undefined && value > constraints.max) {
      return { valid: false, error: `Value must be <= ${constraints.max}` };
    }

    if (constraints.pattern && !constraints.pattern.test(value)) {
      return { valid: false, error: 'Value doesn\'t match required pattern' };
    }

    return { valid: true };
  }

  /**
   * Get example for type
   */
  getTypeExample(type) {
    const examples = {
      symbol: 'AAPL',
      number: '123.45',
      percentage: '25%',
      email: 'user@domain.com',
      date: '2024-01-15',
      url: 'https://example.com'
    };

    return examples[type] || 'valid format';
  }

  /**
   * Check for suspicious patterns
   */
  checkSuspiciousPatterns(input) {
    const result = {
      suspicious: false,
      warnings: [],
      patterns: []
    };

    for (const pattern of this.config.suspiciousPatterns) {
      if (pattern.test(input)) {
        result.suspicious = true;
        result.patterns.push(pattern.source);
        result.warnings.push(`Potentially suspicious pattern detected: ${pattern.source}`);
      }
    }

    return result;
  }

  /**
   * Assess command risk level
   */
  assessCommandRisk(parsedCommand) {
    const command = this.cli.registry.getCommand(parsedCommand.name);
    if (!command) return 'unknown';

    // Risk assessment based on command category and arguments
    const riskLevels = {
      system: 'high',
      financial: 'medium',
      market: 'low',
      portfolio: 'medium',
      esg: 'low',
      derivatives: 'high',
      automation: 'high',
      data: 'medium',
      reporting: 'low',
      utility: 'low'
    };

    const baseRisk = riskLevels[command.category] || 'medium';

    // Increase risk for certain argument patterns
    if (parsedCommand.args.positional.some(arg => arg.includes('delete') || arg.includes('drop'))) {
      return 'high';
    }

    if (parsedCommand.args.options.batch || parsedCommand.args.options.all) {
      return 'high';
    }

    return baseRisk;
  }

  /**
   * Get default permissions for command
   */
  getDefaultPermissions(command) {
    const categoryPermissions = {
      system: ['system:read'],
      financial: ['financial:read'],
      market: ['market:read'],
      portfolio: ['portfolio:read'],
      esg: ['esg:read'],
      derivatives: ['derivatives:read'],
      automation: ['automation:execute'],
      data: ['data:read'],
      reporting: ['reporting:read'],
      utility: ['utility:execute']
    };

    return [categoryPermissions[command.category] || 'general:execute'];
  }

  /**
   * Check if user has permission
   */
  hasPermission(userPermissions, requiredPermission) {
    // Check exact match
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Check wildcard permissions
    for (const userPerm of userPermissions) {
      if (userPerm.endsWith(':*')) {
        const category = userPerm.slice(0, -2);
        if (requiredPermission.startsWith(category + ':')) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check argument-specific permissions
   */
  checkArgumentPermissions(command, args, userPermissions) {
    // Check for write/modify operations
    const writeOperations = ['create', 'update', 'delete', 'modify', 'save'];
    const hasWriteOp = args.positional.some(arg => writeOperations.includes(arg.toLowerCase()));

    if (hasWriteOp) {
      const writePermission = command.category + ':write';
      if (!this.hasPermission(userPermissions, writePermission)) {
        return {
          allowed: false,
          reason: `Write permission required: ${writePermission}`,
          required: writePermission
        };
      }
    }

    // Check for admin operations
    const adminOperations = ['admin', 'config', 'settings', 'system'];
    const hasAdminOp = args.positional.some(arg => adminOperations.includes(arg.toLowerCase()));

    if (hasAdminOp) {
      if (!this.hasPermission(userPermissions, 'system:admin')) {
        return {
          allowed: false,
          reason: 'Admin permission required',
          required: 'system:admin'
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventType, details) {
    const event = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      details,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
      sessionId: this.cli?.contextManager?.getSessionId()
    };

    this.securityEvents.push(event);

    // Maintain max events
    if (this.securityEvents.length > this.maxSecurityEvents) {
      this.securityEvents = this.securityEvents.slice(-this.maxSecurityEvents);
    }

    // Log to console for monitoring
    console.warn(`🔒 Security Event: ${eventType}`, details);

    // In a real implementation, this would also send to a security monitoring system
  }

  /**
   * Get security statistics
   */
  getSecurityStats() {
    const stats = {
      totalEvents: this.securityEvents.length,
      eventTypes: {},
      recentEvents: this.securityEvents.slice(-10)
    };

    // Count event types
    this.securityEvents.forEach(event => {
      stats.eventTypes[event.type] = (stats.eventTypes[event.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Load security settings
   */
  async loadSecuritySettings() {
    // Skip in Node.js environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.log('🔒 Security settings persistence not available in current environment');
      return;
    }

    try {
      const saved = localStorage.getItem('cli-security-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.config = { ...this.config, ...settings };
        console.log('🔒 Loaded security settings');
      }
    } catch (error) {
      console.warn('Failed to load security settings:', error.message);
    }
  }

  /**
   * Save security settings
   */
  async saveSecuritySettings() {
    // Skip in Node.js environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem('cli-security-settings', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save security settings:', error.message);
    }
  }

  /**
   * Update security configuration
   */
  updateSecurityConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.saveSecuritySettings();
  }

  /**
   * Sanitize input
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    // Block path traversal attacks
    if (/\.\.[\/\\]/.test(input) || /%2e%2e/i.test(input)) {
      throw new Error('Path traversal detected');
    }

    // Block format string attacks
    if (/%[snpdxXoufcgeE]/.test(input)) {
      throw new Error('Format string attack detected');
    }

    // Block template injection
    if (/\$\{.*\}/.test(input) || /<%.*%>/.test(input)) {
      throw new Error('Template injection detected');
    }

    // Block eval injection
    if (/\beval\s*\(/.test(input) || /\bFunction\s*\(/.test(input)) {
      throw new Error('Eval injection detected');
    }

    // Block prototype pollution
    if (/__proto__|constructor\.prototype/.test(input)) {
      throw new Error('Prototype pollution detected');
    }

    // Block XSS attacks - check for script tags and other dangerous patterns
    if (
      /<script\s*[^>]*>[\s\S]*?<\/script>/gi.test(input) ||
      /<iframe\s*[^>]*>[\s\S]*?<\/iframe>/gi.test(input) ||
      /<object\s*[^>]*>[\s\S]*?<\/object>/gi.test(input) ||
      /<embed\s*[^>]*>[\s\S]*?<\/embed>/gi.test(input) ||
      /<script[^>]*>/gi.test(input) || // Also catch opening script tags without closing
      /javascript:/gi.test(input) ||
      /vbscript:/gi.test(input) ||
      /data:text\/html/gi.test(input) ||
      /on\w+\s*=/gi.test(input) ||
      /<[^>]*on\w+\s*=[^>]*>/gi.test(input)
    ) {
      throw new Error('Cross-site scripting detected');
    }

    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/;/g, '') // Remove semicolons
      .replace(/&&|\|\|/g, '') // Remove command chaining
      .replace(/`/g, '') // Remove backticks
      .replace(/\$/g, '') // Remove dollar signs (template literals)
      .trim();
  }

  /**
   * Get security recommendations
   */
  getSecurityRecommendations() {
    const recommendations = [];

    if (!this.config.enableRateLimiting) {
      recommendations.push('Enable rate limiting to prevent abuse');
    }

    if (!this.config.enableInputValidation) {
      recommendations.push('Enable input validation for security');
    }

    if (!this.config.enablePermissionChecking) {
      recommendations.push('Enable permission checking for access control');
    }

    if (this.securityEvents.length > 100) {
      recommendations.push('Review recent security events for potential issues');
    }

    return recommendations;
  }

  /**
   * Execute command in sandboxed environment
   */
  async executeInSandbox(command, args, context) {
    if (!this.config.enableSandboxing) {
      return await this.executeDirectly(command, args, context);
    }

    try {
      // Create sandbox environment
      const sandboxEnv = this.createSandboxEnvironment(context);

      // Set execution timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Command execution timeout in sandbox'));
        }, this.sandbox.executionTimeout);
      });

      // Execute in sandbox with timeout
      const executionPromise = this.executeInSandboxEnvironment(command, args, sandboxEnv);

      return await Promise.race([executionPromise, timeoutPromise]);
    } catch (error) {
      this.logSecurityEvent('sandbox_execution_error', {
        command: command.name,
        error: error.message,
        userId: context.userId
      });

      throw new Error(`Sandbox execution failed: ${error.message}`);
    }
  }

  /**
   * Execute command directly (non-sandboxed)
   */
  async executeDirectly(command, args, context) {
    return await command.handler(args, context);
  }

  /**
   * Create sandbox environment
   */
  createSandboxEnvironment(context) {
    // Create a restricted global object
    const sandboxGlobal = {};

    // Add allowed globals
    this.sandbox.allowedGlobals.forEach(globalName => {
      if (typeof global[globalName] !== 'undefined') {
        sandboxGlobal[globalName] = global[globalName];
      }
    });

    // Add safe context properties
    sandboxGlobal.context = {
      userId: context.userId,
      sessionId: context.sessionId,
      userRole: context.userRole,
      timestamp: new Date().toISOString()
    };

    // Block dangerous properties
    this.sandbox.blockedProperties.forEach(prop => {
      sandboxGlobal[prop] = undefined;
    });

    // Add security monitoring
    sandboxGlobal.__securityMonitor = {
      logAccess: property => {
        this.logSecurityEvent('sandbox_property_access', {
          property,
          userId: context.userId,
          command: 'unknown'
        });
      }
    };

    return sandboxGlobal;
  }

  /**
   * Execute command in sandbox environment
   */
  async executeInSandboxEnvironment(command, args, sandboxEnv) {
    // For now, we'll implement basic sandboxing
    // In a production system, this would use web workers or similar isolation

    try {
      // Validate that the command handler doesn't access blocked properties
      const handlerString = command.handler.toString();

      // Check for dangerous patterns in the handler
      const dangerousPatterns = [
        /\beval\b/,
        /\bFunction\b/,
        /\bsetTimeout\b/,
        /\bsetInterval\b/,
        /\bdocument\b/,
        /\bwindow\b/,
        /\blocalStorage\b/,
        /\bsessionStorage\b/
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(handlerString)) {
          this.logSecurityEvent('dangerous_code_detected', {
            command: command.name,
            pattern: pattern.source,
            userId: sandboxEnv.context.userId
          });

          throw new Error(`Command contains potentially dangerous code pattern: ${pattern.source}`);
        }
      }

      // Execute the command with sandboxed context
      const result = await command.handler(args, {
        ...sandboxEnv.context,
        sandbox: true,
        securityLevel: 'high'
      });

      return result;
    } catch (error) {
      throw new Error(`Sandbox execution error: ${error.message}`);
    }
  }

  /**
   * Get security dashboard data
   */
  getSecurityDashboard() {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;

    const recentEvents = this.securityEvents.filter(
      event => new Date(event.timestamp).getTime() > last24Hours
    );

    const stats = {
      totalEvents: this.securityEvents.length,
      recentEvents: recentEvents.length,
      eventTypes: {},
      rateLimitViolations: 0,
      permissionDenials: 0,
      suspiciousPatterns: 0,
      sandboxErrors: 0
    };

    // Count event types
    recentEvents.forEach(event => {
      stats.eventTypes[event.type] = (stats.eventTypes[event.type] || 0) + 1;

      switch (event.type) {
        case 'rate_limit_exceeded':
        case 'command_rate_limit_exceeded':
          stats.rateLimitViolations++;
          break;
        case 'permission_denied':
          stats.permissionDenials++;
          break;
        case 'suspicious_pattern':
          stats.suspiciousPatterns++;
          break;
        case 'sandbox_execution_error':
          stats.sandboxErrors++;
          break;
      }
    });

    // Get current rate limit status
    const rateLimitStatus = {};
    for (const [role, limiter] of this.rateLimiter) {
      rateLimitStatus[role] = {
        requestsInWindow: limiter.requests.length,
        limit: limiter.limit,
        blocked: !!(limiter.blockedUntil && now < limiter.blockedUntil),
        violations: limiter.violations
      };
    }

    return {
      stats,
      rateLimitStatus,
      recentEvents: recentEvents.slice(-10),
      recommendations: this.getSecurityRecommendations()
    };
  }

  /**
   * Destroy security manager
   */
  async destroy() {
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Save security settings
    await this.saveSecuritySettings();

    // Clear sensitive data
    this.rateLimiter.clear();
    this.permissions.clear();
    this.rolePermissions.clear();
    this.securityEvents = [];

    console.log('🧹 Security Manager destroyed');
  }
}
