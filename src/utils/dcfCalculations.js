// DCF Calculation Utility for Analysis Results
// Extracts core DCF calculation logic for use across components

export const calculateDCF = (data, modelInputs = null) => {
  if (!data?.statements?.incomeStatement) {
    return null;
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
  if (periods.length === 0) return null;

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
      revenueGrowthRate: revenueGrowthRate,
      operatingMargin: operatingMargin,
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
  
  results.terminalValue = terminalGrowthCashFlow / ((dcfParams.discountRate - dcfParams.terminalGrowthRate) / 100);
  results.presentValueTerminal = results.terminalValue / Math.pow(1 + dcfParams.discountRate / 100, terminalYear);

  // Enterprise and equity value
  results.enterpriseValue = results.cumulativePV + results.presentValueTerminal;
  results.equityValue = results.enterpriseValue; // Simplified - assume no net debt
  results.impliedSharePrice = results.equityValue / dcfParams.sharesOutstanding;
  results.impliedValuation = results.equityValue;

  return results;
};

// Simplified DCF for quick analysis
export const calculateSimpleDCF = (data) => {
  return calculateDCF(data);
};

// Export default for backward compatibility
export default {
  calculateDCF,
  calculateSimpleDCF
};
