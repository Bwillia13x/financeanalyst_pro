/**
 * Financial Data Normalizer
 * Standardizes financial statement data from various sources
 * Handles different API formats and ensures consistent data structure
 */

/**
 * Normalizes income statement data
 * @param {Object} raw - Raw income statement data from API
 * @param {Object} options - Normalization options
 * @returns {Object} Normalized income statement
 */
export const normalizeIncomeStatement = (raw = {}, options = {}) => {
  const {
    scale = 1, // Scaling factor (e.g., 1000 for thousands)
    periods = 3, // Number of periods to include
    currency = 'USD'
  } = options;

  // Helper function to extract and scale values
  const extractValue = (field, period = 0) => {
    const value = raw[field]?.[period] ?? raw[field] ?? null;
    return typeof value === 'number' ? value * scale : null;
  };

  // Helper function to extract array of values with field variations
  const extractArray = (fieldNames, count = periods) => {
    if (!Array.isArray(fieldNames)) {
      fieldNames = [fieldNames];
    }

    for (const field of fieldNames) {
      if (Array.isArray(raw[field])) {
        return raw[field].slice(0, count).map(v => {
          if (typeof v === 'number') return v * scale;
          if (v === 'N/A' || v === null || v === undefined) return null;
          return null;
        });
      }
      const value = extractValue(field);
      if (value !== null) {
        return [value];
      }
    }
    return [];
  };

  return {
    currency,
    periods,
    scale,

    // Revenue section
    revenue: extractArray(['revenue', 'totalRevenue', 'sales']),
    costOfRevenue: extractArray(['costOfRevenue', 'costOfSales', 'cogs']),
    grossProfit: extractArray('grossProfit'),

    // Operating expenses
    operatingExpenses: extractArray(['operatingExpenses', 'totalOperatingExpenses']),
    researchAndDevelopment: extractArray(['researchAndDevelopment', 'rdExpenses']),
    sellingGeneralAdministrative: extractArray(['sellingGeneralAdministrative', 'sgaExpenses']),

    // Operating income
    operatingIncome: extractArray(['operatingIncome', 'ebit']),
    ebitda: extractArray('ebitda'),

    // Non-operating items
    interestExpense: extractArray('interestExpense'),
    interestIncome: extractArray('interestIncome'),
    otherIncomeExpense: extractArray('otherIncomeExpense'),

    // Pre-tax and taxes
    incomeBeforeTax: extractArray(['incomeBeforeTax', 'pretaxIncome']),
    incomeTaxExpense: extractArray(['incomeTaxExpense', 'taxExpense']),

    // Net income
    netIncome: extractArray(['netIncome', 'netIncomeCommon']),
    netIncomeToCommon: extractArray('netIncomeToCommon'),

    // Per share data
    eps: extractArray(['eps', 'earningsPerShare']),
    epsBasic: extractArray('epsBasic'),
    epsDiluted: extractArray('epsDiluted'),

    // Share counts
    sharesOutstanding: extractArray(['sharesOutstanding', 'commonShares']),
    sharesOutstandingBasic: extractArray('sharesOutstandingBasic'),
    sharesOutstandingDiluted: extractArray('sharesOutstandingDiluted'),

    // Metadata
    source: raw.source || 'UNKNOWN',
    reportingCurrency: raw.reportingCurrency || currency,
    lastUpdated: raw.lastUpdated || new Date().toISOString()
  };
};

/**
 * Normalizes balance sheet data
 * @param {Object} raw - Raw balance sheet data from API
 * @param {Object} options - Normalization options
 * @returns {Object} Normalized balance sheet
 */
export const normalizeBalanceSheet = (raw = {}, options = {}) => {
  const { scale = 1, periods = 3, currency = 'USD' } = options;

  const extractValue = (field, period = 0) => {
    const value = raw[field]?.[period] ?? raw[field] ?? null;
    return typeof value === 'number' ? value * scale : null;
  };

  const extractArray = (fieldNames, count = periods) => {
    if (!Array.isArray(fieldNames)) {
      fieldNames = [fieldNames];
    }

    for (const field of fieldNames) {
      if (Array.isArray(raw[field])) {
        return raw[field].slice(0, count).map(v => {
          if (typeof v === 'number') return v * scale;
          if (v === 'N/A' || v === null || v === undefined) return null;
          return null;
        });
      }
      const value = extractValue(field);
      if (value !== null) {
        return [value];
      }
    }
    return [];
  };

  return {
    currency,
    periods,
    scale,

    // Assets
    totalAssets: extractArray('totalAssets'),
    currentAssets: extractArray('currentAssets'),
    cash: extractArray(['cash', 'cashAndEquivalents']),
    shortTermInvestments: extractArray('shortTermInvestments'),
    accountsReceivable: extractArray(['accountsReceivable', 'receivables']),
    inventory: extractArray('inventory'),
    prepaidExpenses: extractArray('prepaidExpenses'),
    otherCurrentAssets: extractArray('otherCurrentAssets'),

    // Non-current assets
    nonCurrentAssets: extractArray('nonCurrentAssets'),
    propertyPlantEquipment: extractArray(['propertyPlantEquipment', 'ppe']),
    goodwill: extractArray('goodwill'),
    intangibleAssets: extractArray('intangibleAssets'),
    longTermInvestments: extractArray('longTermInvestments'),

    // Liabilities
    totalLiabilities: extractArray('totalLiabilities'),
    currentLiabilities: extractArray('currentLiabilities'),
    accountsPayable: extractArray(['accountsPayable', 'payables']),
    shortTermDebt: extractArray('shortTermDebt'),
    accruedLiabilities: extractArray('accruedLiabilities'),

    // Non-current liabilities
    nonCurrentLiabilities: extractArray('nonCurrentLiabilities'),
    longTermDebt: extractArray('longTermDebt'),
    deferredTaxLiabilities: extractArray('deferredTaxLiabilities'),

    // Equity
    totalEquity: extractArray(['totalEquity', 'shareholderEquity']),
    retainedEarnings: extractArray('retainedEarnings'),
    additionalPaidInCapital: extractArray('additionalPaidInCapital'),
    treasuryStock: extractArray('treasuryStock'),

    // Metadata
    source: raw.source || 'UNKNOWN',
    reportingCurrency: raw.reportingCurrency || currency,
    lastUpdated: raw.lastUpdated || new Date().toISOString()
  };
};

