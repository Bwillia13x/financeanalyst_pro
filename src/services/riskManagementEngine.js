/**
 * Advanced Risk Management Engine
 * VaR, stress testing, portfolio risk analytics, and regulatory risk measures
 */

class RiskManagementEngine {
  constructor() {
    this.historicalData = new Map();
    this.correlationMatrix = new Map();
    this.riskModels = new Map();
    this.stressScenarios = new Map();
  }

  /**
   * Value at Risk (VaR) Calculations
   */

  // Historical VaR using historical simulation
  calculateHistoricalVaR(returns, confidenceLevel = 0.95, holdingPeriod = 1) {
    if (!returns || returns.length === 0) {
      throw new Error('No return data provided');
    }

    const sortedReturns = [...returns].sort((a, b) => a - b);
    const percentileIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const var_ = -sortedReturns[percentileIndex];

    // Scale for holding period
    const scaledVaR = var_ * Math.sqrt(holdingPeriod);

    // Calculate Expected Shortfall (Conditional VaR)
    const tailReturns = sortedReturns.slice(0, percentileIndex + 1);
    const expectedShortfall = -tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length;

    return {
      var: scaledVaR,
      expectedShortfall: expectedShortfall * Math.sqrt(holdingPeriod),
      confidenceLevel,
      holdingPeriod,
      worstReturn: -sortedReturns[0],
      percentileReturn: -sortedReturns[percentileIndex],
      sampleSize: returns.length,
      method: 'Historical Simulation'
    };
  }

  // Parametric VaR using normal distribution
  calculateParametricVaR(mean, volatility, confidenceLevel = 0.95, holdingPeriod = 1) {
    const zScore = this.getZScore(confidenceLevel);
    const var_ = -(mean * holdingPeriod - zScore * volatility * Math.sqrt(holdingPeriod));

    // Expected Shortfall for normal distribution
    const phi = this.normalPDF(zScore);
    const expectedShortfall = -(mean * holdingPeriod) + (volatility * Math.sqrt(holdingPeriod) * phi) / (1 - confidenceLevel);

    return {
      var: var_,
      expectedShortfall,
      confidenceLevel,
      holdingPeriod,
      mean,
      volatility,
      zScore,
      method: 'Parametric (Normal)'
    };
  }

  // Monte Carlo VaR
  calculateMonteCarloVaR(mean, volatility, confidenceLevel = 0.95, holdingPeriod = 1, simulations = 10000) {
    const returns = [];

    for (let i = 0; i < simulations; i++) {
      const randomReturns = this.generateRandomPath(mean, volatility, holdingPeriod);
      const totalReturn = randomReturns.reduce((sum, ret) => sum + ret, 0);
      returns.push(totalReturn);
    }

    return this.calculateHistoricalVaR(returns, confidenceLevel, 1);
  }

  /**
   * Portfolio Risk Analytics
   */

