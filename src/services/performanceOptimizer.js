/**
 * Performance Optimization Service
 * Implements comprehensive caching, lazy loading, and performance monitoring
 */

class PerformanceOptimizer {
  constructor() {
    this.caches = new Map();
    this.performanceMetrics = new Map();
    this.optimizationRules = new Map();
    this.resourcePool = new Map();
    this.loadingStates = new Map();
    this.isInitialized = false;

    this.initializeOptimizer();
  }

  async initializeOptimizer() {
    try {
      this.setupCachingStrategies();
      this.setupLazyLoadingRules();
      this.setupResourcePooling();
      this.startPerformanceMonitoring();

      this.isInitialized = true;
      console.log('Performance optimizer initialized with enterprise-grade caching');
    } catch (error) {
      console.error('Error initializing performance optimizer:', error);
    }
  }

  setupCachingStrategies() {
    // Financial Data Cache
    this.registerCache('financial_data', {
      maxSize: 100,
      ttl: 300000, // 5 minutes
      strategy: 'lru',
      compression: true,
      persistent: false
    });

    // Market Data Cache
    this.registerCache('market_data', {
      maxSize: 500,
      ttl: 30000, // 30 seconds
      strategy: 'lfu',
      compression: false,
      persistent: false
    });

    // API Response Cache
    this.registerCache('api_responses', {
      maxSize: 200,
      ttl: 600000, // 10 minutes
      strategy: 'lru',
      compression: true,
      persistent: true
    });

    // User Session Cache
    this.registerCache('user_sessions', {
      maxSize: 1000,
      ttl: 3600000, // 1 hour
      strategy: 'lru',
      compression: false,
      persistent: true
    });

    // Calculation Results Cache
    this.registerCache('calculations', {
      maxSize: 50,
      ttl: 900000, // 15 minutes
      strategy: 'lru',
      compression: true,
      persistent: false
    });

    // Static Assets Cache
    this.registerCache('static_assets', {
      maxSize: 1000,
      ttl: 86400000, // 24 hours
      strategy: 'lfu',
      compression: true,
      persistent: true
    });
  }

  setupLazyLoadingRules() {
    this.optimizationRules.set('components', {
      privateAnalysis: { threshold: 'viewport', preload: false },
      marketData: { threshold: 'interaction', preload: true },
      reports: { threshold: 'demand', preload: false },
      dashboards: { threshold: 'viewport', preload: true },
      collaboration: { threshold: 'interaction', preload: false }
    });

    this.optimizationRules.set('data', {
      financialStatements: { batchSize: 10, chunkSize: 1000 },
      marketPrices: { batchSize: 50, chunkSize: 100 },
      chartData: { batchSize: 5, chunkSize: 500 },
      reports: { batchSize: 3, chunkSize: 2000 }
    });
  }

  setupResourcePooling() {
    // WebWorker Pool for calculations
    this.resourcePool.set('webworkers', {
      type: 'webworker',
      maxInstances: navigator.hardwareConcurrency || 4,
      active: new Set(),
      idle: new Set(),
      pending: []
    });

    // Database Connection Pool
    this.resourcePool.set('db_connections', {
      type: 'connection',
      maxInstances: 10,
      active: new Set(),
      idle: new Set(),
      pending: []
    });

    // HTTP Request Pool
    this.resourcePool.set('http_requests', {
      type: 'http',
      maxInstances: 20,
      active: new Set(),
      idle: new Set(),
      pending: []
    });
  }

  registerCache(cacheId, config) {
    const cache = {
      id: cacheId,
      data: new Map(),
      metadata: new Map(),
      config,
      stats: {
        hits: 0,
        misses: 0,
        size: 0,
        evictions: 0
      },
      createdAt: new Date().toISOString()
    };

    this.caches.set(cacheId, cache);

    // Setup TTL cleanup for this cache
    if (config.ttl) {
      setInterval(() => this.cleanupExpiredEntries(cacheId), config.ttl / 2);
    }

    return cache;
  }

