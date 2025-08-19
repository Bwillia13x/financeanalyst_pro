import { apiLogger as _apiLogger } from '../utils/apiLogger.js';

/**
 * Advanced Financial Metrics Service
 * Comprehensive collection of industry-standard financial ratios, metrics, and analytical tools
 */
class AdvancedFinancialMetrics {
  constructor() {
    this.benchmarkData = new Map();
    this.industryAverages = new Map();
  }

  /**
   * Calculate comprehensive liquidity ratios
   * @param {Object} financialData - Balance sheet and income statement data
   * @returns {Object} Liquidity ratios
   */
  calculateLiquidityRatios(financialData) {
    const { balanceSheet, incomeStatement } = financialData;

    return {
      // Basic liquidity ratios
      currentRatio: this.safeDivide(balanceSheet.currentAssets, balanceSheet.currentLiabilities),
      quickRatio: this.safeDivide(
        balanceSheet.currentAssets - balanceSheet.inventory,
        balanceSheet.currentLiabilities
      ),
      cashRatio: this.safeDivide(
        balanceSheet.cash + balanceSheet.marketableSecurities,
        balanceSheet.currentLiabilities
      ),

      // Advanced liquidity metrics
      operatingCashFlowRatio: this.safeDivide(
        incomeStatement.operatingCashFlow,
        balanceSheet.currentLiabilities
      ),
      defensiveInterval: this.safeDivide(
        balanceSheet.cash + balanceSheet.marketableSecurities + balanceSheet.accountsReceivable,
        incomeStatement.dailyOperatingExpenses || (incomeStatement.operatingExpenses / 365)
      ),
      workingCapital: balanceSheet.currentAssets - balanceSheet.currentLiabilities,
      workingCapitalRatio: this.safeDivide(
        balanceSheet.currentAssets - balanceSheet.currentLiabilities,
        balanceSheet.totalAssets
      ),

      // Days-based metrics
      daysInCash: this.safeDivide(
        balanceSheet.cash,
        incomeStatement.dailyOperatingExpenses || (incomeStatement.operatingExpenses / 365)
      ),
      cashConversionCycle: this.calculateCashConversionCycle(financialData)
    };
  }

  /**
   * Calculate comprehensive leverage and solvency ratios
   * @param {Object} financialData - Financial statements data
   * @returns {Object} Leverage and solvency ratios
   */
  calculateLeverageRatios(financialData) {
    const { balanceSheet, incomeStatement } = financialData;

    return {
      // Debt ratios
      debtToEquity: this.safeDivide(balanceSheet.totalDebt, balanceSheet.totalEquity),
      debtToAssets: this.safeDivide(balanceSheet.totalDebt, balanceSheet.totalAssets),
      debtToCapital: this.safeDivide(
        balanceSheet.totalDebt,
        balanceSheet.totalDebt + balanceSheet.totalEquity
      ),
      longTermDebtToEquity: this.safeDivide(balanceSheet.longTermDebt, balanceSheet.totalEquity),

      // Coverage ratios
      interestCoverage: this.safeDivide(incomeStatement.ebit, incomeStatement.interestExpense),
      ebitdaCoverage: this.safeDivide(incomeStatement.ebitda, incomeStatement.interestExpense),
      debtServiceCoverage: this.safeDivide(
        incomeStatement.ebitda,
        incomeStatement.interestExpense + balanceSheet.currentPortionLongTermDebt
      ),
      fixedChargeCoverage: this.safeDivide(
        incomeStatement.ebit + incomeStatement.leaseExpense,
        incomeStatement.interestExpense + incomeStatement.leaseExpense
      ),

      // Advanced solvency metrics
      capitalAdequacyRatio: this.safeDivide(
        balanceSheet.totalEquity,
        balanceSheet.riskWeightedAssets || balanceSheet.totalAssets
      ),
      equityMultiplier: this.safeDivide(balanceSheet.totalAssets, balanceSheet.totalEquity),
      financialLeverage: this.safeDivide(balanceSheet.totalAssets, balanceSheet.totalEquity),

      // Cash flow coverage
      cashCoverage: this.safeDivide(
        incomeStatement.operatingCashFlow,
        incomeStatement.interestExpense
      ),
      capexCoverage: this.safeDivide(
        incomeStatement.operatingCashFlow,
        incomeStatement.capitalExpenditures
      )
    };
  }

  /**
   * Calculate comprehensive profitability ratios
   * @param {Object} financialData - Financial statements data
   * @returns {Object} Profitability ratios
   */
  calculateProfitabilityRatios(financialData) {
    const { balanceSheet, incomeStatement } = financialData;

    return {
      // Margin ratios
      grossMargin: this.safeDivide(incomeStatement.grossProfit, incomeStatement.revenue),
      operatingMargin: this.safeDivide(incomeStatement.operatingIncome, incomeStatement.revenue),
      ebitMargin: this.safeDivide(incomeStatement.ebit, incomeStatement.revenue),
      ebitdaMargin: this.safeDivide(incomeStatement.ebitda, incomeStatement.revenue),
      netMargin: this.safeDivide(incomeStatement.netIncome, incomeStatement.revenue),

      // Return ratios
      roa: this.safeDivide(incomeStatement.netIncome, balanceSheet.totalAssets),
      roe: this.safeDivide(incomeStatement.netIncome, balanceSheet.totalEquity),
      roic: this.calculateROIC(financialData),
      roace: this.safeDivide(
        incomeStatement.nopat,
        balanceSheet.totalAssets - balanceSheet.currentLiabilities
      ),

      // Advanced profitability metrics
      economicProfit: this.calculateEconomicProfit(financialData),
      eva: this.calculateEVA(financialData),
      residualIncome: this.calculateResidualIncome(financialData),

      // DuPont analysis components
      dupontROE: this.calculateDuPontROE(financialData),
      dupontROA: this.calculateDuPontROA(financialData),

      // Risk-adjusted returns
      rorac: this.calculateRORAC(financialData),
      raroc: this.calculateRAROC(financialData)
    };
  }

