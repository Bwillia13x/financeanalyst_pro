import FinancialAnalyticsEngine from './FinancialAnalyticsEngine.js';

/**
 * Institutional-grade Risk Assessment Engine
 *
 * Advanced risk analysis capabilities including portfolio risk metrics,
 * stress testing, scenario analysis, and risk attribution
 */

class RiskAssessmentEngine extends FinancialAnalyticsEngine {
  constructor(options = {}) {
    super(options);
    this.stressTestScenarios = this.initializeStressScenarios();
  }

  // ===== STRESS TESTING =====

  /**
   * Initialize predefined stress test scenarios
   */
  initializeStressScenarios() {
    return {
      // Market Crash Scenarios
      '2008-crisis': {
        name: '2008 Financial Crisis',
        description: 'Severe market downturn similar to 2008',
        shocks: {
          equities: -0.5, // -50% equity shock
          bonds: -0.1, // -10% bond shock
          commodities: -0.6, // -60% commodity shock
          realEstate: -0.4 // -40% real estate shock
        },
        probability: 0.01
      },

      '2020-covid': {
        name: 'COVID-19 Crisis',
        description: 'Pandemic-induced market volatility',
        shocks: {
          equities: -0.34,
          bonds: 0.1, // Bonds actually gained value
          commodities: -0.3,
          volatility: 3.0 // Triple volatility
        },
        probability: 0.05
      },

      'tech-bubble': {
        name: 'Tech Bubble Burst',
        description: 'Technology sector collapse',
        shocks: {
          equities: -0.4,
          tech: -0.7, // Tech stocks -70%
          growth: -0.6, // Growth stocks -60%
          value: -0.2 // Value stocks -20%
        },
        probability: 0.03
      },

      // Interest Rate Scenarios
      'rate-hike': {
        name: 'Fed Rate Hike Cycle',
        description: 'Aggressive interest rate increases',
        shocks: {
          bonds: -0.15,
          realEstate: -0.25,
          duration: -0.3 // Long-duration assets hit hardest
        },
        probability: 0.1
      },

      'rate-cut': {
        name: 'Emergency Rate Cuts',
        description: 'Coordinated global rate cuts',
        shocks: {
          bonds: 0.08,
          equities: 0.12,
          realEstate: 0.15
        },
        probability: 0.05
      },

      // Geopolitical Scenarios
      'trade-war': {
        name: 'Global Trade War',
        description: 'Escalating trade conflicts',
        shocks: {
          globalStocks: -0.25,
          emergingMarkets: -0.4,
          commodities: -0.35,
          currencies: -0.15
        },
        probability: 0.08
      },

      'geopolitical-crisis': {
        name: 'Geopolitical Crisis',
        description: 'Major international conflict',
        shocks: {
          equities: -0.3,
          oil: 1.0, // Oil price doubles
          gold: 0.5, // Gold +50%
          volatility: 2.5
        },
        probability: 0.02
      }
    };
  }

