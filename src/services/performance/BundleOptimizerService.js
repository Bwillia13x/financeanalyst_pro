/**
 * Bundle Optimizer Service
 * Advanced bundle optimization and code splitting system
 * Manages lazy loading, chunking, and bundle size optimization
 */

class BundleOptimizerService {
  constructor(options = {}) {
    this.options = {
      enableCodeSplitting: true,
      enableLazyLoading: true,
      enablePrefetching: true,
      enablePreloading: true,
      maxChunkSize: 512 * 1024, // 512KB
      maxInitialBundle: 1024 * 1024, // 1MB
      prefetchThreshold: 100, // ms - prefetch routes after this delay
      preloadThreshold: 50, // ms - preload critical resources
      ...options
    };

    this.chunks = new Map();
    this.routes = new Map();
    this.resources = new Map();
    this.loadingStates = new Map();
    this.prefetchQueue = new Set();
    this.preloadQueue = new Set();

    this.isInitialized = false;
  }

  /**
   * Initialize bundle optimization
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.setupRouteBasedSplitting();
      this.setupResourceOptimization();
      this.setupIntersectionObserver();
      this.setupPerformanceHints();

      // Register service worker for caching if available
      if ('serviceWorker' in navigator) {
        this.registerServiceWorker();
      }

      this.isInitialized = true;
      console.log('Bundle Optimizer Service initialized');
    } catch (error) {
      console.error('Failed to initialize Bundle Optimizer:', error);
    }
  }

  /**
   * Setup route-based code splitting
   */
  setupRouteBasedSplitting() {
    if (!this.options.enableCodeSplitting) return;

    // Define route chunks
    this.routes.set('/', { chunk: 'home', priority: 'high' });
    this.routes.set('/dashboard', { chunk: 'dashboard', priority: 'high' });
    this.routes.set('/analytics', { chunk: 'analytics', priority: 'high' });
    this.routes.set('/reports', { chunk: 'reports', priority: 'medium' });
    this.routes.set('/collaboration', { chunk: 'collaboration', priority: 'medium' });
    this.routes.set('/settings', { chunk: 'settings', priority: 'low' });
    this.routes.set('/help', { chunk: 'help', priority: 'low' });

    // Setup route change detection
    this.setupRouteChangeDetection();
  }

  /**
   * Setup route change detection for prefetching
   */
  setupRouteChangeDetection() {
    let currentRoute = window.location.pathname;

    // Monitor route changes
    const observeRouteChanges = () => {
      const newRoute = window.location.pathname;
      if (newRoute !== currentRoute) {
        const previousRoute = currentRoute;
        currentRoute = newRoute;

        // Prefetch related routes
        this.handleRouteChange(previousRoute, newRoute);
      }
    };

    // Use history API to detect route changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      setTimeout(observeRouteChanges, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      setTimeout(observeRouteChanges, 0);
    };

