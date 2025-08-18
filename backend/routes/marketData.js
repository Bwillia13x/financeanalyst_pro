import express from 'express';
import { body, param, query, validationResult } from 'express-validator';

import apiService from '../services/apiService.js';

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * GET /api/market-data/quote/:symbol
 * Get real-time quote for a symbol
 */
router.get('/quote/:symbol',
  param('symbol').isAlpha().isLength({ min: 1, max: 5 }).toUpperCase(),
  validateRequest,
  async(req, res) => {
    try {
      const { symbol } = req.params;

      // Try Yahoo Finance first (no API key required)
      try {
        const yahooData = await apiService.makeApiRequest({
          service: 'yahoo',
          endpoint: symbol,
          params: {
            range: '1d',
            interval: '1m'
          },
          cacheType: 'market',
          cacheTtl: 60 // 1 minute cache for real-time data
        });

        if (yahooData?.chart?.result?.[0]) {
          const result = yahooData.chart.result[0];
          const meta = result.meta;
          const quote = result.indicators?.quote?.[0];
          const latest = quote && quote.close ? quote.close[quote.close.length - 1] : null;

          const response = {
            symbol: meta.symbol,
            price: latest || meta.regularMarketPrice,
            previousClose: meta.previousClose,
            change: meta.regularMarketPrice - meta.previousClose,
            changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100).toFixed(2),
            volume: meta.regularMarketVolume,
            marketCap: meta.marketCap,
            currency: meta.currency,
            exchangeTimezoneName: meta.exchangeTimezoneName,
            timestamp: new Date().toISOString(),
            source: 'yahoo_finance'
          };

          return res.json(response);
        }
      } catch (yahooError) {
        console.log('Yahoo Finance failed, trying Alpha Vantage...');
      }

      // Fallback to Alpha Vantage
      const alphaData = await apiService.makeApiRequest({
        service: 'alphaVantage',
        endpoint: 'GLOBAL_QUOTE',
        params: { symbol },
        cacheType: 'market',
        cacheTtl: 300 // 5 minute cache
      });

      if (alphaData['Global Quote']) {
        const quote = alphaData['Global Quote'];
        const response = {
          symbol: quote['01. symbol'],
          price: parseFloat(quote['05. price']),
          previousClose: parseFloat(quote['08. previous close']),
          change: parseFloat(quote['09. change']),
          changePercent: quote['10. change percent'],
          volume: parseInt(quote['06. volume']),
          timestamp: new Date().toISOString(),
          source: 'alpha_vantage'
        };

        return res.json(response);
      }

      // If all else fails, return demo data
      throw new Error('No data available from any source');

    } catch (error) {
      console.error(`Market data error for ${req.params.symbol}:`, error);
      res.status(500).json({
        error: 'Failed to fetch market data',
        message: error.message,
        symbol: req.params.symbol
      });
    }
  }
);

/**
 * GET /api/market-data/historical/:symbol
 * Get historical price data for a symbol
 */
router.get('/historical/:symbol',
  param('symbol').isAlpha().isLength({ min: 1, max: 5 }).toUpperCase(),
  query('range').optional().isIn(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y']),
  query('interval').optional().isIn(['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo']),
  validateRequest,
  async(req, res) => {
    try {
      const { symbol } = req.params;
      const { range = '1mo', interval = '1d' } = req.query;

      // Use Yahoo Finance for historical data
      const yahooData = await apiService.makeApiRequest({
        service: 'yahoo',
        endpoint: symbol,
        params: { range, interval },
        cacheType: 'market',
        cacheTtl: range === '1d' ? 300 : 3600 // 5 min for intraday, 1 hour for daily+
      });

      if (yahooData?.chart?.result?.[0]) {
        const result = yahooData.chart.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];

        const historicalData = timestamps.map((timestamp, index) => ({
          timestamp: new Date(timestamp * 1000).toISOString(),
          open: quotes.open[index],
          high: quotes.high[index],
          low: quotes.low[index],
          close: quotes.close[index],
          volume: quotes.volume[index]
        })).filter(data => data.close !== null);

        const response = {
          symbol: result.meta.symbol,
          range,
          interval,
          data: historicalData,
          meta: {
            currency: result.meta.currency,
            exchangeTimezoneName: result.meta.exchangeTimezoneName,
            instrumentType: result.meta.instrumentType
          },
          timestamp: new Date().toISOString(),
          source: 'yahoo_finance'
        };

        return res.json(response);
      }

      throw new Error('No historical data available');

    } catch (error) {
      console.error(`Historical data error for ${req.params.symbol}:`, error);
      res.status(500).json({
        error: 'Failed to fetch historical data',
        message: error.message,
        symbol: req.params.symbol
      });
    }
  }
);

