// Premium Data Integration Service - Phase 1 Implementation
export class PremiumDataService {
  constructor() {
    this.providers = {
      bloomberg: new BloombergApiService(),
      refinitiv: new RefinitivApiService(),
      sp_capital_iq: new SPCapitalIQService(),
      factset: new FactSetService()
    };

    this.cache = new Map();
    this.rateLimiters = new Map();
    this.fallbackChain = ['bloomberg', 'refinitiv', 'sp_capital_iq'];
  }

  // Unified data request with provider fallback
  async getData(dataType, params, options = {}) {
    const {
      preferredProvider = 'bloomberg',
      useCache = true,
      fallback = true,
      timeout = 30000
    } = options;

    const cacheKey = this.getCacheKey(dataType, params);

    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < cached.ttl) {
        return { ...cached.data, source: `${cached.source} (cached)` };
      }
    }

    const providers = fallback
      ? [preferredProvider, ...this.fallbackChain.filter(p => p !== preferredProvider)]
      : [preferredProvider];

    for (const providerName of providers) {
      try {
        await this.checkRateLimit(providerName);

        const provider = this.providers[providerName];
        const data = await Promise.race([
          provider.getData(dataType, params),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
        ]);

        const normalizedData = this.normalizeData(dataType, data, providerName);

        if (useCache) {
          this.cache.set(cacheKey, {
            data: normalizedData,
            timestamp: Date.now(),
            ttl: this.getCacheTTL(dataType),
            source: providerName
          });
        }

        return { ...normalizedData, source: providerName };

      } catch (error) {
        console.warn(`Provider ${providerName} failed for ${dataType}:`, error.message);
        if (providerName === providers[providers.length - 1]) {
          throw new Error(`All providers failed for ${dataType}`);
        }
      }
    }
  }

  // Real-time market data
  async getMarketData(symbols, fields = []) {
    const params = {
      symbols: Array.isArray(symbols) ? symbols : [symbols],
      fields: fields.length > 0 ? fields : [
        'LAST_PRICE', 'CHG_NET_1D', 'CHG_PCT_1D',
        'VOLUME', 'HIGH', 'LOW', 'OPEN'
      ]
    };

    return await this.getData('market_data', params, {
      preferredProvider: 'bloomberg',
      useCache: false
    });
  }

  // Fundamental data
  async getFundamentals(symbol, statement = 'income', period = 'annual') {
    const params = { symbol, statement, period };
    return await this.getData('fundamentals', params);
  }

  // Estimates data
  async getEstimates(symbol, metrics = []) {
    const params = {
      symbol,
      metrics: metrics.length > 0 ? metrics : [
        'REVENUE', 'EPS', 'EBITDA', 'FCF'
      ]
    };

    return await this.getData('estimates', params);
  }

  // Peer analysis
  async getPeerAnalysis(symbol, sector = null) {
    const params = { symbol, sector };
    return await this.getData('peer_analysis', params);
  }

  // Credit data
  async getCreditData(symbol) {
    const params = { symbol };
    return await this.getData('credit_data', params);
  }

  // ESG data
  async getESGData(symbol) {
    const params = { symbol };
    return await this.getData('esg_data', params);
  }

  // Data normalization
  normalizeData(dataType, rawData, provider) {
    const normalizer = this.getNormalizer(dataType, provider);
    return normalizer ? normalizer(rawData) : rawData;
  }

  getNormalizer(dataType, provider) {
    const normalizers = {
      market_data: {
        bloomberg: this.normalizeBloombergMarketData,
        refinitiv: this.normalizeRefinitivMarketData,
        sp_capital_iq: this.normalizeSPMarketData
      },
      fundamentals: {
        bloomberg: this.normalizeBloombergFundamentals,
        refinitiv: this.normalizeRefinitivFundamentals,
        sp_capital_iq: this.normalizeSPFundamentals
      }
    };

    return normalizers[dataType]?.[provider];
  }

  // Bloomberg normalizers
  normalizeBloombergMarketData = (data) => {
    return data.map(item => ({
      symbol: item.security,
      price: item.LAST_PRICE,
      change: item.CHG_NET_1D,
      changePercent: item.CHG_PCT_1D,
      volume: item.VOLUME,
      high: item.HIGH,
      low: item.LOW,
      open: item.OPEN,
      timestamp: new Date().toISOString()
    }));
  };

  normalizeBloombergFundamentals = (data) => {
    return {
      symbol: data.ticker,
      currency: data.CRNCY,
      fiscalYear: data.fiscal_year,
      revenue: data.SALES_REV_TURN,
      grossProfit: data.GROSS_PROFIT,
      operatingIncome: data.OPER_INC,
      netIncome: data.NET_INC,
      totalAssets: data.BS_TOT_ASSET,
      totalDebt: data.BS_TOT_DEBT2,
      shareholders_equity: data.BS_TOT_SHRHLDR_EQY,
      operatingCashFlow: data.CF_CASH_FROM_OPER,
      freeCashFlow: data.FREE_CASH_FLOW,
      shares: data.BS_SH_OUT,
      timestamp: new Date().toISOString()
    };
  };

  // Rate limiting
  async checkRateLimit(provider) {
    const limits = {
      bloomberg: { requests: 1000, window: 3600000 }, // 1000/hour
      refinitiv: { requests: 500, window: 3600000 },   // 500/hour
      sp_capital_iq: { requests: 100, window: 60000 }, // 100/minute
      factset: { requests: 200, window: 60000 }        // 200/minute
    };

    const limit = limits[provider];
    if (!limit) return;

    const key = `${provider}_rate_limit`;
    const now = Date.now();

    if (!this.rateLimiters.has(key)) {
      this.rateLimiters.set(key, { requests: [], window: limit.window });
    }

    const rateLimiter = this.rateLimiters.get(key);
    rateLimiter.requests = rateLimiter.requests.filter(time => now - time < rateLimiter.window);

    if (rateLimiter.requests.length >= limit.requests) {
      const oldestRequest = Math.min(...rateLimiter.requests);
      const waitTime = rateLimiter.window - (now - oldestRequest);
      throw new Error(`Rate limit exceeded for ${provider}. Wait ${waitTime}ms`);
    }

    rateLimiter.requests.push(now);
  }

  getCacheKey(dataType, params) {
    return `${dataType}_${JSON.stringify(params)}`;
  }

  getCacheTTL(dataType) {
    const ttls = {
      market_data: 5000,      // 5 seconds
      fundamentals: 3600000,  // 1 hour
      estimates: 1800000,     // 30 minutes
      peer_analysis: 7200000, // 2 hours
      credit_data: 3600000,   // 1 hour
      esg_data: 86400000      // 24 hours
    };
    return ttls[dataType] || 3600000;
  }
}

