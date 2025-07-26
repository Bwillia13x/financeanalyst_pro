/**
 * Production Backend Simulator
 * This simulates a production backend deployment for testing
 * In real deployment, this would be your actual production server
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load production environment
dotenv.config({ path: '.env.production' });

const app = express();
const PORT = process.env.PORT || 3002; // Different port to simulate production

// Production middleware stack
app.use(helmet());
app.use(cors({
  origin: 'https://financeanalyst-pro.netlify.app',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: 'production-simulation',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mock production API endpoints
app.get('/api/market-data/quote/:symbol', (req, res) => {
  const { symbol } = req.params;
  res.json({
    symbol: symbol.toUpperCase(),
    price: 150.25 + Math.random() * 10,
    previousClose: 148.30,
    change: 1.95,
    changePercent: '1.31%',
    volume: 1000000,
    source: 'production-demo',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/services', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      alphaVantage: { configured: true, status: 'available' },
      fmp: { configured: true, status: 'available' },
      fred: { configured: true, status: 'available' },
      quandl: { configured: true, status: 'available' }
    },
    timestamp: new Date().toISOString()
  });
});

// Start production simulation server
app.listen(PORT, () => {
  console.log(`🚀 Production Backend Simulator running on port ${PORT}`);
  console.log(`📊 Environment: production-simulation`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
