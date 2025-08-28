import { describe, it, expect, beforeEach, vi } from 'vitest';
import { financialDataStorage } from '../financialDataStorage.js';

// Mock dependencies
vi.mock('../storageService.js', () => ({
  storageService: {
    setItem: vi.fn().mockResolvedValue(true),
    getItem: vi.fn(),
    listItems: vi.fn().mockResolvedValue([]),
    removeItem: vi.fn().mockResolvedValue(true),
    getStorageStats: vi.fn().mockResolvedValue({ totalSize: 0, itemCount: 0 })
  }
}));

vi.mock('../../utils/apiLogger.js', () => ({
  apiLogger: {
    log: vi.fn()
  }
}));

import { storageService } from '../storageService.js';
import { apiLogger } from '../../utils/apiLogger.js';

describe('FinancialDataStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Date.now() mock
    vi.useRealTimers();
    // Reset storageService.setItem to default success state
    storageService.setItem.mockResolvedValue(true);
    storageService.getItem.mockResolvedValue(null);
    storageService.listItems.mockResolvedValue([]);
    storageService.removeItem.mockResolvedValue(true);
    storageService.getStorageStats.mockResolvedValue({ totalSize: 0, itemCount: 0 });
  });

  describe('DCF Model Operations', () => {
    it('should save DCF model successfully', async () => {
      const symbol = 'AAPL';
      const modelData = {
        assumptions: { wacc: 0.1, growthRate: 0.03 },
        projections: { revenue: [1000, 1100] },
        valuation: { intrinsicValue: 150.25 }
      };

      const result = await financialDataStorage.saveDCFModel(symbol, modelData);

      expect(result).toBe(true);
      expect(storageService.setItem).toHaveBeenCalledWith(
        'dcfModel',
        'AAPL',
        expect.objectContaining({
          symbol: 'AAPL',
          assumptions: modelData.assumptions,
          projections: modelData.projections,
          valuation: modelData.valuation,
          metadata: expect.objectContaining({
            modelType: 'DCF',
            version: '1.0'
          })
        })
      );
      expect(apiLogger.log).toHaveBeenCalledWith('INFO', 'DCF model saved', {
        symbol: 'AAPL',
        valuation: 150.25
      });
    });

    it('should handle save DCF model errors', async () => {
      const error = new Error('Storage failed');
      storageService.setItem.mockRejectedValue(error);

      await expect(financialDataStorage.saveDCFModel('AAPL', {})).rejects.toThrow('Storage failed');
      expect(apiLogger.log).toHaveBeenCalledWith('ERROR', 'Failed to save DCF model', {
        symbol: 'AAPL',
        error: 'Storage failed'
      });
    });

    it('should retrieve DCF model successfully', async () => {
      const mockData = { symbol: 'AAPL', valuation: { intrinsicValue: 150 } };
      storageService.getItem.mockResolvedValue(mockData);

      const result = await financialDataStorage.getDCFModel('AAPL');

      expect(result).toEqual(mockData);
      expect(storageService.getItem).toHaveBeenCalledWith('dcfModel', 'AAPL');
      expect(apiLogger.log).toHaveBeenCalledWith('DEBUG', 'DCF model retrieved', {
        symbol: 'AAPL'
      });
    });

    it('should handle DCF model retrieval errors gracefully', async () => {
      storageService.getItem.mockRejectedValue(new Error('Retrieval failed'));

      const result = await financialDataStorage.getDCFModel('AAPL');

      expect(result).toBe(null);
      expect(apiLogger.log).toHaveBeenCalledWith('ERROR', 'Failed to retrieve DCF model', {
        symbol: 'AAPL',
        error: 'Retrieval failed'
      });
    });

    it('should list DCF models', async () => {
      const mockModels = ['AAPL', 'GOOGL', 'MSFT'];
      storageService.listItems.mockResolvedValue(mockModels);

      const result = await financialDataStorage.listDCFModels();

      expect(result).toEqual(mockModels);
      expect(storageService.listItems).toHaveBeenCalledWith('dcfModel');
    });

    it('should delete DCF model', async () => {
      storageService.removeItem.mockResolvedValue(true);

      const result = await financialDataStorage.deleteDCFModel('AAPL');

      expect(result).toBe(true);
      expect(storageService.removeItem).toHaveBeenCalledWith('dcfModel', 'AAPL');
    });
  });

  describe('LBO Model Operations', () => {
    it('should save LBO model successfully', async () => {
      const symbol = 'TSLA';
      const modelData = {
        transaction: { purchasePrice: 1000 },
        financing: { debtRatio: 0.6 },
        returns: { irr: 0.25, moic: 2.5 }
      };

      // Ensure the mock returns success for this specific test
      storageService.setItem.mockResolvedValue(true);

      const result = await financialDataStorage.saveLBOModel(symbol, modelData);

      expect(result).toBe(true);
      expect(storageService.setItem).toHaveBeenCalledWith(
        'lboModel',
        'TSLA',
        expect.objectContaining({
          symbol: 'TSLA',
          transaction: modelData.transaction,
          financing: modelData.financing,
          returns: modelData.returns,
          metadata: expect.objectContaining({
            modelType: 'LBO',
            version: '1.0'
          })
        })
      );
      expect(apiLogger.log).toHaveBeenCalledWith('INFO', 'LBO model saved', {
        symbol: 'TSLA',
        irr: 0.25,
        moic: 2.5
      });
    });

    it('should handle LBO model retrieval errors', async () => {
      storageService.getItem.mockRejectedValue(new Error('Retrieval failed'));

      const result = await financialDataStorage.getLBOModel('TSLA');

      expect(result).toBe(null);
      expect(apiLogger.log).toHaveBeenCalledWith('ERROR', 'Failed to retrieve LBO model', {
        symbol: 'TSLA',
        error: 'Retrieval failed'
      });
    });
  });

  describe('Market Data Operations', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should save market data with TTL', async () => {
      const symbol = 'AAPL';
      const marketData = { price: 150.25, volume: 1000000 };
      const ttlMinutes = 30;

      // Ensure the mock returns success for this specific test
      storageService.setItem.mockResolvedValue(true);

      const result = await financialDataStorage.saveMarketData(symbol, marketData, ttlMinutes);

      expect(result).toBe(true);
      expect(storageService.setItem).toHaveBeenCalledWith('marketData', 'AAPL', {
        symbol: 'AAPL',
        data: marketData,
        timestamp: Date.now(),
        source: 'unknown',
        expiresAt: Date.now() + ttlMinutes * 60 * 1000
      });
    });

    it('should retrieve valid cached market data', async () => {
      const mockData = {
        symbol: 'AAPL',
        data: { price: 150.25 },
        timestamp: Date.now(),
        expiresAt: Date.now() + 3600000 // 1 hour from now
      };
      storageService.getItem.mockResolvedValue(mockData);

      const result = await financialDataStorage.getMarketData('AAPL');

      expect(result).toEqual(mockData.data);
      expect(apiLogger.log).toHaveBeenCalledWith('DEBUG', 'Market data cache hit', {
        symbol: 'AAPL'
      });
    });

    it('should return null for expired market data and remove it', async () => {
      const expiredData = {
        symbol: 'AAPL',
        data: { price: 150.25 },
        timestamp: Date.now() - 7200000, // 2 hours ago
        expiresAt: Date.now() - 3600000 // 1 hour ago (expired)
      };
      storageService.getItem.mockResolvedValue(expiredData);

      const result = await financialDataStorage.getMarketData('AAPL');

      expect(result).toBe(null);
      expect(storageService.removeItem).toHaveBeenCalledWith('marketData', 'AAPL');
      expect(apiLogger.log).toHaveBeenCalledWith('DEBUG', 'Market data cache expired', {
        symbol: 'AAPL'
      });
    });

    it('should return null when market data not found', async () => {
      storageService.getItem.mockResolvedValue(null);

      const result = await financialDataStorage.getMarketData('AAPL');

      expect(result).toBe(null);
    });

    it('should handle market data retrieval errors', async () => {
      storageService.getItem.mockRejectedValue(new Error('Retrieval failed'));

      const result = await financialDataStorage.getMarketData('AAPL');

      expect(result).toBe(null);
      expect(apiLogger.log).toHaveBeenCalledWith('ERROR', 'Failed to retrieve market data', {
        symbol: 'AAPL',
        error: 'Retrieval failed'
      });
    });
  });

  describe('User Preferences Operations', () => {
    it('should save user preferences successfully', async () => {
      const preferences = {
        theme: 'dark',
        layout: { sidebar: 'collapsed' },
        notifications: { email: true }
      };

      // Ensure the mock returns success for this specific test
      storageService.setItem.mockResolvedValue(true);

      const result = await financialDataStorage.saveUserPreferences(preferences);

      expect(result).toBe(true);
      expect(storageService.setItem).toHaveBeenCalledWith('userPreferences', 'default', {
        theme: 'dark',
        layout: { sidebar: 'collapsed' },
        notifications: { email: true },
        privacy: {},
        metadata: expect.objectContaining({
          lastUpdated: expect.any(Number),
          version: '1.0'
        })
      });
    });

    it('should handle save user preferences errors', async () => {
      const error = new Error('Storage failed');
      storageService.setItem.mockRejectedValue(error);

      await expect(financialDataStorage.saveUserPreferences({ theme: 'dark' })).rejects.toThrow(
        'Storage failed'
      );
      expect(apiLogger.log).toHaveBeenCalledWith('ERROR', 'Failed to save user preferences', {
        error: 'Storage failed'
      });
    });

    it('should retrieve user preferences', async () => {
      const mockPrefs = { theme: 'dark' };
      storageService.getItem.mockResolvedValue(mockPrefs);

      const result = await financialDataStorage.getUserPreferences();

      expect(result).toEqual(mockPrefs);
      expect(apiLogger.log).toHaveBeenCalledWith('DEBUG', 'User preferences retrieved');
    });

    it('should handle user preferences retrieval errors', async () => {
      storageService.getItem.mockRejectedValue(new Error('Retrieval failed'));

      const result = await financialDataStorage.getUserPreferences();

      expect(result).toBe(null);
      expect(apiLogger.log).toHaveBeenCalledWith('ERROR', 'Failed to retrieve user preferences', {
        error: 'Retrieval failed'
      });
    });
  });

  describe('Watchlist Operations', () => {
    it('should save watchlist successfully', async () => {
      const name = 'tech-stocks';
      const symbols = ['AAPL', 'GOOGL', 'MSFT'];

      // Ensure the mock returns success for this specific test
      storageService.setItem.mockResolvedValue(true);

      const result = await financialDataStorage.saveWatchlist(name, symbols);

      expect(result).toBe(true);
      expect(storageService.setItem).toHaveBeenCalledWith('watchlist', 'tech-stocks', {
        name: 'tech-stocks',
        symbols: ['AAPL', 'GOOGL', 'MSFT'],
        metadata: expect.objectContaining({
          symbolCount: 3
        })
      });
      expect(apiLogger.log).toHaveBeenCalledWith('INFO', 'Watchlist saved', {
        name: 'tech-stocks',
        symbolCount: 3
      });
    });

    it('should retrieve watchlist', async () => {
      const mockWatchlist = { name: 'tech-stocks', symbols: ['AAPL', 'GOOGL'] };
      storageService.getItem.mockResolvedValue(mockWatchlist);

      const result = await financialDataStorage.getWatchlist('tech-stocks');

      expect(result).toEqual(mockWatchlist);
      expect(apiLogger.log).toHaveBeenCalledWith('DEBUG', 'Watchlist retrieved', {
        name: 'tech-stocks'
      });
    });

    it('should list watchlists', async () => {
      const mockWatchlists = ['tech-stocks', 'growth-stocks'];
      storageService.listItems.mockResolvedValue(mockWatchlists);

      const result = await financialDataStorage.listWatchlists();

      expect(result).toEqual(mockWatchlists);
      expect(storageService.listItems).toHaveBeenCalledWith('watchlist');
    });
  });

  describe('Data Export/Import Operations', () => {
    it('should export all data successfully', async () => {
      // Mock all the list methods
      storageService.listItems
        .mockResolvedValueOnce(['AAPL']) // DCF models
        .mockResolvedValueOnce(['TSLA']) // LBO models
        .mockResolvedValueOnce(['mc-123']) // Monte Carlo results
        .mockResolvedValueOnce(['tech-stocks']); // Watchlists

      // Mock get methods
      const spyDCF = vi
        .spyOn(financialDataStorage, 'getDCFModel')
        .mockResolvedValue({ symbol: 'AAPL' });
      const spyLBO = vi
        .spyOn(financialDataStorage, 'getLBOModel')
        .mockResolvedValue({ symbol: 'TSLA' });
      const spyMC = vi
        .spyOn(financialDataStorage, 'getMonteCarloResults')
        .mockResolvedValue({ modelId: 'mc-123' });
      const spyWL = vi
        .spyOn(financialDataStorage, 'getWatchlist')
        .mockResolvedValue({ name: 'tech-stocks' });
      const spyPrefs = vi
        .spyOn(financialDataStorage, 'getUserPreferences')
        .mockResolvedValue({ theme: 'dark' });

      const result = await financialDataStorage.exportAllData();

      expect(result).toEqual({
        timestamp: expect.any(Number),
        version: '1.0',
        data: {
          dcfModels: { AAPL: { symbol: 'AAPL' } },
          lboModels: { TSLA: { symbol: 'TSLA' } },
          monteCarloResults: { 'mc-123': { modelId: 'mc-123' } },
          watchlists: { 'tech-stocks': { name: 'tech-stocks' } },
          userPreferences: { theme: 'dark' }
        }
      });
      expect(apiLogger.log).toHaveBeenCalledWith('INFO', 'Data export completed', {
        dcfCount: 1,
        lboCount: 1,
        mcCount: 1,
        watchlistCount: 1
      });

      // Restore spies to avoid leaking mocks into subsequent tests
      spyDCF.mockRestore();
      spyLBO.mockRestore();
      spyMC.mockRestore();
      spyWL.mockRestore();
      spyPrefs.mockRestore();
    });

    it('should handle export errors', async () => {
      storageService.listItems.mockRejectedValue(new Error('Export failed'));

      await expect(financialDataStorage.exportAllData()).rejects.toThrow('Export failed');
      expect(apiLogger.log).toHaveBeenCalledWith('ERROR', 'Failed to export data', {
        error: 'Export failed'
      });
    });

    it('should import data successfully', async () => {
      const importData = {
        data: {
          dcfModels: { AAPL: { symbol: 'AAPL' } },
          lboModels: { TSLA: { symbol: 'TSLA' } },
          monteCarloResults: { 'mc-123': { modelId: 'mc-123' } },
          watchlists: { 'tech-stocks': { name: 'tech-stocks', symbols: ['AAPL'] } },
          userPreferences: { theme: 'dark' }
        }
      };

      // Ensure the mock returns success for this specific test
      storageService.setItem.mockResolvedValue(true);

      const result = await financialDataStorage.importData(importData);

      expect(result).toBe(5); // 5 items imported
      expect(apiLogger.log).toHaveBeenCalledWith('INFO', 'Data import completed', {
        importCount: 5
      });
    });

    it('should handle import errors', async () => {
      const importData = { data: { dcfModels: { AAPL: { symbol: 'AAPL' } } } };
      storageService.setItem.mockRejectedValue(new Error('Import failed'));

      await expect(financialDataStorage.importData(importData)).rejects.toThrow('Import failed');
      expect(apiLogger.log).toHaveBeenCalledWith('ERROR', 'Failed to import data', {
        error: 'Import failed'
      });
    });
  });

  describe('Statistics and Maintenance', () => {
    it('should get financial data statistics', async () => {
      storageService.getStorageStats.mockResolvedValue({ totalSize: 1024000, itemCount: 50 });
      storageService.listItems
        .mockResolvedValueOnce(['AAPL', 'GOOGL']) // DCF
        .mockResolvedValueOnce(['TSLA']) // LBO
        .mockResolvedValueOnce(['mc-123']) // Monte Carlo
        .mockResolvedValueOnce(['tech-stocks']); // Watchlists

      const result = await financialDataStorage.getFinancialDataStats();

      expect(result).toEqual({
        totalSize: 1024000,
        itemCount: 50,
        financialData: {
          dcfModels: 2,
          lboModels: 1,
          monteCarloResults: 1,
          watchlists: 1
        }
      });
    });

    it('should cleanup expired market data', async () => {
      const validData = {
        symbol: 'AAPL',
        expiresAt: Date.now() + 3600000 // Future
      };
      const expiredData = {
        symbol: 'GOOGL',
        expiresAt: Date.now() - 3600000 // Past
      };

      // Ensure listItems returns an array for proper iteration
      storageService.listItems.mockResolvedValue(['AAPL', 'GOOGL']);
      storageService.getItem.mockResolvedValueOnce(validData).mockResolvedValueOnce(expiredData);

      const result = await financialDataStorage.cleanupExpiredMarketData();

      expect(result).toBe(1); // One expired item cleaned
      expect(storageService.removeItem).toHaveBeenCalledWith('marketData', 'GOOGL');
      expect(apiLogger.log).toHaveBeenCalledWith('INFO', 'Expired market data cleaned', {
        cleanedCount: 1
      });
    });

    it('should handle non-iterable market data keys gracefully', async () => {
      // Test case where listItems returns null or non-array
      storageService.listItems.mockResolvedValue(null);

      const result = await financialDataStorage.cleanupExpiredMarketData();

      expect(result).toBe(0); // Should return 0 for non-iterable keys
      expect(apiLogger.log).toHaveBeenCalledWith(
        'WARN',
        'Market data keys not available or not iterable',
        {
          keysType: 'object',
          keysValue: null
        }
      );
    });
  });

  describe('Error Handling and Logging', () => {
    it('should log all operations appropriately', async () => {
      // Test successful operations log INFO/DEBUG
      storageService.setItem.mockResolvedValue(true);
      await financialDataStorage.saveDCFModel('TEST', { valuation: { intrinsicValue: 100 } });

      expect(apiLogger.log).toHaveBeenCalledWith('INFO', 'DCF model saved', {
        symbol: 'TEST',
        valuation: 100
      });

      // Test error operations log ERROR
      storageService.setItem.mockRejectedValue(new Error('Test error'));
      await expect(financialDataStorage.saveDCFModel('TEST', {})).rejects.toThrow();

      expect(apiLogger.log).toHaveBeenCalledWith('ERROR', 'Failed to save DCF model', {
        symbol: 'TEST',
        error: 'Test error'
      });
    });

    it('should handle malformed data gracefully', async () => {
      // Mock the entire storageService for this test
      const originalGetItem = storageService.getItem;
      storageService.getItem = vi.fn().mockResolvedValue(null);

      try {
        // Test with null/undefined data
        const result = await financialDataStorage.getDCFModel(null);
        expect(result).toBe(null);

        // Test with malformed symbol
        const result2 = await financialDataStorage.getDCFModel({});
        expect(result2).toBe(null);

        // Test with empty string
        const result3 = await financialDataStorage.getDCFModel('');
        expect(result3).toBe(null);

        // Test with whitespace-only string
        const result4 = await financialDataStorage.getDCFModel('   ');
        expect(result4).toBe(null);
      } finally {
        // Restore the original method
        storageService.getItem = originalGetItem;
      }
    });
  });
});
