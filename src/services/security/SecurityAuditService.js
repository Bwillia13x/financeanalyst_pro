/**
 * Security Audit Service
 * Comprehensive security event logging and monitoring system
 * Tracks security events, analyzes patterns, and generates compliance reports
 */

class SecurityAuditService {
  constructor(options = {}) {
    this.options = {
      enableRealTimeMonitoring: true,
      enableAnomalyDetection: true,
      enableComplianceReporting: true,
      logRetentionDays: 90,
      maxLogEntries: 10000,
      alertThresholds: {
        failedLogins: 5,
        suspiciousActivities: 10,
        dataAccess: 50
      },
      complianceFrameworks: ['SOX', 'GDPR', 'PCI-DSS', 'ISO-27001'],
      ...options
    };

    this.auditLogs = [];
    this.securityEvents = new Map();
    this.anomalyPatterns = new Map();
    this.complianceReports = new Map();
    this.activeAlerts = new Set();
    this.threatIntelligence = new Map();

    this.eventTypes = {
      // Authentication events
      USER_LOGIN: 'user_login',
      USER_LOGOUT: 'user_logout',
      LOGIN_FAILED: 'login_failed',
      PASSWORD_CHANGED: 'password_changed',
      MFA_ENABLED: 'mfa_enabled',
      MFA_DISABLED: 'mfa_disabled',
      ACCOUNT_LOCKED: 'account_locked',
      ACCOUNT_UNLOCKED: 'account_unlocked',

      // Authorization events
      PERMISSION_GRANTED: 'permission_granted',
      PERMISSION_DENIED: 'permission_denied',
      ROLE_CHANGED: 'role_changed',
      ACCESS_DENIED: 'access_denied',

      // Data access events
      DATA_ACCESSED: 'data_accessed',
      DATA_MODIFIED: 'data_modified',
      DATA_DELETED: 'data_deleted',
      SENSITIVE_DATA_ACCESSED: 'sensitive_data_accessed',
      EXPORT_REQUESTED: 'export_requested',

      // System events
      CONFIG_CHANGED: 'config_changed',
      BACKUP_CREATED: 'backup_created',
      SYSTEM_ALERT: 'system_alert',
      SECURITY_VIOLATION: 'security_violation',

      // Network events
      SUSPICIOUS_IP: 'suspicious_ip',
      BRUTE_FORCE_ATTEMPT: 'brute_force_attempt',
      UNUSUAL_TRAFFIC: 'unusual_traffic',

      // Compliance events
      COMPLIANCE_CHECK: 'compliance_check',
      AUDIT_REPORT: 'audit_report',
      REGULATORY_ALERT: 'regulatory_alert'
    };

    this.riskLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };

    this.isInitialized = false;
  }

  /**
   * Initialize the security audit service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.setupEventMonitoring();
      this.setupAnomalyDetection();
      this.setupComplianceMonitoring();
      this.setupAlertSystem();
      this.setupLogCleanup();
      this.loadThreatIntelligence();

      this.isInitialized = true;
      console.log('Security Audit Service initialized');
    } catch (error) {
      console.error('Failed to initialize Security Audit Service:', error);
    }
  }

  /**
   * Setup event monitoring
   */
  setupEventMonitoring() {
    // Listen for authentication events
    if (window.authenticationService) {
      window.authenticationService.on('audit', event => {
        this.logSecurityEvent(event);
      });
    }

    // Listen for data access events
    if (window.dataProtectionService) {
      window.dataProtectionService.on('dataAccess', event => {
        this.logSecurityEvent({
          event: 'DATA_ACCESSED',
          userId: event.userId,
          resource: event.resource,
          action: event.action,
          ipAddress: event.ipAddress,
          timestamp: new Date(),
          metadata: event.metadata
        });
      });
    }

    // Monitor network requests
    this.setupNetworkMonitoring();

    // Monitor DOM events for suspicious activity
    this.setupDOMMonitoring();
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0];
      const startTime = Date.now();

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        // Log API calls
        this.logSecurityEvent({
          event: 'API_REQUEST',
          url: typeof url === 'string' ? url : url.url,
          method: args[1]?.method || 'GET',
          status: response.status,
          duration,
          timestamp: new Date(),
          metadata: {
            requestSize: JSON.stringify(args[1]?.body || '').length,
            responseSize: response.headers.get('content-length') || 0
          }
        });

        return response;
      } catch (error) {
        // Log failed requests
        this.logSecurityEvent({
          event: 'API_REQUEST_FAILED',
          url: typeof url === 'string' ? url : url.url,
          error: error.message,
          timestamp: new Date()
        });
        throw error;
      }
    };
  }

  /**
   * Setup DOM monitoring for suspicious activity
   */
  setupDOMMonitoring() {
    // Monitor for suspicious DOM manipulation
    const observer = new MutationObserver(mutations => {
      let suspiciousChanges = 0;

      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 10) {
          suspiciousChanges++;
        }

        if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
          // Check for suspicious script injections
          const element = mutation.target;
          if (element.tagName === 'SCRIPT' && !this.isTrustedScript(element.src)) {
            this.logSecurityEvent({
              event: 'SUSPICIOUS_SCRIPT_INJECTION',
              element: element.tagName,
              src: element.src,
              timestamp: new Date()
            });
          }
        }
      });

      if (suspiciousChanges > 5) {
        this.logSecurityEvent({
          event: 'SUSPICIOUS_DOM_MANIPULATION',
          changes: suspiciousChanges,
          timestamp: new Date()
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'href']
    });

    this.domObserver = observer;
  }

  /**
   * Setup anomaly detection
   */
  setupAnomalyDetection() {
    if (!this.options.enableAnomalyDetection) return;

    // Analyze patterns every 5 minutes
    setInterval(
      () => {
        this.analyzePatterns();
      },
      5 * 60 * 1000
    );

    // Setup baseline calculation
    this.calculateBaselines();
  }

  /**
   * Setup compliance monitoring
   */
  setupComplianceMonitoring() {
    if (!this.options.enableComplianceReporting) return;

    // Generate compliance reports weekly
    setInterval(
      () => {
        this.generateComplianceReport();
      },
      7 * 24 * 60 * 60 * 1000
    );

    // Monitor compliance requirements
    setInterval(
      () => {
        this.checkComplianceRequirements();
      },
      24 * 60 * 60 * 1000
    ); // Daily
  }

  /**
   * Setup alert system
   */
  setupAlertSystem() {
    // Check for alerts every minute
    setInterval(() => {
      this.checkAlerts();
    }, 60 * 1000);
  }

  /**
   * Setup log cleanup
   */
  setupLogCleanup() {
    // Clean up old logs daily
    setInterval(
      () => {
        this.cleanupOldLogs();
      },
      24 * 60 * 60 * 1000
    );
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventData) {
    const securityEvent = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event: eventData.event,
      userId: eventData.userId,
      sessionId: eventData.sessionId,
      ipAddress: eventData.ipAddress || this.getClientIP(),
      userAgent: eventData.userAgent || navigator.userAgent,
      timestamp: eventData.timestamp || new Date(),
      riskLevel: this.calculateRiskLevel(eventData),
      metadata: eventData.metadata || {},
      compliance: this.checkCompliance(eventData)
    };

    // Add to logs
    this.auditLogs.push(securityEvent);

    // Keep only recent logs
    if (this.auditLogs.length > this.options.maxLogEntries) {
      this.auditLogs = this.auditLogs.slice(-this.options.maxLogEntries);
    }

    // Emit event for real-time monitoring
    this.emit('securityEvent', securityEvent);

    // Check for immediate alerts
    this.checkImmediateAlerts(securityEvent);

    // Store in local storage for persistence
    this.persistLogs();

    return securityEvent;
  }

  /**
   * Calculate risk level for event
   */
  calculateRiskLevel(eventData) {
    const eventType = eventData.event;
    const metadata = eventData.metadata || {};

    // High-risk events
    if (
      [
        'ACCOUNT_LOCKED',
        'SECURITY_VIOLATION',
        'SUSPICIOUS_SCRIPT_INJECTION',
        'BRUTE_FORCE_ATTEMPT'
      ].includes(eventType)
    ) {
      return this.riskLevels.CRITICAL;
    }

    // Medium-risk events
    if (['LOGIN_FAILED', 'ACCESS_DENIED', 'SUSPICIOUS_IP', 'UNUSUAL_TRAFFIC'].includes(eventType)) {
      return this.riskLevels.HIGH;
    }

    // Check for patterns
    if (eventType === 'LOGIN_FAILED' && metadata.attemptCount > 3) {
      return this.riskLevels.HIGH;
    }

    if (eventType === 'DATA_ACCESSED' && metadata.sensitive) {
      return this.riskLevels.MEDIUM;
    }

    // Low-risk events
    return this.riskLevels.LOW;
  }

  /**
   * Check compliance requirements
   */
  checkCompliance(eventData) {
    const compliance = {
      gdpr: this.checkGDPRCompliance(eventData),
      sox: this.checkSOXCompliance(eventData),
      pci: this.checkPCICompliance(eventData),
      iso27001: this.checkISO27001Compliance(eventData)
    };

    return compliance;
  }

  /**
   * Check GDPR compliance
   */
  checkGDPRCompliance(eventData) {
    // GDPR requires data processing consent and purpose limitation
    if (eventData.event === 'DATA_ACCESSED' && eventData.metadata?.sensitive) {
      return {
        compliant: true,
        requirements: ['data_processing_consent', 'purpose_limitation'],
        notes: 'Sensitive data access logged for GDPR compliance'
      };
    }

    return { compliant: true, requirements: [] };
  }

  /**
   * Check SOX compliance
   */
  checkSOXCompliance(eventData) {
    // SOX requires financial data integrity and access controls
    if (eventData.event === 'DATA_MODIFIED' && eventData.metadata?.financial) {
      return {
        compliant: true,
        requirements: ['access_controls', 'audit_trail'],
        notes: 'Financial data modification logged for SOX compliance'
      };
    }

    return { compliant: true, requirements: [] };
  }

  /**
   * Check PCI-DSS compliance
   */
  checkPCICompliance(eventData) {
    // PCI-DSS requires payment data protection
    if (eventData.event === 'DATA_ACCESSED' && eventData.metadata?.payment) {
      return {
        compliant: true,
        requirements: ['data_encryption', 'access_logging'],
        notes: 'Payment data access logged for PCI-DSS compliance'
      };
    }

    return { compliant: true, requirements: [] };
  }

  /**
   * Check ISO 27001 compliance
   */
  checkISO27001Compliance(eventData) {
    // ISO 27001 requires information security management
    return {
      compliant: true,
      requirements: ['security_controls', 'risk_management'],
      notes: 'Event logged for ISO 27001 compliance'
    };
  }

  /**
   * Check for immediate alerts
   */
  checkImmediateAlerts(event) {
    // Check failed login thresholds
    if (event.event === 'LOGIN_FAILED') {
      const recentFailedLogins = this.getRecentEvents('LOGIN_FAILED', 60 * 60 * 1000); // Last hour
      if (recentFailedLogins.length >= this.options.alertThresholds.failedLogins) {
        this.createAlert('BRUTE_FORCE_SUSPECTED', {
          userId: event.userId,
          failedAttempts: recentFailedLogins.length,
          timeWindow: '1 hour'
        });
      }
    }

    // Check suspicious activity
    if (event.riskLevel === this.riskLevels.CRITICAL) {
      this.createAlert('CRITICAL_SECURITY_EVENT', {
        event: event.event,
        userId: event.userId,
        riskLevel: event.riskLevel
      });
    }
  }

  /**
   * Create security alert
   */
  createAlert(type, data) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date(),
      status: 'active',
      severity: this.calculateAlertSeverity(type)
    };

    this.activeAlerts.add(alert);

    // Emit alert
    this.emit('alert', alert);

    // Log alert as security event
    this.logSecurityEvent({
      event: 'SYSTEM_ALERT',
      alertType: type,
      severity: alert.severity,
      timestamp: new Date(),
      metadata: data
    });

    return alert;
  }

  /**
   * Calculate alert severity
   */
  calculateAlertSeverity(type) {
    const severityMap = {
      BRUTE_FORCE_SUSPECTED: 'high',
      CRITICAL_SECURITY_EVENT: 'critical',
      SUSPICIOUS_ACTIVITY: 'medium',
      COMPLIANCE_VIOLATION: 'high'
    };

    return severityMap[type] || 'low';
  }

  /**
   * Analyze patterns for anomalies
   */
  analyzePatterns() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    // Analyze login patterns
    const recentLogins = this.getRecentEvents(['USER_LOGIN', 'LOGIN_FAILED'], oneHour);
    const loginByIP = this.groupEventsByField(recentLogins, 'ipAddress');

    // Detect unusual login patterns
    for (const [ip, events] of loginByIP.entries()) {
      if (events.length > 10) {
        this.createAlert('UNUSUAL_LOGIN_PATTERN', {
          ipAddress: ip,
          loginCount: events.length,
          timeWindow: '1 hour'
        });
      }
    }

    // Analyze data access patterns
    const recentDataAccess = this.getRecentEvents('DATA_ACCESSED', oneDay);
    const accessByUser = this.groupEventsByField(recentDataAccess, 'userId');

    for (const [userId, events] of accessByUser.entries()) {
      if (events.length > this.options.alertThresholds.dataAccess) {
        this.createAlert('HIGH_DATA_ACCESS_ACTIVITY', {
          userId,
          accessCount: events.length,
          timeWindow: '24 hours'
        });
      }
    }

    // Update anomaly patterns
    this.updateAnomalyPatterns();
  }

  /**
   * Calculate baselines for anomaly detection
   */
  calculateBaselines() {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const recentEvents = this.auditLogs.filter(
      log => Date.now() - log.timestamp.getTime() < sevenDays
    );

    const baselines = {
      dailyLogins: this.calculateAverageEvents(recentEvents, 'USER_LOGIN', 24 * 60 * 60 * 1000),
      dailyFailedLogins: this.calculateAverageEvents(
        recentEvents,
        'LOGIN_FAILED',
        24 * 60 * 60 * 1000
      ),
      dailyDataAccess: this.calculateAverageEvents(
        recentEvents,
        'DATA_ACCESSED',
        24 * 60 * 60 * 1000
      ),
      averageSessionDuration: this.calculateAverageSessionDuration(recentEvents)
    };

    this.baselines = baselines;
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport() {
    const report = {
      id: `compliance_${Date.now()}`,
      timestamp: new Date(),
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      frameworks: {},
      overallCompliance: 'compliant',
      issues: []
    };

    // Check each compliance framework
    this.options.complianceFrameworks.forEach(framework => {
      report.frameworks[framework] = this.checkFrameworkCompliance(framework);
    });

    // Determine overall compliance
    const nonCompliant = Object.values(report.frameworks).filter(f => !f.compliant);
    if (nonCompliant.length > 0) {
      report.overallCompliance = 'non-compliant';
      report.issues = nonCompliant;
    }

    this.complianceReports.set(report.id, report);

    // Emit compliance report
    this.emit('complianceReport', report);

    return report;
  }

  /**
   * Check framework compliance
   */
  checkFrameworkCompliance(framework) {
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const recentEvents = this.auditLogs.filter(
      log => Date.now() - log.timestamp.getTime() < thirtyDays
    );

    const compliance = {
      compliant: true,
      score: 100,
      issues: [],
      recommendations: []
    };

    switch (framework) {
      case 'GDPR':
        compliance.score = this.checkGDPRScore(recentEvents);
        break;
      case 'SOX':
        compliance.score = this.checkSOXScore(recentEvents);
        break;
      case 'PCI-DSS':
        compliance.score = this.checkPCIScore(recentEvents);
        break;
      case 'ISO-27001':
        compliance.score = this.checkISO27001Score(recentEvents);
        break;
    }

    if (compliance.score < 80) {
      compliance.compliant = false;
      compliance.issues.push(`${framework} compliance score below threshold`);
      compliance.recommendations.push('Review and address compliance gaps');
    }

    return compliance;
  }

  /**
   * Check GDPR compliance score
   */
  checkGDPRScore(events) {
    let score = 100;

    // Check for data access without consent logging
    const dataAccessEvents = events.filter(e => e.event === 'DATA_ACCESSED');
    const consentEvents = events.filter(e => e.metadata?.consent);

    if (dataAccessEvents.length > consentEvents.length) {
      score -= 20;
    }

    // Check for sensitive data access logging
    const sensitiveAccess = dataAccessEvents.filter(e => e.metadata?.sensitive);
    if (sensitiveAccess.length === 0 && dataAccessEvents.length > 10) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  /**
   * Check SOX compliance score
   */
  checkSOXScore(events) {
    let score = 100;

    // Check for financial data modifications
    const financialMods = events.filter(e => e.event === 'DATA_MODIFIED' && e.metadata?.financial);

    if (financialMods.length > 0) {
      // Ensure all have audit trails
      const withoutAudit = financialMods.filter(e => !e.metadata?.auditTrail);
      if (withoutAudit.length > 0) {
        score -= 30;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Check PCI compliance score
   */
  checkPCIScore(events) {
    let score = 100;

    // Check payment data access
    const paymentAccess = events.filter(e => e.event === 'DATA_ACCESSED' && e.metadata?.payment);

    if (paymentAccess.length > 0) {
      // Ensure encryption and logging
      const withoutEncryption = paymentAccess.filter(e => !e.metadata?.encrypted);
      const withoutLogging = paymentAccess.filter(e => !e.metadata?.logged);

      score -= (withoutEncryption.length + withoutLogging.length) * 10;
    }

    return Math.max(0, score);
  }

  /**
   * Check ISO 27001 compliance score
   */
  checkISO27001Score(events) {
    let score = 100;

    // Check security controls
    const securityEvents = events.filter(e =>
      ['SECURITY_VIOLATION', 'ACCESS_DENIED', 'ACCOUNT_LOCKED'].includes(e.event)
    );

    if (securityEvents.length > 5) {
      score -= 15;
    }

    // Check incident response
    const incidents = events.filter(e => e.event === 'SYSTEM_ALERT');
    if (incidents.length > 0) {
      const unresolved = incidents.filter(e => !e.metadata?.resolved);
      score -= unresolved.length * 5;
    }

    return Math.max(0, score);
  }

  /**
   * Get recent events by type
   */
  getRecentEvents(eventTypes, timeWindow) {
    const cutoff = Date.now() - timeWindow;
    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];

    return this.auditLogs.filter(
      log => types.includes(log.event) && log.timestamp.getTime() > cutoff
    );
  }

  /**
   * Group events by field
   */
  groupEventsByField(events, field) {
    const groups = new Map();

    events.forEach(event => {
      const value = event[field];
      if (!groups.has(value)) {
        groups.set(value, []);
      }
      groups.get(value).push(event);
    });

    return groups;
  }

  /**
   * Calculate average events per time period
   */
  calculateAverageEvents(events, eventType, timePeriod) {
    const relevantEvents = events.filter(e => e.event === eventType);
    const periods = (Date.now() - Math.min(...events.map(e => e.timestamp.getTime()))) / timePeriod;

    return relevantEvents.length / periods;
  }

  /**
   * Calculate average session duration
   */
  calculateAverageSessionDuration(events) {
    const loginEvents = events.filter(e => e.event === 'USER_LOGIN');
    const logoutEvents = events.filter(e => e.event === 'USER_LOGOUT');

    if (loginEvents.length === 0) return 0;

    let totalDuration = 0;
    let sessionCount = 0;

    loginEvents.forEach(login => {
      const logout = logoutEvents.find(
        l => l.userId === login.userId && l.timestamp > login.timestamp
      );

      if (logout) {
        totalDuration += logout.timestamp - login.timestamp;
        sessionCount++;
      }
    });

    return sessionCount > 0 ? totalDuration / sessionCount : 0;
  }

  /**
   * Update anomaly patterns
   */
  updateAnomalyPatterns() {
    // Simple pattern learning - in production, use ML algorithms
    const recentEvents = this.getRecentEvents(null, 60 * 60 * 1000); // Last hour

    const patterns = {
      peakHours: this.findPeakHours(recentEvents),
      commonIPs: this.findCommonIPs(recentEvents),
      failedLoginPatterns: this.findFailedLoginPatterns(recentEvents)
    };

    this.anomalyPatterns.set(Date.now(), patterns);
  }

  /**
   * Find peak activity hours
   */
  findPeakHours(events) {
    const hourCounts = new Array(24).fill(0);

    events.forEach(event => {
      const hour = event.timestamp.getHours();
      hourCounts[hour]++;
    });

    const maxHour = hourCounts.indexOf(Math.max(...hourCounts));
    return {
      peakHour: maxHour,
      peakActivity: hourCounts[maxHour],
      totalEvents: events.length
    };
  }

  /**
   * Find common IP addresses
   */
  findCommonIPs(events) {
    const ipCounts = {};

    events.forEach(event => {
      const ip = event.ipAddress;
      ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    });

    const sortedIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    return sortedIPs.map(([ip, count]) => ({ ip, count }));
  }

  /**
   * Find failed login patterns
   */
  findFailedLoginPatterns(events) {
    const failedLogins = events.filter(e => e.event === 'LOGIN_FAILED');
    const patterns = {};

    failedLogins.forEach(login => {
      const key = `${login.userId}_${login.ipAddress}`;
      patterns[key] = (patterns[key] || 0) + 1;
    });

    return Object.entries(patterns)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }

  /**
   * Load threat intelligence data
   */
  loadThreatIntelligence() {
    // Load known malicious IPs, patterns, etc.
    // In production, integrate with threat intelligence feeds
    this.threatIntelligence.set(
      'malicious_ips',
      new Set([
        '192.168.1.100', // Example
        '10.0.0.1' // Example
      ])
    );

    this.threatIntelligence.set('suspicious_patterns', [
      /admin.*login/i,
      /sql.*injection/i,
      /script.*alert/i
    ]);
  }

  /**
   * Check if IP is suspicious
   */
  isSuspiciousIP(ip) {
    return this.threatIntelligence.get('malicious_ips')?.has(ip) || false;
  }

  /**
   * Check for malicious patterns
   */
  hasMaliciousPatterns(text) {
    const patterns = this.threatIntelligence.get('suspicious_patterns') || [];
    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * Is trusted script source
   */
  isTrustedScript(src) {
    const trustedDomains = ['localhost', 'financeanalyst.com', window.location.hostname];

    try {
      const url = new URL(src);
      return trustedDomains.some(domain => url.hostname.includes(domain));
    } catch {
      return false;
    }
  }

  /**
   * Get client IP (simplified)
   */
  getClientIP() {
    // In production, get from server headers
    return '127.0.0.1';
  }

  /**
   * Cleanup old logs
   */
  cleanupOldLogs() {
    const cutoff = Date.now() - this.options.logRetentionDays * 24 * 60 * 60 * 1000;

    this.auditLogs = this.auditLogs.filter(log => log.timestamp.getTime() > cutoff);

    console.log(`Cleaned up old audit logs. Remaining: ${this.auditLogs.length}`);
  }

  /**
   * Persist logs to localStorage
   */
  persistLogs() {
    try {
      // Only persist recent logs to avoid storage limits
      const recentLogs = this.auditLogs.slice(-100);
      localStorage.setItem('security_audit_logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.warn('Failed to persist audit logs:', error);
    }
  }

  /**
   * Load persisted logs
   */
  loadPersistedLogs() {
    try {
      const logsStr = localStorage.getItem('security_audit_logs');
      if (logsStr) {
        const logs = JSON.parse(logsStr);
        this.auditLogs = logs.map(log => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load persisted audit logs:', error);
    }
  }

  /**
   * Export audit data
   */
  exportAuditData() {
    return {
      logs: this.auditLogs,
      alerts: Array.from(this.activeAlerts),
      complianceReports: Array.from(this.complianceReports.entries()),
      anomalyPatterns: Array.from(this.anomalyPatterns.entries()),
      stats: this.getAuditStats(),
      exportTimestamp: Date.now()
    };
  }

  /**
   * Get audit statistics
   */
  getAuditStats() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    const recentLogs = this.auditLogs.filter(log => now - log.timestamp.getTime() < sevenDays);

    return {
      totalLogs: this.auditLogs.length,
      recentLogs: recentLogs.length,
      criticalEvents: recentLogs.filter(log => log.riskLevel === 'critical').length,
      highRiskEvents: recentLogs.filter(log => log.riskLevel === 'high').length,
      activeAlerts: this.activeAlerts.size,
      complianceReports: this.complianceReports.size,
      averageEventsPerDay: recentLogs.length / 7,
      mostActiveIP: this.findCommonIPs(recentLogs)[0]?.ip || 'N/A'
    };
  }

  /**
   * Search audit logs
   */
  searchLogs(query, options = {}) {
    const { eventType, userId, ipAddress, riskLevel, startDate, endDate, limit = 100 } = options;

    let results = this.auditLogs;

    // Apply filters
    if (eventType) {
      results = results.filter(log => log.event === eventType);
    }

    if (userId) {
      results = results.filter(log => log.userId === userId);
    }

    if (ipAddress) {
      results = results.filter(log => log.ipAddress === ipAddress);
    }

    if (riskLevel) {
      results = results.filter(log => log.riskLevel === riskLevel);
    }

    if (startDate) {
      results = results.filter(log => log.timestamp >= startDate);
    }

    if (endDate) {
      results = results.filter(log => log.timestamp <= endDate);
    }

    // Search query
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(log => JSON.stringify(log).toLowerCase().includes(searchTerm));
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return results.slice(0, limit);
  }

  /**
   * Generate security report
   */
  generateSecurityReport(timeRange = 7 * 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - timeRange;
    const relevantLogs = this.auditLogs.filter(log => log.timestamp.getTime() > cutoff);

    const report = {
      id: `security_report_${Date.now()}`,
      timeRange,
      generatedAt: new Date(),
      summary: {
        totalEvents: relevantLogs.length,
        criticalEvents: relevantLogs.filter(log => log.riskLevel === 'critical').length,
        highRiskEvents: relevantLogs.filter(log => log.riskLevel === 'high').length,
        uniqueUsers: new Set(relevantLogs.map(log => log.userId)).size,
        uniqueIPs: new Set(relevantLogs.map(log => log.ipAddress)).size
      },
      topEvents: this.getTopEvents(relevantLogs),
      riskDistribution: this.getRiskDistribution(relevantLogs),
      recommendations: this.generateSecurityRecommendations(relevantLogs)
    };

    return report;
  }

  /**
   * Get top security events
   */
  getTopEvents(logs, limit = 10) {
    const eventCounts = {};

    logs.forEach(log => {
      eventCounts[log.event] = (eventCounts[log.event] || 0) + 1;
    });

    return Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([event, count]) => ({ event, count }));
  }

  /**
   * Get risk distribution
   */
  getRiskDistribution(logs) {
    const distribution = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    logs.forEach(log => {
      distribution[log.riskLevel] = (distribution[log.riskLevel] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Generate security recommendations
   */
  generateSecurityRecommendations(logs) {
    const recommendations = [];

    const criticalEvents = logs.filter(log => log.riskLevel === 'critical');
    if (criticalEvents.length > 0) {
      recommendations.push({
        priority: 'high',
        message: `Address ${criticalEvents.length} critical security events`,
        action: 'review_critical_events'
      });
    }

    const failedLogins = logs.filter(log => log.event === 'LOGIN_FAILED');
    if (failedLogins.length > 10) {
      recommendations.push({
        priority: 'medium',
        message: 'High number of failed login attempts detected',
        action: 'enable_mfa'
      });
    }

    const uniqueIPs = new Set(logs.map(log => log.ipAddress));
    if (uniqueIPs.size > logs.length * 0.5) {
      recommendations.push({
        priority: 'medium',
        message: 'Unusual network activity detected',
        action: 'monitor_network'
      });
    }

    return recommendations;
  }

  /**
   * Event emitter functionality
   */
  on(event, callback) {
    if (!this.eventListeners) {
      this.eventListeners = new Map();
    }

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    if (!this.eventListeners || !this.eventListeners.has(event)) return;

    this.eventListeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in security audit ${event} callback:`, error);
      }
    });
  }

  /**
   * Shutdown the service
   */
  shutdown() {
    if (this.domObserver) {
      this.domObserver.disconnect();
    }

    this.auditLogs = [];
    this.activeAlerts.clear();
    this.anomalyPatterns.clear();
    this.complianceReports.clear();

    this.isInitialized = false;
    console.log('Security Audit Service shutdown');
  }
}

// Export singleton instance
export const securityAuditService = new SecurityAuditService();
export default SecurityAuditService;
