/**
 * Production Data Sources Integration
 * Real-time market data with multiple provider fallbacks
 */

import secureApiClient from './secureApiClient';

export class ProductionDataManager {
  constructor() {
    this.providers = [
      {
        name: 'alpha_vantage',
        priority: 1,
        enabled: !!process.env.VITE_ALPHA_VANTAGE_API_KEY,
        rateLimits: { calls: 5, period: 60000 }, // 5 calls per minute
        lastCall: 0,
        callCount: 0
      },
      {
        name: 'yahoo_finance',
        priority: 2,
        enabled: true,
        rateLimits: { calls: 100, period: 60000 }, // 100 calls per minute
        lastCall: 0,
        callCount: 0
      },
      {
        name: 'iex_cloud',
        priority: 3,
        enabled: !!process.env.VITE_IEX_CLOUD_TOKEN,
        rateLimits: { calls: 100, period: 60000 },
        lastCall: 0,
        callCount: 0
      },
      {
        name: 'finnhub',
        priority: 4,
        enabled: !!process.env.VITE_FINNHUB_API_KEY,
        rateLimits: { calls: 60, period: 60000 },
        lastCall: 0,
        callCount: 0
      }
    ];

    this.cache = new Map();
    this.cacheExpiry = 30000; // 30 seconds for real-time data
    this.requestQueue = new Map();
    
    // Initialize rate limiting
    this.resetRateLimits();
  }

  resetRateLimits() {
    setInterval(() => {
      this.providers.forEach(provider => {
        provider.callCount = 0;
        provider.lastCall = 0;
      });
    }, 60000); // Reset every minute
  }

  async getQuote(symbol) {
    const cacheKey = `quote_${symbol}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Prevent duplicate requests
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey);
    }

    const promise = this._fetchQuoteWithFallback(symbol);
    this.requestQueue.set(cacheKey, promise);

    try {
      const result = await promise;
      this.setCache(cacheKey, result);
      return result;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  async getHistoricalData(symbol, period = '1y', interval = '1d') {
    const cacheKey = `historical_${symbol}_${period}_${interval}`;
    const cached = this.getFromCache(cacheKey, 300000); // 5 minutes for historical data
    
    if (cached) {
      return cached;
    }

    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey);
    }

    const promise = this._fetchHistoricalWithFallback(symbol, period, interval);
    this.requestQueue.set(cacheKey, promise);

    try {
      const result = await promise;
      this.setCache(cacheKey, result, 300000);
      return result;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  async getMultipleQuotes(symbols) {
    const promises = symbols.map(symbol => this.getQuote(symbol));
    const results = await Promise.allSettled(promises);
    
    return symbols.reduce((acc, symbol, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        acc[symbol] = result.value;
      } else {
        console.warn(`Failed to fetch quote for ${symbol}:`, result.reason);
        acc[symbol] = this.generateMockQuote(symbol);
      }
      return acc;
    }, {});
  }

  async _fetchQuoteWithFallback(symbol) {
    const enabledProviders = this.providers
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const provider of enabledProviders) {
      if (!this.canMakeRequest(provider)) {
        continue;
      }

      try {
        this.recordRequest(provider);
        const data = await this._fetchQuoteFromProvider(symbol, provider);
        if (data) {
          return this.normalizeQuoteData(data, provider.name);
        }
      } catch (error) {
        console.warn(`${provider.name} failed for ${symbol}:`, error.message);
        continue;
      }
    }

    // All providers failed, return mock data
    console.warn(`All providers failed for ${symbol}, using mock data`);
    return this.generateMockQuote(symbol);
  }

  async _fetchHistoricalWithFallback(symbol, period, interval) {
    const enabledProviders = this.providers
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const provider of enabledProviders) {
      if (!this.canMakeRequest(provider)) {
        continue;
      }

      try {
        this.recordRequest(provider);
        const data = await this._fetchHistoricalFromProvider(symbol, period, interval, provider);
        if (data && data.length > 0) {
          return this.normalizeHistoricalData(data, provider.name);
        }
      } catch (error) {
        console.warn(`${provider.name} historical failed for ${symbol}:`, error.message);
        continue;
      }
    }

    // All providers failed, return mock data
    console.warn(`All providers failed for ${symbol} historical, using mock data`);
    return this.generateMockHistoricalData(symbol, period);
  }

  async _fetchQuoteFromProvider(symbol, provider) {
    switch (provider.name) {
      case 'alpha_vantage':
        return this._fetchAlphaVantageQuote(symbol);
      case 'yahoo_finance':
        return this._fetchYahooQuote(symbol);
      case 'iex_cloud':
        return this._fetchIEXQuote(symbol);
      case 'finnhub':
        return this._fetchFinnhubQuote(symbol);
      default:
        throw new Error(`Unknown provider: ${provider.name}`);
    }
  }

  async _fetchHistoricalFromProvider(symbol, period, interval, provider) {
    switch (provider.name) {
      case 'alpha_vantage':
        return this._fetchAlphaVantageHistorical(symbol, period, interval);
      case 'yahoo_finance':
        return this._fetchYahooHistorical(symbol, period, interval);
      case 'iex_cloud':
        return this._fetchIEXHistorical(symbol, period, interval);
      case 'finnhub':
        return this._fetchFinnhubHistorical(symbol, period, interval);
      default:
        throw new Error(`Unknown provider: ${provider.name}`);
    }
  }

  // Alpha Vantage implementation
  async _fetchAlphaVantageQuote(symbol) {
    const apiKey = process.env.VITE_ALPHA_VANTAGE_API_KEY;
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Error Message'] || data['Note']) {
      throw new Error(data['Error Message'] || data['Note']);
    }

    return data['Global Quote'];
  }

  async _fetchAlphaVantageHistorical(symbol, period, interval) {
    const apiKey = process.env.VITE_ALPHA_VANTAGE_API_KEY;
    const functionName = interval.includes('d') ? 'TIME_SERIES_DAILY' : 'TIME_SERIES_INTRADAY';
    const url = `https://www.alphavantage.co/query?function=${functionName}&symbol=${symbol}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Error Message'] || data['Note']) {
      throw new Error(data['Error Message'] || data['Note']);
    }

