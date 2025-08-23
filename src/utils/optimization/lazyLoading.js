// Lazy Loading and Code Splitting Utilities
import { lazy, Suspense } from 'react';

// Component lazy loading with error boundaries
export const createLazyComponent = (importFunc, fallback = null) => {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={fallback || <ComponentSkeleton />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Default loading skeleton
const ComponentSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-20 bg-gray-200 rounded"></div>
  </div>
);

// Lazy load Phase 2 components
export const LazyCollaborationHub = createLazyComponent(
  () => import('../components/Collaboration/CollaborationHub'),
  <div className="w-60 h-96 bg-gray-100 rounded-lg animate-pulse"></div>
);

export const LazyInteractiveDashboard = createLazyComponent(
  () => import('../components/Dashboards/InteractiveDashboard'),
  <div className="w-full h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-gray-500">Loading Dashboard...</div>
  </div>
);

export const LazyAdvancedChart = createLazyComponent(
  () => import('../components/Visualizations/AdvancedChart'),
  <div className="w-full h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-gray-500">Loading Chart...</div>
  </div>
);

// Service lazy loading
class ServiceLoader {
  constructor() {
    this.loadedServices = new Map();
    this.loadingPromises = new Map();
  }

  async loadService(serviceName) {
    // Return cached service if already loaded
    if (this.loadedServices.has(serviceName)) {
      return this.loadedServices.get(serviceName);
    }

    // Return existing promise if currently loading
    if (this.loadingPromises.has(serviceName)) {
      return this.loadingPromises.get(serviceName);
    }

    // Create loading promise
    const loadingPromise = this.importService(serviceName);
    this.loadingPromises.set(serviceName, loadingPromise);

    try {
      const service = await loadingPromise;
      this.loadedServices.set(serviceName, service);
      this.loadingPromises.delete(serviceName);
      return service;
    } catch (error) {
      this.loadingPromises.delete(serviceName);
      throw error;
    }
  }

  async importService(serviceName) {
    const serviceMap = {
      versionControl: () => import('../services/collaboration/versionControl'),
      commenting: () => import('../services/collaboration/commentingSystem'),
      userPresence: () => import('../services/collaboration/userPresenceSystem'),
      notifications: () => import('../services/notifications/notificationSystem'),
      dashboards: () => import('../services/dashboards/interactiveDashboards'),
      presentations: () => import('../services/presentation/executivePresentationBuilder'),
      creditAnalysis: () => import('../services/credit/creditAnalysisModule'),
      riskAssessment: () => import('../services/risk/riskAssessmentTools'),
      templates: () => import('../services/dashboards/dashboardTemplateLibrary'),
      visualization: () => import('../services/visualization/dataVisualizationComponents'),
      exportSharing: () => import('../services/sharing/exportSharingService')
    };

    const importer = serviceMap[serviceName];
    if (!importer) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    const module = await importer();
    return module.default || module;
  }

  preloadServices(serviceNames) {
    return Promise.all(
      serviceNames.map(name => this.loadService(name).catch(err => {
        console.warn(`Failed to preload service ${name}:`, err);
        return null;
      }))
    );
  }
}

export const serviceLoader = new ServiceLoader();

// Intersection Observer for lazy loading
export class LazyLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };
    
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      this.options
    );
    
    this.loadingElements = new Map();
  }

  observe(element, loadCallback) {
    this.loadingElements.set(element, loadCallback);
    this.observer.observe(element);
  }

  unobserve(element) {
    this.loadingElements.delete(element);
    this.observer.unobserve(element);
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const callback = this.loadingElements.get(entry.target);
        if (callback) {
          callback(entry.target);
          this.unobserve(entry.target);
        }
      }
    });
  }

  destroy() {
    this.observer.disconnect();
    this.loadingElements.clear();
  }
}

// Hook for lazy loading components
export const useLazyLoad = (callback, dependencies = []) => {
  const elementRef = useRef(null);
  const lazyLoaderRef = useRef(null);

  useEffect(() => {
    if (!elementRef.current) return;

    lazyLoaderRef.current = new LazyLoader();
    lazyLoaderRef.current.observe(elementRef.current, callback);

    return () => {
      if (lazyLoaderRef.current) {
        lazyLoaderRef.current.destroy();
      }
    };
  }, dependencies);

  return elementRef;
};

// Image lazy loading with progressive enhancement
export const LazyImage = ({ src, alt, className, placeholder, ...props }) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  
  const imageRef = useLazyLoad(() => {
    setInView(true);
  });

  const handleLoad = () => {
    setLoaded(true);
  };

  return (
    <div ref={imageRef} className={`relative ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded">
          {placeholder || <div className="w-full h-full bg-gray-300 rounded"></div>}
        </div>
      )}
      {inView && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          {...props}
        />
      )}
    </div>
  );
};

// Bundle splitting utilities
export const splitBundle = {
  // Split by route
  route: (routeImport) => lazy(routeImport),
  
  // Split by feature
  feature: (featureImport) => lazy(featureImport),
  
  // Split by vendor libraries
  vendor: (vendorImport) => lazy(vendorImport)
};

// Preload critical resources
export const preloadCriticalResources = () => {
  const criticalServices = [
    'versionControl',
    'userPresence',
    'notifications'
  ];

  const criticalComponents = [
    '../components/Header/Header',
    '../components/Navigation/Navigation'
  ];

  // Preload services
  serviceLoader.preloadServices(criticalServices);

  // Preload components
  criticalComponents.forEach(component => {
    import(component).catch(err => {
      console.warn(`Failed to preload component ${component}:`, err);
    });
  });
};

// Resource priority hints
export const addResourceHints = () => {
  const hints = [
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'preconnect', href: process.env.REACT_APP_API_URL },
    { rel: 'preconnect', href: process.env.REACT_APP_WS_URL }
  ];

  hints.forEach(hint => {
    const link = document.createElement('link');
    Object.assign(link, hint);
    document.head.appendChild(link);
  });
};
