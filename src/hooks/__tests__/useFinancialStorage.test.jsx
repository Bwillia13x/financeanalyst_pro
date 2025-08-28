// @vitest-environment jsdom
import { render, cleanup } from '@testing-library/react';
import React, { useEffect } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  useDCFStorage,
  useLBOStorage,
  useWatchlistStorage,
  useUserPreferences,
  useMarketDataCache,
  useStorageStats
} from '../useFinancialStorage.js';

// Mock the financialDataStorage service
vi.mock('../../services/financialDataStorage.js', () => ({
  financialDataStorage: {
    listDCFModels: vi.fn(),
    getDCFModel: vi.fn(),
    saveDCFModel: vi.fn(),
    deleteDCFModel: vi.fn(),
    listLBOModels: vi.fn(),
    getLBOModel: vi.fn(),
    saveLBOModel: vi.fn(),
    deleteLBOModel: vi.fn(),
    listWatchlists: vi.fn(),
    getWatchlist: vi.fn(),
    saveWatchlist: vi.fn(),
    deleteWatchlist: vi.fn(),
    getUserPreferences: vi.fn(),
    saveUserPreferences: vi.fn(),
    getMarketData: vi.fn(),
    saveMarketData: vi.fn(),
    cleanupExpiredMarketData: vi.fn(),
    getFinancialDataStats: vi.fn(),
    exportAllData: vi.fn(),
    importData: vi.fn()
  }
}));

// Mock apiLogger
vi.mock('../../utils/apiLogger.js', () => ({
  apiLogger: {
    log: vi.fn()
  }
}));

import { financialDataStorage } from '../../services/financialDataStorage.js';
import { apiLogger } from '../../utils/apiLogger.js';

// Test harness to expose hook API to tests
function HookHarness({ hook: useHook, onAPI }) {
  const api = useHook();
  useEffect(() => {
    if (onAPI) onAPI(api);
  }, [api, onAPI]);
  return null;
}

const nextTick = () => new Promise(r => setTimeout(r, 0));

