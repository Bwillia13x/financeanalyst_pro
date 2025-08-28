/**
 * Real-Time Data Service
 * Provides live market data feeds for the Living Model system
 * Enhanced with comprehensive market data and commodity feeds
 */

class RealTimeDataService {
  constructor() {
    this.subscribers = new Map();
    this.connections = new Map();
    this.dataCache = new Map();
    this.updateInterval = 500; // 500ms updates for smoother experience
    this.isActive = false;
    this.marketDataTypes = new Set([
      'stock_price',
      'interest_rates',
      'fx_rates',
      'commodity_prices',
      'volatility_index',
      'bond_yields',
      'economic_indicators'
    ]);
  }

  /**
   * Subscribe to real-time updates for a specific data type
   */
  subscribe(dataType, symbol, callback) {
    const key = `${dataType}_${symbol}`;

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    this.subscribers.get(key).add(callback);

    // Start the data feed if not already active
    if (!this.connections.has(key)) {
      this.startDataFeed(dataType, symbol);
    }

    // Return current cached data if available
    if (this.dataCache.has(key)) {
      callback(this.dataCache.get(key));
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(dataType, symbol, callback);
    };
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(dataType, symbol, callback) {
    const key = `${dataType}_${symbol}`;
    const subscribers = this.subscribers.get(key);

    if (subscribers) {
      subscribers.delete(callback);

      // Stop data feed if no more subscribers
      if (subscribers.size === 0) {
        this.stopDataFeed(key);
      }
    }
  }

  /**
   * Start a data feed for specific data type and symbol
   */
  startDataFeed(dataType, symbol) {
    const key = `${dataType}_${symbol}`;

    switch (dataType) {
      case 'stock_price':
        this.startStockPriceFeed(key, symbol);
        break;
      case 'interest_rates':
        this.startInterestRateFeed(key, symbol);
        break;
      case 'fx_rates':
        this.startFXRateFeed(key, symbol);
        break;
      case 'commodity_prices':
        this.startCommodityFeed(key, symbol);
        break;
      case 'bond_yields':
        this.startBondYieldFeed(key, symbol);
        break;
      case 'volatility_index':
        this.startVolatilityFeed(key, symbol);
        break;
      case 'economic_indicators':
        this.startEconomicIndicatorFeed(key, symbol);
        break;
      default:
        console.warn(`Unknown data type: ${dataType}`);
    }
  }

  /**
   * Stock Price Feed (simulated real-time data)
   */
  startStockPriceFeed(key, symbol) {
    const basePrice = this.getBasePrice(symbol);
    let lastPrice = basePrice;

    const interval = setInterval(() => {
      // Simulate realistic price movement
      const volatility = 0.02;
      const drift = 0.0001;
      const dt = this.updateInterval / (1000 * 60 * 60 * 24);

      const randomShock = (Math.random() - 0.5) * 2;
      const priceChange = lastPrice * (drift * dt + volatility * Math.sqrt(dt) * randomShock);

      lastPrice = Math.max(0.01, lastPrice + priceChange);

      const data = {
        symbol,
        price: lastPrice,
        change: lastPrice - basePrice,
        changePercent: ((lastPrice - basePrice) / basePrice) * 100,
        timestamp: new Date().toISOString(),
        marketOpen: this.isMarketOpen()
      };

      this.updateSubscribers(key, data);
    }, this.updateInterval);

    this.connections.set(key, interval);
  }

  /**
   * Interest Rate Feed
   */
  startInterestRateFeed(key, symbol) {
    let baseRate = this.getBaseInterestRate(symbol);

    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 0.01;
      baseRate = Math.max(0, baseRate + change);

      const data = {
        symbol,
        rate: baseRate,
        timestamp: new Date().toISOString()
      };

      this.updateSubscribers(key, data);
    }, this.updateInterval * 5);

