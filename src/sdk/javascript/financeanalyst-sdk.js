/**
 * FinanceAnalyst Pro JavaScript SDK
 * Official JavaScript/TypeScript client library for FinanceAnalyst Pro API v1
 */

const EventEmitter = require('events');

const axios = require('axios');

const SDK_VERSION = '1.0.0';
const DEFAULT_BASE_URL = 'https://api.financeanalyst.pro/v1';
const DEFAULT_TIMEOUT = 30000;

/**
 * Custom error classes
 */
class APIError extends Error {
  constructor(message, statusCode = null, response = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

class RateLimitError extends APIError {
  constructor(message, statusCode, response) {
    super(message, statusCode, response);
    this.name = 'RateLimitError';
  }
}

class AuthenticationError extends APIError {
  constructor(message, statusCode, response) {
    super(message, statusCode, response);
    this.name = 'AuthenticationError';
  }
}

class ValidationError extends APIError {
  constructor(message, statusCode, response) {
    super(message, statusCode, response);
    this.name = 'ValidationError';
  }
}

/**
 * Main client class
 */
class FinanceAnalystClient extends EventEmitter {
  constructor(options = {}) {
    super();

    this.apiKey = options.apiKey || process.env.FINANCEANALYST_API_KEY;
    this.baseURL = options.baseURL || DEFAULT_BASE_URL;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;

    if (!this.apiKey) {
      throw new Error(
        'API key is required. Set it via constructor options or FINANCEANALYST_API_KEY environment variable.'
      );
    }

    // Configure axios instance
    this.http = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': `financeanalyst-js-sdk/${SDK_VERSION}`
      }
    });

    // Setup interceptors
    this.setupInterceptors();

