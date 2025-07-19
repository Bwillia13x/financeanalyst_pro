import { apiLogger } from '../utils/apiLogger.js';

/**
 * Advanced LBO (Leveraged Buyout) Modeling Engine
 * Provides comprehensive LBO analysis with debt schedules and cash flow waterfalls
 */
class LBOModelingEngine {
  constructor() {
    this.modelCache = new Map();
    this.assumptions = this.getDefaultAssumptions();
  }

  /**
   * Get default LBO modeling assumptions
   */
  getDefaultAssumptions() {
    return {
      transaction: {
        holdingPeriod: 5,
        managementRollover: 0.1, // 10% management rollover
        transactionFees: 0.02, // 2% of transaction value
        financingFees: 0.015 // 1.5% of debt
      },
      debt: {
        seniorDebtMultiple: 4.0,
        subordinatedDebtMultiple: 1.5,
        totalDebtMultiple: 5.5,
        seniorInterestRate: 0.055, // 5.5%
        subordinatedInterestRate: 0.095, // 9.5%
        mandatoryPaydown: 0.05, // 5% annually
        cashSweep: 0.5 // 50% of excess cash
      },
      operating: {
        ebitdaGrowthRate: 0.05, // 5% annually
        capexAsPercentOfRevenue: 0.03,
        nwcAsPercentOfRevenue: 0.02,
        taxRate: 0.21
      },
      exit: {
        exitMultiple: null, // Will use peer average
        exitMultipleRange: [0.8, 1.2], // 80% to 120% of peer average
        publicMarketDiscount: 0.1 // 10% discount for public exit
      },
      fees: {
        managementFeeRate: 0.02, // 2% annually
        carriedInterestRate: 0.2, // 20%
        hurdle: 0.08 // 8% preferred return
      }
    };
  }

  /**
   * Build comprehensive LBO model
   * @param {Object} inputs - LBO model inputs
   * @param {Object} scenarios - Different scenario assumptions
   * @returns {Object} Complete LBO analysis
   */
  buildLBOModel(inputs, scenarios = {}) {
    const {
      symbol,
      companyName,
      purchasePrice,
      ebitda,
      revenue,
      marketData = {},
      peerData = {},
      assumptions = {}
    } = inputs;

    // Merge with default assumptions
    const modelAssumptions = { ...this.assumptions, ...assumptions };

    // Calculate transaction structure
    const transactionStructure = this.calculateTransactionStructure(
      purchasePrice,
      ebitda,
      modelAssumptions
    );

    // Build base case scenario
    const baseCase = this.calculateLBOScenario(
      inputs,
      transactionStructure,
      modelAssumptions,
      'Base Case'
    );

    // Build additional scenarios
    const scenarioResults = {};

    // Upside case: Higher growth and exit multiple
    if (scenarios.upside !== false) {
      const upsideAssumptions = {
        ...modelAssumptions,
        operating: {
          ...modelAssumptions.operating,
          ebitdaGrowthRate: modelAssumptions.operating.ebitdaGrowthRate * 1.3
        },
        exit: {
          ...modelAssumptions.exit,
          exitMultiple: (modelAssumptions.exit.exitMultiple || 10) * 1.1
        }
      };
      scenarioResults.upside = this.calculateLBOScenario(
        inputs,
        transactionStructure,
        upsideAssumptions,
        'Upside Case'
      );
    }

    // Downside case: Lower growth and exit multiple
    if (scenarios.downside !== false) {
      const downsideAssumptions = {
        ...modelAssumptions,
        operating: {
          ...modelAssumptions.operating,
          ebitdaGrowthRate: modelAssumptions.operating.ebitdaGrowthRate * 0.7
        },
        exit: {
          ...modelAssumptions.exit,
          exitMultiple: (modelAssumptions.exit.exitMultiple || 10) * 0.9
        }
      };
      scenarioResults.downside = this.calculateLBOScenario(
        inputs,
        transactionStructure,
        downsideAssumptions,
        'Downside Case'
      );
    }

    // Calculate sensitivity analysis
    const sensitivityAnalysis = this.performLBOSensitivityAnalysis(
      inputs,
      transactionStructure,
      modelAssumptions
    );

    return {
      symbol,
      companyName,
      modelType: 'LBO',
      timestamp: new Date().toISOString(),
      transactionStructure,
      baseCase,
      scenarios: scenarioResults,
      sensitivityAnalysis,
      assumptions: modelAssumptions,
      summary: this.generateLBOSummary(baseCase, scenarioResults, transactionStructure)
    };
  }

