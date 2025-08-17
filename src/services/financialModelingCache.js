import { apiLogger } from '../utils/apiLogger.js';

/**
 * Financial Modeling Cache Service
 * Provides intelligent caching for expensive financial calculations
 */
class FinancialModelingCache {
  constructor() {
    this.cache = new Map();
    this.computationCache = new Map();
    this.resultCache = new Map();
    this.maxCacheSize = 1000;
    this.defaultTTL = 300000; // 5 minutes in milliseconds
    this.performanceMetrics = {
      hits: 0,
      misses: 0,
      computationTime: 0,
      cacheOperations: 0
    };
  }

  /**
   * Generate cache key from inputs
   * @param {string} operation - Operation name
   * @param {Object} inputs - Input parameters
   * @returns {string} Cache key
   */
  generateCacheKey(operation, inputs) {
    // Create a deterministic hash of the inputs
    const inputString = JSON.stringify(inputs, Object.keys(inputs).sort());
    return `${operation}:${this.simpleHash(inputString)}`;
  }

  /**
   * Simple hash function for cache keys
   * @param {string} str - String to hash
   * @returns {string} Hash
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached result if available and not expired
   * @param {string} key - Cache key
   * @returns {Object|null} Cached result or null
   */
  get(key) {
    const cached = this.cache.get(key);

    if (!cached) {
      this.performanceMetrics.misses++;
      return null;
    }

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      this.performanceMetrics.misses++;
      return null;
    }

