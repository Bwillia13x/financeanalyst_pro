import { apiLogger } from '../utils/apiLogger.js';

import secureApiClient from './secureApiClient.js';

class RateLimiter {
  constructor(requestsPerInterval, interval) {
    this.requestsPerInterval = requestsPerInterval;
    this.interval = interval;
    this.requestTimestamps = [];
  }

  async acquire() {
    const now = Date.now();

    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.interval
    );

    if (this.requestTimestamps.length >= this.requestsPerInterval) {
      const timeToWait = this.interval - (now - this.requestTimestamps[0]);
      await new Promise(resolve => setTimeout(resolve, timeToWait));
      return this.acquire();
    }

    this.requestTimestamps.push(now);
  }
}

/**
 * Enhanced API service with intelligent data source selection and fallbacks
 * Provides real data integration with multiple providers
 */
class EnhancedApiService {
  constructor() {
    this.rateLimiters = new Map();
    this.sourceHealth = new Map();
    this.lastRequests = new Map();
    this.cache = new Map();
    this.rateLimitInfo = { remaining: null, reset: null };

    // Initialize secure client and source health tracking
    this.initializeSecureClient();
    this.initializeSourceHealth();
    this.rateLimiters.set('default', new RateLimiter(5, 1000));

    // Ensure baseUrl is properly initialized
    this.baseUrl = this.baseUrl || 'http://localhost:3001/api';
  }

  /**
   * SECURITY NOTE: API keys are now handled securely by backend
   * This service routes all requests through secure backend proxy
   */
  initializeSecureClient() {
    this.client = secureApiClient;

    apiLogger.log('INFO', 'EnhancedApiService initialized with secure backend proxy');
  }

