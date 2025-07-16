/**
 * Tests for Enhanced Storage Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { storageService } from '../storageService.js';

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: vi.fn((key) => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
  get length() {
    return Object.keys(localStorageMock.store).length;
  },
  key: vi.fn((index) => Object.keys(localStorageMock.store)[index] || null)
};

// Mock navigator.storage
const navigatorStorageMock = {
  estimate: vi.fn(() => Promise.resolve({
    quota: 50 * 1024 * 1024, // 50MB
    usage: 10 * 1024 * 1024   // 10MB
  }))
};

describe('StorageService', () => {
  beforeEach(() => {
    // Setup mocks
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    Object.defineProperty(navigator, 'storage', {
      value: navigatorStorageMock,
      writable: true
    });

    // Clear storage before each test
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Basic Storage Operations', () => {
    it('should store and retrieve data', async() => {
      const testData = { test: 'value', number: 42 };

      await storageService.setItem('test', 'item1', testData);
      const retrieved = await storageService.getItem('test', 'item1');

      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent items', async() => {
      const result = await storageService.getItem('test', 'nonexistent');
      expect(result).toBeNull();
    });

    it('should remove items', async() => {
      const testData = { test: 'value' };

      await storageService.setItem('test', 'item1', testData);
      expect(await storageService.getItem('test', 'item1')).toEqual(testData);

      storageService.removeItem('test', 'item1');
      expect(await storageService.getItem('test', 'item1')).toBeNull();
    });

    it('should list items of a specific type', async() => {
      await storageService.setItem('test', 'item1', { data: 1 });
      await storageService.setItem('test', 'item2', { data: 2 });
      await storageService.setItem('other', 'item3', { data: 3 });

      const testItems = storageService.listItems('test');
      expect(testItems).toHaveLength(2);
      expect(testItems).toContain('item1');
      expect(testItems).toContain('item2');
    });
  });

  describe('Data Validation', () => {
    it('should validate DCF model data', async() => {
      const validDCFData = {
        symbol: 'AAPL',
        assumptions: { growthRate: 0.05 },
        projections: { revenues: [100, 105, 110] },
        valuation: { intrinsicValue: 150 },
        metadata: { createdAt: Date.now() }
      };

      await expect(storageService.setItem('dcfModel', 'AAPL', validDCFData))
        .resolves.toBe(true);
    });

    it('should reject invalid DCF model data', async() => {
      const invalidDCFData = {
        symbol: 'AAPL',
        // Missing required fields: assumptions, projections, valuation
        metadata: { createdAt: Date.now() }
      };

      await expect(storageService.setItem('dcfModel', 'AAPL', invalidDCFData))
        .rejects.toThrow('Missing required field');
    });

    it('should validate LBO model data', async() => {
      const validLBOData = {
        symbol: 'AAPL',
        transaction: { purchasePrice: 1000 },
        financing: { debt: 600, equity: 400 },
        returns: { irr: 0.25, moic: 2.5 },
        metadata: { createdAt: Date.now() }
      };

      await expect(storageService.setItem('lboModel', 'AAPL', validLBOData))
        .resolves.toBe(true);
    });

    it('should validate Monte Carlo results data', async() => {
      const validMCData = {
        modelType: 'DCF',
        iterations: 10000,
        results: [150, 155, 145, 160],
        statistics: { mean: 152.5, stdDev: 6.45 },
        metadata: { createdAt: Date.now() }
      };

      await expect(storageService.setItem('monteCarloResults', 'test1', validMCData))
        .resolves.toBe(true);
    });
  });

  describe('Compression', () => {
    it('should handle compression for large data', async() => {
      const largeData = {
        symbol: 'AAPL',
        assumptions: {},
        projections: {},
        valuation: {},
        metadata: {
          largeArray: new Array(1000).fill('test data string')
        }
      };

      await storageService.setItem('dcfModel', 'AAPL', largeData);
      const retrieved = await storageService.getItem('dcfModel', 'AAPL');

      expect(retrieved).toEqual(largeData);
    });

    it('should not compress small data', async() => {
      const smallData = { test: 'small' };

      await storageService.setItem('test', 'small', smallData);

      // Check that data was stored (compression details are internal)
      const retrieved = await storageService.getItem('test', 'small');
      expect(retrieved).toEqual(smallData);
    });
  });

  describe('Storage Statistics', () => {
    it('should provide storage statistics', async() => {
      await storageService.setItem('test', 'item1', { data: 'test1' });
      await storageService.setItem('test', 'item2', { data: 'test2' });
      await storageService.setItem('other', 'item3', { data: 'test3' });

      const stats = await storageService.getStorageStats();

      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('itemCount');
      expect(stats).toHaveProperty('typeStats');
      expect(stats.itemCount).toBe(3);
      expect(stats.typeStats.test).toBe(2);
      expect(stats.typeStats.other).toBe(1);
    });

    it('should provide quota information', async() => {
      const quota = await storageService.getQuotaInfo();

      expect(quota).toHaveProperty('quota');
      expect(quota).toHaveProperty('usage');
      expect(quota.quota).toBe(50 * 1024 * 1024);
      expect(quota.usage).toBe(10 * 1024 * 1024);
    });
  });

  describe('Cleanup Operations', () => {
    it('should clean up old data', async() => {
      // Create old data by mocking timestamp
      const oldTimestamp = Date.now() - (35 * 24 * 60 * 60 * 1000); // 35 days ago

      // Mock the stored data to appear old
      const oldData = {
        version: '1.0.0',
        schemaVersion: '1.0',
        timestamp: oldTimestamp,
        data: { test: 'old' },
        metadata: { type: 'test', identifier: 'old' }
      };

      const compressedOldData = {
        compressed: false,
        data: JSON.stringify(oldData)
      };

      localStorageMock.setItem('financeanalyst_test_old', JSON.stringify(compressedOldData));

      // Add recent data
      await storageService.setItem('test', 'recent', { test: 'recent' });

      const cleanedCount = await storageService.performCleanup();

      expect(cleanedCount).toBe(1);
      expect(await storageService.getItem('test', 'old')).toBeNull();
      expect(await storageService.getItem('test', 'recent')).toEqual({ test: 'recent' });
    });

    it('should clear all application data', () => {
      // Add some test data
      localStorageMock.setItem('financeanalyst_test_item1', 'data1');
      localStorageMock.setItem('financeanalyst_test_item2', 'data2');
      localStorageMock.setItem('other_app_data', 'should_remain');

      const result = storageService.clearAll();

      expect(result).toBe(true);
      expect(localStorageMock.getItem('financeanalyst_test_item1')).toBeNull();
      expect(localStorageMock.getItem('financeanalyst_test_item2')).toBeNull();
      expect(localStorageMock.getItem('other_app_data')).toBe('should_remain');
    });
  });

  describe('Error Handling', () => {
    it('should handle storage unavailability', async() => {
      // Mock localStorage to throw error for this test only
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      await expect(storageService.setItem('test', 'item', { data: 'test' }))
        .rejects.toThrow('Storage quota exceeded');

      // Restore original implementation
      localStorageMock.setItem = originalSetItem;
    });

    it('should handle corrupted data gracefully', async() => {
      // Store corrupted data directly
      localStorageMock.store['financeanalyst_test_corrupted'] = 'invalid json';

      const result = await storageService.getItem('test', 'corrupted');
      expect(result).toBeNull();
    });

    it('should handle unknown schema types', async() => {
      await expect(storageService.setItem('unknownType', 'item', { data: 'test' }))
        .resolves.toBe(true); // Should succeed for unknown types
    });
  });

  describe('Version Management', () => {
    it('should handle version mismatches', async() => {
      // Store data with old version directly in mock store
      const oldVersionData = {
        version: '0.9.0', // Old version
        schemaVersion: '1.0',
        timestamp: Date.now(),
        data: { test: 'old_version' },
        metadata: { type: 'test', identifier: 'version_test' }
      };

      const compressedData = {
        compressed: false,
        data: JSON.stringify(oldVersionData)
      };

      localStorageMock.store['financeanalyst_test_version_test'] = JSON.stringify(compressedData);

      // Should still retrieve data but log warning
      const result = await storageService.getItem('test', 'version_test');
      expect(result).toEqual({ test: 'old_version' });
    });
  });
});
