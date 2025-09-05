import FinancialAnalyticsEngine from './FinancialAnalyticsEngine.js';

/**
 * Institutional-grade Performance Measurement and Attribution Engine
 *
 * Comprehensive portfolio performance analysis with advanced attribution,
 * benchmark comparison, and risk-adjusted performance metrics
 */

class PerformanceMeasurementEngine extends FinancialAnalyticsEngine {
  constructor(options = {}) {
    super(options);
    this.benchmarkData = new Map();
    this.attributionMethods = {
      BRINSON: 'brinson',
      CARHART: 'carhart',
      MENDELL: 'mendell'
    };
  }

  // ===== PERFORMANCE MEASUREMENT =====

  /**
   * Calculate comprehensive portfolio performance metrics
   * @param {Array} portfolioReturns - Portfolio return series
   * @param {Array} benchmarkReturns - Benchmark return series (optional)
   * @param {number} riskFreeRate - Risk-free rate for Sharpe ratio
   * @returns {Object} Comprehensive performance analysis
   */
  calculatePerformanceMetrics(portfolioReturns, benchmarkReturns = null, riskFreeRate = 0.02) {
    const cacheKey = `perf_metrics_${portfolioReturns.length}_${benchmarkReturns?.length || 0}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (!Array.isArray(portfolioReturns) || portfolioReturns.length < 2) {
      throw new Error('Insufficient portfolio return data');
    }

    // Basic return calculations
    const portfolioStats = this.calculateReturns(portfolioReturns);
    const benchmarkStats = benchmarkReturns ? this.calculateReturns(benchmarkReturns) : null;

    // Risk-adjusted performance metrics
    const sharpeRatio = this.calculateSharpeRatio(portfolioReturns, undefined, riskFreeRate);
    const sortinoRatio = this.calculateSortinoRatio(portfolioReturns, riskFreeRate);
    const informationRatio = benchmarkStats
      ? this.calculateInformationRatio(portfolioReturns, benchmarkReturns)
      : null;

    // Downside risk metrics
    const downsideDeviation = this.calculateDownsideDeviation(portfolioReturns);
    const maximumDrawdown = this.calculateMaxDrawdown(portfolioStats.cumulativeReturns);
    const calmarRatio = maximumDrawdown > 0 ? portfolioStats.annualizedReturn / maximumDrawdown : 0;

    // Value at Risk and Expected Shortfall
    const var95 = this.calculateVaR(portfolioReturns, 0.95).var95;
    const expectedShortfall = this.calculateVaR(portfolioReturns, 0.95).expectedShortfall;

    // Omega ratio (ratio of gains to losses)
    const omegaRatio = this.calculateOmegaRatio(portfolioReturns, 0);

    // Performance persistence metrics
    const persistence = this.calculatePerformancePersistence(portfolioReturns);

    const result = {
      portfolio: {
        totalReturn: this.round(portfolioStats.totalReturn),
        annualizedReturn: this.round(portfolioStats.annualizedReturn),
        volatility: this.round(portfolioStats.volatility),
        maxDrawdown: this.round(maximumDrawdown),
        calmarRatio: this.round(calmarRatio),
        sharpeRatio: this.round(sharpeRatio),
        sortinoRatio: this.round(sortinoRatio),
        omegaRatio: this.round(omegaRatio),
        var95: this.round(var95),
        expectedShortfall: this.round(expectedShortfall),
        downsideDeviation: this.round(downsideDeviation),
        persistence: this.round(persistence)
      },
      benchmark: benchmarkStats
        ? {
            totalReturn: this.round(benchmarkStats.totalReturn),
            annualizedReturn: this.round(benchmarkStats.annualizedReturn),
            volatility: this.round(benchmarkStats.volatility),
            maxDrawdown: this.round(this.calculateMaxDrawdown(benchmarkStats.cumulativeReturns))
          }
        : null,
      relative: benchmarkStats
        ? {
            excessReturn: this.round(
              portfolioStats.annualizedReturn - benchmarkStats.annualizedReturn
            ),
            trackingError: this.round(
              this.calculateTrackingError(portfolioReturns, benchmarkReturns)
            ),
            informationRatio: this.round(informationRatio),
            beta: this.round(this.calculateBeta(portfolioReturns, benchmarkReturns)),
            alpha: this.round(this.calculateAlpha(portfolioReturns, benchmarkReturns, riskFreeRate))
          }
        : null,
      periods: {
        total: portfolioReturns.length,
        positive: portfolioReturns.filter(r => r > 0).length,
        negative: portfolioReturns.filter(r => r < 0).length,
        bestMonth: this.round(Math.max(...portfolioReturns)),
        worstMonth: this.round(Math.min(...portfolioReturns))
      }
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Calculate Sortino Ratio (downside deviation instead of total volatility)
   */
  calculateSortinoRatio(returns, riskFreeRate = 0, targetReturn = 0) {
    if (!Array.isArray(returns) || returns.length === 0) return 0;

    const annualizedReturn = this.annualizeReturn(
      returns.reduce((acc, r) => acc * (1 + r), 1) - 1,
      returns.length
    );

    const downsideDeviation = this.calculateDownsideDeviation(returns, targetReturn);

    if (downsideDeviation === 0) return 0;

    return (annualizedReturn - riskFreeRate) / downsideDeviation;
  }

  /**
   * Calculate Information Ratio
   */
  calculateInformationRatio(portfolioReturns, benchmarkReturns) {
    if (
      !Array.isArray(portfolioReturns) ||
      !Array.isArray(benchmarkReturns) ||
      portfolioReturns.length !== benchmarkReturns.length
    ) {
      throw new Error('Invalid inputs for information ratio');
    }

    const excessReturns = portfolioReturns.map((r, i) => r - benchmarkReturns[i]);
    const trackingError = this.calculateTrackingError(portfolioReturns, benchmarkReturns);

    if (trackingError === 0) return 0;

    const annualizedExcessReturn = this.annualizeReturn(
      excessReturns.reduce((acc, r) => acc * (1 + r), 1) - 1,
      excessReturns.length
    );

    return annualizedExcessReturn / trackingError;
  }

  /**
   * Calculate Tracking Error (standard deviation of excess returns)
   */
  calculateTrackingError(portfolioReturns, benchmarkReturns) {
    if (
      !Array.isArray(portfolioReturns) ||
      !Array.isArray(benchmarkReturns) ||
      portfolioReturns.length !== benchmarkReturns.length
    ) {
      return 0;
    }

    const excessReturns = portfolioReturns.map((r, i) => r - benchmarkReturns[i]);
    return this.calculateVolatility(excessReturns);
  }

  /**
   * Calculate Beta (market sensitivity)
   */
  calculateBeta(portfolioReturns, marketReturns) {
    if (
      !Array.isArray(portfolioReturns) ||
      !Array.isArray(marketReturns) ||
      portfolioReturns.length !== marketReturns.length
    ) {
      return 1;
    }

    const covariance = this.calculateCovariance(portfolioReturns, marketReturns);
    const marketVariance = this.calculateVariance(marketReturns);

    return marketVariance !== 0 ? covariance / marketVariance : 1;
  }

  /**
   * Calculate Alpha (excess return adjusted for risk)
   */
  calculateAlpha(portfolioReturns, benchmarkReturns, riskFreeRate = 0.02) {
    if (
      !Array.isArray(portfolioReturns) ||
      !Array.isArray(benchmarkReturns) ||
      portfolioReturns.length !== benchmarkReturns.length
    ) {
      return 0;
    }

    const portfolioExcessReturn =
      this.annualizeReturn(
        portfolioReturns.reduce((acc, r) => acc * (1 + r), 1) - 1,
        portfolioReturns.length
      ) - riskFreeRate;

    const benchmarkExcessReturn =
      this.annualizeReturn(
        benchmarkReturns.reduce((acc, r) => acc * (1 + r), 1) - 1,
        benchmarkReturns.length
      ) - riskFreeRate;

    const beta = this.calculateBeta(portfolioReturns, benchmarkReturns);

    return portfolioExcessReturn - beta * benchmarkExcessReturn;
  }

  /**
   * Calculate Omega Ratio
   */
  calculateOmegaRatio(returns, threshold = 0) {
    if (!Array.isArray(returns) || returns.length === 0) return 0;

    const gains = returns.filter(r => r > threshold);
    const losses = returns.filter(r => r < threshold);

    const totalGains = gains.reduce((sum, gain) => sum + (gain - threshold), 0);
    const totalLosses = losses.reduce((sum, loss) => sum + (threshold - loss), 0);

    return totalLosses !== 0 ? totalGains / totalLosses : 0;
  }

  /**
   * Calculate Performance Persistence
   */
  calculatePerformancePersistence(returns, quarters = 8) {
    if (!Array.isArray(returns) || returns.length < quarters * 3) return 0;

    const quarterReturns = [];
    for (let i = 0; i < returns.length - 2; i += 3) {
      const quarterReturn = returns.slice(i, i + 3).reduce((acc, r) => acc * (1 + r), 1) - 1;
      quarterReturns.push(quarterReturn);
    }

    if (quarterReturns.length < quarters) return 0;

    // Calculate persistence as correlation between consecutive quarters
    const consecutivePairs = [];
    for (let i = 1; i < quarterReturns.length; i++) {
      consecutivePairs.push([quarterReturns[i - 1], quarterReturns[i]]);
    }

    return this.calculateCorrelation(
      consecutivePairs.map(pair => pair[0]),
      consecutivePairs.map(pair => pair[1])
    );
  }

  // ===== PERFORMANCE ATTRIBUTION =====

  /**
   * Brinson Attribution Analysis
   * @param {Array} portfolioWeights - Portfolio weights
   * @param {Array} benchmarkWeights - Benchmark weights
   * @param {Array} portfolioReturns - Portfolio asset returns
   * @param {Array} benchmarkReturns - Benchmark asset returns
   * @returns {Object} Brinson attribution analysis
   */
  brinsonAttribution(portfolioWeights, benchmarkWeights, portfolioReturns, benchmarkReturns) {
    const cacheKey = `brinson_${portfolioWeights.length}_${portfolioReturns.length}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (
      !this.validateAttributionInputs(
        portfolioWeights,
        benchmarkWeights,
        portfolioReturns,
        benchmarkReturns
      )
    ) {
      throw new Error('Invalid attribution analysis inputs');
    }

    const n = portfolioWeights.length;
    const attribution = {
      allocation: 0,
      selection: 0,
      interaction: 0,
      total: 0,
      assetBreakdown: []
    };

    // Calculate overall portfolio and benchmark returns
    const portfolioReturn = this.calculatePortfolioReturn(portfolioWeights, portfolioReturns);
    const benchmarkReturn = this.calculatePortfolioReturn(benchmarkWeights, benchmarkReturns);

    attribution.total = portfolioReturn - benchmarkReturn;

    // Brinson attribution components
    for (let i = 0; i < n; i++) {
      const assetWeight = portfolioWeights[i];
      const benchmarkWeight = benchmarkWeights[i];
      const assetReturn = portfolioReturns[i];
      const benchmarkAssetReturn = benchmarkReturns[i];

      // Allocation effect
      const allocationEffect = (assetWeight - benchmarkWeight) * benchmarkAssetReturn;
      attribution.allocation += allocationEffect;

      // Selection effect
      const selectionEffect = benchmarkWeight * (assetReturn - benchmarkAssetReturn);
      attribution.selection += selectionEffect;

      // Interaction effect
      const interactionEffect =
        (assetWeight - benchmarkWeight) * (assetReturn - benchmarkAssetReturn);
      attribution.interaction += interactionEffect;

      attribution.assetBreakdown.push({
        asset: `Asset ${i + 1}`,
        allocationEffect: this.round(allocationEffect),
        selectionEffect: this.round(selectionEffect),
        interactionEffect: this.round(interactionEffect),
        totalEffect: this.round(allocationEffect + selectionEffect + interactionEffect)
      });
    }

    // Round final results
    attribution.allocation = this.round(attribution.allocation);
    attribution.selection = this.round(attribution.selection);
    attribution.interaction = this.round(attribution.interaction);
    attribution.total = this.round(attribution.total);

    this.setCache(cacheKey, attribution);
    return attribution;
  }

