/**
 * Real-time Data Service
 * Provides live market data, news, and economic indicators
 * Handles WebSocket connections, data normalization, and caching
 */

class RealtimeDataService {
  constructor(options = {}) {
    this.options = {
      maxConnections: 10,
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      cacheTimeout: 300000, // 5 minutes
      ...options
    };

    this.connections = new Map();
    this.subscriptions = new Map();
    this.cache = new Map();
    this.providers = new Map();
    this.listeners = new Map();
    this.isInitialized = false;
    this.heartbeatTimer = null;
  }

  /**
   * Initialize the real-time data service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize data providers
      await this.initializeProviders();

      // Start heartbeat monitoring
      this.startHeartbeat();

      // Setup connection monitoring
      this.setupConnectionMonitoring();

      this.isInitialized = true;
      this.emit('initialized', { timestamp: new Date() });

      console.log('Real-time Data Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Real-time Data Service:', error);
      throw error;
    }
  }

  /**
   * Initialize data providers
   */
  async initializeProviders() {
    const providers = ['alphavantage', 'fmp', 'yahoo', 'polygon', 'twelve-data'];

    for (const provider of providers) {
      try {
        await this.initializeProvider(provider);
      } catch (error) {
        console.warn(`Failed to initialize provider ${provider}:`, error);
      }
    }
  }

  /**
   * Initialize specific data provider
   */
  async initializeProvider(providerName) {
    const providerConfig = this.getProviderConfig(providerName);

    if (!providerConfig) {
      throw new Error(`Provider ${providerName} not supported`);
    }

    const provider = {
      name: providerName,
      config: providerConfig,
      connection: null,
      status: 'disconnected',
      lastHeartbeat: null,
      reconnectAttempts: 0
    };

    this.providers.set(providerName, provider);

    // Attempt initial connection
    if (providerConfig.autoConnect) {
      await this.connectProvider(providerName);
    }
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(providerName) {
    const configs = {
      alphavantage: {
        websocketUrl: 'wss://ws.alphavantage.co',
        restUrl: 'https://www.alphavantage.co',
        requiresApiKey: true,
        autoConnect: true,
        supportedDataTypes: ['stocks', 'forex', 'crypto', 'technical-indicators']
      },
      fmp: {
        websocketUrl: 'wss://websockets.financialmodelingprep.com',
        restUrl: 'https://financialmodelingprep.com',
        requiresApiKey: true,
        autoConnect: true,
        supportedDataTypes: ['stocks', 'forex', 'crypto', 'commodities', 'economic-indicators']
      },
      yahoo: {
        websocketUrl: 'wss://streamer.finance.yahoo.com',
        restUrl: 'https://query1.finance.yahoo.com',
        requiresApiKey: false,
        autoConnect: true,
        supportedDataTypes: ['stocks', 'indices', 'currencies']
      },
      polygon: {
        websocketUrl: 'wss://socket.polygon.io',
        restUrl: 'https://api.polygon.io',
        requiresApiKey: true,
        autoConnect: false,
        supportedDataTypes: ['stocks', 'options', 'forex', 'crypto']
      },
      'twelve-data': {
        websocketUrl: 'wss://ws.twelvedata.com',
        restUrl: 'https://api.twelvedata.com',
        requiresApiKey: true,
        autoConnect: false,
        supportedDataTypes: ['stocks', 'forex', 'crypto', 'indices']
      }
    };

    return configs[providerName];
  }

  /**
   * Connect to a data provider
   */
  async connectProvider(providerName) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    if (provider.connection && provider.status === 'connected') {
      return; // Already connected
    }

    try {
      const connection = await this.createWebSocketConnection(provider);

      provider.connection = connection;
      provider.status = 'connecting';

      connection.onopen = () => {
        console.log(`Connected to ${providerName}`);
        provider.status = 'connected';
        provider.reconnectAttempts = 0;
        provider.lastHeartbeat = Date.now();

        this.emit('providerConnected', { provider: providerName });
      };

      connection.onmessage = event => {
        this.handleProviderMessage(providerName, event.data);
      };

      connection.onclose = () => {
        console.log(`Disconnected from ${providerName}`);
        provider.status = 'disconnected';
        provider.connection = null;

        this.emit('providerDisconnected', { provider: providerName });

        // Attempt reconnection
        this.scheduleReconnection(providerName);
      };

      connection.onerror = error => {
        console.error(`WebSocket error for ${providerName}:`, error);
        provider.status = 'error';

        this.emit('providerError', { provider: providerName, error });
      };
    } catch (error) {
      console.error(`Failed to connect to ${providerName}:`, error);
      provider.status = 'error';

      // Schedule reconnection
      this.scheduleReconnection(providerName);

      throw error;
    }
  }

