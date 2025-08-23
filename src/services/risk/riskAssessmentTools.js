// Risk Assessment Tools - Phase 2 Implementation
export class RiskAssessmentService {
  constructor() {
    this.assessments = new Map();
    this.covenantAnalyses = new Map();
    this.creditScores = new Map();
    this.riskModels = new Map();
    this.stresstests = new Map();
    this.eventHandlers = new Map();
    this.initializeRiskFrameworks();
    this.initializeCovenantTemplates();
  }

  initializeRiskFrameworks() {
    const frameworks = {
      'basel_iii': {
        name: 'Basel III Framework',
        categories: ['credit_risk', 'market_risk', 'operational_risk', 'liquidity_risk'],
        weights: { credit_risk: 0.4, market_risk: 0.3, operational_risk: 0.2, liquidity_risk: 0.1 },
        thresholds: { low: 0.3, medium: 0.6, high: 0.8 }
      },
      'coso': {
        name: 'COSO Enterprise Risk Management',
        categories: ['strategic_risk', 'operational_risk', 'reporting_risk', 'compliance_risk'],
        weights: { strategic_risk: 0.35, operational_risk: 0.25, reporting_risk: 0.2, compliance_risk: 0.2 },
        thresholds: { low: 0.25, medium: 0.55, high: 0.75 }
      },
      'iso_31000': {
        name: 'ISO 31000 Risk Management',
        categories: ['financial_risk', 'operational_risk', 'strategic_risk', 'hazard_risk'],
        weights: { financial_risk: 0.3, operational_risk: 0.3, strategic_risk: 0.25, hazard_risk: 0.15 },
        thresholds: { low: 0.3, medium: 0.6, high: 0.8 }
      }
    };

    Object.entries(frameworks).forEach(([id, framework]) => {
      this.riskModels.set(id, framework);
    });
  }

  initializeCovenantTemplates() {
    const templates = {
      'senior_credit': {
        name: 'Senior Credit Facility',
        financial_covenants: [
          {
            type: 'debt_to_ebitda',
            name: 'Debt to EBITDA Ratio',
            threshold: 3.5,
            direction: 'max',
            testFrequency: 'quarterly',
            stepDown: [
              { date: 'Year 2', threshold: 3.25 },
              { date: 'Year 3', threshold: 3.0 }
            ]
          },
          {
            type: 'fixed_charge_coverage',
            name: 'Fixed Charge Coverage Ratio',
            threshold: 1.25,
            direction: 'min',
            testFrequency: 'quarterly'
          },
          {
            type: 'minimum_liquidity',
            name: 'Minimum Liquidity',
            threshold: 50000000,
            direction: 'min',
            testFrequency: 'monthly'
          }
        ],
        negative_covenants: [
          'no_additional_debt_without_consent',
          'no_material_acquisitions_without_consent',
          'no_dividends_if_default',
          'no_asset_sales_above_threshold'
        ],
        affirmative_covenants: [
          'maintain_insurance',
          'provide_financial_statements',
          'comply_with_laws',
          'maintain_corporate_existence'
        ]
      },
      'high_yield_bond': {
        name: 'High Yield Bond',
        financial_covenants: [
          {
            type: 'debt_to_ebitda',
            name: 'Debt to EBITDA Ratio',
            threshold: 6.0,
            direction: 'max',
            testFrequency: 'quarterly'
          },
          {
            type: 'interest_coverage',
            name: 'Interest Coverage Ratio',
            threshold: 2.0,
            direction: 'min',
            testFrequency: 'quarterly'
          }
        ],
        negative_covenants: [
          'restricted_payments_basket',
          'debt_incurrence_test',
          'asset_sale_restrictions',
          'merger_restrictions'
        ]
      }
    };

    this.covenantTemplates = templates;
  }

