/**
 * Enterprise Security Engine
 * Multi-tenant architecture, role-based access control, audit logging, and security compliance
 */

class EnterpriseSecurityEngine {
  constructor() {
    this.organizations = new Map();
    this.users = new Map();
    this.roles = new Map();
    this.permissions = new Map();
    this.auditLog = [];
    this.securityPolicies = new Map();
    this.sessionManager = this.initializeSessionManager();
    this.encryptionService = this.initializeEncryption();
  }

  /**
   * Multi-Tenant Organization Management
   */

  createOrganization(orgData) {
    const orgId = this.generateId();
    const organization = {
      id: orgId,
      name: orgData.name,
      domain: orgData.domain,
      industry: orgData.industry,
      plan: orgData.plan || 'enterprise',
      settings: {
        dataRetention: orgData.dataRetention || 2555, // 7 years in days
        auditLevel: orgData.auditLevel || 'detailed',
        encryptionRequired: orgData.encryptionRequired !== false,
        ssoEnabled: orgData.ssoEnabled || false,
        mfaRequired: orgData.mfaRequired || true,
        sessionTimeout: orgData.sessionTimeout || 3600, // 1 hour
        passwordPolicy: orgData.passwordPolicy || this.getDefaultPasswordPolicy(),
        ipWhitelist: orgData.ipWhitelist || [],
        dataClassification: orgData.dataClassification || 'confidential'
      },
      features: {
        fixedIncome: true,
        options: true,
        riskManagement: true,
        creditAnalysis: true,
        portfolioAnalytics: true,
        realTimeData: true,
        apiAccess: orgData.plan === 'enterprise',
        advancedReporting: orgData.plan === 'enterprise',
        whiteLabeling: orgData.plan === 'enterprise'
      },
      limits: {
        maxUsers: this.getPlanLimits(orgData.plan).maxUsers,
        maxPortfolios: this.getPlanLimits(orgData.plan).maxPortfolios,
        maxDataPoints: this.getPlanLimits(orgData.plan).maxDataPoints,
        apiRateLimit: this.getPlanLimits(orgData.plan).apiRateLimit
      },
      created: new Date(),
      status: 'active',
      billing: {
        plan: orgData.plan,
        billingContact: orgData.billingContact,
        paymentMethod: orgData.paymentMethod
      }
    };

    this.organizations.set(orgId, organization);
    this.logAuditEvent('organization_created', { orgId, name: orgData.name });

    return {
      organizationId: orgId,
      organization,
      adminToken: this.generateAdminToken(orgId)
    };
  }

  updateOrganization(orgId, updates, userId) {
    const org = this.organizations.get(orgId);
    if (!org) throw new Error('Organization not found');

    const updatedOrg = { ...org, ...updates, updated: new Date() };
    this.organizations.set(orgId, updatedOrg);

    this.logAuditEvent('organization_updated', {
      orgId,
      updates: Object.keys(updates),
      userId
    });

    return updatedOrg;
  }

  /**
   * Role-Based Access Control (RBAC)
   */

  initializeDefaultRoles() {
    const defaultRoles = [
      {
        id: 'super_admin',
        name: 'Super Administrator',
        description: 'Full system access',
        level: 100,
        permissions: ['*'], // All permissions
        features: ['*']
      },
      {
        id: 'org_admin',
        name: 'Organization Administrator',
        description: 'Full organization access',
        level: 90,
        permissions: [
          'user_management', 'org_settings', 'billing_management',
          'data_export', 'audit_access', 'portfolio_management',
          'risk_management', 'credit_analysis', 'fixed_income',
          'options_trading', 'reporting'
        ],
        features: ['*']
      },
      {
        id: 'portfolio_manager',
        name: 'Portfolio Manager',
        description: 'Portfolio and risk management',
        level: 80,
        permissions: [
          'portfolio_management', 'risk_management', 'credit_analysis',
          'fixed_income', 'options_trading', 'market_data_access',
          'performance_analytics', 'client_reporting'
        ],
        features: ['portfolios', 'risk', 'credit', 'fixed_income', 'options']
      },
      {
        id: 'risk_analyst',
        name: 'Risk Analyst',
        description: 'Risk analysis and monitoring',
        level: 70,
        permissions: [
          'risk_management', 'credit_analysis', 'stress_testing',
          'var_calculation', 'compliance_monitoring', 'market_data_access'
        ],
        features: ['risk', 'credit', 'compliance']
      },
      {
        id: 'trader',
        name: 'Trader',
        description: 'Trading and market analysis',
        level: 60,
        permissions: [
          'options_trading', 'fixed_income', 'market_data_access',
          'portfolio_view', 'order_management', 'price_alerts'
        ],
        features: ['options', 'fixed_income', 'trading']
      },
      {
        id: 'analyst',
        name: 'Financial Analyst',
        description: 'Analysis and research',
        level: 50,
        permissions: [
          'valuation_tools', 'dcf_modeling', 'scenario_analysis',
          'market_data_access', 'research_reports', 'portfolio_view'
        ],
        features: ['valuation', 'modeling', 'research']
      },
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access',
        level: 10,
        permissions: [
          'portfolio_view', 'report_view', 'market_data_view'
        ],
        features: ['view_only']
      }
    ];