  async get(cacheId, key, fallbackFn = null) {
    const cache = this.caches.get(cacheId);
    if (!cache) return fallbackFn ? await fallbackFn() : null;

    // Check if key exists and is not expired
    if (cache.data.has(key)) {
      const metadata = cache.metadata.get(key);
      const now = Date.now();

      if (!metadata.expiresAt || now < metadata.expiresAt) {
        // Update access info for LRU/LFU
        metadata.lastAccessed = now;
        metadata.accessCount = (metadata.accessCount || 0) + 1;
        cache.stats.hits++;

        let value = cache.data.get(key);

        // Decompress if needed
        if (cache.config.compression && metadata.compressed) {
          value = await this.decompress(value);
        }

        return value;
      } else {
        // Remove expired entry
        cache.data.delete(key);
        cache.metadata.delete(key);
        cache.stats.size--;
      }
    }

    cache.stats.misses++;

    // If fallback function provided, fetch and cache the result
    if (fallbackFn) {
      try {
        const value = await fallbackFn();
        await this.set(cacheId, key, value);
        return value;
      } catch (error) {
        console.error(`Error in cache fallback for ${cacheId}:${key}`, error);
        return null;
      }
    }

    return null;
  }

  async set(cacheId, key, value, options = {}) {
    const cache = this.caches.get(cacheId);
    if (!cache) return false;

    const now = Date.now();
    const ttl = options.ttl || cache.config.ttl;

    let processedValue = value;
    let compressed = false;

    // Compress if needed
    if (cache.config.compression && this.shouldCompress(value)) {
      processedValue = await this.compress(value);
      compressed = true;
    }

    const metadata = {
      key,
      size: this.calculateSize(processedValue),
      createdAt: now,
      lastAccessed: now,
      accessCount: 1,
      expiresAt: ttl ? now + ttl : null,
      compressed,
      options
    };

    // Check if cache is full and needs eviction
    if (cache.stats.size >= cache.config.maxSize) {
      await this.evictEntries(cacheId, 1);
    }

    cache.data.set(key, processedValue);
    cache.metadata.set(key, metadata);
    cache.stats.size++;

    // Persist if configured
    if (cache.config.persistent) {
      await this.persistCacheEntry(cacheId, key, processedValue, metadata);
    }

    return true;
  }

  async evictEntries(cacheId, count = 1) {
    const cache = this.caches.get(cacheId);
    if (!cache) return;

    const entries = Array.from(cache.metadata.entries());
    let toEvict = [];

    switch (cache.config.strategy) {
      case 'lru': // Least Recently Used
        toEvict = entries
          .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
          .slice(0, count);
        break;

      case 'lfu': // Least Frequently Used
        toEvict = entries
          .sort(([, a], [, b]) => a.accessCount - b.accessCount)
          .slice(0, count);
        break;

      case 'fifo': // First In, First Out
        toEvict = entries
          .sort(([, a], [, b]) => a.createdAt - b.createdAt)
          .slice(0, count);
        break;

      default:
        toEvict = entries.slice(0, count);
    }

    for (const [key] of toEvict) {
      cache.data.delete(key);
      cache.metadata.delete(key);
      cache.stats.size--;
      cache.stats.evictions++;
    }
  }

  cleanupExpiredEntries(cacheId) {
    const cache = this.caches.get(cacheId);
    if (!cache) return;

    const now = Date.now();
    const expiredKeys = [];

    for (const [key, metadata] of cache.metadata) {
      if (metadata.expiresAt && now >= metadata.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      cache.data.delete(key);
      cache.metadata.delete(key);
      cache.stats.size--;
    }
  }

  async lazyLoad(componentId, loader, options = {}) {
    const loadingKey = `${componentId}_${options.key || 'default'}`;

    // Return cached loading promise if already loading
    if (this.loadingStates.has(loadingKey)) {
      return this.loadingStates.get(loadingKey);
    }

    const loadingPromise = this.executeLoader(componentId, loader, options);
    this.loadingStates.set(loadingKey, loadingPromise);

    try {
      const result = await loadingPromise;
      return result;
    } finally {
      this.loadingStates.delete(loadingKey);
    }
  }

  async executeLoader(componentId, loader, options) {
    const rules = this.optimizationRules.get('components')[componentId];
    if (!rules) return loader();

    // Check threshold conditions
    switch (rules.threshold) {
      case 'viewport':
        if (!this.isInViewport(options.element)) {
          await this.waitForViewport(options.element);
        }
        break;

      case 'interaction':
        if (!options.triggered) {
          await this.waitForInteraction(options.element);
        }
        break;

      case 'demand':
        // Load only when explicitly requested
        break;
    }

    return loader();
  }

  async batchLoad(requests, options = {}) {
    const batchSize = options.batchSize || 5;
    const results = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(request =>
        this.loadWithRetry(request.loader, request.options)
      );

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to prevent overwhelming
      if (i + batchSize < requests.length) {
        await this.delay(options.batchDelay || 10);
      }
    }

    return results;
  }

