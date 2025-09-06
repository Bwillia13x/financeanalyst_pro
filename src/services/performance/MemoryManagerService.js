/**
 * Memory Manager Service
 * Advanced memory management and leak prevention system
 * Monitors memory usage, prevents leaks, and optimizes garbage collection
 */

class MemoryManagerService {
  constructor(options = {}) {
    this.options = {
      enableMemoryMonitoring: true,
      enableLeakDetection: true,
      enableGCOptimization: true,
      memoryThreshold: 100 * 1024 * 1024, // 100MB
      leakDetectionInterval: 30000, // 30 seconds
      gcOptimizationInterval: 60000, // 1 minute
      maxRetainedObjects: 1000,
      ...options
    };

    this.memoryStats = {
      heapUsed: 0,
      heapTotal: 0,
      heapLimit: 0,
      external: 0,
      timestamp: Date.now()
    };

    this.objectRegistry = new Map();
    this.eventListeners = new Map();
    this.timers = new Set();
    this.intervals = new Set();
    this.observers = new Set();
    this.retainedObjects = new WeakMap();

    this.memoryPressure = false;
    this.gcHints = [];
    this.leakCandidates = new Set();

    this.isInitialized = false;
  }

  /**
   * Initialize memory management
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.setupMemoryMonitoring();
      this.setupLeakDetection();
      this.setupGCOptimization();
      this.setupEventCleanup();
      this.setupPerformanceIntegration();

      this.isInitialized = true;
      console.log('Memory Manager Service initialized');
    } catch (error) {
      console.error('Failed to initialize Memory Manager:', error);
    }
  }

  /**
   * Setup memory monitoring
   */
  setupMemoryMonitoring() {
    if (!this.options.enableMemoryMonitoring) return;

    // Monitor memory usage
    if (performance.memory) {
      setInterval(() => {
        this.updateMemoryStats();
        this.checkMemoryPressure();
      }, 5000); // Check every 5 seconds
    }

    // Monitor memory pressure events (Chrome)
    if ('memory' in performance) {
      this.addPerformanceObserver('memory', entry => {
        this.handleMemoryPressure(entry);
      });
    }
  }

  /**
   * Setup leak detection
   */
  setupLeakDetection() {
    if (!this.options.enableLeakDetection) return;

    setInterval(() => {
      this.detectMemoryLeaks();
    }, this.options.leakDetectionInterval);
  }

  /**
   * Setup garbage collection optimization
   */
  setupGCOptimization() {
    if (!this.options.enableGCOptimization) return;

    setInterval(() => {
      this.optimizeGarbageCollection();
    }, this.options.gcOptimizationInterval);
  }

