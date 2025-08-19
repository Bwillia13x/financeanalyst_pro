/**
 * Authentication Service Foundation
 * Provides comprehensive authentication infrastructure for multi-user deployment
 */

import { apiLogger } from '../utils/apiLogger.js';


// Authentication configuration
const AUTH_CONFIG = {
  tokenKey: 'financeanalyst_auth_token',
  userKey: 'financeanalyst_user_data',
  refreshTokenKey: 'financeanalyst_refresh_token',
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  passwordMinLength: 8,
  requireMFA: false // Will be configurable
};

// User roles and permissions
const USER_ROLES = {
  ADMIN: 'admin',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
  GUEST: 'guest'
};

const PERMISSIONS = {
  // Data permissions
  READ_MODELS: 'read_models',
  WRITE_MODELS: 'write_models',
  DELETE_MODELS: 'delete_models',
  EXPORT_DATA: 'export_data',
  IMPORT_DATA: 'import_data',

  // User management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',

  // System administration
  SYSTEM_CONFIG: 'system_config',
  VIEW_LOGS: 'view_logs',

  // API access
  API_ACCESS: 'api_access',
  BULK_OPERATIONS: 'bulk_operations'
};

// Role-permission mapping
const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS),
  [USER_ROLES.ANALYST]: [
    PERMISSIONS.READ_MODELS,
    PERMISSIONS.WRITE_MODELS,
    PERMISSIONS.DELETE_MODELS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.IMPORT_DATA,
    PERMISSIONS.API_ACCESS
  ],
  [USER_ROLES.VIEWER]: [
    PERMISSIONS.READ_MODELS,
    PERMISSIONS.EXPORT_DATA
  ],
  [USER_ROLES.GUEST]: [
    PERMISSIONS.READ_MODELS
  ]
};