/**
 * Normalizes cash flow statement data
 * @param {Object} raw - Raw cash flow data from API
 * @param {Object} options - Normalization options
 * @returns {Object} Normalized cash flow statement
 */
export const normalizeCashFlow = (raw = {}, options = {}) => {
  const { scale = 1, periods = 3, currency = 'USD' } = options;

  const extractArray = (fieldNames, count = periods) => {
    if (!Array.isArray(fieldNames)) {
      fieldNames = [fieldNames];
    }

    for (const field of fieldNames) {
      if (Array.isArray(raw[field])) {
        return raw[field].slice(0, count).map(v => {
          if (typeof v === 'number') return v * scale;
          if (v === 'N/A' || v === null || v === undefined) return null;
          return null;
        });
      }
      const value = raw[field];
      if (typeof value === 'number') {
        return [value * scale];
      }
    }
    return [];
  };

  return {
    currency,
    periods,
    scale,

    // Operating activities
    operatingCashFlow: extractArray(['operatingCashFlow', 'cashFromOperations']),
    netIncome: extractArray('netIncome'),
    depreciationAmortization: extractArray(['depreciationAmortization', 'depreciation']),
    changeInWorkingCapital: extractArray('changeInWorkingCapital'),
    changeInReceivables: extractArray('changeInReceivables'),
    changeInInventory: extractArray('changeInInventory'),
    changeInPayables: extractArray('changeInPayables'),

    // Investing activities
    investingCashFlow: extractArray(['investingCashFlow', 'cashFromInvesting']),
    capitalExpenditures: extractArray(['capitalExpenditures', 'capex']),
    acquisitions: extractArray('acquisitions'),
    investments: extractArray('investments'),

    // Financing activities
    financingCashFlow: extractArray(['financingCashFlow', 'cashFromFinancing']),
    dividendsPaid: extractArray('dividendsPaid'),
    shareRepurchases: extractArray(['shareRepurchases', 'buybacks']),
    debtIssuance: extractArray('debtIssuance'),
    debtRepayment: extractArray('debtRepayment'),

    // Net change in cash
    netChangeInCash: extractArray('netChangeInCash'),
    freeCashFlow: extractArray('freeCashFlow'),

    // Metadata
    source: raw.source || 'UNKNOWN',
    reportingCurrency: raw.reportingCurrency || currency,
    lastUpdated: raw.lastUpdated || new Date().toISOString()
  };
};

/**
 * Validates normalized financial data structure
 * @param {Object} data - Normalized financial data
 * @param {string} type - Type of statement ('income', 'balance', 'cashflow')
 * @returns {Object} Validation result
 */
export const validateNormalizedData = (data, type) => {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== 'object') {
    errors.push('Data must be an object');
    return { isValid: false, errors, warnings };
  }

  // Common validations
  if (!data.currency || typeof data.currency !== 'string') {
    warnings.push('Currency should be specified');
  }

  if (!data.periods || typeof data.periods !== 'number') {
    warnings.push('Number of periods should be specified');
  }

  // Type-specific validations
  switch (type) {
    case 'income':
      if (!data.revenue || data.revenue.length === 0) {
        errors.push('Revenue data is required for income statement');
      }
      if (!data.netIncome || data.netIncome.length === 0) {
        warnings.push('Net income data is missing');
      }
      break;

    case 'balance':
      if (!data.totalAssets || data.totalAssets.length === 0) {
        errors.push('Total assets data is required for balance sheet');
      }
      if (!data.totalLiabilities || data.totalLiabilities.length === 0) {
        warnings.push('Total liabilities data is missing');
      }
      if (!data.totalEquity || data.totalEquity.length === 0) {
        warnings.push('Total equity data is missing');
      }
      break;

    case 'cashflow':
      if (!data.operatingCashFlow || data.operatingCashFlow.length === 0) {
        warnings.push('Operating cash flow data is missing');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export default {
  normalizeIncomeStatement,
  normalizeBalanceSheet,
  normalizeCashFlow,
  validateNormalizedData
};
