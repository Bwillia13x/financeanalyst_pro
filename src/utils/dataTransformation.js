// Data transformation utilities for financial calculations

export const formatCurrency = (value, currency = 'USD', compact = false) => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  return formatter.format(value);
};

export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatNumber = (value, decimals = 0, compact = false) => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';

  const formatter = new Intl.NumberFormat('en-US', {
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: 0,
    maximumFractionDigits: compact ? 0 : decimals
  });

  return formatter.format(value);
};

export const calculateCAGR = (beginningValue, endingValue, years) => {
  if (beginningValue <= 0 || endingValue <= 0 || years <= 0) return 0;
  return Math.pow(endingValue / beginningValue, 1 / years) - 1;
};

export const calculateNPV = (cashFlows, discountRate) => {
  if (!Array.isArray(cashFlows) || cashFlows.length === 0) return 0;
  // Exclude the initial cash flow (index 0) and discount subsequent flows by their period index
  let npv = 0;
  for (let i = 1; i < cashFlows.length; i++) {
    npv += cashFlows[i] / Math.pow(1 + discountRate, i);
  }
  return npv;
};

export const calculateIRR = (cashFlows, guess = 0.1) => {
  // Handle edge cases
  if (!cashFlows || cashFlows.length === 0 || cashFlows.length === 1) {
    return 0;
  }

  const maxIterations = 100;
  const tolerance = 1e-6;

  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = cashFlows[0]; // Initial investment (negative)
    let derivative = 0;

    for (let j = 1; j < cashFlows.length; j++) {
      const factor = Math.pow(1 + rate, j);
      npv += cashFlows[j] / factor;
      derivative -= (j * cashFlows[j]) / (factor * (1 + rate));
    }

    if (Math.abs(npv) < tolerance) {
      return rate;
    }

    if (Math.abs(derivative) < tolerance) {
      break; // Avoid division by zero
    }

    rate = rate - npv / derivative;
  }

  return rate;
};

export const calculateWACC = (costOfEquity, costOfDebt, taxRate, debtRatio) => {
  const equityWeight = 1 - debtRatio;
  return costOfEquity * equityWeight + costOfDebt * debtRatio * (1 - taxRate);
};

export const calculateTerminalValue = (finalCashFlow, terminalGrowthRate, discountRate) => {
  if (discountRate === terminalGrowthRate) {
    throw new Error('Discount rate must be greater than terminal growth rate');
  }
  return (finalCashFlow * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);
};

export const projectCashFlows = (baseCashFlow, growthRates, years = 5) => {
  const cashFlows = [];
  let currentCashFlow = baseCashFlow;

  for (let i = 0; i < years; i++) {
    const growthRate = Array.isArray(growthRates)
      ? growthRates[i] || growthRates[growthRates.length - 1]
      : growthRates;
    currentCashFlow *= 1 + growthRate;
    // Normalize to avoid floating-point precision drift (e.g., 1517.9999999999998)
    currentCashFlow = parseFloat(currentCashFlow.toFixed(12));
    cashFlows.push(currentCashFlow);
  }

  return cashFlows;
};

export const calculateDCFValuation = inputs => {
  const {
    currentRevenue,
    revenueGrowthRate,
    fcfMargin,
    wacc,
    terminalGrowthRate,
    sharesOutstanding,
    totalDebt,
    cash,
    projectionYears = 5
  } = inputs;

  // Project revenues
  const projectedRevenues = projectCashFlows(currentRevenue, revenueGrowthRate, projectionYears);

  // Calculate free cash flows
  const projectedFCFs = projectedRevenues.map(revenue => revenue * fcfMargin);

  // Calculate terminal value
  const terminalValue = calculateTerminalValue(
    projectedFCFs[projectedFCFs.length - 1],
    terminalGrowthRate,
    wacc
  );

  // Calculate present values
  const pvOfCashFlows = calculateNPV(projectedFCFs, wacc);
  const pvOfTerminalValue = terminalValue / Math.pow(1 + wacc, projectionYears);

  // Calculate enterprise and equity value
  const enterpriseValue = pvOfCashFlows + pvOfTerminalValue;
  const equityValue = enterpriseValue - totalDebt + cash;
  const pricePerShare = equityValue / sharesOutstanding;

  return {
    enterpriseValue,
    equityValue,
    pricePerShare,
    pvOfCashFlows,
    pvOfTerminalValue,
    terminalValue,
    projectedRevenues,
    projectedFCFs,
    wacc,
    terminalGrowthRate
  };
};