  /**
   * Carhart Four-Factor Attribution
   * @param {Array} portfolioReturns - Portfolio returns
   * @param {Array} marketReturns - Market returns
   * @param {Array} sizeFactor - Size factor (SMB)
   * @param {Array} valueFactor - Value factor (HML)
   * @param {Array} momentumFactor - Momentum factor (WML)
   * @returns {Object} Carhart four-factor attribution
   */
  carhartAttribution(portfolioReturns, marketReturns, sizeFactor, valueFactor, momentumFactor) {
    const cacheKey = `carhart_${portfolioReturns.length}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (
      !Array.isArray(portfolioReturns) ||
      !Array.isArray(marketReturns) ||
      portfolioReturns.length !== marketReturns.length
    ) {
      throw new Error('Invalid Carhart attribution inputs');
    }

    // Create factor matrix
    const factors = [
      new Array(portfolioReturns.length).fill(1), // Intercept
      marketReturns, // Market factor
      sizeFactor || new Array(portfolioReturns.length).fill(0),
      valueFactor || new Array(portfolioReturns.length).fill(0),
      momentumFactor || new Array(portfolioReturns.length).fill(0)
    ];

    // Run regression
    const regression = this.multipleRegression(portfolioReturns, factors);

    const attribution = {
      alpha: this.round(regression.coefficients[0].value),
      marketBeta: this.round(regression.coefficients[1].value),
      sizeBeta: this.round(regression.coefficients[2].value),
      valueBeta: this.round(regression.coefficients[3].value),
      momentumBeta: this.round(regression.coefficients[4].value),
      rSquared: regression.statistics.rSquared,
      factors: {
        market: {
          beta: regression.coefficients[1].value,
          contribution:
            regression.coefficients[1].value * this.calculateAverageReturn(marketReturns)
        },
        size: {
          beta: regression.coefficients[2].value,
          contribution: regression.coefficients[2].value * this.calculateAverageReturn(sizeFactor)
        },
        value: {
          beta: regression.coefficients[3].value,
          contribution: regression.coefficients[3].value * this.calculateAverageReturn(valueFactor)
        },
        momentum: {
          beta: regression.coefficients[4].value,
          contribution:
            regression.coefficients[4].value * this.calculateAverageReturn(momentumFactor)
        }
      }
    };

    this.setCache(cacheKey, attribution);
    return attribution;
  }

  // ===== RISK-ADJUSTED PERFORMANCE =====

  /**
   * Calculate comprehensive risk-adjusted performance metrics
   * @param {Array} portfolioReturns - Portfolio returns
   * @param {Array} benchmarkReturns - Benchmark returns
   * @param {number} riskFreeRate - Risk-free rate
   * @returns {Object} Risk-adjusted performance analysis
   */
  calculateRiskAdjustedPerformance(portfolioReturns, benchmarkReturns = null, riskFreeRate = 0.02) {
    const cacheKey = `risk_adj_perf_${portfolioReturns.length}_${benchmarkReturns?.length || 0}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const result = {
      traditional: {},
      modern: {},
      downside: {},
      relative: {}
    };

    // Traditional metrics
    result.traditional.sharpeRatio = this.calculateSharpeRatio(
      portfolioReturns,
      undefined,
      riskFreeRate
    );
    result.traditional.sortinoRatio = this.calculateSortinoRatio(portfolioReturns, riskFreeRate);
    result.traditional.omegaRatio = this.calculateOmegaRatio(portfolioReturns);

    // Modern metrics
    const var95 = this.calculateVaR(portfolioReturns, 0.95);
    result.modern.valueAtRisk = var95.var95;
    result.modern.expectedShortfall = var95.expectedShortfall;
    result.modern.calmarRatio = this.calculateMaxDrawdown(
      portfolioReturns
        .reduce((acc, r, i) => {
          acc.push(i === 0 ? r : acc[i - 1] * (1 + r));
          return acc;
        }, [])
        .map(v => v - 1)
    );

    // Downside risk metrics
    result.downside.downsideDeviation = this.calculateDownsideDeviation(portfolioReturns);
    result.downside.upsidePotentialRatio = this.calculateUpsidePotentialRatio(portfolioReturns);
    result.downside.gainLossRatio = this.calculateGainLossRatio(portfolioReturns);

    // Relative metrics (if benchmark available)
    if (benchmarkReturns) {
      result.relative.informationRatio = this.calculateInformationRatio(
        portfolioReturns,
        benchmarkReturns
      );
      result.relative.trackingError = this.calculateTrackingError(
        portfolioReturns,
        benchmarkReturns
      );
      result.relative.alpha = this.calculateAlpha(portfolioReturns, benchmarkReturns, riskFreeRate);
      result.relative.beta = this.calculateBeta(portfolioReturns, benchmarkReturns);
    }

    // Round all results
    this.roundNestedObject(result);

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Calculate Upside Potential Ratio
   */
  calculateUpsidePotentialRatio(returns, targetReturn = 0) {
    if (!Array.isArray(returns) || returns.length === 0) return 0;

    const upsideReturns = returns.filter(r => r > targetReturn);
    const downsideReturns = returns.filter(r => r < targetReturn);

    if (downsideReturns.length === 0) return 0;

    const upsidePotential =
      upsideReturns.reduce((sum, r) => sum + (r - targetReturn), 0) / upsideReturns.length;
    const downsideDeviation =
      downsideReturns.reduce((sum, r) => sum + Math.pow(targetReturn - r, 2), 0) /
      downsideReturns.length;

    return downsideDeviation !== 0 ? upsidePotential / Math.sqrt(downsideDeviation) : 0;
  }

  /**
   * Calculate Gain/Loss Ratio
   */
  calculateGainLossRatio(returns) {
    if (!Array.isArray(returns) || returns.length === 0) return 0;

    const gains = returns.filter(r => r > 0);
    const losses = returns.filter(r => r < 0);

    if (losses.length === 0) return 0;

    const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / gains.length;
    const avgLoss = Math.abs(losses.reduce((sum, loss) => sum + loss, 0) / losses.length);

    return avgLoss !== 0 ? avgGain / avgLoss : 0;
  }

  // ===== UTILITY METHODS =====

  /**
   * Calculate portfolio return
   */
  calculatePortfolioReturn(weights, returns) {
    return weights.reduce((sum, weight, i) => sum + weight * returns[i], 0);
  }

  /**
   * Calculate covariance between two return series
   */
  calculateCovariance(returns1, returns2) {
    if (
      !Array.isArray(returns1) ||
      !Array.isArray(returns2) ||
      returns1.length !== returns2.length
    ) {
      return 0;
    }

    const n = returns1.length;
    const mean1 = returns1.reduce((sum, r) => sum + r, 0) / n;
    const mean2 = returns2.reduce((sum, r) => sum + r, 0) / n;

    return returns1.reduce((sum, r1, i) => sum + (r1 - mean1) * (returns2[i] - mean2), 0) / (n - 1);
  }

  /**
   * Calculate variance of return series
   */
  calculateVariance(returns) {
    if (!Array.isArray(returns) || returns.length < 2) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    return returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  }

  /**
   * Calculate average return
   */
  calculateAverageReturn(returns) {
    if (!Array.isArray(returns) || returns.length === 0) return 0;
    return returns.reduce((sum, r) => sum + r, 0) / returns.length;
  }

  /**
   * Validate attribution analysis inputs
   */
  validateAttributionInputs(
    portfolioWeights,
    benchmarkWeights,
    portfolioReturns,
    benchmarkReturns
  ) {
    return (
      Array.isArray(portfolioWeights) &&
      Array.isArray(benchmarkWeights) &&
      Array.isArray(portfolioReturns) &&
      Array.isArray(benchmarkReturns) &&
      portfolioWeights.length > 0 &&
      benchmarkWeights.length > 0 &&
      portfolioReturns.length > 0 &&
      benchmarkReturns.length > 0 &&
      portfolioWeights.length === benchmarkWeights.length &&
      portfolioWeights.length === portfolioReturns.length &&
      benchmarkWeights.length === benchmarkReturns.length
    );
  }

  /**
   * Round all numeric values in nested object
   */
  roundNestedObject(obj) {
    for (const key in obj) {
      if (typeof obj[key] === 'number') {
        obj[key] = this.round(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.roundNestedObject(obj[key]);
      }
    }
  }

  /**
   * Update benchmark data
   * @param {string} benchmarkId - Benchmark identifier
   * @param {Array} returns - Benchmark returns
   */
  setBenchmark(benchmarkId, returns) {
    this.benchmarkData.set(benchmarkId, returns);
  }

  /**
   * Get benchmark data
   * @param {string} benchmarkId - Benchmark identifier
   * @returns {Array} Benchmark returns
   */
  getBenchmark(benchmarkId) {
    return this.benchmarkData.get(benchmarkId) || [];
  }

  /**
   * Clear all cached results
   */
  clearPerformanceCache() {
    // Clear performance-related cache entries
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (
        key.startsWith('perf_') ||
        key.startsWith('brinson_') ||
        key.startsWith('carhart_') ||
        key.startsWith('risk_adj_')
      ) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Export singleton instance
export const performanceMeasurementEngine = new PerformanceMeasurementEngine({
  cacheTimeout: 300000,
  precision: 6,
  confidenceLevel: 0.95
});

export default PerformanceMeasurementEngine;
