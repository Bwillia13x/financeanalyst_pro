/**
 * Premium Data Integration Service
 * Integrates with Bloomberg Terminal, Refinitiv Eikon, and S&P Capital IQ
 */

import { EventEmitter } from 'events';

import axios from 'axios';

class PremiumDataIntegrationService extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      bloomberg: {
        apiKey: config.bloomberg?.apiKey || process.env.BLOOMBERG_API_KEY,
        baseURL: config.bloomberg?.baseURL || 'https://api.bloomberg.com/eap/catalogs/bbg',
        rateLimit: 10, // requests per second
        timeout: 30000
      },
      refinitiv: {
        apiKey: config.refinitiv?.apiKey || process.env.REFINITIV_API_KEY,
        baseURL: config.refinitiv?.baseURL || 'https://api.refinitiv.com/data',
        rateLimit: 5,
        timeout: 30000
      },
      spCapitalIQ: {
        username: config.spCapitalIQ?.username || process.env.SP_CAPITALIQ_USERNAME,
        password: config.spCapitalIQ?.password || process.env.SP_CAPITALIQ_PASSWORD,
        baseURL: config.spCapitalIQ?.baseURL || 'https://api.capitaliq.com/v2',
        rateLimit: 3,
        timeout: 45000
      }
    };

    this.cache = new Map();
    this.rateLimiters = this.initializeRateLimiters();

    // Initialize provider clients
    this.bloomberg = new BloombergClient(this.config.bloomberg, this);
    this.refinitiv = new RefinitivClient(this.config.refinitiv, this);
    this.spCapitalIQ = new SPCapitalIQClient(this.config.spCapitalIQ, this);
  }

  initializeRateLimiters() {
    const createLimiter = (rateLimit) => ({
      tokens: rateLimit,
      maxTokens: rateLimit,
      lastRefill: Date.now(),
      acquire() {
        const now = Date.now();
        const timePassed = (now - this.lastRefill) / 1000;
        this.tokens = Math.min(this.maxTokens, this.tokens + timePassed);
        this.lastRefill = now;

        if (this.tokens >= 1) {
          this.tokens -= 1;
          return true;
        }
        return false;
      }
    });

    return {
      bloomberg: createLimiter(this.config.bloomberg.rateLimit),
      refinitiv: createLimiter(this.config.refinitiv.rateLimit),
      spCapitalIQ: createLimiter(this.config.spCapitalIQ.rateLimit)
    };
  }

  async getMarketData(symbols, dataFields = ['LAST_PRICE', 'CHG_PCT_1D', 'VOLUME'], options = {}) {
    const {
      preferredProvider = 'auto',
      fallbackOrder = ['bloomberg', 'refinitiv', 'spCapitalIQ'],
      realTime = false,
      historical = false,
      period = '1y'
    } = options;

    try {
      if (preferredProvider === 'auto') {
        return await this.getDataWithFallback('getMarketData', [symbols, dataFields, options], fallbackOrder);
      }

      const provider = this.getProvider(preferredProvider);
      return await provider.getMarketData(symbols, dataFields, { realTime, historical, period });

    } catch (error) {
      this.emit('error', { method: 'getMarketData', provider: preferredProvider, error });
      throw error;
    }
  }

  async getCompanyFundamentals(symbol, metrics = ['TOTAL_EQUITY', 'TOTAL_DEBT', 'FREE_CASH_FLOW'], options = {}) {
    const {
      preferredProvider = 'auto',
      fallbackOrder = ['spCapitalIQ', 'refinitiv', 'bloomberg'],
      years = 5,
      quarterly = false
    } = options;

    try {
      if (preferredProvider === 'auto') {
        return await this.getDataWithFallback('getCompanyFundamentals', [symbol, metrics, options], fallbackOrder);
      }

      const provider = this.getProvider(preferredProvider);
      return await provider.getCompanyFundamentals(symbol, metrics, { years, quarterly });

    } catch (error) {
      this.emit('error', { method: 'getCompanyFundamentals', provider: preferredProvider, error });
      throw error;
    }
  }

  async getEconomicData(indicators = ['GDP', 'INFLATION', 'UNEMPLOYMENT'], options = {}) {
    const {
      preferredProvider = 'auto',
      fallbackOrder = ['bloomberg', 'refinitiv', 'spCapitalIQ'],
      countries = ['US'],
      period = '10y'
    } = options;

    try {
      if (preferredProvider === 'auto') {
        return await this.getDataWithFallback('getEconomicData', [indicators, options], fallbackOrder);
      }

      const provider = this.getProvider(preferredProvider);
      return await provider.getEconomicData(indicators, { countries, period });

    } catch (error) {
      this.emit('error', { method: 'getEconomicData', provider: preferredProvider, error });
      throw error;
    }
  }

  async getESGData(symbol, metrics = ['ESG_SCORE', 'CARBON_EMISSIONS', 'GOVERNANCE_SCORE'], options = {}) {
    const { preferredProvider = 'refinitiv', fallbackOrder = ['refinitiv', 'spCapitalIQ'] } = options;

    try {
      if (preferredProvider === 'auto') {
        return await this.getDataWithFallback('getESGData', [symbol, metrics, options], fallbackOrder);
      }

      const provider = this.getProvider(preferredProvider);
      return await provider.getESGData(symbol, metrics);

    } catch (error) {
      this.emit('error', { method: 'getESGData', provider: preferredProvider, error });
      throw error;
    }
  }

  async getDataWithFallback(method, args, fallbackOrder) {
    const errors = [];

    for (const providerName of fallbackOrder) {
      try {
        const provider = this.getProvider(providerName);
        if (provider && provider[method]) {
          const result = await provider[method](...args);
          this.emit('data:success', { provider: providerName, method, result });
          return result;
        }
      } catch (error) {
        errors.push({ provider: providerName, error });
        this.emit('data:fallback', { provider: providerName, method, error });
      }
    }

    throw new Error(`All providers failed for ${method}: ${JSON.stringify(errors)}`);
  }

  getProvider(name) {
    switch (name.toLowerCase()) {
      case 'bloomberg': return this.bloomberg;
      case 'refinitiv': return this.refinitiv;
      case 'spcapitaliq': return this.spCapitalIQ;
      default: throw new Error(`Unknown provider: ${name}`);
    }
  }

  async getCachedData(key, ttl = 300000) { // 5 minutes default TTL
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache() {
    this.cache.clear();
  }
}

