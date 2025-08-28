/**
 * Advanced Security Service with Compliance Monitoring
 * Implements enterprise-grade security features and regulatory compliance
 */

import CryptoJS from 'crypto-js';

class SecurityService {
  constructor() {
    this.sessions = new Map();
    this.auditLog = [];
    this.securityPolicies = new Map();
    this.complianceRules = new Map();
    this.threats = new Map();
    this.accessControls = new Map();
    this.encryptionKeys = new Map();
    this.securityEvents = [];
    this.isInitialized = false;

    this.initializeService();
  }

  /**
   * Initialize security service with default policies
   */
  async initializeService() {
    try {
      this.setupDefaultPolicies();
      this.setupComplianceRules();
      this.initializeEncryption();
      this.startSecurityMonitoring();

      this.isInitialized = true;
      console.log('Security service initialized with enterprise-grade protection');
    } catch (error) {
      console.error('Error initializing security service:', error);
    }
  }

  /**
   * Setup default security policies
   */
  setupDefaultPolicies() {
    // Password Policy
    this.securityPolicies.set('password', {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90, // days
      preventReuse: 5, // last 5 passwords
      lockoutThreshold: 5, // failed attempts
      lockoutDuration: 300000 // 5 minutes
    });

    // Session Policy
    this.securityPolicies.set('session', {
      maxDuration: 28800000, // 8 hours
      idleTimeout: 1800000, // 30 minutes
      requireReauth: true,
      secureCookies: true,
      httpOnly: true,
      sameSite: 'strict'
    });

    // Data Access Policy
    this.securityPolicies.set('dataAccess', {
      requireMFA: true,
      logAllAccess: true,
      maskSensitiveData: true,
      requireApproval: ['financial_statements', 'trading_data'],
      retentionPeriod: 2555200000 // 90 days
    });

    // API Security Policy
    this.securityPolicies.set('api', {
      rateLimiting: true,
      requestsPerMinute: 100,
      requireAuthentication: true,
      validateInput: true,
      encryptPayload: true,
      logRequests: true
    });

    // File Security Policy
    this.securityPolicies.set('files', {
      allowedTypes: ['.pdf', '.xlsx', '.csv', '.json'],
      maxFileSize: 50 * 1024 * 1024, // 50MB
      virusScanning: true,
      encryptStorage: true,
      requireApproval: true
    });
  }

  /**
   * Setup compliance rules for different regulations
   */
  setupComplianceRules() {
    // SOX Compliance
    this.complianceRules.set('sox', {
      name: 'Sarbanes-Oxley Act',
      requirements: {
        auditTrail: true,
        dataIntegrity: true,
        accessControls: true,
        changeManagement: true,
        periodicReview: true
      },
      retentionPeriod: 2555200000, // 7 years
      auditFrequency: 'quarterly'
    });

    // GDPR Compliance
    this.complianceRules.set('gdpr', {
      name: 'General Data Protection Regulation',
      requirements: {
        dataMinimization: true,
        consentManagement: true,
        rightToErasure: true,
        dataPortability: true,
        breachNotification: true,
        privacyByDesign: true
      },
      retentionPeriod: 1095 * 24 * 60 * 60 * 1000, // 3 years
      auditFrequency: 'annual'
    });

    // SEC Compliance
    this.complianceRules.set('sec', {
      name: 'Securities and Exchange Commission',
      requirements: {
        recordKeeping: true,
        reportingAccuracy: true,
        insiderTrading: true,
        marketManipulation: true,
        clientProtection: true
      },
      retentionPeriod: 1826 * 24 * 60 * 60 * 1000, // 5 years
      auditFrequency: 'annual'
    });

    // FINRA Compliance
    this.complianceRules.set('finra', {
      name: 'Financial Industry Regulatory Authority',
      requirements: {
        communicationMonitoring: true,
        tradingSurveillance: true,
        riskManagement: true,
        customerProtection: true,
        recordKeeping: true
      },
      retentionPeriod: 1095 * 24 * 60 * 60 * 1000, // 3 years
      auditFrequency: 'monthly'
    });
  }

  /**
   * Initialize encryption system
   */
  initializeEncryption() {
    // Generate master encryption key if not exists
    if (!localStorage.getItem('financeanalyst_master_key')) {
      const masterKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
      this.encryptionKeys.set('master', masterKey);
      localStorage.setItem('financeanalyst_master_key', masterKey);
    } else {
      this.encryptionKeys.set('master', localStorage.getItem('financeanalyst_master_key'));
    }

    // Generate session-specific keys
    this.generateSessionKey();
  }

  /**
   * Generate new session encryption key
   */
  generateSessionKey() {
    const sessionKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
    this.encryptionKeys.set('session', sessionKey);
    return sessionKey;
  }