  /**
   * Calculate transaction structure and financing
   * @param {number} purchasePrice - Total purchase price
   * @param {number} ebitda - Current EBITDA
   * @param {Object} assumptions - Model assumptions
   * @returns {Object} Transaction structure
   */
  calculateTransactionStructure(purchasePrice, ebitda, assumptions) {
    const { debt, transaction } = assumptions;

    // Calculate debt capacity based on EBITDA multiples
    const seniorDebt = ebitda * debt.seniorDebtMultiple;
    const subordinatedDebt = ebitda * debt.subordinatedDebtMultiple;
    const totalDebt = seniorDebt + subordinatedDebt;

    // Calculate transaction costs
    const transactionFees = purchasePrice * transaction.transactionFees;
    const financingFees = totalDebt * transaction.financingFees;
    const totalUses = purchasePrice + transactionFees + financingFees;

    // Calculate equity requirement (ensure it's positive)
    const equityContribution = Math.max(totalUses - totalDebt, totalUses * 0.2); // Minimum 20% equity
    const managementRollover = purchasePrice * transaction.managementRollover;
    const sponsorEquity = Math.max(equityContribution - managementRollover, 0);

    // Recalculate total debt if equity was adjusted
    const adjustedTotalDebt = totalUses - equityContribution;
    const adjustedSeniorDebt = Math.min(seniorDebt, adjustedTotalDebt * 0.8); // Max 80% senior
    const adjustedSubordinatedDebt = adjustedTotalDebt - adjustedSeniorDebt;

    return {
      purchasePrice,
      transactionFees,
      financingFees,
      totalUses,
      seniorDebt: adjustedSeniorDebt,
      subordinatedDebt: adjustedSubordinatedDebt,
      totalDebt: adjustedTotalDebt,
      equityContribution,
      sponsorEquity,
      managementRollover,
      debtToEbitda: adjustedTotalDebt / ebitda,
      equityToTotalCapital: equityContribution / totalUses
    };
  }

  /**
   * Calculate LBO scenario with detailed cash flow projections
   * @param {Object} inputs - Model inputs
   * @param {Object} transactionStructure - Transaction structure
   * @param {Object} assumptions - Scenario assumptions
   * @param {string} scenarioName - Name of the scenario
   * @returns {Object} LBO scenario results
   */
  calculateLBOScenario(inputs, transactionStructure, assumptions, scenarioName) {
    const { ebitda, revenue } = inputs;
    const { holdingPeriod } = assumptions.transaction;

    // Project operating performance
    const operatingProjections = this.projectLBOOperatingPerformance(
      revenue,
      ebitda,
      assumptions.operating,
      holdingPeriod
    );

    // Calculate debt schedule
    const debtSchedule = this.calculateDebtSchedule(
      transactionStructure,
      operatingProjections,
      assumptions.debt,
      holdingPeriod
    );

    // Calculate cash flow to equity
    const equityCashFlows = this.calculateEquityCashFlows(
      operatingProjections,
      debtSchedule,
      assumptions
    );

    // Calculate exit value and returns
    const exitAnalysis = this.calculateExitAnalysis(
      operatingProjections[holdingPeriod - 1],
      debtSchedule[holdingPeriod - 1],
      transactionStructure,
      assumptions
    );

    // Calculate returns metrics
    const returnsAnalysis = this.calculateReturnsMetrics(
      transactionStructure.sponsorEquity,
      equityCashFlows,
      exitAnalysis.netProceeds,
      holdingPeriod
    );

    return {
      scenarioName,
      operatingProjections,
      debtSchedule,
      equityCashFlows,
      exitAnalysis,
      returnsAnalysis,
      keyMetrics: this.calculateLBOKeyMetrics(
        transactionStructure,
        exitAnalysis,
        returnsAnalysis
      )
    };
  }

