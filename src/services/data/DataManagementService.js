/**
 * Data Management Service
 * Handles data caching, normalization, validation, and performance optimization
 * Provides unified interface for real-time and historical data
 */

class DataManagementService {
  constructor(options = {}) {
    this.options = {
      maxCacheSize: 10000,
      cacheTimeout: 300000, // 5 minutes
      compressionEnabled: true,
      validationEnabled: true,
      normalizationEnabled: true,
      ...options
    };

    this.cache = new Map();
    this.cacheMetadata = new Map();
    this.dataValidators = new Map();
    this.normalizers = new Map();
    this.performanceMetrics = {
      cacheHits: 0,
      cacheMisses: 0,
      dataProcessed: 0,
      errors: 0
    };

    this.initializeValidators();
    this.initializeNormalizers();
    this.startCacheCleanup();
  }

  /**
   * Initialize data validators
   */
  initializeValidators() {
    this.dataValidators.set('quote', this.validateQuote.bind(this));
    this.dataValidators.set('trade', this.validateTrade.bind(this));
    this.dataValidators.set('historical', this.validateHistorical.bind(this));
    this.dataValidators.set('news', this.validateNews.bind(this));
    this.dataValidators.set('economic', this.validateEconomic.bind(this));
  }

  /**
   * Initialize data normalizers
   */
  initializeNormalizers() {
    this.normalizers.set('quote', this.normalizeQuote.bind(this));
    this.normalizers.set('trade', this.normalizeTrade.bind(this));
    this.normalizers.set('historical', this.normalizeHistorical.bind(this));
    this.normalizers.set('news', this.normalizeNews.bind(this));
    this.normalizers.set('economic', this.normalizeEconomic.bind(this));
  }

  /**
   * Store data in cache
   */
  async store(key, data, options = {}) {
    const {
      ttl = this.options.cacheTimeout,
      compress = this.options.compressionEnabled,
      validate = this.options.validationEnabled,
      normalize = this.options.normalizationEnabled
    } = options;

    try {
      let processedData = data;

      // Validate data
      if (validate) {
        processedData = await this.validateData(processedData, options.type);
      }

      // Normalize data
      if (normalize) {
        processedData = await this.normalizeData(processedData, options.type);
      }

      // Compress data if enabled
      if (compress && typeof processedData === 'object') {
        processedData = this.compressData(processedData);
      }

      // Store in cache
      const cacheEntry = {
        data: processedData,
        timestamp: Date.now(),
        ttl,
        compressed: compress,
        accessCount: 0,
        lastAccessed: Date.now(),
        size: this.calculateDataSize(processedData)
      };

      this.cache.set(key, cacheEntry);
      this.cacheMetadata.set(key, {
        type: options.type,
        source: options.source,
        symbol: options.symbol,
        created: new Date(),
        expires: new Date(Date.now() + ttl)
      });

      // Update performance metrics
      this.performanceMetrics.dataProcessed++;

      // Check cache size limits
      this.enforceCacheLimits();

      return key;
    } catch (error) {
      console.error(`Failed to store data for key ${key}:`, error);
      this.performanceMetrics.errors++;
      throw error;
    }
  }

  /**
   * Retrieve data from cache
   */
  async retrieve(key, options = {}) {
    const cacheEntry = this.cache.get(key);
    const metadata = this.cacheMetadata.get(key);

    if (!cacheEntry) {
      this.performanceMetrics.cacheMisses++;
      return null;
    }

    // Check if data has expired
    if (Date.now() - cacheEntry.timestamp > cacheEntry.ttl) {
      this.cache.delete(key);
      this.cacheMetadata.delete(key);
      this.performanceMetrics.cacheMisses++;
      return null;
    }

    // Update access statistics
    cacheEntry.accessCount++;
    cacheEntry.lastAccessed = Date.now();

    // Decompress if necessary
    let data = cacheEntry.data;
    if (cacheEntry.compressed) {
      data = this.decompressData(data);
    }

    this.performanceMetrics.cacheHits++;

    // Return data with metadata
    return {
      data,
      metadata: {
        ...metadata,
        cached: true,
        age: Date.now() - cacheEntry.timestamp,
        accessCount: cacheEntry.accessCount
      }
    };
  }

