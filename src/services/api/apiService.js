// Comprehensive API Service for FinanceAnalyst Pro
// Provides RESTful endpoints, authentication, rate limiting, and integration capabilities
class APIService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'https://api.financeanalystpro.com/v1';
    this.apiKey = process.env.REACT_APP_API_KEY || '';
    this.rateLimits = new Map();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.webhooks = new Map();
    this.integrations = new Map();

    // Initialize rate limiting
    this.initializeRateLimiting();

    // Initialize webhook system
    this.initializeWebhooks();
  }

  // Authentication and Authorization

  // OAuth2 token management
  async authenticate(credentials) {
    try {
      const response = await this.request('/auth/token', {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'password',
          username: credentials.username,
          password: credentials.password,
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret
        })
      });

      const tokenData = await response.json();
      this.storeTokens(tokenData);

      return {
        success: true,
        tokens: tokenData,
        expiresAt: Date.now() + tokenData.expires_in * 1000
      };
    } catch (error) {
      console.error('Authentication failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Refresh OAuth2 tokens
  async refreshToken(refreshToken) {
    try {
      const response = await this.request('/auth/token', {
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.getClientId(),
          client_secret: this.getClientSecret()
        })
      });

      const tokenData = await response.json();
      this.storeTokens(tokenData);

      return {
        success: true,
        tokens: tokenData,
        expiresAt: Date.now() + tokenData.expires_in * 1000
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Store tokens securely
  storeTokens(tokenData) {
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('fap_access_token', tokenData.access_token);
      localStorage.setItem('fap_refresh_token', tokenData.refresh_token);
      localStorage.setItem('fap_token_expires', Date.now() + tokenData.expires_in * 1000);
    }
  }

  // Get stored access token
  getAccessToken() {
    if (typeof Storage !== 'undefined') {
      return localStorage.getItem('fap_access_token');
    }
    return null;
  }

  // Check if token is expired
  isTokenExpired() {
    if (typeof Storage !== 'undefined') {
      const expiresAt = localStorage.getItem('fap_token_expires');
      return expiresAt ? Date.now() > parseInt(expiresAt) : true;
    }
    return true;
  }

  // Get client credentials (should be securely stored)
  getClientId() {
    return process.env.REACT_APP_CLIENT_ID || 'fap_client';
  }

  getClientSecret() {
    return process.env.REACT_APP_CLIENT_SECRET || 'fap_secret';
  }

  // Rate Limiting

  // Initialize rate limiting configuration
  initializeRateLimiting() {
    this.rateLimits.set('free', {
      requests: 100,
      period: 60 * 60 * 1000, // 1 hour
      burst: 10
    });

    this.rateLimits.set('basic', {
      requests: 1000,
      period: 60 * 60 * 1000,
      burst: 50
    });

    this.rateLimits.set('premium', {
      requests: 10000,
      period: 60 * 60 * 1000,
      burst: 200
    });

    this.rateLimits.set('enterprise', {
      requests: 100000,
      period: 60 * 60 * 1000,
      burst: 1000
    });
  }

  // Check rate limit for user
  checkRateLimit(userId, tier = 'free') {
    const limits = this.rateLimits.get(tier);
    if (!limits) return { allowed: false, error: 'Invalid tier' };

    const cacheKey = `rate_limit_${userId}_${tier}`;
    const userLimits = this.cache.get(cacheKey) || {
      requests: 0,
      resetTime: Date.now() + limits.period,
      burstCount: 0
    };

    // Reset if period expired
    if (Date.now() > userLimits.resetTime) {
      userLimits.requests = 0;
      userLimits.resetTime = Date.now() + limits.period;
      userLimits.burstCount = 0;
    }

    // Check burst limit
    if (userLimits.burstCount >= limits.burst) {
      return {
        allowed: false,
        error: 'Burst limit exceeded',
        resetIn: userLimits.resetTime - Date.now()
      };
    }

    // Check total request limit
    if (userLimits.requests >= limits.requests) {
      return {
        allowed: false,
        error: 'Rate limit exceeded',
        resetIn: userLimits.resetTime - Date.now()
      };
    }

    // Update counters
    userLimits.requests++;
    userLimits.burstCount++;
    this.cache.set(cacheKey, userLimits);

    return { allowed: true };
  }

  // API Endpoints

  // Financial Data APIs

  // Get real-time stock quotes
  async getStockQuote(symbol) {
    return this.request(`/market/quote/${symbol}`);
  }

  // Get historical stock data
  async getHistoricalData(symbol, period = '1y', interval = '1d') {
    return this.request(`/market/history/${symbol}`, {
      params: { period, interval }
    });
  }

  // Get company financials
  async getCompanyFinancials(symbol, statementType = 'income') {
    return this.request(`/company/${symbol}/financials`, {
      params: { type: statementType }
    });
  }

  // Get market indices
  async getMarketIndices() {
    return this.request('/market/indices');
  }

  // Analytics APIs

  // Portfolio analysis
  async analyzePortfolio(portfolio) {
    return this.request('/analytics/portfolio', {
      method: 'POST',
      body: JSON.stringify(portfolio)
    });
  }

  // Risk analysis
  async calculateRisk(portfolio, method = 'parametric') {
    return this.request('/analytics/risk', {
      method: 'POST',
      body: JSON.stringify({ portfolio, method })
    });
  }

  // Options pricing
  async priceOptions(optionParams) {
    return this.request('/analytics/options', {
      method: 'POST',
      body: JSON.stringify(optionParams)
    });
  }

  // Derivatives analysis
  async analyzeDerivatives(derivatives) {
    return this.request('/analytics/derivatives', {
      method: 'POST',
      body: JSON.stringify(derivatives)
    });
  }

  // AI/ML APIs

  // Generate financial insights
  async generateInsights(data, context) {
    return this.request('/ai/insights', {
      method: 'POST',
      body: JSON.stringify({ data, context })
    });
  }

  // Predict financial metrics
  async predictMetrics(data, horizon = 12) {
    return this.request('/ai/predict', {
      method: 'POST',
      body: JSON.stringify({ data, horizon })
    });
  }

  // Sentiment analysis
  async analyzeSentiment(text, source = 'news') {
    return this.request('/ai/sentiment', {
      method: 'POST',
      body: JSON.stringify({ text, source })
    });
  }

  // Webhook Management

  // Initialize webhook system
  initializeWebhooks() {
    this.webhookEndpoints = new Map();
    this.webhookSecrets = new Map();
  }

  // Register webhook endpoint
  registerWebhook(endpoint, events, secret) {
    const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.webhookEndpoints.set(webhookId, {
      endpoint,
      events,
      secret,
      createdAt: Date.now(),
      active: true
    });

    return webhookId;
  }

  // Unregister webhook
  unregisterWebhook(webhookId) {
    return this.webhookEndpoints.delete(webhookId);
  }

  // Trigger webhook for event
  async triggerWebhook(event, data) {
    const promises = [];

    for (const [webhookId, webhook] of this.webhookEndpoints) {
      if (webhook.active && webhook.events.includes(event)) {
        promises.push(this.sendWebhook(webhook, event, data));
      }
    }

    return Promise.allSettled(promises);
  }

  // Send webhook to endpoint
  async sendWebhook(webhook, event, data) {
    try {
      const payload = {
        event,
        timestamp: Date.now(),
        data
      };

      // Sign payload if secret provided
      if (webhook.secret) {
        const signature = await this.signPayload(payload, webhook.secret);
        const headers = {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-ID': `webhook_${Date.now()}`
        };
      }

      const response = await fetch(webhook.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FinanceAnalystPro-Webhook/1.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      return { success: true, webhookId: webhook.endpoint };
    } catch (error) {
      console.error('Webhook delivery failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Sign payload for webhook security
  async signPayload(payload, secret) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, data);
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  // Third-party Integrations

  // Initialize integration system
  initializeIntegrations() {
    this.supportedIntegrations = new Map([
      ['bloomberg', { name: 'Bloomberg Terminal', apiVersion: 'v3' }],
      ['refinitiv', { name: 'Refinitiv Eikon', apiVersion: 'v2' }],
      ['morningstar', { name: 'Morningstar Direct', apiVersion: 'v1' }],
      ['factset', { name: 'FactSet', apiVersion: 'v2' }],
      ['yahoofinance', { name: 'Yahoo Finance', apiVersion: 'v1' }],
      ['alphavantage', { name: 'Alpha Vantage', apiVersion: 'v1' }]
    ]);
  }

  // Connect to third-party service
  async connectIntegration(provider, credentials) {
    try {
      const integration = this.supportedIntegrations.get(provider);
      if (!integration) {
        throw new Error(`Unsupported integration: ${provider}`);
      }

      const response = await this.request(`/integrations/${provider}/connect`, {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      const connectionData = await response.json();

      this.integrations.set(provider, {
        connected: true,
        credentials: this.encryptCredentials(credentials),
        connectionData,
        connectedAt: Date.now()
      });

      return {
        success: true,
        provider,
        connectionData
      };
    } catch (error) {
      console.error('Integration connection failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Disconnect from third-party service
  async disconnectIntegration(provider) {
    try {
      await this.request(`/integrations/${provider}/disconnect`, {
        method: 'POST'
      });

      this.integrations.delete(provider);

      return { success: true, provider };
    } catch (error) {
      console.error('Integration disconnection failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get data from integrated service
  async getIntegratedData(provider, endpoint, params = {}) {
    const integration = this.integrations.get(provider);
    if (!integration || !integration.connected) {
      throw new Error(`Integration not connected: ${provider}`);
    }

    return this.request(`/integrations/${provider}/${endpoint}`, {
      params
    });
  }

  // Encrypt credentials for storage
  encryptCredentials(credentials) {
    // In production, use proper encryption
    // For demo purposes, returning as-is
    return credentials;
  }

  // Core HTTP Request Method

  // Make authenticated API request with rate limiting and error handling
  async request(endpoint, options = {}) {
    const { method = 'GET', headers = {}, body, params = {}, useCache = true } = options;

    // Build full URL
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });

    // Check cache for GET requests
    const cacheKey = `${method}_${url.toString()}`;
    if (method === 'GET' && useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    // Prepare headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...headers
    };

    // Add authorization header if token exists
    const token = this.getAccessToken();
    if (token && !this.isTokenExpired()) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Check rate limits (mock user ID for demo)
    const rateLimitCheck = this.checkRateLimit('demo_user', 'premium');
    if (!rateLimitCheck.allowed) {
      throw new Error(
        `Rate limit exceeded. Reset in ${Math.ceil(rateLimitCheck.resetIn / 1000)} seconds`
      );
    }

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined
      });

      // Handle authentication errors
      if (response.status === 401) {
        // Try to refresh token
        const refreshToken = localStorage.getItem('fap_refresh_token');
        if (refreshToken) {
          const refreshResult = await this.refreshToken(refreshToken);
          if (refreshResult.success) {
            // Retry the original request
            return this.request(endpoint, options);
          }
        }

        throw new Error('Authentication failed. Please log in again.');
      }

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed: ${response.status}`);
      }

      const data = await response.json();

      // Cache successful GET responses
      if (method === 'GET' && useCache) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });

        // Clean up old cache entries
        setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
      }

      // Trigger webhooks for relevant events
      if (method !== 'GET') {
        this.triggerWebhook('api_request', {
          endpoint,
          method,
          status: response.status,
          timestamp: Date.now()
        });
      }

      return data;
    } catch (error) {
      // Trigger error webhook
      this.triggerWebhook('api_error', {
        endpoint,
        method,
        error: error.message,
        timestamp: Date.now()
      });

      throw error;
    }
  }

  // Utility Methods

  // Get API status and health
  async getAPIStatus() {
    try {
      const response = await this.request('/health');
      return await response.json();
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: Date.now()
      };
    }
  }

  // Get API usage statistics
  async getAPIUsage() {
    return this.request('/usage/stats');
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Get registered webhooks
  getWebhooks() {
    return Array.from(this.webhookEndpoints.entries()).map(([id, webhook]) => ({
      id,
      ...webhook
    }));
  }

  // Get connected integrations
  getIntegrations() {
    return Array.from(this.integrations.entries()).map(([provider, integration]) => ({
      provider,
      ...integration
    }));
  }
}

// Create singleton instance
const apiService = new APIService();

// Export for use in components
export default apiService;

// Export class for testing
export { APIService };
