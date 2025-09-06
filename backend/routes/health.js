import express from 'express';

import apiService from '../services/apiService.js';
import cacheService from '../services/cacheService.js';

const router = express.Router();

// Standardized response helpers
const sendSuccess = (res, data, message = null, status = 200) => {
  const response = {
    success: true,
    data: data,
    ...(message && { message })
  };
  return res.status(status).json(response);
};

const sendError = (res, message, status = 500, details = null) => {
  const response = {
    success: false,
    message: message,
    ...(details && { details })
  };
  return res.status(status).json(response);
};

/**
 * GET /api/health
 * General health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      demoMode: process.env.DEMO_MODE === 'true'
    };

    sendSuccess(res, health, 'System is healthy');
  } catch (error) {
    console.error('Health check failed:', error);
    sendError(res, 'Health check failed', 500, {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/services
 * Check health of external API services
 */
router.get('/services', async (req, res) => {
  try {
    const serviceHealth = await apiService.healthCheck();

    const overallStatus = Object.values(serviceHealth).every(
      service => service.status === 'available' || service.status === 'not_configured'
    )
      ? 'healthy'
      : 'degraded';

    const data = {
      status: overallStatus,
      services: serviceHealth,
      timestamp: new Date().toISOString()
    };

    sendSuccess(res, data, 'Service health check completed');
  } catch (error) {
    console.error('Service health check failed:', error);
    sendError(res, 'Service health check failed', 500, {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/cache
 * Cache statistics and health
 */
router.get('/cache', (req, res) => {
  try {
    const cacheStats = cacheService.getStats();

    const data = {
      status: 'healthy',
      cache: cacheStats,
      timestamp: new Date().toISOString()
    };

    sendSuccess(res, data, 'Cache health check completed');
  } catch (error) {
    console.error('Cache health check failed:', error);
    sendError(res, 'Cache health check failed', 500, {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/health/warmup
 * Warm up common caches server-side (dev/admin)
 */
router.post('/warmup', async (req, res) => {
  try {
    // Only allow in development or with admin key
    if (
      process.env.NODE_ENV === 'production' &&
      req.headers['x-admin-key'] !== process.env.ADMIN_KEY
    ) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const tasks = [
      () => apiService.makeApiRequest({ service: 'yahoo', endpoint: 'AAPL', params: { range: '1d', interval: '1m' }, cacheType: 'market', cacheTtl: 60 }),
      () => apiService.makeApiRequest({ service: 'yahoo', endpoint: 'MSFT', params: { range: '1d', interval: '1m' }, cacheType: 'market', cacheTtl: 60 }),
      () => apiService.makeApiRequest({ service: 'fmp', endpoint: '/income-statement/AAPL', params: { period: 'annual', limit: 3 }, cacheType: 'financial', cacheTtl: 21600 }).catch(() => null),
      () => apiService.makeApiRequest({ service: 'fmp', endpoint: '/balance-sheet-statement/AAPL', params: { period: 'annual', limit: 3 }, cacheType: 'financial', cacheTtl: 21600 }).catch(() => null),
      () => apiService.makeApiRequest({ service: 'fmp', endpoint: '/cash-flow-statement/AAPL', params: { period: 'annual', limit: 3 }, cacheType: 'financial', cacheTtl: 21600 }).catch(() => null),
      () => apiService.makeApiRequest({ service: 'fred', endpoint: 'series/observations', params: { series_id: 'DGS10', limit: 1, sort_order: 'desc' }, cacheType: 'economic', cacheTtl: 1800 }).catch(() => null)
    ];
    await Promise.all(tasks.map(fn => fn()))
    const cacheStats = cacheService.getStats();
    return sendSuccess(res, { warmed: true, cache: cacheStats }, 'Cache warmup complete');
  } catch (error) {
    console.error('Warmup failed:', error);
    return sendError(res, 'Warmup failed', 500, { error: error.message });
  }
});

/**
 * GET /api/health/latency
 * Returns latency summary per external service
 */
router.get('/latency', (req, res) => {
  try {
    const latency = apiService.getLatencySummary();
    const alertThreshold = parseInt(process.env.API_LATENCY_P95_ALERT_MS || '1500', 10);
    const alerts = Object.entries(latency)
      .filter(([_, stats]) => stats.p95 && stats.p95 > alertThreshold)
      .map(([service, stats]) => ({ service, p95: stats.p95, threshold: alertThreshold }));
    if (alerts.length && process.env.NODE_ENV !== 'production') {
      console.warn('Latency alerts:', alerts);
    }
    const data = {
      status: 'ok',
      latency,
      alerts,
      timestamp: new Date().toISOString()
    };
    sendSuccess(res, data, 'Latency summary');
  } catch (error) {
    console.error('Latency summary failed:', error);
    sendError(res, 'Latency summary failed', 500, { error: error.message });
  }
});

/**
 * DELETE /api/health/cache
 * Clear all caches (development/admin endpoint)
 */
router.delete('/cache', (req, res) => {
  try {
    // Only allow in development or with admin key
    if (
      process.env.NODE_ENV === 'production' &&
      req.headers['x-admin-key'] !== process.env.ADMIN_KEY
    ) {
      return res.status(403).json({
        error: 'Forbidden: Admin access required'
      });
    }

    const { cacheType } = req.query;
    cacheService.clear(cacheType);

    res.json({
      message: cacheType ? `${cacheType} cache cleared` : 'All caches cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache clear failed:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
