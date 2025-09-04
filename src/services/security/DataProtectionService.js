/**
 * Data Protection Service
 * Comprehensive data protection and privacy system
 * Handles encryption, masking, anonymization, and compliance
 */

class DataProtectionService {
  constructor(options = {}) {
    this.options = {
      enableEncryption: true,
      enableDataMasking: true,
      enableAnonymization: true,
      enableAuditLogging: true,
      encryptionAlgorithm: 'AES-GCM',
      keyRotationDays: 90,
      retentionPolicies: {
        personal: 2555, // 7 years for GDPR
        financial: 2555,
        logs: 2555
      },
      sensitiveFields: [
        'password',
        'ssn',
        'creditCard',
        'bankAccount',
        'email',
        'phone',
        'address',
        'birthDate'
      ],
      ...options
    };

    this.encryptionKeys = new Map();
    this.dataClassifications = new Map();
    this.retentionSchedules = new Map();
    this.accessLogs = new Map();
    this.consentRecords = new Map();
    this.dataSubjects = new Map();

    this.isInitialized = false;
  }

  /**
   * Initialize the data protection service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.setupEncryption();
      this.setupDataClassification();
      this.setupRetentionPolicies();
      this.setupAccessMonitoring();
      this.setupConsentManagement();
      this.setupDataSubjectRights();

      this.isInitialized = true;
      console.log('Data Protection Service initialized');
    } catch (error) {
      console.error('Failed to initialize Data Protection Service:', error);
    }
  }

  /**
   * Setup encryption system
   */
  async setupEncryption() {
    if (!this.options.enableEncryption) return;

    try {
      // Generate master key
      this.masterKey = await this.generateKey();

      // Generate data encryption keys
      await this.generateDataKeys();

      // Setup key rotation
      this.setupKeyRotation();

      console.log('Encryption system initialized');
    } catch (error) {
      console.error('Failed to setup encryption:', error);
      throw error;
    }
  }

  /**
   * Setup data classification
   */
  setupDataClassification() {
    // Define data classifications
    this.dataClassifications.set('public', {
      level: 1,
      encryption: false,
      retention: 365, // 1 year
      access: 'unrestricted',
      description: 'Publicly accessible data'
    });

    this.dataClassifications.set('internal', {
      level: 2,
      encryption: true,
      retention: 2555, // 7 years
      access: 'authenticated',
      description: 'Internal business data'
    });

    this.dataClassifications.set('confidential', {
      level: 3,
      encryption: true,
      retention: 2555,
      access: 'role-based',
      description: 'Sensitive business data'
    });

    this.dataClassifications.set('restricted', {
      level: 4,
      encryption: true,
      retention: 2555,
      access: 'need-to-know',
      description: 'Highly sensitive data requiring special access'
    });

    this.dataClassifications.set('personal', {
      level: 5,
      encryption: true,
      retention: 2555,
      access: 'consent-based',
      description: 'Personal identifiable information (PII)'
    });
  }

  /**
   * Setup retention policies
   */
  setupRetentionPolicies() {
    // Setup automatic data cleanup
    setInterval(
      () => {
        this.enforceRetentionPolicies();
      },
      24 * 60 * 60 * 1000
    ); // Daily

    // Setup retention schedules
    this.retentionSchedules.set('user_data', {
      classification: 'personal',
      retentionPeriod: this.options.retentionPolicies.personal,
      disposalMethod: 'secure_delete'
    });

    this.retentionSchedules.set('financial_data', {
      classification: 'restricted',
      retentionPeriod: this.options.retentionPolicies.financial,
      disposalMethod: 'secure_delete'
    });

    this.retentionSchedules.set('audit_logs', {
      classification: 'internal',
      retentionPeriod: this.options.retentionPolicies.logs,
      disposalMethod: 'archive'
    });
  }

  /**
   * Setup access monitoring
   */
  setupAccessMonitoring() {
    if (!this.options.enableAuditLogging) return;

    // Monitor data access patterns
    this.accessMonitor = {
      readAccess: new Map(),
      writeAccess: new Map(),
      unauthorizedAccess: new Map(),
      sensitiveDataAccess: new Map()
    };

    // Setup access logging
    setInterval(
      () => {
        this.analyzeAccessPatterns();
      },
      60 * 60 * 1000
    ); // Hourly analysis
  }

