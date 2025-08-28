import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatCurrency,
  formatPercentage,
  formatNumber,
  calculateCAGR,
  calculateNPV,
  calculateIRR,
  calculateWACC,
  calculateTerminalValue,
  projectCashFlows,
  calculateDCFValuation,
  calculateLBOReturns,
  calculateComparableMetrics,
  calculatePercentile,
  generateMonteCarloScenarios,
  calculateSensitivityAnalysis
} from '../dataTransformation.js';

describe('Data Transformation Utilities', () => {
  describe('formatCurrency', () => {
    it('should format valid numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,235');
      expect(formatCurrency(1000000)).toBe('$1,000,000');
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,235');
    });

    it('should handle compact notation', () => {
      expect(formatCurrency(1000000, 'USD', true)).toBe('$1M');
      expect(formatCurrency(1500000, 'USD', true)).toBe('$2M');
    });

    it('should handle edge cases', () => {
      expect(formatCurrency(null)).toBe('N/A');
      expect(formatCurrency(undefined)).toBe('N/A');
      expect(formatCurrency(NaN)).toBe('N/A');
      expect(formatCurrency(0)).toBe('$0');
      expect(formatCurrency(-1234.56)).toBe('-$1,235');
    });
  });

  describe('formatPercentage', () => {
    it('should format valid numbers correctly', () => {
      expect(formatPercentage(0.1234)).toBe('12.3%');
      expect(formatPercentage(0.5, 2)).toBe('50.00%');
      expect(formatPercentage(1, 0)).toBe('100%');
    });

    it('should handle edge cases', () => {
      expect(formatPercentage(null)).toBe('N/A');
      expect(formatPercentage(undefined)).toBe('N/A');
      expect(formatPercentage(NaN)).toBe('N/A');
      expect(formatPercentage(0)).toBe('0.0%');
      expect(formatPercentage(-0.1234)).toBe('-12.3%');
    });
  });

  describe('formatNumber', () => {
    it('should format valid numbers correctly', () => {
      expect(formatNumber(1234.5678)).toBe('1,235');
      expect(formatNumber(1234.5678, 3)).toBe('1,234.568');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should handle compact notation', () => {
      expect(formatNumber(1000000, 2, true)).toBe('1M');
      expect(formatNumber(1500000, 2, true)).toBe('2M');
    });

    it('should handle edge cases', () => {
      expect(formatNumber(null)).toBe('N/A');
      expect(formatNumber(undefined)).toBe('N/A');
      expect(formatNumber(NaN)).toBe('N/A');
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('calculateCAGR', () => {
    it('should calculate CAGR correctly', () => {
      expect(calculateCAGR(100, 200, 5)).toBeCloseTo(0.1487, 4); // 14.87%
      expect(calculateCAGR(1000, 1000, 5)).toBe(0); // No growth
    });

    it('should handle edge cases', () => {
      expect(calculateCAGR(0, 200, 5)).toBe(0);
      expect(calculateCAGR(100, 0, 5)).toBe(0);
      expect(calculateCAGR(100, 200, 0)).toBe(0);
      expect(calculateCAGR(-100, 200, 5)).toBe(0);
    });
  });

  describe('calculateNPV', () => {
    it('should calculate NPV correctly', () => {
      const cashFlows = [-1000, 200, 300, 400, 500];
      const discountRate = 0.1;
      const expected = 200 / 1.1 + 300 / 1.1 ** 2 + 400 / 1.1 ** 3 + 500 / 1.1 ** 4;
      expect(calculateNPV(cashFlows, discountRate)).toBeCloseTo(expected, 2);
    });

    it('should handle edge cases', () => {
      expect(calculateNPV([], 0.1)).toBe(0);
      expect(calculateNPV([0], 0.1)).toBe(0);
    });
  });

  describe('calculateIRR', () => {
    it('should calculate IRR correctly', () => {
      const cashFlows = [-1000, 300, 400, 500];
      const irr = calculateIRR(cashFlows);
      expect(irr).toBeGreaterThan(0);
      expect(irr).toBeLessThan(1);
    });

    it('should handle edge cases', () => {
      expect(calculateIRR([])).toBe(0);
      expect(calculateIRR([1000])).toBe(0);
      expect(calculateIRR([-1000, 1000])).toBeCloseTo(0, 2);
    });
  });

  describe('calculateWACC', () => {
    it('should calculate WACC correctly', () => {
      const costOfEquity = 0.12;
      const costOfDebt = 0.06;
      const taxRate = 0.3;
      const debtRatio = 0.4;
      const expected = 0.12 * 0.6 + 0.06 * 0.4 * (1 - 0.3);
      expect(calculateWACC(costOfEquity, costOfDebt, taxRate, debtRatio)).toBeCloseTo(expected, 4);
    });
  });

  describe('calculateTerminalValue', () => {
    it('should calculate terminal value correctly', () => {
      const finalCashFlow = 1000;
      const terminalGrowthRate = 0.03;
      const discountRate = 0.1;
      const expected = (1000 * 1.03) / (0.1 - 0.03);
      expect(calculateTerminalValue(finalCashFlow, terminalGrowthRate, discountRate)).toBeCloseTo(
        expected,
        2
      );
    });

    it('should handle edge case where discount rate equals growth rate', () => {
      expect(() => calculateTerminalValue(1000, 0.1, 0.1)).toThrow();
    });
  });

  describe('projectCashFlows', () => {
    it('should project cash flows with constant growth rate', () => {
      const result = projectCashFlows(1000, 0.1, 3);
      expect(result).toEqual([1100, 1210, 1331]);
    });

    it('should project cash flows with variable growth rates', () => {
      const growthRates = [0.1, 0.2, 0.15];
      const result = projectCashFlows(1000, growthRates, 3);
      expect(result).toEqual([1100, 1320, 1518]);
    });

    it('should handle default years parameter', () => {
      const result = projectCashFlows(1000, 0.1);
      expect(result).toHaveLength(5);
    });
  });

  describe('calculateDCFValuation', () => {
    it('should calculate DCF valuation correctly', () => {
      const inputs = {
        currentRevenue: 1000,
        revenueGrowthRate: 0.1,
        fcfMargin: 0.15,
        wacc: 0.1,
        terminalGrowthRate: 0.03,
        sharesOutstanding: 100,
        totalDebt: 200,
        cash: 50,
        projectionYears: 3
      };

      const result = calculateDCFValuation(inputs);

      expect(result).toHaveProperty('enterpriseValue');
      expect(result).toHaveProperty('equityValue');
      expect(result).toHaveProperty('pricePerShare');
      expect(result.projectedRevenues).toHaveLength(3);
      expect(result.projectedFCFs).toHaveLength(3);
      expect(result.equityValue).toBe(result.enterpriseValue - inputs.totalDebt + inputs.cash);
    });
  });

  describe('calculateLBOReturns', () => {
    it('should calculate LBO returns correctly', () => {
      const inputs = {
        purchasePrice: 1000,
        ebitda: 100,
        debtMultiple: 5,
        exitMultiple: 8,
        exitYear: 5
      };

      const result = calculateLBOReturns(inputs);

      expect(result.equityInvestment).toBe(500); // 1000 - 100*5
      expect(result.totalDebt).toBe(500);
      expect(result).toHaveProperty('irr');
      expect(result).toHaveProperty('moic');
      expect(result).toHaveProperty('netReturn');
    });
  });

  describe('calculateComparableMetrics', () => {
    it('should calculate comparable metrics correctly', () => {
      const companyData = {
        marketCap: 1000,
        peRatio: 15,
        evToEbitda: 8,
        priceToBook: 2,
        debtToEquity: 1.5
      };

      const peerData = [
        { marketCap: 800, peRatio: 12, evToEbitda: 7, priceToBook: 1.8, debtToEquity: 1.2 },
        { marketCap: 1200, peRatio: 18, evToEbitda: 9, priceToBook: 2.2, debtToEquity: 1.8 }
      ];

      const result = calculateComparableMetrics(companyData, peerData);

      expect(result.company).toBe(companyData);
      expect(result.peerStatistics).toHaveProperty('marketCap');
      expect(result.peerStatistics.marketCap).toHaveProperty('median');
      expect(result.relativeValuation).toHaveProperty('marketCapPercentile');
    });
  });

  describe('calculatePercentile', () => {
    it('should calculate percentile correctly', () => {
      const dataset = [10, 20, 30, 40, 50];
      expect(calculatePercentile(25, dataset)).toBe(0.4); // 40th percentile
      expect(calculatePercentile(30, dataset)).toBe(0.5); // 50th percentile
    });

    it('should handle edge cases', () => {
      expect(calculatePercentile(null, [1, 2, 3])).toBe(null);
      expect(calculatePercentile(5, [])).toBe(null);
      expect(calculatePercentile(5, [null, undefined, NaN])).toBe(null);
    });
  });

  describe('generateMonteCarloScenarios', () => {
    it('should generate correct number of scenarios', () => {
      const baseInputs = { revenue: 1000, growth: 0.1 };
      const variableRanges = {
        revenue: { min: 900, max: 1100 },
        growth: { min: 0.05, max: 0.15 }
      };

      const scenarios = generateMonteCarloScenarios(baseInputs, variableRanges, 100);

      expect(scenarios).toHaveLength(100);
      scenarios.forEach(scenario => {
        expect(scenario.revenue).toBeGreaterThanOrEqual(900);
        expect(scenario.revenue).toBeLessThanOrEqual(1100);
        expect(scenario.growth).toBeGreaterThanOrEqual(0.05);
        expect(scenario.growth).toBeLessThanOrEqual(0.15);
      });
    });
  });

  describe('calculateSensitivityAnalysis', () => {
    it('should calculate sensitivity analysis correctly', () => {
      const baseInputs = { revenue: 1000, cost: 800 };
      const range = { min: 0.8, max: 1.2 };
      const steps = 5;

      const results = calculateSensitivityAnalysis(baseInputs, 'revenue', range, steps);

      expect(results).toHaveLength(steps);
      expect(results[0].revenue).toBe(800); // min value
      expect(results[4].revenue).toBe(1200); // max value
    });
  });
});
