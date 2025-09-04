import React, { Suspense, useState, useCallback, useEffect } from 'react';

import { cn } from '../../utils/cn';

// ===== INSTITUTIONAL LAZY LOADER =====

/**
 * Enhanced Lazy Loader with Institutional-Grade Features
 * Provides advanced loading states, error boundaries, and performance optimization
 */
export const InstitutionalLazyLoader = ({
  children,
  fallback,
  errorFallback,
  delay = 100,
  timeout = 10000,
  priority = 'normal',
  onLoad,
  onError,
  onTimeout,
  className,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState(null);

  // Track loading performance
  useEffect(() => {
    setLoadStartTime(performance.now());
  }, []);

  // Handle successful load
  const handleLoad = useCallback(() => {
    const loadTime = performance.now() - loadStartTime;
    setIsLoading(false);

    // Report performance metrics
    if (typeof window !== 'undefined' && window.performance && window.performance.mark) {
      window.performance.mark(`lazy-load-${priority}-complete`);
      window.performance.measure(
        `lazy-load-${priority}`,
        `lazy-load-${priority}-start`,
        `lazy-load-${priority}-complete`
      );
    }

    onLoad?.({ loadTime, priority });
  }, [loadStartTime, priority, onLoad]);

  // Handle loading error
  const handleError = useCallback(
    error => {
      setIsLoading(false);
      setHasError(true);

      onError?.(error);
    },
    [onError]
  );

  // Handle timeout
  const handleTimeout = useCallback(() => {
    setHasTimedOut(true);
    setIsLoading(false);

    onTimeout?.();
  }, [onTimeout]);

  // Setup timeout
  useEffect(() => {
    if (!timeout) return;

    const timer = setTimeout(() => {
      if (isLoading) {
        handleTimeout();
      }
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout, isLoading, handleTimeout]);

  // Custom error boundary for lazy loading
  class LazyErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      console.error('Lazy loading error:', error, errorInfo);
      handleError(error);
    }

    render() {
      if (this.state.hasError) {
        return (
          errorFallback || (
            <div className="flex items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-center">
                <div className="text-red-600 mb-2">
                  <svg
                    className="w-8 h-8 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-red-800 mb-1">Loading Failed</h3>
                <p className="text-xs text-red-600 mb-4">Unable to load component</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          )
        );
      }

      return this.props.children;
    }
  }

  // Enhanced fallback with institutional styling
  const defaultFallback = (
    <div className="flex items-center justify-center p-8 bg-background-secondary border border-border rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent mx-auto mb-4" />
        <p className="text-sm text-foreground-secondary">Loading...</p>
        {priority === 'high' && (
          <div className="mt-2 w-24 h-1 bg-background-tertiary rounded-full overflow-hidden">
            <div className="h-full bg-brand-accent animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );

  const enhancedFallback = fallback || defaultFallback;

  // Show timeout message if applicable
  if (hasTimedOut) {
    return (
      <div className="flex items-center justify-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-center">
          <div className="text-yellow-600 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-yellow-800 mb-1">Loading Timeout</h3>
          <p className="text-xs text-yellow-600 mb-4">Component took too long to load</p>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} {...props}>
      <LazyErrorBoundary>
        <Suspense fallback={enhancedFallback}>
          {React.cloneElement(children, {
            onLoad: handleLoad,
            onError: handleError
          })}
        </Suspense>
      </LazyErrorBoundary>
    </div>
  );
};

// ===== INSTITUTIONAL LAZY LOADING HOOK =====

export function useInstitutionalLazyLoad(options = {}) {
  const {
    priority = 'normal',
    preload = false,
    intersectionOptions = {},
    onLoad,
    onError,
    onVisible
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadTime, setLoadTime] = useState(null);
  const [error, setError] = useState(null);
  const elementRef = React.useRef();
  const loadStartTime = React.useRef();

  // Intersection Observer for visibility detection
  useEffect(() => {
    if (!elementRef.current || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            onVisible?.();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...intersectionOptions
      }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [isVisible, intersectionOptions, onVisible]);

  // Preload if requested
  useEffect(() => {
    if (preload && priority === 'high') {
      loadStartTime.current = performance.now();
      setIsVisible(true);
    }
  }, [preload, priority]);

  // Handle successful load
  const handleLoad = useCallback(() => {
    const endTime = performance.now();
    const time = loadStartTime.current ? endTime - loadStartTime.current : 0;

    setLoadTime(time);
    setIsLoaded(true);
    setError(null);

    onLoad?.({ loadTime: time, priority });
  }, [priority, onLoad]);

  // Handle error
  const handleError = useCallback(
    err => {
      setError(err);
      onError?.(err);
    },
    [onError]
  );

  return {
    elementRef,
    isVisible,
    isLoaded,
    loadTime,
    error,
    handleLoad,
    handleError,
    priority
  };
}

// ===== LAZY LOAD COMPONENT WRAPPER =====

export function withInstitutionalLazyLoad(Component, options = {}) {
  const {
    fallback,
    errorFallback,
    priority = 'normal',
    preload = false,
    delay = 100,
    timeout = 10000
  } = options;

  const LazyComponent = props => {
    const lazyLoad = useInstitutionalLazyLoad({
      priority,
      preload,
      onLoad: metrics => {
        // Track performance
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'lazy_load_complete', {
            event_category: 'performance',
            event_label: Component.name || 'unknown',
            value: Math.round(metrics.loadTime)
          });
        }
      }
    });

    if (!lazyLoad.isVisible && !preload) {
      return (
        <div
          ref={lazyLoad.elementRef}
          className="min-h-[200px] flex items-center justify-center bg-background-secondary rounded-lg"
        >
          <div className="text-center text-foreground-muted">
            <div className="animate-pulse w-8 h-8 bg-brand-accent/20 rounded-full mx-auto mb-2" />
            <p className="text-sm">Component will load when visible</p>
          </div>
        </div>
      );
    }

    return (
      <InstitutionalLazyLoader
        fallback={fallback}
        errorFallback={errorFallback}
        delay={delay}
        timeout={timeout}
        priority={priority}
        onLoad={lazyLoad.handleLoad}
        onError={lazyLoad.handleError}
      >
        <Component {...props} />
      </InstitutionalLazyLoader>
    );
  };

  LazyComponent.displayName = `Lazy${Component.displayName || Component.name || 'Component'}`;

  return LazyComponent;
}

// ===== PERFORMANCE MONITORING INTEGRATION =====

export function useLazyLoadPerformance() {
  const [metrics, setMetrics] = useState({
    totalComponents: 0,
    loadedComponents: 0,
    failedComponents: 0,
    averageLoadTime: 0,
    slowestComponent: null
  });

  const trackComponentLoad = useCallback((componentName, loadTime, success = true) => {
    setMetrics(prev => {
      const newMetrics = { ...prev };
      newMetrics.totalComponents += 1;

      if (success) {
        newMetrics.loadedComponents += 1;
        newMetrics.averageLoadTime =
          (newMetrics.averageLoadTime * (newMetrics.loadedComponents - 1) + loadTime) /
          newMetrics.loadedComponents;
      } else {
        newMetrics.failedComponents += 1;
      }

      if (!newMetrics.slowestComponent || loadTime > newMetrics.slowestComponent.loadTime) {
        newMetrics.slowestComponent = { name: componentName, loadTime };
      }

      return newMetrics;
    });

    // Send to analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', success ? 'lazy_load_success' : 'lazy_load_failure', {
        event_category: 'performance',
        event_label: componentName,
        value: Math.round(loadTime)
      });
    }
  }, []);

  const getPerformanceReport = useCallback(() => {
    return {
      ...metrics,
      successRate:
        metrics.totalComponents > 0
          ? (metrics.loadedComponents / metrics.totalComponents) * 100
          : 0,
      timestamp: new Date().toISOString()
    };
  }, [metrics]);

  return {
    metrics,
    trackComponentLoad,
    getPerformanceReport
  };
}

export default InstitutionalLazyLoader;
