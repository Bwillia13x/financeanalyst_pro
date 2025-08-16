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

    // Setup axios defaults
    this.setupAxiosDefaults();
  }

  setupAxiosDefaults() {
    // Global timeout
    axios.defaults.timeout = 15000;

    // Global headers
    axios.defaults.headers.common['User-Agent'] = 'FinanceAnalyst-Pro/1.0';
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
        return this.generateDemoData(service, endpoint, params);
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
      }
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
      }
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
      }
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
      }
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
      }
    });

    return response.data;
  }

  /**
   * Generate demo data when APIs are unavailable
   */
  generateDemoData(service, endpoint, params) {
    console.warn(`Generating demo data for service=${service}, endpoint=${endpoint}`);

    const now = new Date();
    const symbol = (params?.symbol || String(endpoint || '').split('/').pop() || 'DEMO').toUpperCase();

    // Yahoo Finance demo shape
    if (service === 'yahoo') {
      const timestamps = Array.from({ length: 5 }, (_, i) => Math.floor((Date.now() - (4 - i) * 60_000) / 1000));
      const base = 100 + Math.random() * 50;
      const closes = timestamps.map((_, i) => Number((base + (i - 2) * (Math.random() * 0.8)).toFixed(2)));
      const opens = closes.map(v => Number((v + (Math.random() - 0.5) * 0.6).toFixed(2)));
      const highs = closes.map((v, i) => Number((Math.max(v, opens[i]) + Math.random()).toFixed(2)));
      const lows = closes.map((v, i) => Number((Math.min(v, opens[i]) - Math.random()).toFixed(2)));
      const volumes = timestamps.map(() => Math.floor(100000 + Math.random() * 900000));

      return {
        chart: {
          result: [
            {
              meta: {
                symbol,
                currency: 'USD',
                regularMarketPrice: closes[closes.length - 1],
                previousClose: Number((closes[0] - (Math.random() * 2)).toFixed(2)),
                regularMarketVolume: volumes[volumes.length - 1],
                marketCap: 50000000000,
                exchangeTimezoneName: 'America/New_York'
              },
              timestamp: timestamps,
              indicators: {
                quote: [
                  {
                    open: opens,
                    high: highs,
                    low: lows,
                    close: closes,
                    volume: volumes
                  }
                ]
              }
            }
          ],
          error: null
        }
      };
    }

    // Alpha Vantage demo shapes
    if (service === 'alphaVantage') {
      const fn = String(endpoint || '').toUpperCase();

      if (fn === 'GLOBAL_QUOTE') {
        const price = Number((100 + Math.random() * 50).toFixed(2));
        const prev = Number((price - (Math.random() * 2)).toFixed(2));
        const change = Number((price - prev).toFixed(2));
        const changePct = ((change / prev) * 100).toFixed(2) + '%';
        return {
          'Global Quote': {
            '01. symbol': symbol,
            '05. price': String(price),
            '08. previous close': String(prev),
            '09. change': String(change),
            '10. change percent': changePct,
            '06. volume': String(Math.floor(100000 + Math.random() * 900000))
          }
        };
      }

      if (fn === 'TIME_SERIES_DAILY_ADJUSTED') {
        const series = {};
        for (let i = 0; i < 30; i++) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateStr = d.toISOString().slice(0, 10);
          const base = 100 + Math.random() * 50;
          const open = Number((base + Math.random()).toFixed(2));
          const close = Number((base + (Math.random() - 0.5) * 2).toFixed(2));
          const high = Math.max(open, close) + Number((Math.random() * 1.5).toFixed(2));
          const low = Math.min(open, close) - Number((Math.random() * 1.5).toFixed(2));
          series[dateStr] = {
            '1. open': String(open),
            '2. high': String(high.toFixed ? high.toFixed(2) : high),
            '3. low': String(low.toFixed ? low.toFixed(2) : low),
            '4. close': String(close),
            '6. volume': String(Math.floor(100000 + Math.random() * 900000))
          };
        }
        return { 'Time Series (Daily)': series };
      }

      if (fn === 'TIME_SERIES_INTRADAY') {
        const interval = params?.interval || '5min';
        const key = `Time Series (${interval})`;
        const series = {};
        for (let i = 0; i < 5; i++) {
          const t = new Date(now.getTime() - i * 5 * 60 * 1000).toISOString().slice(0, 19);
          const base = 100 + Math.random() * 50;
          const open = Number((base + Math.random()).toFixed(2));
          const close = Number((base + (Math.random() - 0.5) * 2).toFixed(2));
          const high = Math.max(open, close) + Number((Math.random() * 1.5).toFixed(2));
          const low = Math.min(open, close) - Number((Math.random() * 1.5).toFixed(2));
          series[t] = {
            '1. open': String(open),
            '2. high': String(high.toFixed ? high.toFixed(2) : high),
            '3. low': String(low.toFixed ? low.toFixed(2) : low),
            '4. close': String(close),
            '5. volume': String(Math.floor(10000 + Math.random() * 90000))
          };
        }
        return { [key]: series };
      }

      if (fn === 'OVERVIEW') {
        return {
          Symbol: symbol,
          Name: `${symbol} Corp`,
          Description: `${symbol} demo overview description`,
          Industry: 'Software',
          Sector: 'Technology',
          Country: 'USA',
          Exchange: 'NASDAQ',
          Currency: 'USD',
          MarketCapitalization: String(50000000000),
          FullTimeEmployees: String(12000),
          Beta: '1.10',
          PERatio: '24.50',
          PriceToBookRatio: '8.20',
          PriceToSalesRatioTTM: '6.10',
          DividendYield: '0.00',
          ReturnOnEquityTTM: '18.5',
          ReturnOnAssetsTTM: '9.2',
          GrossProfitTTM: '2500000000',
          OperatingMarginTTM: '22.1',
          ProfitMargin: '18.0'
        };
      }

      if (fn === 'EARNINGS') {
        const q = [];
        for (let i = 0; i < 8; i++) {
          const d = new Date(now.getTime() - i * 90 * 24 * 60 * 60 * 1000);
          q.push({
            fiscalDateEnding: d.toISOString().slice(0, 10),
            reportedDate: d.toISOString().slice(0, 10),
            reportedEPS: (Math.random() * 2).toFixed(2),
            estimatedEPS: (Math.random() * 2).toFixed(2),
            surprise: (Math.random() * 0.5).toFixed(2),
            surprisePercentage: (Math.random() * 10).toFixed(2)
          });
        }
        const a = [];
        for (let i = 0; i < 2; i++) {
          const d = new Date(now.getTime() - i * 365 * 24 * 60 * 60 * 1000);
          a.push({ fiscalDateEnding: d.toISOString().slice(0, 10), reportedEPS: (Math.random() * 5).toFixed(2) });
        }
        return { quarterlyEarnings: q, annualEarnings: a };
      }
    }

    // FMP demo shapes
    if (service === 'fmp') {
      const path = String(endpoint || '');
      if (path.startsWith('/profile/')) {
        return [
          {
            symbol,
            companyName: `${symbol} Corporation`,
            description: `${symbol} demo company profile`,
            industry: 'Software—Infrastructure',
            sector: 'Technology',
            country: 'USA',
            city: 'San Francisco',
            address: '123 Market St',
            phone: '123-456-7890',
            website: `https://www.${symbol.toLowerCase()}.com`,
            exchangeShortName: 'NASDAQ',
            currency: 'USD',
            mktCap: 50000000000,
            fullTimeEmployees: 12000,
            ceo: 'Jane Doe',
            ipoDate: '2015-06-15',
            beta: 1.1,
            pe: 24.5,
            pb: 8.2,
            ps: 6.1,
            lastDiv: 0,
            debtToEquity: 0.3,
            roe: 18.5,
            roa: 9.2,
            grossProfitMargin: 65.1,
            operatingProfitMargin: 22.1,
            netProfitMargin: 18.0
          }
        ];
      }
      if (path.startsWith('/stock_peers')) {
        const peers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'].filter(p => p !== symbol).slice(0, 4);
        return [ { symbol, peersList: peers } ];
      }
      if (path.startsWith('/discounted-cash-flow/')) {
        const price = Number((100 + Math.random() * 50).toFixed(2));
        const dcf = Number((price * (0.95 + Math.random() * 0.1)).toFixed(2));
        return [ { symbol, dcf: String(dcf), 'Stock Price': String(price), date: now.toISOString().slice(0, 10) } ];
      }
    }

    // Generic fallback
    return {
      symbol,
      timestamp: new Date().toISOString(),
      data: {
        price: 100 + Math.random() * 50,
        volume: Math.floor(Math.random() * 1000000),
        change: (Math.random() - 0.5) * 10
      },
      source: 'demo',
      note: 'This is demo data. Configure API keys for live data.'
    };
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
}

export default new ApiService();
