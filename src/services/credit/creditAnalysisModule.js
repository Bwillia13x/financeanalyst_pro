// Credit Analysis Module - Phase 2 Implementation
export class CreditAnalysisService {
  constructor() {
    this.models = new Map();
    this.bondCalculators = new Map();
    this.ratingModels = new Map();
    this.benchmarks = new Map();
    this.eventHandlers = new Map();
    this.initializeRatingModels();
    this.initializeBenchmarks();
  }

  // Initialize credit rating models
  initializeRatingModels() {
    const ratingMappings = {
      'AAA': { score: 950, defaultRate: 0.0003, spread: 25 },
      'AA+': { score: 930, defaultRate: 0.0005, spread: 35 },
      'AA': { score: 910, defaultRate: 0.0008, spread: 45 },
      'AA-': { score: 890, defaultRate: 0.0012, spread: 55 },
      'A+': { score: 870, defaultRate: 0.0018, spread: 70 },
      'A': { score: 850, defaultRate: 0.0025, spread: 85 },
      'A-': { score: 830, defaultRate: 0.0035, spread: 105 },
      'BBB+': { score: 810, defaultRate: 0.0050, spread: 130 },
      'BBB': { score: 790, defaultRate: 0.0070, spread: 160 },
      'BBB-': { score: 770, defaultRate: 0.0100, spread: 195 },
      'BB+': { score: 750, defaultRate: 0.0150, spread: 240 },
      'BB': { score: 730, defaultRate: 0.0220, spread: 295 },
      'BB-': { score: 710, defaultRate: 0.0320, spread: 360 },
      'B+': { score: 690, defaultRate: 0.0460, spread: 440 },
      'B': { score: 670, defaultRate: 0.0650, spread: 540 },
      'B-': { score: 650, defaultRate: 0.0900, spread: 660 },
      'CCC+': { score: 630, defaultRate: 0.1250, spread: 800 },
      'CCC': { score: 610, defaultRate: 0.1700, spread: 1000 },
      'CCC-': { score: 590, defaultRate: 0.2300, spread: 1250 },
      'CC': { score: 570, defaultRate: 0.3000, spread: 1500 },
      'C': { score: 550, defaultRate: 0.4000, spread: 2000 },
      'D': { score: 500, defaultRate: 1.0000, spread: 5000 }
    };

    this.ratingModels.set('sp_ratings', ratingMappings);
  }

  initializeBenchmarks() {
    const industryBenchmarks = {
      'technology': {
        avgLeverage: 2.1,
        avgInterestCoverage: 8.5,
        avgCurrentRatio: 2.8,
        avgROE: 0.18,
        avgDebtToEbitda: 1.8
      },
      'healthcare': {
        avgLeverage: 2.3,
        avgInterestCoverage: 6.2,
        avgCurrentRatio: 2.1,
        avgROE: 0.14,
        avgDebtToEbitda: 2.1
      },
      'energy': {
        avgLeverage: 3.1,
        avgInterestCoverage: 4.8,
        avgCurrentRatio: 1.6,
        avgROE: 0.11,
        avgDebtToEbitda: 2.8
      },
      'financials': {
        avgLeverage: 8.5,
        avgInterestCoverage: 3.2,
        avgCurrentRatio: 1.1,
        avgROE: 0.12,
        avgDebtToEbitda: 'N/A'
      },
      'utilities': {
        avgLeverage: 4.2,
        avgInterestCoverage: 3.8,
        avgCurrentRatio: 1.3,
        avgROE: 0.09,
        avgDebtToEbitda: 3.5
      }
    };

    Object.entries(industryBenchmarks).forEach(([industry, benchmarks]) => {
      this.benchmarks.set(industry, benchmarks);
    });
  }

  // Default Probability Models
  async calculateDefaultProbability(companyData, modelType = 'altman_z') {
    const model = {
      id: this.generateModelId(),
      companyId: companyData.companyId,
      modelType,
      inputData: companyData,
      calculatedAt: new Date().toISOString()
    };

    switch (modelType) {
      case 'altman_z':
        model.result = this.calculateAltmanZScore(companyData);
        break;
      case 'merton':
        model.result = this.calculateMertonModel(companyData);
        break;
      case 'logistic':
        model.result = this.calculateLogisticModel(companyData);
        break;
      case 'kealhofer_mcquown_vasicek':
        model.result = this.calculateKMVModel(companyData);
        break;
      default:
        throw new Error(`Unsupported model type: ${modelType}`);
    }

    this.models.set(model.id, model);
    return model;
  }

