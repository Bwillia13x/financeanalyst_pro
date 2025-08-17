import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Calculator, Edit2, TrendingUp, BarChart3, Eye, EyeOff } from 'lucide-react';
import React, { useState, useMemo } from 'react';

/**
 * Mobile-Optimized Financial Spreadsheet Component
 * Provides a card-based stacked view for mobile devices
 */
const MobileFinancialSpreadsheet = ({ data, onDataChange, onAdjustedValuesChange }) => {
  const [activeStatement, setActiveStatement] = useState('incomeStatement');
  const [adjustedValues, setAdjustedValues] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState(0);
  const [showAdjustedOnly, setShowAdjustedOnly] = useState(false);

  // Normalize data
  const safeData = useMemo(() => ({
    periods: Array.isArray(data?.periods) ? data.periods : [],
    statements: {
      incomeStatement: data?.statements?.incomeStatement || {},
      balanceSheet: data?.statements?.balanceSheet || {},
      cashFlow: data?.statements?.cashFlow || {}
    }
  }), [data]);

  const formatNumber = (value) => {
    if (!value && value !== 0) return '—';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '—';

    const absValue = Math.abs(numValue);
    if (absValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `${(numValue / 1000).toFixed(0)}K`;
    }
    return numValue.toLocaleString();
  };

  const getStatementTemplate = () => {
    const templates = {
      incomeStatement: {
        revenue: {
          title: 'Revenue',
          color: 'bg-emerald-500',
          items: [
            { key: 'totalRevenue', label: 'Total Revenue', level: 0 },
            { key: 'energyDevices', label: 'Energy Devices', level: 1 },
            { key: 'injectables', label: 'Injectables', level: 1 },
            { key: 'wellness', label: 'Wellness', level: 1 }
          ]
        },
        expenses: {
          title: 'Expenses',
          color: 'bg-red-500',
          items: [
            { key: 'totalCostOfGoodsSold', label: 'Cost of Goods Sold', level: 0 },
            { key: 'totalOperatingExpense', label: 'Operating Expenses', level: 0 },
            { key: 'marketing', label: 'Marketing', level: 1 },
            { key: 'payroll', label: 'Payroll', level: 1 }
          ]
        },
        profitability: {
          title: 'Profitability',
          color: 'bg-blue-500',
          items: [
            { key: 'grossProfit', label: 'Gross Profit', level: 0 },
            { key: 'operatingIncome', label: 'Operating Income', level: 0 },
            { key: 'netIncome', label: 'Net Income', level: 0 }
          ]
        }
      },
      balanceSheet: {
        assets: {
          title: 'Assets',
          color: 'bg-green-500',
          items: [
            { key: 'totalCurrentAssets', label: 'Current Assets', level: 0 },
            { key: 'cash', label: 'Cash', level: 1 },
            { key: 'receivables', label: 'Receivables', level: 1 },
            { key: 'totalNonCurrentAssets', label: 'Non-Current Assets', level: 0 }
          ]
        },
        liabilities: {
          title: 'Liabilities',
          color: 'bg-orange-500',
          items: [
            { key: 'totalCurrentLiabilities', label: 'Current Liabilities', level: 0 },
            { key: 'totalNonCurrentLiabilities', label: 'Non-Current Liabilities', level: 0 }
          ]
        },
        equity: {
          title: 'Equity',
          color: 'bg-purple-500',
          items: [
            { key: 'totalEquity', label: 'Total Equity', level: 0 },
            { key: 'retainedEarnings', label: 'Retained Earnings', level: 1 }
          ]
        }
      },
      cashFlow: {
        operating: {
          title: 'Operating Activities',
          color: 'bg-emerald-500',
          items: [
            { key: 'netCashFromOperating', label: 'Net Cash from Operations', level: 0 },
            { key: 'netIncome', label: 'Net Income', level: 1 },
            { key: 'depreciation', label: 'Depreciation', level: 1 }
          ]
        },
        investing: {
          title: 'Investing Activities',
          color: 'bg-blue-500',
          items: [
            { key: 'netCashFromInvesting', label: 'Net Cash from Investing', level: 0 },
            { key: 'capex', label: 'Capital Expenditures', level: 1 }
          ]
        },
        financing: {
          title: 'Financing Activities',
          color: 'bg-purple-500',
          items: [
            { key: 'netCashFromFinancing', label: 'Net Cash from Financing', level: 0 },
            { key: 'debtIssuance', label: 'Debt Issuance', level: 1 }
          ]
        }
      }
    };
    return templates[activeStatement] || templates.incomeStatement;
  };

  const currentStatementData = safeData.statements[activeStatement] || {};
  const currentTemplate = getStatementTemplate();

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const renderMobileCard = (section, sectionKey) => {
    const isExpanded = expandedSections[sectionKey];

    return (
      <motion.div
        key={sectionKey}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
      >
        <div
          className={`${section.color} p-4 text-white cursor-pointer`}
          onClick={() => toggleSection(sectionKey)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              <h3 className="font-semibold text-lg">{section.title}</h3>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-75">
                {safeData.periods[selectedPeriod] || 'Current'}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {section.items.map((item) => {
                  const value = currentStatementData[item.key]?.[selectedPeriod];
                  const adjustedValue = adjustedValues[item.key];
                  const displayValue = showAdjustedOnly ? adjustedValue : value;

                  return (
                    <div
                      key={item.key}
                      className={`flex items-center justify-between p-3 rounded-lg border border-slate-100 ${
                        item.level === 0 ? 'bg-slate-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.level === 0 && (
                          <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
                        )}
                        <div>
                          <div className={`${item.level === 0 ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {item.label}
                          </div>
                          {item.level === 1 && (
                            <div className="text-xs text-slate-500 mt-1">
                              {safeData.periods[selectedPeriod] || 'Current Period'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-mono ${item.level === 0 ? 'font-bold text-lg' : 'font-medium'}`}>
                          {formatNumber(displayValue)}
                        </div>
                        {!showAdjustedOnly && adjustedValue !== undefined && adjustedValue !== value && (
                          <div className="text-xs text-amber-600 font-medium">
                            Adj: {formatNumber(adjustedValue)}
                          </div>
                        )}
                        <div className="text-xs text-slate-500 uppercase tracking-wide">
                          $ 000s
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      {/* Mobile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Financial Analysis</h1>
            <p className="text-sm text-slate-600">Mobile View</p>
          </div>
        </div>

        {/* Statement Selector */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { key: 'incomeStatement', label: 'Income', icon: BarChart3 },
            { key: 'balanceSheet', label: 'Balance', icon: Calculator },
            { key: 'cashFlow', label: 'Cash Flow', icon: TrendingUp }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveStatement(key)}
              className={`p-3 rounded-lg border transition-colors ${
                activeStatement === key
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} className="mx-auto mb-1" />
              <div className="text-xs font-medium">{label}</div>
            </button>
          ))}
        </div>

        {/* Period Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Time Period
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
            className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {safeData.periods.map((period, index) => (
              <option key={index} value={index}>
                {period}
              </option>
            ))}
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showAdjustedOnly}
              onChange={(e) => setShowAdjustedOnly(e.target.checked)}
              className="rounded"
            />
            <span>Show adjusted values only</span>
          </label>

          <button
            onClick={() => setExpandedSections({})}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4">
        {Object.entries(currentTemplate).map(([sectionKey, section]) =>
          renderMobileCard(section, sectionKey)
        )}
      </div>

      {/* Quick Actions */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <button className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors">
          <Edit2 size={20} />
        </button>
        <button className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors">
          <Calculator size={20} />
        </button>
      </div>
    </div>
  );
};

export default MobileFinancialSpreadsheet;
