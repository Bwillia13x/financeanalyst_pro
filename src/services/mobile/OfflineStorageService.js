/**
 * Offline Storage Service
 * Advanced offline storage management with IndexedDB and cache strategies
 * Handles data persistence, synchronization, and offline-first architecture
 */

class OfflineStorageService {
  constructor(options = {}) {
    this.options = {
      enableIndexedDB: true,
      enableCacheStorage: true,
      enableSync: true,
      dbName: 'FinanceAnalystDB',
      dbVersion: 1,
      maxStorageSize: 50 * 1024 * 1024, // 50MB
      syncInterval: 5 * 60 * 1000, // 5 minutes
      ...options
    };

    this.db = null;
    this.isInitialized = false;
    this.syncQueue = [];
    this.storageQuota = { used: 0, available: 0 };
  }

  /**
   * Initialize the offline storage service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.openDatabase();
      await this.setupObjectStores();
      this.setupSyncMechanism();
      await this.updateStorageQuota();
      this.setupCleanupMechanism();

      this.isInitialized = true;
      console.log('Offline Storage Service initialized');
    } catch (error) {
      console.error('Failed to initialize Offline Storage Service:', error);
    }
  }

  /**
   * Open IndexedDB database
   */
  async openDatabase() {
    if (!this.options.enableIndexedDB || !('indexedDB' in window)) {
      throw new Error('IndexedDB is not supported');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.options.dbName, this.options.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = event => {
        this.db = event.target.result;
        console.log('IndexedDB opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = event => {
        const db = event.target.result;
        this.handleDatabaseUpgrade(db, event.oldVersion, event.newVersion);
      };
    });
  }

  /**
   * Handle database upgrade
   */
  handleDatabaseUpgrade(db, oldVersion, newVersion) {
    console.log(`Upgrading database from ${oldVersion} to ${newVersion}`);

    // Create object stores
    if (!db.objectStoreNames.contains('marketData')) {
      const marketDataStore = db.createObjectStore('marketData', { keyPath: 'id' });
      marketDataStore.createIndex('symbol', 'symbol', { unique: false });
      marketDataStore.createIndex('timestamp', 'timestamp', { unique: false });
    }

    if (!db.objectStoreNames.contains('portfolio')) {
      const portfolioStore = db.createObjectStore('portfolio', { keyPath: 'id' });
      portfolioStore.createIndex('userId', 'userId', { unique: false });
      portfolioStore.createIndex('symbol', 'symbol', { unique: false });
    }

    if (!db.objectStoreNames.contains('userPreferences')) {
      db.createObjectStore('userPreferences', { keyPath: 'userId' });
    }

    if (!db.objectStoreNames.contains('syncQueue')) {
      const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
      syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      syncStore.createIndex('priority', 'priority', { unique: false });
    }

    if (!db.objectStoreNames.contains('cache')) {
      const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
      cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
      cacheStore.createIndex('ttl', 'ttl', { unique: false });
    }

    if (!db.objectStoreNames.contains('analytics')) {
      const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id' });
      analyticsStore.createIndex('event', 'event', { unique: false });
      analyticsStore.createIndex('timestamp', 'timestamp', { unique: false });
    }
  }

  /**
   * Setup object stores with initial data
   */
  async setupObjectStores() {
    // Setup is handled in upgrade callback
  }

