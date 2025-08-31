/**
 * Real-time Data Integration Tests
 * Tests the integration between real-time data service, API integration, and data management
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { financialDataService } from '../../services/FinancialDataService';
import { realtimeDataService } from '../../services/realtime/RealtimeDataService';
import { apiIntegrationService } from '../../services/api/APIIntegrationService';
import { dataManagementService } from '../../services/data/DataManagementService';

describe('Real-time Data Integration', () => {
  beforeAll(async () => {
    // Mock environment variables for API keys
    vi.stubEnv('VITE_FMP_API_KEY', 'demo');
    vi.stubEnv('VITE_ALPHAVANTAGE_API_KEY', 'demo');

    // Initialize services
    await financialDataService.initialize();
  }, 30000);

  afterAll(async () => {
    // Clean up
    await financialDataService.shutdown();
  });

  describe('Service Integration', () => {
    it('should initialize all services successfully', () => {
      expect(financialDataService.initialized).toBe(true);

      const status = financialDataService.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.services).toBeDefined();
    });

    it('should have all required services available', () => {
      expect(financialDataService.services.realtime).toBeDefined();
      expect(financialDataService.services.api).toBeDefined();
      expect(financialDataService.services.data).toBeDefined();
    });
  });

  describe('Quote Data Integration', () => {
    it('should get quote data with fallback', async () => {
      // Mock API response
      const mockQuote = {
        symbol: 'AAPL',
        price: 150.0,
        change: 2.5,
        changePercent: 1.69,
        volume: 50000000,
        source: 'fmp'
      };

      // Mock the API service
      vi.spyOn(apiIntegrationService, 'getQuote').mockResolvedValue(mockQuote);

      const quote = await financialDataService.getQuote('AAPL');

      expect(quote).toBeDefined();
      expect(quote.symbol).toBe('AAPL');
      expect(quote.price).toBe(150.0);
      expect(quote.source).toBe('fmp');
    });

    it('should handle quote data caching', async () => {
      const mockQuote = {
        symbol: 'MSFT',
        price: 300.0,
        change: 5.0,
        changePercent: 1.69,
        source: 'fmp'
      };

      // Mock API response
      vi.spyOn(apiIntegrationService, 'getQuote').mockResolvedValue(mockQuote);

      // First call should hit API
      const quote1 = await financialDataService.getQuote('MSFT');
      expect(quote1).toBeDefined();

      // Second call should hit cache
      const quote2 = await financialDataService.getQuote('MSFT');
      expect(quote2).toEqual(quote1);
    });
  });

  describe('Historical Data Integration', () => {
    it('should get historical data', async () => {
      const mockHistorical = [
        { timestamp: new Date('2024-01-01'), close: 150.0, volume: 1000000 },
        { timestamp: new Date('2024-01-02'), close: 152.5, volume: 1200000 }
      ];

      // Mock API response
      vi.spyOn(apiIntegrationService, 'getHistoricalData').mockResolvedValue(mockHistorical);

      const historical = await financialDataService.getHistoricalData('AAPL', {
        period: '1d'
      });

      expect(historical).toBeDefined();
      expect(Array.isArray(historical)).toBe(true);
      expect(historical.length).toBeGreaterThan(0);
      expect(historical[0]).toHaveProperty('timestamp');
      expect(historical[0]).toHaveProperty('close');
    });

    it('should handle historical data caching', async () => {
      const mockHistorical = [{ timestamp: new Date('2024-01-01'), close: 150.0 }];

      vi.spyOn(apiIntegrationService, 'getHistoricalData').mockResolvedValue(mockHistorical);

      // First call
      const historical1 = await financialDataService.getHistoricalData('TSLA');
      expect(historical1).toBeDefined();

      // Second call should hit cache
      const historical2 = await financialDataService.getHistoricalData('TSLA');
      expect(historical2).toEqual(historical1);
    });
  });

  describe('News Data Integration', () => {
    it('should get news data', async () => {
      const mockNews = [
        {
          title: 'Market Update',
          description: 'Latest market news',
          source: 'Reuters',
          publishedAt: new Date(),
          sentiment: 'neutral'
        }
      ];

      vi.spyOn(apiIntegrationService, 'getNews').mockResolvedValue(mockNews);

      const news = await financialDataService.getNews({
        query: 'finance'
      });

      expect(news).toBeDefined();
      expect(Array.isArray(news)).toBe(true);
      expect(news.length).toBeGreaterThan(0);
      expect(news[0]).toHaveProperty('title');
      expect(news[0]).toHaveProperty('source');
    });
  });

  describe('Economic Data Integration', () => {
    it('should get economic indicators', async () => {
      const mockEconomic = [
        { date: '2024-01-01', value: 4.5, indicator: 'GDP' },
        { date: '2024-01-02', value: 4.6, indicator: 'GDP' }
      ];

      vi.spyOn(apiIntegrationService, 'getEconomicData').mockResolvedValue(mockEconomic);

      const economic = await financialDataService.getEconomicData('GDP');

      expect(economic).toBeDefined();
      expect(Array.isArray(economic)).toBe(true);
      expect(economic.length).toBeGreaterThan(0);
      expect(economic[0]).toHaveProperty('date');
      expect(economic[0]).toHaveProperty('value');
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should handle real-time subscriptions', async () => {
      const mockCallback = vi.fn();
      const mockData = {
        symbol: 'GOOGL',
        price: 2800.0,
        change: 25.0,
        type: 'quote',
        source: 'fmp'
      };

      // Mock real-time subscription
      vi.spyOn(realtimeDataService, 'subscribe').mockResolvedValue('test_subscription');

      const subscriptionKey = await financialDataService.subscribeToQuote('GOOGL', mockCallback);

      expect(subscriptionKey).toBeDefined();
      expect(typeof subscriptionKey).toBe('string');
    });

    it('should handle real-time unsubscriptions', async () => {
      const mockUnsubscribe = vi.fn();
      vi.spyOn(realtimeDataService, 'unsubscribe').mockImplementation(mockUnsubscribe);

      await financialDataService.unsubscribeFromQuote('test_subscription');

      expect(mockUnsubscribe).toHaveBeenCalledWith('test_subscription');
    });
  });

  describe('Data Management Integration', () => {
    it('should store and retrieve data from cache', async () => {
      const testData = { symbol: 'TEST', price: 100.0 };

      await dataManagementService.store('test_key', testData, { type: 'quote' });

      const retrieved = await dataManagementService.retrieve('test_key');

      expect(retrieved).toBeDefined();
      expect(retrieved.data).toEqual(testData);
    });

    it('should handle cache expiration', async () => {
      const testData = { symbol: 'TEST', price: 100.0 };

      await dataManagementService.store('expiring_key', testData, {
        type: 'quote',
        ttl: 100 // 100ms
      });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      const retrieved = await dataManagementService.retrieve('expiring_key');
      expect(retrieved).toBeNull();
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch quote requests', async () => {
      const symbols = ['AAPL', 'MSFT', 'GOOGL'];
      const mockQuotes = {
        AAPL: { symbol: 'AAPL', price: 150.0 },
        MSFT: { symbol: 'MSFT', price: 300.0 },
        GOOGL: { symbol: 'GOOGL', price: 2800.0 }
      };

      // Mock individual quote requests
      vi.spyOn(apiIntegrationService, 'getQuote').mockImplementation(symbol =>
        Promise.resolve(mockQuotes[symbol])
      );

      const results = await financialDataService.batchGetQuotes(symbols);

      expect(results).toBeDefined();
      expect(results.AAPL).toBeDefined();
      expect(results.MSFT).toBeDefined();
      expect(results.GOOGL).toBeDefined();
      expect(results.AAPL.price).toBe(150.0);
    });
  });

  describe('Error Handling', () => {
    it('should handle API failures gracefully', async () => {
      vi.spyOn(apiIntegrationService, 'getQuote').mockRejectedValue(new Error('API Error'));

      const quote = await financialDataService.getQuote('INVALID');

      expect(quote).toBeNull();
    });

    it('should handle network timeouts', async () => {
      vi.spyOn(apiIntegrationService, 'getQuote').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(null), 10000))
      );

      const timeoutPromise = new Promise(resolve => {
        setTimeout(() => resolve('timeout'), 100);
      });

      const result = await Promise.race([financialDataService.getQuote('SLOW'), timeoutPromise]);

      expect(result).toBe('timeout');
    });
  });

  describe('Data Quality and Validation', () => {
    it('should validate quote data structure', async () => {
      const validQuote = {
        symbol: 'AAPL',
        price: 150.0,
        change: 2.5,
        changePercent: 1.69,
        volume: 50000000
      };

      const isValid = await dataManagementService.validateData(validQuote, 'quote');
      expect(isValid).toBe(true);
    });

    it('should reject invalid quote data', async () => {
      const invalidQuote = {
        symbol: 'AAPL',
        price: -100, // Invalid negative price
        volume: 50000000
      };

      const isValid = await dataManagementService.validateData(invalidQuote, 'quote');
      expect(isValid).toBe(false);
    });

    it('should normalize data formats', async () => {
      const rawQuote = {
        symbol: 'aapl', // lowercase
        price: '150.50', // string
        change: 2.5,
        changePercent: 1.69,
        volume: '50000000' // string
      };

      const normalized = await dataManagementService.normalizeData(rawQuote, 'quote');

      expect(normalized.symbol).toBe('AAPL');
      expect(normalized.price).toBe(150.5);
      expect(normalized.volume).toBe(50000000);
    });
  });

  describe('Performance Metrics', () => {
    it('should track cache performance', () => {
      const stats = dataManagementService.getCacheStats();

      expect(stats).toBeDefined();
      expect(typeof stats.hitRate).toBe('number');
      expect(typeof stats.dataProcessed).toBe('number');
      expect(typeof stats.cacheHits).toBe('number');
      expect(typeof stats.cacheMisses).toBe('number');
    });

    it('should provide service health metrics', () => {
      const status = financialDataService.getStatus();

      expect(status).toBeDefined();
      expect(status.services).toBeDefined();
      expect(status.services.data).toBeDefined();
      expect(status.services.realtime).toBeDefined();
      expect(status.services.api).toBeDefined();
    });
  });

  describe('Utility Functions', () => {
    it('should format currency correctly', () => {
      const formatted = financialDataService.formatCurrency(1234.56);
      expect(formatted).toBe('$1,234.56');
    });

    it('should format percentage correctly', () => {
      const formatted = financialDataService.formatPercentage(5.25);
      expect(formatted).toBe('+5.25%');
    });

    it('should format large numbers correctly', () => {
      expect(financialDataService.formatLargeNumber(1500000)).toBe('1.5M');
      expect(financialDataService.formatLargeNumber(2500000000)).toBe('2.5B');
    });
  });
});