  calculateAltmanZScore(data) {
    // Altman Z-Score for public companies
    const {
      workingCapital,
      totalAssets,
      retainedEarnings,
      ebit,
      marketValueEquity,
      totalLiabilities,
      sales
    } = data.financials;

    const ratios = {
      workingCapitalToAssets: workingCapital / totalAssets,
      retainedEarningsToAssets: retainedEarnings / totalAssets,
      ebitToAssets: ebit / totalAssets,
      marketValueEquityToLiabilities: marketValueEquity / totalLiabilities,
      salesToAssets: sales / totalAssets
    };

    const zScore =
      1.2 * ratios.workingCapitalToAssets +
      1.4 * ratios.retainedEarningsToAssets +
      3.3 * ratios.ebitToAssets +
      0.6 * ratios.marketValueEquityToLiabilities +
      1.0 * ratios.salesToAssets;

    let riskLevel, defaultProbability;

    if (zScore > 2.99) {
      riskLevel = 'Low';
      defaultProbability = 0.02;
    } else if (zScore > 1.81) {
      riskLevel = 'Medium';
      defaultProbability = 0.05;
    } else {
      riskLevel = 'High';
      defaultProbability = 0.15;
    }

    return {
      zScore: Math.round(zScore * 100) / 100,
      ratios,
      riskLevel,
      defaultProbability,
      interpretation: this.interpretAltmanScore(zScore),
      benchmarkComparison: this.compareWithBenchmarks(ratios, data.industry)
    };
  }

  calculateMertonModel(data) {
    const {
      marketValueEquity,
      totalDebt,
      volatility,
      riskFreeRate,
      timeHorizon = 1
    } = data;

    const firmValue = marketValueEquity + totalDebt;
    const debtRatio = totalDebt / firmValue;

    // Simplified Merton distance to default
    const d1 = (Math.log(firmValue / totalDebt) + (riskFreeRate + 0.5 * Math.pow(volatility, 2)) * timeHorizon) /
              (volatility * Math.sqrt(timeHorizon));

    const d2 = d1 - volatility * Math.sqrt(timeHorizon);

    // Default probability using normal CDF
    const defaultProbability = this.normalCDF(-d2);

    return {
      firmValue,
      debtRatio,
      distanceToDefault: d2,
      defaultProbability,
      timeHorizon,
      volatility,
      interpretation: this.interpretMertonModel(d2, defaultProbability)
    };
  }

  calculateLogisticModel(data) {
    // Logistic regression model for default prediction
    const ratios = this.calculateFinancialRatios(data.financials);

    // Coefficients based on empirical studies (simplified)
    const coefficients = {
      intercept: -3.2,
      leverageRatio: 2.1,
      interestCoverage: -0.8,
      currentRatio: -0.3,
      profitMargin: -1.5,
      assetTurnover: -0.6
    };

    const logit =
      coefficients.intercept +
      coefficients.leverageRatio * ratios.leverageRatio +
      coefficients.interestCoverage * Math.log(Math.max(ratios.interestCoverage, 0.1)) +
      coefficients.currentRatio * ratios.currentRatio +
      coefficients.profitMargin * ratios.profitMargin +
      coefficients.assetTurnover * ratios.assetTurnover;

    const defaultProbability = 1 / (1 + Math.exp(-logit));

    return {
      ratios,
      coefficients,
      logitScore: logit,
      defaultProbability,
      riskLevel: this.categorizeRisk(defaultProbability),
      interpretation: this.interpretLogisticModel(defaultProbability)
    };
  }

  calculateKMVModel(data) {
    // KMV (Kealhofer, McQuown, Vasicek) Expected Default Frequency model
    const {
      marketValueEquity,
      totalDebt,
      volatility,
      riskFreeRate
    } = data;

    const firmValue = marketValueEquity + totalDebt;
    const assetVolatility = volatility * (marketValueEquity / firmValue);

    const distanceToDefault = (Math.log(firmValue / totalDebt) + (riskFreeRate - 0.5 * Math.pow(assetVolatility, 2))) /
                             assetVolatility;

    // Map distance to default to EDF using historical data
    const edf = this.distanceToEDF(distanceToDefault);

    return {
      firmValue,
      assetVolatility,
      distanceToDefault,
      expectedDefaultFrequency: edf,
      riskLevel: this.categorizeRisk(edf),
      interpretation: this.interpretKMVModel(distanceToDefault, edf)
    };
  }