    // Initialize service modules
    this.companies = new CompanyDataService(this);
    this.analytics = new SpecializedAnalyticsService(this);
    this.ai = new AIAnalyticsService(this);
    this.collaboration = new CollaborationService(this);
    this.visualization = new VisualizationService(this);
    this.webhooks = new WebhookService(this);
  }

  setupInterceptors() {
    // Request interceptor
    this.http.interceptors.request.use(
      config => {
        this.emit('request:start', { method: config.method, url: config.url });
        return config;
      },
      error => {
        this.emit('request:error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.http.interceptors.response.use(
      response => {
        this.emit('request:success', {
          method: response.config.method,
          url: response.config.url,
          status: response.status,
          data: response.data
        });
        return response;
      },
      error => {
        this.handleResponseError(error);
        return Promise.reject(error);
      }
    );
  }

  handleResponseError(error) {
    const { response } = error;

    this.emit('request:error', {
      method: error.config?.method,
      url: error.config?.url,
      status: response?.status,
      error: response?.data
    });

    if (response) {
      switch (response.status) {
        case 429:
          throw new RateLimitError('Rate limit exceeded', response.status, response.data);
        case 401:
          throw new AuthenticationError('Authentication failed', response.status, response.data);
        case 400:
          throw new ValidationError('Request validation failed', response.status, response.data);
        default:
          throw new APIError(
            response.data?.error?.message || 'API request failed',
            response.status,
            response.data
          );
      }
    } else {
      throw new APIError(`Network error: ${error.message}`);
    }
  }

  // Core HTTP methods
  async get(endpoint, params = {}) {
    const response = await this.http.get(endpoint, { params });
    return this.formatResponse(response);
  }

  async post(endpoint, data = {}) {
    const response = await this.http.post(endpoint, data);
    return this.formatResponse(response);
  }

  async put(endpoint, data = {}) {
    const response = await this.http.put(endpoint, data);
    return this.formatResponse(response);
  }

  async delete(endpoint) {
    const response = await this.http.delete(endpoint);
    return this.formatResponse(response);
  }

  formatResponse(response) {
    return {
      success: response.data.success || true,
      data: response.data.data || response.data,
      metadata: response.data.metadata || {},
      requestId: response.headers['x-request-id']
    };
  }

  // Convenience methods
  async getAnalysis(analysisId) {
    return await this.get(`analysis/${analysisId}/results`);
  }

  async calculateDCF(companyId, assumptions, scenarios = ['base']) {
    return await this.post('models/dcf/calculate', {
      company_id: companyId,
      assumptions,
      scenarios
    });
  }

  async getBenchmarks(sector, metrics = null) {
    const params = {};
    if (metrics && Array.isArray(metrics)) {
      params.metrics = metrics.join(',');
    }

    return await this.get(`benchmarks/industry/${sector}`, params);
  }
}

/**
 * Company Data Service
 */
class CompanyDataService {
  constructor(client) {
    this.client = client;
  }

  async getFinancials(companyId, options = {}) {
    const { period = 'annual', years = 5 } = options;

    return await this.client.get(`companies/${companyId}/financials`, {
      period,
      years
    });
  }

  async getMarketData(symbols, period = '1y') {
    const symbolsStr = Array.isArray(symbols) ? symbols.join(',') : symbols;

    return await this.client.get('markets/indices', {
      symbols: symbolsStr,
      period
    });
  }
}

/**
 * Specialized Analytics Service
 */
class SpecializedAnalyticsService {
  constructor(client) {
    this.client = client;
  }

  async analyzeBankingPortfolio(portfolioData, analysisType = 'risk_assessment') {
    return await this.client.post('analytics/specialized/banking/credit-portfolio', {
      portfolio_data: portfolioData,
      analysis_type: analysisType
    });
  }

  async analyzeRealEstate(propertyData, methods = ['dcf', 'cap_rate', 'comparable_sales']) {
    return await this.client.post('analytics/specialized/real-estate/property-valuation', {
      property_data: propertyData,
      valuation_methods: methods
    });
  }

  async analyzeDrugPipeline(
    pipelineData,
    scope = ['valuation', 'clinical_trials', 'regulatory_risk']
  ) {
    return await this.client.post('analytics/specialized/healthcare/drug-pipeline', {
      pipeline_data: pipelineData,
      analysis_scope: scope
    });
  }

  async analyzeEnergyReserves(assetData, methods = ['pv10', 'pv15', 'risked_value']) {
    return await this.client.post('analytics/specialized/energy/reserves-valuation', {
      asset_data: assetData,
      valuation_methods: methods
    });
  }

  async analyzeSaaSMetrics(
    saasData,
    categories = ['revenue', 'customer', 'unit_economics', 'cohort']
  ) {
    return await this.client.post('analytics/specialized/technology/saas-metrics', {
      saas_data: saasData,
      metric_categories: categories
    });
  }
}

/**
 * AI Analytics Service
 */
class AIAnalyticsService {
  constructor(client) {
    this.client = client;
  }

  async forecastRevenue(companyData, options = {}) {
    const { horizon = 12, modelPreferences = null } = options;

    return await this.client.post('ai/predictions/revenue', {
      company_data: companyData,
      forecast_horizon: horizon,
      model_preferences: modelPreferences
    });
  }

  async analyzeDocument(document, analysisTypes = ['sentiment', 'entities', 'metrics', 'summary']) {
    return await this.client.post('ai/nlp/analyze-document', {
      document,
      analysis_types: analysisTypes
    });
  }

  async recognizeChart(imageData, extractData = true) {
    return await this.client.post('ai/computer-vision/recognize-chart', {
      image_data: imageData,
      extract_data: extractData
    });
  }
}

/**
 * Collaboration Service
 */
class CollaborationService {
  constructor(client) {
    this.client = client;
  }

  async getWorkspaceUsers(workspaceId) {
    const response = await this.client.get(`workspaces/${workspaceId}/users`);
    return response.data.users;
  }

  async createComment(analysisId, content, parentId = null) {
    return await this.client.post('comments', {
      analysis_id: analysisId,
      content,
      parent_id: parentId
    });
  }

  async getVersionHistory(analysisId, limit = 20) {
    const response = await this.client.get(`versions/${analysisId}/history`, { limit });
    return response.data.versions;
  }

  async sendNotification(recipients, message, type = 'info', analysisId = null) {
    return await this.client.post('notifications/send', {
      recipients,
      message,
      type,
      analysis_id: analysisId
    });
  }
}

/**
 * Visualization Service
 */
class VisualizationService {
  constructor(client) {
    this.client = client;
  }

  async createChart(data, chartType, configuration = {}) {
    return await this.client.post('visualizations/create', {
      data,
      chart_type: chartType,
      configuration
    });
  }

  async exportAnalysis(analysisId, format, template = null) {
    return await this.client.post('export', {
      analysis_id: analysisId,
      format,
      template
    });
  }
}

/**
 * Webhook Service
 */
class WebhookService {
  constructor(client) {
    this.client = client;
  }

  async register(url, events, options = {}) {
    return await this.client.post('webhooks', {
      url,
      events,
      ...options
    });
  }

  async list(activeOnly = true) {
    const params = activeOnly ? { active: true } : {};
    const response = await this.client.get('webhooks', params);
    return response.data.webhooks;
  }

  async delete(webhookId) {
    return await this.client.delete(`webhooks/${webhookId}`);
  }

  async test(webhookId, eventType = 'webhook.test') {
    return await this.client.post(`webhooks/${webhookId}/test`, {
      event_type: eventType
    });
  }
}

/**
 * Utility functions and helpers
 */
class FinanceAnalystUtils {
  static formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount);
  }

  static formatPercentage(value, decimals = 2) {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  static calculateGrowthRate(oldValue, newValue) {
    return (newValue - oldValue) / oldValue;
  }

  static calculateCAGR(beginningValue, endingValue, periods) {
    return Math.pow(endingValue / beginningValue, 1 / periods) - 1;
  }

  static presentValue(futureValue, rate, periods) {
    return futureValue / Math.pow(1 + rate, periods);
  }

  static futureValue(presentValue, rate, periods) {
    return presentValue * Math.pow(1 + rate, periods);
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Rate limiting helper
 */
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async checkLimit() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      await FinanceAnalystUtils.sleep(waitTime);
    }

    this.requests.push(now);
  }
}

