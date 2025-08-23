// Security Audit System - Authentication, Authorization & Data Protection
import CryptoJS from 'crypto-js';

export class SecurityAuditService {
  constructor() {
    this.auditLogs = new Map();
    this.securityPolicies = new Map();
    this.threatDetection = new Map();
    this.accessPatterns = new Map();
    this.encryptionKeys = new Map();
    this.eventHandlers = new Map();
    this.initializePolicies();
    this.initializeThreatDetection();
  }

  initializePolicies() {
    const policies = {
      authentication: {
        minPasswordLength: 12,
        requireMFA: true,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        maxFailedAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        passwordHistory: 12,
        requirePasswordChange: 90 * 24 * 60 * 60 * 1000 // 90 days
      },
      authorization: {
        roleBasedAccess: true,
        principleOfLeastPrivilege: true,
        resourceLevelPermissions: true,
        temporaryAccessGrants: true,
        auditTrail: true
      },
      dataProtection: {
        encryptAtRest: true,
        encryptInTransit: true,
        dataClassification: ['public', 'internal', 'confidential', 'restricted'],
        retentionPolicies: {
          auditLogs: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
          userSessions: 30 * 24 * 60 * 60 * 1000, // 30 days
          financialData: 7 * 365 * 24 * 60 * 60 * 1000 // 7 years
        },
        anonymization: true
      },
      network: {
        requireHTTPS: true,
        strictCSP: true,
        hsts: true,
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        referrerPolicy: 'strict-origin-when-cross-origin'
      },
      compliance: {
        gdpr: true,
        sox: true,
        pci: false, // Not handling credit cards directly
        hipaa: false // Not handling health data
      }
    };

    Object.entries(policies).forEach(([category, policy]) => {
      this.securityPolicies.set(category, policy);
    });
  }

  initializeThreatDetection() {
    const threats = {
      bruteForce: {
        enabled: true,
        threshold: 5,
        timeWindow: 5 * 60 * 1000, // 5 minutes
        action: 'lockout'
      },
      sqlInjection: {
        enabled: true,
        patterns: [
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
          /(UNION|JOIN|WHERE|OR|AND)\s+\d+\s*=\s*\d+/i,
          /['"]\s*(OR|AND)\s+['"]/i
        ],
        action: 'block'
      },
      xss: {
        enabled: true,
        patterns: [
          /<script[^>]*>.*?<\/script>/gi,
          /javascript:/i,
          /on\w+=["'][^"']*["']/i,
          /<iframe[^>]*>.*?<\/iframe>/gi
        ],
        action: 'sanitize'
      },
      csrf: {
        enabled: true,
        tokenRequired: true,
        sameSitePolicy: 'strict'
      },
      rateLimiting: {
        enabled: true,
        limits: {
          api: { requests: 1000, window: 60 * 60 * 1000 }, // 1000/hour
          auth: { requests: 10, window: 60 * 1000 }, // 10/minute
          export: { requests: 50, window: 60 * 60 * 1000 } // 50/hour
        }
      }
    };

    Object.entries(threats).forEach(([type, config]) => {
      this.threatDetection.set(type, {
        ...config,
        detections: [],
        lastReset: Date.now()
      });
    });
  }

  // Authentication Security
  async validateAuthentication(credentials, context = {}) {
    const audit = {
      timestamp: Date.now(),
      action: 'authentication_attempt',
      userId: credentials.userId || 'unknown',
      ip: context.ip,
      userAgent: context.userAgent,
      success: false,
      factors: []
    };

    try {
      // Check for brute force attempts
      if (this.detectBruteForce(credentials.userId, context.ip)) {
        audit.blocked = true;
        audit.reason = 'brute_force_protection';
        this.logSecurityEvent(audit);
        throw new Error('Account temporarily locked due to multiple failed attempts');
      }

      // Validate password strength
      const passwordStrength = this.validatePasswordStrength(credentials.password);
      if (!passwordStrength.valid) {
        audit.reason = 'weak_password';
        audit.weaknesses = passwordStrength.weaknesses;
        this.logSecurityEvent(audit);
        throw new Error('Password does not meet security requirements');
      }

      // Primary authentication
      const primaryAuth = await this.validatePrimaryCredentials(credentials);
      if (!primaryAuth.valid) {
        this.recordFailedAttempt(credentials.userId, context.ip);
        audit.reason = 'invalid_credentials';
        this.logSecurityEvent(audit);
        throw new Error('Invalid credentials');
      }

      audit.factors.push('primary');

      // Multi-factor authentication
      const policy = this.securityPolicies.get('authentication');
      if (policy.requireMFA) {
        const mfaResult = await this.validateMFA(credentials.mfaToken, credentials.userId);
        if (!mfaResult.valid) {
          audit.reason = 'mfa_failed';
          this.logSecurityEvent(audit);
          throw new Error('Multi-factor authentication failed');
        }
        audit.factors.push('mfa');
      }

      // Session management
      const session = await this.createSecureSession(credentials.userId, context);
      
      audit.success = true;
      audit.sessionId = session.id;
      this.logSecurityEvent(audit);

      return {
        valid: true,
        session,
        user: primaryAuth.user,
        factors: audit.factors
      };

    } catch (error) {
      this.logSecurityEvent(audit);
      throw error;
    }
  }

  validatePasswordStrength(password) {
    const policy = this.securityPolicies.get('authentication');
    const weaknesses = [];

    if (password.length < policy.minPasswordLength) {
      weaknesses.push(`Password must be at least ${policy.minPasswordLength} characters`);
    }

    if (!/[A-Z]/.test(password)) {
      weaknesses.push('Password must contain uppercase letters');
    }

    if (!/[a-z]/.test(password)) {
      weaknesses.push('Password must contain lowercase letters');
    }

    if (!/\d/.test(password)) {
      weaknesses.push('Password must contain numbers');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      weaknesses.push('Password must contain special characters');
    }

    // Check against common passwords
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890'
    ];

    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      weaknesses.push('Password contains common patterns');
    }

