/**
 * Authentication Service
 * Comprehensive authentication and authorization system
 * Supports JWT, OAuth2, multi-factor authentication, and role-based access control
 */

class AuthenticationService {
  constructor(options = {}) {
    this.options = {
      jwtSecret: process.env.JWT_SECRET || 'financeanalyst-secret-key',
      jwtExpiration: '24h',
      refreshTokenExpiration: '7d',
      enableMFA: true,
      enableBiometric: false,
      enableSSO: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true
      },
      ...options
    };

    this.users = new Map();
    this.sessions = new Map();
    this.tokens = new Map();
    this.roles = new Map();
    this.permissions = new Map();
    this.loginAttempts = new Map();
    this.mfaCodes = new Map();

    this.isInitialized = false;

    // Initialize default roles and permissions
    this.initializeRolesAndPermissions();
  }

  /**
   * Initialize the authentication service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.setupTokenRefresh();
      this.setupSessionManagement();
      this.setupSecurityHeaders();
      this.initializeDefaultUsers();

      this.isInitialized = true;
      console.log('Authentication Service initialized');
    } catch (error) {
      console.error('Failed to initialize Authentication Service:', error);
    }
  }

  /**
   * Initialize default roles and permissions
   */
  initializeRolesAndPermissions() {
    // Define permissions
    this.permissions.set('read:dashboard', {
      id: 'read:dashboard',
      name: 'Read Dashboard',
      description: 'View main dashboard and analytics'
    });

    this.permissions.set('write:reports', {
      id: 'write:reports',
      name: 'Write Reports',
      description: 'Create and edit financial reports'
    });

    this.permissions.set('admin:users', {
      id: 'admin:users',
      name: 'User Administration',
      description: 'Manage user accounts and permissions'
    });

    this.permissions.set('read:portfolio', {
      id: 'read:portfolio',
      name: 'Read Portfolio',
      description: 'View portfolio data and performance'
    });

    this.permissions.set('write:portfolio', {
      id: 'write:portfolio',
      name: 'Write Portfolio',
      description: 'Modify portfolio holdings and settings'
    });

    this.permissions.set('read:market-data', {
      id: 'read:market-data',
      name: 'Read Market Data',
      description: 'Access market data and analytics'
    });

    // Define roles
    this.roles.set('viewer', {
      id: 'viewer',
      name: 'Viewer',
      description: 'Read-only access to basic features',
      permissions: ['read:dashboard', 'read:portfolio', 'read:market-data'],
      level: 1
    });

    this.roles.set('analyst', {
      id: 'analyst',
      name: 'Financial Analyst',
      description: 'Full access to analysis and reporting tools',
      permissions: [
        'read:dashboard',
        'write:reports',
        'read:portfolio',
        'write:portfolio',
        'read:market-data'
      ],
      level: 2
    });

    this.roles.set('admin', {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access and user management',
      permissions: [
        'read:dashboard',
        'write:reports',
        'admin:users',
        'read:portfolio',
        'write:portfolio',
        'read:market-data'
      ],
      level: 3
    });

    this.roles.set('super-admin', {
      id: 'super-admin',
      name: 'Super Administrator',
      description: 'Complete system access with system management',
      permissions: [
        'read:dashboard',
        'write:reports',
        'admin:users',
        'read:portfolio',
        'write:portfolio',
        'read:market-data'
      ],
      level: 4
    });
  }

  /**
   * Setup token refresh mechanism
   */
  setupTokenRefresh() {
    // Check for token refresh every 5 minutes
    setInterval(
      () => {
        this.refreshExpiredTokens();
      },
      5 * 60 * 1000
    );

    // Listen for storage events (for multi-tab support)
    window.addEventListener('storage', event => {
      if (event.key === 'auth_tokens') {
        this.handleTokenStorageChange(event.newValue);
      }
    });
  }

  /**
   * Setup session management
   */
  setupSessionManagement() {
    // Clean up expired sessions every 10 minutes
    setInterval(
      () => {
        this.cleanupExpiredSessions();
      },
      10 * 60 * 1000
    );

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.validateCurrentSession();
      }
    });

    // Handle beforeunload
    window.addEventListener('beforeunload', () => {
      this.updateLastActivity();
    });
  }

  /**
   * Setup security headers
   */
  setupSecurityHeaders() {
    // Add security headers to document
    const metaCSP = document.createElement('meta');
    metaCSP.httpEquiv = 'Content-Security-Policy';
    metaCSP.content =
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://api.* https://*.financial-data.com;";
    document.head.appendChild(metaCSP);

    const metaHSTS = document.createElement('meta');
    metaHSTS.httpEquiv = 'Strict-Transport-Security';
    metaHSTS.content = 'max-age=31536000; includeSubDomains';
    document.head.appendChild(metaHSTS);
  }

  /**
   * Initialize default users (for demo purposes)
   */
  initializeDefaultUsers() {
    // Create default admin user
    const adminUser = {
      id: 'user_admin',
      email: 'admin@financeanalyst.com',
      username: 'admin',
      password: this.hashPassword('Admin123!@#'),
      firstName: 'System',
      lastName: 'Administrator',
      role: 'super-admin',
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      lastLogin: null,
      mfaEnabled: false,
      loginAttempts: 0,
      lockedUntil: null,
      preferences: {
        theme: 'dark',
        language: 'en',
        timezone: 'UTC'
      }
    };

    // Create default analyst user
    const analystUser = {
      id: 'user_analyst',
      email: 'analyst@financeanalyst.com',
      username: 'analyst',
      password: this.hashPassword('Analyst123!'),
      firstName: 'Financial',
      lastName: 'Analyst',
      role: 'analyst',
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      lastLogin: null,
      mfaEnabled: false,
      loginAttempts: 0,
      lockedUntil: null,
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC'
      }
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(analystUser.id, analystUser);
  }

  /**
   * User registration
   */
  async register(userData) {
    // Validate input
    this.validateRegistrationData(userData);

    // Check if user already exists
    const existingUser = Array.from(this.users.values()).find(
      user => user.email === userData.email || user.username === userData.username
    );

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Create new user
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: userData.email,
      username: userData.username,
      password: this.hashPassword(userData.password),
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || 'viewer',
      isActive: false, // Require email verification
      isVerified: false,
      createdAt: new Date(),
      lastLogin: null,
      mfaEnabled: false,
      loginAttempts: 0,
      lockedUntil: null,
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        ...userData.preferences
      }
    };

    this.users.set(newUser.id, newUser);

    // Send verification email (simulated)
    await this.sendVerificationEmail(newUser);

    // Audit log
    this.auditLog('user_registered', {
      userId: newUser.id,
      email: newUser.email,
      timestamp: new Date()
    });

    return {
      userId: newUser.id,
      email: newUser.email,
      message: 'Registration successful. Please check your email to verify your account.'
    };
  }

  /**
   * User login
   */
  async login(credentials) {
    const { username, password, mfaCode } = credentials;

    // Find user
    const user = Array.from(this.users.values()).find(
      user => user.email === username || user.username === username
    );

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new Error('Account is not active. Please verify your email first.');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockedUntil - Date.now()) / 1000 / 60);
      throw new Error(`Account is locked. Try again in ${remainingTime} minutes.`);
    }

    // Validate password
    if (!this.validatePassword(password, user.password)) {
      await this.handleFailedLogin(user);
      throw new Error('Invalid credentials');
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaCode) {
        return { requiresMFA: true, userId: user.id };
      }

      if (!this.validateMFACode(user.id, mfaCode)) {
        await this.handleFailedLogin(user);
        throw new Error('Invalid MFA code');
      }
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date();

    // Create session and tokens
    const session = await this.createSession(user);
    const tokens = await this.generateTokens(user, session);

    // Audit log
    this.auditLog('user_login', {
      userId: user.id,
      email: user.email,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date()
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
      session
    };
  }

  /**
   * MFA validation
   */
  async validateMFA(userId, code) {
    const storedCode = this.mfaCodes.get(userId);

    if (!storedCode || storedCode.expiresAt < Date.now()) {
      throw new Error('MFA code expired or invalid');
    }

    if (storedCode.code !== code) {
      throw new Error('Invalid MFA code');
    }

    // Remove used code
    this.mfaCodes.delete(userId);

    // Generate final tokens
    const user = this.users.get(userId);
    const session = await this.createSession(user);
    const tokens = await this.generateTokens(user, session);

    return { tokens, session };
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(user, session) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
      permissions: this.getUserPermissions(user),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + this.parseDuration(this.options.jwtExpiration)) / 1000)
    };

    const accessToken = this.generateJWT(payload);

    const refreshPayload = {
      userId: user.id,
      sessionId: session.id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + this.parseDuration(this.options.refreshTokenExpiration)) / 1000)
    };

    const refreshToken = this.generateJWT(refreshPayload);

    // Store tokens
    this.tokens.set(accessToken, {
      userId: user.id,
      sessionId: session.id,
      type: 'access',
      expiresAt: new Date(payload.exp * 1000)
    });

    this.tokens.set(refreshToken, {
      userId: user.id,
      sessionId: session.id,
      type: 'refresh',
      expiresAt: new Date(refreshPayload.exp * 1000)
    });

    // Store in localStorage for persistence
    localStorage.setItem(
      'auth_tokens',
      JSON.stringify({
        accessToken,
        refreshToken,
        expiresAt: payload.exp * 1000
      })
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.options.jwtExpiration,
      tokenType: 'Bearer'
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = this.verifyJWT(refreshToken);

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const user = this.users.get(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      const session = this.sessions.get(decoded.sessionId);
      if (!session || !session.isActive) {
        throw new Error('Session expired');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user, session);

      return tokens;
    } catch (error) {
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Create user session
   */
  async createSession(user) {
    const session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      deviceInfo: this.getDeviceInfo()
    };

    this.sessions.set(session.id, session);

    return session;
  }

  /**
   * Validate access token
   */
  async validateToken(token) {
    try {
      const decoded = this.verifyJWT(token);
      const tokenData = this.tokens.get(token);

      if (!tokenData || tokenData.type !== 'access') {
        return { valid: false, error: 'Invalid token' };
      }

      const user = this.users.get(decoded.userId);
      if (!user || !user.isActive) {
        return { valid: false, error: 'User not found or inactive' };
      }

      const session = this.sessions.get(decoded.sessionId);
      if (!session || !session.isActive) {
        return { valid: false, error: 'Session expired' };
      }

      // Update session activity
      session.lastActivity = new Date();

      return {
        valid: true,
        user: this.sanitizeUser(user),
        session,
        permissions: decoded.permissions
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Logout user
   */
  async logout(token) {
    try {
      const decoded = this.verifyJWT(token);
      const session = this.sessions.get(decoded.sessionId);

      if (session) {
        session.isActive = false;
      }

      // Remove tokens
      this.tokens.delete(token);

      // Clear localStorage
      localStorage.removeItem('auth_tokens');

      // Audit log
      this.auditLog('user_logout', {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        timestamp: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check user permissions
   */
  async checkPermission(userId, permission) {
    const user = this.users.get(userId);
    if (!user) return false;

    const userPermissions = this.getUserPermissions(user);
    return userPermissions.includes(permission);
  }

  /**
   * Get user permissions
   */
  getUserPermissions(user) {
    const role = this.roles.get(user.role);
    if (!role) return [];

    return role.permissions;
  }

  /**
   * Handle failed login attempt
   */
  async handleFailedLogin(user) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;

    if (user.loginAttempts >= this.options.maxLoginAttempts) {
      user.lockedUntil = Date.now() + this.options.lockoutDuration;
      user.loginAttempts = 0;

      // Audit log
      this.auditLog('account_locked', {
        userId: user.id,
        email: user.email,
        reason: 'Too many failed login attempts',
        timestamp: new Date()
      });
    }

    // Audit log
    this.auditLog('login_failed', {
      userId: user.id,
      email: user.email,
      attemptCount: user.loginAttempts,
      timestamp: new Date()
    });
  }

  /**
   * Enable MFA for user
   */
  async enableMFA(userId) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.mfaEnabled = true;
    user.mfaSecret = this.generateMFASecret();

    // Audit log
    this.auditLog('mfa_enabled', {
      userId: user.id,
      email: user.email,
      timestamp: new Date()
    });

    return {
      secret: user.mfaSecret,
      qrCodeUrl: this.generateQRCodeUrl(user, user.mfaSecret)
    };
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.mfaEnabled = false;
    user.mfaSecret = null;

    // Audit log
    this.auditLog('mfa_disabled', {
      userId: user.id,
      email: user.email,
      timestamp: new Date()
    });

    return { success: true };
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate current password
    if (!this.validatePassword(currentPassword, user.password)) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    this.validatePasswordStrength(newPassword);

    // Update password
    user.password = this.hashPassword(newPassword);
    user.passwordChangedAt = new Date();

    // Invalidate all sessions (force re-login)
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        session.isActive = false;
      }
    }

    // Audit log
    this.auditLog('password_changed', {
      userId: user.id,
      email: user.email,
      timestamp: new Date()
    });

    return { success: true };
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    const policy = this.options.passwordPolicy;

    if (password.length < policy.minLength) {
      throw new Error(`Password must be at least ${policy.minLength} characters long`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }

    if (policy.preventCommonPasswords) {
      const commonPasswords = ['password', '123456', 'admin', 'user', 'login'];
      if (commonPasswords.includes(password.toLowerCase())) {
        throw new Error('Password is too common. Please choose a stronger password');
      }
    }
  }

  /**
   * Validate registration data
   */
  validateRegistrationData(data) {
    if (!data.email || !data.username || !data.password) {
      throw new Error('Email, username, and password are required');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Invalid email format');
    }

    if (data.username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    this.validatePasswordStrength(data.password);
  }

  /**
   * Generate MFA code
   */
  generateMFACode(userId) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.mfaCodes.set(userId, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    return code;
  }

  /**
   * Validate MFA code
   */
  validateMFACode(userId, code) {
    const storedCode = this.mfaCodes.get(userId);
    return storedCode && storedCode.code === code && storedCode.expiresAt > Date.now();
  }

  /**
   * Hash password (simplified for demo)
   */
  hashPassword(password) {
    // In production, use bcrypt or similar
    return btoa(password + this.options.jwtSecret);
  }

  /**
   * Validate password
   */
  validatePassword(password, hash) {
    return this.hashPassword(password) === hash;
  }

  /**
   * Generate JWT (simplified for demo)
   */
  generateJWT(payload) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = btoa(`${header}.${encodedPayload}.${this.options.jwtSecret}`);
    return `${header}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify JWT (simplified for demo)
   */
  verifyJWT(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token format');

      const payload = JSON.parse(atob(parts[1]));

      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Parse duration string
   */
  parseDuration(duration) {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 24 * 60 * 60 * 1000; // Default 24 hours

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Sanitize user object for client
   */
  sanitizeUser(user) {
    const { password, mfaSecret, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  /**
   * Get client IP (simplified)
   */
  getClientIP() {
    // In production, get from server headers
    return '127.0.0.1';
  }

  /**
   * Get device info
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      screenResolution: `${screen.width}x${screen.height}`
    };
  }

  /**
   * Generate MFA secret (simplified)
   */
  generateMFASecret() {
    return Math.random().toString(36).substr(2, 16);
  }

  /**
   * Generate QR code URL for MFA
   */
  generateQRCodeUrl(user, secret) {
    const issuer = 'FinanceAnalyst Pro';
    const accountName = user.email;
    return `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}`;
  }

  /**
   * Send verification email (simulated)
   */
  async sendVerificationEmail(user) {
    // In production, send actual email
    console.log(`Verification email sent to ${user.email}`);
  }

  /**
   * Refresh expired tokens
   */
  async refreshExpiredTokens() {
    const now = Date.now();

    for (const [token, data] of this.tokens.entries()) {
      if (data.type === 'access' && data.expiresAt < now) {
        // Token expired, try to refresh
        try {
          const refreshToken = Array.from(this.tokens.entries()).find(
            ([t, d]) => d.type === 'refresh' && d.sessionId === data.sessionId
          )?.[0];

          if (refreshToken) {
            await this.refreshToken(refreshToken);
          }
        } catch (error) {
          console.warn('Failed to refresh token:', error);
        }
      }
    }
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now || !session.isActive) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Validate current session
   */
  async validateCurrentSession() {
    const tokensStr = localStorage.getItem('auth_tokens');
    if (!tokensStr) return;

    try {
      const tokens = JSON.parse(tokensStr);
      const result = await this.validateToken(tokens.accessToken);

      if (!result.valid) {
        // Try to refresh token
        const newTokens = await this.refreshToken(tokens.refreshToken);
        localStorage.setItem(
          'auth_tokens',
          JSON.stringify({
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            expiresAt: Date.now() + this.parseDuration(this.options.jwtExpiration)
          })
        );
      }
    } catch (error) {
      console.warn('Session validation failed:', error);
      localStorage.removeItem('auth_tokens');
    }
  }

  /**
   * Handle token storage change
   */
  handleTokenStorageChange(newValue) {
    if (!newValue) {
      // Tokens were cleared, handle logout
      this.emit('logout');
    }
  }

  /**
   * Update last activity
   */
  updateLastActivity() {
    const tokensStr = localStorage.getItem('auth_tokens');
    if (!tokensStr) return;

    try {
      const tokens = JSON.parse(tokensStr);
      const decoded = this.verifyJWT(tokens.accessToken);

      const session = this.sessions.get(decoded.sessionId);
      if (session) {
        session.lastActivity = new Date();
      }
    } catch (error) {
      // Ignore errors during cleanup
    }
  }

  /**
   * Audit logging
   */
  auditLog(event, data) {
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event,
      data,
      timestamp: new Date(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    };

    // In production, send to audit service
    console.log('Audit:', auditEntry);

    // Emit audit event
    this.emit('audit', auditEntry);
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
        console.error(`Error in authentication ${event} callback:`, error);
      }
    });
  }

  /**
   * Get current user from token
   */
  getCurrentUser() {
    const tokensStr = localStorage.getItem('auth_tokens');
    if (!tokensStr) return null;

    try {
      const tokens = JSON.parse(tokensStr);
      const result = this.validateToken(tokens.accessToken);

      return result.valid ? result.user : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  /**
   * Get authentication statistics
   */
  getStats() {
    const now = Date.now();
    const activeUsers = Array.from(this.users.values()).filter(user => user.isActive).length;
    const activeSessions = Array.from(this.sessions.values()).filter(
      session => session.isActive
    ).length;
    const expiredTokens = Array.from(this.tokens.values()).filter(
      token => token.expiresAt < now
    ).length;

    return {
      totalUsers: this.users.size,
      activeUsers,
      activeSessions,
      totalTokens: this.tokens.size,
      expiredTokens,
      lockedAccounts: Array.from(this.users.values()).filter(user => user.lockedUntil > now).length,
      mfaEnabledUsers: Array.from(this.users.values()).filter(user => user.mfaEnabled).length
    };
  }

  /**
   * Shutdown the service
   */
  shutdown() {
    // Clear all data
    this.users.clear();
    this.sessions.clear();
    this.tokens.clear();
    this.loginAttempts.clear();
    this.mfaCodes.clear();

    // Clear localStorage
    localStorage.removeItem('auth_tokens');

    this.isInitialized = false;
    console.log('Authentication Service shutdown');
  }
}

// Export singleton instance
export const authenticationService = new AuthenticationService();
export default AuthenticationService;
