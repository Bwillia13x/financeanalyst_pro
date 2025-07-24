/**
 * Local Storage Service
 * Manages localStorage operations with encryption, compression, and data validation
 */

import { CryptoUtils } from '../utils/CryptoUtils';
import { CompressionUtils } from '../utils/CompressionUtils';

export class LocalStorageService {
  constructor() {
    this.prefix = 'financeanalyst_';
    this.isAvailable = false;
    this.maxSize = 5 * 1024 * 1024; // 5MB typical localStorage limit
    this.cryptoUtils = new CryptoUtils();
    this.compressionUtils = new CompressionUtils();
  }

  /**
   * Initialize the localStorage service
   */
  async initialize() {
    try {
      // Test localStorage availability
      const testKey = this.prefix + 'test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      this.isAvailable = true;
      console.log('✅ LocalStorage service initialized');
      
      return { success: true, available: true };
    } catch (error) {
      console.warn('⚠️ LocalStorage not available:', error);
      this.isAvailable = false;
      return { success: false, available: false, error: error.message };
    }
  }

  /**
   * Store data in localStorage
   */
  async store(key, data, options = {}) {
    if (!this.isAvailable) {
      throw new Error('localStorage is not available');
    }

    const {
      encrypt = false,
      compress = false,
      ttl = null,
      validate = true
    } = options;

    try {
      // Validate data if requested
      if (validate && !this.validateData(data)) {
        throw new Error('Invalid data format');
      }

      // Prepare storage object
      const storageObject = {
        data,
        metadata: {
          timestamp: Date.now(),
          version: '1.0',
          encrypted: encrypt,
          compressed: compress,
          ttl,
          originalSize: JSON.stringify(data).length
        }
      };

      let serializedData = JSON.stringify(storageObject);

      // Compress if requested
      if (compress) {
        serializedData = await this.compressionUtils.compress(serializedData);
        storageObject.metadata.compressedSize = serializedData.length;
      }

      // Encrypt if requested
      if (encrypt) {
        serializedData = await this.cryptoUtils.encrypt(serializedData);
      }

      // Check size limits
      if (serializedData.length > this.maxSize) {
        throw new Error(`Data too large: ${serializedData.length} bytes exceeds ${this.maxSize} bytes`);
      }

      // Store in localStorage
      const storageKey = this.prefix + key;
      localStorage.setItem(storageKey, serializedData);

      return {
        success: true,
        key: storageKey,
        size: serializedData.length,
        metadata: storageObject.metadata
      };

    } catch (error) {
      console.error(`Failed to store data in localStorage for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Retrieve data from localStorage
   */
  async retrieve(key, options = {}) {
    if (!this.isAvailable) {
      return null;
    }

    const { decrypt = false, validateTTL = true } = options;

    try {
      const storageKey = this.prefix + key;
      let serializedData = localStorage.getItem(storageKey);

      if (!serializedData) {
        return null;
      }

      // Decrypt if needed
      if (decrypt) {
        serializedData = await this.cryptoUtils.decrypt(serializedData);
      }

      // Decompress if needed
      let storageObject;
      try {
        storageObject = JSON.parse(serializedData);
      } catch (parseError) {
        // Try decompression first
        try {
          const decompressed = await this.compressionUtils.decompress(serializedData);
          storageObject = JSON.parse(decompressed);
        } catch (decompressError) {
          throw new Error('Failed to parse stored data');
        }
      }

      // Validate TTL
      if (validateTTL && storageObject.metadata && storageObject.metadata.ttl) {
        const now = Date.now();
        const expiry = storageObject.metadata.timestamp + storageObject.metadata.ttl;
        
        if (now > expiry) {
          await this.remove(key);
          return null;
        }
      }

      return {
        data: storageObject.data,
        metadata: storageObject.metadata
      };

    } catch (error) {
      console.error(`Failed to retrieve data from localStorage for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Remove data from localStorage
   */
  async remove(key) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const storageKey = this.prefix + key;
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error(`Failed to remove data from localStorage for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all application data from localStorage
   */
  async clear() {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const keys = Object.keys(localStorage);
      const appKeys = keys.filter(key => key.startsWith(this.prefix));
      
      appKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  /**
   * Get all keys for this application
   */
  async getKeys() {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.substring(this.prefix.length));
    } catch (error) {
      console.error('Failed to get localStorage keys:', error);
      return [];
    }
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    if (!this.isAvailable) {
      return { available: false, used: 0, keys: 0 };
    }

    try {
      const keys = await this.getKeys();
      let totalSize = 0;
      let itemCount = 0;
      const itemSizes = {};

      for (const key of keys) {
        const storageKey = this.prefix + key;
        const data = localStorage.getItem(storageKey);
        if (data) {
          const size = data.length;
          totalSize += size;
          itemCount++;
          itemSizes[key] = size;
        }
      }

      return {
        available: true,
        used: totalSize,
        keys: itemCount,
        maxSize: this.maxSize,
        usagePercentage: (totalSize / this.maxSize) * 100,
        itemSizes,
        largestItem: Object.entries(itemSizes).reduce((max, [key, size]) => 
          size > max.size ? { key, size } : max, { key: null, size: 0 })
      };

    } catch (error) {
      console.error('Failed to get localStorage stats:', error);
      return { available: false, used: 0, keys: 0, error: error.message };
    }
  }

  /**
   * Export all application data
   */
  async exportAll() {
    if (!this.isAvailable) {
      return {};
    }

    try {
      const keys = await this.getKeys();
      const exportData = {};

      for (const key of keys) {
        const data = await this.retrieve(key, { validateTTL: false });
        if (data) {
          exportData[key] = data;
        }
      }

      return exportData;
    } catch (error) {
      console.error('Failed to export localStorage data:', error);
      return {};
    }
  }

  /**
   * Import data into localStorage
   */
  async importData(importData, options = {}) {
    if (!this.isAvailable) {
      throw new Error('localStorage is not available');
    }

    const { overwrite = false } = options;

    try {
      const results = {
        imported: 0,
        skipped: 0,
        errors: 0
      };

      for (const [key, data] of Object.entries(importData)) {
        try {
          // Check if key exists and overwrite setting
          const existing = await this.retrieve(key, { validateTTL: false });
          if (existing && !overwrite) {
            results.skipped++;
            continue;
          }

          // Import the data
          await this.store(key, data.data, {
            encrypt: data.metadata?.encrypted || false,
            compress: data.metadata?.compressed || false,
            ttl: data.metadata?.ttl || null
          });

          results.imported++;
        } catch (error) {
          console.error(`Failed to import key "${key}":`, error);
          results.errors++;
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to import localStorage data:', error);
      throw error;
    }
  }

  /**
   * Check if localStorage has enough space for data
   */
  async hasSpace(dataSize) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const stats = await this.getStats();
      return (stats.used + dataSize) <= this.maxSize;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup expired items
   */
  async cleanup() {
    if (!this.isAvailable) {
      return { cleaned: 0 };
    }

    try {
      const keys = await this.getKeys();
      let cleaned = 0;

      for (const key of keys) {
        const data = await this.retrieve(key, { validateTTL: true });
        if (!data) {
          cleaned++; // Item was expired and removed
        }
      }

      return { cleaned };
    } catch (error) {
      console.error('Failed to cleanup localStorage:', error);
      return { cleaned: 0, error: error.message };
    }
  }

  /**
   * Validate data before storage
   */
  validateData(data) {
    try {
      // Check if data is serializable
      JSON.stringify(data);
      
      // Check for circular references
      const seen = new WeakSet();
      const checkCircular = (obj) => {
        if (obj !== null && typeof obj === 'object') {
          if (seen.has(obj)) {
            return false;
          }
          seen.add(obj);
          for (const key in obj) {
            if (!checkCircular(obj[key])) {
              return false;
            }
          }
        }
        return true;
      };

      return checkCircular(data);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get localStorage availability status
   */
  isStorageAvailable() {
    return this.isAvailable;
  }

  /**
   * Test localStorage performance
   */
  async performanceTest() {
    if (!this.isAvailable) {
      return null;
    }

    const testData = { test: 'performance', data: new Array(1000).fill('test') };
    const iterations = 100;
    
    try {
      // Test write performance
      const writeStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        await this.store(`perf_test_${i}`, testData);
      }
      const writeTime = performance.now() - writeStart;

      // Test read performance
      const readStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        await this.retrieve(`perf_test_${i}`);
      }
      const readTime = performance.now() - readStart;

      // Cleanup test data
      for (let i = 0; i < iterations; i++) {
        await this.remove(`perf_test_${i}`);
      }

      return {
        writeTime: writeTime / iterations,
        readTime: readTime / iterations,
        totalTime: writeTime + readTime,
        iterations
      };

    } catch (error) {
      console.error('Performance test failed:', error);
      return null;
    }
  }
}
