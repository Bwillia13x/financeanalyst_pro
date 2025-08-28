/**
 * AI-Powered Financial Insights Service
 * Provides intelligent analysis, automated suggestions, and financial insights
 */

class AIInsightsService {
  constructor() {
    this.analysisCache = new Map();
    this.insightGenerators = new Map();
    this.modelPatterns = new Map();
    this.industryBenchmarks = new Map();
    this.isInitialized = false;

    // Initialize insight generators
    this.initializeInsightGenerators();
    this.loadIndustryBenchmarks();
  }

  /**
   * Initialize AI insight generators
   */
  initializeInsightGenerators() {
    // Revenue Analysis
    this.insightGenerators.set('revenue', {
      analyze: data => this.analyzeRevenueTrends(data),
      suggest: data => this.suggestRevenueImprovements(data),
      priority: 'high'
    });

    // Profitability Analysis
    this.insightGenerators.set('profitability', {
      analyze: data => this.analyzeProfitability(data),
      suggest: data => this.suggestProfitabilityEnhancements(data),
      priority: 'high'
    });

    // Valuation Analysis
    this.insightGenerators.set('valuation', {
      analyze: data => this.analyzeValuationMetrics(data),
      suggest: data => this.suggestValuationAdjustments(data),
      priority: 'medium'
    });

    // Risk Assessment
    this.insightGenerators.set('risk', {
      analyze: data => this.assessFinancialRisks(data),
      suggest: data => this.suggestRiskMitigation(data),
      priority: 'high'
    });

    // Growth Analysis
    this.insightGenerators.set('growth', {
      analyze: data => this.analyzeGrowthPatterns(data),
      suggest: data => this.suggestGrowthStrategies(data),
      priority: 'medium'
    });

    // Efficiency Analysis
    this.insightGenerators.set('efficiency', {
      analyze: data => this.analyzeOperationalEfficiency(data),
      suggest: data => this.suggestEfficiencyImprovements(data),
      priority: 'medium'
    });
  }

  /**
   * Load industry benchmarks for comparison
   */
  loadIndustryBenchmarks() {
    this.industryBenchmarks.set('technology', {
      revenueGrowth: { min: 15, median: 25, max: 40 },
      grossMargin: { min: 60, median: 75, max: 85 },
      operatingMargin: { min: 10, median: 20, max: 35 },
      currentRatio: { min: 1.5, median: 2.5, max: 4.0 },
      debtToEquity: { min: 0.1, median: 0.3, max: 0.6 }
    });

    this.industryBenchmarks.set('healthcare', {
      revenueGrowth: { min: 8, median: 15, max: 25 },
      grossMargin: { min: 70, median: 80, max: 90 },
      operatingMargin: { min: 15, median: 25, max: 40 },
      currentRatio: { min: 2.0, median: 3.0, max: 5.0 },
      debtToEquity: { min: 0.2, median: 0.4, max: 0.8 }
    });

    this.industryBenchmarks.set('manufacturing', {
      revenueGrowth: { min: 3, median: 8, max: 15 },
      grossMargin: { min: 20, median: 35, max: 50 },
      operatingMargin: { min: 5, median: 12, max: 20 },
      currentRatio: { min: 1.2, median: 1.8, max: 2.5 },
      debtToEquity: { min: 0.3, median: 0.6, max: 1.2 }
    });

    this.industryBenchmarks.set('retail', {
      revenueGrowth: { min: 2, median: 6, max: 12 },
      grossMargin: { min: 25, median: 40, max: 60 },
      operatingMargin: { min: 3, median: 8, max: 15 },
      currentRatio: { min: 1.0, median: 1.5, max: 2.2 },
      debtToEquity: { min: 0.4, median: 0.8, max: 1.5 }
    });
  }

