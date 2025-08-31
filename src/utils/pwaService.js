// PWA Service Worker Registration and Management
class PWAService {
  constructor() {
    this.registration = null;
    this.deferredPrompt = null;
    this.isInstallable = false;
    this.isOffline = false;
  }

  // Initialize PWA functionality
  async init() {
    console.log('[PWA] Initializing PWA service');

    // Register service worker
    await this.registerServiceWorker();

    // Setup install prompt
    this.setupInstallPrompt();

    // Check online status
    this.setupNetworkDetection();

    // Setup periodic sync (if supported)
    this.setupPeriodicSync();

    return this;
  }

  // Register service worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        console.log('[PWA] Registering service worker');
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        // Handle service worker updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                this.showUpdateNotification();
              }
            });
          }
        });

        console.log('[PWA] Service worker registered successfully');
      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
      }
    } else {
      console.warn('[PWA] Service workers not supported');
    }
  }

  // Setup install prompt handling
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', event => {
      console.log('[PWA] Install prompt available');
      event.preventDefault();
      this.deferredPrompt = event;
      this.isInstallable = true;

      // Dispatch custom event for UI updates
      window.dispatchEvent(
        new CustomEvent('pwa-installable', {
          detail: { installable: true }
        })
      );
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.deferredPrompt = null;
      this.isInstallable = false;

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pwa-installed'));
    });
  }

  // Show install prompt
  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      console.warn('[PWA] No install prompt available');
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;

      console.log('[PWA] Install prompt result:', outcome);
      this.deferredPrompt = null;

      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }

  // Check if app can be installed
  canInstall() {
    return this.isInstallable && !!this.deferredPrompt;
  }

  // Setup network detection
  setupNetworkDetection() {
    // Check initial online status
    this.isOffline = !navigator.onLine;
    this.updateNetworkStatus();

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('[PWA] Network online');
      this.isOffline = false;
      this.updateNetworkStatus();
    });

    window.addEventListener('offline', () => {
      console.log('[PWA] Network offline');
      this.isOffline = true;
      this.updateNetworkStatus();
    });
  }

  // Update network status and notify app
  updateNetworkStatus() {
    window.dispatchEvent(
      new CustomEvent('network-status-change', {
        detail: { online: !this.isOffline }
      })
    );

    // Update document class for styling
    document.documentElement.classList.toggle('offline', this.isOffline);
  }

  // Check if app is running in standalone mode (installed PWA)
  isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  // Setup periodic background sync
  setupPeriodicSync() {
    if ('periodicSync' in this.registration && 'periodicSync' in navigator.serviceWorker) {
      // Request permission for periodic sync
      navigator.serviceWorker.ready.then(registration => {
        registration.periodicSync.getTags().then(tags => {
          if (!tags.includes('update-financial-data')) {
            // Request permission and register periodic sync
            if ('Notification' in window && Notification.permission === 'granted') {
              registration.periodicSync
                .register('update-financial-data', {
                  minInterval: 24 * 60 * 60 * 1000 // 24 hours
                })
                .then(() => {
                  console.log('[PWA] Periodic sync registered');
                })
                .catch(error => {
                  console.error('[PWA] Periodic sync registration failed:', error);
                });
            }
          }
        });
      });
    }
  }

  // Show update notification
  showUpdateNotification() {
    // Create and dispatch update available event
    window.dispatchEvent(
      new CustomEvent('pwa-update-available', {
        detail: { registration: this.registration }
      })
    );
  }

  // Skip waiting and activate new service worker
  async updateApp() {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  // Get cache information
  async getCacheInfo() {
    if (!this.registration) return null;

    try {
      const cacheNames = await caches.keys();
      const cacheInfo = {};

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        cacheInfo[cacheName] = {
          name: cacheName,
          entries: keys.length,
          size: 'Unknown' // Size calculation would require additional implementation
        };
      }

      return cacheInfo;
    } catch (error) {
      console.error('[PWA] Failed to get cache info:', error);
      return null;
    }
  }

  // Clear all caches
  async clearCache() {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      console.log('[PWA] All caches cleared');
      return true;
    } catch (error) {
      console.error('[PWA] Failed to clear cache:', error);
      return false;
    }
  }

  // Check if running on mobile device
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  // Get device type for responsive behavior
  getDeviceType() {
    if (this.isMobile()) {
      return window.innerWidth < 768 ? 'mobile' : 'tablet';
    }
    return 'desktop';
  }

  // Handle app visibility changes (useful for mobile)
  setupVisibilityDetection() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('[PWA] App hidden');
        // Pause non-essential operations
      } else {
        console.log('[PWA] App visible');
        // Resume operations and refresh data if needed
      }
    });
  }

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Send notification (for testing)
  async sendNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    }
    return null;
  }
}

// Create singleton instance
const pwaService = new PWAService();

// Export for use in components
export default pwaService;

// Export class for testing
export { PWAService };
