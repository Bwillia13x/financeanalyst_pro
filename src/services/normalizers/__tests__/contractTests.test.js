import { describe, it, expect } from 'vitest';
import { normalizeQuote } from '../marketDataNormalizer';

/**
 * Contract Tests for Data Normalizers
 * These tests verify that normalizers maintain consistent contracts
 * regardless of input data variations from different sources
 */

describe('Data Normalizer Contract Tests', () => {
  describe('normalizeQuote contract', () => {
    it('should always return required fields with proper types', () => {
      const result = normalizeQuote({});

      // Contract: Must always return an object with these fields
      expect(result).toHaveProperty('symbol');
      expect(result).toHaveProperty('currentPrice');
      expect(result).toHaveProperty('previousClose');
      expect(result).toHaveProperty('change');
      expect(result).toHaveProperty('changePercent');
      expect(result).toHaveProperty('volume');
      expect(result).toHaveProperty('marketCap');
      expect(result).toHaveProperty('dayHigh');
      expect(result).toHaveProperty('dayLow');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('timestamp');

      // Contract: String fields should be string or undefined/null
      expect(['string', 'undefined'].includes(typeof result.symbol)).toBe(true);
      expect(['string'].includes(typeof result.source)).toBe(true);
      expect(['string'].includes(typeof result.timestamp)).toBe(true);

      // Contract: Numeric fields should be number, null, or undefined
      expect(['number', 'undefined'].includes(typeof result.currentPrice)).toBe(true);
      expect(['number', 'undefined'].includes(typeof result.previousClose)).toBe(true);
      expect(['number', 'undefined'].includes(typeof result.change)).toBe(true);
      expect(['number', 'undefined'].includes(typeof result.changePercent)).toBe(true);

      // Contract: Optional fields can be null
      expect([null, 'number'].includes(result.volume)).toBe(true);
      expect([null, 'number'].includes(result.marketCap)).toBe(true);
      expect([null, 'number'].includes(result.dayHigh)).toBe(true);
      expect([null, 'number'].includes(result.dayLow)).toBe(true);
    });

    it('should handle Yahoo Finance API format', () => {
      const yahooData = {
        symbol: 'AAPL',
        price: 150.25,
        previousClose: 148.50,
        volume: 45000000,
        marketCap: 2400000000000,
        dayHigh: 151.20,
        dayLow: 149.80,
        source: 'YAHOO'
      };

      const result = normalizeQuote(yahooData);

      expect(result.symbol).toBe('AAPL');
      expect(result.currentPrice).toBe(150.25);
      expect(result.previousClose).toBe(148.50);
      expect(result.change).toBeCloseTo(1.75, 2);
      expect(result.changePercent).toBeCloseTo(1.178, 2);
      expect(result.volume).toBe(45000000);
      expect(result.source).toBe('YAHOO');
    });

    it('should handle Alpha Vantage API format', () => {
      const alphaVantageData = {
        symbol: 'MSFT',
        currentPrice: 280.45,
        previousClose: 275.30,
        volume: 25000000,
        source: 'ALPHA_VANTAGE'
      };

      const result = normalizeQuote(alphaVantageData);

      expect(result.symbol).toBe('MSFT');
      expect(result.currentPrice).toBe(280.45);
      expect(result.previousClose).toBe(275.30);
      expect(result.change).toBeCloseTo(5.15, 2);
      expect(result.changePercent).toBeCloseTo(1.871, 2);
    });

    it('should handle Polygon.io API format', () => {
      const polygonData = {
        symbol: 'GOOGL',
        price: 2650.80,
        change: 25.40,
        changePercent: 0.967,
        volume: 1200000,
        marketCap: 1800000000000,
        source: 'POLYGON'
      };

      const result = normalizeQuote(polygonData);

      expect(result.symbol).toBe('GOOGL');
      expect(result.currentPrice).toBe(2650.80);
      expect(result.change).toBe(25.40);
      expect(result.changePercent).toBe(0.967);
    });

    it('should calculate missing change values', () => {
      const dataWithMissingChange = {
        symbol: 'TSLA',
        price: 750.25,
        previousClose: 725.00
      };

      const result = normalizeQuote(dataWithMissingChange);

      expect(result.change).toBeCloseTo(25.25, 2);
      expect(result.changePercent).toBeCloseTo(3.483, 2);
    });

    it('should handle partial data gracefully', () => {
      const partialData = {
        symbol: 'NFLX',
        price: 450.75
        // Missing previousClose
      };

      const result = normalizeQuote(partialData);

      expect(result.symbol).toBe('NFLX');
      expect(result.currentPrice).toBe(450.75);
      expect(result.previousClose).toBeUndefined();
      expect(result.change).toBeUndefined();
      expect(result.changePercent).toBeUndefined();
    });

    it('should preserve fallback from previous widget data', () => {
      const newData = {
        symbol: 'AMD',
        price: 95.30
      };

      const prevWidget = {
        symbol: 'AMD',
        currentValue: 92.80,
        volume: 15000000,
        marketCap: 150000000000,
        dayHigh: 96.50,
        dayLow: 91.20
      };

      const result = normalizeQuote(newData, prevWidget);

      expect(result.symbol).toBe('AMD');
      expect(result.currentPrice).toBe(95.30);
      expect(result.previousClose).toBe(92.80);
      expect(result.volume).toBe(15000000);
      expect(result.marketCap).toBe(150000000000);
      expect(result.dayHigh).toBe(96.50);
      expect(result.dayLow).toBe(91.20);
    });

    it('should handle edge cases and invalid data', () => {
      const edgeCases = [
        null,
        undefined,
        {},
        { symbol: null },
        { price: null },
        { price: 'invalid' },
        { price: NaN },
        { price: Infinity },
        { previousClose: 0, price: 100 } // Division by zero case
      ];

      edgeCases.forEach(data => {
        expect(() => normalizeQuote(data)).not.toThrow();
        const result = normalizeQuote(data);
        expect(typeof result).toBe('object');
        expect(result).not.toBeNull();
      });
    });

    it('should maintain timestamp format consistency', () => {
      const dataWithTimestamp = {
        symbol: 'IBM',
        price: 130.45,
        timestamp: '2024-08-22T18:00:00Z'
      };

      const result = normalizeQuote(dataWithTimestamp);
      expect(result.timestamp).toBe('2024-08-22T18:00:00Z');

      // Without timestamp should generate ISO string
      const dataWithoutTimestamp = {
        symbol: 'IBM',
        price: 130.45
      };

      const resultWithoutTimestamp = normalizeQuote(dataWithoutTimestamp);
      expect(resultWithoutTimestamp.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should handle source field consistently', () => {
      const dataWithSource = { symbol: 'AAPL', source: 'CUSTOM_API' };
      const resultWithSource = normalizeQuote(dataWithSource);
      expect(resultWithSource.source).toBe('CUSTOM_API');

      const dataWithoutSource = { symbol: 'AAPL' };
      const resultWithoutSource = normalizeQuote(dataWithoutSource);
      expect(resultWithoutSource.source).toBe('BACKEND_PROXY');
    });

    it('should preserve numeric precision', () => {
      const preciseData = {
        symbol: 'BTC',
        price: 42356.789123,
        previousClose: 41234.567890,
        volume: 1234567890.123456
      };

      const result = normalizeQuote(preciseData);

      expect(result.currentPrice).toBe(42356.789123);
      expect(result.previousClose).toBe(41234.567890);
      expect(result.volume).toBe(1234567890.123456);
      expect(result.change).toBeCloseTo(1122.221233, 6);
    });
  });

  describe('Cross-normalizer consistency', () => {
    it('should produce consistent output formats across normalizers', () => {
      const sampleData = {
        symbol: 'TEST',
        price: 100.50,
        previousClose: 99.00
      };

      const result = normalizeQuote(sampleData);

      // All normalizers should follow these conventions:
      // 1. Required fields are always present (even if undefined/null)
      // 2. Numeric fields are actual numbers or null/undefined
      // 3. String fields are strings
      // 4. Timestamps are ISO format strings
      // 5. No unexpected additional fields

      const expectedFields = [
        'symbol', 'currentPrice', 'previousClose', 'change', 'changePercent',
        'volume', 'marketCap', 'dayHigh', 'dayLow', 'source', 'timestamp'
      ];

      const actualFields = Object.keys(result);
      expectedFields.forEach(field => {
        expect(actualFields).toContain(field);
      });

      // Should not contain unexpected fields
      expect(actualFields.length).toBe(expectedFields.length);
    });
  });

  describe('Data pipeline integration contracts', () => {
    it('should be compatible with Redux store structure', () => {
      const normalizedData = normalizeQuote({
        symbol: 'AAPL',
        price: 150.25,
        previousClose: 148.50
      });

      // Should be serializable for Redux
      expect(() => JSON.stringify(normalizedData)).not.toThrow();
      expect(() => JSON.parse(JSON.stringify(normalizedData))).not.toThrow();

      const serialized = JSON.parse(JSON.stringify(normalizedData));
      expect(serialized).toEqual(normalizedData);
    });

    it('should maintain referential transparency', () => {
      const input = {
        symbol: 'AAPL',
        price: 150.25,
        previousClose: 148.50
      };

      const result1 = normalizeQuote(input);
      const result2 = normalizeQuote(input);

      // Same input should produce same output (excluding timestamp)
      expect(result1.symbol).toBe(result2.symbol);
      expect(result1.currentPrice).toBe(result2.currentPrice);
      expect(result1.change).toBe(result2.change);
      expect(result1.changePercent).toBe(result2.changePercent);
    });

    it('should be composable with other data transformations', () => {
      const rawData = {
        symbol: 'AAPL',
        price: 150.25,
        previousClose: 148.50
      };

      const normalized = normalizeQuote(rawData);

      // Should be transformable for different use cases
      const forChart = {
        x: normalized.timestamp,
        y: normalized.currentPrice,
        label: normalized.symbol
      };

      const forTable = {
        symbol: normalized.symbol,
        price: normalized.currentPrice,
        change: `${normalized.change > 0 ? '+' : ''}${normalized.change}`,
        changePercent: `${normalized.changePercent?.toFixed(2)}%`
      };

      expect(forChart.y).toBe(150.25);
      expect(forTable.symbol).toBe('AAPL');
      expect(forTable.changePercent).toBe('1.18%');
    });
  });
});
