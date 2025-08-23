// Notification System - Phase 2 Implementation
export class NotificationService {
  constructor() {
    this.notifications = new Map();
    this.userPreferences = new Map();
    this.subscriptions = new Map();
    this.channels = new Map();
    this.templates = new Map();
    this.eventHandlers = new Map();
    this.deliveryProviders = new Map();
    this.initializeDefaultTemplates();
    this.initializeChannels();
  }

  initializeDefaultTemplates() {
    const templates = {
      // Collaboration notifications
      'user_joined': {
        title: '{{ userName }} joined the model',
        body: '{{ userName }} has joined {{ modelName }} and is now collaborating.',
        icon: 'user-plus',
        category: 'collaboration',
        priority: 'low'
      },
      'user_left': {
        title: '{{ userName }} left the model',
        body: '{{ userName }} has left {{ modelName }}.',
        icon: 'user-minus', 
        category: 'collaboration',
        priority: 'low'
      },
      'comment_added': {
        title: 'New comment from {{ userName }}',
        body: '{{ userName }} commented: "{{ commentText }}" on {{ location }}',
        icon: 'message-square',
        category: 'collaboration',
        priority: 'medium'
      },
      'comment_replied': {
        title: '{{ userName }} replied to your comment',
        body: 'Reply: "{{ replyText }}" on {{ location }}',
        icon: 'reply',
        category: 'collaboration',
        priority: 'high'
      },
      'mentioned': {
        title: 'You were mentioned by {{ userName }}',
        body: '{{ userName }} mentioned you in {{ location }}: "{{ content }}"',
        icon: 'at-sign',
        category: 'collaboration',
        priority: 'high'
      },

      // Model updates
      'model_updated': {
        title: 'Model updated by {{ userName }}',
        body: '{{ userName }} made {{ changeCount }} changes to {{ modelName }}',
        icon: 'edit',
        category: 'model_updates',
        priority: 'medium'
      },
      'version_created': {
        title: 'New version created',
        body: 'Version {{ version }} of {{ modelName }} has been created by {{ userName }}',
        icon: 'git-branch',
        category: 'model_updates',
        priority: 'medium'
      },
      'model_shared': {
        title: 'Model shared with you',
        body: '{{ userName }} shared {{ modelName }} with you as {{ role }}',
        icon: 'share',
        category: 'model_updates',
        priority: 'high'
      },

      // Data updates
      'data_refreshed': {
        title: 'Data refreshed',
        body: 'Market data for {{ modelName }} has been updated with latest information',
        icon: 'refresh-cw',
        category: 'data_updates',
        priority: 'low'
      },
      'data_fetch_error': {
        title: 'Data update failed',
        body: 'Failed to refresh data for {{ modelName }}: {{ error }}',
        icon: 'alert-triangle',
        category: 'data_updates',
        priority: 'high'
      },

      // Analysis alerts
      'covenant_breach': {
        title: 'Covenant breach detected',
        body: '{{ covenantName }} is projected to breach in {{ modelName }} by {{ date }}',
        icon: 'alert-circle',
        category: 'analysis_alerts',
        priority: 'critical'
      },
      'risk_threshold_exceeded': {
        title: 'Risk threshold exceeded',
        body: '{{ riskMetric }} has exceeded threshold in {{ modelName }}: {{ value }}',
        icon: 'trending-up',
        category: 'analysis_alerts',
        priority: 'high'
      },
      'valuation_change': {
        title: 'Significant valuation change',
        body: 'Valuation for {{ modelName }} changed by {{ percentChange }} to {{ newValue }}',
        icon: 'dollar-sign',
        category: 'analysis_alerts',
        priority: 'medium'
      },

      // System notifications
      'export_completed': {
        title: 'Export completed',
        body: 'Your {{ exportType }} export of {{ modelName }} is ready for download',
        icon: 'download',
        category: 'system',
        priority: 'medium'
      },
      'presentation_generated': {
        title: 'Presentation ready',
        body: 'Your {{ presentationType }} presentation has been generated and is ready to view',
        icon: 'presentation',
        category: 'system',
        priority: 'medium'
      }
    };

    Object.entries(templates).forEach(([id, template]) => {
      this.templates.set(id, template);
    });
  }

