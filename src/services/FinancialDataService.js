/**
 * Financial Data Service
 * Unified interface for all financial data operations
 * Combines real-time data, API integration, and data management
 */

import { realtimeDataService } from './realtime/RealtimeDataService.js';
import { apiIntegrationService } from './api/APIIntegrationService.js';
import { dataManagementService } from './data/DataManagementService.js';

class FinancialDataService {
  constructor() {
    this.initialized = false;
    this.services = {
      realtime: realtimeDataService,
      api: apiIntegrationService,
      data: dataManagementService
    };
  }

  /**
   * Initialize all financial data services
   */
  async initialize(options = {}) {
    if (this.initialized) return;

    try {
      console.log('Initializing Financial Data Service...');

      // Initialize all services concurrently
      const initPromises = [
        this.services.realtime.initialize(),
        this.services.api.initialize(),
        this.services.data // Data service doesn't need async init
      ];

      await Promise.all(initPromises);

      this.initialized = true;
      console.log('Financial Data Service initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Financial Data Service:', error);
      throw error;
    }
  }

  /**
   * Get real-time stock quote
   */
  async getQuote(symbol, options = {}) {
    const cacheKey = `quote_${symbol}`;
    const fallback = () => this.services.api.getQuote(symbol, options);

    const cached = await this.services.data.getData(cacheKey, { fallback });
    return cached?.data || null;
  }

  /**
   * Subscribe to real-time quote updates
   */
  async subscribeToQuote(symbol, callback, options = {}) {
    return await this.services.realtime.subscribe(symbol, {
      type: 'quote',
      callback: (data) => {
        // Cache the data
        this.services.data.store(`quote_${symbol}`, data, {
          type: 'quote',
          source: data.source,
          symbol
        });

        // Call user callback
        if (callback) callback(data);
      },
      ...options
    });
  }

  /**
   * Unsubscribe from real-time quote updates
   */
  async unsubscribeFromQuote(subscriptionKey) {
    return await this.services.realtime.unsubscribe(subscriptionKey);
  }

  /**
   * Get real-time trades
   */
  async getTrades(symbol, options = {}) {
    const { limit = 10, timeout = 10000 } = options;

    return new Promise((resolve, reject) => {
      const trades = [];
      const subscriptionKey = await this.services.realtime.subscribe(symbol, {
        type: 'trade',
        callback: (data) => {
          trades.push(data);

          // Cache individual trades
          this.services.data.store(`trade_${symbol}_${Date.now()}`, data, {
            type: 'trade',
            source: data.source,
            symbol,
            ttl: 3600000 // 1 hour
          });

          if (trades.length >= limit) {
            this.services.realtime.unsubscribe(subscriptionKey);
            resolve(trades);
          }
        }
      });

      // Timeout
      setTimeout(() => {
        this.services.realtime.unsubscribe(subscriptionKey);
        resolve(trades);
      }, timeout);
    });
  }

  /**
   * Get historical price data
   */
  async getHistoricalData(symbol, options = {}) {
    const {
      period = '1y',
      interval = '1day',
      from,
      to,
      provider = 'fmp'
    } = options;

    const cacheKey = `historical_${symbol}_${period}_${interval}_${from || ''}_${to || ''}`;

    const fallback = () => this.services.api.getHistoricalData(symbol, {
      period,
      interval,
      from,
      to,
      provider
    });

    const cached = await this.services.data.getData(cacheKey, {
      fallback,
      type: 'historical',
      source: provider,
      symbol
    });

    return cached?.data || null;
  }

  /**
   * Get financial news
   */
  async getNews(options = {}) {
    const {
      query = 'finance OR stocks OR market',
      limit = 50,
      provider = 'news-api'
    } = options;

    const cacheKey = `news_${query}_${limit}`;

    const fallback = () => this.services.api.getNews({
      query,
      provider
    });

    const cached = await this.services.data.getData(cacheKey, {
      fallback,
      type: 'news',
      ttl: 1800000 // 30 minutes
    });

    return cached?.data?.slice(0, limit) || [];
  }

  /**
   * Get economic indicators
   */
  async getEconomicData(indicator, options = {}) {
    const { provider = 'fred', limit = 100 } = options;

    const cacheKey = `economic_${indicator}_${limit}`;

    const fallback = () => this.services.api.getEconomicData(indicator, {
      provider
    });

    const cached = await this.services.data.getData(cacheKey, {
      fallback,
      type: 'economic',
      ttl: 3600000 // 1 hour
    });

    return cached?.data?.slice(-limit) || [];
  }

