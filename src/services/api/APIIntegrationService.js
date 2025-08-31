/**
 * API Integration Service
 * Manages connections to multiple financial data providers
 * Handles authentication, rate limiting, and data normalization
 */

class APIIntegrationService {
  constructor(options = {}) {
    this.options = {
      maxConcurrentRequests: 10,
      requestTimeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      cacheTimeout: 300000, // 5 minutes
      ...options
    };

    this.providers = new Map();
    this.requestQueue = [];
    this.activeRequests = new Set();
    this.cache = new Map();
    this.rateLimiters = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the API integration service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize all supported providers
      await this.initializeProviders();

      // Start request processing
      this.startRequestProcessor();

      this.isInitialized = true;
      console.log('API Integration Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize API Integration Service:', error);
      throw error;
    }
  }

  /**
   * Initialize data providers
   */
  async initializeProviders() {
    const providerConfigs = [
      {
        name: 'alphavantage',
        baseUrl: 'https://www.alphavantage.co/query',
        requiresApiKey: true,
        rateLimit: { requests: 5, period: 60000 }, // 5 requests per minute
        endpoints: {
          quote: 'GLOBAL_QUOTE',
          historical: 'TIME_SERIES_DAILY',
          intraday: 'TIME_SERIES_INTRADAY',
          technical: 'SMA',
          forex: 'CURRENCY_EXCHANGE_RATE',
          crypto: 'CURRENCY_EXCHANGE_RATE'
        }
      },
      {
        name: 'fmp',
        baseUrl: 'https://financialmodelingprep.com/api/v3',
        requiresApiKey: true,
        rateLimit: { requests: 250, period: 60000 }, // 250 requests per minute
        endpoints: {
          quote: 'quote',
          historical: 'historical-price-full',
          intraday: 'historical-chart',
          financials: 'financials',
          ratios: 'ratios',
          profile: 'profile'
        }
      },
      {
        name: 'yahoo',
        baseUrl: 'https://query1.finance.yahoo.com/v7/finance',
        requiresApiKey: false,
        rateLimit: { requests: 100, period: 60000 }, // 100 requests per minute
        endpoints: {
          quote: 'quote',
          historical: 'download',
          options: 'options'
        }
      },
      {
        name: 'polygon',
        baseUrl: 'https://api.polygon.io/v2',
        requiresApiKey: true,
        rateLimit: { requests: 5, period: 60000 }, // 5 requests per minute (free tier)
        endpoints: {
          quote: 'aggs/ticker',
          trades: 'trades',
          quotes: 'quotes',
          snapshot: 'snapshot'
        }
      },
      {
        name: 'twelve-data',
        baseUrl: 'https://api.twelvedata.com',
        requiresApiKey: true,
        rateLimit: { requests: 800, period: 60000 }, // 800 requests per minute
        endpoints: {
          quote: 'quote',
          historical: 'time_series',
          technical: 'technical_indicator',
          forex: 'exchange_rate'
        }
      },
      {
        name: 'news-api',
        baseUrl: 'https://newsapi.org/v2',
        requiresApiKey: true,
        rateLimit: { requests: 100, period: 86400000 }, // 100 requests per day
        endpoints: {
          everything: 'everything',
          topHeadlines: 'top-headlines'
        }
      },
      {
        name: 'fred',
        baseUrl: 'https://api.stlouisfed.org/fred',
        requiresApiKey: true,
        rateLimit: { requests: 120, period: 60000 }, // 120 requests per minute
        endpoints: {
          series: 'series',
          observations: 'series/observations'
        }
      }
    ];

    for (const config of providerConfigs) {
      this.providers.set(config.name, {
        ...config,
        status: 'initialized',
        apiKey: this.getApiKey(config.name),
        rateLimiter: this.createRateLimiter(config.rateLimit)
      });
    }
  }

  /**
   * Get API key for provider
   */
  getApiKey(providerName) {
    // In production, this would retrieve from secure storage
    const apiKeys = {
      alphavantage: process.env.VITE_ALPHAVANTAGE_API_KEY,
      fmp: process.env.VITE_FMP_API_KEY,
      polygon: process.env.VITE_POLYGON_API_KEY,
      'twelve-data': process.env.VITE_TWELVE_DATA_API_KEY,
      'news-api': process.env.VITE_NEWS_API_KEY,
      fred: process.env.VITE_FRED_API_KEY
    };

    return apiKeys[providerName];
  }

  /**
   * Create rate limiter for provider
   */
  createRateLimiter({ requests, period }) {
    return {
      requests,
      period,
      requestsMade: [],
      canMakeRequest: function () {
        const now = Date.now();
        // Remove expired requests
        this.requestsMade = this.requestsMade.filter(time => now - time < this.period);

        return this.requestsMade.length < this.requests;
      },
      recordRequest: function () {
        this.requestsMade.push(Date.now());
      }
    };
  }

  /**
   * Start request processor
   */
  startRequestProcessor() {
    setInterval(() => {
      this.processRequestQueue();
    }, 100); // Process every 100ms
  }

  /**
   * Process queued requests
   */
  async processRequestQueue() {
    if (this.activeRequests.size >= this.options.maxConcurrentRequests) {
      return; // Max concurrent requests reached
    }

    const pendingRequests = this.requestQueue.filter(
      req => req.status === 'pending' && !this.activeRequests.has(req.id)
    );

    for (const request of pendingRequests) {
      if (this.activeRequests.size >= this.options.maxConcurrentRequests) {
        break;
      }

      this.processRequest(request);
    }
  }

  /**
   * Process individual request
   */
  async processRequest(request) {
    const { id, provider, endpoint, params, resolve, reject } = request;

    this.activeRequests.add(id);
    request.status = 'processing';

    try {
      const result = await this.makeRequest(provider, endpoint, params);
      request.status = 'completed';
      resolve(result);
    } catch (error) {
      request.status = 'failed';
      reject(error);
    } finally {
      this.activeRequests.delete(id);
    }
  }

  /**
   * Make API request to provider
   */
  async makeRequest(providerName, endpoint, params = {}) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    // Check rate limit
    if (!provider.rateLimiter.canMakeRequest()) {
      throw new Error(`Rate limit exceeded for ${providerName}`);
    }

    // Build URL
    const url = this.buildRequestUrl(provider, endpoint, params);

    // Make request with retry logic
    let lastError;
    for (let attempt = 0; attempt <= this.options.retryAttempts; attempt++) {
      try {
        const response = await this.makeHttpRequest(url, {
          timeout: this.options.requestTimeout,
          headers: {
            'User-Agent': 'FinanceAnalyst-Pro/1.0',
            Accept: 'application/json'
          }
        });

        // Record successful request
        provider.rateLimiter.recordRequest();

        return this.normalizeResponse(providerName, endpoint, response);
      } catch (error) {
        lastError = error;

        if (attempt < this.options.retryAttempts) {
          // Exponential backoff
          const delay = this.options.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Build request URL
   */
  buildRequestUrl(provider, endpoint, params) {
    let url = `${provider.baseUrl}/${endpoint}`;

    // Add query parameters
    const queryParams = new URLSearchParams();

    // Add API key if required
    if (provider.requiresApiKey && provider.apiKey) {
      queryParams.set('apikey', provider.apiKey);
    }

    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.set(key, String(value));
      }
    });

    // Special handling for different providers
    switch (provider.name) {
      case 'alphavantage':
        queryParams.set('function', provider.endpoints[endpoint] || endpoint);
        queryParams.set('symbol', params.symbol || '');
        break;

      case 'yahoo':
        if (endpoint === 'download') {
          url = `https://query1.finance.yahoo.com/v7/finance/download/${params.symbol}`;
        }
        break;

      case 'polygon':
        if (endpoint.includes('aggs')) {
          url = `${provider.baseUrl}/aggs/ticker/${params.symbol}/range/${params.multiplier || 1}/${params.timespan || 'day'}/${params.from}/${params.to}`;
        }
        break;
    }

    const queryString = queryParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  /**
   * Make HTTP request
   */
  async makeHttpRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  /**
   * Normalize API response
   */
  normalizeResponse(providerName, endpoint, response) {
    const normalizers = {
      alphavantage: this.normalizeAlphaVantageResponse.bind(this),
      fmp: this.normalizeFMPResponse.bind(this),
      yahoo: this.normalizeYahooResponse.bind(this),
      polygon: this.normalizePolygonResponse.bind(this),
      'twelve-data': this.normalizeTwelveDataResponse.bind(this),
      'news-api': this.normalizeNewsAPIResponse.bind(this),
      fred: this.normalizeFREDResponse.bind(this)
    };

    const normalizer = normalizers[providerName];
    return normalizer ? normalizer(endpoint, response) : response;
  }

  /**
   * Normalize Alpha Vantage response
   */
  normalizeAlphaVantageResponse(endpoint, response) {
    if (endpoint === 'quote' && response['Global Quote']) {
      const quote = response['Global Quote'];
      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        lastTradingDay: quote['07. latest trading day'],
        source: 'alphavantage'
      };
    }

    return response;
  }

  /**
   * Normalize FMP response
   */
  normalizeFMPResponse(endpoint, response) {
    if (endpoint === 'quote' && Array.isArray(response) && response.length > 0) {
      const quote = response[0];
      return {
        symbol: quote.symbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changesPercentage,
        volume: quote.volume,
        marketCap: quote.marketCap,
        pe: quote.pe,
        eps: quote.eps,
        source: 'fmp'
      };
    }

    return response;
  }

  /**
   * Normalize Yahoo response
   */
  normalizeYahooResponse(endpoint, response) {
    if (endpoint === 'quote' && response.quoteResponse?.result?.[0]) {
      const quote = response.quoteResponse.result[0];
      return {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        marketCap: quote.marketCap,
        pe: quote.trailingPE,
        eps: quote.epsTrailingTwelveMonths,
        source: 'yahoo'
      };
    }

    return response;
  }

  /**
   * Normalize Polygon response
   */
  normalizePolygonResponse(endpoint, response) {
    if (endpoint.includes('aggs') && response.results) {
      return response.results.map(bar => ({
        timestamp: new Date(bar.t),
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v,
        source: 'polygon'
      }));
    }

    return response;
  }

  /**
   * Normalize Twelve Data response
   */
  normalizeTwelveDataResponse(endpoint, response) {
    if (endpoint === 'quote' && response.values?.[0]) {
      const quote = response.values[0];
      return {
        symbol: response.meta?.symbol,
        price: parseFloat(quote.close),
        change: parseFloat(quote.close) - parseFloat(quote.open),
        changePercent:
          ((parseFloat(quote.close) - parseFloat(quote.open)) / parseFloat(quote.open)) * 100,
        volume: parseInt(quote.volume),
        timestamp: new Date(quote.datetime),
        source: 'twelve-data'
      };
    }

    return response;
  }

  /**
   * Normalize News API response
   */
  normalizeNewsAPIResponse(endpoint, response) {
    if (response.articles) {
      return response.articles.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source?.name,
        publishedAt: new Date(article.publishedAt),
        sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
        provider: 'news-api'
      }));
    }

    return response;
  }

  /**
   * Normalize FRED response
   */
  normalizeFREDResponse(endpoint, response) {
    if (endpoint === 'observations' && response.observations) {
      return response.observations.map(obs => ({
        date: obs.date,
        value: parseFloat(obs.value),
        indicator: response.series?.[0]?.id,
        source: 'fred'
      }));
    }

    return response;
  }

  /**
   * Simple sentiment analysis
   */
  analyzeSentiment(text) {
    const positiveWords = [
      'gain',
      'rise',
      'increase',
      'bull',
      'bullish',
      'up',
      'higher',
      'strong',
      'positive'
    ];
    const negativeWords = [
      'loss',
      'fall',
      'decrease',
      'bear',
      'bearish',
      'down',
      'lower',
      'weak',
      'negative'
    ];

    const lowerText = text.toLowerCase();
    const positiveScore = positiveWords.reduce(
      (score, word) => score + (lowerText.includes(word) ? 1 : 0),
      0
    );
    const negativeScore = negativeWords.reduce(
      (score, word) => score + (lowerText.includes(word) ? 1 : 0),
      0
    );

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  /**
   * Get stock quote
   */
  async getQuote(symbol, options = {}) {
    const { provider = 'fmp', fallback = true } = options;

    try {
      return await this.request(provider, 'quote', { symbol });
    } catch (error) {
      if (fallback && provider !== 'yahoo') {
        console.warn(`Failed to get quote from ${provider}, trying Yahoo...`);
        return await this.request('yahoo', 'quote', { symbols: symbol });
      }
      throw error;
    }
  }

  /**
   * Get historical data
   */
  async getHistoricalData(symbol, options = {}) {
    const { provider = 'fmp', period = '5y', interval = '1day', from, to } = options;

    const params = { symbol, period, interval, from, to };

    try {
      return await this.request(provider, 'historical', params);
    } catch (error) {
      // Try fallback providers
      const fallbacks = ['yahoo', 'alphavantage', 'polygon'];
      for (const fallbackProvider of fallbacks) {
        if (fallbackProvider !== provider) {
          try {
            return await this.request(fallbackProvider, 'historical', params);
          } catch (fallbackError) {
            console.warn(
              `Failed to get historical data from ${fallbackProvider}:`,
              fallbackError.message
            );
          }
        }
      }
      throw error;
    }
  }

  /**
   * Get news data
   */
  async getNews(options = {}) {
    const { query = 'finance', provider = 'news-api' } = options;

    return await this.request(provider, 'everything', {
      q: query,
      sortBy: 'publishedAt',
      language: 'en'
    });
  }

  /**
   * Get economic indicators
   */
  async getEconomicData(indicator, options = {}) {
    const { provider = 'fred' } = options;

    return await this.request(provider, 'observations', {
      series_id: indicator,
      limit: 100
    });
  }

  /**
   * Make queued request
   */
  async request(provider, endpoint, params = {}) {
    return new Promise((resolve, reject) => {
      const request = {
        id: `${Date.now()}_${Math.random()}`,
        provider,
        endpoint,
        params,
        resolve,
        reject,
        status: 'pending',
        created: new Date()
      };

      this.requestQueue.push(request);

      // Timeout handling
      setTimeout(() => {
        if (request.status === 'pending') {
          request.status = 'timeout';
          reject(new Error(`Request timeout for ${provider}/${endpoint}`));
        }
      }, this.options.requestTimeout);
    });
  }

  /**
   * Get service status
   */
  getStatus() {
    const providerStatus = {};
    for (const [name, provider] of this.providers.entries()) {
      providerStatus[name] = {
        status: provider.status,
        hasApiKey: !!provider.apiKey,
        rateLimitRemaining: provider.rateLimiter.requests - provider.rateLimiter.requestsMade.length
      };
    }

    return {
      initialized: this.isInitialized,
      providers: providerStatus,
      queueSize: this.requestQueue.length,
      activeRequests: this.activeRequests.size,
      cacheSize: this.cache.size
    };
  }

  /**
   * Shutdown the service
   */
  async shutdown() {
    console.log('Shutting down API Integration Service...');

    // Cancel all pending requests
    this.requestQueue.forEach(request => {
      if (request.status === 'pending') {
        request.reject(new Error('Service shutdown'));
      }
    });

    this.requestQueue = [];
    this.activeRequests.clear();
    this.cache.clear();

    this.isInitialized = false;

    console.log('API Integration Service shutdown complete');
  }
}

// Export singleton instance
export const apiIntegrationService = new APIIntegrationService({
  maxConcurrentRequests: 10,
  requestTimeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  cacheTimeout: 300000
});

export default APIIntegrationService;
