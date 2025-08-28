/**
 * React Hook for Performance Optimization
 * Provides easy access to caching, lazy loading, and performance monitoring
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import performanceOptimizer from '../services/performanceOptimizer';

export function usePerformanceOptimizer() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const metricsInterval = useRef(null);

  useEffect(() => {
    // Initialize performance optimizer
    const init = async () => {
      if (performanceOptimizer.isInitialized) {
        setIsInitialized(true);
      } else {
        await performanceOptimizer.initializeOptimizer();
        setIsInitialized(true);
      }
    };

    init();

    // Setup metrics collection
    metricsInterval.current = setInterval(() => {
      const latestMetrics = performanceOptimizer.getPerformanceMetrics();
      if (latestMetrics.length > 0) {
        setMetrics(latestMetrics[latestMetrics.length - 1]);
      }
    }, 30000);

    return () => {
      if (metricsInterval.current) {
        clearInterval(metricsInterval.current);
      }
    };
  }, []);

  const getCached = useCallback(
    async (cacheId, key, fallbackFn) => {
      if (!isInitialized) return fallbackFn ? await fallbackFn() : null;
      return performanceOptimizer.get(cacheId, key, fallbackFn);
    },
    [isInitialized]
  );

  const setCached = useCallback(
    async (cacheId, key, value, options) => {
      if (!isInitialized) return false;
      return performanceOptimizer.set(cacheId, key, value, options);
    },
    [isInitialized]
  );

  const lazyLoad = useCallback(
    async (componentId, loader, options) => {
      if (!isInitialized) return loader();
      return performanceOptimizer.lazyLoad(componentId, loader, options);
    },
    [isInitialized]
  );

  const batchLoad = useCallback(
    async (requests, options) => {
      if (!isInitialized) {
        return Promise.allSettled(requests.map(req => req.loader()));
      }
      return performanceOptimizer.batchLoad(requests, options);
    },
    [isInitialized]
  );

  const getCacheStats = useCallback(
    cacheId => {
      if (!isInitialized) return null;
      return performanceOptimizer.getCacheStats(cacheId);
    },
    [isInitialized]
  );

  const clearCache = useCallback(
    cacheId => {
      if (!isInitialized) return false;
      return performanceOptimizer.clearCache(cacheId);
    },
    [isInitialized]
  );

  return {
    isInitialized,
    metrics,
    getCached,
    setCached,
    lazyLoad,
    batchLoad,
    getCacheStats,
    clearCache
  };
}

export function useCachedData(cacheId, key, loader, _options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getCached } = usePerformanceOptimizer();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const cachedData = await getCached(cacheId, key, async () => {
          return await loader();
        });

        if (isMounted) {
          setData(cachedData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [cacheId, key, loader, getCached]);

  return { data, loading, error };
}

export function useLazyComponent(componentId, loader, options = {}) {
  const [Component, setComponent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { lazyLoad } = usePerformanceOptimizer();
  const elementRef = useRef(null);

  const loadComponent = useCallback(async () => {
    if (Component) return Component;

    try {
      setLoading(true);
      setError(null);

      const loadedComponent = await lazyLoad(componentId, loader, {
        ...options,
        element: elementRef.current
      });

      setComponent(loadedComponent);
      return loadedComponent;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [componentId, loader, options, lazyLoad, Component]);

  return {
    Component,
    loading,
    error,
    loadComponent,
    elementRef
  };
}

export function usePerformanceMonitor() {
  const [webVitals, setWebVitals] = useState({});
  const [resourceMetrics, setResourceMetrics] = useState({});
  const { metrics } = usePerformanceOptimizer();

  useEffect(() => {
    if (metrics) {
      if (metrics.memory) {
        setResourceMetrics(prev => ({
          ...prev,
          memory: metrics.memory,
          timestamp: metrics.timestamp
        }));
      }

      if (metrics.caches) {
        setResourceMetrics(prev => ({
          ...prev,
          caches: metrics.caches
        }));
      }
    }
  }, [metrics]);

  useEffect(() => {
    // Monitor Web Vitals
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'largest-contentful-paint':
            setWebVitals(prev => ({
              ...prev,
              lcp: entry.startTime
            }));
            break;
          case 'first-input':
            setWebVitals(prev => ({
              ...prev,
              fid: entry.processingStart - entry.startTime
            }));
            break;
          case 'layout-shift':
            if (!entry.hadRecentInput) {
              setWebVitals(prev => ({
                ...prev,
                cls: (prev.cls || 0) + entry.value
              }));
            }
            break;
        }
      }
    });

    if ('PerformanceObserver' in window) {
      try {
        observer.observe({
          entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift']
        });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return {
    webVitals,
    resourceMetrics,
    isGood: {
      lcp: webVitals.lcp < 2500,
      fid: webVitals.fid < 100,
      cls: webVitals.cls < 0.1
    }
  };
}