  /**
   * Generate comprehensive AI insights for financial data
   */
  async generateInsights(financialData, options = {}) {
    try {
      const {
        industry = 'technology',
        analysisTypes = ['revenue', 'profitability', 'valuation', 'risk', 'growth'],
        includeRecommendations = true,
        // eslint-disable-next-line no-unused-vars
        confidenceThreshold = 0.7
      } = options;

      const insights = {
        summary: {},
        analyses: {},
        recommendations: [],
        alerts: [],
        opportunities: [],
        risks: [],
        confidence: 0,
        generatedAt: new Date().toISOString()
      };

      // Generate insights for each analysis type
      for (const analysisType of analysisTypes) {
        const generator = this.insightGenerators.get(analysisType);
        if (generator) {
          const analysis = await generator.analyze(financialData);
          const suggestions = includeRecommendations ? await generator.suggest(financialData) : [];

          insights.analyses[analysisType] = {
            analysis,
            suggestions,
            priority: generator.priority,
            confidence: analysis.confidence || 0.8
          };
        }
      }

      // Generate summary insights
      insights.summary = this.generateSummaryInsights(insights.analyses, industry);

      // Extract recommendations, alerts, and opportunities
      this.categorizeInsights(insights);

      // Calculate overall confidence
      insights.confidence = this.calculateOverallConfidence(insights.analyses);

      // Cache insights
      const cacheKey = this.generateCacheKey(financialData, options);
      this.analysisCache.set(cacheKey, insights);

      return insights;
    } catch (error) {
      console.error('Error generating AI insights:', error);
      throw error;
    }
  }

  /**
   * Analyze revenue trends and patterns
   */
  analyzeRevenueTrends(data) {
    const revenues = this.extractTimeSeriesData(data, 'totalRevenue');

    if (revenues.length < 2) {
      return {
        trend: 'insufficient_data',
        growth: null,
        pattern: 'unknown',
        confidence: 0.3,
        insights: ['Insufficient historical data for trend analysis']
      };
    }

    const growth = this.calculateGrowthRate(revenues);
    const pattern = this.identifyPattern(revenues);
    const seasonality = this.detectSeasonality(revenues);

    const insights = [];

    if (growth > 20) {
      insights.push('Strong revenue growth indicates healthy business expansion');
      insights.push('Consider investing in scalable infrastructure to support growth');
    } else if (growth > 10) {
      insights.push('Moderate revenue growth shows steady business performance');
      insights.push('Focus on optimizing existing operations for efficiency');
    } else if (growth > 0) {
      insights.push('Slow revenue growth may indicate market saturation or competition');
      insights.push('Consider diversifying revenue streams or expanding to new markets');
    } else {
      insights.push('Declining revenue requires immediate strategic intervention');
      insights.push('Analyze customer retention and competitive positioning');
    }

    if (seasonality.isDetected) {
      insights.push(
        `Revenue shows ${seasonality.pattern} seasonal pattern - plan cash flow accordingly`
      );
    }

    return {
      trend: growth > 0 ? 'positive' : 'negative',
      growth: Math.round(growth * 100) / 100,
      pattern,
      seasonality,
      confidence: 0.85,
      insights
    };
  }

  /**
   * Analyze profitability metrics
   */
  analyzeProfitability(data) {
    const grossMargin = this.calculateMargin(data, 'gross');
    const operatingMargin = this.calculateMargin(data, 'operating');
    const netMargin = this.calculateMargin(data, 'net');

    const insights = [];
    const trends = this.analyzeMarginTrends(data);

    if (grossMargin > 70) {
      insights.push('Excellent gross margin indicates strong pricing power and cost control');
    } else if (grossMargin > 50) {
      insights.push('Good gross margin provides flexibility for investment and growth');
    } else if (grossMargin > 30) {
      insights.push('Moderate gross margin suggests room for cost optimization');
    } else {
      insights.push('Low gross margin indicates pricing pressure or high cost structure');
    }

    if (operatingMargin > 20) {
      insights.push('Strong operating margin demonstrates efficient operations');
    } else if (operatingMargin > 10) {
      insights.push('Healthy operating margin with room for improvement');
    } else if (operatingMargin > 0) {
      insights.push('Operating margin under pressure - focus on cost management');
    } else {
      insights.push('Negative operating margin requires immediate cost restructuring');
    }

    return {
      grossMargin,
      operatingMargin,
      netMargin,
      trends,
      confidence: 0.9,
      insights
    };
  }