  // Bond Valuation Models
  async calculateBondValue(bondData, marketConditions) {
    const calculator = {
      id: this.generateCalculatorId(),
      bondDetails: bondData,
      marketConditions,
      calculatedAt: new Date().toISOString()
    };

    // Calculate various bond metrics
    calculator.results = {
      presentValue: this.calculatePresentValue(bondData, marketConditions),
      yieldToMaturity: this.calculateYTM(bondData, marketConditions),
      duration: this.calculateDuration(bondData, marketConditions),
      convexity: this.calculateConvexity(bondData, marketConditions),
      creditSpread: this.calculateCreditSpread(bondData, marketConditions),
      optionAdjustedSpread: this.calculateOAS(bondData, marketConditions)
    };

    this.bondCalculators.set(calculator.id, calculator);
    return calculator;
  }

  calculatePresentValue(bondData, marketConditions) {
    const {
      faceValue = 1000,
      couponRate,
      maturity, // years
      paymentFrequency = 2 // semi-annual
    } = bondData;

    const {
      discountRate,
      creditSpread = 0
    } = marketConditions;

    const totalRate = discountRate + creditSpread;
    const periodsPerYear = paymentFrequency;
    const totalPeriods = maturity * periodsPerYear;
    const periodRate = totalRate / periodsPerYear;
    const couponPayment = (faceValue * couponRate) / periodsPerYear;

    let pv = 0;

    // Present value of coupon payments
    for (let period = 1; period <= totalPeriods; period++) {
      pv += couponPayment / Math.pow(1 + periodRate, period);
    }

    // Present value of principal
    pv += faceValue / Math.pow(1 + periodRate, totalPeriods);

    return {
      presentValue: Math.round(pv * 100) / 100,
      couponPV: Math.round((pv - faceValue / Math.pow(1 + periodRate, totalPeriods)) * 100) / 100,
      principalPV: Math.round((faceValue / Math.pow(1 + periodRate, totalPeriods)) * 100) / 100,
      priceAsPercentOfPar: Math.round((pv / faceValue) * 10000) / 100
    };
  }

  calculateYTM(bondData, marketConditions) {
    const {
      faceValue = 1000,
      couponRate,
      maturity,
      paymentFrequency = 2,
      currentPrice = marketConditions.currentPrice || faceValue
    } = bondData;

    // Newton-Raphson method to solve for YTM
    let ytm = 0.05; // Initial guess
    const tolerance = 0.0001;
    const maxIterations = 100;

    for (let i = 0; i < maxIterations; i++) {
      const price = this.calculatePriceFromYTM(bondData, ytm);
      const derivative = this.calculatePriceDerivative(bondData, ytm);

      const newYTM = ytm - (price - currentPrice) / derivative;

      if (Math.abs(newYTM - ytm) < tolerance) {
        return {
          yieldToMaturity: Math.round(newYTM * 10000) / 100, // in percentage
          iterations: i + 1,
          currentYield: (couponRate * faceValue / currentPrice) * 100,
          equivalentTaxableYield: this.calculateTaxEquivalentYield(newYTM, marketConditions.taxRate || 0)
        };
      }

      ytm = newYTM;
    }

    throw new Error('YTM calculation did not converge');
  }

  calculateDuration(bondData, marketConditions) {
    const {
      faceValue = 1000,
      couponRate,
      maturity,
      paymentFrequency = 2
    } = bondData;

    const ytm = this.calculateYTM(bondData, marketConditions).yieldToMaturity / 100;
    const periodRate = ytm / paymentFrequency;
    const totalPeriods = maturity * paymentFrequency;
    const couponPayment = (faceValue * couponRate) / paymentFrequency;

    let weightedCashFlows = 0;
    let totalPV = 0;

    // Calculate Macaulay Duration
    for (let period = 1; period <= totalPeriods; period++) {
      const cashFlow = period < totalPeriods ? couponPayment : couponPayment + faceValue;
      const pv = cashFlow / Math.pow(1 + periodRate, period);
      const timeWeightedPV = (period / paymentFrequency) * pv;

      weightedCashFlows += timeWeightedPV;
      totalPV += pv;
    }

    const macaulayDuration = weightedCashFlows / totalPV;
    const modifiedDuration = macaulayDuration / (1 + periodRate);

    return {
      macaulayDuration: Math.round(macaulayDuration * 100) / 100,
      modifiedDuration: Math.round(modifiedDuration * 100) / 100,
      dollarDuration: Math.round(modifiedDuration * totalPV * 100) / 100,
      interpretation: this.interpretDuration(modifiedDuration)
    };
  }

