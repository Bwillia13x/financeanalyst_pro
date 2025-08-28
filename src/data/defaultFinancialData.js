// Auto-generated default financial data derived from spreadsheet_data.md
// Periods represent December fiscal year-end values.
// Values are in thousands of dollars (matching "$ 000s" from the spreadsheet).
// Only Income Statement data is populated for now – other statements can be filled in later.

const defaultFinancialData = {
  periods: ['Dec-22', 'Dec-23', 'Dec-24'],

  // Enhanced medispa operational metrics for advanced analysis
  operationalMetrics: {
    squareFootage: 2500,
    providers: 3,
    scheduledHours: { 0: 6240, 1: 6240, 2: 6240 },
    availableHours: { 0: 7800, 1: 7800, 2: 7800 },
    utilization: { 0: 0.8, 1: 0.8, 2: 0.8 }
  },

  // Customer and treatment metrics for CLV analysis
  customerMetrics: {
    avgSpend: { 0: 625, 1: 640, 2: 650 },
    treatmentsPerYear: { 0: 3.2, 1: 3.4, 2: 3.5 },
    retentionRate: { 0: 0.68, 1: 0.7, 2: 0.72 },
    newCustomers: { 0: 420, 1: 435, 2: 450 },
    totalActiveCustomers: { 0: 5700, 1: 5650, 2: 5730 }
  },

  statements: {
    incomeStatement: {
      // ---- Revenue ----
      energyDevices: { 0: 317.82, 1: 270.15, 2: 245.84 },
      injectables: { 0: 1123.65, 1: 1044.99, 2: 930.04 },
      wellness: { 0: 567.67, 1: 652.82, 2: 763.79 },
      weightloss: { 0: 617.21, 1: 635.73, 2: 718.37 },
      retailSales: { 0: 322.79, 1: 331.66, 2: 334.98 },
      surgery: { 0: 617.23, 1: 685.12, 2: 733.08 },
      totalRevenue: { 0: 3566.37, 1: 3620.47, 2: 3726.1 },

      // ---- Cost of Goods Sold ----
      energyDeviceSupplies: { 0: 22.25, 1: 14.14, 2: 23.73 },
      injectablesCogs: { 0: 370.8, 1: 326.59, 2: 277.83 },
      wellnessCogs: { 0: 188.24, 1: 204.2, 2: 268.78 },
      weightlossCogs: { 0: 261.33, 1: 253.45, 2: 266.7 },
      retailProducts: { 0: 157.91, 1: 169.91, 2: 129.7 },
      surgicalSupplies: { 0: 77.15, 1: 103.45, 2: 136.35 },
      totalCostOfGoodsSold: { 0: 1077.68, 1: 1071.74, 2: 1103.1 },

      // ---- Gross Profit ----
      grossProfit: { 0: 2488.69, 1: 2548.72, 2: 2623.0 },

      // ---- Salaries & Benefits ----
      employeeBenefits: { 0: 39.55, 1: 36.14, 2: 31.43 },
      payroll: { 0: 1217.0, 1: 1112.0, 2: 967.0 },
      payrollTaxes: { 0: 51.84, 1: 47.37, 2: 41.19 },
      totalSalariesBenefits: { 0: 1308.4, 1: 1195.51, 2: 1039.62 },

      // ---- Operating Expenses ----
      marketing: { 0: 499.29, 1: 253.43, 2: 37.26 },
      automobile: { 0: 21.25, 1: 21.5, 2: 21.76 },
      creditCardBankCharges: { 0: 111.27, 1: 96.67, 2: 92.78 },
      donations: { 0: 1.25, 1: 1.25, 2: 1.25 },
      computerTelephoneUtilities: { 0: 92.73, 1: 78.93, 2: 92.41 },
      depreciation: { 0: 167.14, 1: 150.43, 2: 135.38 },
      duesSubscriptions: { 0: 39.94, 1: 40.55, 2: 41.73 },
      education: { 0: 23.0, 1: 26.18, 2: 24.63 },
      equipmentRental: { 0: 17.62, 1: 0, 2: 0 },
      insurance: { 0: 44.22, 1: 44.89, 2: 46.2 },
      interestExpense: { 0: 220.14, 1: 212.17, 2: 194.81 },
      travelMealsEntertainment: { 0: 12.66, 1: 15.45, 2: 11.67 },
      rent: { 0: 199.13, 1: 205.1, 2: 211.25 },
      officeExpenses: { 0: 74.89, 1: 76.03, 2: 78.25 },
      professionalFees: { 0: 35.66, 1: 36.2, 2: 37.26 },
      repairsMaintenance: { 0: 164.05, 1: 43.45, 2: 44.71 },
      localTax: { 0: 35.66, 1: 36.2, 2: 37.26 },
      stateTax: { 0: 78.46, 1: 79.65, 2: 81.97 },
      totalOperatingExpense: { 0: 1838.38, 1: 1418.07, 2: 1190.6 },

      // ---- Operating Income ----
      operatingIncome: { 0: -658.09, 1: -64.86, 2: 392.78 },

      // ---- Other Income / Expense ----
      gainOnAssetSale: { 0: 0, 1: 0, 2: 42.2 },
      interestIncome: { 0: 4.89, 1: 0, 2: 9.46 },
      otherExpenses: { 0: 0, 1: 6.13, 2: 5.33 },
      totalOtherIncomeExpense: { 0: 4.89, 1: 6.13, 2: 56.99 },

      // ---- Income Before Tax ----
      incomeBeforeTax: { 0: -653.21, 1: -58.73, 2: 449.77 },

      // ---- Net Income ----
      netIncome: { 0: -653.21, 1: -58.73, 2: 449.77 }
    },

    // Placeholders for future Balance Sheet & Cash Flow data
    balanceSheet: {
      assets: {},
      liabilities: {},
      equity: {}
    },
    cashFlow: {
      operating: {},
      investing: {},
      financing: {}
    }
  },

  // Medispa-specific assumptions and adjustment factors
  assumptions: {
    marketingTarget: 0.1, // 10% of revenue for sustainable marketing
    ownerCompensationAddback: 300.0, // $300K owner compensation normalization
    industryBenchmarks: {
      revenuePerSqFt: { min: 800, target: 1200, current: 1490.44 }, // $3.726M / 2500 sqft
      revenuePerProvider: { min: 300, target: 400, current: 1242.03 }, // $3.726M / 3 providers
      injectableMargin: { min: 0.75, target: 0.8, current: 0.7 }, // 70% vs 80% target
      ebitdaMargin: { min: 0.2, target: 0.25, current: 0.185 }, // 18.5% vs 25% target
      customerRetention: { min: 0.65, target: 0.75, current: 0.72 }
    },
    riskFactors: {
      regulatoryRisk: 'Medium',
      keyPersonDependency: 'High',
      competitionDensity: 'Medium',
      technologyObsolescence: 'Medium',
      reimbursementRisk: 'Low'
    }
  },

  // Financial modeling parameters
  models: {
    dcf: {
      discountRate: 0.12, // 12% WACC for medispa business
      terminalGrowthRate: 0.025, // 2.5% terminal growth
      projectionYears: 5,
      taxRate: 0.25
    },
    adjustments: {
      2024: {
        marketing: 372.61, // Normalized to 10% of revenue
        ownerAddback: 300.0, // Replace owner draws with market compensation
        adjustedOperatingIncome: 357.43,
        adjustedEbitda: 687.63, // Operating Income + Depreciation + Interest
        adjustmentRationale: [
          'Marketing normalized to sustainable 10% of revenue',
          'Owner compensation replaced with market-rate management',
          'EBITDA calculation includes depreciation and interest add-backs',
          'One-time gains excluded from operating performance'
        ]
      }
    }
  }
};

export default defaultFinancialData;
