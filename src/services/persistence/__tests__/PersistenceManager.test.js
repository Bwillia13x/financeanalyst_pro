/**
 * Persistence Manager Tests
 * Comprehensive tests for the persistence layer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { PersistenceManager } from '../PersistenceManager';

// Mock dependencies
vi.mock('../LocalStorageService');
vi.mock('../IndexedDBService');
vi.mock('../SessionManager');
vi.mock('../DataMigrationService');

describe('PersistenceManager', () => {
  let persistenceManager;

  beforeEach(() => {
    Object.defineProperty(window, 'indexedDB', {
      value: {
        open: vi.fn(),
        deleteDatabase: vi.fn(),
        databases: vi.fn().mockResolvedValue([])
      },
      writable: true,
      configurable: true
    });
    vi.clearAllMocks();
    persistenceManager = new PersistenceManager();
    persistenceManager.localStorage = {
      initialize: vi.fn().mockResolvedValue({ success: true }),
      store: vi.fn().mockResolvedValue({ success: true }),
      retrieve: vi.fn().mockResolvedValue({ data: 'test' }),
      remove: vi.fn().mockResolvedValue(true),
      clear: vi.fn().mockResolvedValue(true),
      getStats: vi.fn().mockResolvedValue({ used: 1000, available: true }),
      exportAll: vi.fn().mockResolvedValue({}),
      importData: vi.fn().mockResolvedValue({ imported: 1 })
    };
    persistenceManager.indexedDB = {
      initialize: vi.fn().mockResolvedValue({ success: true }),
      store: vi.fn().mockResolvedValue({ success: true }),
      retrieve: vi.fn().mockResolvedValue({ data: 'test' }),
      remove: vi.fn().mockResolvedValue(true),
      clear: vi.fn().mockResolvedValue(true),
      getStats: vi.fn().mockResolvedValue({ used: 2000, available: true }),
      exportAll: vi.fn().mockResolvedValue({}),
      importData: vi.fn().mockResolvedValue({ imported: 1 })
    };
    persistenceManager.sessionManager = {
      initialize: vi.fn().mockResolvedValue({ success: true })
    };
    persistenceManager.migrationService = {
      checkAndMigrate: vi.fn().mockResolvedValue({ success: true })
    };
    Object.defineProperty(navigator, 'storage', {
      value: {
        estimate: vi.fn().mockResolvedValue({ quota: 1000000, usage: 50000 })
      },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async() => {
      const result = await persistenceManager.initialize();

      expect(result.success).toBe(true);
      expect(result.storageQuota).toBeDefined();
      expect(persistenceManager.isInitialized).toBe(true);
    });

    it('should handle initialization failure', async() => {
      persistenceManager.localStorage.initialize.mockRejectedValue(new Error('Init failed'));
      await expect(persistenceManager.initialize()).rejects.toThrow('Persistence initialization failed');
    });

    it('should not reinitialize if already initialized', async() => {
      await persistenceManager.initialize();
      const initSpy = vi.spyOn(persistenceManager.localStorage, 'initialize');

      await persistenceManager.initialize();

      expect(initSpy).not.toHaveBeenCalled();
    });
  });

  describe('Data Storage', () => {
    beforeEach(async() => {
      await persistenceManager.initialize();
    });

    it('should store data in localStorage for configured keys', async() => {
      const result = await persistenceManager.store('user_preferences', { theme: 'dark' });

      expect(persistenceManager.localStorage.store).toHaveBeenCalledWith(
        'user_preferences',
        { theme: 'dark' },
        expect.any(Object)
      );
      expect(result.success).toBe(true);
    });

    it('should store data in IndexedDB for configured keys', async() => {
      const result = await persistenceManager.store('watchlists', { tech: ['AAPL', 'MSFT'] });

      expect(persistenceManager.indexedDB.store).toHaveBeenCalledWith(
        'watchlists',
        { tech: ['AAPL', 'MSFT'] },
        expect.any(Object)
      );
      expect(result.success).toBe(true);
    });

    it('should handle storage options', async() => {
      await persistenceManager.store('test_key', 'test_data', {
        encrypt: true,
        compress: true,
        ttl: 3600000
      });

      expect(persistenceManager.localStorage.store).toHaveBeenCalledWith(
        'test_key',
        'test_data',
        expect.objectContaining({
          encrypt: true,
          ttl: 3600000
        })
      );
    });

    it('should notify listeners on store', async() => {
      const listener = vi.fn();
      persistenceManager.addEventListener('store', listener);

      await persistenceManager.store('test_key', 'test_data');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'test_key',
          storage: 'localStorage'
        })
      );
    });
  });

  describe('Data Retrieval', () => {
    beforeEach(async() => {
      await persistenceManager.initialize();
    });

    it('should retrieve data from localStorage', async() => {
      persistenceManager.localStorage.retrieve.mockResolvedValue({ data: 'test_data' });

      const result = await persistenceManager.retrieve('user_preferences');

      expect(persistenceManager.localStorage.retrieve).toHaveBeenCalledWith(
        'user_preferences',
        expect.any(Object)
      );
      expect(result).toBe('test_data');
    });

    it('should retrieve data from IndexedDB', async() => {
      persistenceManager.indexedDB.retrieve.mockResolvedValue({ data: 'test_data' });

      const result = await persistenceManager.retrieve('watchlists');

      expect(persistenceManager.indexedDB.retrieve).toHaveBeenCalledWith('watchlists');
      expect(result).toBe('test_data');
    });

    it('should handle TTL expiry', async() => {
      const expiredData = {
        data: 'test_data',
        metadata: {
          timestamp: Date.now() - 7200000, // 2 hours ago
          ttl: 3600000 // 1 hour TTL
        }
      };
      persistenceManager.localStorage.retrieve.mockResolvedValue(expiredData);

      const result = await persistenceManager.retrieve('test_key');

      expect(result).toBeNull();
      expect(persistenceManager.localStorage.remove).toHaveBeenCalledWith('test_key');
    });

    it('should return null for non-existent data', async() => {
      persistenceManager.localStorage.retrieve.mockResolvedValue(null);
      persistenceManager.indexedDB.retrieve.mockResolvedValue(null);

      const result = await persistenceManager.retrieve('non_existent');

      expect(result).toBeNull();
    });
  });

  describe('Data Removal', () => {
    beforeEach(async() => {
      await persistenceManager.initialize();
    });

    it('should remove data from both storage layers', async() => {
      await persistenceManager.remove('test_key');

      expect(persistenceManager.localStorage.remove).toHaveBeenCalledWith('test_key');
      expect(persistenceManager.indexedDB.remove).toHaveBeenCalledWith('test_key');
    });

    it('should remove data from specific storage layer', async() => {
      await persistenceManager.remove('test_key', { storage: 'localStorage' });

      expect(persistenceManager.localStorage.remove).toHaveBeenCalledWith('test_key');
      expect(persistenceManager.indexedDB.remove).not.toHaveBeenCalled();
    });

    it('should notify listeners on remove', async() => {
      const listener = vi.fn();
      persistenceManager.addEventListener('remove', listener);

      await persistenceManager.remove('test_key');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'test_key',
          storage: 'both'
        })
      );
    });
  });

  describe('Data Export/Import', () => {
    beforeEach(async() => {
      await persistenceManager.initialize();
    });

    it('should export all data', async() => {
      const mockLocalData = { key1: 'value1' };
      const mockIndexedData = { key2: 'value2' };

      persistenceManager.localStorage.exportAll.mockResolvedValue(mockLocalData);
      persistenceManager.indexedDB.exportAll.mockResolvedValue(mockIndexedData);

      const result = await persistenceManager.exportData();

      expect(result.data.localStorage).toEqual(mockLocalData);
      expect(result.data.indexedDB).toEqual(mockIndexedData);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should include metadata in export', async() => {
      const result = await persistenceManager.exportData({ includeMetadata: true });

      expect(result.data.metadata).toBeDefined();
      expect(result.data.metadata.userAgent).toBeDefined();
      expect(result.data.metadata.storageStats).toBeDefined();
    });

    it('should import data successfully', async() => {
      const importData = {
        version: '1.0',
        localStorage: { key1: 'value1' },
        indexedDB: { key2: 'value2' }
      };

      const result = await persistenceManager.importData(importData);

      expect(result.success).toBe(true);
      expect(persistenceManager.localStorage.importData).toHaveBeenCalledWith(
        importData.localStorage,
        expect.any(Object)
      );
      expect(persistenceManager.indexedDB.importData).toHaveBeenCalledWith(
        importData.indexedDB,
        expect.any(Object)
      );
    });

    it('should validate import data', async() => {
      const invalidData = { invalid: true };

      await expect(persistenceManager.importData(invalidData)).rejects.toThrow('Invalid import data format');
    });

    it('should create backup before import', async() => {
      const importData = {
        version: '1.0',
        localStorage: {},
        indexedDB: {}
      };

      await persistenceManager.importData(importData, { backup: true });

      expect(persistenceManager.indexedDB.store).toHaveBeenCalledWith(
        'backup_before_import',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('Storage Statistics', () => {
    beforeEach(async() => {
      await persistenceManager.initialize();
    });

    it('should get storage statistics', async() => {
      const stats = await persistenceManager.getStorageStats();

      expect(stats.localStorage).toBeDefined();
      expect(stats.indexedDB).toBeDefined();
      expect(stats.total).toBeDefined();
      expect(stats.total.used).toBeGreaterThanOrEqual(0);
    });

    it('should calculate usage percentage', async() => {
      persistenceManager.storageQuota = 1000000;

      const stats = await persistenceManager.getStorageStats();

      expect(stats.total.usagePercentage).toBeGreaterThanOrEqual(0);
      expect(stats.total.usagePercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove event listeners', () => {
      const listener = vi.fn();

      persistenceManager.addEventListener('test', listener);
      expect(persistenceManager.listeners.get('test')).toContain(listener);

      persistenceManager.removeEventListener('test', listener);
      expect(persistenceManager.listeners.get('test')).not.toContain(listener);
    });

    it('should handle listener errors gracefully', async() => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      persistenceManager.addEventListener('store', errorListener);

      // Should not throw
      await expect(persistenceManager.store('test', 'data')).resolves.toBeDefined();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async() => {
      await persistenceManager.initialize();
    });

    it('should handle storage errors gracefully', async() => {
      persistenceManager.localStorage.store.mockRejectedValue(new Error('Storage full'));

      await expect(persistenceManager.store('test', 'data')).rejects.toThrow('Storage full');
    });

    it('should handle retrieval errors gracefully', async() => {
      persistenceManager.localStorage.retrieve.mockRejectedValue(new Error('Read error'));

      const result = await persistenceManager.retrieve('test');

      expect(result).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    beforeEach(async() => {
      await persistenceManager.initialize();
    });

    it('should handle complete data lifecycle', async() => {
      const testData = {
        watchlists: { tech: ['AAPL', 'MSFT'] },
        preferences: { theme: 'dark' }
      };

      // Store data
      await persistenceManager.store('watchlists', testData.watchlists);
      await persistenceManager.store('user_preferences', testData.preferences);

      // Retrieve data
      const retrievedWatchlists = await persistenceManager.retrieve('watchlists');
      const retrievedPreferences = await persistenceManager.retrieve('user_preferences');

      expect(retrievedWatchlists).toEqual('test'); // Mocked response
      expect(retrievedPreferences).toEqual('test'); // Mocked response

      // Export data
      const exportResult = await persistenceManager.exportData();
      expect(exportResult.data.localStorage).toEqual({});
      expect(exportResult.data.indexedDB).toEqual({});
      expect(exportResult.size).toBeGreaterThan(0);

      // Remove data
      await persistenceManager.remove('watchlists');
      await persistenceManager.remove('user_preferences');

      expect(persistenceManager.localStorage.remove).toHaveBeenCalled();
      expect(persistenceManager.indexedDB.remove).toHaveBeenCalled();
    });

    it('should handle concurrent operations', async() => {
      const operations = [
        persistenceManager.store('key1', 'value1'),
        persistenceManager.store('key2', 'value2'),
        persistenceManager.store('key3', 'value3')
      ];

      const results = await Promise.all(operations);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should maintain data consistency across storage layers', async() => {
      // Test that data is stored in the correct layer based on strategy
      await persistenceManager.store('user_preferences', { theme: 'dark' });
      await persistenceManager.store('watchlists', { tech: ['AAPL'] });

      expect(persistenceManager.localStorage.store).toHaveBeenCalledWith(
        'user_preferences',
        expect.any(Object),
        expect.any(Object)
      );
      expect(persistenceManager.indexedDB.store).toHaveBeenCalledWith(
        'watchlists',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });
});