  /**
   * Calculate comprehensive efficiency ratios
   * @param {Object} financialData - Financial statements data
   * @returns {Object} Efficiency ratios
   */
  calculateEfficiencyRatios(financialData) {
    const { balanceSheet, incomeStatement } = financialData;

    return {
      // Activity ratios
      assetTurnover: this.safeDivide(incomeStatement.revenue, balanceSheet.totalAssets),
      inventoryTurnover: this.safeDivide(incomeStatement.cogs, balanceSheet.inventory),
      receivablesTurnover: this.safeDivide(incomeStatement.revenue, balanceSheet.accountsReceivable),
      payablesTurnover: this.safeDivide(incomeStatement.cogs, balanceSheet.accountsPayable),
      workingCapitalTurnover: this.safeDivide(
        incomeStatement.revenue,
        balanceSheet.currentAssets - balanceSheet.currentLiabilities
      ),

      // Days ratios
      daysInInventory: this.safeDivide(365, this.safeDivide(incomeStatement.cogs, balanceSheet.inventory)),
      daysInReceivables: this.safeDivide(365, this.safeDivide(incomeStatement.revenue, balanceSheet.accountsReceivable)),
      daysInPayables: this.safeDivide(365, this.safeDivide(incomeStatement.cogs, balanceSheet.accountsPayable)),

      // Fixed asset efficiency
      fixedAssetTurnover: this.safeDivide(incomeStatement.revenue, balanceSheet.netPPE),
      totalCapitalTurnover: this.safeDivide(
        incomeStatement.revenue,
        balanceSheet.totalDebt + balanceSheet.totalEquity
      ),

      // Advanced efficiency metrics
      employeeProductivity: this.safeDivide(
        incomeStatement.revenue,
        incomeStatement.numberOfEmployees || 1
      ),
      revenuePerEmployee: this.safeDivide(
        incomeStatement.revenue,
        incomeStatement.numberOfEmployees || 1
      ),
      assetUtilization: this.safeDivide(incomeStatement.ebitda, balanceSheet.totalAssets)
    };
  }

  /**
   * Calculate comprehensive valuation ratios
   * @param {Object} financialData - Financial statements and market data
   * @returns {Object} Valuation ratios
   */
  calculateValuationRatios(financialData) {
    const { balanceSheet, incomeStatement, marketData } = financialData;
    const { stockPrice, sharesOutstanding: _sharesOutstanding, marketCap, enterpriseValue } = marketData;

    return {
      // Price ratios
      priceToEarnings: this.safeDivide(stockPrice, incomeStatement.epsBasic),
      priceToBook: this.safeDivide(stockPrice, balanceSheet.bookValuePerShare),
      priceToSales: this.safeDivide(marketCap, incomeStatement.revenue),
      priceToTangibleBook: this.safeDivide(
        marketCap,
        balanceSheet.tangibleBookValue || (balanceSheet.totalEquity - balanceSheet.intangibleAssets)
      ),

      // Enterprise ratios
      evToRevenue: this.safeDivide(enterpriseValue, incomeStatement.revenue),
      evToEbitda: this.safeDivide(enterpriseValue, incomeStatement.ebitda),
      evToEbit: this.safeDivide(enterpriseValue, incomeStatement.ebit),
      evToFcf: this.safeDivide(enterpriseValue, incomeStatement.freeCashFlow),

      // Growth-adjusted ratios
      pegRatio: this.safeDivide(
        this.safeDivide(stockPrice, incomeStatement.epsBasic),
        incomeStatement.epsGrowthRate * 100
      ),
      priceToEarningsGrowth: this.calculatePEG(financialData),

      // Advanced valuation metrics
      marketToBook: this.safeDivide(marketCap, balanceSheet.totalEquity),
      enterpriseMultiple: this.safeDivide(enterpriseValue, incomeStatement.ebitda),
      salesMultiple: this.safeDivide(enterpriseValue, incomeStatement.revenue),

      // Dividend ratios
      dividendYield: this.safeDivide(incomeStatement.dividendPerShare, stockPrice),
      dividendPayout: this.safeDivide(incomeStatement.dividendsTotal, incomeStatement.netIncome),
      retentionRatio: 1 - this.safeDivide(incomeStatement.dividendsTotal, incomeStatement.netIncome)
    };
  }

