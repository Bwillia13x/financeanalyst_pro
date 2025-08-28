/**
 * Tests for Authentication Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { authService, USER_ROLES, PERMISSIONS } from '../authService.js';

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: vi.fn(key => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn(key => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  })
};

describe('AuthService', () => {
  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    // Clear storage and reset service state
    localStorageMock.clear();
    vi.clearAllMocks();

    // Reset auth service state
    authService.currentUser = null;
    authService.authToken = null;
    authService.refreshToken = null;
    authService.loginAttempts.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Authentication', () => {
    it('should login with valid credentials', async () => {
      const result = await authService.login('admin@financeanalyst.pro', 'admin123');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('admin@financeanalyst.pro');
      expect(result.user.role).toBe(USER_ROLES.ADMIN);
      expect(result.token).toBeDefined();
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should reject invalid credentials', async () => {
      await expect(authService.login('admin@financeanalyst.pro', 'wrongpassword')).rejects.toThrow(
        'Invalid email or password'
      );

      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should require email and password', async () => {
      await expect(authService.login('', 'password')).rejects.toThrow(
        'Email and password are required'
      );

      await expect(authService.login('email@test.com', '')).rejects.toThrow(
        'Email and password are required'
      );
    });

    it('should track failed login attempts', async () => {
      const email = 'admin@financeanalyst.pro';

      // Make multiple failed attempts
      for (let i = 0; i < 3; i++) {
        try {
          await authService.login(email, 'wrongpassword');
        } catch (error) {
          // Expected to fail
        }
      }

      expect(authService.loginAttempts.get(email).count).toBe(3);
    });

    it('should lock account after max failed attempts', async () => {
      const email = 'admin@financeanalyst.pro';

      // Make max failed attempts
      for (let i = 0; i < 5; i++) {
        try {
          await authService.login(email, 'wrongpassword');
        } catch (error) {
          // Expected to fail
        }
      }

      // Next attempt should be locked
      await expect(authService.login(email, 'wrongpassword')).rejects.toThrow(
        'Account temporarily locked'
      );
    });

    it('should logout successfully', async () => {
      // Login first
      await authService.login('admin@financeanalyst.pro', 'admin123');
      expect(authService.isAuthenticated()).toBe(true);

      // Logout
      await authService.logout();
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should persist session with remember me', async () => {
      await authService.login('admin@financeanalyst.pro', 'admin123', true);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'financeanalyst_auth_token',
        expect.any(String)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'financeanalyst_user_data',
        expect.any(String)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'financeanalyst_refresh_token',
        expect.any(String)
      );
    });
  });

  describe('Token Management', () => {
    it('should generate valid JWT tokens', async () => {
      await authService.login('admin@financeanalyst.pro', 'admin123');

      const token = authService.authToken;
      expect(token).toBeDefined();

      const parts = token.split('.');
      expect(parts).toHaveLength(3);

      // Decode payload
      const payload = JSON.parse(atob(parts[1]));
      expect(payload.sub).toBe('user_admin_001');
      expect(payload.email).toBe('admin@financeanalyst.pro');
      expect(payload.role).toBe(USER_ROLES.ADMIN);
    });

    it('should validate token expiry', () => {
      // Create expired token
      const expiredPayload = {
        sub: 'test',
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
      const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;

      expect(authService.isTokenValid(expiredToken)).toBe(false);

      // Create valid token
      const validPayload = {
        sub: 'test',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
      const validToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;

      expect(authService.isTokenValid(validToken)).toBe(true);
    });

    it('should refresh tokens', async () => {
      await authService.login('admin@financeanalyst.pro', 'admin123');

      const originalToken = authService.authToken;
      const originalRefreshToken = authService.refreshToken;

      // Wait a bit to ensure new timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const refreshed = await authService.refreshAuthToken();

      expect(refreshed).toBe(true);
      expect(authService.authToken).not.toBe(originalToken);
      expect(authService.refreshToken).not.toBe(originalRefreshToken);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should check user roles correctly', async () => {
      await authService.login('admin@financeanalyst.pro', 'admin123');

      expect(authService.hasRole(USER_ROLES.ADMIN)).toBe(true);
      expect(authService.hasRole(USER_ROLES.ANALYST)).toBe(false);
      expect(authService.hasRole(USER_ROLES.ADMIN, USER_ROLES.ANALYST)).toBe(true);
    });

    it('should check permissions correctly', async () => {
      await authService.login('analyst@financeanalyst.pro', 'analyst123');

      expect(authService.hasPermission(PERMISSIONS.READ_MODELS)).toBe(true);
      expect(authService.hasPermission(PERMISSIONS.WRITE_MODELS)).toBe(true);
      expect(authService.hasPermission(PERMISSIONS.MANAGE_USERS)).toBe(false);
    });

    it('should return correct permissions for each role', async () => {
      // Test admin permissions
      await authService.login('admin@financeanalyst.pro', 'admin123');
      const adminPermissions = authService.getUserPermissions();
      expect(adminPermissions).toContain(PERMISSIONS.MANAGE_USERS);
      expect(adminPermissions).toContain(PERMISSIONS.SYSTEM_CONFIG);

      await authService.logout();

      // Test viewer permissions
      await authService.login('viewer@financeanalyst.pro', 'viewer123');
      const viewerPermissions = authService.getUserPermissions();
      expect(viewerPermissions).toContain(PERMISSIONS.READ_MODELS);
      expect(viewerPermissions).not.toContain(PERMISSIONS.WRITE_MODELS);
      expect(viewerPermissions).not.toContain(PERMISSIONS.MANAGE_USERS);
    });
  });

  describe('Session Management', () => {
    it('should load existing session', async () => {
      // Simulate existing session in localStorage
      const user = {
        id: 'user_admin_001',
        email: 'admin@financeanalyst.pro',
        name: 'Admin User',
        role: USER_ROLES.ADMIN
      };

      const validToken = authService.generateMockToken(user);

      localStorageMock.store['financeanalyst_auth_token'] = validToken;
      localStorageMock.store['financeanalyst_user_data'] = JSON.stringify(user);

      const loaded = await authService.loadSession();

      expect(loaded).toBe(true);
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getCurrentUser().email).toBe('admin@financeanalyst.pro');
    });

    it('should handle corrupted session data', async () => {
      localStorageMock.store['financeanalyst_auth_token'] = 'invalid_token';
      localStorageMock.store['financeanalyst_user_data'] = 'invalid_json';

      const loaded = await authService.loadSession();

      expect(loaded).toBe(false);
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should provide auth headers for API requests', async () => {
      await authService.login('admin@financeanalyst.pro', 'admin123');

      const headers = authService.getAuthHeader();

      expect(headers).toHaveProperty('Authorization');
      expect(headers.Authorization).toMatch(/^Bearer /);
    });
  });

  describe('Event Listeners', () => {
    it('should notify listeners on login', async () => {
      const listener = vi.fn();
      const unsubscribe = authService.addAuthListener(listener);

      await authService.login('admin@financeanalyst.pro', 'admin123');

      expect(listener).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          email: 'admin@financeanalyst.pro',
          role: USER_ROLES.ADMIN
        })
      );

      unsubscribe();
    });

    it('should notify listeners on logout', async () => {
      const listener = vi.fn();
      authService.addAuthListener(listener);

      await authService.login('admin@financeanalyst.pro', 'admin123');
      await authService.logout();

      expect(listener).toHaveBeenCalledWith('logout', null);
    });

    it('should handle listener errors gracefully', async () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });

      authService.addAuthListener(errorListener);

      // Should not throw
      expect(async () => {
        await authService.login('admin@financeanalyst.pro', 'admin123');
      }).not.toThrow();
    });
  });

  describe('Security Features', () => {
    it('should clear sensitive data on logout', async () => {
      await authService.login('admin@financeanalyst.pro', 'admin123');

      expect(authService.authToken).toBeDefined();
      expect(authService.currentUser).toBeDefined();

      await authService.logout();

      expect(authService.authToken).toBeNull();
      expect(authService.currentUser).toBeNull();
      expect(authService.refreshToken).toBeNull();
    });

    it('should handle account lockout timing', async () => {
      const email = 'admin@financeanalyst.pro';

      // Simulate failed attempts
      authService.loginAttempts.set(email, {
        count: 5,
        lastAttempt: Date.now() - 20 * 60 * 1000 // 20 minutes ago
      });

      // Should be unlocked after lockout period
      expect(authService.isAccountLocked(email)).toBe(false);

      // Recent failed attempts should still be locked
      authService.loginAttempts.set(email, {
        count: 5,
        lastAttempt: Date.now() - 5 * 60 * 1000 // 5 minutes ago
      });

      expect(authService.isAccountLocked(email)).toBe(true);
    });
  });

  describe('Demo Users', () => {
    it('should authenticate all demo users', async () => {
      const demoUsers = [
        { email: 'admin@financeanalyst.pro', password: 'admin123', role: USER_ROLES.ADMIN },
        { email: 'analyst@financeanalyst.pro', password: 'analyst123', role: USER_ROLES.ANALYST },
        { email: 'viewer@financeanalyst.pro', password: 'viewer123', role: USER_ROLES.VIEWER }
      ];

      for (const user of demoUsers) {
        await authService.logout(); // Clear previous session

        const result = await authService.login(user.email, user.password);

        expect(result.success).toBe(true);
        expect(result.user.email).toBe(user.email);
        expect(result.user.role).toBe(user.role);
      }
    });
  });
});