/**
 * Bloomberg Terminal API Client
 */
class BloombergClient {
  constructor(config, parent) {
    this.config = config;
    this.parent = parent;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getMarketData(symbols, fields, options = {}) {
    const { realTime = false, historical = false, period = '1y' } = options;
    const cacheKey = `bloomberg:market:${symbols.join(',')}:${fields.join(',')}:${period}`;

    const cached = await this.parent.getCachedData(cacheKey);
    if (cached) return cached;

    await this.waitForRateLimit();

    const endpoint = historical ? '/catalog/dataset/history' : '/catalog/dataset/snapshot';
    const response = await this.client.post(endpoint, {
      universe: symbols.map(s => ({ id: s, yellowKey: 'Equity' })),
      fields,
      pricing_source: realTime ? 'BGN' : 'EOD',
      period_adjustment: 'ACTUAL',
      ...(historical && {
        start_date: this.getStartDate(period),
        end_date: new Date().toISOString().split('T')[0]
      })
    });

    const normalizedData = this.normalizeMarketData(response.data, symbols, fields);
    this.parent.setCachedData(cacheKey, normalizedData);

    return normalizedData;
  }

  async getCompanyFundamentals(symbol, metrics, options = {}) {
    const { years = 5, quarterly = false } = options;
    const cacheKey = `bloomberg:fundamentals:${symbol}:${metrics.join(',')}:${years}:${quarterly}`;

    const cached = await this.parent.getCachedData(cacheKey);
    if (cached) return cached;

    await this.waitForRateLimit();

    const response = await this.client.post('/catalog/dataset/history', {
      universe: [{ id: symbol, yellowKey: 'Equity' }],
      fields: metrics,
      period_adjustment: 'ACTUAL',
      frequency: quarterly ? 'QUARTERLY' : 'ANNUAL',
      start_date: this.getStartDate(`${years}y`),
      end_date: new Date().toISOString().split('T')[0]
    });

    const normalizedData = this.normalizeFundamentals(response.data, symbol, metrics);
    this.parent.setCachedData(cacheKey, normalizedData);

    return normalizedData;
  }

  async getEconomicData(indicators, options = {}) {
    const { countries = ['US'], period = '10y' } = options;
    const cacheKey = `bloomberg:economic:${indicators.join(',')}:${countries.join(',')}:${period}`;

    const cached = await this.parent.getCachedData(cacheKey);
    if (cached) return cached;

    await this.waitForRateLimit();

    const tickers = this.mapEconomicIndicators(indicators, countries);
    const response = await this.client.post('/catalog/dataset/history', {
      universe: tickers.map(t => ({ id: t })),
      fields: ['PX_LAST'],
      start_date: this.getStartDate(period),
      end_date: new Date().toISOString().split('T')[0]
    });

    const normalizedData = this.normalizeEconomicData(response.data, indicators, countries);
    this.parent.setCachedData(cacheKey, normalizedData);

    return normalizedData;
  }

  mapEconomicIndicators(indicators, countries) {
    const mapping = {
      'GDP': countries.map(c => `${c} GDP QoQ SA Annualized`),
      'INFLATION': countries.map(c => `${c} CPI YoY NSA`),
      'UNEMPLOYMENT': countries.map(c => `${c} UNEMP Rate`)
    };

    return indicators.flatMap(indicator => mapping[indicator] || []);
  }

  normalizeMarketData(data, symbols, fields) {
    return {
      provider: 'bloomberg',
      timestamp: new Date().toISOString(),
      data: symbols.reduce((acc, symbol) => {
        acc[symbol] = fields.reduce((fieldAcc, field) => {
          fieldAcc[field] = data.data?.find(d => d.identifier === symbol)?.[field] || null;
          return fieldAcc;
        }, {});
        return acc;
      }, {})
    };
  }

  normalizeFundamentals(data, symbol, metrics) {
    return {
      provider: 'bloomberg',
      timestamp: new Date().toISOString(),
      symbol,
      data: data.data?.map(period => ({
        date: period.date,
        metrics: metrics.reduce((acc, metric) => {
          acc[metric] = period[metric];
          return acc;
        }, {})
      })) || []
    };
  }

  normalizeEconomicData(data, indicators, countries) {
    return {
      provider: 'bloomberg',
      timestamp: new Date().toISOString(),
      data: indicators.reduce((acc, indicator) => {
        acc[indicator] = countries.reduce((countryAcc, country) => {
          countryAcc[country] = data.data?.filter(d =>
            d.identifier.includes(country) && d.identifier.includes(indicator)
          ) || [];
          return countryAcc;
        }, {});
        return acc;
      }, {})
    };
  }

  async waitForRateLimit() {
    const limiter = this.parent.rateLimiters.bloomberg;
    while (!limiter.acquire()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  getStartDate(period) {
    const date = new Date();
    const years = parseInt(period.replace(/[^0-9]/g, ''));
    date.setFullYear(date.getFullYear() - years);
    return date.toISOString().split('T')[0];
  }
}

/**
 * Refinitiv Eikon API Client
 */
class RefinitivClient {
  constructor(config, parent) {
    this.config = config;
    this.parent = parent;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Authorization': `Token ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getMarketData(symbols, fields, options = {}) {
    const { realTime = false } = options;
    const cacheKey = `refinitiv:market:${symbols.join(',')}:${fields.join(',')}`;

    const cached = await this.parent.getCachedData(cacheKey);
    if (cached && !realTime) return cached;

    await this.waitForRateLimit();

    const response = await this.client.post('/pricing/snapshots', {
      universe: symbols,
      fields: this.mapFields(fields)
    });

    const normalizedData = this.normalizeMarketData(response.data, symbols, fields);
    if (!realTime) {
      this.parent.setCachedData(cacheKey, normalizedData);
    }

    return normalizedData;
  }

  async getCompanyFundamentals(symbol, metrics, options = {}) {
    const { years = 5, quarterly = false } = options;
    const cacheKey = `refinitiv:fundamentals:${symbol}:${metrics.join(',')}:${years}:${quarterly}`;

    const cached = await this.parent.getCachedData(cacheKey);
    if (cached) return cached;

    await this.waitForRateLimit();

    const response = await this.client.post('/data/fundamental-and-reference', {
      universe: [symbol],
      fields: this.mapFundamentalFields(metrics),
      parameters: {
        SDate: this.getStartDate(`${years}y`),
        EDate: new Date().toISOString().split('T')[0],
        Period: quarterly ? 'FQ' : 'FY'
      }
    });

    const normalizedData = this.normalizeFundamentals(response.data, symbol, metrics);
    this.parent.setCachedData(cacheKey, normalizedData);

    return normalizedData;
  }

  async getESGData(symbol, metrics) {
    const cacheKey = `refinitiv:esg:${symbol}:${metrics.join(',')}`;

    const cached = await this.parent.getCachedData(cacheKey, 86400000); // 24 hours TTL
    if (cached) return cached;

    await this.waitForRateLimit();

    const response = await this.client.post('/data/environmental-social-governance', {
      universe: [symbol],
      fields: this.mapESGFields(metrics)
    });

    const normalizedData = this.normalizeESGData(response.data, symbol, metrics);
    this.parent.setCachedData(cacheKey, normalizedData);

    return normalizedData;
  }

  mapFields(fields) {
    const fieldMap = {
      'LAST_PRICE': 'CF_LAST',
      'CHG_PCT_1D': 'PCTCHNG',
      'VOLUME': 'ACVOL_1'
    };
    return fields.map(f => fieldMap[f] || f);
  }

  mapFundamentalFields(metrics) {
    const fieldMap = {
      'TOTAL_EQUITY': 'TR.F.TotShrhldrEqty',
      'TOTAL_DEBT': 'TR.F.TotDebt',
      'FREE_CASH_FLOW': 'TR.F.FreeCashFlow'
    };
    return metrics.map(m => fieldMap[m] || m);
  }

  mapESGFields(metrics) {
    const fieldMap = {
      'ESG_SCORE': 'TR.TRESGScore',
      'CARBON_EMISSIONS': 'TR.TRESGCScore',
      'GOVERNANCE_SCORE': 'TR.TRESGGScore'
    };
    return metrics.map(m => fieldMap[m] || m);
  }

  normalizeMarketData(data, symbols, fields) {
    return {
      provider: 'refinitiv',
      timestamp: new Date().toISOString(),
      data: symbols.reduce((acc, symbol) => {
        const symbolData = data.find(d => d.Instrument === symbol);
        acc[symbol] = fields.reduce((fieldAcc, field) => {
          fieldAcc[field] = symbolData?.[this.mapFields([field])[0]] || null;
          return fieldAcc;
        }, {});
        return acc;
      }, {})
    };
  }

  normalizeFundamentals(data, symbol, metrics) {
    return {
      provider: 'refinitiv',
      timestamp: new Date().toISOString(),
      symbol,
      data: data.map(period => ({
        date: period.Period,
        metrics: metrics.reduce((acc, metric) => {
          acc[metric] = period[this.mapFundamentalFields([metric])[0]];
          return acc;
        }, {})
      }))
    };
  }

  normalizeESGData(data, symbol, metrics) {
    return {
      provider: 'refinitiv',
      timestamp: new Date().toISOString(),
      symbol,
      data: metrics.reduce((acc, metric) => {
        acc[metric] = data[0]?.[this.mapESGFields([metric])[0]] || null;
        return acc;
      }, {})
    };
  }

  async waitForRateLimit() {
    const limiter = this.parent.rateLimiters.refinitiv;
    while (!limiter.acquire()) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  getStartDate(period) {
    const date = new Date();
    const years = parseInt(period.replace(/[^0-9]/g, ''));
    date.setFullYear(date.getFullYear() - years);
    return date.toISOString().split('T')[0];
  }
}

/**
 * S&P Capital IQ API Client
 */
class SPCapitalIQClient {
  constructor(config, parent) {
    this.config = config;
    this.parent = parent;
    this.sessionToken = null;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupAuthInterceptor();
  }

  setupAuthInterceptor() {
    this.client.interceptors.request.use(async(config) => {
      if (!this.sessionToken || this.isTokenExpired()) {
        await this.authenticate();
      }
      config.headers['Authorization'] = `Bearer ${this.sessionToken}`;
      return config;
    });
  }

  async authenticate() {
    const response = await axios.post(`${this.config.baseURL}/auth/login`, {
      username: this.config.username,
      password: this.config.password
    });

    this.sessionToken = response.data.token;
    this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
  }

  isTokenExpired() {
    return Date.now() >= (this.tokenExpiry - 60000); // Refresh 1 minute before expiry
  }

  async getCompanyFundamentals(symbol, metrics, options = {}) {
    const { years = 5, quarterly = false } = options;
    const cacheKey = `spciq:fundamentals:${symbol}:${metrics.join(',')}:${years}:${quarterly}`;

    const cached = await this.parent.getCachedData(cacheKey);
    if (cached) return cached;

    await this.waitForRateLimit();

    const response = await this.client.post('/companyfinancials/v3/financials', {
      ids: [symbol],
      mnemonics: this.mapFundamentalFields(metrics),
      periodType: quarterly ? 'IQ' : 'IY',
      periodCount: years * (quarterly ? 4 : 1)
    });

    const normalizedData = this.normalizeFundamentals(response.data, symbol, metrics);
    this.parent.setCachedData(cacheKey, normalizedData);

    return normalizedData;
  }

  async getMarketData(symbols, fields, options = {}) {
    const cacheKey = `spciq:market:${symbols.join(',')}:${fields.join(',')}`;

    const cached = await this.parent.getCachedData(cacheKey, 60000); // 1 minute TTL
    if (cached) return cached;

    await this.waitForRateLimit();

    const response = await this.client.post('/marketdata/v2/prices', {
      ids: symbols,
      mnemonics: this.mapMarketFields(fields)
    });

    const normalizedData = this.normalizeMarketData(response.data, symbols, fields);
    this.parent.setCachedData(cacheKey, normalizedData);

    return normalizedData;
  }

  mapFundamentalFields(metrics) {
    const fieldMap = {
      'TOTAL_EQUITY': 'IQ_TOTAL_EQUITY',
      'TOTAL_DEBT': 'IQ_TOTAL_DEBT',
      'FREE_CASH_FLOW': 'IQ_FREE_CASH_FLOW'
    };
    return metrics.map(m => fieldMap[m] || m);
  }

  mapMarketFields(fields) {
    const fieldMap = {
      'LAST_PRICE': 'IQ_CLOSEPRICE',
      'CHG_PCT_1D': 'IQ_PERCENT_CHANGE_1D',
      'VOLUME': 'IQ_VOLUME'
    };
    return fields.map(f => fieldMap[f] || f);
  }

  normalizeFundamentals(data, symbol, metrics) {
    return {
      provider: 'spCapitalIQ',
      timestamp: new Date().toISOString(),
      symbol,
      data: data.rows?.map(row => ({
        date: row.periodEndDate,
        metrics: metrics.reduce((acc, metric, index) => {
          acc[metric] = row.values[index];
          return acc;
        }, {})
      })) || []
    };
  }

  normalizeMarketData(data, symbols, fields) {
    return {
      provider: 'spCapitalIQ',
      timestamp: new Date().toISOString(),
      data: symbols.reduce((acc, symbol, index) => {
        acc[symbol] = fields.reduce((fieldAcc, field, fieldIndex) => {
          fieldAcc[field] = data.rows?.[index]?.values[fieldIndex] || null;
          return fieldAcc;
        }, {});
        return acc;
      }, {})
    };
  }

  async waitForRateLimit() {
    const limiter = this.parent.rateLimiters.spCapitalIQ;
    while (!limiter.acquire()) {
      await new Promise(resolve => setTimeout(resolve, 334)); // ~3 per second
    }
  }
}

export default PremiumDataIntegrationService;
