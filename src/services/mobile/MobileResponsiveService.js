/**
 * Mobile Responsive Service
 * Comprehensive mobile-first responsive design system
 * Handles device detection, responsive breakpoints, and adaptive layouts
 */

class MobileResponsiveService {
  constructor(options = {}) {
    this.options = {
      breakpoints: {
        mobile: 320,
        tablet: 768,
        desktop: 1024,
        wide: 1440
      },
      touchThreshold: 10, // Minimum touch distance for swipe detection
      enableAdaptiveImages: true,
      enableTouchOptimization: true,
      enableViewportOptimization: true,
      enableOrientationHandling: true,
      ...options
    };

    this.currentDevice = null;
    this.currentOrientation = null;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.isInitialized = false;

    // Device detection patterns
    this.devicePatterns = {
      mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i,
      tablet: /iPad|Android(?=.*\bMobile\b)(?!.*\bPhone\b)|Tablet/i,
      desktop: /Windows NT|Macintosh|Linux/i
    };

    // Orientation handling
    this.orientationCallbacks = new Map();
    this.breakpointCallbacks = new Map();
    this.touchGestureCallbacks = new Map();
  }

  /**
   * Initialize the mobile responsive service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.detectDevice();
      this.detectOrientation();
      this.setupViewport();
      this.setupTouchEvents();
      this.setupOrientationEvents();
      this.setupBreakpointMonitoring();
      this.setupAdaptiveLoading();
      this.optimizePerformance();

      this.isInitialized = true;
      console.log('Mobile Responsive Service initialized');
    } catch (error) {
      console.error('Failed to initialize Mobile Responsive Service:', error);
    }
  }

  /**
   * Detect device type
   */
  detectDevice() {
    const userAgent = navigator.userAgent;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    let deviceType = 'desktop';
    let deviceCategory = 'desktop';

    // Check for mobile devices
    if (
      this.devicePatterns.mobile.test(userAgent) ||
      screenWidth < this.options.breakpoints.tablet
    ) {
      deviceType = 'mobile';
      deviceCategory = 'mobile';
    }
    // Check for tablets
    else if (
      this.devicePatterns.tablet.test(userAgent) ||
      (screenWidth >= this.options.breakpoints.tablet &&
        screenWidth < this.options.breakpoints.desktop)
    ) {
      deviceType = 'tablet';
      deviceCategory = 'tablet';
    }

    // Special handling for iPad Pro and similar devices
    if (userAgent.includes('iPad') || (screenWidth >= 1024 && screenHeight >= 1366)) {
      deviceType = 'tablet';
      deviceCategory = 'tablet';
    }

    this.currentDevice = {
      type: deviceType,
      category: deviceCategory,
      userAgent: userAgent,
      screenWidth: screenWidth,
      screenHeight: screenHeight,
      pixelRatio: pixelRatio,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      isRetina: pixelRatio > 1,
      isLandscape: screenWidth > screenHeight,
      isPortrait: screenHeight > screenWidth
    };

    return this.currentDevice;
  }

  /**
   * Detect device orientation
   */
  detectOrientation() {
    const orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
    const angle = orientation ? orientation.angle : window.innerWidth > window.innerHeight ? 90 : 0;

    this.currentOrientation = {
      angle: angle,
      type: angle === 0 || angle === 180 ? 'portrait' : 'landscape',
      isPortrait: angle === 0 || angle === 180,
      isLandscape: angle === 90 || angle === 270
    };

    return this.currentOrientation;
  }

  /**
   * Setup viewport optimization
   */
  setupViewport() {
    if (!this.options.enableViewportOptimization) return;

    // Ensure proper viewport meta tag
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }

    // Set optimal viewport settings based on device
    const viewportSettings = this.getOptimalViewportSettings();
    viewportMeta.content = viewportSettings;

    // Add iOS-specific optimizations
    if (this.currentDevice.isMobile && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      this.addIOSOptimizations();
    }

