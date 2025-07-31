import React, { useState, useEffect, useRef, Suspense } from 'react';
import { trackFinancialComponentPerformance } from '../../utils/performanceMonitoring';

// Enhanced lazy loading component for financial components
const LazyLoader = ({ 
  children, 
  fallback = null,
  componentName = 'unknown',
  threshold = 0.1,
  rootMargin = '50px',
  preloadDelay = 2000,
  priority = 'normal',
  onLoad = null,
  onError = null,
  performanceTracking = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [preloadTimer, setPreloadTimer] = useState(null);
  
  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const loadStartTime = useRef(null);

  // Set up intersection observer
  useEffect(() => {
    if (!containerRef.current) return;

    const options = {
      threshold,
      rootMargin
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadStartTime.current = performance.now();
          setIsVisible(true);
          
          // Stop observing once visible
          if (observerRef.current) {
            observerRef.current.unobserve(entry.target);
          }
        }
      });
    }, options);

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (preloadTimer) {
        clearTimeout(preloadTimer);
      }
    };
  }, [threshold, rootMargin, preloadTimer]);

  // Preload high-priority components
  useEffect(() => {
    if (priority === 'high' && preloadDelay > 0) {
      const timer = setTimeout(() => {
        loadStartTime.current = performance.now();
        setIsVisible(true);
      }, preloadDelay);
      
      setPreloadTimer(timer);
    }
  }, [priority, preloadDelay]);

  // Track component load performance
  useEffect(() => {
    if (isLoaded && loadStartTime.current && performanceTracking) {
      const loadTime = performance.now() - loadStartTime.current;
      
      trackFinancialComponentPerformance(componentName, {
        loadTime,
        priority,
        lazy: true,
        timestamp: Date.now()
      });

      onLoad?.({ componentName, loadTime });
    }
  }, [isLoaded, componentName, priority, performanceTracking, onLoad]);

  // Handle load success
  const handleLoadSuccess = () => {
    setIsLoaded(true);
    setLoadError(null);
  };

  // Handle load error
  const handleLoadError = (error) => {
    setLoadError(error);
    onError?.(error);
    
    if (performanceTracking) {
      trackFinancialComponentPerformance(componentName, {
        loadError: error.message,
        priority,
        lazy: true,
        timestamp: Date.now()
      });
    }
  };

  // Default fallback component
  const defaultFallback = (
    <div className="animate-pulse bg-gray-100 rounded-lg p-6">
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  // Error fallback
  const errorFallback = (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Failed to load {componentName}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{loadError?.message || 'An unexpected error occurred'}</p>
          </div>
          <div className="mt-4">
            <button
              onClick={() => {
                setLoadError(null);
                setIsVisible(false);
                setTimeout(() => setIsVisible(true), 100);
              }}
              className="text-sm font-medium text-red-800 hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="lazy-loader-container">
      {!isVisible ? (
        fallback || defaultFallback
      ) : loadError ? (
        errorFallback
      ) : (
        <Suspense fallback={fallback || defaultFallback}>
          <ErrorBoundary 
            onError={handleLoadError}
            onLoad={handleLoadSuccess}
            componentName={componentName}
          >
            {children}
          </ErrorBoundary>
        </Suspense>
      )}
    </div>
  );
};

// Error boundary for lazy loaded components
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  componentDidMount() {
    if (!this.state.hasError) {
      this.props.onLoad?.();
    }
  }

  render() {
    if (this.state.hasError) {
      return null; // Let parent handle error display
    }

    return this.props.children;
  }
}

export default LazyLoader;