    // Listen for popstate events
    window.addEventListener('popstate', observeRouteChanges);
  }

  /**
   * Handle route changes for prefetching
   */
  async handleRouteChange(from, to) {
    const routeConfig = this.routes.get(to);
    if (!routeConfig) return;

    // Prefetch current route chunk
    if (routeConfig.chunk) {
      setTimeout(() => {
        this.prefetchChunk(routeConfig.chunk);
      }, this.options.prefetchThreshold);
    }

    // Prefetch related routes based on navigation patterns
    this.prefetchRelatedRoutes(to);
  }

  /**
   * Prefetch related routes based on user behavior
   */
  prefetchRelatedRoutes(currentRoute) {
    const relatedRoutes = {
      '/': ['/dashboard', '/analytics'],
      '/dashboard': ['/analytics', '/reports'],
      '/analytics': ['/dashboard', '/reports'],
      '/reports': ['/analytics', '/collaboration'],
      '/collaboration': ['/reports', '/analytics']
    };

    const related = relatedRoutes[currentRoute] || [];
    related.forEach(route => {
      const config = this.routes.get(route);
      if (config && config.priority !== 'low') {
        this.prefetchRoute(route);
      }
    });
  }

  /**
   * Prefetch a route
   */
  async prefetchRoute(route) {
    if (this.prefetchQueue.has(route)) return;

    this.prefetchQueue.add(route);

    setTimeout(async () => {
      try {
        const routeConfig = this.routes.get(route);
        if (routeConfig?.chunk) {
          await this.prefetchChunk(routeConfig.chunk);
        }
      } catch (error) {
        console.warn(`Failed to prefetch route ${route}:`, error);
      } finally {
        this.prefetchQueue.delete(route);
      }
    }, this.options.prefetchThreshold);
  }

  /**
   * Prefetch a chunk
   */
  async prefetchChunk(chunkName) {
    if (this.chunks.has(chunkName)) return;

    try {
      // Create link element for prefetching
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = `${chunkName}.js`;
      link.as = 'script';

      // Add to document head
      document.head.appendChild(link);

      this.chunks.set(chunkName, {
        status: 'prefetching',
        element: link,
        timestamp: Date.now()
      });

      // Listen for load event
      link.onload = () => {
        this.chunks.set(chunkName, {
          ...this.chunks.get(chunkName),
          status: 'prefetched',
          loadedAt: Date.now()
        });
      };
    } catch (error) {
      console.warn(`Failed to prefetch chunk ${chunkName}:`, error);
    }
  }

  /**
   * Setup resource optimization
   */
  setupResourceOptimization() {
    this.resources.set('charts', {
      priority: 'high',
      dependencies: ['d3', 'chartjs'],
      loadCondition: () => this.isChartVisible()
    });

    this.resources.set('export', {
      priority: 'medium',
      dependencies: ['jspdf', 'xlsx'],
      loadCondition: () => this.isExportTriggered()
    });

    this.resources.set('collaboration', {
      priority: 'medium',
      dependencies: ['socket.io', 'operational-transform'],
      loadCondition: () => this.isCollaborationActive()
    });

    this.resources.set('advanced-analytics', {
      priority: 'low',
      dependencies: ['tensorflow', 'ml'],
      loadCondition: () => this.isAdvancedAnalyticsUsed()
    });
  }

  /**
   * Setup intersection observer for lazy loading
   */
  setupIntersectionObserver() {
    if (!this.options.enableLazyLoading) return;

    this.intersectionObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = entry.target;
            const resourceId = target.dataset.lazyResource;

            if (resourceId) {
              this.loadResource(resourceId);
              this.intersectionObserver.unobserve(target);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    );
  }

  /**
   * Setup performance hints
   */
  setupPerformanceHints() {
    // Add resource hints for critical resources
    this.addResourceHint('/api/config', 'preconnect');
    this.addResourceHint('https://fonts.googleapis.com', 'preconnect');
    this.addResourceHint('https://fonts.gstatic.com', 'preconnect');

    // DNS prefetch for external services
    this.addResourceHint('https://api.alphavantage.co', 'dns-prefetch');
    this.addResourceHint('https://www.alphavantage.co', 'dns-prefetch');
  }

  /**
   * Add resource hint
   */
  addResourceHint(href, rel, options = {}) {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;

    if (options.as) link.as = options.as;
    if (options.crossorigin) link.crossOrigin = options.crossorigin;

    document.head.appendChild(link);
  }

  /**
   * Register service worker for caching
   */
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration.scope);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.notifyUpdateAvailable();
            }
          });
        }
      });
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  }

  /**
   * Notify about available updates
   */
  notifyUpdateAvailable() {
    // In a real implementation, this would show a notification to the user
    console.log('New version available! Refresh to update.');
  }

  /**
   * Lazy load a resource
   */
  async loadResource(resourceId, priority = 'medium') {
    if (this.loadingStates.get(resourceId) === 'loading') return;

    this.loadingStates.set(resourceId, 'loading');

    try {
      const resource = this.resources.get(resourceId);
      if (!resource) {
        throw new Error(`Resource ${resourceId} not found`);
      }

      // Check load condition
      if (resource.loadCondition && !resource.loadCondition()) {
        this.loadingStates.set(resourceId, 'pending');
        return;
      }

      // Load dependencies
      const loadPromises = resource.dependencies.map(dep => this.loadModule(dep));

      await Promise.all(loadPromises);

      this.loadingStates.set(resourceId, 'loaded');
      console.log(`Resource ${resourceId} loaded successfully`);
    } catch (error) {
      console.error(`Failed to load resource ${resourceId}:`, error);
      this.loadingStates.set(resourceId, 'error');
    }
  }

  /**
   * Load a JavaScript module
   */
  async loadModule(moduleName) {
    return new Promise((resolve, reject) => {
      // Check if module is already loaded
      if (window[moduleName] || this.chunks.get(moduleName)?.status === 'loaded') {
        resolve(window[moduleName]);
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `${moduleName}.js`;
      script.async = true;

      script.onload = () => {
        this.chunks.set(moduleName, {
          status: 'loaded',
          loadedAt: Date.now()
        });
        resolve(window[moduleName]);
      };

      script.onerror = () => {
        reject(new Error(`Failed to load module: ${moduleName}`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Preload critical resources
   */
  preloadCriticalResources() {
    // Preload critical chunks
    this.preloadChunk('vendor');
    this.preloadChunk('main');
    this.preloadChunk('runtime');
  }

  /**
   * Preload a chunk
   */
  preloadChunk(chunkName) {
    if (this.preloadQueue.has(chunkName)) return;

    this.preloadQueue.add(chunkName);

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = `${chunkName}.js`;
    link.as = 'script';

    document.head.appendChild(link);

    this.chunks.set(chunkName, {
      status: 'preloading',
      element: link,
      timestamp: Date.now()
    });

    link.onload = () => {
      this.chunks.set(chunkName, {
        ...this.chunks.get(chunkName),
        status: 'preloaded',
        loadedAt: Date.now()
      });
      this.preloadQueue.delete(chunkName);
    };
  }

  /**
   * Mark element for lazy loading
   */
  observeLazyElement(element, resourceId) {
    if (this.intersectionObserver && element) {
      element.dataset.lazyResource = resourceId;
      this.intersectionObserver.observe(element);
    }
  }

  /**
   * Condition checkers for resource loading
   */
  isChartVisible() {
    return document.querySelector('[data-chart]') !== null;
  }

  isExportTriggered() {
    return document.querySelector('[data-export]') !== null;
  }

  isCollaborationActive() {
    return document.querySelector('[data-collaboration]') !== null;
  }

  isAdvancedAnalyticsUsed() {
    return document.querySelector('[data-advanced-analytics]') !== null;
  }

  /**
   * Get bundle statistics
   */
  getBundleStats() {
    const stats = {
      totalChunks: this.chunks.size,
      loadedChunks: Array.from(this.chunks.values()).filter(c => c.status === 'loaded').length,
      prefetchedChunks: Array.from(this.chunks.values()).filter(c => c.status === 'prefetched')
        .length,
      preloadedChunks: Array.from(this.chunks.values()).filter(c => c.status === 'preloaded')
        .length,
      loadingResources: Array.from(this.loadingStates.entries()).filter(
        ([_, status]) => status === 'loading'
      ).length,
      loadedResources: Array.from(this.loadingStates.entries()).filter(
        ([_, status]) => status === 'loaded'
      ).length,
      prefetchQueue: this.prefetchQueue.size,
      preloadQueue: this.preloadQueue.size
    };

    return stats;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const metrics = {
      chunksLoadTime: {},
      resourcesLoadTime: {},
      prefetchEfficiency: this.prefetchQueue.size === 0 ? 100 : 0,
      preloadEfficiency: this.preloadQueue.size === 0 ? 100 : 0
    };

    // Calculate average chunk load times
    for (const [chunkName, chunk] of this.chunks.entries()) {
      if (chunk.loadedAt && chunk.timestamp) {
        metrics.chunksLoadTime[chunkName] = chunk.loadedAt - chunk.timestamp;
      }
    }

    return metrics;
  }

  /**
   * Optimize for low bandwidth connections
   */
  optimizeForLowBandwidth() {
    // Reduce prefetching
    this.options.prefetchThreshold = 500; // Increase delay

    // Prioritize critical resources
    this.preloadCriticalResources();

    // Disable non-essential features
    this.options.enablePrefetching = false;
  }

  /**
   * Optimize for high bandwidth connections
   */
  optimizeForHighBandwidth() {
    // Aggressive prefetching
    this.options.prefetchThreshold = 50; // Reduce delay

    // Prefetch all high-priority routes
    for (const [route, config] of this.routes.entries()) {
      if (config.priority === 'high') {
        this.prefetchRoute(route);
      }
    }

    // Preload additional resources
    this.preloadChunk('polyfills');
    this.preloadChunk('styles');
  }

  /**
   * Detect connection type and optimize accordingly
   */
  detectAndOptimizeConnection() {
    if ('connection' in navigator) {
      const connection = navigator.connection;

      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        this.optimizeForLowBandwidth();
      } else if (connection.effectiveType === '4g' || connection.saveData === false) {
        this.optimizeForHighBandwidth();
      }

      // Listen for connection changes
      connection.addEventListener('change', () => {
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          this.optimizeForLowBandwidth();
        } else {
          this.optimizeForHighBandwidth();
        }
      });
    }
  }

  /**
   * Create dynamic import wrapper for lazy loading
   */
  createLazyComponent(importFunction, fallback = null) {
    return React.lazy(async () => {
      try {
        const module = await importFunction();

        // Track loading performance
        if (module.default) {
          performanceMonitorService.trackCustomMetric(
            `lazy_component_${module.default.name}`,
            Date.now(),
            'loading'
          );
        }

        return module;
      } catch (error) {
        console.error('Lazy loading failed:', error);

        // Return fallback component
        if (fallback) {
          return { default: fallback };
        }

        throw error;
      }
    });
  }

  /**
   * Export optimization data
   */
  exportOptimizationData() {
    return {
      chunks: Object.fromEntries(this.chunks),
      routes: Object.fromEntries(this.routes),
      resources: Object.fromEntries(this.resources),
      loadingStates: Object.fromEntries(this.loadingStates),
      options: this.options,
      stats: this.getBundleStats(),
      metrics: this.getPerformanceMetrics(),
      exportTimestamp: Date.now()
    };
  }

  /**
   * Clear optimization data
   */
  clearData() {
    this.chunks.clear();
    this.loadingStates.clear();
    this.prefetchQueue.clear();
    this.preloadQueue.clear();
  }

  /**
   * Shutdown the service
   */
  shutdown() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    this.clearData();
    this.isInitialized = false;

    console.log('Bundle Optimizer Service shutdown');
  }
}

// Export singleton instance
export const bundleOptimizerService = new BundleOptimizerService();
export default BundleOptimizerService;