  // Covenant Analysis
  async analyzeCovenants(companyData, covenantPackage, options = {}) {
    const analysis = {
      id: this.generateAnalysisId(),
      companyId: companyData.companyId,
      covenantPackage,
      analysisDate: new Date().toISOString(),
      testPeriod: options.testPeriod || 'current',
      projectionPeriods: options.projectionPeriods || 8 // quarters
    };

    // Test current compliance
    analysis.currentCompliance = this.testCovenantCompliance(
      companyData.financials,
      covenantPackage.financial_covenants
    );

    // Project future compliance
    analysis.projectedCompliance = this.projectCovenantCompliance(
      companyData.projections,
      covenantPackage.financial_covenants,
      analysis.projectionPeriods
    );

    // Calculate covenant cushions
    analysis.covenantCushions = this.calculateCovenantCushions(
      companyData.financials,
      covenantPackage.financial_covenants
    );

    // Stress testing
    analysis.stressTests = await this.performCovenantStressTests(
      companyData,
      covenantPackage.financial_covenants,
      options.stressScenarios
    );

    // Risk assessment
    analysis.riskAssessment = this.assessCovenantRisk(analysis);

    // Recommendations
    analysis.recommendations = this.generateCovenantRecommendations(analysis);

    this.covenantAnalyses.set(analysis.id, analysis);
    this.emit('covenant_analysis_completed', analysis);
    
    return analysis;
  }

  testCovenantCompliance(financials, covenants) {
    const results = [];

    covenants.forEach(covenant => {
      const result = {
        covenantName: covenant.name,
        type: covenant.type,
        threshold: covenant.threshold,
        direction: covenant.direction,
        actualValue: this.calculateCovenantMetric(financials, covenant.type),
        isCompliant: false,
        cushion: 0,
        severity: 'low'
      };

      // Determine compliance
      if (covenant.direction === 'max') {
        result.isCompliant = result.actualValue <= covenant.threshold;
        result.cushion = covenant.threshold - result.actualValue;
      } else if (covenant.direction === 'min') {
        result.isCompliant = result.actualValue >= covenant.threshold;
        result.cushion = result.actualValue - covenant.threshold;
      }

      // Assess severity of breach
      if (!result.isCompliant) {
        const breach = Math.abs(result.cushion);
        const thresholdPercent = breach / Math.abs(covenant.threshold);
        
        if (thresholdPercent > 0.2) result.severity = 'high';
        else if (thresholdPercent > 0.1) result.severity = 'medium';
        else result.severity = 'low';
      }

      results.push(result);
    });

    return {
      tests: results,
      overallCompliance: results.every(r => r.isCompliant),
      breachedCovenants: results.filter(r => !r.isCompliant),
      atRiskCovenants: results.filter(r => r.isCompliant && Math.abs(r.cushion) / Math.abs(r.threshold || 1) < 0.1)
    };
  }

  calculateCovenantMetric(financials, metricType) {
    const {
      totalDebt,
      ebitda,
      ebit,
      interestExpense,
      fixedCharges,
      cash,
      revolvingCredit,
      netIncome,
      totalAssets,
      currentAssets,
      currentLiabilities
    } = financials;

    switch (metricType) {
      case 'debt_to_ebitda':
        return totalDebt / ebitda;
      case 'fixed_charge_coverage':
        return (ebit + fixedCharges) / (interestExpense + fixedCharges);
      case 'interest_coverage':
        return ebit / interestExpense;
      case 'minimum_liquidity':
        return cash + revolvingCredit;
      case 'current_ratio':
        return currentAssets / currentLiabilities;
      case 'tangible_net_worth':
        return totalAssets - totalDebt; // Simplified
      case 'debt_service_coverage':
        return (netIncome + interestExpense) / (interestExpense + this.calculatePrincipalPayments(financials));
      default:
        return 0;
    }
  }

  projectCovenantCompliance(projections, covenants, periods) {
    const projectedResults = [];

    for (let period = 1; period <= periods; period++) {
      const projectedFinancials = projections[`period_${period}`] || projections.quarterly?.[period - 1];
      
      if (projectedFinancials) {
        const periodResult = {
          period,
          date: this.calculateProjectionDate(period),
          compliance: this.testCovenantCompliance(projectedFinancials, covenants)
        };
        projectedResults.push(periodResult);
      }
    }

    return {
      projections: projectedResults,
      firstBreach: projectedResults.find(p => !p.compliance.overallCompliance),
      persistentBreaches: this.identifyPersistentBreaches(projectedResults),
      trendAnalysis: this.analyzeCovenantTrends(projectedResults)
    };
  }

