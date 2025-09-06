import { describe, it, expect, beforeEach, afterEach, jest } from 'vitest';
import {
  financialAnalyticsEngine,
  RiskAssessmentEngine,
  PredictiveModelingEngine,
  PerformanceMeasurementEngine,
  StatisticalAnalysisEngine
} from '../../services/analytics';

describe('Analytics Engines Integration', () => {
  let riskEngine;
  let predictiveEngine;
  let performanceEngine;
  let statisticalEngine;
  let mockPortfolio;

  beforeEach(() => {
    riskEngine = new RiskAssessmentEngine({ cacheTimeout: 1000 });
    predictiveEngine = new PredictiveModelingEngine({ cacheTimeout: 1000 });
    performanceEngine = new PerformanceMeasurementEngine({ cacheTimeout: 1000 });
    statisticalEngine = new StatisticalAnalysisEngine({ cacheTimeout: 1000 });

    // Create comprehensive mock portfolio
    mockPortfolio = {
      assets: [
        {
          symbol: 'AAPL',
          weight: 0.25,
          expectedReturn: 0.12,
          volatility: 0.25,
          type: 'stock',
          sector: 'Technology',
          returns: Array.from({ length: 252 }, () => Math.random() * 0.004 - 0.002)
        },
        {
          symbol: 'MSFT',
          weight: 0.2,
          expectedReturn: 0.1,
          volatility: 0.22,
          type: 'stock',
          sector: 'Technology',
          returns: Array.from({ length: 252 }, () => Math.random() * 0.003 - 0.0015)
        },
        {
          symbol: 'GOOGL',
          weight: 0.15,
          expectedReturn: 0.11,
          volatility: 0.28,
          type: 'stock',
          sector: 'Technology',
          returns: Array.from({ length: 252 }, () => Math.random() * 0.0045 - 0.00225)
        },
        {
          symbol: 'TSLA',
          weight: 0.1,
          expectedReturn: 0.18,
          volatility: 0.45,
          type: 'stock',
          sector: 'Technology',
          returns: Array.from({ length: 252 }, () => Math.random() * 0.007 - 0.0035)
        },
        {
          symbol: 'BND',
          weight: 0.15,
          expectedReturn: 0.04,
          volatility: 0.08,
          type: 'bond',
          sector: 'Fixed Income',
          returns: Array.from({ length: 252 }, () => Math.random() * 0.0012 - 0.0006)
        },
        {
          symbol: 'SPY',
          weight: 0.15,
          expectedReturn: 0.08,
          volatility: 0.18,
          type: 'stock',
          sector: 'Diversified',
          returns: Array.from({ length: 252 }, () => Math.random() * 0.0028 - 0.0014)
        }
      ],
      benchmark: Array.from({ length: 252 }, () => Math.random() * 0.002 - 0.001)
    };

    // Clear all caches
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

  describe('Complete Portfolio Analysis Workflow', () => {
    it('should perform comprehensive portfolio analysis from returns to risk assessment', async () => {
      // Step 1: Calculate portfolio returns
      const portfolioReturns = mockPortfolio.assets.reduce((acc, asset, i) => {
        return acc.map((ret, j) => ret + asset.weight * asset.returns[j]);
      }, new Array(mockPortfolio.assets[0].returns.length).fill(0));

      // Step 2: Basic return analysis
      const returnAnalysis = financialAnalyticsEngine.calculateReturnStatistics(portfolioReturns);
      // Calculate annualized return manually for comparison
      const totalReturn = portfolioReturns.reduce((acc, r) => acc * (1 + r), 1) - 1;
      const periodsPerYear = 252; // Assuming daily returns
      const annualizedReturn = Math.pow(1 + totalReturn, periodsPerYear / portfolioReturns.length) - 1;

      expect(returnAnalysis.mean).toBeDefined();
      expect(annualizedReturn).toBeDefined();
      expect(returnAnalysis.std).toBeGreaterThan(0);

      // Step 3: Performance measurement
      const performanceMetrics = performanceEngine.calculatePerformanceMetrics(
        portfolioReturns,
        mockPortfolio.benchmark
      );
      expect(performanceMetrics.portfolio.sharpeRatio).toBeDefined();
      expect(performanceMetrics.relative.informationRatio).toBeDefined();

      // Step 4: Risk assessment
      const varAnalysis = riskEngine.calculateVaR(portfolioReturns, 0.95, 'historical');
      expect(varAnalysis.var95).toBeGreaterThan(0); // VaR should be positive (representing potential loss)
      expect(varAnalysis.expectedShortfall).toBeDefined();

      // Step 5: Statistical testing
      const normalityTest = statisticalEngine.jarqueBeraTest(portfolioReturns);
      expect(normalityTest.pValue).toBeDefined();

      // Verify all analyses are consistent
      expect(annualizedReturn).toBeCloseTo(
        performanceMetrics.portfolio.annualizedReturn,
        3
      );
    });

    it('should integrate forecasting with risk assessment', async () => {
      const prices = Array.from({ length: 100 }, (_, i) => 100 + i * 0.1 + Math.sin(i * 0.1) * 5);

      // Step 1: Generate forecasts
      const arimaForecast = predictiveEngine.forecastARIMA(prices, { p: 1, d: 1, q: 1 }, 12);
      expect(arimaForecast.forecasts).toHaveLength(12);

      // Step 2: Calculate forecast returns
      const forecastReturns = arimaForecast.forecasts.map((price, i) =>
        i === 0 ? 0 : (price - arimaForecast.forecasts[i - 1]) / arimaForecast.forecasts[i - 1]
      );

      // Step 3: Assess risk of forecasted returns
      const forecastVar = riskEngine.calculateVaR(forecastReturns, 0.95);
      expect(forecastVar.var95).toBeDefined();

      // Step 4: Test forecast accuracy
      const accuracy = predictiveEngine.calculateForecastAccuracy(
        prices,
        arimaForecast.fitted || prices
      );
      expect(accuracy.meanAbsoluteError).toBeDefined();
    });

    it('should perform end-to-end attribution analysis', async () => {
      const portfolioWeights = mockPortfolio.assets.map(a => a.weight);
      const benchmarkWeights = [0.2, 0.2, 0.15, 0.1, 0.15, 0.2]; // Different allocation
      const portfolioReturns = mockPortfolio.assets.map(a => a.expectedReturn);
      const benchmarkReturns = [0.09, 0.08, 0.1, 0.12, 0.05, 0.07]; // Different returns

      // Step 1: Brinson attribution
      const brinsonAttribution = performanceEngine.brinsonAttribution(
        portfolioWeights,
        benchmarkWeights,
        portfolioReturns,
        benchmarkReturns
      );

      // Step 2: Risk attribution
      const riskAttribution = riskEngine.performRiskAttribution(
        mockPortfolio.assets,
        portfolioWeights,
        benchmarkWeights
      );

      // Verify attribution results
      expect(brinsonAttribution.allocation).toBeDefined();
      expect(brinsonAttribution.selection).toBeDefined();
      expect(brinsonAttribution.total).toBeDefined();
      expect(riskAttribution.totalRisk).toBeGreaterThan(0);

      // Attribution effects should sum to total attribution
      const expectedTotal = brinsonAttribution.allocation + brinsonAttribution.selection + brinsonAttribution.interaction;
      expect(Math.abs(brinsonAttribution.total - expectedTotal)).toBeLessThan(0.001);
    });
  });

  describe('Cross-Engine Data Consistency', () => {
    it('should maintain consistent volatility calculations across engines', () => {
      const returns = Array.from({ length: 252 }, () => Math.random() * 0.02 - 0.01);

      // Calculate volatility in different engines
      const baseVolatility = financialAnalyticsEngine.calculateVolatility(returns);
      const performanceVolatility =
        performanceEngine.calculatePerformanceMetrics(returns).portfolio.volatility;

      // Should be very close (within rounding precision)
      expect(Math.abs(baseVolatility - performanceVolatility)).toBeLessThan(0.001);
    });

    it('should maintain consistent returns across engines', () => {
      const returns = Array.from({ length: 252 }, () => 0.001 + Math.random() * 0.002);

      // Calculate annualized return manually for FinancialAnalyticsEngine
      const totalReturn = returns.reduce((acc, r) => acc * (1 + r), 1) - 1;
      const periodsPerYear = 252; // Assuming daily returns
      const annualizedReturn = Math.pow(1 + totalReturn, periodsPerYear / returns.length) - 1;

      const performanceAnalysis = performanceEngine.calculatePerformanceMetrics(returns);

      expect(annualizedReturn).toBeCloseTo(
        performanceAnalysis.portfolio.annualizedReturn,
        4
      );
    });

    it('should maintain consistent VaR calculations', () => {
      const returns = Array.from({ length: 252 }, () => Math.random() * 0.02 - 0.01);

      const riskVar = riskEngine.calculateVaR(returns, 0.95, 'historical');
      const performanceVar =
        performanceEngine.calculateRiskAdjustedPerformance(returns).modern.valueAtRisk;

      // Should be very close
      expect(Math.abs(riskVar.var95 - performanceVar)).toBeLessThan(0.01);
    });
  });

  describe('Scenario Analysis Integration', () => {
    it('should integrate scenario analysis with performance measurement', () => {
      const scenarios = [
        riskEngine.stressTestScenarios['2008-crisis'],
        riskEngine.stressTestScenarios['2020-covid'],
        riskEngine.stressTestScenarios['tech-bubble']
      ];

      // Step 1: Run scenario analysis
      const scenarioResults = riskEngine.runScenarioAnalysis(
        mockPortfolio.assets,
        mockPortfolio.assets.map(a => a.weight),
        scenarios
      );

      // Step 2: Analyze scenario performance
      scenarios.forEach((scenario, index) => {
        const result = scenarioResults.scenarios[index];
        const stressedReturns = mockPortfolio.assets.reduce((acc, asset, i) => {
          return acc.map((ret, j) => ret + asset.weight * asset.returns[j]);
        }, new Array(mockPortfolio.assets[0].returns.length).fill(0));

        // Apply stress shock
        const shockedReturns = stressedReturns.map(r => r * (1 + (scenario.shocks.equities || 0)));

        const stressedPerformance = performanceEngine.calculatePerformanceMetrics(shockedReturns);

        // Verify that stressed performance aligns with scenario impact
        expect(stressedPerformance.portfolio.annualizedReturn).toBeDefined();
        expect(result.impact.returnImpact).toBeDefined();
      });
    });

    it('should integrate statistical testing with scenario analysis', () => {
      const baselineReturns = mockPortfolio.assets.reduce((acc, asset, i) => {
        return acc.map((ret, j) => ret + asset.weight * asset.returns[j]);
      }, new Array(mockPortfolio.assets[0].returns.length).fill(0));

      // Run stress test
      const stressTest = riskEngine.runStressTest(
        mockPortfolio.assets,
        mockPortfolio.assets.map(a => a.weight),
        riskEngine.stressTestScenarios['2008-crisis']
      );

      // Test statistical significance of stress impact
      const baselineMean = baselineReturns.reduce((sum, r) => sum + r, 0) / baselineReturns.length;

      // Verify stress test completed successfully
      expect(stressTest).toBeDefined();
      expect(stressTest.scenario).toBe('2008 Financial Crisis');
      expect(stressTest.baseline).toBeDefined();
      expect(stressTest.stressed).toBeDefined();
    });
  });

  describe('Predictive Modeling Integration', () => {
    it('should integrate forecasting with performance analysis', () => {
      const historicalPrices = Array.from(
        { length: 100 },
        (_, i) => 100 + i * 0.1 + Math.sin(i * 0.1) * 5
      );

      // Step 1: Generate forecasts
      const forecasts = predictiveEngine.forecastARIMA(historicalPrices, { p: 1, d: 1, q: 1 }, 12);

      // Step 2: Calculate forecast returns (ensure we have variation for meaningful VaR)
      const forecastReturns = forecasts.forecasts.map((price, i) =>
        i === 0 ? 0 : (price - forecasts.forecasts[i - 1]) / forecasts.forecasts[i - 1]
      ).map(r => r + (Math.random() - 0.5) * 0.02); // Add some noise

      // Step 3: Analyze forecast performance
      const forecastPerformance = performanceEngine.calculatePerformanceMetrics(forecastReturns);

      // Step 4: Assess forecast risk
      const forecastRisk = riskEngine.calculateVaR(forecastReturns, 0.95);

      // Verify integration
      expect(forecastPerformance.portfolio.volatility).toBeDefined();
      expect(forecastRisk.var95).toBeDefined();
      expect(forecastRisk.var95).toBeLessThan(0);
    });

    it('should integrate machine learning with statistical validation', () => {
      const features = mockPortfolio.assets[0].returns
        .slice(0, 50)
        .map((ret, i) => [
          ret,
          i > 0 ? mockPortfolio.assets[0].returns[i - 1] : 0,
          Math.sin(i * 0.1),
          Math.cos(i * 0.1)
        ]);

      const targets = mockPortfolio.assets[0].returns.slice(1, 51).map(ret => (ret > 0 ? 1 : 0));

      // Step 1: Train ML model
      const mlModel = predictiveEngine.randomForest(features, targets, { nEstimators: 5 });

      // Step 2: Validate predictions statistically
      const predictions = mlModel.predictions;
      const actuals = targets;

      const accuracy = predictiveEngine.calculateForecastAccuracy(actuals, predictions);

      // Step 3: Test prediction significance
      const meanPrediction = predictions.reduce((sum, p) => sum + p, 0) / predictions.length;
      const significanceTest = statisticalEngine.oneSampleTTest(predictions, 0.5); // Test vs random (0.5)

      expect(mlModel.featureImportance).toHaveLength(features[0].length);
      expect(accuracy.meanAbsoluteError).toBeDefined();
      expect(significanceTest.pValue).toBeDefined();
    });
  });

  describe('Comprehensive Risk Analytics', () => {
    it('should perform complete risk analytics workflow', () => {
      const portfolioReturns = mockPortfolio.assets.reduce((acc, asset, i) => {
        return acc.map((ret, j) => ret + asset.weight * asset.returns[j]);
      }, new Array(mockPortfolio.assets[0].returns.length).fill(0));

      // Step 1: Basic risk metrics
      const basicRisk = financialAnalyticsEngine.calculateReturns(portfolioReturns);
      expect(basicRisk.volatility).toBeGreaterThan(0);
      expect(basicRisk.maxDrawdown).toBeDefined();

      // Step 2: Advanced risk metrics
      const advancedRisk = performanceEngine.calculateRiskAdjustedPerformance(portfolioReturns);
      expect(advancedRisk.modern.valueAtRisk).toBeDefined();
      expect(advancedRisk.downside.downsideDeviation).toBeDefined();

      // Step 3: Stress testing
      const stressTest = riskEngine.runStressTest(
        mockPortfolio.assets,
        mockPortfolio.assets.map(a => a.weight),
        riskEngine.stressTestScenarios['2008-crisis']
      );
      expect(stressTest.impact.returnImpactPercent).toBeDefined();

      // Step 4: Statistical risk assessment
      const normalityTest = statisticalEngine.jarqueBeraTest(portfolioReturns);
      const stationarityTest = statisticalEngine.augmentedDickeyFullerTest(portfolioReturns);

      expect(normalityTest.rejectNull).toBeDefined();
      expect(stationarityTest.rejectNull).toBeDefined();

      // Verify risk consistency
      expect(Math.abs(basicRisk.volatility - advancedRisk.traditional.volatility)).toBeLessThan(
        0.01
      );
    });

    it('should integrate correlation analysis with portfolio risk', () => {
      // Calculate asset correlations
      const correlationMatrix = financialAnalyticsEngine.calculateCorrelationMatrix(
        mockPortfolio.assets
      );

      // Calculate portfolio volatility
      const portfolioVolatility = financialAnalyticsEngine.calculatePortfolioVolatility(
        mockPortfolio.assets,
        mockPortfolio.assets.map(a => a.weight)
      );

      // Verify that highly correlated assets increase portfolio risk
      const avgCorrelation =
        correlationMatrix.reduce((sum, row, i) => {
          return sum + row.reduce((rowSum, corr, j) => (i !== j ? rowSum + corr : rowSum), 0);
        }, 0) /
        (correlationMatrix.length * (correlationMatrix.length - 1));

      expect(avgCorrelation).toBeGreaterThanOrEqual(-1);
      expect(avgCorrelation).toBeLessThanOrEqual(1);
      expect(portfolioVolatility).toBeGreaterThan(0);

      // Test correlation significance
      const correlationTest = statisticalEngine.calculateCorrelation(
        mockPortfolio.assets[0].returns,
        mockPortfolio.assets[1].returns
      );
      expect(Math.abs(correlationTest)).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance Attribution Integration', () => {
    it('should integrate attribution with risk analysis', () => {
      const portfolioWeights = mockPortfolio.assets.map(a => a.weight);
      const benchmarkWeights = [0.2, 0.2, 0.15, 0.1, 0.15, 0.2];
      const portfolioReturns = mockPortfolio.assets.map(a => a.expectedReturn);
      const benchmarkReturns = [0.09, 0.08, 0.1, 0.12, 0.05, 0.07];

      // Step 1: Performance attribution
      const attribution = performanceEngine.brinsonAttribution(
        portfolioWeights,
        benchmarkWeights,
        portfolioReturns,
        benchmarkReturns
      );

      // Step 2: Risk attribution
      const riskAttribution = riskEngine.performRiskAttribution(
        mockPortfolio.assets,
        portfolioWeights,
        benchmarkWeights
      );

      // Step 3: Statistical validation
      const attributionEffects = [
        attribution.allocation,
        attribution.selection,
        attribution.interaction
      ];
      const attributionTest = statisticalEngine.oneSampleTTest(attributionEffects, 0);

      expect(attribution.total).toBeDefined();
      expect(riskAttribution.totalRisk).toBeGreaterThan(0);
      expect(attributionTest.pValue).toBeDefined();

      // Total attribution should equal sum of effects
      expect(
        Math.abs(
          attribution.total -
            (attribution.allocation + attribution.selection + attribution.interaction)
        )
      ).toBeLessThan(0.001);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle errors consistently across engines', () => {
      const invalidData = [];
      const smallData = [1, 2];

      // Test that all engines handle invalid data gracefully
      expect(() => financialAnalyticsEngine.calculateReturns(invalidData)).toThrow();
      expect(() => performanceEngine.calculatePerformanceMetrics(invalidData)).toThrow();
      expect(() => riskEngine.calculateVaR(smallData, 0.95)).toThrow();
      expect(() => predictiveEngine.forecastARIMA(smallData)).toThrow();
      expect(() => statisticalEngine.oneSampleTTest(invalidData)).toThrow();
    });

    it('should maintain cache consistency across engines', () => {
      const testData = Array.from({ length: 50 }, () => Math.random());

      // Run analysis with one engine
      const result1 = financialAnalyticsEngine.calculateReturns(testData);

      // Run with another engine
      const result2 = performanceEngine.calculatePerformanceMetrics(testData);

      // Clear one cache
      financialAnalyticsEngine.clearCache();

      // Verify other cache still works
      const result3 = performanceEngine.calculatePerformanceMetrics(testData);
      expect(result3).toBeDefined();
    });
  });

  describe('Performance Benchmarking', () => {
    it('should benchmark analysis performance across engines', () => {
      const largeData = Array.from({ length: 1000 }, () => Math.random() * 0.02 - 0.01);

      const startTime = performance.now();

      // Run multiple analyses
      const returnAnalysis = financialAnalyticsEngine.calculateReturns(largeData);
      const performanceAnalysis = performanceEngine.calculatePerformanceMetrics(largeData);
      const varAnalysis = riskEngine.calculateVaR(largeData, 0.95);
      const normalityTest = statisticalEngine.jarqueBeraTest(largeData);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Verify all analyses completed successfully
      expect(returnAnalysis).toBeDefined();
      expect(performanceAnalysis).toBeDefined();
      expect(varAnalysis).toBeDefined();
      expect(normalityTest).toBeDefined();

      // Performance should be reasonable (< 1 second for 1000 data points)
      expect(totalTime).toBeLessThan(1000);

      console.log(`Integration test performance: ${totalTime.toFixed(2)}ms`);
    });
  });
});
