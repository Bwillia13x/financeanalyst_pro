// Enhanced DCF Calculation Engine for Professional Financial Analysis
// Supports year-by-year projections and proper Unlevered Free Cash Flow calculation

export const calculateEnhancedDCF = inputs => {
  if (!inputs || !inputs.currentRevenue) {
    return null;
  }

  const {
    currentRevenue,
    projectionYears = 5,
    terminalGrowthRate = 0.025,
    discountRate = 0.12,
    yearlyData = {},
    balanceSheet = {}
  } = inputs;

  const results = {
    years: [],
    revenues: [],
    ebitda: [],
    ebit: [],
    nopat: [],
    freeCashFlows: [],
    presentValues: [],
    cumulativePV: 0,
    terminalValue: 0,
    presentValueTerminal: 0,
    enterpriseValue: 0,
    equityValue: 0,
    impliedSharePrice: 0,
    netDebt: 0,
    assumptions: {
      discountRate: discountRate * 100,
      terminalGrowthRate: terminalGrowthRate * 100,
      currentRevenue,
      projectionYears
    },
    projectionTable: []
  };

  let previousRevenue = currentRevenue;

  // Calculate year-by-year projections
  for (let year = 1; year <= projectionYears; year++) {
    const yearData = yearlyData[year] || {};

    // Use year-specific inputs or defaults
    const revenueGrowth = (yearData.revenueGrowth || 10) / 100;
    const ebitdaMargin = (yearData.ebitdaMargin || 20) / 100;
    const taxRate = (yearData.taxRate || 25) / 100;
    const capexPercent = (yearData.capexPercent || 3) / 100;
    const daPercent = (yearData.daPercent || 3) / 100;
    const workingCapitalChange = (yearData.workingCapitalChange || 2) / 100;

    // Revenue projection
    const revenue = previousRevenue * (1 + revenueGrowth);

    // EBITDA calculation
    const ebitda = revenue * ebitdaMargin;

    // Depreciation & Amortization
    const depreciation = revenue * daPercent;

    // EBIT (Earnings Before Interest and Taxes)
    const ebit = ebitda - depreciation;

    // Taxes on EBIT
    const taxes = ebit * taxRate;

    // NOPAT (Net Operating Profit After Tax)
    const nopat = ebit - taxes;

    // Capital Expenditure
    const capex = revenue * capexPercent;

    // Change in Net Working Capital
    const deltaWorkingCapital = revenue * workingCapitalChange;

    // Unlevered Free Cash Flow = NOPAT + D&A - CapEx - ΔWorking Capital
    const freeCashFlow = nopat + depreciation - capex - deltaWorkingCapital;

    // Present Value of FCF
    const presentValue = freeCashFlow / Math.pow(1 + discountRate, year);

    // Store results
    results.years.push(year);
    results.revenues.push(revenue);
    results.ebitda.push(ebitda);
    results.ebit.push(ebit);
    results.nopat.push(nopat);
    results.freeCashFlows.push(freeCashFlow);
    results.presentValues.push(presentValue);
    results.cumulativePV += presentValue;

    // Detailed projection table entry
    results.projectionTable.push({
      year,
      revenue,
      revenueGrowth: revenueGrowth * 100,
      ebitda,
      ebitdaMargin: ebitdaMargin * 100,
      depreciation,
      ebit,
      taxes,
      taxRate: taxRate * 100,
      nopat,
      capex,
      deltaWorkingCapital,
      freeCashFlow,
      presentValue
    });

    previousRevenue = revenue;
  }

  // Terminal Value Calculation
  if (results.freeCashFlows.length > 0) {
    const terminalYearFCF = results.freeCashFlows[projectionYears - 1];
    const terminalFCF = terminalYearFCF * (1 + terminalGrowthRate);

    // Terminal Value = Terminal FCF / (WACC - Terminal Growth Rate)
    results.terminalValue = terminalFCF / (discountRate - terminalGrowthRate);
    results.presentValueTerminal =
      results.terminalValue / Math.pow(1 + discountRate, projectionYears);
  }

  // Enterprise Value = Sum of PV of FCFs + PV of Terminal Value
  results.enterpriseValue = results.cumulativePV + results.presentValueTerminal;

  // Calculate Net Debt and Equity Value
  const cash = balanceSheet.cash || 0;
  const totalDebt = balanceSheet.totalDebt || 0;
  results.netDebt = totalDebt - cash;

  // Equity Value = Enterprise Value - Net Debt
  results.equityValue = results.enterpriseValue - results.netDebt;

  // Implied Share Price
  const sharesOutstanding = balanceSheet.sharesOutstanding || 1000000;
  results.impliedSharePrice = results.equityValue / sharesOutstanding;

  return results;
};

