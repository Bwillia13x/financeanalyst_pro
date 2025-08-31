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
    const cacheKey = `var_${JSON.stringify({portfolio, confidenceLevel, timeHorizon, method})}`;
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
      let assetImpacts = [];

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
      portfolio: portfolio,
      stressTestResults: results,
      worstCase: results.reduce((worst, current) =>
        Math.abs(current.portfolioImpact) > Math.abs(worst.portfolioImpact) ? current : worst
      ),
      timestamp: Date.now()
    };
  }

  // Risk Attribution - Decompose portfolio risk by factors
  riskAttribution(portfolio, factors) {
    const { assets, weights, covarianceMatrix } = portfolio;

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
          const exposure_i = factorExposures[i][factor.name] || 0;
          const exposure_j = factorExposures[j][factor.name] || 0;
          const weight_i = weights[i];
          const weight_j = weights[j];

          contribution += weight_i * weight_j * exposure_i * exposure_j * factorCovariance[factorIndex][factorIndex];
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
      targetVolatility,
      benchmarkWeights
    } = constraints;

    // This is a simplified factor optimization
    // In practice, this would use more sophisticated optimization algorithms

    const numAssets = targetFactors[0].exposures.length;
    let weights = new Array(numAssets).fill(1 / numAssets); // Start with equal weights

    // Optimize weights to match target factor exposures
    for (let iteration = 0; iteration < 100; iteration++) {
      let gradient = new Array(numAssets).fill(0);

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

  // Normal inverse CDF approximation
  normalInverseCDF(p) {
    // Using approximation formula
    if (p <= 0 || p >= 1) return 0;

    const a1 = -39.6968302866538;
    const a2 = 220.946098424521;
    const a3 = -275.928510446969;
    const a4 = 138.357751867269;
    const a5 = -30.6647980661472;
    const a6 = 2.50662827745924;

    const b1 = -54.4760987982241;
    const b2 = 161.585836858041;
    const b3 = -155.698979859887;
    const b4 = 66.8013118877197;
    const b5 = -13.2806815528857;

    const c1 = -7.78489400243029E-03;
    const c2 = -0.322396458041136;
    const c3 = -2.40075827716184;
    const c4 = -2.54973253934373;
    const c5 = 4.37466414146497;
    const c6 = 2.93816398269878;

    const d1 = 7.78469570904146E-03;
    const d2 = 0.32246712907004;
    const d3 = 2.445134137143;
    const d4 = 3.75440866190742;

    const q = p - 0.5;

    let r;
    if (Math.abs(q) <= 0.42) {
      r = q * q;
      return q * (((a6 * r + a5) * r + a4) * r + a3) * r + a2) * r + a1 /
                 ((((b5 * r + b4) * r + b3) * r + b2) * r + b1) * r + 1);
    } else {
      r = q < 0 ? p : 1 - p;
      r = Math.log(-Math.log(r));
      const numerator = ((c6 * r + c5) * r + c4) * r + c3) * r + c2) * r + c1;
      const denominator = ((d4 * r + d3) * r + d2) * r + d1) * r + 1;
      return q < 0 ? -numerator / denominator : numerator / denominator;
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

    for (let i = 0; i < assets.length; i++) {
      let marginalVaR = 0;
      for (let j = 0; j < assets.length; j++) {
        marginalVaR += covarianceMatrix[i][j] * weights[j];
      }

      const assetVaR = (weights[i] * marginalVaR / portfolio.portfolioVolatility) * totalVaR;
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
      const portfolioWeight = asset.weight || 0;

      if (benchmarkWeight > 0) {
        const benchmarkReturn = benchmark.returns[asset.symbol] || 0;
        const portfolioReturn = asset.returns?.[period] || 0;

        selectionEffect += benchmarkWeight * (portfolioReturn - benchmarkReturn);
      }
    });

    return selectionEffect;
  }

  // Calculate asset allocation effect
  calculateAssetAllocation(assets, benchmark, period) {
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
