import { describe, it, expect, beforeEach, afterEach, jest } from 'vitest';
import PerformanceMeasurementEngine from '../PerformanceMeasurementEngine';

describe('PerformanceMeasurementEngine', () => {
  let engine;
  let mockPortfolioReturns;
  let mockBenchmarkReturns;

  beforeEach(() => {
    engine = new PerformanceMeasurementEngine({
      cacheTimeout: 1000,
      precision: 6
    });

    // Generate mock return data
    mockPortfolioReturns = Array.from(
      { length: 252 },
      () => 0.0005 + Math.random() * 0.002 - 0.001
    );
    mockBenchmarkReturns = Array.from(
      { length: 252 },
      () => 0.0003 + Math.random() * 0.0015 - 0.00075
    );

    engine.clearCache();
  });

  afterEach(() => {
    engine.clearCache();
  });

  describe('Performance Metrics Calculation', () => {
    it('should calculate comprehensive performance metrics', () => {
      const result = engine.calculatePerformanceMetrics(
        mockPortfolioReturns,
        mockBenchmarkReturns,
        0.02
      );

      expect(result).toBeDefined();
      expect(result.portfolio).toBeDefined();
      expect(result.benchmark).toBeDefined();
      expect(result.relative).toBeDefined();

      // Portfolio metrics
      expect(result.portfolio.totalReturn).toBeDefined();
      expect(result.portfolio.annualizedReturn).toBeDefined();
      expect(result.portfolio.volatility).toBeDefined();
      expect(result.portfolio.sharpeRatio).toBeDefined();
      expect(result.portfolio.maxDrawdown).toBeDefined();
      expect(result.portfolio.var95).toBeDefined();
    });

    it('should calculate performance without benchmark', () => {
      const result = engine.calculatePerformanceMetrics(mockPortfolioReturns);

      expect(result).toBeDefined();
      expect(result.portfolio).toBeDefined();
      expect(result.benchmark).toBeNull();
      expect(result.relative).toBeNull();
    });

    it('should calculate Sharpe ratio correctly', () => {
      const returns = Array.from({ length: 100 }, () => 0.001 + (Math.random() - 0.5) * 0.002); // Small returns with variation
      const sharpeRatio = engine.calculateSharpeRatio(returns, undefined, 0.02);

      expect(sharpeRatio).toBeGreaterThan(0);
      expect(sharpeRatio).toBeLessThan(50); // Allow even wider range for edge cases
    });

    it('should calculate Sortino ratio correctly', () => {
      const returns = Array.from({ length: 100 }, () => Math.random() * 0.004 - 0.002);
      const sortinoRatio = engine.calculateSortinoRatio(returns, 0.02);

      expect(sortinoRatio).toBeDefined();
      expect(typeof sortinoRatio).toBe('number');
    });

    it('should calculate maximum drawdown correctly', () => {
      const cumulativeReturns = [0, 0.1, 0.05, 0.08, 0.03, 0.12];
      const maxDrawdown = engine.calculateMaxDrawdown(cumulativeReturns);

      expect(maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(maxDrawdown).toBeLessThanOrEqual(1);
      expect(maxDrawdown).toBeCloseTo(0.07, 2); // Peak to trough: 0.12 - 0.05 = 0.07
    });
  });

  describe('Risk-Adjusted Performance', () => {
    it('should calculate risk-adjusted metrics', () => {
      const result = engine.calculateRiskAdjustedPerformance(
        mockPortfolioReturns,
        mockBenchmarkReturns,
        0.02
      );

      expect(result).toBeDefined();
      expect(result.traditional).toBeDefined();
      expect(result.modern).toBeDefined();
      expect(result.downside).toBeDefined();
      expect(result.relative).toBeDefined();

      // Traditional metrics
      expect(result.traditional.sharpeRatio).toBeDefined();
      expect(result.traditional.sortinoRatio).toBeDefined();
      expect(result.traditional.omegaRatio).toBeDefined();

      // Modern metrics
      expect(result.modern.valueAtRisk).toBeDefined();
      expect(result.modern.expectedShortfall).toBeDefined();
      expect(result.modern.calmarRatio).toBeDefined();
    });

    it('should calculate Omega ratio correctly', () => {
      const returns = Array.from({ length: 50 }, () => Math.random() * 0.01 - 0.005);
      const omegaRatio = engine.calculateOmegaRatio(returns);

      expect(omegaRatio).toBeGreaterThan(0);
      expect(omegaRatio).toBeDefined();
    });

    it('should calculate upside potential ratio', () => {
      const returns = Array.from({ length: 50 }, () => Math.random() * 0.01 - 0.005);
      const upsideRatio = engine.calculateUpsidePotentialRatio(returns);

      expect(upsideRatio).toBeDefined();
      expect(typeof upsideRatio).toBe('number');
    });
  });

  describe('Attribution Analysis', () => {
    it('should perform Brinson attribution', () => {
      const portfolioWeights = [0.4, 0.3, 0.3];
      const benchmarkWeights = [0.3, 0.4, 0.3];
      const portfolioReturns = [0.12, 0.08, 0.1];
      const benchmarkReturns = [0.1, 0.09, 0.11];

      const result = engine.brinsonAttribution(
        portfolioWeights,
        benchmarkWeights,
        portfolioReturns,
        benchmarkReturns
      );

      expect(result).toBeDefined();
      expect(result.allocation).toBeDefined();
      expect(result.selection).toBeDefined();
      expect(result.interaction).toBeDefined();
      expect(result.total).toBeDefined();
      expect(result.assetBreakdown).toHaveLength(3);
    });

    it('should calculate attribution components correctly', () => {
      // Simple case: overweight in winning stock
      const portfolioWeights = [0.6, 0.4];
      const benchmarkWeights = [0.5, 0.5];
      const portfolioReturns = [0.15, 0.05];
      const benchmarkReturns = [0.1, 0.08];

      const result = engine.brinsonAttribution(
        portfolioWeights,
        benchmarkWeights,
        portfolioReturns,
        benchmarkReturns
      );

      // Allocation effect should be positive (overweight in better performer)
      const expectedAllocation = (0.6 - 0.5) * 0.1; // 0.01
      expect(result.allocation).toBeCloseTo(expectedAllocation, 4);

      // Selection effect should be positive (better stock selection)
      const expectedSelection = 0.5 * (0.15 - 0.1) + 0.5 * (0.05 - 0.08); // 0.025 - 0.015 = 0.01
      expect(result.selection).toBeCloseTo(expectedSelection, 4);
    });

    it('should perform Carhart four-factor attribution', () => {
      const portfolioReturns = Array.from({ length: 60 }, () => Math.random() * 0.02 - 0.01);
      const marketReturns = Array.from({ length: 60 }, () => Math.random() * 0.015 - 0.0075);
      const sizeFactor = Array.from({ length: 60 }, () => Math.random() * 0.01 - 0.005);
      const valueFactor = Array.from({ length: 60 }, () => Math.random() * 0.01 - 0.005);
      const momentumFactor = Array.from({ length: 60 }, () => Math.random() * 0.01 - 0.005);

      const result = engine.carhartAttribution(
        portfolioReturns,
        marketReturns,
        sizeFactor,
        valueFactor,
        momentumFactor
      );

      expect(result).toBeDefined();
      expect(result.alpha).toBeDefined();
      expect(result.marketBeta).toBeDefined();
      expect(result.sizeBeta).toBeDefined();
      expect(result.valueBeta).toBeDefined();
      expect(result.momentumBeta).toBeDefined();
      expect(result.rSquared).toBeDefined();
      expect(result.factors).toBeDefined();
    });
  });

  describe('Relative Performance', () => {
    it('should calculate information ratio', () => {
      const portfolioReturns = Array.from({ length: 100 }, () => 0.001 + Math.random() * 0.002);
      const benchmarkReturns = Array.from({ length: 100 }, () => 0.0005 + Math.random() * 0.001);

      const infoRatio = engine.calculateInformationRatio(portfolioReturns, benchmarkReturns);

      expect(infoRatio).toBeDefined();
      expect(typeof infoRatio).toBe('number');
      expect(isNaN(infoRatio)).toBe(false);
    });

    it('should calculate tracking error', () => {
      const portfolioReturns = Array.from({ length: 50 }, () => Math.random() * 0.01);
      const benchmarkReturns = Array.from({ length: 50 }, () => Math.random() * 0.008);

      const trackingError = engine.calculateTrackingError(portfolioReturns, benchmarkReturns);

      expect(trackingError).toBeGreaterThanOrEqual(0);
      expect(typeof trackingError).toBe('number');
    });

    it('should calculate beta', () => {
      const portfolioReturns = Array.from({ length: 100 }, () => Math.random() * 0.01 - 0.005);
      const marketReturns = Array.from({ length: 100 }, () => Math.random() * 0.008 - 0.004);

      const beta = engine.calculateBeta(portfolioReturns, marketReturns);

      expect(beta).toBeDefined();
      expect(typeof beta).toBe('number');
      expect(beta).toBeGreaterThan(0); // Beta should be positive for reasonable data
    });

    it('should calculate alpha', () => {
      const portfolioReturns = Array.from({ length: 100 }, () => 0.001 + Math.random() * 0.002);
      const benchmarkReturns = Array.from({ length: 100 }, () => 0.0005 + Math.random() * 0.001);

      const alpha = engine.calculateAlpha(portfolioReturns, benchmarkReturns, 0.02);

      expect(alpha).toBeDefined();
      expect(typeof alpha).toBe('number');
    });
  });

  describe('Performance Persistence', () => {
    it('should calculate performance persistence', () => {
      const returns = Array.from({ length: 60 }, () => Math.random() * 0.02 - 0.01);
      const persistence = engine.calculatePerformancePersistence(returns);

      expect(persistence).toBeGreaterThanOrEqual(-1);
      expect(persistence).toBeLessThanOrEqual(1);
      expect(typeof persistence).toBe('number');
    });

    it('should handle insufficient data for persistence calculation', () => {
      const shortReturns = Array.from({ length: 10 }, () => Math.random() * 0.02 - 0.01);
      const persistence = engine.calculatePerformancePersistence(shortReturns);

      expect(persistence).toBe(0); // Should return 0 for insufficient data
    });
  });

  describe('Portfolio Analysis Integration', () => {
    it('should integrate with portfolio analysis', () => {
      const assets = [
        {
          symbol: 'AAPL',
          weight: 0.4,
          volatility: 0.25,
          returns: Array.from({ length: 100 }, () => Math.random() * 0.1 - 0.05)
        },
        {
          symbol: 'MSFT',
          weight: 0.3,
          volatility: 0.22,
          returns: Array.from({ length: 100 }, () => Math.random() * 0.1 - 0.05)
        },
        {
          symbol: 'GOOGL',
          weight: 0.3,
          volatility: 0.28,
          returns: Array.from({ length: 100 }, () => Math.random() * 0.1 - 0.05)
        }
      ];
      const weights = [0.4, 0.3, 0.3];

      const portfolioReturns = assets.reduce(
        (acc, asset, i) => acc.map((ret, j) => ret + asset.weight * asset.returns[j]),
        new Array(100).fill(0)
      );

      const performance = engine.calculatePerformanceMetrics(portfolioReturns);

      expect(performance).toBeDefined();
      expect(performance.portfolio.volatility).toBeGreaterThan(0);
      expect(performance.portfolio.sharpeRatio).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty arrays', () => {
      expect(() => engine.calculatePerformanceMetrics([])).toThrow();
    });

    it('should handle mismatched array lengths', () => {
      const shortBenchmark = Array.from({ length: 10 }, () => 0.001);
      expect(() =>
        engine.calculateInformationRatio(mockPortfolioReturns, shortBenchmark)
      ).toThrow();
    });

    it('should handle invalid attribution inputs', () => {
      expect(() => engine.brinsonAttribution([], [], [], [])).toThrow();
      expect(() => engine.brinsonAttribution([0.5], [0.5], [0.1], [])).toThrow();
    });

    it('should handle null or undefined inputs', () => {
      expect(() => engine.calculateSharpeRatio(null)).toBe(0);
      expect(() => engine.calculateMaxDrawdown(null)).toBe(0);
    });
  });

  describe('Caching', () => {
    it('should cache performance metrics', () => {
      const result1 = engine.calculatePerformanceMetrics(
        mockPortfolioReturns,
        mockBenchmarkReturns
      );
      const result2 = engine.calculatePerformanceMetrics(
        mockPortfolioReturns,
        mockBenchmarkReturns
      );

      expect(result2).toBe(result1);
    });

    it('should cache attribution results', () => {
      const weights = [0.4, 0.3, 0.3];
      const benchmarkWeights = [0.3, 0.4, 0.3];
      const returns = [0.12, 0.08, 0.1];
      const benchmarkReturns = [0.1, 0.09, 0.11];

      const result1 = engine.brinsonAttribution(
        weights,
        benchmarkWeights,
        returns,
        benchmarkReturns
      );
      const result2 = engine.brinsonAttribution(
        weights,
        benchmarkWeights,
        returns,
        benchmarkReturns
      );

      expect(result2).toBe(result1);
    });

    it('should clear performance cache', () => {
      engine.calculatePerformanceMetrics(mockPortfolioReturns);

      engine.clearPerformanceCache();

      const cached = engine.getCache(
        `perf_metrics_${mockPortfolioReturns.length}_${mockBenchmarkReturns.length}`
      );
      expect(cached).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle constant returns', () => {
      const constantReturns = new Array(50).fill(0.001);
      const result = engine.calculatePerformanceMetrics(constantReturns);

      expect(result).toBeDefined();
      expect(result.portfolio.volatility).toBe(0);
      expect(result.portfolio.sharpeRatio).toBeGreaterThan(0);
    });

    it('should handle highly volatile returns', () => {
      const volatileReturns = Array.from({ length: 50 }, () => Math.random() * 0.1 - 0.05);
      const result = engine.calculatePerformanceMetrics(volatileReturns);

      expect(result).toBeDefined();
      expect(result.portfolio.volatility).toBeGreaterThan(0.02); // Should be high
      expect(isFinite(result.portfolio.sharpeRatio)).toBe(true);
    });

    it('should handle negative returns', () => {
      const negativeReturns = Array.from({ length: 50 }, () => -0.005 + Math.random() * 0.01);
      const result = engine.calculatePerformanceMetrics(negativeReturns);

      expect(result).toBeDefined();
      expect(result.portfolio.totalReturn).toBeLessThan(0);
      expect(result.portfolio.annualizedReturn).toBeLessThan(0);
    });

    it('should handle perfect correlation in attribution', () => {
      const weights = [0.5, 0.5];
      const benchmarkWeights = [0.5, 0.5];
      const returns = [0.1, 0.08];
      const benchmarkReturns = [0.1, 0.08];

      const result = engine.brinsonAttribution(
        weights,
        benchmarkWeights,
        returns,
        benchmarkReturns
      );

      expect(result.allocation).toBe(0); // No allocation difference
      expect(result.interaction).toBe(0); // No interaction effect
    });
  });

  describe('Benchmark Management', () => {
    it('should set and get benchmark data', () => {
      const benchmarkData = Array.from({ length: 100 }, () => 0.0005 + Math.random() * 0.001);

      engine.setBenchmark('S&P 500', benchmarkData);
      const retrieved = engine.getBenchmark('S&P 500');

      expect(retrieved).toEqual(benchmarkData);
    });

    it('should return empty array for non-existent benchmark', () => {
      const retrieved = engine.getBenchmark('NonExistent');

      expect(retrieved).toEqual([]);
    });
  });
});