  /**
   * Setup automatic event cleanup
   */
  setupEventCleanup() {
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Clean up on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.forceCleanup();
      }
    });
  }

  /**
   * Setup performance integration
   */
  setupPerformanceIntegration() {
    // Integrate with performance monitor service
    if (window.performanceMonitorService) {
      window.performanceMonitorService.on('memoryPressure', data => {
        this.handleMemoryPressure(data);
      });
    }
  }

  /**
   * Update memory statistics
   */
  updateMemoryStats() {
    if (!performance.memory) return;

    const memory = performance.memory;
    this.memoryStats = {
      heapUsed: memory.usedJSHeapSize,
      heapTotal: memory.totalJSHeapSize,
      heapLimit: memory.jsHeapSizeLimit,
      external: memory.external || 0,
      timestamp: Date.now()
    };

    // Emit memory stats update
    this.emit('memoryStatsUpdate', this.memoryStats);
  }

  /**
   * Check for memory pressure
   */
  checkMemoryPressure() {
    const usageRatio = this.memoryStats.heapUsed / this.memoryStats.heapLimit;

    if (usageRatio > 0.8 && !this.memoryPressure) {
      this.memoryPressure = true;
      this.emit('memoryPressure', {
        level: 'high',
        usageRatio,
        stats: this.memoryStats
      });

      // Trigger aggressive cleanup
      this.aggressiveCleanup();
    } else if (usageRatio < 0.6 && this.memoryPressure) {
      this.memoryPressure = false;
      this.emit('memoryPressureRelieved', {
        usageRatio,
        stats: this.memoryStats
      });
    }
  }

  /**
   * Handle memory pressure events
   */
  handleMemoryPressure(entry) {
    console.warn('Memory pressure detected:', entry);

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }

    // Trigger cleanup
    this.aggressiveCleanup();
  }

  /**
   * Register an object for memory tracking
   */
  registerObject(id, object, metadata = {}) {
    if (this.objectRegistry.size >= this.options.maxRetainedObjects) {
      console.warn('Maximum retained objects limit reached');
      return false;
    }

    this.objectRegistry.set(id, {
      object,
      metadata,
      registeredAt: Date.now(),
      lastAccessed: Date.now()
    });

    return true;
  }

  /**
   * Unregister an object
   */
  unregisterObject(id) {
    const entry = this.objectRegistry.get(id);
    if (entry) {
      this.objectRegistry.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Track object access
   */
  trackObjectAccess(id) {
    const entry = this.objectRegistry.get(id);
    if (entry) {
      entry.lastAccessed = Date.now();
    }
  }

  /**
   * Register event listener for cleanup
   */
  registerEventListener(element, event, handler, options = {}) {
    if (!element || !event || !handler) return null;

    // Store listener info for cleanup
    const listenerId = `listener_${Date.now()}_${Math.random()}`;
    const listenerInfo = {
      element,
      event,
      handler,
      options,
      registeredAt: Date.now()
    };

    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, new Map());
    }

    this.eventListeners.get(element).set(listenerId, listenerInfo);

    // Add the actual listener
    element.addEventListener(event, handler, options);

    return listenerId;
  }

  /**
   * Unregister event listener
   */
  unregisterEventListener(element, listenerId) {
    if (!element || !this.eventListeners.has(element)) return false;

    const listeners = this.eventListeners.get(element);
    const listenerInfo = listeners.get(listenerId);

    if (listenerInfo) {
      element.removeEventListener(listenerInfo.event, listenerInfo.handler, listenerInfo.options);
      listeners.delete(listenerId);

      if (listeners.size === 0) {
        this.eventListeners.delete(element);
      }

      return true;
    }

    return false;
  }

  /**
   * Register timer for cleanup
   */
  registerTimer(timerId) {
    this.timers.add(timerId);
    return timerId;
  }

  /**
   * Register interval for cleanup
   */
  registerInterval(intervalId) {
    this.intervals.add(intervalId);
    return intervalId;
  }

  /**
   * Register observer for cleanup
   */
  registerObserver(observer) {
    this.observers.add(observer);
    return observer;
  }

  /**
   * Create memory-safe timer
   */
  createTimer(callback, delay, options = {}) {
    const timerId = setTimeout(() => {
      this.timers.delete(timerId);
      callback();
    }, delay);

    this.registerTimer(timerId);

    if (options.autoCleanup !== false) {
      // Auto-cleanup after execution
      const originalCallback = callback;
      callback = () => {
        originalCallback();
        this.timers.delete(timerId);
      };
    }

    return timerId;
  }

  /**
   * Create memory-safe interval
   */
  createInterval(callback, interval, options = {}) {
    const intervalId = setInterval(callback, interval);
    this.registerInterval(intervalId);

    return intervalId;
  }

  /**
   * Clear registered timer
   */
  clearTimer(timerId) {
    if (this.timers.has(timerId)) {
      clearTimeout(timerId);
      this.timers.delete(timerId);
      return true;
    }
    return false;
  }

  /**
   * Clear registered interval
   */
  clearInterval(intervalId) {
    if (this.intervals.has(intervalId)) {
      clearInterval(intervalId);
      this.intervals.delete(intervalId);
      return true;
    }
    return false;
  }

  /**
   * Detect memory leaks
   */
  detectMemoryLeaks() {
    const now = Date.now();
    const leakThreshold = 5 * 60 * 1000; // 5 minutes

    // Check for objects that haven't been accessed recently
    for (const [id, entry] of this.objectRegistry.entries()) {
      if (now - entry.lastAccessed > leakThreshold) {
        this.leakCandidates.add(id);

        console.warn(`Potential memory leak detected for object: ${id}`, {
          registeredAt: entry.registeredAt,
          lastAccessed: entry.lastAccessed,
          timeSinceAccess: now - entry.lastAccessed
        });
      }
    }

    // Check for retained objects
    if (this.retainedObjects.size > 100) {
      console.warn(`High number of retained objects: ${this.retainedObjects.size}`);
    }

    this.emit('leakDetection', {
      candidates: Array.from(this.leakCandidates),
      retainedCount: this.retainedObjects.size
    });
  }

  /**
   * Optimize garbage collection
   */
  optimizeGarbageCollection() {
    // Clear references to unused objects
    this.clearUnusedReferences();

    // Force garbage collection if available (development only)
    if (window.gc && process.env.NODE_ENV === 'development') {
      window.gc();
    }

    // Optimize object registry
    this.optimizeObjectRegistry();

    this.emit('gcOptimization', {
      clearedReferences: true,
      optimizedRegistry: true
    });
  }

  /**
   * Clear unused references
   */
  clearUnusedReferences() {
    const now = Date.now();
    const cleanupThreshold = 10 * 60 * 1000; // 10 minutes

    // Clear old leak candidates
    for (const id of this.leakCandidates) {
      const entry = this.objectRegistry.get(id);
      if (entry && now - entry.lastAccessed > cleanupThreshold) {
        this.objectRegistry.delete(id);
        this.leakCandidates.delete(id);
      }
    }

    // Clear expired retained objects
    // Note: WeakMap automatically cleans up when keys are garbage collected
  }

  /**
   * Optimize object registry
   */
  optimizeObjectRegistry() {
    const maxAge = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();

    const keysToDelete = [];

    for (const [id, entry] of this.objectRegistry.entries()) {
      if (now - entry.lastAccessed > maxAge) {
        keysToDelete.push(id);
      }
    }

    for (const key of keysToDelete) {
      this.objectRegistry.delete(key);
    }

    if (keysToDelete.length > 0) {
      console.log(`Optimized object registry: removed ${keysToDelete.length} old entries`);
    }
  }

  /**
   * Aggressive cleanup for memory pressure
   */
  aggressiveCleanup() {
    console.log('Performing aggressive memory cleanup...');

    // Clear all non-essential caches
    if (window.cachingService) {
      window.cachingService.clear();
    }

    // Clear object registry
    this.objectRegistry.clear();

    // Clear leak candidates
    this.leakCandidates.clear();

    // Force cleanup of unused DOM elements
    this.cleanupDetachedElements();

    // Clear unused event listeners
    this.cleanupUnusedListeners();

    // Force garbage collection
    if (window.gc) {
      window.gc();
    }

    this.emit('aggressiveCleanup', {
      timestamp: Date.now(),
      cleared: true
    });
  }

  /**
   * Cleanup detached DOM elements
   */
  cleanupDetachedElements() {
    // This is a simplified version - in practice, you'd need a more sophisticated approach
    const detachedElements = document.querySelectorAll('[data-detached]');

    detachedElements.forEach(element => {
      if (!document.contains(element)) {
        element.remove();
      }
    });
  }

  /**
   * Cleanup unused event listeners
   */
  cleanupUnusedListeners() {
    // Clean up listeners for elements that no longer exist
    for (const [element, listeners] of this.eventListeners.entries()) {
      try {
        if (!document.contains(element)) {
          for (const [listenerId, listenerInfo] of listeners.entries()) {
            element.removeEventListener(
              listenerInfo.event,
              listenerInfo.handler,
              listenerInfo.options
            );
          }
          this.eventListeners.delete(element);
        }
      } catch (error) {
        // Element is not a valid DOM node or document is not available
        this.eventListeners.delete(element);
      }
    }
  }

  /**
   * Add performance observer
   */
  addPerformanceObserver(type, callback) {
    if (!('PerformanceObserver' in window)) return null;

    try {
      const observer = new PerformanceObserver(callback);
      observer.observe({ entryTypes: [type] });
      this.registerObserver(observer);

      return observer;
    } catch (error) {
      console.warn(`Failed to create performance observer for ${type}:`, error);
      return null;
    }
  }

  /**
   * Create memory-safe React component wrapper
   */
  createMemorySafeComponent(Component, options = {}) {
    return React.forwardRef((props, ref) => {
      // Track component lifecycle
      React.useEffect(() => {
        const componentId = `component_${Date.now()}_${Math.random()}`;

        if (options.trackMemory) {
          this.registerObject(
            componentId,
            { props, ref },
            {
              componentName: Component.name || 'Unknown',
              type: 'react_component'
            }
          );
        }

        return () => {
          if (options.trackMemory) {
            this.unregisterObject(componentId);
          }
        };
      }, []);

      // Memory-safe event handlers
      const createMemorySafeHandler = handler => {
        return (...args) => {
          if (handler) {
            handler(...args);
          }
        };
      };

      // Create memory-safe version of props
      const memorySafeProps = {};
      for (const [key, value] of Object.entries(props)) {
        if (typeof value === 'function') {
          memorySafeProps[key] = createMemorySafeHandler(value);
        } else {
          memorySafeProps[key] = value;
        }
      }

      return React.createElement(Component, {
        ...memorySafeProps,
        ref
      });
    });
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    const stats = {
      ...this.memoryStats,
      registrySize: this.objectRegistry.size,
      retainedObjects: this.retainedObjects.size,
      activeTimers: this.timers.size,
      activeIntervals: this.intervals.size,
      activeObservers: this.observers.size,
      leakCandidates: this.leakCandidates.size,
      memoryPressure: this.memoryPressure,
      gcHints: this.gcHints.length
    };

    // Add memory usage percentages
    if (this.memoryStats.heapLimit > 0) {
      stats.heapUsagePercent = (
        (this.memoryStats.heapUsed / this.memoryStats.heapLimit) *
        100
      ).toFixed(2);
      stats.heapTotalPercent = (
        (this.memoryStats.heapTotal / this.memoryStats.heapLimit) *
        100
      ).toFixed(2);
    }

    return stats;
  }

  /**
   * Get memory recommendations
   */
  getMemoryRecommendations() {
    const recommendations = [];
    const stats = this.getMemoryStats();

    if (stats.heapUsagePercent > 80) {
      recommendations.push({
        type: 'critical',
        message:
          'High memory usage detected. Consider reducing cached data or implementing pagination.',
        action: 'reduce_cache'
      });
    } else if (stats.heapUsagePercent > 60) {
      recommendations.push({
        type: 'warning',
        message: 'Memory usage is elevated. Monitor for potential leaks.',
        action: 'monitor_leaks'
      });
    }

    if (stats.leakCandidates > 10) {
      recommendations.push({
        type: 'warning',
        message: 'Potential memory leaks detected. Review object lifecycle management.',
        action: 'fix_leaks'
      });
    }

    if (stats.registrySize > 500) {
      recommendations.push({
        type: 'info',
        message: 'Large number of tracked objects. Consider optimizing object management.',
        action: 'optimize_registry'
      });
    }

    return recommendations;
  }

  /**
   * Force cleanup
   */
  forceCleanup() {
    // Clear all timers
    for (const timerId of this.timers) {
      clearTimeout(timerId);
    }
    this.timers.clear();

    // Clear all intervals
    for (const intervalId of this.intervals) {
      clearInterval(intervalId);
    }
    this.intervals.clear();

    // Disconnect all observers
    for (const observer of this.observers) {
      if (observer.disconnect) {
        observer.disconnect();
      }
    }
    this.observers.clear();

    // Clear object registry
    this.objectRegistry.clear();
    this.leakCandidates.clear();

    console.log('Forced memory cleanup completed');
  }

  /**
   * Full cleanup
   */
  cleanup() {
    this.forceCleanup();

    // Clear event listeners - WeakMap doesn't support iteration
    // We'll reset the entire WeakMap since we can't iterate over it
    this.eventListeners = new WeakMap();

    console.log('Full memory cleanup completed');
  }

  /**
   * Event emitter functionality
   */
  on(event, callback) {
    if (!this.eventListeners.has(this)) {
      this.eventListeners.set(this, new Map());
    }

    if (!this.eventListeners.get(this).has(event)) {
      this.eventListeners.get(this).set(event, []);
    }

    this.eventListeners.get(this).get(event).push(callback);
  }

  emit(event, data) {
    if (!this.eventListeners.has(this) || !this.eventListeners.get(this).has(event)) return;

    this.eventListeners
      .get(this)
      .get(event)
      .forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in memory manager ${event} callback:`, error);
        }
      });
  }

  /**
   * Export memory data for debugging
   */
  exportMemoryData() {
    return {
      stats: this.getMemoryStats(),
      registry: Array.from(this.objectRegistry.entries()),
      leakCandidates: Array.from(this.leakCandidates),
      recommendations: this.getMemoryRecommendations(),
      exportTimestamp: Date.now()
    };
  }

  /**
   * Shutdown the service
   */
  shutdown() {
    this.cleanup();
    this.isInitialized = false;

    console.log('Memory Manager Service shutdown');
  }
}

// Export singleton instance
export const memoryManagerService = new MemoryManagerService();
export default MemoryManagerService;
