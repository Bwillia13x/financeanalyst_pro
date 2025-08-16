import express from 'express';
import rateLimit from 'express-rate-limit';
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

// Route-level rate limiters
const quoteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_QUOTE || '60'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many quote requests. Please try again shortly.' }
});

const historicalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_HISTORICAL || '30'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many historical data requests. Please slow down.' }
});

const intradayLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_INTRADAY || '30'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many intraday requests. Please try again later.' }
});

/**
 * GET /api/market-data/quote/:symbol
 * Get real-time quote for a symbol
 */
router.get('/quote/:symbol',
  param('symbol').matches(/^[A-Za-z0-9.-]{1,12}$/).toUpperCase(),
  quoteLimiter,
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
          const latest = quote && quote.close ? parseFloat(quote.close[quote.close.length - 1]) : null;
          const price = latest ?? (meta?.regularMarketPrice != null ? parseFloat(meta.regularMarketPrice) : null);
          const previousClose = meta?.previousClose != null ? parseFloat(meta.previousClose) : null;
          const change = price != null && previousClose != null ? price - previousClose : null;
          const changePercentNumber = change != null && previousClose > 0 ? (change / previousClose) * 100 : null;

          const response = {
            symbol: meta.symbol,
            price,
            previousClose,
            change,
            changePercent: changePercentNumber != null ? `${changePercentNumber.toFixed(2)}%` : null,
            changePercentNumber,
            volume: meta?.regularMarketVolume != null ? parseInt(meta.regularMarketVolume) : null,
            marketCap: meta?.marketCap != null ? parseInt(meta.marketCap) : null,
            currency: meta.currency,
            exchangeTimezoneName: meta.exchangeTimezoneName,
            timestamp: new Date().toISOString(),
            source: 'yahoo_finance'
          };

          res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
          return res.json(response);
        }
      } catch (yahooError) {
        console.warn('Yahoo Finance failed, trying Alpha Vantage...', yahooError?.message);
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
          changePercentNumber: parseFloat(quote['10. change percent']),
          volume: parseInt(quote['06. volume']),
          timestamp: new Date().toISOString(),
          source: 'alpha_vantage'
        };

        res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
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
  param('symbol').matches(/^[A-Za-z0-9.-]{1,12}$/).toUpperCase(),
  query('range').optional().isIn(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y']),
  query('interval').optional().isIn(['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo']),
  historicalLimiter,
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
          open: quotes.open[index] != null ? parseFloat(quotes.open[index]) : null,
          high: quotes.high[index] != null ? parseFloat(quotes.high[index]) : null,
          low: quotes.low[index] != null ? parseFloat(quotes.low[index]) : null,
          close: quotes.close[index] != null ? parseFloat(quotes.close[index]) : null,
          volume: quotes.volume[index] != null ? parseInt(quotes.volume[index]) : null
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

        const ttl = range === '1d' ? 300 : 3600;
        res.set('Cache-Control', `public, max-age=${ttl}, stale-while-revalidate=60`);
        return res.json(response);
      }

      // Fallback: Alpha Vantage TIME_SERIES_DAILY_ADJUSTED
      const outputsize = ['2y', '5y'].includes(range) ? 'full' : 'compact';
      const alphaDaily = await apiService.makeApiRequest({
        service: 'alphaVantage',
        endpoint: 'TIME_SERIES_DAILY_ADJUSTED',
        params: { symbol, outputsize },
        cacheType: 'market',
        cacheTtl: 3600
      });

      const series = alphaDaily['Time Series (Daily)'];
      if (series) {
        const allData = Object.entries(series).map(([date, values]) => ({
          // Alpha returns latest first; convert to ISO timestamp at 20:00:00Z for day end
          timestamp: new Date(date + 'T20:00:00Z').toISOString(),
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['6. volume'])
        })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Slice based on range
        const rangeToDays = {
          '5d': 5,
          '1mo': 30,
          '3mo': 90,
          '6mo': 180,
          '1y': 365,
          '2y': 730,
          '5y': 1825
        };
        let data = allData;
        if (range === '1d') {
          data = allData.slice(-1);
        } else if (rangeToDays[range]) {
          data = allData.slice(-rangeToDays[range]);
        }

        const response = {
          symbol,
          range,
          interval: '1d',
          data,
          meta: {},
          timestamp: new Date().toISOString(),
          source: 'alpha_vantage'
        };

        res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=60');
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
  param('symbol').matches(/^[A-Za-z0-9.-]{1,12}$/).toUpperCase(),
  query('interval').optional().isIn(['1min', '5min', '15min', '30min', '60min']),
  intradayLimiter,
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
          source: 'alpha_vantage',
          meta: {}
        };

        res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
        return res.json(response);
      }

      // Fallback: Alpha Vantage TIME_SERIES_DAILY_ADJUSTED
      const outputsize = 'compact';
      const alphaDaily = await apiService.makeApiRequest({
        service: 'alphaVantage',
        endpoint: 'TIME_SERIES_DAILY_ADJUSTED',
        params: { symbol, outputsize },
        cacheType: 'market',
        cacheTtl: 3600
      });

      const series = alphaDaily['Time Series (Daily)'];
      if (series) {
        const allData = Object.entries(series).map(([date, values]) => ({
          // Alpha returns latest first; convert to ISO timestamp at 20:00:00Z for day end
          timestamp: new Date(date + 'T20:00:00Z').toISOString(),
          open: Number(values['1. open']),
          high: Number(values['2. high']),
          low: Number(values['3. low']),
          close: Number(values['4. close']),
          volume: Number(values['6. volume'])
        })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Slice based on interval
        const intervalToDays = {
          '1min': 1,
          '5min': 1,
          '15min': 1,
          '30min': 1,
          '60min': 1
        };
        let data = allData;
        if (intervalToDays[interval]) {
          data = allData.slice(-intervalToDays[interval]);
        }

        const response = {
          symbol,
          interval,
          data,
          meta: {},
          timestamp: new Date().toISOString(),
          source: 'alpha_vantage'
        };

        res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=60');
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
  body('symbols.*').matches(/^[A-Za-z0-9.-]{1,12}$/),
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
              price: meta?.regularMarketPrice != null ? parseFloat(meta.regularMarketPrice) : null,
              previousClose: meta?.previousClose != null ? parseFloat(meta.previousClose) : null,
              change: meta?.regularMarketPrice != null && meta?.previousClose != null ? (parseFloat(meta.regularMarketPrice) - parseFloat(meta.previousClose)) : null,
              changePercentNumber: (meta?.regularMarketPrice != null && meta?.previousClose > 0)
                ? ((parseFloat(meta.regularMarketPrice) - parseFloat(meta.previousClose)) / parseFloat(meta.previousClose) * 100)
                : null,
              changePercent: (meta?.regularMarketPrice != null && meta?.previousClose > 0)
                ? (((parseFloat(meta.regularMarketPrice) - parseFloat(meta.previousClose)) / parseFloat(meta.previousClose) * 100).toFixed(2))
                : null,
              volume: meta?.regularMarketVolume != null ? parseInt(meta.regularMarketVolume) : null,
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

      res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
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
