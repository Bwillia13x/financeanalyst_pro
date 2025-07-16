import { apiLogger } from '../utils/apiLogger.js';

import { dataFetchingService } from './dataFetching.js';

/**
 * Real-time data service for live market data feeds
 * Handles WebSocket connections, polling, and data streaming
 */
class RealTimeDataService {
  constructor() {
    this.subscribers = new Map();
    this.activeStreams = new Map();
    this.pollingIntervals = new Map();
    this.connectionStatus = new Map();
    this.lastUpdateTimes = new Map();

    // Configuration for different data types
    this.updateIntervals = {
      marketData: 5000,      // 5 seconds for market data
      quotes: 1000,          // 1 second for real-time quotes
      news: 30000,           // 30 seconds for news
      fundamentals: 300000   // 5 minutes for fundamental data
    };

    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  /**
   * Subscribe to real-time data for a symbol
   * @param {string} symbol - Stock symbol
   * @param {string} dataType - Type of data (marketData, quotes, news)
   * @param {Function} callback - Callback function for data updates
   * @returns {string} Subscription ID
   */
  subscribe(symbol, dataType, callback) {
    const subscriptionId = `${symbol}_${dataType}_${Date.now()}`;
    const key = `${symbol}_${dataType}`;

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Map());
    }

    this.subscribers.get(key).set(subscriptionId, callback);

    // Start streaming if this is the first subscriber for this symbol/dataType
    if (this.subscribers.get(key).size === 1) {
      this.startStream(symbol, dataType);
    }