  async loadWithRetry(loader, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await loader();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        await this.delay(retryDelay * Math.pow(2, attempt - 1));
      }
    }
  }

  startPerformanceMonitoring() {
    // Monitor cache performance
    setInterval(() => {
      this.collectCacheMetrics();
    }, 60000); // Every minute

    // Monitor resource usage
    setInterval(() => {
      this.collectResourceMetrics();
    }, 30000); // Every 30 seconds

    // Setup performance observers
    this.setupPerformanceObservers();
  }

  collectCacheMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      caches: {}
    };

    for (const [cacheId, cache] of this.caches) {
      metrics.caches[cacheId] = {
        ...cache.stats,
        hitRate: cache.stats.hits / (cache.stats.hits + cache.stats.misses) || 0,
        size: cache.stats.size,
        maxSize: cache.config.maxSize,
        utilizationRate: cache.stats.size / cache.config.maxSize
      };
    }

    this.performanceMetrics.set(`cache_${Date.now()}`, metrics);
  }

  collectResourceMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      memory: this.getMemoryUsage(),
      resources: {}
    };

    for (const [poolId, pool] of this.resourcePool) {
      metrics.resources[poolId] = {
        active: pool.active.size,
        idle: pool.idle.size,
        pending: pool.pending.length,
        maxInstances: pool.maxInstances,
        utilizationRate: pool.active.size / pool.maxInstances
      };
    }

    this.performanceMetrics.set(`resource_${Date.now()}`, metrics);
  }

  setupPerformanceObservers() {
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('lcp', entry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('fid', entry.processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.recordMetric('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  recordMetric(name, value) {
    const metrics = this.performanceMetrics.get('web_vitals') || {};
    metrics[name] = value;
    metrics.timestamp = new Date().toISOString();
    this.performanceMetrics.set('web_vitals', metrics);
  }

  // Utility Methods
  shouldCompress(value) {
    const size = this.calculateSize(value);
    return size > 1024; // Compress if larger than 1KB
  }

  async compress(data) {
    // Simple compression simulation
    const compressed = JSON.stringify(data);
    return `compressed:${compressed}`;
  }

  async decompress(compressedData) {
    if (typeof compressedData === 'string' && compressedData.startsWith('compressed:')) {
      return JSON.parse(compressedData.substring(11));
    }
    return compressedData;
  }

  calculateSize(value) {
    return JSON.stringify(value).length;
  }

  isInViewport(element) {
    if (!element) return true;
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  async waitForViewport(element) {
    return new Promise((resolve) => {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(element);
    });
  }

  async waitForInteraction(element) {
    return new Promise((resolve) => {
      const handler = () => {
        element.removeEventListener('click', handler);
        element.removeEventListener('focus', handler);
        resolve();
      };
      element.addEventListener('click', handler);
      element.addEventListener('focus', handler);
    });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMemoryUsage() {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }
    return { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };
  }

  async persistCacheEntry(cacheId, key, value, metadata) {
    try {
      const storageKey = `cache_${cacheId}_${key}`;
      const data = { value, metadata };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist cache entry:', error);
    }
  }

  // Public API
  getCacheStats(cacheId = null) {
    if (cacheId) {
      const cache = this.caches.get(cacheId);
      return cache ? cache.stats : null;
    }

    const stats = {};
    for (const [id, cache] of this.caches) {
      stats[id] = cache.stats;
    }
    return stats;
  }

  getPerformanceMetrics() {
    return Array.from(this.performanceMetrics.values());
  }

  clearCache(cacheId) {
    const cache = this.caches.get(cacheId);
    if (cache) {
      cache.data.clear();
      cache.metadata.clear();
      cache.stats.size = 0;
      return true;
    }
    return false;
  }

  optimizeForDevice() {
    const deviceInfo = {
      memory: navigator.deviceMemory || 4,
      cores: navigator.hardwareConcurrency || 4,
      connection: navigator.connection?.effectiveType || '4g'
    };

    // Adjust cache sizes based on device capability
    if (deviceInfo.memory < 4) {
      // Low memory device - reduce cache sizes
      for (const [, cache] of this.caches) {
        cache.config.maxSize = Math.floor(cache.config.maxSize * 0.5);
      }
    }

    // Adjust worker pool based on cores
    const workerPool = this.resourcePool.get('webworkers');
    if (workerPool) {
      workerPool.maxInstances = Math.min(deviceInfo.cores, 8);
    }

    return deviceInfo;
  }
}

export default new PerformanceOptimizer();
