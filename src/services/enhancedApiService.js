import axios from 'axios';

import { apiLogger } from '../utils/apiLogger.js';

import { API_CONFIG, DATA_SOURCE_PRIORITY } from './apiConfig.js';
import { dataFetchingService } from './dataFetching.js';

/**
 * Enhanced API service with intelligent data source selection and fallbacks
 * Provides real data integration with multiple providers
 */
class EnhancedApiService {
  constructor() {
    this.rateLimiters = new Map();
    this.sourceHealth = new Map();
    this.lastRequests = new Map();
    this.apiKeys = this.loadApiKeys();
    this.cache = new Map();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0
    };
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.authToken = null;
    this.baseUrl = 'https://api.example.com';
    this.defaultHeaders = {};
    this.timeout = 10000;
    this.rateLimitInfo = {
      remaining: 100,
      reset: Date.now() + 3600000
    };

    // Initialize source health tracking
    this.initializeSourceHealth();
  }

  /**
   * Load and validate API keys from environment
   */
  loadApiKeys() {
    const keys = {
      ALPHA_VANTAGE: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY,
      FMP: import.meta.env.VITE_FMP_API_KEY,
      QUANDL: import.meta.env.VITE_QUANDL_API_KEY,
      FRED: import.meta.env.VITE_FRED_API_KEY
    };

    // Log available keys (without exposing actual values)
    const availableKeys = Object.entries(keys)
      .filter(([_, value]) => value && value !== 'demo')
      .map(([key, _]) => key);

    apiLogger.log('INFO', 'API keys loaded', {
      availableKeys,
      totalKeys: availableKeys.length
    });

    return keys;
  }

  /**
   * Initialize health tracking for all data sources
   */
  initializeSourceHealth() {
    const sources = ['ALPHA_VANTAGE', 'FMP', 'YAHOO_FINANCE', 'SEC_EDGAR', 'QUANDL', 'FRED'];

    sources.forEach(source => {
      this.sourceHealth.set(source, {
        status: 'unknown',
        successRate: 1.0,
        avgResponseTime: 0,
        lastError: null,
        requestCount: 0,
        errorCount: 0,
        lastHealthCheck: null
      });
    });
  }

  /**
   * Check if we have valid API key for a source
   * @param {string} source - Data source name
   * @returns {boolean}
   */
  hasValidApiKey(source) {
    const key = this.apiKeys[source];
    return key && key !== 'demo' && key.length > 5;
  }

  /**
   * Get the best available data source for a data type
   * @param {string} dataType - Type of data needed
   * @returns {string} Best available source
   */
  getBestSource(dataType) {
    const priorityList = DATA_SOURCE_PRIORITY[dataType] || [];

    for (const source of priorityList) {
      const health = this.sourceHealth.get(source);

      // Check if source is healthy and has valid API key (if required)
      if (health && health.status !== 'error') {
        if (this.requiresApiKey(source)) {
          if (this.hasValidApiKey(source)) {
            return source;
          }
        } else {
          return source;
        }
      }
    }

    // Fallback to first available source
    return priorityList[0] || 'YAHOO_FINANCE';
  }

  /**
   * Check if source requires API key
   * @param {string} source - Data source name
   * @returns {boolean}
   */
  requiresApiKey(source) {
    return ['ALPHA_VANTAGE', 'FMP', 'QUANDL', 'FRED'].includes(source);
  }

  /**
   * Fetch real-time market data with intelligent source selection
   * @param {string} symbol - Stock symbol
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Market data
   */
  async fetchRealTimeMarketData(symbol, options = {}) {
    const source = this.getBestSource('marketData');

    try {
      let data;

      switch (source) {
        case 'YAHOO_FINANCE':
          data = await this.fetchFromYahooFinance(symbol, options);
          break;
        case 'ALPHA_VANTAGE':
          data = await this.fetchFromAlphaVantage(symbol, 'GLOBAL_QUOTE', options);
          break;
        default:
          throw new Error(`Unsupported source for market data: ${source}`);
      }

      this.updateSourceHealth(source, true, Date.now());
      return this.normalizeMarketData(data, source);

    } catch (error) {
      this.updateSourceHealth(source, false, Date.now(), error);

      // Try fallback source
      const fallbackSources = DATA_SOURCE_PRIORITY.marketData.filter(s => s !== source);
      if (fallbackSources.length > 0) {
        apiLogger.log('WARN', `Primary source ${source} failed, trying fallback`, { error: error.message });
        return this.fetchRealTimeMarketData(symbol, { ...options, excludeSource: source });
      }

      throw error;
    }
  }

  /**
   * Fetch from Yahoo Finance API
   * @param {string} symbol - Stock symbol
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Raw data from Yahoo Finance
   */
  async fetchFromYahooFinance(symbol, options = {}) {
    const config = API_CONFIG.YAHOO_FINANCE;
    const url = `${config.baseURL}/${symbol}`;

    const params = {
      range: options.range || '1d',
      interval: options.interval || '1m',
      includePrePost: true,
      events: 'div,splits'
    };

    const response = await axios.get(url, {
      params,
      timeout: 10000,
      headers: {
        'User-Agent': 'FinanceAnalyst-Pro/1.0'
      }
    });

    if (!response.data?.chart?.result?.[0]) {
      throw new Error(`No data found for symbol: ${symbol}`);
    }

    return response.data.chart.result[0];
  }

  /**
   * Fetch from Alpha Vantage API
   * @param {string} symbol - Stock symbol
   * @param {string} function_name - Alpha Vantage function
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Raw data from Alpha Vantage
   */
  // eslint-disable-next-line camelcase
  async fetchFromAlphaVantage(symbol, function_name, options = {}) {
    if (!this.hasValidApiKey('ALPHA_VANTAGE')) {
      throw new Error('Alpha Vantage API key not available');
    }

    const config = API_CONFIG.ALPHA_VANTAGE;

    const params = {
      // eslint-disable-next-line camelcase
      function: function_name,
      symbol,
      apikey: this.apiKeys.ALPHA_VANTAGE,
      ...options.params
    };

    const response = await axios.get(config.baseURL, {
      params,
      timeout: 15000
    });

    // Check for API errors
    if (response.data['Error Message']) {
      throw new Error(`Alpha Vantage error: ${response.data['Error Message']}`);
    }

    if (response.data['Note']) {
      throw new Error(`Alpha Vantage rate limit: ${response.data['Note']}`);
    }

    return response.data;
  }

  /**
   * Fetch comprehensive financial data
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Comprehensive financial data
   */
  async fetchComprehensiveData(symbol) {
    const results = {};
    const errors = {};

    // Fetch multiple data types in parallel
    const dataTypes = [
      { key: 'marketData', method: 'fetchRealTimeMarketData' },
      { key: 'profile', method: 'fetchCompanyProfile' },
      { key: 'financials', method: 'fetchFinancialStatements' },
      { key: 'peers', method: 'fetchPeerComparison' }
    ];

    const promises = dataTypes.map(async({ key, method }) => {
      try {
        if (method === 'fetchFinancialStatements') {
          results[key] = await dataFetchingService[method](symbol, 'income-statement');
        } else if (method === 'fetchPeerComparison') {
          results[key] = await dataFetchingService[method](symbol);
        } else {
          results[key] = await this[method](symbol);
        }
      } catch (error) {
        errors[key] = error.message;
        apiLogger.log('ERROR', `Failed to fetch ${key} for ${symbol}`, { error: error.message });
      }
    });

    await Promise.allSettled(promises);

    return {
      symbol,
      timestamp: new Date().toISOString(),
      data: results,
      errors: Object.keys(errors).length > 0 ? errors : null,
      sources: this.getSourcesUsed(results)
    };
  }

  /**
   * Normalize market data from different sources
   * @param {Object} rawData - Raw data from API
   * @param {string} source - Data source
   * @returns {Object} Normalized market data
   */
  normalizeMarketData(rawData, source) {
    switch (source) {
      case 'YAHOO_FINANCE':
        return this.normalizeYahooData(rawData);
      case 'ALPHA_VANTAGE':
        return this.normalizeAlphaVantageData(rawData);
      default:
        return rawData;
    }
  }

  /**
   * Normalize Yahoo Finance data
   * @param {Object} data - Raw Yahoo Finance data
   * @returns {Object} Normalized data
   */
  normalizeYahooData(data) {
    const meta = data.meta;
    const quote = data.indicators?.quote?.[0];
    const latest = quote ? {
      open: quote.open[quote.open.length - 1],
      high: quote.high[quote.high.length - 1],
      low: quote.low[quote.low.length - 1],
      close: quote.close[quote.close.length - 1],
      volume: quote.volume[quote.volume.length - 1]
    } : {};

    return {
      symbol: meta.symbol,
      currentPrice: meta.regularMarketPrice || latest.close,
      previousClose: meta.previousClose,
      change: meta.regularMarketPrice - meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      dayHigh: meta.regularMarketDayHigh || latest.high,
      dayLow: meta.regularMarketDayLow || latest.low,
      volume: meta.regularMarketVolume || latest.volume,
      marketCap: meta.marketCap,
      currency: meta.currency,
      exchangeName: meta.exchangeName,
      timestamp: new Date(meta.regularMarketTime * 1000).toISOString(),
      source: 'YAHOO_FINANCE'
    };
  }

  /**
   * Normalize Alpha Vantage data
   * @param {Object} data - Raw Alpha Vantage data
   * @returns {Object} Normalized data
   */
  normalizeAlphaVantageData(data) {
    const globalQuote = data['Global Quote'];
    if (!globalQuote) {
      throw new Error('Invalid Alpha Vantage response format');
    }

    return {
      symbol: globalQuote['01. symbol'],
      currentPrice: parseFloat(globalQuote['05. price']),
      previousClose: parseFloat(globalQuote['08. previous close']),
      change: parseFloat(globalQuote['09. change']),
      changePercent: parseFloat(globalQuote['10. change percent'].replace('%', '')),
      dayHigh: parseFloat(globalQuote['03. high']),
      dayLow: parseFloat(globalQuote['04. low']),
      volume: parseInt(globalQuote['06. volume']),
      timestamp: globalQuote['07. latest trading day'],
      source: 'ALPHA_VANTAGE'
    };
  }

  /**
   * Update source health metrics
   * @param {string} source - Data source
   * @param {boolean} success - Whether request was successful
   * @param {number} responseTime - Response time in ms
   * @param {Error} error - Error object if failed
   */
  updateSourceHealth(source, success, responseTime, error = null) {
    const health = this.sourceHealth.get(source);
    if (!health) return;

    health.requestCount++;
    if (!success) {
      health.errorCount++;
      health.lastError = error?.message || 'Unknown error';
      health.status = 'error';
    } else {
      health.status = 'healthy';
      health.lastError = null;
    }

    health.successRate = (health.requestCount - health.errorCount) / health.requestCount;
    health.avgResponseTime = (health.avgResponseTime + responseTime) / 2;
    health.lastHealthCheck = new Date().toISOString();

    this.sourceHealth.set(source, health);
  }

  /**
   * Get health status for all sources
   * @returns {Object} Health status map
   */
  getSourceHealthStatus() {
    const status = {};
    for (const [source, health] of this.sourceHealth.entries()) {
      status[source] = {
        ...health,
        hasValidApiKey: this.hasValidApiKey(source),
        requiresApiKey: this.requiresApiKey(source)
      };
    }
    return status;
  }

  /**
   * Get sources used in a data fetch result
   * @param {Object} results - Fetch results
   * @returns {Array} List of sources used
   */
  getSourcesUsed(results) {
    const sources = new Set();
    Object.values(results).forEach(data => {
      if (data?.source) {
        sources.add(data.source);
      }
    });
    return Array.from(sources);
  }

  // Cache management
  clearCache() {
    // Implementation for cache clearing
    this.cache = new Map();
  }

  // Metrics management
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0
    };
  }

  // Basic request method
  async request(endpoint, options = {}) {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getDefaultHeaders(),
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    if (this.authToken) {
      config.headers.Authorization = `Bearer ${this.authToken}`;
    }

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      Object.assign(config, interceptor(config));
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      let data = await response.json();

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        data = interceptor(data);
      }

      this.updateMetrics(true, Date.now() - startTime);
      return data;
    } catch (error) {
      this.updateMetrics(false, Date.now() - startTime);
      throw error;
    }
  }

  // Auth token management
  setAuthToken(token) {
    this.authToken = token;
  }

  // Interceptors
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  // Retry mechanism
  async requestWithRetry(endpoint, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.request(endpoint, options);
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
    
    throw lastError;
  }

  // Configuration methods
  setBaseUrl(url) {
    this.baseUrl = url;
  }

  getBaseUrl() {
    return this.baseUrl || 'https://api.example.com';
  }

  setDefaultHeaders(headers) {
    this.defaultHeaders = headers;
  }

  getDefaultHeaders() {
    return this.defaultHeaders || {};
  }

  setTimeout(timeout) {
    this.timeout = timeout;
  }

  getTimeout() {
    return this.timeout || 10000;
  }

  // Metrics
  getMetrics() {
    return this.metrics || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0
    };
  }

  updateMetrics(success, responseTime) {
    if (!this.metrics) {
      this.metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0
      };
    }

    this.metrics.totalRequests++;
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime + responseTime) / 2;
  }

  // Rate limiting
  getRateLimitInfo() {
    return this.rateLimitInfo || {
      remaining: 100,
      reset: Date.now() + 3600000
    };
  }

  // Batch requests
  async batchRequests(endpoints) {
    const promises = endpoints.map(endpoint => 
      this.request(endpoint).catch(error => error)
    );
    
    return Promise.all(promises);
  }
}

// Export singleton instance
export const enhancedApiService = new EnhancedApiService();
export default EnhancedApiService;