  calculateCovenantCushions(financials, covenants) {
    return covenants.map(covenant => {
      const actualValue = this.calculateCovenantMetric(financials, covenant.type);
      const cushion = covenant.direction === 'max' ? 
        covenant.threshold - actualValue : 
        actualValue - covenant.threshold;
      
      const cushionPercent = Math.abs(cushion) / Math.abs(covenant.threshold || 1) * 100;

      return {
        covenantName: covenant.name,
        type: covenant.type,
        actualValue,
        threshold: covenant.threshold,
        cushion,
        cushionPercent: Math.round(cushionPercent * 100) / 100,
        riskLevel: this.assessCushionRisk(cushionPercent, covenant.direction === 'max' ? cushion >= 0 : cushion >= 0)
      };
    });
  }

  async performCovenantStressTests(companyData, covenants, stressScenarios = []) {
    const defaultScenarios = [
      { name: 'Revenue Down 10%', revenueChange: -0.1, ebitdaMarginChange: 0 },
      { name: 'Revenue Down 20%', revenueChange: -0.2, ebitdaMarginChange: 0 },
      { name: 'EBITDA Margin Down 200bps', revenueChange: 0, ebitdaMarginChange: -0.02 },
      { name: 'Combined Stress', revenueChange: -0.15, ebitdaMarginChange: -0.015 }
    ];

    const scenarios = stressScenarios.length > 0 ? stressScenarios : defaultScenarios;
    const stressResults = [];

    for (const scenario of scenarios) {
      const stressedFinancials = this.applyStressScenario(companyData.financials, scenario);
      const stressTestResult = {
        scenarioName: scenario.name,
        parameters: scenario,
        stressedMetrics: stressedFinancials,
        compliance: this.testCovenantCompliance(stressedFinancials, covenants),
        impact: this.calculateStressImpact(companyData.financials, stressedFinancials, covenants)
      };
      stressResults.push(stressTestResult);
    }

    return {
      scenarios: stressResults,
      worstCase: stressResults.reduce((worst, current) => 
        current.compliance.breachedCovenants.length > worst.compliance.breachedCovenants.length ? current : worst
      ),
      summary: this.summarizeStressTestResults(stressResults)
    };
  }

  applyStressScenario(baseFinancials, scenario) {
    const stressed = { ...baseFinancials };

    // Apply revenue stress
    if (scenario.revenueChange) {
      stressed.sales = stressed.sales * (1 + scenario.revenueChange);
    }

    // Apply EBITDA margin stress
    if (scenario.ebitdaMarginChange) {
      const currentMargin = stressed.ebitda / stressed.sales;
      const newMargin = Math.max(0, currentMargin + scenario.ebitdaMarginChange);
      stressed.ebitda = stressed.sales * newMargin;
      stressed.ebit = stressed.ebitda - (stressed.depreciation || 0);
    }

    // Apply other scenario parameters
    Object.keys(scenario).forEach(key => {
      if (key.endsWith('Change') && stressed[key.replace('Change', '')]) {
        const baseKey = key.replace('Change', '');
        stressed[baseKey] = stressed[baseKey] * (1 + scenario[key]);
      }
    });

    return stressed;
  }

  // Credit Scoring System
  async calculateCreditScore(companyData, scoringModel = 'comprehensive') {
    const score = {
      id: this.generateScoreId(),
      companyId: companyData.companyId,
      scoringModel,
      calculatedAt: new Date().toISOString()
    };

    switch (scoringModel) {
      case 'comprehensive':
        score.result = this.calculateComprehensiveScore(companyData);
        break;
      case 'financial_only':
        score.result = this.calculateFinancialScore(companyData);
        break;
      case 'industry_adjusted':
        score.result = this.calculateIndustryAdjustedScore(companyData);
        break;
      default:
        throw new Error(`Unknown scoring model: ${scoringModel}`);
    }

    this.creditScores.set(score.id, score);
    return score;
  }

  calculateComprehensiveScore(companyData) {
    const components = {
      financial: this.scoreFinancialMetrics(companyData.financials),
      qualitative: this.scoreQualitativeFactors(companyData.qualitative || {}),
      industry: this.scoreIndustryFactors(companyData.industry),
      esg: this.scoreESGFactors(companyData.esg || {})
    };

    const weights = { financial: 0.5, qualitative: 0.25, industry: 0.15, esg: 0.1 };
    
    const totalScore = Object.entries(components).reduce((sum, [category, score]) => {
      return sum + (score.score * weights[category]);
    }, 0);

    return {
      totalScore: Math.round(totalScore),
      grade: this.scoreToGrade(totalScore),
      components,
      weights,
      strengths: this.identifyScoreStrengths(components),
      weaknesses: this.identifyScoreWeaknesses(components),
      recommendations: this.generateScoreRecommendations(components, totalScore)
    };
  }

