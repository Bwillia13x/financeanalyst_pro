import {
  Plus,
  ChevronDown,
  ChevronRight,
  Calculator,
  FileText,
  TrendingUp,
  Edit2
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import { useFinancialAccessibility } from '../../hooks/useAccessibility';
import {
  computeIncomeStatementValue,
  computeBalanceSheetValue,
  computeCashFlowValue
} from '../../utils/financialFormulas';

const FinancialSpreadsheet = ({ data, onDataChange, onAdjustedValuesChange, initialActiveStatement = 'incomeStatement' }) => {
  const [activeStatement, setActiveStatement] = useState(initialActiveStatement);
  const [adjustedValues, setAdjustedValues] = useState({});

  // Add accessibility monitoring for financial spreadsheet
  const { elementRef: _elementRef, testFinancialFeatures: _testFinancialFeatures } =
    useFinancialAccessibility('spreadsheet');
  const [expandedSections, setExpandedSections] = useState({
    // Income Statement
    revenue: true,
    costOfGoodsSold: true,
    operatingExpenses: true,
    salariesBenefits: true,
    grossProfit: true,
    operatingIncome: true,
    incomeBeforeTax: true,
    otherIncomeExpense: true,
    // Balance Sheet
    currentAssets: true,
    nonCurrentAssets: true,
    currentLiabilities: true,
    nonCurrentLiabilities: true,
    equity: true,
    totalAssets: true,
    totalLiabilities: true,
    totalLiabilitiesEquity: true,
    // Cash Flow
    operatingActivities: true,
    investingActivities: true,
    financingActivities: true,
    netCashFlow: true
  });

  const [editingCell, setEditingCell] = useState(null);
  const [cellValue, setCellValue] = useState('');
  const inputRef = useRef(null);
  // Track custom rows added per section so they render in the UI
  const [customRows, setCustomRows] = useState({});
  // Detect test environment to avoid blocking dialogs
  const IS_TEST_ENV = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';

  // Clear adjusted values on statement change to prevent stale state between statements
  useEffect(() => {
    setAdjustedValues({});
  }, [activeStatement]);

  // Initialize adjusted values with the last available period for the active statement
  useEffect(() => {
    if (data?.statements?.[activeStatement] && Object.keys(adjustedValues).length === 0) {
      const newAdjustedValues = {};
      const statementData = data.statements[activeStatement];
      const lastIndex = Math.max(0, (data?.periods?.length ?? 1) - 1);

      Object.keys(statementData).forEach(key => {
        if (statementData[key] && statementData[key][lastIndex] !== undefined) {
          newAdjustedValues[key] = statementData[key][lastIndex];
        }
      });

      setAdjustedValues(newAdjustedValues);
      if (onAdjustedValuesChange) {
        onAdjustedValuesChange(newAdjustedValues);
      }
    }
  }, [data, activeStatement, adjustedValues, onAdjustedValuesChange]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Early return if data is not available yet - AFTER all hooks are called
  if (!data || !data.periods || !data.statements) {
    return (
      <section
        role="main"
        aria-busy="true"
        aria-label="Financial Spreadsheet"
        data-testid="financial-spreadsheet"
      >
        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          <div className="text-center text-foreground-secondary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4" />
            <p>Loading financial data...</p>
          </div>
        </div>
      </section>
    );
  }

  // Get current template based on active statement
  const getCurrentTemplate = () => {
    switch (activeStatement) {
      case 'balanceSheet':
        return balanceSheetTemplate;
      case 'cashFlow':
        return cashFlowTemplate;
      default:
        return incomeStatementTemplate;
    }
  };

  // Income Statement Template Structure with Enhanced Color Coding
  const incomeStatementTemplate = {
    revenue: {
      title: 'Revenue',
      color: 'bg-success/10 border-success/30',
      headerBg: 'bg-success',
      textColor: 'text-success',
      items: [
        { key: 'energyDevices', label: 'Energy Devices', level: 1 },
        { key: 'injectables', label: 'Injectables', level: 1 },
        { key: 'wellness', label: 'Wellness', level: 1 },
        { key: 'weightloss', label: 'Weightloss', level: 1 },
        { key: 'retailSales', label: 'Retail Sales', level: 1 },
        { key: 'surgery', label: 'Surgery', level: 1 },
        { key: 'totalRevenue', label: 'Total Revenue', level: 0, bold: true, formula: true }
      ]
    },
    costOfGoodsSold: {
      title: 'Cost of Goods Sold',
      color: 'bg-destructive/10 border-destructive/30',
      headerBg: 'bg-destructive',
      textColor: 'text-destructive',
      items: [
        { key: 'energyDeviceSupplies', label: 'Energy Device Supplies', level: 1 },
        { key: 'injectablesCogs', label: 'Injectables', level: 1 },
        { key: 'wellnessCogs', label: 'Wellness', level: 1 },
        { key: 'weightlossCogs', label: 'Weightloss', level: 1 },
        { key: 'retailProducts', label: 'Retail Products', level: 1 },
        { key: 'surgicalSupplies', label: 'Surgical Supplies', level: 1 },
        {
          key: 'totalCostOfGoodsSold',
          label: 'Total Cost of Goods Sold',
          level: 0,
          bold: true,
          formula: true
        }
      ]
    },
    grossProfit: {
      title: 'Gross Profit',
      color: 'bg-accent/10 border-accent/30',
      headerBg: 'bg-accent',
      textColor: 'text-accent',
      items: [{ key: 'grossProfit', label: 'Gross Profit', level: 0, bold: true, formula: true }]
    },
    salariesBenefits: {
      title: 'Salaries & Benefits',
      color: 'bg-muted/40 border-border',
      headerBg: 'bg-muted',
      textColor: 'text-foreground',
      items: [
        { key: 'employeeBenefits', label: 'Employee Benefits', level: 1 },
        { key: 'payroll', label: 'Payroll', level: 1 },
        { key: 'payrollTaxes', label: 'Payroll Taxes', level: 1 },
        {
          key: 'totalSalariesBenefits',
          label: 'Total Salaries & Benefits',
          level: 0,
          bold: true,
          formula: true
        }
      ]
    },
    operatingExpenses: {
      title: 'Operating Expenses',
      color: 'bg-warning/10 border-warning/30',
      headerBg: 'bg-warning',
      textColor: 'text-warning',
      items: [
        { key: 'marketing', label: 'Marketing', level: 1 },
        { key: 'automobile', label: 'Automobile', level: 1 },
        { key: 'creditCardBankCharges', label: 'Credit Card and Bank Charges', level: 1 },
        { key: 'donations', label: 'Donations', level: 1 },
        {
          key: 'computerTelephoneUtilities',
          label: 'Computer, Telephone, and Utilities',
          level: 1
        },
        { key: 'depreciation', label: 'Depreciation', level: 1 },
        { key: 'duesSubscriptions', label: 'Dues & Subscriptions', level: 1 },
        { key: 'education', label: 'Education', level: 1 },
        { key: 'equipmentRental', label: 'Equipment Rental', level: 1 },
        { key: 'insurance', label: 'Insurance', level: 1 },
        { key: 'interestExpense', label: 'Interest Expense', level: 1 },
        { key: 'travelMealsEntertainment', label: 'Travel, Meals, and Entertainment', level: 1 },
        { key: 'rent', label: 'Rent', level: 1 },
        { key: 'officeExpenses', label: 'Office Expenses', level: 1 },
        { key: 'professionalFees', label: 'Professional Fees', level: 1 },
        { key: 'repairsMaintenance', label: 'Repairs & Maintenance', level: 1 },
        { key: 'localTax', label: 'Local Tax', level: 1 },
        { key: 'stateTax', label: 'State Tax', level: 1 },
        {
          key: 'totalOperatingExpense',
          label: 'Total Operating Expense',
          level: 0,
          bold: true,
          formula: true
        }
      ]
    },
    operatingIncome: {
      title: 'Operating Income',
      color: 'bg-success/10 border-success/30',
      headerBg: 'bg-success',
      textColor: 'text-success',
      items: [{ key: 'operatingIncome', label: 'Operating Income', level: 0, bold: true, formula: true }]
    },
    otherIncomeExpense: {
      title: 'Other Income / (Expense)',
      color: 'bg-muted border-border',
      headerBg: 'bg-muted',
      textColor: 'text-foreground',
      items: [
        { key: 'gainOnAssetSale', label: 'Gain (Loss) On Asset Sale', level: 1 },
        { key: 'interestIncome', label: 'Interest Income', level: 1 },
        { key: 'otherExpenses', label: 'Other Expenses', level: 1 },
        {
          key: 'totalOtherIncomeExpense',
          label: 'Total Other Income / (Expenses)',
          level: 0,
          bold: true,
          formula: true
        }
      ]
    },
    incomeBeforeTax: {
      title: 'Net Income Before Taxes',
      color: 'bg-accent/10 border-accent/30',
      headerBg: 'bg-accent',
      textColor: 'text-accent',
      items: [{ key: 'incomeBeforeTax', label: 'Net Income Before Taxes', level: 0, bold: true, formula: true }]
    }
  };

  // Balance Sheet Template Structure
  const balanceSheetTemplate = {
    currentAssets: {
      title: 'Current Assets',
      color: 'bg-success/10 border-success/30',
      headerBg: 'bg-success',
      textColor: 'text-success',
      items: [
        { key: 'cash', label: 'Cash and Cash Equivalents', level: 1 },
        { key: 'receivables', label: 'Accounts Receivable', level: 1 },
        { key: 'inventory', label: 'Inventory', level: 1 },
        { key: 'prepaidExpenses', label: 'Prepaid Expenses', level: 1 },
        { key: 'otherCurrentAssets', label: 'Other Current Assets', level: 1 },
        {
          key: 'totalCurrentAssets',
          label: 'Total Current Assets',
          level: 0,
          formula: true,
          bold: true
        }
      ]
    },
    nonCurrentAssets: {
      title: 'Non-Current Assets',
      color: 'bg-accent/10 border-accent/30',
      headerBg: 'bg-accent',
      textColor: 'text-accent',
      items: [
        { key: 'ppe', label: 'Property, Plant & Equipment', level: 1 },
        { key: 'accumulatedDepreciation', label: 'Less: Accumulated Depreciation', level: 1 },
        { key: 'netPPE', label: 'Net Property, Plant & Equipment', level: 1, formula: true },
        { key: 'intangibleAssets', label: 'Intangible Assets', level: 1 },
        { key: 'goodwill', label: 'Goodwill', level: 1 },
        { key: 'otherNonCurrentAssets', label: 'Other Non-Current Assets', level: 1 },
        {
          key: 'totalNonCurrentAssets',
          label: 'Total Non-Current Assets',
          level: 0,
          formula: true,
          bold: true
        }
      ]
    },
    totalAssets: {
      title: 'Total Assets',
      color: 'bg-muted border-border',
      headerBg: 'bg-muted',
      textColor: 'text-foreground',
      items: [{ key: 'totalAssets', label: 'Total Assets', level: 0, formula: true, bold: true }]
    },
    currentLiabilities: {
      title: 'Current Liabilities',
      color: 'bg-destructive/10 border-destructive/30',
      headerBg: 'bg-destructive',
      textColor: 'text-destructive',
      items: [
        { key: 'accountsPayable', label: 'Accounts Payable', level: 1 },
        { key: 'accruedExpenses', label: 'Accrued Expenses', level: 1 },
        { key: 'shortTermDebt', label: 'Short-term Debt', level: 1 },
        { key: 'currentPortionLongTermDebt', label: 'Current Portion of Long-term Debt', level: 1 },
        { key: 'otherCurrentLiabilities', label: 'Other Current Liabilities', level: 1 },
        {
          key: 'totalCurrentLiabilities',
          label: 'Total Current Liabilities',
          level: 0,
          formula: true,
          bold: true
        }
      ]
    },
    nonCurrentLiabilities: {
      title: 'Non-Current Liabilities',
      color: 'bg-warning/10 border-warning/30',
      headerBg: 'bg-warning',
      textColor: 'text-warning',
      items: [
        { key: 'longTermDebt', label: 'Long-term Debt', level: 1 },
        { key: 'deferredTaxLiabilities', label: 'Deferred Tax Liabilities', level: 1 },
        { key: 'otherNonCurrentLiabilities', label: 'Other Non-Current Liabilities', level: 1 },
        {
          key: 'totalNonCurrentLiabilities',
          label: 'Total Non-Current Liabilities',
          level: 0,
          formula: true,
          bold: true
        }
      ]
    },
    totalLiabilities: {
      title: 'Total Liabilities',
      color: 'bg-muted border-border',
      headerBg: 'bg-muted',
      textColor: 'text-foreground',
      items: [
        { key: 'totalLiabilities', label: 'Total Liabilities', level: 0, formula: true, bold: true }
      ]
    },
    equity: {
      title: "Shareholders' Equity",
      color: 'bg-accent/10 border-accent/30',
      headerBg: 'bg-accent',
      textColor: 'text-accent',
      items: [
        { key: 'commonStock', label: 'Common Stock', level: 1 },
        { key: 'retainedEarnings', label: 'Retained Earnings', level: 1 },
        { key: 'otherEquity', label: 'Other Comprehensive Income', level: 1 },
        {
          key: 'totalEquity',
          label: "Total Shareholders' Equity",
          level: 0,
          formula: true,
          bold: true
        }
      ]
    },
    totalLiabilitiesEquity: {
      title: 'Total Liabilities and Equity',
      color: 'bg-muted border-border',
      headerBg: 'bg-muted',
      textColor: 'text-foreground',
      items: [
        {
          key: 'totalLiabilitiesEquity',
          label: "Total Liabilities and Shareholders' Equity",
          level: 0,
          formula: true,
          bold: true
        }
      ]
    }
  };

  // Cash Flow Template Structure
  const cashFlowTemplate = {
    operatingActivities: {
      title: 'Operating Activities',
      color: 'bg-emerald-50 border-emerald-300',
      headerBg: 'bg-emerald-600',
      textColor: 'text-emerald-900',
      items: [
        { key: 'netIncome', label: 'Net Income', level: 1 },
        { key: 'depreciation', label: 'Depreciation and Amortization', level: 1 },
        { key: 'receivablesChange', label: 'Change in Accounts Receivable', level: 1 },
        { key: 'inventoryChange', label: 'Change in Inventory', level: 1 },
        { key: 'payablesChange', label: 'Change in Accounts Payable', level: 1 },
        { key: 'otherOperatingChanges', label: 'Other Operating Changes', level: 1 },
        {
          key: 'netCashFromOperating',
          label: 'Net Cash from Operating Activities',
          level: 0,
          formula: true,
          bold: true
        }
      ]
    },
    investingActivities: {
      title: 'Investing Activities',
      color: 'bg-blue-50 border-blue-300',
      headerBg: 'bg-blue-600',
      textColor: 'text-blue-900',
      items: [
        { key: 'capex', label: 'Capital Expenditures', level: 1 },
        { key: 'acquisitions', label: 'Acquisitions', level: 1 },
        { key: 'assetSales', label: 'Asset Sales', level: 1 },
        { key: 'otherInvestingActivities', label: 'Other Investing Activities', level: 1 },
        {
          key: 'netCashFromInvesting',
          label: 'Net Cash from Investing Activities',
          level: 0,
          formula: true,
          bold: true
        }
      ]
    },
    financingActivities: {
      title: 'Financing Activities',
      color: 'bg-purple-50 border-purple-300',
      headerBg: 'bg-purple-600',
      textColor: 'text-purple-900',
      items: [
        { key: 'debtIssuance', label: 'Debt Issuance', level: 1 },
        { key: 'debtRepayment', label: 'Debt Repayment', level: 1 },
        { key: 'equityIssuance', label: 'Equity Issuance', level: 1 },
        { key: 'dividends', label: 'Dividends Paid', level: 1 },
        { key: 'otherFinancingActivities', label: 'Other Financing Activities', level: 1 },
        {
          key: 'netCashFromFinancing',
          label: 'Net Cash from Financing Activities',
          level: 0,
          formula: true,
          bold: true
        }
      ]
    },
    netCashFlow: {
      title: 'Net Cash Flow',
      color: 'bg-slate-50 border-slate-300',
      headerBg: 'bg-slate-700',
      textColor: 'text-slate-900',
      items: [
        { key: 'netCashFlow', label: 'Net Change in Cash', level: 0, formula: true, bold: true },
        { key: 'beginningCash', label: 'Cash at Beginning of Period', level: 1 },
        { key: 'endingCash', label: 'Cash at End of Period', level: 0, formula: true, bold: true }
      ]
    }
  };

  const currentTemplate = getCurrentTemplate();

  const toggleSection = section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCellClick = (rowKey, periodIndex, isAdjusted = false) => {
    setEditingCell({ rowKey, periodIndex, isAdjusted });
    let currentValue = '';

    if (isAdjusted) {
      currentValue = adjustedValues[rowKey] || '';
    } else {
      currentValue = data.statements[activeStatement]?.[rowKey]?.[periodIndex] || '';
    }

    setCellValue(currentValue.toString());
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const { rowKey, periodIndex, isAdjusted } = editingCell;
      const newValue = parseFloat(cellValue) || 0;

      if (isAdjusted) {
        // Update adjusted values
        const newAdjustedValues = {
          ...adjustedValues,
          [rowKey]: newValue
        };
        setAdjustedValues(newAdjustedValues);
        if (onAdjustedValuesChange) {
          onAdjustedValuesChange(newAdjustedValues);
        }
      } else {
        // Update original data for the active statement
        const newData = { ...data };
        if (!newData.statements) newData.statements = {};
        if (!newData.statements[activeStatement]) {
          newData.statements[activeStatement] = {};
        }
        if (!newData.statements[activeStatement][rowKey]) {
          newData.statements[activeStatement][rowKey] = {};
        }
        newData.statements[activeStatement][rowKey][periodIndex] = newValue;
        onDataChange?.(newData);
      }

      setEditingCell(null);
      setCellValue('');
    }
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellBlur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingCell(null);
      setCellValue('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellBlur();
      // Could implement tab navigation to next cell here
    }
  };

  // Input validation for numeric values
  const validateNumericInput = value => {
    // Allow negative numbers, decimals, and empty strings
    const numericRegex = /^-?\d*\.?\d*$/;
    return numericRegex.test(value) || value === '';
  };

  // Compute values for formula rows across statements using pure utilities
  const getComputedValue = (rowKey, periodIndex, useAdjusted = false) => {
    if (periodIndex == null) return undefined;
    if (activeStatement === 'incomeStatement') {
      return computeIncomeStatementValue(
        rowKey,
        data?.statements?.incomeStatement,
        periodIndex,
        useAdjusted ? adjustedValues : {}
      );
    }
    if (activeStatement === 'balanceSheet') {
      return computeBalanceSheetValue(rowKey, data?.statements?.balanceSheet, periodIndex);
    }
    if (activeStatement === 'cashFlow') {
      return computeCashFlowValue(rowKey, data?.statements?.cashFlow, periodIndex);
    }
    return undefined;
  };

  const formatNumber = value => {
    if (!value && value !== 0) return '';

    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';

    // Format based on magnitude for better readability
    const absValue = Math.abs(numValue);
    let formattedValue;

    if (absValue >= 1000000) {
      // Millions
      formattedValue = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(numValue / 1000000);
      formattedValue += 'M';
    } else if (absValue >= 1000) {
      // Thousands
      formattedValue = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numValue);
    } else {
      // Less than 1000
      formattedValue = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numValue);
    }

    return formattedValue;
  };
  const addPeriod = () => {
    const isPromptAvailable = typeof window !== 'undefined' && typeof window.prompt === 'function';
    // Never call prompt during tests to avoid UI blocking/hangs; rely on smart fallback
    const canPrompt = !IS_TEST_ENV && isPromptAvailable;
    const desiredLabel = canPrompt ? window.prompt('Enter period label (e.g., "Year 5"):') : null;
    const computeSmartFallback = () => {
      const periods = Array.isArray(data?.periods) ? data.periods : [];
      let maxYear = 0;
      for (const p of periods) {
        const m = /Year\s*(\d+)/i.exec(String(p));
        if (m) {
          const n = parseInt(m[1], 10);
          if (!isNaN(n)) maxYear = Math.max(maxYear, n);
        }
      }
      return `Year ${maxYear + 1}`;
    };
    const fallbackLabel = computeSmartFallback();
    const newPeriodLabel = desiredLabel && desiredLabel.trim() ? desiredLabel.trim() : fallbackLabel;
    if (newPeriodLabel) {
      const newData = { ...data };
      newData.periods = [...newData.periods, newPeriodLabel];
      onDataChange?.(newData);
    }
  };

  const renderRow = item => {
    const { key, label, level, formula, bold } = item;

    // Enhanced spacing and visual hierarchy
    const indentClass = level === 1 ? 'pl-8' : level === 2 ? 'pl-12' : 'pl-4';
    const textWeight = bold ? 'font-bold' : level === 0 ? 'font-semibold' : 'font-medium';
    const textSize = level === 0 ? 'text-sm' : 'text-sm';
    const textColor = 'text-foreground';
    const rowBg = level === 0 ? 'bg-muted/40' : 'bg-card';
    const borderColor = 'border-border';

    // Screen reader context
    const ariaLabel =
      level === 0
        ? `${label}, total or summary line item${formula ? ', calculated automatically' : ''}`
        : `${label}, detail line item${formula ? ', calculated automatically' : ', editable'}`;

    return (
      <tr
        key={key}
        className={`${rowBg} border-b ${borderColor} hover:bg-muted transition-all duration-150 group`}
        role="row"
        aria-label={ariaLabel}
      >
        {/* Account Name Column */}
        <td
          className={`px-6 py-4 ${indentClass} ${textWeight} ${textSize} ${textColor}`}
          headers="account-header"
          aria-describedby={formula ? `formula-description-${key}` : `manual-description-${key}`}
        >
          <div id={`formula-description-${key}`} className="sr-only">
            This is an automatically calculated field based on other line items
          </div>
          <div id={`manual-description-${key}`} className="sr-only">
            This field can be edited by clicking or pressing Enter
          </div>
          <div className="flex items-center gap-3">
            {level === 0 && (
              <div className="w-1.5 h-4 bg-accent rounded-full flex-shrink-0 shadow-sm" />
            )}
            <span className="leading-tight">{label}</span>
            {formula && (
              <div className="flex items-center gap-1">
                <Calculator size={14} className="text-accent/80 flex-shrink-0" />
                <span className="text-xs text-accent font-medium px-1.5 py-0.5 bg-accent/10 rounded-md">
                  AUTO
                </span>
              </div>
            )}
          </div>
        </td>
        {/* Units Column */}
        <td
          className="px-4 py-4 text-center"
          headers="units-header"
          aria-label="Values are in thousands of dollars"
        >
          <span className="text-xs font-medium text-foreground-secondary uppercase tracking-wide bg-muted px-2 py-1 rounded-md">
            $ 000s
          </span>
        </td>

        {/* Period Columns */}
        {data.periods.map((period, periodIndex) => {
          const computed = formula
            ? getComputedValue(key, periodIndex, false)
            : undefined;
          const periodValue =
            computed !== undefined
              ? computed
              : data.statements[activeStatement]?.[key]?.[periodIndex];
          const formattedValue = formatNumber(periodValue);
          const cellAriaLabel = `${label} for ${period}: ${formattedValue || 'no value'} thousand dollars${formula ? ', calculated automatically' : ', click to edit'}`;

          return (
            <td
              key={periodIndex}
              className="px-4 py-4 text-right"
              headers={`period-${periodIndex}-header account-header`}
              data-testid={`cell-${activeStatement}-${key}-${periodIndex}`}
              aria-label={cellAriaLabel}
            >
              {editingCell?.rowKey === key &&
              editingCell?.periodIndex === periodIndex &&
              !editingCell?.isAdjusted ? (
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={cellValue}
                    onChange={e => {
                      const newValue = e.target.value;
                      if (validateNumericInput(newValue)) {
                        setCellValue(newValue);
                      }
                    }}
                    onBlur={handleCellBlur}
                    onKeyDown={handleKeyPress}
                    className="w-full px-3 py-2.5 bg-card border-2 border-accent/50 rounded-lg text-foreground text-right font-mono text-sm focus:outline-none focus:ring-4 focus:ring-ring focus:border-accent shadow-lg"
                    placeholder="0.00"
                    data-metric={key}
                    aria-label={`Edit ${label} for ${period}`}
                    aria-describedby={`manual-description-${key}`}
                  />
                  <div className="absolute -top-2 -right-2 flex gap-1">
                    <button
                      onClick={handleCellBlur}
                      className="w-5 h-5 bg-success hover:bg-success/90 text-success-foreground rounded-full flex items-center justify-center text-xs transition-colors"
                      type="button"
                      aria-label="Save value"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setEditingCell(null);
                        setCellValue('');
                      }}
                      className="w-5 h-5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full flex items-center justify-center text-xs transition-colors"
                      type="button"
                      aria-label="Cancel editing"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => !formula && handleCellClick(key, periodIndex)}
                  className={`px-3 py-2.5 rounded-lg font-mono text-sm transition-all duration-200 min-h-[40px] flex items-center justify-end ${
                    formula
                      ? 'bg-accent/10 text-accent font-semibold border border-accent/30 shadow-sm'
                      : 'hover:bg-muted text-foreground cursor-pointer border border-transparent hover:border-border hover:shadow-sm group-hover:bg-muted'
                  }`}
                  role={formula ? 'cell' : 'button'}
                  tabIndex={formula ? -1 : 0}
                  aria-label={cellAriaLabel}
                  aria-readonly={formula}
                  data-metric={key}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ' ') && !formula) {
                      e.preventDefault();
                      handleCellClick(key, periodIndex);
                    }
                  }}
                >
                  <span className={formula ? 'text-accent' : 'text-foreground'}>
                    {formatNumber(
                      computed !== undefined
                        ? computed
                        : data.statements[activeStatement]?.[key]?.[periodIndex]
                    ) || '—'}
                  </span>
                  {!formula && (
                    <Edit2
                      size={12}
                      className="ml-2 opacity-0 group-hover:opacity-40 text-foreground-secondary transition-opacity"
                    />
                  )}
                </div>
              )}
            </td>
          );
        })}

        {/* Adjusted Column */}
        <td
          className="px-4 py-4 text-right bg-warning/10 border-l-2 border-warning/30"
          headers="adjusted-header account-header"
          data-testid={`cell-${activeStatement}-${key}-adjusted`}
          aria-label={`${label} adjusted value: ${formatNumber(adjustedValues[key] || 0) || 'no value'} thousand dollars${formula ? ', calculated automatically' : ', click to edit'}`}
        >
          {editingCell?.rowKey === key && editingCell?.isAdjusted ? (
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={cellValue}
                onChange={e => {
                  const newValue = e.target.value;
                  if (validateNumericInput(newValue)) {
                    setCellValue(newValue);
                  }
                }}
                onBlur={handleCellBlur}
                onKeyDown={handleKeyPress}
                className="w-full px-3 py-2.5 bg-card border-2 border-warning/50 rounded-lg text-foreground text-right font-mono text-sm focus:outline-none focus:ring-4 focus:ring-ring focus:border-warning shadow-lg"
                placeholder="0.00"
                data-metric={key}
                aria-label={`Edit adjusted ${label}`}
                aria-describedby={`manual-description-${key}`}
              />
              <div className="absolute -top-2 -right-2 flex gap-1">
                <button
                  onClick={handleCellBlur}
                  className="w-5 h-5 bg-success hover:bg-success/90 text-success-foreground rounded-full flex items-center justify-center text-xs transition-colors"
                  type="button"
                  aria-label="Save value"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setEditingCell(null);
                    setCellValue('');
                  }}
                  className="w-5 h-5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full flex items-center justify-center text-xs transition-colors"
                  type="button"
                  aria-label="Cancel editing"
                >
                  ×
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => !formula && handleCellClick(key, null, true)}
              className={`px-3 py-2.5 rounded-lg font-mono text-sm transition-all duration-200 min-h-[40px] flex items-center justify-end ${
                formula
                  ? 'bg-warning/10 text-warning font-semibold border border-warning/30 shadow-sm'
                  : 'hover:bg-warning/10 text-foreground cursor-pointer border border-transparent hover:border-warning/30 hover:shadow-sm'
              }`}
              role={formula ? 'cell' : 'button'}
              tabIndex={formula ? -1 : 0}
              aria-label={`${label} adjusted value: ${formatNumber(adjustedValues[key] || 0) || 'no value'} thousand dollars${formula ? ', calculated automatically' : ', click to edit'}`}
              aria-readonly={formula}
              data-metric={key}
              onKeyDown={e => {
                if ((e.key === 'Enter' || e.key === ' ') && !formula) {
                  e.preventDefault();
                  handleCellClick(key, null, true);
                }
              }}
            >
              <span className={formula ? 'text-warning' : 'text-foreground'}>
                {(() => {
                  if (formula) {
                    const lastIdx = Math.max(0, (data?.periods?.length ?? 1) - 1);
                    const v = getComputedValue(key, lastIdx, true);
                    return formatNumber(v) || '—';
                  }
                  return formatNumber(adjustedValues[key] ?? '') || '—';
                })()}
              </span>
              {!formula && (
                <Edit2
                  size={12}
                  className="ml-2 opacity-0 group-hover:opacity-40 text-warning transition-opacity"
                />
              )}
            </div>
          )}
        </td>

        {/* Type Column */}
        <td
          className="px-4 py-4 text-center"
          headers="type-header"
          aria-label={`${label} is ${formula ? 'automatically calculated' : 'manually editable'}`}
        >
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              formula
                ? 'bg-accent/10 text-accent border border-accent/30'
                : 'bg-muted text-foreground border border-border'
            }`}
          >
            {formula ? (
              <>
                <Calculator size={10} className="mr-1" />
                Auto
              </>
            ) : (
              <>
                <Edit2 size={10} className="mr-1" />
                Manual
              </>
            )}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <section
      role="main"
      aria-labelledby="financial-spreadsheet-title"
      className="bg-background text-foreground rounded-lg shadow-lg"
      data-testid="financial-spreadsheet"
    >
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2
            id="financial-spreadsheet-title"
            className="text-lg sm:text-xl font-semibold text-foreground"
          >
            Financial Statements
          </h2>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <button
              onClick={addPeriod}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-accent text-accent-foreground hover:opacity-90 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm sm:text-base"
              aria-label="Add Period"
              type="button"
            >
              <Plus size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Add Period</span>
              <span className="sm:hidden">Add</span>
            </button>
            <select
              value={activeStatement}
              onChange={e => setActiveStatement(e.target.value)}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium shadow-sm text-sm sm:text-base"
            >
              <option value="incomeStatement">Income Statement</option>
              <option value="balanceSheet">Balance Sheet</option>
              <option value="cashFlow">Cash Flow Statement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-card rounded-xl border border-border shadow-lg">
          <div className="overflow-x-auto scrollbar-thin">
            <table
              className="w-full"
              role="table"
              data-testid={`table-${activeStatement}`}
              aria-label={`Financial ${activeStatement === 'incomeStatement' ? 'Income Statement' : activeStatement === 'balanceSheet' ? 'Balance Sheet' : 'Cash Flow Statement'} with editable cells`}
            >
              {/* Enhanced Table Header */}
              <thead className="bg-muted text-foreground">
                <tr className="sr-only">
                  <td colSpan={data.periods.length + 4}>
                    <div className="p-2 text-sm">
                      Financial spreadsheet table. Use arrow keys to navigate between cells. Press
                      Enter or Space to edit values. Press Tab to move to next editable cell.
                      Formula cells are calculated automatically and cannot be edited.
                    </div>
                  </td>
                </tr>
                <tr role="row">
                  <th
                    className="min-w-[320px] px-6 py-4 text-left text-sm font-semibold tracking-wider"
                    scope="col"
                    id="account-header"
                    aria-label="Financial account descriptions and line items"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-foreground-secondary" />
                      Account Description
                    </div>
                  </th>
                  <th
                    className="w-20 px-4 py-4 text-center text-sm font-semibold"
                    scope="col"
                    id="units-header"
                    aria-label="Units of measurement, typically thousands of dollars"
                  >
                    Units
                  </th>
                  {data.periods.map((period, index) => (
                    <th
                      key={index}
                      className="min-w-[140px] px-4 py-4 text-center text-sm font-semibold"
                      scope="col"
                      id={`period-${index}-header`}
                      aria-label={`Financial data for ${period}, actual values, editable`}
                    >
                      <div className="flex flex-col">
                        <span>{period}</span>
                        <span className="text-xs text-foreground-secondary font-normal">Actual</span>
                      </div>
                    </th>
                  ))}
                  <th
                    className="min-w-[140px] px-4 py-4 text-center text-sm font-semibold bg-warning/20 border-l-2 border-warning/40"
                    scope="col"
                    id="adjusted-header"
                    aria-label="Adjusted financial values, user-modified scenarios and projections, editable"
                  >
                    <div className="flex flex-col">
                      <span>Adjusted</span>
                      <span className="text-xs text-warning font-normal">Modified</span>
                    </div>
                  </th>
                  <th
                    className="w-28 px-4 py-4 text-center text-sm font-semibold"
                    scope="col"
                    id="type-header"
                    aria-label="Cell type: manual entry or automatic calculation"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Calculator size={14} />
                      Type
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {Object.entries(currentTemplate).map(([sectionKey, section]) => (
                  <React.Fragment key={sectionKey}>
                    {/* Enhanced Section Header */}
                    <tr
                      key={`${sectionKey}-header`}
                      className="bg-muted border-b-2 border-border"
                      role="rowheader"
                      aria-label={`${section.title} section header`}
                      data-tour={
                        sectionKey === 'revenue'
                          ? 'revenue-section'
                          : sectionKey === 'operatingExpenses'
                            ? 'expense-section'
                            : undefined
                      }
                    >
                      <td colSpan={data.periods.length + 4} className="py-4 px-6">
                        <div className="flex items-center gap-3 text-foreground w-full text-left group">
                          <button
                            onClick={() => toggleSection(sectionKey)}
                            className="flex items-center gap-3 text-foreground hover:text-foreground transition-colors flex-1"
                            aria-expanded={expandedSections[sectionKey]}
                            aria-label={`Toggle ${section.title} section`}
                          >
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground/10 group-hover:bg-foreground/20 transition-colors">
                              {expandedSections[sectionKey] ? (
                                <ChevronDown size={14} />
                              ) : (
                                <ChevronRight size={14} />
                              )}
                            </div>
                            <span className="font-bold text-lg">{section.title}</span>
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              const newRowLabel = typeof window !== 'undefined' && typeof window.prompt === 'function'
                                ? window.prompt('Enter row label:')
                                : null;
                              if (!newRowLabel) return;
                              const newKey = `custom_${Date.now()}`;
                              setCustomRows(prev => ({
                                ...prev,
                                [sectionKey]: [
                                  ...(prev[sectionKey] || []),
                                  { key: newKey, label: newRowLabel, level: 1 }
                                ]
                              }));
                            }}
                            className="p-1.5 hover:bg-foreground/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Add custom row"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Section Rows */}
                    {expandedSections[sectionKey] && (
                      <>
                        {section.items.map(item => renderRow(item))}
                        {(customRows[sectionKey] || []).map(item => renderRow(item))}
                      </>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Instructions Panel */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Calculator className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-bold text-foreground">How to Use</h3>
            </div>
            <ul className="space-y-2 text-sm text-foreground-secondary">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Click any editable cell to modify values with enhanced input controls
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Use Enter to save changes or Escape to cancel editing
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Expand/collapse sections using the arrow controls
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Formula cells automatically calculate based on inputs
              </li>
            </ul>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <h3 className="font-bold text-foreground">Professional Features</h3>
            </div>
            <ul className="space-y-2 text-sm text-foreground-secondary">
              <li className="flex items-start gap-2">
                <span className="text-success font-bold">•</span>
                Color-coded sections for easy visual navigation
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success font-bold">•</span>
                Adjusted column for scenario analysis and modifications
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success font-bold">•</span>
                Professional number formatting with proper alignment
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success font-bold">•</span>
                Enhanced editing experience with save/cancel controls
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinancialSpreadsheet;