  calculateConvexity(bondData, marketConditions) {
    const {
      faceValue = 1000,
      couponRate,
      maturity,
      paymentFrequency = 2
    } = bondData;

    const ytm = this.calculateYTM(bondData, marketConditions).yieldToMaturity / 100;
    const periodRate = ytm / paymentFrequency;
    const totalPeriods = maturity * paymentFrequency;
    const couponPayment = (faceValue * couponRate) / paymentFrequency;

    let convexitySum = 0;
    let totalPV = 0;

    for (let period = 1; period <= totalPeriods; period++) {
      const cashFlow = period < totalPeriods ? couponPayment : couponPayment + faceValue;
      const pv = cashFlow / Math.pow(1 + periodRate, period);
      const convexityTerm = (period * (period + 1) / Math.pow(paymentFrequency, 2)) * pv;

      convexitySum += convexityTerm;
      totalPV += pv;
    }

    const convexity = convexitySum / (totalPV * Math.pow(1 + periodRate, 2));

    return {
      convexity: Math.round(convexity * 100) / 100,
      effectiveConvexity: Math.round(convexity * 100) / 100, // Simplified
      interpretation: this.interpretConvexity(convexity)
    };
  }

  calculateCreditSpread(bondData, marketConditions) {
    const {
      corporateYield,
      treasuryYield,
      rating
    } = { ...bondData, ...marketConditions };

    const creditSpread = corporateYield - treasuryYield;
    const ratingData = this.ratingModels.get('sp_ratings')[rating] || { spread: 0 };

    return {
      creditSpread: Math.round(creditSpread * 100) / 100,
      benchmarkSpread: ratingData.spread,
      spreadDifference: Math.round((creditSpread * 100 - ratingData.spread) * 100) / 100,
      relativeValue: creditSpread > (ratingData.spread / 100) ? 'Cheap' : 'Rich',
      interpretation: this.interpretCreditSpread(creditSpread, rating)
    };
  }

  calculateOAS(bondData, marketConditions) {
    // Simplified OAS calculation (would normally require option pricing models)
    const {
      creditSpread,
      optionValue = 0 // basis points
    } = marketConditions;

    const oas = (creditSpread * 100) - optionValue;

    return {
      optionAdjustedSpread: Math.round(oas * 100) / 100,
      optionValue,
      creditSpread: creditSpread * 100,
      interpretation: this.interpretOAS(oas, bondData.hasEmbeddedOptions)
    };
  }

  // Risk Assessment Tools
  assessCreditRisk(companyData, bondData = null) {
    const assessment = {
      id: this.generateAssessmentId(),
      companyId: companyData.companyId,
      assessmentDate: new Date().toISOString()
    };

    // Calculate multiple risk metrics
    assessment.quantitativeAnalysis = {
      altmanZ: this.calculateAltmanZScore(companyData),
      logisticModel: this.calculateLogisticModel(companyData),
      ratioAnalysis: this.performRatioAnalysis(companyData.financials)
    };

    assessment.qualitativeAnalysis = this.performQualitativeAnalysis(companyData);

    if (bondData) {
      assessment.bondSpecificRisk = this.assessBondSpecificRisk(bondData);
    }

    assessment.overallRating = this.determineOverallRating(assessment);
    assessment.recommendations = this.generateRecommendations(assessment);

    return assessment;
  }

  performRatioAnalysis(financials) {
    const ratios = this.calculateFinancialRatios(financials);
    const industry = financials.industry || 'general';
    const benchmarks = this.benchmarks.get(industry) || this.benchmarks.get('general');

    return {
      ratios,
      benchmarkComparison: this.compareRatiosWithBenchmarks(ratios, benchmarks),
      trends: this.calculateRatioTrends(ratios, financials.historicalData),
      strengths: this.identifyRatioStrengths(ratios, benchmarks),
      concerns: this.identifyRatioConcerns(ratios, benchmarks)
    };
  }

