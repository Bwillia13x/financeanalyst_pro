import axios from 'axios';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import DataFetchingService from '../dataFetching';

// Mock axios
vi.mock('axios');

describe('DataFetchingService', () => {
  let service;
  let mockAxios;

  beforeEach(() => {
    mockAxios = vi.mocked(axios);

    // Clear all mocks
    vi.clearAllMocks();

    // Mock environment variables
    const mockEnv = {
      VITE_ALPHA_VANTAGE_API_KEY: 'test_alpha_key',
      VITE_FMP_API_KEY: 'test_fmp_key',
      VITE_FORCE_DEMO_MODE: 'false'
    };

    service = new DataFetchingService(mockEnv);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async() => {
      // Create a service with custom rate limits for testing
      const mockEnv = {
        VITE_ALPHA_VANTAGE_API_KEY: 'test_alpha_key',
        VITE_FMP_API_KEY: 'test_fmp_key',
        VITE_FORCE_DEMO_MODE: 'false'
      };
      const customRateLimits = {
        FMP: { requests: 5, period: 60000 } // 5 requests per minute for testing
      };
      const rateLimitedService = new DataFetchingService(mockEnv, customRateLimits);

      // Mock successful responses
      mockAxios.get.mockResolvedValue({
        data: [{ symbol: 'AAPL', companyName: 'Apple Inc.' }]
      });

      // Make requests up to the limit with different tickers to avoid caching
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(rateLimitedService.fetchCompanyProfile(`AAPL${i}`));
      }

      await Promise.all(promises);

      // The 6th request should be rate limited
      await expect(rateLimitedService.fetchCompanyProfile('AAPL6')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async() => {
      mockAxios.get.mockRejectedValue({
        response: { status: 401 },
        message: 'Unauthorized'
      });

      // Should fall back to demo mode instead of throwing
      const result = await service.fetchCompanyProfile('AAPL');
      expect(result).toBeDefined();
      expect(result.symbol).toBe('AAPL');
    });

    it('should handle network errors', async() => {
      mockAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(service.fetchCompanyProfile('INVALID')).rejects.toThrow(
        'Failed to fetch company profile'
      );
    });
  });

  describe('Caching', () => {
    it('should cache successful responses', async() => {
      const mockData = [{ symbol: 'AAPL', companyName: 'Apple Inc.' }];
      mockAxios.get.mockResolvedValue({ data: mockData });

      // First call
      const result1 = await service.fetchCompanyProfile('AAPL');

      // Second call should use cache
      const result2 = await service.fetchCompanyProfile('AAPL');

      expect(mockAxios.get).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });
  });

  describe('Demo Mode', () => {
    it('should detect demo mode correctly', () => {
      const mockEnv = {
        VITE_ALPHA_VANTAGE_API_KEY: 'test_alpha_key',
        VITE_FMP_API_KEY: 'test_fmp_key',
        VITE_FORCE_DEMO_MODE: 'false'
      };
      const demoService = new DataFetchingService(mockEnv);

      // With valid API keys, should not be in demo mode
      expect(demoService.demoMode).toBe(false);
    });

    it('should generate mock data in demo mode', async() => {
      // Force demo mode
      const mockEnv = {
        VITE_ALPHA_VANTAGE_API_KEY: 'demo',
        VITE_FMP_API_KEY: 'demo',
        VITE_FORCE_DEMO_MODE: 'true'
      };

      const demoService = new DataFetchingService(mockEnv);
      const result = await demoService.fetchCompanyProfile('AAPL');

      expect(result).toBeDefined();
      expect(result.symbol).toBe('AAPL');
      expect(result.companyName).toContain('Apple');
    });
  });

  describe('Data Validation', () => {
    it('should validate ticker symbols', async() => {
      mockAxios.get.mockResolvedValue({
        data: [{ symbol: 'AAPL', companyName: 'Apple Inc.' }]
      });

      const isValid = await service.validateTicker('AAPL');
      expect(isValid).toBe(true);
    });

    it('should reject invalid ticker symbols', async() => {
      mockAxios.get.mockRejectedValue(new Error('Not found'));

      const isValid = await service.validateTicker('INVALID');
      expect(isValid).toBe(false);
    });
  });

  describe('Financial Data Fetching', () => {
    it('should fetch financial statements', async() => {
      const mockFinancials = [{ date: '2023-12-31', revenue: 1000000, netIncome: 100000 }];

      mockAxios.get.mockResolvedValue({ data: mockFinancials });

      const result = await service.fetchFinancialStatements('AAPL', 'income-statement');
      expect(result).toEqual(mockFinancials);
    });

    it('should fetch market data', async() => {
      const mockMarketData = {
        chart: {
          result: [
            {
              meta: {
                symbol: 'AAPL',
                regularMarketPrice: 150.0,
                previousClose: 148.0,
                currency: 'USD',
                marketCap: 2500000000000,
                regularMarketVolume: 50000000
              },
              timestamp: [1640995200],
              indicators: {
                quote: [
                  {
                    open: [149.0],
                    high: [151.0],
                    low: [148.5],
                    close: [150.0],
                    volume: [50000000]
                  }
                ]
              }
            }
          ]
        }
      };

      mockAxios.get.mockResolvedValue({ data: mockMarketData });

      const result = await service.fetchMarketData('AAPL');
      expect(result.symbol).toBe('AAPL');
      expect(result.currentPrice).toBe(150.0);
    });
  });
});
