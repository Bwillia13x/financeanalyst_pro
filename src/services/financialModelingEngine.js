import { apiLogger } from '../utils/apiLogger.js';

/**
 * Advanced Financial Modeling Engine
 * Provides comprehensive DCF, LBO, and valuation modeling capabilities
 */
class FinancialModelingEngine {
  constructor() {
    this.modelCache = new Map();
    this.assumptions = this.getDefaultAssumptions();
  }

  /**
   * Get default financial modeling assumptions
   */
  getDefaultAssumptions() {
    return {
      dcf: {
        projectionYears: 5,
        terminalGrowthRate: 0.025,
        riskFreeRate: 0.045,
        marketPremium: 0.065,
        taxRate: 0.21,
        capexAsPercentOfRevenue: 0.03,
        nwcAsPercentOfRevenue: 0.05,
        depreciationAsPercentOfRevenue: 0.025,
        // Enhanced DCF parameters
        normalizedMarginTarget: null, // For margin normalization
        cyclicalAdjustment: false,
        industryBeta: 1.0,
        sizeAdjustment: 0.0, // Small company premium
        countryRiskPremium: 0.0,
        liquidityDiscount: 0.0
      },
      lbo: {
        holdingPeriod: 5,
        debtMultiples: { senior: 4.0, subordinated: 1.5, total: 5.5 },
        interestRates: { senior: 0.055, subordinated: 0.095 },
        managementFeeRate: 0.02,
        carriedInterestRate: 0.2,
        ebitdaGrowthRate: 0.05,
        debtPaydownRate: 0.5
      },
      monte_carlo: {
        iterations: 10000,
        confidenceIntervals: [0.05, 0.25, 0.5, 0.75, 0.95],
        correlationMatrix: null
      }
    };
  }

  /**
   * Build comprehensive DCF model with multiple scenarios
   * @param {Object} inputs - DCF model inputs
   * @param {Object} scenarios - Different scenario assumptions
   * @returns {Object} Complete DCF analysis
   */
  buildDCFModel(inputs, scenarios = {}) {
    const {
      symbol,
      companyName,
      currentRevenue,
      historicalGrowthRates = [],
      margins = {},
      balanceSheetData = {},
      marketData = {},
      assumptions = {}
    } = inputs;

    // Merge with default assumptions
    const modelAssumptions = { ...this.assumptions.dcf, ...assumptions };

    // Build base case scenario
    const baseCase = this.calculateDCFScenario(inputs, modelAssumptions, 'Base Case');

    // Build additional scenarios
    const scenarioResults = {};

    // Bull case: Higher growth, lower discount rate
    if (scenarios.bull !== false) {
      const bullAssumptions = {
        ...modelAssumptions,
        revenueGrowthRate: (modelAssumptions.revenueGrowthRate || 0.1) * 1.3,
        terminalGrowthRate: Math.min(modelAssumptions.terminalGrowthRate * 1.2, 0.04),
        wacc: (modelAssumptions.wacc || 0.1) * 0.9
      };
      scenarioResults.bull = this.calculateDCFScenario(inputs, bullAssumptions, 'Bull Case');
    }

    // Bear case: Lower growth, higher discount rate
    if (scenarios.bear !== false) {
      const bearAssumptions = {
        ...modelAssumptions,
        revenueGrowthRate: (modelAssumptions.revenueGrowthRate || 0.1) * 0.7,
        terminalGrowthRate: Math.max(modelAssumptions.terminalGrowthRate * 0.8, 0.015),
        wacc: (modelAssumptions.wacc || 0.1) * 1.1
      };
      scenarioResults.bear = this.calculateDCFScenario(inputs, bearAssumptions, 'Bear Case');
    }

    // Calculate sensitivity analysis
    const sensitivityAnalysis = this.performDCFSensitivityAnalysis(inputs, modelAssumptions);

    return {
      symbol,
      companyName,
      modelType: 'DCF',
      timestamp: new Date().toISOString(),
      baseCase,
      scenarios: scenarioResults,
      sensitivityAnalysis,
      assumptions: modelAssumptions,
      summary: this.generateDCFSummary(baseCase, scenarioResults, inputs.currentPrice)
    };
  }

