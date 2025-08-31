import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import FinancialAnalyticsEngine from '../FinancialAnalyticsEngine';

describe('FinancialAnalyticsEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new FinancialAnalyticsEngine({
      cacheTimeout: 1000,
      precision: 6
    });
    engine.clearCache();
  });

  afterEach(() => {
    engine.clearCache();
  });

  describe('Return Calculations', () => {
    it('should calculate returns correctly for simple price series', () => {
      const prices = [100, 105, 98, 102, 107];
      const result = engine.calculateReturns(
        prices.map((price, i) => (i === 0 ? 0 : (price - prices[i - 1]) / prices[i - 1]))
      );

      expect(result).toBeDefined();
      expect(result.returns).toHaveLength(4);
      expect(result.totalReturn).toBeCloseTo(0.2009, 3); // Compound return: (1.05 * 0.9333 * 1.0408 * 1.0490) - 1
      expect(result.annualizedReturn).toBeGreaterThan(0);
      expect(result.volatility).toBeGreaterThan(0);
    });

    it('should handle zero or negative prices gracefully', () => {
      const prices = [100, 0, -50, 100];
      const result = engine.calculateReturns(
        prices.map((price, i) => (i === 0 ? 0 : (price - prices[i - 1]) / prices[i - 1]))
      );

      expect(result).toBeDefined();
      expect(result.returns).toContain(0); // Should handle zero prices
    });

    it('should calculate annualized returns correctly', () => {
      // Create price series that would generate ~0.1% daily returns
      const prices = [100]; // Starting price
      for (let i = 1; i <= 252; i++) {
        prices.push(prices[i - 1] * 1.001); // 0.1% daily growth
      }

      const result = engine.calculateReturns(prices, 'daily');

      // Annualized return should be approximately (1 + daily)^252 - 1
      const expectedAnnualized = Math.pow(1.001, 252) - 1;
      expect(result.annualizedReturn).toBeCloseTo(expectedAnnualized, 2);
    });
  });

  describe('Risk Metrics', () => {
    it('should calculate volatility correctly', () => {
      const returns = [0.01, -0.005, 0.02, -0.01, 0.015];
      const volatility = engine.calculateVolatility(returns);

      expect(volatility).toBeGreaterThan(0);
      expect(volatility).toBeLessThan(1); // Should be reasonable for daily returns
    });

    it('should calculate Sharpe ratio correctly', () => {
      const returns = [0.01, 0.005, 0.02, 0.01, 0.015];
      const sharpeRatio = engine.calculateSharpeRatio(returns, undefined, 0.02);

      expect(sharpeRatio).toBeDefined();
      expect(typeof sharpeRatio).toBe('number');
    });

    it('should calculate maximum drawdown correctly', () => {
      const cumulativeReturns = [0, 0.1, 0.05, 0.08, 0.03, 0.12];
      const maxDrawdown = engine.calculateMaxDrawdown(cumulativeReturns);

      expect(maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(maxDrawdown).toBeLessThanOrEqual(1);
    });
  });

  describe('Value at Risk (VaR)', () => {
    it('should calculate VaR using historical method', () => {
      const returns = Array.from({ length: 100 }, () => Math.random() * 0.1 - 0.05);
      const varResult = engine.calculateVaR(returns, 0.95, 'historical');

      expect(varResult).toBeDefined();
      expect(varResult.var95).toBeDefined();
      expect(varResult.var99).toBeDefined();
      expect(varResult.expectedShortfall).toBeDefined();
      expect(varResult.var95).toBeDefined(); // VaR should be defined (can be positive or negative)
      expect(varResult.var99).toBeLessThan(varResult.var95); // 99% VaR should be more extreme
    });

    it('should calculate VaR using parametric method', () => {
      const returns = Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.1);
      const varResult = engine.calculateVaR(returns, 0.95, 'parametric');

      expect(varResult).toBeDefined();
      expect(varResult.var95).toBeDefined();
      expect(varResult.method).toBe('parametric');
    });

    it('should calculate VaR using Monte Carlo method', () => {
      const returns = Array.from({ length: 50 }, () => (Math.random() - 0.5) * 0.1);
      const varResult = engine.calculateVaR(returns, 0.95, 'monte-carlo');

      expect(varResult).toBeDefined();
      expect(varResult.var95).toBeDefined();
      expect(varResult.method).toBe('monte-carlo');
    });
  });

  describe('Portfolio Analysis', () => {
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

    it('should analyze portfolio correctly', () => {
      const result = engine.analyzePortfolio(assets, weights);

      expect(result).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.metrics.expectedReturn).toBeDefined();
      expect(result.metrics.volatility).toBeDefined();
      expect(result.metrics.sharpeRatio).toBeDefined();
      expect(result.portfolioReturns).toHaveLength(100);
    });

    it('should calculate portfolio correlations', () => {
      const correlationMatrix = engine.calculateCorrelationMatrix(assets);

      expect(correlationMatrix).toHaveLength(3);
      expect(correlationMatrix[0]).toHaveLength(3);
      expect(correlationMatrix[0][0]).toBe(1); // Diagonal should be 1
      expect(correlationMatrix[1][1]).toBe(1);
      expect(correlationMatrix[2][2]).toBe(1);
    });

    it('should calculate portfolio volatility correctly', () => {
      const portfolioVolatility = engine.calculatePortfolioVolatility(assets, weights);

      expect(portfolioVolatility).toBeGreaterThan(0);
      expect(portfolioVolatility).toBeLessThanOrEqual(Math.max(...assets.map(a => a.volatility)));
    });
  });

  describe('Technical Indicators', () => {
    const prices = Array.from({ length: 100 }, (_, i) => 100 + i * 0.1 + Math.sin(i * 0.1) * 5);

    it('should calculate moving averages correctly', () => {
      const ma20 = engine.calculateMovingAverages(prices, [20]).MA20;

      expect(ma20).toHaveLength(prices.length - 19); // 20-period MA
      expect(ma20[0]).toBeCloseTo(prices.slice(0, 20).reduce((sum, p) => sum + p, 0) / 20, 5);
    });

    it('should calculate RSI correctly', () => {
      const rsi = engine.calculateRSI(prices, 14);

      expect(rsi).toHaveLength(prices.length - 14);
      rsi.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });

    it('should calculate Bollinger Bands correctly', () => {
      const bollinger = engine.calculateBollingerBands(prices, 20, 2);

      expect(bollinger.upper).toHaveLength(prices.length - 19);
      expect(bollinger.lower).toHaveLength(prices.length - 19);
      expect(bollinger.middle).toHaveLength(prices.length - 19);

      // Upper band should be above middle band
      expect(bollinger.upper[0]).toBeGreaterThan(bollinger.middle[0]);
      // Lower band should be below middle band
      expect(bollinger.lower[0]).toBeLessThan(bollinger.middle[0]);
    });

    it('should calculate MACD correctly', () => {
      const macd = engine.calculateMACD(prices, 12, 26, 9);

      expect(macd.macd).toBeDefined();
      expect(macd.signal).toBeDefined();
      expect(macd.histogram).toBeDefined();
      expect(macd.macd.length).toBe(macd.signal.length + 9);
    });
  });

  describe('Caching', () => {
    it('should cache results and return cached data', () => {
      const prices = [100, 105, 110, 108, 112];
      const key = `returns_daily_${prices.length}`;

      // First call should compute
      const result1 = engine.calculateReturns(
        prices.map((price, i) => (i === 0 ? 0 : (price - prices[i - 1]) / prices[i - 1]))
      );
      expect(result1).toBeDefined();

      // Second call should return cached result
      const result2 = engine.calculateReturns(
        prices.map((price, i) => (i === 0 ? 0 : (price - prices[i - 1]) / prices[i - 1]))
      );
      expect(result2).toBe(result1); // Should be same object reference

      // Check cache directly
      const cached = engine.getCache(key);
      expect(cached).toBeDefined();
      expect(cached).toBe(result1);
    });

    it('should clear cache correctly', () => {
      const prices = [100, 105, 110];
      engine.calculateReturns(
        prices.map((price, i) => (i === 0 ? 0 : (price - prices[i - 1]) / prices[i - 1]))
      );

      engine.clearCache();

      const cached = engine.getCache('any_key');
      expect(cached).toBeNull();
    });

    it('should expire cache after timeout', async () => {
      const shortLivedEngine = new FinancialAnalyticsEngine({ cacheTimeout: 100 });
      const prices = [100, 105, 110];

      shortLivedEngine.calculateReturns(
        prices.map((price, i) => (i === 0 ? 0 : (price - prices[i - 1]) / prices[i - 1]))
      );

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      const cached = shortLivedEngine.getCache(`returns_daily_${prices.length}`);
      expect(cached).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty arrays gracefully', () => {
      expect(() => engine.calculateReturns([])).toThrow();
      expect(() => engine.calculateVolatility([])).toBe(0);
    });

    it('should handle invalid inputs', () => {
      expect(() => engine.calculateReturns(null)).toThrow();
      expect(() => engine.calculateReturns(undefined)).toThrow();
      expect(() => engine.calculateVolatility(null)).toBe(0);
    });

    it('should handle insufficient data for complex calculations', () => {
      const shortData = [100, 105]; // Only 2 data points

      expect(() => engine.calculateVaR(shortData, 0.95)).toThrow();
      expect(() => engine.calculateRSI(shortData)).toEqual([]);
    });
  });

  describe('Numerical Precision', () => {
    it('should maintain specified precision', () => {
      const preciseEngine = new FinancialAnalyticsEngine({ precision: 4 });
      const returns = [0.012345, 0.023456, 0.034567];

      const result = preciseEngine.calculateReturns(returns);

      // Check that results are rounded to 4 decimal places
      expect(result.volatility.toString().split('.')[1]?.length).toBeLessThanOrEqual(4);
    });

    it('should handle very small numbers correctly', () => {
      const tinyReturns = [0.000001, -0.000002, 0.000003];
      const result = engine.calculateReturns(tinyReturns);

      expect(result).toBeDefined();
      expect(isNaN(result.volatility)).toBe(false);
      expect(isFinite(result.volatility)).toBe(true);
    });
  });
});