// Simplified DCF for backward compatibility and quick calculations
export const calculateSimpleDCF = inputs => {
  if (!inputs || !inputs.currentRevenue) {
    return null;
  }

  // Convert simple inputs to enhanced format
  const enhancedInputs = {
    currentRevenue: inputs.currentRevenue,
    projectionYears: inputs.projectionYears || 5,
    terminalGrowthRate: inputs.terminalGrowthRate || 0.025,
    discountRate: inputs.discountRate || 0.12,
    yearlyData: {},
    balanceSheet: {
      cash: 0,
      totalDebt: 0,
      sharesOutstanding: 1000000
    }
  };

  // Create uniform yearly data from simple inputs
  for (let year = 1; year <= enhancedInputs.projectionYears; year++) {
    enhancedInputs.yearlyData[year] = {
      revenueGrowth: (inputs.revenueGrowthRate || 0.1) * 100,
      ebitdaMargin: (inputs.ebitdaMargin || 0.2) * 100,
      taxRate: (inputs.taxRate || 0.25) * 100,
      capexPercent: (inputs.capexPercent || 0.03) * 100,
      daPercent: 3,
      workingCapitalChange: (inputs.workingCapitalPercent || 0.02) * 100
    };
  }

  return calculateEnhancedDCF(enhancedInputs);
};

// Legacy DCF function for existing analysis results
export const calculateDCF = (data, modelInputs = null) => {
  if (!data || typeof data !== 'object') {
    return { error: 'Invalid financial data: data must be an object' };
  }

  // Handle test data formats (direct revenue/expenses arrays) vs structured financial statements
  if ('revenue' in data || 'expenses' in data) {
    // Test data format - validate the arrays
    const hasValidRevenue =
      data.revenue &&
      Array.isArray(data.revenue) &&
      data.revenue.length > 0 &&
      data.revenue.every(r => typeof r === 'number' && !isNaN(r));
    const hasValidExpenses =
      data.expenses &&
      Array.isArray(data.expenses) &&
      data.expenses.length > 0 &&
      data.expenses.every(e => typeof e === 'number' && !isNaN(e));

    if (!hasValidRevenue) {
      return { error: 'Invalid financial data: revenue must be array of numbers' };
    }
    if (!hasValidExpenses) {
      return { error: 'Invalid financial data: expenses must be array of numbers' };
    }

    // Simple DCF calculation for test data
    const periods = Math.min(data.revenue.length, data.expenses.length);
    const discountRate = data.discountRate || 0.1;
    const terminalGrowthRate = data.terminalGrowthRate || 0.02;

    let presentValue = 0;
    const lastRevenue = data.revenue[periods - 1];
    const lastExpenses = data.expenses[periods - 1];
    const terminalCashFlow = (lastRevenue - lastExpenses) * (1 + terminalGrowthRate);
    const terminalValue = terminalCashFlow / (discountRate - terminalGrowthRate);

    for (let i = 0; i < periods; i++) {
      const cashFlow = data.revenue[i] - data.expenses[i];
      presentValue += cashFlow / Math.pow(1 + discountRate, i + 1);
    }

    presentValue += terminalValue / Math.pow(1 + discountRate, periods);

    return {
      enterpriseValue: presentValue,
      terminalValue,
      presentValue,
      discountRate: discountRate * 100,
      terminalGrowthRate: terminalGrowthRate * 100
    };
  }

  if (!data.statements?.incomeStatement) {
    return { error: 'Missing required data: income statement not found' };
  }

  // Default DCF parameters if not provided
  const dcfParams = modelInputs?.dcf || {
    discountRate: 12, // 12% default WACC
    terminalGrowthRate: 2.5, // 2.5% terminal growth
    projectionYears: 5,
    taxRate: 25, // 25% tax rate
    sharesOutstanding: 1000 // Default shares outstanding
  };

  const statements = data.statements;
  const income = statements.incomeStatement;

  // Get available periods and latest data
  const periods = Object.keys(income.totalRevenue || {}).sort((a, b) => parseInt(a) - parseInt(b));
  if (periods.length === 0) {
    return { error: 'Missing required data: no revenue periods found' };
  }

  const latestPeriod = periods[periods.length - 1];
  const baseRevenue = income.totalRevenue?.[latestPeriod] || 0;
  const baseOperatingIncome = income.operatingIncome?.[latestPeriod] || 0;

  // Calculate growth rates from historical data
  let revenueGrowthRate = 5; // Default 5% growth
  if (periods.length >= 2) {
    const previousPeriod = periods[periods.length - 2];
    const currentRevenue = income.totalRevenue?.[latestPeriod] || 0;
    const previousRevenue = income.totalRevenue?.[previousPeriod] || 0;

    if (previousRevenue > 0) {
      revenueGrowthRate = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
      // Cap growth rate between -10% and 25% for reasonable projections
      revenueGrowthRate = Math.max(-10, Math.min(25, revenueGrowthRate));
    }
  }

  // Operating margin calculation
  const operatingMargin = baseRevenue > 0 ? (baseOperatingIncome / baseRevenue) * 100 : 0;

  const results = {
    years: [],
    freeCashFlows: [],
    presentValues: [],
    cumulativePV: 0,
    terminalValue: 0,
    presentValueTerminal: 0,
    enterpriseValue: 0,
    equityValue: 0,
    impliedSharePrice: 0,
    impliedValuation: 0,
    assumptions: {
      discountRate: dcfParams.discountRate,
      terminalGrowthRate: dcfParams.terminalGrowthRate,
      revenueGrowthRate,
      operatingMargin,
      taxRate: dcfParams.taxRate
    }
  };

  // Project future cash flows
  for (let year = 1; year <= dcfParams.projectionYears; year++) {
    // Declining growth rate over projection period
    const yearGrowthRate = revenueGrowthRate * (1 - (year - 1) * 0.1);
    const projectedRevenue = baseRevenue * Math.pow(1 + yearGrowthRate / 100, year);
    const projectedOperatingIncome = projectedRevenue * (operatingMargin / 100);

    // NOPAT (Net Operating Profit After Tax)
    const nopat = projectedOperatingIncome * (1 - dcfParams.taxRate / 100);

    // Simplified free cash flow (NOPAT - assume capex/working capital changes offset depreciation)
    const freeCashFlow = nopat;

    // Present value
    const presentValue = freeCashFlow / Math.pow(1 + dcfParams.discountRate / 100, year);

    results.years.push(year);
    results.freeCashFlows.push(freeCashFlow);
    results.presentValues.push(presentValue);
    results.cumulativePV += presentValue;
  }

  // Terminal value calculation
  const terminalYear = dcfParams.projectionYears;
  const terminalCashFlow = results.freeCashFlows[terminalYear - 1];
  const terminalGrowthCashFlow = terminalCashFlow * (1 + dcfParams.terminalGrowthRate / 100);

  results.terminalValue =
    terminalGrowthCashFlow / ((dcfParams.discountRate - dcfParams.terminalGrowthRate) / 100);
  results.presentValueTerminal =
    results.terminalValue / Math.pow(1 + dcfParams.discountRate / 100, terminalYear);

  // Enterprise and equity value
  results.enterpriseValue = results.cumulativePV + results.presentValueTerminal;
  results.equityValue = results.enterpriseValue; // Simplified - assume no net debt
  results.impliedSharePrice = results.equityValue / dcfParams.sharesOutstanding;
  results.impliedValuation = results.equityValue;

  return results;
};