  /**
   * Calculate DCF for a specific scenario
   * @param {Object} inputs - Model inputs
   * @param {Object} assumptions - Scenario assumptions
   * @param {string} scenarioName - Name of the scenario
   * @returns {Object} DCF calculation results
   */
  calculateDCFScenario(inputs, assumptions, scenarioName) {
    const {
      currentRevenue,
      currentPrice,
      sharesOutstanding,
      totalDebt = 0,
      cash = 0
    } = inputs;

    // Project revenues
    const revenueProjections = this.projectRevenues(
      currentRevenue,
      assumptions.revenueGrowthRate || 0.1,
      assumptions.projectionYears
    );

    // Project operating metrics
    const operatingProjections = this.projectOperatingMetrics(
      revenueProjections,
      assumptions
    );

    // Calculate free cash flows
    const fcfProjections = this.calculateFreeCashFlows(
      operatingProjections,
      assumptions
    );

    // Calculate terminal value
    const finalFCF = fcfProjections[fcfProjections.length - 1]?.unleveredFCF || 0;
    const terminalValue = this.calculateTerminalValue(
      finalFCF,
      assumptions.terminalGrowthRate,
      assumptions.wacc
    );

    // Calculate present values
    const fcfValues = fcfProjections.map(fcf => fcf?.unleveredFCF || 0);
    const pvOfCashFlows = this.calculatePresentValue(fcfValues, assumptions.wacc);
    const pvOfTerminalValue = this.calculatePresentValue([terminalValue], assumptions.wacc, assumptions.projectionYears);

    // Calculate enterprise and equity values
    const enterpriseValue = pvOfCashFlows + pvOfTerminalValue;
    const equityValue = enterpriseValue - totalDebt + cash;
    const pricePerShare = equityValue / sharesOutstanding;

    // Calculate valuation metrics
    const upside = currentPrice ? ((pricePerShare - currentPrice) / currentPrice) * 100 : null;

    return {
      scenarioName,
      revenueProjections,
      operatingProjections,
      fcfProjections,
      terminalValue,
      pvOfCashFlows,
      pvOfTerminalValue,
      enterpriseValue,
      equityValue,
      pricePerShare,
      currentPrice,
      upside,
      wacc: assumptions.wacc,
      terminalGrowthRate: assumptions.terminalGrowthRate,
      impliedMultiples: this.calculateImpliedMultiples(enterpriseValue, operatingProjections)
    };
  }

  /**
   * Project revenue growth over multiple years
   * @param {number} baseRevenue - Starting revenue
   * @param {number|Array} growthRates - Growth rate(s)
   * @param {number} years - Number of years to project
   * @returns {Array} Revenue projections
   */
  projectRevenues(baseRevenue, growthRates, years) {
    const projections = [];
    let currentRevenue = baseRevenue;

    for (let i = 0; i < years; i++) {
      const growthRate = Array.isArray(growthRates)
        ? growthRates[i] || growthRates[growthRates.length - 1]
        : growthRates * Math.pow(0.95, i); // Declining growth rate

      currentRevenue *= (1 + growthRate);
      projections.push({
        year: i + 1,
        revenue: currentRevenue,
        growthRate
      });
    }

    return projections;
  }

  /**
   * Project operating metrics (EBITDA, margins, etc.)
   * @param {Array} revenueProjections - Revenue projections
   * @param {Object} assumptions - Model assumptions
   * @returns {Array} Operating projections
   */
  projectOperatingMetrics(revenueProjections, assumptions) {
    return revenueProjections.map((projection, index) => {
      const ebitdaMargin = assumptions.ebitdaMargin || 0.2;
      const ebitda = projection.revenue * ebitdaMargin;
      const depreciation = projection.revenue * assumptions.depreciationAsPercentOfRevenue;
      const ebit = ebitda - depreciation;
      const taxes = ebit * assumptions.taxRate;
      const nopat = ebit - taxes;

      return {
        ...projection,
        ebitda,
        ebitdaMargin,
        depreciation,
        ebit,
        taxes,
        nopat
      };
    });
  }