  /**
   * Project operating performance over holding period
   * @param {number} baseRevenue - Starting revenue
   * @param {number} baseEbitda - Starting EBITDA
   * @param {Object} operatingAssumptions - Operating assumptions
   * @param {number} years - Number of years
   * @returns {Array} Operating projections
   */
  projectLBOOperatingPerformance(baseRevenue, baseEbitda, operatingAssumptions, years) {
    const projections = [];
    let currentRevenue = baseRevenue;
    let currentEbitda = baseEbitda;

    for (let year = 1; year <= years; year++) {
      // Assume revenue grows in line with EBITDA
      const ebitdaGrowth = operatingAssumptions.ebitdaGrowthRate;
      currentEbitda *= (1 + ebitdaGrowth);
      currentRevenue *= (1 + ebitdaGrowth);

      const ebitdaMargin = currentEbitda / currentRevenue;
      const capex = currentRevenue * operatingAssumptions.capexAsPercentOfRevenue;
      const nwcChange = year === 1
        ? currentRevenue * operatingAssumptions.nwcAsPercentOfRevenue
        : (currentRevenue - projections[year - 2].revenue) * operatingAssumptions.nwcAsPercentOfRevenue;

      const taxes = currentEbitda * operatingAssumptions.taxRate;
      const unleveredFCF = currentEbitda - taxes - capex - nwcChange;

      projections.push({
        year,
        revenue: currentRevenue,
        ebitda: currentEbitda,
        ebitdaMargin,
        capex,
        nwcChange,
        taxes,
        unleveredFCF
      });
    }

    return projections;
  }

  /**
   * Calculate debt schedule with amortization
   * @param {Object} transactionStructure - Transaction structure
   * @param {Array} operatingProjections - Operating projections
   * @param {Object} debtAssumptions - Debt assumptions
   * @param {number} years - Number of years
   * @returns {Array} Debt schedule
   */
  calculateDebtSchedule(transactionStructure, operatingProjections, debtAssumptions, years) {
    const schedule = [];
    let seniorDebtBalance = transactionStructure.seniorDebt;
    let subordinatedDebtBalance = transactionStructure.subordinatedDebt;

    for (let year = 1; year <= years; year++) {
      const projection = operatingProjections[year - 1];

      // Calculate interest expense
      const seniorInterest = seniorDebtBalance * debtAssumptions.seniorInterestRate;
      const subordinatedInterest = subordinatedDebtBalance * debtAssumptions.subordinatedInterestRate;
      const totalInterest = seniorInterest + subordinatedInterest;

      // Calculate available cash for debt paydown
      const cashAvailableForDebt = projection.unleveredFCF - totalInterest;

      // Mandatory amortization
      const mandatoryPaydown = Math.min(
        seniorDebtBalance * debtAssumptions.mandatoryPaydown,
        seniorDebtBalance
      );

      // Cash sweep (excess cash after mandatory paydown)
      const excessCash = Math.max(0, cashAvailableForDebt - mandatoryPaydown);
      const cashSweep = excessCash * debtAssumptions.cashSweep;

      // Total debt paydown
      const totalPaydown = mandatoryPaydown + cashSweep;
      const seniorPaydown = Math.min(totalPaydown, seniorDebtBalance);
      const subordinatedPaydown = Math.max(0, totalPaydown - seniorPaydown);

      // Update balances
      seniorDebtBalance = Math.max(0, seniorDebtBalance - seniorPaydown);
      subordinatedDebtBalance = Math.max(0, subordinatedDebtBalance - subordinatedPaydown);

      schedule.push({
        year,
        beginningBalance: {
          senior: year === 1 ? transactionStructure.seniorDebt : schedule[year - 2].endingBalance.senior,
          subordinated: year === 1 ? transactionStructure.subordinatedDebt : schedule[year - 2].endingBalance.subordinated
        },
        interestExpense: {
          senior: seniorInterest,
          subordinated: subordinatedInterest,
          total: totalInterest
        },
        principalPayment: {
          senior: seniorPaydown,
          subordinated: subordinatedPaydown,
          total: totalPaydown
        },
        endingBalance: {
          senior: seniorDebtBalance,
          subordinated: subordinatedDebtBalance,
          total: seniorDebtBalance + subordinatedDebtBalance
        },
        cashAvailableForDebt,
        excessCash: excessCash - cashSweep
      });
    }

    return schedule;
  }

