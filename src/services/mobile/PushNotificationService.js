/**
 * Push Notification Service
 * Mobile push notification system with scheduling, targeting, and analytics
 * Handles push subscriptions, message delivery, and user engagement tracking
 */

class PushNotificationService {
  constructor(options = {}) {
    this.options = {
      enablePushNotifications: true,
      enableScheduling: true,
      enableAnalytics: true,
      enableSegmentation: true,
      maxRetries: 3,
      defaultTTL: 86400, // 24 hours
      batchSize: 100,
      ...options
    };

    this.subscription = null;
    this.serverKey = null;
    this.notifications = new Map();
    this.analytics = new Map();
    this.scheduledNotifications = new Map();
    this.userSegments = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the push notification service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.checkSupport();
      await this.setupPushManager();
      this.setupMessageHandling();
      this.setupAnalytics();
      this.loadUserPreferences();

      this.isInitialized = true;
      console.log('Push Notification Service initialized');
    } catch (error) {
      console.error('Failed to initialize Push Notification Service:', error);
    }
  }

  /**
   * Check if push notifications are supported
   */
  checkSupport() {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported');
    }

    if (!('PushManager' in window)) {
      throw new Error('Push messaging is not supported');
    }

    if (!('Notification' in window)) {
      throw new Error('Notifications are not supported');
    }

    console.log('Push notifications are supported');
  }

  /**
   * Setup push manager
   */
  async setupPushManager() {
    if (!this.options.enablePushNotifications) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      this.pushManager = registration.pushManager;

      // Get existing subscription
      this.subscription = await this.pushManager.getSubscription();

      if (this.subscription) {
        console.log('Existing push subscription found');
        this.emit('subscriptionRestored', this.subscription);
      } else {
        console.log('No existing push subscription');
      }
    } catch (error) {
      console.error('Failed to setup push manager:', error);
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      throw new Error('Notification permission denied by user');
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      this.emit('permissionGranted', {});
      return true;
    }

    throw new Error('Notification permission denied');
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(options = {}) {
    try {
      await this.requestPermission();

      const subscriptionOptions = {
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.getVapidPublicKey()),
        ...options
      };

      this.subscription = await this.pushManager.subscribe(subscriptionOptions);

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);

      this.emit('subscribed', { subscription: this.subscription });

      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    if (!this.subscription) return;

    try {
      await this.subscription.unsubscribe();
      await this.removeSubscriptionFromServer(this.subscription);

      this.subscription = null;
      this.emit('unsubscribed', {});
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    }
  }

  /**
   * Send notification
   */
  async sendNotification(notification, options = {}) {
    if (!this.subscription) {
      throw new Error('No active subscription');
    }

    const payload = {
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      badge: notification.badge,
      image: notification.image,
      data: notification.data || {},
      actions: notification.actions || [],
      requireInteraction: notification.requireInteraction || false,
      silent: notification.silent || false,
      tag: notification.tag || Date.now().toString(),
      timestamp: Date.now(),
      ...options
    };

    try {
      // Send to push service
      const response = await this.sendToPushService(payload);

      // Track notification
      this.trackNotification(payload, 'sent');

      this.emit('notificationSent', { notification: payload, response });

      return response;
    } catch (error) {
      console.error('Failed to send notification:', error);
      this.trackNotification(payload, 'failed');
      throw error;
    }
  }

  /**
   * Send notification to push service
   */
  async sendToPushService(payload) {
    // In production, send to your push service (FCM, WebPush, etc.)
    console.log('Sending notification to push service:', payload);

    // Simulate API call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true, messageId: Date.now().toString() });
      }, 100);
    });
  }

  /**
   * Schedule notification
   */
  async scheduleNotification(notification, scheduleOptions) {
    if (!this.options.enableScheduling) {
      throw new Error('Notification scheduling is not enabled');
    }

    const scheduledNotification = {
      id: Date.now().toString(),
      notification,
      scheduleOptions,
      status: 'scheduled',
      createdAt: new Date(),
      scheduledFor: new Date(scheduleOptions.timestamp)
    };

    // Store scheduled notification
    this.scheduledNotifications.set(scheduledNotification.id, scheduledNotification);

    // Setup timer
    const delay = scheduleOptions.timestamp - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        this.deliverScheduledNotification(scheduledNotification);
      }, delay);
    } else {
      // Deliver immediately if time has passed
      this.deliverScheduledNotification(scheduledNotification);
    }

    this.emit('notificationScheduled', scheduledNotification);

    return scheduledNotification.id;
  }

  /**
   * Deliver scheduled notification
   */
  async deliverScheduledNotification(scheduledNotification) {
    try {
      await this.sendNotification(scheduledNotification.notification);
      scheduledNotification.status = 'delivered';
      this.emit('scheduledNotificationDelivered', scheduledNotification);
    } catch (error) {
      scheduledNotification.status = 'failed';
      this.emit('scheduledNotificationFailed', { scheduledNotification, error });
    }

    // Remove from scheduled list
    this.scheduledNotifications.delete(scheduledNotification.id);
  }

  /**
   * Cancel scheduled notification
   */
  cancelScheduledNotification(notificationId) {
    const notification = this.scheduledNotifications.get(notificationId);
    if (notification) {
      notification.status = 'cancelled';
      this.scheduledNotifications.delete(notificationId);
      this.emit('scheduledNotificationCancelled', notification);
      return true;
    }
    return false;
  }

  /**
   * Send notification to user segment
   */
  async sendToSegment(notification, segmentId, options = {}) {
    if (!this.options.enableSegmentation) {
      throw new Error('User segmentation is not enabled');
    }

    const segment = this.userSegments.get(segmentId);
    if (!segment) {
      throw new Error(`Segment ${segmentId} not found`);
    }

    const results = [];
    const batches = this.chunkArray(segment.users, this.options.batchSize);

    for (const batch of batches) {
      const batchPromises = batch.map(userId =>
        this.sendNotification(notification, { userId, ...options }).catch(error => ({
          userId,
          error
        }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    this.emit('segmentNotificationSent', { segmentId, results });

    return results;
  }

  /**
   * Create user segment
   */
  createSegment(segmentId, criteria) {
    const segment = {
      id: segmentId,
      criteria,
      users: [],
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    this.userSegments.set(segmentId, segment);
    this.emit('segmentCreated', segment);

    return segment;
  }

  /**
   * Update user segment
   */
  updateSegment(segmentId, users) {
    const segment = this.userSegments.get(segmentId);
    if (!segment) {
      throw new Error(`Segment ${segmentId} not found`);
    }

    segment.users = users;
    segment.lastUpdated = new Date();

    this.emit('segmentUpdated', segment);

    return segment;
  }

  /**
   * Setup message handling
   */
  setupMessageHandling() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('message', event => {
      this.handleServiceWorkerMessage(event);
    });
  }

  /**
   * Handle service worker messages
   */
  handleServiceWorkerMessage(event) {
    const { type, data } = event.data;

    switch (type) {
      case 'NOTIFICATION_CLICKED':
        this.handleNotificationClick(data);
        break;
      case 'NOTIFICATION_CLOSED':
        this.handleNotificationClose(data);
        break;
      case 'NOTIFICATION_SHOWN':
        this.handleNotificationShown(data);
        break;
      case 'PUSH_RECEIVED':
        this.handlePushReceived(data);
        break;
    }
  }

  /**
   * Handle notification click
   */
  handleNotificationClick(data) {
    this.trackNotification(data, 'clicked');

    // Handle navigation or action
    if (data.action) {
      this.handleNotificationAction(data.action, data);
    } else if (data.data?.url) {
      window.location.href = data.data.url;
    }

    this.emit('notificationClicked', data);
  }

  /**
   * Handle notification close
   */
  handleNotificationClose(data) {
    this.trackNotification(data, 'closed');
    this.emit('notificationClosed', data);
  }

  /**
   * Handle notification shown
   */
  handleNotificationShown(data) {
    this.trackNotification(data, 'shown');
    this.emit('notificationShown', data);
  }

  /**
   * Handle push received
   */
  handlePushReceived(data) {
    this.emit('pushReceived', data);
  }

  /**
   * Handle notification action
   */
  handleNotificationAction(action, data) {
    switch (action) {
      case 'view':
        if (data.data?.url) {
          window.open(data.data.url, '_blank');
        }
        break;
      case 'dismiss':
        // Already handled by close event
        break;
      default:
        this.emit('notificationAction', { action, data });
    }
  }

  /**
   * Track notification analytics
   */
  trackNotification(notification, event) {
    if (!this.options.enableAnalytics) return;

    const key = `${notification.tag || notification.timestamp}`;

    if (!this.analytics.has(key)) {
      this.analytics.set(key, {
        sent: 0,
        shown: 0,
        clicked: 0,
        closed: 0,
        failed: 0
      });
    }

    const stats = this.analytics.get(key);
    stats[event] = (stats[event] || 0) + 1;

    // Emit analytics event
    this.emit('analyticsUpdate', { notification, event, stats });
  }

  /**
   * Setup analytics
   */
  setupAnalytics() {
    if (!this.options.enableAnalytics) return;

    // Setup periodic analytics reporting
    setInterval(() => {
      this.reportAnalytics();
    }, 3600000); // Every hour
  }

  /**
   * Report analytics
   */
  reportAnalytics() {
    const analyticsData = {
      totalSent: 0,
      totalShown: 0,
      totalClicked: 0,
      totalClosed: 0,
      totalFailed: 0,
      clickRate: 0,
      deliveryRate: 0
    };

    for (const stats of this.analytics.values()) {
      analyticsData.totalSent += stats.sent;
      analyticsData.totalShown += stats.shown;
      analyticsData.totalClicked += stats.clicked;
      analyticsData.totalClosed += stats.closed;
      analyticsData.totalFailed += stats.failed;
    }

    // Calculate rates
    if (analyticsData.totalSent > 0) {
      analyticsData.clickRate = (analyticsData.totalClicked / analyticsData.totalSent) * 100;
      analyticsData.deliveryRate =
        ((analyticsData.totalSent - analyticsData.totalFailed) / analyticsData.totalSent) * 100;
    }

    this.emit('analyticsReport', analyticsData);

    return analyticsData;
  }

  /**
   * Get notification analytics
   */
  getAnalytics(timeRange = 7 * 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - timeRange;
    const recentAnalytics = new Map();

    for (const [key, stats] of this.analytics.entries()) {
      // Filter by time range if timestamp is available
      recentAnalytics.set(key, stats);
    }

    return {
      total: recentAnalytics.size,
      analytics: Object.fromEntries(recentAnalytics),
      summary: this.reportAnalytics()
    };
  }

  /**
   * Load user preferences
   */
  loadUserPreferences() {
    try {
      const preferences = localStorage.getItem('push_notification_preferences');
      if (preferences) {
        this.preferences = JSON.parse(preferences);
      } else {
        this.preferences = {
          enabled: true,
          categories: {
            marketAlerts: true,
            portfolioUpdates: true,
            systemNotifications: true,
            promotional: false
          },
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          },
          frequency: 'normal' // low, normal, high
        };
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      this.preferences = {};
    }
  }

  /**
   * Save user preferences
   */
  saveUserPreferences() {
    try {
      localStorage.setItem('push_notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  /**
   * Update user preferences
   */
  updatePreferences(newPreferences) {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.saveUserPreferences();
    this.emit('preferencesUpdated', this.preferences);
  }

  /**
   * Check if notification should be sent based on preferences
   */
  shouldSendNotification(notification) {
    if (!this.preferences.enabled) return false;

    // Check category preferences
    const category = notification.category || 'systemNotifications';
    if (!this.preferences.categories[category]) return false;

    // Check quiet hours
    if (this.preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const startTime = this.parseTime(this.preferences.quietHours.start);
      const endTime = this.parseTime(this.preferences.quietHours.end);

      if (this.isTimeInRange(currentTime, startTime, endTime)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Parse time string to minutes
   */
  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 100 + minutes;
  }

  /**
   * Check if time is in range
   */
  isTimeInRange(current, start, end) {
    if (start <= end) {
      return current >= start && current <= end;
    } else {
      // Handle overnight ranges
      return current >= start || current <= end;
    }
  }

  /**
   * Utility function to chunk arrays
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
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
   * Get VAPID public key (should be fetched from server)
   */
  getVapidPublicKey() {
    // In production, this should be fetched from your server
    return 'YOUR_VAPID_PUBLIC_KEY_HERE';
  }

  /**
   * Send subscription to server
   */
  async sendSubscriptionToServer(subscription) {
    // In production, send to your server
    console.log('Sending subscription to server:', subscription);
  }

  /**
   * Remove subscription from server
   */
  async removeSubscriptionFromServer(subscription) {
    // In production, remove from your server
    console.log('Removing subscription from server:', subscription);
  }

  /**
   * Get push notification status
   */
  getStatus() {
    return {
      supported: this.isSupported(),
      permission: Notification.permission,
      subscribed: !!this.subscription,
      preferences: this.preferences,
      scheduledCount: this.scheduledNotifications.size,
      segmentCount: this.userSegments.size
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
        console.error(`Error in push notification ${event} callback:`, error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Cancel all scheduled notifications
    for (const [id, notification] of this.scheduledNotifications.entries()) {
      this.cancelScheduledNotification(id);
    }

    // Clear analytics
    this.analytics.clear();

    // Clear segments
    this.userSegments.clear();

    this.isInitialized = false;
    console.log('Push Notification Service cleaned up');
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default PushNotificationService;
