import { motion } from 'framer-motion';
import { Calculator, TrendingUp, DollarSign, BarChart3, Info, Settings, PieChart } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import DataVisualization from './DataVisualization';
import WACCCalculator from './WACCCalculator';

const AdvancedDCF = ({ data, modelInputs, onModelInputChange, formatCurrency, formatPercent }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(true);
  const [activeTab, setActiveTab] = useState('results');

  // Enhanced DCF calculation with working capital
  const advancedDCFResults = useMemo(() => {
    const { discountRate, terminalGrowthRate, projectionYears, taxRate } = modelInputs.dcf;
    const statements = data.statements;

    // Working capital assumptions (if not provided, use defaults)
    const workingCapitalAssumptions = modelInputs.dcf.workingCapital || {
      receivablesDays: 45,
      inventoryDays: 60,
      payablesDays: 30,
      receivablesGrowth: 2, // % of revenue
      inventoryGrowth: 1.5, // % of revenue
      payablesGrowth: 1.8 // % of revenue
    };

    // Capex assumptions
    const capexAssumptions = modelInputs.dcf.capex || {
      capexAsPercentOfRevenue: 3.5,
      depreciationRate: 7, // years
      maintenanceCapex: 2.0 // % of revenue
    };

    const results = {
      years: [],
      freeCashFlows: [],
      presentValues: [],
      workingCapitalChanges: [],
      capexAmounts: [],
      unleveredFreeCashFlow: [],
      cumulativePV: 0,
      terminalValue: 0,
      presentValueTerminal: 0,
      enterpriseValue: 0,
      equityValue: 0,
      impliedShare: 0
    };

    // Base year revenue for calculations
    const baseRevenue = statements.incomeStatement.totalRevenue?.[0] || 100000;

    for (let year = 1; year <= projectionYears; year++) {
      const yearData = {
        year,
        revenue: statements.incomeStatement.totalRevenue?.[year] || 0,
        operatingIncome: statements.incomeStatement.operatingIncome?.[year] || 0,
        nopat: 0, // Net Operating Profit After Tax
        workingCapitalChange: 0,
        capex: 0,
        depreciation: 0,
        freeCashFlow: 0,
        presentValue: 0
      };

      // NOPAT calculation
      yearData.nopat = yearData.operatingIncome * (1 - taxRate / 100);

      // Working capital calculation
      const currentRevenue = yearData.revenue;
      const previousRevenue = year > 1 ? (statements.incomeStatement.totalRevenue?.[year - 1] || 0) : baseRevenue;

      // Calculate working capital components
      const currentReceivables = (currentRevenue * workingCapitalAssumptions.receivablesDays) / 365;
      const currentInventory = (currentRevenue * workingCapitalAssumptions.inventoryDays) / 365;
      const currentPayables = (currentRevenue * workingCapitalAssumptions.payablesDays) / 365;

      const previousReceivables = (previousRevenue * workingCapitalAssumptions.receivablesDays) / 365;
      const previousInventory = (previousRevenue * workingCapitalAssumptions.inventoryDays) / 365;
      const previousPayables = (previousRevenue * workingCapitalAssumptions.payablesDays) / 365;

      const receivablesChange = currentReceivables - previousReceivables;
      const inventoryChange = currentInventory - previousInventory;
      const payablesChange = currentPayables - previousPayables;

      // Working capital change (increase is negative for cash flow)
      yearData.workingCapitalChange = -(receivablesChange + inventoryChange - payablesChange);

      // Capex calculation
      yearData.capex = -(currentRevenue * capexAssumptions.capexAsPercentOfRevenue / 100);

      // Depreciation (simplified - based on capex and depreciation rate)
      yearData.depreciation = Math.abs(yearData.capex) / capexAssumptions.depreciationRate;

      // Free Cash Flow = NOPAT + Depreciation - Capex - Change in Working Capital
      yearData.freeCashFlow = yearData.nopat + yearData.depreciation + yearData.capex + yearData.workingCapitalChange;

      // Present Value
      const discountFactor = Math.pow(1 + discountRate / 100, year);
      yearData.presentValue = yearData.freeCashFlow / discountFactor;

      results.years.push(yearData);
      results.freeCashFlows.push(yearData.freeCashFlow);
      results.presentValues.push(yearData.presentValue);
      results.workingCapitalChanges.push(yearData.workingCapitalChange);
      results.capexAmounts.push(yearData.capex);
      results.unleveredFreeCashFlow.push(yearData.freeCashFlow);
      results.cumulativePV += yearData.presentValue;
    }

    // Terminal Value calculation
    const finalYearFCF = results.years[results.years.length - 1]?.freeCashFlow || 0;
    const terminalFCF = finalYearFCF * (1 + terminalGrowthRate / 100);
    results.terminalValue = terminalFCF / ((discountRate - terminalGrowthRate) / 100);

    const terminalDiscountFactor = Math.pow(1 + discountRate / 100, projectionYears);
    results.presentValueTerminal = results.terminalValue / terminalDiscountFactor;

    // Enterprise Value
    results.enterpriseValue = results.cumulativePV + results.presentValueTerminal;

    // Simplified equity value (would subtract net debt in reality)
    const netDebt = 0; // Could be calculated from balance sheet
    results.equityValue = results.enterpriseValue - netDebt;

    // Implied share price (assuming shares outstanding)
    const sharesOutstanding = modelInputs.dcf.sharesOutstanding || 1000; // thousands
    results.impliedShare = results.equityValue / sharesOutstanding;

    return results;
  }, [data, modelInputs]);

  const updateDCFAssumption = (category, field, value) => {
    const updatedDCF = {
      ...modelInputs.dcf,
      [category]: {
        ...modelInputs.dcf[category],
        [field]: parseFloat(value) || 0
      }
    };
    onModelInputChange('dcf', category, updatedDCF[category]);
  };

  const updateBasicAssumption = (field, value) => {
    onModelInputChange('dcf', field, parseFloat(value) || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Calculator size={20} />
            Advanced DCF Valuation
          </h3>
          <p className="text-gray-600">
            Professional-grade DCF with working capital analysis, capex modeling, and detailed cash flow projections.
          </p>
        </div>
        <div className="flex gap-2">
          {['results', 'charts', 'wacc', 'assumptions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                activeTab === tab ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {tab === 'results' && <DollarSign size={14} />}
              {tab === 'charts' && <BarChart3 size={14} />}
              {tab === 'wacc' && <Calculator size={14} />}
              {tab === 'assumptions' && <Settings size={14} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'results' && (
        <>
          {/* Key Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <DollarSign size={20} className="text-green-600" />
                <span className="text-xs text-green-600 font-medium">ENTERPRISE VALUE</span>
              </div>
              <div className="text-2xl font-bold text-green-800">
                {formatCurrency(advancedDCFResults.enterpriseValue)}
              </div>
              <div className="text-sm text-green-600 mt-1">
                PV Operations: {formatCurrency(advancedDCFResults.cumulativePV)}
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingUp size={20} className="text-blue-600" />
                <span className="text-xs text-blue-600 font-medium">EQUITY VALUE</span>
              </div>
              <div className="text-2xl font-bold text-blue-800">
                {formatCurrency(advancedDCFResults.equityValue)}
              </div>
              <div className="text-sm text-blue-600 mt-1">
                Per Share: {formatCurrency(advancedDCFResults.impliedShare)}
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <BarChart3 size={20} className="text-purple-600" />
                <span className="text-xs text-purple-600 font-medium">TERMINAL VALUE</span>
              </div>
              <div className="text-2xl font-bold text-purple-800">
                {formatCurrency(advancedDCFResults.terminalValue)}
              </div>
              <div className="text-sm text-purple-600 mt-1">
                PV: {formatCurrency(advancedDCFResults.presentValueTerminal)}
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <Info size={20} className="text-orange-600" />
                <span className="text-xs text-orange-600 font-medium">IMPLIED MULTIPLE</span>
              </div>
              <div className="text-2xl font-bold text-orange-800">
                {(advancedDCFResults.enterpriseValue / (data.statements.incomeStatement.totalRevenue?.[1] || 1)).toFixed(1)}x
              </div>
              <div className="text-sm text-orange-600 mt-1">
                EV/Revenue (Year 1)
              </div>
            </motion.div>
          </div>

          {/* Detailed Cash Flow Analysis */}
          <div className="bg-white rounded-lg border p-6">
            <h4 className="font-semibold text-lg mb-4">Detailed Cash Flow Analysis</h4>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium">Year</th>
                    <th className="text-right p-3 font-medium">Revenue</th>
                    <th className="text-right p-3 font-medium">Operating Income</th>
                    <th className="text-right p-3 font-medium">NOPAT</th>
                    <th className="text-right p-3 font-medium">Depreciation</th>
                    <th className="text-right p-3 font-medium">Capex</th>
                    <th className="text-right p-3 font-medium">ΔWorking Capital</th>
                    <th className="text-right p-3 font-medium">Free Cash Flow</th>
                    <th className="text-right p-3 font-medium">Present Value</th>
                  </tr>
                </thead>
                <tbody>
                  {advancedDCFResults.years.map((yearData, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{yearData.year}</td>
                      <td className="p-3 text-right">{formatCurrency(yearData.revenue)}</td>
                      <td className="p-3 text-right">{formatCurrency(yearData.operatingIncome)}</td>
                      <td className="p-3 text-right">{formatCurrency(yearData.nopat)}</td>
                      <td className="p-3 text-right text-green-600">+{formatCurrency(yearData.depreciation)}</td>
                      <td className="p-3 text-right text-red-600">{formatCurrency(yearData.capex)}</td>
                      <td className={`p-3 text-right ${yearData.workingCapitalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {yearData.workingCapitalChange >= 0 ? '+' : ''}{formatCurrency(yearData.workingCapitalChange)}
                      </td>
                      <td className="p-3 text-right font-medium">{formatCurrency(yearData.freeCashFlow)}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(yearData.presentValue)}</td>
                    </tr>
                  ))}

                  {/* Terminal Value Row */}
                  <tr className="border-b-2 border-gray-300 bg-blue-50">
                    <td className="p-3 font-bold">Terminal</td>
                    <td className="p-3" />
                    <td className="p-3" />
                    <td className="p-3" />
                    <td className="p-3" />
                    <td className="p-3" />
                    <td className="p-3" />
                    <td className="p-3 text-right font-bold">{formatCurrency(advancedDCFResults.terminalValue)}</td>
                    <td className="p-3 text-right font-bold">{formatCurrency(advancedDCFResults.presentValueTerminal)}</td>
                  </tr>

                  {/* Total Row */}
                  <tr className="bg-gray-100 font-bold">
                    <td className="p-3">TOTAL</td>
                    <td className="p-3" />
                    <td className="p-3" />
                    <td className="p-3" />
                    <td className="p-3" />
                    <td className="p-3" />
                    <td className="p-3" />
                    <td className="p-3" />
                    <td className="p-3 text-right text-lg">{formatCurrency(advancedDCFResults.enterpriseValue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <DataVisualization
          dcfData={advancedDCFResults}
          sensitivityData={null}
          scenarioData={null}
          formatCurrency={formatCurrency}
          formatPercent={formatPercent}
        />
      )}

      {/* WACC Calculator Tab */}
      {activeTab === 'wacc' && (
        <WACCCalculator
          modelInputs={modelInputs}
          onModelInputChange={onModelInputChange}
          formatPercent={formatPercent}
        />
      )}

      {/* Assumptions Tab */}
      {activeTab === 'assumptions' && (
        <div className="bg-white rounded-lg border p-6">
          <h4 className="font-semibold text-lg mb-4">Model Assumptions</h4>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic DCF Assumptions */}
            <div>
              <h5 className="font-medium mb-3 text-gray-800">Core Assumptions</h5>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Rate (WACC) %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={modelInputs.dcf.discountRate}
                    onChange={(e) => updateBasicAssumption('discountRate', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terminal Growth Rate %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={modelInputs.dcf.terminalGrowthRate}
                    onChange={(e) => updateBasicAssumption('terminalGrowthRate', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Rate %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={modelInputs.dcf.taxRate}
                    onChange={(e) => updateBasicAssumption('taxRate', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Working Capital Assumptions */}
            <div>
              <h5 className="font-medium mb-3 text-gray-800">Working Capital</h5>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Receivables (Days)
                  </label>
                  <input
                    type="number"
                    value={modelInputs.dcf.workingCapital?.receivablesDays || 45}
                    onChange={(e) => updateDCFAssumption('workingCapital', 'receivablesDays', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inventory (Days)
                  </label>
                  <input
                    type="number"
                    value={modelInputs.dcf.workingCapital?.inventoryDays || 60}
                    onChange={(e) => updateDCFAssumption('workingCapital', 'inventoryDays', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payables (Days)
                  </label>
                  <input
                    type="number"
                    value={modelInputs.dcf.workingCapital?.payablesDays || 30}
                    onChange={(e) => updateDCFAssumption('workingCapital', 'payablesDays', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Capex Assumptions */}
            <div>
              <h5 className="font-medium mb-3 text-gray-800">Capital Expenditure</h5>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capex (% of Revenue)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={modelInputs.dcf.capex?.capexAsPercentOfRevenue || 3.5}
                    onChange={(e) => updateDCFAssumption('capex', 'capexAsPercentOfRevenue', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Depreciation Period (Years)
                  </label>
                  <input
                    type="number"
                    value={modelInputs.dcf.capex?.depreciationRate || 7}
                    onChange={(e) => updateDCFAssumption('capex', 'depreciationRate', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shares Outstanding (000s)
                  </label>
                  <input
                    type="number"
                    value={modelInputs.dcf.sharesOutstanding || 1000}
                    onChange={(e) => updateBasicAssumption('sharesOutstanding', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedDCF;