    this.performanceMetrics.hits++;
    return cached.data;
  }

  /**
   * Store result in cache
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, data, ttl = this.defaultTTL) {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data: this.deepClone(data),
      expiry: Date.now() + ttl,
      lastAccessed: Date.now()
    });

    this.performanceMetrics.cacheOperations++;
  }

  /**
   * Cached DCF calculation with memoization
   * @param {Object} inputs - DCF inputs
   * @param {Function} calculator - DCF calculation function
   * @returns {Object} DCF results
   */
  async cachedDCFCalculation(inputs, calculator) {
    const key = this.generateCacheKey('dcf', inputs);
    const cached = this.get(key);

    if (cached) {
      apiLogger.log('DEBUG', 'DCF calculation cache hit', { key });
      return cached;
    }

    const startTime = performance.now();
    const result = await calculator(inputs);
    const endTime = performance.now();

    this.performanceMetrics.computationTime += (endTime - startTime);

    // Cache result with longer TTL for complex calculations
    this.set(key, result, 600000); // 10 minutes for DCF

    apiLogger.log('DEBUG', 'DCF calculation cached', {
      key,
      computationTime: endTime - startTime
    });

    return result;
  }

  /**
   * Cached LBO calculation with memoization
   * @param {Object} inputs - LBO inputs
   * @param {Function} calculator - LBO calculation function
   * @returns {Object} LBO results
   */
  async cachedLBOCalculation(inputs, calculator) {
    const key = this.generateCacheKey('lbo', inputs);
    const cached = this.get(key);

    if (cached) {
      apiLogger.log('DEBUG', 'LBO calculation cache hit', { key });
      return cached;
    }

    const startTime = performance.now();
    const result = await calculator(inputs);
    const endTime = performance.now();

    this.performanceMetrics.computationTime += (endTime - startTime);

    // Cache result with longer TTL for complex calculations
    this.set(key, result, 600000); // 10 minutes for LBO

    apiLogger.log('DEBUG', 'LBO calculation cached', {
      key,
      computationTime: endTime - startTime
    });

    return result;
  }

  /**
   * Cached Monte Carlo simulation with partial result caching
   * @param {Object} inputs - Monte Carlo inputs
   * @param {Function} calculator - Monte Carlo calculation function
   * @returns {Object} Monte Carlo results
   */
  async cachedMonteCarloCalculation(inputs, calculator) {
    // For Monte Carlo, we can cache intermediate results and statistical parameters
    const baseKey = this.generateCacheKey('monte_carlo_base', {
      distributions: inputs.distributions,
      iterations: inputs.iterations,
      correlationMatrix: inputs.correlationMatrix
    });

    const cached = this.get(baseKey);

    if (cached && this.isMonteCarloResultValid(cached, inputs)) {
      apiLogger.log('DEBUG', 'Monte Carlo calculation cache hit', { baseKey });
      return cached;
    }

    const startTime = performance.now();

    // Check for partial results that can be reused
    const partialResults = this.getPartialMonteCarloResults(inputs);

    const result = await calculator(inputs, partialResults);
    const endTime = performance.now();

    this.performanceMetrics.computationTime += (endTime - startTime);

    // Cache result with shorter TTL for stochastic calculations
    this.set(baseKey, result, 180000); // 3 minutes for Monte Carlo

    // Cache intermediate statistical distributions for reuse
    this.cacheMonteCarloIntermediate(inputs, result);

    apiLogger.log('DEBUG', 'Monte Carlo calculation cached', {
      baseKey,
      computationTime: endTime - startTime,
      iterations: inputs.iterations
    });

    return result;
  }

  /**
   * Cache financial ratios with dependency tracking
   * @param {Object} inputs - Financial data inputs
   * @param {Function} calculator - Ratio calculation function
   * @returns {Object} Financial ratios
   */
  async cachedRatioCalculation(inputs, calculator) {
    const key = this.generateCacheKey('ratios', inputs);
    const cached = this.get(key);

    if (cached) {
      apiLogger.log('DEBUG', 'Ratio calculation cache hit', { key });
      return cached;
    }

    const startTime = performance.now();
    const result = await calculator(inputs);
    const endTime = performance.now();

    this.performanceMetrics.computationTime += (endTime - startTime);

    // Cache ratios with moderate TTL
    this.set(key, result, 300000); // 5 minutes for ratios

    return result;
  }

  /**
   * Batch cache operations for multiple related calculations
   * @param {Array} operations - Array of operations to cache
   * @returns {Array} Results array
   */
  async batchCachedOperations(operations) {
    const results = [];
    const uncachedOperations = [];

    // First pass: check cache for all operations
    for (const operation of operations) {
      const key = this.generateCacheKey(operation.type, operation.inputs);
      const cached = this.get(key);

      if (cached) {
        results.push({ ...operation, result: cached, fromCache: true });
      } else {
        uncachedOperations.push({ ...operation, key });
        results.push({ ...operation, result: null, fromCache: false });
      }
    }

    // Second pass: execute uncached operations in parallel
    if (uncachedOperations.length > 0) {
      const computePromises = uncachedOperations.map(async(op) => {
        const startTime = performance.now();
        const result = await op.calculator(op.inputs);
        const endTime = performance.now();

        this.performanceMetrics.computationTime += (endTime - startTime);
        this.set(op.key, result);

        return { ...op, result, computationTime: endTime - startTime };
      });

      const computedResults = await Promise.all(computePromises);

      // Merge computed results back into results array
      let computedIndex = 0;
      for (let i = 0; i < results.length; i++) {
        if (!results[i].fromCache) {
          results[i].result = computedResults[computedIndex].result;
          computedIndex++;
        }
      }
    }

    return results;
  }

  /**
   * Invalidate cache entries by pattern
   * @param {string} pattern - Pattern to match keys
   */
  invalidateByPattern(pattern) {
    const keysToDelete = [];

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    apiLogger.log('DEBUG', 'Cache invalidated by pattern', {
      pattern,
      keysDeleted: keysToDelete.length
    });
  }

  /**
   * Get cache performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    const hitRate = this.performanceMetrics.hits + this.performanceMetrics.misses > 0
      ? this.performanceMetrics.hits / (this.performanceMetrics.hits + this.performanceMetrics.misses)
      : 0;

    return {
      ...this.performanceMetrics,
      hitRate,
      cacheSize: this.cache.size,
      avgComputationTime: this.performanceMetrics.cacheOperations > 0
        ? this.performanceMetrics.computationTime / this.performanceMetrics.cacheOperations
        : 0
    };
  }

  /**
   * Clear cache and reset metrics
   */
  clear() {
    this.cache.clear();
    this.computationCache.clear();
    this.resultCache.clear();
    this.performanceMetrics = {
      hits: 0,
      misses: 0,
      computationTime: 0,
      cacheOperations: 0
    };

    apiLogger.log('INFO', 'Financial modeling cache cleared');
  }

  /**
   * Evict least recently used entries
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (value.lastAccessed < oldestTime) {
        oldestTime = value.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Deep clone object to prevent cache pollution
   * @param {Object} obj - Object to clone
   * @returns {Object} Cloned object
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  /**
   * Check if Monte Carlo result is still valid
   * @param {Object} cached - Cached result
   * @param {Object} inputs - Current inputs
   * @returns {boolean} Is valid
   */
  isMonteCarloResultValid(cached, inputs) {
    // Check if the random seed is the same (for reproducibility)
    if (inputs.randomSeed && cached.parameters?.randomSeed !== inputs.randomSeed) {
      return false;
    }

    // Check if iterations count matches
    if (cached.parameters?.iterations !== inputs.iterations) {
      return false;
    }

    return true;
  }

  /**
   * Get partial Monte Carlo results for reuse
   * @param {Object} inputs - Monte Carlo inputs
   * @returns {Object} Partial results
   */
  getPartialMonteCarloResults(inputs) {
    const partialKey = this.generateCacheKey('monte_carlo_partial', {
      distributionTypes: Object.keys(inputs.distributions),
      iterations: Math.floor(inputs.iterations / 2) // Check for half-iteration results
    });

    return this.get(partialKey);
  }

  /**
   * Cache Monte Carlo intermediate results
   * @param {Object} inputs - Original inputs
   * @param {Object} result - Full result
   */
  cacheMonteCarloIntermediate(inputs, result) {
    // Cache statistical distributions for potential reuse
    const distributionKey = this.generateCacheKey('monte_carlo_distributions', {
      distributionTypes: Object.keys(inputs.distributions),
      correlationMatrix: inputs.correlationMatrix
    });

    if (result.analysis?.statistics) {
      this.set(distributionKey, result.analysis.statistics, 600000); // 10 minutes
    }
  }

  /**
   * Precompute and cache common financial scenarios
   * @param {Array} scenarios - Common scenarios to precompute
   */
  async precomputeCommonScenarios(scenarios) {
    apiLogger.log('INFO', 'Starting precomputation of common scenarios', {
      scenarioCount: scenarios.length
    });

    const precomputePromises = scenarios.map(async(scenario) => {
      const key = this.generateCacheKey(scenario.type, scenario.inputs);

      if (!this.get(key)) {
        try {
          const result = await scenario.calculator(scenario.inputs);
          this.set(key, result, 1800000); // 30 minutes for precomputed scenarios

          return { scenario: scenario.name, success: true };
        } catch (error) {
          apiLogger.log('ERROR', 'Failed to precompute scenario', {
            scenario: scenario.name,
            error: error.message
          });
          return { scenario: scenario.name, success: false, error: error.message };
        }
      }

      return { scenario: scenario.name, success: true, fromCache: true };
    });

    const results = await Promise.all(precomputePromises);

    apiLogger.log('INFO', 'Completed precomputation of common scenarios', {
      results: results.filter(r => r.success).length,
      failures: results.filter(r => !r.success).length
    });

    return results;
  }

  /**
   * Setup cache warming for frequently used calculations
   * @param {Object} warmingConfig - Configuration for cache warming
   */
  setupCacheWarming(warmingConfig) {
    const { interval = 300000, scenarios = [] } = warmingConfig; // Default 5 minutes

    setInterval(async() => {
      try {
        await this.precomputeCommonScenarios(scenarios);
      } catch (error) {
        apiLogger.log('ERROR', 'Cache warming failed', { error: error.message });
      }
    }, interval);

    apiLogger.log('INFO', 'Cache warming configured', {
      interval,
      scenarioCount: scenarios.length
    });
  }

  /**
   * Export cache statistics for monitoring
   * @returns {Object} Cache statistics
   */
  exportStatistics() {
    const metrics = this.getPerformanceMetrics();
    const cacheDistribution = {};

    // Analyze cache key distribution
    for (const key of this.cache.keys()) {
      const operationType = key.split(':')[0];
      cacheDistribution[operationType] = (cacheDistribution[operationType] || 0) + 1;
    }

    return {
      metrics,
      cacheDistribution,
      memoryUsage: this.estimateMemoryUsage(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Estimate memory usage of cache
   * @returns {Object} Memory usage estimate
   */
  estimateMemoryUsage() {
    let totalSize = 0;
    let entryCount = 0;

    for (const [key, value] of this.cache.entries()) {
      // Rough estimation of memory usage
      totalSize += key.length * 2; // String character = 2 bytes
      totalSize += JSON.stringify(value).length * 2;
      entryCount++;
    }

    return {
      estimatedBytes: totalSize,
      estimatedKB: Math.round(totalSize / 1024),
      entryCount
    };
  }
}

// Export singleton instance
export const financialModelingCache = new FinancialModelingCache();
export default FinancialModelingCache;
