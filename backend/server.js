import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

// Load environment variables ASAP
dotenv.config();

// Import route modules (internal)
import companyDataRoutes from './routes/companyData.js';
import economicDataRoutes from './routes/economicData.js';
import financialStatementsRoutes from './routes/financialStatements.js';
import healthRoutes from './routes/health.js';
import marketDataRoutes from './routes/marketData.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/market-data', marketDataRoutes);
app.use('/api/financial-statements', financialStatementsRoutes);
app.use('/api/company-data', companyDataRoutes);
app.use('/api/economic-data', economicDataRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'FinanceAnalyst Pro Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      marketData: '/api/market-data',
      financialStatements: '/api/financial-statements',
      companyData: '/api/company-data',
      economicData: '/api/economic-data'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, _next) => {
  console.error('Global error handler:', error);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(error.status || 500).json({
    error: isDevelopment ? error.message : 'Internal server error',
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.warn(`🚀 FinanceAnalyst Pro Backend running on port ${PORT}`);
  console.warn(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.warn(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.warn(`⚡ Rate limit: ${process.env.RATE_LIMIT_REQUESTS || 100} requests per 15 minutes`);

  if (process.env.DEMO_MODE === 'true') {
    console.warn('🎭 Running in DEMO MODE - API keys not required');
  }
});

export default app;
