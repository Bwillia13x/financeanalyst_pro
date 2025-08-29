import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';

describe('Market Data Routes', () => {
  describe('GET /api/market-data/quote/:symbol', () => {
    test('should get quote for valid symbol', async () => {
      const response = await request(app)
        .get('/api/market-data/quote/AAPL')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.quote).toBeDefined();
      expect(response.body.quote.symbol).toBe('AAPL');
      expect(response.body.quote.regularMarketPrice).toBeGreaterThan(0);
    }, 10000); // 10s timeout for external API

    test('should handle invalid symbol gracefully', async () => {
      const response = await request(app)
        .get('/api/market-data/quote/INVALIDTICKER123')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('should accept symbols with dots and dashes', async () => {
      const response = await request(app)
        .get('/api/market-data/quote/BRK.B')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.quote.symbol).toMatch(/BRK/);
    }, 10000);

    test('should validate symbol parameter', async () => {
      const response = await request(app)
        .get('/api/market-data/quote/')
        .expect(404);
    });
  });

  describe('GET /api/market-data/historical/:symbol', () => {
    test('should get historical data for valid symbol', async () => {
      const response = await request(app)
        .get('/api/market-data/historical/AAPL?range=1mo&interval=1d')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.historical).toBeDefined();
      expect(Array.isArray(response.body.historical.prices)).toBe(true);
      expect(response.body.historical.prices.length).toBeGreaterThan(0);
    }, 15000);

    test('should use default parameters when not provided', async () => {
      const response = await request(app)
        .get('/api/market-data/historical/AAPL')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.historical).toBeDefined();
    }, 15000);

    test('should validate range parameter', async () => {
      const response = await request(app)
        .get('/api/market-data/historical/AAPL?range=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/market-data/intraday/:symbol', () => {
    test('should get intraday data for valid symbol', async () => {
      const response = await request(app)
        .get('/api/market-data/intraday/AAPL?interval=5min')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.intraday).toBeDefined();
    }, 15000);

    test('should validate interval parameter', async () => {
      const response = await request(app)
        .get('/api/market-data/intraday/AAPL?interval=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/market-data/batch-quotes', () => {
    test('should get quotes for multiple symbols', async () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT'];
      
      const response = await request(app)
        .post('/api/market-data/batch-quotes')
        .send({ symbols })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.quotes).toBeDefined();
      expect(Array.isArray(response.body.quotes)).toBe(true);
      expect(response.body.quotes.length).toBeLessThanOrEqual(symbols.length);
    }, 20000);

    test('should validate symbols array', async () => {
      const response = await request(app)
        .post('/api/market-data/batch-quotes')
        .send({ symbols: 'not-an-array' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should limit number of symbols', async () => {
      const symbols = Array(101).fill('AAPL'); // More than limit
      
      const response = await request(app)
        .post('/api/market-data/batch-quotes')
        .send({ symbols })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });
});
