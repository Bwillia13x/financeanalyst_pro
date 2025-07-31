// Advanced Caching System for Financial Data
// Respects data sensitivity, freshness requirements, and regulatory compliance

class FinancialDataCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.metadata = new Map();
    this.options = {
      // Default cache settings for different data types
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 100, // Maximum number of cached items
      compressionThreshold: 10 * 1024, // 10KB - compress larger items
      encryptSensitiveData: true,
      ...options
    };
    
    // Data type specific caching rules
    this.cachingRules = {
      // Market data - short TTL, high frequency updates
      'market-data': {
        ttl: 30 * 1000, // 30 seconds
        sensitive: false,
        compress: true,
        maxAge: 2 * 60 * 1000, // 2 minutes absolute max
        staleWhileRevalidate: true
      },
      
      // Company financials - medium TTL, periodic updates
      'company-financials': {
        ttl: 15 * 60 * 1000, // 15 minutes
        sensitive: false,
        compress: true,
        maxAge: 60 * 60 * 1000, // 1 hour absolute max
        staleWhileRevalidate: true
      },
      
      // User models - longer TTL, user-specific
      'user-models': {
        ttl: 60 * 60 * 1000, // 1 hour
        sensitive: true,
        compress: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours absolute max
        staleWhileRevalidate: false,
        requireAuth: true
      },
      
      // Private analysis - very sensitive, session-based
      'private-analysis': {
        ttl: 30 * 60 * 1000, // 30 minutes
        sensitive: true,
        compress: false, // Don't compress for performance
        maxAge: 2 * 60 * 60 * 1000, // 2 hours absolute max
        staleWhileRevalidate: false,
        requireAuth: true,
        sessionOnly: true
      },
      
      // Reference data - long TTL, rarely changes
      'reference-data': {
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        sensitive: false,
        compress: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days absolute max
        staleWhileRevalidate: true
      },
      
      // API responses - short TTL, varies by endpoint
      'api-response': {
        ttl: 5 * 60 * 1000, // 5 minutes
        sensitive: false,
        compress: true,
        maxAge: 30 * 60 * 1000, // 30 minutes absolute max
        staleWhileRevalidate: true
      }
    };
    
    // Initialize cleanup interval
    this.startCleanupInterval();
    
    // Initialize storage quotas and monitoring
    this.initializeStorageMonitoring();
  }

  // Get data from cache with intelligent fallback
  async get(key, options = {}) {
    const {
      dataType = 'api-response',
      fetchFallback = null,
      bypassCache = false,
      requireFresh = false
    } = options;

    if (bypassCache) {
      return await this.fetchAndCache(key, fetchFallback, dataType);
    }

    const cachedItem = this.cache.get(key);
    const metadata = this.metadata.get(key);

    if (!cachedItem || !metadata) {
      // Cache miss - fetch fresh data
      return await this.fetchAndCache(key, fetchFallback, dataType);
    }

    const now = Date.now();
    const rules = this.cachingRules[dataType];
    const age = now - metadata.timestamp;

    // Check if data is expired beyond maximum age
    if (age > rules.maxAge) {
      this.delete(key);
      return await this.fetchAndCache(key, fetchFallback, dataType);
    }

    // Check if data is stale
    const isStale = age > rules.ttl;

    if (requireFresh && isStale) {
      return await this.fetchAndCache(key, fetchFallback, dataType);
    }

    // Stale-while-revalidate: return stale data but fetch fresh in background
    if (isStale && rules.staleWhileRevalidate && fetchFallback) {
      // Return stale data immediately
      const staleData = await this.deserializeData(cachedItem, metadata);
      
      // Fetch fresh data in background (don't await)
      this.fetchAndCache(key, fetchFallback, dataType).catch(error => {
        console.warn('Background refresh failed:', error);
      });
      
      return staleData;
    }

    // Return cached data
    return await this.deserializeData(cachedItem, metadata);
  }

  // Set data in cache with appropriate rules
  async set(key, data, dataType = 'api-response') {
    const rules = this.cachingRules[dataType];
    const now = Date.now();

    // Don't cache sensitive data if not authenticated
    if (rules.requireAuth && !this.isAuthenticated()) {
      console.warn('Attempted to cache sensitive data without authentication');
      return false;
    }

    // Don't cache session-only data in persistent storage
    if (rules.sessionOnly && !this.isSessionStorage()) {
      console.warn('Session-only data attempted to be cached persistently');
      return false;
    }

    // Serialize and potentially compress/encrypt data
    const serializedData = await this.serializeData(data, rules);
    
    // Check storage quota
    if (!this.checkStorageQuota(serializedData)) {
      // Evict oldest items to make space
      await this.evictOldestItems();
    }

    // Store data and metadata
    this.cache.set(key, serializedData);
    this.metadata.set(key, {
      timestamp: now,
      dataType,
      size: this.calculateSize(serializedData),
      compressed: rules.compress,
      encrypted: rules.sensitive && this.options.encryptSensitiveData,
      accessCount: 0,
      lastAccessed: now
    });

    // Ensure cache size limits
    this.enforCacheSizeLimit();

    return true;
  }

  // Delete item from cache
  delete(key) {
    const deleted = this.cache.delete(key);
    this.metadata.delete(key);
    return deleted;
  }

  // Clear cache with optional filtering
  clear(filter = null) {
    if (!filter) {
      this.cache.clear();
      this.metadata.clear();
      return;
    }

    // Clear with filter (e.g., by data type)
    for (const [key, metadata] of this.metadata.entries()) {
      if (filter(key, metadata)) {
        this.delete(key);
      }
    }
  }

  // Private method to fetch and cache data
  async fetchAndCache(key, fetchFallback, dataType) {
    if (!fetchFallback) {
      throw new Error('No data in cache and no fetch function provided');
    }

    try {
      const data = await fetchFallback(key);
      await this.set(key, data, dataType);
      return data;
    } catch (error) {
      console.error('Failed to fetch data for cache:', error);
      throw error;
    }
  }

  // Serialize data with compression and encryption
  async serializeData(data, rules) {
    let serialized = JSON.stringify(data);

    // Compress if enabled and data is large enough
    if (rules.compress && serialized.length > this.options.compressionThreshold) {
      serialized = await this.compressData(serialized);
    }

    // Encrypt sensitive data
    if (rules.sensitive && this.options.encryptSensitiveData) {
      serialized = await this.encryptData(serialized);
    }

    return serialized;
  }

  // Deserialize data with decompression and decryption
  async deserializeData(serializedData, metadata) {
    let data = serializedData;

    // Decrypt if encrypted
    if (metadata.encrypted) {
      data = await this.decryptData(data);
    }

    // Decompress if compressed
    if (metadata.compressed) {
      data = await this.decompressData(data);
    }

    // Update access statistics
    metadata.accessCount++;
    metadata.lastAccessed = Date.now();

    return JSON.parse(data);
  }

  // Compression utilities (simplified - in production use proper compression)
  async compressData(data) {
    // In production, use proper compression like gzip or brotli
    // For now, just base64 encode (placeholder)
    return btoa(unescape(encodeURIComponent(data)));
  }

  async decompressData(compressedData) {
    // Decode base64 (placeholder for real decompression)
    return decodeURIComponent(escape(atob(compressedData)));
  }

  // Encryption utilities (simplified - use proper encryption in production)
  async encryptData(data) {
    // In production, use Web Crypto API for proper encryption
    // For now, just base64 encode with simple obfuscation
    const key = this.getEncryptionKey();
    const obfuscated = data.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('');
    return btoa(obfuscated);
  }

  async decryptData(encryptedData) {
    // Reverse the simple obfuscation
    const key = this.getEncryptionKey();
    const deobfuscated = atob(encryptedData);
    return deobfuscated.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('');
  }

  getEncryptionKey() {
    // In production, use proper key management
    return 'finance-app-key-' + (this.getUserId() || 'anonymous');
  }

  // Utility methods
  isAuthenticated() {
    // Check authentication status
    return !!(localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token'));
  }

  isSessionStorage() {
    // Determine if we're using session storage
    return false; // This implementation uses memory cache
  }

  getUserId() {
    try {
      const token = localStorage.getItem('auth-token');
      if (token) {
        // In production, properly decode JWT
        return JSON.parse(atob(token.split('.')[1])).userId;
      }
    } catch (e) {
      console.warn('Failed to get user ID:', e);
    }
    return null;
  }

  calculateSize(data) {
    return typeof data === 'string' ? data.length : JSON.stringify(data).length;
  }

  checkStorageQuota(newData) {
    const currentSize = this.getCurrentCacheSize();
    const newDataSize = this.calculateSize(newData);
    const maxSize = this.options.maxSize * 1024 * 1024; // Convert to bytes
    
    return (currentSize + newDataSize) <= maxSize;
  }

  getCurrentCacheSize() {
    let totalSize = 0;
    for (const metadata of this.metadata.values()) {
      totalSize += metadata.size;
    }
    return totalSize;
  }

  async evictOldestItems() {
    // Sort by last accessed time and remove oldest 20%
    const entries = Array.from(this.metadata.entries())
      .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed);
    
    const toEvict = Math.ceil(entries.length * 0.2);
    
    for (let i = 0; i < toEvict; i++) {
      const [key] = entries[i];
      this.delete(key);
    }
  }

  enforCacheSizeLimit() {
    if (this.cache.size > this.options.maxSize) {
      const toRemove = this.cache.size - this.options.maxSize;
      const entries = Array.from(this.metadata.entries())
        .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed);
      
      for (let i = 0; i < toRemove; i++) {
        const [key] = entries[i];
        this.delete(key);
      }
    }
  }

  startCleanupInterval() {
    // Clean up expired items every 5 minutes
    setInterval(() => {
      this.cleanupExpiredItems();
    }, 5 * 60 * 1000);
  }

  cleanupExpiredItems() {
    const now = Date.now();
    
    for (const [key, metadata] of this.metadata.entries()) {
      const rules = this.cachingRules[metadata.dataType];
      const age = now - metadata.timestamp;
      
      if (age > rules.maxAge) {
        this.delete(key);
      }
    }
  }

  initializeStorageMonitoring() {
    // Monitor storage usage and quota
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        console.log('Storage quota:', estimate.quota);
        console.log('Storage usage:', estimate.usage);
        
        if (estimate.usage && estimate.quota) {
          const usagePercent = (estimate.usage / estimate.quota) * 100;
          if (usagePercent > 80) {
            console.warn('Storage usage is high:', usagePercent.toFixed(1) + '%');
          }
        }
      });
    }
  }

  // Get cache statistics
  getStats() {
    const stats = {
      totalItems: this.cache.size,
      totalSize: this.getCurrentCacheSize(),
      dataTypes: {},
      oldestItem: null,
      newestItem: null
    };

    let oldestTime = Infinity;
    let newestTime = 0;

    for (const [key, metadata] of this.metadata.entries()) {
      // Count by data type
      if (!stats.dataTypes[metadata.dataType]) {
        stats.dataTypes[metadata.dataType] = { count: 0, size: 0 };
      }
      stats.dataTypes[metadata.dataType].count++;
      stats.dataTypes[metadata.dataType].size += metadata.size;

      // Track oldest and newest
      if (metadata.timestamp < oldestTime) {
        oldestTime = metadata.timestamp;
        stats.oldestItem = { key, timestamp: metadata.timestamp };
      }
      if (metadata.timestamp > newestTime) {
        newestTime = metadata.timestamp;
        stats.newestItem = { key, timestamp: metadata.timestamp };
      }
    }

    return stats;
  }
}

// Create singleton instance
const financialDataCache = new FinancialDataCache();

// Export cache instance and helper functions
export default financialDataCache;

// Helper functions for common operations
export const cacheMarketData = (symbol, data) => 
  financialDataCache.set(`market-${symbol}`, data, 'market-data');

export const getMarketData = (symbol, fetchFn) => 
  financialDataCache.get(`market-${symbol}`, { 
    dataType: 'market-data', 
    fetchFallback: fetchFn 
  });

export const cacheUserModel = (modelId, data) => 
  financialDataCache.set(`model-${modelId}`, data, 'user-models');

export const getUserModel = (modelId, fetchFn) => 
  financialDataCache.get(`model-${modelId}`, { 
    dataType: 'user-models', 
    fetchFallback: fetchFn 
  });

export const clearSensitiveData = () => 
  financialDataCache.clear((key, metadata) => 
    metadata.dataType === 'private-analysis' || metadata.dataType === 'user-models'
  );

export const getCacheStats = () => financialDataCache.getStats();