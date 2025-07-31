import { useState, useEffect, useRef, useCallback } from 'react';
import { trackFinancialComponentPerformance } from '../utils/performanceMonitoring';

// Hook for lazy loading financial components with performance tracking
export function useLazyLoad(options = {}) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    componentName = 'unknown',
    preloadDelay = null,
    priority = 'normal',
    performanceTracking = true
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  
  const elementRef = useRef(null);
  const observerRef = useRef(null);
  const loadStartTime = useRef(null);

  // Initialize intersection observer
  const initObserver = useCallback(() => {
    if (!elementRef.current || observerRef.current) return;

    const observerOptions = {
      threshold,
      rootMargin
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadStartTime.current = performance.now();
          setIsVisible(true);
          
          // Disconnect observer after first intersection
          if (observerRef.current) {
            observerRef.current.unobserve(entry.target);
          }
        }
      });
    }, observerOptions);

    observerRef.current.observe(elementRef.current);
  }, [threshold, rootMargin]);

  // Handle element ref changes
  const setElementRef = useCallback((element) => {
    elementRef.current = element;
    if (element) {
      initObserver();
    }
  }, [initObserver]);

  // Preload based on priority
  useEffect(() => {
    if (priority === 'high' && preloadDelay) {
      const timer = setTimeout(() => {
        loadStartTime.current = performance.now();
        setIsVisible(true);
      }, preloadDelay);

      return () => clearTimeout(timer);
    } else if (priority === 'critical') {
      // Load immediately for critical components
      loadStartTime.current = performance.now();
      setIsVisible(true);
    }
  }, [priority, preloadDelay]);

  // Mark as loaded and track performance
  const markAsLoaded = useCallback(() => {
    setIsLoaded(true);
    setLoadError(null);

    if (loadStartTime.current && performanceTracking) {
      const loadTime = performance.now() - loadStartTime.current;
      
      trackFinancialComponentPerformance(componentName, {
        loadTime,
        priority,
        lazy: true,
        componentType: 'lazy-loaded',
        timestamp: Date.now()
      });
    }
  }, [componentName, priority, performanceTracking]);

  // Handle load errors
  const markAsError = useCallback((error) => {
    setLoadError(error);
    
    if (performanceTracking) {
      trackFinancialComponentPerformance(componentName, {
        loadError: error?.message || 'Unknown error',
        priority,
        lazy: true,
        componentType: 'lazy-loaded',
        timestamp: Date.now()
      });
    }
  }, [componentName, priority, performanceTracking]);

  // Reset lazy loading state
  const reset = useCallback(() => {
    setIsVisible(false);
    setIsLoaded(false);
    setLoadError(null);
    loadStartTime.current = null;
    
    // Reinitialize observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    initObserver();
  }, [initObserver]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    isVisible,
    isLoaded,
    loadError,
    elementRef: setElementRef,
    markAsLoaded,
    markAsError,
    reset
  };
}