  /**
   * Run comprehensive stress test on portfolio
   * @param {Array} assets - Portfolio assets
   * @param {Array} weights - Asset weights
   * @param {Object} scenario - Stress test scenario
   * @returns {Object} Stress test results
   */
  runStressTest(assets, weights, scenario) {
    const cacheKey = `stress_${scenario.name}_${assets.length}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    let baseline;
    let stressed;
    const stressedAssets = this.applyScenarioShocks(assets, scenario.shocks);

    // Helper to build minimal fallback portfolio metrics without VaR dependency
    const buildFallback = (srcAssets, srcWeights) => {
      const numPeriods = Math.min(
        ...srcAssets.map(a => (Array.isArray(a.returns) ? a.returns.length : 0))
      );
      const portfolioReturns = Array.from({ length: Math.max(0, numPeriods) }, (_, i) =>
        srcAssets.reduce((sum, a, idx) => sum + (srcWeights[idx] || 0) * (a.returns?.[i] || 0), 0)
      );
      const expectedReturn =
        portfolioReturns.length > 0
          ? portfolioReturns.reduce((s, r) => s + r, 0) / portfolioReturns.length
          : 0;
      const volatility = this.calculateVolatility(portfolioReturns);
      const cumulative = portfolioReturns.reduce((acc, r) => {
        const prev = acc.length === 0 ? 0 : acc[acc.length - 1];
        acc.push((1 + prev) * (1 + r) - 1);
        return acc;
      }, []);
      const maxDrawdown = this.calculateMaxDrawdown(cumulative.length ? cumulative : [0, 0]);
      return {
        portfolioReturns,
        assets: srcAssets.map((a, i) => ({ ...a, weight: srcWeights[i] })),
        correlations: this.calculateCorrelationMatrix(
          srcAssets.map((a, i) => ({ ...a, returns: a.returns || [] }))
        ),
        metrics: {
          expectedReturn,
          volatility,
          sharpeRatio: volatility === 0 ? (expectedReturn >= 0 ? Infinity : -Infinity) : expectedReturn / volatility,
          maxDrawdown,
          var: 0,
          expectedShortfall: 0
        }
      };
    };

    try {
      baseline = this.analyzePortfolio(assets, weights);
    } catch {
      baseline = buildFallback(assets, weights);
    }

    try {
      stressed = this.analyzePortfolio(stressedAssets, weights);
    } catch {
      stressed = buildFallback(stressedAssets, weights);
    }

    // Calculate impact metrics
    const impact = {
      returnImpact: stressed.metrics.expectedReturn - baseline.metrics.expectedReturn,
      volatilityImpact: stressed.metrics.volatility - baseline.metrics.volatility,
      varImpact: stressed.metrics.var - baseline.metrics.var,
      maxDrawdownImpact: stressed.metrics.maxDrawdown - baseline.metrics.maxDrawdown
    };

    // Calculate recovery time
    const recoveryTime = this.calculateRecoveryTime(
      baseline.portfolioReturns,
      stressed.portfolioReturns
    );

    const result = {
      scenario: scenario.name,
      description: scenario.description,
      probability: scenario.probability,
      baseline: baseline.metrics,
      stressed: stressed.metrics,
      impact: {
        returnImpact: this.round(impact.returnImpact),
        volatilityImpact: this.round(impact.volatilityImpact),
        varImpact: this.round(impact.varImpact),
        maxDrawdownImpact: this.round(impact.maxDrawdownImpact),
        returnImpactPercent:
          baseline.metrics.expectedReturn !== 0
            ? this.round((impact.returnImpact / Math.abs(baseline.metrics.expectedReturn)) * 100)
            : 0
      },
      recovery: {
        time: recoveryTime,
        timeUnit: 'months',
        probability: this.calculateRecoveryProbability(baseline.portfolioReturns, recoveryTime)
      },
      assetImpacts: this.calculateAssetStressImpacts(assets, stressedAssets, weights),
      riskMetrics: (() => {
        try {
          return this.calculateStressRiskMetrics(baseline, stressed, scenario);
        } catch {
          return {};
        }
      })()
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Apply scenario shocks to assets
   */
  applyScenarioShocks(assets, shocks) {
    return assets.map(asset => {
      let shockMultiplier = 1;

      // Apply asset-specific shocks
      if (shocks[asset.type] !== undefined) {
        shockMultiplier *= 1 + shocks[asset.type];
      }

      // Apply sector-specific shocks
      if (asset.sector && shocks[asset.sector.toLowerCase()] !== undefined) {
        shockMultiplier *= 1 + shocks[asset.sector.toLowerCase()];
      }

      // Apply global shocks
      if (shocks.equities && (asset.type === 'stock' || asset.type === 'equity')) {
        shockMultiplier *= 1 + shocks.equities;
      }

      if (shocks.bonds && asset.type === 'bond') {
        shockMultiplier *= 1 + shocks.bonds;
      }

      // Apply volatility shock
      const volatilityShock = shocks.volatility || 1;
      const newVolatility = asset.volatility * volatilityShock;

      return {
        ...asset,
        expectedReturn: asset.expectedReturn * shockMultiplier,
        volatility: newVolatility,
        shocked: true,
        shockMultiplier
      };
    });
  }

  /**
   * Calculate recovery time after stress event
   */
  calculateRecoveryTime(baselineReturns, stressedReturns) {
    const baselinePeak = Math.max(...baselineReturns);
    const stressedValue = stressedReturns[stressedReturns.length - 1];
    const recoveryTarget = baselinePeak * 0.95; // 95% of peak

    let recoveryMonths = 0;
    let currentValue = stressedValue;

    // Simulate recovery assuming mean reversion
    const meanReturn = baselineReturns.reduce((sum, r) => sum + r, 0) / baselineReturns.length;
    const volatility = this.calculateVolatility(baselineReturns);

    while (currentValue < recoveryTarget && recoveryMonths < 120) {
      // Max 10 years
      currentValue *= 1 + meanReturn + (Math.random() - 0.5) * volatility;
      recoveryMonths++;
    }

    return recoveryMonths;
  }

  /**
   * Calculate probability of recovery
   */
  calculateRecoveryProbability(baselineReturns, recoveryTime) {
    if (recoveryTime === 0) return 1;

    const meanReturn = baselineReturns.reduce((sum, r) => sum + r, 0) / baselineReturns.length;
    const volatility = this.calculateVolatility(baselineReturns);

    // Use log-normal distribution to estimate recovery probability
    const requiredReturn = Math.log(1 + meanReturn * recoveryTime);
    const stdDev = volatility * Math.sqrt(recoveryTime);

    // Probability of achieving required return
    const zScore = (requiredReturn - meanReturn * recoveryTime) / stdDev;

    // Use error function approximation for cumulative normal
    return this.cumulativeNormal(zScore);
  }

  /**
   * Cumulative normal distribution approximation
   */
  cumulativeNormal(x) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x) / Math.sqrt(2);

    const t = 1 / (1 + p * absX);
    const erf = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

    return 0.5 * (1 + sign * erf);
  }

  /**
   * Calculate asset-level stress impacts
   */
  calculateAssetStressImpacts(originalAssets, stressedAssets, weights) {
    return originalAssets.map((asset, index) => {
      const stressed = stressedAssets[index];
      const weight = weights[index];

      return {
        symbol: asset.symbol || `Asset ${index + 1}`,
        weight,
        originalReturn: asset.expectedReturn,
        stressedReturn: stressed.expectedReturn,
        returnImpact: stressed.expectedReturn - asset.expectedReturn,
        returnImpactPercent:
          asset.expectedReturn !== 0
            ? ((stressed.expectedReturn - asset.expectedReturn) / Math.abs(asset.expectedReturn)) *
              100
            : 0,
        originalVolatility: asset.volatility,
        stressedVolatility: stressed.volatility,
        volatilityImpact: stressed.volatility - asset.volatility,
        contributionToLoss: weight * (stressed.expectedReturn - asset.expectedReturn)
      };
    });
  }

  /**
   * Calculate comprehensive stress risk metrics
   */
  calculateStressRiskMetrics(baseline, stressed, scenario) {
    return {
      tailRisk: {
        extremeLossProbability: this.calculateExtremeLossProbability(
          stressed.portfolioReturns,
          -0.1
        ),
        blackSwanRisk: this.calculateBlackSwanRisk(stressed.portfolioReturns)
      },
      liquidityRisk: {
        estimatedLiquidityImpact: this.calculateLiquidityImpact(scenario),
        concentrationRisk: this.calculateConcentrationRisk(baseline.assets)
      },
      correlationRisk: {
        correlationBreakdown: this.calculateCorrelationBreakdown(baseline.correlations, scenario),
        contagionRisk: this.calculateContagionRisk(baseline.assets, scenario)
      }
    };
  }

  // ===== SCENARIO ANALYSIS =====

  /**
   * Run scenario analysis with multiple outcomes
   * @param {Array} assets - Portfolio assets
   * @param {Array} weights - Asset weights
   * @param {Array} scenarios - Array of scenarios to test
   * @returns {Object} Scenario analysis results
   */
  runScenarioAnalysis(assets, weights, scenarios = []) {
    const cacheKey = `scenario_analysis_${assets.length}_${scenarios.length}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const results = scenarios.map(scenario => this.runStressTest(assets, weights, scenario));

    // Calculate scenario statistics
    const scenarioStats = {
      bestCase: results.reduce((acc, current) =>
        !acc || current.impact.returnImpact > acc.impact.returnImpact ? current : acc
      , null),
      worstCase: results.reduce((acc, current) =>
        !acc || current.impact.returnImpact < acc.impact.returnImpact ? current : acc
      , null),
      averageImpact: {
        returnImpact: results.reduce((sum, r) => sum + r.impact.returnImpact, 0) / results.length,
        volatilityImpact:
          results.reduce((sum, r) => sum + r.impact.volatilityImpact, 0) / results.length,
        varImpact: results.reduce((sum, r) => sum + r.impact.varImpact, 0) / results.length
      },
      probabilityWeightedImpact: this.calculateProbabilityWeightedImpact(results)
    };

    const result = {
      scenarios: results,
      statistics: scenarioStats,
      riskProfile: this.assessRiskProfile(results),
      recommendations: this.generateRiskRecommendations(results)
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Calculate probability-weighted impact
   */
  calculateProbabilityWeightedImpact(results) {
    const totalProbability = results.reduce((sum, r) => sum + r.probability, 0);

    return {
      returnImpact:
        results.reduce((sum, r) => sum + r.impact.returnImpact * r.probability, 0) /
        totalProbability,
      volatilityImpact:
        results.reduce((sum, r) => sum + r.impact.volatilityImpact * r.probability, 0) /
        totalProbability,
      varImpact:
        results.reduce((sum, r) => sum + r.impact.varImpact * r.probability, 0) / totalProbability
    };
  }

  /**
   * Assess overall risk profile
   */
  assessRiskProfile(results) {
    const avgReturnImpact =
      results.reduce((sum, r) => sum + r.impact.returnImpact, 0) / results.length;
    const avgVolatilityImpact =
      results.reduce((sum, r) => sum + r.impact.volatilityImpact, 0) / results.length;
    const maxDrawdownImpact = Math.max(...results.map(r => r.impact.maxDrawdownImpact));

    let riskLevel = 'low';
    let riskScore = 0;

    // Calculate risk score based on impacts
    riskScore += Math.abs(avgReturnImpact) * 50; // Return impact weight
    riskScore += avgVolatilityImpact * 30; // Volatility impact weight
    riskScore += maxDrawdownImpact * 20; // Max drawdown weight

    if (riskScore > 75) riskLevel = 'very-high';
    else if (riskScore > 50) riskLevel = 'high';
    else if (riskScore > 25) riskLevel = 'moderate';

    return {
      level: riskLevel,
      score: this.round(riskScore),
      factors: {
        returnSensitivity: Math.abs(avgReturnImpact),
        volatilitySensitivity: avgVolatilityImpact,
        tailRisk: maxDrawdownImpact
      }
    };
  }

  /**
   * Generate risk management recommendations
   */
  generateRiskRecommendations(results) {
    const recommendations = [];
    const riskProfile = this.assessRiskProfile(results);

    if (riskProfile.level === 'very-high') {
      recommendations.push({
        type: 'urgent',
        title: 'High Risk Portfolio - Immediate Action Required',
        description: 'Consider significant portfolio rebalancing to reduce risk exposure',
        actions: [
          'Reduce equity exposure by 20-30%',
          'Increase cash/bond allocation',
          'Implement stop-loss orders',
          'Consider diversification into uncorrelated assets'
        ]
      });
    } else if (riskProfile.level === 'high') {
      recommendations.push({
        type: 'warning',
        title: 'Elevated Risk - Risk Management Review',
        description: 'Monitor portfolio closely and consider risk mitigation strategies',
        actions: [
          'Reduce concentrated positions',
          'Add defensive assets (gold, bonds)',
          'Implement options strategies for hedging',
          'Regular portfolio rebalancing'
        ]
      });
    } else if (riskProfile.level === 'moderate') {
      recommendations.push({
        type: 'info',
        title: 'Moderate Risk - Maintain Current Strategy',
        description: 'Current risk level is acceptable with regular monitoring',
        actions: [
          'Continue regular portfolio review',
          'Maintain diversification',
          'Monitor macroeconomic indicators'
        ]
      });
    }

    // Specific scenario recommendations
    const severeScenarios = results.filter(r => r.impact.returnImpactPercent < -20);
    if (severeScenarios.length > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Tail Risk Exposure',
        description: `${severeScenarios.length} scenarios show >20% potential losses`,
        actions: [
          'Implement tail risk hedging',
          'Consider put options for protection',
          'Reduce leverage if any',
          'Build cash reserves for opportunities'
        ]
      });
    }

    return recommendations;
  }

