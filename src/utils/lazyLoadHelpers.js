import { lazy, Suspense, Component, useEffect, useCallback } from 'react';

// Utility functions for lazy loading financial components

// Dynamic import helper with error handling and retry logic
export async function lazyImport(importFunction, componentName, retryCount = 3) {
  let lastError;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const startTime = performance.now();
      const module = await importFunction();
      const loadTime = performance.now() - startTime;

      console.log(`Lazy loaded ${componentName} in ${Math.round(loadTime)}ms (attempt ${attempt})`);

      return module;
    } catch (error) {
      lastError = error;
      console.warn(`Failed to lazy load ${componentName} (attempt ${attempt}):`, error);

      if (attempt < retryCount) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed to load ${componentName} after ${retryCount} attempts: ${lastError.message}`
  );
}

// Create lazy component with enhanced error handling
export function createLazyComponent(importFunction, componentName, options = {}) {
  const {
    fallback = null,
    errorFallback = null,
    retryCount = 3,
    onLoad = null,
    onError = null
  } = options;

  const LazyComponent = lazy(async () => {
    try {
      const startTime = performance.now();
      const module = await lazyImport(importFunction, componentName, retryCount);
      const loadTime = performance.now() - startTime;

      onLoad?.({ componentName, loadTime });

      return module;
    } catch (error) {
      onError?.({ componentName, error });
      throw error;
    }
  });

  // Return wrapped component with Suspense and error boundary
  return function WrappedLazyComponent(props) {
    return (
      <Suspense fallback={fallback}>
        <ErrorBoundary fallback={errorFallback} componentName={componentName}>
          <LazyComponent {...props} />
        </ErrorBoundary>
      </Suspense>
    );
  };
}

// Error boundary for lazy components
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`Error in lazy component ${this.props.componentName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Failed to load component</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>The {this.props.componentName} component could not be loaded.</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm font-medium text-red-800 hover:text-red-900"
                >
                  Reload page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Preload component based on user interaction hints
export function preloadComponent(importFunction, componentName) {
  return lazyImport(importFunction, componentName, 1).catch(error => {
    console.warn(`Failed to preload ${componentName}:`, error);
  });
}

// Preload on hover with debouncing
export function preloadOnHover(element, importFunction, componentName, delay = 200) {
  let timeoutId;
  let isPreloaded = false;

  const handleMouseEnter = () => {
    if (isPreloaded) return;

    timeoutId = setTimeout(() => {
      preloadComponent(importFunction, componentName).then(() => {
        isPreloaded = true;
      });
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  element.addEventListener('mouseenter', handleMouseEnter);
  element.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter);
    element.removeEventListener('mouseleave', handleMouseLeave);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}

// Preload based on route prefetching
export function preloadRoute(routePath, componentImports) {
  const currentPath = window.location.pathname;

  // Preload if user is on a related route
  const isRelated = routePath
    .split('/')
    .some(segment => currentPath.includes(segment) && segment !== '');

  if (isRelated) {
    componentImports.forEach(({ importFunction, componentName }) => {
      preloadComponent(importFunction, componentName);
    });
  }
}

// Intelligent preloading based on user behavior
export class IntelligentPreloader {
  constructor() {
    this.userInteractions = new Map();
    this.preloadQueue = new Set();
    this.preloadedComponents = new Set();
    this.isIdle = false;

    this.initIdleDetection();
  }

  // Track user interactions
  trackInteraction(componentName, interactionType = 'view') {
    const key = componentName;
    const current = this.userInteractions.get(key) || { count: 0, lastInteraction: 0 };

    this.userInteractions.set(key, {
      count: current.count + 1,
      lastInteraction: Date.now(),
      interactionType
    });

    // If user interacts with similar components frequently, preload related ones
    this.suggestPreloads(componentName);
  }

  // Suggest components to preload based on interaction patterns
  suggestPreloads(componentName) {
    const relatedComponents = this.getRelatedComponents(componentName);

    relatedComponents.forEach(related => {
      if (!this.preloadedComponents.has(related.name) && this.isIdle) {
        this.preloadQueue.add(related);
      }
    });

    this.processPreloadQueue();
  }

  // Get related components based on naming patterns and user behavior
  getRelatedComponents(componentName) {
    const related = [];

    // Example patterns for financial components
    if (componentName.includes('calculator')) {
      related.push(
        { name: 'financial-spreadsheet', priority: 'high' },
        { name: 'results-chart', priority: 'medium' }
      );
    } else if (componentName.includes('chart')) {
      related.push(
        { name: 'data-table', priority: 'high' },
        { name: 'export-options', priority: 'medium' }
      );
    } else if (componentName.includes('spreadsheet')) {
      related.push(
        { name: 'formula-builder', priority: 'high' },
        { name: 'chart-generator', priority: 'medium' }
      );
    }

    return related;
  }

  // Process preload queue during idle time
  async processPreloadQueue() {
    if (!this.isIdle || this.preloadQueue.size === 0) return;

    const components = Array.from(this.preloadQueue).sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const component of components.slice(0, 3)) {
      // Limit concurrent preloads
      try {
        // This would need to be connected to your actual import functions
        console.log(`Preloading ${component.name} (priority: ${component.priority})`);
        this.preloadedComponents.add(component.name);
        this.preloadQueue.delete(component);
      } catch (error) {
        console.warn(`Failed to preload ${component.name}:`, error);
        this.preloadQueue.delete(component);
      }
    }
  }

  // Detect when user is idle
  initIdleDetection() {
    let idleTimeout;
    const IDLE_TIME = 2000; // 2 seconds

    const resetIdleTimer = () => {
      this.isIdle = false;
      clearTimeout(idleTimeout);

      idleTimeout = setTimeout(() => {
        this.isIdle = true;
        this.processPreloadQueue();
      }, IDLE_TIME);
    };

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    // Initial idle timer
    resetIdleTimer();
  }

  // Get preloading statistics
  getStats() {
    return {
      totalInteractions: Array.from(this.userInteractions.values()).reduce(
        (sum, interaction) => sum + interaction.count,
        0
      ),
      uniqueComponents: this.userInteractions.size,
      preloadQueue: this.preloadQueue.size,
      preloadedComponents: this.preloadedComponents.size,
      isIdle: this.isIdle
    };
  }
}

// Global preloader instance
export const intelligentPreloader = new IntelligentPreloader();

// HOC for automatic interaction tracking
export function withPreloadTracking(WrappedComponent, componentName) {
  return function PreloadTrackedComponent(props) {
    useEffect(() => {
      intelligentPreloader.trackInteraction(componentName, 'mount');

      return () => {
        intelligentPreloader.trackInteraction(componentName, 'unmount');
      };
    }, []);

    return <WrappedComponent {...props} />;
  };
}

// Hook for tracking component interactions
export function usePreloadTracking(componentName) {
  useEffect(() => {
    intelligentPreloader.trackInteraction(componentName, 'mount');
  }, [componentName]);

  const trackInteraction = useCallback(
    interactionType => {
      intelligentPreloader.trackInteraction(componentName, interactionType);
    },
    [componentName]
  );

  return { trackInteraction };
}
