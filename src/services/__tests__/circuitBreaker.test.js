import axios from 'axios';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import DataFetchingService from '../dataFetching.js';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  }
}));

describe('Circuit Breaker Pattern', () => {
  let service;
  let mockAxios;

  beforeEach(() => {
    mockAxios = vi.mocked(axios);
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Create service with non-demo environment and custom circuit breaker config
    const mockEnv = {
      VITE_ALPHA_VANTAGE_API_KEY: 'test_alpha_key',
      VITE_FMP_API_KEY: 'test_fmp_key',
      VITE_FORCE_DEMO_MODE: 'false'
    };

    // Use faster circuit breaker config for testing
    const circuitBreakerConfig = {
      failureThreshold: 3, // Lower threshold for faster testing
      recoveryTimeout: 5000, // 5 seconds for testing
      monitoringPeriod: 10000,
      halfOpenMaxCalls: 2
    };

    service = new DataFetchingService(mockEnv, null, null, circuitBreakerConfig);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Circuit Breaker States', () => {
    it('should start in CLOSED state', () => {
      const status = service.getCircuitBreakerStatus();
      expect(status.FMP.state).toBe('CLOSED');
      expect(status.FMP.failureCount).toBe(0);
      expect(status.FMP.isOpen).toBe(false);
    });

    it('should transition to OPEN state after failure threshold', async () => {
      const error = new Error('Service unavailable');
      error.response = { status: 500 };

      mockAxios.get.mockRejectedValue(error);

      // Make enough failed calls to trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          const promise = service.fetchCompanyProfile('AAPL');
          // Fast-forward through any retry delays
          await vi.runAllTimersAsync();
          await promise;
        } catch {
          // Expected to fail
        }
      }

      const status = service.getCircuitBreakerStatus();
      expect(status.FMP.state).toBe('OPEN');
      expect(status.FMP.failureCount).toBeGreaterThanOrEqual(3);
      expect(status.FMP.isOpen).toBe(true);
    }, 10000);

    it('should fail fast when circuit is OPEN', async () => {
      vi.useFakeTimers();

      const error = new Error('Service unavailable');
      error.response = { status: 500 };

      mockAxios.get.mockRejectedValue(error);

      // Trigger circuit breaker to open by causing 3 failures
      for (let i = 0; i < 3; i++) {
        try {
          const promise = service.fetchCompanyProfile('AAPL');
          await vi.runAllTimersAsync();
          await promise;
        } catch (e) {
          // Expected to fail - verify it's the right error
          expect(e.message).toContain('Failed to fetch company profile');
        }
      }

      // Verify circuit breaker is now open
      const status = service.circuitBreakers.FMP.getStatus();
      expect(status.state).toBe('OPEN');

      // Record the current call count before the fast-fail test
      const callCountBeforeFastFail = mockAxios.get.mock.calls.length;

      // Next call should fail fast without hitting the API
      const startTime = Date.now();
      let caughtError = null;
      try {
        await service.fetchCompanyProfile('AAPL');
      } catch (error) {
        caughtError = error;
        expect(error.message).toContain('Circuit breaker FMP is OPEN - failing fast');
        expect(error.circuitBreakerOpen).toBe(true);
      }
      const endTime = Date.now();

      // Ensure we caught the expected error
      expect(caughtError).not.toBeNull();

      // Should fail immediately (within a few ms)
      expect(endTime - startTime).toBeLessThan(100);

      // Should not have made additional API calls after the circuit opened
      expect(mockAxios.get.mock.calls.length).toBe(callCountBeforeFastFail);

      vi.useRealTimers();
    }, 10000);

    it('should transition to HALF_OPEN after recovery timeout', async () => {
      const error = new Error('Service unavailable');
      error.response = { status: 500 };

      mockAxios.get.mockRejectedValue(error);

      // Trigger circuit breaker to open
      for (let i = 0; i < 3; i++) {
        try {
          const promise = service.fetchCompanyProfile('AAPL');
          await vi.runAllTimersAsync();
          await promise;
        } catch {
          // Expected to fail
        }
      }

      expect(service.getCircuitBreakerStatus().FMP.state).toBe('OPEN');

      // Fast-forward past recovery timeout
      vi.advanceTimersByTime(6000); // 6 seconds > 5 second recovery timeout

      // Mock successful response for recovery test
      mockAxios.get.mockResolvedValueOnce({
        data: [{ symbol: 'AAPL', companyName: 'Apple Inc.' }]
      });

      // Next call should transition to HALF_OPEN and succeed
      const result = await service.fetchCompanyProfile('AAPL');

      expect(result.symbol).toBe('AAPL');
      expect(service.getCircuitBreakerStatus().FMP.state).toBe('HALF_OPEN');
    }, 10000);

    it('should close circuit after successful calls in HALF_OPEN state', async () => {
      vi.useFakeTimers();

      const error = new Error('Service unavailable');
      error.response = { status: 500 };

      mockAxios.get.mockRejectedValue(error);

      // Trigger circuit breaker to open
      for (let i = 0; i < 3; i++) {
        try {
          const promise = service.fetchCompanyProfile('AAPL');
          await vi.runAllTimersAsync();
          await promise;
        } catch (e) {
          // Expected to fail
          expect(e.message).toContain('Failed to fetch company profile');
        }
      }

      // Fast-forward past recovery timeout
      vi.advanceTimersByTime(6000);

      // Mock successful responses for recovery
      mockAxios.get.mockResolvedValue({
        data: [{ symbol: 'AAPL', companyName: 'Apple Inc.' }]
      });

      // Make enough successful calls to close the circuit
      await service.fetchCompanyProfile('AAPL1');
      expect(service.getCircuitBreakerStatus().FMP.state).toBe('HALF_OPEN');

      await service.fetchCompanyProfile('AAPL2');
      expect(service.getCircuitBreakerStatus().FMP.state).toBe('CLOSED');
      expect(service.getCircuitBreakerStatus().FMP.failureCount).toBe(0);

      vi.useRealTimers();
    });

    it('should reopen circuit if failure occurs in HALF_OPEN state', async () => {
      vi.useFakeTimers();

      const error = new Error('Service unavailable');
      error.response = { status: 500 };

      mockAxios.get.mockRejectedValue(error);

      // Trigger circuit breaker to open
      for (let i = 0; i < 3; i++) {
        try {
          const promise = service.fetchCompanyProfile('AAPL');
          await vi.runAllTimersAsync();
          await promise;
        } catch (e) {
          // Expected to fail - verify it's the right error
          expect(e.message).toContain('Failed to fetch company profile');
        }
      }

      // Fast-forward past recovery timeout
      vi.advanceTimersByTime(6000);

      // First call succeeds, transitioning to HALF_OPEN
      mockAxios.get.mockResolvedValueOnce({
        data: [{ symbol: 'AAPL', companyName: 'Apple Inc.' }]
      });
      await service.fetchCompanyProfile('AAPL');
      expect(service.getCircuitBreakerStatus().FMP.state).toBe('HALF_OPEN');

      // Second call fails, should reopen circuit (use different ticker to avoid cache)
      mockAxios.get.mockRejectedValueOnce(error);
      try {
        const promise = service.fetchCompanyProfile('MSFT');
        await vi.runAllTimersAsync();
        await promise;
      } catch (e) {
        // Expected to fail - verify it's the right error
        expect(e.message).toContain('Failed to fetch company profile');
      }

      expect(service.getCircuitBreakerStatus().FMP.state).toBe('OPEN');

      vi.useRealTimers();
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should track success and failure rates', async () => {
      vi.useFakeTimers();

      // Mock some successful calls
      mockAxios.get.mockResolvedValue({
        data: [{ symbol: 'AAPL', companyName: 'Apple Inc.' }]
      });

      await service.fetchCompanyProfile('AAPL');
      await service.fetchCompanyProfile('MSFT');

      // Mock some failed calls
      const error = new Error('Service error');
      error.response = { status: 500 };
      mockAxios.get.mockRejectedValue(error);

      try {
        const promise = service.fetchCompanyProfile('GOOGL');
        await vi.runAllTimersAsync();
        await promise;
      } catch (e) {
        // Expected to fail - verify it's the right error
        expect(e.message).toContain('Failed to fetch company profile');
      }

      const status = service.getCircuitBreakerStatus().FMP;
      expect(status.successCount).toBe(2);
      expect(status.failureCount).toBe(1);
      expect(status.totalCalls).toBe(3);
      expect(status.failureRate).toBeCloseTo(0.333, 2);

      vi.useRealTimers();
    });

    it('should provide comprehensive status information', async () => {
      const status = service.getCircuitBreakerStatus();

      expect(status).toHaveProperty('FMP');
      expect(status).toHaveProperty('ALPHA_VANTAGE');
      expect(status).toHaveProperty('SEC_EDGAR');
      expect(status).toHaveProperty('YAHOO_FINANCE');

      const fmpStatus = status.FMP;
      expect(fmpStatus).toHaveProperty('name', 'FMP');
      expect(fmpStatus).toHaveProperty('state', 'CLOSED');
      expect(fmpStatus).toHaveProperty('failureCount', 0);
      expect(fmpStatus).toHaveProperty('successCount', 0);
      expect(fmpStatus).toHaveProperty('totalCalls', 0);
      expect(fmpStatus).toHaveProperty('failureRate', 0);
      expect(fmpStatus).toHaveProperty('isOpen', false);
      expect(fmpStatus).toHaveProperty('nextRetryTime', null);
    });

    it('should work with different API sources', async () => {
      // Test that each API source has its own circuit breaker
      const status = service.getCircuitBreakerStatus();

      Object.keys(status).forEach(source => {
        expect(status[source].name).toBe(source);
        expect(status[source].state).toBe('CLOSED');
      });
    });
  });

  describe('Circuit Breaker Logging', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('should log circuit breaker state transitions', async () => {
      vi.useFakeTimers();

      const error = new Error('Service unavailable');
      error.response = { status: 500 };

      mockAxios.get.mockRejectedValue(error);

      // Trigger circuit breaker to open
      for (let i = 0; i < 3; i++) {
        try {
          const promise = service.fetchCompanyProfile('AAPL');
          await vi.runAllTimersAsync();
          await promise;
        } catch (e) {
          // Expected to fail - verify it's the right error
          expect(e.message).toContain('Failed to fetch company profile');
        }
      }

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('🚨 Circuit breaker FMP opened - too many failures (3)')
      );

      vi.useRealTimers();
    });

    it('should log recovery transitions', async () => {
      vi.useFakeTimers();

      const error = new Error('Service unavailable');
      error.response = { status: 500 };

      mockAxios.get.mockRejectedValue(error);

      // Trigger circuit breaker to open
      for (let i = 0; i < 3; i++) {
        try {
          const promise = service.fetchCompanyProfile('AAPL');
          await vi.runAllTimersAsync();
          await promise;
        } catch (e) {
          // Expected to fail - verify it's the right error
          expect(e.message).toContain('Failed to fetch company profile');
        }
      }

      // Fast-forward and test recovery
      vi.advanceTimersByTime(6000);

      mockAxios.get.mockResolvedValue({
        data: [{ symbol: 'AAPL', companyName: 'Apple Inc.' }]
      });

      // Trigger transition to HALF_OPEN
      await service.fetchCompanyProfile('AAPL1');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🔄 Circuit breaker FMP transitioning to HALF_OPEN')
      );

      // Complete recovery to CLOSED
      await service.fetchCompanyProfile('AAPL2');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ Circuit breaker FMP closed - service recovered')
      );

      vi.useRealTimers();
    });
  });
});