  // ===== PORTFOLIO RISK ATTRIBUTION =====

  /**
   * Perform risk attribution analysis
   * @param {Array} assets - Portfolio assets
   * @param {Array} weights - Asset weights
   * @param {Array} benchmarkWeights - Benchmark weights (optional)
   * @returns {Object} Risk attribution analysis
   */
  performRiskAttribution(assets, weights, benchmarkWeights = null) {
    const cacheKey = `risk_attr_${assets.length}_${benchmarkWeights ? benchmarkWeights.length : 0}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    // Validate inputs
    if (!Array.isArray(assets) || !Array.isArray(weights) || assets.length === 0 || weights.length === 0 || assets.length !== weights.length) {
      throw new Error('Invalid attribution inputs');
    }
    if (benchmarkWeights && (!Array.isArray(benchmarkWeights) || benchmarkWeights.length !== assets.length)) {
      throw new Error('Invalid benchmark weights');
    }

    const portfolioVolatility = this.calculatePortfolioVolatility(assets, weights);
    const marginalContributions = this.calculateMarginalRiskContributions(assets, weights);

    let benchmarkAttribution = null;
    if (benchmarkWeights) {
      const benchmarkVolatility = this.calculatePortfolioVolatility(assets, benchmarkWeights);
      benchmarkAttribution = {
        benchmarkVolatility,
        activeRisk: Math.sqrt(portfolioVolatility ** 2 - benchmarkVolatility ** 2),
        riskAttribution: this.calculateBenchmarkAttribution(assets, weights, benchmarkWeights)
      };
    }

    const result = {
      totalRisk: portfolioVolatility,
      riskDecomposition: {
        assetContributions: marginalContributions,
        factorContributions: this.calculateFactorRiskContributions(assets, weights),
        interactionEffects: this.calculateInteractionEffects(assets, weights)
      },
      benchmarkAttribution,
      riskBudget: this.calculateRiskBudget(marginalContributions, portfolioVolatility),
      recommendations: this.generateAttributionRecommendations(marginalContributions, assets)
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Calculate benchmark attribution - how much of the portfolio risk is due to active management
   */
  calculateBenchmarkAttribution(assets, weights, benchmarkWeights) {
    const portfolioVolatility = this.calculatePortfolioVolatility(assets, weights);
    const benchmarkVolatility = this.calculatePortfolioVolatility(assets, benchmarkWeights);

    // Calculate active weights (portfolio - benchmark)
    const activeWeights = weights.map((weight, i) => weight - benchmarkWeights[i]);

    // Calculate attribution using Brinson-style attribution
    const attribution = {
      systematicRisk: benchmarkVolatility,
      activeRisk: Math.sqrt(Math.max(0, portfolioVolatility ** 2 - benchmarkVolatility ** 2)),
      trackingError: Math.sqrt(
        activeWeights.reduce((sum, activeWeight, i) => {
          const asset = assets[i];
          const assetVolatility = asset.volatility || 0.2; // Default volatility if not provided
          return sum + activeWeight ** 2 * assetVolatility ** 2;
        }, 0)
      ),
      informationRatio:
        (portfolioVolatility - benchmarkVolatility) /
        Math.sqrt(
          activeWeights.reduce((sum, activeWeight, i) => {
            const asset = assets[i];
            const assetVolatility = asset.volatility || 0.2;
            return sum + activeWeight ** 2 * assetVolatility ** 2;
          }, 0)
        ),
      activeWeights
    };

    return attribution;
  }

  /**
   * Calculate marginal risk contributions
   */
  calculateMarginalRiskContributions(assets, weights) {
    const portfolioVolatility = this.calculatePortfolioVolatility(assets, weights);
    const contributions = [];

    for (let i = 0; i < assets.length; i++) {
      // Calculate partial derivative of portfolio volatility w.r.t. asset weight
      const delta = 0.001; // Small change in weight
      const newWeights = [...weights];
      newWeights[i] += delta;

      const newVolatility = this.calculatePortfolioVolatility(assets, newWeights);
      const marginalContribution = (newVolatility - portfolioVolatility) / delta;

      contributions.push({
        asset: assets[i].symbol || `Asset ${i + 1}`,
        weight: weights[i],
        volatility: assets[i].volatility,
        marginalContribution,
        riskContribution: marginalContribution * weights[i],
        riskContributionPercent: ((marginalContribution * weights[i]) / portfolioVolatility) * 100
      });
    }

    return contributions;
  }

  /**
   * Calculate factor risk contributions
   */
  calculateFactorRiskContributions(assets, weights) {
    const factors = {};

    // Group assets by factors
    assets.forEach((asset, index) => {
      const factor = asset.factor || asset.sector || 'other';
      if (!factors[factor]) {
        factors[factor] = { assets: [], weights: [] };
      }
      factors[factor].assets.push(asset);
      factors[factor].weights.push(weights[index]);
    });

    const factorContributions = {};

    for (const [factorName, factorData] of Object.entries(factors)) {
      const factorVolatility = this.calculatePortfolioVolatility(
        factorData.assets,
        factorData.weights
      );
      const totalWeight = factorData.weights.reduce((sum, w) => sum + w, 0);

      factorContributions[factorName] = {
        volatility: factorVolatility,
        weight: totalWeight,
        contribution: factorVolatility * totalWeight,
        contributionPercent:
          ((factorVolatility * totalWeight) / this.calculatePortfolioVolatility(assets, weights)) *
          100
      };
    }

    return factorContributions;
  }

  /**
   * Calculate interaction effects between assets
   */
  calculateInteractionEffects(assets, weights) {
    const interactions = [];

    // Calculate pairwise correlations and their effects on portfolio risk
    for (let i = 0; i < assets.length; i++) {
      for (let j = i + 1; j < assets.length; j++) {
        const asset1 = assets[i];
        const asset2 = assets[j];
        const weight1 = weights[i];
        const weight2 = weights[j];

        // Calculate correlation effect (simplified)
        const correlation = this.calculateAssetCorrelation(asset1, asset2);
        const covariance = correlation * (asset1.volatility || 0.2) * (asset2.volatility || 0.2);
        const interactionEffect = 2 * weight1 * weight2 * covariance;

        if (Math.abs(interactionEffect) > 0.001) {
          // Only include significant interactions
          interactions.push({
            assetPair: [asset1.symbol, asset2.symbol],
            correlation,
            covariance,
            weightProduct: weight1 * weight2,
            interactionEffect,
            riskImpact: Math.abs(interactionEffect)
          });
        }
      }
    }

    // Sort by risk impact (most significant first)
    return interactions.sort((a, b) => b.riskImpact - a.riskImpact);
  }

  /**
   * Calculate correlation between two assets (simplified)
   */
  calculateAssetCorrelation(asset1, asset2) {
    // Simplified correlation calculation
    // In a real implementation, this would use historical returns
    const defaultCorrelation = 0.3; // Default positive correlation

    // Use provided correlation if available
    if (asset1.correlation && asset1.correlation[asset2.symbol]) {
      return asset1.correlation[asset2.symbol];
    }
    if (asset2.correlation && asset2.correlation[asset1.symbol]) {
      return asset2.correlation[asset1.symbol];
    }

    // Use sector-based correlation
    if (asset1.sector && asset2.sector) {
      if (asset1.sector === asset2.sector) {
        return 0.7; // High correlation within same sector
      } else {
        return 0.2; // Lower correlation between different sectors
      }
    }

    return defaultCorrelation;
  }

  /**
   * Calculate risk budget utilization
   */
  calculateRiskBudget(contributions, totalRisk) {
    return contributions.map(contribution => ({
      ...contribution,
      budgetUtilization: Math.abs(contribution.riskContribution) / totalRisk,
      budgetUtilizationPercent: (Math.abs(contribution.riskContribution) / totalRisk) * 100
    }));
  }

  /**
   * Generate attribution-based recommendations
   */
  generateAttributionRecommendations(contributions, assets) {
    const recommendations = [];
    const highRiskContributors = contributions.filter(c => c.riskContributionPercent > 15);

    if (highRiskContributors.length > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Risk Concentration',
        description: `${highRiskContributors.length} assets contribute >15% to portfolio risk`,
        assets: highRiskContributors.map(c => c.asset),
        actions: [
          'Reduce overweight positions',
          'Diversify into uncorrelated assets',
          'Implement risk parity strategy'
        ]
      });
    }

    const lowRiskContributors = contributions.filter(c => c.riskContributionPercent < 1);
    if (lowRiskContributors.length > assets.length * 0.3) {
      recommendations.push({
        type: 'info',
        title: 'Underutilized Assets',
        description: 'Several assets contribute minimally to portfolio risk',
        assets: lowRiskContributors.map(c => c.asset),
        actions: [
          'Consider increasing allocation to these assets',
          'Review if these assets add value elsewhere',
          'Rebalance to optimize risk-adjusted returns'
        ]
      });
    }

    return recommendations;
  }

  // ===== UTILITY METHODS =====

  /**
   * Calculate correlation breakdown for stress scenarios
   */
  calculateCorrelationBreakdown(correlations, scenario) {
    // Simplified correlation breakdown analysis
    return {
      averageCorrelation:
        correlations.reduce(
          (sum, row, i) =>
            sum + row.reduce((rowSum, corr, j) => (i !== j ? rowSum + corr : rowSum), 0),
          0
        ) /
          (correlations.length * (correlations.length - 1)) || 0,
      maxCorrelation: Math.max(...correlations.flat()),
      minCorrelation: Math.min(...correlations.flat()),
      correlationStress: scenario.shocks.correlation || 0
    };
  }

  /**
   * Calculate contagion risk for stress scenarios
   */
  calculateContagionRisk(assets, scenario) {
    // Simplified contagion risk analysis
    const affectedAssets = assets.filter(asset => {
      const shock =
        scenario.shocks[asset.type] ||
        scenario.shocks[asset.sector?.toLowerCase()] ||
        scenario.shocks.equities;
      return shock && shock < -0.1; // Assets affected by significant shocks
    });

    return {
      affectedAssetsCount: affectedAssets.length,
      totalAssetsCount: assets.length,
      contagionRatio: affectedAssets.length / assets.length,
      averageShock:
        affectedAssets.reduce((sum, asset) => {
          const shock =
            scenario.shocks[asset.type] ||
            scenario.shocks[asset.sector?.toLowerCase()] ||
            scenario.shocks.equities ||
            0;
          return sum + Math.abs(shock);
        }, 0) / (affectedAssets.length || 1)
    };
  }

  /**
   * Calculate extreme loss probability
   */
  calculateExtremeLossProbability(returns, threshold) {
    if (!Array.isArray(returns) || returns.length === 0) return 0;

    const extremeLosses = returns.filter(r => r < threshold);
    return extremeLosses.length / returns.length;
  }

  /**
   * Calculate black swan risk
   */
  calculateBlackSwanRisk(returns) {
    const stats = this.calculateReturnStatistics(returns);
    const tailRisk = (stats.min - stats.mean) / stats.std;

    // Black swan events are typically 3+ standard deviations from mean
    return tailRisk > 3 ? Math.abs(tailRisk) : 0;
  }

  /**
   * Calculate liquidity impact
   */
  calculateLiquidityImpact(scenario) {
    // Simplified liquidity impact based on scenario severity
    const severity = Math.abs(
      Object.values(scenario.shocks).reduce((sum, shock) => sum + shock, 0)
    );
    return Math.min(severity * 0.3, 1); // Max 30% liquidity impact
  }

  /**
   * Calculate concentration risk
   */
  calculateConcentrationRisk(assets) {
    if (!Array.isArray(assets)) return 0;

    const maxWeight = Math.max(...assets.map(a => a.weight || 0));
    return maxWeight; // Simple concentration measure
  }
}

// Export singleton instance
export const riskAssessmentEngine = new RiskAssessmentEngine({
  cacheTimeout: 300000,
  precision: 6,
  confidenceLevel: 0.95
});

export default RiskAssessmentEngine;
