/**
 * Tests for Financial Data Storage Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { financialDataStorage } from '../financialDataStorage.js';
import { storageService } from '../storageService.js';

// Mock localStorage service
vi.mock('../storageService.js', () => ({
  storageService: {
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn(),
    listItems: vi.fn(),
    getStorageStats: vi.fn()
  }
}));

describe('FinancialDataStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DCF Model Storage', () => {
    it('should save DCF model data', async() => {
      const symbol = 'AAPL';
      const modelData = {
        assumptions: { growthRate: 0.05, discountRate: 0.1 },
        projections: { revenues: [100, 105, 110] },
        valuation: { intrinsicValue: 150, currentPrice: 140 },
        metadata: { analyst: 'John Doe' }
      };

      storageService.setItem.mockResolvedValue(true);

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
            createdAt: expect.any(Number),
            lastModified: expect.any(Number),
            version: '1.0',
            modelType: 'DCF',
            analyst: 'John Doe'
          })
        })
      );
    });

    it('should retrieve DCF model data', async() => {
      const symbol = 'AAPL';
      const mockData = {
        symbol: 'AAPL',
        assumptions: { growthRate: 0.05 },
        projections: { revenues: [100, 105] },
        valuation: { intrinsicValue: 150 }
      };

      storageService.getItem.mockResolvedValue(mockData);

      const result = await financialDataStorage.getDCFModel(symbol);

      expect(result).toEqual(mockData);
      expect(storageService.getItem).toHaveBeenCalledWith('dcfModel', 'AAPL');
    });

    it('should list DCF models', async() => {
      const mockSymbols = ['AAPL', 'GOOGL', 'MSFT'];
      storageService.listItems.mockReturnValue(mockSymbols);

      const result = await financialDataStorage.listDCFModels();

      expect(result).toEqual(mockSymbols);
      expect(storageService.listItems).toHaveBeenCalledWith('dcfModel');
    });

    it('should delete DCF model', async() => {
      const symbol = 'AAPL';
      storageService.removeItem.mockReturnValue(true);

      const result = await financialDataStorage.deleteDCFModel(symbol);

      expect(result).toBe(true);
      expect(storageService.removeItem).toHaveBeenCalledWith('dcfModel', 'AAPL');
    });
  });

  describe('LBO Model Storage', () => {
    it('should save LBO model data', async() => {
      const symbol = 'AAPL';
      const modelData = {
        transaction: { purchasePrice: 1000, purchaseMultiple: 10 },
        financing: { debt: 600, equity: 400 },
        returns: { irr: 0.25, moic: 2.5 },
        metadata: { sponsor: 'PE Firm' }
      };

      storageService.setItem.mockResolvedValue(true);

      const result = await financialDataStorage.saveLBOModel(symbol, modelData);

      expect(result).toBe(true);
      expect(storageService.setItem).toHaveBeenCalledWith(
        'lboModel',
        'AAPL',
        expect.objectContaining({
          symbol: 'AAPL',
          transaction: modelData.transaction,
          financing: modelData.financing,
          returns: modelData.returns,
          metadata: expect.objectContaining({
            createdAt: expect.any(Number),
            lastModified: expect.any(Number),
            version: '1.0',
            modelType: 'LBO',
            sponsor: 'PE Firm'
          })
        })
      );
    });

    it('should retrieve LBO model data', async() => {
      const symbol = 'AAPL';
      const mockData = {
        symbol: 'AAPL',
        transaction: { purchasePrice: 1000 },
        financing: { debt: 600, equity: 400 },
        returns: { irr: 0.25, moic: 2.5 }
      };

      storageService.getItem.mockResolvedValue(mockData);

      const result = await financialDataStorage.getLBOModel(symbol);

      expect(result).toEqual(mockData);
      expect(storageService.getItem).toHaveBeenCalledWith('lboModel', 'AAPL');
    });
  });

  describe('Monte Carlo Results Storage', () => {
    it('should save Monte Carlo results', async() => {
      const modelId = 'dcf_aapl_20241201';
      const resultsData = {
        modelType: 'DCF',
        iterations: 10000,
        results: [145, 150, 155, 160],
        statistics: { mean: 152.5, stdDev: 6.45 },
        symbol: 'AAPL',
        metadata: { scenario: 'base_case' }
      };

      storageService.setItem.mockResolvedValue(true);

      const result = await financialDataStorage.saveMonteCarloResults(modelId, resultsData);

      expect(result).toBe(true);
      expect(storageService.setItem).toHaveBeenCalledWith(
        'monteCarloResults',
        modelId,
        expect.objectContaining({
          modelType: 'DCF',
          iterations: 10000,
          results: resultsData.results,
          statistics: resultsData.statistics,
          metadata: expect.objectContaining({
            createdAt: expect.any(Number),
            modelId,
            symbol: 'AAPL',
            version: '1.0',
            scenario: 'base_case'
          })
        })
      );
    });

    it('should retrieve Monte Carlo results', async() => {
      const modelId = 'dcf_aapl_20241201';
      const mockData = {
        modelType: 'DCF',
        iterations: 10000,
        results: [145, 150, 155],
        statistics: { mean: 150 }
      };

      storageService.getItem.mockResolvedValue(mockData);

      const result = await financialDataStorage.getMonteCarloResults(modelId);

      expect(result).toEqual(mockData);
      expect(storageService.getItem).toHaveBeenCalledWith('monteCarloResults', modelId);
    });
  });

  describe('Market Data Storage with TTL', () => {
    it('should save market data with TTL', async() => {
      const symbol = 'AAPL';
      const marketData = {
        currentPrice: 150,
        volume: 1000000,
        source: 'Yahoo Finance'
      };
      const ttlMinutes = 15;

      storageService.setItem.mockResolvedValue(true);

      const result = await financialDataStorage.saveMarketData(symbol, marketData, ttlMinutes);

      expect(result).toBe(true);
      expect(storageService.setItem).toHaveBeenCalledWith(
        'marketData',
        'AAPL',
        expect.objectContaining({
          symbol: 'AAPL',
          data: marketData,
          timestamp: expect.any(Number),
          source: 'Yahoo Finance',
          expiresAt: expect.any(Number)
        })
      );
    });

    it('should retrieve valid market data', async() => {
      const symbol = 'AAPL';
      const mockData = {
        symbol: 'AAPL',
        data: { currentPrice: 150 },
        timestamp: Date.now(),
        source: 'Yahoo Finance',
        expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes from now
      };

      storageService.getItem.mockResolvedValue(mockData);

      const result = await financialDataStorage.getMarketData(symbol);

      expect(result).toEqual(mockData.data);
      expect(storageService.getItem).toHaveBeenCalledWith('marketData', 'AAPL');
    });

    it('should return null for expired market data', async() => {
      const symbol = 'AAPL';
      const mockData = {
        symbol: 'AAPL',
        data: { currentPrice: 150 },
        timestamp: Date.now(),
        source: 'Yahoo Finance',
        expiresAt: Date.now() - 1000 // Expired 1 second ago
      };

      storageService.getItem.mockResolvedValue(mockData);
      storageService.removeItem.mockReturnValue(true);

      const result = await financialDataStorage.getMarketData(symbol);

      expect(result).toBeNull();
      expect(storageService.removeItem).toHaveBeenCalledWith('marketData', 'AAPL');
    });
  });

  describe('User Preferences Storage', () => {
    it('should save user preferences', async() => {
      const preferences = {
        theme: 'dark',
        layout: { sidebar: 'collapsed' },
        notifications: { email: true },
        privacy: { analytics: false }
      };

      storageService.setItem.mockResolvedValue(true);

      const result = await financialDataStorage.saveUserPreferences(preferences);

      expect(result).toBe(true);
      expect(storageService.setItem).toHaveBeenCalledWith(
        'userPreferences',
        'default',
        expect.objectContaining({
          theme: 'dark',
          layout: preferences.layout,
          notifications: preferences.notifications,
          privacy: preferences.privacy,
          metadata: expect.objectContaining({
            lastUpdated: expect.any(Number),
            version: '1.0'
          })
        })
      );
    });

    it('should retrieve user preferences', async() => {
      const mockPreferences = {
        theme: 'dark',
        layout: { sidebar: 'collapsed' },
        notifications: { email: true }
      };

      storageService.getItem.mockResolvedValue(mockPreferences);

      const result = await financialDataStorage.getUserPreferences();

      expect(result).toEqual(mockPreferences);
      expect(storageService.getItem).toHaveBeenCalledWith('userPreferences', 'default');
    });
  });

  describe('Watchlist Storage', () => {
    it('should save watchlist', async() => {
      const name = 'Tech Stocks';
      const symbols = ['AAPL', 'GOOGL', 'MSFT'];

      storageService.setItem.mockResolvedValue(true);

      const result = await financialDataStorage.saveWatchlist(name, symbols);

      expect(result).toBe(true);
      expect(storageService.setItem).toHaveBeenCalledWith(
        'watchlist',
        name,
        expect.objectContaining({
          name,
          symbols: ['AAPL', 'GOOGL', 'MSFT'],
          metadata: expect.objectContaining({
            createdAt: expect.any(Number),
            lastModified: expect.any(Number),
            symbolCount: 3
          })
        })
      );
    });

    it('should retrieve watchlist', async() => {
      const name = 'Tech Stocks';
      const mockWatchlist = {
        name,
        symbols: ['AAPL', 'GOOGL', 'MSFT'],
        metadata: { symbolCount: 3 }
      };

      storageService.getItem.mockResolvedValue(mockWatchlist);

      const result = await financialDataStorage.getWatchlist(name);

      expect(result).toEqual(mockWatchlist);
      expect(storageService.getItem).toHaveBeenCalledWith('watchlist', name);
    });
  });

  describe('Data Export/Import', () => {
    it('should export all financial data', async() => {
      // Mock list methods
      storageService.listItems
        .mockReturnValueOnce(['AAPL', 'GOOGL']) // DCF models
        .mockReturnValueOnce(['AAPL']) // LBO models
        .mockReturnValueOnce(['mc1', 'mc2']) // Monte Carlo results
        .mockReturnValueOnce(['Tech Stocks']); // Watchlists

      // Mock get methods
      storageService.getItem
        .mockResolvedValueOnce({ symbol: 'AAPL', valuation: { intrinsicValue: 150 } }) // DCF AAPL
        .mockResolvedValueOnce({ symbol: 'GOOGL', valuation: { intrinsicValue: 2500 } }) // DCF GOOGL
        .mockResolvedValueOnce({ symbol: 'AAPL', returns: { irr: 0.25 } }) // LBO AAPL
        .mockResolvedValueOnce({ modelType: 'DCF', results: [150, 155] }) // MC mc1
        .mockResolvedValueOnce({ modelType: 'LBO', results: [0.2, 0.3] }) // MC mc2
        .mockResolvedValueOnce({ name: 'Tech Stocks', symbols: ['AAPL'] }) // Watchlist
        .mockResolvedValueOnce({ theme: 'dark' }); // User preferences

      const exportData = await financialDataStorage.exportAllData();

      expect(exportData).toHaveProperty('timestamp');
      expect(exportData).toHaveProperty('version', '1.0');
      expect(exportData.data).toHaveProperty('dcfModels');
      expect(exportData.data).toHaveProperty('lboModels');
      expect(exportData.data).toHaveProperty('monteCarloResults');
      expect(exportData.data).toHaveProperty('watchlists');
      expect(exportData.data).toHaveProperty('userPreferences');

      expect(Object.keys(exportData.data.dcfModels)).toHaveLength(2);
      expect(Object.keys(exportData.data.lboModels)).toHaveLength(1);
      expect(Object.keys(exportData.data.monteCarloResults)).toHaveLength(2);
      expect(Object.keys(exportData.data.watchlists)).toHaveLength(1);
    });

    it('should import financial data', async() => {
      const importData = {
        timestamp: Date.now(),
        version: '1.0',
        data: {
          dcfModels: {
            'AAPL': { symbol: 'AAPL', valuation: { intrinsicValue: 150 } }
          },
          lboModels: {
            'AAPL': { symbol: 'AAPL', returns: { irr: 0.25 } }
          },
          monteCarloResults: {
            'mc1': { modelType: 'DCF', results: [150, 155] }
          },
          watchlists: {
            'Tech Stocks': { name: 'Tech Stocks', symbols: ['AAPL'] }
          },
          userPreferences: { theme: 'dark' }
        }
      };

      storageService.setItem.mockResolvedValue(true);

      const importCount = await financialDataStorage.importData(importData);

      expect(importCount).toBe(5); // 1 DCF + 1 LBO + 1 MC + 1 Watchlist + 1 Preferences
      expect(storageService.setItem).toHaveBeenCalledTimes(5);
    });
  });

  describe('Statistics and Cleanup', () => {
    it('should get financial data statistics', async() => {
      const mockStats = {
        totalSize: 1024,
        itemCount: 10,
        typeStats: { dcfModel: 3, lboModel: 2 }
      };

      storageService.getStorageStats.mockResolvedValue(mockStats);
      storageService.listItems
        .mockReturnValueOnce(['AAPL', 'GOOGL']) // DCF models
        .mockReturnValueOnce(['AAPL']) // LBO models
        .mockReturnValueOnce(['mc1']) // Monte Carlo results
        .mockReturnValueOnce(['Tech Stocks']); // Watchlists

      const stats = await financialDataStorage.getFinancialDataStats();

      expect(stats).toHaveProperty('totalSize', 1024);
      expect(stats).toHaveProperty('itemCount', 10);
      expect(stats.financialData).toEqual({
        dcfModels: 2,
        lboModels: 1,
        monteCarloResults: 1,
        watchlists: 1
      });
    });

    it('should cleanup expired market data', async() => {
      const expiredData = {
        symbol: 'AAPL',
        data: { currentPrice: 150 },
        expiresAt: Date.now() - 1000 // Expired
      };

      const validData = {
        symbol: 'GOOGL',
        data: { currentPrice: 2500 },
        expiresAt: Date.now() + 1000 // Valid
      };

      storageService.listItems.mockReturnValue(['AAPL', 'GOOGL']);
      storageService.getItem
        .mockResolvedValueOnce(expiredData)
        .mockResolvedValueOnce(validData);
      storageService.removeItem.mockReturnValue(true);

      const cleanedCount = await financialDataStorage.cleanupExpiredMarketData();

      expect(cleanedCount).toBe(1);
      expect(storageService.removeItem).toHaveBeenCalledWith('marketData', 'AAPL');
    });
  });
});
