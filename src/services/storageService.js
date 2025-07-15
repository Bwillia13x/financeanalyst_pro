/**
 * Enhanced Local Storage Service for Finance Analyst Pro
 * Provides comprehensive data persistence with compression, encryption, and versioning
 */

import { apiLogger } from '../utils/apiLogger.js';

// Storage configuration
const STORAGE_CONFIG = {
  version: '1.0.0',
  prefix: 'financeanalyst_',
  compression: {
    enabled: true,
    threshold: 1024 // Compress data larger than 1KB
  },
  encryption: {
    enabled: false, // Will be enabled when auth is implemented
    algorithm: 'AES-GCM'
  },
  quotaManagement: {
    maxSize: 50 * 1024 * 1024, // 50MB limit
    cleanupThreshold: 0.8 // Clean up when 80% full
  }
};

// Data schemas for validation
const DATA_SCHEMAS = {
  dcfModel: {
    version: '1.0',
    required: ['symbol', 'assumptions', 'projections', 'valuation'],
    structure: {
      symbol: 'string',
      assumptions: 'object',
      projections: 'object',
      valuation: 'object',
      metadata: 'object'
    }
  },
  lboModel: {
    version: '1.0',
    required: ['symbol', 'transaction', 'financing', 'returns'],
    structure: {
      symbol: 'string',
      transaction: 'object',
      financing: 'object',
      returns: 'object',
      metadata: 'object'
    }
  },
  monteCarloResults: {
    version: '1.0',
    required: ['modelType', 'iterations', 'results', 'statistics'],
    structure: {
      modelType: 'string',
      iterations: 'number',
      results: 'array',
      statistics: 'object',
      metadata: 'object'
    }
  },
  userPreferences: {
    version: '1.0',
    required: ['theme', 'layout'],
    structure: {
      theme: 'string',
      layout: 'object',
      notifications: 'object',
      privacy: 'object'
    }
  },
  marketData: {
    version: '1.0',
    required: ['symbol', 'data', 'timestamp'],
    structure: {
      symbol: 'string',
      data: 'object',
      timestamp: 'number',
      source: 'string'
    }
  }
};

/**
 * Enhanced Storage Service Class
 */
class StorageService {
  constructor() {
    this.isAvailable = this.checkStorageAvailability();
    this.compressionWorker = null;
    this.initializeCompression();
    this.setupQuotaMonitoring();
  }