  /**
   * Get company financial statements
   */
  async getFinancialStatements(symbol, options = {}) {
    const {
      type = 'income-statement', // 'income-statement', 'balance-sheet', 'cash-flow'
      period = 'annual',
      limit = 5,
      provider = 'fmp'
    } = options;

    const cacheKey = `financials_${symbol}_${type}_${period}_${limit}`;

    const fallback = () => this.services.api.request(provider, type, {
      symbol,
      period,
      limit
    });

    const cached = await this.services.data.getData(cacheKey, {
      fallback,
      type: 'financials',
      source: provider,
      symbol,
      ttl: 86400000 // 24 hours
    });

    return cached?.data || null;
  }

  /**
   * Get technical indicators
   */
  async getTechnicalIndicators(symbol, indicator, options = {}) {
    const {
      period = 20,
      interval = '1day',
      provider = 'alphavantage'
    } = options;

    const cacheKey = `technical_${symbol}_${indicator}_${period}_${interval}`;

    const fallback = () => this.services.api.request(provider, 'technical', {
      symbol,
      function: indicator.toUpperCase(),
      interval,
      time_period: period
    });

    const cached = await this.services.data.getData(cacheKey, {
      fallback,
      type: 'technical',
      source: provider,
      symbol,
      ttl: 1800000 // 30 minutes
    });

    return cached?.data || null;
  }

  /**
   * Search for symbols
   */
  async searchSymbols(query, options = {}) {
    const { limit = 10, provider = 'fmp' } = options;

    const cacheKey = `search_${query}_${limit}`;

    const fallback = () => this.services.api.request(provider, 'search', {
      query,
      limit
    });

    const cached = await this.services.data.getData(cacheKey, {
      fallback,
      type: 'search',
      ttl: 3600000 // 1 hour
    });

    return cached?.data || [];
  }

  /**
   * Get market overview data
   */
  async getMarketOverview(options = {}) {
    const { provider = 'fmp' } = options;

    const cacheKey = 'market_overview';

    const fallback = () => this.services.api.request(provider, 'market-overview', {});

    const cached = await this.services.data.getData(cacheKey, {
      fallback,
      type: 'market',
      ttl: 300000 // 5 minutes
    });

    return cached?.data || {};
  }

  /**
   * Get sector performance
   */
  async getSectorPerformance(options = {}) {
    const { provider = 'fmp' } = options;

    const cacheKey = 'sector_performance';

    const fallback = () => this.services.api.request(provider, 'sector-performance', {});

    const cached = await this.services.data.getData(cacheKey, {
      fallback,
      type: 'sector',
      ttl: 300000 // 5 minutes
    });

    return cached?.data || [];
  }

  /**
   * Get forex rates
   */
  async getForexRates(fromCurrency = 'USD', toCurrency, options = {}) {
    const { provider = 'fmp' } = options;

    if (toCurrency) {
      const cacheKey = `forex_${fromCurrency}_${toCurrency}`;

      const fallback = () => this.services.api.request(provider, 'forex', {
        from: fromCurrency,
        to: toCurrency
      });

      const cached = await this.services.data.getData(cacheKey, {
        fallback,
        type: 'forex',
        ttl: 300000 // 5 minutes
      });

      return cached?.data || null;
    } else {
      // Get all forex rates
      const cacheKey = `forex_all_${fromCurrency}`;

      const fallback = () => this.services.api.request(provider, 'forex-all', {
        base: fromCurrency
      });

      const cached = await this.services.data.getData(cacheKey, {
        fallback,
        type: 'forex',
        ttl: 300000 // 5 minutes
      });

      return cached?.data || [];
    }
  }

  /**
   * Get cryptocurrency data
   */
  async getCryptoData(symbol, options = {}) {
    const {
      provider = 'fmp',
      type = 'quote' // 'quote', 'historical', 'market-cap'
    } = options;

    const cacheKey = `crypto_${symbol}_${type}`;

    const fallback = () => this.services.api.request(provider, `crypto-${type}`, {
      symbol
    });

    const cached = await this.services.data.getData(cacheKey, {
      fallback,
      type: 'crypto',
      source: provider,
      symbol,
      ttl: type === 'quote' ? 60000 : 300000 // 1 min for quotes, 5 min for others
    });

    return cached?.data || null;
  }

  /**
   * Batch operations for multiple symbols
   */
  async batchGetQuotes(symbols, options = {}) {
    const promises = symbols.map(symbol => this.getQuote(symbol, options));
    const results = await Promise.allSettled(promises);

    return symbols.reduce((acc, symbol, index) => {
      const result = results[index];
      acc[symbol] = result.status === 'fulfilled' ? result.value : null;
      return acc;
    }, {});
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      services: {
        realtime: this.services.realtime.getStatus(),
        api: this.services.api.getStatus(),
        data: this.services.data.getCacheStats()
      }
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.services.data.clearCache();
  }