  initializeChannels() {
    const channels = {
      'in_app': {
        name: 'In-App Notifications',
        description: 'Show notifications within the application',
        enabled: true,
        config: {
          displayDuration: 5000,
          maxVisible: 5,
          position: 'top-right'
        }
      },
      'email': {
        name: 'Email Notifications',
        description: 'Send notifications via email',
        enabled: true,
        config: {
          digest: false,
          digestFrequency: 'daily',
          immediateThreshold: 'high'
        }
      },
      'push': {
        name: 'Push Notifications',
        description: 'Browser push notifications',
        enabled: false,
        config: {
          requirePermission: true,
          maxPerHour: 10
        }
      },
      'slack': {
        name: 'Slack Integration',
        description: 'Send notifications to Slack channels',
        enabled: false,
        config: {
          webhook: null,
          channel: null,
          mentionUsers: false
        }
      },
      'teams': {
        name: 'Microsoft Teams',
        description: 'Send notifications to Teams channels',
        enabled: false,
        config: {
          webhook: null,
          channel: null
        }
      }
    };

    Object.entries(channels).forEach(([id, channel]) => {
      this.channels.set(id, channel);
    });
  }

  // User Preference Management
  async setUserPreferences(userId, preferences) {
    const userPrefs = {
      userId,
      updatedAt: new Date().toISOString(),
      channels: preferences.channels || {
        in_app: { enabled: true },
        email: { enabled: true, frequency: 'immediate' },
        push: { enabled: false },
        slack: { enabled: false },
        teams: { enabled: false }
      },
      categories: preferences.categories || {
        collaboration: { enabled: true, priority: 'medium' },
        model_updates: { enabled: true, priority: 'medium' },
        data_updates: { enabled: true, priority: 'low' },
        analysis_alerts: { enabled: true, priority: 'high' },
        system: { enabled: true, priority: 'medium' }
      },
      quietHours: preferences.quietHours || {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      },
      digestSettings: preferences.digestSettings || {
        enabled: true,
        frequency: 'daily',
        time: '09:00',
        includeCategories: ['collaboration', 'model_updates', 'system']
      }
    };

    this.userPreferences.set(userId, userPrefs);
    this.emit('preferences_updated', { userId, preferences: userPrefs });
    return userPrefs;
  }

  getUserPreferences(userId) {
    return this.userPreferences.get(userId) || this.getDefaultPreferences(userId);
  }

  getDefaultPreferences(userId) {
    return {
      userId,
      updatedAt: new Date().toISOString(),
      channels: {
        in_app: { enabled: true },
        email: { enabled: true, frequency: 'immediate' },
        push: { enabled: false },
        slack: { enabled: false },
        teams: { enabled: false }
      },
      categories: {
        collaboration: { enabled: true, priority: 'medium' },
        model_updates: { enabled: true, priority: 'medium' },
        data_updates: { enabled: true, priority: 'low' },
        analysis_alerts: { enabled: true, priority: 'high' },
        system: { enabled: true, priority: 'medium' }
      },
      quietHours: { enabled: false },
      digestSettings: { enabled: false }
    };
  }

  // Notification Creation and Sending
  async sendNotification(recipients, templateId, data, options = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const recipientList = Array.isArray(recipients) ? recipients : [recipients];
    const notifications = [];

    for (const recipient of recipientList) {
      const notification = await this.createNotification(recipient, template, data, options);
      notifications.push(notification);
      
      // Send through appropriate channels based on user preferences
      await this.deliverNotification(notification);
    }

    return notifications;
  }