  /**
   * Setup consent management
   */
  setupConsentManagement() {
    // GDPR consent management
    this.consentTypes = {
      marketing: 'Marketing communications',
      analytics: 'Usage analytics',
      personalization: 'Personalized content',
      third_party: 'Third-party data sharing'
    };
  }

  /**
   * Setup data subject rights
   */
  setupDataSubjectRights() {
    // GDPR Article 17 - Right to erasure
    this.dataSubjectRights = {
      access: this.rightOfAccess.bind(this),
      rectification: this.rightOfRectification.bind(this),
      erasure: this.rightOfErasure.bind(this),
      restriction: this.rightOfRestriction.bind(this),
      portability: this.rightOfPortability.bind(this),
      objection: this.rightOfObjection.bind(this)
    };
  }

  /**
   * Generate encryption key
   */
  async generateKey() {
    try {
      return await crypto.subtle.generateKey(
        {
          name: this.options.encryptionAlgorithm,
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Failed to generate encryption key:', error);
      throw error;
    }
  }

  /**
   * Generate data encryption keys
   */
  async generateDataKeys() {
    const classifications = ['internal', 'confidential', 'restricted', 'personal'];

    for (const classification of classifications) {
      try {
        const key = await this.generateKey();
        this.encryptionKeys.set(classification, {
          key,
          created: new Date(),
          version: 1
        });
      } catch (error) {
        console.error(`Failed to generate key for ${classification}:`, error);
      }
    }
  }

  /**
   * Setup key rotation
   */
  setupKeyRotation() {
    setInterval(
      async () => {
        await this.rotateKeys();
      },
      this.options.keyRotationDays * 24 * 60 * 60 * 1000
    );
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys() {
    console.log('Starting key rotation...');

    for (const [classification, keyData] of this.encryptionKeys.entries()) {
      try {
        const newKey = await this.generateKey();
        const oldKey = keyData.key;

        // Store old key for decryption during transition
        keyData.oldKey = oldKey;
        keyData.key = newKey;
        keyData.version++;
        keyData.rotatedAt = new Date();

        console.log(`Rotated key for ${classification} (version ${keyData.version})`);
      } catch (error) {
        console.error(`Failed to rotate key for ${classification}:`, error);
      }
    }

    this.emit('keysRotated', { timestamp: new Date() });
  }

  /**
   * Encrypt data
   */
  async encrypt(data, classification = 'internal') {
    if (!this.options.enableEncryption) return data;

    try {
      const keyData = this.encryptionKeys.get(classification);
      if (!keyData) {
        throw new Error(`No encryption key found for classification: ${classification}`);
      }

      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));

      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.options.encryptionAlgorithm,
          iv
        },
        keyData.key,
        dataBuffer
      );

      const result = {
        data: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv),
        classification,
        keyVersion: keyData.version,
        encryptedAt: new Date()
      };

      return result;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data
   */
  async decrypt(encryptedData) {
    if (!this.options.enableEncryption) return encryptedData;

    try {
      const keyData = this.encryptionKeys.get(encryptedData.classification);
      if (!keyData) {
        throw new Error(
          `No decryption key found for classification: ${encryptedData.classification}`
        );
      }

      // Use appropriate key version
      let key = keyData.key;
      if (
        encryptedData.keyVersion &&
        encryptedData.keyVersion < keyData.version &&
        keyData.oldKey
      ) {
        key = keyData.oldKey;
      }

      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.options.encryptionAlgorithm,
          iv: new Uint8Array(encryptedData.iv)
        },
        key,
        new Uint8Array(encryptedData.data)
      );

      const decoder = new TextDecoder();
      const result = JSON.parse(decoder.decode(decrypted));

      return result;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Mask sensitive data
   */
  maskData(data, fields = this.options.sensitiveFields) {
    if (!this.options.enableDataMasking) return data;

    const masked = { ...data };

    fields.forEach(field => {
      if (masked[field]) {
        masked[field] = this.maskField(masked[field], field);
      }
    });

    return masked;
  }

