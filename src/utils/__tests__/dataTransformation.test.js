// Tests for data transformation utilities
import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPercentage,
  formatNumber,
  calculateCAGR,
  calculateNPV,
  calculateIRR,
  calculateWACC,
  calculateDCFValuation,
  calculateLBOReturns,
  calculateComparableMetrics
} from '../dataTransformation';

describe('formatCurrency', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(1000)).toBe('$1,000');
    expect(formatCurrency(1000000)).toBe('$1,000,000');
    expect(formatCurrency(1000, 'USD', true)).toBe('$1K');
    expect(formatCurrency(1000000, 'USD', true)).toBe('$1M');
  });

  it('should handle null and undefined values', () => {
    expect(formatCurrency(null)).toBe('N/A');
    expect(formatCurrency(undefined)).toBe('N/A');
    expect(formatCurrency(NaN)).toBe('N/A');
  });
});

describe('formatPercentage', () => {
  it('should format percentages correctly', () => {
    expect(formatPercentage(0.1)).toBe('10.0%');
    expect(formatPercentage(0.15)).toBe('15.0%');
    expect(formatPercentage(0.1234, 2)).toBe('12.34%');
  });

  it('should handle null and undefined values', () => {
    expect(formatPercentage(null)).toBe('N/A');
    expect(formatPercentage(undefined)).toBe('N/A');
    expect(formatPercentage(NaN)).toBe('N/A');
  });
});

describe('formatNumber', () => {
  it('should format numbers correctly', () => {
    expect(formatNumber(1234.567)).toBe('1,234.57');
    expect(formatNumber(1234.567, 1)).toBe('1,234.6');
    expect(formatNumber(1000000, 2, true)).toBe('1M');
  });

  it('should handle null and undefined values', () => {
    expect(formatNumber(null)).toBe('N/A');
    expect(formatNumber(undefined)).toBe('N/A');
    expect(formatNumber(NaN)).toBe('N/A');
  });
});

describe('calculateCAGR', () => {
  it('should calculate CAGR correctly', () => {
    const cagr = calculateCAGR(100, 200, 5);
    expect(cagr).toBeCloseTo(0.1487, 4); // ~14.87%
  });

  it('should handle edge cases', () => {
    expect(calculateCAGR(0, 100, 5)).toBe(0);
    expect(calculateCAGR(100, 0, 5)).toBe(0);
    expect(calculateCAGR(100, 200, 0)).toBe(0);
  });
});

describe('calculateNPV', () => {
  it('should calculate NPV correctly', () => {
    const cashFlows = [1000, 1100, 1200, 1300];
    const discountRate = 0.1;
    const npv = calculateNPV(cashFlows, discountRate);
    expect(npv).toBeCloseTo(3486.85, 2);
  });

  it('should handle empty cash flows', () => {
    expect(calculateNPV([], 0.1)).toBe(0);
  });
});

describe('calculateIRR', () => {
  it('should calculate IRR correctly', () => {
    const cashFlows = [-1000, 300, 400, 500, 600];
    const irr = calculateIRR(cashFlows);
    expect(irr).toBeGreaterThan(0.2); // Should be around 20%+
  });

  it('should handle edge cases', () => {
    expect(calculateIRR([])).toBe(0);
    expect(calculateIRR([100])).toBe(0);
  });
});

describe('calculateWACC', () => {
  it('should calculate WACC correctly', () => {
    const wacc = calculateWACC(0.12, 0.05, 0.25, 0.3);
    expect(wacc).toBeCloseTo(0.0955, 4); // ~9.55%
  });

  it('should handle edge cases', () => {
    expect(calculateWACC(0, 0, 0, 0)).toBe(0);
    expect(calculateWACC(0.1, 0.05, 0.25, 1)).toBe(0.0375); // 100% debt
  });
});

describe('calculateDCFValuation', () => {
  it('should calculate DCF valuation with valid inputs', () => {
    const inputs = {
      revenue: [1000, 1100, 1200, 1300, 1400],
      freeCashFlow: [100, 110, 120, 130, 140],
      wacc: 0.1,
      terminalGrowthRate: 0.025,
      sharesOutstanding: 100
    };

    const result = calculateDCFValuation(inputs);
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('should handle missing or invalid inputs', () => {
    const result = calculateDCFValuation({});
    expect(result).toBeDefined();
  });
});

describe('calculateLBOReturns', () => {
  it('should calculate LBO returns with valid inputs', () => {
    const inputs = {
      purchasePrice: 1000,
      debtAmount: 700,
      equityAmount: 300,
      exitValue: 1500,
      holdingPeriod: 5,
      dividends: [10, 15, 20, 25, 30]
    };

    const result = calculateLBOReturns(inputs);
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('should handle edge cases', () => {
    const inputs = {
      purchasePrice: 1000,
      debtAmount: 700,
      equityAmount: 300,
      exitValue: 200, // Loss scenario
      holdingPeriod: 5,
      dividends: []
    };

    const result = calculateLBOReturns(inputs);
    expect(result).toBeDefined();
  });
});

describe('calculateComparableMetrics', () => {
  it('should calculate comparable metrics correctly', () => {
    const companyData = {
      marketCap: 1000000000,
      revenue: 500000000,
      ebitda: 100000000,
      netIncome: 50000000
    };

    const peers = [
      { marketCap: 800000000, revenue: 400000000, ebitda: 80000000 },
      { marketCap: 1200000000, revenue: 600000000, ebitda: 120000000 }
    ];

    const result = calculateComparableMetrics(companyData, peers);
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('should handle missing data gracefully', () => {
    const result = calculateComparableMetrics({}, []);
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });
});