  /**
   * Analyze valuation metrics
   */
  analyzeValuationMetrics(data) {
    const dcfValue = this.estimateDCFValue(data);
    const peRatio = this.calculatePERatio(data);
    const pbRatio = this.calculatePBRatio(data);
    const evEbitda = this.calculateEVEBITDA(data);

    const insights = [];

    if (peRatio < 15) {
      insights.push('Low P/E ratio may indicate undervaluation or growth concerns');
    } else if (peRatio < 25) {
      insights.push('Moderate P/E ratio suggests fair valuation');
    } else {
      insights.push('High P/E ratio indicates growth expectations or potential overvaluation');
    }

    if (pbRatio < 1) {
      insights.push('P/B ratio below 1 may indicate undervaluation or asset quality issues');
    } else if (pbRatio < 3) {
      insights.push('Reasonable P/B ratio for most industries');
    } else {
      insights.push('High P/B ratio suggests premium valuation or asset-light business');
    }

    return {
      dcfValue,
      peRatio,
      pbRatio,
      evEbitda,
      confidence: 0.75,
      insights
    };
  }

  /**
   * Assess financial risks
   */
  assessFinancialRisks(data) {
    const liquidityRisk = this.assessLiquidityRisk(data);
    const leverageRisk = this.assessLeverageRisk(data);
    const concentrationRisk = this.assessConcentrationRisk(data);
    const marketRisk = this.assessMarketRisk(data);

    const insights = [];
    const overallRisk = Math.max(
      liquidityRisk.score,
      leverageRisk.score,
      concentrationRisk.score,
      marketRisk.score
    );

    if (overallRisk > 0.7) {
      insights.push('High risk profile requires careful monitoring and mitigation strategies');
    } else if (overallRisk > 0.4) {
      insights.push('Moderate risk level with specific areas requiring attention');
    } else {
      insights.push('Low risk profile indicates financial stability');
    }

    return {
      overall: overallRisk,
      liquidity: liquidityRisk,
      leverage: leverageRisk,
      concentration: concentrationRisk,
      market: marketRisk,
      confidence: 0.8,
      insights
    };
  }

  /**
   * Analyze growth patterns
   */
  analyzeGrowthPatterns(data) {
    const revenueGrowth = this.analyzeRevenueGrowth(data);
    const profitGrowth = this.analyzeProfitGrowth(data);
    const assetGrowth = this.analyzeAssetGrowth(data);
    const sustainability = this.assessGrowthSustainability(data);

    const insights = [];

    if (revenueGrowth > profitGrowth + 5) {
      insights.push('Revenue growing faster than profit - monitor cost control');
    } else if (profitGrowth > revenueGrowth + 5) {
      insights.push('Profit growing faster than revenue - excellent operational efficiency');
    } else {
      insights.push('Balanced revenue and profit growth indicates healthy scaling');
    }

    if (sustainability.score > 0.7) {
      insights.push('Growth appears sustainable based on current fundamentals');
    } else {
      insights.push('Growth sustainability concerns - monitor key metrics closely');
    }

    return {
      revenue: revenueGrowth,
      profit: profitGrowth,
      assets: assetGrowth,
      sustainability,
      confidence: 0.8,
      insights
    };
  }

  /**
   * Analyze operational efficiency
   */
  analyzeOperationalEfficiency(data) {
    const assetTurnover = this.calculateAssetTurnover(data);
    const inventoryTurnover = this.calculateInventoryTurnover(data);
    const receivablesTurnover = this.calculateReceivablesTurnover(data);
    const employeeProductivity = this.calculateEmployeeProductivity(data);

    const insights = [];

    if (assetTurnover > 1.5) {
      insights.push('Strong asset utilization generates good returns');
    } else if (assetTurnover > 1.0) {
      insights.push('Moderate asset efficiency with room for improvement');
    } else {
      insights.push('Low asset turnover suggests underutilized resources');
    }

    return {
      assetTurnover,
      inventoryTurnover,
      receivablesTurnover,
      employeeProductivity,
      confidence: 0.75,
      insights
    };
  }

