import axios from 'axios';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import DataFetchingService from '../dataFetching.js';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  }
}));

describe('Advanced Retry Logic', () => {
  let service;
  let mockAxios;

  beforeEach(() => {
    mockAxios = vi.mocked(axios);
    vi.clearAllMocks();

    // Create service with non-demo environment for retry testing
    const mockEnv = {
      VITE_ALPHA_VANTAGE_API_KEY: 'test_alpha_key',
      VITE_FMP_API_KEY: 'test_fmp_key',
      VITE_FORCE_DEMO_MODE: 'false'
    };

    service = new DataFetchingService(mockEnv);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('RetryManager', () => {
    it('should calculate exponential backoff delay correctly', () => {
      const retryManager = service.retryManager;

      // Test delay calculation for different attempts
      const delay0 = retryManager.calculateDelay(0);
      const delay1 = retryManager.calculateDelay(1);
      const delay2 = retryManager.calculateDelay(2);

      // Base delay is 1000ms, exponential base is 2
      expect(delay0).toBeGreaterThanOrEqual(1000); // 1000 + jitter
      expect(delay0).toBeLessThan(1200); // 1000 + 10% jitter max

      expect(delay1).toBeGreaterThanOrEqual(2000); // 2000 + jitter
      expect(delay1).toBeLessThan(2400); // 2000 + 10% jitter max

      expect(delay2).toBeGreaterThanOrEqual(4000); // 4000 + jitter
      expect(delay2).toBeLessThan(4800); // 4000 + 10% jitter max
    });

    it('should respect maximum delay limit', () => {
      const retryManager = service.retryManager;

      // Test with a very high attempt number
      const delay = retryManager.calculateDelay(10);

      // Should not exceed maxDelay (30000ms)
      expect(delay).toBeLessThanOrEqual(30000);
    });

    it('should identify retryable errors correctly', () => {
      const retryManager = service.retryManager;

      // Test retryable HTTP status codes
      const retryableError = new Error('Server Error');
      retryableError.response = { status: 500 };
      expect(retryManager.isRetryableError(retryableError)).toBe(true);

      // Test non-retryable HTTP status codes
      const nonRetryableError = new Error('Not Found');
      nonRetryableError.response = { status: 404 };
      expect(retryManager.isRetryableError(nonRetryableError)).toBe(false);

      // Test network errors
      const networkError = new Error('Network Error');
      networkError.code = 'ECONNRESET';
      expect(retryManager.isRetryableError(networkError)).toBe(true);

      // Test timeout errors
      const timeoutError = new Error('Request timeout');
      expect(retryManager.isRetryableError(timeoutError)).toBe(true);
    });
  });

  describe('API Retry Integration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should retry on retryable errors and eventually succeed', async () => {
      vi.useFakeTimers();

      // Force the service out of demo mode for this test
      service.demoMode = false;

      const successData = [{ symbol: 'AAPL', companyName: 'Apple Inc.' }];

      // Create retryable errors (500 status codes)
      const retryableError1 = new Error('Network timeout');
      retryableError1.response = { status: 500 };

      const retryableError2 = new Error('Server temporarily unavailable');
      retryableError2.response = { status: 502 };

      // Mock first two calls to fail, third to succeed
      mockAxios.get
        .mockRejectedValueOnce(retryableError1)
        .mockRejectedValueOnce(retryableError2)
        .mockResolvedValueOnce({ data: successData });

      const promise = service.fetchCompanyProfile('AAPL');

      // Fast-forward through retry delays
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toEqual(successData[0]);
      expect(mockAxios.get).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });

    it('should not retry on non-retryable errors', async () => {
      vi.useFakeTimers();

      // Force the service out of demo mode for this test
      service.demoMode = false;

      // Mock generateMockData to ensure we don't get demo data
      const originalGenerateMockData = service.generateMockData;
      service.generateMockData = vi.fn();

      const nonRetryableError = new Error('Not Found');
      nonRetryableError.response = { status: 404 };

      mockAxios.get.mockRejectedValue(nonRetryableError);

      const promise = service.fetchCompanyProfile('INVALID');

      // Fast-forward any timers
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow(
        'Failed to fetch company profile'
      );

      // Should only be called once (no retries)
      expect(mockAxios.get).toHaveBeenCalledTimes(1);

      // Restore original method
      service.generateMockData = originalGenerateMockData;

      vi.useRealTimers();
    });

    it('should exhaust all retries and fail', async () => {
      vi.useFakeTimers();

      const retryableError = new Error('Server Error');
      retryableError.response = { status: 500 };

      mockAxios.get.mockRejectedValue(retryableError);

      const promise = service.fetchCompanyProfile('AAPL');

      // Fast-forward through all retry attempts
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Failed to fetch company profile');

      // Should be called 4 times (initial + 3 retries)
      expect(mockAxios.get).toHaveBeenCalledTimes(4);

      vi.useRealTimers();
    });

    it('should handle rate limiting during retries', async () => {
      vi.useFakeTimers();

      const successData = [{ symbol: 'AAPL', companyName: 'Apple Inc.' }];

      // Mock rate limit error followed by success
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.response = { status: 429 };

      mockAxios.get
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ data: successData });

      const promise = service.fetchCompanyProfile('AAPL');

      // Fast-forward through retry delay
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toEqual(successData[0]);
      expect(mockAxios.get).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should apply retry logic to financial statements fetch', async () => {
      vi.useFakeTimers();

      const successData = [{ date: '2023-12-31', revenue: 1000000 }];

      // Mock timeout error followed by success
      const timeoutError = new Error('Request timeout');

      mockAxios.get
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce({ data: successData });

      const promise = service.fetchFinancialStatements('AAPL', 'income-statement');

      // Fast-forward through retry delay
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toEqual(successData);
      expect(mockAxios.get).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should apply retry logic to market data fetch', async () => {
      const successData = {
        chart: {
          result: [
            {
              meta: {
                symbol: 'AAPL',
                regularMarketPrice: 150.0,
                previousClose: 148.0,
                marketCap: 2500000000000,
                regularMarketVolume: 50000000,
                currency: 'USD'
              },
              timestamp: [1640995200],
              indicators: {
                quote: [{ close: [150.0] }]
              }
            }
          ]
        }
      };

      // Mock connection error followed by success
      const connectionError = new Error('Connection refused');
      connectionError.code = 'ECONNREFUSED';

      mockAxios.get
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce({ data: successData });

      const promise = service.fetchMarketData('AAPL');

      // Fast-forward through retry delay
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result.symbol).toBe('AAPL');
      expect(result.currentPrice).toBe(150.0);
      expect(mockAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Retry Configuration', () => {
    it('should allow custom retry configuration', () => {
      const customRetryConfig = {
        maxRetries: 5,
        baseDelay: 500,
        maxDelay: 10000
      };

      const customService = new DataFetchingService(
        { VITE_FMP_API_KEY: 'test_key', VITE_FORCE_DEMO_MODE: 'false' },
        null,
        customRetryConfig
      );

      expect(customService.retryManager.config.maxRetries).toBe(5);
      expect(customService.retryManager.config.baseDelay).toBe(500);
      expect(customService.retryManager.config.maxDelay).toBe(10000);
    });

    it('should use default retry configuration when none provided', () => {
      expect(service.retryManager.config.maxRetries).toBe(3);
      expect(service.retryManager.config.baseDelay).toBe(1000);
      expect(service.retryManager.config.maxDelay).toBe(30000);
    });
  });

  describe('Logging and Monitoring', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should log successful retry attempts', async () => {
      vi.useFakeTimers();

      const successData = [{ symbol: 'AAPL', companyName: 'Apple Inc.' }];

      mockAxios.get
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({ data: successData });

      const promise = service.fetchCompanyProfile('AAPL');
      await vi.runAllTimersAsync();
      await promise;

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ Company profile fetch for AAPL succeeded on attempt 2')
      );
    });

    it('should log retry attempts with delay information', async () => {
      vi.useFakeTimers();

      const retryableError = new Error('Server Error');
      retryableError.response = { status: 500 };

      mockAxios.get.mockRejectedValue(retryableError);

      const promise = service.fetchCompanyProfile('AAPL');
      await vi.runAllTimersAsync();

      try {
        await promise;
      } catch (error) {
        // Expected to fail - verify it's the right error
        expect(error.message).toContain('Failed to fetch company profile');
      }

      // Check that console.warn was called with the expected message pattern
      // The actual call includes two parameters: the message and the error message
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '⚠️ Company profile fetch for AAPL failed (attempt 1/4), retrying in'
        ),
        'Server Error'
      );
    });

    it('should log final failure after all retries exhausted', async () => {
      vi.useFakeTimers();

      const retryableError = new Error('Server Error');
      retryableError.response = { status: 500 };

      mockAxios.get.mockRejectedValue(retryableError);

      const promise = service.fetchCompanyProfile('AAPL');
      await vi.runAllTimersAsync();

      try {
        await promise;
      } catch (error) {
        // Expected to fail - verify it's the right error
        expect(error.message).toContain('Failed to fetch company profile');
      }

      // Check that console.error was called with the expected message pattern
      // The actual call includes two parameters: the message and the error message
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Company profile fetch for AAPL failed after 4 attempts:'),
        'Server Error'
      );
    });
  });
});