  /**
   * Calculate credit and risk ratios
   * @param {Object} financialData - Financial statements data
   * @returns {Object} Credit and risk ratios
   */
  calculateCreditRatios(financialData) {
    const { balanceSheet, incomeStatement } = financialData;

    return {
      // Credit strength ratios
      altmanZScore: this.calculateAltmanZScore(financialData),
      piotroskiFScore: this.calculatePiotroskiFScore(financialData),
      benishMScore: this.calculateBenishMScore(financialData),

      // Default probability indicators
      distanceToDefault: this.calculateDistanceToDefault(financialData),
      creditRisk: this.assessCreditRisk(financialData),

      // Quality ratios
      accrualRatio: this.safeDivide(
        incomeStatement.netIncome - incomeStatement.operatingCashFlow,
        balanceSheet.totalAssets
      ),
      qualityOfEarnings: this.safeDivide(
        incomeStatement.operatingCashFlow,
        incomeStatement.netIncome
      ),

      // Stability ratios
      earningsVolatility: this.calculateEarningsVolatility(financialData),
      cashFlowVolatility: this.calculateCashFlowVolatility(financialData),

      // Bankruptcy prediction
      ohlsonOScore: this.calculateOhlsonOScore(financialData),
      zmijewskiScore: this.calculateZmijewskiScore(financialData)
    };
  }

  /**
   * Calculate Return on Invested Capital (ROIC)
   */
  calculateROIC(financialData) {
    const { balanceSheet, incomeStatement } = financialData;
    const nopat = incomeStatement.nopat || (incomeStatement.ebit * (1 - incomeStatement.taxRate));
    const investedCapital = balanceSheet.totalAssets - balanceSheet.currentLiabilities +
                           balanceSheet.cash - balanceSheet.goodwill;

    return this.safeDivide(nopat, investedCapital);
  }

  /**
   * Calculate Economic Value Added (EVA)
   */
  calculateEVA(financialData) {
    const { balanceSheet, incomeStatement, assumptions } = financialData;
    const wacc = assumptions?.wacc || 0.1;
    const nopat = incomeStatement.nopat || (incomeStatement.ebit * (1 - incomeStatement.taxRate));
    const investedCapital = balanceSheet.totalAssets - balanceSheet.currentLiabilities;

    return nopat - (wacc * investedCapital);
  }

  /**
   * Calculate Economic Profit
   */
  calculateEconomicProfit(financialData) {
    const { balanceSheet, incomeStatement, assumptions } = financialData;
    const requiredReturn = assumptions?.requiredReturn || 0.12;
    const totalCapital = balanceSheet.totalDebt + balanceSheet.totalEquity;

    return incomeStatement.netIncome - (requiredReturn * totalCapital);
  }

  /**
   * Calculate Residual Income
   */
  calculateResidualIncome(financialData) {
    const { balanceSheet, incomeStatement, assumptions } = financialData;
    const costOfEquity = assumptions?.costOfEquity || 0.12;

    return incomeStatement.netIncome - (costOfEquity * balanceSheet.totalEquity);
  }

  /**
   * Calculate DuPont ROE decomposition
   */
  calculateDuPontROE(financialData) {
    const { balanceSheet, incomeStatement } = financialData;

    const netMargin = this.safeDivide(incomeStatement.netIncome, incomeStatement.revenue);
    const assetTurnover = this.safeDivide(incomeStatement.revenue, balanceSheet.totalAssets);
    const equityMultiplier = this.safeDivide(balanceSheet.totalAssets, balanceSheet.totalEquity);

    return {
      roe: netMargin * assetTurnover * equityMultiplier,
      netMargin,
      assetTurnover,
      equityMultiplier,
      components: {
        profitability: netMargin,
        efficiency: assetTurnover,
        leverage: equityMultiplier
      }
    };
  }

  /**
   * Calculate DuPont ROA decomposition
   */
  calculateDuPontROA(financialData) {
    const { balanceSheet, incomeStatement } = financialData;

    const netMargin = this.safeDivide(incomeStatement.netIncome, incomeStatement.revenue);
    const assetTurnover = this.safeDivide(incomeStatement.revenue, balanceSheet.totalAssets);

    return {
      roa: netMargin * assetTurnover,
      netMargin,
      assetTurnover
    };
  }

  /**
   * Calculate Cash Conversion Cycle
   */
  calculateCashConversionCycle(financialData) {
    const { balanceSheet, incomeStatement } = financialData;

    const daysInInventory = this.safeDivide(365, this.safeDivide(incomeStatement.cogs, balanceSheet.inventory));
    const daysInReceivables = this.safeDivide(365, this.safeDivide(incomeStatement.revenue, balanceSheet.accountsReceivable));
    const daysInPayables = this.safeDivide(365, this.safeDivide(incomeStatement.cogs, balanceSheet.accountsPayable));

    return daysInInventory + daysInReceivables - daysInPayables;
  }