  scoreFinancialMetrics(financials) {
    const ratios = this.calculateFinancialRatios(financials);
    const scores = {};

    // Leverage scoring (0-100)
    scores.leverage = this.scoreLeverage(ratios.leverageRatio);
    scores.liquidity = this.scoreLiquidity(ratios.currentRatio);
    scores.profitability = this.scoreProfitability(ratios.profitMargin);
    scores.efficiency = this.scoreEfficiency(ratios.assetTurnover);
    scores.coverage = this.scoreCoverage(ratios.interestCoverage);

    const avgScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;

    return {
      score: Math.round(avgScore),
      subscores: scores,
      keyMetrics: ratios,
      assessment: this.assessFinancialScore(avgScore)
    };
  }

  scoreLeverage(leverageRatio) {
    if (leverageRatio < 1) return 95;
    if (leverageRatio < 2) return 85;
    if (leverageRatio < 3) return 75;
    if (leverageRatio < 4) return 65;
    if (leverageRatio < 6) return 50;
    return 30;
  }

  scoreLiquidity(currentRatio) {
    if (currentRatio > 3) return 95;
    if (currentRatio > 2.5) return 90;
    if (currentRatio > 2) return 85;
    if (currentRatio > 1.5) return 75;
    if (currentRatio > 1.2) return 65;
    return 40;
  }

  scoreProfitability(profitMargin) {
    if (profitMargin > 0.15) return 95;
    if (profitMargin > 0.1) return 85;
    if (profitMargin > 0.05) return 75;
    if (profitMargin > 0.02) return 65;
    if (profitMargin > 0) return 55;
    return 25;
  }

  scoreCoverage(interestCoverage) {
    if (interestCoverage > 10) return 95;
    if (interestCoverage > 5) return 85;
    if (interestCoverage > 3) return 75;
    if (interestCoverage > 2) return 65;
    if (interestCoverage > 1.5) return 50;
    return 25;
  }

  scoreToGrade(score) {
    if (score >= 90) return 'AAA';
    if (score >= 85) return 'AA';
    if (score >= 80) return 'A';
    if (score >= 75) return 'BBB';
    if (score >= 70) return 'BB';
    if (score >= 65) return 'B';
    if (score >= 60) return 'CCC';
    return 'D';
  }

  // Risk Profiling
  async createRiskProfile(companyData, framework = 'basel_iii') {
    const profile = {
      id: this.generateProfileId(),
      companyId: companyData.companyId,
      framework,
      createdAt: new Date().toISOString()
    };

    const riskFramework = this.riskModels.get(framework);
    if (!riskFramework) {
      throw new Error(`Unknown risk framework: ${framework}`);
    }

    // Assess each risk category
    profile.riskCategories = {};
    for (const category of riskFramework.categories) {
      profile.riskCategories[category] = this.assessRiskCategory(companyData, category);
    }

    // Calculate overall risk score
    profile.overallRisk = this.calculateOverallRisk(profile.riskCategories, riskFramework.weights);
    profile.riskLevel = this.categorizeRisk(profile.overallRisk.score, riskFramework.thresholds);

    // Generate insights and recommendations
    profile.insights = this.generateRiskInsights(profile);
    profile.recommendations = this.generateRiskRecommendations(profile);
    profile.monitoring = this.generateMonitoringPlan(profile);

    this.assessments.set(profile.id, profile);
    return profile;
  }

  assessRiskCategory(companyData, category) {
    const assessmentMethods = {
      credit_risk: this.assessCreditRisk.bind(this),
      market_risk: this.assessMarketRisk.bind(this),
      operational_risk: this.assessOperationalRisk.bind(this),
      liquidity_risk: this.assessLiquidityRisk.bind(this),
      strategic_risk: this.assessStrategicRisk.bind(this),
      compliance_risk: this.assessComplianceRisk.bind(this)
    };

    const assessMethod = assessmentMethods[category];
    if (!assessMethod) {
      return { score: 0.5, level: 'medium', factors: [], rationale: 'Assessment method not implemented' };
    }

    return assessMethod(companyData);
  }

