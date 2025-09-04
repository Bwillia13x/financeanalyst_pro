// Comprehensive Security Service
// Provides authentication, authorization, encryption, and security monitoring
class SecurityService {
  constructor() {
    this.encryptionKey = null;
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    this.securityEvents = [];
    this.threatPatterns = new Map();

    // Security configuration
    this.config = {
      enableEncryption: true,
      enableAuditLogging: true,
      enableThreatDetection: true,
      enableRateLimiting: true,
      enableInputValidation: true,
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true
      },
      jwtConfig: {
        algorithm: 'RS256',
        expiresIn: '24h',
        issuer: 'financeanalyst-pro',
        audience: 'financeanalyst-users'
      }
    };

    this.initialize();
  }

  async initialize() {
    // Generate encryption keys
    if (this.config.enableEncryption) {
      await this.initializeEncryption();
    }

    // Setup security headers
    this.setupSecurityHeaders();

    // Initialize threat detection
    if (this.config.enableThreatDetection) {
      this.initializeThreatDetection();
    }

    // Setup audit logging
    if (this.config.enableAuditLogging) {
      this.initializeAuditLogging();
    }

    console.log('🔒 Security service initialized successfully');
  }

  // Encryption Management
  async initializeEncryption() {
    try {
      // Generate RSA key pair for JWT signing
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256'
        },
        true,
        ['sign', 'verify']
      );

      this.signingKey = keyPair.privateKey;
      this.verificationKey = keyPair.publicKey;

      // Generate AES key for data encryption
      this.encryptionKey = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );

      console.log('🔐 Encryption keys generated successfully');
    } catch (error) {
      console.error('❌ Failed to initialize encryption:', error);
    }
  }

  async encryptData(data) {
    if (!this.encryptionKey || !this.config.enableEncryption) {
      return data;
    }

    try {
      const encodedData = new TextEncoder().encode(JSON.stringify(data));
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        this.encryptionKey,
        encodedData
      );

      return {
        encrypted: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv)
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  async decryptData(encryptedData) {
    if (!this.encryptionKey || !this.config.enableEncryption) {
      return encryptedData;
    }

    try {
      const { encrypted, iv } = encryptedData;
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(iv)
        },
        this.encryptionKey,
        new Uint8Array(encrypted)
      );

      return JSON.parse(new TextDecoder().decode(decrypted));
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // JWT Token Management
  async generateToken(payload) {
    if (!this.signingKey) {
      throw new Error('Signing key not initialized');
    }

    const header = {
      alg: this.config.jwtConfig.algorithm,
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + 24 * 60 * 60, // 24 hours
      iss: this.config.jwtConfig.issuer,
      aud: this.config.jwtConfig.audience
    };

    try {
      const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
      const encodedPayload = btoa(JSON.stringify(tokenPayload)).replace(/=/g, '');

      const message = `${encodedHeader}.${encodedPayload}`;
      const signature = await this.signMessage(message);

      const token = `${message}.${signature}`;

      this.logSecurityEvent('token_generated', {
        userId: payload.userId,
        tokenId: tokenPayload.jti,
        timestamp: now
      });

      return token;
    } catch (error) {
      console.error('Token generation error:', error);
      throw new Error('Failed to generate token');
    }
  }

  async signMessage(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', this.signingKey, data);

    return btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');
  }

  async verifyToken(token) {
    if (!this.verificationKey) {
      throw new Error('Verification key not initialized');
    }

    try {
      const [header, payload, signature] = token.split('.');

      const message = `${header}.${payload}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(message);

      const sigBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));

      const isValid = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        this.verificationKey,
        sigBytes,
        data
      );

      if (!isValid) {
        this.logSecurityEvent('token_verification_failed', { token });
        return null;
      }

      const decodedPayload = JSON.parse(atob(payload));

      // Check expiration
      if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
        this.logSecurityEvent('token_expired', { userId: decodedPayload.userId });
        return null;
      }

      this.logSecurityEvent('token_verified', {
        userId: decodedPayload.userId,
        tokenId: decodedPayload.jti
      });

      return decodedPayload;
    } catch (error) {
      console.error('Token verification error:', error);
      this.logSecurityEvent('token_verification_error', { error: error.message });
      return null;
    }
  }

  // Authentication & Authorization
  async authenticateUser(credentials) {
    const { email, password } = credentials;

    // Check for brute force attempts
    const attempts = await this.getLoginAttempts(email);
    if (attempts >= this.maxLoginAttempts) {
      const lockoutTime = await this.getLockoutTime(email);
      if (lockoutTime > Date.now()) {
        throw new Error('Account temporarily locked due to too many failed attempts');
      }
    }

    try {
      // Verify credentials (this would integrate with your auth system)
      const user = await this.verifyCredentials(email, password);

      if (!user) {
        await this.recordFailedLogin(email);
        throw new Error('Invalid credentials');
      }

      // Generate session token
      const token = await this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        jti: crypto.randomUUID()
      });

      // Reset login attempts on successful login
      await this.resetLoginAttempts(email);

      this.logSecurityEvent('user_authenticated', {
        userId: user.id,
        email: user.email,
        timestamp: Date.now()
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          permissions: user.permissions
        }
      };
    } catch (error) {
      await this.recordFailedLogin(email);
      throw error;
    }
  }

  async authorizeAction(user, action, resource) {
    if (!user || !user.permissions) {
      this.logSecurityEvent('authorization_denied', {
        userId: user?.id,
        action,
        resource,
        reason: 'No permissions found'
      });
      return false;
    }

    const hasPermission = this.checkPermission(user.permissions, action, resource);

    if (!hasPermission) {
      this.logSecurityEvent('authorization_denied', {
        userId: user.id,
        action,
        resource,
        reason: 'Insufficient permissions'
      });
    }

    return hasPermission;
  }

  checkPermission(permissions, action, resource) {
    // Check for wildcard permissions
    if (permissions.includes('*') || permissions.includes('admin')) {
      return true;
    }

    // Check for specific permission
    const requiredPermission = `${action}:${resource}`;
    const wildcardAction = `${action}:*`;
    const wildcardResource = `*:${resource}`;

    return (
      permissions.includes(requiredPermission) ||
      permissions.includes(wildcardAction) ||
      permissions.includes(wildcardResource)
    );
  }

  // Password Security
  validatePassword(password) {
    const policy = this.config.passwordPolicy;

    if (password.length < policy.minLength) {
      return {
        valid: false,
        error: `Password must be at least ${policy.minLength} characters long`
      };
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one uppercase letter' };
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one lowercase letter' };
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      return { valid: false, error: 'Password must contain at least one number' };
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one special character' };
    }

    if (policy.preventCommonPasswords && this.isCommonPassword(password)) {
      return { valid: false, error: 'Password is too common, please choose a stronger password' };
    }

    return { valid: true };
  }

  isCommonPassword(password) {
    const commonPasswords = [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey'
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Threat Detection
  initializeThreatDetection() {
    // Monitor for suspicious patterns
    this.threatPatterns.set('brute_force', {
      pattern: /multiple.*failed.*login/i,
      severity: 'high',
      action: 'lock_account'
    });

    this.threatPatterns.set('suspicious_ip', {
      pattern: /unusual.*ip.*address/i,
      severity: 'medium',
      action: 'alert_admin'
    });

    this.threatPatterns.set('data_exfiltration', {
      pattern: /large.*data.*export/i,
      severity: 'high',
      action: 'block_action'
    });
  }

  detectThreat(activity) {
    for (const [threatType, config] of this.threatPatterns) {
      if (config.pattern.test(activity.description)) {
        this.logSecurityEvent('threat_detected', {
          type: threatType,
          severity: config.severity,
          activity,
          timestamp: Date.now()
        });

        // Execute threat response
        this.respondToThreat(threatType, config, activity);

        return true;
      }
    }
    return false;
  }

  respondToThreat(threatType, config, activity) {
    switch (config.action) {
      case 'lock_account':
        this.lockAccount(activity.userId);
        break;
      case 'alert_admin':
        this.alertAdministrator(threatType, activity);
        break;
      case 'block_action':
        throw new Error(`Action blocked due to security threat: ${threatType}`);
    }
  }

  // Security Headers
  setupSecurityHeaders() {
    if (typeof window === 'undefined') return;

    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.financeanalyst.pro wss://api.financeanalyst.pro",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join('; ');

    // Set security headers via meta tags
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = csp;
    document.head.appendChild(meta);

    // Additional security headers
    const securityHeaders = {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };

    Object.entries(securityHeaders).forEach(([name, value]) => {
      const headerMeta = document.createElement('meta');
      headerMeta.httpEquiv = name;
      headerMeta.content = value;
      document.head.appendChild(headerMeta);
    });
  }

  // Audit Logging
  initializeAuditLogging() {
    this.auditLog = [];
    this.auditRetentionDays = 90;
  }

  logSecurityEvent(eventType, data) {
    const event = {
      id: crypto.randomUUID(),
      type: eventType,
      data,
      timestamp: Date.now(),
      ip: this.getClientIP(),
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId()
    };

    this.securityEvents.push(event);
    this.auditLog.push(event);

    // Keep only recent events in memory
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-500);
    }

    // Send to security monitoring service
    this.sendToSecurityService(event);

    console.log(`🔒 Security Event: ${eventType}`, data);
  }

  // Rate Limiting
  async checkRateLimit(identifier, action) {
    const key = `${action}:${identifier}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100; // Max requests per window

    // In a real implementation, this would check Redis or database
    const requests = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]');

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      const resetTime = validRequests[0] + windowMs;
      return {
        allowed: false,
        resetIn: resetTime - now,
        remaining: 0
      };
    }

    validRequests.push(now);
    localStorage.setItem(`rate_limit_${key}`, JSON.stringify(validRequests));

    return {
      allowed: true,
      resetIn: windowMs,
      remaining: maxRequests - validRequests.length
    };
  }

  // Input Validation and Sanitization
  sanitizeInput(input, type = 'text') {
    if (!this.config.enableInputValidation) return input;

    let sanitized = input;

    switch (type) {
      case 'email':
        sanitized = input.replace(/[<>'"&]/g, '');
        break;
      case 'text':
        sanitized = input.replace(/[<>'"&]/g, '');
        break;
      case 'html':
        // Allow limited HTML tags
        sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
        break;
      case 'sql':
        // Basic SQL injection prevention
        sanitized = input.replace(/['";\\]/g, '');
        break;
    }

    return sanitized.trim();
  }

  validateInput(input, rules) {
    const errors = [];

    if (rules.required && (!input || input.trim() === '')) {
      errors.push('This field is required');
    }

    if (rules.minLength && input.length < rules.minLength) {
      errors.push(`Minimum length is ${rules.minLength} characters`);
    }

    if (rules.maxLength && input.length > rules.maxLength) {
      errors.push(`Maximum length is ${rules.maxLength} characters`);
    }

    if (rules.pattern && !rules.pattern.test(input)) {
      errors.push('Invalid format');
    }

    if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
      errors.push('Invalid email format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Session Management
  createSecureSession(userId) {
    const sessionId = crypto.randomUUID();
    const session = {
      id: sessionId,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout,
      ip: this.getClientIP(),
      userAgent: navigator.userAgent
    };

    // Store session securely
    const encryptedSession = this.encryptData(session);
    sessionStorage.setItem('fa_secure_session', JSON.stringify(encryptedSession));

    this.logSecurityEvent('session_created', {
      sessionId,
      userId,
      timestamp: session.createdAt
    });

    return session;
  }

  validateSession() {
    try {
      const encryptedSession = JSON.parse(sessionStorage.getItem('fa_secure_session'));
      if (!encryptedSession) return null;

      const session = this.decryptData(encryptedSession);

      if (session.expiresAt < Date.now()) {
        this.destroySession();
        return null;
      }

      // Extend session if it's close to expiring
      if (session.expiresAt - Date.now() < 5 * 60 * 1000) {
        // 5 minutes
        session.expiresAt = Date.now() + this.sessionTimeout;
        const encrypted = this.encryptData(session);
        sessionStorage.setItem('fa_secure_session', JSON.stringify(encrypted));
      }

      return session;
    } catch (error) {
      console.error('Session validation error:', error);
      this.destroySession();
      return null;
    }
  }

  destroySession() {
    const session = this.validateSession();
    if (session) {
      this.logSecurityEvent('session_destroyed', {
        sessionId: session.id,
        userId: session.userId,
        timestamp: Date.now()
      });
    }

    sessionStorage.removeItem('fa_secure_session');
  }

  // Helper Methods
  getClientIP() {
    // In a real application, this would be obtained from the server
    return 'client_ip_not_available';
  }

  getSessionId() {
    const session = this.validateSession();
    return session?.id || 'no_session';
  }

  async getLoginAttempts(email) {
    // In a real implementation, this would check a database
    return parseInt(localStorage.getItem(`login_attempts_${email}`) || '0');
  }

  async recordFailedLogin(email) {
    const attempts = await this.getLoginAttempts(email);
    localStorage.setItem(`login_attempts_${email}`, (attempts + 1).toString());

    if (attempts + 1 >= this.maxLoginAttempts) {
      localStorage.setItem(`lockout_${email}`, (Date.now() + this.lockoutDuration).toString());
    }
  }

  async resetLoginAttempts(email) {
    localStorage.removeItem(`login_attempts_${email}`);
    localStorage.removeItem(`lockout_${email}`);
  }

  async getLockoutTime(email) {
    return parseInt(localStorage.getItem(`lockout_${email}`) || '0');
  }

  async verifyCredentials(email, password) {
    // Mock credential verification - integrate with your auth system
    if (email === 'demo@financeanalyst.pro' && password === 'DemoPass123!') {
      return {
        id: 'user_123',
        email,
        role: 'user',
        permissions: ['read:financial_data', 'write:analysis']
      };
    }
    return null;
  }

  lockAccount(userId) {
    // Mock account locking
    console.log(`🔒 Account locked for user: ${userId}`);
    this.logSecurityEvent('account_locked', { userId, reason: 'brute_force_attempt' });
  }

  alertAdministrator(threatType, activity) {
    // Mock admin alert
    console.warn(`🚨 Admin Alert: ${threatType}`, activity);
    this.logSecurityEvent('admin_alert', { threatType, activity });
  }

  async sendToSecurityService(event) {
    // Send to security monitoring backend
    try {
      await fetch('/api/security/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.debug('Security service error:', error);
    }
  }

  // Public API Methods
  async login(credentials) {
    return this.authenticateUser(credentials);
  }

  async logout() {
    this.destroySession();
  }

  isAuthenticated() {
    return this.validateSession() !== null;
  }

  getCurrentUser() {
    const session = this.validateSession();
    return session ? { id: session.userId } : null;
  }

  // Cleanup
  destroy() {
    this.destroySession();
    this.securityEvents = [];
    this.auditLog = [];
  }
}

// Create singleton instance
const securityService = new SecurityService();

// Export for use in components
export default securityService;

// Export class for testing
export { SecurityService };

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  window.securityService = securityService;
}