  /**
   * Calculate free cash flows with enhanced methodology
   * @param {Array} operatingProjections - Operating projections
   * @param {Object} assumptions - Model assumptions
   * @returns {Array} Free cash flow projections with detailed breakdown
   */
  calculateFreeCashFlows(operatingProjections, assumptions) {
    return operatingProjections.map((projection, index) => {
      // More sophisticated CapEx modeling
      const maintenanceCapex = projection.revenue * (assumptions.maintenanceCapexRate || 0.015);
      const growthCapex = index > 0 ?
        (projection.revenue - operatingProjections[index - 1].revenue) * (assumptions.growthCapexRate || 0.8) : 0;
      const totalCapex = maintenanceCapex + growthCapex;

      // Enhanced working capital calculation
      const nwcChange = this.calculateWorkingCapitalChange(projection, operatingProjections[index - 1], assumptions);

      // Add non-cash charges beyond depreciation
      const stockBasedComp = projection.revenue * (assumptions.stockBasedCompRate || 0.005);
      const otherNonCash = projection.revenue * (assumptions.otherNonCashRate || 0.001);
      const totalNonCash = projection.depreciation + stockBasedComp + otherNonCash;

      // Calculate unlevered FCF
      const fcf = projection.nopat + totalNonCash - totalCapex - nwcChange;

      return {
        year: index + 1,
        nopat: projection.nopat,
        depreciation: projection.depreciation,
        stockBasedComp,
        otherNonCash,
        totalNonCash,
        maintenanceCapex,
        growthCapex,
        totalCapex,
        nwcChange,
        unleveredFCF: fcf,
        fcfMargin: projection.revenue > 0 ? fcf / projection.revenue : 0
      };
    });
  }

  /**
   * Calculate working capital change with detailed components
   * @param {Object} currentProjection - Current year projection
   * @param {Object} priorProjection - Prior year projection
   * @param {Object} assumptions - Model assumptions
   * @returns {number} Working capital change
   */
  calculateWorkingCapitalChange(currentProjection, priorProjection, assumptions) {
    if (!priorProjection) {
      return currentProjection.revenue * assumptions.nwcAsPercentOfRevenue;
    }

    // Component-based NWC calculation
    const receivablesDays = assumptions.receivablesDays || 45;
    const inventoryDays = assumptions.inventoryDays || 30;
    const payablesDays = assumptions.payablesDays || 35;

    const currentReceivables = (currentProjection.revenue * receivablesDays) / 365;
    const currentInventory = (currentProjection.revenue * inventoryDays) / 365 * (assumptions.cogsPct || 0.6);
    const currentPayables = (currentProjection.revenue * payablesDays) / 365 * (assumptions.cogsPct || 0.6);
    const currentNWC = currentReceivables + currentInventory - currentPayables;

    const priorReceivables = (priorProjection.revenue * receivablesDays) / 365;
    const priorInventory = (priorProjection.revenue * inventoryDays) / 365 * (assumptions.cogsPct || 0.6);
    const priorPayables = (priorProjection.revenue * payablesDays) / 365 * (assumptions.cogsPct || 0.6);
    const priorNWC = priorReceivables + priorInventory - priorPayables;

    return currentNWC - priorNWC;
  }

  /**
   * Calculate terminal value using Gordon Growth Model with validation
   * @param {number} finalFCF - Final year free cash flow
   * @param {number} terminalGrowthRate - Terminal growth rate
   * @param {number} discountRate - Discount rate (WACC)
   * @param {Object} options - Additional options for terminal value calculation
   * @returns {number} Terminal value
   */
  calculateTerminalValue(finalFCF, terminalGrowthRate, discountRate, options = {}) {
    // Enhanced validation
    if (discountRate <= terminalGrowthRate) {
      throw new Error('Discount rate must be greater than terminal growth rate');
    }

    if (terminalGrowthRate < 0 || terminalGrowthRate > 0.05) {
      console.warn(`Terminal growth rate ${(terminalGrowthRate * 100).toFixed(2)}% is outside typical range (0-5%)`);
    }

    if (finalFCF <= 0) {
      console.warn('Final year FCF is negative or zero, terminal value calculation may be unreliable');
    }

    // Multiple terminal value methods
    const { method = 'gordon', exitMultiple = null, fadeToGrowth = false } = options;

    switch (method) {
      case 'gordon':
        return (finalFCF * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);

      case 'exit_multiple':
        if (exitMultiple && finalFCF > 0) {
          // Assume FCF approximates EBITDA for multiple calculation
          return finalFCF * exitMultiple;
        }
        return (finalFCF * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);

      case 'fade_to_growth':
        // Implement fade-to-growth model where high growth fades to long-term rate
        const fadeYears = options.fadeYears || 5;
        const longTermGrowth = options.longTermGrowth || 0.025;
        let terminalValue = 0;

        for (let year = 1; year <= fadeYears; year++) {
          const fadeRate = terminalGrowthRate * Math.pow((fadeYears - year + 1) / fadeYears, 2) +
                          longTermGrowth * Math.pow(year / fadeYears, 2);
          const yearFCF = finalFCF * Math.pow(1 + fadeRate, year);
          terminalValue += yearFCF / Math.pow(1 + discountRate, year);
        }

        // Add perpetual value after fade period
        const finalFadeFCF = finalFCF * Math.pow(1 + longTermGrowth, fadeYears);
        const perpetualValue = finalFadeFCF / (discountRate - longTermGrowth);
        terminalValue += perpetualValue / Math.pow(1 + discountRate, fadeYears);

        return terminalValue;

      default:
        return (finalFCF * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);
    }
  }

