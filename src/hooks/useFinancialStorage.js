/**
 * React Hook for Financial Data Storage
 * Provides convenient access to storage operations with React state management
 */

import { useState, useEffect, useCallback } from 'react';

import { financialDataStorage } from '../services/financialDataStorage.js';
import { apiLogger } from '../utils/apiLogger.js';

/**
 * Hook for managing DCF models
 */
export const useDCFStorage = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadModels = useCallback(async() => {
    setLoading(true);
    setError(null);
    try {
      const modelIds = await financialDataStorage.listDCFModels();
      const modelData = await Promise.all(
        modelIds.map(async(id) => {
          const data = await financialDataStorage.getDCFModel(id);
          return { id, ...data };
        })
      );
      setModels(modelData);
    } catch (err) {
      setError(err.message);
      apiLogger.log('ERROR', 'Failed to load DCF models', { error: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const saveModel = useCallback(async(symbol, modelData) => {
    try {
      await financialDataStorage.saveDCFModel(symbol, modelData);
      await loadModels(); // Refresh the list
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadModels]);

  const deleteModel = useCallback(async(symbol) => {
    try {
      await financialDataStorage.deleteDCFModel(symbol);
      await loadModels(); // Refresh the list
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadModels]);

  const getModel = useCallback(async(symbol) => {
    try {
      return await financialDataStorage.getDCFModel(symbol);
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return {
    models,
    loading,
    error,
    saveModel,
    deleteModel,
    getModel,
    refreshModels: loadModels
  };
};

/**
 * Hook for managing LBO models
 */
export const useLBOStorage = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadModels = useCallback(async() => {
    setLoading(true);
    setError(null);
    try {
      const modelIds = await financialDataStorage.listLBOModels();
      const modelData = await Promise.all(
        modelIds.map(async(id) => {
          const data = await financialDataStorage.getLBOModel(id);
          return { id, ...data };
        })
      );
      setModels(modelData);
    } catch (err) {
      setError(err.message);
      apiLogger.log('ERROR', 'Failed to load LBO models', { error: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const saveModel = useCallback(async(symbol, modelData) => {
    try {
      await financialDataStorage.saveLBOModel(symbol, modelData);
      await loadModels(); // Refresh the list
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadModels]);

  const deleteModel = useCallback(async(symbol) => {
    try {
      await financialDataStorage.deleteLBOModel(symbol);
      await loadModels(); // Refresh the list
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadModels]);

  const getModel = useCallback(async(symbol) => {
    try {
      return await financialDataStorage.getLBOModel(symbol);
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return {
    models,
    loading,
    error,
    saveModel,
    deleteModel,
    getModel,
    refreshModels: loadModels
  };
};

/**
 * Hook for managing watchlists
 */
export const useWatchlistStorage = () => {
  const [watchlists, setWatchlists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadWatchlists = useCallback(async() => {
    setLoading(true);
    setError(null);
    try {
      const watchlistNames = await financialDataStorage.listWatchlists();
      const watchlistData = await Promise.all(
        watchlistNames.map(async(name) => {
          const data = await financialDataStorage.getWatchlist(name);
          return data;
        })
      );
      setWatchlists(watchlistData);
    } catch (err) {
      setError(err.message);
      apiLogger.log('ERROR', 'Failed to load watchlists', { error: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const saveWatchlist = useCallback(async(name, symbols) => {
    try {
      await financialDataStorage.saveWatchlist(name, symbols);
      await loadWatchlists(); // Refresh the list
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadWatchlists]);

  const deleteWatchlist = useCallback(async(name) => {
    try {
      await financialDataStorage.deleteWatchlist(name);
      await loadWatchlists(); // Refresh the list
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [loadWatchlists]);

  const getWatchlist = useCallback(async(name) => {
    try {
      return await financialDataStorage.getWatchlist(name);
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  useEffect(() => {
    loadWatchlists();
  }, [loadWatchlists]);

  return {
    watchlists,
    loading,
    error,
    saveWatchlist,
    deleteWatchlist,
    getWatchlist,
    refreshWatchlists: loadWatchlists
  };
};

/**
 * Hook for managing user preferences
 */
export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPreferences = useCallback(async() => {
    setLoading(true);
    setError(null);
    try {
      const prefs = await financialDataStorage.getUserPreferences();
      setPreferences(prefs || {
        theme: 'light',
        layout: {},
        notifications: {},
        privacy: {}
      });
    } catch (err) {
      setError(err.message);
      apiLogger.log('ERROR', 'Failed to load user preferences', { error: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const savePreferences = useCallback(async(newPreferences) => {
    try {
      await financialDataStorage.saveUserPreferences(newPreferences);
      setPreferences(newPreferences);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  const updatePreference = useCallback(async(key, value) => {
    if (!preferences) return false;

    const updated = { ...preferences, [key]: value };
    return await savePreferences(updated);
  }, [preferences, savePreferences]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    loading,
    error,
    savePreferences,
    updatePreference,
    refreshPreferences: loadPreferences
  };
};

/**
 * Hook for managing market data cache
 */
export const useMarketDataCache = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCachedData = useCallback(async(symbol) => {
    setLoading(true);
    setError(null);
    try {
      const data = await financialDataStorage.getMarketData(symbol);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cacheData = useCallback(async(symbol, data, ttlMinutes = 15) => {
    try {
      await financialDataStorage.saveMarketData(symbol, data, ttlMinutes);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  const clearExpiredCache = useCallback(async() => {
    try {
      const cleanedCount = await financialDataStorage.cleanupExpiredMarketData();
      apiLogger.log('INFO', 'Market data cache cleaned', { cleanedCount });
      return cleanedCount;
    } catch (err) {
      setError(err.message);
      return 0;
    }
  }, []);

  return {
    loading,
    error,
    getCachedData,
    cacheData,
    clearExpiredCache
  };
};

/**
 * Hook for storage statistics and management
 */
export const useStorageStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async() => {
    setLoading(true);
    setError(null);
    try {
      const storageStats = await financialDataStorage.getFinancialDataStats();
      setStats(storageStats);
    } catch (err) {
      setError(err.message);
      apiLogger.log('ERROR', 'Failed to load storage stats', { error: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const exportData = useCallback(async() => {
    try {
      return await financialDataStorage.exportAllData();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const importData = useCallback(async(importData) => {
    try {
      const importCount = await financialDataStorage.importData(importData);
      await loadStats(); // Refresh stats after import
      return importCount;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    exportData,
    importData,
    refreshStats: loadStats
  };
};
