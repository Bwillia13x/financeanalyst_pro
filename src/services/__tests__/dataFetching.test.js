import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import DataFetchingService from '../dataFetching';
import secureApiClient from '../secureApiClient.js';

// No axios mocking; we will spy on secureApiClient methods directly

describe('DataFetchingService', () => {
  let service;

  beforeEach(() => {
    vi.restoreAllMocks();
    service = new DataFetchingService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits using checkRateLimit()', async () => {
      service.customRateLimits = { ALPHA_VANTAGE: { requests: 5, period: 60000 } };
      service.rateLimiters = {};
      service.initializeRateLimiters();

      // Perform 5 allowed requests
      for (let i = 0; i < 5; i++) {
        await service.checkRateLimit('ALPHA_VANTAGE');
      }

      // The 6th should be rate limited
      await expect(service.checkRateLimit('ALPHA_VANTAGE')).rejects.toThrow(/Rate limit exceeded/);
    });
  });

  describe('Error Handling', () => {
    it('should throw a friendly error when company profile fetch fails', async () => {
      vi.spyOn(secureApiClient, 'getCompanyProfile').mockRejectedValue(new Error('Unauthorized'));

      await expect(service.fetchCompanyProfile('AAPL')).rejects.toThrow(
        /Failed to fetch company profile/
      );
    });

    it('should handle network errors', async () => {
      vi.spyOn(secureApiClient, 'getCompanyProfile').mockRejectedValue(new Error('Network Error'));

      await expect(service.fetchCompanyProfile('INVALID')).rejects.toThrow(
        /Failed to fetch company profile/
      );
    });
  });

  describe('Caching', () => {
    it('should cache successful company profile responses', async () => {
      const mockProfile = { symbol: 'AAPL', companyName: 'Apple Inc.' };
      const spy = vi.spyOn(secureApiClient, 'getCompanyProfile').mockResolvedValue(mockProfile);

      const result1 = await service.fetchCompanyProfile('AAPL');
      const result2 = await service.fetchCompanyProfile('AAPL');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });
  });

  describe('Demo Mode', () => {
    it('should validate tickers using built-in list in demo mode', async () => {
      service.demoMode = true;

      const isValid = await service.validateTicker('AAPL');
      const isInvalid = await service.validateTicker('INVALID');

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Data Validation', () => {
    it('should validate ticker symbols via company profile lookup', async () => {
      vi.spyOn(secureApiClient, 'getCompanyProfile').mockResolvedValue({
        symbol: 'AAPL',
        companyName: 'Apple Inc.'
      });

      const isValid = await service.validateTicker('AAPL');
      expect(isValid).toBe(true);
    });

    it('should reject invalid ticker symbols when profile lookup fails', async () => {
      vi.spyOn(secureApiClient, 'getCompanyProfile').mockRejectedValue(new Error('Not found'));

      const isValid = await service.validateTicker('INVALID');
      expect(isValid).toBe(false);
    });
  });

  describe('Financial Data Fetching', () => {
    it('should fetch financial statements via SecureApiClient', async () => {
      const mockFinancials = [{ date: '2023-12-31', revenue: 1000000, netIncome: 100000 }];
      vi.spyOn(secureApiClient, 'fetchFinancialStatements').mockResolvedValue(mockFinancials);

      const result = await service.fetchFinancialStatements('AAPL', 'income-statement');
      expect(result).toEqual(mockFinancials);
    });

    it('should fetch market data via SecureApiClient', async () => {
      const mockMarketData = {
        symbol: 'AAPL',
        range: '1y',
        data: [
          {
            timestamp: 1640995200,
            open: 149.0,
            high: 151.0,
            low: 148.5,
            close: 150.0,
            volume: 50000000
          }
        ],
        meta: {
          symbol: 'AAPL',
          regularMarketPrice: 150.0,
          previousClose: 148.0,
          currency: 'USD',
          marketCap: 2500000000000
        },
        timestamps: [1640995200],
        prices: {
          close: [150.0],
          high: [151.0],
          low: [148.5],
          open: [149.0]
        },
        volume: [50000000],
        source: 'test'
      };
      vi.spyOn(secureApiClient, 'fetchMarketData').mockResolvedValue(mockMarketData);

      const result = await service.fetchMarketData('AAPL');
      expect(result.symbol).toBe('AAPL');
      expect(result.timestamps.length).toBe(1);
      expect(result.prices.close[0]).toBe(150.0);
    });

    it('should fetch peer comparables via SecureApiClient', async () => {
      const mockPeers = [
        { symbol: 'MSFT', name: 'Microsoft Corp', evToEbitda: 15.2 },
        { symbol: 'GOOGL', name: 'Alphabet Inc', evToEbitda: 13.8 }
      ];
      const spy = vi.spyOn(secureApiClient, 'fetchPeerComparables').mockResolvedValue(mockPeers);

      const result1 = await service.fetchPeerComparables('AAPL');
      const result2 = await service.fetchPeerComparables('AAPL');

      expect(result1).toEqual(mockPeers);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
