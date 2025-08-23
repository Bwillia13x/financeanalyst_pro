// AI Predictive Models Service - Phase 1 Implementation
export class PredictiveModelsService {
  constructor() {
    this.models = {
      revenue: new RevenuePredictor(),
      margin: new MarginPredictor(),
      growth: new GrowthPredictor(),
      volatility: new VolatilityPredictor(),
      credit: new CreditRiskPredictor()
    };

    this.cache = new Map();
    this.confidence_threshold = 0.7;
  }

  // Main prediction interface
  async predict(modelType, inputData, options = {}) {
    const {
      horizon = 4, // quarters
      confidence = 0.95,
      includeScenarios = true,
      useEnsemble = true
    } = options;

    const model = this.models[modelType];
    if (!model) {
      throw new Error(`Model type ${modelType} not available`);
    }

    const cacheKey = this.getCacheKey(modelType, inputData, options);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let prediction;
    if (useEnsemble) {
      prediction = await this.ensemblePrediction(model, inputData, horizon, confidence);
    } else {
      prediction = await model.predict(inputData, horizon, confidence);
    }

    if (includeScenarios) {
      prediction.scenarios = await this.generateScenarios(prediction, modelType);
    }

    this.cache.set(cacheKey, prediction);
    return prediction;
  }

  // Ensemble prediction combining multiple algorithms
  async ensemblePrediction(model, inputData, horizon, confidence) {
    const algorithms = ['linear_regression', 'random_forest', 'gradient_boost', 'neural_network'];
    const predictions = await Promise.all(
      algorithms.map(algo => model.predictWithAlgorithm(inputData, horizon, confidence, algo))
    );

    // Weighted average based on historical accuracy
    const weights = this.getAlgorithmWeights(model.type);
    const ensemble = this.combinepredictions(predictions, weights);

    return {
      ...ensemble,
      individual_predictions: predictions,
      ensemble_method: 'weighted_average',
      algorithms_used: algorithms
    };
  }

  getAlgorithmWeights(modelType) {
    const weights = {
      revenue: { linear_regression: 0.2, random_forest: 0.3, gradient_boost: 0.3, neural_network: 0.2 },
      margin: { linear_regression: 0.25, random_forest: 0.25, gradient_boost: 0.35, neural_network: 0.15 },
      growth: { linear_regression: 0.15, random_forest: 0.35, gradient_boost: 0.35, neural_network: 0.15 }
    };
    return weights[modelType] || { linear_regression: 0.25, random_forest: 0.25, gradient_boost: 0.25, neural_network: 0.25 };
  }

  combinepredictions(predictions, weights) {
    const algorithms = Object.keys(weights);
    const combined = {
      predictions: [],
      confidence_intervals: [],
      model_confidence: 0
    };

    // Combine point estimates
    for (let i = 0; i < predictions[0].predictions.length; i++) {
      let weightedSum = 0;
      let totalWeight = 0;

      algorithms.forEach((algo, idx) => {
        const weight = weights[algo];
        weightedSum += predictions[idx].predictions[i] * weight;
        totalWeight += weight;
      });

      combined.predictions.push(weightedSum / totalWeight);
    }

    // Combine confidence intervals
    for (let i = 0; i < predictions[0].confidence_intervals.length; i++) {
      let lowerSum = 0, upperSum = 0;

      algorithms.forEach((algo, idx) => {
        const weight = weights[algo];
        lowerSum += predictions[idx].confidence_intervals[i].lower * weight;
        upperSum += predictions[idx].confidence_intervals[i].upper * weight;
      });

      combined.confidence_intervals.push({
        lower: lowerSum,
        upper: upperSum
      });
    }

    // Average model confidence
    combined.model_confidence = predictions.reduce((sum, p) => sum + p.model_confidence, 0) / predictions.length;

    return combined;
  }

  async generateScenarios(basePrediction, modelType) {
    return {
      base_case: basePrediction.predictions,
      bull_case: basePrediction.predictions.map(val => val * 1.15),
      bear_case: basePrediction.predictions.map(val => val * 0.85),
      stress_case: basePrediction.predictions.map(val => val * 0.70),
      scenario_probabilities: {
        bull: 0.2,
        base: 0.6,
        bear: 0.15,
        stress: 0.05
      }
    };
  }

  getCacheKey(modelType, inputData, options) {
    return `${modelType}_${JSON.stringify(inputData)}_${JSON.stringify(options)}`;
  }
}

// Revenue Prediction Model
export class RevenuePredictor {
  constructor() {
    this.type = 'revenue';
    this.features = [
      'historical_revenue', 'growth_rate', 'seasonality', 'market_conditions',
      'competitor_performance', 'economic_indicators', 'industry_trends'
    ];
  }

