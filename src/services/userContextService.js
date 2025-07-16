/**
 * User Context Service
 * Provides user-specific data isolation and workspace management
 */

import { apiLogger } from '../utils/apiLogger.js';

import { authService } from './authService.js';
import { encryptionService } from './encryptionService.js';
import { storageService } from './storageService.js';

// Context configuration
const CONTEXT_CONFIG = {
  userPrefix: 'user_',
  sharedPrefix: 'shared_',
  workspacePrefix: 'workspace_',
  isolationLevel: 'strict', // strict, moderate, relaxed
  enableSharing: true,
  enableWorkspaces: true
};

// Data sharing levels
const SHARING_LEVELS = {
  PRIVATE: 'private',
  TEAM: 'team',
  ORGANIZATION: 'organization',
  PUBLIC: 'public'
};

// Workspace types
const WORKSPACE_TYPES = {
  PERSONAL: 'personal',
  TEAM: 'team',
  PROJECT: 'project',
  SHARED: 'shared'
};

/**
 * User Context Service Class
 */
class UserContextService {
  constructor() {
    this.currentContext = null;
    this.activeWorkspace = null;
    this.contextListeners = new Set();
    this.dataCache = new Map();

    this.initialize();
  }

  /**
   * Initialize user context service
   */
  async initialize() {
    try {
      // Listen for auth changes
      authService.addAuthListener((event, userData) => {
        if (event === 'login' || event === 'session_restored') {
          this.setUserContext(userData);
        } else if (event === 'logout') {
          this.clearContext();
        }
      });

      // Set initial context if user is already logged in
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        await this.setUserContext(currentUser);
      }

      apiLogger.log('INFO', 'User context service initialized');
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to initialize user context service', { error: error.message });
    }
  }

  /**
   * Set user context
   */
  async setUserContext(user) {
    try {
      this.currentContext = {
        userId: user.id,
        userRole: user.role,
        permissions: authService.getUserPermissions(),
        preferences: user.preferences || {},
        createdAt: Date.now()
      };

      // Load or create default workspace
      await this.loadDefaultWorkspace();

      // Notify listeners
      this.notifyContextListeners('context_set', this.currentContext);

      apiLogger.log('INFO', 'User context set', {
        userId: user.id,
        role: user.role,
        workspaceId: this.activeWorkspace?.id
      });
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to set user context', { error: error.message });
      throw error;
    }
  }

  /**
   * Clear user context
   */
  clearContext() {
    this.currentContext = null;
    this.activeWorkspace = null;
    this.dataCache.clear();

    this.notifyContextListeners('context_cleared', null);

    apiLogger.log('INFO', 'User context cleared');
  }

  /**
   * Get current user context
   */
  getCurrentContext() {
    return this.currentContext;
  }

  /**
   * Generate user-specific storage key
   */
  getUserKey(type, identifier) {
    if (!this.currentContext) {
      throw new Error('No user context available');
    }

    return `${CONTEXT_CONFIG.userPrefix}${this.currentContext.userId}_${type}_${identifier}`;
  }

  /**
   * Generate shared storage key
   */
  getSharedKey(type, identifier, sharingLevel = SHARING_LEVELS.TEAM) {
    return `${CONTEXT_CONFIG.sharedPrefix}${sharingLevel}_${type}_${identifier}`;
  }

  /**
   * Generate workspace storage key
   */
  getWorkspaceKey(type, identifier, workspaceId = null) {
    const wsId = workspaceId || this.activeWorkspace?.id;
    if (!wsId) {
      throw new Error('No workspace context available');
    }

    return `${CONTEXT_CONFIG.workspacePrefix}${wsId}_${type}_${identifier}`;
  }

  /**
   * Store user-specific data
   */
  async storeUserData(type, identifier, data, options = {}) {
    try {
      if (!this.currentContext) {
        throw new Error('No user context available');
      }

      const key = this.getUserKey(type, identifier);

      // Add user context metadata
      const contextualData = {
        ...data,
        _context: {
          userId: this.currentContext.userId,
          userRole: this.currentContext.userRole,
          workspaceId: this.activeWorkspace?.id,
          createdAt: Date.now(),
          lastModified: Date.now(),
          version: '1.0'
        }
      };

      // Encrypt if needed
      if (options.encrypt || this.shouldEncryptData(data)) {
        const encrypted = await encryptionService.encryptSensitiveFields(contextualData);
        await storageService.setItem(type, key, encrypted, options);
      } else {
        await storageService.setItem(type, key, contextualData, options);
      }

      // Update cache
      this.dataCache.set(key, contextualData);

      apiLogger.log('DEBUG', 'User data stored', {
        userId: this.currentContext.userId,
        type,
        identifier,
        encrypted: options.encrypt
      });

      return true;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to store user data', {
        type,
        identifier,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Retrieve user-specific data
   */
  async getUserData(type, identifier, options = {}) {
    try {
      if (!this.currentContext) {
        throw new Error('No user context available');
      }

      const key = this.getUserKey(type, identifier);

      // Check cache first
      if (this.dataCache.has(key) && !options.skipCache) {
        return this.dataCache.get(key);
      }

      const storedData = await storageService.getItem(type, key);

      if (!storedData) {
        return null;
      }

      // Decrypt if needed
      let data = storedData;
      if (storedData.encrypted) {
        data = await encryptionService.decryptSensitiveFields(storedData);
      }

      // Verify user ownership
      if (data._context && data._context.userId !== this.currentContext.userId) {
        apiLogger.log('WARN', 'Data access denied - user mismatch', {
          requestedBy: this.currentContext.userId,
          dataOwner: data._context.userId,
          type,
          identifier
        });
        return null;
      }

      // Update cache
      this.dataCache.set(key, data);

      return data;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to retrieve user data', {
        type,
        identifier,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Store shared data
   */
  async storeSharedData(type, identifier, data, sharingLevel = SHARING_LEVELS.TEAM, options = {}) {
    try {
      if (!this.currentContext) {
        throw new Error('No user context available');
      }

      // Check permissions for sharing
      if (!this.canShare(sharingLevel)) {
        throw new Error('Insufficient permissions for sharing level');
      }

      const key = this.getSharedKey(type, identifier, sharingLevel);

      const sharedData = {
        ...data,
        _sharing: {
          level: sharingLevel,
          createdBy: this.currentContext.userId,
          createdAt: Date.now(),
          lastModified: Date.now(),
          accessLog: []
        }
      };

      await storageService.setItem(type, key, sharedData, options);

      apiLogger.log('INFO', 'Shared data stored', {
        userId: this.currentContext.userId,
        type,
        identifier,
        sharingLevel
      });

      return true;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to store shared data', {
        type,
        identifier,
        sharingLevel,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Retrieve shared data
   */
  async getSharedData(type, identifier, sharingLevel = SHARING_LEVELS.TEAM) {
    try {
      if (!this.currentContext) {
        throw new Error('No user context available');
      }

      // Check permissions for accessing shared data
      if (!this.canAccessShared(sharingLevel)) {
        throw new Error('Insufficient permissions for shared data access');
      }

      const key = this.getSharedKey(type, identifier, sharingLevel);
      const data = await storageService.getItem(type, key);

      if (data && data._sharing) {
        // Log access
        data._sharing.accessLog.push({
          userId: this.currentContext.userId,
          timestamp: Date.now(),
          action: 'read'
        });

        // Update access log (limit to last 100 entries)
        if (data._sharing.accessLog.length > 100) {
          data._sharing.accessLog = data._sharing.accessLog.slice(-100);
        }

        await storageService.setItem(type, key, data);
      }

      return data;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to retrieve shared data', {
        type,
        identifier,
        sharingLevel,
        error: error.message
      });
      return null;
    }
  }

  /**
   * List user's data items
   */
  async listUserData(type) {
    try {
      if (!this.currentContext) {
        throw new Error('No user context available');
      }

      const allItems = storageService.listItems(type);
      const userPrefix = `${CONTEXT_CONFIG.userPrefix}${this.currentContext.userId}_${type}_`;

      return allItems
        .filter(key => key.startsWith(userPrefix))
        .map(key => key.replace(userPrefix, ''));
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to list user data', { type, error: error.message });
      return [];
    }
  }

  /**
   * List shared data items
   */
  async listSharedData(type, sharingLevel = SHARING_LEVELS.TEAM) {
    try {
      if (!this.canAccessShared(sharingLevel)) {
        return [];
      }

      const allItems = storageService.listItems(type);
      const sharedPrefix = `${CONTEXT_CONFIG.sharedPrefix}${sharingLevel}_${type}_`;

      return allItems
        .filter(key => key.startsWith(sharedPrefix))
        .map(key => key.replace(sharedPrefix, ''));
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to list shared data', { type, sharingLevel, error: error.message });
      return [];
    }
  }

  /**
   * Create or load workspace
   */
  async loadDefaultWorkspace() {
    try {
      if (!this.currentContext) {
        throw new Error('No user context available');
      }

      const workspaceId = `personal_${this.currentContext.userId}`;
      let workspace = await this.getWorkspace(workspaceId);

      if (!workspace) {
        workspace = await this.createWorkspace({
          id: workspaceId,
          name: 'Personal Workspace',
          type: WORKSPACE_TYPES.PERSONAL,
          description: 'Your personal financial analysis workspace',
          members: [this.currentContext.userId],
          settings: {
            defaultCurrency: 'USD',
            theme: 'light',
            autoSave: true
          }
        });
      }

      this.activeWorkspace = workspace;
      return workspace;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to load default workspace', { error: error.message });
      throw error;
    }
  }

  /**
   * Create new workspace
   */
  async createWorkspace(workspaceData) {
    try {
      const workspace = {
        ...workspaceData,
        createdBy: this.currentContext.userId,
        createdAt: Date.now(),
        lastModified: Date.now(),
        version: '1.0'
      };

      await storageService.setItem('workspace', workspace.id, workspace);

      apiLogger.log('INFO', 'Workspace created', {
        workspaceId: workspace.id,
        type: workspace.type,
        createdBy: this.currentContext.userId
      });

      return workspace;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to create workspace', { error: error.message });
      throw error;
    }
  }

  /**
   * Get workspace
   */
  async getWorkspace(workspaceId) {
    try {
      return await storageService.getItem('workspace', workspaceId);
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to get workspace', { workspaceId, error: error.message });
      return null;
    }
  }

  /**
   * Check if user can share at specified level
   */
  canShare(sharingLevel) {
    if (!this.currentContext) return false;

    const permissions = this.currentContext.permissions;

    switch (sharingLevel) {
      case SHARING_LEVELS.PUBLIC:
        return permissions.includes('SYSTEM_CONFIG');
      case SHARING_LEVELS.ORGANIZATION:
        return permissions.includes('MANAGE_USERS');
      case SHARING_LEVELS.TEAM:
        return permissions.includes('WRITE_MODELS');
      case SHARING_LEVELS.PRIVATE:
        return true;
      default:
        return false;
    }
  }

  /**
   * Check if user can access shared data
   */
  canAccessShared(sharingLevel) {
    if (!this.currentContext) return false;

    const permissions = this.currentContext.permissions;

    switch (sharingLevel) {
      case SHARING_LEVELS.PUBLIC:
        return true;
      case SHARING_LEVELS.ORGANIZATION:
        return permissions.includes('VIEW_USERS');
      case SHARING_LEVELS.TEAM:
        return permissions.includes('READ_MODELS');
      case SHARING_LEVELS.PRIVATE:
        return false; // Private data can't be accessed by others
      default:
        return false;
    }
  }

  /**
   * Determine if data should be encrypted
   */
  shouldEncryptData(data) {
    // Encrypt based on data sensitivity and user role
    const classification = encryptionService.classifyData(data, this.currentContext);
    return encryptionService.shouldEncrypt(data, classification);
  }

  /**
   * Add context listener
   */
  addContextListener(callback) {
    this.contextListeners.add(callback);

    return () => {
      this.contextListeners.delete(callback);
    };
  }

  /**
   * Notify context listeners
   */
  notifyContextListeners(event, data) {
    this.contextListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        apiLogger.log('ERROR', 'Context listener error', { error: error.message });
      }
    });
  }

  /**
   * Get context statistics
   */
  async getContextStats() {
    if (!this.currentContext) {
      return null;
    }

    try {
      const stats = {
        userId: this.currentContext.userId,
        userRole: this.currentContext.userRole,
        workspaceId: this.activeWorkspace?.id,
        dataItems: {},
        sharedItems: {},
        cacheSize: this.dataCache.size
      };

      // Count user data items by type
      const allItems = await storageService.getStorageStats();
      const userPrefix = `${CONTEXT_CONFIG.userPrefix}${this.currentContext.userId}_`;

      for (const [type, count] of Object.entries(allItems.typeStats)) {
        if (type.startsWith(userPrefix)) {
          const dataType = type.replace(userPrefix, '').split('_')[0];
          stats.dataItems[dataType] = (stats.dataItems[dataType] || 0) + count;
        }
      }

      return stats;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to get context stats', { error: error.message });
      return null;
    }
  }
}

// Export singleton instance and constants
export const userContextService = new UserContextService();
export { SHARING_LEVELS, WORKSPACE_TYPES, CONTEXT_CONFIG };
export default userContextService;