/**
 * Configuration loader
 */
class ConfigLoader {
  static load(configPath = null) {
    if (typeof window !== 'undefined') {
      // Browser environment
      return {
        apiKey: localStorage.getItem('financeanalyst_api_key'),
        baseURL: localStorage.getItem('financeanalyst_base_url') || DEFAULT_BASE_URL
      };
    } else {
      // Node.js environment
      const fs = require('fs');
      const path = require('path');
      const os = require('os');

      const defaultConfigPath = path.join(os.homedir(), '.financeanalyst', 'config.json');
      const actualConfigPath = configPath || defaultConfigPath;

      try {
        if (fs.existsSync(actualConfigPath)) {
          const configData = fs.readFileSync(actualConfigPath, 'utf8');
          return JSON.parse(configData);
        }
      } catch (error) {
        console.warn('Failed to load config file:', error.message);
      }

      return {
        apiKey: process.env.FINANCEANALYST_API_KEY,
        baseURL: process.env.FINANCEANALYST_BASE_URL || DEFAULT_BASE_URL
      };
    }
  }
}

/**
 * Factory function to create client
 */
function createClient(options = {}) {
  const config = ConfigLoader.load(options.configPath);
  const clientOptions = {
    ...config,
    ...options
  };

  return new FinanceAnalystClient(clientOptions);
}

/**
 * Promise-based batch operations
 */
class BatchOperations {
  constructor(client, concurrency = 5) {
    this.client = client;
    this.concurrency = concurrency;
  }

  async batchAnalyze(operations) {
    const results = [];
    const batches = this.createBatches(operations, this.concurrency);

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(batch.map(op => this.executeOperation(op)));
      results.push(...batchResults);
    }

    return results;
  }

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  async executeOperation(operation) {
    const { method, endpoint, data } = operation;

    switch (method.toLowerCase()) {
      case 'get':
        return await this.client.get(endpoint, data);
      case 'post':
        return await this.client.post(endpoint, data);
      case 'put':
        return await this.client.put(endpoint, data);
      case 'delete':
        return await this.client.delete(endpoint);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS
  module.exports = {
    FinanceAnalystClient,
    CompanyDataService,
    SpecializedAnalyticsService,
    AIAnalyticsService,
    CollaborationService,
    VisualizationService,
    WebhookService,
    FinanceAnalystUtils,
    RateLimiter,
    ConfigLoader,
    BatchOperations,
    createClient,
    APIError,
    RateLimitError,
    AuthenticationError,
    ValidationError
  };
} else if (
  typeof window !== 'undefined' &&
  typeof window.define === 'function' &&
  window.define.amd
) {
  // AMD
  window.define([], () => {
    return {
      FinanceAnalystClient,
      createClient,
      FinanceAnalystUtils
    };
  });
} else {
  // Browser global
  window.FinanceAnalyst = {
    Client: FinanceAnalystClient,
    createClient,
    Utils: FinanceAnalystUtils
  };
}