  calculatePortfolioRisk(positions, covarianceMatrix, confidenceLevel = 0.95) {
    const weights = positions.map(pos => pos.weight);
    const expectedReturns = positions.map(pos => pos.expectedReturn);

    // Portfolio expected return
    const portfolioReturn = weights.reduce((sum, weight, i) => sum + weight * expectedReturns[i], 0);

    // Portfolio variance using matrix multiplication: w^T * Σ * w
    let portfolioVariance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        portfolioVariance += weights[i] * weights[j] * covarianceMatrix[i][j];
      }
    }

    const portfolioVolatility = Math.sqrt(portfolioVariance);

    // Component VaR - marginal contribution to portfolio risk
    const componentVaR = weights.map((weight, i) => {
      let marginalVaR = 0;
      for (let j = 0; j < weights.length; j++) {
        marginalVaR += weights[j] * covarianceMatrix[i][j];
      }
      return (weight * marginalVaR) / portfolioVariance;
    });

    // Risk attribution
    const totalMarketValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    const riskContribution = positions.map((pos, i) => ({
      asset: pos.symbol,
      weight: pos.weight,
      marketValue: pos.marketValue,
      componentVaR: componentVaR[i],
      percentageContribution: (componentVaR[i] / portfolioVariance) * 100,
      marginalVaR: this.calculateMarginalVaR(positions, covarianceMatrix, i),
      beta: this.calculatePortfolioBeta(positions, covarianceMatrix, i)
    }));

    const portfolioVaR = this.calculateParametricVaR(portfolioReturn, portfolioVolatility, confidenceLevel);

    return {
      portfolioMetrics: {
        expectedReturn: portfolioReturn,
        volatility: portfolioVolatility,
        sharpeRatio: portfolioReturn / portfolioVolatility,
        ...portfolioVaR
      },
      riskContribution,
      diversificationRatio: this.calculateDiversificationRatio(weights, covarianceMatrix),
      concentrationRisk: this.calculateConcentrationRisk(weights)
    };
  }

  /**
   * Stress Testing
   */

  // Historical stress testing
  performHistoricalStressTest(portfolio, stressEvents) {
    const results = stressEvents.map(event => {
      const scenarioReturns = event.assetReturns;
      let portfolioReturn = 0;

      portfolio.forEach((position, index) => {
        portfolioReturn += position.weight * (scenarioReturns[index] || 0);
      });

      return {
        eventName: event.name,
        eventDate: event.date,
        portfolioReturn,
        portfolioValue: portfolio.reduce((sum, pos) => sum + pos.marketValue, 0) * (1 + portfolioReturn),
        description: event.description
      };
    });

    return {
      stressTestResults: results,
      worstCase: results.reduce((worst, current) =>
        current.portfolioReturn < worst.portfolioReturn ? current : worst
      ),
      averageStressReturn: results.reduce((sum, result) => sum + result.portfolioReturn, 0) / results.length
    };
  }

  // Monte Carlo stress testing
  performMonteCarloStressTest(portfolio, stressParameters, simulations = 1000) {
    const results = [];

    for (let i = 0; i < simulations; i++) {
      let portfolioReturn = 0;
      const assetReturns = [];

      portfolio.forEach((position, index) => {
        // Generate stressed return based on parameters
        const stressedReturn = this.generateStressedReturn(
          position.expectedReturn,
          position.volatility,
          stressParameters.shocks[index] || { factor: 1, correlation: 0 }
        );

        assetReturns.push(stressedReturn);
        portfolioReturn += position.weight * stressedReturn;
      });

      results.push({
        simulation: i + 1,
        portfolioReturn,
        assetReturns
      });
    }

    // Analyze results
    const sortedReturns = results.map(r => r.portfolioReturn).sort((a, b) => a - b);

    return {
      simulations: results.length,
      worstCase: sortedReturns[0],
      bestCase: sortedReturns[sortedReturns.length - 1],
      percentiles: {
        p1: sortedReturns[Math.floor(0.01 * sortedReturns.length)],
        p5: sortedReturns[Math.floor(0.05 * sortedReturns.length)],
        p10: sortedReturns[Math.floor(0.10 * sortedReturns.length)]
      },
      meanReturn: sortedReturns.reduce((sum, ret) => sum + ret, 0) / sortedReturns.length,
      volatility: this.calculateVolatility(sortedReturns)
    };
  }

  /**
   * Risk Factor Models
   */

  // Multi-factor risk model
  buildFactorModel(assetReturns, factorReturns) {
    const factors = Object.keys(factorReturns);
    const assets = Object.keys(assetReturns);

    const factorLoadings = {};
    const specificRisk = {};

    assets.forEach(asset => {
      const regression = this.multipleRegression(
        assetReturns[asset],
        factors.map(factor => factorReturns[factor])
      );

      factorLoadings[asset] = {
        alpha: regression.alpha,
        betas: regression.betas,
        rSquared: regression.rSquared,
        tStats: regression.tStats
      };

      specificRisk[asset] = regression.residualVolatility;
    });

    return {
      factorLoadings,
      specificRisk,
      factors,
      factorCovariance: this.calculateFactorCovariance(factorReturns),
      riskAttribution: this.calculateFactorRiskAttribution(factorLoadings, factorReturns)
    };
  }

  /**
   * Liquidity Risk
   */

  calculateLiquidityRisk(positions, marketData) {
    return positions.map(position => {
      const market = marketData[position.symbol] || {};

      const bidAskSpread = (market.ask - market.bid) / market.mid;
      const volumeRatio = position.marketValue / (market.avgVolume * market.price);

      // Liquidity-adjusted VaR
      const liquidityHorizon = this.calculateLiquidityHorizon(volumeRatio, market.avgVolume);
      const liquidityPremium = bidAskSpread * 0.5 + Math.sqrt(liquidityHorizon) * 0.01;

      return {
        symbol: position.symbol,
        liquidityScore: this.calculateLiquidityScore(market),
        bidAskSpread,
        volumeRatio,
        liquidityHorizon,
        liquidityPremium,
        liquidityAdjustedVaR: position.var * (1 + liquidityPremium),
        marketImpactCost: this.calculateMarketImpact(position.marketValue, market)
      };
    });
  }

  /**
   * Regulatory Risk Measures
   */

  // Basel III risk metrics
  calculateBaselIIIMetrics(portfolio, riskWeights) {
    const riskWeightedAssets = portfolio.reduce((total, position) => {
      const riskWeight = riskWeights[position.assetClass] || 1.0;
      return total + position.marketValue * riskWeight;
    }, 0);

    const tier1Capital = portfolio.reduce((total, position) => {
      return total + (position.tier1Eligible ? position.marketValue : 0);
    }, 0);

    return {
      riskWeightedAssets,
      tier1Capital,
      tier1Ratio: tier1Capital / riskWeightedAssets,
      leverageRatio: tier1Capital / portfolio.reduce((sum, pos) => sum + pos.marketValue, 0),
      minimumCapitalRequirement: riskWeightedAssets * 0.08,
      capitalSurplus: tier1Capital - (riskWeightedAssets * 0.08)
    };
  }

  /**
   * Credit Risk
   */

  calculateCreditRisk(creditExposures) {
    return creditExposures.map(exposure => {
      const pd = exposure.probabilityOfDefault;
      const lgd = exposure.lossGivenDefault;
      const ead = exposure.exposureAtDefault;

      const expectedLoss = pd * lgd * ead;
      const unexpectedLoss = Math.sqrt(pd * (1 - pd)) * lgd * ead;

      return {
        counterparty: exposure.counterparty,
        rating: exposure.rating,
        expectedLoss,
        unexpectedLoss,
        capitalCharge: unexpectedLoss * 12.5, // Basel capital multiplier
        riskContribution: expectedLoss / creditExposures.reduce((sum, exp) => sum + exp.exposureAtDefault, 0)
      };
    });
  }

  /**
   * Utility Functions
   */

  generateRandomPath(mean, volatility, periods) {
    const path = [];
    for (let i = 0; i < periods; i++) {
      const random = this.boxMullerRandom();
      path.push(mean + volatility * random);
    }
    return path;
  }

  generateStressedReturn(expectedReturn, volatility, shock) {
    const baseReturn = expectedReturn + volatility * this.boxMullerRandom();
    return baseReturn * shock.factor + shock.correlation * volatility;
  }

  calculateMarginalVaR(positions, covarianceMatrix, assetIndex) {
    let marginal = 0;
    for (let j = 0; j < positions.length; j++) {
      marginal += positions[j].weight * covarianceMatrix[assetIndex][j];
    }
    return marginal;
  }

  calculatePortfolioBeta(positions, covarianceMatrix, assetIndex) {
    const portfolioVariance = this.calculatePortfolioVariance(positions, covarianceMatrix);
    const covariance = this.calculateMarginalVaR(positions, covarianceMatrix, assetIndex);
    return covariance / portfolioVariance;
  }

  calculatePortfolioVariance(positions, covarianceMatrix) {
    const weights = positions.map(pos => pos.weight);
    let variance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        variance += weights[i] * weights[j] * covarianceMatrix[i][j];
      }
    }
    return variance;
  }

  calculateDiversificationRatio(weights, covarianceMatrix) {
    const weightedAvgVol = weights.reduce((sum, weight, i) =>
      sum + weight * Math.sqrt(covarianceMatrix[i][i]), 0
    );
    const portfolioVol = Math.sqrt(this.calculatePortfolioVariance(
      weights.map((w, i) => ({ weight: w })),
      covarianceMatrix
    ));
    return weightedAvgVol / portfolioVol;
  }

  calculateConcentrationRisk(weights) {
    const herfindahlIndex = weights.reduce((sum, weight) => sum + weight * weight, 0);
    return {
      herfindahlIndex,
      effectiveNumberOfAssets: 1 / herfindahlIndex,
      maxWeight: Math.max(...weights),
      top5Concentration: weights
        .sort((a, b) => b - a)
        .slice(0, 5)
        .reduce((sum, weight) => sum + weight, 0)
    };
  }

  calculateVolatility(returns) {
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
    return Math.sqrt(variance);
  }

  calculateLiquidityScore(marketData) {
    const volumeScore = Math.min(marketData.avgVolume / 1000000, 1); // Normalize to $1M
    const spreadScore = Math.max(0, 1 - (marketData.bidAskSpread || 0.02) / 0.05);
    const depthScore = Math.min((marketData.marketDepth || 100000) / 1000000, 1);

    return (volumeScore + spreadScore + depthScore) / 3;
  }

  calculateLiquidityHorizon(volumeRatio, avgVolume) {
    if (volumeRatio <= 0.1) return 1; // Can liquidate in 1 day
    if (volumeRatio <= 0.25) return 5; // 1 week
    if (volumeRatio <= 0.5) return 20; // 1 month
    return 60; // 3 months
  }

  calculateMarketImpact(tradeSize, marketData) {
    const volumeRatio = tradeSize / (marketData.avgVolume * marketData.price);
    return Math.sqrt(volumeRatio) * (marketData.bidAskSpread || 0.02) * 0.5;
  }

  multipleRegression(dependentVar, independentVars) {
    // Simplified multiple regression - in practice would use proper matrix operations
    const n = dependentVar.length;
    const k = independentVars.length;

    // This is a placeholder - real implementation would use matrix algebra
    const betas = independentVars.map(() => Math.random() * 0.1);
    const alpha = Math.random() * 0.01;

    return {
      alpha,
      betas,
      rSquared: 0.7, // Placeholder
      tStats: betas.map(() => 2.5), // Placeholder
      residualVolatility: 0.15 // Placeholder
    };
  }

  calculateFactorCovariance(factorReturns) {
    // Calculate covariance matrix of factor returns
    const factors = Object.keys(factorReturns);
    const matrix = {};

    factors.forEach(factor1 => {
      matrix[factor1] = {};
      factors.forEach(factor2 => {
        matrix[factor1][factor2] = this.calculateCovariance(
          factorReturns[factor1],
          factorReturns[factor2]
        );
      });
    });

    return matrix;
  }

  calculateFactorRiskAttribution(factorLoadings, factorReturns) {
    // Calculate risk contribution from each factor
    return Object.keys(factorLoadings).map(asset => ({
      asset,
      factorRisk: Object.keys(factorReturns).reduce((risk, factor, index) => {
        const beta = factorLoadings[asset].betas[index];
        const factorVol = this.calculateVolatility(factorReturns[factor]);
        return risk + Math.pow(beta * factorVol, 2);
      }, 0),
      specificRisk: Math.pow(factorLoadings[asset].residualVolatility || 0.1, 2)
    }));
  }

  calculateCovariance(series1, series2) {
    const n = Math.min(series1.length, series2.length);
    const mean1 = series1.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const mean2 = series2.slice(0, n).reduce((sum, val) => sum + val, 0) / n;

    return series1.slice(0, n).reduce((sum, val, i) => {
      return sum + (val - mean1) * (series2[i] - mean2);
    }, 0) / (n - 1);
  }

  getZScore(confidenceLevel) {
    // Approximate inverse normal distribution
    const z_scores = {
      0.90: 1.282,
      0.95: 1.645,
      0.99: 2.326
    };
    return z_scores[confidenceLevel] || 1.645;
  }

  normalPDF(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  boxMullerRandom() {
    if (this.spare !== undefined) {
      const value = this.spare;
      this.spare = undefined;
      return value;
    }

    const u = Math.random();
    const v = Math.random();
    const mag = Math.sqrt(-2 * Math.log(u));

    this.spare = mag * Math.cos(2 * Math.PI * v);
    return mag * Math.sin(2 * Math.PI * v);
  }
}

export default RiskManagementEngine;
