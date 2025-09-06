// Advanced Portfolio Analytics Service
// Provides VaR, stress testing, risk attribution, and factor investing capabilities
class PortfolioAnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
    this.factorReturns = new Map(); // Store factor return data
  }

  // Calculate Value at Risk (VaR) using multiple methodologies
  calculateVaR(portfolio, confidenceLevel = 0.95, timeHorizon = 1, method = 'parametric') {
    const cacheKey = `var_${JSON.stringify({ portfolio, confidenceLevel, timeHorizon, method })}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let result;

    switch (method) {
      case 'parametric':
        result = this.parametricVaR(portfolio, confidenceLevel, timeHorizon);
        break;
      case 'historical':
        result = this.historicalVaR(portfolio, confidenceLevel, timeHorizon);
        break;
      case 'monte_carlo':
        result = this.monteCarloVaR(portfolio, confidenceLevel, timeHorizon);
        break;
      default:
        throw new Error(`Unknown VaR method: ${method}`);
    }

    this.cache.set(cacheKey, result);
    setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);

    return result;
  }

  // Parametric VaR calculation (assumes normal distribution)
  parametricVaR(portfolio, confidenceLevel, timeHorizon) {
    const { assets, weights, covarianceMatrix } = portfolio;

    if (!assets || !weights || !covarianceMatrix) {
      throw new Error('Portfolio must include assets, weights, and covariance matrix');
    }

    // Calculate portfolio variance
    let portfolioVariance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        portfolioVariance += weights[i] * weights[j] * covarianceMatrix[i][j];
      }
    }

    const portfolioVolatility = Math.sqrt(portfolioVariance);
    const zScore = this.normalInverseCDF(confidenceLevel);

    // Calculate VaR
    const portfolioValue = assets.reduce((sum, asset, index) =>
      sum + asset.price * asset.quantity * weights[index], 0
    );

    const var95 = portfolioValue * Math.abs(zScore) * portfolioVolatility * Math.sqrt(timeHorizon);
    const expectedShortfall = this.calculateExpectedShortfall(portfolioValue, portfolioVolatility, timeHorizon, confidenceLevel);

    return {
      var: var95,
      expectedShortfall,
      confidenceLevel,
      timeHorizon,
      method: 'parametric',
      portfolioValue,
      portfolioVolatility,
      components: this.decomposeVaR(portfolio, var95),
      timestamp: Date.now()
    };
  }

  // Historical VaR using actual historical returns
  historicalVaR(portfolio, confidenceLevel, timeHorizon) {
    const { assets, historicalReturns } = portfolio;

    if (!historicalReturns || historicalReturns.length === 0) {
      throw new Error('Historical returns data required for historical VaR');
    }

    // Calculate historical portfolio returns
    const portfolioReturns = [];
    for (let i = 0; i < historicalReturns[0].length; i++) {
      let portfolioReturn = 0;
      for (let j = 0; j < assets.length; j++) {
        const weight = assets[j].weight || (1 / assets.length); // Equal weight if not specified
        portfolioReturn += weight * historicalReturns[j][i];
      }
      portfolioReturns.push(portfolioReturn);
    }

    // Sort returns and find the appropriate percentile
    const sortedReturns = portfolioReturns.sort((a, b) => a - b);
    const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const varReturn = sortedReturns[index];

    const portfolioValue = assets.reduce((sum, asset) =>
      sum + asset.price * (asset.quantity || 1), 0
    );

    const var95 = Math.abs(varReturn) * portfolioValue * Math.sqrt(timeHorizon);

    return {
      var: var95,
      confidenceLevel,
      timeHorizon,
      method: 'historical',
      portfolioValue,
      historicalReturns: portfolioReturns,
      timestamp: Date.now()
    };
  }

  // Monte Carlo VaR simulation
  monteCarloVaR(portfolio, confidenceLevel, timeHorizon, simulations = 10000) {
    const { assets, weights, covarianceMatrix } = portfolio;

    // Generate random scenarios using Cholesky decomposition
    const choleskyMatrix = this.choleskyDecomposition(covarianceMatrix);
    const scenarios = [];

    for (let sim = 0; sim < simulations; sim++) {
      // Generate random normal variables
      const randomVars = [];
      for (let i = 0; i < assets.length; i++) {
        randomVars.push(this.generateNormalRandom());
      }

      // Transform to correlated returns
      const correlatedReturns = [];
      for (let i = 0; i < assets.length; i++) {
        let correlatedReturn = 0;
        for (let j = 0; j <= i; j++) {
          correlatedReturn += choleskyMatrix[i][j] * randomVars[j];
        }
        correlatedReturns.push(correlatedReturn);
      }

      scenarios.push(correlatedReturns);
    }

    // Calculate portfolio returns for each scenario
    const portfolioReturns = scenarios.map(scenario => {
      let portfolioReturn = 0;
      for (let i = 0; i < assets.length; i++) {
        portfolioReturn += weights[i] * scenario[i];
      }
      return portfolioReturn * Math.sqrt(timeHorizon);
    });

    // Sort and find VaR
    portfolioReturns.sort((a, b) => a - b);
    const index = Math.floor((1 - confidenceLevel) * portfolioReturns.length);
    const varReturn = portfolioReturns[index];

    const portfolioValue = assets.reduce((sum, asset, index) =>
      sum + asset.price * (asset.quantity || 1) * weights[index], 0
    );

    const var95 = Math.abs(varReturn) * portfolioValue;

    return {
      var: var95,
      confidenceLevel,
      timeHorizon,
      method: 'monte_carlo',
      portfolioValue,
      simulations,
      scenarios: portfolioReturns.slice(0, 100), // Store first 100 scenarios for analysis
      timestamp: Date.now()
    };
  }

  // Stress Testing - Apply various market scenarios
  stressTestPortfolio(portfolio, scenarios) {
    const { assets, weights } = portfolio;
    const results = [];

    for (const scenario of scenarios) {
      const { name, shocks } = scenario;

      // Calculate portfolio impact
      let portfolioImpact = 0;
      const assetImpacts = [];

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        const weight = weights[i];
        const shock = shocks[asset.symbol] || 0;

        // Calculate impact based on shock type
        let impact = 0;
        if (scenario.type === 'absolute') {
          impact = shock;
        } else if (scenario.type === 'percentage') {
          impact = asset.price * shock;
        } else if (scenario.type === 'volatility') {
          // Impact based on volatility shock (simplified)
          impact = asset.price * shock * asset.volatility * Math.sqrt(scenario.timeHorizon || 1);
        }

        portfolioImpact += weight * impact;
        assetImpacts.push({
          symbol: asset.symbol,
          impact,
          weight,
          weightedImpact: weight * impact
        });
      }

      results.push({
        scenario: name,
        portfolioImpact,
        assetImpacts,
        impactPercentage: (portfolioImpact / portfolio.portfolioValue) * 100
      });
    }

    return {
      portfolio,
      stressTestResults: results,
      worstCase: results.reduce((worst, current) =>
        Math.abs(current.portfolioImpact) > Math.abs(worst.portfolioImpact) ? current : worst
      ),
      timestamp: Date.now()
    };
  }

  // Risk Attribution - Decompose portfolio risk by factors
  riskAttribution(portfolio, factors) {
    const { assets, weights } = portfolio;

    // Calculate factor exposures for each asset
    const factorExposures = assets.map(asset => {
      const exposures = {};
      factors.forEach(factor => {
        exposures[factor.name] = asset[factor.name] || 0;
      });
      return exposures;
    });

    // Calculate factor covariance matrix
    const factorCovariance = this.calculateFactorCovarianceMatrix(factors);

    // Calculate factor contributions to portfolio risk
    const factorContributions = {};
    let totalRisk = 0;

    factors.forEach((factor, factorIndex) => {
      let contribution = 0;

      for (let i = 0; i < assets.length; i++) {
        for (let j = 0; j < assets.length; j++) {
          const exposureI = factorExposures[i][factor.name] || 0;
          const exposureJ = factorExposures[j][factor.name] || 0;
          const weightI = weights[i];
          const weightJ = weights[j];

          contribution += weightI * weightJ * exposureI * exposureJ * factorCovariance[factorIndex][factorIndex];
        }
      }

      factorContributions[factor.name] = Math.sqrt(contribution);
      totalRisk += contribution;
    });

    totalRisk = Math.sqrt(totalRisk);

    // Calculate percentage contributions
    const percentageContributions = {};
    Object.keys(factorContributions).forEach(factor => {
      percentageContributions[factor] = (factorContributions[factor] / totalRisk) * 100;
    });

    return {
      totalPortfolioRisk: totalRisk,
      factorContributions,
      percentageContributions,
      factors,
      timestamp: Date.now()
    };
  }

  // Factor Investing - Optimize portfolio based on factors
  factorOptimization(targetFactors, constraints = {}) {
    const {
      maxWeight = 1.0,
      minWeight = 0.0,
      targetVolatility: _targetVolatility,
      benchmarkWeights: _benchmarkWeights
    } = constraints;

    // This is a simplified factor optimization
    // In practice, this would use more sophisticated optimization algorithms

    const numAssets = targetFactors[0].exposures.length;
    let weights = new Array(numAssets).fill(1 / numAssets); // Start with equal weights

    // Optimize weights to match target factor exposures
    for (let iteration = 0; iteration < 100; iteration++) {
      const gradient = new Array(numAssets).fill(0);

      // Calculate factor exposure mismatch
      targetFactors.forEach(factor => {
        const currentExposure = weights.reduce((sum, weight, index) =>
          sum + weight * factor.exposures[index], 0
        );

        const targetExposure = factor.target;
        const mismatch = targetExposure - currentExposure;

        // Update weights based on gradient
        for (let i = 0; i < numAssets; i++) {
          gradient[i] += mismatch * factor.exposures[i] * factor.importance;
        }
      });

      // Apply gradient descent
      const learningRate = 0.01;
      for (let i = 0; i < numAssets; i++) {
        weights[i] += learningRate * gradient[i];

        // Apply constraints
        weights[i] = Math.max(minWeight, Math.min(maxWeight, weights[i]));
      }

      // Normalize weights
      const sum = weights.reduce((a, b) => a + b, 0);
      weights = weights.map(w => w / sum);
    }

    return {
      optimizedWeights: weights,
      targetFactors,
      constraints,
      timestamp: Date.now()
    };
  }

  // Performance Attribution Analysis
  performanceAttribution(portfolio, benchmark, period = 'monthly') {
    const { assets, returns } = portfolio;
    const { benchmarkReturns } = benchmark;

    if (!returns || !benchmarkReturns) {
      throw new Error('Portfolio and benchmark returns required for attribution analysis');
    }

    // Calculate total returns
    const portfolioReturn = this.calculateTotalReturn(returns);
    const benchmarkReturn = this.calculateTotalReturn(benchmarkReturns);

    // Calculate excess return
    const excessReturn = portfolioReturn - benchmarkReturn;

    // Security selection effect
    const securitySelection = this.calculateSecuritySelection(assets, benchmark, period);

    // Asset allocation effect
    const assetAllocation = this.calculateAssetAllocation(assets, benchmark, period);

    // Interaction effect (cross effects)
    const interaction = excessReturn - securitySelection - assetAllocation;

    return {
      portfolioReturn,
      benchmarkReturn,
      excessReturn,
      attribution: {
        securitySelection,
        assetAllocation,
        interaction
      },
      period,
      timestamp: Date.now()
    };
  }

  // Helper Methods

  // Cholesky decomposition for Monte Carlo simulation
  choleskyDecomposition(matrix) {
    const n = matrix.length;
    const L = Array(n).fill().map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let sum = 0;
        for (let k = 0; k < j; k++) {
          sum += L[i][k] * L[j][k];
        }

        if (i === j) {
          L[i][j] = Math.sqrt(matrix[i][i] - sum);
        } else {
          L[i][j] = (matrix[i][j] - sum) / L[j][j];
        }
      }
    }

    return L;
  }

  // Generate normal random variable using Box-Muller transform
  generateNormalRandom() {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  // Normal inverse CDF approximation (Acklam's approximation)
  normalInverseCDF(p) {
    if (p <= 0 || p >= 1) {
      throw new Error('Probability p must be in the open interval (0, 1)');
    }

    const a1 = -39.69683028665376;
    const a2 = 220.9460984245205;
    const a3 = -275.9285104469687;
    const a4 = 138.3577518672690;
    const a5 = -30.66479806614716;
    const a6 = 2.506628277459239;

    const b1 = -54.47609879822406;
    const b2 = 161.5858368580409;
    const b3 = -155.6989798598866;
    const b4 = 66.80131188771972;
    const b5 = -13.28068155288572;

    const c1 = -0.007784894002430293;
    const c2 = -0.3223964580411365;
    const c3 = -2.400758277161838;
    const c4 = -2.549732539343734;
    const c5 = 4.374664141464968;
    const c6 = 2.938163982698783;

    const d1 = 0.007784695709041462;
    const d2 = 0.3224671290700398;
    const d3 = 2.445134137142996;
    const d4 = 3.754408661907416;

    const plow = 0.02425;
    const phigh = 1 - plow;

    let q, r;
    if (p < plow) {
      // Rational approximation for lower region
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
             ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    } else if (p > phigh) {
      // Rational approximation for upper region
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
              ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    } else {
      // Rational approximation for central region
      q = p - 0.5;
      r = q * q;
      return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
             (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    }
  }

  // Calculate Expected Shortfall
  calculateExpectedShortfall(portfolioValue, volatility, timeHorizon, confidenceLevel) {
    const zScore = this.normalInverseCDF(confidenceLevel);
    const es = portfolioValue * volatility * Math.sqrt(timeHorizon) * Math.abs(zScore) /
               (1 - confidenceLevel) * Math.exp(-0.5 * zScore * zScore) / Math.sqrt(2 * Math.PI);
    return es;
  }

  // Decompose VaR by asset
  decomposeVaR(portfolio, totalVaR) {
    const { assets, weights, covarianceMatrix } = portfolio;
    const components = [];

    // Compute portfolio volatility locally
    let portfolioVariance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        portfolioVariance += weights[i] * weights[j] * covarianceMatrix[i][j];
      }
    }
    const portfolioVolatility = Math.sqrt(portfolioVariance) || 1e-12;

    for (let i = 0; i < assets.length; i++) {
      let marginalVaR = 0;
      for (let j = 0; j < assets.length; j++) {
        marginalVaR += covarianceMatrix[i][j] * weights[j];
      }

      const assetVaR = (weights[i] * marginalVaR / portfolioVolatility) * totalVaR;
      const percentageContribution = (assetVaR / totalVaR) * 100;

      components.push({
        asset: assets[i].symbol,
        varContribution: assetVaR,
        percentageContribution,
        weight: weights[i]
      });
    }

    return components;
  }

  // Calculate factor covariance matrix
  calculateFactorCovarianceMatrix(factors) {
    const n = factors.length;
    const covariance = Array(n).fill().map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      covariance[i][i] = factors[i].variance || 1;
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          covariance[i][j] = factors[i].correlation?.[j] || 0;
        }
      }
    }

    return covariance;
  }

  // Calculate total return from return series
  calculateTotalReturn(returns) {
    return returns.reduce((product, ret) => product * (1 + ret), 1) - 1;
  }

  // Calculate security selection effect
  calculateSecuritySelection(assets, benchmark, period) {
    // Simplified security selection calculation
    let selectionEffect = 0;

    assets.forEach(asset => {
      const benchmarkWeight = benchmark.weights[asset.symbol] || 0;

      if (benchmarkWeight > 0) {
        const benchmarkReturn = benchmark.returns[asset.symbol] || 0;
        const portfolioReturn = asset.returns?.[period] || 0;

        selectionEffect += benchmarkWeight * (portfolioReturn - benchmarkReturn);
      }
    });

    return selectionEffect;
  }

  // Calculate asset allocation effect
  calculateAssetAllocation(assets, benchmark, _period) {
    // Simplified asset allocation calculation
    let allocationEffect = 0;

    Object.keys(benchmark.weights).forEach(asset => {
      const benchmarkWeight = benchmark.weights[asset];
      const portfolioWeight = assets.find(a => a.symbol === asset)?.weight || 0;
      const benchmarkReturn = benchmark.returns[asset] || 0;

      allocationEffect += (portfolioWeight - benchmarkWeight) * benchmarkReturn;
    });

    return allocationEffect;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    this.factorReturns.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
const portfolioAnalyticsService = new PortfolioAnalyticsService();

// Export for use in components
export default portfolioAnalyticsService;

// Export class for testing
export { PortfolioAnalyticsService };
