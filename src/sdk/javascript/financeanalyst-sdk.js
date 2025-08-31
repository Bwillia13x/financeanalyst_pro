/**
 * FinanceAnalyst Pro JavaScript SDK
 *
 * A comprehensive JavaScript SDK for the FinanceAnalyst Pro platform,
 * providing easy access to financial data, analytics, and AI capabilities.
 *
 * Usage:
 *   const { FinanceAnalystAPI } = require('financeanalyst-sdk');
 *   const api = new FinanceAnalystAPI({ apiKey: 'your_api_key' });
 *   api.getStockQuote('AAPL').then(quote => console.log(quote));
 */

const axios = require('axios');

/**
 * API Configuration
 */
class APIConfig {
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'https://api.financeanalystpro.com/v1';
    this.apiKey = options.apiKey || null;
    this.clientId = options.clientId || null;
    this.clientSecret = options.clientSecret || null;
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
  }
}

/**
 * Main FinanceAnalyst Pro API Client
 */
class FinanceAnalystAPI {
  /**
   * Initialize the API client
   * @param {APIConfig|Object} config - API configuration
   */
  constructor(config = {}) {
    this.config = config instanceof APIConfig ? config : new APIConfig(config);
    this.tokens = null;

    // Create axios instance
    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'User-Agent': 'FinanceAnalystPro-JS-SDK/1.0',
        'Content-Type': 'application/json'
      }
    });

    // Set API key if provided
    if (this.config.apiKey) {
      this.client.defaults.headers.common['X-API-Key'] = this.config.apiKey;
    }

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors
   */
  setupInterceptors() {
    // Request interceptor for authentication
    this.client.interceptors.request.use(config => {
      if (this.tokens && this.tokens.accessToken) {
        config.headers.Authorization = `Bearer ${this.tokens.accessToken}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401 && this.tokens) {
          try {
            await this.refreshToken();
            return this.client(error.config);
          } catch (refreshError) {
            throw refreshError;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticate user
   * @param {string} username
   * @param {string} password
   */
  async authenticate(username, password) {
    const response = await this.client.post('/auth/token', {
      grant_type: 'password',
      username,
      password,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    });

    this.tokens = response.data;
    return this.tokens;
  }

  /**
   * Refresh access token
   */
  async refreshToken() {
    const response = await this.client.post('/auth/token', {
      grant_type: 'refresh_token',
      refresh_token: this.tokens.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    });

    this.tokens = response.data;
    return this.tokens;
  }

  // Market Data Methods

  /**
   * Get stock quote
   * @param {string} symbol
   */
  async getStockQuote(symbol) {
    const response = await this.client.get(`/market/quote/${symbol}`);
    return response.data;
  }

  /**
   * Get historical data
   * @param {string} symbol
   * @param {string} period
   * @param {string} interval
   */
  async getHistoricalData(symbol, period = '1y', interval = '1d') {
    const response = await this.client.get(`/market/history/${symbol}`, {
      params: { period, interval }
    });
    return response.data;
  }

  /**
   * Get company info
   * @param {string} symbol
   */
  async getCompanyInfo(symbol) {
    const response = await this.client.get(`/company/${symbol}/info`);
    return response.data;
  }

  // Analytics Methods

  /**
   * Analyze portfolio
   * @param {Object} portfolio
   */
  async analyzePortfolio(portfolio) {
    const response = await this.client.post('/analytics/portfolio', portfolio);
    return response.data;
  }

  /**
   * Calculate risk
   * @param {Object} portfolio
   * @param {string} method
   * @param {number} confidenceLevel
   */
  async calculateRisk(portfolio, method = 'parametric', confidenceLevel = 0.95) {
    const response = await this.client.post('/analytics/risk', {
      portfolio,
      method,
      confidence_level: confidenceLevel
    });
    return response.data;
  }

  /**
   * Price options
   * @param {Object} optionParams
   */
  async priceOptions(optionParams) {
    const response = await this.client.post('/analytics/options', optionParams);
    return response.data;
  }

  // AI/ML Methods

  /**
   * Generate insights
   * @param {Object} data
   * @param {Object} context
   */
  async generateInsights(data, context = null) {
    const payload = { data };
    if (context) payload.context = context;

    const response = await this.client.post('/ai/insights', payload);
    return response.data;
  }

  /**
   * Predict metrics
   * @param {Object} data
   * @param {number} horizon
   * @param {string} model
   */
  async predictMetrics(data, horizon = 12, model = 'auto') {
    const response = await this.client.post('/ai/predict', {
      data,
      horizon,
      model
    });
    return response.data;
  }

  // Utility Methods

  /**
   * Get API status
   */
  async getAPIStatus() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Create portfolio helper
   * @param {Array} assets
   */
  createPortfolio(assets) {
    return {
      assets,
      created_at: new Date().toISOString(),
      source: 'sdk'
    };
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js
  module.exports = { FinanceAnalystAPI, APIConfig };
} else if (typeof window !== 'undefined') {
  // Browser
  window.FinanceAnalystAPI = FinanceAnalystAPI;
  window.APIConfig = APIConfig;
}

// Example usage
if (typeof module !== 'undefined' && require.main === module) {
  // Demo when run directly
  const api = new FinanceAnalystAPI({ apiKey: 'demo_key' });

  api
    .getAPIStatus()
    .then(status => {
      console.log('API Status:', status);
    })
    .catch(error => {
      console.log('Demo - API not available:', error.message);
    });
}
