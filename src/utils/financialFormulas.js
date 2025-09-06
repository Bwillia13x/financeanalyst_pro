// Pure financial formula utilities for computing statement totals.
// These functions are intentionally side-effect free to enable fast, reliable unit testing.

export function computeIncomeStatementValue(rowKey, incomeStatementData, periodIndex, adjustedValues = {}) {
  if (periodIndex == null || !incomeStatementData) return undefined;

  const getVal = (key) => {
    if (Object.prototype.hasOwnProperty.call(adjustedValues, key)) return adjustedValues[key] ?? 0;
    const container = incomeStatementData[key];
    return container && typeof container === 'object' ? (container[periodIndex] ?? 0) : 0;
  };

  const REVENUE_KEYS = ['energyDevices', 'injectables', 'wellness', 'weightloss', 'retailSales', 'surgery'];
  const COGS_KEYS = ['energyDeviceSupplies', 'injectablesCogs', 'wellnessCogs', 'weightlossCogs', 'retailProducts', 'surgicalSupplies'];
  const SALARIES_KEYS = ['employeeBenefits', 'payroll', 'payrollTaxes'];
  const OPEX_KEYS = [
    'marketing',
    'automobile',
    'creditCardBankCharges',
    'donations',
    'computerTelephoneUtilities',
    'depreciation',
    'duesSubscriptions',
    'education',
    'equipmentRental',
    'insurance',
    'interestExpense',
    'travelMealsEntertainment',
    'rent',
    'officeExpenses',
    'professionalFees',
    'repairsMaintenance',
    'localTax',
    'stateTax'
  ];

  const sum = (keys) => keys.reduce((s, k) => s + (getVal(k) || 0), 0);

  switch (rowKey) {
    case 'totalRevenue':
      return sum(REVENUE_KEYS);
    case 'totalCostOfGoodsSold':
      return sum(COGS_KEYS);
    case 'grossProfit': {
      const rev = sum(REVENUE_KEYS);
      const cogs = sum(COGS_KEYS);
      return rev - cogs;
    }
    case 'totalSalariesBenefits':
      return sum(SALARIES_KEYS);
    case 'totalOperatingExpense':
      return sum(OPEX_KEYS);
    case 'operatingIncome': {
      const gp = computeIncomeStatementValue('grossProfit', incomeStatementData, periodIndex, adjustedValues) || 0;
      const sal = computeIncomeStatementValue('totalSalariesBenefits', incomeStatementData, periodIndex, adjustedValues) || 0;
      const opex = computeIncomeStatementValue('totalOperatingExpense', incomeStatementData, periodIndex, adjustedValues) || 0;
      return gp - sal - opex;
    }
    case 'totalOtherIncomeExpense': {
      // Sum of other components (signs should be handled by inputs)
      const gain = getVal('gainOnAssetSale') || 0;
      const intInc = getVal('interestIncome') || 0;
      const other = getVal('otherExpenses') || 0;
      return gain + intInc + other;
    }
    case 'incomeBeforeTax': {
      const opInc = computeIncomeStatementValue('operatingIncome', incomeStatementData, periodIndex, adjustedValues) || 0;
      const other = computeIncomeStatementValue('totalOtherIncomeExpense', incomeStatementData, periodIndex, adjustedValues) || 0;
      return opInc + other;
    }
    default:
      return undefined;
  }
}

export function computeBalanceSheetValue(rowKey, balanceSheetData, periodIndex) {
  if (periodIndex == null || !balanceSheetData) return undefined;
  const getVal = (key) => {
    const container = balanceSheetData[key];
    return container && typeof container === 'object' ? (container[periodIndex] ?? 0) : 0;
  };
  const sum = (keys) => keys.reduce((s, k) => s + (getVal(k) || 0), 0);

  switch (rowKey) {
    case 'totalCurrentAssets':
      return sum(['cash', 'receivables', 'inventory', 'prepaidExpenses', 'otherCurrentAssets']);
    case 'netPPE':
      return (getVal('ppe') || 0) - (getVal('accumulatedDepreciation') || 0);
    case 'totalNonCurrentAssets':
      return (computeBalanceSheetValue('netPPE', balanceSheetData, periodIndex) || 0) +
             sum(['intangibleAssets', 'goodwill', 'otherNonCurrentAssets']);
    case 'totalAssets':
      return (computeBalanceSheetValue('totalCurrentAssets', balanceSheetData, periodIndex) || 0) +
             (computeBalanceSheetValue('totalNonCurrentAssets', balanceSheetData, periodIndex) || 0);
    case 'totalCurrentLiabilities':
      return sum(['accountsPayable', 'accruedExpenses', 'shortTermDebt', 'currentPortionLongTermDebt', 'otherCurrentLiabilities']);
    case 'totalNonCurrentLiabilities':
      return sum(['longTermDebt', 'deferredTaxLiabilities', 'otherNonCurrentLiabilities']);
    case 'totalLiabilities':
      return (computeBalanceSheetValue('totalCurrentLiabilities', balanceSheetData, periodIndex) || 0) +
             (computeBalanceSheetValue('totalNonCurrentLiabilities', balanceSheetData, periodIndex) || 0);
    case 'totalEquity':
      return sum(['commonStock', 'retainedEarnings', 'otherEquity']);
    case 'totalLiabilitiesEquity':
      return (computeBalanceSheetValue('totalLiabilities', balanceSheetData, periodIndex) || 0) +
             (computeBalanceSheetValue('totalEquity', balanceSheetData, periodIndex) || 0);
    default:
      return undefined;
  }
}

export function computeCashFlowValue(rowKey, cashFlowData, periodIndex) {
  if (periodIndex == null || !cashFlowData) return undefined;
  const getVal = (key) => {
    const container = cashFlowData[key];
    return container && typeof container === 'object' ? (container[periodIndex] ?? 0) : 0;
  };
  const sum = (keys) => keys.reduce((s, k) => s + (getVal(k) || 0), 0);

  switch (rowKey) {
    case 'netCashFromOperating':
      return sum(['netIncome', 'depreciation', 'receivablesChange', 'inventoryChange', 'payablesChange', 'otherOperatingChanges']);
    case 'netCashFromInvesting':
      return sum(['capex', 'acquisitions', 'assetSales', 'otherInvestingActivities']);
    case 'netCashFromFinancing':
      return sum(['debtIssuance', 'debtRepayment', 'equityIssuance', 'dividends', 'otherFinancingActivities']);
    case 'netCashFlow':
      return (computeCashFlowValue('netCashFromOperating', cashFlowData, periodIndex) || 0) +
             (computeCashFlowValue('netCashFromInvesting', cashFlowData, periodIndex) || 0) +
             (computeCashFlowValue('netCashFromFinancing', cashFlowData, periodIndex) || 0);
    case 'endingCash':
      return (getVal('beginningCash') || 0) + (computeCashFlowValue('netCashFlow', cashFlowData, periodIndex) || 0);
    default:
      return undefined;
  }
}
