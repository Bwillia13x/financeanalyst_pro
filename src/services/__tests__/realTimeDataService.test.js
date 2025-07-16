import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { realTimeDataService } from '../realTimeDataService.js';
import { dataFetchingService } from '../dataFetching.js';

// Mock dependencies
vi.mock('../utils/apiLogger.js', () => ({
  apiLogger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('../dataFetching.js', () => ({
  dataFetchingService: {
    fetchMarketData: vi.fn(),
    fetchCompanyProfile: vi.fn(),
    fetchFinancialStatements: vi.fn()
  }
}));

describe('RealTimeDataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    realTimeDataService.cleanup(); // Clean up any existing subscriptions
  });

  afterEach(() => {
    vi.useRealTimers();
    realTimeDataService.cleanup();
  });

  describe('Subscription Management', () => {
    it('should subscribe to real-time data and start polling', async () => {
      const callback = vi.fn();
      dataFetchingService.fetchMarketData.mockResolvedValue({ price: 150 });

      const subscriptionId = realTimeDataService.subscribe('AAPL', 'marketData', callback);
      
      expect(subscriptionId).toContain('AAPL_marketData');
      expect(realTimeDataService.getActiveSubscriptions()).toHaveLength(1);

      // Fast-forward timers to trigger polling
      await vi.advanceTimersByTimeAsync(5000);

      expect(dataFetchingService.fetchMarketData).toHaveBeenCalledWith('AAPL');
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        symbol: 'AAPL',
        dataType: 'marketData',
        price: 150
      }));
    });

    it('should unsubscribe from real-time data and stop polling', () => {
      const callback = vi.fn();
      const subscriptionId = realTimeDataService.subscribe('AAPL', 'marketData', callback);
      
      realTimeDataService.unsubscribe(subscriptionId);
      
      expect(realTimeDataService.getActiveSubscriptions()).toHaveLength(0);
      
      // Reset mock to clear the initial fetch call
      vi.clearAllMocks();

      // Verify polling is stopped
      vi.advanceTimersByTime(10000);
      expect(dataFetchingService.fetchMarketData).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers for the same symbol and data type', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      dataFetchingService.fetchMarketData.mockResolvedValue({ price: 155 });

      // Mock Date.now to ensure unique subscription IDs
      let now = Date.now();
      vi.spyOn(Date, 'now').mockImplementation(() => ++now);

      realTimeDataService.subscribe('AAPL', 'marketData', callback1);
      realTimeDataService.subscribe('AAPL', 'marketData', callback2);
      
      const activeSubscriptions = realTimeDataService.getActiveSubscriptions();
      expect(activeSubscriptions).toHaveLength(1);
      expect(activeSubscriptions[0].subscriberCount).toBe(2);

      await vi.advanceTimersByTimeAsync(5000);

      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledTimes(2);
    });
  });

  describe('Data Fetching and Broadcasting', () => {
    it('should fetch and broadcast market data', async () => {
      const callback = vi.fn();
      dataFetchingService.fetchMarketData.mockResolvedValue({ currentPrice: 160 });
      
      realTimeDataService.subscribe('TSLA', 'marketData', callback);
      await vi.advanceTimersByTimeAsync(5000);

      expect(dataFetchingService.fetchMarketData).toHaveBeenCalledWith('TSLA');
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        symbol: 'TSLA',
        dataType: 'marketData',
        currentPrice: 160
      }));
    });

    it('should fetch and broadcast quotes', async () => {
      const callback = vi.fn();
      dataFetchingService.fetchCompanyProfile.mockResolvedValue({ companyName: 'Tesla Inc.' });

      realTimeDataService.subscribe('TSLA', 'quotes', callback);
      await vi.advanceTimersByTimeAsync(1000);

      expect(dataFetchingService.fetchCompanyProfile).toHaveBeenCalledWith('TSLA');
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        symbol: 'TSLA',
        dataType: 'quotes',
        companyName: 'Tesla Inc.'
      }));
    });

    it('should handle data fetching errors gracefully', async () => {
      const callback = vi.fn();
      const error = new Error('API limit reached');
      dataFetchingService.fetchMarketData.mockRejectedValue(error);

      realTimeDataService.subscribe('NVDA', 'marketData', callback);
      await vi.advanceTimersByTimeAsync(5000);

      expect(callback).not.toHaveBeenCalled();
      // You can also check if the error was logged
    });
  });

  describe('Connection Status', () => {
    it('should report connection status for active streams', async () => {
      dataFetchingService.fetchMarketData.mockResolvedValue({ price: 200 });
      realTimeDataService.subscribe('MSFT', 'marketData', vi.fn());
      
      await vi.advanceTimersByTimeAsync(100); // Let the initial fetch complete

      const status = realTimeDataService.getConnectionStatus();
      expect(status.MSFT.marketData.status).toBe('connected');
      expect(status.MSFT.marketData.subscriberCount).toBe(1);
    });
  });
});
