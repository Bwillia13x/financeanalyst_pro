import { describe, it, expect, beforeEach, vi } from 'vitest';

import { financialModelingEngine } from '../financialModelingEngine.js';
import { lboModelingEngine } from '../lboModelingEngine.js';
import { monteCarloEngine } from '../monteCarloEngine.js';

describe('Financial Modeling Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DCF Modeling', () => {
    const mockDCFInputs = {
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      currentRevenue: 365000000000, // $365B
      currentPrice: 150,
      sharesOutstanding: 16000000000, // 16B shares
      totalDebt: 120000000000, // $120B
      cash: 50000000000, // $50B
      assumptions: {
        revenueGrowthRate: 0.08,
        ebitdaMargin: 0.25,
        wacc: 0.09,
        terminalGrowthRate: 0.025
      }
    };

    it('should build comprehensive DCF model with base case', () => {
      const dcfModel = financialModelingEngine.buildDCFModel(mockDCFInputs);

      expect(dcfModel).toHaveProperty('symbol', 'AAPL');
      expect(dcfModel).toHaveProperty('modelType', 'DCF');
      expect(dcfModel).toHaveProperty('baseCase');
      expect(dcfModel).toHaveProperty('scenarios');
      expect(dcfModel).toHaveProperty('sensitivityAnalysis');
      expect(dcfModel).toHaveProperty('summary');

      // Validate base case structure
      expect(dcfModel.baseCase).toHaveProperty('scenarioName', 'Base Case');
      expect(dcfModel.baseCase).toHaveProperty('revenueProjections');
      expect(dcfModel.baseCase).toHaveProperty('fcfProjections');
      expect(dcfModel.baseCase).toHaveProperty('enterpriseValue');
      expect(dcfModel.baseCase).toHaveProperty('pricePerShare');
      expect(dcfModel.baseCase).toHaveProperty('upside');

      // Validate projections are arrays with correct length
      expect(Array.isArray(dcfModel.baseCase.revenueProjections)).toBe(true);
      expect(dcfModel.baseCase.revenueProjections).toHaveLength(5);
      expect(Array.isArray(dcfModel.baseCase.fcfProjections)).toBe(true);
      expect(dcfModel.baseCase.fcfProjections).toHaveLength(5);

      // Validate financial calculations
      expect(dcfModel.baseCase.enterpriseValue).toBeGreaterThan(0);
      expect(dcfModel.baseCase.pricePerShare).toBeGreaterThan(0);
      expect(typeof dcfModel.baseCase.upside).toBe('number');
    });

    it('should generate bull and bear scenarios', () => {
      const dcfModel = financialModelingEngine.buildDCFModel(mockDCFInputs);

      expect(dcfModel.scenarios).toHaveProperty('bull');
      expect(dcfModel.scenarios).toHaveProperty('bear');

      // Bull case should have higher valuation than base case
      expect(dcfModel.scenarios.bull.pricePerShare).toBeGreaterThan(
        dcfModel.baseCase.pricePerShare
      );

      // Bear case should have lower valuation than base case
      expect(dcfModel.scenarios.bear.pricePerShare).toBeLessThan(dcfModel.baseCase.pricePerShare);
    });

    it('should perform sensitivity analysis', () => {
      const dcfModel = financialModelingEngine.buildDCFModel(mockDCFInputs);

      expect(dcfModel.sensitivityAnalysis).toHaveProperty('revenueGrowthRate');
      expect(dcfModel.sensitivityAnalysis).toHaveProperty('wacc');
      expect(dcfModel.sensitivityAnalysis).toHaveProperty('terminalGrowthRate');

      // Each sensitivity variable should have multiple scenarios
      expect(Array.isArray(dcfModel.sensitivityAnalysis.revenueGrowthRate)).toBe(true);
      expect(dcfModel.sensitivityAnalysis.revenueGrowthRate.length).toBeGreaterThan(3);
    });

    it('should generate investment recommendation', () => {
      const dcfModel = financialModelingEngine.buildDCFModel(mockDCFInputs);

      expect(dcfModel.summary).toHaveProperty('recommendation');
      expect(dcfModel.summary.recommendation).toHaveProperty('rating');
      expect(dcfModel.summary.recommendation).toHaveProperty('confidence');
      expect(dcfModel.summary.recommendation).toHaveProperty('upside');
      expect(dcfModel.summary.recommendation).toHaveProperty('reasoning');

      // Rating should be one of the valid options
      const validRatings = [
        'STRONG_BUY',
        'BUY',
        'HOLD',
        'SELL',
        'STRONG_SELL',
        'INSUFFICIENT_DATA'
      ];
      expect(validRatings).toContain(dcfModel.summary.recommendation.rating);

      // Confidence should be between 0 and 100
      expect(dcfModel.summary.recommendation.confidence).toBeGreaterThanOrEqual(0);
      expect(dcfModel.summary.recommendation.confidence).toBeLessThanOrEqual(100);
    });

    it('should calculate terminal value correctly', () => {
      const finalFCF = 10000000000; // $10B
      const terminalGrowthRate = 0.025;
      const discountRate = 0.09;

      const terminalValue = financialModelingEngine.calculateTerminalValue(
        finalFCF,
        terminalGrowthRate,
        discountRate
      );

      const expectedTerminalValue =
        (finalFCF * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);
      expect(terminalValue).toBeCloseTo(expectedTerminalValue, 2);
    });

    it('should throw error when discount rate <= terminal growth rate', () => {
      expect(() => {
        financialModelingEngine.calculateTerminalValue(1000000, 0.09, 0.08);
      }).toThrow('Discount rate must be greater than terminal growth rate');
    });
  });

  describe('LBO Modeling', () => {
    const mockLBOInputs = {
      symbol: 'MSFT',
      companyName: 'Microsoft Corporation',
      purchasePrice: 50000000000, // $50B
      ebitda: 10000000000, // $10B EBITDA
      revenue: 40000000000, // $40B revenue
      assumptions: {
        transaction: {
          holdingPeriod: 5,
          managementRollover: 0.1
        },
        debt: {
          totalDebtMultiple: 5.0,
          seniorInterestRate: 0.055
        },
        operating: {
          ebitdaGrowthRate: 0.06
        }
      }
    };

    it('should build comprehensive LBO model', () => {
      const lboModel = lboModelingEngine.buildLBOModel(mockLBOInputs);

      expect(lboModel).toHaveProperty('symbol', 'MSFT');
      expect(lboModel).toHaveProperty('modelType', 'LBO');
      expect(lboModel).toHaveProperty('transactionStructure');
      expect(lboModel).toHaveProperty('baseCase');
      expect(lboModel).toHaveProperty('scenarios');
      expect(lboModel).toHaveProperty('summary');

      // Validate transaction structure
      expect(lboModel.transactionStructure).toHaveProperty('purchasePrice');
      expect(lboModel.transactionStructure).toHaveProperty('totalDebt');
      expect(lboModel.transactionStructure).toHaveProperty('equityContribution');
      expect(lboModel.transactionStructure).toHaveProperty('debtToEbitda');

      // Validate base case
      expect(lboModel.baseCase).toHaveProperty('operatingProjections');
      expect(lboModel.baseCase).toHaveProperty('debtSchedule');
      expect(lboModel.baseCase).toHaveProperty('returnsAnalysis');

      // Validate returns analysis
      expect(lboModel.baseCase.returnsAnalysis).toHaveProperty('irr');
      expect(lboModel.baseCase.returnsAnalysis).toHaveProperty('moic');
      expect(lboModel.baseCase.returnsAnalysis).toHaveProperty('totalCashReturned');
    });

    it('should calculate transaction structure correctly', () => {
      const purchasePrice = 50000000000;
      const ebitda = 10000000000;
      const assumptions = lboModelingEngine.assumptions;

      const structure = lboModelingEngine.calculateTransactionStructure(
        purchasePrice,
        ebitda,
        assumptions
      );

      expect(structure.purchasePrice).toBe(purchasePrice);
      expect(structure.totalDebt).toBeGreaterThan(0);
      expect(structure.equityContribution).toBeGreaterThan(0);
      expect(structure.debtToEbitda).toBeCloseTo(structure.totalDebt / ebitda, 2);
      expect(structure.totalUses).toBeGreaterThan(purchasePrice); // Includes fees
    });

    it('should calculate IRR correctly', () => {
      const cashFlows = [-100, 10, 15, 20, 25, 150]; // Initial investment + annual returns + exit
      const irr = lboModelingEngine.calculateIRR(cashFlows);

      expect(irr).toBeGreaterThan(0);
      expect(irr).toBeLessThan(1); // Should be less than 100%

      // Verify IRR calculation by checking NPV at calculated rate
      let npv = 0;
      for (let i = 0; i < cashFlows.length; i++) {
        npv += cashFlows[i] / Math.pow(1 + irr, i);
      }
      expect(Math.abs(npv)).toBeLessThan(0.01); // NPV should be close to zero
    });

    it('should generate upside and downside scenarios', () => {
      const lboModel = lboModelingEngine.buildLBOModel(mockLBOInputs);

      expect(lboModel.scenarios).toHaveProperty('upside');
      expect(lboModel.scenarios).toHaveProperty('downside');

      // Check that scenarios have the expected structure
      expect(lboModel.scenarios.upside).toHaveProperty('scenarioName');
      expect(lboModel.scenarios.upside).toHaveProperty('operatingProjections');
      expect(lboModel.scenarios.upside).toHaveProperty('debtSchedule');
      expect(lboModel.scenarios.upside).toHaveProperty('returnsAnalysis');

      expect(lboModel.scenarios.downside).toHaveProperty('scenarioName');
      expect(lboModel.scenarios.downside).toHaveProperty('operatingProjections');
      expect(lboModel.scenarios.downside).toHaveProperty('debtSchedule');
      expect(lboModel.scenarios.downside).toHaveProperty('returnsAnalysis');

      // Check that returns analysis has the expected properties
      expect(lboModel.scenarios.upside.returnsAnalysis).toHaveProperty('irr');
      expect(lboModel.scenarios.upside.returnsAnalysis).toHaveProperty('moic');
      expect(lboModel.scenarios.upside.returnsAnalysis).toHaveProperty('totalCashReturned');
      expect(lboModel.scenarios.upside.returnsAnalysis).toHaveProperty('initialInvestment');

      // Verify scenario names
      expect(lboModel.scenarios.upside.scenarioName).toBe('Upside Case');
      expect(lboModel.scenarios.downside.scenarioName).toBe('Downside Case');
    });
  });

  describe('Monte Carlo Engine', () => {
    const mockDistributions = {
      revenueGrowthRate: {
        type: 'normal',
        parameters: { mean: 0.1, stdDev: 0.03 }
      },
      wacc: {
        type: 'uniform',
        parameters: { min: 0.08, max: 0.12 }
      },
      terminalGrowthRate: {
        type: 'triangular',
        parameters: { min: 0.02, mode: 0.025, max: 0.03 }
      }
    };

    it('should generate normal random variables', () => {
      const samples = [];
      for (let i = 0; i < 1000; i++) {
        samples.push(monteCarloEngine.normalRandom(0, 1));
      }

      const mean = samples.reduce((sum, x) => sum + x, 0) / samples.length;
      const variance = samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / samples.length;

      expect(mean).toBeCloseTo(0, 0); // Mean should be close to 0 with reasonable tolerance
      expect(Math.sqrt(variance)).toBeCloseTo(1, 1); // Std dev should be close to 1
    });

    it('should generate triangular random variables', () => {
      const min = 0,
        mode = 0.5,
        max = 1;
      const samples = [];

      for (let i = 0; i < 1000; i++) {
        const sample = monteCarloEngine.triangularRandom(min, mode, max);
        samples.push(sample);
        expect(sample).toBeGreaterThanOrEqual(min);
        expect(sample).toBeLessThanOrEqual(max);
      }

      // Check that mode is the most frequent value (approximately)
      const mean = samples.reduce((sum, x) => sum + x, 0) / samples.length;
      expect(mean).toBeCloseTo(mode, 1);
    });

    it('should sample from different distribution types', () => {
      Object.entries(mockDistributions).forEach(([variable, distribution]) => {
        const sample = monteCarloEngine.sampleFromDistribution(distribution);
        expect(typeof sample).toBe('number');
        expect(isFinite(sample)).toBe(true);
      });
    });

    it('should generate correlated samples when correlation matrix provided', () => {
      const correlationMatrix = [
        [1.0, 0.5, 0.3],
        [0.5, 1.0, 0.2],
        [0.3, 0.2, 1.0]
      ];

      const samples = monteCarloEngine.generateCorrelatedSamples(
        mockDistributions,
        100,
        correlationMatrix
      );

      expect(samples).toHaveLength(100);
      expect(samples[0]).toHaveProperty('revenueGrowthRate');
      expect(samples[0]).toHaveProperty('wacc');
      expect(samples[0]).toHaveProperty('terminalGrowthRate');
    });

    it('should calculate percentiles correctly', () => {
      const sortedValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      expect(monteCarloEngine.percentile(sortedValues, 0.5)).toBe(5.5); // Median
      expect(monteCarloEngine.percentile(sortedValues, 0.25)).toBe(3.25); // 25th percentile
      expect(monteCarloEngine.percentile(sortedValues, 0.75)).toBe(7.75); // 75th percentile
      expect(monteCarloEngine.percentile(sortedValues, 0)).toBe(1); // Min
      expect(monteCarloEngine.percentile(sortedValues, 1)).toBe(10); // Max
    });

    it('should analyze simulation results correctly', () => {
      const mockResults = Array.from({ length: 1000 }, (_, i) => ({
        iteration: i + 1,
        pricePerShare: 100 + (Math.random() - 0.5) * 40, // Random prices around $100
        enterpriseValue: 1000000000 + (Math.random() - 0.5) * 400000000,
        upside: (Math.random() - 0.5) * 50
      }));

      const analysis = monteCarloEngine.analyzeResults(mockResults, 0.95);

      expect(analysis).toHaveProperty('statistics');
      expect(analysis).toHaveProperty('percentiles');
      expect(analysis).toHaveProperty('confidenceIntervals');
      expect(analysis).toHaveProperty('riskMetrics');

      // Validate statistics
      expect(analysis.statistics.pricePerShare).toHaveProperty('mean');
      expect(analysis.statistics.pricePerShare).toHaveProperty('median');
      expect(analysis.statistics.pricePerShare).toHaveProperty('stdDev');
      expect(analysis.statistics.pricePerShare).toHaveProperty('min');
      expect(analysis.statistics.pricePerShare).toHaveProperty('max');

      // Validate percentiles
      expect(analysis.percentiles.pricePerShare).toHaveProperty('p5');
      expect(analysis.percentiles.pricePerShare).toHaveProperty('p25');
      expect(analysis.percentiles.pricePerShare).toHaveProperty('p50');
      expect(analysis.percentiles.pricePerShare).toHaveProperty('p75');
      expect(analysis.percentiles.pricePerShare).toHaveProperty('p95');

      // Validate confidence intervals
      expect(analysis.confidenceIntervals.pricePerShare).toHaveProperty('level', 0.95);
      expect(analysis.confidenceIntervals.pricePerShare).toHaveProperty('lowerBound');
      expect(analysis.confidenceIntervals.pricePerShare).toHaveProperty('upperBound');
    });
  });

  describe('Integration Tests', () => {
    it('should handle edge cases gracefully', () => {
      // Test with minimal inputs
      const minimalInputs = {
        symbol: 'TEST',
        companyName: 'Test Company',
        currentRevenue: 0,
        currentPrice: 0,
        sharesOutstanding: 1
      };

      expect(() => {
        financialModelingEngine.buildDCFModel(minimalInputs);
      }).not.toThrow();
    });

    it('should validate input parameters', () => {
      // Test invalid terminal growth rate
      const invalidInputs = {
        symbol: 'TEST',
        assumptions: {
          wacc: 0.05,
          terminalGrowthRate: 0.06 // Higher than WACC
        }
      };

      expect(() => {
        financialModelingEngine.calculateTerminalValue(1000000, 0.06, 0.05);
      }).toThrow();
    });

    it('should maintain consistency across scenarios', () => {
      const inputs = {
        symbol: 'AAPL',
        currentRevenue: 365000000000,
        currentPrice: 150,
        sharesOutstanding: 16000000000,
        assumptions: {
          revenueGrowthRate: 0.08,
          wacc: 0.09
        }
      };

      const dcfModel = financialModelingEngine.buildDCFModel(inputs);

      // All scenarios should have the same structure
      const scenarios = [dcfModel.baseCase, ...Object.values(dcfModel.scenarios)];
      scenarios.forEach(scenario => {
        expect(scenario).toHaveProperty('revenueProjections');
        expect(scenario).toHaveProperty('fcfProjections');
        expect(scenario).toHaveProperty('enterpriseValue');
        expect(scenario).toHaveProperty('pricePerShare');
        expect(scenario.revenueProjections).toHaveLength(5);
        expect(scenario.fcfProjections).toHaveLength(5);
      });
    });
  });
});