    defaultRoles.forEach(role => this.roles.set(role.id, role));
  }

  assignRole(userId, roleId, orgId, assignedBy) {
    const user = this.users.get(userId);
    const role = this.roles.get(roleId);
    const org = this.organizations.get(orgId);

    if (!user || !role || !org) {
      throw new Error('Invalid user, role, or organization');
    }

    if (!user.organizations) user.organizations = {};
    user.organizations[orgId] = {
      roleId,
      permissions: role.permissions,
      assignedAt: new Date(),
      assignedBy
    };

    this.users.set(userId, user);

    this.logAuditEvent('role_assigned', {
      userId,
      roleId,
      orgId,
      assignedBy
    });

    return user.organizations[orgId];
  }

  checkPermission(userId, permission, orgId, resource = null) {
    const user = this.users.get(userId);
    if (!user) return false;

    const orgMembership = user.organizations?.[orgId];
    if (!orgMembership) return false;

    const userPermissions = orgMembership.permissions;

    // Check for wildcard permission
    if (userPermissions.includes('*')) return true;

    // Check specific permission
    if (userPermissions.includes(permission)) return true;

    // Check resource-specific permissions
    if (resource && userPermissions.includes(`${permission}:${resource}`)) return true;

    // Check hierarchical permissions
    return this.checkHierarchicalPermission(userPermissions, permission);
  }

  /**
   * User Management
   */

  createUser(userData, orgId, createdBy) {
    const userId = this.generateId();
    const hashedPassword = this.hashPassword(userData.password);

    const user = {
      id: userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      password: hashedPassword,
      organizations: {},
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: userData.timezone || 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      },
      security: {
        mfaEnabled: false,
        mfaSecret: null,
        lastLogin: null,
        loginAttempts: 0,
        lockedUntil: null,
        passwordHistory: [hashedPassword],
        securityQuestions: []
      },
      status: 'active',
      created: new Date(),
      lastActive: null
    };

    this.users.set(userId, user);

    // Assign default role if specified
    if (userData.roleId) {
      this.assignRole(userId, userData.roleId, orgId, createdBy);
    }

    this.logAuditEvent('user_created', {
      userId,
      email: userData.email,
      orgId,
      createdBy
    });

    return {
      userId,
      user: this.sanitizeUser(user)
    };
  }

  authenticateUser(email, password, orgId, clientInfo = {}) {
    const user = Array.from(this.users.values()).find(u => u.email === email);

    if (!user) {
      this.logAuditEvent('login_failed', { email, reason: 'user_not_found', ...clientInfo });
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'active') {
      this.logAuditEvent('login_failed', { email, reason: 'account_disabled', ...clientInfo });
      throw new Error('Account disabled');
    }

    if (user.security.lockedUntil && user.security.lockedUntil > new Date()) {
      this.logAuditEvent('login_failed', { email, reason: 'account_locked', ...clientInfo });
      throw new Error('Account locked');
    }

    if (!this.verifyPassword(password, user.password)) {
      user.security.loginAttempts += 1;
      if (user.security.loginAttempts >= 5) {
        user.security.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      this.users.set(user.id, user);

      this.logAuditEvent('login_failed', {
        userId: user.id,
        email,
        reason: 'invalid_password',
        attempts: user.security.loginAttempts,
        ...clientInfo
      });
      throw new Error('Invalid credentials');
    }

    // Check organization membership
    if (orgId && !user.organizations[orgId]) {
      this.logAuditEvent('login_failed', {
        userId: user.id,
        email,
        reason: 'org_access_denied',
        orgId,
        ...clientInfo
      });
      throw new Error('Organization access denied');
    }

    // Reset login attempts on successful authentication
    user.security.loginAttempts = 0;
    user.security.lockedUntil = null;
    user.security.lastLogin = new Date();
    user.lastActive = new Date();
    this.users.set(user.id, user);

    const session = this.createSession(user.id, orgId, clientInfo);

    this.logAuditEvent('login_successful', {
      userId: user.id,
      email,
      orgId,
      sessionId: session.id,
      ...clientInfo
    });

    return {
      user: this.sanitizeUser(user),
      session,
      permissions: user.organizations[orgId]?.permissions || [],
      organization: this.organizations.get(orgId)
    };
  }

  /**
   * Session Management
   */

  initializeSessionManager() {
    return {
      sessions: new Map(),
      cleanupInterval: setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000) // 5 minutes
    };
  }

  createSession(userId, orgId, clientInfo) {
    const sessionId = this.generateSecureToken();
    const org = this.organizations.get(orgId);
    const timeout = org?.settings.sessionTimeout || 3600;

    const session = {
      id: sessionId,
      userId,
      orgId,
      created: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + timeout * 1000),
      clientInfo: {
        userAgent: clientInfo.userAgent,
        ipAddress: clientInfo.ipAddress,
        deviceId: clientInfo.deviceId
      },
      permissions: this.getUserPermissions(userId, orgId)
    };

    this.sessionManager.sessions.set(sessionId, session);
    return session;
  }

  validateSession(sessionId) {
    const session = this.sessionManager.sessions.get(sessionId);

    if (!session) return null;

    if (session.expiresAt < new Date()) {
      this.sessionManager.sessions.delete(sessionId);
      this.logAuditEvent('session_expired', { sessionId, userId: session.userId });
      return null;
    }

    // Update last activity
    session.lastActivity = new Date();
    this.sessionManager.sessions.set(sessionId, session);

    return session;
  }

  revokeSession(sessionId, reason = 'user_logout') {
    const session = this.sessionManager.sessions.get(sessionId);
    if (session) {
      this.sessionManager.sessions.delete(sessionId);
      this.logAuditEvent('session_revoked', {
        sessionId,
        userId: session.userId,
        reason
      });
    }
  }

  /**
   * Data Encryption & Security
   */

  initializeEncryption() {
    return {
      algorithm: 'AES-256-GCM',
      keyDerivationIterations: 100000,
      saltLength: 32,
      ivLength: 16,
      tagLength: 16
    };
  }

  encryptSensitiveData(data, context = {}) {
    // In production, use proper encryption library
    const encrypted = Buffer.from(JSON.stringify(data)).toString('base64');

    this.logAuditEvent('data_encrypted', {
      dataType: context.type || 'unknown',
      userId: context.userId,
      orgId: context.orgId
    });

    return {
      encrypted,
      algorithm: this.encryptionService.algorithm,
      timestamp: new Date()
    };
  }

  decryptSensitiveData(encryptedData, context = {}) {
    try {
      const decrypted = JSON.parse(Buffer.from(encryptedData.encrypted, 'base64').toString());

      this.logAuditEvent('data_decrypted', {
        dataType: context.type || 'unknown',
        userId: context.userId,
        orgId: context.orgId
      });

      return decrypted;
    } catch (error) {
      this.logAuditEvent('decryption_failed', {
        error: error.message,
        userId: context.userId,
        orgId: context.orgId
      });
      throw new Error('Decryption failed');
    }
  }

  /**
   * Audit Logging
   */

  logAuditEvent(action, details = {}) {
    const auditEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      action,
      userId: details.userId,
      orgId: details.orgId,
      sessionId: details.sessionId,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      resource: details.resource,
      details: { ...details },
      severity: this.getActionSeverity(action),
      category: this.getActionCategory(action)
    };

    this.auditLog.push(auditEntry);

    // In production, this would write to a secure audit database
    console.log(`[AUDIT] ${action}:`, auditEntry);

    // Alert on high-severity events
    if (auditEntry.severity === 'high') {
      this.triggerSecurityAlert(auditEntry);
    }

    return auditEntry.id;
  }

  getAuditLog(filters = {}, orgId = null) {
    let filteredLog = this.auditLog;

    // Filter by organization if specified
    if (orgId) {
      filteredLog = filteredLog.filter(entry => entry.orgId === orgId);
    }

    // Apply additional filters
    if (filters.userId) {
      filteredLog = filteredLog.filter(entry => entry.userId === filters.userId);
    }

    if (filters.action) {
      filteredLog = filteredLog.filter(entry => entry.action === filters.action);
    }

    if (filters.startDate) {
      filteredLog = filteredLog.filter(entry => entry.timestamp >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      filteredLog = filteredLog.filter(entry => entry.timestamp <= new Date(filters.endDate));
    }

    if (filters.severity) {
      filteredLog = filteredLog.filter(entry => entry.severity === filters.severity);
    }

    return {
      entries: filteredLog.slice(-1000), // Return last 1000 entries
      total: filteredLog.length,
      filtered: true
    };
  }

  /**
   * Security Policies & Compliance
   */

  enforcePasswordPolicy(password, orgId) {
    const org = this.organizations.get(orgId);
    const policy = org?.settings.passwordPolicy || this.getDefaultPasswordPolicy();

    const violations = [];

    if (password.length < policy.minLength) {
      violations.push(`Password must be at least ${policy.minLength} characters`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      violations.push('Password must contain uppercase letters');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      violations.push('Password must contain lowercase letters');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      violations.push('Password must contain numbers');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      violations.push('Password must contain special characters');
    }

    return {
      isValid: violations.length === 0,
      violations,
      strength: this.calculatePasswordStrength(password)
    };
  }

  validateIPAccess(ipAddress, orgId) {
    const org = this.organizations.get(orgId);
    const whitelist = org?.settings.ipWhitelist || [];

    if (whitelist.length === 0) return true; // No restrictions

    return whitelist.some(allowedIP => {
      if (allowedIP.includes('/')) {
        // CIDR notation
        return this.isIPInCIDR(ipAddress, allowedIP);
      }
      return ipAddress === allowedIP;
    });
  }

  /**
   * Utility Functions
   */

  generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  generateSecureToken() {
    return 'tok_' + Math.random().toString(36).substr(2, 15) + Date.now().toString(36);
  }

  generateAdminToken(orgId) {
    return 'admin_' + orgId + '_' + this.generateSecureToken();
  }

  hashPassword(password) {
    // In production, use proper password hashing (bcrypt, scrypt, etc.)
    return 'hashed_' + Buffer.from(password).toString('base64');
  }

  verifyPassword(password, hash) {
    return this.hashPassword(password) === hash;
  }

  sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  getUserPermissions(userId, orgId) {
    const user = this.users.get(userId);
    return user?.organizations?.[orgId]?.permissions || [];
  }

  getDefaultPasswordPolicy() {
    return {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventReuse: 5,
      maxAge: 90 // days
    };
  }

  getPlanLimits(plan) {
    const limits = {
      starter: {
        maxUsers: 5,
        maxPortfolios: 10,
        maxDataPoints: 1000000,
        apiRateLimit: 1000 // per hour
      },
      professional: {
        maxUsers: 25,
        maxPortfolios: 50,
        maxDataPoints: 10000000,
        apiRateLimit: 10000
      },
      enterprise: {
        maxUsers: 1000,
        maxPortfolios: 1000,
        maxDataPoints: 100000000,
        apiRateLimit: 100000
      }
    };
    return limits[plan] || limits.starter;
  }

  getActionSeverity(action) {
    const highSeverityActions = [
      'login_failed', 'account_locked', 'permission_denied',
      'data_export', 'user_deleted', 'role_changed', 'security_alert'
    ];
    const mediumSeverityActions = [
      'login_successful', 'user_created', 'password_changed',
      'session_expired', 'data_encrypted', 'data_decrypted'
    ];

    if (highSeverityActions.includes(action)) return 'high';
    if (mediumSeverityActions.includes(action)) return 'medium';
    return 'low';
  }

  getActionCategory(action) {
    if (action.includes('login') || action.includes('session')) return 'authentication';
    if (action.includes('user') || action.includes('role')) return 'user_management';
    if (action.includes('data') || action.includes('export')) return 'data_access';
    if (action.includes('org')) return 'organization';
    return 'system';
  }

  triggerSecurityAlert(auditEntry) {
    // In production, this would integrate with security monitoring systems
    console.warn(`[SECURITY ALERT] ${auditEntry.action}:`, auditEntry);
  }

  calculatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

    const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return strength[Math.min(score, 5)];
  }

  checkHierarchicalPermission(userPermissions, permission) {
    // Check if user has parent permission (e.g., 'portfolio_management' includes 'portfolio_view')
    const hierarchy = {
      'portfolio_management': ['portfolio_view', 'portfolio_edit'],
      'user_management': ['user_view', 'user_edit'],
      'org_admin': ['user_management', 'org_settings']
    };

    return Object.entries(hierarchy).some(([parent, children]) =>
      userPermissions.includes(parent) && children.includes(permission)
    );
  }

  isIPInCIDR(ip, cidr) {
    // Simplified CIDR check - in production use proper IP library
    const [network, prefixLength] = cidr.split('/');
    // This is a placeholder implementation
    return ip.startsWith(network.split('.').slice(0, Math.floor(prefixLength / 8)).join('.'));
  }

  cleanupExpiredSessions() {
    const now = new Date();
    for (const [sessionId, session] of this.sessionManager.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessionManager.sessions.delete(sessionId);
        this.logAuditEvent('session_expired', { sessionId, userId: session.userId });
      }
    }
  }
}

export default EnterpriseSecurityEngine;
