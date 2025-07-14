import axios from 'axios';

import { apiKeyValidator } from '../utils/apiKeyValidator.js';
import { apiLogger } from '../utils/apiLogger.js';

// Data source configurations - Updated for Vite environment variables
const DATA_SOURCES = {
  ALPHA_VANTAGE: {
    baseURL: 'https://www.alphavantage.co/query',
    apiKey: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo'
  },
  FMP: {
    baseURL: 'https://financialmodelingprep.com/api/v3',
    apiKey: import.meta.env.VITE_FMP_API_KEY || 'demo'
  },
  SEC_EDGAR: {
    baseURL: 'https://data.sec.gov',
    headers: {
      'User-Agent': 'FinanceAnalyst-Pro (contact@financeanalyst.com)'
    }
  },
  YAHOO_FINANCE: {
    baseURL: 'https://query1.finance.yahoo.com/v8/finance/chart',
    fallbackURL: 'https://query2.finance.yahoo.com/v8/finance/chart'
  }
};

// Rate limiting configuration
const RATE_LIMITS = {
  ALPHA_VANTAGE: { requests: 5, period: 60000 }, // 5 requests per minute
  FMP: { requests: 250, period: 86400000 }, // 250 requests per day
  SEC_EDGAR: { requests: 10, period: 1000 } // 10 requests per second
};

// Advanced retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second base delay
  maxDelay: 30000, // 30 seconds max delay
  exponentialBase: 2,
  jitterFactor: 0.1, // 10% jitter
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT']
};

/**
 * Circuit breaker configuration
 */
const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5, // Number of failures before opening circuit
  recoveryTimeout: 30000, // 30 seconds before attempting to close circuit
  monitoringPeriod: 60000, // 1 minute monitoring window
  halfOpenMaxCalls: 3 // Max calls to test in half-open state
};

/**
 * Circuit breaker states
 */
const CIRCUIT_STATES = {
  CLOSED: 'CLOSED', // Normal operation
  OPEN: 'OPEN', // Circuit is open, failing fast
  HALF_OPEN: 'HALF_OPEN' // Testing if service has recovered
};

/**
 * Circuit breaker implementation to prevent cascading failures
 */
class CircuitBreaker {
  constructor(name, config = CIRCUIT_BREAKER_CONFIG) {
    this.name = name;
    this.config = { ...CIRCUIT_BREAKER_CONFIG, ...config };
    this.state = CIRCUIT_STATES.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.halfOpenCallCount = 0;
    this.successCount = 0;
    this.totalCalls = 0;
  }

  /**
   * Check if circuit breaker allows the call
   * @returns {boolean} Whether the call is allowed
   */
  canExecute() {
    const now = Date.now();

    switch (this.state) {
      case CIRCUIT_STATES.CLOSED:
        return true;

      case CIRCUIT_STATES.OPEN:
        // Check if recovery timeout has passed
        if (now - this.lastFailureTime >= this.config.recoveryTimeout) {
          this.state = CIRCUIT_STATES.HALF_OPEN;
          this.halfOpenCallCount = 0;
          console.log(`🔄 Circuit breaker ${this.name} transitioning to HALF_OPEN`);
          return true;
        }
        return false;

      case CIRCUIT_STATES.HALF_OPEN:
        return this.halfOpenCallCount < this.config.halfOpenMaxCalls;

      default:
        return false;
    }
  }

  /**
   * Record a successful call
   */
  recordSuccess() {
    this.successCount++;
    this.totalCalls++;

    switch (this.state) {
      case CIRCUIT_STATES.HALF_OPEN:
        this.halfOpenCallCount++;
        // If we've successfully completed enough calls in half-open, close the circuit
        if (this.halfOpenCallCount >= this.config.halfOpenMaxCalls) {
          this.state = CIRCUIT_STATES.CLOSED;
          this.failureCount = 0;
          this.halfOpenCallCount = 0;
          console.log(`✅ Circuit breaker ${this.name} closed - service recovered`);
        }
        break;

      case CIRCUIT_STATES.CLOSED:
        // Reset failure count on success
        this.failureCount = 0;
        break;
    }
  }

