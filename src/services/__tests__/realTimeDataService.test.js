import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import realTimeDataService from '../realTimeDataService.js';

// No external dependencies are used by realTimeDataService; tests focus on simulated feeds

describe('RealTimeDataService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.clearAllTimers();
    realTimeDataService.cleanup(); // Clean up any existing subscriptions
  });

  afterEach(async () => {
    // Ensure all intervals/timers are cleared while still under fake timers
    realTimeDataService.cleanup();
    await vi.runOnlyPendingTimersAsync();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Subscription Management', () => {
    it('should subscribe to real-time data and start polling', async () => {
      const callback = vi.fn();

      const unsubscribe = realTimeDataService.subscribe('stock_price', 'AAPL', callback);

      expect(typeof unsubscribe).toBe('function');
      expect(realTimeDataService.getActiveSubscriptions()).toHaveLength(1);

      // Fast-forward timers to trigger simulated updates (interval = 500ms)
      await vi.advanceTimersByTimeAsync(2500);

      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'AAPL',
          price: expect.any(Number)
        })
      );
    });

    it('should unsubscribe from real-time data and stop polling', async () => {
      const callback = vi.fn();
      const unsubscribe = realTimeDataService.subscribe('stock_price', 'AAPL', callback);

      await vi.advanceTimersByTimeAsync(1000);
      const callsBefore = callback.mock.calls.length;

      unsubscribe();

      expect(realTimeDataService.getActiveSubscriptions()).toHaveLength(0);

      // Verify no more updates after unsubscribe
      await vi.advanceTimersByTimeAsync(1500);
      expect(callback.mock.calls.length).toBe(callsBefore);
    });

    it('should handle multiple subscribers for the same symbol and data type', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      realTimeDataService.subscribe('stock_price', 'AAPL', callback1);
      realTimeDataService.subscribe('stock_price', 'AAPL', callback2);

      const activeSubscriptions = realTimeDataService.getActiveSubscriptions();
      expect(activeSubscriptions).toHaveLength(1);
      expect(activeSubscriptions[0].subscriberCount).toBe(2);

      await vi.advanceTimersByTimeAsync(2000);

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      expect(callback1.mock.calls.length).toBe(callback2.mock.calls.length);
    });
  });

  describe('Data Fetching and Broadcasting', () => {
    it('should broadcast simulated market data', async () => {
      const callback = vi.fn();

      realTimeDataService.subscribe('stock_price', 'TSLA', callback);
      await vi.advanceTimersByTimeAsync(2000);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'TSLA',
          price: expect.any(Number)
        })
      );
    });

    it('should expose the latest snapshot via getCurrentData', async () => {
      const callback = vi.fn();

      realTimeDataService.subscribe('stock_price', 'AAPL', callback);
      await vi.advanceTimersByTimeAsync(1000);

      const snapshot = realTimeDataService.getCurrentData('stock_price', 'AAPL');
      expect(snapshot).toEqual(
        expect.objectContaining({ symbol: 'AAPL', price: expect.any(Number) })
      );
    });
  });

  describe('Connection Status', () => {
    it('should report connection status for active streams', async () => {
      realTimeDataService.subscribe('stock_price', 'MSFT', vi.fn());

      await vi.advanceTimersByTimeAsync(600); // allow at least one interval tick

      const status = realTimeDataService.getConnectionStatus();
      expect(status.MSFT.stock_price.status).toBe('connected');
      expect(status.MSFT.stock_price.subscriberCount).toBe(1);
    });
  });
});
