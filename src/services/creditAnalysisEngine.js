/**
 * Credit Analysis Engine
 * Credit scoring, default modeling, covenant analysis, and credit risk assessment
 */

class CreditAnalysisEngine {
  constructor() {
    this.ratingMappings = this.initializeRatingMappings();
    this.industryDefaults = this.initializeIndustryDefaults();
    this.covenantTypes = this.initializeCovenantTypes();
  }

  initializeRatingMappings() {
    return {
      'AAA': { pd: 0.0001, lgd: 0.40, score: 950 },
      'AA+': { pd: 0.0002, lgd: 0.40, score: 920 },
      'AA': { pd: 0.0003, lgd: 0.40, score: 900 },
      'AA-': { pd: 0.0005, lgd: 0.40, score: 880 },
      'A+': { pd: 0.0008, lgd: 0.45, score: 860 },
      'A': { pd: 0.0012, lgd: 0.45, score: 840 },
      'A-': { pd: 0.0020, lgd: 0.45, score: 820 },
      'BBB+': { pd: 0.0035, lgd: 0.50, score: 800 },
      'BBB': { pd: 0.0060, lgd: 0.50, score: 780 },
      'BBB-': { pd: 0.0100, lgd: 0.50, score: 760 },
      'BB+': { pd: 0.0180, lgd: 0.55, score: 740 },
      'BB': { pd: 0.0320, lgd: 0.55, score: 720 },
      'BB-': { pd: 0.0550, lgd: 0.55, score: 700 },
      'B+': { pd: 0.0920, lgd: 0.60, score: 680 },
      'B': { pd: 0.1400, lgd: 0.60, score: 660 },
      'B-': { pd: 0.2100, lgd: 0.60, score: 640 },
      'CCC+': { pd: 0.3000, lgd: 0.65, score: 620 },
      'CCC': { pd: 0.4000, lgd: 0.65, score: 600 },
      'CC': { pd: 0.6000, lgd: 0.70, score: 580 },
      'C': { pd: 0.8000, lgd: 0.75, score: 560 },
      'D': { pd: 1.0000, lgd: 0.80, score: 300 }
    };
  }

  initializeIndustryDefaults() {
    return {
      'Technology': { avgPD: 0.015, volatility: 0.35, cyclicality: 0.6 },
      'Healthcare': { avgPD: 0.008, volatility: 0.25, cyclicality: 0.3 },
      'Financial Services': { avgPD: 0.025, volatility: 0.45, cyclicality: 0.8 },
      'Energy': { avgPD: 0.040, volatility: 0.55, cyclicality: 0.9 },
      'Utilities': { avgPD: 0.005, volatility: 0.20, cyclicality: 0.2 },
      'Consumer Goods': { avgPD: 0.012, volatility: 0.30, cyclicality: 0.7 },
      'Industrial': { avgPD: 0.018, volatility: 0.35, cyclicality: 0.8 },
      'Real Estate': { avgPD: 0.030, volatility: 0.50, cyclicality: 0.9 },
      'Telecommunications': { avgPD: 0.010, volatility: 0.25, cyclicality: 0.4 },
      'Materials': { avgPD: 0.022, volatility: 0.40, cyclicality: 0.85 }
    };
  }

  initializeCovenantTypes() {
    return {
      'debt_to_ebitda': {
        name: 'Debt-to-EBITDA Ratio',
        type: 'financial',
        calculation: (debt, ebitda) => debt / ebitda,
        typical_threshold: 4.0,
        direction: 'max'
      },
      'interest_coverage': {
        name: 'Interest Coverage Ratio',
        type: 'financial',
        calculation: (ebitda, interest) => ebitda / interest,
        typical_threshold: 3.0,
        direction: 'min'
      },
      'current_ratio': {
        name: 'Current Ratio',
        type: 'liquidity',
        calculation: (current_assets, current_liabilities) => current_assets / current_liabilities,
        typical_threshold: 1.2,
        direction: 'min'
      },
      'tangible_net_worth': {
        name: 'Minimum Tangible Net Worth',
        type: 'capital',
        calculation: (equity, intangibles) => equity - intangibles,
        typical_threshold: 100000000, // $100M
        direction: 'min'
      },
      'capex_limit': {
        name: 'Capital Expenditure Limit',
        type: 'operational',
        calculation: (capex, revenues) => capex / revenues,
        typical_threshold: 0.15,
        direction: 'max'
      }
    };
  }