  /**
   * Calculate Altman Z-Score for bankruptcy prediction
   */
  calculateAltmanZScore(financialData) {
    const { balanceSheet, incomeStatement } = financialData;

    const workingCapital = balanceSheet.currentAssets - balanceSheet.currentLiabilities;
    const retainedEarnings = balanceSheet.retainedEarnings || 0;
    const ebit = incomeStatement.ebit;
    const marketValueEquity = incomeStatement.marketCap || balanceSheet.totalEquity;
    const sales = incomeStatement.revenue;
    const totalAssets = balanceSheet.totalAssets;
    const totalLiabilities = balanceSheet.totalLiabilities;

    const z1 = 1.2 * this.safeDivide(workingCapital, totalAssets);
    const z2 = 1.4 * this.safeDivide(retainedEarnings, totalAssets);
    const z3 = 3.3 * this.safeDivide(ebit, totalAssets);
    const z4 = 0.6 * this.safeDivide(marketValueEquity, totalLiabilities);
    const z5 = 1.0 * this.safeDivide(sales, totalAssets);

    return z1 + z2 + z3 + z4 + z5;
  }

  /**
   * Calculate Piotroski F-Score for fundamental strength
   */
  calculatePiotroskiFScore(financialData) {
    const { balanceSheet, incomeStatement, priorYearData } = financialData;
    let score = 0;

    // Profitability signals (4 points max)
    if (incomeStatement.netIncome > 0) score += 1;
    if (incomeStatement.operatingCashFlow > 0) score += 1;
    if (this.calculateROA(financialData) > (priorYearData?.roa || 0)) score += 1;
    if (incomeStatement.operatingCashFlow > incomeStatement.netIncome) score += 1;

    // Leverage, liquidity and source of funds signals (3 points max)
    if (balanceSheet.longTermDebt < (priorYearData?.balanceSheet?.longTermDebt || Infinity)) score += 1;
    if (this.calculateCurrentRatio(financialData) > (priorYearData?.currentRatio || 0)) score += 1;
    if (balanceSheet.sharesOutstanding <= (priorYearData?.balanceSheet?.sharesOutstanding || Infinity)) score += 1;

    // Operating efficiency signals (2 points max)
    if (this.calculateGrossMargin(financialData) > (priorYearData?.grossMargin || 0)) score += 1;
    if (this.calculateAssetTurnover(financialData) > (priorYearData?.assetTurnover || 0)) score += 1;

    return score;
  }

  /**
   * Calculate comprehensive financial health score
   */
  calculateFinancialHealthScore(financialData) {
    const liquidity = this.calculateLiquidityRatios(financialData);
    const leverage = this.calculateLeverageRatios(financialData);
    const profitability = this.calculateProfitabilityRatios(financialData);
    const efficiency = this.calculateEfficiencyRatios(financialData);
    const credit = this.calculateCreditRatios(financialData);

    // Weighted scoring system
    const liquidityScore = this.scoreLiquidity(liquidity);
    const leverageScore = this.scoreLeverage(leverage);
    const profitabilityScore = this.scoreProfitability(profitability);
    const efficiencyScore = this.scoreEfficiency(efficiency);
    const creditScore = this.scoreCredit(credit);

    const weights = {
      liquidity: 0.2,
      leverage: 0.25,
      profitability: 0.3,
      efficiency: 0.15,
      credit: 0.1
    };

    const overallScore =
      liquidityScore * weights.liquidity +
      leverageScore * weights.leverage +
      profitabilityScore * weights.profitability +
      efficiencyScore * weights.efficiency +
      creditScore * weights.credit;

    return {
      overallScore: Math.round(overallScore),
      components: {
        liquidity: liquidityScore,
        leverage: leverageScore,
        profitability: profitabilityScore,
        efficiency: efficiencyScore,
        credit: creditScore
      },
      grade: this.getFinancialGrade(overallScore),
      recommendations: this.generateRecommendations(financialData)
    };
  }

  /**
   * Generate financial recommendations based on analysis
   */
  generateRecommendations(financialData) {
    const recommendations = [];
    const liquidity = this.calculateLiquidityRatios(financialData);
    const leverage = this.calculateLeverageRatios(financialData);
    const profitability = this.calculateProfitabilityRatios(financialData);

    // Liquidity recommendations
    if (liquidity.currentRatio < 1.0) {
      recommendations.push({
        category: 'Liquidity',
        priority: 'High',
        issue: 'Low current ratio indicates potential liquidity problems',
        recommendation: 'Focus on improving cash management and reducing current liabilities'
      });
    }

    // Leverage recommendations
    if (leverage.debtToEquity > 2.0) {
      recommendations.push({
        category: 'Leverage',
        priority: 'High',
        issue: 'High debt-to-equity ratio indicates excessive leverage',
        recommendation: 'Consider debt reduction strategies and equity financing'
      });
    }

    // Profitability recommendations
    if (profitability.netMargin < 0.05) {
      recommendations.push({
        category: 'Profitability',
        priority: 'Medium',
        issue: 'Low profit margins indicate efficiency challenges',
        recommendation: 'Review cost structure and pricing strategies'
      });
    }

    return recommendations;
  }

  // Helper methods for scoring
  scoreLiquidity(ratios) {
    let score = 0;
    if (ratios.currentRatio >= 2.0) score += 25;
    else if (ratios.currentRatio >= 1.5) score += 20;
    else if (ratios.currentRatio >= 1.0) score += 15;
    else score += 5;

    if (ratios.quickRatio >= 1.0) score += 25;
    else if (ratios.quickRatio >= 0.5) score += 15;
    else score += 5;

    return Math.min(score, 100);
  }