  /**
   * Calculate cash flows to equity holders
   * @param {Array} operatingProjections - Operating projections
   * @param {Array} debtSchedule - Debt schedule
   * @param {Object} assumptions - Model assumptions
   * @returns {Array} Equity cash flows
   */
  calculateEquityCashFlows(operatingProjections, debtSchedule, assumptions) {
    return operatingProjections.map((projection, index) => {
      const debt = debtSchedule[index];
      const managementFees = assumptions.fees.managementFeeRate *
        (assumptions.transaction.sponsorEquity || 0);

      const cashFlowToEquity = debt.excessCash - managementFees;

      return {
        year: projection.year,
        unleveredFCF: projection.unleveredFCF,
        interestExpense: debt.interestExpense.total,
        principalPayment: debt.principalPayment.total,
        managementFees,
        cashFlowToEquity: Math.max(0, cashFlowToEquity)
      };
    });
  }

  /**
   * Calculate exit analysis and proceeds
   * @param {Object} finalYearProjection - Final year operating projection
   * @param {Object} finalYearDebt - Final year debt schedule
   * @param {Object} transactionStructure - Transaction structure
   * @param {Object} assumptions - Model assumptions
   * @returns {Object} Exit analysis
   */
  calculateExitAnalysis(finalYearProjection, finalYearDebt, transactionStructure, assumptions) {
    const exitMultiple = assumptions.exit.exitMultiple || 10;
    const exitEbitda = finalYearProjection.ebitda;

    const enterpriseValue = exitEbitda * exitMultiple;
    const totalDebtAtExit = finalYearDebt.endingBalance.total;
    const grossProceeds = enterpriseValue - totalDebtAtExit;

    // Calculate carried interest
    const totalReturn = grossProceeds;
    const investedCapital = transactionStructure.sponsorEquity;
    const profit = Math.max(0, totalReturn - investedCapital);
    const carriedInterest = profit * assumptions.fees.carriedInterestRate;

    const netProceeds = grossProceeds - carriedInterest;

    return {
      exitEbitda,
      exitMultiple,
      enterpriseValue,
      totalDebtAtExit,
      grossProceeds,
      carriedInterest,
      netProceeds,
      managementProceeds: grossProceeds * (transactionStructure.managementRollover / transactionStructure.equityContribution)
    };
  }

  /**
   * Calculate returns metrics (IRR, MOIC, etc.)
   * @param {number} initialInvestment - Initial equity investment
   * @param {Array} equityCashFlows - Annual equity cash flows
   * @param {number} exitProceeds - Exit proceeds
   * @param {number} holdingPeriod - Holding period in years
   * @returns {Object} Returns analysis
   */
  calculateReturnsMetrics(initialInvestment, equityCashFlows, exitProceeds, holdingPeriod) {
    // Validate inputs
    if (!initialInvestment || initialInvestment <= 0) {
      return {
        irr: NaN,
        moic: NaN,
        totalCashReturned: 0,
        initialInvestment: initialInvestment || 0,
        holdingPeriod,
        annualizedReturn: NaN
      };
    }

    // Calculate total cash flows (negative initial investment, positive distributions and exit)
    const cashFlows = [-Math.abs(initialInvestment)]; // Ensure initial investment is negative

    // Add annual cash flows
    equityCashFlows.forEach(cf => {
      cashFlows.push(cf.cashFlowToEquity || 0);
    });

    // Add exit proceeds to final year
    if (cashFlows.length > 1) {
      cashFlows[cashFlows.length - 1] += (exitProceeds || 0);
    } else {
      cashFlows.push(exitProceeds || 0);
    }

    // Calculate IRR using Newton-Raphson method
    const irr = this.calculateIRR(cashFlows);

    // Calculate MOIC (Multiple of Invested Capital)
    const totalCashReturned = equityCashFlows.reduce((sum, cf) => sum + (cf.cashFlowToEquity || 0), 0) + (exitProceeds || 0);
    const moic = totalCashReturned / Math.abs(initialInvestment);

    return {
      irr: isNaN(irr) ? 0 : irr, // Default to 0% if IRR calculation fails
      moic: isNaN(moic) ? 0 : moic,
      totalCashReturned,
      initialInvestment: Math.abs(initialInvestment),
      holdingPeriod,
      annualizedReturn: isNaN(moic) || moic <= 0 ? 0 : Math.pow(moic, 1 / holdingPeriod) - 1,
      cashFlows // Include for debugging
    };
  }