  /**
   * Credit Scoring Models
   */

  // Altman Z-Score for bankruptcy prediction
  calculateAltmanZScore(financials) {
    const {
      workingCapital,
      totalAssets,
      retainedEarnings,
      ebit,
      marketValueEquity,
      totalLiabilities,
      sales
    } = financials;

    const z1 = 1.2 * (workingCapital / totalAssets);
    const z2 = 1.4 * (retainedEarnings / totalAssets);
    const z3 = 3.3 * (ebit / totalAssets);
    const z4 = 0.6 * (marketValueEquity / totalLiabilities);
    const z5 = 1.0 * (sales / totalAssets);

    const zScore = z1 + z2 + z3 + z4 + z5;

    let riskCategory;
    let bankruptcyRisk;

    if (zScore > 2.99) {
      riskCategory = 'Safe Zone';
      bankruptcyRisk = 'Low';
    } else if (zScore >= 1.81) {
      riskCategory = 'Grey Zone';
      bankruptcyRisk = 'Moderate';
    } else {
      riskCategory = 'Distress Zone';
      bankruptcyRisk = 'High';
    }

    return {
      zScore,
      riskCategory,
      bankruptcyRisk,
      components: {
        workingCapitalRatio: z1,
        retainedEarningsRatio: z2,
        earningsBeforeInterestTax: z3,
        marketValueRatio: z4,
        salesTurnover: z5
      },
      interpretation: this.interpretZScore(zScore)
    };
  }

  // Merton Distance-to-Default Model
  calculateDistanceToDefault(equity, debt, volatility, riskFreeRate, timeHorizon = 1) {
    const assetValue = equity + debt;
    const debtBarrier = debt; // Simplified - typically use short-term debt + 0.5 * long-term debt

    const d1 = (Math.log(assetValue / debtBarrier) + (riskFreeRate + 0.5 * volatility * volatility) * timeHorizon) /
               (volatility * Math.sqrt(timeHorizon));

    const d2 = d1 - volatility * Math.sqrt(timeHorizon);

    const probabilityOfDefault = this.cumulativeNormalDistribution(-d2);
    const distanceToDefault = d2;

    return {
      distanceToDefault,
      probabilityOfDefault,
      assetValue,
      debtBarrier,
      volatility,
      d1,
      d2,
      creditSpread: this.calculateCreditSpread(probabilityOfDefault, 0.4), // Assume 40% LGD
      ratingEquivalent: this.probabilityToRating(probabilityOfDefault)
    };
  }

  // Custom Credit Scoring Model
  calculateCustomCreditScore(financials, qualitativeFactors = {}) {
    const financialScore = this.calculateFinancialScore(financials);
    const qualitativeScore = this.calculateQualitativeScore(qualitativeFactors);
    const industryScore = this.calculateIndustryScore(financials.industry);

    const weights = {
      financial: 0.6,
      qualitative: 0.25,
      industry: 0.15
    };

    const totalScore = (
      financialScore * weights.financial +
      qualitativeScore * weights.qualitative +
      industryScore * weights.industry
    );

    const rating = this.scoreToRating(totalScore);
    const probabilityOfDefault = this.ratingMappings[rating].pd;

    return {
      totalScore: Math.round(totalScore),
      rating,
      probabilityOfDefault,
      components: {
        financial: { score: financialScore, weight: weights.financial },
        qualitative: { score: qualitativeScore, weight: weights.qualitative },
        industry: { score: industryScore, weight: weights.industry }
      },
      scoreBreakdown: this.getScoreBreakdown(financials, qualitativeFactors)
    };
  }

  /**
   * Default Probability Models
   */

