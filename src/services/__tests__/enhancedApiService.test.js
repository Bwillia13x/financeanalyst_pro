import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { enhancedApiService } from '../enhancedApiService.js';

// Mock dependencies
vi.mock('../utils/apiLogger.js', () => ({
  apiLogger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('../dataFetching.js', () => ({
  default: {
    fetchWithRetry: vi.fn(),
    fetchMultipleEndpoints: vi.fn()
  }
}));

// Mock fetch
global.fetch = vi.fn();

describe('EnhancedApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
    enhancedApiService.clearCache();
    enhancedApiService.resetMetrics();
    enhancedApiService.requestInterceptors = [];
    enhancedApiService.responseInterceptors = [];
    enhancedApiService.setAuthToken(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('API Request Management', () => {
    it('should make basic API requests', async() => {
      const mockResponse = { data: 'test' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const result = await enhancedApiService.request('/test-endpoint');
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/test-endpoint', expect.any(Object));
    });

    it('should handle API request failures', async() => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(enhancedApiService.request('/test-endpoint')).rejects.toThrow('Network error');
    });

    it('should add authentication headers when available', async() => {
      const mockToken = 'test-token';
      enhancedApiService.setAuthToken(mockToken);

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Headers()
      });

      await enhancedApiService.request('/test-endpoint');

      expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/test-endpoint',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async() => {
      const startTime = Date.now();

      global.fetch.mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() =>
            resolve({
              ok: true,
              json: () => Promise.resolve({}),
              headers: new Headers()
            }), 10)
        )
      );

      const promises = Array(5).fill().map(() =>
        enhancedApiService.request('/test-endpoint')
      );

      await Promise.all(promises);

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThan(40);
    });

    it('should handle rate limit headers', async() => {
      const resetTime = String(Date.now() + 60000);
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Headers({
          'X-RateLimit-Remaining': '10',
          'X-RateLimit-Reset': resetTime
        })
      });

      await enhancedApiService.request('/test-endpoint');

      const rateLimitInfo = enhancedApiService.getRateLimitInfo();
      expect(rateLimitInfo.remaining).toBe(10);
      expect(rateLimitInfo.reset).toBe(parseInt(resetTime, 10));
    });
  });

  describe('Caching', () => {
    it('should cache GET requests', async() => {
      const mockResponse = { data: 'cached-data' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers()
      });

      await enhancedApiService.request('/cacheable-endpoint');
      await enhancedApiService.request('/cacheable-endpoint');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should respect cache TTL', async() => {
      const mockResponse = { data: 'test' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers()
      });

      enhancedApiService.setCacheTTL(100);

      await enhancedApiService.request('/test-endpoint');

      await new Promise(resolve => setTimeout(resolve, 150));

      await enhancedApiService.request('/test-endpoint');

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should clear cache when requested', async() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Headers()
      });

      await enhancedApiService.request('/test-endpoint');
      enhancedApiService.clearCache();
      await enhancedApiService.request('/test-endpoint');

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Request Batching', () => {
    it('should batch multiple requests', async() => {
      const mockResponses = [
        { data: 'response1' },
        { data: 'response2' },
        { data: 'response3' }
      ];

      global.fetch.mockImplementation((url) => {
        const index = parseInt(url.split('/').pop()) - 1;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponses[index]),
          headers: new Headers()
        });
      });

      const requests = [
        '/endpoint/1',
        '/endpoint/2',
        '/endpoint/3'
      ];

      const results = await enhancedApiService.batchRequests(requests);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual(mockResponses[0]);
      expect(results[1]).toEqual(mockResponses[1]);
      expect(results[2]).toEqual(mockResponses[2]);
    });

    it('should handle batch request failures gracefully', async() => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('fail')) {
          return Promise.reject(new Error('Request failed'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'success' }),
          headers: new Headers()
        });
      });

      const requests = ['/success', '/fail', '/success'];
      const results = await enhancedApiService.batchRequests(requests);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ data: 'success' });
      expect(results[1]).toBeInstanceOf(Error);
      expect(results[2]).toEqual({ data: 'success' });
    });
  });

  describe('Request Interceptors', () => {
    it('should apply request interceptors', async() => {
      const interceptor = vi.fn((config) => ({
        ...config,
        headers: { ...config.headers, 'X-Custom-Header': 'test-value' }
      }));

      enhancedApiService.addRequestInterceptor(interceptor);

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Headers()
      });

      await enhancedApiService.request('/test-endpoint');

      expect(interceptor).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/test-endpoint',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'test-value'
          })
        })
      );
    });

    it('should apply response interceptors', async() => {
      const responseInterceptor = vi.fn((response) => ({
        ...response,
        intercepted: true
      }));

      enhancedApiService.addResponseInterceptor(responseInterceptor);

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
        headers: new Headers()
      });

      const result = await enhancedApiService.request('/test-endpoint');

      expect(responseInterceptor).toHaveBeenCalled();
      expect(result.intercepted).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error status codes', async() => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('Resource not found')
      });

      await expect(enhancedApiService.request('/not-found')).rejects.toThrow('HTTP error! status: 404, body: Resource not found');
    });

    it('should handle network errors', async() => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(enhancedApiService.request('/test-endpoint')).rejects.toThrow('Network error');
    });

    it('should retry failed requests', async() => {
      const responseInterceptor = vi.fn((response) => ({
        ...response,
        intercepted: true
      }));
      enhancedApiService.addResponseInterceptor(responseInterceptor);

      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ data: 'success' }),
          headers: new Headers()
        });

      const result = await enhancedApiService.requestWithRetry('/test-endpoint', {}, 1);

      expect(result).toEqual({ data: 'success', intercepted: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Configuration', () => {
    it('should allow setting base URL', () => {
      const baseUrl = 'https://api.new-example.com';
      enhancedApiService.setBaseUrl(baseUrl);

      expect(enhancedApiService.getBaseUrl()).toBe(baseUrl);
    });

    it('should allow setting default headers', () => {
      const headers = { 'X-API-Version': '1.0' };
      enhancedApiService.setDefaultHeaders(headers);

      expect(enhancedApiService.getDefaultHeaders()).toEqual(headers);
    });

    it('should allow setting timeout', () => {
      const timeout = 5000;
      enhancedApiService.setTimeout(timeout);

      expect(enhancedApiService.getTimeout()).toBe(timeout);
    });
  });

  describe('Metrics and Monitoring', () => {
    it('should track request metrics', async() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Headers()
      });

      await enhancedApiService.request('/test-endpoint');

      const metrics = enhancedApiService.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(1);
    });

    it('should track error metrics', async() => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      try {
        await enhancedApiService.request('/test-endpoint');
      } catch (error) {
        // Expected to fail
      }

      const metrics = enhancedApiService.getMetrics();
      expect(metrics.failedRequests).toBe(1);
    });

    it('should reset metrics when requested', async() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Headers()
      });

      await enhancedApiService.request('/test-endpoint');
      enhancedApiService.resetMetrics();

      const metrics = enhancedApiService.getMetrics();
      expect(metrics.totalRequests).toBe(0);
    });
  });
});
