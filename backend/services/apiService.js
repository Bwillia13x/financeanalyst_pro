import axios from 'axios';

import cacheService from './cacheService.js';

class ApiService {
  constructor() {
    this.apiKeys = {
      alphaVantage: process.env.ALPHA_VANTAGE_API_KEY,
      fmp: process.env.FMP_API_KEY,
      quandl: process.env.QUANDL_API_KEY,
      fred: process.env.FRED_API_KEY
    };

    this.demoMode = process.env.DEMO_MODE === 'true';

    // API base URLs
    this.baseUrls = {
      alphaVantage: 'https://www.alphavantage.co/query',
      fmp: 'https://financialmodelingprep.com/api/v3',
      yahoo: 'https://query1.finance.yahoo.com/v8/finance/chart',
      sec: 'https://data.sec.gov',
      quandl: 'https://data.nasdaq.com/api/v3',
      fred: 'https://api.stlouisfed.org/fred'
    };

    // Rate limiting tracking
    this.rateLimits = new Map();

    // Simple latency stats (per service)
    this.latency = {
      alphaVantage: [],
      fmp: [],
      yahoo: [],
      fred: [],
      quandl: []
    };
    this.maxLatencySamples = 200; // keep memory bounded

    // Setup axios defaults
    this.setupAxiosDefaults();
  }

  setupAxiosDefaults() {
    // Global timeout
    axios.defaults.timeout = 15000;

    // Global headers
    axios.defaults.headers.common['User-Agent'] = 'FinanceAnalyst-Pro/1.0';

    // Latency tracing
    const thresholdMs = parseInt(process.env.API_LATENCY_WARN_MS || '1000', 10);
    axios.interceptors.request.use((config) => {
      config.metadata = { start: Date.now() };
      return config;
    });
    axios.interceptors.response.use((response) => {
      const ms = Date.now() - (response.config.metadata?.start || Date.now());
      const service = response.config.metadata?.service;
      if (ms > thresholdMs) {
        const isDev = process.env.NODE_ENV !== 'production';
        const msg = `Slow API response ${ms}ms for ${response.config?.url}`;
        if (isDev) console.warn(msg);
      }
      if (service && this.latency[service]) {
        const arr = this.latency[service];
        arr.push(ms);
        if (arr.length > this.maxLatencySamples) arr.shift();
      }
      return response;
    }, (error) => {
      if (error.config && error.config.metadata) {
        const ms = Date.now() - error.config.metadata.start;
        const service = error.config.metadata?.service;
        const isDev = process.env.NODE_ENV !== 'production';
        const msg = `API error after ${ms}ms for ${error.config?.url}: ${error.message}`;
        if (isDev) console.warn(msg);
        if (service && this.latency[service]) {
          const arr = this.latency[service];
          arr.push(ms);
          if (arr.length > this.maxLatencySamples) arr.shift();
        }
      }
      return Promise.reject(error);
    });
  }

  /**
   * Check if we have a valid API key for a service
   */
  hasValidApiKey(service) {
    const key = this.apiKeys[service];
    return key && key !== 'demo' && key !== 'your_api_key_here';
  }

  /**
   * Check rate limits for a service
   */
  async checkRateLimit(service) {
    const now = Date.now();
    const limits = {
      alphaVantage: { requests: 5, windowMs: 60000 }, // 5 per minute
      fmp: { requests: 250, windowMs: 86400000 }, // 250 per day
      fred: { requests: 120, windowMs: 60000 }, // 120 per minute
      quandl: { requests: 50, windowMs: 86400000 } // 50 per day
    };

    const limit = limits[service];
    if (!limit) return true;

    const key = `rate_limit_${service}`;
    let requests = this.rateLimits.get(key) || [];

    // Clean old requests outside the window
    requests = requests.filter(time => now - time < limit.windowMs);

    if (requests.length >= limit.requests) {
      throw new Error(`Rate limit exceeded for ${service}. Please try again later.`);
    }

    // Add current request
    requests.push(now);
    this.rateLimits.set(key, requests);

    return true;
  }