  /**
   * Setup sync mechanism
   */
  setupSyncMechanism() {
    if (!this.options.enableSync) return;

    // Sync with server periodically
    setInterval(() => {
      this.syncWithServer();
    }, this.options.syncInterval);

    // Sync when coming online
    window.addEventListener('online', () => {
      this.syncWithServer();
    });

    // Setup background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      this.setupBackgroundSync();
    }
  }

  /**
   * Setup cleanup mechanism
   */
  setupCleanupMechanism() {
    // Clean up expired data daily
    setInterval(
      () => {
        this.cleanupExpiredData();
      },
      24 * 60 * 60 * 1000
    );

    // Clean up old analytics weekly
    setInterval(
      () => {
        this.cleanupOldAnalytics();
      },
      7 * 24 * 60 * 60 * 1000
    );
  }

  /**
   * Store market data
   */
  async storeMarketData(data) {
    const marketData = {
      id: `${data.symbol}_${Date.now()}`,
      symbol: data.symbol,
      price: data.price,
      change: data.change,
      volume: data.volume,
      timestamp: Date.now(),
      source: data.source || 'api'
    };

    await this.store('marketData', marketData);
    this.emit('marketDataStored', marketData);

    return marketData.id;
  }

  /**
   * Get market data
   */
  async getMarketData(symbol, limit = 100) {
    return this.getAll('marketData', 'symbol', symbol, limit);
  }

  /**
   * Store portfolio data
   */
  async storePortfolioData(data) {
    const portfolioData = {
      id: `${data.userId}_${data.symbol}_${Date.now()}`,
      userId: data.userId,
      symbol: data.symbol,
      quantity: data.quantity,
      averagePrice: data.averagePrice,
      currentPrice: data.currentPrice,
      timestamp: Date.now()
    };

    await this.store('portfolio', portfolioData);
    this.emit('portfolioDataStored', portfolioData);

    return portfolioData.id;
  }

  /**
   * Get portfolio data
   */
  async getPortfolioData(userId) {
    return this.getAll('portfolio', 'userId', userId);
  }

  /**
   * Store user preferences
   */
  async storeUserPreferences(userId, preferences) {
    const data = {
      userId,
      preferences,
      timestamp: Date.now(),
      version: 1
    };

    await this.store('userPreferences', data);
    this.emit('preferencesStored', data);

    return data;
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId) {
    const data = await this.get('userPreferences', userId);
    return data ? data.preferences : null;
  }

  /**
   * Cache data with TTL
   */
  async cacheData(key, data, ttl = 3600000) {
    // 1 hour default
    const cacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
      expiresAt: Date.now() + ttl
    };

    await this.store('cache', cacheEntry);
    this.emit('dataCached', { key, ttl });

    return key;
  }

  /**
   * Get cached data
   */
  async getCachedData(key) {
    const data = await this.get('cache', key);

    if (!data) return null;

    // Check if expired
    if (Date.now() > data.expiresAt) {
      await this.remove('cache', key);
      return null;
    }

    return data.data;
  }

  /**
   * Queue operation for sync
   */
  async queueForSync(operation) {
    const syncItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      timestamp: Date.now(),
      priority: operation.priority || 'normal',
      retries: 0,
      maxRetries: 3
    };

    await this.store('syncQueue', syncItem);
    this.syncQueue.push(syncItem);

    this.emit('operationQueued', syncItem);

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.processSyncQueue();
    }

    return syncItem.id;
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (this.syncQueue.length === 0) return;

    const item = this.syncQueue.shift();

    try {
      await this.executeSyncOperation(item.operation);
      await this.remove('syncQueue', item.id);
      this.emit('operationSynced', item);
    } catch (error) {
      item.retries++;

      if (item.retries < item.maxRetries) {
        // Re-queue with backoff
        setTimeout(
          () => {
            this.syncQueue.unshift(item);
          },
          Math.pow(2, item.retries) * 1000
        );
      } else {
        // Mark as failed
        item.status = 'failed';
        await this.store('syncQueue', item);
        this.emit('operationFailed', { item, error });
      }
    }
  }

  /**
   * Execute sync operation
   */
  async executeSyncOperation(operation) {
    const { type, data } = operation;

    switch (type) {
      case 'storeMarketData':
        await this.storeMarketData(data);
        break;
      case 'storePortfolioData':
        await this.storePortfolioData(data);
        break;
      case 'updatePreferences':
        await this.storeUserPreferences(data.userId, data.preferences);
        break;
      default:
        throw new Error(`Unknown sync operation: ${type}`);
    }
  }

  /**
   * Sync with server
   */
  async syncWithServer() {
    if (!navigator.onLine) return;

    try {
      // Sync queued operations
      await this.processSyncQueue();

      // Sync latest data
      await this.syncLatestData();

      this.emit('serverSynced', { timestamp: Date.now() });
    } catch (error) {
      console.error('Server sync failed:', error);
      this.emit('syncFailed', error);
    }
  }

  /**
   * Sync latest data from server
   */
  async syncLatestData() {
    try {
      // Get latest market data
      const marketData = await this.fetchLatestMarketData();
      for (const data of marketData) {
        await this.storeMarketData(data);
      }

      // Get latest portfolio data
      const portfolioData = await this.fetchLatestPortfolioData();
      for (const data of portfolioData) {
        await this.storePortfolioData(data);
      }

      this.emit('dataSynced', {
        marketDataCount: marketData.length,
        portfolioDataCount: portfolioData.length
      });
    } catch (error) {
      console.error('Data sync failed:', error);
    }
  }

  /**
   * Fetch latest market data (mock)
   */
  async fetchLatestMarketData() {
    // In production, fetch from API
    return [];
  }

  /**
   * Fetch latest portfolio data (mock)
   */
  async fetchLatestPortfolioData() {
    // In production, fetch from API
    return [];
  }

  /**
   * Setup background sync
   */
  setupBackgroundSync() {
    navigator.serviceWorker.ready.then(registration => {
      if ('sync' in registration) {
        // Register background sync
        registration.sync.register('data-sync');
      }
    });
  }

  /**
   * Store analytics event
   */
  async storeAnalyticsEvent(event) {
    const analyticsData = {
      id: `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event: event.name,
      data: event.data,
      timestamp: Date.now(),
      userId: event.userId,
      sessionId: event.sessionId
    };

    await this.store('analytics', analyticsData);
    this.emit('analyticsStored', analyticsData);

    return analyticsData.id;
  }

  /**
   * Get analytics data
   */
  async getAnalyticsData(eventType = null, limit = 1000) {
    if (eventType) {
      return this.getAll('analytics', 'event', eventType, limit);
    }
    return this.getAll('analytics', null, null, limit);
  }

  /**
   * Generic store method
   */
  async store(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic get method
   */
  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic get all method with optional index filtering
   */
  async getAll(storeName, indexName = null, indexValue = null, limit = null) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      let request;
      if (indexName && indexValue !== null) {
        const index = store.index(indexName);
        request = index.getAll(indexValue);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let results = request.result;
        if (limit) {
          results = results.slice(-limit);
        }
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic remove method
   */
  async remove(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear store
   */
  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update storage quota information
   */
  async updateStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        this.storageQuota = {
          used: estimate.usage || 0,
          available: estimate.quota || 0,
          percentage: estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0
        };
      } catch (error) {
        console.error('Failed to get storage estimate:', error);
      }
    }
  }

  /**
   * Cleanup expired data
   */
  async cleanupExpiredData() {
    const now = Date.now();

    // Cleanup expired cache entries
    const cacheEntries = await this.getAll('cache');
    for (const entry of cacheEntries) {
      if (now > entry.expiresAt) {
        await this.remove('cache', entry.key);
      }
    }

    // Cleanup old sync queue items (older than 7 days)
    const oldSyncItems = await this.getAll('syncQueue');
    const cutoff = now - 7 * 24 * 60 * 60 * 1000;
    for (const item of oldSyncItems) {
      if (item.timestamp < cutoff && item.status === 'failed') {
        await this.remove('syncQueue', item.id);
      }
    }

    this.emit('cleanupCompleted', { timestamp: now });
  }

  /**
   * Cleanup old analytics data
   */
  async cleanupOldAnalytics() {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
    const oldAnalytics = await this.getAll('analytics');

    let deletedCount = 0;
    for (const item of oldAnalytics) {
      if (item.timestamp < cutoff) {
        await this.remove('analytics', item.id);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old analytics entries`);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    await this.updateStorageQuota();

    const stats = {
      quota: this.storageQuota,
      data: {}
    };

    // Get counts for each store
    const stores = [
      'marketData',
      'portfolio',
      'userPreferences',
      'syncQueue',
      'cache',
      'analytics'
    ];
    for (const store of stores) {
      try {
        const count = await this.getCount(store);
        stats.data[store] = count;
      } catch (error) {
        stats.data[store] = 0;
      }
    }

    return stats;
  }

  /**
   * Get count of items in store
   */
  async getCount(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Export data for backup
   */
  async exportData() {
    const exportData = {
      timestamp: Date.now(),
      version: this.options.dbVersion,
      stores: {}
    };

    const stores = ['marketData', 'portfolio', 'userPreferences', 'analytics'];

    for (const store of stores) {
      exportData.stores[store] = await this.getAll(store);
    }

    return exportData;
  }

  /**
   * Import data from backup
   */
  async importData(importData) {
    const { stores } = importData;

    for (const [storeName, data] of Object.entries(stores)) {
      for (const item of data) {
        await this.store(storeName, item);
      }
    }

    this.emit('dataImported', { importedStores: Object.keys(stores) });
  }

  /**
   * Event emitter functionality
   */
  on(event, callback) {
    if (!this.eventListeners) {
      this.eventListeners = new Map();
    }

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    if (!this.eventListeners || !this.eventListeners.has(event)) return;

    this.eventListeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in offline storage ${event} callback:`, error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    this.syncQueue = [];
    this.isInitialized = false;
    console.log('Offline Storage Service cleaned up');
  }
}

// Export singleton instance
export const offlineStorageService = new OfflineStorageService();
export default OfflineStorageService;
