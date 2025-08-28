import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  API_CONFIG,
  DATA_SOURCE_PRIORITY,
  CACHE_CONFIG,
  ERROR_CONFIG,
  VALIDATION_PATTERNS,
  API_STATUS,
  FINANCIAL_DEFAULTS,
  getEnvironmentConfig,
  getApiKey,
  buildHeaders
} from '../apiConfig.js';

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    MODE: 'test',
    VITE_ALPHA_VANTAGE_API_KEY: 'test-alpha-key',
    VITE_FMP_API_KEY: 'test-fmp-key',
    VITE_QUANDL_API_KEY: 'test-quandl-key',
    VITE_FRED_API_KEY: 'test-fred-key'
  }
}));

describe('API Configuration', () => {
  describe('API_CONFIG', () => {
    it('should have backend proxy configuration', () => {
      expect(API_CONFIG).toHaveProperty('BACKEND_PROXY');
      expect(API_CONFIG.BACKEND_PROXY).toHaveProperty('baseURL');
      expect(API_CONFIG.BACKEND_PROXY).toHaveProperty('endpoints');
    });

    it('should have external services reference information', () => {
      expect(API_CONFIG).toHaveProperty('EXTERNAL_SERVICES');
      expect(API_CONFIG.EXTERNAL_SERVICES).toHaveProperty('ALPHA_VANTAGE');
      expect(API_CONFIG.EXTERNAL_SERVICES).toHaveProperty('FMP');
      expect(API_CONFIG.EXTERNAL_SERVICES).toHaveProperty('SEC_EDGAR');
      expect(API_CONFIG.EXTERNAL_SERVICES).toHaveProperty('YAHOO_FINANCE');
      expect(API_CONFIG.EXTERNAL_SERVICES).toHaveProperty('QUANDL');
      expect(API_CONFIG.EXTERNAL_SERVICES).toHaveProperty('FRED');
    });

    it('should have valid backend proxy configuration', () => {
      const config = API_CONFIG.BACKEND_PROXY;
      expect(config.baseURL).toMatch(/^http:\/\/localhost:3001\/api/);
      expect(config.endpoints).toHaveProperty('marketData');
      expect(config.endpoints).toHaveProperty('financialStatements');
      expect(config.endpoints).toHaveProperty('companyData');
      expect(config.endpoints).toHaveProperty('economicData');
      expect(config.endpoints).toHaveProperty('health');
    });
  });

  describe('DATA_SOURCE_PRIORITY', () => {
    it('should define priority for market data sources', () => {
      expect(DATA_SOURCE_PRIORITY.marketData).toEqual(['BACKEND_PROXY']);
    });

    it('should define priority for financial statements', () => {
      expect(DATA_SOURCE_PRIORITY.financialStatements).toEqual(['BACKEND_PROXY']);
    });

    it('should define priority for company profiles', () => {
      expect(DATA_SOURCE_PRIORITY.companyProfile).toEqual(['BACKEND_PROXY']);
    });

    it('should define priority for SEC filings', () => {
      expect(DATA_SOURCE_PRIORITY.secFilings).toEqual(['BACKEND_PROXY']);
    });

    it('should define priority for economic data', () => {
      expect(DATA_SOURCE_PRIORITY.economicData).toEqual(['BACKEND_PROXY']);
    });

    it('should define priority for peers', () => {
      expect(DATA_SOURCE_PRIORITY.peers).toEqual(['BACKEND_PROXY']);
    });
  });

  describe('CACHE_CONFIG', () => {
    it('should have appropriate TTL for market data', () => {
      expect(CACHE_CONFIG.marketData.ttl).toBe(15 * 60 * 1000); // 15 minutes
      expect(CACHE_CONFIG.marketData.maxSize).toBe(1000);
    });

    it('should have appropriate TTL for financial statements', () => {
      expect(CACHE_CONFIG.financialStatements.ttl).toBe(6 * 60 * 60 * 1000); // 6 hours
      expect(CACHE_CONFIG.financialStatements.maxSize).toBe(500);
    });

    it('should have appropriate TTL for company profiles', () => {
      expect(CACHE_CONFIG.companyProfile.ttl).toBe(24 * 60 * 60 * 1000); // 24 hours
      expect(CACHE_CONFIG.companyProfile.maxSize).toBe(200);
    });
  });

  describe('ERROR_CONFIG', () => {
    it('should have retry configuration', () => {
      expect(ERROR_CONFIG.retries.max).toBe(3);
      expect(ERROR_CONFIG.retries.delay).toBe(1000);
      expect(ERROR_CONFIG.retries.factor).toBe(2);
    });

    it('should have timeout configuration', () => {
      expect(ERROR_CONFIG.timeouts.default).toBe(10000);
      expect(ERROR_CONFIG.timeouts.sec).toBe(15000);
      expect(ERROR_CONFIG.timeouts.bulk).toBe(30000);
    });
  });

  describe('VALIDATION_PATTERNS', () => {
    it('should validate ticker symbols correctly', () => {
      expect(VALIDATION_PATTERNS.ticker.test('AAPL')).toBe(true);
      expect(VALIDATION_PATTERNS.ticker.test('MSFT')).toBe(true);
      expect(VALIDATION_PATTERNS.ticker.test('A')).toBe(true);
      expect(VALIDATION_PATTERNS.ticker.test('aapl')).toBe(false);
      expect(VALIDATION_PATTERNS.ticker.test('TOOLONG')).toBe(false);
      expect(VALIDATION_PATTERNS.ticker.test('123')).toBe(false);
    });

    it('should validate CUSIP correctly', () => {
      expect(VALIDATION_PATTERNS.cusip.test('037833100')).toBe(true);
      expect(VALIDATION_PATTERNS.cusip.test('12345678A')).toBe(true);
      expect(VALIDATION_PATTERNS.cusip.test('1234567')).toBe(false);
      expect(VALIDATION_PATTERNS.cusip.test('12345678')).toBe(false);
    });

    it('should validate CIK correctly', () => {
      expect(VALIDATION_PATTERNS.cik.test('320193')).toBe(true);
      expect(VALIDATION_PATTERNS.cik.test('1234567890')).toBe(true);
      expect(VALIDATION_PATTERNS.cik.test('12345678901')).toBe(false);
      expect(VALIDATION_PATTERNS.cik.test('abc')).toBe(false);
    });

    it('should validate email correctly', () => {
      expect(VALIDATION_PATTERNS.email.test('test@example.com')).toBe(true);
      expect(VALIDATION_PATTERNS.email.test('user.name@domain.co.uk')).toBe(true);
      expect(VALIDATION_PATTERNS.email.test('invalid-email')).toBe(false);
      expect(VALIDATION_PATTERNS.email.test('@domain.com')).toBe(false);
    });
  });

  describe('API_STATUS', () => {
    it('should have all standard HTTP status codes', () => {
      expect(API_STATUS.SUCCESS).toBe(200);
      expect(API_STATUS.BAD_REQUEST).toBe(400);
      expect(API_STATUS.UNAUTHORIZED).toBe(401);
      expect(API_STATUS.FORBIDDEN).toBe(403);
      expect(API_STATUS.NOT_FOUND).toBe(404);
      expect(API_STATUS.RATE_LIMITED).toBe(429);
      expect(API_STATUS.SERVER_ERROR).toBe(500);
      expect(API_STATUS.SERVICE_UNAVAILABLE).toBe(503);
    });
  });

  describe('FINANCIAL_DEFAULTS', () => {
    it('should have DCF defaults', () => {
      expect(FINANCIAL_DEFAULTS.dcf.projectionYears).toBe(5);
      expect(FINANCIAL_DEFAULTS.dcf.terminalGrowthRate).toBe(0.025);
      expect(FINANCIAL_DEFAULTS.dcf.riskFreeRate).toBe(0.045);
      expect(FINANCIAL_DEFAULTS.dcf.marketPremium).toBe(0.065);
      expect(FINANCIAL_DEFAULTS.dcf.taxRate).toBe(0.21);
    });

    it('should have LBO defaults', () => {
      expect(FINANCIAL_DEFAULTS.lbo.holdingPeriod).toBe(5);
      expect(FINANCIAL_DEFAULTS.lbo.debtMultiple).toBe(5);
      expect(FINANCIAL_DEFAULTS.lbo.managementFeeRate).toBe(0.02);
      expect(FINANCIAL_DEFAULTS.lbo.carriedInterestRate).toBe(0.2);
      expect(FINANCIAL_DEFAULTS.lbo.exitMultiple).toBeNull();
    });

    it('should have comparable analysis defaults', () => {
      expect(FINANCIAL_DEFAULTS.comparable.maxPeers).toBe(10);
      expect(FINANCIAL_DEFAULTS.comparable.minMarketCap).toBe(100000000);
      expect(FINANCIAL_DEFAULTS.comparable.sectorMatch).toBe(true);
    });
  });

  describe('getEnvironmentConfig', () => {
    it('should return test configuration in test environment', () => {
      const config = getEnvironmentConfig();
      expect(config.debug).toBe(false);
      expect(config.logLevel).toBe('silent');
      expect(config.cacheEnabled).toBe(false);
      expect(config.rateLimitingEnabled).toBe(false);
    });
  });

  describe('getApiKey', () => {
    it('should return null for all services (deprecated function)', () => {
      // All API calls now route through secure backend proxy
      expect(getApiKey('ALPHA_VANTAGE')).toBe(null);
      expect(getApiKey('FMP')).toBe(null);
      expect(getApiKey('QUANDL')).toBe(null);
      expect(getApiKey('FRED')).toBe(null);
    });

    it('should return null for unknown services', () => {
      expect(getApiKey('UNKNOWN_SERVICE')).toBe(null);
    });
  });

  describe('buildHeaders', () => {
    it('should build basic headers', () => {
      const headers = buildHeaders();
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers.Accept).toBe('application/json');
    });

    it('should merge custom headers', () => {
      const customHeaders = { 'X-Custom-Header': 'custom-value' };
      const headers = buildHeaders(customHeaders);
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers.Accept).toBe('application/json');
      expect(headers['X-Custom-Header']).toBe('custom-value');
    });

    it('should allow custom headers to override defaults', () => {
      const customHeaders = { 'Content-Type': 'text/plain' };
      const headers = buildHeaders(customHeaders);
      expect(headers['Content-Type']).toBe('text/plain');
      expect(headers.Accept).toBe('application/json');
    });
  });
});