  /**
   * Calculate present value of cash flows
   * @param {Array} cashFlows - Array of cash flows
   * @param {number} discountRate - Discount rate
   * @param {number} startYear - Starting year for discounting
   * @returns {number} Present value
   */
  calculatePresentValue(cashFlows, discountRate, startYear = 0) {
    return cashFlows.reduce((pv, cf, index) => {
      const year = startYear + index + 1;
      return pv + cf / Math.pow(1 + discountRate, year);
    }, 0);
  }

  /**
   * Calculate comprehensive implied valuation multiples
   * @param {number} enterpriseValue - Enterprise value
   * @param {Array} operatingProjections - Operating projections
   * @param {Array} fcfProjections - Free cash flow projections
   * @param {number} currentRevenue - Current year revenue
   * @returns {Object} Comprehensive implied multiples
   */
  calculateImpliedMultiples(enterpriseValue, operatingProjections, fcfProjections = [], currentRevenue = 0) {
    const currentYearEbitda = operatingProjections[0]?.ebitda || 0;
    const nextYearEbitda = operatingProjections[1]?.ebitda || 0;
    const currentYearEbit = operatingProjections[0]?.ebit || 0;
    const nextYearEbit = operatingProjections[1]?.ebit || 0;
    const nextYearRevenue = operatingProjections[1]?.revenue || 0;
    const currentYearFCF = fcfProjections[0]?.unleveredFCF || 0;
    const nextYearFCF = fcfProjections[1]?.unleveredFCF || 0;

    return {
      // Revenue multiples
      evToCurrentRevenue: currentRevenue ? enterpriseValue / currentRevenue : null,
      evToForwardRevenue: nextYearRevenue ? enterpriseValue / nextYearRevenue : null,

      // EBITDA multiples
      evToCurrentEbitda: currentYearEbitda ? enterpriseValue / currentYearEbitda : null,
      evToForwardEbitda: nextYearEbitda ? enterpriseValue / nextYearEbitda : null,

      // EBIT multiples
      evToCurrentEbit: currentYearEbit ? enterpriseValue / currentYearEbit : null,
      evToForwardEbit: nextYearEbit ? enterpriseValue / nextYearEbit : null,

      // FCF multiples
      evToCurrentFCF: currentYearFCF ? enterpriseValue / currentYearFCF : null,
      evToForwardFCF: nextYearFCF ? enterpriseValue / nextYearFCF : null,

      // PEG ratio approximation (P/E to Growth)
      pegRatio: this.calculatePEGRatio(operatingProjections, enterpriseValue)
    };
  }

  /**
   * Calculate PEG ratio approximation
   * @param {Array} operatingProjections - Operating projections
   * @param {number} enterpriseValue - Enterprise value
   * @returns {number} PEG ratio
   */
  calculatePEGRatio(operatingProjections, enterpriseValue) {
    if (operatingProjections.length < 2) return null;

    const currentEarnings = operatingProjections[0]?.nopat || 0;
    const futureEarnings = operatingProjections[operatingProjections.length - 1]?.nopat || 0;

    if (currentEarnings <= 0 || futureEarnings <= 0) return null;

    const growthRate = Math.pow(futureEarnings / currentEarnings, 1 / (operatingProjections.length - 1)) - 1;
    const peRatio = enterpriseValue / currentEarnings;

    return growthRate > 0 ? peRatio / (growthRate * 100) : null;
  }