  /**
   * Mask individual field
   */
  maskField(value, field) {
    if (!value || typeof value !== 'string') return value;

    switch (field) {
      case 'password':
        return '*'.repeat(8);

      case 'ssn':
      case 'creditCard':
        return value.replace(/\d/g, '*').replace(/^(\*+)(.*)$/, '$1$2'.slice(-4));

      case 'email':
        const [user, domain] = value.split('@');
        return (
          user.charAt(0) + '*'.repeat(user.length - 2) + user.charAt(user.length - 1) + '@' + domain
        );

      case 'phone':
        return value.replace(/\d/g, '*').replace(/^(\*+)(.*)$/, '$1$2'.slice(-4));

      case 'bankAccount':
        return value.replace(/\d/g, '*').replace(/^(\*+)(.*)$/, '$1$2'.slice(-4));

      default:
        return value.length > 4
          ? value.substring(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2)
          : value;
    }
  }

  /**
   * Anonymize data
   */
  anonymizeData(data, options = {}) {
    if (!this.options.enableAnonymization) return data;

    const anonymized = { ...data };
    const { removeFields = [], generalizeFields = [] } = options;

    // Remove sensitive fields
    removeFields.forEach(field => {
      delete anonymized[field];
    });

    // Generalize fields
    generalizeFields.forEach(field => {
      if (anonymized[field]) {
        anonymized[field] = this.generalizeField(anonymized[field], field);
      }
    });

    // Add anonymization metadata
    anonymized._anonymized = true;
    anonymized._anonymizedAt = new Date();

    return anonymized;
  }

  /**
   * Generalize field for anonymization
   */
  generalizeField(value, field) {
    switch (field) {
      case 'age':
        return Math.floor(value / 10) * 10 + 's'; // 20s, 30s, etc.

      case 'birthDate':
        const date = new Date(value);
        return date.getFullYear(); // Just year

      case 'salary':
      case 'income':
        return Math.floor(value / 10000) * 10000; // Round to nearest 10k

      case 'location':
        return value.split(' ').slice(-1)[0]; // Just state/country

      default:
        return value;
    }
  }

  /**
   * Classify data
   */
  classifyData(data) {
    let classification = 'public';
    let score = 0;

    // Check for sensitive fields
    const sensitiveFields = this.options.sensitiveFields;
    const dataFields = Object.keys(data);

    const sensitiveCount = dataFields.filter(field =>
      sensitiveFields.some(sensitive => field.toLowerCase().includes(sensitive.toLowerCase()))
    ).length;

    if (sensitiveCount > 0) {
      classification = 'personal';
      score = 100;
    } else {
      // Check for financial data
      const financialIndicators = ['amount', 'balance', 'transaction', 'price', 'value'];
      const financialCount = dataFields.filter(field =>
        financialIndicators.some(indicator => field.toLowerCase().includes(indicator))
      ).length;

      if (financialCount > 0) {
        classification = 'confidential';
        score = 70;
      } else if (dataFields.some(field => field.includes('internal'))) {
        classification = 'internal';
        score = 30;
      }
    }

    return {
      classification,
      score,
      sensitiveFields: sensitiveCount,
      metadata: this.dataClassifications.get(classification)
    };
  }