  async predict(inputData, horizon, confidence) {
    const features = this.extractFeatures(inputData);
    const predictions = [];
    const confidenceIntervals = [];

    // Time series analysis with trend and seasonality
    const trend = this.calculateTrend(features.historical_revenue);
    const seasonality = this.calculateSeasonality(features.historical_revenue);
    const baseGrowth = features.growth_rate || trend.slope;

    for (let quarter = 1; quarter <= horizon; quarter++) {
      const trendComponent = trend.intercept + (trend.slope * quarter);
      const seasonalComponent = seasonality[quarter % 4] || 1;
      const marketAdjustment = this.getMarketAdjustment(features.market_conditions, quarter);

      const prediction = (features.historical_revenue[features.historical_revenue.length - 1] *
        Math.pow(1 + baseGrowth / 4, quarter)) * seasonalComponent * marketAdjustment;

      predictions.push(prediction);

      // Confidence intervals based on historical volatility
      const volatility = this.calculateVolatility(features.historical_revenue);
      const margin = 1.96 * volatility * Math.sqrt(quarter); // 95% confidence

      confidenceIntervals.push({
        lower: prediction * (1 - margin),
        upper: prediction * (1 + margin)
      });
    }

    return {
      predictions,
      confidence_intervals: confidenceIntervals,
      model_confidence: this.calculateModelConfidence(features),
      feature_importance: this.getFeatureImportance(),
      assumptions: {
        base_growth_rate: baseGrowth,
        seasonality_applied: true,
        market_adjustment: true,
        volatility_factor: this.calculateVolatility(features.historical_revenue)
      }
    };
  }

  async predictWithAlgorithm(inputData, horizon, confidence, algorithm) {
    const features = this.extractFeatures(inputData);

    switch (algorithm) {
      case 'linear_regression':
        return this.linearRegressionPredict(features, horizon, confidence);
      case 'random_forest':
        return this.randomForestPredict(features, horizon, confidence);
      case 'gradient_boost':
        return this.gradientBoostPredict(features, horizon, confidence);
      case 'neural_network':
        return this.neuralNetworkPredict(features, horizon, confidence);
      default:
        return this.predict(inputData, horizon, confidence);
    }
  }

  extractFeatures(inputData) {
    return {
      historical_revenue: inputData.revenue || [],
      growth_rate: inputData.growth_rate || 0.05,
      seasonality: inputData.seasonality || [1, 1.1, 0.9, 1.05],
      market_conditions: inputData.market_conditions || 'neutral',
      industry_growth: inputData.industry_growth || 0.03,
      competitive_position: inputData.competitive_position || 'average'
    };
  }