  /**
   * Suggest revenue improvements
   */
  suggestRevenueImprovements(data) {
    const suggestions = [];
    const currentGrowth = this.calculateGrowthRate(
      this.extractTimeSeriesData(data, 'totalRevenue')
    );

    if (currentGrowth < 5) {
      suggestions.push({
        category: 'market_expansion',
        title: 'Expand to New Markets',
        description: 'Consider geographic expansion or new customer segments',
        impact: 'high',
        effort: 'high',
        timeframe: '6-12 months'
      });
    }

    if (this.calculateMargin(data, 'gross') < 50) {
      suggestions.push({
        category: 'pricing_optimization',
        title: 'Optimize Pricing Strategy',
        description: 'Analyze pricing elasticity and competitive positioning',
        impact: 'medium',
        effort: 'low',
        timeframe: '1-3 months'
      });
    }

    suggestions.push({
      category: 'product_innovation',
      title: 'Develop New Products/Services',
      description: 'Invest in R&D to create differentiated offerings',
      impact: 'high',
      effort: 'high',
      timeframe: '12-24 months'
    });

    return suggestions;
  }

  /**
   * Suggest profitability enhancements
   */
  suggestProfitabilityEnhancements(data) {
    const suggestions = [];
    const grossMargin = this.calculateMargin(data, 'gross');
    const operatingMargin = this.calculateMargin(data, 'operating');
    const netMargin = this.calculateMargin(data, 'net');

    // Cost reduction opportunities
    if (grossMargin < 60) {
      suggestions.push({
        category: 'cost_reduction',
        title: 'Optimize Cost of Goods Sold',
        description:
          'Review supplier contracts, negotiate better terms, or explore alternative sourcing',
        impact: 'high',
        effort: 'medium',
        timeframe: '3-6 months',
        potentialImprovement: `${Math.round((60 - grossMargin) * 0.5)}% margin improvement possible`
      });
    }

    // Operating expense optimization
    if (operatingMargin < 15) {
      suggestions.push({
        category: 'efficiency',
        title: 'Streamline Operating Expenses',
        description:
          'Implement process automation, reduce overhead, and optimize workforce allocation',
        impact: 'high',
        effort: 'high',
        timeframe: '6-12 months',
        potentialImprovement: '5-10% reduction in operating expenses'
      });
    }

    // Pricing strategy improvements
    if (netMargin < 10) {
      suggestions.push({
        category: 'pricing_strategy',
        title: 'Implement Value-Based Pricing',
        description: 'Shift from cost-plus to value-based pricing to capture more margin',
        impact: 'medium',
        effort: 'low',
        timeframe: '2-4 months',
        potentialImprovement: '3-5% improvement in net margins'
      });
    }

    // Asset utilization
    const assetTurnover = this.calculateAssetTurnover(data);
    if (assetTurnover < 1.2) {
      suggestions.push({
        category: 'asset_optimization',
        title: 'Improve Asset Utilization',
        description:
          'Optimize inventory levels, improve receivables collection, and maximize fixed asset usage',
        impact: 'medium',
        effort: 'medium',
        timeframe: '4-8 months',
        potentialImprovement: `${Math.round((1.2 - assetTurnover) * 50)}% improvement in asset turnover`
      });
    }

    return suggestions;
  }

  /**
   * Suggest valuation adjustments
   */
  suggestValuationAdjustments(data) {
    const suggestions = [];
    const peRatio = this.calculatePERatio(data);
    const pbRatio = this.calculatePBRatio(data);

    if (peRatio > 30) {
      suggestions.push({
        category: 'valuation_concern',
        title: 'High P/E Ratio Management',
        description:
          'Monitor growth expectations and consider strategies to meet market projections',
        impact: 'medium',
        effort: 'low',
        timeframe: 'Ongoing'
      });
    } else if (peRatio < 15) {
      suggestions.push({
        category: 'valuation_opportunity',
        title: 'Potential Undervaluation',
        description:
          'Consider if current valuation reflects true business potential and growth prospects',
        impact: 'medium',
        effort: 'low',
        timeframe: '1-3 months'
      });
    }

    if (pbRatio > 4) {
      suggestions.push({
        category: 'valuation_concern',
        title: 'High Price-to-Book Ratio',
        description: 'Evaluate if premium valuation is justified by future growth prospects',
        impact: 'medium',
        effort: 'low',
        timeframe: 'Ongoing'
      });
    }

    return suggestions;
  }

