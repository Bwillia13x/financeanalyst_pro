import { Plus, Minus, ChevronDown, ChevronRight, Calculator, FileText, TrendingUp } from 'lucide-react';
import React, { useState, useCallback, useRef, useEffect } from 'react';

import styles from './styles.module.css';

const FinancialSpreadsheet = ({ data, onDataChange }) => {
  const [activeStatement, setActiveStatement] = useState('incomeStatement');
  const [expandedSections, setExpandedSections] = useState({
    // Income Statement
    revenue: true,
    costOfGoodsSold: true,
    operatingExpenses: true,
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

  const currentTemplate = getCurrentTemplate();

  // Income Statement Template Structure
  // Balance Sheet Template Structure
  const balanceSheetTemplate = {
    currentAssets: {
      title: 'Current Assets',
      color: 'bg-green-50 border-green-200',
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
      color: 'bg-blue-50 border-blue-200',
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
      color: 'bg-gray-50 border-gray-200',
      items: [
        { key: 'totalAssets', label: 'Total Assets', level: 0, formula: true, bold: true }
      ]
    },
    currentLiabilities: {
      title: 'Current Liabilities',
      color: 'bg-red-50 border-red-200',
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
      color: 'bg-orange-50 border-orange-200',
      items: [
        { key: 'longTermDebt', label: 'Long-term Debt', level: 1 },
        { key: 'deferredTaxLiabilities', label: 'Deferred Tax Liabilities', level: 1 },
        { key: 'otherNonCurrentLiabilities', label: 'Other Non-Current Liabilities', level: 1 },
        { key: 'totalNonCurrentLiabilities', label: 'Total Non-Current Liabilities', level: 0, formula: true, bold: true }
      ]
    },
    totalLiabilities: {
      title: 'Total Liabilities',
      color: 'bg-gray-50 border-gray-200',
      items: [
        { key: 'totalLiabilities', label: 'Total Liabilities', level: 0, formula: true, bold: true }
      ]
    },
    equity: {
      title: 'Shareholders\' Equity',
      color: 'bg-purple-50 border-purple-200',
      items: [
        { key: 'commonStock', label: 'Common Stock', level: 1 },
        { key: 'retainedEarnings', label: 'Retained Earnings', level: 1 },
        { key: 'otherEquity', label: 'Other Comprehensive Income', level: 1 },
        { key: 'totalEquity', label: 'Total Shareholders\' Equity', level: 0, formula: true, bold: true }
      ]
    },
    totalLiabilitiesEquity: {
      title: 'Total Liabilities and Equity',
      color: 'bg-gray-50 border-gray-200',
      items: [
        { key: 'totalLiabilitiesEquity', label: 'Total Liabilities and Shareholders\' Equity', level: 0, formula: true, bold: true }
      ]
    }
  };

  // Cash Flow Statement Template Structure
  const cashFlowTemplate = {
    operatingActivities: {
      title: 'Operating Activities',
      color: 'bg-green-50 border-green-200',
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
      color: 'bg-blue-50 border-blue-200',
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
      color: 'bg-purple-50 border-purple-200',
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
      color: 'bg-gray-50 border-gray-200',
      items: [
        { key: 'netCashFlow', label: 'Net Change in Cash', level: 0, formula: true, bold: true },
        { key: 'beginningCash', label: 'Cash at Beginning of Period', level: 1 },
        { key: 'endingCash', label: 'Cash at End of Period', level: 0, formula: true, bold: true }
      ]
    }
  };

  const incomeStatementTemplate = {
    revenue: {
      title: 'Revenue',
      color: 'bg-blue-50 border-blue-200',
      items: [
        { key: 'energyDevices', label: 'Energy Devices', level: 1 },
        { key: 'injectables', label: 'Injectables', level: 1 },
        { key: 'wellness', label: 'Wellness', level: 1 },
        { key: 'weightloss', label: 'Weight Loss', level: 1 },
        { key: 'nutrition', label: 'Nutrition', level: 1 },
        { key: 'surgery', label: 'Surgery', level: 1 },
        { key: 'totalRevenue', label: 'Total Revenue', level: 0, formula: true, bold: true }
      ]
    },
    costOfGoodsSold: {
      title: 'Cost of Goods Sold',
      color: 'bg-red-50 border-red-200',
      items: [
        { key: 'energyDeviceSupplies', label: 'Energy Device Supplies', level: 1 },
        { key: 'injectables', label: 'Injectables', level: 1 },
        { key: 'wellness', label: 'Wellness', level: 1 },
        { key: 'weightloss', label: 'Weight Loss', level: 1 },
        { key: 'retailProducts', label: 'Retail Products', level: 1 },
        { key: 'surgicalSupplies', label: 'Surgical Supplies', level: 1 },
        { key: 'totalCOGS', label: 'Total Cost of Goods Sold', level: 0, formula: true, bold: true }
      ]
    },
    grossProfit: {
      title: 'Gross Profit',
      color: 'bg-green-50 border-green-200',
      items: [
        { key: 'grossProfit', label: 'Gross Profit', level: 0, formula: true, bold: true }
      ]
    },
    operatingExpenses: {
      title: 'Operating Expenses',
      color: 'bg-yellow-50 border-yellow-200',
      items: [
        { key: 'salariesBenefits', label: 'Salaries & Benefits', level: 0, bold: true },
        { key: 'employeeBenefits', label: 'Employee Benefits', level: 1 },
        { key: 'payroll', label: 'Payroll', level: 1 },
        { key: 'payrollTaxes', label: 'Payroll Taxes', level: 1 },
        { key: 'totalSalariesBenefits', label: 'Total Salaries & Benefits', level: 0, formula: true, bold: true },
        { key: 'marketing', label: 'Marketing', level: 1 },
        { key: 'automobile', label: 'Automobile', level: 1 },
        { key: 'creditCardCharges', label: 'Credit Card and Bank Charges', level: 1 },
        { key: 'donations', label: 'Donations', level: 1 },
        { key: 'computerTelephone', label: 'Computer, Telephone and Utilities', level: 1 },
        { key: 'depreciation', label: 'Depreciation', level: 1 },
        { key: 'duesSubscriptions', label: 'Dues & Subscriptions', level: 1 },
        { key: 'education', label: 'Education', level: 1 },
        { key: 'equipmentRental', label: 'Equipment Rental', level: 1 },
        { key: 'insurance', label: 'Insurance', level: 1 },
        { key: 'internetExpense', label: 'Internet Expense', level: 1 },
        { key: 'travelMeals', label: 'Travel, Meals, and Entertainment', level: 1 },
        { key: 'rent', label: 'Rent', level: 1 },
        { key: 'officeExpenses', label: 'Office Expenses', level: 1 },
        { key: 'professionalFees', label: 'Professional Fees', level: 1 },
        { key: 'repairsMaintenance', label: 'Repairs & Maintenance', level: 1 },
        { key: 'localTax', label: 'Local Tax', level: 1 },
        { key: 'stateTax', label: 'State Tax', level: 1 },
        { key: 'totalOperatingExpenses', label: 'Total Operating Expenses', level: 0, formula: true, bold: true }
      ]
    },
    operatingIncome: {
      title: 'Operating Income',
      color: 'bg-purple-50 border-purple-200',
      items: [
        { key: 'operatingIncome', label: 'Operating Income', level: 0, formula: true, bold: true },
        { key: 'ownerCompensationAddback', label: '(-) Owner compensation add-back', level: 1 },
        { key: 'adjustedOperatingIncome', label: 'Adjusted Operating Income', level: 0, formula: true, bold: true },
        { key: 'adjustedEBITDA', label: 'Adjusted EBITDA', level: 0, formula: true, bold: true }
      ]
    },
    otherIncomeExpense: {
      title: 'Other Income / (Expense)',
      color: 'bg-gray-50 border-gray-200',
      items: [
        { key: 'gainLossAssetSale', label: 'Gain (Loss) On Asset Sale', level: 1 },
        { key: 'interestIncome', label: 'Interest Income', level: 1 },
        { key: 'otherExpense', label: 'Other Expense', level: 1 }
      ]
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCellClick = (rowKey, periodIndex) => {
    setEditingCell({ rowKey, periodIndex });
    const currentValue = data.statements.incomeStatement[rowKey]?.[periodIndex] || '';
    setCellValue(currentValue.toString());
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const { rowKey, periodIndex } = editingCell;
      const numericValue = parseFloat(cellValue) || 0;

      const newData = { ...data };
      if (!newData.statements.incomeStatement[rowKey]) {
        newData.statements.incomeStatement[rowKey] = {};
      }
      newData.statements.incomeStatement[rowKey][periodIndex] = numericValue;

      onDataChange(newData);
      setEditingCell(null);
      setCellValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setCellValue('');
    }
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return '';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const addNewRow = (sectionKey) => {
    const newRowKey = `custom_${Date.now()}`;
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

  const renderRow = (item, sectionKey) => {
    const { key, label, level, formula, bold } = item;
    const indentClass = level === 1 ? 'pl-8' : level === 2 ? 'pl-12' : 'pl-4';
    const textWeight = bold ? 'font-bold' : level === 0 ? 'font-semibold' : 'font-normal';

    return (
      <tr key={key} className={styles.tableRow}>
        <td className={`${styles.tableCell} ${indentClass} ${textWeight} ${level === 0 ? 'text-slate-800' : 'text-slate-600'}`}>
          {label}
          {formula && <Calculator size={14} className="inline ml-2 text-blue-500" />}
        </td>
        <td className={`${styles.tableCell} text-center text-xs text-slate-500`}>
          $ 000s
        </td>

        {data.periods.map((period, periodIndex) => (
          <td key={periodIndex} className={`${styles.tableCell} text-right`}>
            {editingCell?.rowKey === key && editingCell?.periodIndex === periodIndex ? (
              <input
                ref={inputRef}
                type="text"
                value={cellValue}
                onChange={(e) => setCellValue(e.target.value)}
                onBlur={handleCellBlur}
                onKeyDown={handleKeyPress}
                className={styles.inputCell}
              />
            ) : (
              <div
                onClick={() => !formula && handleCellClick(key, periodIndex)}
                className={`px-2 py-1 rounded cursor-pointer hover:bg-blue-50 ${
                  formula ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'
                }`}
              >
                {formatNumber(data.statements.incomeStatement[key]?.[periodIndex])}
              </div>
            )}
          </td>
        ))}

        <td className={styles.tableCell}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {formula ? 'Auto' : 'Manual'}
            </span>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className={styles.spreadsheetContainer}>
      <div className={styles.spreadsheetHeader}>
        <h2 className={styles.spreadsheetTitle}>Financial Spreadsheet</h2>
        <div className={styles.spreadsheetActions}>
          <button
            onClick={addPeriod}
            className={`${styles.button} ${styles.primary}`}
          >
            <Plus size={16} />
            Add Period
          </button>
          <select
            value={activeStatement}
            onChange={(e) => setActiveStatement(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="incomeStatement">Income Statement</option>
            <option value="balanceSheet">Balance Sheet</option>
            <option value="cashFlow">Cash Flow Statement</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className={styles.spreadsheetTable}>
            <thead className={styles.tableHead}>
              <tr>
                <th className="min-w-[300px]">Account</th>
                <th className="w-16">Units</th>
                {data.periods.map((period, index) => (
                  <th key={index} className="min-w-[120px]">{period}</th>
                ))}
                <th className="w-24">Type</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(incomeStatementTemplate).map(([sectionKey, section]) => (
                <React.Fragment key={sectionKey}>
                  {/* Section Header */}
                  <tr className={`${section.color} border-b-2`}>
                    <td colSpan={data.periods.length + 3} className="py-3 px-4">
                      <button
                        onClick={() => toggleSection(sectionKey)}
                        className="flex items-center gap-2 font-bold text-slate-800 hover:text-blue-600 transition-colors"
                      >
                        {expandedSections[sectionKey] ?
                          <ChevronDown size={16} /> :
                          <ChevronRight size={16} />
                        }
                        {section.title}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addNewRow(sectionKey);
                          }}
                          className="ml-2 p-1 hover:bg-white/50 rounded"
                        >
                          <Plus size={14} />
                        </button>
                      </button>
                    </td>
                  </tr>

                  {/* Section Rows */}
                  {expandedSections[sectionKey] && section.items.map(item =>
                    renderRow(item, sectionKey)
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">How to use:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Click on any cell to edit values</li>
          <li>• Press Enter to save, Escape to cancel</li>
          <li>• Use the + button to add custom rows to each section</li>
          <li>• Formulated cells (with calculator icon) auto-calculate</li>
          <li>• Add new periods using the "Add Period" button</li>
        </ul>
      </div>
    </div>
  );
};

export default FinancialSpreadsheet;