    // Add Android-specific optimizations
    if (this.currentDevice.isMobile && /Android/.test(navigator.userAgent)) {
      this.addAndroidOptimizations();
    }
  }

  /**
   * Get optimal viewport settings
   */
  getOptimalViewportSettings() {
    const baseSettings = [
      'width=device-width',
      'initial-scale=1.0',
      'maximum-scale=5.0',
      'minimum-scale=0.5',
      'user-scalable=yes'
    ];

    // Mobile-specific settings
    if (this.currentDevice.isMobile) {
      baseSettings.push('viewport-fit=cover'); // For notched devices
      baseSettings.push('shrink-to-fit=no');
    }

    // High DPI display optimizations
    if (this.currentDevice.isRetina) {
      baseSettings.push('target-densitydpi=device-dpi');
    }

    return baseSettings.join(', ');
  }

  /**
   * Add iOS-specific optimizations
   */
  addIOSOptimizations() {
    // Prevent zoom on input focus
    const style = document.createElement('style');
    style.textContent = `
      input[type="text"], input[type="email"], input[type="password"],
      input[type="number"], input[type="tel"], input[type="url"],
      textarea, select {
        font-size: 16px !important;
      }
    `;
    document.head.appendChild(style);

    // Handle iOS Safari bottom bar
    if (window.innerHeight < window.screen.height) {
      document.documentElement.classList.add('ios-safari-bottom-bar');
    }
  }

  /**
   * Add Android-specific optimizations
   */
  addAndroidOptimizations() {
    // Fix for Android Chrome tap delay
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-tap-highlight-color: rgba(0,0,0,0);
        -webkit-touch-callout: none;
        -webkit-user-select: text;
      }

      a, button, input, select, textarea {
        -webkit-tap-highlight-color: rgba(0,0,0,0.1);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup touch event handling
   */
  setupTouchEvents() {
    if (!this.options.enableTouchOptimization || !this.currentDevice.touchSupport) return;

    // Touch start handler
    const handleTouchStart = event => {
      const touch = event.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = Date.now();

      this.emit('touchStart', {
        x: this.touchStartX,
        y: this.touchStartY,
        timestamp: this.touchStartTime
      });
    };

    // Touch move handler
    const handleTouchMove = event => {
      if (!this.touchStartTime) return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - this.touchStartX;
      const deltaY = touch.clientY - this.touchStartY;
      const deltaTime = Date.now() - this.touchStartTime;

      this.emit('touchMove', {
        deltaX,
        deltaY,
        deltaTime,
        velocityX: deltaX / deltaTime,
        velocityY: deltaY / deltaTime
      });
    };

    // Touch end handler
    const handleTouchEnd = event => {
      if (!this.touchStartTime) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - this.touchStartX;
      const deltaY = touch.clientY - this.touchStartY;
      const deltaTime = Date.now() - this.touchStartTime;

      const gesture = this.detectGesture(deltaX, deltaY, deltaTime);

      if (gesture) {
        this.emit('gesture', gesture);
        this.handleGesture(gesture);
      }

      this.emit('touchEnd', {
        deltaX,
        deltaY,
        deltaTime,
        gesture
      });

      // Reset touch tracking
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.touchStartTime = 0;
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Store for cleanup
    this.touchEventHandlers = {
      touchstart: handleTouchStart,
      touchmove: handleTouchMove,
      touchend: handleTouchEnd
    };
  }

  /**
   * Detect touch gestures
   */
  detectGesture(deltaX, deltaY, deltaTime) {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const minSwipeDistance = this.options.touchThreshold;

    // Swipe gestures
    if (Math.max(absX, absY) > minSwipeDistance) {
      if (absX > absY) {
        // Horizontal swipe
        return {
          type: deltaX > 0 ? 'swipeRight' : 'swipeLeft',
          distance: absX,
          velocity: absX / deltaTime,
          direction: deltaX > 0 ? 'right' : 'left'
        };
      } else {
        // Vertical swipe
        return {
          type: deltaY > 0 ? 'swipeDown' : 'swipeUp',
          distance: absY,
          velocity: absY / deltaTime,
          direction: deltaY > 0 ? 'down' : 'up'
        };
      }
    }

    // Tap gesture (short touch)
    if (deltaTime < 300 && Math.max(absX, absY) < 10) {
      return {
        type: 'tap',
        duration: deltaTime,
        position: { x: this.touchStartX, y: this.touchStartY }
      };
    }

    return null;
  }

  /**
   * Handle detected gestures
   */
  handleGesture(gesture) {
    switch (gesture.type) {
      case 'swipeLeft':
        this.handleSwipeLeft(gesture);
        break;
      case 'swipeRight':
        this.handleSwipeRight(gesture);
        break;
      case 'swipeUp':
        this.handleSwipeUp(gesture);
        break;
      case 'swipeDown':
        this.handleSwipeDown(gesture);
        break;
      case 'tap':
        this.handleTap(gesture);
        break;
    }
  }

  /**
   * Handle swipe left (next navigation)
   */
  handleSwipeLeft(gesture) {
    if (gesture.distance > 50) {
      this.emit('navigation', { direction: 'next', gesture });
    }
  }

  /**
   * Handle swipe right (previous navigation)
   */
  handleSwipeRight(gesture) {
    if (gesture.distance > 50) {
      this.emit('navigation', { direction: 'previous', gesture });
    }
  }

  /**
   * Handle swipe up (pull to refresh or close)
   */
  handleSwipeUp(gesture) {
    if (gesture.distance > 100) {
      this.emit('action', { type: 'pullToRefresh', gesture });
    }
  }

  /**
   * Handle swipe down (pull to refresh or open menu)
   */
  handleSwipeDown(gesture) {
    if (gesture.distance > 100) {
      this.emit('action', { type: 'pullDown', gesture });
    }
  }

  /**
   * Handle tap gestures
   */
  handleTap(gesture) {
    // Handle double tap for zoom or other actions
    if (this.lastTapTime && Date.now() - this.lastTapTime < 300) {
      this.emit('doubleTap', gesture);
      this.lastTapTime = 0;
    } else {
      this.lastTapTime = Date.now();
      this.emit('singleTap', gesture);
    }
  }

  /**
   * Setup orientation change handling
   */
  setupOrientationEvents() {
    if (!this.options.enableOrientationHandling) return;

    const handleOrientationChange = () => {
      const previousOrientation = this.currentOrientation;
      this.detectOrientation();

      if (previousOrientation && previousOrientation.type !== this.currentOrientation.type) {
        this.emit('orientationChange', {
          from: previousOrientation.type,
          to: this.currentOrientation.type,
          device: this.currentDevice
        });

        // Trigger layout adjustments
        this.handleOrientationChange();
      }
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    // Store for cleanup
    this.orientationEventHandlers = {
      orientationchange: handleOrientationChange,
      resize: handleOrientationChange
    };
  }

  /**
   * Handle orientation changes
   */
  handleOrientationChange() {
    // Adjust viewport for new orientation
    this.setupViewport();

    // Trigger responsive layout updates
    this.emit('layoutUpdate', {
      orientation: this.currentOrientation,
      device: this.currentDevice
    });

    // Handle keyboard adjustments on mobile
    if (this.currentDevice.isMobile) {
      this.handleMobileKeyboard();
    }
  }

  /**
   * Handle mobile keyboard adjustments
   */
  handleMobileKeyboard() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) return;

    // Temporarily adjust viewport when keyboard appears
    const originalViewport = viewport.content;

    const handleFocus = () => {
      setTimeout(() => {
        viewport.content =
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      }, 300);
    };

    const handleBlur = () => {
      viewport.content = originalViewport;
    };

    // Add focus/blur handlers to input elements
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
    });
  }

  /**
   * Setup breakpoint monitoring
   */
  setupBreakpointMonitoring() {
    const checkBreakpoints = () => {
      const width = window.innerWidth;
      let currentBreakpoint = 'mobile';

      if (width >= this.options.breakpoints.wide) {
        currentBreakpoint = 'wide';
      } else if (width >= this.options.breakpoints.desktop) {
        currentBreakpoint = 'desktop';
      } else if (width >= this.options.breakpoints.tablet) {
        currentBreakpoint = 'tablet';
      }

      if (this.currentBreakpoint !== currentBreakpoint) {
        const previousBreakpoint = this.currentBreakpoint;
        this.currentBreakpoint = currentBreakpoint;

        this.emit('breakpointChange', {
          from: previousBreakpoint,
          to: currentBreakpoint,
          width: width
        });
      }
    };

    // Initial check
    checkBreakpoints();

    // Monitor for changes
    window.addEventListener('resize', checkBreakpoints);

    // Store for cleanup
    this.breakpointEventHandlers = {
      resize: checkBreakpoints
    };
  }

  /**
   * Setup adaptive loading
   */
  setupAdaptiveLoading() {
    if (!this.options.enableAdaptiveImages) return;

    // Setup lazy loading for images
    this.setupLazyLoading();

    // Setup adaptive image loading
    this.setupAdaptiveImages();

    // Setup resource prioritization
    this.setupResourcePrioritization();
  }

  /**
   * Setup lazy loading for images
   */
  setupLazyLoading() {
    const imageObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    // Observe all lazy images
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => imageObserver.observe(img));

    this.imageObserver = imageObserver;
  }

  /**
   * Setup adaptive image loading
   */
  setupAdaptiveImages() {
    const updateImages = () => {
      const images = document.querySelectorAll('img[data-adaptive]');
      const pixelRatio = window.devicePixelRatio || 1;
      const width = window.innerWidth;

      images.forEach(img => {
        const src = img.dataset.adaptive;
        if (!src) return;

        // Generate appropriate image URL based on device capabilities
        let imageUrl = src;

        if (this.currentDevice.isRetina && pixelRatio > 1) {
          imageUrl = src.replace(/\.(jpg|png|webp)$/i, '@2x.$1');
        }

        if (this.currentDevice.isMobile && width < 480) {
          imageUrl = src.replace(/\.(jpg|png|webp)$/i, '-mobile.$1');
        }

        img.src = imageUrl;
      });
    };

    updateImages();
    window.addEventListener('resize', updateImages);
  }

  /**
   * Setup resource prioritization
   */
  setupResourcePrioritization() {
    // Prioritize above-the-fold content
    const prioritizeAboveFold = () => {
      const aboveFoldElements = document.querySelectorAll('[data-priority="high"]');
      const belowFoldElements = document.querySelectorAll('[data-priority="low"]');

      // Add preload hints for high priority elements
      aboveFoldElements.forEach(element => {
        if (element.tagName === 'IMG' && element.dataset.src) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = element.dataset.src;
          document.head.appendChild(link);
        }
      });

      // Defer loading of low priority elements
      belowFoldElements.forEach(element => {
        if (element.tagName === 'IMG') {
          element.loading = 'lazy';
        }
      });
    };

    // Run prioritization after DOM content loads
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', prioritizeAboveFold);
    } else {
      prioritizeAboveFold();
    }
  }

  /**
   * Optimize performance for mobile devices
   */
  optimizePerformance() {
    // Disable hover effects on touch devices
    if (this.currentDevice.touchSupport) {
      const style = document.createElement('style');
      style.textContent = `
        @media (hover: none) and (pointer: coarse) {
          .hover\\:bg-gray-100:hover {
            background-color: transparent !important;
          }
          .hover\\:text-blue-600:hover {
            color: inherit !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Optimize scrolling on iOS
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      const style = document.createElement('style');
      style.textContent = `
        body {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: none;
        }

        * {
          -webkit-overflow-scrolling: touch;
        }
      `;
      document.head.appendChild(style);
    }

    // Reduce motion for performance on low-end devices
    if (this.currentDevice.isMobile && navigator.hardwareConcurrency <= 4) {
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
    }
  }

  /**
   * Get responsive utilities
   */
  getResponsiveUtils() {
    return {
      isMobile: this.currentDevice.isMobile,
      isTablet: this.currentDevice.isTablet,
      isDesktop: this.currentDevice.isDesktop,
      isLandscape: this.currentOrientation.isLandscape,
      isPortrait: this.currentOrientation.isPortrait,
      screenWidth: this.currentDevice.screenWidth,
      screenHeight: this.currentDevice.screenHeight,
      breakpoint: this.currentBreakpoint,
      pixelRatio: this.currentDevice.pixelRatio,
      touchSupport: this.currentDevice.touchSupport
    };
  }

  /**
   * Get adaptive layout suggestions
   */
  getAdaptiveLayout() {
    const suggestions = {
      navigation: 'top',
      sidebar: 'hidden',
      grid: 'single-column',
      spacing: 'compact'
    };

    if (this.currentDevice.isMobile) {
      suggestions.navigation = 'bottom';
      suggestions.spacing = 'compact';
      suggestions.grid = 'single-column';
    } else if (this.currentDevice.isTablet) {
      suggestions.navigation = 'top';
      suggestions.sidebar = 'collapsible';
      suggestions.grid = 'two-column';
      suggestions.spacing = 'comfortable';
    } else {
      suggestions.navigation = 'top';
      suggestions.sidebar = 'visible';
      suggestions.grid = 'multi-column';
      suggestions.spacing = 'comfortable';
    }

    if (this.currentOrientation.isLandscape && this.currentDevice.isMobile) {
      suggestions.navigation = 'hidden';
      suggestions.grid = 'two-column';
    }

    return suggestions;
  }

  /**
   * Register callback for orientation changes
   */
  onOrientationChange(callback) {
    const id = Date.now() + Math.random();
    this.orientationCallbacks.set(id, callback);
    return id;
  }

  /**
   * Register callback for breakpoint changes
   */
  onBreakpointChange(callback) {
    const id = Date.now() + Math.random();
    this.breakpointCallbacks.set(id, callback);
    return id;
  }

  /**
   * Register callback for touch gestures
   */
  onGesture(callback) {
    const id = Date.now() + Math.random();
    this.touchGestureCallbacks.set(id, callback);
    return id;
  }

  /**
   * Remove callback
   */
  off(callbackId) {
    this.orientationCallbacks.delete(callbackId);
    this.breakpointCallbacks.delete(callbackId);
    this.touchGestureCallbacks.delete(callbackId);
  }

  /**
   * Emit event to registered callbacks
   */
  emit(event, data) {
    let callbacks;

    switch (event) {
      case 'orientationChange':
        callbacks = this.orientationCallbacks;
        break;
      case 'breakpointChange':
        callbacks = this.breakpointCallbacks;
        break;
      case 'gesture':
      case 'touchStart':
      case 'touchMove':
      case 'touchEnd':
      case 'navigation':
      case 'action':
        callbacks = this.touchGestureCallbacks;
        break;
      default:
        return;
    }

    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in mobile responsive ${event} callback:`, error);
      }
    });
  }

  /**
   * Update device detection
   */
  updateDeviceDetection() {
    this.detectDevice();
    this.detectOrientation();
    this.setupViewport();
  }

  /**
   * Get current device information
   */
  getDeviceInfo() {
    return {
      ...this.currentDevice,
      orientation: this.currentOrientation,
      breakpoint: this.currentBreakpoint,
      responsiveUtils: this.getResponsiveUtils(),
      adaptiveLayout: this.getAdaptiveLayout()
    };
  }

  /**
   * Cleanup event listeners
   */
  cleanup() {
    // Remove touch event listeners
    if (this.touchEventHandlers) {
      Object.entries(this.touchEventHandlers).forEach(([event, handler]) => {
        document.removeEventListener(event, handler);
      });
    }

    // Remove orientation event listeners
    if (this.orientationEventHandlers) {
      Object.entries(this.orientationEventHandlers).forEach(([event, handler]) => {
        window.removeEventListener(event, handler);
      });
    }

    // Remove breakpoint event listeners
    if (this.breakpointEventHandlers) {
      Object.entries(this.breakpointEventHandlers).forEach(([event, handler]) => {
        window.removeEventListener(event, handler);
      });
    }

    // Disconnect intersection observers
    if (this.imageObserver) {
      this.imageObserver.disconnect();
    }

    // Clear callbacks
    this.orientationCallbacks.clear();
    this.breakpointCallbacks.clear();
    this.touchGestureCallbacks.clear();

    this.isInitialized = false;
    console.log('Mobile Responsive Service cleaned up');
  }
}

// Export singleton instance
export const mobileResponsiveService = new MobileResponsiveService();
export default MobileResponsiveService;