    apiLogger.log('INFO', `Subscribed to ${dataType} for ${symbol}`, {
      subscriptionId,
      totalSubscribers: this.subscribers.get(key).size
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from real-time data
   * @param {string} subscriptionId - Subscription ID to remove
   */
  unsubscribe(subscriptionId) {
    for (const [key, subscribers] of this.subscribers.entries()) {
      if (subscribers.has(subscriptionId)) {
        subscribers.delete(subscriptionId);

        // Stop streaming if no more subscribers
        if (subscribers.size === 0) {
          const [symbol, dataType] = key.split('_');
          this.stopStream(symbol, dataType);
          this.subscribers.delete(key); // Remove the key if no subscribers are left
        }

        apiLogger.log('INFO', `Unsubscribed from ${key}`, {
          subscriptionId,
          remainingSubscribers: subscribers.size
        });
        break;
      }
    }
  }

  /**
   * Start real-time data stream for a symbol and data type
   * @param {string} symbol - Stock symbol
   * @param {string} dataType - Type of data
   */
  async startStream(symbol, dataType) {
    const key = `${symbol}_${dataType}`;

    if (this.activeStreams.has(key)) {
      return; // Already streaming
    }

    this.activeStreams.set(key, true);
    this.connectionStatus.set(key, 'connecting');

    try {
      // Try WebSocket connection first (if available)
      if (this.supportsWebSocket(dataType)) {
        await this.startWebSocketStream(symbol, dataType);
      } else {
        // Fallback to polling
        await this.startPollingStream(symbol, dataType);
      }

      this.connectionStatus.set(key, 'connected');
      apiLogger.log('INFO', `Started real-time stream for ${symbol} ${dataType}`);

    } catch (error) {
      this.connectionStatus.set(key, 'error');
      apiLogger.log('ERROR', `Failed to start stream for ${symbol} ${dataType}`, { error: error.message });

      // Fallback to polling if WebSocket fails
      if (this.supportsWebSocket(dataType)) {
        await this.startPollingStream(symbol, dataType);
      }
    }
  }

  /**
   * Stop real-time data stream
   * @param {string} symbol - Stock symbol
   * @param {string} dataType - Type of data
   */
  stopStream(symbol, dataType) {
    const key = `${symbol}_${dataType}`;

    // Clear polling interval
    if (this.pollingIntervals.has(key)) {
      clearInterval(this.pollingIntervals.get(key));
      this.pollingIntervals.delete(key);
    }

    // Close WebSocket if exists
    if (this.activeStreams.has(key)) {
      this.activeStreams.delete(key);
    }

    this.connectionStatus.set(key, 'disconnected');
    apiLogger.log('INFO', `Stopped real-time stream for ${symbol} ${dataType}`);
  }

  /**
   * Start WebSocket stream (placeholder for future WebSocket implementation)
   * @param {string} symbol - Stock symbol
   * @param {string} dataType - Type of data
   */
  async startWebSocketStream(_symbol, _dataType) {
    // TODO: Implement WebSocket connections for real-time data
    // This would connect to services like:
    // - Alpha Vantage WebSocket API
    // - IEX Cloud WebSocket
    // - Polygon.io WebSocket

    throw new Error('WebSocket streaming not yet implemented');
  }

  /**
   * Start polling-based stream
   * @param {string} symbol - Stock symbol
   * @param {string} dataType - Type of data
   */
  async startPollingStream(symbol, dataType) {
    const key = `${symbol}_${dataType}`;
    const interval = this.updateIntervals[dataType] || 10000;

    // Initial fetch
    await this.fetchAndBroadcast(symbol, dataType);

    // Set up polling interval
    const intervalId = setInterval(async() => {
      try {
        await this.fetchAndBroadcast(symbol, dataType);
      } catch (error) {
        apiLogger.log('ERROR', `Polling error for ${symbol} ${dataType}`, { error: error.message });
      }
    }, interval);

    this.pollingIntervals.set(key, intervalId);
  }

  /**
   * Fetch data and broadcast to subscribers
   * @param {string} symbol - Stock symbol
   * @param {string} dataType - Type of data
   */
  async fetchAndBroadcast(symbol, dataType) {
    const key = `${symbol}_${dataType}`;

    try {
      let data;

      switch (dataType) {
        case 'marketData':
          data = await dataFetchingService.fetchMarketData(symbol);
          break;
        case 'quotes':
          data = await dataFetchingService.fetchCompanyProfile(symbol);
          break;
        case 'fundamentals':
          data = await dataFetchingService.fetchFinancialStatements(symbol, 'income-statement');
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }

      // Add metadata
      const enrichedData = {
        ...data,
        symbol,
        dataType,
        timestamp: new Date().toISOString(),
        source: 'realTimeDataService'
      };

      // Broadcast to all subscribers
      const subscribers = this.subscribers.get(key);
      if (subscribers) {
        subscribers.forEach(callback => {
          try {
            callback(enrichedData);
          } catch (error) {
            apiLogger.log('ERROR', `Subscriber callback error for ${key}`, { error: error.message });
          }
        });
      }

      this.lastUpdateTimes.set(key, new Date());

    } catch (error) {
      apiLogger.log('ERROR', `Failed to fetch data for ${symbol} ${dataType}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Check if WebSocket is supported for data type
   * @param {string} dataType - Type of data
   * @returns {boolean}
   */
  supportsWebSocket(_dataType) {
    // Currently no WebSocket implementation
    // Future: return true for supported data types
    return false;
  }

  /**
   * Get connection status for all active streams
   * @returns {Object} Connection status map
   */
  getConnectionStatus() {
    const status = {};
    for (const [key, connectionStatus] of this.connectionStatus.entries()) {
      const [symbol, dataType] = key.split('_');
      if (!status[symbol]) {
        status[symbol] = {};
      }
      status[symbol][dataType] = {
        status: connectionStatus,
        lastUpdate: this.lastUpdateTimes.get(key),
        subscriberCount: this.subscribers.get(key)?.size || 0
      };
    }
    return status;
  }

  /**
   * Get all active subscriptions
   * @returns {Array} List of active subscriptions
   */
  getActiveSubscriptions() {
    const subscriptions = [];
    for (const [key, subscribers] of this.subscribers.entries()) {
      const [symbol, dataType] = key.split('_');
      subscriptions.push({
        symbol,
        dataType,
        subscriberCount: subscribers.size,
        status: this.connectionStatus.get(key) || 'unknown',
        lastUpdate: this.lastUpdateTimes.get(key)
      });
    }
    return subscriptions;
  }

  /**
   * Cleanup all streams and subscriptions
   */
  cleanup() {
    // Clear all intervals
    for (const intervalId of this.pollingIntervals.values()) {
      clearInterval(intervalId);
    }

    // Clear all data structures
    this.subscribers.clear();
    this.activeStreams.clear();
    this.pollingIntervals.clear();
    this.connectionStatus.clear();
    this.lastUpdateTimes.clear();

    apiLogger.log('INFO', 'Real-time data service cleaned up');
  }
}

// Export singleton instance
export const realTimeDataService = new RealTimeDataService();
export default RealTimeDataService;
