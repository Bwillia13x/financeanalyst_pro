/**
 * Mobile Navigation Service
 * Mobile-first navigation system with bottom navigation, swipe gestures, and adaptive menus
 * Handles mobile navigation patterns and responsive navigation behavior
 */

class MobileNavigationService {
  constructor(options = {}) {
    this.options = {
      enableBottomNavigation: true,
      enableSwipeNavigation: true,
      enableAdaptiveMenus: true,
      enableBreadcrumbNavigation: true,
      enableBackButtonHandling: true,
      bottomNavThreshold: 768, // Show bottom nav below this width
      swipeThreshold: 50, // Minimum swipe distance for navigation
      animationDuration: 300, // Navigation animation duration
      ...options
    };

    this.currentRoute = '/';
    this.navigationHistory = [];
    this.bottomNavigation = null;
    this.sideMenu = null;
    this.breadcrumbTrail = [];
    this.navigationState = {
      isMenuOpen: false,
      isNavigating: false,
      activeTab: null,
      previousRoute: null
    };

    this.navigationCallbacks = new Map();
    this.routeHandlers = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the mobile navigation service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.detectDevice();
      this.setupBottomNavigation();
      this.setupSwipeNavigation();
      this.setupBackButtonHandling();
      this.setupRouteHandling();
      this.setupResponsiveBehavior();

      this.isInitialized = true;
      console.log('Mobile Navigation Service initialized');
    } catch (error) {
      console.error('Failed to initialize Mobile Navigation Service:', error);
    }
  }

  /**
   * Detect device and screen characteristics
   */
  detectDevice() {
    this.deviceInfo = {
      isMobile: window.innerWidth < this.options.bottomNavThreshold,
      isTablet: window.innerWidth >= this.options.bottomNavThreshold && window.innerWidth < 1024,
      isDesktop: window.innerWidth >= 1024,
      hasTouch: 'ontouchstart' in window,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
    };

    // Update on resize
    window.addEventListener('resize', () => {
      this.updateDeviceInfo();
      this.handleResponsiveNavigation();
    });

    // Update on orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.updateDeviceInfo();
        this.handleResponsiveNavigation();
      }, 100);
    });
  }

  /**
   * Update device information
   */
  updateDeviceInfo() {
    this.deviceInfo = {
      ...this.deviceInfo,
      isMobile: window.innerWidth < this.options.bottomNavThreshold,
      isTablet: window.innerWidth >= this.options.bottomNavThreshold && window.innerWidth < 1024,
      isDesktop: window.innerWidth >= 1024,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
    };
  }

  /**
   * Setup bottom navigation for mobile devices
   */
  setupBottomNavigation() {
    if (!this.options.enableBottomNavigation) return;

    // Create bottom navigation container
    this.bottomNavigation = document.createElement('nav');
    this.bottomNavigation.className = 'mobile-bottom-nav';
    this.bottomNavigation.innerHTML = `
      <div class="mobile-bottom-nav-container">
        <button class="mobile-nav-item" data-route="/dashboard">
          <div class="nav-icon">📊</div>
          <div class="nav-label">Dashboard</div>
        </button>
        <button class="mobile-nav-item" data-route="/portfolio">
          <div class="nav-icon">📁</div>
          <div class="nav-label">Portfolio</div>
        </button>
        <button class="mobile-nav-item" data-route="/analytics">
          <div class="nav-icon">📈</div>
          <div class="nav-label">Analytics</div>
        </button>
        <button class="mobile-nav-item" data-route="/reports">
          <div class="nav-icon">📄</div>
          <div class="nav-label">Reports</div>
        </button>
        <button class="mobile-nav-item" data-route="/settings">
          <div class="nav-icon">⚙️</div>
          <div class="nav-label">Settings</div>
        </button>
      </div>
    `;

    // Add click handlers
    const navItems = this.bottomNavigation.querySelectorAll('.mobile-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', e => {
        const route = e.currentTarget.dataset.route;
        this.navigateTo(route);
      });
    });

    // Add to DOM
    document.body.appendChild(this.bottomNavigation);

    // Apply initial visibility
    this.updateBottomNavVisibility();
  }

  /**
   * Update bottom navigation visibility
   */
  updateBottomNavVisibility() {
    if (!this.bottomNavigation) return;

    if (this.deviceInfo.isMobile) {
      this.bottomNavigation.style.display = 'block';
      this.addBottomNavStyles();
    } else {
      this.bottomNavigation.style.display = 'none';
    }
  }

  /**
   * Add bottom navigation styles
   */
  addBottomNavStyles() {
    if (document.getElementById('mobile-nav-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'mobile-nav-styles';
    styles.textContent = `
      .mobile-bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--background, #ffffff);
        border-top: 1px solid var(--border, #e5e7eb);
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        padding-bottom: env(safe-area-inset-bottom, 0);
      }

      .mobile-bottom-nav-container {
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 8px 0;
        max-width: 100%;
      }

      .mobile-nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px;
        border: none;
        background: none;
        color: var(--foreground-secondary, #6b7280);
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 60px;
        border-radius: 8px;
      }

      .mobile-nav-item:hover {
        background: var(--background-secondary, #f9fafb);
        color: var(--foreground, #111827);
      }

      .mobile-nav-item.active {
        color: var(--brand-accent, #3b82f6);
        background: var(--brand-accent-light, rgba(59, 130, 246, 0.1));
      }

      .nav-icon {
        font-size: 20px;
        margin-bottom: 4px;
      }

      .nav-label {
        font-size: 11px;
        font-weight: 500;
        text-align: center;
      }

      /* Hide bottom nav on desktop */
      @media (min-width: 768px) {
        .mobile-bottom-nav {
          display: none !important;
        }
      }

      /* Safe area adjustments for notched devices */
      @supports (padding-bottom: env(safe-area-inset-bottom)) {
        .mobile-bottom-nav {
          padding-bottom: calc(env(safe-area-inset-bottom, 0) + 8px);
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Setup swipe navigation
   */
  setupSwipeNavigation() {
    if (!this.options.enableSwipeNavigation || !this.deviceInfo.hasTouch) return;

    // Listen for swipe gestures from touch interaction service
    if (window.touchInteractionService) {
      window.touchInteractionService.on('swipeLeft', gesture => {
        this.handleSwipeNavigation('next', gesture);
      });

      window.touchInteractionService.on('swipeRight', gesture => {
        this.handleSwipeNavigation('previous', gesture);
      });
    }

    // Fallback touch event handling
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener(
      'touchstart',
      e => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true }
    );

    document.addEventListener(
      'touchend',
      e => {
        if (!touchStartX || !touchStartY) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Check if it's a horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.options.swipeThreshold) {
          if (deltaX > 0) {
            this.handleSwipeNavigation('previous', { deltaX, deltaY });
          } else {
            this.handleSwipeNavigation('next', { deltaX, deltaY });
          }
        }

        touchStartX = 0;
        touchStartY = 0;
      },
      { passive: true }
    );
  }

  /**
   * Handle swipe navigation
   */
  handleSwipeNavigation(direction, gesture) {
    if (this.navigationState.isNavigating) return;

    const routes = this.getSwipeableRoutes();
    const currentIndex = routes.indexOf(this.currentRoute);

    if (currentIndex === -1) return;

    let nextRoute;
    if (direction === 'next' && currentIndex < routes.length - 1) {
      nextRoute = routes[currentIndex + 1];
    } else if (direction === 'previous' && currentIndex > 0) {
      nextRoute = routes[currentIndex - 1];
    }

    if (nextRoute) {
      this.navigateTo(nextRoute, { swipe: true, gesture });
    }
  }

  /**
   * Get routes that support swipe navigation
   */
  getSwipeableRoutes() {
    return ['/dashboard', '/portfolio', '/analytics', '/reports', '/settings'];
  }

  /**
   * Setup back button handling
   */
  setupBackButtonHandling() {
    if (!this.options.enableBackButtonHandling) return;

    // Handle browser back button
    window.addEventListener('popstate', e => {
      const route = e.state?.route || '/';
      this.navigateTo(route, { back: true });
    });

    // Handle mobile back button (Android)
    if (window.history && window.history.pushState) {
      window.history.pushState({ route: this.currentRoute }, '', this.currentRoute);
    }
  }

  /**
   * Setup route handling
   */
  setupRouteHandling() {
    // Handle initial route
    this.handleRouteChange(window.location.pathname);

    // Listen for route changes
    window.addEventListener('popstate', e => {
      if (e.state?.route) {
        this.handleRouteChange(e.state.route);
      }
    });

    // Handle programmatic navigation
    if (window.router) {
      window.router.on('routeChange', route => {
        this.handleRouteChange(route);
      });
    }
  }

  /**
   * Handle route change
   */
  handleRouteChange(route) {
    const previousRoute = this.currentRoute;
    this.currentRoute = route;

    // Update navigation history
    if (previousRoute !== route) {
      this.navigationHistory.push(previousRoute);
      if (this.navigationHistory.length > 10) {
        this.navigationHistory.shift();
      }
    }

    // Update navigation state
    this.navigationState.previousRoute = previousRoute;
    this.updateActiveNavigation();

    // Update breadcrumb trail
    this.updateBreadcrumbTrail(route);

    // Emit route change event
    this.emit('routeChange', {
      from: previousRoute,
      to: route,
      history: this.navigationHistory
    });

    // Handle page transitions
    this.handlePageTransition(previousRoute, route);
  }

  /**
   * Navigate to route
   */
  navigateTo(route, options = {}) {
    if (this.navigationState.isNavigating) return;

    this.navigationState.isNavigating = true;

    // Update browser history
    if (!options.back && window.history) {
      window.history.pushState({ route }, '', route);
    }

    // Handle route change
    this.handleRouteChange(route);

    // Reset navigation state after animation
    setTimeout(() => {
      this.navigationState.isNavigating = false;
    }, this.options.animationDuration);

    // Emit navigation event
    this.emit('navigate', { route, options });
  }

  /**
   * Go back in navigation history
   */
  goBack() {
    if (this.navigationHistory.length > 0) {
      const previousRoute = this.navigationHistory.pop();
      this.navigateTo(previousRoute, { back: true });
    }
  }

  /**
   * Update active navigation item
   */
  updateActiveNavigation() {
    if (!this.bottomNavigation) return;

    // Remove active class from all items
    const navItems = this.bottomNavigation.querySelectorAll('.mobile-nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    // Add active class to current route
    const activeItem = this.bottomNavigation.querySelector(`[data-route="${this.currentRoute}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
  }

  /**
   * Setup responsive behavior
   */
  setupResponsiveBehavior() {
    this.handleResponsiveNavigation();

    // Listen for device changes
    window.addEventListener('resize', () => {
      this.handleResponsiveNavigation();
    });
  }

  /**
   * Handle responsive navigation changes
   */
  handleResponsiveNavigation() {
    this.updateBottomNavVisibility();

    // Adjust navigation layout based on screen size
    if (this.deviceInfo.isMobile) {
      this.enableMobileNavigation();
    } else if (this.deviceInfo.isTablet) {
      this.enableTabletNavigation();
    } else {
      this.enableDesktopNavigation();
    }

    // Emit responsive event
    this.emit('responsiveChange', this.deviceInfo);
  }

  /**
   * Enable mobile navigation
   */
  enableMobileNavigation() {
    // Ensure bottom navigation is visible
    if (this.bottomNavigation) {
      this.bottomNavigation.style.display = 'block';
    }

    // Hide side navigation if present
    if (this.sideMenu) {
      this.sideMenu.style.display = 'none';
    }

    // Enable swipe navigation
    this.enableSwipeNavigation();
  }

  /**
   * Enable tablet navigation
   */
  enableTabletNavigation() {
    // Hide bottom navigation
    if (this.bottomNavigation) {
      this.bottomNavigation.style.display = 'none';
    }

    // Show side navigation if present
    if (this.sideMenu) {
      this.sideMenu.style.display = 'block';
    }

    // Disable swipe navigation
    this.disableSwipeNavigation();
  }

  /**
   * Enable desktop navigation
   */
  enableDesktopNavigation() {
    // Hide bottom navigation
    if (this.bottomNavigation) {
      this.bottomNavigation.style.display = 'none';
    }

    // Show side navigation if present
    if (this.sideMenu) {
      this.sideMenu.style.display = 'block';
    }

    // Disable swipe navigation
    this.disableSwipeNavigation();
  }

  /**
   * Enable swipe navigation
   */
  enableSwipeNavigation() {
    this.swipeNavigationEnabled = true;
  }

  /**
   * Disable swipe navigation
   */
  disableSwipeNavigation() {
    this.swipeNavigationEnabled = false;
  }

  /**
   * Setup breadcrumb navigation
   */
  setupBreadcrumbNavigation() {
    if (!this.options.enableBreadcrumbNavigation) return;

    this.breadcrumbContainer = document.createElement('nav');
    this.breadcrumbContainer.className = 'breadcrumb-nav';
    this.breadcrumbContainer.setAttribute('aria-label', 'Breadcrumb navigation');

    document.body.insertBefore(this.breadcrumbContainer, document.body.firstChild);

    this.addBreadcrumbStyles();
  }

  /**
   * Update breadcrumb trail
   */
  updateBreadcrumbTrail(route) {
    if (!this.breadcrumbContainer) return;

    const crumbs = this.generateBreadcrumbs(route);

    this.breadcrumbContainer.innerHTML = `
      <ol class="breadcrumb-list">
        ${crumbs
          .map(
            (crumb, index) => `
          <li class="breadcrumb-item ${index === crumbs.length - 1 ? 'active' : ''}">
            ${
              index < crumbs.length - 1
                ? `<a href="${crumb.path}" class="breadcrumb-link">${crumb.label}</a>`
                : `<span class="breadcrumb-current">${crumb.label}</span>`
            }
          </li>
        `
          )
          .join('')}
      </ol>
    `;

    this.breadcrumbTrail = crumbs;
  }

  /**
   * Generate breadcrumb items for route
   */
  generateBreadcrumbs(route) {
    const crumbs = [{ label: 'Home', path: '/' }];
    const parts = route.split('/').filter(Boolean);

    let currentPath = '';
    parts.forEach((part, index) => {
      currentPath += `/${part}`;
      const label = this.formatBreadcrumbLabel(part);

      crumbs.push({
        label,
        path: currentPath
      });
    });

    return crumbs;
  }

  /**
   * Format breadcrumb label
   */
  formatBreadcrumbLabel(part) {
    return part
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Add breadcrumb styles
   */
  addBreadcrumbStyles() {
    if (document.getElementById('breadcrumb-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'breadcrumb-styles';
    styles.textContent = `
      .breadcrumb-nav {
        padding: 12px 16px;
        background: var(--background-secondary, #f9fafb);
        border-bottom: 1px solid var(--border, #e5e7eb);
      }

      .breadcrumb-list {
        display: flex;
        align-items: center;
        list-style: none;
        margin: 0;
        padding: 0;
        gap: 8px;
      }

      .breadcrumb-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .breadcrumb-item:not(:last-child)::after {
        content: '/';
        color: var(--foreground-secondary, #6b7280);
        font-weight: 500;
      }

      .breadcrumb-link {
        color: var(--brand-accent, #3b82f6);
        text-decoration: none;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
      }

      .breadcrumb-link:hover {
        background: var(--background, #ffffff);
      }

      .breadcrumb-current {
        color: var(--foreground, #111827);
        font-weight: 500;
      }

      /* Mobile breadcrumb styles */
      @media (max-width: 767px) {
        .breadcrumb-nav {
          padding: 8px 12px;
        }

        .breadcrumb-list {
          gap: 4px;
        }

        .breadcrumb-link,
        .breadcrumb-current {
          font-size: 14px;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Handle page transitions
   */
  handlePageTransition(from, to) {
    // Add transition classes
    const mainContent = document.querySelector('main') || document.body;
    mainContent.classList.add('page-transitioning');

    // Remove transition class after animation
    setTimeout(() => {
      mainContent.classList.remove('page-transitioning');
    }, this.options.animationDuration);

    // Emit transition event
    this.emit('pageTransition', { from, to });
  }

  /**
   * Register navigation callback
   */
  onNavigation(callback) {
    if (!this.navigationCallbacks.has('navigate')) {
      this.navigationCallbacks.set('navigate', []);
    }
    this.navigationCallbacks.get('navigate').push(callback);
  }

  /**
   * Register route handler
   */
  onRoute(route, handler) {
    this.routeHandlers.set(route, handler);
  }

  /**
   * Get navigation history
   */
  getNavigationHistory() {
    return [...this.navigationHistory];
  }

  /**
   * Clear navigation history
   */
  clearNavigationHistory() {
    this.navigationHistory = [];
  }

  /**
   * Get current navigation state
   */
  getNavigationState() {
    return {
      currentRoute: this.currentRoute,
      navigationHistory: this.navigationHistory,
      breadcrumbTrail: this.breadcrumbTrail,
      deviceInfo: this.deviceInfo,
      navigationState: this.navigationState
    };
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
        console.error(`Error in mobile navigation ${event} callback:`, error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Remove event listeners
    window.removeEventListener('resize', this.handleResponsiveNavigation);
    window.removeEventListener('orientationchange', this.handleResponsiveNavigation);
    window.removeEventListener('popstate', this.handleRouteChange);

    // Remove DOM elements
    if (this.bottomNavigation && this.bottomNavigation.parentNode) {
      this.bottomNavigation.parentNode.removeChild(this.bottomNavigation);
    }

    if (this.breadcrumbContainer && this.breadcrumbContainer.parentNode) {
      this.breadcrumbContainer.parentNode.removeChild(this.breadcrumbContainer);
    }

    // Clear state
    this.navigationHistory = [];
    this.breadcrumbTrail = [];
    this.navigationCallbacks.clear();
    this.routeHandlers.clear();

    this.isInitialized = false;
    console.log('Mobile Navigation Service cleaned up');
  }
}

// Export singleton instance
export const mobileNavigationService = new MobileNavigationService();
export default MobileNavigationService;
