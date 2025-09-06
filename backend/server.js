import app from './app.js';
import { startBackgroundRefresh } from './services/refreshService.js';
const PORT = process.env.PORT || 3001;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FinanceAnalyst Pro Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`⚡ Rate limit: ${process.env.RATE_LIMIT_REQUESTS || 100} requests per 15 minutes`);

  if (process.env.DEMO_MODE === 'true') {
    console.log('🎭 Running in DEMO MODE - API keys not required');
  }
  // Start background refresh if enabled
  try { startBackgroundRefresh(); } catch {}
});

export default app;