describe('useFinancialStorage', () => {
  beforeEach(() => {
    localStorage.clear?.();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('useDCFStorage', () => {
    it('initializes with empty state and loads models on mount', async () => {
      const mockModels = ['model1', 'model2'];
      const mockModelData = [
        { id: 'model1', data: 'model1-data' },
        { id: 'model2', data: 'model2-data' }
      ];

      financialDataStorage.listDCFModels.mockResolvedValue(mockModels);
      financialDataStorage.getDCFModel
        .mockResolvedValueOnce(mockModelData[0])
        .mockResolvedValueOnce(mockModelData[1]);

      let latestApi;
      render(
        <HookHarness
          hook={useDCFStorage}
          onAPI={api => {
            latestApi = api;
          }}
        />
      );

      await nextTick();

      expect(latestApi.loading).toBe(false);
      expect(latestApi.error).toBe(null);
      expect(latestApi.models).toEqual(mockModelData);
      expect(financialDataStorage.listDCFModels).toHaveBeenCalled();
    });

    it('handles loading errors gracefully', async () => {
      const errorMessage = 'Failed to load models';
      financialDataStorage.listDCFModels.mockRejectedValue(new Error(errorMessage));

      let latestApi;
      render(
        <HookHarness
          hook={useDCFStorage}
          onAPI={api => {
            latestApi = api;
          }}
        />
      );

      await nextTick();

      expect(latestApi.loading).toBe(false);
      expect(latestApi.error).toBe(errorMessage);
      expect(apiLogger.log).toHaveBeenCalledWith('ERROR', 'Failed to load DCF models', {
        error: errorMessage
      });
    });

    it('saves a model successfully', async () => {
      const symbol = 'AAPL';
      const modelData = { value: 100 };
      financialDataStorage.listDCFModels.mockResolvedValue([]);
      financialDataStorage.saveDCFModel.mockResolvedValue();

      let latestApi;
      render(
        <HookHarness
          hook={useDCFStorage}
          onAPI={api => {
            latestApi = api;
          }}
        />
      );

      await nextTick();

      const result = await latestApi.saveModel(symbol, modelData);
      expect(result).toBe(true);
      expect(financialDataStorage.saveDCFModel).toHaveBeenCalledWith(symbol, modelData);
    });

    it('handles save errors', async () => {
      const errorMessage = 'Save failed';
      financialDataStorage.listDCFModels.mockResolvedValue([]);
      financialDataStorage.saveDCFModel.mockRejectedValue(new Error(errorMessage));

      let latestApi;
      render(
        <HookHarness
          hook={useDCFStorage}
          onAPI={api => {
            latestApi = api;
          }}
        />
      );

      await nextTick();

      const result = await latestApi.saveModel('AAPL', {});
      await nextTick(); // Wait for hook state to update after error

      expect(result).toBe(false);
      expect(latestApi.error).toBe(errorMessage);
    });

    it('deletes a model successfully', async () => {
      const symbol = 'AAPL';
      financialDataStorage.listDCFModels.mockResolvedValue([]);
      financialDataStorage.deleteDCFModel.mockResolvedValue();

      let latestApi;
      render(
        <HookHarness
          hook={useDCFStorage}
          onAPI={api => {
            latestApi = api;
          }}
        />
      );

      await nextTick();

      const result = await latestApi.deleteModel(symbol);
      expect(result).toBe(true);
      expect(financialDataStorage.deleteDCFModel).toHaveBeenCalledWith(symbol);
    });

    it('gets a specific model', async () => {
      const symbol = 'AAPL';
      const modelData = { value: 100 };
      financialDataStorage.listDCFModels.mockResolvedValue([]);
      financialDataStorage.getDCFModel.mockResolvedValue(modelData);

      let latestApi;
      render(
        <HookHarness
          hook={useDCFStorage}
          onAPI={api => {
            latestApi = api;
          }}
        />
      );

      await nextTick();

      const result = await latestApi.getModel(symbol);
      expect(result).toEqual(modelData);
      expect(financialDataStorage.getDCFModel).toHaveBeenCalledWith(symbol);
    });
  });

  describe('useWatchlistStorage', () => {
    it('loads watchlists on mount', async () => {
      const mockWatchlistNames = ['tech-stocks', 'growth-stocks'];
      const mockWatchlistData = [
        { name: 'tech-stocks', symbols: ['AAPL', 'MSFT'] },
        { name: 'growth-stocks', symbols: ['TSLA', 'NVDA'] }
      ];

      financialDataStorage.listWatchlists.mockResolvedValue(mockWatchlistNames);
      financialDataStorage.getWatchlist
        .mockResolvedValueOnce(mockWatchlistData[0])
        .mockResolvedValueOnce(mockWatchlistData[1]);

      let latestApi;
      render(
        <HookHarness
          hook={useWatchlistStorage}
          onAPI={api => {
            latestApi = api;
          }}
        />
      );

      await nextTick();

      expect(latestApi.watchlists).toEqual(mockWatchlistData);
      expect(financialDataStorage.listWatchlists).toHaveBeenCalled();
    });

    it('saves a watchlist successfully', async () => {
      const name = 'my-watchlist';
      const symbols = ['AAPL', 'GOOGL'];
      financialDataStorage.listWatchlists.mockResolvedValue([]);
      financialDataStorage.saveWatchlist.mockResolvedValue();

      let latestApi;
      render(
        <HookHarness
          hook={useWatchlistStorage}
          onAPI={api => {
            latestApi = api;
          }}
        />
      );

      await nextTick();

      const result = await latestApi.saveWatchlist(name, symbols);
      expect(result).toBe(true);
      expect(financialDataStorage.saveWatchlist).toHaveBeenCalledWith(name, symbols);
    });
  });

  describe('useUserPreferences', () => {
    it('loads default preferences when none exist', async () => {
      financialDataStorage.getUserPreferences.mockResolvedValue(null);

      let latestApi;
      render(
        <HookHarness
          hook={useUserPreferences}
          onAPI={api => {
            latestApi = api;
          }}
        />
      );

      await nextTick();

      expect(latestApi.preferences).toEqual({
        theme: 'light',
        layout: {},
        notifications: {},
        privacy: {}
      });
    });

    it('loads existing preferences', async () => {
      const existingPrefs = { theme: 'dark', customSetting: true };
      financialDataStorage.getUserPreferences.mockResolvedValue(existingPrefs);

      let latestApi;
      render(
        <HookHarness
          hook={useUserPreferences}
          onAPI={api => {
            latestApi = api;
          }}
        />
      );

      await nextTick();

      expect(latestApi.preferences).toEqual(existingPrefs);
    });

    it('updates a single preference', async () => {
      const initialPrefs = { theme: 'light', layout: {} };
      const updatedPrefs = { theme: 'dark', layout: {} };
      financialDataStorage.getUserPreferences.mockResolvedValue(initialPrefs);
      financialDataStorage.saveUserPreferences.mockResolvedValue();

      let latestApi;
      render(
        <HookHarness
          hook={useUserPreferences}
          onAPI={api => {
            latestApi = api;
          }}
        />
      );

      await nextTick();

      const result = await latestApi.updatePreference('theme', 'dark');
      expect(result).toBe(true);
      expect(financialDataStorage.saveUserPreferences).toHaveBeenCalledWith(updatedPrefs);
      expect(latestApi.preferences).toEqual(updatedPrefs);
    });
  });

  describe('useMarketDataCache', () => {
    it('gets cached data successfully', async () => {
      const symbol = 'AAPL';
      const mockData = { price: 150.25 };
      financialDataStorage.getMarketData.mockResolvedValue(mockData);

      let latestApi;
      render(
        <HookHarness
          hook={useMarketDataCache}
          onAPI={api => {
            latestApi = api;
          }}
        />
      );

      const result = await latestApi.getCachedData(symbol);
      expect(result).toEqual(mockData);
      expect(financialDataStorage.getMarketData).toHaveBeenCalledWith(symbol);
    });

    it('caches data with custom TTL', async () => {
      const symbol = 'AAPL';
      const data = { price: 150.25 };
      const ttl = 30;
      financialDataStorage.saveMarketData.mockResolvedValue();

      let latestApi;
      render(
        <HookHarness
          hook={useMarketDataCache}
          onAPI={api => {
            latestApi = api;
          }}
        />
      );

      const result = await latestApi.cacheData(symbol, data, ttl);
      expect(result).toBe(true);
      expect(financialDataStorage.saveMarketData).toHaveBeenCalledWith(symbol, data, ttl);
    });

    it('clears expired cache', async () => {
      const cleanedCount = 5;
      financialDataStorage.cleanupExpiredMarketData.mockResolvedValue(cleanedCount);

      let latestApi;
      render(
        <HookHarness
          hook={useMarketDataCache}
          onAPI={api => {
            latestApi = api;
          }}
        />
      );

      const result = await latestApi.clearExpiredCache();
      expect(result).toBe(cleanedCount);
      expect(financialDataStorage.cleanupExpiredMarketData).toHaveBeenCalled();
    });
  });

  describe('useStorageStats', () => {
    it('loads storage statistics', async () => {
      const mockStats = {
        dcfModels: 10,
        lboModels: 5,
        watchlists: 3,
        totalSize: 1024000
      };
      financialDataStorage.getFinancialDataStats.mockResolvedValue(mockStats);

      let latestApi;
      render(
        <HookHarness
          hook={useStorageStats}
          onAPI={api => {
            latestApi = api;
          }}
        />
      );

      await nextTick();

      expect(latestApi.stats).toEqual(mockStats);
      expect(financialDataStorage.getFinancialDataStats).toHaveBeenCalled();
    });

    it('exports all data', async () => {
      const mockExportData = { models: [], preferences: {} };
      financialDataStorage.exportAllData.mockResolvedValue(mockExportData);

      let latestApi;
      render(
        <HookHarness
          hook={useStorageStats}
          onAPI={api => {
            latestApi = api;
          }}
        />
      );

      const result = await latestApi.exportData();
      expect(result).toEqual(mockExportData);
      expect(financialDataStorage.exportAllData).toHaveBeenCalled();
    });

    it('imports data successfully', async () => {
      const importData = { models: [], preferences: {} };
      const importCount = 15;
      financialDataStorage.getFinancialDataStats.mockResolvedValue({});
      financialDataStorage.importData.mockResolvedValue(importCount);

      let latestApi;
      render(
        <HookHarness
          hook={useStorageStats}
          onAPI={api => {
            latestApi = api;
          }}
        />
      );

      await nextTick();

      const result = await latestApi.importData(importData);
      expect(result).toBe(importCount);
      expect(financialDataStorage.importData).toHaveBeenCalledWith(importData);
    });
  });
});