  /**
   * Suggest risk mitigation strategies
   */
  suggestRiskMitigation(data) {
    const suggestions = [];
    const liquidityRisk = this.assessLiquidityRisk(data);
    const leverageRisk = this.assessLeverageRisk(data);

    if (liquidityRisk.score > 0.3) {
      suggestions.push({
        category: 'liquidity_management',
        title: 'Strengthen Liquidity Position',
        description: 'Build cash reserves, optimize working capital, and establish credit lines',
        impact: 'high',
        effort: 'medium',
        timeframe: '3-6 months'
      });
    }

    if (leverageRisk.score > 0.3) {
      suggestions.push({
        category: 'debt_management',
        title: 'Optimize Capital Structure',
        description:
          'Consider debt refinancing, equity issuance, or asset sales to reduce leverage',
        impact: 'high',
        effort: 'high',
        timeframe: '6-12 months'
      });
    }

    return suggestions;
  }

  /**
   * Suggest growth strategies
   */
  suggestGrowthStrategies(data) {
    const suggestions = [];
    const revenueGrowth = this.analyzeRevenueGrowth(data);
    const profitGrowth = this.analyzeProfitGrowth(data);

    if (revenueGrowth < 8) {
      suggestions.push({
        category: 'organic_growth',
        title: 'Accelerate Organic Growth',
        description: 'Invest in marketing, sales expansion, and product development',
        impact: 'high',
        effort: 'high',
        timeframe: '12-24 months'
      });
    }

    if (profitGrowth < revenueGrowth - 2) {
      suggestions.push({
        category: 'profitability_focus',
        title: 'Balance Growth with Profitability',
        description:
          'Ensure profit growth keeps pace with revenue expansion through efficient scaling',
        impact: 'medium',
        effort: 'medium',
        timeframe: '6-12 months'
      });
    }

    return suggestions;
  }

  /**
   * Suggest efficiency improvements
   */
  suggestEfficiencyImprovements(data) {
    const suggestions = [];
    const assetTurnover = this.calculateAssetTurnover(data);
    const inventoryTurnover = this.calculateInventoryTurnover(data);

    if (assetTurnover < 1.5) {
      suggestions.push({
        category: 'asset_utilization',
        title: 'Maximize Asset Efficiency',
        description: 'Implement lean manufacturing principles and optimize production processes',
        impact: 'medium',
        effort: 'high',
        timeframe: '6-18 months'
      });
    }

    if (inventoryTurnover < 4) {
      suggestions.push({
        category: 'inventory_management',
        title: 'Optimize Inventory Levels',
        description: 'Implement just-in-time inventory systems and improve demand forecasting',
        impact: 'medium',
        effort: 'medium',
        timeframe: '3-9 months'
      });
    }

    return suggestions;
  }

  /**
   * Generate summary insights across all analyses
   */
  generateSummaryInsights(analyses, industry) {
    const summary = {
      overallHealth: 'good',
      keyStrengths: [],
      primaryConcerns: [],
      topRecommendations: [],
      industryComparison: this.compareToIndustry(analyses, industry)
    };

    // Analyze overall health
    const healthScores = Object.values(analyses).map(a => a.confidence || 0.5);
    const avgHealth = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;

    if (avgHealth > 0.8) summary.overallHealth = 'excellent';
    else if (avgHealth > 0.6) summary.overallHealth = 'good';
    else if (avgHealth > 0.4) summary.overallHealth = 'fair';
    else summary.overallHealth = 'poor';

    return summary;
  }

  /**
   * Categorize insights into recommendations, alerts, and opportunities
   */
  categorizeInsights(insights) {
    Object.values(insights.analyses).forEach(analysis => {
      if (analysis.suggestions) {
        analysis.suggestions.forEach(suggestion => {
          if (suggestion.impact === 'high') {
            insights.recommendations.push(suggestion);
          } else {
            insights.opportunities.push(suggestion);
          }
        });
      }
    });
  }