  calculateFinancialRatios(financials) {
    const {
      totalDebt,
      totalEquity,
      totalAssets,
      ebit,
      interestExpense,
      currentAssets,
      currentLiabilities,
      netIncome,
      sales,
      ebitda
    } = financials;

    return {
      leverageRatio: totalDebt / totalEquity,
      debtToAssets: totalDebt / totalAssets,
      interestCoverage: ebit / interestExpense,
      currentRatio: currentAssets / currentLiabilities,
      profitMargin: netIncome / sales,
      assetTurnover: sales / totalAssets,
      returnOnEquity: netIncome / totalEquity,
      returnOnAssets: netIncome / totalAssets,
      debtToEbitda: totalDebt / ebitda,
      ebitdaMargin: ebitda / sales
    };
  }

  performQualitativeAnalysis(companyData) {
    const factors = {
      industryPosition: this.assessIndustryPosition(companyData),
      managementQuality: this.assessManagementQuality(companyData),
      businessModel: this.assessBusinessModel(companyData),
      competitivePosition: this.assessCompetitivePosition(companyData),
      regulatoryEnvironment: this.assessRegulatoryRisk(companyData),
      esgFactors: this.assessESGFactors(companyData)
    };

    return {
      factors,
      overallQualitativeScore: this.calculateQualitativeScore(factors),
      keyStrengths: this.identifyQualitativeStrengths(factors),
      keyConcerns: this.identifyQualitativeConcerns(factors)
    };
  }

  // Utility Functions
  normalCDF(x) {
    // Approximation of normal cumulative distribution function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  distanceToEDF(distance) {
    // Empirical mapping of distance to default to Expected Default Frequency
    if (distance > 6) return 0.001;
    if (distance > 5) return 0.003;
    if (distance > 4) return 0.008;
    if (distance > 3) return 0.025;
    if (distance > 2) return 0.065;
    if (distance > 1) return 0.150;
    if (distance > 0) return 0.300;
    return 0.500;
  }

  categorizeRisk(probability) {
    if (probability < 0.02) return 'Very Low';
    if (probability < 0.05) return 'Low';
    if (probability < 0.10) return 'Medium';
    if (probability < 0.20) return 'High';
    return 'Very High';
  }

  interpretAltmanScore(zScore) {
    if (zScore > 2.99) {
      return 'Strong financial position with low bankruptcy risk. Company demonstrates solid liquidity, profitability, and leverage management.';
    } else if (zScore > 1.81) {
      return 'Moderate financial health with some areas of concern. Monitor key ratios and cash flow trends closely.';
    } else {
      return 'Elevated financial distress risk. Immediate attention required for liquidity management and operational improvements.';
    }
  }

  interpretMertonModel(distance, probability) {
    const riskLevel = this.categorizeRisk(probability);
    return `Distance to default of ${Math.round(distance * 100) / 100} indicates ${riskLevel.toLowerCase()} credit risk. ${probability < 0.05 ? 'Firm has substantial asset cushion.' : 'Monitor asset coverage and volatility closely.'}`;
  }

  interpretLogisticModel(probability) {
    const riskLevel = this.categorizeRisk(probability);
    return `Logistic model indicates ${riskLevel.toLowerCase()} default probability of ${Math.round(probability * 10000) / 100}%. ${probability < 0.10 ? 'Credit metrics support stable outlook.' : 'Consider enhanced monitoring and covenant structures.'}`;
  }

  interpretKMVModel(distance, edf) {
    return `KMV distance to default of ${Math.round(distance * 100) / 100} translates to ${Math.round(edf * 10000) / 100}% EDF. ${distance > 3 ? 'Strong credit profile with low near-term default risk.' : 'Elevated default risk requires careful monitoring.'}`;
  }

  // ID Generation
  generateModelId() {
    return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateCalculatorId() {
    return `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateAssessmentId() {
    return `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event System
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in credit analysis event handler for ${event}:`, error);
        }
      });
    }
  }

  // Query Methods
  getModelHistory(companyId) {
    return Array.from(this.models.values())
      .filter(model => model.companyId === companyId)
      .sort((a, b) => new Date(b.calculatedAt) - new Date(a.calculatedAt));
  }

  getBondCalculations(bondId) {
    return Array.from(this.bondCalculators.values())
      .filter(calc => calc.bondDetails.bondId === bondId)
      .sort((a, b) => new Date(b.calculatedAt) - new Date(a.calculatedAt));
  }
}

export const creditAnalysisService = new CreditAnalysisService();