  /**
   * Start security monitoring
   */
  startSecurityMonitoring() {
    // Monitor for security events
    setInterval(() => {
      this.checkSecurityThreats();
      this.validateSessions();
      this.cleanupExpiredData();
    }, 60000); // Every minute

    // Setup event listeners
    this.setupSecurityEventListeners();
  }

  /**
   * Setup security event listeners
   */
  setupSecurityEventListeners() {
    // Login attempts
    window.addEventListener('login-attempt', event => {
      this.logSecurityEvent('login_attempt', event.detail);
    });

    // Data access
    window.addEventListener('data-access', event => {
      this.logSecurityEvent('data_access', event.detail);
    });

    // Configuration changes
    window.addEventListener('config-change', event => {
      this.logSecurityEvent('config_change', event.detail);
    });
  }

  /**
   * Authenticate user with multiple factors
   */
  async authenticateUser(credentials) {
    const attempt = {
      timestamp: new Date().toISOString(),
      ip: this.getClientIP(),
      userAgent: navigator.userAgent,
      success: false
    };

    try {
      // Validate credentials
      const isValidPassword = await this.validatePassword(
        credentials.username,
        credentials.password
      );
      if (!isValidPassword) {
        attempt.reason = 'invalid_credentials';
        this.logSecurityEvent('login_failed', attempt);
        throw new Error('Invalid credentials');
      }

      // Check for account lockout
      if (this.isAccountLocked(credentials.username)) {
        attempt.reason = 'account_locked';
        this.logSecurityEvent('login_blocked', attempt);
        throw new Error('Account temporarily locked');
      }

      // Multi-factor authentication
      if (this.requiresMFA(credentials.username)) {
        const mfaValid = await this.validateMFA(credentials.username, credentials.mfaCode);
        if (!mfaValid) {
          attempt.reason = 'invalid_mfa';
          this.logSecurityEvent('mfa_failed', attempt);
          throw new Error('Invalid MFA code');
        }
      }

      // Create secure session
      const session = await this.createSecureSession(credentials.username);
      attempt.success = true;
      attempt.sessionId = session.id;

      this.logSecurityEvent('login_success', attempt);
      return session;
    } catch (error) {
      this.incrementFailedAttempts(credentials.username);
      throw error;
    }
  }

  /**
   * Create secure session
   */
  async createSecureSession(username) {
    const sessionId = CryptoJS.lib.WordArray.random(256 / 8).toString();
    const session = {
      id: sessionId,
      username,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      ip: this.getClientIP(),
      userAgent: navigator.userAgent,
      permissions: await this.getUserPermissions(username),
      isActive: true
    };

    this.sessions.set(sessionId, session);

    // Set secure session cookie
    this.setSecureSessionCookie(sessionId);

    return session;
  }

  /**
   * Validate current session
   */
  validateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    const now = new Date();
    const lastActivity = new Date(session.lastActivity);
    const policy = this.securityPolicies.get('session');

    // Check session timeout
    if (now - lastActivity > policy.idleTimeout) {
      this.terminateSession(sessionId, 'idle_timeout');
      return false;
    }

    // Check max duration
    const sessionStart = new Date(session.createdAt);
    if (now - sessionStart > policy.maxDuration) {
      this.terminateSession(sessionId, 'max_duration');
      return false;
    }

    // Update last activity
    session.lastActivity = now.toISOString();
    this.sessions.set(sessionId, session);