  /**
   * Record a failed call
   */
  recordFailure() {
    this.failureCount++;
    this.totalCalls++;
    this.lastFailureTime = Date.now();

    switch (this.state) {
      case CIRCUIT_STATES.CLOSED:
        if (this.failureCount >= this.config.failureThreshold) {
          this.state = CIRCUIT_STATES.OPEN;
          console.warn(
            `🚨 Circuit breaker ${this.name} opened - too many failures (${this.failureCount})`
          );
        }
        break;

      case CIRCUIT_STATES.HALF_OPEN:
        // Any failure in half-open state reopens the circuit
        this.state = CIRCUIT_STATES.OPEN;
        this.halfOpenCallCount = 0;
        console.warn(`🚨 Circuit breaker ${this.name} reopened - failure during recovery test`);
        break;
    }
  }

  /**
   * Get circuit breaker status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalCalls: this.totalCalls,
      failureRate: this.totalCalls > 0 ? this.failureCount / this.totalCalls : 0,
      lastFailureTime: this.lastFailureTime,
      isOpen: this.state === CIRCUIT_STATES.OPEN,
      nextRetryTime:
        this.state === CIRCUIT_STATES.OPEN
          ? this.lastFailureTime + this.config.recoveryTimeout
          : null
    };
  }

  /**
   * Execute function with circuit breaker protection
   * @param {Function} fn - Function to execute
   * @returns {Promise} Result of the function
   */
  async execute(fn) {
    if (!this.canExecute()) {
      const error = new Error(`Circuit breaker ${this.name} is OPEN - failing fast`);
      error.circuitBreakerOpen = true;
      throw error;
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
}

/**
 * Advanced retry utility with exponential backoff and jitter
 */
class RetryManager {
  constructor(config = RETRY_CONFIG) {
    this.config = { ...RETRY_CONFIG, ...config };
  }

  /**
   * Calculate delay with exponential backoff and jitter
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {number} Delay in milliseconds
   */
  calculateDelay(attempt) {
    const exponentialDelay = this.config.baseDelay * Math.pow(this.config.exponentialBase, attempt);
    const jitter = exponentialDelay * this.config.jitterFactor * Math.random();
    const delay = exponentialDelay + jitter;
    return Math.min(delay, this.config.maxDelay);
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error is retryable
   */
  isRetryableError(error) {
    // Check for network errors
    if (error.code && this.config.retryableErrors.includes(error.code)) {
      return true;
    }

    // Check for HTTP status codes
    if (
      error.response?.status &&
      this.config.retryableStatusCodes.includes(error.response.status)
    ) {
      return true;
    }

    // Check for timeout errors
    if (error.message?.includes('timeout')) {
      return true;
    }

    return false;
  }

  /**
   * Execute function with retry logic
   * @param {Function} fn - Async function to execute
   * @param {string} operation - Operation name for logging
   * @returns {Promise} Result of the function
   */
  async executeWithRetry(fn, operation = 'API call') {
    let lastError;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await fn();

        // Log successful retry if this wasn't the first attempt
        if (attempt > 0) {
          console.log(`✅ ${operation} succeeded on attempt ${attempt + 1}`);
        }

        return result;
      } catch (error) {
        lastError = error;

        // Don't retry on the last attempt
        if (attempt === this.config.maxRetries) {
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          console.warn(`❌ ${operation} failed with non-retryable error:`, error.message);
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        console.warn(
          `⚠️ ${operation} failed (attempt ${attempt + 1}/${this.config.maxRetries + 1}), retrying in ${delay}ms:`,
          error.message
        );

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retries exhausted
    console.error(
      `❌ ${operation} failed after ${this.config.maxRetries + 1} attempts:`,
      lastError.message
    );
    throw lastError;
  }
}

class DataFetchingService {
  constructor(
    env = import.meta.env,
    customRateLimits = null,
    retryConfig = null,
    circuitBreakerConfig = null
  ) {
    this.rateLimiters = {};
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.env = env;
    this.customRateLimits = customRateLimits;
    this.demoMode = this.isDemoMode(env);
    this.retryManager = new RetryManager(retryConfig);
    this.circuitBreakers = this.initializeCircuitBreakers(circuitBreakerConfig);
    this.logger = apiLogger;
    this.initializeRateLimiters();

    // Log service initialization
    this.logger.log('INFO', '🚀 DataFetchingService initialized', {
      demoMode: this.demoMode,
      environment: env.VITE_APP_ENV || 'development'
    });
  }

  isDemoMode(env = import.meta.env) {
    // Check if we're forcing demo mode
    if (env.VITE_FORCE_DEMO_MODE === 'true') {
      return true;
    }

    // Check if we're using demo API keys
    const hasValidKeys =
      (env.VITE_ALPHA_VANTAGE_API_KEY && env.VITE_ALPHA_VANTAGE_API_KEY !== 'demo') ||
      (env.VITE_FMP_API_KEY && env.VITE_FMP_API_KEY !== 'demo');
    return !hasValidKeys;
  }

  initializeCircuitBreakers(config) {
    const circuitBreakers = {};
    const sources = ['ALPHA_VANTAGE', 'FMP', 'SEC_EDGAR', 'YAHOO_FINANCE'];

    sources.forEach(source => {
      circuitBreakers[source] = new CircuitBreaker(source, config);
    });

    return circuitBreakers;
  }

  initializeRateLimiters() {
    const rateLimits = this.customRateLimits || RATE_LIMITS;
    Object.keys(rateLimits).forEach(source => {
      this.rateLimiters[source] = {
        requests: [],
        limit: rateLimits[source].requests,
        period: rateLimits[source].period
      };
    });
  }

  async checkRateLimit(source) {
    const limiter = this.rateLimiters[source];
    if (!limiter) return true;

    const now = Date.now();
    limiter.requests = limiter.requests.filter(time => now - time < limiter.period);

    if (limiter.requests.length >= limiter.limit) {
      const oldestRequest = Math.min(...limiter.requests);
      const waitTime = limiter.period - (now - oldestRequest);

      // Log rate limiting event
      this.logger.logRateLimit(source, waitTime, limiter.limit - limiter.requests.length);

      throw new Error(
        `Rate limit exceeded for ${source}. Please wait ${Math.ceil(waitTime / 1000)} seconds.`
      );
    }

    limiter.requests.push(now);
    return true;
  }

  getCacheKey(method, params) {
    return `${method}_${JSON.stringify(params)}`;
  }

  getFromCache(key) {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      this.logger.logCache('miss', key, { reason: 'expired' });
      return null;
    }
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      this.logger.logCache('hit', key, { size: JSON.stringify(cached).length });
      return cached;
    }
    this.logger.logCache('miss', key, { reason: 'not_found' });
    return null;
  }

  setCache(key, data, ttlMinutes = 60) {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + ttlMinutes * 60 * 1000);
    this.logger.logCache('set', key, {
      ttlMinutes,
      size: JSON.stringify(data).length,
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString()
    });
  }

  generateMockData(ticker, dataType) {
    // Generate realistic mock data for demo purposes
    const basePrice = 100 + Math.random() * 200;
    const marketCap = 1000000000 + Math.random() * 10000000000;

    // Map common tickers to realistic company names
    const companyNames = {
      AAPL: 'Apple Inc.',
      MSFT: 'Microsoft Corporation',
      GOOGL: 'Alphabet Inc.',
      AMZN: 'Amazon.com Inc.',
      META: 'Meta Platforms Inc.',
      TSLA: 'Tesla Inc.',
      NVDA: 'NVIDIA Corporation'
    };

    switch (dataType) {
      case 'profile':
        return {
          symbol: ticker,
          companyName: companyNames[ticker] || `${ticker} Corporation`,
          mktCap: marketCap,
          pe: 15 + Math.random() * 20,
          pb: 1 + Math.random() * 4,
          beta: 0.8 + Math.random() * 0.8,
          sector: 'Technology',
          industry: 'Software',
          sharesOutstanding: marketCap / basePrice,
          enterpriseValueOverEBITDA: 10 + Math.random() * 15,
          debtToEquity: Math.random() * 2,
          revenueTTM: marketCap * 0.8,
          grossProfitMargin: 0.3 + Math.random() * 0.4,
          netProfitMargin: 0.1 + Math.random() * 0.2,
          returnOnEquityTTM: 0.1 + Math.random() * 0.2,
          returnOnAssetsTTM: 0.05 + Math.random() * 0.15,
          effectiveTaxRateTTM: 0.21,
          fullTimeEmployees: 1000 + Math.random() * 50000,
          ipoDate: '2010-01-01',
          range: `$${(basePrice * 0.8).toFixed(2)} - $${(basePrice * 1.3).toFixed(2)}`
        };

      case 'marketData':
        return {
          symbol: ticker,
          currentPrice: basePrice,
          previousClose: basePrice * (0.98 + Math.random() * 0.04),
          marketCap,
          volume: 1000000 + Math.random() * 5000000,
          currency: 'USD'
        };

      case 'incomeStatement':
      case 'income':
        const revenue = marketCap * 0.8;
        return [
          {
            revenue,
            ebitda: revenue * 0.25,
            netIncome: revenue * 0.15,
            capex: revenue * 0.05,
            interestExpense: revenue * 0.02,
            grossProfitMargin: 0.6
          }
        ];

      case 'balanceSheet':
        return [
          {
            totalDebt: marketCap * 0.3,
            cashAndCashEquivalents: marketCap * 0.1,
            totalCurrentAssets: marketCap * 0.4,
            totalCurrentLiabilities: marketCap * 0.2
          }
        ];

      case 'cashFlow':
        return [
          {
            freeCashFlow: marketCap * 0.12
          }
        ];

      default:
        return null;
    }
  }

  async fetchCompanyProfile(ticker) {
    const cacheKey = this.getCacheKey('profile', { ticker });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    if (this.demoMode) {
      console.warn('Using demo mode - generating mock data for', ticker);
      const mockData = this.generateMockData(ticker, 'profile');
      this.setCache(cacheKey, mockData, 1440);
      return mockData;
    }

    return this.circuitBreakers.FMP.execute(async () => {
      return this.retryManager.executeWithRetry(async () => {
        await this.checkRateLimit('FMP');

        // Log API request start
        const requestId = this.logger.logApiRequest('FMP', `/profile/${ticker}`, { ticker });

        try {
          const response = await axios.get(`${DATA_SOURCES.FMP.baseURL}/profile/${ticker}`, {
            params: { apikey: DATA_SOURCES.FMP.apiKey },
            timeout: 10000
          });

          if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
            throw new Error(`Company profile not found for ticker: ${ticker}`);
          }

          const profile = response.data[0];
          if (!profile || typeof profile !== 'object') {
            throw new Error(`Company profile not found for ticker: ${ticker}`);
          }

          // Log successful API response
          this.logger.logApiResponse(requestId, true, {
            profileFound: true,
            ticker: profile.symbol
          });

          this.setCache(cacheKey, profile, 1440); // Cache for 24 hours
          return profile;
        } catch (error) {
          // Log failed API response
          this.logger.logApiResponse(requestId, false, null, error);
          throw error;
        }
      }, `Company profile fetch for ${ticker}`);
    }).catch(error => {
      // Handle circuit breaker errors - preserve the circuitBreakerOpen property
      if (error.circuitBreakerOpen) {
        throw error;
      }

      // Handle authentication errors with fallback to demo mode
      if (error.response?.status === 403 || error.response?.status === 401) {
        console.warn('API key invalid, falling back to demo mode');
        const mockData = this.generateMockData(ticker, 'profile');
        this.setCache(cacheKey, mockData, 1440);
        return mockData;
      }
      throw new Error(`Failed to fetch company profile: ${error.message}`);
    });
  }

