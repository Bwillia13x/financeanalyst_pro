import express from 'express';

import apiService from '../services/apiService.js';
import cacheService from '../services/cacheService.js';

const router = express.Router();

/**
 * GET /api/health
 * General health check endpoint
 */
router.get('/', async(req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      demoMode: process.env.DEMO_MODE === 'true'
    };

    res.json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
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
router.get('/services', async(req, res) => {
  try {
    const serviceHealth = await apiService.healthCheck();

    const overallStatus = Object.values(serviceHealth).every(
      service => service.status === 'available' || service.status === 'not_configured'
    ) ? 'healthy' : 'degraded';

    res.json({
      status: overallStatus,
      services: serviceHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Service health check failed:', error);
    res.status(500).json({
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

    res.json({
      status: 'healthy',
      cache: cacheStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/health/cache
 * Clear all caches (development/admin endpoint)
 */
router.delete('/cache', (req, res) => {
  try {
    // Only allow in development or with admin key
    if (process.env.NODE_ENV === 'production' && req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
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