// Sensitivity Analysis Function
export const calculateSensitivityAnalysis = (
  inputs,
  waccRange = [-2, -1, 0, 1, 2],
  terminalGrowthRange = [-1, -0.5, 0, 0.5, 1]
) => {
  if (!inputs) return null;

  const baseWACC = inputs.discountRate || 0.12;
  const baseTerminalGrowth = inputs.terminalGrowthRate || 0.025;

  const sensitivityMatrix = [];

  waccRange.forEach(waccDelta => {
    const row = [];
    terminalGrowthRange.forEach(terminalDelta => {
      const testInputs = {
        ...inputs,
        discountRate: baseWACC + waccDelta / 100,
        terminalGrowthRate: baseTerminalGrowth + terminalDelta / 100
      };

      try {
        const result = calculateEnhancedDCF(testInputs);
        row.push({
          wacc: (baseWACC + waccDelta / 100) * 100,
          terminalGrowth: (baseTerminalGrowth + terminalDelta / 100) * 100,
          sharePrice: result?.impliedSharePrice || 0,
          equityValue: result?.equityValue || 0
        });
      } catch {
        row.push({
          wacc: (baseWACC + waccDelta / 100) * 100,
          terminalGrowth: (baseTerminalGrowth + terminalDelta / 100) * 100,
          sharePrice: 0,
          equityValue: 0
        });
      }
    });
    sensitivityMatrix.push(row);
  });

  return {
    matrix: sensitivityMatrix,
    waccRange: waccRange.map(delta => (baseWACC + delta / 100) * 100),
    terminalGrowthRange: terminalGrowthRange.map(delta => (baseTerminalGrowth + delta / 100) * 100),
    baseCase: {
      wacc: baseWACC * 100,
      terminalGrowth: baseTerminalGrowth * 100
    }
  };
};

// Export default for backward compatibility
export default {
  calculateDCF,
  calculateSimpleDCF,
  calculateEnhancedDCF,
  calculateSensitivityAnalysis
};