  /**
   * Create WebSocket connection for provider
   */
  async createWebSocketConnection(provider) {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(provider.config.websocketUrl);

        // Set connection timeout
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error(`Connection timeout for ${provider.name}`));
        }, 10000);

        ws.onopen = () => {
          clearTimeout(timeout);
          resolve(ws);
        };

        ws.onerror = error => {
          clearTimeout(timeout);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle messages from data providers
   */
  handleProviderMessage(providerName, data) {
    try {
      const parsedData = JSON.parse(data);

      // Normalize data format
      const normalizedData = this.normalizeProviderData(providerName, parsedData);

      if (normalizedData) {
        // Cache the data
        this.cacheData(normalizedData);

        // Emit data event
        this.emit('dataReceived', normalizedData);

        // Forward to subscribers
        this.forwardToSubscribers(normalizedData);
      }
    } catch (error) {
      console.error(`Failed to handle message from ${providerName}:`, error);
    }
  }

  /**
   * Normalize data from different providers to unified format
   */
  normalizeProviderData(providerName, data) {
    const normalizers = {
      alphavantage: this.normalizeAlphaVantageData.bind(this),
      fmp: this.normalizeFMPData.bind(this),
      yahoo: this.normalizeYahooData.bind(this),
      polygon: this.normalizePolygonData.bind(this),
      'twelve-data': this.normalizeTwelveDataData.bind(this)
    };

    const normalizer = normalizers[providerName];
    return normalizer ? normalizer(data) : data;
  }

  /**
   * Normalize Alpha Vantage data
   */
  normalizeAlphaVantageData(data) {
    // Alpha Vantage WebSocket format
    if (data.type === 'trade') {
      return {
        symbol: data.symbol,
        price: parseFloat(data.price),
        volume: parseInt(data.volume),
        timestamp: new Date(data.timestamp),
        source: 'alphavantage',
        type: 'trade'
      };
    }

    return null;
  }

  /**
   * Normalize FMP data
   */
  normalizeFMPData(data) {
    if (data.type === 'stock') {
      return {
        symbol: data.symbol,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        volume: data.volume,
        timestamp: new Date(),
        source: 'fmp',
        type: 'quote'
      };
    }

    return null;
  }

  /**
   * Normalize Yahoo data
   */
  normalizeYahooData(data) {
    return {
      symbol: data.id,
      price: data.price,
      change: data.change,
      changePercent: data.changePercent,
      volume: data.volume,
      timestamp: new Date(),
      source: 'yahoo',
      type: 'quote'
    };
  }

  /**
   * Normalize Polygon data
   */
  normalizePolygonData(data) {
    if (data.ev === 'T') {
      // Trade event
      return {
        symbol: data.sym,
        price: data.p,
        volume: data.s,
        timestamp: new Date(data.t / 1000000), // Convert nanoseconds to milliseconds
        source: 'polygon',
        type: 'trade'
      };
    }

    return null;
  }

  /**
   * Normalize Twelve Data
   */
  normalizeTwelveDataData(data) {
    return {
      symbol: data.symbol,
      price: data.price,
      timestamp: new Date(data.timestamp),
      source: 'twelve-data',
      type: 'quote'
    };
  }

  /**
   * Cache data with TTL
   */
  cacheData(data) {
    const key = `${data.source}_${data.symbol}_${data.type}`;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.options.cacheTimeout
    });

    // Clean expired cache entries
    this.cleanExpiredCache();
  }

  /**
   * Clean expired cache entries
   */
  cleanExpiredCache() {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cached data
   */
  getCachedData(symbol, type = 'quote', source = null) {
    const keys = source
      ? [`${source}_${symbol}_${type}`]
      : ['alphavantage', 'fmp', 'yahoo', 'polygon', 'twelve-data'].map(
          s => `${s}_${symbol}_${type}`
        );

    for (const key of keys) {
      const entry = this.cache.get(key);
      if (entry && Date.now() - entry.timestamp < entry.ttl) {
        return entry.data;
      }
    }

    return null;
  }

  /**
   * Subscribe to real-time data
   */
  async subscribe(symbol, options = {}) {
    const subscriptionKey = `${symbol}_${options.type || 'quote'}`;
    const subscription = {
      symbol,
      type: options.type || 'quote',
      providers: options.providers || ['alphavantage', 'fmp', 'yahoo'],
      callback: options.callback,
      active: true,
      created: new Date()
    };

    this.subscriptions.set(subscriptionKey, subscription);

    // Send subscription requests to providers
    for (const provider of subscription.providers) {
      await this.subscribeToProvider(provider, symbol, subscription.type);
    }

    this.emit('subscribed', { symbol, type: subscription.type });

    return subscriptionKey;
  }

  /**
   * Unsubscribe from real-time data
   */
  async unsubscribe(subscriptionKey) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (!subscription) return;

    subscription.active = false;

    // Send unsubscribe requests to providers
    for (const provider of subscription.providers) {
      await this.unsubscribeFromProvider(provider, subscription.symbol, subscription.type);
    }

    this.subscriptions.delete(subscriptionKey);

    this.emit('unsubscribed', { symbol: subscription.symbol, type: subscription.type });
  }

  /**
   * Subscribe to specific provider
   */
  async subscribeToProvider(providerName, symbol, type) {
    const provider = this.providers.get(providerName);
    if (!provider || !provider.connection) return;

    const subscriptionMessage = this.createSubscriptionMessage(providerName, symbol, type);

    if (subscriptionMessage) {
      provider.connection.send(JSON.stringify(subscriptionMessage));
    }
  }

  /**
   * Unsubscribe from specific provider
   */
  async unsubscribeFromProvider(providerName, symbol, type) {
    const provider = this.providers.get(providerName);
    if (!provider || !provider.connection) return;

    const unsubscribeMessage = this.createUnsubscriptionMessage(providerName, symbol, type);

    if (unsubscribeMessage) {
      provider.connection.send(JSON.stringify(unsubscribeMessage));
    }
  }

  /**
   * Create subscription message for provider
   */
  createSubscriptionMessage(providerName, symbol, type) {
    const messages = {
      alphavantage: {
        action: 'subscribe',
        symbols: [symbol],
        type: type
      },
      fmp: {
        type: 'subscribe',
        symbol: symbol,
        event: type
      },
      yahoo: {
        subscribe: [symbol]
      },
      polygon: {
        action: 'subscribe',
        params: `T.${symbol}`
      },
      'twelve-data': {
        action: 'subscribe',
        symbols: [symbol]
      }
    };

    return messages[providerName];
  }

  /**
   * Create unsubscription message for provider
   */
  createUnsubscriptionMessage(providerName, symbol, type) {
    const messages = {
      alphavantage: {
        action: 'unsubscribe',
        symbols: [symbol],
        type: type
      },
      fmp: {
        type: 'unsubscribe',
        symbol: symbol,
        event: type
      },
      yahoo: {
        unsubscribe: [symbol]
      },
      polygon: {
        action: 'unsubscribe',
        params: `T.${symbol}`
      },
      'twelve-data': {
        action: 'unsubscribe',
        symbols: [symbol]
      }
    };

    return messages[providerName];
  }

  /**
   * Forward data to subscribers
   */
  forwardToSubscribers(data) {
    const subscriptionKey = `${data.symbol}_${data.type}`;

    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription && subscription.active && subscription.callback) {
      try {
        subscription.callback(data);
      } catch (error) {
        console.error('Error in subscription callback:', error);
      }
    }
  }

  /**
   * Get real-time quote
   */
  async getQuote(symbol, options = {}) {
    // Check cache first
    const cached = this.getCachedData(symbol, 'quote');
    if (cached && !options.forceRefresh) {
      return cached;
    }

    // Subscribe to get real-time data
    const subscriptionKey = await this.subscribe(symbol, { type: 'quote', ...options });

    // Wait for data or timeout
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.unsubscribe(subscriptionKey);
        reject(new Error(`Timeout getting quote for ${symbol}`));
      }, options.timeout || 5000);

      const callback = data => {
        if (data.symbol === symbol && data.type === 'quote') {
          clearTimeout(timeout);
          this.unsubscribe(subscriptionKey);
          resolve(data);
        }
      };

      // Update subscription with callback
      const subscription = this.subscriptions.get(subscriptionKey);
      if (subscription) {
        subscription.callback = callback;
      }
    });
  }

  /**
   * Get real-time trades
   */
  getTrades(symbol, options = {}) {
    return new Promise((resolve, reject) => {
      const trades = [];
      const maxTrades = options.limit || 10;
      let subscriptionKey;

      this.subscribe(symbol, {
        type: 'trade',
        callback: data => {
          if (data.symbol === symbol && data.type === 'trade') {
            trades.push(data);

            if (trades.length >= maxTrades) {
              this.unsubscribe(subscriptionKey);
              resolve(trades);
            }
          }
        }
      })
        .then(key => {
          subscriptionKey = key;

          // Timeout after specified duration
          setTimeout(() => {
            this.unsubscribe(subscriptionKey);
            resolve(trades);
          }, options.timeout || 10000);
        })
        .catch(reject);
    });
  }

  /**
   * Schedule reconnection for provider
   */
  scheduleReconnection(providerName) {
    const provider = this.providers.get(providerName);
    if (!provider) return;

    if (provider.reconnectAttempts >= this.options.reconnectAttempts) {
      console.error(`Max reconnection attempts reached for ${providerName}`);
      return;
    }

    provider.reconnectAttempts++;

    const delay = this.options.reconnectDelay * Math.pow(2, provider.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(
        `Attempting reconnection to ${providerName} (attempt ${provider.reconnectAttempts})`
      );
      this.connectProvider(providerName);
    }, delay);
  }

  /**
   * Start heartbeat monitoring
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.options.heartbeatInterval);
  }

  /**
   * Send heartbeat to all connected providers
   */
  sendHeartbeat() {
    for (const [providerName, provider] of this.providers.entries()) {
      if (provider.connection && provider.status === 'connected') {
        try {
          // Send ping/pong or provider-specific heartbeat
          this.sendHeartbeatToProvider(providerName);
          provider.lastHeartbeat = Date.now();
        } catch (error) {
          console.error(`Heartbeat failed for ${providerName}:`, error);
          provider.status = 'error';
        }
      }
    }
  }

  /**
   * Send heartbeat to specific provider
   */
  sendHeartbeatToProvider(providerName) {
    const provider = this.providers.get(providerName);
    if (!provider || !provider.connection) return;

    const heartbeatMessages = {
      alphavantage: { action: 'ping' },
      fmp: { type: 'ping' },
      yahoo: { ping: true },
      polygon: { action: 'ping' },
      'twelve-data': { action: 'ping' }
    };

    const message = heartbeatMessages[providerName];
    if (message) {
      provider.connection.send(JSON.stringify(message));
    }
  }

  /**
   * Setup connection monitoring
   */
  setupConnectionMonitoring() {
    // Monitor connection health
    setInterval(() => {
      const now = Date.now();

      for (const [providerName, provider] of this.providers.entries()) {
        if (provider.status === 'connected' && provider.lastHeartbeat) {
          const timeSinceHeartbeat = now - provider.lastHeartbeat;

          if (timeSinceHeartbeat > this.options.heartbeatInterval * 2) {
            console.warn(`No heartbeat from ${providerName} for ${timeSinceHeartbeat}ms`);
            provider.status = 'stale';

            // Force reconnection
            if (provider.connection) {
              provider.connection.close();
            }
          }
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Event emitter functionality
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    const providerStatus = {};
    for (const [name, provider] of this.providers.entries()) {
      providerStatus[name] = {
        status: provider.status,
        lastHeartbeat: provider.lastHeartbeat,
        reconnectAttempts: provider.reconnectAttempts
      };
    }

    return {
      initialized: this.isInitialized,
      providers: providerStatus,
      activeSubscriptions: this.subscriptions.size,
      cacheSize: this.cache.size,
      uptime: this.isInitialized ? Date.now() - (this.startTime || Date.now()) : 0
    };
  }

  /**
   * Shutdown the service
   */
  async shutdown() {
    console.log('Shutting down Real-time Data Service...');

    // Clear heartbeat timer
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Close all connections
    for (const [providerName, provider] of this.providers.entries()) {
      if (provider.connection) {
        try {
          provider.connection.close();
        } catch (error) {
          console.error(`Error closing connection to ${providerName}:`, error);
        }
      }
    }

    // Clear subscriptions and cache
    this.subscriptions.clear();
    this.cache.clear();
    this.connections.clear();

    this.isInitialized = false;

    console.log('Real-time Data Service shutdown complete');
  }
}

// Export singleton instance
export const realtimeDataService = new RealtimeDataService({
  maxConnections: 10,
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  heartbeatInterval: 30000,
  cacheTimeout: 300000
});

export default RealtimeDataService;