// Bloomberg Terminal API Service
class BloombergApiService {
  constructor() {
    this.baseUrl = process.env.BLOOMBERG_API_URL || 'https://api.bloomberg.com';
    this.apiKey = process.env.BLOOMBERG_API_KEY;
  }

  async getData(dataType, params) {
    const endpoint = this.getEndpoint(dataType);
    const requestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, requestConfig);

    if (!response.ok) {
      throw new Error(`Bloomberg API error: ${response.status}`);
    }

    return await response.json();
  }

  getEndpoint(dataType) {
    const endpoints = {
      market_data: '/v1/market-data',
      fundamentals: '/v1/fundamentals',
      estimates: '/v1/estimates',
      peer_analysis: '/v1/peer-analysis',
      credit_data: '/v1/credit',
      esg_data: '/v1/esg'
    };
    return endpoints[dataType] || '/v1/data';
  }
}

// Refinitiv (formerly Thomson Reuters) API Service
class RefinitivApiService {
  constructor() {
    this.baseUrl = process.env.REFINITIV_API_URL || 'https://api.refinitiv.com';
    this.apiKey = process.env.REFINITIV_API_KEY;
    this.accessToken = null;
  }

  async getData(dataType, params) {
    if (!this.accessToken) {
      await this.authenticate();
    }

    const endpoint = this.getEndpoint(dataType);
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Refinitiv API error: ${response.status}`);
    }

    return await response.json();
  }

  async authenticate() {
    const response = await fetch(`${this.baseUrl}/auth/oauth2/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${this.apiKey}`
    });

    const auth = await response.json();
    this.accessToken = auth.access_token;
  }

  getEndpoint(dataType) {
    const endpoints = {
      market_data: '/data/pricing/snapshots/v1',
      fundamentals: '/data/fundamentals/v1',
      estimates: '/data/estimates/v1',
      esg_data: '/data/environmental-social-governance/v1'
    };
    return endpoints[dataType];
  }
}

// S&P Capital IQ API Service
class SPCapitalIQService {
  constructor() {
    this.baseUrl = process.env.SP_CAPITAL_IQ_URL || 'https://api.spglobal.com';
    this.username = process.env.SP_CAPITAL_IQ_USERNAME;
    this.password = process.env.SP_CAPITAL_IQ_PASSWORD;
  }

  async getData(dataType, params) {
    const endpoint = this.getEndpoint(dataType);
    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`S&P Capital IQ API error: ${response.status}`);
    }

    return await response.json();
  }

  getEndpoint(dataType) {
    const endpoints = {
      market_data: '/capiq/v1/market-data',
      fundamentals: '/capiq/v1/fundamentals',
      estimates: '/capiq/v1/estimates',
      peer_analysis: '/capiq/v1/screening'
    };
    return endpoints[dataType];
  }
}

// FactSet API Service (Additional provider)
class FactSetService {
  constructor() {
    this.baseUrl = process.env.FACTSET_API_URL || 'https://api.factset.com';
    this.username = process.env.FACTSET_USERNAME;
    this.apiKey = process.env.FACTSET_API_KEY;
  }

  async getData(dataType, params) {
    const endpoint = this.getEndpoint(dataType);
    const auth = Buffer.from(`${this.username}:${this.apiKey}`).toString('base64');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    return await response.json();
  }

  getEndpoint(dataType) {
    const endpoints = {
      market_data: '/factset-prices/v1/prices',
      fundamentals: '/factset-fundamentals/v2/fundamentals',
      estimates: '/factset-estimates/v2/consensus'
    };
    return endpoints[dataType];
  }
}

export const premiumDataService = new PremiumDataService();