  /**
   * Validate data based on type
   */
  async validateData(data, type) {
    if (!this.options.validationEnabled) return data;

    const validator = this.dataValidators.get(type);
    if (validator) {
      const isValid = await validator(data);
      if (!isValid) {
        throw new Error(`Data validation failed for type ${type}`);
      }
    }

    return data;
  }

  /**
   * Normalize data based on type
   */
  async normalizeData(data, type) {
    if (!this.options.normalizationEnabled) return data;

    const normalizer = this.normalizers.get(type);
    if (normalizer) {
      return await normalizer(data);
    }

    return data;
  }

  /**
   * Validate quote data
   */
  async validateQuote(data) {
    if (!data.symbol || typeof data.symbol !== 'string') return false;
    if (!data.price || typeof data.price !== 'number' || data.price <= 0) return false;
    if (data.change && typeof data.change !== 'number') return false;
    if (data.volume && (typeof data.volume !== 'number' || data.volume < 0)) return false;

    return true;
  }

  /**
   * Validate trade data
   */
  async validateTrade(data) {
    if (!data.symbol || typeof data.symbol !== 'string') return false;
    if (!data.price || typeof data.price !== 'number' || data.price <= 0) return false;
    if (!data.volume || typeof data.volume !== 'number' || data.volume <= 0) return false;
    if (!data.timestamp) return false;

    return true;
  }

  /**
   * Validate historical data
   */
  async validateHistorical(data) {
    if (!Array.isArray(data)) return false;

    for (const item of data) {
      if (!item.timestamp) return false;
      if (!item.close || typeof item.close !== 'number') return false;
      if (item.open && typeof item.open !== 'number') return false;
      if (item.high && typeof item.high !== 'number') return false;
      if (item.low && typeof item.low !== 'number') return false;
      if (item.volume && typeof item.volume !== 'number') return false;
    }

    return true;
  }

  /**
   * Validate news data
   */
  async validateNews(data) {
    if (!Array.isArray(data)) return false;

    for (const item of data) {
      if (!item.title || typeof item.title !== 'string') return false;
      if (!item.url || typeof item.url !== 'string') return false;
      if (!item.publishedAt) return false;
    }

    return true;
  }

  /**
   * Validate economic data
   */
  async validateEconomic(data) {
    if (!Array.isArray(data)) return false;

    for (const item of data) {
      if (!item.date) return false;
      if (item.value === undefined || item.value === null) return false;
    }

    return true;
  }

  /**
   * Normalize quote data
   */
  async normalizeQuote(data) {
    return {
      symbol: data.symbol?.toUpperCase(),
      price: Number(data.price),
      change: Number(data.change || 0),
      changePercent: Number(data.changePercent || 0),
      volume: Number(data.volume || 0),
      marketCap: data.marketCap ? Number(data.marketCap) : undefined,
      pe: data.pe ? Number(data.pe) : undefined,
      eps: data.eps ? Number(data.eps) : undefined,
      timestamp: data.timestamp || new Date(),
      source: data.source || 'unknown',
      type: 'quote'
    };
  }

  /**
   * Normalize trade data
   */
  async normalizeTrade(data) {
    return {
      symbol: data.symbol?.toUpperCase(),
      price: Number(data.price),
      volume: Number(data.volume),
      timestamp: data.timestamp || new Date(),
      side: data.side || 'unknown',
      source: data.source || 'unknown',
      type: 'trade'
    };
  }

