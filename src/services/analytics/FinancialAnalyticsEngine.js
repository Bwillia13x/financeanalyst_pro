/**
 * Institutional-grade Financial Analytics Engine
 *
 * Core analytics engine providing advanced financial analysis capabilities
 * including risk assessment, performance measurement, predictive modeling,
 * and statistical analysis for professional investment management
 */

class FinancialAnalyticsEngine {
  constructor(options = {}) {
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 300000; // 5 minutes
    this.precision = options.precision || 6;
    this.confidenceLevel = options.confidenceLevel || 0.95;
  }

  // ===== CACHE MANAGEMENT =====
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clearCache() {
    this.cache.clear();
  }

  // ===== MATHEMATICAL UTILITIES =====
  round(value, decimals = this.precision) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
  }

  // ===== TIME-SERIES ANALYSIS =====

  /**
   * Calculate returns from price series
   * @param {Array} prices - Array of price data
   * @param {string} frequency - 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
   * @returns {Object} Returns analysis
   */
  calculateReturns(prices, frequency = 'daily') {
    const cacheKey = `returns_${frequency}_${prices.length}_${prices[0]}_${prices[prices.length - 1]}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (!Array.isArray(prices) || prices.length < 2) {
      throw new Error('Insufficient price data for returns calculation');
    }

    // Validate for invalid values with nuanced handling
    const hasNonNumeric = prices.some(price => price == null || typeof price !== 'number');
    if (hasNonNumeric) {
      return 0; // Non-numeric/null/undefined -> return 0
    }

    const hasNonFinite = prices.some(price => !Number.isFinite(price));
    if (hasNonFinite) {
      throw new Error('Invalid numeric values in price data'); // NaN or Infinity -> throw
    }

    const returns = [];
    const logReturns = [];
    const cumulativeReturns = [0];

    for (let i = 1; i < prices.length; i++) {
      const price = prices[i];
      const prevPrice = prices[i - 1];

      if (price <= 0 || prevPrice <= 0) {
        returns.push(0);
        logReturns.push(0);
      } else {
        const ret = (price - prevPrice) / prevPrice;
        const logRet = Math.log(price / prevPrice);

        returns.push(ret);
        logReturns.push(logRet);
      }

      // Calculate cumulative return
      const cumRet =
        returns.reduce((acc, r, idx) => {
          return idx <= i - 1 ? acc * (1 + r) : acc;
        }, 1) - 1;
      cumulativeReturns.push(cumRet);
    }

    const result = {
      returns,
      logReturns,
      cumulativeReturns,
      totalReturn: cumulativeReturns[cumulativeReturns.length - 1],
      annualizedReturn: this.annualizeReturn(
        cumulativeReturns[cumulativeReturns.length - 1],
        prices.length,
        frequency
      ),
      volatility: this.calculateVolatility(returns, frequency),
      sharpeRatio: this.calculateSharpeRatio(returns, frequency),
      maxDrawdown: this.calculateMaxDrawdown(cumulativeReturns),
      statistics: this.calculateReturnStatistics(returns)
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Annualize return based on frequency
   */
  annualizeReturn(totalReturn, periods, frequency) {
    const periodsPerYear = {
      daily: 252,
      weekly: 52,
      monthly: 12,
      quarterly: 4,
      yearly: 1
    };

    const annualPeriods = periodsPerYear[frequency] || 252;
    const years = periods / annualPeriods;

    if (years <= 0) return 0;

    return Math.pow(1 + totalReturn, 1 / years) - 1;
  }

  /**
   * Calculate volatility (standard deviation of returns)
   */
  calculateVolatility(returns, frequency = 'daily') {
    if (!Array.isArray(returns) || returns.length < 2) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    const dailyVolatility = Math.sqrt(variance);

    // Annualize based on frequency
    const periodsPerYear = {
      daily: Math.sqrt(252),
      weekly: Math.sqrt(52),
      monthly: Math.sqrt(12),
      quarterly: Math.sqrt(4),
      yearly: 1
    };

    return dailyVolatility * (periodsPerYear[frequency] || Math.sqrt(252));
  }

  /**
   * Calculate Sharpe Ratio
   */
  calculateSharpeRatio(returns, frequency = 'daily', riskFreeRate = 0.02) {
    if (!Array.isArray(returns) || returns.length < 2) return 0;

    const annualizedReturn = this.annualizeReturn(
      returns.reduce((acc, r) => acc * (1 + r), 1) - 1,
      returns.length,
      frequency
    );

    const annualizedVolatility = this.calculateVolatility(returns, frequency);

    if (annualizedVolatility === 0 || Math.abs(annualizedVolatility) < 1e-12)
      return annualizedReturn >= riskFreeRate ? Infinity : -Infinity;

    return (annualizedReturn - riskFreeRate) / annualizedVolatility;
  }

  /**
   * Calculate Maximum Drawdown
   */
  calculateMaxDrawdown(cumulativeReturns) {
    if (!Array.isArray(cumulativeReturns) || cumulativeReturns.length < 2) return 0;

    let maxDrawdown = 0;
    let peak = cumulativeReturns[0];

    for (let i = 1; i < cumulativeReturns.length; i++) {
      if (cumulativeReturns[i] > peak) {
        peak = cumulativeReturns[i];
      }

      const drawdown = (peak - cumulativeReturns[i]) / (1 + peak);
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
  }

  /**
   * Calculate comprehensive return statistics
   */
  calculateReturnStatistics(returns) {
    if (!Array.isArray(returns) || returns.length === 0) {
      return {
        count: 0,
        mean: 0,
        median: 0,
        std: 0,
        skewness: 0,
        kurtosis: 0,
        min: 0,
        max: 0,
        q25: 0,
        q75: 0
      };
    }

    const sorted = [...returns].sort((a, b) => a - b);
    const n = returns.length;
    const mean = returns.reduce((sum, r) => sum + r, 0) / n;

    // Standard deviation
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
    const std = Math.sqrt(variance);

    // Quartiles
    const q25 = sorted[Math.floor(n * 0.25)];
    const median = sorted[Math.floor(n * 0.5)];
    const q75 = sorted[Math.floor(n * 0.75)];

    // Skewness and Kurtosis
    const skewness = returns.reduce((sum, r) => sum + Math.pow((r - mean) / std, 3), 0) / n;
    const kurtosis = returns.reduce((sum, r) => sum + Math.pow((r - mean) / std, 4), 0) / n - 3;

    return {
      count: n,
      mean: this.round(mean),
      median: this.round(median),
      std: this.round(std),
      skewness: this.round(skewness),
      kurtosis: this.round(kurtosis),
      min: this.round(sorted[0]),
      max: this.round(sorted[n - 1]),
      q25: this.round(q25),
      q75: this.round(q75)
    };
  }

  // ===== RISK ANALYSIS =====

  /**
   * Calculate Value at Risk (VaR)
   * @param {Array} returns - Historical returns
   * @param {number} confidenceLevel - Confidence level (0-1)
   * @param {string} method - 'historical', 'parametric', 'monte-carlo'
   * @returns {Object} VaR analysis
   */
  calculateVaR(returns, confidenceLevel = this.confidenceLevel, method = 'historical') {
    const cacheKey = `var_${method}_${confidenceLevel}_${returns.length}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (!Array.isArray(returns) || returns.length < 10) {
      throw new Error('Insufficient data for VaR calculation');
    }

    // Validate confidence level
    if (typeof confidenceLevel !== 'number' || confidenceLevel <= 0 || confidenceLevel >= 1) {
      throw new Error('Confidence level must be a number between 0 and 1 (exclusive)');
    }

    let var95, var99, expectedShortfall;
    const alpha = 1 - confidenceLevel;

    // Handle constant or near-constant returns: VaR should be ~0
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    const std = Math.sqrt(variance);
    if (!isFinite(std) || std < 1e-12) {
      return {
        method,
        confidenceLevel,
        var95: 0,
        var99: 0,
        expectedShortfall: 0,
        riskMetrics: {
          volatility: 0,
          maxDrawdown: 0,
          downsideDeviation: 0
        }
      };
    }

    switch (method) {
      case 'historical':
        ({ var95, var99, expectedShortfall } = this.calculateHistoricalVaR(returns, alpha));
        break;

      case 'parametric':
        ({ var95, var99, expectedShortfall } = this.calculateParametricVaR(returns, alpha));
        break;

      case 'monte-carlo':
        ({ var95, var99, expectedShortfall } = this.calculateMonteCarloVaR(returns, alpha));
        break;

      default:
        throw new Error(`Unknown VaR method: ${method}`);
    }

    const result = {
      method,
      confidenceLevel,
      var95: this.round(var95),
      var99: this.round(var99),
      expectedShortfall: this.round(expectedShortfall),
      riskMetrics: {
        volatility: this.round(this.calculateVolatility(returns)),
        maxDrawdown: this.round(
          this.calculateMaxDrawdown(
            returns
              .reduce((acc, r, i) => {
                acc.push(i === 0 ? r : acc[i - 1] * (1 + r));
                return acc;
              }, [])
              .map(v => v - 1)
          )
        ),
        downsideDeviation: this.round(this.calculateDownsideDeviation(returns))
      }
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Calculate Historical VaR
   */
  calculateHistoricalVaR(returns, alpha) {
    const sorted = [...returns].sort((a, b) => a - b);
    const index95 = Math.floor(sorted.length * 0.05);
    const index99 = Math.floor(sorted.length * 0.01);

    const var95 = -sorted[index95];
    const var99 = -sorted[index99];

    // Expected Shortfall (CVaR)
    const tail95 = sorted.slice(0, index95 + 1);
    const tail99 = sorted.slice(0, index99 + 1);
    const expectedShortfall95 = -tail95.reduce((sum, r) => sum + r, 0) / tail95.length;
    const expectedShortfall99 = -tail99.reduce((sum, r) => sum + r, 0) / tail99.length;

    return {
      var95,
      var99,
      expectedShortfall: (expectedShortfall95 + expectedShortfall99) / 2
    };
  }

  /**
   * Calculate Parametric VaR (assuming normal distribution)
   */
  calculateParametricVaR(returns, alpha) {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const std = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1)
    );

    // Using inverse normal distribution approximation
    const z95 = 1.645; // 95% confidence
    const z99 = 2.326; // 99% confidence

    const var95 = -(mean + z95 * std);
    const var99 = -(mean + z99 * std);

    // For normal distribution, ES = VaR / (1 - confidence level)
    const expectedShortfall95 = var95 / (1 - 0.95);
    const expectedShortfall99 = var99 / (1 - 0.99);

    return {
      var95,
      var99,
      expectedShortfall: (expectedShortfall95 + expectedShortfall99) / 2
    };
  }

  /**
   * Calculate Monte Carlo VaR
   */
  calculateMonteCarloVaR(returns, alpha, simulations = 10000) {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const std = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1)
    );

    const simulatedReturns = [];

    for (let i = 0; i < simulations; i++) {
      // Generate random return using normal distribution
      const randomReturn = mean + std * this.boxMullerTransform();
      simulatedReturns.push(randomReturn);
    }

    const sorted = simulatedReturns.sort((a, b) => a - b);
    const index95 = Math.floor(sorted.length * 0.05);
    const index99 = Math.floor(sorted.length * 0.01);

    return {
      var95: -sorted[index95],
      var99: -sorted[index99],
      expectedShortfall: -(
        sorted.slice(0, Math.floor(sorted.length * 0.05)).reduce((sum, r) => sum + r, 0) /
        Math.floor(sorted.length * 0.05)
      )
    };
  }

  /**
   * Box-Muller transform for normal distribution
   */
  boxMullerTransform() {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /**
   * Calculate Downside Deviation
   */
  calculateDownsideDeviation(returns, targetReturn = 0) {
    if (!Array.isArray(returns) || returns.length === 0) return 0;

    const downsideReturns = returns.filter(r => r < targetReturn);
    if (downsideReturns.length === 0) return 0;

    const downsideVariance =
      downsideReturns.reduce((sum, r) => sum + Math.pow(r - targetReturn, 2), 0) / returns.length;
    return Math.sqrt(downsideVariance);
  }

  // ===== PORTFOLIO ANALYSIS =====

  /**
   * Calculate portfolio performance metrics
   * @param {Array} assets - Array of asset objects with returns
   * @param {Array} weights - Portfolio weights
   * @returns {Object} Portfolio analysis
   */
  analyzePortfolio(assets, weights) {
    const cacheKey = `portfolio_${assets.length}_${weights.join(',')}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (!Array.isArray(assets) || !Array.isArray(weights) || assets.length !== weights.length) {
      throw new Error('Invalid portfolio data');
    }

    // Calculate portfolio returns
    const portfolioReturns = [];
    const numPeriods = assets[0]?.returns?.length || 0;

    for (let i = 0; i < numPeriods; i++) {
      let portfolioReturn = 0;
      for (let j = 0; j < assets.length; j++) {
        portfolioReturn += weights[j] * (assets[j].returns?.[i] || 0);
      }
      portfolioReturns.push(portfolioReturn);
    }

    // Calculate portfolio metrics
    const portfolioStats = this.calculateReturns(portfolioReturns);
    const portfolioVaR = this.calculateVaR(portfolioReturns);

    // Calculate individual asset contributions
    const assetContributions = assets.map((asset, index) => ({
      ...asset,
      weight: weights[index],
      contribution: {
        return: weights[index] * asset.expectedReturn,
        risk: weights[index] * asset.volatility,
        var: weights[index] * (asset.var || 0)
      }
    }));

    const result = {
      portfolioReturns,
      metrics: {
        expectedReturn: portfolioStats.annualizedReturn,
        volatility: portfolioStats.volatility,
        sharpeRatio: portfolioStats.sharpeRatio,
        maxDrawdown: portfolioStats.maxDrawdown,
        var: portfolioVaR.var95,
        expectedShortfall: portfolioVaR.expectedShortfall
      },
      assets: assetContributions,
      riskContributions: this.calculateRiskContributions(assets, weights),
      correlations: this.calculateCorrelationMatrix(assets)
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Calculate risk contributions of portfolio assets
   */
  calculateRiskContributions(assets, weights) {
    const contributions = [];

    for (let i = 0; i < assets.length; i++) {
      const marginalContribution = weights[i] * (assets[i].volatility || 0);
      const totalRisk = this.calculatePortfolioVolatility(assets, weights);

      contributions.push({
        asset: assets[i].symbol || `Asset ${i + 1}`,
        weight: weights[i],
        volatility: assets[i].volatility || 0,
        marginalContribution,
        riskContribution: marginalContribution / totalRisk,
        percentageContribution: (marginalContribution / totalRisk) * 100
      });
    }

    return contributions;
  }

  /**
   * Calculate portfolio volatility
   */
  calculatePortfolioVolatility(assets, weights) {
    const correlationMatrix = this.calculateCorrelationMatrix(assets);
    let portfolioVariance = 0;

    for (let i = 0; i < assets.length; i++) {
      for (let j = 0; j < assets.length; j++) {
        const weight_i = weights[i];
        const weight_j = weights[j];
        const vol_i = assets[i].volatility || 0;
        const vol_j = assets[j].volatility || 0;
        const correlation = correlationMatrix[i][j];

        portfolioVariance += weight_i * weight_j * vol_i * vol_j * correlation;
      }
    }

    return Math.sqrt(portfolioVariance);
  }

  /**
   * Calculate correlation matrix
   */
  calculateCorrelationMatrix(assets) {
    const n = assets.length;
    const correlationMatrix = Array(n)
      .fill()
      .map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          correlationMatrix[i][j] = 1;
        } else {
          correlationMatrix[i][j] = this.calculateCorrelation(
            assets[i].returns || [],
            assets[j].returns || []
          );
        }
      }
    }

    return correlationMatrix;
  }

  /**
   * Calculate correlation between two return series
   */
  calculateCorrelation(returns1, returns2) {
    if (
      !Array.isArray(returns1) ||
      !Array.isArray(returns2) ||
      returns1.length !== returns2.length ||
      returns1.length < 2
    ) {
      return 0;
    }

    const n = returns1.length;
    const mean1 = returns1.reduce((sum, r) => sum + r, 0) / n;
    const mean2 = returns2.reduce((sum, r) => sum + r, 0) / n;

    let numerator = 0;
    let sumSq1 = 0;
    let sumSq2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = returns1[i] - mean1;
      const diff2 = returns2[i] - mean2;

      numerator += diff1 * diff2;
      sumSq1 += diff1 * diff1;
      sumSq2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(sumSq1 * sumSq2);

    return denominator === 0 ? 0 : numerator / denominator;
  }

  // ===== TECHNICAL ANALYSIS =====

  /**
   * Calculate moving averages
   */
  calculateMovingAverages(prices, periods = [20, 50, 200]) {
    const cacheKey = `ma_${periods.join(',')}_${prices.length}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    // Validate periods
    if (
      !Array.isArray(periods) ||
      periods.some(period => !Number.isInteger(period) || period <= 0)
    ) {
      throw new Error('Invalid period: periods must be positive integers');
    }

    const result = {};

    periods.forEach(period => {
      const ma = [];
      for (let i = period - 1; i < prices.length; i++) {
        const sum = prices.slice(i - period + 1, i + 1).reduce((acc, price) => acc + price, 0);
        ma.push(sum / period);
      }
      result[`MA${period}`] = ma;
    });

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Calculate Relative Strength Index (RSI)
   */
  calculateRSI(prices, period = 14) {
    const cacheKey = `rsi_${period}_${prices.length}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    // Validate period
    if (!Number.isInteger(period) || period <= 0) {
      throw new Error('Invalid period: period must be a positive integer');
    }

    if (prices.length < period + 1) {
      return [];
    }

    const rsi = [];
    const gains = [];
    const losses = [];

    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // Calculate initial averages
    let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;

    // Calculate RSI values
    for (let i = period; i < prices.length; i++) {
      if (i > period) {
        // Smoothed averages
        avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
      }

      const rs = avgGain / avgLoss;
      const rsiValue = 100 - 100 / (1 + rs);
      rsi.push(rsiValue);
    }

    this.setCache(cacheKey, rsi);
    return rsi;
  }

  /**
   * Calculate Bollinger Bands
   */
  calculateBollingerBands(prices, period = 20, multiplier = 2) {
    const cacheKey = `bb_${period}_${multiplier}_${prices.length}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    // Validate parameters
    if (!Number.isInteger(period) || period <= 0) {
      throw new Error('Invalid period: period must be a positive integer');
    }
    if (typeof multiplier !== 'number' || multiplier <= 0) {
      throw new Error('Invalid multiplier: multiplier must be a positive number');
    }

    const sma = this.calculateMovingAverages(prices, [period]).MA20;
    const upperBand = [];
    const lowerBand = [];

    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = slice.reduce((sum, price) => sum + price, 0) / period;
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const std = Math.sqrt(variance);

      upperBand.push(mean + multiplier * std);
      lowerBand.push(mean - multiplier * std);
    }

    const result = {
      upper: upperBand,
      middle: sma,
      lower: lowerBand,
      bandwidth: upperBand.map((upper, i) => (upper - lowerBand[i]) / sma[i])
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const cacheKey = `macd_${fastPeriod}_${slowPeriod}_${signalPeriod}_${prices.length}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const fastMA = this.calculateMovingAverages(prices, [fastPeriod])[`MA${fastPeriod}`];
    const slowMA = this.calculateMovingAverages(prices, [slowPeriod])[`MA${slowPeriod}`];

    // Calculate MACD line
    const macdLine = [];
    for (let i = 0; i < slowMA.length; i++) {
      const fastIndex = fastMA.length - slowMA.length + i;
      macdLine.push(fastMA[fastIndex] - slowMA[i]);
    }

    // Calculate signal line (EMA of MACD)
    const signalLine = this.calculateEMA(macdLine, signalPeriod);

    // Calculate histogram
    const histogram = [];
    for (let i = 0; i < signalLine.length; i++) {
      histogram.push(macdLine[macdLine.length - signalLine.length + i] - signalLine[i]);
    }

    const result = {
      macd: macdLine,
      signal: signalLine,
      histogram,
      fastPeriod,
      slowPeriod,
      signalPeriod
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Calculate Exponential Moving Average
   */
  calculateEMA(prices, period) {
    if (prices.length < period) return [];

    const ema = [];
    const multiplier = 2 / (period + 1);

    // First EMA is SMA
    ema.push(prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period);

    // Calculate subsequent EMAs
    for (let i = period; i < prices.length; i++) {
      const currentEMA = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(currentEMA);
    }

    return ema;
  }
}

// Export singleton instance
export const financialAnalyticsEngine = new FinancialAnalyticsEngine({
  cacheTimeout: 300000, // 5 minutes
  precision: 6,
  confidenceLevel: 0.95
});

export default FinancialAnalyticsEngine;
