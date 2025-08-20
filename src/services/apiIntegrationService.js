/**
 * Comprehensive API Integration Service
 * Handles third-party integrations, webhooks, and external data sources
 */

class APIIntegrationService {
  constructor() {
    this.integrations = new Map();
    this.webhooks = new Map();
    this.apiKeys = new Map();
    this.rateLimits = new Map();
    this.requestQueue = [];
    this.isInitialized = false;
    
    // Configuration
    this.config = {
      baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.financeanalyst.pro',
      timeout: 30000,
      retryAttempts: 3,
      rateLimitWindow: 60000, // 1 minute
      batchSize: 10,
      enableWebhooks: true,
      enableRealTimeSync: true
    };

    // Initialize available integrations
    this.initializeIntegrations();
  }

  /**
   * Initialize available third-party integrations
   */
  initializeIntegrations() {
    // Financial Data Providers
    this.registerIntegration('bloomberg', {
      name: 'Bloomberg API',
      type: 'financial_data',
      endpoints: {
        securities: '/v1/securities',
        prices: '/v1/prices',
        fundamentals: '/v1/fundamentals',
        news: '/v1/news'
      },
      rateLimit: { requests: 1000, window: 3600000 }, // 1000/hour
      authentication: 'api_key',
      webhookSupport: true
    });

    this.registerIntegration('refinitiv', {
      name: 'Refinitiv Data Platform',
      type: 'financial_data',
      endpoints: {
        search: '/v1/data/search',
        timeseries: '/v1/data/timeseries',
        fundamental: '/v1/data/fundamental'
      },
      rateLimit: { requests: 5000, window: 3600000 },
      authentication: 'oauth',
      webhookSupport: true
    });

    // Portfolio Management
    this.registerIntegration('schwab', {
      name: 'Charles Schwab API',
      type: 'brokerage',
      endpoints: {
        accounts: '/v1/accounts',
        positions: '/v1/accounts/{accountId}/positions',
        orders: '/v1/accounts/{accountId}/orders',
        transactions: '/v1/accounts/{accountId}/transactions'
      },
      rateLimit: { requests: 120, window: 60000 },
      authentication: 'oauth',
      webhookSupport: false
    });

    this.registerIntegration('interactive_brokers', {
      name: 'Interactive Brokers API',
      type: 'brokerage',
      endpoints: {
        portfolio: '/v1/portfolio',
        orders: '/v1/orders',
        market_data: '/v1/marketdata'
      },
      rateLimit: { requests: 200, window: 60000 },
      authentication: 'session',
      webhookSupport: false
    });

    // Cloud Storage
    this.registerIntegration('google_drive', {
      name: 'Google Drive API',
      type: 'storage',
      endpoints: {
        files: '/v3/files',
        upload: '/upload/v3/files',
        export: '/v3/files/{fileId}/export'
      },
      rateLimit: { requests: 1000, window: 100000 },
      authentication: 'oauth',
      webhookSupport: true
    });

    this.registerIntegration('dropbox', {
      name: 'Dropbox API',
      type: 'storage',
      endpoints: {
        files: '/2/files',
        upload: '/2/files/upload',
        download: '/2/files/download'
      },
      rateLimit: { requests: 300, window: 300000 },
      authentication: 'oauth',
      webhookSupport: true
    });

    // Communication
    this.registerIntegration('slack', {
      name: 'Slack API',
      type: 'communication',
      endpoints: {
        chat: '/api/chat.postMessage',
        channels: '/api/conversations.list',
        users: '/api/users.list'
      },
      rateLimit: { requests: 50, window: 60000 },
      authentication: 'oauth',
      webhookSupport: true
    });

    this.registerIntegration('microsoft_teams', {
      name: 'Microsoft Teams API',
      type: 'communication',
      endpoints: {
        messages: '/v1.0/teams/{teamId}/channels/{channelId}/messages',
        channels: '/v1.0/teams/{teamId}/channels'
      },
      rateLimit: { requests: 2000, window: 3600000 },
      authentication: 'oauth',
      webhookSupport: true
    });

    // Business Intelligence
    this.registerIntegration('tableau', {
      name: 'Tableau Server API',
      type: 'visualization',
      endpoints: {
        workbooks: '/api/{apiVersion}/sites/{siteId}/workbooks',
        datasources: '/api/{apiVersion}/sites/{siteId}/datasources'
      },
      rateLimit: { requests: 100, window: 3600000 },
      authentication: 'token',
      webhookSupport: false
    });

    this.registerIntegration('power_bi', {
      name: 'Microsoft Power BI API',
      type: 'visualization',
      endpoints: {
        datasets: '/v1.0/myorg/datasets',
        reports: '/v1.0/myorg/reports',
        dashboards: '/v1.0/myorg/dashboards'
      },
      rateLimit: { requests: 200, window: 3600000 },
      authentication: 'oauth',
      webhookSupport: true
    });

    console.log('API integrations initialized:', this.integrations.size);
  }

