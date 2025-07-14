import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  sanitizeInput,
  sanitizeSQL,
  validateTicker,
  validateEmail,
  validateURL,
  RateLimiter,
  maskApiKey,
  validateEnvironment,
  generateSecureToken
} from '../security';

describe('Security Utils', () => {
  describe('sanitizeInput', () => {
    it('should remove XSS attack vectors', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert("xss")');
      expect(sanitizeInput('javascript:alert("xss")')).toBe('alert("xss")');
      expect(sanitizeInput('<img onerror="alert(1)" src="x">')).toBe('img src="x"');
      expect(sanitizeInput('onclick="alert(1)"')).toBe('"alert(1)"');
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput({})).toEqual({});
    });

    it('should preserve safe content', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World');
      expect(sanitizeInput('AAPL stock price: $150.00')).toBe('AAPL stock price: $150.00');
    });
  });

  describe('sanitizeSQL', () => {
    it('should remove SQL injection vectors', () => {
      expect(sanitizeSQL("'; DROP TABLE users; --")).toBe(' DROP TABLE users ');
      expect(sanitizeSQL("1' OR '1'='1")).toBe('1 OR 1=1');
      expect(sanitizeSQL('/* comment */ SELECT')).toBe(' SELECT');
    });

    it('should handle safe SQL-like content', () => {
      expect(sanitizeSQL('AAPL')).toBe('AAPL');
      expect(sanitizeSQL('Price > 100')).toBe('Price > 100');
    });
  });

  describe('validateTicker', () => {
    it('should validate correct ticker symbols', () => {
      expect(validateTicker('AAPL')).toBe(true);
      expect(validateTicker('MSFT')).toBe(true);
      expect(validateTicker('BRK.A')).toBe(true);
      expect(validateTicker('BRK.B')).toBe(true);
    });

    it('should reject invalid ticker symbols', () => {
      expect(validateTicker('')).toBe(false);
      expect(validateTicker('TOOLONG')).toBe(false);
      expect(validateTicker('123')).toBe(false);
      expect(validateTicker('AA@PL')).toBe(false);
      expect(validateTicker('<script>')).toBe(false);
      expect(validateTicker(null)).toBe(false);
      expect(validateTicker(undefined)).toBe(false);
    });

    it('should handle case insensitive input', () => {
      expect(validateTicker('aapl')).toBe(true);
      expect(validateTicker('MsFt')).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail(null)).toBe(false);
    });

    it('should reject extremely long emails', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(validateEmail(longEmail)).toBe(false);
    });
  });

  describe('validateURL', () => {
    it('should validate HTTPS URLs', () => {
      expect(validateURL('https://api.example.com')).toBe(true);
      expect(validateURL('https://www.alphavantage.co/query')).toBe(true);
    });

    it('should reject HTTP URLs', () => {
      expect(validateURL('http://api.example.com')).toBe(false);
    });

    it('should reject localhost URLs', () => {
      expect(validateURL('https://localhost:3000')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(validateURL('')).toBe(false);
      expect(validateURL('not-a-url')).toBe(false);
      expect(validateURL(null)).toBe(false);
    });
  });

  describe('RateLimiter', () => {
    let rateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter(3, 1000); // 3 requests per second
    });

    it('should allow requests within limit', () => {
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      expect(rateLimiter.isAllowed('user1')).toBe(false);
    });

    it('should track different users separately', () => {
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');

      expect(rateLimiter.isAllowed('user1')).toBe(false);
      expect(rateLimiter.isAllowed('user2')).toBe(true);
    });

    it('should provide remaining requests count', () => {
      expect(rateLimiter.getRemainingRequests('user1')).toBe(3);
      rateLimiter.isAllowed('user1');
      expect(rateLimiter.getRemainingRequests('user1')).toBe(2);
    });
  });

  describe('maskApiKey', () => {
    it('should mask long API keys', () => {
      const apiKey = 'abcd1234567890efgh';
      const masked = maskApiKey(apiKey);
      expect(masked).toBe('abcd**********efgh');
      expect(masked).not.toContain('1234567890');
    });

    it('should mask short API keys completely', () => {
      expect(maskApiKey('short')).toBe('*****');
    });

    it('should handle demo keys', () => {
      expect(maskApiKey('demo')).toBe('[DEMO]');
    });

    it('should handle invalid inputs', () => {
      expect(maskApiKey(null)).toBe('[INVALID]');
      expect(maskApiKey(undefined)).toBe('[INVALID]');
      expect(maskApiKey('')).toBe('[INVALID]');
    });
  });

  describe('generateSecureToken', () => {
    it('should generate tokens of correct length', () => {
      expect(generateSecureToken(16)).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(generateSecureToken(32)).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    it('should generate different tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate hex strings', () => {
      const token = generateSecureToken(8);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('validateEnvironment', () => {
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should validate environment variables', () => {
      const mockEnv = {
        VITE_APP_ENV: 'test'
      };

      const result = validateEnvironment(mockEnv);
      expect(result).toBe(true);
    });

    it('should warn about missing variables', () => {
      const mockEnv = {};

      const result = validateEnvironment(mockEnv);
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('Missing environment variables:', ['VITE_APP_ENV']);
    });
  });
});
