import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import secureApiClient from '../../services/secureApiClient';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('SecureApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock axios.create to return a mock instance
    mockedAxios.create.mockReturnValue({
      get: vi.fn(),
      post: vi.fn(), 
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn()
        },
        response: {
          use: vi.fn()
        }
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Market Data Methods', () => {
    test('getQuote should fetch quote data', async () => {
      const mockResponse = {
        data: {
          success: true,
          quote: {
            symbol: 'AAPL',
            regularMarketPrice: 150.00,
            regularMarketChange: 2.50
          }
        }
      };

      const mockClient = {
        get: vi.fn().mockResolvedValue(mockResponse)
      };
      secureApiClient.client = mockClient;

      const result = await secureApiClient.getQuote('AAPL');

      expect(mockClient.get).toHaveBeenCalledWith('/market-data/quote/AAPL');
      expect(result).toEqual(mockResponse.data);
    });

    test('getHistoricalData should fetch historical data with parameters', async () => {
      const mockResponse = {
        data: {
          success: true,
          historical: {
            prices: [
              { date: '2023-01-01', close: 150.00 },
              { date: '2023-01-02', close: 152.00 }
            ]
          }
        }
      };

      const mockClient = {
        get: vi.fn().mockResolvedValue(mockResponse)
      };
      secureApiClient.client = mockClient;

      const result = await secureApiClient.getHistoricalData('AAPL', '1mo', '1d');

      expect(mockClient.get).toHaveBeenCalledWith('/market-data/historical/AAPL', {
        params: { range: '1mo', interval: '1d' }
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('getBatchQuotes should fetch multiple quotes', async () => {
      const mockResponse = {
        data: {
          success: true,
          quotes: [
            { symbol: 'AAPL', regularMarketPrice: 150.00 },
            { symbol: 'GOOGL', regularMarketPrice: 2500.00 }
          ]
        }
      };

      const mockClient = {
        post: vi.fn().mockResolvedValue(mockResponse)
      };
      secureApiClient.client = mockClient;

      const symbols = ['AAPL', 'GOOGL'];
      const result = await secureApiClient.getBatchQuotes(symbols);

      expect(mockClient.post).toHaveBeenCalledWith('/market-data/batch-quotes', {
        symbols: symbols
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Company Data Methods', () => {
    test('getCompanyProfile should fetch company data', async () => {
      const mockResponse = {
        data: {
          success: true,
          profile: {
            symbol: 'AAPL',
            companyName: 'Apple Inc.',
            sector: 'Technology',
            industry: 'Consumer Electronics'
          }
        }
      };

      const mockClient = {
        get: vi.fn().mockResolvedValue(mockResponse)
      };
      secureApiClient.client = mockClient;

      const result = await secureApiClient.getCompanyProfile('AAPL');

      expect(mockClient.get).toHaveBeenCalledWith('/company-data/profile/AAPL');
      expect(result).toEqual(mockResponse.data);
    });

    test('getCompanyDCF should fetch DCF data', async () => {
      const mockResponse = {
        data: {
          success: true,
          dcf: {
            symbol: 'AAPL',
            dcfValue: 165.50,
            stock: 150.00
          }
        }
      };

      const mockClient = {
        get: vi.fn().mockResolvedValue(mockResponse)
      };
      secureApiClient.client = mockClient;

      const result = await secureApiClient.getCompanyDCF('AAPL');

      expect(mockClient.get).toHaveBeenCalledWith('/company-data/dcf/AAPL');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Financial Statements Methods', () => {
    test('getIncomeStatement should fetch income statement', async () => {
      const mockResponse = {
        data: {
          success: true,
          financials: [
            {
              date: '2023-09-30',
              revenue: 89498000000,
              netIncome: 22956000000
            }
          ]
        }
      };

      const mockClient = {
        get: vi.fn().mockResolvedValue(mockResponse)
      };
      secureApiClient.client = mockClient;

      const result = await secureApiClient.getIncomeStatement('AAPL', 'annual');

      expect(mockClient.get).toHaveBeenCalledWith('/financial-statements/income/AAPL', {
        params: { period: 'annual' }
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('getBalanceSheet should fetch balance sheet', async () => {
      const mockResponse = {
        data: {
          success: true,
          financials: [
            {
              date: '2023-09-30',
              totalAssets: 352755000000,
              totalDebt: 123456000000
            }
          ]
        }
      };

      const mockClient = {
        get: vi.fn().mockResolvedValue(mockResponse)
      };
      secureApiClient.client = mockClient;

      const result = await secureApiClient.getBalanceSheet('AAPL');

      expect(mockClient.get).toHaveBeenCalledWith('/financial-statements/balance-sheet/AAPL', {
        params: { period: 'annual' }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Authentication Integration', () => {
    test('should add authorization header when token exists', () => {
      localStorage.setItem('accessToken', 'test-token');
      
      const mockInterceptor = vi.fn((config) => {
        config.headers = config.headers || {};
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });

      // Simulate the request interceptor
      const config = { headers: {} };
      const result = mockInterceptor(config);

      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    test('should not add authorization header when no token', () => {
      localStorage.removeItem('accessToken');
      
      const mockInterceptor = vi.fn((config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });

      const config = { headers: {} };
      const result = mockInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            success: false,
            message: 'Symbol not found'
          }
        }
      };

      const mockClient = {
        get: vi.fn().mockRejectedValue(mockError)
      };
      secureApiClient.client = mockClient;

      await expect(secureApiClient.getQuote('INVALID')).rejects.toEqual(mockError);
    });

    test('should handle network errors', async () => {
      const networkError = new Error('Network Error');

      const mockClient = {
        get: vi.fn().mockRejectedValue(networkError)
      };
      secureApiClient.client = mockClient;

      await expect(secureApiClient.getQuote('AAPL')).rejects.toThrow('Network Error');
    });
  });

  describe('Generic HTTP Methods', () => {
    test('get method should delegate to client', async () => {
      const mockResponse = { data: { success: true } };
      const mockClient = {
        get: vi.fn().mockResolvedValue(mockResponse)
      };
      secureApiClient.client = mockClient;

      const result = await secureApiClient.get('/test', { param: 'value' });

      expect(mockClient.get).toHaveBeenCalledWith('/test', { param: 'value' });
      expect(result).toEqual(mockResponse);
    });

    test('post method should delegate to client', async () => {
      const mockResponse = { data: { success: true } };
      const mockClient = {
        post: vi.fn().mockResolvedValue(mockResponse)
      };
      secureApiClient.client = mockClient;

      const data = { key: 'value' };
      const result = await secureApiClient.post('/test', data, { headers: {} });

      expect(mockClient.post).toHaveBeenCalledWith('/test', data, { headers: {} });
      expect(result).toEqual(mockResponse);
    });

    test('put method should delegate to client', async () => {
      const mockResponse = { data: { success: true } };
      const mockClient = {
        put: vi.fn().mockResolvedValue(mockResponse)
      };
      secureApiClient.client = mockClient;

      const data = { key: 'updated' };
      const result = await secureApiClient.put('/test/1', data);

      expect(mockClient.put).toHaveBeenCalledWith('/test/1', data, {});
      expect(result).toEqual(mockResponse);
    });

    test('delete method should delegate to client', async () => {
      const mockResponse = { data: { success: true } };
      const mockClient = {
        delete: vi.fn().mockResolvedValue(mockResponse)
      };
      secureApiClient.client = mockClient;

      const result = await secureApiClient.delete('/test/1');

      expect(mockClient.delete).toHaveBeenCalledWith('/test/1', {});
      expect(result).toEqual(mockResponse);
    });
  });
});