export const calculateLBOReturns = inputs => {
  const {
    purchasePrice,
    ebitda,
    debtMultiple = 5,
    exitMultiple,
    exitYear = 5,
    managementFeeRate = 0.02,
    carriedInterestRate = 0.2
  } = inputs;

  // Calculate purchase structure
  const totalDebt = ebitda * debtMultiple;
  const equityInvestment = purchasePrice - totalDebt;

  // Project EBITDA growth (simplified)
  const ebitdaGrowthRate = 0.05; // 5% annual growth assumption
  const exitEbitda = ebitda * Math.pow(1 + ebitdaGrowthRate, exitYear);

  // Calculate exit value
  const exitEnterpriseValue = exitEbitda * exitMultiple;
  const remainingDebt = totalDebt * 0.5; // Assume 50% debt paydown
  const exitEquityValue = exitEnterpriseValue - remainingDebt;

  // Calculate returns
  const totalReturn = exitEquityValue / equityInvestment;
  const irr = Math.pow(totalReturn, 1 / exitYear) - 1;
  const moic = totalReturn; // Multiple of Invested Capital

  // Calculate fees (simplified)
  const totalManagementFees = equityInvestment * managementFeeRate * exitYear;
  const carriedInterest = Math.max(0, (exitEquityValue - equityInvestment) * carriedInterestRate);

  return {
    equityInvestment,
    totalDebt,
    exitEquityValue,
    totalReturn,
    irr,
    moic,
    exitEbitda,
    exitEnterpriseValue,
    managementFees: totalManagementFees,
    carriedInterest,
    netReturn: exitEquityValue - totalManagementFees - carriedInterest
  };
};

export const calculateComparableMetrics = (companyData, peerData) => {
  const calculateStatistics = values => {
    const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
    if (validValues.length === 0) return { median: null, mean: null, min: null, max: null };

    validValues.sort((a, b) => a - b);
    const median =
      validValues.length % 2 === 0
        ? (validValues[validValues.length / 2 - 1] + validValues[validValues.length / 2]) / 2
        : validValues[Math.floor(validValues.length / 2)];

    const mean = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;

    return {
      median,
      mean,
      min: Math.min(...validValues),
      max: Math.max(...validValues),
      count: validValues.length
    };
  };

  const metrics = ['marketCap', 'peRatio', 'evToEbitda', 'priceToBook', 'debtToEquity'];
  const peerStats = {};

  metrics.forEach(metric => {
    const peerValues = peerData.map(peer => peer[metric]);
    peerStats[metric] = calculateStatistics(peerValues);
  });

  return {
    company: companyData,
    peerStatistics: peerStats,
    relativeValuation: {
      marketCapPercentile: calculatePercentile(
        companyData.marketCap,
        peerData.map(p => p.marketCap)
      ),
      peRatioRelative: companyData.peRatio / peerStats.peRatio.median,
      evEbitdaRelative: companyData.evToEbitda / peerStats.evToEbitda.median,
      priceToBookRelative: companyData.priceToBook / peerStats.priceToBook.median
    }
  };
};

export const calculatePercentile = (value, dataset) => {
  const validDataset = dataset.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (validDataset.length === 0 || value === null || value === undefined || isNaN(value))
    return null;

  validDataset.sort((a, b) => a - b);
  const n = validDataset.length;
  const belowCount = validDataset.filter(v => v < value).length;
  const exactIndex = validDataset.findIndex(v => v === value);
  if (exactIndex !== -1) {
    // Percentile rank for exact matches using Hazen's formula: (rank - 0.5) / n
    const rank = exactIndex + 1; // 1-based
    return (rank - 0.5) / n;
  }
  // For non-exact values, return proportion strictly below
  return belowCount / n;
};

export const generateMonteCarloScenarios = (baseInputs, variableRanges, iterations = 1000) => {
  const scenarios = [];

  for (let i = 0; i < iterations; i++) {
    const scenario = { ...baseInputs };

    Object.keys(variableRanges).forEach(variable => {
      const range = variableRanges[variable];
      const randomValue = range.min + Math.random() * (range.max - range.min);
      scenario[variable] = randomValue;
    });

    scenarios.push(scenario);
  }

  return scenarios;
};

export const calculateSensitivityAnalysis = (
  baseInputs,
  sensitivityVariable,
  range,
  steps = 10
) => {
  const results = [];
  const stepSize = (range.max - range.min) / (steps - 1);

  for (let i = 0; i < steps; i++) {
    const variableValue = range.min + stepSize * i;
    // If the base value is numeric, interpret range as a multiplier window (e.g., 0.8x to 1.2x)
    const baseValue = baseInputs[sensitivityVariable];
    const scaledValue = typeof baseValue === 'number' ? baseValue * variableValue : variableValue;
    const inputs = { ...baseInputs, [sensitivityVariable]: scaledValue };

    results.push({
      [sensitivityVariable]: scaledValue,
      inputs
    });
  }

  return results;
};