  /**
   * Check if localStorage is available
   */
  checkStorageAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      apiLogger.log('ERROR', 'localStorage not available', { error: e.message });
      return false;
    }
  }

  /**
   * Initialize compression capabilities
   */
  initializeCompression() {
    if (STORAGE_CONFIG.compression.enabled && 'CompressionStream' in window) {
      // Modern browsers with compression support
      this.compressionAvailable = true;
    } else {
      // Fallback to simple JSON stringification
      this.compressionAvailable = false;
    }
  }

  /**
   * Setup quota monitoring
   */
  setupQuotaMonitoring() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      this.monitorQuota();
    }
  }

  /**
   * Monitor storage quota usage
   */
  async monitorQuota() {
    try {
      const estimate = await navigator.storage.estimate();
      const usageRatio = estimate.usage / estimate.quota;
      
      if (usageRatio > STORAGE_CONFIG.quotaManagement.cleanupThreshold) {
        apiLogger.log('WARN', 'Storage quota threshold exceeded', {
          usage: estimate.usage,
          quota: estimate.quota,
          ratio: usageRatio
        });
        await this.performCleanup();
      }
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to monitor storage quota', { error: error.message });
    }
  }

  /**
   * Generate storage key with prefix
   */
  generateKey(type, identifier) {
    return `${STORAGE_CONFIG.prefix}${type}_${identifier}`;
  }

  /**
   * Validate data against schema
   */
  validateData(data, schemaType) {
    const schema = DATA_SCHEMAS[schemaType];
    if (!schema) {
      throw new Error(`Unknown schema type: ${schemaType}`);
    }

    // Check required fields
    for (const field of schema.required) {
      if (!(field in data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate data types
    for (const [field, expectedType] of Object.entries(schema.structure)) {
      if (field in data) {
        const actualType = Array.isArray(data[field]) ? 'array' : typeof data[field];
        if (actualType !== expectedType) {
          throw new Error(`Invalid type for ${field}: expected ${expectedType}, got ${actualType}`);
        }
      }
    }

    return true;
  }

  /**
   * Compress data if enabled and beneficial
   */
  async compressData(data) {
    const jsonString = JSON.stringify(data);
    
    if (!STORAGE_CONFIG.compression.enabled || 
        jsonString.length < STORAGE_CONFIG.compression.threshold ||
        !this.compressionAvailable) {
      return { data: jsonString, compressed: false };
    }

    try {
      // Simple compression using built-in methods
      const compressed = await this.simpleCompress(jsonString);
      return { data: compressed, compressed: true };
    } catch (error) {
      apiLogger.log('WARN', 'Compression failed, storing uncompressed', { error: error.message });
      return { data: jsonString, compressed: false };
    }
  }

  /**
   * Simple compression implementation
   */
  async simpleCompress(data) {
    // For now, use a simple encoding - can be enhanced with actual compression
    return btoa(encodeURIComponent(data));
  }

  /**
   * Decompress data
   */
  async decompressData(compressedData, isCompressed) {
    if (!isCompressed) {
      return compressedData;
    }

    try {
      return decodeURIComponent(atob(compressedData));
    } catch (error) {
      apiLogger.log('ERROR', 'Decompression failed', { error: error.message });
      throw new Error('Failed to decompress data');
    }
  }

  /**
   * Store data with metadata
   */
  async setItem(type, identifier, data, options = {}) {
    if (!this.isAvailable) {
      throw new Error('Storage not available');
    }

    try {
      // Validate data if schema exists
      if (DATA_SCHEMAS[type]) {
        this.validateData(data, type);
      }

      // Prepare storage object
      const storageObject = {
        version: STORAGE_CONFIG.version,
        schemaVersion: DATA_SCHEMAS[type]?.version || '1.0',
        timestamp: Date.now(),
        data,
        metadata: {
          type,
          identifier,
          size: JSON.stringify(data).length,
          ...options.metadata
        }
      };

      // Compress if needed
      const { data: processedData, compressed } = await this.compressData(storageObject);
      
      // Add compression flag
      const finalObject = {
        compressed,
        data: processedData
      };

      const key = this.generateKey(type, identifier);
      localStorage.setItem(key, JSON.stringify(finalObject));

      apiLogger.log('DEBUG', 'Data stored successfully', {
        key,
        type,
        identifier,
        compressed,
        size: processedData.length
      });

      return true;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to store data', {
        type,
        identifier,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Retrieve data with decompression
   */
  async getItem(type, identifier) {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const key = this.generateKey(type, identifier);
      const stored = localStorage.getItem(key);
      
      if (!stored) {
        return null;
      }

      const parsedStored = JSON.parse(stored);
      const decompressedData = await this.decompressData(
        parsedStored.data, 
        parsedStored.compressed
      );
      
      const storageObject = JSON.parse(decompressedData);

      // Check version compatibility
      if (storageObject.version !== STORAGE_CONFIG.version) {
        apiLogger.log('WARN', 'Version mismatch detected', {
          stored: storageObject.version,
          current: STORAGE_CONFIG.version
        });
        // Could trigger migration here
      }

      apiLogger.log('DEBUG', 'Data retrieved successfully', {
        key,
        type,
        identifier,
        age: Date.now() - storageObject.timestamp
      });

      return storageObject.data;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to retrieve data', {
        type,
        identifier,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Remove specific item
   */
  removeItem(type, identifier) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const key = this.generateKey(type, identifier);
      localStorage.removeItem(key);
      
      apiLogger.log('DEBUG', 'Data removed successfully', { key, type, identifier });
      return true;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to remove data', {
        type,
        identifier,
        error: error.message
      });
      return false;
    }
  }

  /**
   * List all items of a specific type
   */
  listItems(type) {
    if (!this.isAvailable) {
      return [];
    }

    const prefix = this.generateKey(type, '');
    const items = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const identifier = key.replace(prefix, '');
        items.push(identifier);
      }
    }

    return items;
  }

  /**
   * Perform cleanup of old data
   */
  async performCleanup() {
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    let cleanedCount = 0;

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_CONFIG.prefix)) {
        try {
          const stored = localStorage.getItem(key);
          const parsedStored = JSON.parse(stored);
          const decompressedData = await this.decompressData(
            parsedStored.data, 
            parsedStored.compressed
          );
          const storageObject = JSON.parse(decompressedData);

          if (storageObject.timestamp < cutoffTime) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (error) {
          // Remove corrupted data
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    }

    apiLogger.log('INFO', 'Storage cleanup completed', { cleanedCount });
    return cleanedCount;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    let totalSize = 0;
    let itemCount = 0;
    const typeStats = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_CONFIG.prefix)) {
        const value = localStorage.getItem(key);
        totalSize += value.length;
        itemCount++;

        // Extract type from key
        const type = key.split('_')[1];
        if (type) {
          typeStats[type] = (typeStats[type] || 0) + 1;
        }
      }
    }

    const quota = await this.getQuotaInfo();

    return {
      totalSize,
      itemCount,
      typeStats,
      quota,
      usageRatio: quota ? totalSize / quota.quota : 0
    };
  }

  /**
   * Get quota information
   */
  async getQuotaInfo() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        return await navigator.storage.estimate();
      } catch (error) {
        apiLogger.log('ERROR', 'Failed to get quota info', { error: error.message });
      }
    }
    return null;
  }

  /**
   * Clear all application data
   */
  clearAll() {
    if (!this.isAvailable) {
      return false;
    }

    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_CONFIG.prefix)) {
        keys.push(key);
      }
    }

    keys.forEach(key => localStorage.removeItem(key));
    
    apiLogger.log('INFO', 'All application data cleared', { clearedCount: keys.length });
    return true;
  }
}

// Create and export singleton instance
export const storageService = new StorageService();
export default storageService;