  assessCreditRisk(companyData) {
    const financials = companyData.financials;
    const ratios = this.calculateFinancialRatios(financials);

    const factors = [
      { name: 'Leverage Ratio', value: ratios.leverageRatio, weight: 0.3, threshold: 3 },
      { name: 'Interest Coverage', value: ratios.interestCoverage, weight: 0.25, threshold: 3 },
      { name: 'Debt to EBITDA', value: ratios.debtToEbitda, weight: 0.25, threshold: 4 },
      { name: 'Current Ratio', value: ratios.currentRatio, weight: 0.2, threshold: 1.5 }
    ];

    let riskScore = 0;
    factors.forEach(factor => {
      let factorRisk;
      if (factor.name === 'Interest Coverage' || factor.name === 'Current Ratio') {
        factorRisk = factor.value < factor.threshold ? 0.8 : 0.2;
      } else {
        factorRisk = factor.value > factor.threshold ? 0.8 : 0.2;
      }
      riskScore += factorRisk * factor.weight;
    });

    return {
      score: Math.round(riskScore * 100) / 100,
      level: this.scoreToCreditRiskLevel(riskScore),
      factors: factors.map(f => ({ ...f, riskContribution: this.calculateFactorRisk(f) })),
      rationale: this.generateCreditRiskRationale(factors, riskScore)
    };
  }

  assessLiquidityRisk(companyData) {
    const financials = companyData.financials;
    const {
      cash,
      currentAssets,
      currentLiabilities,
      revolvingCredit = 0,
      operatingCashFlow
    } = financials;

    const liquidityRatio = (cash + revolvingCredit) / currentLiabilities;
    const quickRatio = (currentAssets - (financials.inventory || 0)) / currentLiabilities;
    const cashConversionCycle = this.calculateCashConversionCycle(financials);

    let riskScore = 0;
    
    // Liquidity ratio assessment
    if (liquidityRatio < 0.2) riskScore += 0.4;
    else if (liquidityRatio < 0.5) riskScore += 0.2;
    
    // Quick ratio assessment
    if (quickRatio < 1) riskScore += 0.3;
    else if (quickRatio < 1.5) riskScore += 0.1;
    
    // Operating cash flow assessment
    if (operatingCashFlow < 0) riskScore += 0.3;

    return {
      score: Math.min(1, riskScore),
      level: this.scoreToRiskLevel(riskScore),
      metrics: {
        liquidityRatio,
        quickRatio,
        cashConversionCycle,
        operatingCashFlow
      },
      rationale: this.generateLiquidityRiskRationale(liquidityRatio, quickRatio, operatingCashFlow)
    };
  }

  // Utility Methods
  calculateProjectionDate(period) {
    const baseDate = new Date();
    baseDate.setMonth(baseDate.getMonth() + (period * 3)); // Quarterly projections
    return baseDate.toISOString().split('T')[0];
  }

  assessCushionRisk(cushionPercent, isCompliant) {
    if (!isCompliant) return 'High';
    if (cushionPercent < 10) return 'High';
    if (cushionPercent < 20) return 'Medium';
    return 'Low';
  }

  generateAnalysisId() {
    return `risk_analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateScoreId() {
    return `credit_score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateProfileId() {
    return `risk_profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
          console.error(`Error in risk assessment event handler for ${event}:`, error);
        }
      });
    }
  }

  // Query Methods
  getAssessmentHistory(companyId) {
    return Array.from(this.assessments.values())
      .filter(assessment => assessment.companyId === companyId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getCovenantAnalyses(companyId) {
    return Array.from(this.covenantAnalyses.values())
      .filter(analysis => analysis.companyId === companyId)
      .sort((a, b) => new Date(b.analysisDate) - new Date(a.analysisDate));
  }

  getCreditScoreHistory(companyId) {
    return Array.from(this.creditScores.values())
      .filter(score => score.companyId === companyId)
      .sort((a, b) => new Date(b.calculatedAt) - new Date(a.calculatedAt));
  }
}

export const riskAssessmentService = new RiskAssessmentService();