  /**
   * Helper methods for calculations
   */
  extractTimeSeriesData(data, field) {
    if (!data?.statements?.income) return [];

    return Object.keys(data.statements.income)
      .sort()
      .map(period => data.statements.income[period]?.[field] || 0)
      .filter(value => value !== null && value !== undefined);
  }

  calculateGrowthRate(values) {
    if (values.length < 2) return 0;
    const latest = values[values.length - 1];
    const previous = values[values.length - 2];
    return previous !== 0 ? ((latest - previous) / Math.abs(previous)) * 100 : 0;
  }

  calculateMargin(data, type) {
    const latest = this.getLatestPeriod(data);
    if (!latest) return 0;

    const revenue = latest.totalRevenue || 0;
    if (revenue === 0) return 0;

    switch (type) {
      case 'gross':
        return ((revenue - (latest.totalCostOfGoodsSold || 0)) / revenue) * 100;
      case 'operating':
        return ((latest.operatingIncome || 0) / revenue) * 100;
      case 'net':
        return ((latest.netIncome || 0) / revenue) * 100;
      default:
        return 0;
    }
  }

  getLatestPeriod(data) {
    if (!data?.statements?.income) return null;
    const periods = Object.keys(data.statements.income).sort();
    return periods.length > 0 ? data.statements.income[periods[periods.length - 1]] : null;
  }

  identifyPattern(values) {
    if (values.length < 3) return 'insufficient_data';

    const diffs = [];
    for (let i = 1; i < values.length; i++) {
      diffs.push(values[i] - values[i - 1]);
    }

    const avgDiff = diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length;
    const variance =
      diffs.reduce((sum, diff) => sum + Math.pow(diff - avgDiff, 2), 0) / diffs.length;

    if (variance < Math.abs(avgDiff) * 0.1) {
      return avgDiff > 0 ? 'steady_growth' : 'steady_decline';
    } else {
      return 'volatile';
    }
  }

  detectSeasonality(values) {
    // Simple seasonality detection for quarterly data
    if (values.length < 8) return { isDetected: false, pattern: 'unknown' };

    const quarters = [];
    for (let i = 0; i < 4; i++) {
      quarters[i] = [];
    }

    values.forEach((value, index) => {
      quarters[index % 4].push(value);
    });

    const avgByQuarter = quarters.map(q => q.reduce((sum, val) => sum + val, 0) / q.length);

    const seasonalityScore = Math.max(...avgByQuarter) / Math.min(...avgByQuarter);

    return {
      isDetected: seasonalityScore > 1.2,
      pattern: seasonalityScore > 1.2 ? 'quarterly' : 'none',
      score: seasonalityScore
    };
  }