  scoreLeverage(ratios) {
    let score = 0;
    if (ratios.debtToEquity <= 0.5) score += 30;
    else if (ratios.debtToEquity <= 1.0) score += 25;
    else if (ratios.debtToEquity <= 2.0) score += 15;
    else score += 5;

    if (ratios.interestCoverage >= 5.0) score += 20;
    else if (ratios.interestCoverage >= 2.5) score += 15;
    else if (ratios.interestCoverage >= 1.5) score += 10;
    else score += 2;

    return Math.min(score, 100);
  }

  scoreProfitability(ratios) {
    let score = 0;
    if (ratios.roe >= 0.15) score += 25;
    else if (ratios.roe >= 0.10) score += 20;
    else if (ratios.roe >= 0.05) score += 15;
    else if (ratios.roe > 0) score += 10;
    else score += 0;

    if (ratios.netMargin >= 0.10) score += 25;
    else if (ratios.netMargin >= 0.05) score += 20;
    else if (ratios.netMargin >= 0.02) score += 15;
    else if (ratios.netMargin > 0) score += 10;
    else score += 0;

    return Math.min(score, 100);
  }

  scoreEfficiency(ratios) {
    let score = 0;
    if (ratios.assetTurnover >= 1.5) score += 30;
    else if (ratios.assetTurnover >= 1.0) score += 25;
    else if (ratios.assetTurnover >= 0.5) score += 15;
    else score += 5;

    if (ratios.inventoryTurnover >= 8) score += 20;
    else if (ratios.inventoryTurnover >= 4) score += 15;
    else if (ratios.inventoryTurnover >= 2) score += 10;
    else score += 5;

    return Math.min(score, 100);
  }

  scoreCredit(ratios) {
    let score = 0;
    if (ratios.altmanZScore >= 3.0) score += 40;
    else if (ratios.altmanZScore >= 1.8) score += 30;
    else if (ratios.altmanZScore >= 1.0) score += 20;
    else score += 10;

    if (ratios.piotroskiFScore >= 7) score += 30;
    else if (ratios.piotroskiFScore >= 5) score += 20;
    else if (ratios.piotroskiFScore >= 3) score += 15;
    else score += 5;

    return Math.min(score, 100);
  }

  getFinancialGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 40) return 'D';
    return 'F';
  }

  // Additional helper methods
  calculateROA(financialData) {
    return this.safeDivide(
      financialData.incomeStatement.netIncome,
      financialData.balanceSheet.totalAssets
    );
  }

  calculateCurrentRatio(financialData) {
    return this.safeDivide(
      financialData.balanceSheet.currentAssets,
      financialData.balanceSheet.currentLiabilities
    );
  }

  calculateGrossMargin(financialData) {
    return this.safeDivide(
      financialData.incomeStatement.grossProfit,
      financialData.incomeStatement.revenue
    );
  }

  calculateAssetTurnover(financialData) {
    return this.safeDivide(
      financialData.incomeStatement.revenue,
      financialData.balanceSheet.totalAssets
    );
  }

  /**
   * Safe division to avoid division by zero
   */
  safeDivide(numerator, denominator) {
    if (!denominator || denominator === 0) return 0;
    return numerator / denominator;
  }

  /**
   * Calculate Return on Risk-Adjusted Capital (RORAC)
   */
  calculateRORAC(financialData) {
    const { incomeStatement, riskData } = financialData;
    const riskAdjustedCapital = riskData?.riskAdjustedCapital || incomeStatement.totalEquity;
    return this.safeDivide(incomeStatement.netIncome, riskAdjustedCapital);
  }

  /**
   * Calculate Risk-Adjusted Return on Capital (RAROC)
   */
  calculateRAROC(financialData) {
    const { incomeStatement, riskData } = financialData;
    const expectedLoss = riskData?.expectedLoss || 0;
    const allocatedCapital = riskData?.allocatedCapital || incomeStatement.totalEquity;
    return this.safeDivide(incomeStatement.netIncome - expectedLoss, allocatedCapital);
  }

  /**
   * Calculate earnings volatility
   */
  calculateEarningsVolatility(financialData) {
    const { historicalData } = financialData;
    if (!historicalData || historicalData.length < 2) return 0;

    const earnings = historicalData.map(period => period.netIncome);
    const mean = earnings.reduce((sum, e) => sum + e, 0) / earnings.length;
    const variance = earnings.reduce((sum, e) => sum + Math.pow(e - mean, 2), 0) / earnings.length;

    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  /**
   * Calculate cash flow volatility
   */
  calculateCashFlowVolatility(financialData) {
    const { historicalData } = financialData;
    if (!historicalData || historicalData.length < 2) return 0;

    const cashFlows = historicalData.map(period => period.operatingCashFlow);
    const mean = cashFlows.reduce((sum, cf) => sum + cf, 0) / cashFlows.length;
    const variance = cashFlows.reduce((sum, cf) => sum + Math.pow(cf - mean, 2), 0) / cashFlows.length;

    return Math.sqrt(variance) / Math.abs(mean); // Coefficient of variation
  }

  /**
   * Calculate distance to default (simplified)
   */
  calculateDistanceToDefault(financialData) {
    const { balanceSheet, incomeStatement: _incomeStatement, marketData } = financialData;
    const marketValueEquity = marketData?.marketCap || balanceSheet.totalEquity;
    const volatility = marketData?.volatility || 0.3; // Default 30% volatility
    const debtValue = balanceSheet.totalDebt;
    const assetValue = marketValueEquity + debtValue;

    // Simplified Black-Scholes-Merton model
    const d = Math.log(assetValue / debtValue) / volatility;
    return d;
  }

  /**
   * Assess overall credit risk
   */
  assessCreditRisk(financialData) {
    const altmanZ = this.calculateAltmanZScore(financialData);
    const leverage = this.calculateLeverageRatios(financialData);
    const liquidity = this.calculateLiquidityRatios(financialData);

    let riskLevel = 'Low';
    let riskScore = 0;

    // Altman Z-Score assessment
    if (altmanZ < 1.8) riskScore += 3;
    else if (altmanZ < 3.0) riskScore += 1;

    // Leverage assessment
    if (leverage.debtToEquity > 2.0) riskScore += 2;
    else if (leverage.debtToEquity > 1.0) riskScore += 1;

    // Liquidity assessment
    if (liquidity.currentRatio < 1.0) riskScore += 2;
    else if (liquidity.currentRatio < 1.5) riskScore += 1;

    if (riskScore >= 5) riskLevel = 'High';
    else if (riskScore >= 3) riskLevel = 'Medium';

    return {
      level: riskLevel,
      score: riskScore,
      factors: this.identifyRiskFactors(financialData)
    };
  }

  /**
   * Identify key risk factors
   */
  identifyRiskFactors(financialData) {
    const factors = [];
    const leverage = this.calculateLeverageRatios(financialData);
    const liquidity = this.calculateLiquidityRatios(financialData);
    const profitability = this.calculateProfitabilityRatios(financialData);

    if (leverage.debtToEquity > 2.0) factors.push('High leverage');
    if (leverage.interestCoverage < 2.0) factors.push('Low interest coverage');
    if (liquidity.currentRatio < 1.0) factors.push('Liquidity concerns');
    if (profitability.netMargin < 0) factors.push('Negative profitability');
    if (profitability.roe < 0.05) factors.push('Low return on equity');

    return factors;
  }

  /**
   * Calculate Benish M-Score for earnings manipulation detection
   */
  calculateBenishMScore(financialData) {
    // This is a simplified version - actual implementation would require more historical data
    const { balanceSheet, incomeStatement, priorYearData: _priorYearData } = financialData;

    // Placeholder calculation - would need proper implementation with all 8 variables
    const daysInReceivables = this.safeDivide(365, this.safeDivide(incomeStatement.revenue, balanceSheet.accountsReceivable));
    const grossMargin = this.safeDivide(incomeStatement.grossProfit, incomeStatement.revenue);
    const assetTurnover = this.safeDivide(incomeStatement.revenue, balanceSheet.totalAssets);

    // Simplified M-Score calculation (actual formula is more complex)
    return daysInReceivables * 0.92 + grossMargin * 0.528 + assetTurnover * 0.404;
  }

  /**
   * Calculate Ohlson O-Score for bankruptcy prediction
   */
  calculateOhlsonOScore(financialData) {
    const { balanceSheet, incomeStatement } = financialData;

    const size = Math.log(balanceSheet.totalAssets);
    const leverage = this.safeDivide(balanceSheet.totalLiabilities, balanceSheet.totalAssets);
    const workingCapital = this.safeDivide(
      balanceSheet.currentAssets - balanceSheet.currentLiabilities,
      balanceSheet.totalAssets
    );
    const currentLiabilities = this.safeDivide(balanceSheet.currentLiabilities, balanceSheet.currentAssets);
    const netIncome = this.safeDivide(incomeStatement.netIncome, balanceSheet.totalAssets);

    // Simplified O-Score calculation
    return -1.32 - 0.407 * size + 6.03 * leverage - 1.43 * workingCapital +
           0.0757 * currentLiabilities - 2.37 * netIncome;
  }

  /**
   * Calculate Zmijewski Score for bankruptcy prediction
   */
  calculateZmijewskiScore(financialData) {
    const { balanceSheet, incomeStatement } = financialData;

    const netIncome = this.safeDivide(incomeStatement.netIncome, balanceSheet.totalAssets);
    const leverage = this.safeDivide(balanceSheet.totalLiabilities, balanceSheet.totalAssets);
    const liquidity = this.safeDivide(balanceSheet.currentAssets, balanceSheet.currentLiabilities);

    return -4.3 - 4.5 * netIncome + 5.7 * leverage - 0.004 * liquidity;
  }

  /**
   * Calculate PEG ratio with growth rate
   */
  calculatePEG(financialData) {
    const { incomeStatement, marketData } = financialData;
    const pe = this.safeDivide(marketData.stockPrice, incomeStatement.epsBasic);
    const growthRate = incomeStatement.epsGrowthRate || 0;

    return growthRate > 0 ? this.safeDivide(pe, growthRate * 100) : null;
  }
}

// Export singleton instance
export const advancedFinancialMetrics = new AdvancedFinancialMetrics();
/**
 * Medispa-Specific Enhancements
 * Enhanced financial metrics for healthcare services and aesthetic medicine
 */

