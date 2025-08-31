/**
 * PWA Service
 * Progressive Web App capabilities and offline functionality
 * Handles service workers, caching, install prompts, and offline features
 */

class PWAService {
  constructor(options = {}) {
    this.options = {
      enableServiceWorker: true,
      enableOfflineSupport: true,
      enableInstallPrompt: true,
      enablePushNotifications: true,
      enableBackgroundSync: true,
      cacheName: 'financeanalyst-v1',
      offlineFallback: '/offline.html',
      installPromptDelay: 3000, // Show install prompt after 3 seconds
      updateCheckInterval: 60 * 60 * 1000, // Check for updates every hour
      ...options
    };

    this.serviceWorker = null;
    this.installPrompt = null;
    this.isInstalled = false;
    this.isOnline = navigator.onLine;
    this.cacheStorage = null;
    this.backgroundSyncQueue = new Map();
    this.pushSubscription = null;

    this.isInitialized = false;
  }

  /**
   * Initialize the PWA service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Check if PWA is supported
      if (!this.isSupported()) {
        console.warn('PWA features are not supported in this browser');
        return;
      }

      await this.registerServiceWorker();
      this.setupInstallPrompt();
      this.setupNetworkMonitoring();
      this.setupVisibilityHandling();
      this.setupUpdateChecking();
      this.initializeCacheStorage();

      // Check if already installed
      this.checkInstallStatus();

      this.isInitialized = true;
      console.log('PWA Service initialized');
    } catch (error) {
      console.error('Failed to initialize PWA Service:', error);
    }
  }

  /**
   * Check if PWA features are supported
   */
  isSupported() {
    return (
      'serviceWorker' in navigator &&
      'caches' in window &&
      'fetch' in window &&
      'indexedDB' in window
    );
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if (!this.options.enableServiceWorker || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        }
      });

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      this.serviceWorker = registration;

      // Setup message handling
      this.setupServiceWorkerMessaging();

      // Setup background sync if supported
      if ('sync' in registration) {
        this.setupBackgroundSync();
      }

      this.emit('serviceWorkerRegistered', { registration });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Setup service worker messaging
   */
  setupServiceWorkerMessaging() {
    if (!this.serviceWorker) return;

    navigator.serviceWorker.addEventListener('message', event => {
      this.handleServiceWorkerMessage(event);
    });

    // Send initial message to service worker
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'INITIALIZE',
        data: {
          userId: this.getCurrentUserId(),
          preferences: this.getUserPreferences()
        }
      });
    }
  }

  /**
   * Handle messages from service worker
   */
  handleServiceWorkerMessage(event) {
    const { type, data } = event.data;

    switch (type) {
      case 'CACHE_UPDATED':
        this.emit('cacheUpdated', data);
        break;
      case 'OFFLINE_READY':
        this.emit('offlineReady', data);
        break;
      case 'SYNC_COMPLETED':
        this.handleSyncCompleted(data);
        break;
      case 'PUSH_RECEIVED':
        this.handlePushNotification(data);
        break;
      case 'UPDATE_AVAILABLE':
        this.showUpdateNotification();
        break;
      default:
        console.log('Unknown service worker message:', type, data);
    }
  }

  /**
   * Setup install prompt handling
   */
  setupInstallPrompt() {
    if (!this.options.enableInstallPrompt) return;

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      this.installPrompt = event;

      // Show install prompt after delay
      setTimeout(() => {
        this.showInstallPrompt();
      }, this.options.installPromptDelay);

      this.emit('installPromptReady', { event });
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.installPrompt = null;
      this.emit('appInstalled', {});
    });
  }

  /**
   * Show install prompt
   */
  async showInstallPrompt() {
    if (!this.installPrompt) return;

    try {
      this.installPrompt.prompt();
      const result = await this.installPrompt.userChoice;

      if (result.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        this.emit('installAccepted', {});
      } else {
        console.log('User dismissed the install prompt');
        this.emit('installDismissed', {});
      }

      this.installPrompt = null;
    } catch (error) {
      console.error('Install prompt failed:', error);
    }
  }

  /**
   * Check if app is already installed
   */
  checkInstallStatus() {
    // Check if running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = window.navigator.standalone === true;

    this.isInstalled = isStandalone || isInWebAppiOS;

    if (this.isInstalled) {
      this.emit('appInstalled', { mode: isStandalone ? 'standalone' : 'ios-webapp' });
    }
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('networkOnline', {});
      this.handleNetworkReconnection();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('networkOffline', {});
    });
  }

  /**
   * Handle network reconnection
   */
  async handleNetworkReconnection() {
    // Sync any queued requests
    await this.syncQueuedRequests();

    // Update cache with latest data
    await this.updateCacheFromServer();

    // Notify user of reconnection
    this.showReconnectionNotification();
  }

  /**
   * Setup visibility handling
   */
  setupVisibilityHandling() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // App is hidden, save state
        this.saveAppState();
      } else {
        // App is visible, restore state
        this.restoreAppState();
      }
    });
  }

  /**
   * Setup update checking
   */
  setupUpdateChecking() {
    // Check for updates periodically
    setInterval(() => {
      this.checkForUpdates();
    }, this.options.updateCheckInterval);

    // Also check when app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkForUpdates();
      }
    });
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates() {
    if (!this.serviceWorker) return;

    try {
      await this.serviceWorker.update();
    } catch (error) {
      console.error('Update check failed:', error);
    }
  }

  /**
   * Show update notification
   */
  showUpdateNotification() {
    const notification = {
      title: 'Update Available',
      body: 'A new version of FinanceAnalyst Pro is available. Refresh to update.',
      icon: '/icon-192x192.png',
      actions: [
        { action: 'update', title: 'Update Now' },
        { action: 'dismiss', title: 'Later' }
      ]
    };

    // Show notification or custom UI
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, notification);
    } else {
      this.emit('updateAvailable', notification);
    }
  }

  /**
   * Initialize cache storage
   */
  async initializeCacheStorage() {
    if (!this.options.enableOfflineSupport) return;

    try {
      this.cacheStorage = await caches.open(this.options.cacheName);
      console.log('Cache storage initialized');
    } catch (error) {
      console.error('Failed to initialize cache storage:', error);
    }
  }

  /**
   * Cache resources for offline use
   */
  async cacheResources(resources) {
    if (!this.cacheStorage) return;

    try {
      await this.cacheStorage.addAll(resources);
      console.log('Resources cached for offline use:', resources);
    } catch (error) {
      console.error('Failed to cache resources:', error);
    }
  }

  /**
   * Get cached resource
   */
  async getCachedResource(url) {
    if (!this.cacheStorage) return null;

    try {
      const response = await this.cacheStorage.match(url);
      return response || null;
    } catch (error) {
      console.error('Failed to get cached resource:', error);
      return null;
    }
  }

  /**
   * Cache API response
   */
  async cacheAPIResponse(url, response) {
    if (!this.cacheStorage) return;

    try {
      // Clone the response before caching
      const responseClone = response.clone();
      await this.cacheStorage.put(url, responseClone);
    } catch (error) {
      console.error('Failed to cache API response:', error);
    }
  }

  /**
   * Setup background sync
   */
  setupBackgroundSync() {
    if (!this.serviceWorker || !('sync' in this.serviceWorker)) return;

    // Register background sync for offline actions
    navigator.serviceWorker.ready.then(registration => {
      registration.sync.register('background-sync');
    });
  }

  /**
   * Queue request for background sync
   */
  async queueForSync(request) {
    if (!this.isOnline) {
      const id = Date.now() + Math.random();
      this.backgroundSyncQueue.set(id, {
        ...request,
        timestamp: new Date(),
        attempts: 0
      });

      // Save to IndexedDB for persistence
      await this.saveToIndexedDB('syncQueue', id, this.backgroundSyncQueue.get(id));

      this.emit('requestQueued', { id, request });
      return id;
    }

    // Execute immediately if online
    return await this.executeRequest(request);
  }

  /**
   * Sync queued requests
   */
  async syncQueuedRequests() {
    if (this.backgroundSyncQueue.size === 0) return;

    const requests = Array.from(this.backgroundSyncQueue.entries());

    for (const [id, request] of requests) {
      try {
        await this.executeRequest(request);
        this.backgroundSyncQueue.delete(id);
        await this.removeFromIndexedDB('syncQueue', id);
        this.emit('requestSynced', { id });
      } catch (error) {
        request.attempts++;
        if (request.attempts >= 3) {
          this.backgroundSyncQueue.delete(id);
          await this.removeFromIndexedDB('syncQueue', id);
          this.emit('requestFailed', { id, error });
        } else {
          await this.saveToIndexedDB('syncQueue', id, request);
        }
      }
    }
  }

  /**
   * Execute queued request
   */
  async executeRequest(request) {
    const { url, method = 'GET', headers = {}, body } = request;

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Handle sync completion
   */
  handleSyncCompleted(data) {
    this.emit('syncCompleted', data);
  }

  /**
   * Setup push notifications
   */
  async setupPushNotifications() {
    if (!this.options.enablePushNotifications || !('Notification' in window)) {
      return;
    }

    // Request permission
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      await this.subscribeToPushNotifications();
    }

    this.emit('pushPermission', { permission });
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPushNotifications() {
    if (!this.serviceWorker) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.getVapidPublicKey())
      });

      this.pushSubscription = subscription;

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      this.emit('pushSubscribed', { subscription });
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  }

  /**
   * Handle incoming push notification
   */
  handlePushNotification(data) {
    // Show notification or handle data
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(data.title || 'FinanceAnalyst Pro', {
        body: data.body,
        icon: data.icon || '/icon-192x192.png',
        badge: data.badge,
        data: data.data
      });
    }

    this.emit('pushReceived', data);
  }

  /**
   * Send push subscription to server
   */
  async sendSubscriptionToServer(subscription) {
    // In production, send to your server
    console.log('Push subscription:', subscription);
  }

  /**
   * Convert VAPID key
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodePointAt(i);
    }

    return outputArray;
  }

  /**
   * Get VAPID public key (should come from server)
   */
  getVapidPublicKey() {
    // In production, fetch from your server
    return 'YOUR_VAPID_PUBLIC_KEY';
  }

  /**
   * Save app state for offline recovery
   */
  async saveAppState() {
    const state = {
      timestamp: new Date(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
      formData: this.getCurrentFormData(),
      scrollPosition: window.pageYOffset
    };

    try {
      localStorage.setItem('pwa_app_state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save app state:', error);
    }
  }

  /**
   * Restore app state
   */
  async restoreAppState() {
    try {
      const stateStr = localStorage.getItem('pwa_app_state');
      if (stateStr) {
        const state = JSON.parse(stateStr);

        // Restore scroll position
        if (state.scrollPosition) {
          window.scrollTo(0, state.scrollPosition);
        }

        // Restore form data if applicable
        if (state.formData) {
          this.restoreFormData(state.formData);
        }

        localStorage.removeItem('pwa_app_state');
      }
    } catch (error) {
      console.error('Failed to restore app state:', error);
    }
  }

  /**
   * Update cache from server
   */
  async updateCacheFromServer() {
    // Implement cache update logic
    console.log('Updating cache from server...');
  }

  /**
   * Show reconnection notification
   */
  showReconnectionNotification() {
    this.emit('reconnected', {});
  }

  /**
   * IndexedDB helpers
   */
  async saveToIndexedDB(store, key, data) {
    // Implement IndexedDB save logic
  }

  async removeFromIndexedDB(store, key) {
    // Implement IndexedDB remove logic
  }

  /**
   * Helper methods
   */
  getCurrentUserId() {
    // Get from authentication service
    return 'current_user_id';
  }

  getUserPreferences() {
    // Get from user preferences
    return {};
  }

  getCurrentFormData() {
    // Get current form data
    return {};
  }

  restoreFormData(formData) {
    // Restore form data
  }

  /**
   * Get PWA status
   */
  getPWAStatus() {
    return {
      isSupported: this.isSupported(),
      isInstalled: this.isInstalled,
      isOnline: this.isOnline,
      serviceWorkerRegistered: !!this.serviceWorker,
      cacheStorageAvailable: !!this.cacheStorage,
      pushNotificationsEnabled: !!this.pushSubscription,
      backgroundSyncAvailable: 'sync' in (this.serviceWorker || {}),
      offlineReady: this.isOfflineReady()
    };
  }

  /**
   * Check if offline functionality is ready
   */
  isOfflineReady() {
    return this.cacheStorage && this.serviceWorker && this.isInstalled;
  }

  /**
   * Update PWA
   */
  async updatePWA() {
    if (!this.serviceWorker) return;

    try {
      await this.serviceWorker.update();
      console.log('PWA updated successfully');
    } catch (error) {
      console.error('PWA update failed:', error);
    }
  }

  /**
   * Uninstall PWA (for development/testing)
   */
  async uninstallPWA() {
    if (!this.serviceWorker) return;

    try {
      await this.serviceWorker.unregister();
      // Clear caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));

      // Clear IndexedDB
      // Implement IndexedDB cleanup

      this.isInstalled = false;
      console.log('PWA uninstalled');
    } catch (error) {
      console.error('PWA uninstall failed:', error);
    }
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
        console.error(`Error in PWA ${event} callback:`, error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.serviceWorker) {
      this.serviceWorker.unregister();
    }

    if (this.cacheStorage) {
      // Clear cache on cleanup
      caches.delete(this.options.cacheName);
    }

    this.backgroundSyncQueue.clear();
    this.pushSubscription = null;

    this.isInitialized = false;
    console.log('PWA Service cleaned up');
  }
}

// Export singleton instance
export const pwaService = new PWAService();
export default PWAService;