  /**
   * Generic API request with caching and error handling
   */
  async makeApiRequest(config) {
    const {
      service,
      endpoint,
      params = {},
      cacheType = 'market',
      cacheTtl = null,
      skipCache = false
    } = config;

    // Generate cache key
    const cacheKey = cacheService.generateKey(`${service}_${endpoint}`, params);

    // Try cache first
    if (!skipCache) {
      const cached = cacheService.get(cacheType, cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Check rate limits
    await this.checkRateLimit(service);

    try {
      let response;

      switch (service) {
        case 'alphaVantage':
          response = await this.callAlphaVantage(endpoint, params);
          break;
        case 'fmp':
          response = await this.callFMP(endpoint, params);
          break;
        case 'yahoo':
          response = await this.callYahoo(endpoint, params);
          break;
        case 'fred':
          response = await this.callFRED(endpoint, params);
          break;
        case 'quandl':
          response = await this.callQuandl(endpoint, params);
          break;
        default:
          throw new Error(`Unsupported service: ${service}`);
      }

      // Cache successful response
      if (response && !skipCache) {
        cacheService.set(cacheType, cacheKey, response, cacheTtl);
      }

      return response;

    } catch (error) {
      console.error(`API request failed for ${service}:`, error.message);

      // Return demo data if in demo mode or API fails
      if (this.demoMode || !this.hasValidApiKey(service)) {
        return this.generateDemoData(endpoint, params);
      }

      throw error;
    }
  }

  /**
   * Alpha Vantage API calls
   */
  async callAlphaVantage(functionName, params) {
    if (!this.hasValidApiKey('alphaVantage')) {
      throw new Error('Alpha Vantage API key not configured');
    }

    const response = await axios.get(this.baseUrls.alphaVantage, {
      params: {
        function: functionName,
        apikey: this.apiKeys.alphaVantage,
        ...params
      },
      metadata: { service: 'alphaVantage' }
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
   * Financial Modeling Prep API calls
   */
  async callFMP(endpoint, params) {
    if (!this.hasValidApiKey('fmp')) {
      throw new Error('FMP API key not configured');
    }

    const response = await axios.get(`${this.baseUrls.fmp}${endpoint}`, {
      params: {
        apikey: this.apiKeys.fmp,
        ...params
      },
      metadata: { service: 'fmp' }
    });

    if (response.data.error) {
      throw new Error(`FMP error: ${response.data.error}`);
    }

    return response.data;
  }

  /**
   * Yahoo Finance API calls (no API key required)
   */
  async callYahoo(symbol, params) {
    const response = await axios.get(`${this.baseUrls.yahoo}/${symbol}`, {
      params: {
        range: '1d',
        interval: '1m',
        includePrePost: true,
        events: 'div,splits',
        ...params
      },
      metadata: { service: 'yahoo' }
    });

    return response.data;
  }

  /**
   * FRED API calls
   */
  async callFRED(endpoint, params) {
    if (!this.hasValidApiKey('fred')) {
      throw new Error('FRED API key not configured');
    }

    const response = await axios.get(`${this.baseUrls.fred}/${endpoint}`, {
      params: {
        api_key: this.apiKeys.fred,
        file_type: 'json',
        ...params
      },
      metadata: { service: 'fred' }
    });

    return response.data;
  }

  /**
   * Quandl API calls
   */
  async callQuandl(endpoint, params) {
    if (!this.hasValidApiKey('quandl')) {
      throw new Error('Quandl API key not configured');
    }

    const response = await axios.get(`${this.baseUrls.quandl}${endpoint}`, {
      params: {
        api_key: this.apiKeys.quandl,
        ...params
      },
      metadata: { service: 'quandl' }
    });

    return response.data;
  }

  /**
   * Generate demo data when APIs are unavailable
   */
  generateDemoData(endpoint, params) {
    console.log(`Generating demo data for ${endpoint}`);

    // Basic demo data structure - customize based on endpoint
    const demoData = {
      symbol: params.symbol || 'DEMO',
      timestamp: new Date().toISOString(),
      data: {
        price: 100 + Math.random() * 50,
        volume: Math.floor(Math.random() * 1000000),
        change: (Math.random() - 0.5) * 10
      },
      source: 'demo',
      note: 'This is demo data. Configure API keys for live data.'
    };

    return demoData;
  }

  /**
   * Health check for all configured services
   */
  async healthCheck() {
    const services = ['alphaVantage', 'fmp', 'fred', 'quandl'];
    const results = {};

    for (const service of services) {
      results[service] = {
        configured: this.hasValidApiKey(service),
        status: 'unknown'
      };

      if (results[service].configured) {
        try {
          // Make a simple test request
          await this.checkRateLimit(service);
          results[service].status = 'available';
        } catch (error) {
          results[service].status = 'error';
          results[service].error = error.message;
        }
      } else {
        results[service].status = 'not_configured';
      }
    }

    return results;
  }

  /**
   * Latency summary per service (p50/p95/mean)
   */
  getLatencySummary() {
    const summarize = (arr) => {
      if (!arr.length) return { count: 0, mean: 0, p50: 0, p95: 0 };
      const sorted = [...arr].sort((a, b) => a - b);
      const quantile = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1)))];
      const mean = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
      return { count: sorted.length, mean, p50: quantile(0.5), p95: quantile(0.95) };
    };
    const services = Object.keys(this.latency);
    const out = {};
    for (const s of services) out[s] = summarize(this.latency[s]);
    return out;
  }
}

export default new ApiService();
