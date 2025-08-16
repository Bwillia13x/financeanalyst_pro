import express from 'express';
import rateLimit from 'express-rate-limit';
import { param, query, validationResult } from 'express-validator';

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

// Route-level rate limiters for economic data
const fredLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_ECON_FRED || '60'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many FRED requests. Please slow down.' }
});

const econMetaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_ECON_META || '30'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many economic metadata requests. Please try again later.' }
});

// TTLs (seconds) for caching, configurable via environment
const ECON_TTL = parseInt(process.env.CACHE_TTL_ECONOMIC_DATA || '3600', 10);
const ECON_META_TTL = parseInt(process.env.CACHE_TTL_ECONOMIC_META || '1800', 10);

/**
 * GET /api/economic-data/fred/:seriesId
 * Get economic data from FRED (Federal Reserve Economic Data)
 */
router.get('/fred/:seriesId',
  param('seriesId').isAlphanumeric().isLength({ min: 1, max: 20 }).toUpperCase(),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  fredLimiter,
  validateRequest,
  async(req, res) => {
    try {
      const { seriesId } = req.params;
      const { limit = 100, start_date: startDate, end_date: endDate } = req.query;

      const fredData = await apiService.makeApiRequest({
        service: 'fred',
        endpoint: 'series/observations',
        params: {
          series_id: seriesId,
          limit,
          sort_order: 'desc',
          ...(startDate && { observation_start: startDate }),
          ...(endDate && { observation_end: endDate })
        },
        cacheType: 'economic',
        cacheTtl: ECON_TTL // 1 hour cache (configurable)
      });

      if (fredData.observations) {
        const processedData = fredData.observations
          .filter(obs => obs.value !== '.')
          .map(obs => ({
            date: obs.date,
            value: parseFloat(obs.value)
          }))
          .reverse(); // Show chronological order

        const response = {
          seriesId,
          data: processedData,
          units: fredData.units || 'Unknown',
          title: fredData.title || seriesId,
          timestamp: new Date().toISOString(),
          source: 'fred'
        };

        res.set('Cache-Control', `public, max-age=${ECON_TTL}, stale-while-revalidate=60`);
        return res.json(response);
      }

      throw new Error('No FRED data available');

    } catch (error) {
      console.error(`FRED data error for ${req.params.seriesId}:`, error);
      res.status(500).json({
        error: 'Failed to fetch FRED data',
        message: error.message,
        seriesId: req.params.seriesId
      });
    }
  }
);

/**
 * GET /api/economic-data/indicators
 * Get popular economic indicators
 */
router.get('/indicators', econMetaLimiter, async(req, res) => {
  try {
    const indicators = [
      { id: 'GDP', name: 'Gross Domestic Product', seriesId: 'GDP' },
      { id: 'UNRATE', name: 'Unemployment Rate', seriesId: 'UNRATE' },
      { id: 'FEDFUNDS', name: 'Federal Funds Rate', seriesId: 'FEDFUNDS' },
      { id: 'CPIAUCSL', name: 'Consumer Price Index', seriesId: 'CPIAUCSL' },
      { id: 'DGS10', name: '10-Year Treasury Rate', seriesId: 'DGS10' },
      { id: 'DGS2', name: '2-Year Treasury Rate', seriesId: 'DGS2' },
      { id: 'VIXCLS', name: 'VIX Volatility Index', seriesId: 'VIXCLS' },
      { id: 'DEXUSEU', name: 'USD/EUR Exchange Rate', seriesId: 'DEXUSEU' }
    ];

    // Fetch recent data for each indicator
    const promises = indicators.map(async(indicator) => {
      try {
        const data = await apiService.makeApiRequest({
          service: 'fred',
          endpoint: 'series/observations',
          params: {
            series_id: indicator.seriesId,
            limit: 1,
            sort_order: 'desc'
          },
          cacheType: 'economic',
          cacheTtl: ECON_META_TTL // 30 minutes cache (configurable)
        });

        const latestValue = data.observations?.[0];
        return {
          ...indicator,
          latestValue: latestValue?.value !== '.' ? parseFloat(latestValue.value) : null,
          latestDate: latestValue?.date || null
        };
      } catch (error) {
        console.error(`Failed to fetch ${indicator.seriesId}:`, error);
        return {
          ...indicator,
          latestValue: null,
          latestDate: null,
          error: error.message
        };
      }
    });

    const indicatorData = await Promise.all(promises);

    const response = {
      indicators: indicatorData,
      timestamp: new Date().toISOString(),
      source: 'fred'
    };

    res.set('Cache-Control', `public, max-age=${ECON_META_TTL}, stale-while-revalidate=60`);
    res.json(response);

  } catch (error) {
    console.error('Economic indicators error:', error);
    res.status(500).json({
      error: 'Failed to fetch economic indicators',
      message: error.message
    });
  }
});

/**
 * GET /api/economic-data/treasury-rates
 * Get treasury yield curve data
 */
router.get('/treasury-rates', econMetaLimiter, async(req, res) => {
  try {
    const treasuryRates = [
      { maturity: '1M', seriesId: 'DGS1MO', name: '1-Month' },
      { maturity: '3M', seriesId: 'DGS3MO', name: '3-Month' },
      { maturity: '6M', seriesId: 'DGS6MO', name: '6-Month' },
      { maturity: '1Y', seriesId: 'DGS1', name: '1-Year' },
      { maturity: '2Y', seriesId: 'DGS2', name: '2-Year' },
      { maturity: '3Y', seriesId: 'DGS3', name: '3-Year' },
      { maturity: '5Y', seriesId: 'DGS5', name: '5-Year' },
      { maturity: '7Y', seriesId: 'DGS7', name: '7-Year' },
      { maturity: '10Y', seriesId: 'DGS10', name: '10-Year' },
      { maturity: '20Y', seriesId: 'DGS20', name: '20-Year' },
      { maturity: '30Y', seriesId: 'DGS30', name: '30-Year' }
    ];

    const promises = treasuryRates.map(async(rate) => {
      try {
        const data = await apiService.makeApiRequest({
          service: 'fred',
          endpoint: 'series/observations',
          params: {
            series_id: rate.seriesId,
            limit: 1,
            sort_order: 'desc'
          },
          cacheType: 'economic',
          cacheTtl: ECON_META_TTL // 30 minutes cache (configurable)
        });

        const latestValue = data.observations?.[0];
        return {
          ...rate,
          rate: latestValue?.value !== '.' ? parseFloat(latestValue.value) : null,
          date: latestValue?.date || null
        };
      } catch (error) {
        console.error(`Failed to fetch ${rate.seriesId}:`, error);
        return {
          ...rate,
          rate: null,
          date: null,
          error: error.message
        };
      }
    });

    const yieldCurve = await Promise.all(promises);

    const response = {
      yieldCurve: yieldCurve.filter(rate => rate.rate !== null),
      timestamp: new Date().toISOString(),
      source: 'fred'
    };

    res.set('Cache-Control', `public, max-age=${ECON_META_TTL}, stale-while-revalidate=60`);
    res.json(response);

  } catch (error) {
    console.error('Treasury rates error:', error);
    res.status(500).json({
      error: 'Failed to fetch treasury rates',
      message: error.message
    });
  }
});

export default router;
