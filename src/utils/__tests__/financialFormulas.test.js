import { describe, test, expect } from 'vitest';
import {
  computeIncomeStatementValue,
  computeBalanceSheetValue,
  computeCashFlowValue
} from '../financialFormulas';

describe('financialFormulas utils', () => {
  test('Income Statement computations', () => {
    const isData = {
      energyDevices: { 0: 100 },
      retailSales: { 0: 50 },
      energyDeviceSupplies: { 0: 30 },
      payroll: { 0: 20 },
      rent: { 0: 10 },
      interestIncome: { 0: 5 },
      otherExpenses: { 0: -2 }
    };

    expect(computeIncomeStatementValue('totalRevenue', isData, 0)).toBe(150);
    expect(computeIncomeStatementValue('totalCostOfGoodsSold', isData, 0)).toBe(30);
    expect(computeIncomeStatementValue('grossProfit', isData, 0)).toBe(120);

    // Salaries includes payroll taxes/benefits; only payroll provided -> 20
    expect(computeIncomeStatementValue('totalSalariesBenefits', isData, 0)).toBe(20);
    // Opex includes many keys; only rent provided -> 10
    expect(computeIncomeStatementValue('totalOperatingExpense', isData, 0)).toBe(10);

    // Operating Income = 120 - 20 - 10 = 90
    expect(computeIncomeStatementValue('operatingIncome', isData, 0)).toBe(90);

    // Other Income/Expense = interestIncome (5) + otherExpenses (-2) = 3
    expect(computeIncomeStatementValue('totalOtherIncomeExpense', isData, 0)).toBe(3);

    // Income Before Tax = 90 + 3 = 93
    expect(computeIncomeStatementValue('incomeBeforeTax', isData, 0)).toBe(93);
  });

  test('Balance Sheet computations', () => {
    const bsData = {
      cash: { 0: 100 },
      receivables: { 0: 50 },
      ppe: { 0: 200 },
      accumulatedDepreciation: { 0: 50 },
      accountsPayable: { 0: 30 },
      accruedExpenses: { 0: 40 },
      longTermDebt: { 0: 30 },
      commonStock: { 0: 100 },
      retainedEarnings: { 0: 100 }
    };

    expect(computeBalanceSheetValue('totalCurrentAssets', bsData, 0)).toBe(150);
    expect(computeBalanceSheetValue('netPPE', bsData, 0)).toBe(150);
    expect(computeBalanceSheetValue('totalNonCurrentAssets', bsData, 0)).toBe(150);
    expect(computeBalanceSheetValue('totalAssets', bsData, 0)).toBe(300);

    expect(computeBalanceSheetValue('totalCurrentLiabilities', bsData, 0)).toBe(70);
    expect(computeBalanceSheetValue('totalNonCurrentLiabilities', bsData, 0)).toBe(30);
    expect(computeBalanceSheetValue('totalLiabilities', bsData, 0)).toBe(100);

    expect(computeBalanceSheetValue('totalEquity', bsData, 0)).toBe(200);
    expect(computeBalanceSheetValue('totalLiabilitiesEquity', bsData, 0)).toBe(300);
  });

  test('Cash Flow computations', () => {
    const cfData = {
      netIncome: { 0: 100 },
      depreciation: { 0: 10 },
      receivablesChange: { 0: -10 },
      capex: { 0: -20 },
      debtIssuance: { 0: 30 },
      beginningCash: { 0: 50 }
    };

    expect(computeCashFlowValue('netCashFromOperating', cfData, 0)).toBe(100);
    expect(computeCashFlowValue('netCashFromInvesting', cfData, 0)).toBe(-20);
    expect(computeCashFlowValue('netCashFromFinancing', cfData, 0)).toBe(30);
    expect(computeCashFlowValue('netCashFlow', cfData, 0)).toBe(110);
    expect(computeCashFlowValue('endingCash', cfData, 0)).toBe(160);
  });
});