// Hook for preloading multiple components
export function usePreloadComponents() {
  const [preloadQueue, setPreloadQueue] = useState([]);
  const [preloadedComponents, setPreloadedComponents] = useState(new Set());

  // Add component to preload queue
  const queuePreload = useCallback((componentName, loadFunction, priority = 'normal') => {
    setPreloadQueue(prev => [...prev, { componentName, loadFunction, priority }]);
  }, []);

  // Process preload queue
  useEffect(() => {
    if (preloadQueue.length === 0) return;

    const processQueue = async () => {
      // Sort by priority (critical > high > normal > low)
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      const sortedQueue = [...preloadQueue].sort((a, b) => 
        priorityOrder[a.priority] - priorityOrder[b.priority]
      );

      for (const { componentName, loadFunction } of sortedQueue) {
        if (preloadedComponents.has(componentName)) continue;

        try {
          const startTime = performance.now();
          await loadFunction();
          const loadTime = performance.now() - startTime;

          trackFinancialComponentPerformance(componentName, {
            loadTime,
            preloaded: true,
            componentType: 'preloaded',
            timestamp: Date.now()
          });

          setPreloadedComponents(prev => new Set([...prev, componentName]));
        } catch (error) {
          console.error(`Failed to preload ${componentName}:`, error);
          
          trackFinancialComponentPerformance(componentName, {
            preloadError: error.message,
            preloaded: false,
            componentType: 'preloaded',
            timestamp: Date.now()
          });
        }
      }

      setPreloadQueue([]);
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if (window.requestIdleCallback) {
      window.requestIdleCallback(processQueue, { timeout: 5000 });
    } else {
      setTimeout(processQueue, 100);
    }
  }, [preloadQueue, preloadedComponents]);

  // Check if component is preloaded
  const isPreloaded = useCallback((componentName) => {
    return preloadedComponents.has(componentName);
  }, [preloadedComponents]);

  return {
    queuePreload,
    isPreloaded,
    preloadedCount: preloadedComponents.size
  };
}

// Hook for financial component lazy loading with specific optimizations
export function useFinancialLazyLoad(componentType, options = {}) {
  const componentConfigs = {
    'spreadsheet': {
      priority: 'high',
      preloadDelay: 1000,
      threshold: 0.2,
      rootMargin: '100px'
    },
    'chart': {
      priority: 'normal',
      preloadDelay: 2000,
      threshold: 0.1,
      rootMargin: '50px'
    },
    'calculator': {
      priority: 'critical',
      preloadDelay: null,
      threshold: 0.1,
      rootMargin: '25px'
    },
    'report': {
      priority: 'normal',
      preloadDelay: 3000,
      threshold: 0.1,
      rootMargin: '75px'
    },
    'analysis': {
      priority: 'high',
      preloadDelay: 1500,
      threshold: 0.15,
      rootMargin: '80px'
    }
  };

  const config = componentConfigs[componentType] || componentConfigs.chart;
  const mergedOptions = {
    componentName: `financial-${componentType}`,
    ...config,
    ...options
  };

  const lazyLoad = useLazyLoad(mergedOptions);

  // Additional financial component tracking
  useEffect(() => {
    if (lazyLoad.isLoaded) {
      trackFinancialComponentPerformance(`financial-${componentType}`, {
        componentType,
        loadComplete: true,
        timestamp: Date.now()
      });
    }
  }, [lazyLoad.isLoaded, componentType]);

  return lazyLoad;
}

// Hook for managing component loading states across the app
export function useLazyLoadManager() {
  const [loadingComponents, setLoadingComponents] = useState(new Map());
  const [loadedComponents, setLoadedComponents] = useState(new Set());
  const [failedComponents, setFailedComponents] = useState(new Map());

  const registerLoading = useCallback((componentName) => {
    setLoadingComponents(prev => new Map(prev.set(componentName, Date.now())));
  }, []);

  const registerLoaded = useCallback((componentName) => {
    setLoadingComponents(prev => {
      const newMap = new Map(prev);
      newMap.delete(componentName);
      return newMap;
    });
    setLoadedComponents(prev => new Set([...prev, componentName]));
  }, []);

  const registerFailed = useCallback((componentName, error) => {
    setLoadingComponents(prev => {
      const newMap = new Map(prev);
      newMap.delete(componentName);
      return newMap;
    });
    setFailedComponents(prev => new Map(prev.set(componentName, error)));
  }, []);

  const retry = useCallback((componentName) => {
    setFailedComponents(prev => {
      const newMap = new Map(prev);
      newMap.delete(componentName);
      return newMap;
    });
  }, []);

  const getStats = useCallback(() => {
    return {
      loading: loadingComponents.size,
      loaded: loadedComponents.size,
      failed: failedComponents.size,
      total: loadingComponents.size + loadedComponents.size + failedComponents.size
    };
  }, [loadingComponents, loadedComponents, failedComponents]);

  return {
    registerLoading,
    registerLoaded,
    registerFailed,
    retry,
    getStats,
    loadingComponents: Array.from(loadingComponents.keys()),
    loadedComponents: Array.from(loadedComponents),
    failedComponents: Array.from(failedComponents.entries())
  };
}