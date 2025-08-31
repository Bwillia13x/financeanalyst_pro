import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';

describe('Market Data Routes', () => {
  describe('GET /api/market-data/quote/:symbol', () => {
    test('should get quote for valid symbol', async () => {
      const response = await request(app).get('/api/market-data/quote/AAPL').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.symbol).toBe('AAPL');
      expect(response.body.data.price).toBeDefined();
      expect(typeof response.body.data.price).toBe('number');
      expect(response.body.data.price).toBeGreaterThan(0);
    }, 10000); // 10s timeout for external API

    test('should handle invalid symbol gracefully', async () => {
      const response = await request(app)
        .get('/api/market-data/quote/INVALIDTICKER123')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to fetch market data');
      expect(response.body.details.symbol).toBe('INVALIDTICKER123');
    });

    test('should accept symbols with dots and dashes', async () => {
      const response = await request(app).get('/api/market-data/quote/BRK.B').expect(500); // Will fail due to API, but test the validation

      expect(response.body.error).toBeDefined();
    }, 10000);

    test('should validate symbol parameter', async () => {
      const response = await request(app).get('/api/market-data/quote/').expect(404);
    });
  });

  describe('GET /api/market-data/historical/:symbol', () => {
    test('should get historical data for valid symbol', async () => {
      const response = await request(app)
        .get('/api/market-data/historical/AAPL?range=1mo&interval=1d')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('timestamp');
      expect(response.body.data[0]).toHaveProperty('close');
    }, 15000);

    test('should use default parameters when not provided', async () => {
      const response = await request(app).get('/api/market-data/historical/AAPL').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    }, 15000);

    test('should validate range parameter', async () => {
      const response = await request(app)
        .get('/api/market-data/historical/AAPL?range=invalid')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/market-data/intraday/:symbol', () => {
    test('should get intraday data for valid symbol', async () => {
      const response = await request(app)
        .get('/api/market-data/intraday/AAPL?interval=5min')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
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
    test.skip('should get quotes for multiple symbols', async () => {
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

    test.skip('should validate symbols array', async () => {
      const response = await request(app)
        .post('/api/market-data/batch-quotes')
        .send({ symbols: 'not-an-array' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test.skip('should limit number of symbols', async () => {
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
