/**
 * IndexedDB Service
 * Manages IndexedDB operations for complex data storage with versioning and transactions
 */

import { CompressionUtils } from '../utils/CompressionUtils';

export class IndexedDBService {
  constructor() {
    this.dbName = 'FinanceAnalystPro';
    this.dbVersion = 1;
    this.db = null;
    this.isAvailable = false;
    this.compressionUtils = new CompressionUtils();
    
    // Define object stores
    this.stores = {
      watchlists: {
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'name', keyPath: 'name', unique: true },
          { name: 'created', keyPath: 'created' },
          { name: 'lastUpdated', keyPath: 'lastUpdated' }
        ]
      },
      analysis_history: {
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'ticker', keyPath: 'ticker' },
          { name: 'analysisType', keyPath: 'analysisType' },
          { name: 'timestamp', keyPath: 'timestamp' }
        ]
      },
      command_history: {
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'command', keyPath: 'command' },
          { name: 'timestamp', keyPath: 'timestamp' },
          { name: 'success', keyPath: 'success' }
        ]
      },
      alerts: {
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'ticker', keyPath: 'ticker' },
          { name: 'condition', keyPath: 'condition' },
          { name: 'created', keyPath: 'created' },
          { name: 'triggered', keyPath: 'triggered' }
        ]
      },
      cached_data: {
        keyPath: 'key',
        indexes: [
          { name: 'timestamp', keyPath: 'timestamp' },
          { name: 'expiry', keyPath: 'expiry' },
          { name: 'dataType', keyPath: 'dataType' }
        ]
      },
      user_models: {
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'name', keyPath: 'name' },
          { name: 'type', keyPath: 'type' },
          { name: 'created', keyPath: 'created' }
        ]
      },
      export_data: {
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'timestamp', keyPath: 'timestamp' },
          { name: 'type', keyPath: 'type' }
        ]
      }
    };
  }

  /**
   * Initialize IndexedDB service
   */
  async initialize() {
    if (!window.indexedDB) {
      console.warn('⚠️ IndexedDB not available');
      this.isAvailable = false;
      return { success: false, available: false };
    }

    try {
      this.db = await this.openDatabase();
      this.isAvailable = true;
      console.log('✅ IndexedDB service initialized');
      
      // Cleanup expired data
      await this.cleanupExpiredData();
      
      return { success: true, available: true, version: this.dbVersion };
    } catch (error) {
      console.error('❌ Failed to initialize IndexedDB:', error);
      this.isAvailable = false;
      return { success: false, available: false, error: error.message };
    }
  }

  /**
   * Open IndexedDB database
   */
  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error}`));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        this.createObjectStores(db);
      };
    });
  }

  /**
   * Create object stores during database upgrade
   */
  createObjectStores(db) {
    // Remove existing stores if they exist
    for (const storeName of Object.keys(this.stores)) {
      if (db.objectStoreNames.contains(storeName)) {
        db.deleteObjectStore(storeName);
      }
    }

    // Create new stores
    for (const [storeName, config] of Object.entries(this.stores)) {
      const store = db.createObjectStore(storeName, {
        keyPath: config.keyPath,
        autoIncrement: config.autoIncrement
      });

      // Create indexes
      if (config.indexes) {
        config.indexes.forEach(index => {
          store.createIndex(index.name, index.keyPath, { unique: index.unique || false });
        });
      }
    }

    console.log('✅ IndexedDB object stores created');
  }

  /**
   * Store data in IndexedDB
   */
  async store(key, data, options = {}) {
    if (!this.isAvailable) {
      throw new Error('IndexedDB is not available');
    }

    const {
      storeName = 'cached_data',
      metadata = {},
      compress = false
    } = options;

    try {
      // Prepare data object
      const dataObject = {
        key,
        data,
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          compressed: compress,
          originalSize: JSON.stringify(data).length
        }
      };

      // Compress if requested
      if (compress) {
        const compressed = await this.compressionUtils.compress(JSON.stringify(data));
        dataObject.data = compressed;
        dataObject.metadata.compressedSize = compressed.length;
      }

      // Store in IndexedDB
      const result = await this.performTransaction(storeName, 'readwrite', (store) => {
        return store.put(dataObject);
      });

      return {
        success: true,
        key: result,
        storeName,
        size: JSON.stringify(dataObject).length,
        metadata: dataObject.metadata
      };

    } catch (error) {
      console.error(`Failed to store data in IndexedDB for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Retrieve data from IndexedDB
   */
  async retrieve(key, options = {}) {
    if (!this.isAvailable) {
      return null;
    }

    const { storeName = 'cached_data' } = options;

    try {
      const result = await this.performTransaction(storeName, 'readonly', (store) => {
        return store.get(key);
      });

      if (!result) {
        return null;
      }

      // Check expiry if applicable
      if (result.metadata && result.metadata.expiry && Date.now() > result.metadata.expiry) {
        await this.remove(key, { storeName });
        return null;
      }

      // Decompress if needed
      let data = result.data;
      if (result.metadata && result.metadata.compressed) {
        data = JSON.parse(await this.compressionUtils.decompress(data));
      }

      return {
        data,
        metadata: result.metadata,
        timestamp: result.timestamp
      };

    } catch (error) {
      console.error(`Failed to retrieve data from IndexedDB for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Remove data from IndexedDB
   */
  async remove(key, options = {}) {
    if (!this.isAvailable) {
      return false;
    }

    const { storeName = 'cached_data' } = options;

    try {
      await this.performTransaction(storeName, 'readwrite', (store) => {
        return store.delete(key);
      });

      return true;
    } catch (error) {
      console.error(`Failed to remove data from IndexedDB for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all data from a store
   */
  async clear(storeName = null) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      if (storeName) {
        // Clear specific store
        await this.performTransaction(storeName, 'readwrite', (store) => {
          return store.clear();
        });
      } else {
        // Clear all stores
        for (const store of Object.keys(this.stores)) {
          await this.performTransaction(store, 'readwrite', (storeObj) => {
            return storeObj.clear();
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
      return false;
    }
  }

  /**
   * Get all keys from a store
   */
  async getKeys(storeName = 'cached_data') {
    if (!this.isAvailable) {
      return [];
    }

    try {
      return await this.performTransaction(storeName, 'readonly', (store) => {
        return store.getAllKeys();
      });
    } catch (error) {
      console.error(`Failed to get keys from IndexedDB store "${storeName}":`, error);
      return [];
    }
  }

  /**
   * Get all data from a store
   */
  async getAll(storeName = 'cached_data', options = {}) {
    if (!this.isAvailable) {
      return [];
    }

    const { limit = null, filter = null } = options;

    try {
      const results = await this.performTransaction(storeName, 'readonly', (store) => {
        return store.getAll();
      });

      let filteredResults = results;

      // Apply filter if provided
      if (filter) {
        filteredResults = results.filter(filter);
      }

      // Apply limit if provided
      if (limit) {
        filteredResults = filteredResults.slice(0, limit);
      }

      return filteredResults;
    } catch (error) {
      console.error(`Failed to get all data from IndexedDB store "${storeName}":`, error);
      return [];
    }
  }

  /**
   * Query data using an index
   */
  async query(storeName, indexName, value, options = {}) {
    if (!this.isAvailable) {
      return [];
    }

    const { limit = null } = options;

    try {
      return await this.performTransaction(storeName, 'readonly', (store) => {
        const index = store.index(indexName);
        const request = limit ? index.getAll(value, limit) : index.getAll(value);
        return request;
      });
    } catch (error) {
      console.error(`Failed to query IndexedDB store "${storeName}" with index "${indexName}":`, error);
      return [];
    }
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    if (!this.isAvailable) {
      return { available: false, stores: {}, total: { records: 0, size: 0 } };
    }

    try {
      const stats = {
        available: true,
        stores: {},
        total: { records: 0, size: 0 }
      };

      for (const storeName of Object.keys(this.stores)) {
        const records = await this.getAll(storeName);
        const recordCount = records.length;
        const storeSize = records.reduce((size, record) => {
          return size + JSON.stringify(record).length;
        }, 0);

        stats.stores[storeName] = {
          records: recordCount,
          size: storeSize
        };

        stats.total.records += recordCount;
        stats.total.size += storeSize;
      }

      return stats;
    } catch (error) {
      console.error('Failed to get IndexedDB stats:', error);
      return { available: false, error: error.message };
    }
  }

  /**
   * Export all data from IndexedDB
   */
  async exportAll() {
    if (!this.isAvailable) {
      return {};
    }

    try {
      const exportData = {};

      for (const storeName of Object.keys(this.stores)) {
        exportData[storeName] = await this.getAll(storeName);
      }

      return exportData;
    } catch (error) {
      console.error('Failed to export IndexedDB data:', error);
      return {};
    }
  }

  /**
   * Import data into IndexedDB
   */
  async importData(importData, options = {}) {
    if (!this.isAvailable) {
      throw new Error('IndexedDB is not available');
    }

    const { overwrite = false } = options;

    try {
      const results = {
        imported: 0,
        skipped: 0,
        errors: 0
      };

      for (const [storeName, records] of Object.entries(importData)) {
        if (!this.stores[storeName]) {
          console.warn(`Unknown store: ${storeName}`);
          continue;
        }

        for (const record of records) {
          try {
            if (!overwrite) {
              // Check if record exists
              const existing = await this.retrieve(record.key || record.id, { storeName });
              if (existing) {
                results.skipped++;
                continue;
              }
            }

            await this.performTransaction(storeName, 'readwrite', (store) => {
              return store.put(record);
            });

            results.imported++;
          } catch (error) {
            console.error(`Failed to import record to store "${storeName}":`, error);
            results.errors++;
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to import IndexedDB data:', error);
      throw error;
    }
  }

  /**
   * Cleanup expired data
   */
  async cleanupExpiredData() {
    if (!this.isAvailable) {
      return { cleaned: 0 };
    }

    try {
      let cleaned = 0;
      const now = Date.now();

      // Cleanup cached_data store
      const cachedData = await this.getAll('cached_data');
      for (const record of cachedData) {
        if (record.metadata && record.metadata.expiry && now > record.metadata.expiry) {
          await this.remove(record.key, { storeName: 'cached_data' });
          cleaned++;
        }
      }

      return { cleaned };
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
      return { cleaned: 0, error: error.message };
    }
  }

  /**
   * Perform IndexedDB transaction
   */
  async performTransaction(storeName, mode, operation) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);

      transaction.onerror = () => {
        reject(new Error(`Transaction failed: ${transaction.error}`));
      };

      transaction.oncomplete = () => {
        // Transaction completed successfully
      };

      const request = operation(store);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(`Operation failed: ${request.error}`));
      };
    });
  }

  /**
   * Check if IndexedDB is available
   */
  isStorageAvailable() {
    return this.isAvailable;
  }

  /**
   * Get database info
   */
  getInfo() {
    return {
      dbName: this.dbName,
      dbVersion: this.dbVersion,
      available: this.isAvailable,
      stores: Object.keys(this.stores),
      storeCount: Object.keys(this.stores).length
    };
  }
}