  calculateOverallConfidence(analyses) {
    const confidences = Object.values(analyses).map(a => a.confidence || 0.5);
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  generateCacheKey(data, options) {
    return `insights_${JSON.stringify(options)}_${Date.now()}`;
  }

  // Additional helper methods for specific calculations
  estimateDCFValue(data) {
    // Simplified DCF estimation
    const fcf = this.getLatestPeriod(data)?.freeCashFlow || 0;
    const growthRate = 0.05; // Assume 5% terminal growth
    const discountRate = 0.1; // Assume 10% WACC

    return fcf > 0 ? (fcf * (1 + growthRate)) / (discountRate - growthRate) : 0;
  }

  calculatePERatio(data) {
    const earnings = this.getLatestPeriod(data)?.netIncome || 0;
    const shares = data.assumptions?.sharesOutstanding || 1000000;
    const price = data.assumptions?.sharePrice || 50;

    const eps = earnings / shares;
    return eps > 0 ? price / eps : 0;
  }

  calculatePBRatio(data) {
    const bookValue = this.getLatestPeriod(data)?.totalEquity || 0;
    const shares = data.assumptions?.sharesOutstanding || 1000000;
    const price = data.assumptions?.sharePrice || 50;

    const bvps = bookValue / shares;
    return bvps > 0 ? price / bvps : 0;
  }

  calculateEVEBITDA(data) {
    const ebitda = this.getLatestPeriod(data)?.ebitda || 0;
    const marketCap =
      (data.assumptions?.sharesOutstanding || 1000000) * (data.assumptions?.sharePrice || 50);
    const debt = this.getLatestPeriod(data)?.totalDebt || 0;
    const cash = this.getLatestPeriod(data)?.cash || 0;

    const enterpriseValue = marketCap + debt - cash;
    return ebitda > 0 ? enterpriseValue / ebitda : 0;
  }

  assessLiquidityRisk(data) {
    const current = this.getLatestPeriod(data);
    const currentRatio = current?.currentRatio || 0;
    const quickRatio = current?.quickRatio || 0;

    let score = 0;
    if (currentRatio < 1) score += 0.4;
    else if (currentRatio < 1.5) score += 0.2;

    if (quickRatio < 0.5) score += 0.3;
    else if (quickRatio < 1) score += 0.1;

    return { score, currentRatio, quickRatio };
  }

  assessLeverageRisk(data) {
    const current = this.getLatestPeriod(data);
    const debtToEquity = current?.debtToEquity || 0;
    const interestCoverage = current?.interestCoverage || 0;

    let score = 0;
    if (debtToEquity > 2) score += 0.4;
    else if (debtToEquity > 1) score += 0.2;

    if (interestCoverage < 2) score += 0.4;
    else if (interestCoverage < 5) score += 0.2;

    return { score, debtToEquity, interestCoverage };
  }

  assessConcentrationRisk(_data) {
    // Simplified concentration risk assessment
    return { score: 0.2, factors: ['Customer concentration not analyzed'] };
  }

  assessMarketRisk(_data) {
    // Simplified market risk assessment
    return { score: 0.3, factors: ['General market volatility'] };
  }

  analyzeRevenueGrowth(data) {
    const revenues = this.extractTimeSeriesData(data, 'totalRevenue');
    return this.calculateGrowthRate(revenues);
  }

  analyzeProfitGrowth(data) {
    const profits = this.extractTimeSeriesData(data, 'netIncome');
    return this.calculateGrowthRate(profits);
  }

  analyzeAssetGrowth(data) {
    const assets = this.extractTimeSeriesData(data, 'totalAssets');
    return this.calculateGrowthRate(assets);
  }

  assessGrowthSustainability(data) {
    const revenueGrowth = this.analyzeRevenueGrowth(data);
    const profitGrowth = this.analyzeProfitGrowth(data);
    const assetGrowth = this.analyzeAssetGrowth(data);

    // Simple sustainability score based on growth consistency
    const consistency = 1 - Math.abs(revenueGrowth - profitGrowth) / 100;
    const efficiency = profitGrowth / Math.max(assetGrowth, 1);

    return {
      score: Math.max(0, Math.min(1, (consistency + efficiency) / 2)),
      factors: { consistency, efficiency }
    };
  }

  calculateAssetTurnover(data) {
    const revenue = this.getLatestPeriod(data)?.totalRevenue || 0;
    const assets = this.getLatestPeriod(data)?.totalAssets || 1;
    return revenue / assets;
  }

  calculateInventoryTurnover(data) {
    const cogs = this.getLatestPeriod(data)?.totalCostOfGoodsSold || 0;
    const inventory = this.getLatestPeriod(data)?.inventory || 1;
    return cogs / inventory;
  }

  calculateReceivablesTurnover(data) {
    const revenue = this.getLatestPeriod(data)?.totalRevenue || 0;
    const receivables = this.getLatestPeriod(data)?.accountsReceivable || 1;
    return revenue / receivables;
  }

  calculateEmployeeProductivity(data) {
    const revenue = this.getLatestPeriod(data)?.totalRevenue || 0;
    const employees = data.assumptions?.employeeCount || 1;
    return revenue / employees;
  }

  analyzeMarginTrends(_data) {
    // Simplified margin trend analysis
    return {
      gross: { trend: 'stable', change: 0 },
      operating: { trend: 'stable', change: 0 },
      net: { trend: 'stable', change: 0 }
    };
  }

  compareToIndustry(analyses, industry) {
    const benchmarks =
      this.industryBenchmarks.get(industry) || this.industryBenchmarks.get('technology');

    return {
      industry,
      comparison: 'analysis_not_available',
      benchmarks
    };
  }
}

// Export singleton instance
export default new AIInsightsService();
