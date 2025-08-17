/**
 * Persistence Manager - Central data persistence orchestrator
 * Manages multiple storage layers and provides unified API for data persistence
 */

import { DataMigrationService } from './DataMigrationService';
import { IndexedDBService } from './IndexedDBService';
import { LocalStorageService } from './LocalStorageService';
import { SessionManager } from './SessionManager';

export class PersistenceManager {
  constructor() {
    this.localStorage = new LocalStorageService();
    this.indexedDB = new IndexedDBService();
    this.sessionManager = new SessionManager();
    this.migrationService = new DataMigrationService();

    this.isInitialized = false;
    this.storageQuota = null;
    this.listeners = new Map();

    // Storage strategy configuration
    this.storageStrategy = {
      // Small, frequently accessed data -> localStorage
      localStorage: [
        'user_preferences',
        'session_data',
        'ui_state',
        'recent_commands',
        'quick_settings'
      ],
      // Large, complex data -> IndexedDB
      indexedDB: [
        'watchlists',
        'analysis_history',
        'command_history',
        'alerts',
        'cached_data',
        'user_models',
        'export_data'
      ]
    };
  }

  /**
   * Initialize the persistence manager
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Check storage availability
      await this.checkStorageAvailability();

      // Initialize storage services
      await Promise.all([
        this.localStorage.initialize(),
        this.indexedDB.initialize(),
        this.sessionManager.initialize()
      ]);

      // Check for data migrations
      await this.migrationService.checkAndMigrate();

      // Estimate storage quota
      await this.estimateStorageQuota();

      this.isInitialized = true;
      console.log('✅ Persistence Manager initialized successfully');

      return {
        success: true,
        storageQuota: this.storageQuota,
        availableStorage: await this.getAvailableStorage()
      };

    } catch (error) {
      console.error('❌ Failed to initialize Persistence Manager:', error);
      throw new Error(`Persistence initialization failed: ${error.message}`);
    }
  }

  /**
   * Store data using appropriate storage layer
   */
  async store(key, data, options = {}) {
    await this.ensureInitialized();

    const {
      storage = this.determineStorageLayer(key),
      encrypt = false,
      compress = false,
      ttl = null
    } = options;

    try {
      const metadata = {
        timestamp: Date.now(),
        version: '1.0',
        encrypted: encrypt,
        compressed: compress,
        ttl,
        size: JSON.stringify(data).length
      };

      let result;

      if (storage === 'localStorage') {
        result = await this.localStorage.store(key, data, { encrypt, ttl });
      } else if (storage === 'indexedDB') {
        result = await this.indexedDB.store(key, data, { metadata, compress });
      } else {
        throw new Error(`Unknown storage layer: ${storage}`);
      }

      // Notify listeners
      this.notifyListeners('store', { key, storage, metadata });

      return result;

    } catch (error) {
      console.error(`Failed to store data for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Retrieve data from appropriate storage layer
   */
  async retrieve(key, options = {}) {
    await this.ensureInitialized();

    const {
      storage = this.determineStorageLayer(key),
      decrypt = false
    } = options;

    try {
      let result;

      if (storage === 'localStorage') {
        result = await this.localStorage.retrieve(key, { decrypt });
      } else if (storage === 'indexedDB') {
        result = await this.indexedDB.retrieve(key);
      } else {
        // Try both storage layers
        result = await this.localStorage.retrieve(key, { decrypt }) ||
                 await this.indexedDB.retrieve(key);
      }

      // Check TTL if applicable
      if (result && result.metadata && result.metadata.ttl) {
        const now = Date.now();
        const expiry = result.metadata.timestamp + result.metadata.ttl;

        if (now > expiry) {
          await this.remove(key, { storage });
          return null;
        }
      }

      return result ? result.data || result : null;

    } catch (error) {
      console.error(`Failed to retrieve data for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Remove data from storage
   */
  async remove(key, options = {}) {
    await this.ensureInitialized();

    const { storage = 'both' } = options;

    try {
      const promises = [];

      if (storage === 'localStorage' || storage === 'both') {
        promises.push(this.localStorage.remove(key));
      }

      if (storage === 'indexedDB' || storage === 'both') {
        promises.push(this.indexedDB.remove(key));
      }

      await Promise.all(promises);

      // Notify listeners
      this.notifyListeners('remove', { key, storage });

      return true;

    } catch (error) {
      console.error(`Failed to remove data for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Clear all data from storage
   */
  async clear(options = {}) {
    await this.ensureInitialized();

    const { storage = 'both', confirm = false } = options;

    if (!confirm) {
      throw new Error('Clear operation requires explicit confirmation');
    }

    try {
      const promises = [];

      if (storage === 'localStorage' || storage === 'both') {
        promises.push(this.localStorage.clear());
      }

      if (storage === 'indexedDB' || storage === 'both') {
        promises.push(this.indexedDB.clear());
      }

      await Promise.all(promises);

      // Notify listeners
      this.notifyListeners('clear', { storage });

      return true;

    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    await this.ensureInitialized();

    try {
      const [localStorageStats, indexedDBStats] = await Promise.all([
        this.localStorage.getStats(),
        this.indexedDB.getStats()
      ]);

      const totalUsed = localStorageStats.used + indexedDBStats.used;
      const totalAvailable = await this.getAvailableStorage();

      return {
        localStorage: localStorageStats,
        indexedDB: indexedDBStats,
        total: {
          used: totalUsed,
          available: totalAvailable,
          quota: this.storageQuota,
          usagePercentage: this.storageQuota ? (totalUsed / this.storageQuota) * 100 : 0
        }
      };

    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }
  }

  /**
   * Export all user data
   */
  async exportData(options = {}) {
    await this.ensureInitialized();

    const {
      format = 'json',
      includeMetadata = true,
      _compress = false
    } = options;

    try {
      const [localStorageData, indexedDBData] = await Promise.all([
        this.localStorage.exportAll(),
        this.indexedDB.exportAll()
      ]);

      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        localStorage: localStorageData,
        indexedDB: indexedDBData
      };

      if (includeMetadata) {
        exportData.metadata = {
          userAgent: navigator.userAgent,
          storageStats: await this.getStorageStats(),
          exportOptions: options
        };
      }

      return {
        data: exportData,
        size: JSON.stringify(exportData).length,
        format
      };

    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  /**
   * Import user data
   */
  async importData(importData, options = {}) {
    await this.ensureInitialized();

    const {
      overwrite = false,
      validate = true,
      backup = true
    } = options;

    try {
      // Validate import data
      if (validate && !this.validateImportData(importData)) {
        throw new Error('Invalid import data format');
      }

      // Create backup if requested
      if (backup) {
        const backupData = await this.exportData();
        await this.store('backup_before_import', backupData, {
          storage: 'indexedDB',
          ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      // Import localStorage data
      if (importData.localStorage) {
        await this.localStorage.importData(importData.localStorage, { overwrite });
      }

      // Import IndexedDB data
      if (importData.indexedDB) {
        await this.indexedDB.importData(importData.indexedDB, { overwrite });
      }

      // Notify listeners
      this.notifyListeners('import', { size: JSON.stringify(importData).length });

      return {
        success: true,
        imported: {
          localStorage: Object.keys(importData.localStorage || {}).length,
          indexedDB: Object.keys(importData.indexedDB || {}).length
        }
      };

    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }

  /**
   * Add event listener for storage events
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  // Private methods

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  determineStorageLayer(key) {
    if (this.storageStrategy.localStorage.includes(key)) {
      return 'localStorage';
    }
    if (this.storageStrategy.indexedDB.includes(key)) {
      return 'indexedDB';
    }
    // Default to localStorage for small data
    return 'localStorage';
  }

  async checkStorageAvailability() {
    // Check localStorage
    if (!window.localStorage) {
      throw new Error('localStorage is not available');
    }

    // Check IndexedDB
    if (!window.indexedDB) {
      throw new Error('IndexedDB is not available');
    }

    return true;
  }

  async estimateStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      this.storageQuota = estimate.quota;
      return estimate;
    }
    return null;
  }

  async getAvailableStorage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.quota - estimate.usage;
    }
    return null;
  }

  validateImportData(data) {
    return data &&
           typeof data === 'object' &&
           data.version &&
           (data.localStorage || data.indexedDB);
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in storage event listener:', error);
        }
      });
    }
  }
}

// Export singleton instance
export const persistenceManager = new PersistenceManager();