  async fetchFinancialStatements(
    ticker,
    statement = 'income-statement',
    period = 'annual',
    limit = 5
  ) {
    const cacheKey = this.getCacheKey('financials', { ticker, statement, period, limit });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    if (this.demoMode) {
      console.warn('Using demo mode - generating mock financial data for', ticker);
      const mockData = this.generateMockData(
        ticker,
        statement.replace('-statement', '').replace('-', '')
      );
      this.setCache(cacheKey, mockData, 360);
      return mockData;
    }

    return this.retryManager
      .executeWithRetry(async () => {
        await this.checkRateLimit('FMP');

        const response = await axios.get(`${DATA_SOURCES.FMP.baseURL}/${statement}/${ticker}`, {
          params: {
            apikey: DATA_SOURCES.FMP.apiKey,
            period,
            limit
          },
          timeout: 15000
        });

        if (!response.data || response.data.length === 0) {
          throw new Error(`No ${statement} data found for ${ticker}`);
        }

        this.setCache(cacheKey, response.data, 360); // Cache for 6 hours
        return response.data;
      }, `Financial statements fetch for ${ticker} (${statement})`)
      .catch(error => {
        // Handle authentication errors with fallback to demo mode
        if (error.response?.status === 403 || error.response?.status === 401) {
          console.warn('API key invalid, falling back to demo mode');
          const mockData = this.generateMockData(
            ticker,
            statement.replace('-statement', '').replace('-', '')
          );
          this.setCache(cacheKey, mockData, 360);
          return mockData;
        }
        throw new Error(`Failed to fetch ${statement}: ${error.message}`);
      });
  }