  /**
   * Export data for backup
   */
  exportData(options = {}) {
    return this.services.data.exportData(options);
  }

  /**
   * Import data from backup
   */
  async importData(data, options = {}) {
    return await this.services.data.importData(data, options);
  }

  /**
   * Subscribe to real-time market data
   */
  async subscribeToMarketData(symbol, dataTypes = ['quote'], callback, options = {}) {
    const subscriptions = [];

    for (const dataType of dataTypes) {
      const subscriptionKey = await this.services.realtime.subscribe(symbol, {
        type: dataType,
        callback: (data) => {
          // Cache the data
          this.services.data.store(`${dataType}_${symbol}`, data, {
            type: dataType,
            source: data.source,
            symbol
          });

          // Call user callback
          if (callback) callback(data);
        },
        ...options
      });

      subscriptions.push(subscriptionKey);
    }

    return subscriptions;
  }

  /**
   * Unsubscribe from real-time market data
   */
  async unsubscribeFromMarketData(subscriptionKeys) {
    for (const key of subscriptionKeys) {
      await this.services.realtime.unsubscribe(key);
    }
  }

  /**
   * Get real-time connection status
   */
  getConnectionStatus() {
    return {
      realtime: this.services.realtime.getStatus(),
      api: this.services.api.getStatus()
    };
  }

  /**
   * Shutdown all services
   */
  async shutdown() {
    console.log('Shutting down Financial Data Service...');

    const shutdownPromises = [
      this.services.realtime.shutdown(),
      this.services.api.shutdown(),
      this.services.data.shutdown()
    ];

    await Promise.allSettled(shutdownPromises);

    this.initialized = false;

    console.log('Financial Data Service shutdown complete');
  }

  /**
   * Utility method to format currency
   */
  formatCurrency(value, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(value);
  }

  /**
   * Utility method to format percentage
   */
  formatPercentage(value, decimals = 2) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
  }

  /**
   * Utility method to format large numbers
   */
  formatLargeNumber(value) {
    if (Math.abs(value) >= 1e12) {
      return (value / 1e12).toFixed(1) + 'T';
    } else if (Math.abs(value) >= 1e9) {
      return (value / 1e9).toFixed(1) + 'B';
    } else if (Math.abs(value) >= 1e6) {
      return (value / 1e6).toFixed(1) + 'M';
    } else if (Math.abs(value) >= 1e3) {
      return (value / 1e3).toFixed(1) + 'K';
    }
    return value.toString();
  }

  /**
   * Get supported data providers
   */
  getSupportedProviders() {
    return {
      'alphavantage': {
        name: 'Alpha Vantage',
        types: ['stocks', 'forex', 'crypto', 'technical-indicators'],
        rateLimit: '5/minute (free), 75/minute (premium)',
        requiresApiKey: true
      },
      'fmp': {
        name: 'Financial Modeling Prep',
        types: ['stocks', 'crypto', 'forex', 'commodities', 'economic-indicators', 'financials'],
        rateLimit: '250/minute (free), 1000/minute (premium)',
        requiresApiKey: true
      },
      'yahoo': {
        name: 'Yahoo Finance',
        types: ['stocks', 'indices', 'currencies'],
        rateLimit: '100/minute',
        requiresApiKey: false
      },
      'polygon': {
        name: 'Polygon.io',
        types: ['stocks', 'options', 'forex', 'crypto'],
        rateLimit: '5/minute (free), 5/second (paid)',
        requiresApiKey: true
      },
      'twelve-data': {
        name: 'Twelve Data',
        types: ['stocks', 'forex', 'crypto', 'indices'],
        rateLimit: '800/minute',
        requiresApiKey: true
      },
      'news-api': {
        name: 'News API',
        types: ['news', 'headlines'],
        rateLimit: '100/day (free), 1000/day (paid)',
        requiresApiKey: true
      },
      'fred': {
        name: 'Federal Reserve Economic Data',
        types: ['economic-indicators', 'interest-rates', 'employment'],
        rateLimit: '120/minute',
        requiresApiKey: true
      }
    };
  }

  /**
   * Get data quality metrics
   */
  getDataQualityMetrics() {
    const cacheStats = this.services.data.getCacheStats();

    return {
      cacheHitRate: cacheStats.hitRate,
      dataProcessed: cacheStats.dataProcessed,
      errors: cacheStats.errors,
      connectionStatus: this.getConnectionStatus(),
      supportedProviders: Object.keys(this.getSupportedProviders()).length
    };
  }
}

// Export singleton instance
export const financialDataService = new FinancialDataService();

export default FinancialDataService;