  /**
   * Log data access
   */
  logDataAccess(userId, resource, action, metadata = {}) {
    if (!this.options.enableAuditLogging) return;

    const accessLog = {
      id: `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      resource,
      action,
      timestamp: new Date(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      metadata
    };

    // Store access log
    if (!this.accessLogs.has(userId)) {
      this.accessLogs.set(userId, []);
    }

    const userLogs = this.accessLogs.get(userId);
    userLogs.push(accessLog);

    // Keep only last 1000 logs per user
    if (userLogs.length > 1000) {
      userLogs.splice(0, userLogs.length - 1000);
    }

    // Emit access event
    this.emit('dataAccess', accessLog);

    // Check for suspicious activity
    this.checkSuspiciousActivity(accessLog);
  }

  /**
   * Check for suspicious activity
   */
  checkSuspiciousActivity(accessLog) {
    const userLogs = this.accessLogs.get(accessLog.userId) || [];
    const recentLogs = userLogs.filter(
      log => Date.now() - log.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );

    // Check for unusual access patterns
    const sensitiveAccess = recentLogs.filter(log => log.metadata?.sensitive);
    if (sensitiveAccess.length > 10) {
      this.emit('suspiciousActivity', {
        type: 'high_sensitive_data_access',
        userId: accessLog.userId,
        count: sensitiveAccess.length,
        timeWindow: '1 hour'
      });
    }

    // Check for access from multiple IPs
    const uniqueIPs = new Set(recentLogs.map(log => log.ipAddress));
    if (uniqueIPs.size > 3) {
      this.emit('suspiciousActivity', {
        type: 'multiple_ip_access',
        userId: accessLog.userId,
        uniqueIPs: uniqueIPs.size,
        timeWindow: '1 hour'
      });
    }
  }

  /**
   * Analyze access patterns
   */
  analyzeAccessPatterns() {
    const analysis = {
      topUsers: [],
      topResources: [],
      accessPatterns: {},
      anomalies: []
    };

    // Analyze user activity
    for (const [userId, logs] of this.accessLogs.entries()) {
      const activity = {
        userId,
        totalAccess: logs.length,
        sensitiveAccess: logs.filter(log => log.metadata?.sensitive).length,
        lastAccess: logs[logs.length - 1]?.timestamp
      };

      analysis.topUsers.push(activity);
    }

    // Sort by activity
    analysis.topUsers.sort((a, b) => b.totalAccess - a.totalAccess);
    analysis.topUsers = analysis.topUsers.slice(0, 10);

    // Analyze resource access
    const resourceAccess = {};
    for (const logs of this.accessLogs.values()) {
      logs.forEach(log => {
        if (!resourceAccess[log.resource]) {
          resourceAccess[log.resource] = 0;
        }
        resourceAccess[log.resource]++;
      });
    }

    analysis.topResources = Object.entries(resourceAccess)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([resource, count]) => ({ resource, count }));

    this.emit('accessAnalysis', analysis);
  }

  /**
   * Record consent
   */
  recordConsent(userId, consentType, granted, metadata = {}) {
    if (!this.consentRecords.has(userId)) {
      this.consentRecords.set(userId, new Map());
    }

    const userConsents = this.consentRecords.get(userId);
    userConsents.set(consentType, {
      granted,
      timestamp: new Date(),
      metadata,
      version: 1
    });

    this.emit('consentRecorded', {
      userId,
      consentType,
      granted,
      timestamp: new Date()
    });
  }

  /**
   * Check consent
   */
  checkConsent(userId, consentType) {
    const userConsents = this.consentRecords.get(userId);
    if (!userConsents) return false;

    const consent = userConsents.get(consentType);
    return consent ? consent.granted : false;
  }

  /**
   * Data Subject Rights Implementation
   */

  /**
   * Right of Access (GDPR Article 15)
   */
  async rightOfAccess(userId) {
    const userData = await this.getUserData(userId);
    const accessLogs = this.accessLogs.get(userId) || [];

    return {
      personalData: this.maskData(userData),
      accessHistory: accessLogs.slice(-100), // Last 100 access events
      consentRecords: Array.from(this.consentRecords.get(userId)?.entries() || []),
      timestamp: new Date()
    };
  }

  /**
   * Right of Rectification (GDPR Article 16)
   */
  async rightOfRectification(userId, corrections) {
    const user = this.dataSubjects.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Apply corrections
    Object.assign(user, corrections);
    user.lastRectified = new Date();

    // Audit log
    this.logDataAccess(userId, 'user_profile', 'rectified', {
      corrections: Object.keys(corrections),
      timestamp: new Date()
    });

    return { success: true, rectifiedAt: new Date() };
  }

  /**
   * Right of Erasure (GDPR Article 17)
   */
  async rightOfErasure(userId) {
    // Remove user data
    this.dataSubjects.delete(userId);
    this.consentRecords.delete(userId);
    this.accessLogs.delete(userId);

    // Mark for permanent deletion (delayed for compliance)
    const deletionRecord = {
      userId,
      requestedAt: new Date(),
      scheduledDeletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'pending'
    };

    // In production, this would trigger a secure deletion process
    console.log('Data erasure requested:', deletionRecord);

    this.emit('dataErasure', deletionRecord);

    return {
      success: true,
      deletionScheduled: deletionRecord.scheduledDeletion
    };
  }

  /**
   * Right of Restriction (GDPR Article 18)
   */
  async rightOfRestriction(userId, restrictions) {
    const user = this.dataSubjects.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.dataRestrictions = restrictions;
    user.restrictedAt = new Date();

    // Audit log
    this.logDataAccess(userId, 'user_profile', 'restricted', {
      restrictions,
      timestamp: new Date()
    });

    return { success: true, restrictedAt: new Date() };
  }

  /**
   * Right of Portability (GDPR Article 20)
   */
  async rightOfPortability(userId) {
    const userData = await this.getUserData(userId);
    const accessLogs = this.accessLogs.get(userId) || [];
    const consents = Array.from(this.consentRecords.get(userId)?.entries() || []);

    const portableData = {
      personalData: userData,
      accessHistory: accessLogs,
      consentRecords: consents,
      exportFormat: 'JSON',
      exportedAt: new Date(),
      version: '1.0'
    };

    // Audit log
    this.logDataAccess(userId, 'user_profile', 'exported', {
      format: 'JSON',
      timestamp: new Date()
    });

    return portableData;
  }

  /**
   * Right of Objection (GDPR Article 21)
   */
  async rightOfObjection(userId, processingType) {
    // Withdraw consent for specific processing
    const userConsents = this.consentRecords.get(userId);
    if (userConsents) {
      const consent = userConsents.get(processingType);
      if (consent) {
        consent.granted = false;
        consent.objectionAt = new Date();
      }
    }

    this.emit('consentObjection', {
      userId,
      processingType,
      timestamp: new Date()
    });

    return { success: true, objectionAt: new Date() };
  }

  /**
   * Enforce retention policies
   */
  enforceRetentionPolicies() {
    const now = Date.now();

    for (const [scheduleName, schedule] of this.retentionSchedules.entries()) {
      const retentionMs = schedule.retentionPeriod * 24 * 60 * 60 * 1000;

      // In production, this would query the database for old data
      console.log(`Checking retention for ${scheduleName}: ${schedule.retentionPeriod} days`);

      // For demo, just emit retention check event
      this.emit('retentionCheck', {
        schedule: scheduleName,
        retentionPeriod: schedule.retentionPeriod,
        checkedAt: new Date()
      });
    }
  }

  /**
   * Get user data (helper method)
   */
  async getUserData(userId) {
    // In production, this would fetch from database
    return this.dataSubjects.get(userId) || {};
  }

  /**
   * Get client IP (simplified)
   */
  getClientIP() {
    // In production, get from server headers
    return '127.0.0.1';
  }

  /**
   * Export protection data
   */
  exportProtectionData() {
    return {
      classifications: Object.fromEntries(this.dataClassifications),
      retentionSchedules: Object.fromEntries(this.retentionSchedules),
      accessLogs: Object.fromEntries(this.accessLogs),
      consentRecords: Object.fromEntries(this.consentRecords),
      dataSubjects: Object.fromEntries(this.dataSubjects),
      stats: this.getProtectionStats(),
      exportTimestamp: Date.now()
    };
  }

  /**
   * Get protection statistics
   */
  getProtectionStats() {
    return {
      totalDataSubjects: this.dataSubjects.size,
      totalAccessLogs: Array.from(this.accessLogs.values()).reduce(
        (sum, logs) => sum + logs.length,
        0
      ),
      totalConsentRecords: Array.from(this.consentRecords.values()).reduce(
        (sum, consents) => sum + consents.size,
        0
      ),
      encryptedClassifications: Array.from(this.encryptionKeys.keys()),
      activeRetentionPolicies: this.retentionSchedules.size,
      dataClassifications: this.dataClassifications.size
    };
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
        console.error(`Error in data protection ${event} callback:`, error);
      }
    });
  }

  /**
   * Shutdown the service
   */
  shutdown() {
    this.encryptionKeys.clear();
    this.dataClassifications.clear();
    this.retentionSchedules.clear();
    this.accessLogs.clear();
    this.consentRecords.clear();
    this.dataSubjects.clear();

    this.isInitialized = false;
    console.log('Data Protection Service shutdown');
  }
}

// Export singleton instance
export const dataProtectionService = new DataProtectionService();
export default DataProtectionService;