  async createNotification(userId, template, data, options = {}) {
    const notification = {
      id: this.generateNotificationId(),
      userId,
      templateId: template.templateId || 'custom',
      title: this.renderTemplate(template.title, data),
      body: this.renderTemplate(template.body, data),
      icon: template.icon || 'bell',
      category: template.category || 'general',
      priority: options.priority || template.priority || 'medium',
      data: data,
      metadata: {
        modelId: data.modelId || null,
        sourceUserId: data.sourceUserId || null,
        actionUrl: options.actionUrl || null,
        expiresAt: options.expiresAt || null
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
      readAt: null,
      deliveredChannels: [],
      failedChannels: []
    };

    this.notifications.set(notification.id, notification);
    this.emit('notification_created', notification);
    return notification;
  }

  async deliverNotification(notification) {
    const userPreferences = this.getUserPreferences(notification.userId);
    const categoryPrefs = userPreferences.categories[notification.category] || { enabled: true };

    // Check if user wants notifications for this category
    if (!categoryPrefs.enabled) {
      notification.status = 'skipped';
      notification.skipReason = 'category_disabled';
      return notification;
    }

    // Check quiet hours
    if (this.isQuietHours(userPreferences.quietHours)) {
      // Queue for later delivery unless critical
      if (notification.priority !== 'critical') {
        notification.status = 'queued';
        notification.queuedUntil = this.calculateQuietHoursEnd(userPreferences.quietHours);
        return notification;
      }
    }

    // Deliver through enabled channels
    const enabledChannels = Object.entries(userPreferences.channels)
      .filter(([channel, config]) => config.enabled)
      .map(([channel]) => channel);

    for (const channelId of enabledChannels) {
      try {
        await this.deliverToChannel(notification, channelId, userPreferences.channels[channelId]);
        notification.deliveredChannels.push(channelId);
      } catch (error) {
        console.error(`Failed to deliver notification ${notification.id} to ${channelId}:`, error);
        notification.failedChannels.push({ channel: channelId, error: error.message });
      }
    }

    notification.status = notification.deliveredChannels.length > 0 ? 'delivered' : 'failed';
    notification.deliveredAt = new Date().toISOString();

    this.emit('notification_delivered', notification);
    return notification;
  }

  async deliverToChannel(notification, channelId, channelConfig) {
    const channel = this.channels.get(channelId);
    if (!channel || !channel.enabled) {
      throw new Error(`Channel not available: ${channelId}`);
    }

    switch (channelId) {
      case 'in_app':
        return this.deliverInApp(notification, channelConfig);
      case 'email':
        return this.deliverEmail(notification, channelConfig);
      case 'push':
        return this.deliverPush(notification, channelConfig);
      case 'slack':
        return this.deliverSlack(notification, channelConfig);
      case 'teams':
        return this.deliverTeams(notification, channelConfig);
      default:
        throw new Error(`Unknown channel: ${channelId}`);
    }
  }

  // Channel-specific delivery methods
  deliverInApp(notification, config) {
    // Emit event for in-app notification display
    this.emit('in_app_notification', {
      notification,
      config: {
        displayDuration: config.displayDuration || 5000,
        position: config.position || 'top-right'
      }
    });

    // Would integrate with UI notification system
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app_notification', {
        detail: notification
      }));
    }

    return { success: true, channel: 'in_app' };
  }

  async deliverEmail(notification, config) {
    // This would integrate with email service (SendGrid, AWS SES, etc.)
    const emailData = {
      to: await this.getUserEmail(notification.userId),
      subject: notification.title,
      html: this.generateEmailHTML(notification),
      text: notification.body
    };

    // Mock email delivery
    console.log(`Email notification sent to ${emailData.to}:`, notification.title);
    
    return { success: true, channel: 'email', emailId: `email_${Date.now()}` };
  }

  deliverPush(notification, config) {
    // Browser push notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const pushNotification = new Notification(notification.title, {
        body: notification.body,
        icon: `/icons/${notification.icon}.png`,
        tag: notification.id,
        data: notification.data
      });

      pushNotification.onclick = () => {
        if (notification.metadata.actionUrl) {
          window.location.href = notification.metadata.actionUrl;
        }
        pushNotification.close();
      };

      return { success: true, channel: 'push' };
    }

    throw new Error('Push notifications not supported or not permitted');
  }

  async deliverSlack(notification, config) {
    if (!config.webhook) {
      throw new Error('Slack webhook not configured');
    }

    const slackPayload = {
      text: notification.title,
      attachments: [{
        color: this.getPriorityColor(notification.priority),
        text: notification.body,
        footer: 'FinanceAnalyst Pro',
        ts: Math.floor(new Date(notification.createdAt).getTime() / 1000)
      }]
    };

    // Mock Slack delivery
    console.log('Slack notification sent:', slackPayload);
    return { success: true, channel: 'slack' };
  }

  async deliverTeams(notification, config) {
    if (!config.webhook) {
      throw new Error('Teams webhook not configured');
    }

    const teamsPayload = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: notification.title,
      themeColor: this.getPriorityColor(notification.priority),
      sections: [{
        activityTitle: notification.title,
        activityText: notification.body,
        activityImage: `https://app.financeanalyst.pro/icons/${notification.icon}.png`
      }]
    };

    // Mock Teams delivery
    console.log('Teams notification sent:', teamsPayload);
    return { success: true, channel: 'teams' };
  }

  // Subscription Management
  async subscribe(userId, eventType, filters = {}) {
    const subscription = {
      id: this.generateSubscriptionId(),
      userId,
      eventType,
      filters,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    if (!this.subscriptions.has(userId)) {
      this.subscriptions.set(userId, []);
    }

    this.subscriptions.get(userId).push(subscription);
    this.emit('subscription_created', subscription);
    return subscription;
  }

  async unsubscribe(userId, subscriptionId) {
    const userSubscriptions = this.subscriptions.get(userId) || [];
    const subscriptionIndex = userSubscriptions.findIndex(sub => sub.id === subscriptionId);
    
    if (subscriptionIndex === -1) {
      throw new Error('Subscription not found');
    }

    const subscription = userSubscriptions[subscriptionIndex];
    subscription.isActive = false;
    subscription.unsubscribedAt = new Date().toISOString();

    this.emit('subscription_cancelled', subscription);
    return subscription;
  }

  getUserSubscriptions(userId) {
    return (this.subscriptions.get(userId) || []).filter(sub => sub.isActive);
  }

  // Event-based notification triggering
  async handleEvent(eventType, eventData) {
    // Find all subscriptions matching this event
    const matchingSubscriptions = [];
    
    for (const [userId, userSubs] of this.subscriptions.entries()) {
      for (const subscription of userSubs) {
        if (subscription.isActive && subscription.eventType === eventType) {
          if (this.matchesFilters(eventData, subscription.filters)) {
            matchingSubscriptions.push({ ...subscription, userId });
          }
        }
      }
    }

    // Send notifications for matching subscriptions
    const notifications = [];
    for (const subscription of matchingSubscriptions) {
      try {
        const notification = await this.sendNotification(
          subscription.userId,
          eventType,
          eventData,
          { sourceEvent: eventType }
        );
        notifications.push(...notification);
      } catch (error) {
        console.error(`Failed to send notification for subscription ${subscription.id}:`, error);
      }
    }

    return notifications;
  }

  matchesFilters(eventData, filters) {
    // Simple filter matching - can be extended
    for (const [key, value] of Object.entries(filters)) {
      if (eventData[key] !== value) {
        return false;
      }
    }
    return true;
  }

  // Notification Management
  async markAsRead(notificationId, userId) {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found');
    }

    notification.readAt = new Date().toISOString();
    notification.status = 'read';

    this.emit('notification_read', notification);
    return notification;
  }

  async markAllAsRead(userId, category = null) {
    let count = 0;
    
    for (const notification of this.notifications.values()) {
      if (notification.userId === userId && !notification.readAt) {
        if (!category || notification.category === category) {
          notification.readAt = new Date().toISOString();
          notification.status = 'read';
          count++;
        }
      }
    }

    this.emit('bulk_notifications_read', { userId, category, count });
    return count;
  }

  async deleteNotification(notificationId, userId) {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found');
    }

    this.notifications.delete(notificationId);
    this.emit('notification_deleted', { notificationId, userId });
    return true;
  }

  // Query methods
  getUserNotifications(userId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      category = null,
      unreadOnly = false,
      since = null
    } = options;

    let notifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId);

    if (category) {
      notifications = notifications.filter(n => n.category === category);
    }

    if (unreadOnly) {
      notifications = notifications.filter(n => !n.readAt);
    }

    if (since) {
      const sinceDate = new Date(since);
      notifications = notifications.filter(n => new Date(n.createdAt) >= sinceDate);
    }

    // Sort by creation date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      notifications: notifications.slice(offset, offset + limit),
      total: notifications.length,
      unreadCount: notifications.filter(n => !n.readAt).length
    };
  }

  getNotificationStats(userId, timeframe = '7d') {
    const notifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId);

    const now = new Date();
    let startDate;

    switch (timeframe) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    const recentNotifications = notifications.filter(n => 
      new Date(n.createdAt) >= startDate
    );

    const stats = {
      total: recentNotifications.length,
      unread: recentNotifications.filter(n => !n.readAt).length,
      byCategory: {},
      byPriority: {},
      byStatus: {},
      deliveryRate: 0
    };

    recentNotifications.forEach(notification => {
      // By category
      stats.byCategory[notification.category] = 
        (stats.byCategory[notification.category] || 0) + 1;

      // By priority
      stats.byPriority[notification.priority] = 
        (stats.byPriority[notification.priority] || 0) + 1;

      // By status
      stats.byStatus[notification.status] = 
        (stats.byStatus[notification.status] || 0) + 1;
    });

    // Calculate delivery rate
    const delivered = stats.byStatus.delivered || 0;
    stats.deliveryRate = stats.total > 0 ? Math.round((delivered / stats.total) * 100) : 0;

    return stats;
  }

  // Utility methods
  renderTemplate(template, data) {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  generateNotificationId() {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSubscriptionId() {
    return `subscription_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getPriorityColor(priority) {
    const colors = {
      low: '#6B7280',
      medium: '#3B82F6',
      high: '#F59E0B',
      critical: '#EF4444'
    };
    return colors[priority] || colors.medium;
  }

  isQuietHours(quietHoursConfig) {
    if (!quietHoursConfig.enabled) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const start = parseInt(quietHoursConfig.start.split(':')[0]);
    const end = parseInt(quietHoursConfig.end.split(':')[0]);

    if (start <= end) {
      return currentHour >= start && currentHour < end;
    } else {
      return currentHour >= start || currentHour < end;
    }
  }

  async getUserEmail(userId) {
    // This would integrate with user management system
    return `user${userId}@example.com`;
  }

  generateEmailHTML(notification) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">${notification.title}</h2>
        <p style="color: #4b5563; line-height: 1.6;">${notification.body}</p>
        ${notification.metadata.actionUrl ? 
          `<a href="${notification.metadata.actionUrl}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px;">View Details</a>` : 
          ''
        }
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          Sent by FinanceAnalyst Pro | 
          <a href="#" style="color: #3b82f6;">Unsubscribe</a> | 
          <a href="#" style="color: #3b82f6;">Notification Preferences</a>
        </p>
      </div>
    `;
  }

  // Event system
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in notification event handler for ${event}:`, error);
        }
      });
    }
  }
}

export const notificationService = new NotificationService();
