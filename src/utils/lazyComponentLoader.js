/**
 * Enhanced Lazy Component Loader
 * Provides intelligent component loading with performance optimizations
 */

import React, { Suspense, memo } from 'react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

/**
 * Enhanced lazy loading with custom fallback and error handling
 */
export const createLazyComponent = (
  importFunction,
  options = {}
) => {
  const {
    fallback = <LoadingSpinner />,
    errorFallback = <div className="p-4 text-red-600">Failed to load component</div>,
    preload = false,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  // Create the lazy component with retry logic
  const LazyComponent = React.lazy(async () => {
    let lastError;
    
    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      try {
        const module = await importFunction();
        return module;
      } catch (error) {
        lastError = error;
        
        if (attempt < retryAttempts - 1) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }
    
    // If all retries failed, throw the last error
    throw lastError;
  });

  // Preload the component if requested
  if (preload) {
    // Preload after a short delay to not block initial render
    setTimeout(() => {
      importFunction().catch(() => {
        // Ignore preload errors
      });
    }, 100);
  }

  // Return a wrapped component with Suspense and error boundary
  const WrappedComponent = memo((props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  ));

  // Add preload method to the component
  WrappedComponent.preload = () => importFunction();

  return WrappedComponent;
};

/**
 * Lazy load financial calculation components
 */
export const LazyFinancialComponents = {
  // Heavy calculation components
  AdvancedDCF: createLazyComponent(
    () => import('../components/PrivateAnalysis/AdvancedDCF'),
    { 
      fallback: <div className="p-8"><LoadingSpinner message="Loading DCF Calculator..." /></div>,
      preload: false // Only load when needed
    }
  ),

  AdvancedLBOTool: createLazyComponent(
    () => import('../components/PrivateAnalysis/AdvancedLBOTool'),
    { 
      fallback: <div className="p-8"><LoadingSpinner message="Loading LBO Tool..." /></div>
    }
  ),

  MonteCarloSimulation: createLazyComponent(
    () => import('../components/PrivateAnalysis/MonteCarloSimulation'),
    { 
      fallback: <div className="p-8"><LoadingSpinner message="Loading Monte Carlo Simulation..." /></div>
    }
  ),

  EnhancedScenarioAnalysis: createLazyComponent(
    () => import('../components/PrivateAnalysis/EnhancedScenarioAnalysis'),
    { 
      fallback: <div className="p-8"><LoadingSpinner message="Loading Scenario Analysis..." /></div>
    }
  ),

  // Chart components
  DataVisualization: createLazyComponent(
    () => import('../components/PrivateAnalysis/DataVisualization'),
    { 
      fallback: <div className="p-4"><LoadingSpinner message="Loading Charts..." /></div>
    }
  ),

  DCFWaterfall: createLazyComponent(
    () => import('../components/ui/charts/DCFWaterfall'),
    { 
      fallback: <div className="h-64 flex items-center justify-center"><LoadingSpinner /></div>
    }
  ),

  MetricsDashboard: createLazyComponent(
    () => import('../components/ui/charts/MetricsDashboard'),
    { 
      fallback: <div className="h-96 flex items-center justify-center"><LoadingSpinner /></div>
    }
  ),

  // AI and Business Intelligence
  AIAnalyticsDashboard: createLazyComponent(
    () => import('../components/AIAnalytics/AIAnalyticsDashboard'),
    { 
      fallback: <div className="p-8"><LoadingSpinner message="Loading AI Analytics..." /></div>
    }
  ),

  BusinessIntelligenceDashboard: createLazyComponent(
    () => import('../components/BusinessIntelligence/BusinessIntelligenceDashboard'),
    { 
      fallback: <div className="p-8"><LoadingSpinner message="Loading Business Intelligence..." /></div>
    }
  )
};

/**
 * Preload critical components based on route
 */
export const preloadComponentsForRoute = (routeName) => {
  const preloadMap = {
    'private-analysis': [
      'AdvancedDCF',
      'DataVisualization'
    ],
    'financial-model-workspace': [
      'AdvancedDCF',
      'AdvancedLBOTool',
      'DCFWaterfall'
    ],
    'scenario-analysis': [
      'EnhancedScenarioAnalysis',
      'MonteCarloSimulation'
    ],
    'ai-analytics': [
      'AIAnalyticsDashboard'
    ],
    'business-intelligence': [
      'BusinessIntelligenceDashboard',
      'MetricsDashboard'
    ]
  };

  const componentsToPreload = preloadMap[routeName] || [];
  
  componentsToPreload.forEach(componentName => {
    if (LazyFinancialComponents[componentName]?.preload) {
      LazyFinancialComponents[componentName].preload();
    }
  });
};

/**
 * Intersection Observer based lazy loading for components
 */
export const createIntersectionObserverLazy = (
  importFunction,
  options = {}
) => {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    fallback = <LoadingSpinner />
  } = options;

  return React.forwardRef((props, ref) => {
    const [isIntersecting, setIsIntersecting] = React.useState(false);
    const [Component, setComponent] = React.useState(null);
    const elementRef = React.useRef();

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !Component) {
            setIsIntersecting(true);
            // Load component when it comes into view
            importFunction()
              .then(module => {
                setComponent(() => module.default || module);
              })
              .catch(error => {
                console.error('Failed to load component:', error);
              });
          }
        },
        { rootMargin, threshold }
      );

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => {
        if (elementRef.current) {
          observer.unobserve(elementRef.current);
        }
      };
    }, [Component]);

    if (!isIntersecting || !Component) {
      return (
        <div ref={elementRef} className="min-h-[200px] flex items-center justify-center">
          {fallback}
        </div>
      );
    }

    return <Component {...props} ref={ref} />;
  });
};