  async fetchMarketData(ticker, range = '1y') {
    const cacheKey = this.getCacheKey('market', { ticker, range });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    if (this.demoMode) {
      console.warn('Using demo mode - generating mock market data for', ticker);
      const mockData = this.generateMockData(ticker, 'marketData');
      this.setCache(cacheKey, mockData, 15);
      return mockData;
    }

    try {
      return await this.retryManager.executeWithRetry(async () => {
        // Try Yahoo Finance first (no API key required)
        const response = await axios.get(`${DATA_SOURCES.YAHOO_FINANCE.baseURL}/${ticker}`, {
          params: { range, interval: '1d' },
          timeout: 10000
        });

        const result = response.data.chart.result[0];
        if (!result) {
          throw new Error(`No market data found for ticker: ${ticker}`);
        }

        const marketData = {
          symbol: result.meta.symbol,
          currentPrice: result.meta.regularMarketPrice,
          previousClose: result.meta.previousClose,
          marketCap: result.meta.marketCap,
          volume: result.meta.regularMarketVolume,
          timestamps: result.timestamp,
          prices: result.indicators.quote[0],
          currency: result.meta.currency
        };

        this.setCache(cacheKey, marketData, 15); // Cache for 15 minutes
        return marketData;
      }, `Market data fetch for ${ticker}`);
    } catch (error) {
      // Fallback to Alpha Vantage or demo mode
      console.warn(`Primary market data source failed for ${ticker}, trying alternative`);
      return this.fetchMarketDataAlternative(ticker);
    }
  }

