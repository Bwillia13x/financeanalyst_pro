import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, DollarSign, BarChart3, FileText, Download } from 'lucide-react';

const ValuationTool = () => {
  const [activeTab, setActiveTab] = useState('dcf');
  const [dcfInputs, setDcfInputs] = useState({
    currentRevenue: 1000000,
    revenueGrowthRate: 0.15,
    ebitdaMargin: 0.25,
    taxRate: 0.25,
    capexPercent: 0.05,
    workingCapitalPercent: 0.15,
    terminalGrowthRate: 0.03,
    discountRate: 0.12,
    projectionYears: 5
  });

  const [lboInputs, setLboInputs] = useState({
    purchasePrice: 5000000,
    equityContribution: 0.4,
    debtAmount: 3000000,
    interestRate: 0.08,
    exitMultiple: 8,
    exitYear: 5,
    ebitdaGrowth: 0.12,
    ebitdaMargin: 0.25,
    transactionFees: 0.02,
    managementFees: 0.01
  });

  const [results, setResults] = useState(null);

  const calculateDCF = () => {
    const {
      currentRevenue,
      revenueGrowthRate,
      ebitdaMargin,
      taxRate,
      capexPercent,
      workingCapitalPercent,
      terminalGrowthRate,
      discountRate,
      projectionYears
    } = dcfInputs;

    let freeCashFlows = [];
    let revenue = currentRevenue;
    let cumulativeDiscount = 1;

    // Calculate projected free cash flows
    for (let year = 1; year <= projectionYears; year++) {
      revenue *= (1 + revenueGrowthRate);
      const ebitda = revenue * ebitdaMargin;
      const ebit = ebitda * 0.8; // Assuming 20% of EBITDA is depreciation
      const taxes = ebit * taxRate;
      const netIncome = ebit - taxes;
      const depreciation = ebitda * 0.2;
      const capex = revenue * capexPercent;
      const workingCapitalChange = revenue * workingCapitalPercent * revenueGrowthRate;
      
      const fcf = netIncome + depreciation - capex - workingCapitalChange;
      freeCashFlows.push(fcf);
      
      cumulativeDiscount *= (1 + discountRate);
    }

    // Terminal value calculation
    const terminalFCF = freeCashFlows[freeCashFlows.length - 1] * (1 + terminalGrowthRate);
    const terminalValue = terminalFCF / (discountRate - terminalGrowthRate);

    // Present value calculations
    let presentValueFCF = 0;
    for (let i = 0; i < freeCashFlows.length; i++) {
      presentValueFCF += freeCashFlows[i] / Math.pow(1 + discountRate, i + 1);
    }

    const presentValueTerminal = terminalValue / Math.pow(1 + discountRate, projectionYears);
    const enterpriseValue = presentValueFCF + presentValueTerminal;

    return {
      enterpriseValue,
      presentValueFCF,
      presentValueTerminal,
      terminalValue,
      freeCashFlows,
      assumptions: dcfInputs
    };
  };

  const calculateLBO = () => {
    const {
      purchasePrice,
      equityContribution,
      debtAmount,
      interestRate,
      exitMultiple,
      exitYear,
      ebitdaGrowth,
      ebitdaMargin,
      transactionFees,
      managementFees
    } = lboInputs;

    const equityInvestment = purchasePrice * equityContribution;
    const initialDebt = debtAmount;
    
    // Calculate initial EBITDA (assuming purchase price is 8x EBITDA)
    const initialEBITDA = purchasePrice / 8;
    
    // Calculate exit EBITDA with growth
    let exitEBITDA = initialEBITDA;
    for (let year = 1; year <= exitYear; year++) {
      exitEBITDA *= (1 + ebitdaGrowth);
    }
    
    // Exit value
    const exitValue = exitEBITDA * exitMultiple;
    
    // Debt paydown (simplified - assume no principal paydown)
    const totalInterest = initialDebt * interestRate * exitYear;
    const remainingDebt = initialDebt; // Assume no principal paydown
    
    // Fees
    const transactionFeesAmount = purchasePrice * transactionFees;
    const managementFeesAmount = purchasePrice * managementFees * exitYear;
    
    // Returns
    const netExitValue = exitValue - remainingDebt - totalInterest - transactionFeesAmount - managementFeesAmount;
    const irr = Math.pow(netExitValue / equityInvestment, 1 / exitYear) - 1;
    const moic = netExitValue / equityInvestment;
    
    return {
      equityInvestment,
      netExitValue,
      irr: irr * 100,
      moic,
      exitValue,
      remainingDebt: remainingDebt + totalInterest,
      exitEBITDA,
      assumptions: lboInputs
    };
  };

  const handleCalculate = () => {
    if (activeTab === 'dcf') {
      setResults({ type: 'dcf', ...calculateDCF() });
    } else {
      setResults({ type: 'lbo', ...calculateLBO() });
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const exportResults = () => {
    if (!results) return;
    
    const data = {
      timestamp: new Date().toISOString(),
      valuationType: results.type,
      results: results,
      inputs: results.type === 'dcf' ? dcfInputs : lboInputs
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `valuation-${results.type}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Private Company Valuation Tool
          </h1>
          <p className="text-xl text-gray-600">
            Professional LBO and DCF analysis for privately held companies
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex space-x-2 mb-6">
                <button
                  onClick={() => setActiveTab('dcf')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    activeTab === 'dcf'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Calculator className="w-4 h-4 inline mr-2" />
                  DCF
                </button>
                <button
                  onClick={() => setActiveTab('lbo')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    activeTab === 'lbo'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 inline mr-2" />
                  LBO
                </button>
              </div>

              {activeTab === 'dcf' ? (
                <DCFInputs inputs={dcfInputs} setInputs={setDcfInputs} />
              ) : (
                <LBOInputs inputs={lboInputs} setInputs={setLboInputs} />
              )}

              <button
                onClick={handleCalculate}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors mt-6"
              >
                Calculate Valuation
              </button>
            </motion.div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Valuation Results</h2>
                {results && (
                  <button
                    onClick={exportResults}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                )}
              </div>

              {results ? (
                <ResultsDisplay results={results} formatCurrency={formatCurrency} formatPercent={formatPercent} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Enter your inputs and click "Calculate Valuation" to see results</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DCFInputs = ({ inputs, setInputs }) => {
  const handleChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">DCF Assumptions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Revenue
          </label>
          <input
            type="number"
            value={inputs.currentRevenue}
            onChange={(e) => handleChange('currentRevenue', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Revenue Growth Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={inputs.revenueGrowthRate * 100}
            onChange={(e) => handleChange('revenueGrowthRate', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            EBITDA Margin (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={inputs.ebitdaMargin * 100}
            onChange={(e) => handleChange('ebitdaMargin', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tax Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={inputs.taxRate * 100}
            onChange={(e) => handleChange('taxRate', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CapEx (% of Revenue)
          </label>
          <input
            type="number"
            step="0.01"
            value={inputs.capexPercent * 100}
            onChange={(e) => handleChange('capexPercent', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Working Capital (% of Revenue)
          </label>
          <input
            type="number"
            step="0.01"
            value={inputs.workingCapitalPercent * 100}
            onChange={(e) => handleChange('workingCapitalPercent', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Terminal Growth Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={inputs.terminalGrowthRate * 100}
            onChange={(e) => handleChange('terminalGrowthRate', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={inputs.discountRate * 100}
            onChange={(e) => handleChange('discountRate', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Projection Years
          </label>
          <input
            type="number"
            value={inputs.projectionYears}
            onChange={(e) => handleChange('projectionYears', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

const LBOInputs = ({ inputs, setInputs }) => {
  const handleChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">LBO Assumptions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Purchase Price
          </label>
          <input
            type="number"
            value={inputs.purchasePrice}
            onChange={(e) => handleChange('purchasePrice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Equity Contribution (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={inputs.equityContribution * 100}
            onChange={(e) => handleChange('equityContribution', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Debt Amount
          </label>
          <input
            type="number"
            value={inputs.debtAmount}
            onChange={(e) => handleChange('debtAmount', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Interest Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={inputs.interestRate * 100}
            onChange={(e) => handleChange('interestRate', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exit Multiple
          </label>
          <input
            type="number"
            step="0.1"
            value={inputs.exitMultiple}
            onChange={(e) => handleChange('exitMultiple', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exit Year
          </label>
          <input
            type="number"
            value={inputs.exitYear}
            onChange={(e) => handleChange('exitYear', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            EBITDA Growth Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={inputs.ebitdaGrowth * 100}
            onChange={(e) => handleChange('ebitdaGrowth', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            EBITDA Margin (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={inputs.ebitdaMargin * 100}
            onChange={(e) => handleChange('ebitdaMargin', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transaction Fees (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={inputs.transactionFees * 100}
            onChange={(e) => handleChange('transactionFees', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Management Fees (% per year)
          </label>
          <input
            type="number"
            step="0.01"
            value={inputs.managementFees * 100}
            onChange={(e) => handleChange('managementFees', e.target.value / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

const ResultsDisplay = ({ results, formatCurrency, formatPercent }) => {
  if (results.type === 'dcf') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-600">Enterprise Value</h4>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(results.enterpriseValue)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-600">Present Value FCF</h4>
            <p className="text-xl font-bold text-green-900">{formatCurrency(results.presentValueFCF)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-purple-600">Terminal Value</h4>
            <p className="text-xl font-bold text-purple-900">{formatCurrency(results.presentValueTerminal)}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Free Cash Flow Projections</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {results.freeCashFlows.map((fcf, index) => (
              <div key={index} className="text-center">
                <p className="text-sm text-gray-600">Year {index + 1}</p>
                <p className="font-semibold text-gray-900">{formatCurrency(fcf)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Key Assumptions</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Revenue Growth</p>
              <p className="font-semibold">{formatPercent(results.assumptions.revenueGrowthRate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">EBITDA Margin</p>
              <p className="font-semibold">{formatPercent(results.assumptions.ebitdaMargin)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Discount Rate</p>
              <p className="font-semibold">{formatPercent(results.assumptions.discountRate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Terminal Growth</p>
              <p className="font-semibold">{formatPercent(results.assumptions.terminalGrowthRate)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-600">IRR</h4>
            <p className="text-2xl font-bold text-blue-900">{results.irr.toFixed(1)}%</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-600">MOIC</h4>
            <p className="text-2xl font-bold text-green-900">{results.moic.toFixed(2)}x</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-purple-600">Net Exit Value</h4>
            <p className="text-xl font-bold text-purple-900">{formatCurrency(results.netExitValue)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Investment Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Equity Investment:</span>
                <span className="font-semibold">{formatCurrency(results.equityInvestment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Exit Value:</span>
                <span className="font-semibold">{formatCurrency(results.exitValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining Debt:</span>
                <span className="font-semibold">{formatCurrency(results.remainingDebt)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Key Assumptions</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Exit Multiple:</span>
                <span className="font-semibold">{results.assumptions.exitMultiple}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">EBITDA Growth:</span>
                <span className="font-semibold">{formatPercent(results.assumptions.ebitdaGrowth)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interest Rate:</span>
                <span className="font-semibold">{formatPercent(results.assumptions.interestRate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default ValuationTool;