/**
 * Webhook Service
 * Real-time event delivery system for API ecosystem integration
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const axios = require('axios');

class WebhookService extends EventEmitter {
  constructor() {
    super();
    this.webhooks = new Map(); // In production, this would be a database
    this.deliveryQueue = [];
    this.maxRetries = 3;
    this.retryDelays = [1000, 5000, 15000]; // 1s, 5s, 15s
    this.deliveryTimeout = 30000; // 30 seconds
    
    this.eventTypes = {
      // Analysis Events
      'analysis.completed': { description: 'Analysis calculation completed' },
      'analysis.failed': { description: 'Analysis calculation failed' },
      'analysis.started': { description: 'Analysis calculation started' },
      
      // Model Events
      'model.updated': { description: 'Financial model updated' },
      'model.published': { description: 'Model published for collaboration' },
      
      // Data Events
      'data.updated': { description: 'Market data updated' },
      'data.anomaly_detected': { description: 'Data anomaly detected' },
      
      // Collaboration Events
      'collaboration.comment_added': { description: 'New comment added' },
      'collaboration.user_joined': { description: 'User joined workspace' },
      'collaboration.version_created': { description: 'New version created' },
      
      // Export Events
      'export.completed': { description: 'Export generation completed' },
      'export.failed': { description: 'Export generation failed' },
      
      // Notification Events
      'notification.sent': { description: 'Notification delivered' },
      'alert.triggered': { description: 'Alert condition triggered' },
      
      // System Events
      'system.maintenance_start': { description: 'System maintenance started' },
      'system.maintenance_end': { description: 'System maintenance ended' },
      'system.health_check': { description: 'System health status update' }
    };

    // Start the delivery worker
    this.startDeliveryWorker();
  }

  /**
   * Webhook Registration & Management
   */
  async registerWebhook(webhookData) {
    const webhook = {
      id: this.generateWebhookId(),
      url: webhookData.url,
      events: webhookData.events || [],
      secret: webhookData.secret || this.generateSecret(),
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
      metadata: {
        user_id: webhookData.user_id,
        application_name: webhookData.application_name,
        description: webhookData.description
      },
      delivery_settings: {
        timeout: webhookData.timeout || this.deliveryTimeout,
        max_retries: webhookData.max_retries || this.maxRetries,
        retry_strategy: 'exponential_backoff'
      },
      statistics: {
        total_deliveries: 0,
        successful_deliveries: 0,
        failed_deliveries: 0,
        last_delivery: null,
        average_response_time: 0
      }
    };

    // Validate webhook URL
    const validationResult = await this.validateWebhookURL(webhook.url);
    if (!validationResult.valid) {
      throw new Error(`Webhook URL validation failed: ${validationResult.error}`);
    }

    this.webhooks.set(webhook.id, webhook);
    
    this.emit('webhook:registered', { webhook_id: webhook.id, url: webhook.url });
    
    return {
      webhook_id: webhook.id,
      url: webhook.url,
      secret: webhook.secret,
      events: webhook.events,
      created_at: webhook.created_at
    };
  }

  async updateWebhook(webhookId, updates) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    // Validate URL if being updated
    if (updates.url && updates.url !== webhook.url) {
      const validationResult = await this.validateWebhookURL(updates.url);
      if (!validationResult.valid) {
        throw new Error(`Webhook URL validation failed: ${validationResult.error}`);
      }
    }

    const updatedWebhook = {
      ...webhook,
      ...updates,
      updated_at: new Date()
    };

    this.webhooks.set(webhookId, updatedWebhook);
    
    this.emit('webhook:updated', { webhook_id: webhookId, updates });
    
    return updatedWebhook;
  }

  async deleteWebhook(webhookId) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    this.webhooks.delete(webhookId);
    
    this.emit('webhook:deleted', { webhook_id: webhookId });
    
    return { success: true, deleted_at: new Date() };
  }

  getWebhook(webhookId) {
    return this.webhooks.get(webhookId);
  }

  listWebhooks(filters = {}) {
    const webhooks = Array.from(this.webhooks.values());
    
    let filtered = webhooks;
    
    if (filters.user_id) {
      filtered = filtered.filter(w => w.metadata.user_id === filters.user_id);
    }
    
    if (filters.active !== undefined) {
      filtered = filtered.filter(w => w.active === filters.active);
    }
    
    if (filters.events) {
      const eventList = Array.isArray(filters.events) ? filters.events : [filters.events];
      filtered = filtered.filter(w => 
        eventList.some(event => w.events.includes(event))
      );
    }

    return {
      webhooks: filtered.map(w => ({
        id: w.id,
        url: w.url,
        events: w.events,
        active: w.active,
        created_at: w.created_at,
        statistics: w.statistics
      })),
      total: filtered.length
    };
  }

  /**
   * Event Publishing
   */
  async publishEvent(eventType, payload, metadata = {}) {
    if (!this.eventTypes[eventType]) {
      throw new Error(`Unknown event type: ${eventType}`);
    }

    const event = {
      id: this.generateEventId(),
      type: eventType,
      payload,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        source: 'financeanalyst_pro',
        version: '1.0'
      }
    };

    // Find webhooks subscribed to this event type
    const subscribedWebhooks = Array.from(this.webhooks.values())
      .filter(webhook => 
        webhook.active && 
        (webhook.events.includes(eventType) || webhook.events.includes('*'))
      );

    if (subscribedWebhooks.length === 0) {
      this.emit('event:no_subscribers', { event_type: eventType, event_id: event.id });
      return { event_id: event.id, subscribers: 0 };
    }

    // Queue deliveries
    for (const webhook of subscribedWebhooks) {
      const delivery = {
        id: this.generateDeliveryId(),
        event_id: event.id,
        webhook_id: webhook.id,
        webhook_url: webhook.url,
        event_type: eventType,
        payload: event,
        secret: webhook.secret,
        attempts: 0,
        max_retries: webhook.delivery_settings.max_retries,
        timeout: webhook.delivery_settings.timeout,
        created_at: new Date(),
        status: 'pending'
      };

      this.deliveryQueue.push(delivery);
    }

    this.emit('event:published', { 
      event_id: event.id, 
      event_type: eventType, 
      subscribers: subscribedWebhooks.length 
    });

    return {
      event_id: event.id,
      event_type: eventType,
      subscribers: subscribedWebhooks.length,
      deliveries_queued: subscribedWebhooks.length
    };
  }

  /**
   * Delivery System
   */
  startDeliveryWorker() {
    setInterval(() => {
      this.processDeliveryQueue();
    }, 1000); // Process queue every second
  }

  async processDeliveryQueue() {
    const pendingDeliveries = this.deliveryQueue.filter(d => d.status === 'pending');
    
    for (const delivery of pendingDeliveries.slice(0, 10)) { // Process max 10 at a time
      try {
        await this.attemptDelivery(delivery);
      } catch (error) {
        console.error('Delivery processing error:', error);
      }
    }
  }

  async attemptDelivery(delivery) {
    delivery.status = 'attempting';
    delivery.attempts++;
    delivery.last_attempt = new Date();

    try {
      const startTime = Date.now();
      
      const signature = this.generateSignature(delivery.payload, delivery.secret);
      
      const response = await axios.post(delivery.webhook_url, delivery.payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': delivery.event_type,
          'X-Webhook-Delivery': delivery.id,
          'X-Webhook-Timestamp': delivery.created_at.toISOString(),
          'User-Agent': 'FinanceAnalyst-Webhooks/1.0'
        },
        timeout: delivery.timeout,
        validateStatus: (status) => status >= 200 && status < 300
      });

      const responseTime = Date.now() - startTime;

      // Mark as successful
      delivery.status = 'delivered';
      delivery.delivered_at = new Date();
      delivery.response_status = response.status;
      delivery.response_time = responseTime;

      // Update webhook statistics
      this.updateWebhookStatistics(delivery.webhook_id, {
        successful_delivery: true,
        response_time: responseTime
      });

      this.emit('delivery:success', {
        delivery_id: delivery.id,
        webhook_id: delivery.webhook_id,
        event_type: delivery.event_type,
        response_time: responseTime,
        attempts: delivery.attempts
      });

      // Remove from queue
      this.removeFromQueue(delivery.id);

    } catch (error) {
      await this.handleDeliveryFailure(delivery, error);
    }
  }

  async handleDeliveryFailure(delivery, error) {
    const isRetryable = this.isRetryableError(error);
    const hasRetriesLeft = delivery.attempts < delivery.max_retries;

    if (isRetryable && hasRetriesLeft) {
      // Schedule retry
      delivery.status = 'pending';
      delivery.next_retry = new Date(Date.now() + this.calculateRetryDelay(delivery.attempts));
      
      this.emit('delivery:retry_scheduled', {
        delivery_id: delivery.id,
        webhook_id: delivery.webhook_id,
        attempt: delivery.attempts,
        next_retry: delivery.next_retry
      });
    } else {
      // Mark as failed
      delivery.status = 'failed';
      delivery.failed_at = new Date();
      delivery.error = {
        message: error.message,
        code: error.code,
        response_status: error.response?.status,
        response_data: error.response?.data
      };

      // Update webhook statistics
      this.updateWebhookStatistics(delivery.webhook_id, {
        failed_delivery: true
      });

      this.emit('delivery:failed', {
        delivery_id: delivery.id,
        webhook_id: delivery.webhook_id,
        event_type: delivery.event_type,
        error: delivery.error,
        attempts: delivery.attempts
      });

      // Remove from queue
      this.removeFromQueue(delivery.id);
    }
  }

  /**
   * Webhook Testing & Validation
   */
  async validateWebhookURL(url) {
    try {
      const testPayload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        test: true
      };

      const response = await axios.post(url, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Test': 'true'
        },
        timeout: 10000,
        validateStatus: (status) => status >= 200 && status < 500
      });

      return {
        valid: response.status >= 200 && response.status < 300,
        status_code: response.status,
        response_time: response.headers['x-response-time'] || 'N/A'
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        code: error.code
      };
    }
  }

  async testWebhook(webhookId, eventType = 'webhook.test') {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const testPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      test: true,
      webhook_id: webhookId,
      data: {
        message: 'This is a test webhook delivery',
        test_data: {
          number: 42,
          string: 'hello world',
          boolean: true,
          array: [1, 2, 3],
          object: { key: 'value' }
        }
      }
    };

    return await this.publishEvent(eventType, testPayload, { test: true });
  }

  /**
   * Delivery Analytics & Monitoring
   */
  getDeliveryStatistics(webhookId, timeframe = '24h') {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    // In production, this would query from database with time filters
    return {
      webhook_id: webhookId,
      timeframe,
      statistics: webhook.statistics,
      health_score: this.calculateWebhookHealthScore(webhook),
      recommendations: this.generateHealthRecommendations(webhook)
    };
  }

  getGlobalStatistics(timeframe = '24h') {
    const allWebhooks = Array.from(this.webhooks.values());
    
    return {
      total_webhooks: allWebhooks.length,
      active_webhooks: allWebhooks.filter(w => w.active).length,
      total_deliveries: allWebhooks.reduce((sum, w) => sum + w.statistics.total_deliveries, 0),
      successful_deliveries: allWebhooks.reduce((sum, w) => sum + w.statistics.successful_deliveries, 0),
      failed_deliveries: allWebhooks.reduce((sum, w) => sum + w.statistics.failed_deliveries, 0),
      average_response_time: this.calculateGlobalAverageResponseTime(allWebhooks),
      queue_size: this.deliveryQueue.length,
      event_types_published: Object.keys(this.eventTypes).length
    };
  }

  // Helper Methods
  generateWebhookId() {
    return 'wh_' + crypto.randomBytes(16).toString('hex');
  }

  generateEventId() {
    return 'evt_' + crypto.randomBytes(16).toString('hex');
  }

  generateDeliveryId() {
    return 'del_' + crypto.randomBytes(16).toString('hex');
  }

  generateSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return 'sha256=' + hmac.digest('hex');
  }

  isRetryableError(error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') return true;
    if (error.response && error.response.status >= 500) return true;
    if (error.response && error.response.status === 429) return true;
    return false;
  }

  calculateRetryDelay(attempt) {
    return this.retryDelays[Math.min(attempt - 1, this.retryDelays.length - 1)];
  }

  updateWebhookStatistics(webhookId, stats) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return;

    webhook.statistics.total_deliveries++;
    
    if (stats.successful_delivery) {
      webhook.statistics.successful_deliveries++;
      webhook.statistics.last_delivery = new Date();
      
      if (stats.response_time) {
        const currentAvg = webhook.statistics.average_response_time;
        const totalDeliveries = webhook.statistics.total_deliveries;
        webhook.statistics.average_response_time = 
          ((currentAvg * (totalDeliveries - 1)) + stats.response_time) / totalDeliveries;
      }
    } else if (stats.failed_delivery) {
      webhook.statistics.failed_deliveries++;
    }

    this.webhooks.set(webhookId, webhook);
  }

  removeFromQueue(deliveryId) {
    const index = this.deliveryQueue.findIndex(d => d.id === deliveryId);
    if (index !== -1) {
      this.deliveryQueue.splice(index, 1);
    }
  }

  calculateWebhookHealthScore(webhook) {
    const stats = webhook.statistics;
    if (stats.total_deliveries === 0) return 1.0;
    
    const successRate = stats.successful_deliveries / stats.total_deliveries;
    const responseTimeScore = stats.average_response_time < 5000 ? 1.0 : 0.5;
    
    return (successRate * 0.8) + (responseTimeScore * 0.2);
  }

  generateHealthRecommendations(webhook) {
    const recommendations = [];
    const healthScore = this.calculateWebhookHealthScore(webhook);
    
    if (healthScore < 0.8) {
      recommendations.push('Webhook reliability is below optimal. Check endpoint stability.');
    }
    
    if (webhook.statistics.average_response_time > 10000) {
      recommendations.push('Response times are high. Consider optimizing endpoint performance.');
    }
    
    if (webhook.statistics.failed_deliveries > webhook.statistics.successful_deliveries * 0.1) {
      recommendations.push('High failure rate detected. Review error logs and endpoint availability.');
    }
    
    return recommendations;
  }

  calculateGlobalAverageResponseTime(webhooks) {
    const totalResponseTime = webhooks.reduce((sum, w) => 
      sum + (w.statistics.average_response_time * w.statistics.successful_deliveries), 0);
    const totalSuccessfulDeliveries = webhooks.reduce((sum, w) => 
      sum + w.statistics.successful_deliveries, 0);
    
    return totalSuccessfulDeliveries > 0 ? totalResponseTime / totalSuccessfulDeliveries : 0;
  }
}

module.exports = new WebhookService();
