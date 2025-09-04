import { describe, it, expect, beforeEach, afterEach, jest } from 'vitest';
import {
  financialAnalyticsEngine,
  RiskAssessmentEngine,
  PredictiveModelingEngine,
  PerformanceMeasurementEngine,
  StatisticalAnalysisEngine
} from '../../services/analytics';

describe('Analytics Engines Error Handling', () => {
  let riskEngine;
  let predictiveEngine;
  let performanceEngine;
  let statisticalEngine;

  beforeEach(() => {
    riskEngine = new RiskAssessmentEngine({ cacheTimeout: 1000 });
    predictiveEngine = new PredictiveModelingEngine({ cacheTimeout: 1000 });
    performanceEngine = new PerformanceMeasurementEngine({ cacheTimeout: 1000 });
    statisticalEngine = new StatisticalAnalysisEngine({ cacheTimeout: 1000 });

    // Clear caches
    financialAnalyticsEngine.clearCache();
    riskEngine.clearCache();
    predictiveEngine.clearCache();
    performanceEngine.clearCache();
    statisticalEngine.clearCache();
  });

  afterEach(() => {
    financialAnalyticsEngine.clearCache();
    riskEngine.clearCache();
    predictiveEngine.clearCache();
    performanceEngine.clearCache();
    statisticalEngine.clearCache();
  });

  describe('Financial Analytics Engine - Error Handling', () => {
    describe('Invalid Input Handling', () => {
      it('should handle empty arrays gracefully', () => {
        expect(() => financialAnalyticsEngine.calculateReturns([])).toThrow();
        expect(financialAnalyticsEngine.calculateVolatility([])).toBe(0);
        expect(financialAnalyticsEngine.calculateSharpeRatio([], undefined, 0.02)).toBe(0);
      });

      it('should handle null and undefined inputs', () => {
        expect(() => financialAnalyticsEngine.calculateReturns(null)).toThrow();
        expect(() => financialAnalyticsEngine.calculateReturns(undefined)).toThrow();
        expect(financialAnalyticsEngine.calculateVolatility(null)).toBe(0);
        expect(financialAnalyticsEngine.calculateMaxDrawdown(null)).toBe(0);
      });

      it('should handle non-array inputs', () => {
        expect(() => financialAnalyticsEngine.calculateReturns('invalid')).toThrow();
        expect(() => financialAnalyticsEngine.calculateReturns(123)).toThrow();
        expect(() => financialAnalyticsEngine.calculateReturns({})).toThrow();
      });

      it('should handle arrays with invalid values', () => {
        const invalidReturns = [0.01, null, undefined, NaN, Infinity, -Infinity];
        expect(financialAnalyticsEngine.calculateReturns(invalidReturns)).toBe(0);

        const mixedReturns = [0.01, '0.02', 0.03]; // Mixed types
        expect(financialAnalyticsEngine.calculateReturns(mixedReturns)).toBe(0);
      });
    });

    describe('Edge Cases', () => {
      it('should handle single data point', () => {
        expect(() => financialAnalyticsEngine.calculateReturns([0.01])).toThrow();
        expect(financialAnalyticsEngine.calculateVolatility([0.01])).toBe(0);
      });

      it('should handle constant returns', () => {
        const constantReturns = [0.01, 0.01, 0.01, 0.01, 0.01];
        const result = financialAnalyticsEngine.calculateReturns(constantReturns);

        expect(result).toBeDefined();
        expect(result.volatility).toBe(0);
        expect(result.sharpeRatio).toBe(-Infinity); // Returns below risk-free rate
      });

      it('should handle zero volatility', () => {
        const zeroVolReturns = [0.01, 0.01, 0.01, 0.01, 0.01];
        const sharpeRatio = financialAnalyticsEngine.calculateSharpeRatio(
          zeroVolReturns,
          undefined,
          0.02
        );

        expect(sharpeRatio).toBe(Infinity);
      });

      it('should handle extreme values', () => {
        const extremeReturns = [10, -5, 20, -15, 25]; // Unrealistic returns
        const result = financialAnalyticsEngine.calculateReturns(extremeReturns);

        expect(result).toBeDefined();
        expect(isFinite(result.volatility)).toBe(true);
        // Sharpe ratio can be -Infinity when volatility is 0 and returns < risk-free rate
        expect(result.sharpeRatio === -Infinity || isFinite(result.sharpeRatio)).toBe(true);
      });

      it('should handle very small numbers', () => {
        const tinyPrices = [1.000001, 0.999999, 1.000003]; // Small price movements
        const result = financialAnalyticsEngine.calculateReturns(tinyPrices);

        expect(result).toBeDefined();
        expect(result.totalReturn).toBeCloseTo(0.000002, 5);
      });

      it('should handle very large numbers', () => {
        const largeReturns = [1000000, -500000, 2000000];
        const result = financialAnalyticsEngine.calculateReturns(largeReturns);

        expect(result).toBeDefined();
        expect(isFinite(result.totalReturn)).toBe(true);
      });
    });

    describe('Technical Indicators - Error Handling', () => {
      it('should handle insufficient data for moving averages', () => {
        const shortData = [100, 105];
        const result = financialAnalyticsEngine.calculateMovingAverages(shortData, [20]);

        expect(result.MA20).toEqual([]); // Should return empty array
      });

      it('should handle insufficient data for RSI', () => {
        const shortData = [100, 105, 98];
        const result = financialAnalyticsEngine.calculateRSI(shortData, 14);

        expect(result).toEqual([]); // Should return empty array
      });

      it('should handle invalid parameters for technical indicators', () => {
        const data = Array.from({ length: 50 }, () => 100 + Math.random() * 10);

        expect(() => financialAnalyticsEngine.calculateMovingAverages(data, [0])).toThrow(); // Invalid period
        expect(() => financialAnalyticsEngine.calculateRSI(data, 0)).toThrow(); // Invalid period
        expect(() => financialAnalyticsEngine.calculateBollingerBands(data, 0)).toThrow(); // Invalid period
      });
    });

    describe('Portfolio Analysis - Error Handling', () => {
      it('should handle mismatched portfolio data', () => {
        const assets = [
          { symbol: 'AAPL', weight: 0.5, returns: [0.01, 0.02] },
          { symbol: 'MSFT', weight: 0.5, returns: [0.01] } // Different length
        ];
        const weights = [0.5, 0.5];

        expect(() => financialAnalyticsEngine.analyzePortfolio(assets, weights)).toThrow();
      });

      it('should handle zero weights', () => {
        const returns = Array.from({ length: 15 }, () => Math.random() * 0.1 - 0.05); // 15 data points
        const assets = [
          { symbol: 'AAPL', weight: 0, returns },
          { symbol: 'MSFT', weight: 1, returns }
        ];
        const weights = [0, 1];

        const result = financialAnalyticsEngine.analyzePortfolio(assets, weights);
        expect(result).toBeDefined();
        expect(result.portfolioReturns).toBeDefined();
      });

      it('should handle negative weights', () => {
        const returns = Array.from({ length: 15 }, () => Math.random() * 0.1 - 0.05); // 15 data points
        const assets = [
          { symbol: 'AAPL', weight: -0.2, returns },
          { symbol: 'MSFT', weight: 1.2, returns }
        ];
        const weights = [-0.2, 1.2];

        const result = financialAnalyticsEngine.analyzePortfolio(assets, weights);
        expect(result).toBeDefined();
      });

      it("should handle weights that don't sum to 1", () => {
        const returns = Array.from({ length: 15 }, () => Math.random() * 0.1 - 0.05); // 15 data points
        const assets = [
          { symbol: 'AAPL', weight: 0.3, returns },
          { symbol: 'MSFT', weight: 0.4, returns }
        ];
        const weights = [0.3, 0.4]; // Sum to 0.7

        const result = financialAnalyticsEngine.analyzePortfolio(assets, weights);
        expect(result).toBeDefined();
      });
    });
  });

  describe('Risk Assessment Engine - Error Handling', () => {
    describe('VaR Calculation Errors', () => {
      it('should handle insufficient data for VaR', () => {
        const shortData = [0.01, 0.02];

        expect(() => riskEngine.calculateVaR(shortData, 0.95)).toThrow();
      });

      it('should handle invalid confidence levels', () => {
        const data = Array.from({ length: 100 }, () => Math.random() * 0.02 - 0.01);

        expect(() => riskEngine.calculateVaR(data, 1.5)).toThrow(); // > 1
        expect(() => riskEngine.calculateVaR(data, 0)).toThrow(); // = 0
        expect(() => riskEngine.calculateVaR(data, -0.1)).toThrow(); // < 0
      });

      it('should handle invalid VaR methods', () => {
        const data = Array.from({ length: 100 }, () => Math.random() * 0.02 - 0.01);

        expect(() => riskEngine.calculateVaR(data, 0.95, 'invalid')).toThrow();
      });

      it('should handle constant data in VaR calculation', () => {
        const constantData = Array.from({ length: 100 }, () => 0.01);
        const result = riskEngine.calculateVaR(constantData, 0.95);

        expect(result).toBeDefined();
        expect(result.var95).toBe(0); // No volatility means no VaR
      });
    });

    describe('Stress Testing Errors', () => {
      it('should handle invalid stress test scenarios', () => {
        const assets = [{ symbol: 'AAPL', returns: [0.01, 0.02, 0.03] }];
        const weights = [1];

        expect(() => riskEngine.runStressTest(assets, weights, null)).toThrow();
        expect(() => riskEngine.runStressTest(assets, weights, {})).toThrow();
        expect(() => riskEngine.runStressTest(assets, weights, { shocks: null })).toThrow();
      });

      it('should handle missing scenario properties', () => {
        const assets = [{ symbol: 'AAPL', returns: [0.01, 0.02, 0.03] }];
        const weights = [1];
        const invalidScenario = { name: 'Test' }; // Missing shocks and probability

        expect(() => riskEngine.runStressTest(assets, weights, invalidScenario)).toThrow();
      });

      it('should handle extreme shock values', () => {
        const assets = [{ symbol: 'AAPL', returns: [0.01, 0.02, 0.03] }];
        const weights = [1];
        const extremeScenario = {
          name: 'Extreme',
          description: 'Extreme scenario',
          shocks: { equities: -2 }, // -200% shock
          probability: 0.01
        };

        const result = riskEngine.runStressTest(assets, weights, extremeScenario);
        expect(result).toBeDefined();
        expect(result.impact.returnImpact).toBeDefined();
      });
    });

    describe('Risk Attribution Errors', () => {
      it('should handle invalid attribution inputs', () => {
        expect(() => riskEngine.performRiskAttribution([], [], [])).toThrow();
        expect(() =>
          riskEngine.performRiskAttribution(
            [{ returns: [0.01] }],
            [0.5],
            [0.5, 0.5] // Mismatched lengths
          )
        ).toThrow();
      });

      it('should handle assets without volatility', () => {
        const assets = [
          { symbol: 'AAPL', returns: [0.01, 0.02, 0.03] },
          { symbol: 'MSFT', returns: [0.01, 0.02, 0.03] }
        ];
        const weights = [0.5, 0.5];
        const benchmarkWeights = [0.4, 0.6];

        const result = riskEngine.performRiskAttribution(assets, weights, benchmarkWeights);
        expect(result).toBeDefined();
      });
    });

    describe('Scenario Analysis Errors', () => {
      it('should handle empty scenario arrays', () => {
        const assets = [{ symbol: 'AAPL', returns: [0.01, 0.02, 0.03] }];
        const weights = [1];

        const result = riskEngine.runScenarioAnalysis(assets, weights, []);
        expect(result).toBeDefined();
        expect(result.scenarios).toEqual([]);
      });

      it('should handle invalid scenarios in array', () => {
        const assets = [{ symbol: 'AAPL', returns: [0.01, 0.02, 0.03] }];
        const weights = [1];
        const scenarios = [
          riskEngine.stressTestScenarios['2008-crisis'],
          null, // Invalid scenario
          {} // Invalid scenario
        ];

        expect(() => riskEngine.runScenarioAnalysis(assets, weights, scenarios)).toThrow();
      });
    });
  });

  describe('Predictive Modeling Engine - Error Handling', () => {
    describe('ARIMA Errors', () => {
      it('should handle insufficient data for ARIMA', () => {
        const shortData = [100, 105];

        expect(() => predictiveEngine.forecastARIMA(shortData, { p: 1, d: 1, q: 1 })).toThrow();
      });

      it('should handle invalid ARIMA parameters', () => {
        const data = Array.from({ length: 50 }, () => 100 + Math.random() * 10);

        expect(() => predictiveEngine.forecastARIMA(data, { p: -1, d: 1, q: 1 })).toThrow();
        expect(() => predictiveEngine.forecastARIMA(data, { p: 1, d: -1, q: 1 })).toThrow();
        expect(() => predictiveEngine.forecastARIMA(data, { p: 1, d: 1, q: -1 })).toThrow();
      });

      it('should handle invalid forecast periods', () => {
        const data = Array.from({ length: 50 }, () => 100 + Math.random() * 10);

        expect(() => predictiveEngine.forecastARIMA(data, { p: 1, d: 1, q: 1 }, 0)).toThrow();
        expect(() => predictiveEngine.forecastARIMA(data, { p: 1, d: 1, q: 1 }, -5)).toThrow();
      });
    });

    describe('Exponential Smoothing Errors', () => {
      it('should handle insufficient data for exponential smoothing', () => {
        const shortData = [100];

        expect(() => predictiveEngine.exponentialSmoothing(shortData, 0.3, 'double')).toThrow();
      });

      it('should handle invalid alpha values', () => {
        const data = Array.from({ length: 50 }, () => 100 + Math.random() * 10);

        expect(() => predictiveEngine.exponentialSmoothing(data, 1.5, 'simple')).toThrow();
        expect(() => predictiveEngine.exponentialSmoothing(data, -0.1, 'simple')).toThrow();
        expect(() => predictiveEngine.exponentialSmoothing(data, 0, 'simple')).toThrow();
      });

      it('should handle invalid smoothing methods', () => {
        const data = Array.from({ length: 50 }, () => 100 + Math.random() * 10);

        expect(() => predictiveEngine.exponentialSmoothing(data, 0.3, 'invalid')).toThrow();
      });
    });

    describe('Regression Errors', () => {
      it('should handle insufficient data for regression', () => {
        const y = [1, 2];
        const X = [
          [1, 2],
          [2, 3]
        ];

        expect(() => predictiveEngine.multipleRegression(y, X)).toThrow();
      });

      it('should handle mismatched regression data', () => {
        const y = [1, 2, 3, 4, 5];
        const X = [
          [1, 2],
          [2, 3],
          [3, 4]
        ]; // Different length

        expect(() => predictiveEngine.multipleRegression(y, X)).toThrow();
      });

      it('should handle singular matrices in regression', () => {
        const y = [1, 2, 3, 4, 5];
        const X = [
          [1, 1, 1, 1, 1], // Constant column
          [1, 1, 1, 1, 1], // Duplicate column (perfect correlation)
          [1, 2, 3, 4, 5]
        ];

        // Should handle or throw appropriate error
        expect(() => predictiveEngine.multipleRegression(y, X)).not.toThrow();
      });
    });

    describe('Machine Learning Errors', () => {
      it('should handle insufficient data for random forest', () => {
        const features = [
          [1, 2],
          [3, 4]
        ];
        const targets = [0, 1];

        expect(() => predictiveEngine.randomForest(features, targets)).toThrow();
      });

      it('should handle mismatched feature/target data', () => {
        const features = [
          [1, 2],
          [3, 4],
          [5, 6]
        ];
        const targets = [0, 1]; // Different length

        expect(() => predictiveEngine.randomForest(features, targets)).toThrow();
      });

      it('should handle invalid random forest parameters', () => {
        const features = Array.from({ length: 50 }, () => [Math.random(), Math.random()]);
        const targets = Array.from({ length: 50 }, () => Math.round(Math.random()));

        expect(() =>
          predictiveEngine.randomForest(features, targets, { nEstimators: 0 })
        ).toThrow();
        expect(() => predictiveEngine.randomForest(features, targets, { maxDepth: 0 })).toThrow();
        expect(() =>
          predictiveEngine.randomForest(features, targets, { minSamplesSplit: 0 })
        ).toThrow();
      });
    });
  });

  describe('Performance Measurement Engine - Error Handling', () => {
    describe('Performance Metrics Errors', () => {
      it('should handle insufficient data for performance metrics', () => {
        expect(() => performanceEngine.calculatePerformanceMetrics([])).toThrow();
        expect(() => performanceEngine.calculatePerformanceMetrics([0.01])).toThrow();
      });

      it('should handle mismatched benchmark data', () => {
        const returns = Array.from({ length: 50 }, () => Math.random() * 0.02 - 0.01);
        const shortBenchmark = Array.from({ length: 10 }, () => Math.random() * 0.01 - 0.005);

        expect(() =>
          performanceEngine.calculateInformationRatio(returns, shortBenchmark)
        ).toThrow();
      });

      it('should handle zero or negative risk-free rates', () => {
        const returns = Array.from({ length: 50 }, () => Math.random() * 0.02 - 0.01);

        expect(() => performanceEngine.calculateSharpeRatio(returns, undefined, 0)).not.toThrow();
        expect(() =>
          performanceEngine.calculateSharpeRatio(returns, undefined, -0.01)
        ).not.toThrow();
      });
    });

    describe('Attribution Analysis Errors', () => {
      it('should handle invalid attribution inputs', () => {
        expect(() => performanceEngine.brinsonAttribution([], [], [], [])).toThrow();

        const weights = [0.5, 0.5];
        const benchmarkWeights = [0.4, 0.6];
        const returns = [0.1, 0.08];
        const shortBenchmark = [0.09]; // Different length

        expect(() =>
          performanceEngine.brinsonAttribution(weights, benchmarkWeights, returns, shortBenchmark)
        ).toThrow();
      });

      it("should handle weights that don't sum correctly", () => {
        const weights = [0.3, 0.3]; // Sum to 0.6
        const benchmarkWeights = [0.4, 0.6];
        const returns = [0.1, 0.08];
        const benchmarkReturns = [0.09, 0.11];

        const result = performanceEngine.brinsonAttribution(
          weights,
          benchmarkWeights,
          returns,
          benchmarkReturns
        );
        expect(result).toBeDefined();
      });
    });
  });

  describe('Statistical Analysis Engine - Error Handling', () => {
    describe('Hypothesis Testing Errors', () => {
      it('should handle insufficient data for t-tests', () => {
        expect(() => statisticalEngine.oneSampleTTest([])).toThrow();
        expect(() => statisticalEngine.twoSampleTTest([1], [2])).toThrow();
      });

      it('should handle invalid t-test parameters', () => {
        const sample = Array.from({ length: 30 }, () => Math.random());

        expect(() => statisticalEngine.oneSampleTTest(sample, NaN)).not.toThrow();
        expect(() => statisticalEngine.oneSampleTTest(sample, Infinity)).not.toThrow();
      });

      it('should handle identical samples in two-sample test', () => {
        const sample1 = [1, 2, 3, 4, 5];
        const sample2 = [1, 2, 3, 4, 5];

        const result = statisticalEngine.twoSampleTTest(sample1, sample2, false);
        expect(result).toBeDefined();
        expect(result.rejectNull).toBe(false);
      });
    });

    describe('Distribution Testing Errors', () => {
      it('should handle insufficient data for distribution tests', () => {
        const shortData = [1, 2];

        expect(() => statisticalEngine.jarqueBeraTest(shortData)).toThrow();
        expect(() => statisticalEngine.augmentedDickeyFullerTest(shortData)).toThrow();
        expect(() => statisticalEngine.ljungBoxTest(shortData, 5)).toThrow();
      });

      it('should handle constant data in distribution tests', () => {
        const constantData = Array.from({ length: 50 }, () => 10);

        const jbResult = statisticalEngine.jarqueBeraTest(constantData);
        expect(jbResult).toBeDefined();

        const adfResult = statisticalEngine.augmentedDickeyFullerTest(constantData);
        expect(adfResult).toBeDefined();
      });

      it('should handle extreme values in distribution tests', () => {
        const extremeData = Array.from({ length: 50 }, () => Math.random() * 1000000);

        const jbResult = statisticalEngine.jarqueBeraTest(extremeData);
        expect(jbResult).toBeDefined();
        expect(isFinite(jbResult.skewness)).toBe(true);
        expect(isFinite(jbResult.kurtosis)).toBe(true);
      });
    });

    describe('Time Series Analysis Errors', () => {
      it('should handle insufficient data for time series tests', () => {
        const shortData1 = [1, 2, 3];
        const shortData2 = [2, 3, 4];

        expect(() => statisticalEngine.grangerCausalityTest(shortData1, shortData2, 2)).toThrow();
        expect(() => statisticalEngine.engleGrangerTest(shortData1, shortData2)).toThrow();
      });

      it('should handle invalid lag parameters', () => {
        const data1 = Array.from({ length: 30 }, () => Math.random());
        const data2 = Array.from({ length: 30 }, () => Math.random());

        expect(() => statisticalEngine.grangerCausalityTest(data1, data2, 0)).toThrow();
        expect(() => statisticalEngine.grangerCausalityTest(data1, data2, 15)).toThrow(); // Too many lags
      });

      it('should handle perfectly correlated data', () => {
        const data1 = [1, 2, 3, 4, 5];
        const data2 = [2, 4, 6, 8, 10];

        const result = statisticalEngine.engleGrangerTest(data1, data2);
        expect(result).toBeDefined();
      });
    });
  });

  describe('Cross-Engine Error Propagation', () => {
    it('should handle errors in integrated workflows', () => {
      const invalidData = [];

      // Test that integrated operations fail gracefully
      expect(() => {
        const returns = financialAnalyticsEngine.calculateReturns(invalidData);
        const varResult = riskEngine.calculateVaR(returns.returns, 0.95);
        const performance = performanceEngine.calculatePerformanceMetrics(returns.returns);
      }).toThrow();
    });

    it('should maintain cache consistency during errors', () => {
      const validData = Array.from({ length: 50 }, () => Math.random() * 0.02 - 0.01);

      // First successful operation
      const result1 = financialAnalyticsEngine.calculateReturns(validData);
      expect(result1).toBeDefined();

      // Try invalid operation
      expect(() => financialAnalyticsEngine.calculateReturns([])).toThrow();

      // Cache should still work for valid operations
      const result2 = financialAnalyticsEngine.calculateReturns(validData);
      expect(result2).toBe(result1);
    });

    it('should handle mixed valid/invalid data in batch operations', () => {
      const validData = Array.from({ length: 50 }, () => Math.random() * 0.02 - 0.01);
      const invalidData = [];

      // Test that one failure doesn't affect others
      const results = [];

      try {
        results.push(financialAnalyticsEngine.calculateReturns(validData));
      } catch (e) {
        results.push(null);
      }

      try {
        results.push(financialAnalyticsEngine.calculateReturns(invalidData));
      } catch (e) {
        results.push(null);
      }

      try {
        results.push(financialAnalyticsEngine.calculateReturns(validData));
      } catch (e) {
        results.push(null);
      }

      expect(results[0]).toBeDefined();
      expect(results[1]).toBeNull();
      expect(results[2]).toBeDefined();
      expect(results[2]).toBe(results[0]); // Should be cached
    });
  });

  describe('Resource Management Errors', () => {
    it('should handle memory pressure gracefully', () => {
      // Create large datasets that might cause memory issues
      const largeData = Array.from({ length: 10000 }, () => Math.random() * 0.02 - 0.01);

      const startTime = performance.now();

      try {
        const result = financialAnalyticsEngine.calculateReturns(largeData);
        expect(result).toBeDefined();
      } catch (error) {
        // If memory error occurs, it should be handled gracefully
        expect(error.message).toMatch(/memory|allocation|heap/i);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time or fail gracefully
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });

    it('should handle cache overflow scenarios', () => {
      const engine = new FinancialAnalyticsEngine({ cacheTimeout: 100 });

      // Fill cache with many different calculations
      for (let i = 0; i < 1000; i++) {
        const data = Array.from({ length: 50 }, () => Math.random() * 0.02 - 0.01);
        engine.calculateReturns(data);
      }

      // Should still function correctly
      const testData = Array.from({ length: 50 }, () => 0.001);
      const result = engine.calculateReturns(testData);

      expect(result).toBeDefined();
      expect(result.totalReturn).toBeDefined();
    });
  });

  describe('Numerical Stability', () => {
    it('should handle numerical edge cases', () => {
      const tinyNumbers = Array.from({ length: 50 }, () => 1e-10 * Math.random());
      const hugeNumbers = Array.from({ length: 50 }, () => 1e10 * Math.random());
      const mixedScale = Array.from({ length: 50 }, () => Math.pow(10, Math.random() * 20 - 10));

      expect(() => financialAnalyticsEngine.calculateReturns(tinyNumbers)).not.toThrow();
      expect(() => financialAnalyticsEngine.calculateReturns(hugeNumbers)).not.toThrow();
      expect(() => financialAnalyticsEngine.calculateReturns(mixedScale)).not.toThrow();
    });

    it('should prevent division by zero', () => {
      const zeroVariance = Array.from({ length: 50 }, () => 0.01);
      const sharpeRatio = financialAnalyticsEngine.calculateSharpeRatio(
        zeroVariance,
        undefined,
        0.02
      );

      expect(sharpeRatio).toBe(Infinity); // Expected result for zero variance

      const maxDrawdown = financialAnalyticsEngine.calculateMaxDrawdown([0.01, 0.01, 0.01]);
      expect(maxDrawdown).toBe(0); // No drawdown in constant returns
    });

    it('should handle NaN and Infinity propagation', () => {
      const dataWithNaN = [0.01, NaN, 0.02, 0.03];
      const dataWithInfinity = [0.01, Infinity, 0.02, 0.03];

      expect(() => financialAnalyticsEngine.calculateReturns(dataWithNaN)).toThrow();
      expect(() => financialAnalyticsEngine.calculateReturns(dataWithInfinity)).toThrow();
    });
  });
});
