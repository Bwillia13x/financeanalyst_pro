import { useState, useEffect, useCallback, useRef } from 'react';
import financialDataCache from '../utils/financialDataCache';

// Custom hook for financial data caching
export function useFinancialCache(key, fetchFunction, options = {}) {
  const {
    dataType = 'api-response',
    enabled = true,
    requireFresh = false,
    refetchOnWindowFocus = false,
    refetchInterval = null,
    onSuccess = null,
    onError = null,
    retryCount = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const fetchFunctionRef = useRef(fetchFunction);
  const retryTimeoutRef = useRef(null);
  const refetchIntervalRef = useRef(null);

  // Update fetch function ref when it changes
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);

  // Main fetch function with caching
  const fetchData = useCallback(async (bypassCache = false) => {
    if (!enabled || !key) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await financialDataCache.get(key, {
        dataType,
        fetchFallback: fetchFunctionRef.current,
        bypassCache,
        requireFresh
      });

      setData(result);
      setLastFetch(Date.now());
      setRetryAttempt(0);
      
      onSuccess?.(result);
    } catch (err) {
      console.error('Cache fetch failed:', err);
      setError(err);
      
      // Retry logic
      if (retryAttempt < retryCount) {
        const delay = retryDelay * Math.pow(2, retryAttempt); // Exponential backoff
        retryTimeoutRef.current = setTimeout(() => {
          setRetryAttempt(prev => prev + 1);
          fetchData(bypassCache);
        }, delay);
      } else {
        onError?.(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [key, dataType, enabled, requireFresh, retryAttempt, retryCount, retryDelay, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup retry timeout
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      refetchIntervalRef.current = setInterval(() => {
        fetchData();
      }, refetchInterval);

      return () => {
        if (refetchIntervalRef.current) {
          clearInterval(refetchIntervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, fetchData]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (enabled && document.visibilityState === 'visible') {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [refetchOnWindowFocus, enabled, fetchData]);

  // Manual refetch function
  const refetch = useCallback((bypassCache = false) => {
    return fetchData(bypassCache);
  }, [fetchData]);

  // Mutate cache data
  const mutate = useCallback(async (updater) => {
    const currentData = data;
    
    try {
      const newData = typeof updater === 'function' ? updater(currentData) : updater;
      
      // Optimistically update local state
      setData(newData);
      
      // Update cache
      await financialDataCache.set(key, newData, dataType);
      
      return newData;
    } catch (err) {
      // Revert on error
      setData(currentData);
      throw err;
    }
  }, [key, dataType, data]);

  // Invalidate cache entry
  const invalidate = useCallback(() => {
    financialDataCache.delete(key);
    setData(null);
    setError(null);
    setLastFetch(null);
  }, [key]);

  return {
    data,
    isLoading,
    error,
    lastFetch,
    refetch,
    mutate,
    invalidate,
    retryAttempt
  };
}

// Hook for market data with specific optimizations
export function useMarketData(symbol, options = {}) {
  const fetchMarketData = useCallback(async () => {
    if (!symbol) throw new Error('Symbol is required');
    
    // Simulate API call - replace with actual market data API
    const response = await fetch(`/api/market/${symbol}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch market data for ${symbol}`);
    }
    return response.json();
  }, [symbol]);

  return useFinancialCache(
    symbol ? `market-${symbol}` : null,
    fetchMarketData,
    {
      dataType: 'market-data',
      refetchInterval: 30000, // 30 seconds
      refetchOnWindowFocus: true,
      ...options
    }
  );
}

// Hook for company financials
export function useCompanyFinancials(symbol, options = {}) {
  const fetchFinancials = useCallback(async () => {
    if (!symbol) throw new Error('Symbol is required');
    
    const response = await fetch(`/api/financials/${symbol}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch financials for ${symbol}`);
    }
    return response.json();
  }, [symbol]);

  return useFinancialCache(
    symbol ? `financials-${symbol}` : null,
    fetchFinancials,
    {
      dataType: 'company-financials',
      refetchInterval: 15 * 60 * 1000, // 15 minutes
      ...options
    }
  );
}

// Hook for user models with authentication
export function useUserModel(modelId, options = {}) {
  const fetchUserModel = useCallback(async () => {
    if (!modelId) throw new Error('Model ID is required');
    
    const token = localStorage.getItem('auth-token');
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`/api/models/${modelId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch model ${modelId}`);
    }
    
    return response.json();
  }, [modelId]);

  return useFinancialCache(
    modelId ? `model-${modelId}` : null,
    fetchUserModel,
    {
      dataType: 'user-models',
      ...options
    }
  );
}

// Hook for private analysis data
export function usePrivateAnalysis(analysisId, options = {}) {
  const fetchAnalysis = useCallback(async () => {
    if (!analysisId) throw new Error('Analysis ID is required');
    
    const token = localStorage.getItem('auth-token');
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`/api/analysis/${analysisId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch analysis ${analysisId}`);
    }
    
    return response.json();
  }, [analysisId]);

  return useFinancialCache(
    analysisId ? `analysis-${analysisId}` : null,
    fetchAnalysis,
    {
      dataType: 'private-analysis',
      requireFresh: true, // Always get fresh private analysis data
      ...options
    }
  );
}

// Hook for cache statistics and management
export function useCacheManager() {
  const [stats, setStats] = useState(null);

  const refreshStats = useCallback(() => {
    const currentStats = financialDataCache.getStats();
    setStats(currentStats);
  }, []);

  const clearCache = useCallback((filter) => {
    financialDataCache.clear(filter);
    refreshStats();
  }, [refreshStats]);

  const clearSensitiveData = useCallback(() => {
    financialDataCache.clear((key, metadata) => 
      metadata.dataType === 'private-analysis' || 
      metadata.dataType === 'user-models'
    );
    refreshStats();
  }, [refreshStats]);

  // Refresh stats on mount and periodically
  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    stats,
    refreshStats,
    clearCache,
    clearSensitiveData
  };
}

// Hook for preloading data
export function usePreloadData() {
  const preload = useCallback(async (keys, dataType = 'api-response') => {
    const promises = keys.map(key => 
      financialDataCache.get(key, { dataType, requireFresh: false })
        .catch(error => {
          console.warn(`Failed to preload ${key}:`, error);
          return null;
        })
    );
    
    return Promise.allSettled(promises);
  }, []);

  return { preload };
}