// Treatment Mix Normalization for Medispa Revenue Analysis
export const treatmentMixAdjustment = (revenue, treatmentBreakdown) => {
  const optimalMix = {
    injectables: 0.45,      // Higher margin treatments (Botox, fillers)
    energyDevices: 0.25,    // Laser, RF, IPL treatments
    skincare: 0.20,         // Products and facial treatments
    bodyTreatments: 0.10    // CoolSculpting, body contouring
  };

  let adjustedRevenue = 0;
  const adjustments = {};

  Object.keys(optimalMix).forEach(treatment => {
    const currentRevenue = revenue * (treatmentBreakdown[treatment] || 0);
    const optimalRevenue = revenue * optimalMix[treatment];
    const adjustedTreatmentRevenue = Math.max(currentRevenue, optimalRevenue * 0.8);

    adjustedRevenue += adjustedTreatmentRevenue;
    adjustments[treatment] = {
      current: currentRevenue,
      optimal: optimalRevenue,
      adjusted: adjustedTreatmentRevenue,
      variance: adjustedTreatmentRevenue - currentRevenue
    };
  });

  return {
    originalRevenue: revenue,
    adjustedRevenue,
    totalAdjustment: adjustedRevenue - revenue,
    treatmentAdjustments: adjustments,
    mixOptimization: optimalMix
  };
};

// Seasonality Smoothing for Aesthetic Services
export const seasonalityAdjustment = (monthlyRevenue) => {
  const seasonalFactors = {
    1: 0.85,  // January - post-holiday slow
    2: 0.90,  // February - gradual pickup
    3: 1.05,  // March - spring preparation
    4: 1.10,  // April - wedding season starts
    5: 1.15,  // May - peak wedding/graduation season
    6: 1.05,  // June - summer activities
    7: 0.95,  // July - vacation slowdown
    8: 0.90,  // August - continued vacation impact
    9: 1.05,  // September - back-to-school boost
    10: 1.10, // October - holiday preparation
    11: 0.95, // November - holiday distraction
    12: 0.95  // December - holiday season impact
  };

  const normalizedRevenue = monthlyRevenue.map((revenue, index) => ({
    month: index + 1,
    original: revenue,
    seasonalFactor: seasonalFactors[index + 1],
    normalized: revenue / seasonalFactors[index + 1],
    adjustment: (revenue / seasonalFactors[index + 1]) - revenue
  }));

  const totalNormalized = normalizedRevenue.reduce((sum, month) => sum + month.normalized, 0);
  const totalOriginal = monthlyRevenue.reduce((sum, revenue) => sum + revenue, 0);

  return {
    monthlyData: normalizedRevenue,
    totalOriginal,
    totalNormalized,
    annualAdjustment: totalNormalized - totalOriginal,
    seasonalityImpact: (totalNormalized - totalOriginal) / totalOriginal
  };
};

// Medispa-Specific KPI Calculator
export const calculateMedspaMetrics = (financialData) => {
  const {
    totalRevenue,
    squareFootage,
    providers,
    customerData = {},
    treatmentData = {},
    operatingData = {}
  } = financialData;

  const metrics = {
    // Efficiency Metrics
    revenuePerSquareFoot: squareFootage ? totalRevenue / squareFootage : null,
    revenuePerProvider: providers ? totalRevenue / providers : null,

    // Customer Metrics
    customerLifetimeValue: calculateCustomerLTV(customerData),
    customerAcquisitionCost: calculateCAC(operatingData),

    // Treatment-Specific Margins
    injectableMargin: calculateInjectableMargin(treatmentData),
    deviceROI: calculateDeviceROI(treatmentData),

    // Operational Metrics
    appointmentUtilization: calculateUtilizationRate(operatingData),
    averageTicket: calculateAverageTicket(customerData),

    // Profitability Ratios
    ebitdaMargin: calculateEBITDAMargin(financialData),
    cashConversionCycle: calculateCashConversionCycle(financialData)
  };

  // Add benchmark comparisons
  const benchmarks = getMedspaBenchmarks();
  const benchmarkComparisons = compareToBenchmarks(metrics, benchmarks);

  return {
    metrics,
    benchmarks,
    comparisons: benchmarkComparisons,
    performanceScore: calculatePerformanceScore(metrics, benchmarks)
  };
};

// Helper Functions for Medispa Calculations
const calculateCustomerLTV = (customerData) => {
  const {
    avgSpend = 0,
    frequency = 0,
    retentionRate = 0.7,
    years = 5
  } = customerData;

  if (!avgSpend || !frequency) return null;

  let clv = 0;
  for (let year = 1; year <= years; year++) {
    clv += (avgSpend * frequency * Math.pow(retentionRate, year - 1));
  }

  return {
    customerLTV: clv,
    annualValue: avgSpend * frequency,
    retentionImpact: clv * (1 - retentionRate),
    components: { avgSpend, frequency, retentionRate, years }
  };
};

const calculateCAC = (operatingData) => {
  const {
    marketingSpend = 0,
    salesExpenses = 0,
    newCustomers = 0
  } = operatingData;

  if (!newCustomers) return null;

  const totalAcquisitionCost = marketingSpend + salesExpenses;
  return {
    cac: totalAcquisitionCost / newCustomers,
    marketingCAC: marketingSpend / newCustomers,
    salesCAC: salesExpenses / newCustomers,
    totalAcquisitionSpend: totalAcquisitionCost
  };
};