  async fetchMarketDataAlternative(ticker) {
    if (this.demoMode) {
      const mockData = this.generateMockData(ticker, 'marketData');
      return mockData;
    }

    try {
      return await this.retryManager.executeWithRetry(async () => {
        await this.checkRateLimit('ALPHA_VANTAGE');

        const response = await axios.get(DATA_SOURCES.ALPHA_VANTAGE.baseURL, {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: ticker,
            apikey: DATA_SOURCES.ALPHA_VANTAGE.apiKey
          },
          timeout: 10000
        });

        const quote = response.data['Global Quote'];
        if (!quote || Object.keys(quote).length === 0) {
          throw new Error(`No market data found for ticker: ${ticker}`);
        }

        return {
          symbol: quote['01. symbol'],
          currentPrice: parseFloat(quote['05. price']),
          previousClose: parseFloat(quote['08. previous close']),
          volume: parseInt(quote['06. volume']),
          change: parseFloat(quote['09. change']),
          changePercent: quote['10. change percent']
        };
      }, `Alternative market data fetch for ${ticker}`);
    } catch (error) {
      console.warn('Alternative market data API failed, using demo data');
      return this.generateMockData(ticker, 'marketData');
    }
  }

  async fetchSECFilings(ticker, filingType = '10-K', count = 5) {
    const cacheKey = this.getCacheKey('sec', { ticker, filingType, count });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      if (this.demoMode) {
        console.warn('SEC filings not available in demo mode');
        return [
          {
            form: filingType,
            filingDate: '2023-12-31',
            accessionNumber: '0000000000-00-000000',
            reportDate: '2023-12-31',
            acceptanceDateTime: '2024-01-15T16:30:00',
            act: '34',
            primaryDocument: `${ticker.toLowerCase()}-${filingType.toLowerCase()}.htm`,
            url: '#demo-filing'
          }
        ];
      }

      await this.checkRateLimit('SEC_EDGAR');

      // This would need proper CIK lookup implementation
      // For now, return demo data
      return [
        {
          form: filingType,
          filingDate: '2023-12-31',
          accessionNumber: '0000000000-00-000000',
          reportDate: '2023-12-31',
          acceptanceDateTime: '2024-01-15T16:30:00',
          act: '34',
          primaryDocument: `${ticker.toLowerCase()}-${filingType.toLowerCase()}.htm`,
          url: '#demo-filing'
        }
      ];
    } catch (error) {
      throw new Error(`Failed to fetch SEC filings: ${error.message}`);
    }
  }

  async fetchPeerComparables(ticker, industryCode = null) {
    const cacheKey = this.getCacheKey('peers', { ticker, industryCode });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      if (this.demoMode) {
        console.warn('Using demo peer data');
        const peerTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'].filter(t => t !== ticker);
        const peers = peerTickers.slice(0, 5).map(peerTicker => {
          const basePrice = 100 + Math.random() * 200;
          const marketCap = 1000000000 + Math.random() * 2000000000;
          return {
            symbol: peerTicker,
            name: `${peerTicker} Corporation`,
            marketCap,
            currentPrice: basePrice,
            sector: 'Technology',
            industry: 'Software',
            peRatio: 15 + Math.random() * 20,
            evToEbitda: 10 + Math.random() * 15,
            priceToBook: 1 + Math.random() * 4,
            debtToEquity: Math.random() * 2
          };
        });
        this.setCache(cacheKey, peers, 240);
        return peers;
      }

      await this.checkRateLimit('FMP');

      // Get company profile first to determine industry
      const profile = await this.fetchCompanyProfile(ticker);

      // For demo, use hardcoded peer list
      const peerTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'].filter(t => t !== ticker);

      // Fetch key metrics for peer analysis
      const peerData = await Promise.allSettled(
        peerTickers.slice(0, 5).map(async peerTicker => {
          const peerProfile = await this.fetchCompanyProfile(peerTicker);
          const peerMarket = await this.fetchMarketData(peerTicker);

          return {
            symbol: peerTicker,
            name: peerProfile.companyName,
            marketCap: peerProfile.mktCap,
            currentPrice: peerMarket.currentPrice,
            sector: peerProfile.sector,
            industry: peerProfile.industry,
            peRatio: peerProfile.pe,
            evToEbitda: peerProfile.enterpriseValueOverEBITDA,
            priceToBook: peerProfile.pb,
            debtToEquity: peerProfile.debtToEquity
          };
        })
      );

      const validPeers = peerData
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      this.setCache(cacheKey, validPeers, 240); // Cache for 4 hours
      return validPeers;
    } catch (error) {
      throw new Error(`Failed to fetch peer comparables: ${error.message}`);
    }
  }

  async fetchDCFInputs(ticker) {
    try {
      const [profile, incomeStatements, balanceSheets, cashFlows, marketData] = await Promise.all([
        this.fetchCompanyProfile(ticker),
        this.fetchFinancialStatements(ticker, 'income-statement', 'annual', 5),
        this.fetchFinancialStatements(ticker, 'balance-sheet-statement', 'annual', 5),
        this.fetchFinancialStatements(ticker, 'cash-flow-statement', 'annual', 5),
        this.fetchMarketData(ticker)
      ]);

      // Calculate historical growth rates
      const revenues = Array.isArray(incomeStatements)
        ? incomeStatements.map(stmt => stmt.revenue).reverse()
        : [incomeStatements.revenue];
      const revenueGrowthRates = [];
      for (let i = 1; i < revenues.length; i++) {
        if (revenues[i - 1] && revenues[i]) {
          revenueGrowthRates.push((revenues[i] - revenues[i - 1]) / revenues[i - 1]);
        }
      }
      const avgRevenueGrowth =
        revenueGrowthRates.length > 0
          ? revenueGrowthRates.reduce((a, b) => a + b, 0) / revenueGrowthRates.length
          : 0.05; // Default 5% growth

      // Calculate free cash flow margin
      const latestCashFlow = Array.isArray(cashFlows) ? cashFlows[0] : cashFlows;
      const latestIncome = Array.isArray(incomeStatements) ? incomeStatements[0] : incomeStatements;
      const fcfMargin = latestCashFlow.freeCashFlow / latestIncome.revenue;

      // Estimate WACC components
      const riskFreeRate = 0.045; // 4.5% - this should come from treasury rates API
      const marketPremium = 0.065; // 6.5% historical market premium
      const beta = profile.beta || 1.0;
      const costOfEquity = riskFreeRate + beta * marketPremium;

      const latestBalance = Array.isArray(balanceSheets) ? balanceSheets[0] : balanceSheets;
      const totalDebt = latestBalance.totalDebt || 0;
      const marketCap = marketData.marketCap || marketData.currentPrice * profile.sharesOutstanding;
      const debtRatio = totalDebt / (totalDebt + marketCap);
      const taxRate = profile.effectiveTaxRateTTM || 0.21;

      const wacc = costOfEquity * (1 - debtRatio) + 0.04 * debtRatio * (1 - taxRate); // Assuming 4% cost of debt

      return {
        symbol: ticker,
        companyName: profile.companyName,
        currentRevenue: latestIncome.revenue,
        revenueGrowthRate: avgRevenueGrowth,
        fcfMargin,
        wacc,
        terminalGrowthRate: 0.025, // 2.5% long-term GDP growth assumption
        currentPrice: marketData.currentPrice,
        sharesOutstanding: profile.sharesOutstanding,
        marketCap,
        totalDebt,
        cash: latestBalance.cashAndCashEquivalents || 0,
        beta,
        peRatio: profile.pe,
        historicalData: {
          revenues,
          revenueGrowthRates,
          freeCashFlows: Array.isArray(cashFlows)
            ? cashFlows.map(cf => cf.freeCashFlow).reverse()
            : [latestCashFlow.freeCashFlow],
          margins: Array.isArray(incomeStatements)
            ? incomeStatements.map(stmt => stmt.grossProfitMargin).reverse()
            : [latestIncome.grossProfitMargin]
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch DCF inputs for ${ticker}: ${error.message}`);
    }
  }

  async fetchLBOInputs(ticker) {
    try {
      const [profile, incomeStatements, balanceSheets, marketData, peers] = await Promise.all([
        this.fetchCompanyProfile(ticker),
        this.fetchFinancialStatements(ticker, 'income-statement', 'annual', 3),
        this.fetchFinancialStatements(ticker, 'balance-sheet-statement', 'annual', 3),
        this.fetchMarketData(ticker),
        this.fetchPeerComparables(ticker)
      ]);

      const latestIncome = Array.isArray(incomeStatements) ? incomeStatements[0] : incomeStatements;
      const latestBalance = Array.isArray(balanceSheets) ? balanceSheets[0] : balanceSheets;

      // Calculate key LBO metrics
      const ebitda = latestIncome.ebitda;
      const currentEV =
        marketData.marketCap + latestBalance.totalDebt - latestBalance.cashAndCashEquivalents;
      const evEbitdaMultiple = currentEV / ebitda;

      // Peer multiples for exit assumptions
      const peerEvEbitdaMultiples = peers
        .filter(peer => peer.evToEbitda && peer.evToEbitda > 0)
        .map(peer => peer.evToEbitda);
      const avgPeerMultiple =
        peerEvEbitdaMultiples.length > 0
          ? peerEvEbitdaMultiples.reduce((a, b) => a + b, 0) / peerEvEbitdaMultiples.length
          : evEbitdaMultiple;

      return {
        symbol: ticker,
        companyName: profile.companyName,
        currentPrice: marketData.currentPrice,
        marketCap: marketData.marketCap,
        enterpriseValue: currentEV,
        ebitda,
        evEbitdaMultiple,
        revenue: latestIncome.revenue,
        netIncome: latestIncome.netIncome,
        totalDebt: latestBalance.totalDebt,
        cash: latestBalance.cashAndCashEquivalents,
        workingCapital: latestBalance.totalCurrentAssets - latestBalance.totalCurrentLiabilities,
        capex: Math.abs(latestIncome.capex || 0),
        debtToEbitda: latestBalance.totalDebt / ebitda,
        interestCoverage: ebitda / (latestIncome.interestExpense || 1),
        avgPeerMultiple,
        suggestedPurchasePrice: ebitda * avgPeerMultiple,
        maxDebtCapacity: ebitda * 6, // 6x EBITDA debt capacity assumption
        sharesOutstanding: profile.sharesOutstanding
      };
    } catch (error) {
      throw new Error(`Failed to fetch LBO inputs for ${ticker}: ${error.message}`);
    }
  }

  async validateTicker(ticker) {
    try {
      // In demo mode, only validate known tickers
      if (this.demoMode) {
        const knownTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA'];
        return knownTickers.includes(ticker);
      }

      await this.fetchCompanyProfile(ticker);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Add method to check API status
  async getApiStatus() {
    const validationResults = await apiKeyValidator.validateAllKeys();
    const metrics = this.logger.getMetrics();

    return {
      demoMode: this.demoMode,
      cacheSize: this.cache.size,
      validation: validationResults,
      circuitBreakers: this.getCircuitBreakerStatus(),
      metrics,
      performance: {
        uptime: metrics.uptime,
        totalRequests: Object.values(metrics.services).reduce(
          (total, service) => total + (service.requests?.total || 0),
          0
        ),
        totalErrors: Object.values(metrics.services).reduce(
          (total, service) => total + (service.error?.total || 0),
          0
        ),
        averageResponseTime: this.calculateAverageResponseTime(metrics.services),
        cacheHitRate: this.calculateCacheHitRate(metrics.cache)
      },
      availableKeys: {
        alphaVantage: !!(
          import.meta.env.VITE_ALPHA_VANTAGE_API_KEY &&
          import.meta.env.VITE_ALPHA_VANTAGE_API_KEY !== 'demo'
        ),
        fmp: !!(import.meta.env.VITE_FMP_API_KEY && import.meta.env.VITE_FMP_API_KEY !== 'demo'),
        quandl: !!(
          import.meta.env.VITE_QUANDL_API_KEY && import.meta.env.VITE_QUANDL_API_KEY !== 'demo'
        ),
        fred: !!(import.meta.env.VITE_FRED_API_KEY && import.meta.env.VITE_FRED_API_KEY !== 'demo')
      },
      recommendations: validationResults.recommendations
    };
  }

  // Get circuit breaker status for all services
  getCircuitBreakerStatus() {
    const status = {};
    Object.keys(this.circuitBreakers).forEach(service => {
      status[service] = this.circuitBreakers[service].getStatus();
    });
    return status;
  }

  // Calculate average response time across all services
  calculateAverageResponseTime(services) {
    let totalDuration = 0;
    let totalRequests = 0;

    Object.values(services).forEach(service => {
      if (service.duration) {
        totalDuration += service.duration.total;
        totalRequests += service.duration.count;
      }
    });

    return totalRequests > 0 ? Math.round(totalDuration / totalRequests) : 0;
  }

  // Calculate cache hit rate
  calculateCacheHitRate(cache) {
    const hits = cache.hit?.total || 0;
    const misses = cache.miss?.total || 0;
    const total = hits + misses;

    return total > 0 ? Math.round((hits / total) * 100) : 0;
  }

  // Get recent logs for debugging
  getRecentLogs(limit = 50, level = null) {
    return this.logger.getRecentLogs(limit, level);
  }

  // Clear all metrics and logs
  clearMetrics() {
    this.logger.clear();
  }

  // Add method to validate API keys on demand
  async validateApiKeys() {
    return await apiKeyValidator.validateAllKeys();
  }
}

// Export singleton instance
export const dataFetchingService = new DataFetchingService();
export default DataFetchingService;