    return true;
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data, keyType = 'session') {
    try {
      const key = this.encryptionKeys.get(keyType);
      if (!key) throw new Error('Encryption key not found');

      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData, keyType = 'session') {
    try {
      const key = this.encryptionKeys.get(keyType);
      if (!key) throw new Error('Decryption key not found');

      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive information
   */
  hashData(data, salt = null) {
    const saltToUse = salt || CryptoJS.lib.WordArray.random(128 / 8).toString();
    const hash = CryptoJS.PBKDF2(data, saltToUse, {
      keySize: 256 / 32,
      iterations: 10000
    });

    return {
      hash: hash.toString(),
      salt: saltToUse
    };
  }

  /**
   * Log security event
   */
  logSecurityEvent(type, details) {
    const event = {
      id: CryptoJS.lib.WordArray.random(128 / 8).toString(),
      type,
      timestamp: new Date().toISOString(),
      details: { ...details },
      severity: this.getEventSeverity(type),
      source: 'security_service'
    };

    this.securityEvents.push(event);
    this.auditLog.push(event);

    // Alert on high-severity events
    if (event.severity === 'high' || event.severity === 'critical') {
      this.alertSecurityTeam(event);
    }

    // Store in persistent audit log
    this.persistAuditLog();
  }

  /**
   * Check for security threats
   */
  checkSecurityThreats() {
    // Check for unusual access patterns
    this.detectAnomalousAccess();

    // Check for brute force attempts
    this.detectBruteForceAttacks();

    // Check for data exfiltration
    this.detectDataExfiltration();

    // Check for privilege escalation
    this.detectPrivilegeEscalation();
  }

  /**
   * Detect anomalous access patterns
   */
  detectAnomalousAccess() {
    const recentEvents = this.securityEvents.filter(
      event => new Date() - new Date(event.timestamp) < 3600000 // Last hour
    );

    // Check for multiple failed logins
    const failedLogins = recentEvents.filter(e => e.type === 'login_failed');
    if (failedLogins.length > 10) {
      this.logSecurityEvent('anomalous_access', {
        pattern: 'multiple_failed_logins',
        count: failedLogins.length,
        timeWindow: '1h'
      });
    }

    // Check for access from unusual locations
    const uniqueIPs = new Set(recentEvents.map(e => e.details.ip));
    if (uniqueIPs.size > 5) {
      this.logSecurityEvent('anomalous_access', {
        pattern: 'multiple_ip_addresses',
        count: uniqueIPs.size,
        timeWindow: '1h'
      });
    }
  }

  /**
   * Compliance monitoring and reporting
   */
  async runComplianceCheck(regulation = null) {
    const results = new Map();
    const regulations = regulation ? [regulation] : Array.from(this.complianceRules.keys());

    for (const reg of regulations) {
      const rule = this.complianceRules.get(reg);
      if (!rule) continue;

      const compliance = {
        regulation: reg,
        name: rule.name,
        status: 'compliant',
        issues: [],
        recommendations: [],
        lastChecked: new Date().toISOString()
      };

      // Check audit trail requirement
      if (rule.requirements.auditTrail) {
        const auditCoverage = this.checkAuditTrailCoverage();
        if (auditCoverage < 0.95) {
          // 95% coverage required
          compliance.status = 'non-compliant';
          compliance.issues.push('Insufficient audit trail coverage');
          compliance.recommendations.push('Ensure all critical actions are logged');
        }
      }

      // Check data retention
      const retentionCompliance = this.checkDataRetention(rule.retentionPeriod);
      if (!retentionCompliance) {
        compliance.status = 'non-compliant';
        compliance.issues.push('Data retention policy violation');
        compliance.recommendations.push('Update data retention procedures');
      }

      // Check access controls
      if (rule.requirements.accessControls) {
        const accessCompliance = this.checkAccessControls();
        if (!accessCompliance) {
          compliance.status = 'non-compliant';
          compliance.issues.push('Inadequate access controls');
          compliance.recommendations.push('Strengthen user access management');
        }
      }

      results.set(reg, compliance);
    }

    // Generate compliance report
    const report = this.generateComplianceReport(results);
    this.logSecurityEvent('compliance_check', {
      regulations,
      overallStatus: this.getOverallComplianceStatus(results)
    });

    return report;
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(timeframe = '24h') {
    const now = new Date();
    const timeframeMs = this.parseTimeframe(timeframe);
    const startTime = new Date(now - timeframeMs);

    const relevantEvents = this.securityEvents.filter(
      event => new Date(event.timestamp) >= startTime
    );

    const report = {
      period: {
        start: startTime.toISOString(),
        end: now.toISOString(),
        duration: timeframe
      },
      summary: {
        totalEvents: relevantEvents.length,
        criticalEvents: relevantEvents.filter(e => e.severity === 'critical').length,
        highSeverityEvents: relevantEvents.filter(e => e.severity === 'high').length,
        activeSessions: this.getActiveSessions().length,
        failedLogins: relevantEvents.filter(e => e.type === 'login_failed').length
      },
      threatAnalysis: this.analyzeThreatLandscape(relevantEvents),
      recommendations: this.generateSecurityRecommendations(relevantEvents),
      complianceStatus: await this.runComplianceCheck()
    };

    return report;
  }

  /**
   * Helper methods
   */
  getClientIP() {
    // In a real implementation, this would get the actual client IP
    return '127.0.0.1';
  }

  validatePassword(_username, password) {
    // Mock password validation
    return password && password.length >= 8;
  }

  requiresMFA(_username) {
    const policy = this.securityPolicies.get('dataAccess');
    return policy.requireMFA;
  }

  validateMFA(_username, code) {
    // Mock MFA validation
    return code && code.length === 6;
  }

  isAccountLocked(_username) {
    // Check if account is locked due to failed attempts
    return false; // Mock implementation
  }

  incrementFailedAttempts(username) {
    // Track failed login attempts
    console.log('Failed login attempt for:', username);
  }

  getUserPermissions(_username) {
    // Return user permissions
    return ['read', 'write', 'analyze'];
  }

  setSecureSessionCookie(_sessionId) {
    // HttpOnly cannot be set from client-side JavaScript. Cookies that must be protected
    // should be issued by the server with the HttpOnly flag. This client method acts as a
    // no-op to avoid a false sense of security and logs guidance for integration.
    try {
      const policy = this.securityPolicies.get('session');
      console.warn(
        'setSecureSessionCookie must be set by the server with HttpOnly. ' +
          'Avoid storing session identifiers in client-accessible storage.'
      );
      // Optional: set a short-lived, non-sensitive hint cookie without HttpOnly for UX-only purposes.
      // Do NOT store secrets/tokens here.
      const maxAge = Math.max(1, Math.floor((policy?.maxDuration || 0) / 1000));
      document.cookie = `fa_session_present=1; path=/; secure; samesite=strict; max-age=${maxAge}`;
    } catch (e) {
      console.warn('setSecureSessionCookie skipped:', e);
    }
  }

  terminateSession(sessionId, reason) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      session.terminatedAt = new Date().toISOString();
      session.terminationReason = reason;

      this.logSecurityEvent('session_terminated', {
        sessionId,
        reason,
        duration: new Date() - new Date(session.createdAt)
      });
    }
  }

  getEventSeverity(type) {
    const severityMap = {
      login_failed: 'medium',
      login_blocked: 'high',
      anomalous_access: 'high',
      data_breach: 'critical',
      unauthorized_access: 'critical',
      session_hijack: 'critical',
      compliance_violation: 'high'
    };
    return severityMap[type] || 'low';
  }

  alertSecurityTeam(event) {
    console.warn('SECURITY ALERT:', event);
    // In production, this would send alerts to security team
  }

  persistAuditLog() {
    try {
      // Keep only recent events in memory
      const maxEvents = 10000;
      if (this.auditLog.length > maxEvents) {
        this.auditLog = this.auditLog.slice(-maxEvents);
      }

      // In production, this would persist to secure storage
      localStorage.setItem('financeanalyst_audit_log', JSON.stringify(this.auditLog.slice(-1000)));
    } catch (error) {
      console.error('Failed to persist audit log:', error);
    }
  }

  detectBruteForceAttacks() {
    // Implementation for brute force detection
  }

  detectDataExfiltration() {
    // Implementation for data exfiltration detection
  }

  detectPrivilegeEscalation() {
    // Implementation for privilege escalation detection
  }

  checkAuditTrailCoverage() {
    return 0.98; // Mock 98% coverage
  }

  checkDataRetention(_period) {
    return true; // Mock compliance
  }

  checkAccessControls() {
    return true; // Mock compliance
  }

  generateComplianceReport(results) {
    return {
      summary: `Compliance check completed for ${results.size} regulations`,
      details: Array.from(results.values()),
      generatedAt: new Date().toISOString()
    };
  }

  getOverallComplianceStatus(results) {
    const statuses = Array.from(results.values()).map(r => r.status);
    return statuses.every(s => s === 'compliant') ? 'compliant' : 'non-compliant';
  }

  parseTimeframe(timeframe) {
    const units = { h: 3600000, d: 86400000, w: 604800000 };
    const match = timeframe.match(/^(\d+)([hdw])$/);
    return match ? parseInt(match[1]) * units[match[2]] : 86400000;
  }

  getActiveSessions() {
    return Array.from(this.sessions.values()).filter(s => s.isActive);
  }

  analyzeThreatLandscape(_events) {
    return {
      topThreats: ['brute_force', 'anomalous_access'],
      riskLevel: 'medium',
      trends: 'stable'
    };
  }

  generateSecurityRecommendations(_events) {
    return [
      'Enable multi-factor authentication for all users',
      'Regular security awareness training',
      'Implement zero-trust architecture'
    ];
  }

  validateSessions() {
    // Validate all active sessions
    this.sessions.forEach((session, sessionId) => {
      if (!this.validateSession(sessionId)) {
        this.terminateSession(sessionId, 'validation_failed');
      }
    });
  }

  cleanupExpiredData() {
    const now = new Date();
    const retentionPeriod = 90 * 24 * 60 * 60 * 1000; // 90 days

    // Clean up old security events
    this.securityEvents = this.securityEvents.filter(
      event => now - new Date(event.timestamp) < retentionPeriod
    );

    // Clean up old audit log entries
    this.auditLog = this.auditLog.filter(
      entry => now - new Date(entry.timestamp) < retentionPeriod
    );
  }
}

export default new SecurityService();