  /**
   * Perform sensitivity analysis on key variables
   * @param {Object} inputs - Model inputs
   * @param {Object} baseAssumptions - Base case assumptions
   * @returns {Object} Sensitivity analysis results
   */
  performDCFSensitivityAnalysis(inputs, baseAssumptions) {
    const sensitivityVars = {
      revenueGrowthRate: [-0.02, -0.01, 0, 0.01, 0.02],
      wacc: [-0.005, -0.0025, 0, 0.0025, 0.005],
      terminalGrowthRate: [-0.005, -0.0025, 0, 0.0025, 0.005],
      ebitdaMargin: [-0.02, -0.01, 0, 0.01, 0.02]
    };

    const results = {};

    Object.entries(sensitivityVars).forEach(([variable, variations]) => {
      results[variable] = variations.map(variation => {
        const adjustedAssumptions = {
          ...baseAssumptions,
          [variable]: (baseAssumptions[variable] || 0) + variation
        };

        try {
          const scenario = this.calculateDCFScenario(inputs, adjustedAssumptions, `${variable}_${variation}`);
          return {
            variation,
            pricePerShare: scenario.pricePerShare,
            upside: scenario.upside
          };
        } catch (error) {
          return {
            variation,
            pricePerShare: null,
            upside: null,
            error: error.message
          };
        }
      });
    });

    return results;
  }

  /**
   * Generate DCF model summary
   * @param {Object} baseCase - Base case results
   * @param {Object} scenarios - Scenario results
   * @param {number} currentPrice - Current stock price
   * @returns {Object} Model summary
   */
  generateDCFSummary(baseCase, scenarios, currentPrice) {
    const allScenarios = [baseCase, ...Object.values(scenarios)];
    const pricesPerShare = allScenarios.map(s => s.pricePerShare).filter(p => p !== null);

    return {
      priceRange: {
        min: Math.min(...pricesPerShare),
        max: Math.max(...pricesPerShare),
        average: pricesPerShare.reduce((sum, p) => sum + p, 0) / pricesPerShare.length
      },
      recommendation: this.generateRecommendation(baseCase, currentPrice),
      keyMetrics: {
        baseCase: {
          pricePerShare: baseCase.pricePerShare,
          upside: baseCase.upside,
          enterpriseValue: baseCase.enterpriseValue
        },
        currentPrice,
        impliedReturn: baseCase.upside
      }
    };
  }

  /**
   * Generate investment recommendation
   * @param {Object} baseCase - Base case DCF results
   * @param {number} currentPrice - Current stock price
   * @returns {Object} Investment recommendation
   */
  generateRecommendation(baseCase, currentPrice) {
    if (!currentPrice || !baseCase.pricePerShare) {
      return {
        rating: 'INSUFFICIENT_DATA',
        confidence: 0,
        upside: null,
        reasoning: 'Insufficient data for reliable recommendation.'
      };
    }

    const upside = baseCase.upside;
    let rating, confidence;

    if (upside > 20) {
      rating = 'STRONG_BUY';
      confidence = Math.min(95, 70 + (upside - 20) * 1.25);
    } else if (upside > 10) {
      rating = 'BUY';
      confidence = Math.min(85, 60 + (upside - 10) * 2);
    } else if (upside > -10) {
      rating = 'HOLD';
      confidence = Math.min(75, 50 + Math.abs(upside) * 2.5);
    } else if (upside > -20) {
      rating = 'SELL';
      confidence = Math.min(85, 60 + Math.abs(upside + 10) * 2);
    } else {
      rating = 'STRONG_SELL';
      confidence = Math.min(95, 70 + Math.abs(upside + 20) * 1.25);
    }

    return {
      rating,
      confidence: Math.round(confidence),
      upside,
      reasoning: this.generateRecommendationReasoning(rating, upside)
    };
  }

  /**
   * Generate reasoning for investment recommendation
   * @param {string} rating - Investment rating
   * @param {number} upside - Upside percentage
   * @returns {string} Recommendation reasoning
   */
  generateRecommendationReasoning(rating, upside) {
    const upsideAbs = Math.abs(upside);

    switch (rating) {
      case 'STRONG_BUY':
        return `Strong upside potential of ${upside.toFixed(1)}% suggests significant undervaluation based on DCF analysis.`;
      case 'BUY':
        return `Moderate upside of ${upside.toFixed(1)}% indicates the stock is undervalued relative to intrinsic value.`;
      case 'HOLD':
        return `Fair valuation with ${upside >= 0 ? 'limited upside' : 'modest downside'} of ${upsideAbs.toFixed(1)}%.`;
      case 'SELL':
        return `Downside risk of ${upsideAbs.toFixed(1)}% suggests the stock is overvalued based on fundamental analysis.`;
      case 'STRONG_SELL':
        return `Significant downside of ${upsideAbs.toFixed(1)}% indicates substantial overvaluation.`;
      default:
        return 'Insufficient data for reliable recommendation.';
    }
  }
}

// Export singleton instance
export const financialModelingEngine = new FinancialModelingEngine();
export default FinancialModelingEngine;
