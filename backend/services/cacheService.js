import NodeCache from 'node-cache';

class CacheService {
  constructor() {
    // Create different cache instances for different data types
    this.marketDataCache = new NodeCache({
      stdTTL: parseInt(process.env.CACHE_TTL_MARKET_DATA) || 900,
      checkperiod: 120
    });

    this.financialDataCache = new NodeCache({
      stdTTL: parseInt(process.env.CACHE_TTL_FINANCIAL_DATA) || 21600,
      checkperiod: 600
    });

    this.companyDataCache = new NodeCache({
      stdTTL: parseInt(process.env.CACHE_TTL_COMPANY_DATA) || 86400,
      checkperiod: 3600
    });

    this.economicDataCache = new NodeCache({
      stdTTL: 3600, // 1 hour for economic data
      checkperiod: 300
    });

    // Track cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0
    };

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Log cache events in development
    if (process.env.NODE_ENV !== 'production') {
      [this.marketDataCache, this.financialDataCache, this.companyDataCache, this.economicDataCache]
        .forEach(cache => {
          cache.on('set', (key, value) => {
            console.log(`Cache SET: ${key}`);
          });

          cache.on('del', (key, value) => {
            console.log(`Cache DEL: ${key}`);
          });

          cache.on('expired', (key, value) => {
            console.log(`Cache EXPIRED: ${key}`);
          });
        });
    }
  }

  /**
   * Get cached data
   * @param {string} cacheType - Type of cache (market, financial, company, economic)
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null if not found
   */
  get(cacheType, key) {
    const cache = this.getCache(cacheType);
    const data = cache.get(key);

    if (data !== undefined) {
      this.stats.hits++;
      return data;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set cached data
   * @param {string} cacheType - Type of cache (market, financial, company, economic)
   * @param {string} key - Cache key
   * @param {any} value - Data to cache
   * @param {number} [ttl] - Custom TTL in seconds
   * @returns {boolean} Success status
   */
  set(cacheType, key, value, ttl = null) {
    const cache = this.getCache(cacheType);
    const success = cache.set(key, value, ttl);

    if (success) {
      this.stats.sets++;
    }

    return success;
  }

  /**
   * Delete cached data
   * @param {string} cacheType - Type of cache
   * @param {string} key - Cache key
   * @returns {number} Number of deleted entries
   */
  del(cacheType, key) {
    const cache = this.getCache(cacheType);
    return cache.del(key);
  }

  /**
   * Clear all cache or specific cache type
   * @param {string} [cacheType] - Specific cache type to clear
   */
  clear(cacheType = null) {
    if (cacheType) {
      const cache = this.getCache(cacheType);
      cache.flushAll();
    } else {
      this.marketDataCache.flushAll();
      this.financialDataCache.flushAll();
      this.companyDataCache.flushAll();
      this.economicDataCache.flushAll();
    }
  }

  /**
   * Get cache instance by type
   * @param {string} cacheType
   * @returns {NodeCache}
   */
  getCache(cacheType) {
    switch (cacheType) {
      case 'market':
        return this.marketDataCache;
      case 'financial':
        return this.financialDataCache;
      case 'company':
        return this.companyDataCache;
      case 'economic':
        return this.economicDataCache;
      default:
        throw new Error(`Invalid cache type: ${cacheType}`);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      cacheKeys: {
        market: this.marketDataCache.keys().length,
        financial: this.financialDataCache.keys().length,
        company: this.companyDataCache.keys().length,
        economic: this.economicDataCache.keys().length
      }
    };
  }

  /**
   * Generate cache key from parameters
   * @param {string} prefix - Key prefix
   * @param {Object} params - Parameters to include in key
   * @returns {string} Generated cache key
   */
  generateKey(prefix, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');

    return `${prefix}:${sortedParams}`;
  }
}

// Export singleton instance
export default new CacheService();
