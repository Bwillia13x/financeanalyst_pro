import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, ChevronRight, Calculator, FileText, TrendingUp, Edit2 } from 'lucide-react';

import { useFinancialAccessibility } from '../../hooks/useAccessibility';

const FinancialSpreadsheet = ({ data, onDataChange, onAdjustedValuesChange }) => {
  const [activeStatement, setActiveStatement] = useState('incomeStatement');
  const [adjustedValues, setAdjustedValues] = useState({});
  
  // Add accessibility monitoring for financial spreadsheet
  const { elementRef, testFinancialFeatures } = useFinancialAccessibility('spreadsheet');
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
    // Cash Flow
    operatingActivities: true,
    investingActivities: true,
    financingActivities: true
  });
  
  const [editingCell, setEditingCell] = useState(null);
  const [cellValue, setCellValue] = useState('');
  const inputRef = useRef(null);

  // Initialize adjusted values with 2024 data (period index 2)
  useEffect(() => {
    if (data?.statements?.incomeStatement && Object.keys(adjustedValues).length === 0) {
      const newAdjustedValues = {};
      const incomeStatement = data.statements.incomeStatement;
      
      Object.keys(incomeStatement).forEach(key => {
        if (incomeStatement[key] && incomeStatement[key][2] !== undefined) {
          newAdjustedValues[key] = incomeStatement[key][2];
        }
      });
      
      setAdjustedValues(newAdjustedValues);
      if (onAdjustedValuesChange) {
        onAdjustedValuesChange(newAdjustedValues);
      }
    }
  }, [data, adjustedValues, onAdjustedValuesChange]);

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
      color: 'bg-emerald-50 border-emerald-300',
      headerBg: 'bg-emerald-600',
      textColor: 'text-emerald-900',
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
      color: 'bg-red-50 border-red-300',
      headerBg: 'bg-red-600',
      textColor: 'text-red-900',
      items: [
        { key: 'energyDeviceSupplies', label: 'Energy Device Supplies', level: 1 },
        { key: 'injectablesCogs', label: 'Injectables', level: 1 },
        { key: 'wellnessCogs', label: 'Wellness', level: 1 },
        { key: 'weightlossCogs', label: 'Weightloss', level: 1 },
        { key: 'retailProducts', label: 'Retail Products', level: 1 },
        { key: 'surgicalSupplies', label: 'Surgical Supplies', level: 1 },
        { key: 'totalCostOfGoodsSold', label: 'Total Cost of Goods Sold', level: 0, bold: true, formula: true }
      ]
    },
    grossProfit: {
      title: 'Gross Profit',
      color: 'bg-blue-50 border-blue-300',
      headerBg: 'bg-blue-600',
      textColor: 'text-blue-900',
      items: [
        { key: 'grossProfit', label: 'Gross Profit', level: 0, bold: true, formula: true }
      ]
    },
    salariesBenefits: {
      title: 'Salaries & Benefits',
      color: 'bg-purple-50 border-purple-300',
      headerBg: 'bg-purple-600',
      textColor: 'text-purple-900',
      items: [
        { key: 'employeeBenefits', label: 'Employee Benefits', level: 1 },
        { key: 'payroll', label: 'Payroll', level: 1 },
        { key: 'payrollTaxes', label: 'Payroll Taxes', level: 1 },
        { key: 'totalSalariesBenefits', label: 'Total Salaries & Benefits', level: 0, bold: true, formula: true }
      ]
    },
    operatingExpenses: {
      title: 'Operating Expenses',
      color: 'bg-orange-50 border-orange-300',
      headerBg: 'bg-orange-600',
      textColor: 'text-orange-900',
      items: [
        { key: 'marketing', label: 'Marketing', level: 1 },
        { key: 'automobile', label: 'Automobile', level: 1 },
        { key: 'creditCardBankCharges', label: 'Credit Card and Bank Charges', level: 1 },
        { key: 'donations', label: 'Donations', level: 1 },
        { key: 'computerTelephoneUtilities', label: 'Computer, Telephone, and Utilities', level: 1 },
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
        { key: 'totalOperatingExpense', label: 'Total Operating Expense', level: 0, bold: true, formula: true }
      ]
    },
    operatingIncome: {
      title: 'Operating Income',
      color: 'bg-teal-50 border-teal-300',
      headerBg: 'bg-teal-600',
      textColor: 'text-teal-900',
      items: [
        { key: 'operatingIncome', label: 'Operating Income', level: 0, bold: true }
      ]
    },
    otherIncomeExpense: {
      title: 'Other Income / (Expense)',
      color: 'bg-slate-50 border-slate-300',
      headerBg: 'bg-slate-600',
      textColor: 'text-slate-900',
      items: [
        { key: 'gainOnAssetSale', label: 'Gain (Loss) On Asset Sale', level: 1 },
        { key: 'interestIncome', label: 'Interest Income', level: 1 },
        { key: 'otherExpenses', label: 'Other Expenses', level: 1 },
        { key: 'totalOtherIncomeExpense', label: 'Total Other Income / (Expenses)', level: 0, bold: true, formula: true }
      ]
    },
    incomeBeforeTax: {
      title: 'Net Income Before Taxes',
      color: 'bg-amber-50 border-amber-300',
      headerBg: 'bg-amber-600',
      textColor: 'text-amber-900',
      items: [
        { key: 'incomeBeforeTax', label: 'Net Income Before Taxes', level: 0, bold: true }
      ]
    }
  };

  // Balance Sheet Template Structure
  const balanceSheetTemplate = {
    currentAssets: {
      title: 'Current Assets',
      color: 'bg-emerald-50 border-emerald-300',
      headerBg: 'bg-emerald-600',
      textColor: 'text-emerald-900',
      items: [
        { key: 'cash', label: 'Cash and Cash Equivalents', level: 1 },
        { key: 'receivables', label: 'Accounts Receivable', level: 1 },
        { key: 'inventory', label: 'Inventory', level: 1 },
        { key: 'prepaidExpenses', label: 'Prepaid Expenses', level: 1 },
        { key: 'otherCurrentAssets', label: 'Other Current Assets', level: 1 },
        { key: 'totalCurrentAssets', label: 'Total Current Assets', level: 0, formula: true, bold: true }
      ]
    },
    nonCurrentAssets: {
      title: 'Non-Current Assets',
      color: 'bg-blue-50 border-blue-300',
      headerBg: 'bg-blue-600',
      textColor: 'text-blue-900',
      items: [
        { key: 'ppe', label: 'Property, Plant & Equipment', level: 1 },
        { key: 'accumulatedDepreciation', label: 'Less: Accumulated Depreciation', level: 1 },
        { key: 'netPPE', label: 'Net Property, Plant & Equipment', level: 1, formula: true },
        { key: 'intangibleAssets', label: 'Intangible Assets', level: 1 },
        { key: 'goodwill', label: 'Goodwill', level: 1 },
        { key: 'otherNonCurrentAssets', label: 'Other Non-Current Assets', level: 1 },
        { key: 'totalNonCurrentAssets', label: 'Total Non-Current Assets', level: 0, formula: true, bold: true }
      ]
    },
    totalAssets: {
      title: 'Total Assets',
      color: 'bg-slate-50 border-slate-300',
      headerBg: 'bg-slate-700',
      textColor: 'text-slate-900',
      items: [
        { key: 'totalAssets', label: 'Total Assets', level: 0, formula: true, bold: true }
      ]
    },
    currentLiabilities: {
      title: 'Current Liabilities',
      color: 'bg-red-50 border-red-300',
      headerBg: 'bg-red-600',
      textColor: 'text-red-900',
      items: [
        { key: 'accountsPayable', label: 'Accounts Payable', level: 1 },
        { key: 'accruedExpenses', label: 'Accrued Expenses', level: 1 },
        { key: 'shortTermDebt', label: 'Short-term Debt', level: 1 },
        { key: 'currentPortionLongTermDebt', label: 'Current Portion of Long-term Debt', level: 1 },
        { key: 'otherCurrentLiabilities', label: 'Other Current Liabilities', level: 1 },
        { key: 'totalCurrentLiabilities', label: 'Total Current Liabilities', level: 0, formula: true, bold: true }
      ]
    },
    nonCurrentLiabilities: {
      title: 'Non-Current Liabilities',
      color: 'bg-orange-50 border-orange-300',
      headerBg: 'bg-orange-600',
      textColor: 'text-orange-900',
      items: [
        { key: 'longTermDebt', label: 'Long-term Debt', level: 1 },
        { key: 'deferredTaxLiabilities', label: 'Deferred Tax Liabilities', level: 1 },
        { key: 'otherNonCurrentLiabilities', label: 'Other Non-Current Liabilities', level: 1 },
        { key: 'totalNonCurrentLiabilities', label: 'Total Non-Current Liabilities', level: 0, formula: true, bold: true }
      ]
    },
    totalLiabilities: {
      title: 'Total Liabilities',
      color: 'bg-slate-50 border-slate-300',
      headerBg: 'bg-slate-700',
      textColor: 'text-slate-900',
      items: [
        { key: 'totalLiabilities', label: 'Total Liabilities', level: 0, formula: true, bold: true }
      ]
    },
    equity: {
      title: 'Shareholders\' Equity',
      color: 'bg-purple-50 border-purple-300',
      headerBg: 'bg-purple-600',
      textColor: 'text-purple-900',
      items: [
        { key: 'commonStock', label: 'Common Stock', level: 1 },
        { key: 'retainedEarnings', label: 'Retained Earnings', level: 1 },
        { key: 'otherEquity', label: 'Other Comprehensive Income', level: 1 },
        { key: 'totalEquity', label: 'Total Shareholders\' Equity', level: 0, formula: true, bold: true }
      ]
    },
    totalLiabilitiesEquity: {
      title: 'Total Liabilities and Equity',
      color: 'bg-slate-50 border-slate-300',
      headerBg: 'bg-slate-700',
      textColor: 'text-slate-900',
      items: [
        { key: 'totalLiabilitiesEquity', label: 'Total Liabilities and Shareholders\' Equity', level: 0, formula: true, bold: true }
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
        { key: 'netCashFromOperating', label: 'Net Cash from Operating Activities', level: 0, formula: true, bold: true }
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
        { key: 'netCashFromInvesting', label: 'Net Cash from Investing Activities', level: 0, formula: true, bold: true }
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
        { key: 'netCashFromFinancing', label: 'Net Cash from Financing Activities', level: 0, formula: true, bold: true }
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

  const toggleSection = (section) => {
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
      currentValue = data.statements.incomeStatement[rowKey]?.[periodIndex] || '';
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
        // Update original data
        const newData = { ...data };
        if (!newData.statements.incomeStatement[rowKey]) {
          newData.statements.incomeStatement[rowKey] = {};
        }
        newData.statements.incomeStatement[rowKey][periodIndex] = newValue;
        onDataChange(newData);
      }
      
      setEditingCell(null);
      setCellValue('');
    }
  };

  const handleKeyPress = (e) => {
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
  const validateNumericInput = (value) => {
    // Allow negative numbers, decimals, and empty strings
    const numericRegex = /^-?\d*\.?\d*$/;
    return numericRegex.test(value) || value === '';
  };

  const formatNumber = (value) => {
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

  const addNewRow = () => {
    const newRowLabel = prompt('Enter row label:');
    if (newRowLabel) {
      const newData = { ...data };
      // Add to template structure (this could be enhanced to persist custom rows)
      onDataChange(newData);
    }
  };

  const addPeriod = () => {
    const newPeriodLabel = prompt('Enter period label (e.g., "Year 5"):');
    if (newPeriodLabel) {
      const newData = { ...data };
      newData.periods = [...newData.periods, newPeriodLabel];
      onDataChange(newData);
    }
  };

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const renderRow = (item) => {
    const { key, label, level, formula, bold } = item;
    
    // Enhanced spacing and visual hierarchy
    const indentClass = level === 1 ? 'pl-8' : level === 2 ? 'pl-12' : 'pl-4';
    const textWeight = bold ? 'font-bold' : level === 0 ? 'font-semibold' : 'font-medium';
    const textSize = level === 0 ? 'text-sm' : 'text-sm';
    const textColor = level === 0 ? 'text-slate-900' : 'text-slate-700';
    const rowBg = level === 0 ? 'bg-slate-50/70' : 'bg-white';
    const borderColor = level === 0 ? 'border-slate-200' : 'border-slate-100';
    
    return (
      <tr key={key} className={`${rowBg} border-b ${borderColor} hover:bg-slate-50 transition-all duration-150 group`}>
        {/* Account Name Column */}
        <td className={`px-6 py-4 ${indentClass} ${textWeight} ${textSize} ${textColor}`}>
          <div className="flex items-center gap-3">
            {level === 0 && (
              <div className="w-1.5 h-4 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full flex-shrink-0 shadow-sm" />
            )}
            <span className="leading-tight">{label}</span>
            {formula && (
              <div className="flex items-center gap-1">
                <Calculator size={14} className="text-blue-500/80 flex-shrink-0" />
                <span className="text-xs text-blue-600 font-medium px-1.5 py-0.5 bg-blue-50 rounded-md">AUTO</span>
              </div>
            )}
          </div>
        </td>
        
        {/* Units Column */}
        <td className="px-4 py-4 text-center">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide bg-slate-100 px-2 py-1 rounded-md">
            $ 000s
          </span>
        </td>
        
        {/* Period Columns */}
        {data.periods.map((_, periodIndex) => (
          <td key={periodIndex} className="px-4 py-4 text-right">
            {editingCell?.rowKey === key && editingCell?.periodIndex === periodIndex && !editingCell?.isAdjusted ? (
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={cellValue}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    if (validateNumericInput(newValue)) {
                      setCellValue(newValue);
                    }
                  }}
                  onBlur={handleCellBlur}
                  onKeyDown={handleKeyPress}
                  className="w-full px-3 py-2.5 bg-white border-2 border-blue-400 rounded-lg text-slate-900 text-right font-mono text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 shadow-lg"
                  placeholder="0.00"
                />
                <div className="absolute -top-2 -right-2 flex gap-1">
                  <button
                    onClick={handleCellBlur}
                    className="w-5 h-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setEditingCell(null);
                      setCellValue('');
                    }}
                    className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
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
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 font-semibold border border-blue-200 shadow-sm' 
                    : 'hover:bg-slate-100 text-slate-800 cursor-pointer border border-transparent hover:border-slate-200 hover:shadow-sm group-hover:bg-slate-50'
                }`}
              >
                <span className={formula ? 'text-blue-900' : 'text-slate-700'}>
                  {formatNumber(data.statements.incomeStatement[key]?.[periodIndex]) || '—'}
                </span>
                {!formula && (
                  <Edit2 size={12} className="ml-2 opacity-0 group-hover:opacity-40 text-slate-400 transition-opacity" />
                )}
              </div>
            )}
          </td>
        ))}
        
        {/* Adjusted Column */}
        <td className="px-4 py-4 text-right bg-gradient-to-r from-amber-50 to-yellow-50 border-l-2 border-amber-300">
          {editingCell?.rowKey === key && editingCell?.isAdjusted ? (
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={cellValue}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (validateNumericInput(newValue)) {
                    setCellValue(newValue);
                  }
                }}
                onBlur={handleCellBlur}
                onKeyDown={handleKeyPress}
                className="w-full px-3 py-2.5 bg-white border-2 border-amber-400 rounded-lg text-slate-900 text-right font-mono text-sm focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-500 shadow-lg"
                placeholder="0.00"
              />
              <div className="absolute -top-2 -right-2 flex gap-1">
                <button
                  onClick={handleCellBlur}
                  className="w-5 h-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setEditingCell(null);
                    setCellValue('');
                  }}
                  className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
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
                  ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 font-semibold border border-amber-300 shadow-sm' 
                  : 'hover:bg-amber-100 text-slate-800 cursor-pointer border border-transparent hover:border-amber-300 hover:shadow-sm'
              }`}
            >
              <span className={formula ? 'text-amber-900' : 'text-slate-700'}>
                {formatNumber(adjustedValues[key] || 0) || '—'}
              </span>
              {!formula && (
                <Edit2 size={12} className="ml-2 opacity-0 group-hover:opacity-40 text-amber-500 transition-opacity" />
              )}
            </div>
          )}
        </td>
        
        {/* Type Column */}
        <td className="px-4 py-4 text-center">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            formula 
              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-8">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-full mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Financial Spreadsheet</h1>
                <p className="text-sm text-slate-600 mt-1">Professional financial modeling workspace</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={addPeriod}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                <Plus size={16} />
                Add Period
              </button>
              <select
                value={activeStatement}
                onChange={(e) => setActiveStatement(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium shadow-sm"
              >
                <option value="incomeStatement">Income Statement</option>
                <option value="balanceSheet">Balance Sheet</option>
                <option value="cashFlow">Cash Flow Statement</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto p-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Enhanced Table Header */}
              <thead className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                <tr>
                  <th className="min-w-[320px] px-6 py-4 text-left text-sm font-semibold tracking-wider">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-slate-300" />
                      Account Description
                    </div>
                  </th>
                  <th className="w-20 px-4 py-4 text-center text-sm font-semibold">Units</th>
                  {data.periods.map((period, index) => (
                    <th key={index} className="min-w-[140px] px-4 py-4 text-center text-sm font-semibold">
                      <div className="flex flex-col">
                        <span>{period}</span>
                        <span className="text-xs text-slate-300 font-normal">Actual</span>
                      </div>
                    </th>
                  ))}
                  <th className="min-w-[140px] px-4 py-4 text-center text-sm font-semibold bg-gradient-to-r from-amber-600 to-yellow-600 border-l-2 border-amber-400">
                    <div className="flex flex-col">
                      <span>Adjusted</span>
                      <span className="text-xs text-amber-100 font-normal">Modified</span>
                    </div>
                  </th>
                  <th className="w-28 px-4 py-4 text-center text-sm font-semibold">
                    <div className="flex items-center justify-center gap-1">
                      <Calculator size={14} />
                      Type
                    </div>
                  </th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-100">
                {Object.entries(currentTemplate).map(([sectionKey, section]) => (
                  <React.Fragment key={sectionKey}>
                    {/* Enhanced Section Header */}
                    <tr className={`${section.headerBg || 'bg-slate-600'} border-b-2 border-slate-300`}>
                      <td colSpan={data.periods.length + 4} className="py-4 px-6">
                        <div className="flex items-center gap-3 text-white w-full text-left group">
                          <button
                            onClick={() => toggleSection(sectionKey)}
                            className="flex items-center gap-3 text-white hover:text-slate-200 transition-colors flex-1"
                          >
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                              {expandedSections[sectionKey] ? 
                                <ChevronDown size={14} /> : 
                                <ChevronRight size={14} />
                              }
                            </div>
                            <span className="font-bold text-lg">{section.title}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addNewRow();
                            }}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Add custom row"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Section Rows */}
                    {expandedSections[sectionKey] && section.items.map(item => 
                      renderRow(item)
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Instructions Panel */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calculator className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900">How to Use</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                Click any editable cell to modify values with enhanced input controls
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                Use Enter to save changes or Escape to cancel editing
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                Expand/collapse sections using the arrow controls
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                Formula cells automatically calculate based on inputs
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-bold text-slate-900">Professional Features</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">•</span>
                Color-coded sections for easy visual navigation
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">•</span>
                Adjusted column for scenario analysis and modifications
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">•</span>
                Professional number formatting with proper alignment
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">•</span>
                Enhanced editing experience with save/cancel controls
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSpreadsheet;
