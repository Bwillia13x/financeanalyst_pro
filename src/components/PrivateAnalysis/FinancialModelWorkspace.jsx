import { motion } from 'framer-motion';
import {
  FileText,
  TrendingUp,
  Building,
  Activity,
  Calculator,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import React, { useState, useCallback } from 'react';

const FinancialModelWorkspace = ({ _data, _onDataChange }) => {
  const [activeStatement, setActiveStatement] = useState('income');
  const [modelData, setModelData] = useState({
    // Income Statement (in thousands)
    revenue: [100000, 105000, 110250, 115763, 121551],
    costOfGoodsSold: [60000, 63000, 66150, 69458, 72931],
    grossProfit: [40000, 42000, 44100, 46305, 48620],
    operatingExpenses: [25000, 26250, 27563, 28941, 30388],
    ebitda: [15000, 15750, 16538, 17364, 18232],
    depreciation: [3000, 3150, 3308, 3473, 3647],
    ebit: [12000, 12600, 13230, 13891, 14585],
    interestExpense: [2000, 1800, 1580, 1340, 1080],
    ebt: [10000, 10800, 11650, 12551, 13505],
    taxes: [2100, 2268, 2447, 2636, 2836],
    netIncome: [7900, 8532, 9203, 9915, 10669],

    // Balance Sheet
    cash: [5000, 8532, 12735, 17650, 23319],
    accountsReceivable: [8333, 8750, 9188, 9647, 10129],
    inventory: [10000, 10500, 11025, 11576, 12155],
    totalCurrentAssets: [23333, 27782, 32948, 38873, 45603],
    ppe: [50000, 51850, 53543, 55070, 56423],
    totalAssets: [73333, 79632, 86491, 93943, 102026],

    accountsPayable: [5000, 5250, 5513, 5789, 6078],
    shortTermDebt: [3000, 2000, 1000, 0, 0],
    totalCurrentLiabilities: [8000, 7250, 6513, 5789, 6078],
    longTermDebt: [25000, 23000, 21000, 19000, 17000],
    totalLiabilities: [33000, 30250, 27513, 24789, 23078],
    shareholderEquity: [40333, 49382, 58978, 69154, 78948],
    totalLiabilitiesEquity: [73333, 79632, 86491, 93943, 102026],

    // Cash Flow
    operatingCashFlow: [8567, 10233, 11345, 12464, 13584],
    capex: [-5000, -4850, -5000, -5000, -5000],
    investingCashFlow: [-5000, -4850, -5000, -5000, -5000],
    debtRepayment: [-2000, -2000, -2000, -2000, -2000],
    financingCashFlow: [-2000, -2000, -2000, -2000, -2000],
    netCashFlow: [1567, 3383, 4345, 5464, 6584],
    endingCash: [5000, 8383, 12728, 18192, 24776]
  });

  const [assumptions, setAssumptions] = useState({
    revenueGrowthRate: 0.05,
    cogsPercentOfRevenue: 0.6,
    opexGrowthRate: 0.05,
    taxRate: 0.21,
    depreciationRate: 0.06,
    capexPercentOfRevenue: 0.05,
    debtPaydown: 2000
  });

  const [validationErrors, setValidationErrors] = useState([]);
  const periods = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];

  const formatCurrency = useCallback(value => {
    if (!value && value !== 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value * 1000); // Convert from thousands
  }, []);

  const recalculateModel = useCallback(() => {
    const newData = { ...modelData };

    // Recalculate projections based on assumptions
    for (let i = 1; i < 5; i++) {
      // Income Statement
      newData.revenue[i] = newData.revenue[i - 1] * (1 + assumptions.revenueGrowthRate);
      newData.costOfGoodsSold[i] = newData.revenue[i] * assumptions.cogsPercentOfRevenue;
      newData.grossProfit[i] = newData.revenue[i] - newData.costOfGoodsSold[i];
      newData.operatingExpenses[i] =
        newData.operatingExpenses[i - 1] * (1 + assumptions.opexGrowthRate);
      newData.ebitda[i] = newData.grossProfit[i] - newData.operatingExpenses[i];
      newData.depreciation[i] = newData.ppe[i - 1] * assumptions.depreciationRate;
      newData.ebit[i] = newData.ebitda[i] - newData.depreciation[i];
      newData.interestExpense[i] = newData.longTermDebt[i - 1] * 0.06;
      newData.ebt[i] = newData.ebit[i] - newData.interestExpense[i];
      newData.taxes[i] = Math.max(0, newData.ebt[i] * assumptions.taxRate);
      newData.netIncome[i] = newData.ebt[i] - newData.taxes[i];

      // Balance Sheet
      const capex = newData.revenue[i] * assumptions.capexPercentOfRevenue;
      newData.ppe[i] = newData.ppe[i - 1] + capex - newData.depreciation[i];
      newData.longTermDebt[i] = Math.max(0, newData.longTermDebt[i - 1] - assumptions.debtPaydown);
      newData.shortTermDebt[i] = Math.max(0, newData.shortTermDebt[i - 1] - 1000);

      // Working capital (simplified)
      newData.accountsReceivable[i] = newData.revenue[i] * 0.083; // ~30 days
      newData.inventory[i] = newData.costOfGoodsSold[i] * 0.1; // ~36 days
      newData.accountsPayable[i] = newData.costOfGoodsSold[i] * 0.05; // ~18 days

      // Cash Flow
      const wcChange =
        newData.accountsReceivable[i] -
        newData.accountsReceivable[i - 1] +
        (newData.inventory[i] - newData.inventory[i - 1]) -
        (newData.accountsPayable[i] - newData.accountsPayable[i - 1]);

      newData.operatingCashFlow[i] = newData.netIncome[i] + newData.depreciation[i] - wcChange;
      newData.capex[i] = -capex;
      newData.investingCashFlow[i] = newData.capex[i];
      newData.debtRepayment[i] = -assumptions.debtPaydown;
      newData.financingCashFlow[i] = newData.debtRepayment[i];
      newData.netCashFlow[i] =
        newData.operatingCashFlow[i] + newData.investingCashFlow[i] + newData.financingCashFlow[i];
      newData.endingCash[i] = newData.cash[i - 1] + newData.netCashFlow[i];
      newData.cash[i] = newData.endingCash[i];

      // Complete Balance Sheet
      newData.totalCurrentAssets[i] =
        newData.cash[i] + newData.accountsReceivable[i] + newData.inventory[i];
      newData.totalAssets[i] = newData.totalCurrentAssets[i] + newData.ppe[i];
      newData.totalCurrentLiabilities[i] = newData.accountsPayable[i] + newData.shortTermDebt[i];
      newData.totalLiabilities[i] = newData.totalCurrentLiabilities[i] + newData.longTermDebt[i];
      newData.shareholderEquity[i] = newData.totalAssets[i] - newData.totalLiabilities[i];
      newData.totalLiabilitiesEquity[i] =
        newData.totalLiabilities[i] + newData.shareholderEquity[i];
    }

    setModelData(newData);

    // Validate model
    const errors = [];
    for (let i = 0; i < 5; i++) {
      const diff = Math.abs(newData.totalAssets[i] - newData.totalLiabilitiesEquity[i]);
      if (diff > 1) {
        errors.push(`Balance sheet doesn't balance in ${periods[i]}`);
      }
    }
    setValidationErrors(errors);
  }, [modelData, assumptions, periods]);

  const handleAssumptionChange = useCallback((field, value) => {
    setAssumptions(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  }, []);

  const statements = [
    { id: 'income', label: 'Income Statement', icon: TrendingUp },
    { id: 'balance', label: 'Balance Sheet', icon: Building },
    { id: 'cashflow', label: 'Cash Flow', icon: Activity },
    { id: 'assumptions', label: 'Assumptions', icon: Calculator }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FileText className="text-green-600" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">3-Statement Financial Model</h2>
            <p className="text-gray-600">Integrated Income Statement, Balance Sheet & Cash Flow</p>
          </div>
        </div>

        <motion.button
          onClick={recalculateModel}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2"
          whileHover={{ scale: 1.02 }}
        >
          <RefreshCw size={16} />
          <span>Recalculate</span>
        </motion.button>
      </div>

      {/* Validation Status */}
      {validationErrors.length === 0 ? (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="text-green-500 mr-2" size={20} />
          <span className="text-green-800 font-medium">Model is balanced and consistent</span>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertCircle className="text-red-500 mr-2" size={20} />
            <h3 className="font-semibold text-red-800">Validation Errors</h3>
          </div>
          <ul className="text-sm text-red-700">
            {validationErrors.map((error, idx) => (
              <li key={idx}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {statements.map(statement => {
            const Icon = statement.icon;
            return (
              <button
                key={statement.id}
                onClick={() => setActiveStatement(statement.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeStatement === statement.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                <span>{statement.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Income Statement */}
      {activeStatement === 'income' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 font-semibold">Income Statement ($000s)</th>
                  {periods.map(period => (
                    <th key={period} className="text-right py-3 px-4 font-semibold">
                      {period}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Revenue', key: 'revenue' },
                  { label: 'Cost of Goods Sold', key: 'costOfGoodsSold' },
                  { label: 'Gross Profit', key: 'grossProfit' },
                  { label: 'Operating Expenses', key: 'operatingExpenses' },
                  { label: 'EBITDA', key: 'ebitda' },
                  { label: 'Depreciation', key: 'depreciation' },
                  { label: 'EBIT', key: 'ebit' },
                  { label: 'Interest Expense', key: 'interestExpense' },
                  { label: 'EBT', key: 'ebt' },
                  { label: 'Taxes', key: 'taxes' },
                  { label: 'Net Income', key: 'netIncome' }
                ].map(item => (
                  <tr key={item.key} className="border-b border-gray-200">
                    <td className="py-2 px-4 font-medium">{item.label}</td>
                    {modelData[item.key]?.map((value, periodIdx) => (
                      <td key={periodIdx} className="text-right py-2 px-4">
                        {formatCurrency(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Balance Sheet */}
      {activeStatement === 'balance' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 font-semibold">Balance Sheet ($000s)</th>
                  {periods.map(period => (
                    <th key={period} className="text-right py-3 px-4 font-semibold">
                      {period}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-100">
                  <td colSpan={6} className="py-2 px-4 font-semibold">
                    ASSETS
                  </td>
                </tr>
                {[
                  { label: 'Cash', key: 'cash' },
                  { label: 'Accounts Receivable', key: 'accountsReceivable' },
                  { label: 'Inventory', key: 'inventory' },
                  { label: 'Total Current Assets', key: 'totalCurrentAssets' },
                  { label: 'PP&E', key: 'ppe' },
                  { label: 'Total Assets', key: 'totalAssets' }
                ].map(item => (
                  <tr key={item.key} className="border-b border-gray-200">
                    <td className="py-2 px-4">{item.label}</td>
                    {modelData[item.key]?.map((value, periodIdx) => (
                      <td key={periodIdx} className="text-right py-2 px-4">
                        {formatCurrency(value)}
                      </td>
                    ))}
                  </tr>
                ))}

                <tr className="bg-gray-100">
                  <td colSpan={6} className="py-2 px-4 font-semibold">
                    LIABILITIES & EQUITY
                  </td>
                </tr>
                {[
                  { label: 'Accounts Payable', key: 'accountsPayable' },
                  { label: 'Short-term Debt', key: 'shortTermDebt' },
                  { label: 'Total Current Liabilities', key: 'totalCurrentLiabilities' },
                  { label: 'Long-term Debt', key: 'longTermDebt' },
                  { label: 'Total Liabilities', key: 'totalLiabilities' },
                  { label: 'Shareholder Equity', key: 'shareholderEquity' },
                  { label: 'Total Liab. & Equity', key: 'totalLiabilitiesEquity' }
                ].map(item => (
                  <tr key={item.key} className="border-b border-gray-200">
                    <td className="py-2 px-4">{item.label}</td>
                    {modelData[item.key]?.map((value, periodIdx) => (
                      <td key={periodIdx} className="text-right py-2 px-4">
                        {formatCurrency(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Cash Flow */}
      {activeStatement === 'cashflow' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 font-semibold">Cash Flow Statement ($000s)</th>
                  {periods.map(period => (
                    <th key={period} className="text-right py-3 px-4 font-semibold">
                      {period}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Operating Cash Flow', key: 'operatingCashFlow' },
                  { label: 'CapEx', key: 'capex' },
                  { label: 'Investing Cash Flow', key: 'investingCashFlow' },
                  { label: 'Debt Repayment', key: 'debtRepayment' },
                  { label: 'Financing Cash Flow', key: 'financingCashFlow' },
                  { label: 'Net Cash Flow', key: 'netCashFlow' },
                  { label: 'Ending Cash', key: 'endingCash' }
                ].map(item => (
                  <tr key={item.key} className="border-b border-gray-200">
                    <td className="py-2 px-4">{item.label}</td>
                    {modelData[item.key]?.map((value, periodIdx) => (
                      <td key={periodIdx} className="text-right py-2 px-4">
                        {formatCurrency(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Assumptions */}
      {activeStatement === 'assumptions' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Key Assumptions</h3>
              <div className="space-y-3">
                {[
                  { label: 'Revenue Growth Rate (%)', key: 'revenueGrowthRate', isPercent: true },
                  { label: 'COGS % of Revenue', key: 'cogsPercentOfRevenue', isPercent: true },
                  { label: 'OpEx Growth Rate (%)', key: 'opexGrowthRate', isPercent: true },
                  { label: 'Tax Rate (%)', key: 'taxRate', isPercent: true },
                  { label: 'CapEx % of Revenue', key: 'capexPercentOfRevenue', isPercent: true },
                  { label: 'Annual Debt Paydown ($000s)', key: 'debtPaydown', isPercent: false }
                ].map(assumption => (
                  <div key={assumption.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {assumption.label}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={
                        assumption.isPercent
                          ? assumptions[assumption.key] * 100
                          : assumptions[assumption.key]
                      }
                      onChange={e =>
                        handleAssumptionChange(
                          assumption.key,
                          assumption.isPercent ? (e.target.value || 0) / 100 : e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Model Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>5-Year Revenue CAGR:</span>
                  <span className="font-medium">
                    {(
                      (Math.pow(modelData.revenue[4] / modelData.revenue[0], 1 / 4) - 1) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>5-Year EBITDA CAGR:</span>
                  <span className="font-medium">
                    {(
                      (Math.pow(modelData.ebitda[4] / modelData.ebitda[0], 1 / 4) - 1) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Exit EBITDA Margin:</span>
                  <span className="font-medium">
                    {((modelData.ebitda[4] / modelData.revenue[4]) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Exit Debt/EBITDA:</span>
                  <span className="font-medium">
                    {(modelData.longTermDebt[4] / modelData.ebitda[4]).toFixed(1)}x
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FinancialModelWorkspace;