    this.connections.set(key, interval);
  }

  updateSubscribers(key, data) {
    this.dataCache.set(key, data);
    const subscribers = this.subscribers.get(key);

    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
  }

  stopDataFeed(key) {
    const connection = this.connections.get(key);
    if (connection) {
      clearInterval(connection);
      this.connections.delete(key);
      this.dataCache.delete(key);
    }
  }

  getBasePrice(symbol) {
    const basePrices = {
      AAPL: 175.84,
      MSFT: 378.85,
      GOOGL: 142.56,
      TSLA: 248.42,
      AMZN: 151.94
    };
    return basePrices[symbol] || 100;
  }

  getBaseInterestRate(symbol) {
    const rates = {
      USD_3M: 5.25,
      USD_10Y: 4.15,
      EUR_3M: 3.85,
      EUR_10Y: 2.45
    };
    return rates[symbol] || 4.0;
  }

  isMarketOpen() {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
  }

  /**
   * Foreign Exchange Rate Feed
   */
  startFXRateFeed(key, symbol) {
    let baseRate = this.getBaseFXRate(symbol);

    const interval = setInterval(() => {
      const volatility = 0.005;
      const change = (Math.random() - 0.5) * 2 * volatility;
      baseRate = Math.max(0.01, baseRate * (1 + change));

      const data = {
        symbol,
        rate: baseRate,
        change: change * 100,
        timestamp: new Date().toISOString()
      };

      this.updateSubscribers(key, data);
    }, this.updateInterval);

    this.connections.set(key, interval);
  }

  /**
   * Commodity Price Feed
   */
  startCommodityFeed(key, symbol) {
    let basePrice = this.getBaseCommodityPrice(symbol);

    const interval = setInterval(() => {
      const volatility = symbol === 'OIL' ? 0.03 : 0.02;
      const change = (Math.random() - 0.5) * 2 * volatility;
      basePrice = Math.max(1, basePrice * (1 + change));

      const data = {
        symbol,
        price: basePrice,
        change: change * 100,
        timestamp: new Date().toISOString()
      };

      this.updateSubscribers(key, data);
    }, this.updateInterval * 2);

    this.connections.set(key, interval);
  }

  /**
   * Bond Yield Feed
   */
  startBondYieldFeed(key, symbol) {
    let baseYield = this.getBaseBondYield(symbol);

    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 0.02;
      baseYield = Math.max(0, baseYield + change);

      const data = {
        symbol,
        yield: baseYield,
        timestamp: new Date().toISOString()
      };

      this.updateSubscribers(key, data);
    }, this.updateInterval * 3);

    this.connections.set(key, interval);
  }

  /**
   * Volatility Index Feed
   */
  startVolatilityFeed(key, symbol) {
    let baseVol = this.getBaseVolatility(symbol);

    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 2;
      baseVol = Math.max(5, Math.min(80, baseVol + change));

      const data = {
        symbol,
        volatility: baseVol,
        timestamp: new Date().toISOString()
      };

      this.updateSubscribers(key, data);
    }, this.updateInterval * 4);

    this.connections.set(key, interval);
  }

  /**
   * Economic Indicator Feed
   */
  startEconomicIndicatorFeed(key, symbol) {
    let baseValue = this.getBaseEconomicIndicator(symbol);

    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 0.1;
      baseValue = Math.max(0, baseValue + change);

      const data = {
        symbol,
        value: baseValue,
        timestamp: new Date().toISOString()
      };

      this.updateSubscribers(key, data);
    }, this.updateInterval * 10);

    this.connections.set(key, interval);
  }

  getBaseFXRate(symbol) {
    const rates = {
      EURUSD: 1.085,
      GBPUSD: 1.265,
      USDJPY: 149.5,
      USDCHF: 0.875,
      AUDUSD: 0.658
    };
    return rates[symbol] || 1.0;
  }

  getBaseCommodityPrice(symbol) {
    const prices = {
      OIL: 85.5,
      GOLD: 2050.0,
      SILVER: 24.8,
      COPPER: 8.2,
      NATGAS: 3.15
    };
    return prices[symbol] || 50.0;
  }

  getBaseBondYield(symbol) {
    const yields = {
      US10Y: 4.25,
      US2Y: 4.85,
      DE10Y: 2.35,
      GB10Y: 4.15,
      JP10Y: 0.75
    };
    return yields[symbol] || 3.0;
  }

  getBaseVolatility(symbol) {
    const volatilities = {
      VIX: 18.5,
      VVIX: 95.2,
      MOVE: 105.8
    };
    return volatilities[symbol] || 20.0;
  }

  getBaseEconomicIndicator(symbol) {
    const indicators = {
      GDP_GROWTH: 2.4,
      INFLATION: 3.2,
      UNEMPLOYMENT: 3.8,
      CONSUMER_CONF: 102.5
    };
    return indicators[symbol] || 100.0;
  }

  getCurrentData(dataType, symbol) {
    const key = `${dataType}_${symbol}`;
    return this.dataCache.get(key);
  }

  /**
   * Get all available data types
   */
  getAvailableDataTypes() {
    return Array.from(this.marketDataTypes);
  }

  /**
   * Subscribe to multiple data feeds at once
   */
  subscribeMultiple(subscriptions) {
    const unsubscribeFunctions = [];

    subscriptions.forEach(({ dataType, symbol, callback }) => {
      const unsubscribe = this.subscribe(dataType, symbol, callback);
      unsubscribeFunctions.push(unsubscribe);
    });

    return () => {
      unsubscribeFunctions.forEach(fn => fn());
    };
  }

  /**
   * Cleanup method for tests
   */
  cleanup() {
    // Clear all subscribers
    this.subscribers.clear();

    // Clear all connections
    this.connections.forEach(interval => {
      clearInterval(interval);
    });
    this.connections.clear();

    // Clear data cache
    this.dataCache.clear();

    this.isActive = false;
  }

  /**
   * Get active subscriptions (for testing)
   */
  getActiveSubscriptions() {
    const activeSubs = [];
    this.subscribers.forEach((callbacks, key) => {
      if (callbacks.size > 0) {
        const idx = key.lastIndexOf('_');
        const dataType = key.slice(0, idx);
        const symbol = key.slice(idx + 1);
        activeSubs.push({
          id: key,
          symbol,
          dataType,
          subscriberCount: callbacks.size
        });
      }
    });
    return activeSubs;
  }

  /**
   * Get connection status (for testing)
   */
  getConnectionStatus() {
    const status = {};
    this.connections.forEach((interval, key) => {
      const idx = key.lastIndexOf('_');
      const dataType = key.slice(0, idx);
      const symbol = key.slice(idx + 1);
      if (!status[symbol]) {
        status[symbol] = {};
      }
      status[symbol][dataType] = {
        status: 'connected',
        subscriberCount: this.subscribers.get(key)?.size || 0
      };
    });
    return status;
  }
}

const realTimeDataService = new RealTimeDataService();
export default realTimeDataService;