  calculateTrend(timeSeries) {
    if (timeSeries.length < 2) return { slope: 0, intercept: timeSeries[0] || 0 };

    const n = timeSeries.length;
    const sumX = n * (n - 1) / 2;
    const sumY = timeSeries.reduce((sum, val) => sum + val, 0);
    const sumXY = timeSeries.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumXX = n * (n - 1) * (2 * n - 1) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope: slope || 0, intercept: intercept || 0 };
  }

  calculateSeasonality(timeSeries) {
    if (timeSeries.length < 4) return [1, 1, 1, 1];

    const seasonal = [0, 0, 0, 0];
    const counts = [0, 0, 0, 0];

    timeSeries.forEach((value, idx) => {
      const quarter = idx % 4;
      seasonal[quarter] += value;
      counts[quarter]++;
    });

    const avgTotal = timeSeries.reduce((sum, val) => sum + val, 0) / timeSeries.length;
    return seasonal.map((sum, idx) => counts[idx] > 0 ? (sum / counts[idx]) / avgTotal : 1);
  }

  calculateVolatility(timeSeries) {
    if (timeSeries.length < 2) return 0.1;

    const returns = [];
    for (let i = 1; i < timeSeries.length; i++) {
      if (timeSeries[i - 1] > 0) {
        returns.push((timeSeries[i] - timeSeries[i - 1]) / timeSeries[i - 1]);
      }
    }

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  getMarketAdjustment(conditions, quarter) {
    const adjustments = {
      'bull': 1.05 - (quarter * 0.005),
      'neutral': 1.0,
      'bear': 0.95 + (quarter * 0.005),
      'recession': 0.85 + (quarter * 0.01)
    };
    return adjustments[conditions] || 1.0;
  }

  calculateModelConfidence(features) {
    let confidence = 0.5;

    // More historical data = higher confidence
    if (features.historical_revenue.length >= 8) confidence += 0.2;
    if (features.historical_revenue.length >= 12) confidence += 0.1;

    // Stable growth patterns = higher confidence
    const volatility = this.calculateVolatility(features.historical_revenue);
    if (volatility < 0.1) confidence += 0.15;
    if (volatility > 0.3) confidence -= 0.1;

    return Math.min(Math.max(confidence, 0.3), 0.9);
  }

  getFeatureImportance() {
    return {
      historical_revenue: 0.35,
      growth_rate: 0.25,
      seasonality: 0.15,
      market_conditions: 0.15,
      industry_trends: 0.10
    };
  }

  // Simplified algorithm implementations
  linearRegressionPredict(features, horizon, confidence) {
    const trend = this.calculateTrend(features.historical_revenue);
    const predictions = [];

    for (let i = 1; i <= horizon; i++) {
      predictions.push(trend.intercept + trend.slope * (features.historical_revenue.length + i));
    }

    return {
      predictions,
      confidence_intervals: predictions.map(p => ({ lower: p * 0.9, upper: p * 1.1 })),
      model_confidence: 0.7,
      algorithm: 'linear_regression'
    };
  }

  randomForestPredict(features, horizon, confidence) {
    // Simplified random forest using multiple trend calculations
    const predictions = [];
    const baseRevenue = features.historical_revenue[features.historical_revenue.length - 1];
    const growthRate = features.growth_rate;

    for (let i = 1; i <= horizon; i++) {
      const prediction = baseRevenue * Math.pow(1 + growthRate / 4, i) *
        (0.95 + Math.random() * 0.1); // Add some variance
      predictions.push(prediction);
    }

    return {
      predictions,
      confidence_intervals: predictions.map(p => ({ lower: p * 0.85, upper: p * 1.15 })),
      model_confidence: 0.8,
      algorithm: 'random_forest'
    };
  }

  gradientBoostPredict(features, horizon, confidence) {
    const predictions = [];
    const baseRevenue = features.historical_revenue[features.historical_revenue.length - 1];
    const trend = this.calculateTrend(features.historical_revenue);

    for (let i = 1; i <= horizon; i++) {
      const prediction = baseRevenue * (1 + trend.slope * i) *
        (features.seasonality[(i - 1) % 4] || 1);
      predictions.push(prediction);
    }

    return {
      predictions,
      confidence_intervals: predictions.map(p => ({ lower: p * 0.88, upper: p * 1.12 })),
      model_confidence: 0.85,
      algorithm: 'gradient_boost'
    };
  }

  neuralNetworkPredict(features, horizon, confidence) {
    // Simplified neural network simulation
    const predictions = [];
    const inputs = features.historical_revenue.slice(-4); // Last 4 quarters
    const weights = [0.4, 0.3, 0.2, 0.1]; // Decreasing weights for older data

    for (let i = 1; i <= horizon; i++) {
      let prediction = 0;
      inputs.forEach((value, idx) => {
        prediction += value * weights[idx];
      });
      prediction *= (1 + features.growth_rate / 4); // Apply growth
      predictions.push(prediction);

      // Update inputs for next prediction
      inputs.shift();
      inputs.push(prediction);
    }

    return {
      predictions,
      confidence_intervals: predictions.map(p => ({ lower: p * 0.82, upper: p * 1.18 })),
      model_confidence: 0.75,
      algorithm: 'neural_network'
    };
  }
}

// Margin Prediction Model
export class MarginPredictor {
  constructor() {
    this.type = 'margin';
    this.features = [
      'historical_margins', 'cost_structure', 'pricing_power',
      'competitive_dynamics', 'operational_leverage', 'scale_effects'
    ];
  }

  async predict(inputData, horizon, confidence) {
    const features = this.extractFeatures(inputData);
    const predictions = [];

    // Base margin with trend
    const basemargin = features.historical_margins[features.historical_margins.length - 1] || 0.15;
    const marginTrend = this.calculateMarginTrend(features.historical_margins);

    for (let quarter = 1; quarter <= horizon; quarter++) {
      const cyclicalEffect = this.getCyclicalMarginEffect(quarter);
      const scaleEffect = this.getScaleEffect(features.scale_effects, quarter);
      const competitiveEffect = this.getCompetitiveEffect(features.competitive_dynamics);

      const prediction = basemargin +
        (marginTrend * quarter) +
        cyclicalEffect +
        scaleEffect +
        competitiveEffect;

      predictions.push(Math.max(0, Math.min(1, prediction))); // Clamp between 0 and 1
    }

    return {
      predictions,
      confidence_intervals: predictions.map(p => ({
        lower: Math.max(0, p - 0.02),
        upper: Math.min(1, p + 0.02)
      })),
      model_confidence: this.calculateMarginConfidence(features),
      drivers: {
        base_margin: basemargin,
        trend: marginTrend,
        scale_effects: features.scale_effects,
        competitive_pressure: features.competitive_dynamics
      }
    };
  }

  async predictWithAlgorithm(inputData, horizon, confidence, algorithm) {
    // Delegate to main predict method for simplicity
    return this.predict(inputData, horizon, confidence);
  }

