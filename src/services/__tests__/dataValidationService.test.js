import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dataValidationService } from '../dataValidationService.js';

// Mock dependencies
vi.mock('../utils/apiLogger.js', () => ({
  apiLogger: {
    log: vi.fn()
  }
}));

describe('DataValidationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Financial Data Validation', () => {
    it('should validate basic financial data structure using the new service', () => {
      const validData = {
        revenue: 1000000,
        netIncome: 200000,
      };

      const result = dataValidationService.validateData(validData, 'financialStatements');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid financial data types using the new service', () => {
      const invalidData = {
        revenue: 'not-a-number',
        netIncome: null,
      };

      const result = dataValidationService.validateData(invalidData, 'financialStatements');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('revenue must be numeric'))).toBe(true);
    });

    it('should produce a warning for out-of-range revenue', () => {
      const outOfRangeData = {
        revenue: -1000,
        netIncome: -1800
      };

      const result = dataValidationService.validateData(outOfRangeData, 'financialStatements');
      expect(result.isValid).toBe(true); // It's a warning, not an error
      expect(result.warnings.some(w => w.includes('revenue'))).toBe(true);
    });
  });

  describe('DCF Model Validation', () => {
    it('should validate DCF model inputs using the new service', () => {
      const validDCF = {
        cashFlows: [100000, 110000, 121000, 133100, 146410],
        discountRate: 0.1,
        terminalGrowthRate: 0.03,
        years: 5
      };

      const result = dataValidationService.validateData(validDCF, 'dcfModel');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid discount rates using the new service', () => {
      const invalidDCF = {
        cashFlows: [100000, 110000],
        discountRate: -0.1, // Negative discount rate
        terminalGrowthRate: 0.03,
        years: 2
      };

      const result = dataValidationService.validateData(invalidDCF, 'dcfModel');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Discount rate must be non-negative'))).toBe(true);
    });

    it('should validate cash flow arrays using the new service', () => {
      const emptyCashFlows = {
        cashFlows: [],
        discountRate: 0.1,
        terminalGrowthRate: 0.03
      };

      const result = dataValidationService.validateData(emptyCashFlows, 'dcfModel');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Cash flows must be a non-empty array'))).toBe(true);
    });
  });

  describe('LBO Model Validation', () => {
    it('should validate LBO model structure using the new service', () => {
      const validLBO = {
        purchasePrice: 1000000,
        debtFinancing: 700000,
        equityFinancing: 300000,
        exitMultiple: 8.0,
        holdingPeriod: 5
      };

      const result = dataValidationService.validateData(validLBO, 'lboModel');
      expect(result.isValid).toBe(true);
    });

    it('should validate debt-to-equity ratios using the new service', () => {
      const highLeverageLBO = {
        purchasePrice: 1000000,
        debtFinancing: 950000, // 95% debt
        equityFinancing: 50000,
        exitMultiple: 8.0,
        holdingPeriod: 5
      };

      const result = dataValidationService.validateData(highLeverageLBO, 'lboModel');
      // Should warn about high leverage but still be valid
      expect(result.isValid).toBe(true);
      expect(result.warnings?.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('High leverage ratio detected'))).toBe(true);
    });
  });

  describe('Market Data Validation', () => {
    it('should validate stock price data using the new service', () => {
      const validStockData = {
        symbol: 'AAPL',
        price: 150.25,
        volume: 1000000,
        timestamp: Date.now(),
        change: 2.5,
        changePercent: 1.69
      };

      const result = dataValidationService.validateData(validStockData, 'stockData');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid stock symbols using the new service', () => {
      const invalidSymbol = {
        symbol: '', // Empty symbol
        price: 150.25,
        volume: 1000000
      };

      const result = dataValidationService.validateData(invalidSymbol, 'stockData');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Symbol is required'))).toBe(true);
    });

    it('should validate price ranges using the new service', () => {
      const negativePrice = {
        symbol: 'TEST',
        price: -10, // Negative price
        volume: 1000
      };

      const result = dataValidationService.validateData(negativePrice, 'stockData');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Price must be a positive number'))).toBe(true);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize string inputs', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = dataValidationService.sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should handle null and undefined inputs', () => {
      expect(dataValidationService.sanitizeInput(null)).toBe('');
      expect(dataValidationService.sanitizeInput(undefined)).toBe('');
    });

    it('should preserve safe strings', () => {
      const safeInput = 'Apple Inc. Revenue Analysis 2024';
      const sanitized = dataValidationService.sanitizeInput(safeInput);
      
      expect(sanitized).toBe(safeInput);
    });
  });

  describe('Range Validation', () => {
    it('should validate numeric ranges', () => {
      expect(dataValidationService.isInRange(50, 0, 100)).toBe(true);
      expect(dataValidationService.isInRange(-10, 0, 100)).toBe(false);
      expect(dataValidationService.isInRange(150, 0, 100)).toBe(false);
    });

    it('should validate percentage ranges', () => {
      expect(dataValidationService.isValidPercentage(0.5)).toBe(true);
      expect(dataValidationService.isValidPercentage(1.5)).toBe(false);
      expect(dataValidationService.isValidPercentage(-0.1)).toBe(false);
    });
  });

  describe('Data Type Validation', () => {
    it('should validate numbers', () => {
      expect(dataValidationService.isValidNumber(123)).toBe(true);
      expect(dataValidationService.isValidNumber(123.45)).toBe(true);
      expect(dataValidationService.isValidNumber('123')).toBe(false);
      expect(dataValidationService.isValidNumber(NaN)).toBe(false);
      expect(dataValidationService.isValidNumber(Infinity)).toBe(false);
    });

    it('should validate arrays', () => {
      expect(dataValidationService.isValidArray([1, 2, 3])).toBe(true);
      expect(dataValidationService.isValidArray([])).toBe(true);
      expect(dataValidationService.isValidArray('not-array')).toBe(false);
      expect(dataValidationService.isValidArray(null)).toBe(false);
    });

    it('should validate objects', () => {
      expect(dataValidationService.isValidObject({})).toBe(true);
      expect(dataValidationService.isValidObject({ key: 'value' })).toBe(true);
      expect(dataValidationService.isValidObject(null)).toBe(false);
      expect(dataValidationService.isValidObject([])).toBe(false);
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate financial ratios', () => {
      const ratios = {
        currentRatio: 2.5,
        quickRatio: 1.8,
        debtToEquity: 0.4,
        returnOnEquity: 0.15
      };

      const result = dataValidationService.validateFinancialRatios(ratios);
      expect(result.isValid).toBe(true);
    });

    it('should flag concerning financial ratios', () => {
      const concerningRatios = {
        currentRatio: 0.5, // Low liquidity
        quickRatio: 0.3,
        debtToEquity: 5.0, // High leverage
        returnOnEquity: -0.1 // Negative returns
      };

      const result = dataValidationService.validateFinancialRatios(concerningRatios);
      expect(result.warnings?.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', () => {
      const corruptData = {
        revenue: { toString: () => { throw new Error('Corrupt data'); } }
      };

      expect(() => {
        dataValidationService.validateData(corruptData, 'financialStatements');
      }).not.toThrow();
    });

    it('should provide meaningful error messages', () => {
      const invalidData = {
        revenue: 'invalid',
        netIncome: null
      };

      const result = dataValidationService.validateData(invalidData, 'financialStatements');
      expect(result.errors.every(error => typeof error === 'string')).toBe(true);
      expect(result.errors.every(error => error.length > 0)).toBe(true);
    });
  });
});
