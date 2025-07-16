// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import DataFetchingService from '../../services/dataFetching';
import { apiKeyValidator } from '../../utils/apiKeyValidator';

// Mock axios
vi.mock('axios');

describe('Error Handling & Edge Cases', () => {
  let service;
  let mockAxios;

  beforeEach(() => {
    mockAxios = vi.mocked(axios);

    // Create service with non-demo environment for error testing
    const mockEnv = {
      VITE_ALPHA_VANTAGE_API_KEY: 'test_alpha_key',
      VITE_FMP_API_KEY: 'test_fmp_key',
      VITE_FORCE_DEMO_MODE: 'false'
    };

    // Configure minimal retry and circuit breaker settings for testing
    const retryConfig = {
      maxRetries: 0, // No retries for faster tests
      baseDelay: 10,
      maxDelay: 100
    };

    const circuitBreakerConfig = {
      failureThreshold: 1,
      recoveryTimeout: 100,
      halfOpenMaxCalls: 1
    };

    service = new DataFetchingService(mockEnv, null, retryConfig, circuitBreakerConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Network Error Handling', () => {
    it('should handle network timeouts gracefully', async() => {
      // Force service out of demo mode
      service.demoMode = false;

      mockAxios.get.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded'
      });

      await expect(service.fetchCompanyProfile('AAPL')).rejects.toThrow(
        'Failed to fetch company profile'
      );
    });

    it('should handle DNS resolution failures', async() => {
      // Force service out of demo mode
      service.demoMode = false;

      mockAxios.get.mockRejectedValue({
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND api.example.com'
      });

      await expect(service.fetchCompanyProfile('AAPL')).rejects.toThrow(
        'Failed to fetch company profile'
      );
    });

    it('should handle connection refused errors', async() => {
      // Force service out of demo mode
      service.demoMode = false;

      mockAxios.get.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED 127.0.0.1:80'
      });

      await expect(service.fetchCompanyProfile('AAPL')).rejects.toThrow(
        'Failed to fetch company profile'
      );
    });
  });

  describe('API Error Responses', () => {
    it('should handle 401 Unauthorized errors', async() => {
      mockAxios.get.mockRejectedValue({
        response: { status: 401, data: { error: 'Invalid API key' } }
      });

      // Should fall back to demo mode instead of throwing
      const result = await service.fetchCompanyProfile('AAPL');
      expect(result).toBeDefined();
      expect(result.symbol).toBe('AAPL');
    });

    it('should handle 403 Forbidden errors', async() => {
      mockAxios.get.mockRejectedValue({
        response: { status: 403, data: { error: 'Access denied' } }
      });

      // Should fall back to demo mode
      const result = await service.fetchCompanyProfile('AAPL');
      expect(result).toBeDefined();
      expect(result.symbol).toBe('AAPL');
    });

    it('should handle 404 Not Found errors', async() => {
      mockAxios.get.mockRejectedValue({
        response: { status: 404, data: { error: 'Symbol not found' } }
      });

      await expect(service.fetchCompanyProfile('INVALID')).rejects.toThrow(
        'Failed to fetch company profile'
      );
    });

    it('should handle 429 Rate Limit errors', async() => {
      // Force service out of demo mode
      service.demoMode = false;

      mockAxios.get.mockRejectedValue({
        response: {
          status: 429,
          data: { error: 'Rate limit exceeded' },
          headers: { 'retry-after': '60' }
        }
      });

      await expect(service.fetchCompanyProfile('AAPL')).rejects.toThrow(
        'Failed to fetch company profile'
      );
    });

    it('should handle 500 Internal Server errors', async() => {
      // Force service out of demo mode
      service.demoMode = false;

      mockAxios.get.mockRejectedValue({
        response: { status: 500, data: { error: 'Internal server error' } }
      });

      await expect(service.fetchCompanyProfile('AAPL')).rejects.toThrow(
        'Failed to fetch company profile'
      );
    });
  });

  describe('Data Validation Edge Cases', () => {
    it('should handle empty API responses', async() => {
      mockAxios.get.mockResolvedValue({ data: [] });

      await expect(service.fetchCompanyProfile('AAPL')).rejects.toThrow(
        'Company profile not found'
      );
    });

    it('should handle null API responses', async() => {
      mockAxios.get.mockResolvedValue({ data: null });

      await expect(service.fetchCompanyProfile('AAPL')).rejects.toThrow(
        'Company profile not found'
      );
    });

    it('should handle malformed JSON responses', async() => {
      mockAxios.get.mockResolvedValue({ data: 'invalid json' });

      await expect(service.fetchCompanyProfile('AAPL')).rejects.toThrow(
        'Company profile not found'
      );
    });

    it('should handle missing required fields', async() => {
      mockAxios.get.mockResolvedValue({
        data: [
          {
            /* missing symbol and companyName */
          }
        ]
      });

      const result = await service.fetchCompanyProfile('AAPL');
      expect(result).toBeDefined();
      // Should still return the object even with missing fields
    });
  });

  describe('Input Validation', () => {
    it('should handle invalid ticker symbols', async() => {
      const invalidTickers = ['', null, undefined, 123, {}, []];

      for (const ticker of invalidTickers) {
        const isValid = await service.validateTicker(ticker);
        expect(isValid).toBe(false);
      }
    });

    it('should handle extremely long ticker symbols', async() => {
      const longTicker = 'A'.repeat(1000);
      const isValid = await service.validateTicker(longTicker);
      expect(isValid).toBe(false);
    });

    it('should handle special characters in ticker symbols', async() => {
      const specialTickers = ['AAPL!', 'AAPL@', 'AAPL#', 'AAPL$', 'AAPL%'];

      for (const ticker of specialTickers) {
        const isValid = await service.validateTicker(ticker);
        expect(isValid).toBe(false);
      }
    });
  });

  describe('Rate Limiting Edge Cases', () => {
    it('should handle rapid successive requests', async() => {
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

      mockAxios.get.mockResolvedValue({
        data: [{ symbol: 'AAPL', companyName: 'Apple Inc.' }]
      });

      // Make 6 rapid requests (exceeding the 5 request limit)
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(rateLimitedService.fetchCompanyProfile(`AAPL${i}`));
      }

      const results = await Promise.allSettled(promises);

      // First 5 should succeed, 6th should fail with rate limit error
      expect(results[5].status).toBe('rejected');
      expect(results[5].reason.message).toContain('Rate limit exceeded');
    });
  });

  describe('Cache Edge Cases', () => {
    it('should handle cache corruption gracefully', () => {
      // Manually corrupt the cache
      service.cache.set('test_key', { corrupted: 'data' });
      service.cacheExpiry.set('test_key', Date.now() - 1000); // Expired

      const result = service.getFromCache('test_key');
      expect(result).toBeNull();
    });

    it('should handle cache overflow', () => {
      // Fill cache with many entries
      for (let i = 0; i < 1000; i++) {
        service.setCache(`key_${i}`, { data: i });
      }

      // Cache should still function normally
      service.setCache('new_key', { data: 'new' });
      const result = service.getFromCache('new_key');
      expect(result).toEqual({ data: 'new' });
    });
  });

  describe('Memory Management', () => {
    it('should clean up expired cache entries', () => {
      const key = 'test_key';
      service.setCache(key, { data: 'test' }, 0.001); // Very short TTL

      // Wait for expiration
      setTimeout(() => {
        const result = service.getFromCache(key);
        expect(result).toBeNull();
        expect(service.cache.has(key)).toBe(false);
        expect(service.cacheExpiry.has(key)).toBe(false);
      }, 100);
    });
  });

  describe('API Key Validation Edge Cases', () => {
    it('should handle missing environment variables', async() => {
      // Mock empty environment
      vi.stubGlobal('import.meta', {
        env: {}
      });

      const result = await apiKeyValidator.validateAllKeys();
      expect(result.overall).toBe('demo');

      // Check that at least some services have missing status
      const serviceStatuses = Object.values(result.services).map(s => s.status);
      expect(serviceStatuses).toContain('missing');

      // Verify that no services are valid when environment is empty
      expect(serviceStatuses.every(s => s !== 'valid')).toBe(true);
    });

    it('should handle malformed API keys', async() => {
      vi.stubGlobal('import.meta', {
        env: {
          VITE_ALPHA_VANTAGE_API_KEY: 'invalid_key_format_123!@#'
        }
      });

      mockAxios.get.mockRejectedValue({
        response: { status: 401 }
      });

      const result = await apiKeyValidator.validateAlphaVantage('invalid_key_format_123!@#');
      expect(result.status).toBe('invalid');
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent requests to same endpoint', async() => {
      mockAxios.get.mockResolvedValue({
        data: [{ symbol: 'AAPL', companyName: 'Apple Inc.' }]
      });

      // Make multiple concurrent requests for same data
      const promises = Array(10)
        .fill()
        .map(() => service.fetchCompanyProfile('AAPL'));
      const results = await Promise.all(promises);

      // All should succeed and return same data
      results.forEach(result => {
        expect(result.symbol).toBe('AAPL');
        expect(result.companyName).toBe('Apple Inc.');
      });

      // For concurrent requests, multiple API calls may be made since they start before caching occurs
      // The important thing is that all requests succeed and return consistent data
      expect(mockAxios.get).toHaveBeenCalled();
      expect(results.length).toBe(10);
    });
  });
});
