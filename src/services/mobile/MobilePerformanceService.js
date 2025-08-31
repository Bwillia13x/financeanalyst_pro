/**
 * Mobile Performance Service
 * Mobile-specific performance optimizations and monitoring
 * Handles battery optimization, memory management, and performance monitoring
 */

class MobilePerformanceService {
  constructor(options = {}) {
    this.options = {
      enableBatteryOptimization: true,
      enableMemoryOptimization: true,
      enableNetworkOptimization: true,
      enablePerformanceMonitoring: true,
      batteryThreshold: 20, // Battery level threshold for optimizations
      memoryThreshold: 50 * 1024 * 1024, // 50MB memory threshold
      performanceCheckInterval: 30 * 1000, // 30 seconds
      ...options
    };

    this.deviceCapabilities = {};
    this.performanceMetrics = {};
    this.optimizations = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the mobile performance service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.detectDeviceCapabilities();
      this.setupPerformanceMonitoring();
      this.setupBatteryOptimization();
      this.setupMemoryOptimization();
      this.setupNetworkOptimization();
      this.applyInitialOptimizations();

      this.isInitialized = true;
      console.log('Mobile Performance Service initialized');
    } catch (error) {
      console.error('Failed to initialize Mobile Performance Service:', error);
    }
  }

  /**
   * Detect device capabilities
   */
  async detectDeviceCapabilities() {
    this.deviceCapabilities = {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ),
      isLowEnd: this.isLowEndDevice(),
      hasBatteryAPI: 'getBattery' in navigator,
      hasMemoryAPI: 'memory' in performance,
      hasNetworkAPI: 'connection' in navigator,
      hasWebGL: this.detectWebGL(),
      hasWebRTC: 'RTCPeerConnection' in window,
      hasServiceWorker: 'serviceWorker' in navigator,
      cores: navigator.hardwareConcurrency || 2,
      memory: this.getMemoryInfo(),
      networkType: this.getNetworkType(),
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1
      }
    };

    console.log('Device capabilities detected:', this.deviceCapabilities);
    return this.deviceCapabilities;
  }

  /**
   * Check if device is low-end
   */
  isLowEndDevice() {
    const cores = navigator.hardwareConcurrency || 2;
    const memory = this.getMemoryInfo();
    const isSlowNetwork = this.getNetworkType() === 'slow-2g' || this.getNetworkType() === '2g';

    return cores <= 2 || memory <= 2 || isSlowNetwork;
  }

  /**
   * Get memory information
   */
  getMemoryInfo() {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        usedMB: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        totalMB: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limitMB: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return { used: 0, total: 0, limit: 0 };
  }

  /**
   * Get network type
   */
  getNetworkType() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      return connection.effectiveType || connection.type || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Detect WebGL support
   */
  detectWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
    } catch (e) {
      return false;
    }
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    if (!this.options.enablePerformanceMonitoring) return;

    // Monitor performance metrics
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, this.options.performanceCheckInterval);

    // Monitor frame rate
    this.setupFrameRateMonitoring();

    // Monitor memory usage
    this.setupMemoryMonitoring();

    // Monitor network requests
    this.setupNetworkMonitoring();
  }

  /**
   * Collect performance metrics
   */
  collectPerformanceMetrics() {
    const now = Date.now();
    const metrics = {
      timestamp: now,
      memory: this.getMemoryInfo(),
      network: this.getNetworkType(),
      battery: null,
      frameRate: this.performanceMetrics.frameRate || 0,
      domNodes: document.getElementsByTagName('*').length,
      resources: performance.getEntriesByType('resource').length
    };

    // Get battery information
    if (this.deviceCapabilities.hasBatteryAPI) {
      navigator.getBattery().then(battery => {
        metrics.battery = {
          level: battery.level * 100,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      });
    }

    this.performanceMetrics = { ...this.performanceMetrics, ...metrics };

    // Apply optimizations based on metrics
    this.applyAdaptiveOptimizations(metrics);

    this.emit('performanceMetrics', metrics);
  }

  /**
   * Setup frame rate monitoring
   */
  setupFrameRateMonitoring() {
    let lastTime = performance.now();
    let frameCount = 0;

    const measureFrameRate = currentTime => {
      frameCount++;
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= 1000) {
        const fps = (frameCount * 1000) / deltaTime;
        this.performanceMetrics.frameRate = Math.round(fps);
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFrameRate);
    };

    requestAnimationFrame(measureFrameRate);
  }

  /**
   * Setup memory monitoring
   */
  setupMemoryMonitoring() {
    if (!this.options.enableMemoryOptimization) return;

    setInterval(() => {
      const memory = this.getMemoryInfo();

      if (memory.used > this.options.memoryThreshold) {
        this.optimizeMemoryUsage();
        this.emit('memoryWarning', memory);
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    if (!this.options.enableNetworkOptimization) return;

    // Monitor network changes
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        const networkType = this.getNetworkType();
        this.applyNetworkOptimizations(networkType);
        this.emit('networkChange', { type: networkType });
      });
    }

    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        this.emit('networkRequest', {
          url: args[0],
          duration,
          status: response.status,
          size: response.headers.get('content-length')
        });

        return response;
      } catch (error) {
        this.emit('networkError', {
          url: args[0],
          error: error.message
        });
        throw error;
      }
    };
  }

  /**
   * Setup battery optimization
   */
  setupBatteryOptimization() {
    if (!this.options.enableBatteryOptimization || !this.deviceCapabilities.hasBatteryAPI) return;

    navigator.getBattery().then(battery => {
      const updateBatteryOptimization = () => {
        const level = battery.level * 100;
        const isLowBattery = level <= this.options.batteryThreshold;
        const isCharging = battery.charging;

        this.applyBatteryOptimizations(isLowBattery, isCharging);
        this.emit('batteryStatus', {
          level,
          isLowBattery,
          isCharging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        });
      };

      // Initial check
      updateBatteryOptimization();

      // Listen for battery changes
      battery.addEventListener('levelchange', updateBatteryOptimization);
      battery.addEventListener('chargingchange', updateBatteryOptimization);
    });
  }

  /**
   * Apply adaptive optimizations based on performance metrics
   */
  applyAdaptiveOptimizations(metrics) {
    const optimizations = [];

    // Memory optimizations
    if (metrics.memory.usedMB > 100) {
      optimizations.push('reduceAnimations');
      optimizations.push('clearCache');
    }

    // Battery optimizations
    if (metrics.battery && metrics.battery.level <= this.options.batteryThreshold) {
      optimizations.push('reduceUpdates');
      optimizations.push('disableBackgroundTasks');
    }

    // Network optimizations
    if (metrics.network === 'slow-2g' || metrics.network === '2g') {
      optimizations.push('reduceImageQuality');
      optimizations.push('disableAutoRefresh');
    }

    // Frame rate optimizations
    if (metrics.frameRate && metrics.frameRate < 30) {
      optimizations.push('simplifyAnimations');
      optimizations.push('reduceEffects');
    }

    // Apply optimizations
    optimizations.forEach(optimization => {
      this.applyOptimization(optimization);
    });

    if (optimizations.length > 0) {
      this.emit('optimizationsApplied', optimizations);
    }
  }

  /**
   * Apply specific optimization
   */
  applyOptimization(optimization) {
    if (this.optimizations.has(optimization)) return;

    switch (optimization) {
      case 'reduceAnimations':
        this.reduceAnimations();
        break;
      case 'clearCache':
        this.clearApplicationCache();
        break;
      case 'reduceUpdates':
        this.reduceUpdateFrequency();
        break;
      case 'disableBackgroundTasks':
        this.disableBackgroundTasks();
        break;
      case 'reduceImageQuality':
        this.reduceImageQuality();
        break;
      case 'disableAutoRefresh':
        this.disableAutoRefresh();
        break;
      case 'simplifyAnimations':
        this.simplifyAnimations();
        break;
      case 'reduceEffects':
        this.reduceVisualEffects();
        break;
    }

    this.optimizations.set(optimization, true);
  }

  /**
   * Apply battery optimizations
   */
  applyBatteryOptimizations(isLowBattery, isCharging) {
    if (isLowBattery && !isCharging) {
      this.applyOptimization('reduceUpdates');
      this.applyOptimization('disableBackgroundTasks');
      this.applyOptimization('reduceAnimations');
    } else if (!isLowBattery || isCharging) {
      // Restore normal operation
      this.restoreNormalOperation();
    }
  }

  /**
   * Apply network optimizations
   */
  applyNetworkOptimizations(networkType) {
    const isSlowNetwork = ['slow-2g', '2g'].includes(networkType);

    if (isSlowNetwork) {
      this.applyOptimization('reduceImageQuality');
      this.applyOptimization('disableAutoRefresh');
    } else {
      // Restore normal network usage
      this.restoreNetworkOptimizations();
    }
  }

  /**
   * Apply initial optimizations based on device capabilities
   */
  applyInitialOptimizations() {
    if (this.deviceCapabilities.isLowEnd) {
      this.applyOptimization('reduceAnimations');
      this.applyOptimization('simplifyAnimations');
      this.applyOptimization('reduceEffects');
    }

    if (this.deviceCapabilities.isMobile) {
      this.applyOptimization('reduceImageQuality');
    }
  }

  /**
   * Reduce animations for performance
   */
  reduceAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      * {
        animation-duration: 0.2s !important;
        transition-duration: 0.2s !important;
      }

      .animate-pulse,
      .animate-bounce,
      .animate-spin {
        animation: none !important;
      }
    `;
    document.head.appendChild(style);
    this.optimizations.set('reduceAnimations', style);
  }

  /**
   * Clear application cache
   */
  async clearApplicationCache() {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      console.log('Application cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Reduce update frequency
   */
  reduceUpdateFrequency() {
    // Reduce polling intervals
    if (window.marketDataService) {
      window.marketDataService.setUpdateInterval(30000); // 30 seconds instead of 5
    }
  }

  /**
   * Disable background tasks
   */
  disableBackgroundTasks() {
    // Disable non-essential background tasks
    if (window.analyticsService) {
      window.analyticsService.pauseTracking();
    }
  }

  /**
   * Reduce image quality
   */
  reduceImageQuality() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      if (img.dataset.src.includes('high-quality')) {
        img.dataset.src = img.dataset.src.replace('high-quality', 'low-quality');
      }
    });
  }

  /**
   * Disable auto refresh
   */
  disableAutoRefresh() {
    // Disable automatic data refresh
    if (window.realtimeService) {
      window.realtimeService.pause();
    }
  }

  /**
   * Simplify animations
   */
  simplifyAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      .complex-animation {
        animation: none !important;
      }

      .transform-3d {
        transform: none !important;
      }

      .backdrop-blur {
        backdrop-filter: none !important;
      }
    `;
    document.head.appendChild(style);
    this.optimizations.set('simplifyAnimations', style);
  }

  /**
   * Reduce visual effects
   */
  reduceVisualEffects() {
    const style = document.createElement('style');
    style.textContent = `
      .shadow-lg,
      .shadow-xl {
        box-shadow: none !important;
      }

      .blur-sm,
      .blur-md {
        filter: none !important;
      }

      .bg-gradient-to-r,
      .bg-gradient-to-b {
        background: currentColor !important;
      }
    `;
    document.head.appendChild(style);
    this.optimizations.set('reduceEffects', style);
  }

  /**
   * Optimize memory usage
   */
  optimizeMemoryUsage() {
    // Clear unused DOM elements
    this.clearUnusedElements();

    // Clear event listeners
    this.clearUnusedEventListeners();

    // Force garbage collection hint
    if (window.gc) {
      window.gc();
    }

    this.emit('memoryOptimized', this.getMemoryInfo());
  }

  /**
   * Clear unused DOM elements
   */
  clearUnusedElements() {
    // Remove elements that are not visible
    const hiddenElements = document.querySelectorAll('[style*="display: none"], [hidden]');
    hiddenElements.forEach(element => {
      if (element.dataset.keepAlive !== 'true') {
        element.remove();
      }
    });
  }

  /**
   * Clear unused event listeners
   */
  clearUnusedEventListeners() {
    // This is a simplified version - in practice, you'd need to track listeners
    console.log('Clearing unused event listeners');
  }

  /**
   * Restore normal operation
   */
  restoreNormalOperation() {
    // Restore update frequency
    if (window.marketDataService) {
      window.marketDataService.setUpdateInterval(5000); // Back to 5 seconds
    }

    // Re-enable background tasks
    if (window.analyticsService) {
      window.analyticsService.resumeTracking();
    }

    // Remove battery optimizations
    this.removeOptimization('reduceUpdates');
    this.removeOptimization('disableBackgroundTasks');
  }

  /**
   * Restore network optimizations
   */
  restoreNetworkOptimizations() {
    // Re-enable auto refresh
    if (window.realtimeService) {
      window.realtimeService.resume();
    }

    // Remove network optimizations
    this.removeOptimization('reduceImageQuality');
    this.removeOptimization('disableAutoRefresh');
  }

  /**
   * Remove specific optimization
   */
  removeOptimization(optimization) {
    if (this.optimizations.has(optimization)) {
      const element = this.optimizations.get(optimization);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.optimizations.delete(optimization);
    }
  }

  /**
   * Get current performance status
   */
  getPerformanceStatus() {
    return {
      deviceCapabilities: this.deviceCapabilities,
      currentMetrics: this.performanceMetrics,
      activeOptimizations: Array.from(this.optimizations.keys()),
      recommendations: this.getPerformanceRecommendations()
    };
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations() {
    const recommendations = [];

    if (this.deviceCapabilities.isLowEnd) {
      recommendations.push({
        type: 'device',
        message: 'Low-end device detected. Performance optimizations applied.',
        severity: 'info'
      });
    }

    if (this.performanceMetrics.memory?.usedMB > 100) {
      recommendations.push({
        type: 'memory',
        message: 'High memory usage detected. Consider reducing cached data.',
        severity: 'warning'
      });
    }

    if (this.performanceMetrics.frameRate < 30) {
      recommendations.push({
        type: 'performance',
        message: 'Low frame rate detected. Animations have been simplified.',
        severity: 'warning'
      });
    }

    if (this.performanceMetrics.network === 'slow-2g' || this.performanceMetrics.network === '2g') {
      recommendations.push({
        type: 'network',
        message: 'Slow network detected. Image quality and auto-refresh reduced.',
        severity: 'info'
      });
    }

    return recommendations;
  }

  /**
   * Force performance check
   */
  async forcePerformanceCheck() {
    await this.collectPerformanceMetrics();
    return this.getPerformanceStatus();
  }

  /**
   * Event emitter functionality
   */
  on(event, callback) {
    if (!this.eventListeners) {
      this.eventListeners = new Map();
    }

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    if (!this.eventListeners || !this.eventListeners.has(event)) return;

    this.eventListeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in mobile performance ${event} callback:`, error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Remove all optimization styles
    this.optimizations.forEach((element, key) => {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });

    this.optimizations.clear();
    this.performanceMetrics = {};
    this.isInitialized = false;
    console.log('Mobile Performance Service cleaned up');
  }
}

// Export singleton instance
export const mobilePerformanceService = new MobilePerformanceService();
export default MobilePerformanceService;
