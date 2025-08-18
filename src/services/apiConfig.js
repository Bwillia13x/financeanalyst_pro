// SECURITY NOTE: API configuration for reference only
// All actual API calls now route through secure backend proxy
// No API keys are exposed in frontend code

export const API_CONFIG = {
  // Backend proxy configuration
  BACKEND_PROXY: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
    endpoints: {
      marketData: '/market-data',
      financialStatements: '/financial-statements',
      companyData: '/company-data',
      economicData: '/economic-data',
      health: '/health'
    }
  },

  // External service information (for backend reference only)
  EXTERNAL_SERVICES: {
    ALPHA_VANTAGE: {
      name: 'Alpha Vantage',
      description: 'Real-time market data and technical indicators',
      rateLimit: { requests: 5, period: 60000 }
    },
    FMP: {
      name: 'Financial Modeling Prep',
      description: 'Comprehensive financial data',
      rateLimit: { requests: 250, period: 86400000 }
    },
    SEC_EDGAR: {
      name: 'SEC EDGAR',
      description: 'Regulatory filings',
      rateLimit: { requests: 10, period: 1000 }
    },
    YAHOO_FINANCE: {
      name: 'Yahoo Finance',
      description: 'Real-time quotes and market data',
      rateLimit: { requests: 100, period: 60000 }
    },
    QUANDL: {
      name: 'Quandl/NASDAQ Data Link',
      description: 'Economic and financial datasets',
      rateLimit: { requests: 50, period: 86400000 }
    },
    FRED: {
      name: 'Federal Reserve Economic Data',
      description: 'Economic indicators and data',
      rateLimit: { requests: 120, period: 60000 }
    }
  }
};

// All data now routes through secure backend proxy
export const DATA_SOURCE_PRIORITY = {
  marketData: ['BACKEND_PROXY'],
  financialStatements: ['BACKEND_PROXY'],
  companyProfile: ['BACKEND_PROXY'],
  secFilings: ['BACKEND_PROXY'],
  economicData: ['BACKEND_PROXY'],
  peers: ['BACKEND_PROXY']
};

// Cache configuration
export const CACHE_CONFIG = {
  marketData: {
    ttl: 15 * 60 * 1000, // 15 minutes
    maxSize: 1000
  },
  financialStatements: {
    ttl: 6 * 60 * 60 * 1000, // 6 hours
    maxSize: 500
  },
  companyProfile: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 200
  },
  secFilings: {
    ttl: 12 * 60 * 60 * 1000, // 12 hours
    maxSize: 100
  },
  peers: {
    ttl: 4 * 60 * 60 * 1000, // 4 hours
    maxSize: 100
  }
};

// Error handling configuration
export const ERROR_CONFIG = {
  retries: {
    max: 3,
    delay: 1000, // Initial delay in ms
    factor: 2 // Exponential backoff factor
  },
  timeouts: {
    default: 10000, // 10 seconds
    sec: 15000, // 15 seconds for SEC filings
    bulk: 30000 // 30 seconds for bulk operations
  }
};

// Validation patterns
export const VALIDATION_PATTERNS = {
  ticker: /^[A-Z]{1,5}$/,
  cusip: /^[0-9]{8}[0-9A-Z]$/,
  cik: /^[0-9]{1,10}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

// API response status codes
export const API_STATUS = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Default financial assumptions
export const FINANCIAL_DEFAULTS = {
  dcf: {
    projectionYears: 5,
    terminalGrowthRate: 0.025, // 2.5%
    riskFreeRate: 0.045, // 4.5%
    marketPremium: 0.065, // 6.5%
    taxRate: 0.21 // 21%
  },
  lbo: {
    holdingPeriod: 5,
    debtMultiple: 5,
    managementFeeRate: 0.02, // 2%
    carriedInterestRate: 0.2, // 20%
    exitMultiple: null // Will use peer average
  },
  comparable: {
    maxPeers: 10,
    minMarketCap: 100000000, // $100M
    sectorMatch: true
  }
};

// Environment-specific configurations
export const getEnvironmentConfig = () => {
  const env = import.meta.env.MODE || 'development'; // Fixed for Vite

  const configs = {
    development: {
      debug: true,
      logLevel: 'verbose',
      cacheEnabled: true,
      rateLimitingEnabled: false // Disable for development
    },
    production: {
      debug: false,
      logLevel: 'error',
      cacheEnabled: true,
      rateLimitingEnabled: true
    },
    test: {
      debug: false,
      logLevel: 'silent',
      cacheEnabled: false,
      rateLimitingEnabled: false
    }
  };

  return configs[env] || configs.development;
};

// DEPRECATED: API keys are now handled securely by backend
export const getApiKey = service => {
  console.warn('getApiKey is deprecated - all API calls now route through secure backend proxy');
  return null;
};

// Helper function to build secure request headers for backend proxy
export const buildHeaders = (customHeaders = {}) => {
  const baseHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  return {
    ...baseHeaders,
    ...customHeaders
  };
};

export default API_CONFIG;