/**
 * GET /api/market-data/intraday/:symbol
 * Get intraday price data with technical indicators
 */
router.get('/intraday/:symbol',
  param('symbol').isAlpha().isLength({ min: 1, max: 5 }).toUpperCase(),
  query('interval').optional().isIn(['1min', '5min', '15min', '30min', '60min']),
  validateRequest,
  async(req, res) => {
    try {
      const { symbol } = req.params;
      const { interval = '5min' } = req.query;

      const alphaData = await apiService.makeApiRequest({
        service: 'alphaVantage',
        endpoint: 'TIME_SERIES_INTRADAY',
        params: {
          symbol,
          interval,
          outputsize: 'compact'
        },
        cacheType: 'market',
        cacheTtl: 300 // 5 minute cache
      });

      const timeSeriesKey = `Time Series (${interval})`;
      if (alphaData[timeSeriesKey]) {
        const timeSeries = alphaData[timeSeriesKey];
        const data = Object.entries(timeSeries).map(([timestamp, values]) => ({
          timestamp,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume'])
        })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const response = {
          symbol,
          interval,
          data,
          timestamp: new Date().toISOString(),
          source: 'alpha_vantage'
        };

        return res.json(response);
      }

      throw new Error('No intraday data available');

    } catch (error) {
      console.error(`Intraday data error for ${req.params.symbol}:`, error);
      res.status(500).json({
        error: 'Failed to fetch intraday data',
        message: error.message,
        symbol: req.params.symbol
      });
    }
  }
);

/**
 * POST /api/market-data/batch
 * Get quotes for multiple symbols
 */
router.post('/batch',
  body('symbols').isArray({ min: 1, max: 10 }),
  body('symbols.*').isAlpha().isLength({ min: 1, max: 5 }),
  validateRequest,
  async(req, res) => {
    try {
      const { symbols } = req.body;
      const results = {};

      // Process symbols in parallel with error handling
      const promises = symbols.map(async(symbol) => {
        try {
          const data = await apiService.makeApiRequest({
            service: 'yahoo',
            endpoint: symbol.toUpperCase(),
            params: { range: '1d', interval: '1m' },
            cacheType: 'market',
            cacheTtl: 60
          });

          if (data?.chart?.result?.[0]) {
            const result = data.chart.result[0];
            const meta = result.meta;

            results[symbol] = {
              symbol: meta.symbol,
              price: meta.regularMarketPrice,
              previousClose: meta.previousClose,
              change: meta.regularMarketPrice - meta.previousClose,
              changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100).toFixed(2),
              volume: meta.regularMarketVolume,
              currency: meta.currency,
              source: 'yahoo_finance'
            };
          } else {
            results[symbol] = { error: 'No data available' };
          }
        } catch (error) {
          results[symbol] = { error: error.message };
        }
      });

      await Promise.all(promises);

      res.json({
        symbols: results,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Batch market data error:', error);
      res.status(500).json({
        error: 'Failed to fetch batch market data',
        message: error.message
      });
    }
  }
);

export default router;