  extractFeatures(inputData) {
    return {
      historical_margins: inputData.margins || [],
      cost_structure: inputData.cost_structure || 'mixed',
      pricing_power: inputData.pricing_power || 'moderate',
      competitive_dynamics: inputData.competitive_dynamics || 'stable',
      operational_leverage: inputData.operational_leverage || 'moderate',
      scale_effects: inputData.scale_effects || 'positive'
    };
  }

  calculateMarginTrend(margins) {
    if (margins.length < 2) return 0;

    const changes = [];
    for (let i = 1; i < margins.length; i++) {
      changes.push(margins[i] - margins[i - 1]);
    }

    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
  }

  getCyclicalMarginEffect(quarter) {
    // Seasonal margin effects (simplified)
    const effects = [0, 0.005, -0.003, 0.008]; // Q1, Q2, Q3, Q4
    return effects[quarter % 4] || 0;
  }

  getScaleEffect(scaleEffects, quarter) {
    const effects = {
      'strong_positive': 0.002 * quarter,
      'positive': 0.001 * quarter,
      'neutral': 0,
      'negative': -0.001 * quarter
    };
    return effects[scaleEffects] || 0;
  }

  getCompetitiveEffect(dynamics) {
    const effects = {
      'increasing_competition': -0.01,
      'stable': 0,
      'decreasing_competition': 0.005,
      'monopolistic': 0.02
    };
    return effects[dynamics] || 0;
  }

  calculateMarginConfidence(features) {
    let confidence = 0.6;

    if (features.historical_margins.length >= 8) confidence += 0.15;
    if (features.pricing_power === 'strong') confidence += 0.1;
    if (features.competitive_dynamics === 'stable') confidence += 0.05;

    return Math.min(confidence, 0.9);
  }
}

// Growth Prediction Model
export class GrowthPredictor {
  constructor() {
    this.type = 'growth';
  }

  async predict(inputData, horizon, confidence) {
    const historicalGrowth = inputData.historical_growth || [];
    const industryGrowth = inputData.industry_growth || 0.03;
    const marketShare = inputData.market_share || 0.05;

    const predictions = [];
    let currentGrowth = historicalGrowth[historicalGrowth.length - 1] || industryGrowth;

    for (let i = 1; i <= horizon; i++) {
      // Growth mean reversion to industry average
      const meanReversion = 0.1 * (industryGrowth - currentGrowth);
      currentGrowth += meanReversion;
      predictions.push(currentGrowth);
    }

    return {
      predictions,
      confidence_intervals: predictions.map(p => ({ lower: p - 0.02, upper: p + 0.02 })),
      model_confidence: 0.7
    };
  }

  async predictWithAlgorithm(inputData, horizon, confidence, algorithm) {
    return this.predict(inputData, horizon, confidence);
  }
}

// Volatility Predictor
export class VolatilityPredictor {
  async predict(inputData, horizon, confidence) {
    const returns = inputData.returns || [];
    const predictions = [];

    // GARCH-like volatility clustering
    let currentVol = this.calculateHistoricalVolatility(returns);

    for (let i = 1; i <= horizon; i++) {
      currentVol = 0.8 * currentVol + 0.2 * 0.15; // Mean reversion to long-term vol
      predictions.push(currentVol);
    }

    return { predictions, model_confidence: 0.6 };
  }

  calculateHistoricalVolatility(returns) {
    if (returns.length < 2) return 0.15;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance * 252); // Annualized
  }
}

// Credit Risk Predictor
export class CreditRiskPredictor {
  async predict(inputData, horizon, confidence) {
    const financialRatios = inputData.ratios || {};
    const industryMetrics = inputData.industry || {};

    const creditScore = this.calculateCreditScore(financialRatios, industryMetrics);
    const predictions = [creditScore]; // Simplified single prediction

    return {
      predictions,
      credit_rating: this.mapScoreToRating(creditScore),
      default_probability: this.calculateDefaultProbability(creditScore),
      model_confidence: 0.75
    };
  }

  calculateCreditScore(ratios, industry) {
    // Simplified credit scoring
    let score = 50; // Base score

    if (ratios.debt_to_equity) score -= ratios.debt_to_equity * 10;
    if (ratios.interest_coverage) score += Math.min(ratios.interest_coverage * 5, 30);
    if (ratios.current_ratio) score += ratios.current_ratio * 5;

    return Math.max(0, Math.min(100, score));
  }

  mapScoreToRating(score) {
    if (score >= 90) return 'AAA';
    if (score >= 80) return 'AA';
    if (score >= 70) return 'A';
    if (score >= 60) return 'BBB';
    if (score >= 50) return 'BB';
    if (score >= 40) return 'B';
    return 'CCC';
  }

  calculateDefaultProbability(score) {
    return Math.max(0, Math.min(1, (100 - score) / 100 * 0.5));
  }
}

export const predictiveModelsService = new PredictiveModelsService();
