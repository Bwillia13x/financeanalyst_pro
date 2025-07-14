// API configuration and environment setup for data fetching services

export const API_CONFIG = {
  // Alpha Vantage (Real-time market data, technical indicators)
  ALPHA_VANTAGE: {
    baseURL: 'https://www.alphavantage.co/query',
    apiKey: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo', // Fixed for Vite
    rateLimit: {
      requests: 5,
      period: 60000 // 5 requests per minute for free tier
    },
    endpoints: {
      quote: 'GLOBAL_QUOTE',
      dailyAdjusted: 'TIME_SERIES_DAILY_ADJUSTED',
      company: 'OVERVIEW',
      earnings: 'EARNINGS',
      fundamentals: 'INCOME_STATEMENT'
    }
  },

  // Financial Modeling Prep (Comprehensive financial data)
  FMP: {
    baseURL: 'https://financialmodelingprep.com/api/v3',
    apiKey: import.meta.env.VITE_FMP_API_KEY || 'demo', // Fixed for Vite
    rateLimit: {
      requests: 250,
      period: 86400000 // 250 requests per day for free tier
    },
    endpoints: {
      profile: '/profile/',
      incomeStatement: '/income-statement/',
      balanceSheet: '/balance-sheet-statement/',
      cashFlow: '/cash-flow-statement/',
      ratios: '/ratios/',
      peers: '/stock_peers',
      dcf: '/discounted-cash-flow/',
      enterprise: '/enterprise-values/'
    }
  },

  // SEC EDGAR (Regulatory filings)
  SEC_EDGAR: {
    baseURL: 'https://data.sec.gov',
    headers: {
      'User-Agent': 'FinanceAnalyst-Pro contact@financeanalyst.com'
    },
    rateLimit: {
      requests: 10,
      period: 1000 // 10 requests per second
    },
    endpoints: {
      submissions: '/submissions/CIK',
      filings: '/Archives/edgar/data/'
    }
  },

  // Yahoo Finance (Real-time quotes and market data)
  YAHOO_FINANCE: {
    baseURL: 'https://query1.finance.yahoo.com/v8/finance/chart',
    fallbackURL: 'https://query2.finance.yahoo.com/v8/finance/chart',
    rateLimit: {
      requests: 100,
      period: 60000 // Conservative limit
    }
  },

  // Quandl/NASDAQ Data Link (Economic and financial datasets)
  QUANDL: {
    baseURL: 'https://data.nasdaq.com/api/v3',
    apiKey: import.meta.env.VITE_QUANDL_API_KEY || 'demo', // Fixed for Vite
    rateLimit: {
      requests: 50,
      period: 86400000 // 50 requests per day for free tier
    }
  },

  // Federal Reserve Economic Data (FRED)
  FRED: {
    baseURL: 'https://api.stlouisfed.org/fred',
    apiKey: import.meta.env.VITE_FRED_API_KEY || 'demo', // Fixed for Vite
    rateLimit: {
      requests: 120,
      period: 60000 // 120 requests per minute
    }
  }
};

// Data source priority configuration
export const DATA_SOURCE_PRIORITY = {
  marketData: ['YAHOO_FINANCE', 'ALPHA_VANTAGE'],
  financialStatements: ['FMP', 'ALPHA_VANTAGE'],
  companyProfile: ['FMP', 'ALPHA_VANTAGE'],
  secFilings: ['SEC_EDGAR'],
  economicData: ['FRED', 'QUANDL'],
  peers: ['FMP']
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

// Helper function to get API key for a service
export const getApiKey = service => {
  const keyMap = {
    ALPHA_VANTAGE: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY, // Fixed for Vite
    FMP: import.meta.env.VITE_FMP_API_KEY, // Fixed for Vite
    QUANDL: import.meta.env.VITE_QUANDL_API_KEY, // Fixed for Vite
    FRED: import.meta.env.VITE_FRED_API_KEY // Fixed for Vite
  };

  return keyMap[service] || 'demo';
};

// Helper function to build request headers
export const buildHeaders = (service, customHeaders = {}) => {
  const baseHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const serviceHeaders = {
    SEC_EDGAR: {
      'User-Agent': API_CONFIG.SEC_EDGAR.headers['User-Agent']
    }
  };

  return {
    ...baseHeaders,
    ...serviceHeaders[service],
    ...customHeaders
  };
};

export default API_CONFIG;