    return {
      valid: weaknesses.length === 0,
      score: Math.max(0, 100 - (weaknesses.length * 20)),
      weaknesses
    };
  }

  async validatePrimaryCredentials(credentials) {
    // In production, this would validate against your user database
    // For now, simulate validation
    const hashedPassword = this.hashPassword(credentials.password, credentials.userId);
    
    // Simulate database lookup
    return {
      valid: true, // Replace with actual validation
      user: {
        id: credentials.userId,
        email: credentials.email,
        roles: ['analyst'],
        permissions: ['read', 'write', 'export']
      }
    };
  }

  async validateMFA(token, userId) {
    // Validate TOTP, SMS, or other MFA methods
    // This is a simplified implementation
    if (!token || token.length !== 6) {
      return { valid: false, reason: 'invalid_format' };
    }

    // In production, validate against stored MFA secret
    return { valid: true };
  }

  async createSecureSession(userId, context) {
    const sessionId = this.generateSecureToken();
    const policy = this.securityPolicies.get('authentication');
    
    const session = {
      id: sessionId,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + policy.sessionTimeout,
      ip: context.ip,
      userAgent: context.userAgent,
      csrfToken: this.generateSecureToken(),
      active: true
    };

    // Store session securely (encrypted)
    const encryptedSession = this.encryptData(JSON.stringify(session));
    
    return session;
  }

  // Authorization Security
  async validateAuthorization(userId, resource, action, context = {}) {
    const audit = {
      timestamp: Date.now(),
      action: 'authorization_check',
      userId,
      resource,
      requestedAction: action,
      success: false
    };

    try {
      // Get user permissions
      const userPermissions = await this.getUserPermissions(userId);
      
      // Check resource-level permissions
      const hasPermission = this.checkResourcePermission(
        userPermissions,
        resource,
        action
      );

      if (!hasPermission) {
        audit.reason = 'insufficient_permissions';
        this.logSecurityEvent(audit);
        throw new Error('Insufficient permissions for this action');
      }

      // Check contextual restrictions
      const contextCheck = this.validateContext(userId, resource, context);
      if (!contextCheck.valid) {
        audit.reason = contextCheck.reason;
        this.logSecurityEvent(audit);
        throw new Error(contextCheck.message);
      }

      audit.success = true;
      this.logSecurityEvent(audit);

      return { authorized: true };

    } catch (error) {
      this.logSecurityEvent(audit);
      throw error;
    }
  }

  async getUserPermissions(userId) {
    // In production, fetch from database
    return {
      roles: ['analyst'],
      permissions: [
        'analysis:read',
        'analysis:write',
        'dashboard:create',
        'dashboard:edit',
        'export:pdf',
        'export:excel',
        'comments:add',
        'comments:edit_own',
        'versions:create'
      ],
      restrictions: {
        maxExportsPerHour: 50,
        maxDashboards: 10
      }
    };
  }

  checkResourcePermission(userPermissions, resource, action) {
    const requiredPermission = `${resource}:${action}`;
    return userPermissions.permissions.includes(requiredPermission) ||
           userPermissions.permissions.includes(`${resource}:*`) ||
           userPermissions.permissions.includes('*:*');
  }

  validateContext(userId, resource, context) {
    // Check IP restrictions
    if (context.ip && this.isBlacklistedIP(context.ip)) {
      return {
        valid: false,
        reason: 'blacklisted_ip',
        message: 'Access denied from this IP address'
      };
    }

    // Check time-based restrictions
    if (this.hasTimeRestrictions(userId) && !this.isWithinAllowedHours()) {
      return {
        valid: false,
        reason: 'time_restriction',
        message: 'Access not allowed at this time'
      };
    }

    // Check concurrent session limits
    if (this.exceedsConcurrentSessions(userId)) {
      return {
        valid: false,
        reason: 'session_limit',
        message: 'Maximum concurrent sessions exceeded'
      };
    }

    return { valid: true };
  }

  // Data Protection
  encryptData(data, classification = 'internal') {
    const policy = this.securityPolicies.get('dataProtection');
    if (!policy.encryptAtRest) return data;

    const key = this.getEncryptionKey(classification);
    const encrypted = CryptoJS.AES.encrypt(data, key).toString();
    
    return {
      data: encrypted,
      classification,
      encrypted: true,
      algorithm: 'AES-256',
      timestamp: Date.now()
    };
  }

  decryptData(encryptedData, classification = 'internal') {
    if (!encryptedData.encrypted) return encryptedData;

    const key = this.getEncryptionKey(classification);
    const decrypted = CryptoJS.AES.decrypt(encryptedData.data, key);
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  getEncryptionKey(classification) {
    if (!this.encryptionKeys.has(classification)) {
      // In production, keys should be managed by a proper key management system
      const key = CryptoJS.lib.WordArray.random(256/8).toString();
      this.encryptionKeys.set(classification, key);
    }
    
    return this.encryptionKeys.get(classification);
  }

  sanitizeInput(input, context = 'general') {
    if (typeof input !== 'string') return input;

    let sanitized = input;

    // XSS prevention
    const xssPatterns = this.threatDetection.get('xss').patterns;
    xssPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // SQL injection prevention
    const sqlPatterns = this.threatDetection.get('sqlInjection').patterns;
    sqlPatterns.forEach(pattern => {
      if (pattern.test(sanitized)) {
        this.logSecurityEvent({
          timestamp: Date.now(),
          action: 'sql_injection_attempt',
          input: sanitized,
          context,
          blocked: true
        });
        throw new Error('Invalid input detected');
      }
    });

    // Context-specific sanitization
    switch (context) {
      case 'html':
        sanitized = this.sanitizeHTML(sanitized);
        break;
      case 'sql':
        sanitized = this.escapeSQLString(sanitized);
        break;
      case 'url':
        sanitized = encodeURIComponent(sanitized);
        break;
    }

    return sanitized;
  }

  sanitizeHTML(html) {
    const allowedTags = ['b', 'i', 'u', 'strong', 'em', 'br', 'p'];
    const allowedAttributes = [];

    // Simple HTML sanitization (in production, use a library like DOMPurify)
    return html.replace(/<[^>]*>/g, (tag) => {
      const tagName = tag.match(/<\/?(\w+)/)?.[1]?.toLowerCase();
      return allowedTags.includes(tagName) ? tag : '';
    });
  }

  escapeSQLString(str) {
    return str.replace(/'/g, "''");
  }

  // Threat Detection
  detectBruteForce(userId, ip) {
    const threat = this.threatDetection.get('bruteForce');
    const key = `${userId}:${ip}`;
    
    if (!this.accessPatterns.has(key)) {
      this.accessPatterns.set(key, []);
    }

    const attempts = this.accessPatterns.get(key);
    const now = Date.now();
    
    // Clean old attempts
    const recentAttempts = attempts.filter(
      attempt => now - attempt < threat.timeWindow
    );

    return recentAttempts.length >= threat.threshold;
  }

  recordFailedAttempt(userId, ip) {
    const key = `${userId}:${ip}`;
    
    if (!this.accessPatterns.has(key)) {
      this.accessPatterns.set(key, []);
    }

    this.accessPatterns.get(key).push(Date.now());
  }

  checkRateLimit(userId, action) {
    const threat = this.threatDetection.get('rateLimiting');
    const limit = threat.limits[action];
    
    if (!limit) return true;

    const key = `${userId}:${action}`;
    if (!this.accessPatterns.has(key)) {
      this.accessPatterns.set(key, []);
    }

    const attempts = this.accessPatterns.get(key);
    const now = Date.now();
    
    // Clean old attempts
    const recentAttempts = attempts.filter(
      attempt => now - attempt < limit.window
    );
    
    this.accessPatterns.set(key, recentAttempts);

    if (recentAttempts.length >= limit.requests) {
      this.logSecurityEvent({
        timestamp: now,
        action: 'rate_limit_exceeded',
        userId,
        actionType: action,
        attempts: recentAttempts.length,
        limit: limit.requests
      });
      return false;
    }

    recentAttempts.push(now);
    this.accessPatterns.set(key, recentAttempts);
    return true;
  }

  // Security Headers
  getSecurityHeaders() {
    const networkPolicy = this.securityPolicies.get('network');
    
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': this.generateCSP(),
      'X-Frame-Options': networkPolicy.xFrameOptions,
      'X-Content-Type-Options': networkPolicy.xContentTypeOptions,
      'Referrer-Policy': networkPolicy.referrerPolicy,
      'X-XSS-Protection': '1; mode=block',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };
  }

  generateCSP() {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' wss: https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }

  // Audit Logging
  logSecurityEvent(event) {
    const logEntry = {
      id: this.generateSecureToken(),
      timestamp: event.timestamp || Date.now(),
      level: this.getEventLevel(event),
      category: this.getEventCategory(event),
      ...event
    };

    // Store in audit log
    const date = new Date(logEntry.timestamp).toISOString().split('T')[0];
    if (!this.auditLogs.has(date)) {
      this.auditLogs.set(date, []);
    }
    
    this.auditLogs.get(date).push(logEntry);

    // Emit event for real-time monitoring
    this.emit('security:event', logEntry);

    // Alert on critical events
    if (logEntry.level === 'critical') {
      this.emit('security:alert', logEntry);
    }
  }

  getEventLevel(event) {
    const criticalEvents = [
      'authentication_attempt',
      'authorization_failure',
      'sql_injection_attempt',
      'xss_attempt',
      'brute_force_detected'
    ];

    const warningEvents = [
      'rate_limit_exceeded',
      'session_expired',
      'permission_denied'
    ];

    if (criticalEvents.includes(event.action)) return 'critical';
    if (warningEvents.includes(event.action)) return 'warning';
    return 'info';
  }

  getEventCategory(event) {
    if (event.action.includes('auth')) return 'authentication';
    if (event.action.includes('permission') || event.action.includes('authorization')) return 'authorization';
    if (event.action.includes('injection') || event.action.includes('xss')) return 'injection';
    return 'general';
  }

  // Security Report Generation
  generateSecurityReport(startDate, endDate) {
    const report = {
      period: { startDate, endDate },
      summary: {
        totalEvents: 0,
        criticalEvents: 0,
        warningEvents: 0,
        blockedAttempts: 0
      },
      categories: {},
      trends: {},
      recommendations: []
    };

    // Analyze audit logs
    this.auditLogs.forEach((events, date) => {
      const logDate = new Date(date);
      if (logDate >= startDate && logDate <= endDate) {
        events.forEach(event => {
          report.summary.totalEvents++;
          
          if (event.level === 'critical') report.summary.criticalEvents++;
          if (event.level === 'warning') report.summary.warningEvents++;
          if (event.blocked) report.summary.blockedAttempts++;

          // Categorize events
          if (!report.categories[event.category]) {
            report.categories[event.category] = 0;
          }
          report.categories[event.category]++;
        });
      }
    });

    // Generate recommendations
    report.recommendations = this.generateSecurityRecommendations(report);

    return report;
  }

  generateSecurityRecommendations(report) {
    const recommendations = [];

    if (report.summary.criticalEvents > 10) {
      recommendations.push({
        priority: 'high',
        category: 'monitoring',
        recommendation: 'High number of critical security events detected. Consider implementing additional monitoring and alerting.'
      });
    }

    if (report.categories.authentication > report.summary.totalEvents * 0.3) {
      recommendations.push({
        priority: 'medium',
        category: 'authentication',
        recommendation: 'High number of authentication events. Consider implementing stronger authentication policies.'
      });
    }

    return recommendations;
  }

  // Utility Methods
  generateSecureToken() {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  hashPassword(password, salt) {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: 256/32,
      iterations: 100000
    }).toString();
  }

  isBlacklistedIP(ip) {
    // Check against IP blacklist
    const blacklist = ['127.0.0.1']; // Example
    return blacklist.includes(ip);
  }

  hasTimeRestrictions(userId) {
    // Check if user has time-based access restrictions
    return false; // Implement based on user policies
  }

  isWithinAllowedHours() {
    // Check if current time is within allowed access hours
    const now = new Date();
    const hour = now.getHours();
    return hour >= 6 && hour <= 22; // 6 AM to 10 PM
  }

  exceedsConcurrentSessions(userId) {
    // Check concurrent session limits
    return false; // Implement session tracking
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in security event handler for ${event}:`, error);
        }
      });
    }
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }
}

export const securityAuditService = new SecurityAuditService();