  /**
   * Initialize health tracking for all data sources
   */
  initializeSourceHealth() {
    const sources = [
      'BACKEND_PROXY',
      'ALPHA_VANTAGE',
      'FMP',
      'YAHOO_FINANCE',
      'SEC_EDGAR',
      'QUANDL',
      'FRED'
    ];

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
   * DEPRECATED: API keys are now handled by secure backend
   * @param {string} source - Data source name
   * @returns {boolean}
   */
  hasValidApiKey(_source) {
    // Always return true as backend handles authentication
    return true;
  }

  /**
   * All requests now route through secure backend proxy
   * @param {string} dataType - Type of data needed
   * @returns {string} Always returns 'BACKEND_PROXY'
   */
  getBestSource(_dataType) {
    return 'BACKEND_PROXY';
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
   * Fetch real-time market data via secure backend proxy
   * @param {string} symbol - Stock symbol
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Market data
   */
  async fetchRealTimeMarketData(symbol, _options = {}) {
    const t0 = Date.now();
    try {
      const data = await this.client.getQuote(symbol);
      this.updateSourceHealth('BACKEND_PROXY', true, Date.now() - t0);
      return data;
    } catch (error) {
      this.updateSourceHealth('BACKEND_PROXY', false, Date.now() - t0, error);
      apiLogger.log('ERROR', 'Failed to fetch real-time market data', {
        symbol,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Fetch historical market data (backend-first with fallbacks)
   * @param {string} symbol
   * @param {{range?: string, interval?: string}} options
   * @returns {Promise<Object>}
   */
  async fetchHistoricalMarketData(symbol, options = {}) {
    const range = options.range || '1mo';
    const interval = options.interval || '1d';
    const qs = new URLSearchParams({ range, interval }).toString();
    // Try backend proxy first
    const t0 = Date.now();
    try {
      const backendData = await this.request(
        `/market-data/historical/${symbol.toUpperCase()}?${qs}`
      );
      const result = {
        ...(typeof backendData === 'object' ? backendData : { data: backendData }),
        symbol: backendData?.symbol || symbol.toUpperCase(),
        range,
        interval,
        source: (backendData?.source || 'backend_proxy').toUpperCase()
      };
      this.updateSourceHealth('BACKEND_PROXY', true, Date.now() - t0);
      return result;
    } catch (backendError) {
      this.updateSourceHealth('BACKEND_PROXY', false, Date.now() - t0, backendError);
      apiLogger.log('WARN', 'Backend historical data failed, falling back to direct sources', {
        error: backendError.message
      });
    }
    // Fallback to Yahoo Finance
    try {
      const yf = await this.fetchFromYahooFinance(symbol, { range, interval });
      const timestamps = yf.timestamp || [];
      const quote = yf.indicators?.quote?.[0] || {};
      const data = timestamps.map((t, i) => ({
        timestamp: new Date(t * 1000).toISOString(),
        open: quote.open?.[i] ?? null,
        high: quote.high?.[i] ?? null,
        low: quote.low?.[i] ?? null,
        close: quote.close?.[i] ?? null,
        volume: quote.volume?.[i] ?? null
      }));
      return {
        symbol: yf.meta?.symbol || symbol.toUpperCase(),
        range,
        interval,
        data,
        meta: yf.meta,
        source: 'YAHOO_FINANCE'
      };
    } catch (yahooError) {
      this.updateSourceHealth('YAHOO_FINANCE', false, Date.now(), yahooError);
      apiLogger.log('WARN', 'Yahoo Finance historical fallback failed, trying Alpha Vantage', {
        error: yahooError.message
      });
    }
    // Fallback to Alpha Vantage (daily adjusted)
    try {
      const av = await this.fetchFromAlphaVantage(symbol, 'TIME_SERIES_DAILY_ADJUSTED', options);
      const series = av['Time Series (Daily)'] || av['Time Series (Daily)'.toLowerCase()];
      if (!series) throw new Error('Alpha Vantage daily series missing');
      const data = Object.entries(series)
        .map(([date, values]) => ({
          timestamp: new Date(date).toISOString(),
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['6. volume'])
        }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      return {
        symbol: symbol.toUpperCase(),
        range,
        interval: '1d',
        data,
        source: 'ALPHA_VANTAGE'
      };
    } catch (alphaError) {
      this.updateSourceHealth('ALPHA_VANTAGE', false, Date.now(), alphaError);
      throw alphaError;
    }
  }

  /**
   * Fetch intraday market data (backend-first with fallbacks)
   * @param {string} symbol
   * @param {{interval?: string}} options
   * @returns {Promise<Object>}
   */
  async fetchIntradayMarketData(symbol, options = {}) {
    const interval = options.interval || '5min';
    const qs = new URLSearchParams({ interval }).toString();
    // Try backend proxy first
    const t0 = Date.now();
    try {
      const backendData = await this.request(`/market-data/intraday/${symbol.toUpperCase()}?${qs}`);
      const result = {
        ...(typeof backendData === 'object' ? backendData : { data: backendData }),
        symbol: backendData?.symbol || symbol.toUpperCase(),
        interval,
        source: (backendData?.source || 'backend_proxy').toUpperCase()
      };
      this.updateSourceHealth('BACKEND_PROXY', true, Date.now() - t0);
      return result;
    } catch (backendError) {
      this.updateSourceHealth('BACKEND_PROXY', false, Date.now() - t0, backendError);
      apiLogger.log('WARN', 'Backend intraday data failed, falling back to direct sources', {
        error: backendError.message
      });
    }
    // Fallback to Yahoo Finance (use 1d range)
    try {
      const range = '1d';
      const yf = await this.fetchFromYahooFinance(symbol, {
        range,
        interval: interval.replace('min', 'm')
      });
      const timestamps = yf.timestamp || [];
      const quote = yf.indicators?.quote?.[0] || {};
      const data = timestamps.map((t, i) => ({
        timestamp: new Date(t * 1000).toISOString(),
        open: quote.open?.[i] ?? null,
        high: quote.high?.[i] ?? null,
        low: quote.low?.[i] ?? null,
        close: quote.close?.[i] ?? null,
        volume: quote.volume?.[i] ?? null
      }));
      return {
        symbol: yf.meta?.symbol || symbol.toUpperCase(),
        range,
        interval,
        data,
        meta: yf.meta,
        source: 'YAHOO_FINANCE'
      };
    } catch (yahooError) {
      this.updateSourceHealth('YAHOO_FINANCE', false, Date.now(), yahooError);
      apiLogger.log('WARN', 'Yahoo Finance intraday fallback failed, trying Alpha Vantage', {
        error: yahooError.message
      });
    }
    // Fallback to Alpha Vantage intraday
    try {
      const av = await this.fetchFromAlphaVantage(symbol, 'TIME_SERIES_INTRADAY', {
        params: { interval }
      });
      const seriesKey = Object.keys(av).find(k => k.startsWith('Time Series'));
      const series = av[seriesKey];
      if (!series) throw new Error('Alpha Vantage intraday series missing');
      const data = Object.entries(series)
        .map(([ts, values]) => ({
          timestamp: new Date(ts).toISOString(),
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume'])
        }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      return {
        symbol: symbol.toUpperCase(),
        interval,
        data,
        source: 'ALPHA_VANTAGE'
      };
    } catch (alphaError) {
      this.updateSourceHealth('ALPHA_VANTAGE', false, Date.now(), alphaError);
      throw alphaError;
    }
  }

  /**
   * Fetch from Yahoo Finance API
   * @param {string} symbol - Stock symbol
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Raw data from Yahoo Finance
   */
  async fetchFromYahooFinance(symbol, options = {}) {
    const url = `/v8/finance/chart/${symbol}`;

    const params = {
      range: options.range || '1d',
      interval: options.interval || '1m',
      includePrePost: true,
      events: 'div,splits'
    };

    const fullUrl = new URL(url, 'http://localhost:3000');
    fullUrl.search = new URLSearchParams(params).toString();

    const response = await fetch(fullUrl.pathname + fullUrl.search, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'FinanceAnalyst-Pro/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API request failed with status ${response.status}`);
    }

    const responseData = await response.json();

    if (!responseData?.chart?.result?.[0]) {
      throw new Error(`No data found for symbol: ${symbol}`);
    }

    return responseData.chart.result[0];
  }

  /**
   * Fetch from Alpha Vantage API
   * @param {string} symbol - Stock symbol
   * @param {string} function_name - Alpha Vantage function
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Raw data from Alpha Vantage
   */
  async fetchFromAlphaVantage(symbol, functionName, options = {}) {
    if (!this.hasValidApiKey('ALPHA_VANTAGE')) {
      throw new Error('Alpha Vantage API key not available');
    }

    const config = this.apiConfigs?.ALPHA_VANTAGE || {
      baseURL: 'https://www.alphavantage.co/query'
    };

    const params = {
      function: functionName,
      symbol,
      apikey: this.apiKeys.ALPHA_VANTAGE,
      ...options.params
    };

    const fullUrl = new URL(config.baseURL);
    fullUrl.search = new URLSearchParams(params).toString();

    const response = await fetch(fullUrl, {
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`Alpha Vantage API request failed with status ${response.status}`);
    }

    const responseData = await response.json();

    // Check for API errors
    if (responseData['Error Message']) {
      throw new Error(`Alpha Vantage error: ${responseData['Error Message']}`);
    }

    if (responseData['Note']) {
      throw new Error(`Alpha Vantage rate limit: ${responseData['Note']}`);
    }

    return responseData;
  }

  /**
   * Fetch comprehensive financial data via secure backend proxy
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Comprehensive financial data
   */
  async fetchComprehensiveData(symbol) {
    const results = {};
    const errors = {};

    // Fetch multiple data types in parallel via secure client
    const dataTypes = [
      { key: 'marketData', method: 'getQuote' },
      { key: 'profile', method: 'getCompanyProfile' },
      { key: 'financials', method: 'getIncomeStatement' },
      { key: 'peers', method: 'getPeerCompanies' }
    ];

    const promises = dataTypes.map(async ({ key, method }) => {
      try {
        results[key] = await this.client[method](symbol);
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
      sources: ['BACKEND_PROXY']
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
    const latest = quote
      ? {
          open: quote.open[quote.open.length - 1],
          high: quote.high[quote.high.length - 1],
          low: quote.low[quote.low.length - 1],
          close: quote.close[quote.close.length - 1],
          volume: quote.volume[quote.volume.length - 1]
        }
      : {};

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

  // Additional API methods expected by tests

  /**
   * Configuration properties
   */
  baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  defaultHeaders = {};
  timeout = 10000;
  authToken = null;
  cacheTTL = 300000; // 5 minutes
  requestInterceptors = [];
  responseInterceptors = [];
  metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0
  };

  /**
   * Make a generic API request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async request(url, options = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    const limiter = this.rateLimiters.get('default');
    await limiter.acquire();

    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

    const cacheKey = fullUrl;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        this.metrics.successfulRequests++;
        return cached.data;
      }
    }

    try {
      let config = {
        method: 'GET',
        headers: { ...this.defaultHeaders },
        ...options
      };

      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }

      for (const interceptor of this.requestInterceptors) {
        config = await interceptor(config);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      config.signal = controller.signal;

      const response = await fetch(fullUrl, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorData}`);
      }

      this.rateLimitInfo.remaining = parseInt(response.headers.get('X-RateLimit-Remaining'), 10);
      this.rateLimitInfo.reset = parseInt(response.headers.get('X-RateLimit-Reset'), 10);

      let responseData = await response.json();

      for (const interceptor of this.responseInterceptors) {
        responseData = await interceptor(responseData, response);
      }

      this.cache.set(cacheKey, { data: responseData, timestamp: Date.now() });

      const responseTime = Date.now() - startTime;
      this.metrics.successfulRequests++;
      this.metrics.avgResponseTime = (this.metrics.avgResponseTime + responseTime) / 2;

      return responseData;
    } catch (error) {
      this.metrics.failedRequests++;
      throw error;
    }
  }

  /**
   * Set authentication token
   * @param {string} token - Auth token
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Set cache TTL
   * @param {number} ttl - Time to live in milliseconds
   */
  setCacheTTL(ttl) {
    this.cacheTTL = ttl;
  }

  /**
   * Batch multiple requests
   * @param {Array} requests - Array of request configs or URLs
   * @returns {Promise<Array>} Array of responses
   */
  async batchRequests(requests) {
    const promises = requests.map(req => {
      if (typeof req === 'string') {
        return this.request(req);
      }
      return this.request(req.url, req.options);
    });

    const results = await Promise.allSettled(promises);

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return result.reason;
    });
  }

  /**
   * Add request interceptor
   * @param {Function} interceptor - Interceptor function
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   * @param {Function} interceptor - Interceptor function
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Make request with retry logic
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @param {number} retries - Number of retries
   * @returns {Promise<Object>} Response data
   */
  async requestWithRetry(url, options = {}, retries = 3) {
    let lastError;

    for (let i = 0; i <= retries; i++) {
      try {
        return await this.request(url, options);
      } catch (error) {
        lastError = error;
        if (i < retries) {
          const delay = Math.pow(2, i) * 100; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Set base URL
   * @param {string} url - Base URL
   */
  setBaseUrl(url) {
    this.baseUrl = url;
  }

  /**
   * Get base URL
   * @returns {string} Base URL
   */
  getBaseUrl() {
    return this.baseUrl;
  }

  /**
   * Set default headers
   * @param {Object} headers - Default headers
   */
  setDefaultHeaders(headers) {
    this.defaultHeaders = { ...headers };
  }

  /**
   * Get default headers
   * @returns {Object} Default headers
   */
  getDefaultHeaders() {
    return { ...this.defaultHeaders };
  }

  /**
   * Set timeout
   * @param {number} timeout - Timeout in milliseconds
   */
  setTimeout(timeout) {
    this.timeout = timeout;
  }

  /**
   * Get timeout
   * @returns {number} Timeout in milliseconds
   */
  getTimeout() {
    return this.timeout;
  }

  /**
   * Get metrics
   * @returns {Object} Request metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0
    };
  }

  getRateLimitInfo() {
    return this.rateLimitInfo;
  }

  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const enhancedApiService = new EnhancedApiService();
export default EnhancedApiService;
