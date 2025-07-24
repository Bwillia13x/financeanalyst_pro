/**
 * Session Manager
 * Manages user sessions, authentication state, and session persistence
 */

import { CryptoUtils } from '../utils/CryptoUtils';

export class SessionManager {
  constructor() {
    this.sessionKey = 'financeanalyst_session';
    this.userKey = 'financeanalyst_user';
    this.preferencesKey = 'financeanalyst_preferences';
    this.cryptoUtils = new CryptoUtils();
    
    this.currentSession = null;
    this.currentUser = null;
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.listeners = new Set();
    
    // Default user preferences
    this.defaultPreferences = {
      currency: 'USD',
      precision: 2,
      dateFormat: 'YYYY-MM-DD',
      theme: 'dark',
      notifications: true,
      autoSave: true,
      commandHistory: true,
      dataRetention: 30, // days
      privacy: {
        analytics: false,
        crashReporting: true,
        dataSharing: false
      }
    };
  }

  /**
   * Initialize session manager
   */
  async initialize() {
    try {
      // Load existing session
      await this.loadSession();
      
      // Setup session monitoring
      this.setupSessionMonitoring();
      
      console.log('✅ Session Manager initialized');
      return { success: true, hasSession: !!this.currentSession };
    } catch (error) {
      console.error('❌ Failed to initialize Session Manager:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new session
   */
  async createSession(userInfo = {}) {
    try {
      const sessionId = this.generateSessionId();
      const now = Date.now();
      
      const session = {
        id: sessionId,
        userId: userInfo.id || this.generateUserId(),
        created: now,
        lastActivity: now,
        expires: now + this.sessionTimeout,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        version: '1.0'
      };

      const user = {
        id: session.userId,
        name: userInfo.name || 'Anonymous User',
        email: userInfo.email || null,
        created: userInfo.created || now,
        lastLogin: now,
        loginCount: (userInfo.loginCount || 0) + 1,
        preferences: { ...this.defaultPreferences, ...userInfo.preferences }
      };

      // Store session and user data
      await this.storeSession(session);
      await this.storeUser(user);
      
      this.currentSession = session;
      this.currentUser = user;
      
      // Notify listeners
      this.notifyListeners('sessionCreated', { session, user });
      
      return {
        success: true,
        session,
        user
      };

    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Load existing session
   */
  async loadSession() {
    try {
      const sessionData = localStorage.getItem(this.sessionKey);
      const userData = localStorage.getItem(this.userKey);
      
      if (!sessionData || !userData) {
        return null;
      }

      const session = JSON.parse(sessionData);
      const user = JSON.parse(userData);
      
      // Check if session is expired
      if (Date.now() > session.expires) {
        await this.destroySession();
        return null;
      }

      // Update last activity
      session.lastActivity = Date.now();
      await this.storeSession(session);
      
      this.currentSession = session;
      this.currentUser = user;
      
      // Notify listeners
      this.notifyListeners('sessionLoaded', { session, user });
      
      return { session, user };

    } catch (error) {
      console.error('Failed to load session:', error);
      // Clear corrupted session data
      await this.destroySession();
      return null;
    }
  }

  /**
   * Update session activity
   */
  async updateActivity() {
    if (!this.currentSession) {
      return false;
    }

    try {
      this.currentSession.lastActivity = Date.now();
      
      // Extend session if needed
      const timeUntilExpiry = this.currentSession.expires - Date.now();
      if (timeUntilExpiry < this.sessionTimeout * 0.1) { // Extend if less than 10% time left
        this.currentSession.expires = Date.now() + this.sessionTimeout;
      }

      await this.storeSession(this.currentSession);
      return true;

    } catch (error) {
      console.error('Failed to update session activity:', error);
      return false;
    }
  }

  /**
   * Destroy current session
   */
  async destroySession() {
    try {
      const session = this.currentSession;
      const user = this.currentUser;
      
      // Clear session data
      localStorage.removeItem(this.sessionKey);
      
      this.currentSession = null;
      this.currentUser = null;
      
      // Notify listeners
      this.notifyListeners('sessionDestroyed', { session, user });
      
      return true;

    } catch (error) {
      console.error('Failed to destroy session:', error);
      return false;
    }
  }

  /**
   * Get current session
   */
  getSession() {
    return this.currentSession;
  }

  /**
   * Get current user
   */
  getUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!(this.currentSession && Date.now() < this.currentSession.expires);
  }

  /**
   * Get user preferences
   */
  getPreferences() {
    return this.currentUser ? this.currentUser.preferences : this.defaultPreferences;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(newPreferences) {
    if (!this.currentUser) {
      throw new Error('No active user session');
    }

    try {
      this.currentUser.preferences = {
        ...this.currentUser.preferences,
        ...newPreferences
      };

      await this.storeUser(this.currentUser);
      
      // Also store preferences separately for quick access
      localStorage.setItem(this.preferencesKey, JSON.stringify(this.currentUser.preferences));
      
      // Notify listeners
      this.notifyListeners('preferencesUpdated', { preferences: this.currentUser.preferences });
      
      return this.currentUser.preferences;

    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    if (!this.currentSession || !this.currentUser) {
      return null;
    }

    const now = Date.now();
    const sessionDuration = now - this.currentSession.created;
    const timeUntilExpiry = this.currentSession.expires - now;
    const lastActivityAge = now - this.currentSession.lastActivity;

    return {
      sessionId: this.currentSession.id,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      sessionDuration,
      timeUntilExpiry,
      lastActivityAge,
      loginCount: this.currentUser.loginCount,
      userCreated: this.currentUser.created,
      isExpired: timeUntilExpiry <= 0,
      isActive: lastActivityAge < 5 * 60 * 1000 // Active if activity within 5 minutes
    };
  }

  /**
   * Export session data
   */
  async exportSessionData() {
    if (!this.currentSession || !this.currentUser) {
      return null;
    }

    return {
      session: { ...this.currentSession },
      user: { ...this.currentUser },
      preferences: { ...this.currentUser.preferences },
      exportTimestamp: Date.now()
    };
  }

  /**
   * Import session data
   */
  async importSessionData(sessionData) {
    try {
      if (!sessionData || !sessionData.session || !sessionData.user) {
        throw new Error('Invalid session data format');
      }

      // Validate session data
      const session = sessionData.session;
      const user = sessionData.user;

      // Update timestamps
      session.lastActivity = Date.now();
      session.expires = Date.now() + this.sessionTimeout;
      user.lastLogin = Date.now();

      // Store imported data
      await this.storeSession(session);
      await this.storeUser(user);

      this.currentSession = session;
      this.currentUser = user;

      // Notify listeners
      this.notifyListeners('sessionImported', { session, user });

      return { success: true, session, user };

    } catch (error) {
      console.error('Failed to import session data:', error);
      throw error;
    }
  }

  /**
   * Add session event listener
   */
  addEventListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove session event listener
   */
  removeEventListener(callback) {
    this.listeners.delete(callback);
  }

  // Private methods

  /**
   * Store session data
   */
  async storeSession(session) {
    try {
      localStorage.setItem(this.sessionKey, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to store session:', error);
      throw error;
    }
  }

  /**
   * Store user data
   */
  async storeUser(user) {
    try {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user:', error);
      throw error;
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate unique user ID
   */
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Setup session monitoring
   */
  setupSessionMonitoring() {
    // Update activity on user interaction
    const events = ['click', 'keypress', 'scroll', 'mousemove'];
    let lastActivity = Date.now();

    const throttledUpdate = this.throttle(() => {
      const now = Date.now();
      if (now - lastActivity > 60000) { // Update every minute
        this.updateActivity();
        lastActivity = now;
      }
    }, 1000);

    events.forEach(event => {
      document.addEventListener(event, throttledUpdate, { passive: true });
    });

    // Check session expiry periodically
    setInterval(() => {
      if (this.currentSession && Date.now() > this.currentSession.expires) {
        this.destroySession();
      }
    }, 60000); // Check every minute

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateActivity();
      }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.updateActivity();
    });
  }

  /**
   * Throttle function calls
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Notify event listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in session event listener:', error);
      }
    });
  }
}