  /**
   * Register a new integration
   */
  registerIntegration(id, config) {
    this.integrations.set(id, {
      id,
      ...config,
      status: 'available',
      connected: false,
      lastSync: null,
      errorCount: 0,
      requestCount: 0
    });
  }

  /**
   * Connect to a third-party service
   */
  async connectIntegration(integrationId, credentials) {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    try {
      // Validate credentials based on authentication type
      await this.validateCredentials(integration, credentials);
      
      // Store encrypted credentials
      this.storeCredentials(integrationId, credentials);
      
      // Test connection
      await this.testConnection(integrationId);
      
      // Mark as connected
      integration.connected = true;
      integration.status = 'connected';
      integration.connectedAt = new Date().toISOString();
      
      // Set up webhooks if supported
      if (integration.webhookSupport && this.config.enableWebhooks) {
        await this.setupWebhook(integrationId);
      }
      
      console.log(`Successfully connected to ${integration.name}`);
      return { success: true, integration: integrationId };
      
    } catch (error) {
      integration.status = 'error';
      integration.lastError = error.message;
      console.error(`Failed to connect to ${integration.name}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from a third-party service
   */
  async disconnectIntegration(integrationId) {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    try {
      // Remove webhooks
      if (integration.webhookSupport) {
        await this.removeWebhook(integrationId);
      }
      
      // Clear stored credentials
      this.clearCredentials(integrationId);
      
      // Update status
      integration.connected = false;
      integration.status = 'available';
      integration.disconnectedAt = new Date().toISOString();
      
      console.log(`Disconnected from ${integration.name}`);
      return { success: true };
      
    } catch (error) {
      console.error(`Error disconnecting from ${integration.name}:`, error);
      throw error;
    }
  }

  /**
   * Make API request to integrated service
   */
  async makeRequest(integrationId, endpoint, options = {}) {
    const integration = this.integrations.get(integrationId);
    if (!integration || !integration.connected) {
      throw new Error(`Integration ${integrationId} not connected`);
    }

    // Check rate limits
    await this.checkRateLimit(integrationId);
    
    try {
      const credentials = this.getCredentials(integrationId);
      const url = this.buildUrl(integration, endpoint);
      
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(integration, credentials),
          ...options.headers
        },
        timeout: this.config.timeout,
        ...options
      };

      if (requestOptions.body && typeof requestOptions.body === 'object') {
        requestOptions.body = JSON.stringify(requestOptions.body);
      }

      const response = await this.makeHttpRequest(url, requestOptions);
      
      // Update request count
      integration.requestCount++;
      this.updateRateLimit(integrationId);
      
      return response;
      
    } catch (error) {
      integration.errorCount++;
      console.error(`API request failed for ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Batch multiple requests
   */
  async batchRequests(requests) {
    const batches = [];
    for (let i = 0; i < requests.length; i += this.config.batchSize) {
      batches.push(requests.slice(i, i + this.config.batchSize));
    }

    const results = [];
    for (const batch of batches) {
      const batchPromises = batch.map(req => 
        this.makeRequest(req.integrationId, req.endpoint, req.options)
          .catch(error => ({ error: error.message, request: req }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to respect rate limits
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Set up webhook for real-time updates
   */
  async setupWebhook(integrationId) {
    const integration = this.integrations.get(integrationId);
    if (!integration || !integration.webhookSupport) return;

    const webhookUrl = `${this.config.baseUrl}/webhooks/${integrationId}`;
    const webhookConfig = {
      url: webhookUrl,
      events: ['data_updated', 'account_changed', 'order_filled'],
      secret: this.generateWebhookSecret()
    };

    try {
      // Register webhook with third-party service
      const response = await this.makeRequest(integrationId, '/webhooks', {
        method: 'POST',
        body: webhookConfig
      });

      // Store webhook info
      this.webhooks.set(integrationId, {
        id: response.id,
        url: webhookUrl,
        secret: webhookConfig.secret,
        events: webhookConfig.events,
        createdAt: new Date().toISOString()
      });

      console.log(`Webhook set up for ${integration.name}`);
    } catch (error) {
      console.error(`Failed to set up webhook for ${integrationId}:`, error);
    }
  }

  /**
   * Handle incoming webhook
   */
  handleWebhook(integrationId, payload, signature) {
    const webhook = this.webhooks.get(integrationId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    // Verify signature
    if (!this.verifyWebhookSignature(payload, signature, webhook.secret)) {
      throw new Error('Invalid webhook signature');
    }

    // Process webhook payload
    this.processWebhookPayload(integrationId, payload);
    
    return { success: true };
  }

  /**
   * Sync data from integrated services
   */
  async syncIntegrationData(integrationId, dataType = null) {
    const integration = this.integrations.get(integrationId);
    if (!integration || !integration.connected) {
      throw new Error(`Integration ${integrationId} not connected`);
    }

    const syncResults = {
      integrationId,
      startTime: new Date().toISOString(),
      dataTypes: [],
      recordsProcessed: 0,
      errors: []
    };

    try {
      switch (integration.type) {
        case 'financial_data':
          await this.syncFinancialData(integrationId, dataType, syncResults);
          break;
        case 'brokerage':
          await this.syncBrokerageData(integrationId, dataType, syncResults);
          break;
        case 'storage':
          await this.syncStorageData(integrationId, dataType, syncResults);
          break;
        default:
          throw new Error(`Unsupported integration type: ${integration.type}`);
      }

      integration.lastSync = new Date().toISOString();
      syncResults.endTime = new Date().toISOString();
      syncResults.success = true;

    } catch (error) {
      syncResults.error = error.message;
      syncResults.success = false;
      throw error;
    }

    return syncResults;
  }

  /**
   * Get integration status and metrics
   */
  getIntegrationStatus(integrationId = null) {
    if (integrationId) {
      return this.integrations.get(integrationId);
    }

    const status = {
      totalIntegrations: this.integrations.size,
      connectedIntegrations: 0,
      activeWebhooks: this.webhooks.size,
      totalRequests: 0,
      totalErrors: 0,
      integrations: {}
    };

    for (const [id, integration] of this.integrations) {
      if (integration.connected) status.connectedIntegrations++;
      status.totalRequests += integration.requestCount || 0;
      status.totalErrors += integration.errorCount || 0;
      
      status.integrations[id] = {
        name: integration.name,
        type: integration.type,
        connected: integration.connected,
        status: integration.status,
        requestCount: integration.requestCount || 0,
        errorCount: integration.errorCount || 0,
        lastSync: integration.lastSync
      };
    }

    return status;
  }

  // Helper methods
  async validateCredentials(integration, credentials) {
    switch (integration.authentication) {
      case 'api_key':
        if (!credentials.apiKey) {
          throw new Error('API key required');
        }
        break;
      case 'oauth':
        if (!credentials.accessToken) {
          throw new Error('OAuth access token required');
        }
        break;
      case 'session':
        if (!credentials.sessionId) {
          throw new Error('Session ID required');
        }
        break;
      default:
        throw new Error(`Unsupported authentication type: ${integration.authentication}`);
    }
  }

  storeCredentials(integrationId, credentials) {
    // In a real implementation, this would encrypt and securely store credentials
    this.apiKeys.set(integrationId, credentials);
  }

  getCredentials(integrationId) {
    return this.apiKeys.get(integrationId);
  }

  clearCredentials(integrationId) {
    this.apiKeys.delete(integrationId);
  }

  buildUrl(integration, endpoint) {
    // This would build the full URL based on the integration's base URL and endpoint
    return `https://api.${integration.id}.com${endpoint}`;
  }

  getAuthHeaders(integration, credentials) {
    switch (integration.authentication) {
      case 'api_key':
        return { 'Authorization': `Bearer ${credentials.apiKey}` };
      case 'oauth':
        return { 'Authorization': `Bearer ${credentials.accessToken}` };
      case 'session':
        return { 'X-Session-ID': credentials.sessionId };
      default:
        return {};
    }
  }

  async makeHttpRequest(url, options) {
    const mockMode = false; // Set to false to enable live API calls
    
    if (mockMode) {
      // Mock mode for development/testing
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve({
            data: { message: 'Mock API response' },
            status: 200,
            headers: {}
          });
        }, Math.random() * 1000);
      });
    }
    
    // Live API calls using fetch
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.config.timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      };
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  async testConnection(integrationId) {
    const integration = this.integrations.get(integrationId);
    const testEndpoint = integration.endpoints.test || Object.values(integration.endpoints)[0];
    
    try {
      await this.makeRequest(integrationId, testEndpoint, { method: 'GET' });
      return true;
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  async checkRateLimit(integrationId) {
    const integration = this.integrations.get(integrationId);
    const rateLimit = this.rateLimits.get(integrationId);
    
    if (!rateLimit) {
      this.rateLimits.set(integrationId, {
        requests: 0,
        windowStart: Date.now()
      });
      return;
    }

    const now = Date.now();
    const windowDuration = integration.rateLimit.window;
    
    // Reset window if expired
    if (now - rateLimit.windowStart > windowDuration) {
      rateLimit.requests = 0;
      rateLimit.windowStart = now;
    }
    
    // Check if limit exceeded
    if (rateLimit.requests >= integration.rateLimit.requests) {
      const waitTime = windowDuration - (now - rateLimit.windowStart);
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`);
    }
  }

  updateRateLimit(integrationId) {
    const rateLimit = this.rateLimits.get(integrationId);
    if (rateLimit) {
      rateLimit.requests++;
    }
  }

  generateWebhookSecret() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  verifyWebhookSignature(payload, signature, secret) {
    // Simplified signature verification
    return signature === `sha256=${secret}`;
  }

  processWebhookPayload(integrationId, payload) {
    console.log(`Processing webhook for ${integrationId}:`, payload);
    // This would trigger relevant updates in the application
  }

  async syncFinancialData(integrationId, dataType, results) {
    // Sync financial data from providers like Bloomberg, Refinitiv
    results.dataTypes.push('market_data', 'fundamentals');
    results.recordsProcessed += 100; // Mock
  }

  async syncBrokerageData(integrationId, dataType, results) {
    // Sync portfolio and trading data
    results.dataTypes.push('positions', 'transactions');
    results.recordsProcessed += 50; // Mock
  }

  async syncStorageData(integrationId, dataType, results) {
    // Sync files and documents
    results.dataTypes.push('documents');
    results.recordsProcessed += 25; // Mock
  }

  async removeWebhook(integrationId) {
    const webhook = this.webhooks.get(integrationId);
    if (webhook) {
      // Remove from third-party service
      try {
        await this.makeRequest(integrationId, `/webhooks/${webhook.id}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Failed to remove webhook:', error);
      }
      
      this.webhooks.delete(integrationId);
    }
  }
}

export default new APIIntegrationService();
