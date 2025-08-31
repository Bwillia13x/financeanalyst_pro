import { describe, it, expect, beforeEach, afterEach, jest } from 'vitest';
import {
  financialAnalyticsEngine,
  RiskAssessmentEngine,
  PredictiveModelingEngine,
  PerformanceMeasurementEngine,
  StatisticalAnalysisEngine
} from '../../services/analytics';

describe('Analytics Engines Performance Tests', () => {
  let riskEngine;
  let predictiveEngine;
  let performanceEngine;
  let statisticalEngine;

  beforeEach(() => {
    riskEngine = new RiskAssessmentEngine({ cacheTimeout: 5000 });
    predictiveEngine = new PredictiveModelingEngine({ cacheTimeout: 5000 });
    performanceEngine = new PerformanceMeasurementEngine({ cacheTimeout: 5000 });
    statisticalEngine = new StatisticalAnalysisEngine({ cacheTimeout: 5000 });

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

  describe('Large Dataset Performance', () => {
    it('should handle large return series efficiently', () => {
      const largeReturns = Array.from({ length: 5000 }, () => Math.random() * 0.02 - 0.01);

      const startTime = performance.now();

      const result = financialAnalyticsEngine.calculateReturns(largeReturns);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result).toBeDefined();
      expect(result.annualizedReturn).toBeDefined();
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle large portfolio analysis', () => {
      const largePortfolio = Array.from({ length: 20 }, (_, i) => ({
        symbol: `ASSET${i}`,
        weight: 1 / 20,
        volatility: 0.2 + Math.random() * 0.3,
        returns: Array.from({ length: 1000 }, () => Math.random() * 0.02 - 0.01)
      }));

      const startTime = performance.now();

      const result = financialAnalyticsEngine.analyzePortfolio(
        largePortfolio,
        largePortfolio.map(a => a.weight)
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result).toBeDefined();
      expect(result.portfolioReturns).toHaveLength(1000);
      expect(duration).toBeLessThan(500); // Should complete in under 500ms
    });

    it('should handle large VaR calculations', () => {
      const largeReturns = Array.from({ length: 10000 }, () => Math.random() * 0.02 - 0.01);

      const startTime = performance.now();

      const result = riskEngine.calculateVaR(largeReturns, 0.95, 'historical');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result).toBeDefined();
      expect(result.var95).toBeDefined();
      expect(duration).toBeLessThan(200); // Should complete in under 200ms
    });

    it('should handle large forecasting models', () => {
      const largeTimeSeries = Array.from(
        { length: 2000 },
        (_, i) => 100 + i * 0.01 + Math.sin(i * 0.01) * 10
      );

      const startTime = performance.now();

      const result = predictiveEngine.forecastARIMA(largeTimeSeries, { p: 1, d: 1, q: 1 }, 24);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result).toBeDefined();
      expect(result.forecasts).toHaveLength(24);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe('Memory Usage Tests', () => {
    it('should maintain reasonable memory usage with large datasets', () => {
      const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

      // Create large dataset
      const largeData = Array.from({ length: 10000 }, () => ({
        returns: Array.from({ length: 500 }, () => Math.random() * 0.02 - 0.01),
        weight: Math.random()
      }));

      // Run multiple analyses
      largeData.forEach(data => {
        financialAnalyticsEngine.calculateReturns(data.returns);
      });

      const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
      }
    });

    it('should clear cache effectively', () => {
      const cacheKey = 'test_cache_key';

      // Fill cache with large dataset
      for (let i = 0; i < 100; i++) {
        const largeData = Array.from({ length: 1000 }, () => Math.random());
        financialAnalyticsEngine.calculateReturns(largeData);
      }

      // Clear cache
      financialAnalyticsEngine.clearCache();

      // Verify cache is cleared
      const cached = financialAnalyticsEngine.getCache(cacheKey);
      expect(cached).toBeNull();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous analyses', async () => {
      const promises = [];
      const numConcurrent = 10;

      for (let i = 0; i < numConcurrent; i++) {
        const returns = Array.from({ length: 500 }, () => Math.random() * 0.02 - 0.01);

        promises.push(
          Promise.resolve().then(() => financialAnalyticsEngine.calculateReturns(returns))
        );
      }

      const startTime = performance.now();

      const results = await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(numConcurrent);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.annualizedReturn).toBeDefined();
      });

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle mixed engine operations concurrently', async () => {
      const operations = [];

      // Financial analysis
      operations.push(
        Promise.resolve().then(() => {
          const returns = Array.from({ length: 500 }, () => Math.random() * 0.02 - 0.01);
          return financialAnalyticsEngine.calculateReturns(returns);
        })
      );

      // Risk analysis
      operations.push(
        Promise.resolve().then(() => {
          const returns = Array.from({ length: 500 }, () => Math.random() * 0.02 - 0.01);
          return riskEngine.calculateVaR(returns, 0.95);
        })
      );

      // Performance analysis
      operations.push(
        Promise.resolve().then(() => {
          const returns = Array.from({ length: 500 }, () => Math.random() * 0.02 - 0.01);
          return performanceEngine.calculatePerformanceMetrics(returns);
        })
      );

      // Statistical analysis
      operations.push(
        Promise.resolve().then(() => {
          const data = Array.from({ length: 500 }, () => Math.random() * 10);
          return statisticalEngine.jarqueBeraTest(data);
        })
      );

      const startTime = performance.now();

      const results = await Promise.all(operations);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toBeDefined();
      });

      expect(duration).toBeLessThan(1500); // Should complete in under 1.5 seconds
    });
  });

  describe('Stress Testing Performance', () => {
    it('should handle multiple stress tests efficiently', () => {
      const assets = Array.from({ length: 10 }, (_, i) => ({
        symbol: `ASSET${i}`,
        weight: 0.1,
        returns: Array.from({ length: 500 }, () => Math.random() * 0.02 - 0.01)
      }));

      const scenarios = [
        riskEngine.stressTestScenarios['2008-crisis'],
        riskEngine.stressTestScenarios['2020-covid'],
        riskEngine.stressTestScenarios['tech-bubble'],
        riskEngine.stressTestScenarios['rate-hike'],
        riskEngine.stressTestScenarios['trade-war']
      ];

      const startTime = performance.now();

      const results = scenarios.map(scenario =>
        riskEngine.runStressTest(
          assets,
          assets.map(a => a.weight),
          scenario
        )
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(scenarios.length);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.impact).toBeDefined();
      });

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle large scenario analysis', () => {
      const assets = Array.from({ length: 15 }, (_, i) => ({
        symbol: `ASSET${i}`,
        weight: 1 / 15,
        returns: Array.from({ length: 1000 }, () => Math.random() * 0.02 - 0.01)
      }));

      const scenarios = Array.from({ length: 10 }, (_, i) => ({
        name: `Scenario${i}`,
        description: `Test scenario ${i}`,
        shocks: {
          equities: -0.1 - i * 0.05,
          bonds: 0.02 + i * 0.01
        },
        probability: 0.1
      }));

      const startTime = performance.now();

      const result = riskEngine.runScenarioAnalysis(
        assets,
        assets.map(a => a.weight),
        scenarios
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result).toBeDefined();
      expect(result.scenarios).toHaveLength(10);
      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
    });
  });

  describe('Forecasting Performance', () => {
    it('should handle complex forecasting models', () => {
      const timeSeries = Array.from(
        { length: 1000 },
        (_, i) => 100 + i * 0.05 + Math.sin(i * 0.01) * 20
      );

      const startTime = performance.now();

      const results = [
        predictiveEngine.forecastARIMA(timeSeries, { p: 1, d: 1, q: 1 }, 12),
        predictiveEngine.forecastARIMA(timeSeries, { p: 2, d: 1, q: 2 }, 12),
        predictiveEngine.exponentialSmoothing(timeSeries, 0.3, 'double', 12),
        predictiveEngine.exponentialSmoothing(timeSeries, 0.2, 'triple', 12)
      ];

      const endTime = performance.now();
      const duration = endTime - startTime;

      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.forecasts).toHaveLength(12);
      });

      expect(duration).toBeLessThan(3000); // Should complete in under 3 seconds
    });

    it('should handle machine learning model training', () => {
      const features = Array.from({ length: 500 }, (_, i) => [
        Math.random(),
        Math.sin(i * 0.1),
        Math.cos(i * 0.1),
        Math.random() * 2 - 1
      ]);

      const targets = features.map(row => (row[0] > 0 ? 1 : 0));

      const startTime = performance.now();

      const result = predictiveEngine.randomForest(features, targets, {
        nEstimators: 10,
        maxDepth: 8
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result).toBeDefined();
      expect(result.predictions).toHaveLength(targets.length);
      expect(result.featureImportance).toHaveLength(features[0].length);
      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
    });
  });

  describe('Statistical Analysis Performance', () => {
    it('should handle large statistical tests', () => {
      const largeData = Array.from({ length: 5000 }, () => Math.random() * 10 + 5);

      const startTime = performance.now();

      const results = [
        statisticalEngine.jarqueBeraTest(largeData),
        statisticalEngine.augmentedDickeyFullerTest(largeData.slice(0, 1000)),
        statisticalEngine.ljungBoxTest(largeData.slice(0, 1000), 20)
      ];

      const endTime = performance.now();
      const duration = endTime - startTime;

      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.pValue).toBeDefined();
      });

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle multiple hypothesis tests', () => {
      const datasets = Array.from({ length: 20 }, () =>
        Array.from({ length: 100 }, () => Math.random() * 10)
      );

      const startTime = performance.now();

      const results = datasets.map(data => statisticalEngine.oneSampleTTest(data, 5));

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(20);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.pValue).toBeDefined();
      });

      expect(duration).toBeLessThan(500); // Should complete in under 500ms
    });

    it('should handle correlation and regression analysis', () => {
      const y = Array.from({ length: 1000 }, () => Math.random() * 20);
      const X = [
        new Array(1000).fill(1),
        Array.from({ length: 1000 }, () => Math.random() * 10),
        Array.from({ length: 1000 }, () => Math.random() * 5),
        Array.from({ length: 1000 }, () => Math.random() * 8)
      ];

      const startTime = performance.now();

      const regressionResult = predictiveEngine.multipleRegression(y, X);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(regressionResult).toBeDefined();
      expect(regressionResult.coefficients).toHaveLength(4);
      expect(regressionResult.statistics.rSquared).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe('Cache Performance', () => {
    it('should improve performance with caching', () => {
      const returns = Array.from({ length: 1000 }, () => Math.random() * 0.02 - 0.01);

      // First run (should compute)
      const startTime1 = performance.now();
      const result1 = financialAnalyticsEngine.calculateReturns(returns);
      const endTime1 = performance.now();
      const duration1 = endTime1 - startTime1;

      // Second run (should use cache)
      const startTime2 = performance.now();
      const result2 = financialAnalyticsEngine.calculateReturns(returns);
      const endTime2 = performance.now();
      const duration2 = endTime2 - startTime2;

      expect(result1).toEqual(result2);
      expect(duration2).toBeLessThan(duration1); // Cached result should be faster
      expect(duration2).toBeLessThan(10); // Cached result should be very fast
    });

    it('should handle cache expiration correctly', async () => {
      const shortLivedEngine = new RiskAssessmentEngine({ cacheTimeout: 100 });
      const returns = Array.from({ length: 500 }, () => Math.random() * 0.02 - 0.01);

      // Fill cache
      shortLivedEngine.calculateVaR(returns, 0.95);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      const startTime = performance.now();
      const result = shortLivedEngine.calculateVaR(returns, 0.95);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeGreaterThan(10); // Should take longer due to recomputation
    });
  });

  describe('Scalability Tests', () => {
    it('should scale with increasing data size', () => {
      const sizes = [100, 500, 1000, 2000];
      const durations = [];

      sizes.forEach(size => {
        const returns = Array.from({ length: size }, () => Math.random() * 0.02 - 0.01);

        const startTime = performance.now();
        financialAnalyticsEngine.calculateReturns(returns);
        const endTime = performance.now();

        durations.push(endTime - startTime);
      });

      // Performance should scale reasonably (not exponentially)
      const ratio1 = durations[1] / durations[0]; // 500/100
      const ratio2 = durations[2] / durations[1]; // 1000/500
      const ratio3 = durations[3] / durations[2]; // 2000/1000

      expect(ratio1).toBeLessThan(10); // Should not be too disproportionate
      expect(ratio2).toBeLessThan(5);
      expect(ratio3).toBeLessThan(3);
    });

    it('should handle portfolio size scaling', () => {
      const portfolioSizes = [5, 10, 15, 20];
      const durations = [];

      portfolioSizes.forEach(size => {
        const assets = Array.from({ length: size }, (_, i) => ({
          symbol: `ASSET${i}`,
          weight: 1 / size,
          returns: Array.from({ length: 500 }, () => Math.random() * 0.02 - 0.01)
        }));

        const startTime = performance.now();
        financialAnalyticsEngine.analyzePortfolio(
          assets,
          assets.map(a => a.weight)
        );
        const endTime = performance.now();

        durations.push(endTime - startTime);
      });

      // Verify scaling is reasonable
      expect(durations[0]).toBeLessThan(durations[3]);
      expect(durations[3] / durations[0]).toBeLessThan(20); // Should not scale too poorly
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not accumulate memory with repeated operations', async () => {
      const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

      // Run many operations
      for (let i = 0; i < 100; i++) {
        const returns = Array.from({ length: 100 }, () => Math.random() * 0.02 - 0.01);
        financialAnalyticsEngine.calculateReturns(returns);

        // Force garbage collection hint
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // Less than 20MB increase
      }
    });
  });
});
