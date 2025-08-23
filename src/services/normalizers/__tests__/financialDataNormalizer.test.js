import { describe, it, expect } from 'vitest';
import {
  normalizeIncomeStatement,
  normalizeBalanceSheet,
  normalizeCashFlow,
  validateNormalizedData
} from '../financialDataNormalizer';

describe('Financial Data Normalizer', () => {
  describe('normalizeIncomeStatement', () => {
    it('should normalize basic income statement data', () => {
      const rawData = {
        revenue: [1000000, 1100000, 1200000],
        costOfRevenue: [600000, 650000, 700000],
        operatingIncome: [150000, 165000, 180000],
        netIncome: [100000, 110000, 120000],
        eps: [1.00, 1.10, 1.20],
        sharesOutstanding: [100000, 100000, 100000]
      };

      const result = normalizeIncomeStatement(rawData);

      expect(result.revenue).toEqual([1000000, 1100000, 1200000]);
      expect(result.costOfRevenue).toEqual([600000, 650000, 700000]);
      expect(result.operatingIncome).toEqual([150000, 165000, 180000]);
      expect(result.netIncome).toEqual([100000, 110000, 120000]);
      expect(result.currency).toBe('USD');
      expect(result.periods).toBe(3);
    });

    it('should handle different field name variations', () => {
      const rawData = {
        totalRevenue: [500000, 550000],
        costOfSales: [300000, 325000],
        ebit: [75000, 82500],
        netIncomeCommon: [50000, 55000]
      };

      const result = normalizeIncomeStatement(rawData);

      expect(result.revenue).toEqual([500000, 550000]);
      expect(result.costOfRevenue).toEqual([300000, 325000]);
      expect(result.operatingIncome).toEqual([75000, 82500]);
      expect(result.netIncome).toEqual([50000, 55000]);
    });

    it('should apply scaling factor', () => {
      const rawData = {
        revenue: [1000, 1100, 1200],
        netIncome: [100, 110, 120]
      };

      const result = normalizeIncomeStatement(rawData, { scale: 1000 });

      expect(result.revenue).toEqual([1000000, 1100000, 1200000]);
      expect(result.netIncome).toEqual([100000, 110000, 120000]);
      expect(result.scale).toBe(1000);
    });

    it('should handle single values as arrays', () => {
      const rawData = {
        revenue: 1000000,
        netIncome: 100000
      };

      const result = normalizeIncomeStatement(rawData);

      expect(result.revenue).toEqual([1000000]);
      expect(result.netIncome).toEqual([100000]);
    });

    it('should handle missing fields gracefully', () => {
      const rawData = {
        revenue: [1000000]
      };

      const result = normalizeIncomeStatement(rawData);

      expect(result.revenue).toEqual([1000000]);
      expect(result.costOfRevenue).toEqual([]);
      expect(result.operatingIncome).toEqual([]);
      expect(result.netIncome).toEqual([]);
    });

    it('should filter out non-numeric values', () => {
      const rawData = {
        revenue: [1000000, 'N/A', null, 1200000],
        netIncome: [100000, undefined, 120000]
      };

      const result = normalizeIncomeStatement(rawData);

      expect(result.revenue).toEqual([1000000, null, null]);
      expect(result.netIncome).toEqual([100000, null]);
    });
  });

  describe('normalizeBalanceSheet', () => {
    it('should normalize basic balance sheet data', () => {
      const rawData = {
        totalAssets: [5000000, 5500000, 6000000],
        currentAssets: [2000000, 2200000, 2400000],
        cash: [500000, 550000, 600000],
        totalLiabilities: [3000000, 3200000, 3400000],
        totalEquity: [2000000, 2300000, 2600000]
      };

      const result = normalizeBalanceSheet(rawData);

      expect(result.totalAssets).toEqual([5000000, 5500000, 6000000]);
      expect(result.currentAssets).toEqual([2000000, 2200000, 2400000]);
      expect(result.cash).toEqual([500000, 550000, 600000]);
      expect(result.totalLiabilities).toEqual([3000000, 3200000, 3400000]);
      expect(result.totalEquity).toEqual([2000000, 2300000, 2600000]);
    });

    it('should handle field name variations', () => {
      const rawData = {
        cashAndEquivalents: [500000, 550000],
        receivables: [300000, 330000],
        ppe: [2000000, 2100000],
        payables: [200000, 220000],
        shareholderEquity: [2000000, 2300000]
      };

      const result = normalizeBalanceSheet(rawData);

      expect(result.cash).toEqual([500000, 550000]);
      expect(result.accountsReceivable).toEqual([300000, 330000]);
      expect(result.propertyPlantEquipment).toEqual([2000000, 2100000]);
      expect(result.accountsPayable).toEqual([200000, 220000]);
      expect(result.totalEquity).toEqual([2000000, 2300000]);
    });

    it('should maintain balance sheet equation validation data', () => {
      const rawData = {
        totalAssets: [1000000],
        totalLiabilities: [600000],
        totalEquity: [400000]
      };

      const result = normalizeBalanceSheet(rawData);

      // Assets should equal Liabilities + Equity
      const assets = result.totalAssets[0];
      const liabilities = result.totalLiabilities[0];
      const equity = result.totalEquity[0];
      
      expect(assets).toBe(liabilities + equity);
    });
  });

  describe('normalizeCashFlow', () => {
    it('should normalize basic cash flow data', () => {
      const rawData = {
        operatingCashFlow: [200000, 220000, 240000],
        investingCashFlow: [-50000, -55000, -60000],
        financingCashFlow: [-80000, -88000, -96000],
        netChangeInCash: [70000, 77000, 84000],
        freeCashFlow: [150000, 165000, 180000]
      };

      const result = normalizeCashFlow(rawData);

      expect(result.operatingCashFlow).toEqual([200000, 220000, 240000]);
      expect(result.investingCashFlow).toEqual([-50000, -55000, -60000]);
      expect(result.financingCashFlow).toEqual([-80000, -88000, -96000]);
      expect(result.netChangeInCash).toEqual([70000, 77000, 84000]);
      expect(result.freeCashFlow).toEqual([150000, 165000, 180000]);
    });

    it('should handle field name variations', () => {
      const rawData = {
        cashFromOperations: [200000, 220000],
        cashFromInvesting: [-50000, -55000],
        cashFromFinancing: [-80000, -88000],
        capex: [-30000, -33000],
        buybacks: [-20000, -22000]
      };

      const result = normalizeCashFlow(rawData);

      expect(result.operatingCashFlow).toEqual([200000, 220000]);
      expect(result.investingCashFlow).toEqual([-50000, -55000]);
      expect(result.financingCashFlow).toEqual([-80000, -88000]);
      expect(result.capitalExpenditures).toEqual([-30000, -33000]);
      expect(result.shareRepurchases).toEqual([-20000, -22000]);
    });

    it('should handle negative cash flows correctly', () => {
      const rawData = {
        operatingCashFlow: [100000],
        investingCashFlow: [-150000], // Large investment
        financingCashFlow: [75000]     // Net financing inflow
      };

      const result = normalizeCashFlow(rawData);

      expect(result.operatingCashFlow[0]).toBeGreaterThan(0);
      expect(result.investingCashFlow[0]).toBeLessThan(0);
      expect(result.financingCashFlow[0]).toBeGreaterThan(0);
    });
  });

  describe('validateNormalizedData', () => {
    it('should validate income statement data', () => {
      const validData = {
        currency: 'USD',
        periods: 3,
        revenue: [1000000, 1100000, 1200000],
        netIncome: [100000, 110000, 120000]
      };

      const result = validateNormalizedData(validData, 'income');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields for income statement', () => {
      const invalidData = {
        currency: 'USD',
        periods: 3,
        // Missing revenue
        netIncome: [100000, 110000, 120000]
      };

      const result = validateNormalizedData(invalidData, 'income');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Revenue data is required for income statement');
    });

    it('should validate balance sheet data', () => {
      const validData = {
        currency: 'USD',
        periods: 3,
        totalAssets: [1000000, 1100000, 1200000],
        totalLiabilities: [600000, 650000, 700000],
        totalEquity: [400000, 450000, 500000]
      };

      const result = validateNormalizedData(validData, 'balance');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields for balance sheet', () => {
      const invalidData = {
        currency: 'USD',
        periods: 3,
        // Missing totalAssets
        totalLiabilities: [600000, 650000, 700000]
      };

      const result = validateNormalizedData(invalidData, 'balance');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total assets data is required for balance sheet');
    });

    it('should provide warnings for missing optional fields', () => {
      const dataWithMissingOptional = {
        // Missing currency and periods
        revenue: [1000000, 1100000, 1200000]
      };

      const result = validateNormalizedData(dataWithMissingOptional, 'income');

      expect(result.warnings).toContain('Currency should be specified');
      expect(result.warnings).toContain('Number of periods should be specified');
    });

    it('should handle null or invalid data gracefully', () => {
      const result1 = validateNormalizedData(null, 'income');
      const result2 = validateNormalizedData('invalid', 'income');
      const result3 = validateNormalizedData(undefined, 'income');

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result3.isValid).toBe(false);

      expect(result1.errors).toContain('Data must be an object');
      expect(result2.errors).toContain('Data must be an object');
      expect(result3.errors).toContain('Data must be an object');
    });
  });

  describe('Data consistency and integrity', () => {
    it('should maintain data types across normalization', () => {
      const rawData = {
        revenue: [1000000, 1100000, 1200000],
        netIncome: [100000, 110000, 120000]
      };

      const result = normalizeIncomeStatement(rawData);

      // All numeric arrays should contain numbers or null
      result.revenue.forEach(value => {
        expect(['number', 'object'].includes(typeof value)).toBe(true);
        if (value !== null) {
          expect(typeof value).toBe('number');
        }
      });
    });

    it('should preserve precision of financial numbers', () => {
      const rawData = {
        revenue: [1234567.89, 2345678.90],
        eps: [12.345, 23.456]
      };

      const result = normalizeIncomeStatement(rawData);

      expect(result.revenue[0]).toBe(1234567.89);
      expect(result.revenue[1]).toBe(2345678.90);
      expect(result.eps[0]).toBe(12.345);
      expect(result.eps[1]).toBe(23.456);
    });

    it('should handle edge cases and boundary values', () => {
      const edgeCases = {
        revenue: [0, -1000000, Number.MAX_SAFE_INTEGER],
        netIncome: [Number.MIN_SAFE_INTEGER, 0, 1]
      };

      expect(() => normalizeIncomeStatement(edgeCases)).not.toThrow();
      const result = normalizeIncomeStatement(edgeCases);
      
      expect(result.revenue).toEqual([0, -1000000, Number.MAX_SAFE_INTEGER]);
      expect(result.netIncome).toEqual([Number.MIN_SAFE_INTEGER, 0, 1]);
    });

    it('should be serializable for data persistence', () => {
      const rawData = {
        revenue: [1000000, 1100000, 1200000],
        netIncome: [100000, 110000, 120000]
      };

      const normalized = normalizeIncomeStatement(rawData);
      
      // Should be JSON serializable
      expect(() => JSON.stringify(normalized)).not.toThrow();
      
      const serialized = JSON.stringify(normalized);
      const deserialized = JSON.parse(serialized);
      
      expect(deserialized.revenue).toEqual(normalized.revenue);
      expect(deserialized.netIncome).toEqual(normalized.netIncome);
    });
  });

  describe('Cross-statement data consistency', () => {
    it('should maintain consistent scaling across statements', () => {
      const scale = 1000;
      
      const incomeData = { revenue: [1000, 1100], netIncome: [100, 110] };
      const balanceData = { totalAssets: [5000, 5500], cash: [500, 550] };
      const cashFlowData = { operatingCashFlow: [150, 165], freeCashFlow: [120, 132] };
      
      const normalizedIncome = normalizeIncomeStatement(incomeData, { scale });
      const normalizedBalance = normalizeBalanceSheet(balanceData, { scale });
      const normalizedCashFlow = normalizeCashFlow(cashFlowData, { scale });
      
      expect(normalizedIncome.scale).toBe(scale);
      expect(normalizedBalance.scale).toBe(scale);
      expect(normalizedCashFlow.scale).toBe(scale);
      
      expect(normalizedIncome.revenue[0]).toBe(1000000);
      expect(normalizedBalance.totalAssets[0]).toBe(5000000);
      expect(normalizedCashFlow.operatingCashFlow[0]).toBe(150000);
    });

    it('should maintain consistent metadata across statements', () => {
      const options = {
        currency: 'EUR',
        periods: 5
      };
      
      const incomeResult = normalizeIncomeStatement({}, options);
      const balanceResult = normalizeBalanceSheet({}, options);
      const cashFlowResult = normalizeCashFlow({}, options);
      
      expect(incomeResult.currency).toBe('EUR');
      expect(balanceResult.currency).toBe('EUR');
      expect(cashFlowResult.currency).toBe('EUR');
      
      expect(incomeResult.periods).toBe(5);
      expect(balanceResult.periods).toBe(5);
      expect(cashFlowResult.periods).toBe(5);
    });
  });
});
