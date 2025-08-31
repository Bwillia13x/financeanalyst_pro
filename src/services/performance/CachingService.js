/**
 * Caching Service
 * Advanced caching system for performance optimization
 * Handles HTTP caching, memory caching, and service worker caching
 */

class CachingService {
  constructor(options = {}) {
    this.options = {
      enableHttpCaching: true,
      enableMemoryCaching: true,
      enableServiceWorkerCaching: true,
      defaultTtl: 300000, // 5 minutes
      maxMemoryCacheSize: 50, // MB
      maxCacheEntries: 1000,
      cacheVersion: 'v1.0',
      ...options
    };

    this.memoryCache = new Map();
    this.cacheMetadata = new Map();
    this.httpCacheHeaders = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0
    };

    this.isInitialized = false;
  }

  /**
   * Initialize caching service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.setupMemoryCache();
      this.setupHttpCaching();
      this.setupServiceWorkerCaching();
      this.setupCacheCleanup();

      this.isInitialized = true;
      console.log('Caching Service initialized');
    } catch (error) {
      console.error('Failed to initialize Caching Service:', error);
    }
  }

  /**
   * Setup memory cache
   */
  setupMemoryCache() {
    if (!this.options.enableMemoryCaching) return;

    // Setup cache size monitoring
    this.monitorCacheSize();

    // Setup cache persistence to sessionStorage
    this.loadPersistedCache();
  }

  /**
   * Setup HTTP caching headers and strategies
   */
  setupHttpCaching() {
    if (!this.options.enableHttpCaching) return;

    // Define caching strategies for different resource types
    this.httpCacheHeaders.set('api', {
      'Cache-Control': 'public, max-age=300', // 5 minutes for API responses
      ETag: true
    });

    this.httpCacheHeaders.set('static', {
      'Cache-Control': 'public, max-age=31536000, immutable', // 1 year for static assets
      ETag: true
    });

    this.httpCacheHeaders.set('images', {
      'Cache-Control': 'public, max-age=86400', // 1 day for images
      ETag: true
    });

    this.httpCacheHeaders.set('fonts', {
      'Cache-Control': 'public, max-age=31536000, immutable', // 1 year for fonts
      ETag: true
    });
  }

  /**
   * Setup service worker caching
   */
  setupServiceWorkerCaching() {
    if (!this.options.enableServiceWorkerCaching) return;

    // Service worker setup is handled in BundleOptimizerService
    // This service coordinates with the service worker
    this.setupServiceWorkerCommunication();
  }

  /**
   * Setup communication with service worker
   */
  setupServiceWorkerCommunication() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'CACHE_UPDATE') {
          this.handleCacheUpdate(event.data);
        }
      });
    }
  }

  /**
   * Setup automatic cache cleanup
   */
  setupCacheCleanup() {
    // Cleanup expired entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 300000);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.persistCache();
    });

    // Cleanup on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.persistCache();
      }
    });
  }

  /**
   * Store data in memory cache
   */
  async set(key, data, options = {}) {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: options.ttl || this.options.defaultTtl,
      size: this.calculateDataSize(data),
      tags: options.tags || [],
      metadata: options.metadata || {}
    };

    // Check cache size limits
    if (this.wouldExceedCacheSize(cacheEntry.size)) {
      await this.evictOldEntries(cacheEntry.size);
    }

    // Check entry count limits
    if (this.memoryCache.size >= this.options.maxCacheEntries) {
      this.evictLRUEntry();
    }

    // Store in cache
    this.memoryCache.set(key, cacheEntry);
    this.cacheMetadata.set(key, {
      accessCount: 0,
      lastAccessed: Date.now(),
      ...cacheEntry.metadata
    });

    this.cacheStats.size += cacheEntry.size;

    // Update access metadata
    this.updateAccessMetadata(key);
  }

  /**
   * Retrieve data from cache
   */
  async get(key) {
    const entry = this.memoryCache.get(key);

    if (!entry) {
      this.cacheStats.misses++;
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      this.cacheMetadata.delete(key);
      this.cacheStats.misses++;
      this.cacheStats.evictions++;
      return null;
    }

    // Update access metadata
    this.updateAccessMetadata(key);
    this.cacheStats.hits++;

    return entry.data;
  }

  /**
   * Check if key exists in cache
   */
  async has(key) {
    const entry = this.memoryCache.get(key);
    return entry && !this.isExpired(entry);
  }

  /**
   * Delete entry from cache
   */
  async delete(key) {
    const entry = this.memoryCache.get(key);
    if (entry) {
      this.cacheStats.size -= entry.size;
      this.memoryCache.delete(key);
      this.cacheMetadata.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Clear entire cache
   */
  async clear() {
    this.memoryCache.clear();
    this.cacheMetadata.clear();
    this.cacheStats.size = 0;
    this.cacheStats.hits = 0;
    this.cacheStats.misses = 0;
    this.cacheStats.evictions = 0;
  }

  /**
   * Get cache entry metadata
   */
  async getMetadata(key) {
    return this.cacheMetadata.get(key) || null;
  }

  /**
   * Set HTTP cache headers for request
   */
  setHttpCacheHeaders(resourceType, headers = {}) {
    if (!this.options.enableHttpCaching) return headers;

    const cacheConfig = this.httpCacheHeaders.get(resourceType);
    if (cacheConfig) {
      return {
        ...headers,
        ...cacheConfig
      };
    }

    return headers;
  }

  /**
   * Cache HTTP response
   */
  async cacheHttpResponse(url, response, options = {}) {
    if (!response.ok) return response;

    const cacheKey = `http_${btoa(url)}`;
    const data = await response.clone().json();

    await this.set(cacheKey, data, {
      ttl: options.ttl || 300000, // 5 minutes
      tags: ['http', response.url],
      metadata: {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      }
    });

    return response;
  }

  /**
   * Get cached HTTP response
   */
  async getCachedHttpResponse(url) {
    const cacheKey = `http_${btoa(url)}`;
    return await this.get(cacheKey);
  }

  /**
   * Cache API responses
   */
  async cacheApiResponse(endpoint, data, options = {}) {
    const cacheKey = `api_${endpoint}`;

    await this.set(cacheKey, data, {
      ttl: options.ttl || 300000, // 5 minutes
      tags: ['api', endpoint],
      metadata: {
        endpoint,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Get cached API response
   */
  async getCachedApiResponse(endpoint) {
    const cacheKey = `api_${endpoint}`;
    return await this.get(cacheKey);
  }

  /**
   * Cache user preferences
   */
  async cacheUserPreferences(userId, preferences) {
    const cacheKey = `user_prefs_${userId}`;

    await this.set(cacheKey, preferences, {
      ttl: 3600000, // 1 hour
      tags: ['user', 'preferences', userId]
    });
  }

  /**
   * Get cached user preferences
   */
  async getCachedUserPreferences(userId) {
    const cacheKey = `user_prefs_${userId}`;
    return await this.get(cacheKey);
  }

  /**
   * Cache component state
   */
  async cacheComponentState(componentId, state) {
    const cacheKey = `component_${componentId}`;

    await this.set(cacheKey, state, {
      ttl: 1800000, // 30 minutes
      tags: ['component', componentId]
    });
  }

  /**
   * Get cached component state
   */
  async getCachedComponentState(componentId) {
    const cacheKey = `component_${componentId}`;
    return await this.get(cacheKey);
  }

  /**
   * Cache computation results
   */
  async cacheComputation(key, result, dependencies = []) {
    const cacheKey = `computation_${key}`;

    await this.set(cacheKey, result, {
      ttl: 600000, // 10 minutes
      tags: ['computation', ...dependencies],
      metadata: {
        dependencies,
        computationKey: key
      }
    });
  }

  /**
   * Get cached computation result
   */
  async getCachedComputation(key) {
    const cacheKey = `computation_${key}`;
    return await this.get(cacheKey);
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags) {
    const keysToDelete = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      const hasMatchingTag = tags.some(tag => entry.tags.includes(tag));
      if (hasMatchingTag) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }

    return keysToDelete.length;
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern) {
    const keysToDelete = [];

    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }

    return keysToDelete.length;
  }

  /**
   * Check if cache entry is expired
   */
  isExpired(entry) {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Calculate data size in bytes
   */
  calculateDataSize(data) {
    const str = JSON.stringify(data);
    return new Blob([str]).size;
  }

  /**
   * Check if adding entry would exceed cache size
   */
  wouldExceedCacheSize(entrySize) {
    return this.cacheStats.size + entrySize > this.options.maxMemoryCacheSize * 1024 * 1024;
  }

  /**
   * Evict old entries to make room
   */
  async evictOldEntries(requiredSize) {
    const entries = Array.from(this.memoryCache.entries())
      .map(([key, entry]) => ({
        key,
        entry,
        metadata: this.cacheMetadata.get(key)
      }))
      .sort((a, b) => {
        // Sort by access frequency and recency
        const aScore = a.metadata.accessCount + (Date.now() - a.metadata.lastAccessed) / 1000;
        const bScore = b.metadata.accessCount + (Date.now() - b.metadata.lastAccessed) / 1000;
        return bScore - aScore; // Higher score = more likely to evict
      });

    let freedSize = 0;
    const keysToDelete = [];

    for (const { key, entry } of entries) {
      if (freedSize >= requiredSize) break;

      keysToDelete.push(key);
      freedSize += entry.size;
      this.cacheStats.evictions++;
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }
  }

  /**
   * Evict least recently used entry
   */
  evictLRUEntry() {
    let lruKey = null;
    let lruTime = Date.now();

    for (const [key, metadata] of this.cacheMetadata.entries()) {
      if (metadata.lastAccessed < lruTime) {
        lruTime = metadata.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.delete(lruKey);
      this.cacheStats.evictions++;
    }
  }

  /**
   * Update access metadata
   */
  updateAccessMetadata(key) {
    const metadata = this.cacheMetadata.get(key);
    if (metadata) {
      metadata.accessCount++;
      metadata.lastAccessed = Date.now();
    }
  }

  /**
   * Monitor cache size
   */
  monitorCacheSize() {
    setInterval(() => {
      if (this.cacheStats.size > this.options.maxMemoryCacheSize * 1024 * 1024 * 0.9) {
        console.warn('Cache size approaching limit:', this.cacheStats.size);
      }
    }, 60000); // Check every minute
  }

  /**
   * Cleanup expired entries
   */
  async cleanupExpiredEntries() {
    const expiredKeys = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.delete(key);
      this.cacheStats.evictions++;
    }

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Persist cache to sessionStorage
   */
  persistCache() {
    try {
      const cacheData = {
        entries: Array.from(this.memoryCache.entries()),
        metadata: Array.from(this.cacheMetadata.entries()),
        stats: this.cacheStats,
        timestamp: Date.now()
      };

      sessionStorage.setItem('caching_service_data', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  }

  /**
   * Load persisted cache from sessionStorage
   */
  loadPersistedCache() {
    try {
      const cacheDataStr = sessionStorage.getItem('caching_service_data');
      if (!cacheDataStr) return;

      const cacheData = JSON.parse(cacheDataStr);

      // Only load if less than 1 hour old
      if (Date.now() - cacheData.timestamp > 3600000) {
        sessionStorage.removeItem('caching_service_data');
        return;
      }

      // Restore entries
      for (const [key, entry] of cacheData.entries) {
        // Check if entry is still valid
        if (!this.isExpired(entry)) {
          this.memoryCache.set(key, entry);
          this.cacheStats.size += entry.size;
        }
      }

      // Restore metadata
      for (const [key, metadata] of cacheData.metadata) {
        if (this.memoryCache.has(key)) {
          this.cacheMetadata.set(key, metadata);
        }
      }

      // Restore stats
      Object.assign(this.cacheStats, cacheData.stats);

      console.log(`Restored ${this.memoryCache.size} cache entries from session`);
    } catch (error) {
      console.warn('Failed to load persisted cache:', error);
    }
  }

  /**
   * Handle cache updates from service worker
   */
  handleCacheUpdate(data) {
    console.log('Cache update from service worker:', data);

    // Invalidate affected cache entries
    if (data.tags) {
      this.invalidateByTags(data.tags);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalEntries = this.memoryCache.size;
    const hitRate =
      totalEntries > 0 ? this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) : 0;

    return {
      totalEntries,
      cacheSize: this.cacheStats.size,
      cacheSizeMB: (this.cacheStats.size / (1024 * 1024)).toFixed(2),
      hitRate: (hitRate * 100).toFixed(2),
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      evictions: this.cacheStats.evictions,
      maxSize: this.options.maxMemoryCacheSize,
      maxEntries: this.options.maxCacheEntries,
      utilizationPercent: (
        (this.cacheStats.size / (this.options.maxMemoryCacheSize * 1024 * 1024)) *
        100
      ).toFixed(2)
    };
  }

  /**
   * Get cache entries by tags
   */
  getEntriesByTags(tags) {
    const entries = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      const hasMatchingTag = tags.some(tag => entry.tags.includes(tag));
      if (hasMatchingTag) {
        entries.push({
          key,
          data: entry.data,
          metadata: this.cacheMetadata.get(key),
          tags: entry.tags
        });
      }
    }

    return entries;
  }

  /**
   * Export cache data for debugging
   */
  exportCacheData() {
    return {
      entries: Array.from(this.memoryCache.entries()),
      metadata: Array.from(this.cacheMetadata.entries()),
      stats: this.cacheStats,
      options: this.options,
      exportTimestamp: Date.now()
    };
  }

  /**
   * Shutdown the service
   */
  shutdown() {
    this.persistCache();
    this.clear();
    this.isInitialized = false;

    console.log('Caching Service shutdown');
  }
}

// Export singleton instance
export const cachingService = new CachingService();
export default CachingService;