/**
 * Authentication Service Class
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.authToken = null;
    this.refreshToken = null;
    this.loginAttempts = new Map();
    this.sessionCheckInterval = null;
    this.authListeners = new Set();

    this.initialize();
  }

  /**
   * Initialize authentication service
   */
  async initialize() {
    try {
      // Load existing session
      await this.loadSession();

      // Start session monitoring
      this.startSessionMonitoring();

      apiLogger.log('INFO', 'Authentication service initialized', {
        hasSession: !!this.currentUser,
        userId: this.currentUser?.id
      });
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to initialize auth service', { error: error.message });
    }
  }

  /**
   * Load existing session from storage
   */
  async loadSession() {
    try {
      const token = localStorage.getItem(AUTH_CONFIG.tokenKey);
      const userData = localStorage.getItem(AUTH_CONFIG.userKey);
      const refreshToken = localStorage.getItem(AUTH_CONFIG.refreshTokenKey);

      if (token && userData) {
        const user = JSON.parse(userData);

        // Validate token expiry
        if (this.isTokenValid(token)) {
          this.authToken = token;
          this.refreshToken = refreshToken;
          this.currentUser = user;

          // Notify listeners
          this.notifyAuthListeners('session_restored', user);

          return true;
        } else {
          // Try to refresh token
          if (refreshToken) {
            return await this.refreshAuthToken();
          } else {
            await this.logout();
          }
        }
      }

      return false;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to load session', { error: error.message });
      await this.logout();
      return false;
    }
  }

  /**
   * Authenticate user with email and password
   */
  async login(email, password, rememberMe = false) {
    try {
      // Check for account lockout
      if (this.isAccountLocked(email)) {
        throw new Error('Account temporarily locked due to multiple failed attempts');
      }

      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // For demo purposes, simulate authentication
      // In production, this would make an API call to your auth server
      const authResult = await this.simulateAuthentication(email, password);

      if (authResult.success) {
        // Clear login attempts
        this.loginAttempts.delete(email);

        // Store authentication data
        this.authToken = authResult.token;
        this.refreshToken = authResult.refreshToken;
        this.currentUser = authResult.user;

        // Persist session
        await this.persistSession(rememberMe);

        // Notify listeners
        this.notifyAuthListeners('login', authResult.user);

        apiLogger.log('INFO', 'User logged in successfully', {
          userId: authResult.user.id,
          email: authResult.user.email,
          role: authResult.user.role
        });

        return {
          success: true,
          user: authResult.user,
          token: authResult.token
        };
      } else {
        // Track failed attempt
        this.trackFailedLogin(email);
        throw new Error(authResult.message || 'Invalid credentials');
      }
    } catch (error) {
      apiLogger.log('ERROR', 'Login failed', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Simulate authentication for demo purposes
   */
  async simulateAuthentication(email, password) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Demo users for testing
    const demoUsers = {
      'admin@financeanalyst.pro': {
        id: 'user_admin_001',
        email: 'admin@financeanalyst.pro',
        name: 'Admin User',
        role: USER_ROLES.ADMIN,
        avatar: null,
        preferences: {
          theme: 'light',
          notifications: true,
          autoSave: true
        },
        password: 'admin123' // In production, this would be hashed
      },
      'analyst@financeanalyst.pro': {
        id: 'user_analyst_001',
        email: 'analyst@financeanalyst.pro',
        name: 'Financial Analyst',
        role: USER_ROLES.ANALYST,
        avatar: null,
        preferences: {
          theme: 'dark',
          notifications: true,
          autoSave: true
        },
        password: 'analyst123'
      },
      'viewer@financeanalyst.pro': {
        id: 'user_viewer_001',
        email: 'viewer@financeanalyst.pro',
        name: 'Data Viewer',
        role: USER_ROLES.VIEWER,
        avatar: null,
        preferences: {
          theme: 'light',
          notifications: false,
          autoSave: false
        },
        password: 'viewer123'
      }
    };

    const user = demoUsers[email.toLowerCase()];

    if (user && user.password === password) {
      // Generate mock tokens
      const token = this.generateMockToken(user);
      const refreshToken = this.generateMockRefreshToken(user);

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        user: userWithoutPassword,
        token,
        refreshToken,
        expiresIn: AUTH_CONFIG.sessionTimeout
      };
    } else {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }
  }

  /**
   * Generate mock JWT token for demo
   */
  generateMockToken(user) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + AUTH_CONFIG.sessionTimeout) / 1000)
    }));
    const signature = btoa('mock_signature_' + Date.now());

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Generate mock refresh token
   */
  generateMockRefreshToken(user) {
    return btoa(`refresh_${user.id}_${Date.now()}_${Math.random()}`);
  }

  /**
   * Logout user and clear session
   */
  async logout() {
    try {
      const userId = this.currentUser?.id;

      // Clear session data
      this.authToken = null;
      this.refreshToken = null;
      this.currentUser = null;

      // Clear storage
      localStorage.removeItem(AUTH_CONFIG.tokenKey);
      localStorage.removeItem(AUTH_CONFIG.userKey);
      localStorage.removeItem(AUTH_CONFIG.refreshTokenKey);

      // Stop session monitoring
      this.stopSessionMonitoring();

      // Notify listeners
      this.notifyAuthListeners('logout', null);

      apiLogger.log('INFO', 'User logged out', { userId });

      return true;
    } catch (error) {
      apiLogger.log('ERROR', 'Logout failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshAuthToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      // Simulate token refresh API call
      await new Promise(resolve => setTimeout(resolve, 200));

      // For demo, generate new tokens
      if (this.currentUser) {
        const newToken = this.generateMockToken(this.currentUser);
        const newRefreshToken = this.generateMockRefreshToken(this.currentUser);

        this.authToken = newToken;
        this.refreshToken = newRefreshToken;

        // Update storage
        localStorage.setItem(AUTH_CONFIG.tokenKey, newToken);
        localStorage.setItem(AUTH_CONFIG.refreshTokenKey, newRefreshToken);

        apiLogger.log('INFO', 'Token refreshed successfully', {
          userId: this.currentUser.id
        });

        return true;
      }

      throw new Error('No current user for token refresh');
    } catch (error) {
      apiLogger.log('ERROR', 'Token refresh failed', { error: error.message });
      await this.logout();
      return false;
    }
  }

  /**
   * Check if token is valid
   */
  isTokenValid(token) {
    try {
      if (!token) return false;

      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);

      return payload.exp > now;
    } catch {
      return false;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!(this.currentUser && this.authToken && this.isTokenValid(this.authToken));
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission) {
    if (!this.currentUser) return false;

    const userPermissions = ROLE_PERMISSIONS[this.currentUser.role] || [];
    return userPermissions.includes(permission);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasRole(...roles) {
    if (!this.currentUser) return false;
    return roles.includes(this.currentUser.role);
  }

  /**
   * Get user permissions
   */
  getUserPermissions() {
    if (!this.currentUser) return [];
    return ROLE_PERMISSIONS[this.currentUser.role] || [];
  }

  /**
   * Persist session to storage
   */
  async persistSession(rememberMe = false) {
    try {
      if (this.authToken && this.currentUser) {
        localStorage.setItem(AUTH_CONFIG.tokenKey, this.authToken);
        localStorage.setItem(AUTH_CONFIG.userKey, JSON.stringify(this.currentUser));

        if (this.refreshToken && rememberMe) {
          localStorage.setItem(AUTH_CONFIG.refreshTokenKey, this.refreshToken);
        }
      }
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to persist session', { error: error.message });
    }
  }

  /**
   * Track failed login attempts
   */
  trackFailedLogin(email) {
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: Date.now() };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    this.loginAttempts.set(email, attempts);
  }

  /**
   * Check if account is locked
   */
  isAccountLocked(email) {
    const attempts = this.loginAttempts.get(email);
    if (!attempts) return false;

    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;

    if (attempts.count >= AUTH_CONFIG.maxLoginAttempts) {
      if (timeSinceLastAttempt < AUTH_CONFIG.lockoutDuration) {
        return true;
      } else {
        // Reset attempts after lockout period
        this.loginAttempts.delete(email);
        return false;
      }
    }

    return false;
  }

  /**
   * Start session monitoring
   */
  startSessionMonitoring() {
    this.sessionCheckInterval = setInterval(() => {
      if (this.isAuthenticated()) {
        // Check if token needs refresh
        const tokenData = this.getTokenData();
        if (tokenData) {
          const timeToExpiry = (tokenData.exp * 1000) - Date.now();

          if (timeToExpiry < AUTH_CONFIG.refreshThreshold && this.refreshToken) {
            this.refreshAuthToken();
          }
        }
      } else if (this.currentUser) {
        // Session expired
        this.logout();
      }
    }, 60000); // Check every minute
  }

  /**
   * Stop session monitoring
   */
  stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * Get token data
   */
  getTokenData() {
    try {
      if (!this.authToken) return null;

      const parts = this.authToken.split('.');
      if (parts.length !== 3) return null;

      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  }

  /**
   * Add authentication event listener
   */
  addAuthListener(callback) {
    this.authListeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.authListeners.delete(callback);
    };
  }

  /**
   * Notify authentication listeners
   */
  notifyAuthListeners(event, data) {
    this.authListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        apiLogger.log('ERROR', 'Auth listener error', { error: error.message });
      }
    });
  }

  /**
   * Get authentication header for API requests
   */
  getAuthHeader() {
    if (this.authToken) {
      return {
        'Authorization': `Bearer ${this.authToken}`
      };
    }
    return {};
  }

  /**
   * Validate password strength
   */
  validatePassword(password) {
    const errors = [];

    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    if (password.length < AUTH_CONFIG.passwordMinLength) {
      errors.push(`Password must be at least ${AUTH_CONFIG.passwordMinLength} characters long`);
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  /**
   * Calculate password strength
   */
  calculatePasswordStrength(password) {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  }
}

// Export singleton instance and constants
export const authService = new AuthService();
export { USER_ROLES, PERMISSIONS, ROLE_PERMISSIONS, AUTH_CONFIG };
export default authService;