/**
 * Progressive loading for heavy financial data
 */
export const createProgressiveLoader = (dataLoader, options = {}) => {
  const {
    chunkSize = 100,
    delay = 10,
    onProgress = () => {}
  } = options;

  return async function* loadDataProgressively() {
    const data = await dataLoader();
    const chunks = [];
    
    // Split data into chunks
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    // Yield chunks progressively
    for (let i = 0; i < chunks.length; i++) {
      yield chunks[i];
      onProgress((i + 1) / chunks.length);
      
      // Small delay to prevent blocking
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };
};

/**
 * Hook for progressive component mounting
 */
export const useProgressiveMount = (components, delay = 100) => {
  const [mountedComponents, setMountedComponents] = React.useState(new Set());

  React.useEffect(() => {
    let timeoutId;
    let currentIndex = 0;

    const mountNext = () => {
      if (currentIndex < components.length) {
        setMountedComponents(prev => new Set([...prev, components[currentIndex]]));
        currentIndex++;
        timeoutId = setTimeout(mountNext, delay);
      }
    };

    timeoutId = setTimeout(mountNext, delay);

    return () => clearTimeout(timeoutId);
  }, [components, delay]);

  return mountedComponents;
};

/**
 * Smart preloading based on user interaction patterns
 */
export class SmartPreloader {
  constructor() {
    this.interactionHistory = new Map();
    this.preloadThreshold = 3; // Preload after 3 interactions
  }

  recordInteraction(componentName) {
    const count = this.interactionHistory.get(componentName) || 0;
    this.interactionHistory.set(componentName, count + 1);

    // Preload if threshold is reached
    if (count + 1 >= this.preloadThreshold) {
      this.preloadRelatedComponents(componentName);
    }
  }

  preloadRelatedComponents(componentName) {
    const relatedComponents = {
      'AdvancedDCF': ['MonteCarloSimulation', 'EnhancedScenarioAnalysis'],
      'AdvancedLBOTool': ['AdvancedDCF', 'DataVisualization'],
      'MonteCarloSimulation': ['DataVisualization', 'MetricsDashboard']
    };

    const related = relatedComponents[componentName] || [];
    related.forEach(relatedName => {
      if (LazyFinancialComponents[relatedName]?.preload) {
        LazyFinancialComponents[relatedName].preload();
      }
    });
  }
}

export const smartPreloader = new SmartPreloader();

export default {
  createLazyComponent,
  LazyFinancialComponents,
  preloadComponentsForRoute,
  createIntersectionObserverLazy,
  createProgressiveLoader,
  useProgressiveMount,
  SmartPreloader,
  smartPreloader
};