  /**
   * Calculate IRR using Newton-Raphson method
   * @param {Array} cashFlows - Array of cash flows
   * @returns {number} IRR as decimal
   */
  calculateIRR(cashFlows) {
    // Validate cash flows
    if (!cashFlows || cashFlows.length < 2) {
      return NaN;
    }

    // Check if all cash flows are zero
    if (cashFlows.every(cf => cf === 0)) {
      return 0;
    }

    // Check if there's no sign change (no valid IRR)
    const signChanges = cashFlows.slice(1).reduce((count, cf, i) => {
      return count + (Math.sign(cf) !== Math.sign(cashFlows[i]) ? 1 : 0);
    }, 0);

    if (signChanges === 0) {
      return cashFlows[0] < 0 ? -1 : Infinity; // No valid IRR
    }

    let rate = 0.1; // Initial guess: 10%
    const tolerance = 1e-6;
    const maxIterations = 100;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0;

      for (let j = 0; j < cashFlows.length; j++) {
        const factor = Math.pow(1 + rate, j);
        npv += cashFlows[j] / factor;
        if (j > 0) {
          dnpv -= j * cashFlows[j] / (factor * (1 + rate));
        }
      }

      if (Math.abs(npv) < tolerance) {
        return rate;
      }

      if (Math.abs(dnpv) < tolerance) {
        break; // Avoid division by zero
      }

      const newRate = rate - npv / dnpv;

      // Prevent rate from going too negative or too high
      if (newRate < -0.99) {
        rate = -0.99;
      } else if (newRate > 10) {
        rate = 10;
      } else {
        rate = newRate;
      }
    }