  /**
   * Normalize historical data
   */
  async normalizeHistorical(data) {
    if (!Array.isArray(data)) return data;

    return data
      .map(item => ({
        timestamp: new Date(item.timestamp || item.date),
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
        volume: Number(item.volume || 0),
        adjustedClose: item.adjustedClose ? Number(item.adjustedClose) : undefined,
        source: item.source || 'unknown'
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Normalize news data
   */
  async normalizeNews(data) {
    if (!Array.isArray(data)) return data;

    return data
      .map(item => ({
        title: String(item.title),
        description: item.description ? String(item.description) : '',
        url: String(item.url),
        source: String(item.source || item.provider || 'unknown'),
        publishedAt: new Date(item.publishedAt),
        sentiment: item.sentiment || this.analyzeSentiment(item.title + ' ' + item.description),
        tags: Array.isArray(item.tags) ? item.tags : [],
        type: 'news'
      }))
      .sort((a, b) => b.publishedAt - a.publishedAt);
  }

  /**
   * Normalize economic data
   */
  async normalizeEconomic(data) {
    if (!Array.isArray(data)) return data;

    return data
      .map(item => ({
        date: new Date(item.date),
        value: Number(item.value),
        indicator: String(item.indicator || item.series || 'unknown'),
        source: item.source || 'unknown',
        type: 'economic'
      }))
      .sort((a, b) => a.date - b.date);
  }

  /**
   * Simple sentiment analysis
   */
  analyzeSentiment(text) {
    if (!text || typeof text !== 'string') return 'neutral';

    const positiveWords = [
      'gain',
      'rise',
      'increase',
      'bull',
      'bullish',
      'up',
      'higher',
      'strong',
      'positive',
      'growth',
      'profit'
    ];
    const negativeWords = [
      'loss',
      'fall',
      'decrease',
      'bear',
      'bearish',
      'down',
      'lower',
      'weak',
      'negative',
      'decline',
      'crash'
    ];

    const lowerText = text.toLowerCase();
    const positiveScore = positiveWords.reduce(
      (score, word) => score + (lowerText.includes(word) ? 1 : 0),
      0
    );
    const negativeScore = negativeWords.reduce(
      (score, word) => score + (lowerText.includes(word) ? 1 : 0),
      0
    );

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  /**
   * Compress data for storage
   */
  compressData(data) {
    // Simple compression - remove null/undefined values and round numbers
    if (typeof data === 'object' && data !== null) {
      const compressed = {};

      for (const [key, value] of Object.entries(data)) {
        if (value != null) {
          if (typeof value === 'number') {
            compressed[key] = Math.round(value * 10000) / 10000; // Round to 4 decimal places
          } else if (Array.isArray(value)) {
            compressed[key] = value.map(item =>
              typeof item === 'number' ? Math.round(item * 10000) / 10000 : item
            );
          } else {
            compressed[key] = value;
          }
        }
      }

      return compressed;
    }

    return data;
  }

  /**
   * Decompress data
   */
  decompressData(data) {
    // For now, just return the data as-is since we're not doing heavy compression
    return data;
  }

  /**
   * Calculate data size for cache management
   */
  calculateDataSize(data) {
    return JSON.stringify(data).length;
  }

  /**
   * Enforce cache size limits
   */
  enforceCacheLimits() {
    if (this.cache.size <= this.options.maxCacheSize) return;

    // Remove least recently used items
    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.lastAccessed - b.lastAccessed
    );

    const toRemove = entries.slice(0, Math.ceil(this.cache.size * 0.1)); // Remove 10%

    for (const [key] of toRemove) {
      this.cache.delete(key);
      this.cacheMetadata.delete(key);
    }
  }

  /**
   * Start cache cleanup interval
   */
  startCacheCleanup() {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // Clean every minute
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.cacheMetadata.delete(key);
    }

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Get data with fallback options
   */
  async getData(key, options = {}) {
    const { fallback, refresh = false } = options;

    // Try cache first
    if (!refresh) {
      const cached = await this.retrieve(key);
      if (cached) return cached;
    }

    // If no cache or refresh requested, try fallbacks
    if (fallback && typeof fallback === 'function') {
      try {
        const freshData = await fallback();
        if (freshData) {
          await this.store(key, freshData, options);
          return await this.retrieve(key);
        }
      } catch (error) {
        console.error('Fallback data retrieval failed:', error);
      }
    }

    return null;
  }

  /**
   * Batch store multiple data items
   */
  async batchStore(dataMap, options = {}) {
    const results = new Map();
    const promises = [];

    for (const [key, data] of dataMap.entries()) {
      promises.push(
        this.store(key, data, options)
          .then(() => results.set(key, true))
          .catch(error => {
            console.error(`Failed to store ${key}:`, error);
            results.set(key, false);
          })
      );
    }

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Batch retrieve multiple data items
   */
  async batchRetrieve(keys, options = {}) {
    const results = new Map();
    const promises = [];

    for (const key of keys) {
      promises.push(
        this.retrieve(key, options)
          .then(data => results.set(key, data))
          .catch(error => {
            console.error(`Failed to retrieve ${key}:`, error);
            results.set(key, null);
          })
      );
    }

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const totalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);

    const hitRate =
      this.performanceMetrics.cacheHits /
        (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) || 0;

    return {
      size: this.cache.size,
      totalSize,
      maxSize: this.options.maxCacheSize,
      hitRate: Math.round(hitRate * 100) / 100,
      hits: this.performanceMetrics.cacheHits,
      misses: this.performanceMetrics.cacheMisses,
      dataProcessed: this.performanceMetrics.dataProcessed,
      errors: this.performanceMetrics.errors
    };
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheMetadata.clear();
    this.performanceMetrics.cacheHits = 0;
    this.performanceMetrics.cacheMisses = 0;
  }

  /**
   * Get data by pattern
   */
  getDataByPattern(pattern, options = {}) {
    const results = new Map();

    for (const [key, entry] of this.cache.entries()) {
      if (this.matchesPattern(key, pattern)) {
        if (options.includeMetadata) {
          results.set(key, {
            data: entry.compressed ? this.decompressData(entry.data) : entry.data,
            metadata: this.cacheMetadata.get(key)
          });
        } else {
          results.set(key, entry.compressed ? this.decompressData(entry.data) : entry.data);
        }
      }
    }

    return results;
  }

  /**
   * Check if key matches pattern
   */
  matchesPattern(key, pattern) {
    if (typeof pattern === 'string') {
      return key.includes(pattern);
    }

    if (pattern instanceof RegExp) {
      return pattern.test(key);
    }

    if (typeof pattern === 'function') {
      return pattern(key);
    }

    return false;
  }

  /**
   * Export cache data
   */
  exportData(options = {}) {
    const { includeMetadata = true, compress = false } = options;
    const exportData = {};

    for (const [key, entry] of this.cache.entries()) {
      const data = entry.compressed ? this.decompressData(entry.data) : entry.data;

      exportData[key] = {
        data,
        timestamp: entry.timestamp,
        ...(includeMetadata && { metadata: this.cacheMetadata.get(key) })
      };
    }

    return compress ? this.compressData(exportData) : exportData;
  }

  /**
   * Import cache data
   */
  async importData(data, options = {}) {
    const { overwrite = false, validate = true } = options;

    for (const [key, entry] of Object.entries(data)) {
      if (!overwrite && this.cache.has(key)) {
        continue; // Skip existing keys unless overwrite is true
      }

      try {
        await this.store(key, entry.data, {
          ...entry.metadata,
          validate,
          ttl: entry.timestamp ? Date.now() - entry.timestamp : this.options.cacheTimeout
        });
      } catch (error) {
        console.error(`Failed to import data for key ${key}:`, error);
      }
    }
  }

  /**
   * Shutdown the service
   */
  async shutdown() {
    console.log('Shutting down Data Management Service...');

    this.clearCache();

    console.log('Data Management Service shutdown complete');
  }
}

// Export singleton instance
export const dataManagementService = new DataManagementService({
  maxCacheSize: 10000,
  cacheTimeout: 300000,
  compressionEnabled: true,
  validationEnabled: true,
  normalizationEnabled: true
});

export default DataManagementService;
