// Tests for API key validator
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { ApiKeyValidator } from '../apiKeyValidator';

// Mock axios
vi.mock('axios');

describe('ApiKeyValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new ApiKeyValidator();
    vi.clearAllMocks();
  });

  describe('validateAlphaVantage', () => {
    it('should return missing status for no API key', async () => {
      const result = await validator.validateAlphaVantage(null);
      expect(result.status).toBe('missing');
    });

    it('should return missing status for demo API key', async () => {
      const result = await validator.validateAlphaVantage('demo');
      expect(result.status).toBe('missing');
    });

    it('should return valid status for successful API response', async () => {
      axios.get.mockResolvedValue({
        data: {
          'Global Quote': {
            '01. symbol': 'AAPL',
            '05. price': '150.00'
          }
        }
      });

      const result = await validator.validateAlphaVantage('valid_key');
      expect(result.status).toBe('valid');
      expect(axios.get).toHaveBeenCalledWith(
        'https://www.alphavantage.co/query',
        expect.objectContaining({
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: 'AAPL',
            apikey: 'valid_key'
          }
        })
      );
    });

    it('should return invalid status for error response', async () => {
      axios.get.mockResolvedValue({
        data: {
          'Error Message': 'Invalid API call'
        }
      });

      const result = await validator.validateAlphaVantage('invalid_key');
      expect(result.status).toBe('invalid');
    });

    it('should return rate_limited status for rate limit response', async () => {
      axios.get.mockResolvedValue({
        data: {
          'Note': 'Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute'
        }
      });

      const result = await validator.validateAlphaVantage('rate_limited_key');
      expect(result.status).toBe('rate_limited');
    });

    it('should handle network errors', async () => {
      axios.get.mockRejectedValue(new Error('ENOTFOUND'));

      const result = await validator.validateAlphaVantage('network_error_key');
      expect(result.status).toBe('error');
    });
  });

  describe('validateFMP', () => {
    it('should return missing status for no API key', async () => {
      const result = await validator.validateFMP(null);
      expect(result.status).toBe('missing');
    });

    it('should return valid status for successful API response', async () => {
      axios.get.mockResolvedValue({
        data: [{
          symbol: 'AAPL',
          companyName: 'Apple Inc.'
        }]
      });

      const result = await validator.validateFMP('valid_key');
      expect(result.status).toBe('valid');
    });

    it('should return invalid status for 401 error', async () => {
      axios.get.mockRejectedValue({
        response: { status: 401 }
      });

      const result = await validator.validateFMP('invalid_key');
      expect(result.status).toBe('invalid');
    });

    it('should return rate_limited status for 429 error', async () => {
      axios.get.mockRejectedValue({
        response: { status: 429 }
      });

      const result = await validator.validateFMP('rate_limited_key');
      expect(result.status).toBe('rate_limited');
    });
  });

  describe('validateAllKeys', () => {
    it('should validate all services and return overall status', async () => {
      // Mock successful validation for Alpha Vantage
      axios.get.mockImplementation((url) => {
        if (url.includes('alphavantage')) {
          return Promise.resolve({
            data: { 'Global Quote': { '01. symbol': 'AAPL' } }
          });
        }
        if (url.includes('financialmodelingprep')) {
          return Promise.resolve({
            data: [{ symbol: 'AAPL' }]
          });
        }
        return Promise.reject(new Error('Unknown service'));
      });

      const result = await validator.validateAllKeys();
      
      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('services');
      expect(result).toHaveProperty('recommendations');
      expect(result.services).toHaveProperty('alphaVantage');
      expect(result.services).toHaveProperty('fmp');
      expect(result.services).toHaveProperty('quandl');
      expect(result.services).toHaveProperty('fred');
    });

    it('should return demo status when no valid keys are found', async () => {
      // Mock all validations to return missing status
      axios.get.mockRejectedValue(new Error('No API key'));

      const result = await validator.validateAllKeys();
      
      expect(result.overall).toBe('demo');
      expect(result.recommendations).toContain('No valid API keys found. Running in demo mode with mock data.');
    });

    it('should return partial status when some keys are valid', async () => {
      // Mock mixed validation results
      axios.get.mockImplementation((url) => {
        if (url.includes('alphavantage')) {
          return Promise.resolve({
            data: { 'Global Quote': { '01. symbol': 'AAPL' } }
          });
        }
        return Promise.reject(new Error('Invalid key'));
      });

      const result = await validator.validateAllKeys();
      
      expect(result.overall).toBe('partial');
    });
  });

  describe('utility methods', () => {
    it('should process validation results correctly', () => {
      const fulfilledResult = { status: 'fulfilled', value: { status: 'valid' } };
      const rejectedResult = { status: 'rejected', reason: new Error('Test error') };

      expect(validator.processValidationResult(fulfilledResult)).toEqual({ status: 'valid' });
      expect(validator.processValidationResult(rejectedResult)).toEqual({ 
        status: 'error', 
        message: 'Test error' 
      });
    });

    it('should return unknown status when validation not run', () => {
      expect(validator.getServiceStatus('alphaVantage')).toEqual({
        status: 'unknown',
        message: 'Validation not run yet'
      });

      expect(validator.getOverallStatus()).toBe('unknown');
    });

    it('should determine demo mode correctly', () => {
      expect(validator.shouldUseDemoMode()).toBe(true);
    });
  });
});