    return rate;
  }

  /**
   * Calculate key LBO metrics summary
   * @param {Object} transactionStructure - Transaction structure
   * @param {Object} exitAnalysis - Exit analysis
   * @param {Object} returnsAnalysis - Returns analysis
   * @returns {Object} Key metrics
   */
  calculateLBOKeyMetrics(transactionStructure, exitAnalysis, returnsAnalysis) {
    return {
      entryMultiple: transactionStructure.purchasePrice / (transactionStructure.purchasePrice / transactionStructure.debtToEbitda),
      exitMultiple: exitAnalysis.exitMultiple,
      debtToEbitda: transactionStructure.debtToEbitda,
      equityContribution: transactionStructure.equityContribution,
      irr: returnsAnalysis.irr,
      moic: returnsAnalysis.moic,
      totalReturn: returnsAnalysis.totalCashReturned,
      leverageReduction: transactionStructure.totalDebt - exitAnalysis.totalDebtAtExit
    };
  }

  /**
   * Perform sensitivity analysis on key LBO variables
   * @param {Object} inputs - Model inputs
   * @param {Object} transactionStructure - Transaction structure
   * @param {Object} baseAssumptions - Base case assumptions
   * @returns {Object} Sensitivity analysis results
   */
  performLBOSensitivityAnalysis(inputs, transactionStructure, baseAssumptions) {
    const sensitivityVars = {
      ebitdaGrowthRate: [-0.02, -0.01, 0, 0.01, 0.02],
      exitMultiple: [-1, -0.5, 0, 0.5, 1],
      debtMultiple: [-0.5, -0.25, 0, 0.25, 0.5]
    };

    const results = {};

    Object.entries(sensitivityVars).forEach(([variable, variations]) => {
      results[variable] = variations.map(variation => {
        const adjustedAssumptions = { ...baseAssumptions };

        if (variable === 'ebitdaGrowthRate') {
          adjustedAssumptions.operating.ebitdaGrowthRate += variation;
        } else if (variable === 'exitMultiple') {
          adjustedAssumptions.exit.exitMultiple = (adjustedAssumptions.exit.exitMultiple || 10) + variation;
        } else if (variable === 'debtMultiple') {
          // Adjust transaction structure for debt multiple sensitivity
          const newDebtMultiple = transactionStructure.debtToEbitda + variation;
          const adjustedStructure = {
            ...transactionStructure,
            totalDebt: (inputs.ebitda * newDebtMultiple),
            debtToEbitda: newDebtMultiple
          };
          adjustedStructure.equityContribution = transactionStructure.totalUses - adjustedStructure.totalDebt;
        }

        try {
          const scenario = this.calculateLBOScenario(inputs, transactionStructure, adjustedAssumptions, `${variable}_${variation}`);
          return {
            variation,
            irr: scenario.returnsAnalysis.irr,
            moic: scenario.returnsAnalysis.moic
          };
        } catch (error) {
          return {
            variation,
            irr: null,
            moic: null,
            error: error.message
          };
        }
      });
    });

    return results;
  }

  /**
   * Generate LBO model summary
   * @param {Object} baseCase - Base case results
   * @param {Object} scenarios - Scenario results
   * @param {Object} transactionStructure - Transaction structure
   * @returns {Object} Model summary
   */
  generateLBOSummary(baseCase, scenarios, transactionStructure) {
    const allScenarios = [baseCase, ...Object.values(scenarios)];
    const irrs = allScenarios.map(s => s.returnsAnalysis.irr).filter(irr => irr !== null);
    const moics = allScenarios.map(s => s.returnsAnalysis.moic).filter(moic => moic !== null);

    return {
      returnRange: {
        irrMin: Math.min(...irrs),
        irrMax: Math.max(...irrs),
        irrAverage: irrs.reduce((sum, irr) => sum + irr, 0) / irrs.length,
        moicMin: Math.min(...moics),
        moicMax: Math.max(...moics),
        moicAverage: moics.reduce((sum, moic) => sum + moic, 0) / moics.length
      },
      investmentHighlights: this.generateInvestmentHighlights(baseCase, transactionStructure),
      riskFactors: this.generateRiskFactors(baseCase, transactionStructure)
    };
  }

  /**
   * Generate investment highlights
   * @param {Object} baseCase - Base case results
   * @param {Object} transactionStructure - Transaction structure
   * @returns {Array} Investment highlights
   */
  generateInvestmentHighlights(baseCase, transactionStructure) {
    const highlights = [];
    const irr = baseCase.returnsAnalysis.irr;
    const moic = baseCase.returnsAnalysis.moic;

    if (irr > 0.2) {
      highlights.push(`Strong projected IRR of ${(irr * 100).toFixed(1)}%`);
    }

    if (moic > 2.5) {
      highlights.push(`Attractive multiple of ${moic.toFixed(1)}x invested capital`);
    }

    if (transactionStructure.debtToEbitda < 5) {
      highlights.push(`Conservative leverage at ${transactionStructure.debtToEbitda.toFixed(1)}x EBITDA`);
    }

    return highlights;
  }

  /**
   * Generate risk factors
   * @param {Object} baseCase - Base case results
   * @param {Object} transactionStructure - Transaction structure
   * @returns {Array} Risk factors
   */
  generateRiskFactors(baseCase, transactionStructure) {
    const risks = [];

    if (transactionStructure.debtToEbitda > 6) {
      risks.push(`High leverage at ${transactionStructure.debtToEbitda.toFixed(1)}x EBITDA`);
    }

    if (baseCase.returnsAnalysis.irr < 0.15) {
      risks.push(`Below-target IRR of ${(baseCase.returnsAnalysis.irr * 100).toFixed(1)}%`);
    }

    return risks;
  }
}

// Export singleton instance
export const lboModelingEngine = new LBOModelingEngine();
export default LBOModelingEngine;