const calculateInjectableMargin = (treatmentData) => {
  const {
    injectableRevenue = 0,
    productCosts = 0,
    laborCosts = 0
  } = treatmentData;

  if (!injectableRevenue) return null;

  const grossMargin = (injectableRevenue - productCosts) / injectableRevenue;
  const netMargin = (injectableRevenue - productCosts - laborCosts) / injectableRevenue;

  return {
    grossMargin,
    netMargin,
    productCostRatio: productCosts / injectableRevenue,
    laborCostRatio: laborCosts / injectableRevenue,
    dollarsPerTreatment: injectableRevenue / (treatmentData.treatmentCount || 1)
  };
};

const calculateDeviceROI = (treatmentData) => {
  const {
    deviceRevenue = 0,
    deviceCost = 0,
    deviceLife = 5,
    maintenanceCosts = 0
  } = treatmentData;

  if (!deviceCost) return null;

  const annualDepreciation = deviceCost / deviceLife;
  const annualROI = (deviceRevenue - annualDepreciation - maintenanceCosts) / deviceCost;
  const paybackPeriod = deviceCost / (deviceRevenue - maintenanceCosts);

  return {
    annualROI,
    paybackPeriod,
    annualDepreciation,
    netAnnualCashFlow: deviceRevenue - annualDepreciation - maintenanceCosts,
    totalROI: ((deviceRevenue * deviceLife) - deviceCost - (maintenanceCosts * deviceLife)) / deviceCost
  };
};

// Industry Benchmarks for Medispa Operations
const getMedspaBenchmarks = () => ({
  revenuePerSquareFoot: { min: 400, target: 800, excellent: 1200 },
  revenuePerProvider: { min: 250000, target: 400000, excellent: 600000 },
  injectableGrossMargin: { min: 0.70, target: 0.80, excellent: 0.85 },
  customerRetentionRate: { min: 0.60, target: 0.75, excellent: 0.85 },
  appointmentUtilization: { min: 0.65, target: 0.75, excellent: 0.85 },
  ebitdaMargin: { min: 0.15, target: 0.25, excellent: 0.35 },
  averageTicket: { min: 300, target: 500, excellent: 800 },
  customerLTV: { min: 2000, target: 4000, excellent: 6000 }
});

// Benchmark Comparison Function
const compareToBenchmarks = (metrics, benchmarks) => {
  const comparisons = {};

  Object.keys(benchmarks).forEach(metric => {
    const value = metrics[metric];
    const benchmark = benchmarks[metric];

    if (value !== null && value !== undefined) {
      let performance = 'Below Standard';
      if (value >= benchmark.excellent) performance = 'Excellent';
      else if (value >= benchmark.target) performance = 'Good';
      else if (value >= benchmark.min) performance = 'Acceptable';

      comparisons[metric] = {
        value,
        benchmark,
        performance,
        percentOfTarget: (value / benchmark.target) * 100,
        gap: benchmark.target - value
      };
    }
  });

  return comparisons;
};

// Performance Score Calculation
const calculatePerformanceScore = (metrics, benchmarks) => {
  let totalScore = 0;
  let scoredMetrics = 0;

  Object.keys(benchmarks).forEach(metric => {
    const value = metrics[metric];
    const benchmark = benchmarks[metric];

    if (value !== null && value !== undefined) {
      let score = 0;
      if (value >= benchmark.excellent) score = 100;
      else if (value >= benchmark.target) score = 80;
      else if (value >= benchmark.min) score = 60;
      else score = Math.max(0, (value / benchmark.min) * 60);

      totalScore += score;
      scoredMetrics++;
    }
  });

  const averageScore = scoredMetrics > 0 ? totalScore / scoredMetrics : 0;

  let grade = 'F';
  if (averageScore >= 90) grade = 'A';
  else if (averageScore >= 80) grade = 'B';
  else if (averageScore >= 70) grade = 'C';
  else if (averageScore >= 60) grade = 'D';

  return {
    score: Math.round(averageScore),
    grade,
    scoredMetrics,
    breakdown: `${scoredMetrics} metrics evaluated`
  };
};

// Additional Utility Functions
const calculateUtilizationRate = (operatingData) => {
  const { scheduledHours = 0, availableHours = 0 } = operatingData;
  return availableHours > 0 ? scheduledHours / availableHours : null;
};

const calculateAverageTicket = (customerData) => {
  const { totalRevenue = 0, totalTransactions = 0 } = customerData;
  return totalTransactions > 0 ? totalRevenue / totalTransactions : null;
};

const calculateEBITDAMargin = (financialData) => {
  const { ebitda = 0, totalRevenue = 0 } = financialData;
  return totalRevenue > 0 ? ebitda / totalRevenue : null;
};

const calculateCashConversionCycle = (financialData) => {
  const {
    accountsReceivable = 0,
    inventory = 0,
    accountsPayable = 0,
    dailyRevenue = 0
  } = financialData;

  if (!dailyRevenue) return null;

  const daysReceivable = accountsReceivable / dailyRevenue;
  const daysInventory = inventory / dailyRevenue;
  const daysPayable = accountsPayable / dailyRevenue;

  return daysReceivable + daysInventory - daysPayable;
};

export default AdvancedFinancialMetrics;