  // Logistic Regression Model for Default Prediction
  calculateLogisticDefaultProbability(financialRatios, industryFactors) {
    // Simplified logistic regression coefficients (in practice, these would be estimated from data)
    const coefficients = {
      intercept: -2.5,
      debt_to_equity: 0.8,
      current_ratio: -0.4,
      roa: -2.0,
      interest_coverage: -0.15,
      revenue_growth: -0.3,
      industry_risk: 1.2
    };

    const logit = coefficients.intercept +
      coefficients.debt_to_equity * financialRatios.debtToEquity +
      coefficients.current_ratio * financialRatios.currentRatio +
      coefficients.roa * financialRatios.roa +
      coefficients.interest_coverage * Math.log(Math.max(financialRatios.interestCoverage, 0.1)) +
      coefficients.revenue_growth * financialRatios.revenueGrowth +
      coefficients.industry_risk * industryFactors.riskScore;

    const probability = 1 / (1 + Math.exp(-logit));

    return {
      defaultProbability: probability,
      logitScore: logit,
      riskLevel: this.categorizeProbability(probability),
      contributingFactors: this.identifyRiskFactors(financialRatios, coefficients)
    };
  }

  // Machine Learning-based Credit Risk Assessment
  calculateMLCreditRisk(features) {
    // Simplified ML model (in practice, this would be a trained model)
    const weights = this.getMLWeights();
    const normalizedFeatures = this.normalizeFeatures(features);

    let riskScore = 0;
    Object.keys(normalizedFeatures).forEach(feature => {
      riskScore += normalizedFeatures[feature] * (weights[feature] || 0);
    });

    const probability = this.sigmoid(riskScore);

    return {
      riskScore,
      defaultProbability: probability,
      confidence: this.calculateConfidence(features),
      featureImportance: this.calculateFeatureImportance(features, weights),
      modelVersion: '2.1',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Covenant Analysis
   */

  analyzeCovenant(covenantType, currentValue, thresholdValue, financials) {
    const covenant = this.covenantTypes[covenantType];
    if (!covenant) {
      throw new Error(`Unknown covenant type: ${covenantType}`);
    }

    const isCompliant = covenant.direction === 'min' ?
      currentValue >= thresholdValue :
      currentValue <= thresholdValue;

    const cushion = covenant.direction === 'min' ?
      (currentValue - thresholdValue) / thresholdValue :
      (thresholdValue - currentValue) / thresholdValue;

    const riskLevel = this.assessCovenantRisk(cushion, covenant.type);

    return {
      covenantType: covenant.name,
      currentValue,
      thresholdValue,
      isCompliant,
      cushion,
      cushionPercentage: cushion * 100,
      riskLevel,
      recommendation: this.getCovenantRecommendation(isCompliant, cushion, covenant),
      historicalPerformance: this.analyzeHistoricalCovenant(covenantType, financials),
      sensitivity: this.calculateCovenantSensitivity(covenantType, financials)
    };
  }

  // Analyze multiple covenants for a borrower
  analyzeCovenantPackage(covenants, financials) {
    const covenantAnalyses = covenants.map(covenant =>
      this.analyzeCovenant(
        covenant.type,
        covenant.currentValue,
        covenant.thresholdValue,
        financials
      )
    );

    const breachedCovenants = covenantAnalyses.filter(c => !c.isCompliant);
    const atRiskCovenants = covenantAnalyses.filter(c => c.isCompliant && c.cushion < 0.1);

    const overallRisk = this.calculateOverallCovenantRisk(covenantAnalyses);

    return {
      covenants: covenantAnalyses,
      summary: {
        totalCovenants: covenants.length,
        breachedCovenants: breachedCovenants.length,
        atRiskCovenants: atRiskCovenants.length,
        overallRisk,
        riskScore: this.calculateCovenantRiskScore(covenantAnalyses)
      },
      recommendations: this.generateCovenantRecommendations(covenantAnalyses),
      monitoring: this.suggestMonitoringFrequency(overallRisk)
    };
  }

  /**
   * Credit Portfolio Analysis
   */

  analyzeCreditPortfolio(exposures) {
    const portfolioMetrics = this.calculatePortfolioMetrics(exposures);
    const concentrationRisk = this.analyzeConcentrationRisk(exposures);
    const correlationRisk = this.analyzeCorrelationRisk(exposures);
    const expectedLoss = this.calculatePortfolioExpectedLoss(exposures);

    return {
      portfolioSize: exposures.length,
      totalExposure: exposures.reduce((sum, exp) => sum + exp.exposure, 0),
      metrics: portfolioMetrics,
      concentrationRisk,
      correlationRisk,
      expectedLoss,
      riskContribution: this.calculateRiskContribution(exposures),
      stressTests: this.performCreditStressTests(exposures),
      recommendations: this.generatePortfolioRecommendations(exposures)
    };
  }

  /**
   * Credit Migration Analysis
   */

  calculateCreditMigration(currentRating, migrationMatrix, timeHorizon = 1) {
    const migrationProbs = migrationMatrix[currentRating] || {};

    const expectedRating = this.calculateExpectedRating(migrationProbs);
    const downgradeProbability = this.calculateDowngradeProbability(migrationProbs, currentRating);
    const upgradeProbability = this.calculateUpgradeProbability(migrationProbs, currentRating);

    return {
      currentRating,
      expectedRating,
      downgradeProbability,
      upgradeProbability,
      migrationProbabilities: migrationProbs,
      ratingVolatility: this.calculateRatingVolatility(migrationProbs),
      timeHorizon
    };
  }

  /**
   * Utility Functions
   */

  calculateFinancialScore(financials) {
    const ratios = this.calculateKeyRatios(financials);

    // Scoring based on financial ratios
    let score = 300; // Base score

    // Profitability (25% weight)
    score += this.scoreRatio(ratios.roa, 0.15, 0.05, -0.05) * 0.25 * 400;
    score += this.scoreRatio(ratios.roe, 0.20, 0.10, 0.00) * 0.25 * 400;

    // Leverage (30% weight)
    score += this.scoreRatio(ratios.debtToEquity, 0.5, 1.0, 2.0, true) * 0.30 * 400;
    score += this.scoreRatio(ratios.interestCoverage, 10, 5, 2) * 0.30 * 400;

    // Liquidity (25% weight)
    score += this.scoreRatio(ratios.currentRatio, 2.0, 1.5, 1.0) * 0.25 * 400;
    score += this.scoreRatio(ratios.quickRatio, 1.5, 1.0, 0.7) * 0.25 * 400;

    // Efficiency (20% weight)
    score += this.scoreRatio(ratios.assetTurnover, 1.5, 1.0, 0.5) * 0.20 * 400;

    return Math.max(300, Math.min(850, score));
  }

  calculateQualitativeScore(factors) {
    const {
      managementQuality = 5,
      marketPosition = 5,
      industryOutlook = 5,
      competitiveAdvantage = 5,
      regulatoryEnvironment = 5
    } = factors;

    // Scale 1-10 to credit score contribution
    const score = (
      managementQuality * 0.3 +
      marketPosition * 0.25 +
      industryOutlook * 0.2 +
      competitiveAdvantage * 0.15 +
      regulatoryEnvironment * 0.1
    ) * 50; // Scale to 0-500 range

    return Math.max(0, Math.min(500, score));
  }

  calculateIndustryScore(industry) {
    const industryData = this.industryDefaults[industry];
    if (!industryData) return 250; // Neutral score

    // Lower default rate = higher score
    const riskScore = 1 - Math.min(industryData.avgPD * 10, 1);
    return riskScore * 300 + 200; // Scale to 200-500 range
  }

  scoreRatio(value, excellent, good, poor, inverse = false) {
    if (inverse) {
      if (value <= excellent) return 1.0;
      if (value <= good) return 0.75;
      if (value <= poor) return 0.5;
      return 0.25;
    } else {
      if (value >= excellent) return 1.0;
      if (value >= good) return 0.75;
      if (value >= poor) return 0.5;
      return 0.25;
    }
  }

  calculateKeyRatios(financials) {
    return {
      roa: financials.netIncome / financials.totalAssets,
      roe: financials.netIncome / financials.equity,
      debtToEquity: financials.totalDebt / financials.equity,
      interestCoverage: financials.ebitda / Math.max(financials.interestExpense, 1),
      currentRatio: financials.currentAssets / financials.currentLiabilities,
      quickRatio: (financials.currentAssets - financials.inventory) / financials.currentLiabilities,
      assetTurnover: financials.revenue / financials.totalAssets,
      revenueGrowth: financials.revenueGrowthRate || 0
    };
  }

  scoreToRating(score) {
    if (score >= 800) return 'AAA';
    if (score >= 780) return 'AA+';
    if (score >= 760) return 'AA';
    if (score >= 740) return 'AA-';
    if (score >= 720) return 'A+';
    if (score >= 700) return 'A';
    if (score >= 680) return 'A-';
    if (score >= 660) return 'BBB+';
    if (score >= 640) return 'BBB';
    if (score >= 620) return 'BBB-';
    if (score >= 600) return 'BB+';
    if (score >= 580) return 'BB';
    if (score >= 560) return 'BB-';
    if (score >= 540) return 'B+';
    if (score >= 520) return 'B';
    if (score >= 500) return 'B-';
    if (score >= 400) return 'CCC';
    return 'D';
  }

  probabilityToRating(pd) {
    for (const [rating, data] of Object.entries(this.ratingMappings)) {
      if (pd <= data.pd * 1.5) return rating; // Add some tolerance
    }
    return 'D';
  }

  calculateCreditSpread(pd, lgd, riskFreeRate = 0.03) {
    return pd * lgd;
  }

  interpretZScore(zScore) {
    if (zScore > 2.99) {
      return 'Strong financial health with low bankruptcy risk';
    } else if (zScore >= 1.81) {
      return 'Moderate financial health requiring monitoring';
    } else {
      return 'Weak financial health with high bankruptcy risk';
    }
  }

  categorizeProbability(probability) {
    if (probability < 0.01) return 'Very Low Risk';
    if (probability < 0.05) return 'Low Risk';
    if (probability < 0.15) return 'Moderate Risk';
    if (probability < 0.30) return 'High Risk';
    return 'Very High Risk';
  }

  // Simplified helper functions (would be more complex in practice)
  cumulativeNormalDistribution(x) {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  erf(x) {
    // Simplified error function approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  // Placeholder implementations for complex functions
  getMLWeights() {
    return {
      debt_ratio: 0.8,
      current_ratio: -0.4,
      roa: -2.0,
      interest_coverage: -0.3,
      revenue_growth: -0.2,
      industry_risk: 1.0
    };
  }

  normalizeFeatures(features) {
    // Simple min-max normalization (would use proper statistics in practice)
    return Object.keys(features).reduce((normalized, key) => {
      normalized[key] = Math.min(Math.max((features[key] + 1) / 2, 0), 1);
      return normalized;
    }, {});
  }

  calculateConfidence(features) {
    // Simplified confidence calculation
    return 0.85;
  }

  calculateFeatureImportance(features, weights) {
    return Object.keys(features).map(feature => ({
      feature,
      importance: Math.abs(weights[feature] || 0),
      value: features[feature]
    })).sort((a, b) => b.importance - a.importance);
  }

  assessCovenantRisk(cushion, type) {
    if (cushion < 0) return 'Breach';
    if (cushion < 0.1) return 'High Risk';
    if (cushion < 0.2) return 'Medium Risk';
    return 'Low Risk';
  }

  getCovenantRecommendation(isCompliant, cushion, covenant) {
    if (!isCompliant) {
      return 'Immediate action required - covenant breach detected';
    }
    if (cushion < 0.1) {
      return 'Monitor closely - covenant at risk';
    }
    return 'Covenant is healthy with adequate cushion';
  }

  // Additional placeholder implementations would go here...
  analyzeHistoricalCovenant() {
    return {};
  }
  calculateCovenantSensitivity() {
    return {};
  }
  calculateOverallCovenantRisk() {
    return 'Medium';
  }
  calculateCovenantRiskScore() {
    return 75;
  }
  generateCovenantRecommendations() {
    return [];
  }
  suggestMonitoringFrequency() {
    return 'Monthly';
  }
  calculatePortfolioMetrics() {
    return {};
  }
  analyzeConcentrationRisk() {
    return {};
  }
  analyzeCorrelationRisk() {
    return {};
  }
  calculatePortfolioExpectedLoss() {
    return {};
  }
  calculateRiskContribution() {
    return [];
  }
  performCreditStressTests() {
    return {};
  }
  generatePortfolioRecommendations() {
    return [];
  }
  calculateExpectedRating() {
    return 'BBB';
  }
  calculateDowngradeProbability() {
    return 0.15;
  }
  calculateUpgradeProbability() {
    return 0.10;
  }
  calculateRatingVolatility() {
    return 0.25;
  }
  identifyRiskFactors() {
    return [];
  }
  getScoreBreakdown() {
    return {};
  }
}

export default CreditAnalysisEngine;