    const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
    return data[timeSeriesKey] ? Object.entries(data[timeSeriesKey]) : [];
  }

  // Yahoo Finance implementation (through proxy)
  async _fetchYahooQuote(symbol) {
    try {
      const response = await secureApiClient.get(`/api/market-data/yahoo/quote/${symbol}`);
      return response.data;
    } catch (error) {
      // Fallback to direct CORS proxy
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.chart.error) {
        throw new Error(data.chart.error.description);
      }

      return data.chart.result[0];
    }
  }

  async _fetchYahooHistorical(symbol, period, interval) {
    try {
      const response = await secureApiClient.get(`/api/market-data/yahoo/historical/${symbol}?period=${period}&interval=${interval}`);
      return response.data;
    } catch (error) {
      // Fallback to direct fetch with CORS proxy
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=0&period2=9999999999&interval=${interval}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.chart.error) {
        throw new Error(data.chart.error.description);
      }

      return data.chart.result[0];
    }
  }

  // IEX Cloud implementation
  async _fetchIEXQuote(symbol) {
    const token = process.env.VITE_IEX_CLOUD_TOKEN;
    const url = `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=${token}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`IEX API error: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async _fetchIEXHistorical(symbol, period, interval) {
    const token = process.env.VITE_IEX_CLOUD_TOKEN;
    const range = this.convertPeriodToIEXRange(period);
    const url = `https://cloud.iexapis.com/stable/stock/${symbol}/chart/${range}?token=${token}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`IEX API error: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Finnhub implementation
  async _fetchFinnhubQuote(symbol) {
    const apiKey = process.env.VITE_FINNHUB_API_KEY;
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  }

  async _fetchFinnhubHistorical(symbol, period, interval) {
    const apiKey = process.env.VITE_FINNHUB_API_KEY;
    const { from, to } = this.convertPeriodToTimestamp(period);
    const resolution = this.convertIntervalToFinnhub(interval);
    
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.s !== 'ok') {
      throw new Error('Finnhub API error');
    }
    
    return data;
  }

  // Data normalization methods
  normalizeQuoteData(data, provider) {
    switch (provider) {
      case 'alpha_vantage':
        return {
          symbol: data['01. symbol'],
          price: parseFloat(data['05. price']),
          change: parseFloat(data['09. change']),
          changePercent: parseFloat(data['10. change percent'].replace('%', '')),
          volume: parseInt(data['06. volume']),
          timestamp: data['07. latest trading day']
        };
      
      case 'yahoo_finance':
        const meta = data.meta;
        const indicators = data.indicators.quote[0];
        const current = indicators.close[indicators.close.length - 1];
        const previous = indicators.close[indicators.close.length - 2];
        
        return {
          symbol: meta.symbol,
          price: current,
          change: current - previous,
          changePercent: ((current - previous) / previous) * 100,
          volume: indicators.volume[indicators.volume.length - 1],
          timestamp: new Date().toISOString()
        };
      
      case 'iex_cloud':
        return {
          symbol: data.symbol,
          price: data.latestPrice,
          change: data.change,
          changePercent: data.changePercent * 100,
          volume: data.latestVolume,
          timestamp: data.latestUpdate
        };
      
      case 'finnhub':
        return {
          symbol: data.symbol,
          price: data.c,
          change: data.d,
          changePercent: data.dp,
          volume: null, // Not provided in quote endpoint
          timestamp: new Date().toISOString()
        };
      
      default:
        return data;
    }
  }

  normalizeHistoricalData(data, provider) {
    switch (provider) {
      case 'alpha_vantage':
        return data.map(([date, values]) => ({
          timestamp: date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume'])
        }));
      
      case 'yahoo_finance':
        const timestamps = data.timestamp;
        const indicators = data.indicators.quote[0];
        
        return timestamps.map((timestamp, index) => ({
          timestamp: new Date(timestamp * 1000).toISOString(),
          open: indicators.open[index],
          high: indicators.high[index],
          low: indicators.low[index],
          close: indicators.close[index],
          volume: indicators.volume[index]
        }));
      
      case 'iex_cloud':
        return data.map(item => ({
          timestamp: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume
        }));
      
      case 'finnhub':
        return data.t.map((timestamp, index) => ({
          timestamp: new Date(timestamp * 1000).toISOString(),
          open: data.o[index],
          high: data.h[index],
          low: data.l[index],
          close: data.c[index],
          volume: data.v[index]
        }));
      
      default:
        return data;
    }
  }

  // Rate limiting helpers
  canMakeRequest(provider) {
    const now = Date.now();
    const timeSinceReset = now - provider.lastCall;
    
    if (timeSinceReset > provider.rateLimits.period) {
      provider.callCount = 0;
    }
    
    return provider.callCount < provider.rateLimits.calls;
  }

  recordRequest(provider) {
    provider.callCount++;
    provider.lastCall = Date.now();
  }

  // Cache helpers
  getFromCache(key, expiry = this.cacheExpiry) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < expiry) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data, expiry = this.cacheExpiry) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
  }

  // Utility methods
  convertPeriodToIEXRange(period) {
    const periodMap = {
      '1d': '1d',
      '5d': '5d',
      '1m': '1m',
      '3m': '3m',
      '6m': '6m',
      '1y': '1y',
      '2y': '2y',
      '5y': '5y',
      'max': 'max'
    };
    return periodMap[period] || '1y';
  }

  convertPeriodToTimestamp(period) {
    const now = Math.floor(Date.now() / 1000);
    const periodMap = {
      '1d': 86400,
      '5d': 432000,
      '1m': 2592000,
      '3m': 7776000,
      '6m': 15552000,
      '1y': 31536000,
      '2y': 63072000,
      '5y': 157680000
    };
    
    const seconds = periodMap[period] || 31536000;
    return {
      from: now - seconds,
      to: now
    };
  }

  convertIntervalToFinnhub(interval) {
    const intervalMap = {
      '1m': '1',
      '5m': '5',
      '15m': '15',
      '30m': '30',
      '1h': '60',
      '1d': 'D',
      '1w': 'W',
      '1M': 'M'
    };
    return intervalMap[interval] || 'D';
  }

  // Mock data generators for fallback
  generateMockQuote(symbol) {
    const basePrice = this.getBasePriceForSymbol(symbol);
    const change = (Math.random() - 0.5) * 10;
    const price = basePrice + change;

    return {
      symbol,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(((change / basePrice) * 100).toFixed(2)),
      volume: Math.floor(Math.random() * 10000000),
      marketCap: price * Math.floor(Math.random() * 1000000000),
      timestamp: new Date().toISOString(),
      isMock: true
    };
  }

  generateMockHistoricalData(symbol, period) {
    const data = [];
    const basePrice = this.getBasePriceForSymbol(symbol);
    let currentPrice = basePrice;

    const intervals = this.getIntervalsForPeriod(period);
    
    for (let i = 0; i < intervals; i++) {
      const change = (Math.random() - 0.5) * 5;
      currentPrice += change;
      const volume = Math.floor(Math.random() * 1000000);

      data.push({
        timestamp: new Date(Date.now() - (intervals - i) * 24 * 60 * 60 * 1000).toISOString(),
        open: currentPrice - Math.random() * 2,
        high: currentPrice + Math.random() * 3,
        low: currentPrice - Math.random() * 3,
        close: currentPrice,
        volume,
        isMock: true
      });
    }

    return data;
  }

  getBasePriceForSymbol(symbol) {
    const priceMap = {
      'AAPL': 175,
      'MSFT': 280,
      'GOOGL': 2800,
      'AMZN': 3200,
      'TSLA': 250,
      'META': 300,
      'NVDA': 500,
      'BRK.B': 400,
      'V': 230,
      'JNJ': 160
    };
    return priceMap[symbol] || 100;
  }

  getIntervalsForPeriod(period) {
    const intervalMap = {
      '1d': 78,
      '5d': 390,
      '1m': 22,
      '3m': 65,
      '6m': 130,
      '1y': 252,
      '2y': 504,
      '5y': 1260
    };
    return intervalMap[period] || 252;
  }

  // Health monitoring
  getProviderStatus() {
    return this.providers.map(provider => ({
      name: provider.name,
      enabled: provider.enabled,
      callCount: provider.callCount,
      rateLimitRemaining: provider.rateLimits.calls - provider.callCount,
      lastCall: provider.lastCall ? new Date(provider.lastCall).toISOString() : null
    }));
  }

  clearCache() {
    this.cache.clear();
  }
}

// Create singleton instance
const productionDataManager = new ProductionDataManager();

export default productionDataManager;