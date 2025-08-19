import { motion } from 'framer-motion';
import { Calculator, TrendingUp, DollarSign, Percent, Info, BookOpen, Settings } from 'lucide-react';
import React, { useState, useMemo } from 'react';

const WACCCalculator = ({ modelInputs, onModelInputChange, formatPercent }) => {
  const [showDetails, setShowDetails] = useState(true);
  const [activeTab, setActiveTab] = useState('inputs');

  // WACC calculation inputs with defaults
  const waccInputs = modelInputs.dcf.wacc || {
    // Cost of Equity (CAPM)
    riskFreeRate: 4.5,
    marketRiskPremium: 6.0,
    beta: 1.2,
    smallCompanyPremium: 3.0,
    companySpecificRisk: 2.0,

    // Cost of Debt
    debtInterestRate: 6.5,
    taxRate: 25,

    // Capital Structure
    marketValueEquity: 100000,
    marketValueDebt: 30000,

    // Alternative methods
    buildUpMethod: {
      riskFreeRate: 4.5,
      equityRiskPremium: 6.0,
      sizeRiskPremium: 3.0,
      industryRiskPremium: 2.0,
      companySpecificRisk: 2.0
    },

    // Industry benchmarks
    industryWACC: 10.5,
    industryBeta: 1.1,
    industryDebtEquityRatio: 0.3
  };

  // Calculate WACC components
  const waccCalculation = useMemo(() => {
    const inputs = { ...waccInputs, ...modelInputs.dcf.wacc };

    // Cost of Equity - CAPM Method
    const costOfEquityCAPM = inputs.riskFreeRate +
                            (inputs.beta * inputs.marketRiskPremium) +
                            inputs.smallCompanyPremium +
                            inputs.companySpecificRisk;

    // Cost of Equity - Build-up Method
    const costOfEquityBuildUp = inputs.buildUpMethod.riskFreeRate +
                               inputs.buildUpMethod.equityRiskPremium +
                               inputs.buildUpMethod.sizeRiskPremium +
                               inputs.buildUpMethod.industryRiskPremium +
                               inputs.buildUpMethod.companySpecificRisk;

    // Cost of Debt (after-tax)
    const costOfDebtAfterTax = inputs.debtInterestRate * (1 - inputs.taxRate / 100);

    // Capital structure weights
    const totalCapital = inputs.marketValueEquity + inputs.marketValueDebt;
    const equityWeight = inputs.marketValueEquity / totalCapital;
    const debtWeight = inputs.marketValueDebt / totalCapital;

    // WACC calculations
    const waccCAPM = (costOfEquityCAPM / 100 * equityWeight) +
                     (costOfDebtAfterTax / 100 * debtWeight);

    const waccBuildUp = (costOfEquityBuildUp / 100 * equityWeight) +
                        (costOfDebtAfterTax / 100 * debtWeight);

    // Risk-adjusted WACC (average of methods)
    const finalWACC = (waccCAPM + waccBuildUp) / 2;

    return {
      costOfEquityCAPM,
      costOfEquityBuildUp,
      costOfDebtAfterTax,
      equityWeight: equityWeight * 100,
      debtWeight: debtWeight * 100,
      waccCAPM: waccCAPM * 100,
      waccBuildUp: waccBuildUp * 100,
      finalWACC: finalWACC * 100,
      totalCapital,
      debtToEquityRatio: inputs.marketValueDebt / inputs.marketValueEquity
    };
  }, [waccInputs, modelInputs.dcf.wacc]);

  const updateWACCInput = (field, value) => {
    const updatedWACC = {
      ...waccInputs,
      ...modelInputs.dcf.wacc,
      [field]: parseFloat(value) || 0
    };
    onModelInputChange('dcf', 'wacc', updatedWACC);
  };

  const _updateBuildUpInput = (field, value) => {
    const updatedWACC = {
      ...waccInputs,
      ...modelInputs.dcf.wacc,
      buildUpMethod: {
        ...waccInputs.buildUpMethod,
        ...modelInputs.dcf.wacc?.buildUpMethod,
        [field]: parseFloat(value) || 0
      }
    };
    onModelInputChange('dcf', 'wacc', updatedWACC);
  };

  const applyWACCToDCF = (waccValue) => {
    onModelInputChange('dcf', 'discountRate', waccValue);
  };

  const tabs = [
    { id: 'inputs', label: 'Inputs', icon: Settings },
    { id: 'calculation', label: 'Calculation', icon: Calculator },
    { id: 'benchmarks', label: 'Benchmarks', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Calculator size={20} />
            WACC Calculator
          </h3>
          <p className="text-gray-600">
            Professional weighted average cost of capital calculation using CAPM and build-up methods.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => applyWACCToDCF(waccCalculation.finalWACC)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Apply to DCF
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              showDetails ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      {/* Key Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <Percent size={20} className="text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">FINAL WACC</span>
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {formatPercent(waccCalculation.finalWACC)}
          </div>
          <div className="text-sm text-blue-600 mt-1">
            Risk-adjusted average
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={20} className="text-green-600" />
            <span className="text-xs text-green-600 font-medium">COST OF EQUITY</span>
          </div>
          <div className="text-2xl font-bold text-green-800">
            {formatPercent(waccCalculation.costOfEquityCAPM)}
          </div>
          <div className="text-sm text-green-600 mt-1">
            CAPM method
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={20} className="text-purple-600" />
            <span className="text-xs text-purple-600 font-medium">COST OF DEBT</span>
          </div>
          <div className="text-2xl font-bold text-purple-800">
            {formatPercent(waccCalculation.costOfDebtAfterTax)}
          </div>
          <div className="text-sm text-purple-600 mt-1">
            After-tax
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <Info size={20} className="text-orange-600" />
            <span className="text-xs text-orange-600 font-medium">DEBT/EQUITY</span>
          </div>
          <div className="text-2xl font-bold text-orange-800">
            {waccCalculation.debtToEquityRatio.toFixed(2)}x
          </div>
          <div className="text-sm text-orange-600 mt-1">
            Capital structure
          </div>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border p-6">
        {activeTab === 'inputs' && (
          <div className="space-y-6">
            <h4 className="font-semibold text-lg">WACC Input Parameters</h4>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Cost of Equity - CAPM */}
              <div>
                <h5 className="font-medium mb-4 text-blue-800">Cost of Equity (CAPM Method)</h5>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="riskFreeRate" className="block text-sm font-medium text-gray-700 mb-1">
                      Risk-Free Rate (%)
                    </label>
                    <input
                      id="riskFreeRate"
                      type="number"
                      step="0.1"
                      value={modelInputs.dcf.wacc?.riskFreeRate || waccInputs.riskFreeRate}
                      onChange={(e) => updateWACCInput('riskFreeRate', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">10-year Treasury rate</span>
                  </div>

                  <div>
                    <label htmlFor="marketRiskPremium" className="block text-sm font-medium text-gray-700 mb-1">
                      Market Risk Premium (%)
                    </label>
                    <input
                      id="marketRiskPremium"
                      type="number"
                      step="0.1"
                      value={modelInputs.dcf.wacc?.marketRiskPremium || waccInputs.marketRiskPremium}
                      onChange={(e) => updateWACCInput('marketRiskPremium', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">Expected market return - risk-free rate</span>
                  </div>

                  <div>
                    <label htmlFor="beta" className="block text-sm font-medium text-gray-700 mb-1">
                      Beta (β)
                    </label>
                    <input
                      id="beta"
                      type="number"
                      step="0.1"
                      value={modelInputs.dcf.wacc?.beta || waccInputs.beta}
                      onChange={(e) => updateWACCInput('beta', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">Systematic risk relative to market</span>
                  </div>

                  <div>
                    <label htmlFor="smallCompanyPremium" className="block text-sm font-medium text-gray-700 mb-1">
                      Small Company Premium (%)
                    </label>
                    <input
                      id="smallCompanyPremium"
                      type="number"
                      step="0.1"
                      value={modelInputs.dcf.wacc?.smallCompanyPremium || waccInputs.smallCompanyPremium}
                      onChange={(e) => updateWACCInput('smallCompanyPremium', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">Size-related risk premium</span>
                  </div>

                  <div>
                    <label htmlFor="companySpecificRisk" className="block text-sm font-medium text-gray-700 mb-1">
                      Company-Specific Risk (%)
                    </label>
                    <input
                      id="companySpecificRisk"
                      type="number"
                      step="0.1"
                      value={modelInputs.dcf.wacc?.companySpecificRisk || waccInputs.companySpecificRisk}
                      onChange={(e) => updateWACCInput('companySpecificRisk', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">Unsystematic risk premium</span>
                  </div>
                </div>
              </div>

              {/* Capital Structure & Debt */}
              <div>
                <h5 className="font-medium mb-4 text-purple-800">Capital Structure & Cost of Debt</h5>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="marketValueEquity" className="block text-sm font-medium text-gray-700 mb-1">
                      Market Value of Equity ($000s)
                    </label>
                    <input
                      id="marketValueEquity"
                      type="number"
                      value={modelInputs.dcf.wacc?.marketValueEquity || waccInputs.marketValueEquity}
                      onChange={(e) => updateWACCInput('marketValueEquity', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="marketValueDebt" className="block text-sm font-medium text-gray-700 mb-1">
                      Market Value of Debt ($000s)
                    </label>
                    <input
                      id="marketValueDebt"
                      type="number"
                      value={modelInputs.dcf.wacc?.marketValueDebt || waccInputs.marketValueDebt}
                      onChange={(e) => updateWACCInput('marketValueDebt', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="debtInterestRate" className="block text-sm font-medium text-gray-700 mb-1">
                      Pre-Tax Cost of Debt (%)
                    </label>
                    <input
                      id="debtInterestRate"
                      type="number"
                      step="0.1"
                      value={modelInputs.dcf.wacc?.debtInterestRate || waccInputs.debtInterestRate}
                      onChange={(e) => updateWACCInput('debtInterestRate', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">Interest rate on debt</span>
                  </div>

                  <div>
                    <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Rate (%)
                    </label>
                    <input
                      id="taxRate"
                      type="number"
                      step="0.1"
                      value={modelInputs.dcf.wacc?.taxRate || modelInputs.dcf.taxRate}
                      onChange={(e) => updateWACCInput('taxRate', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">Corporate tax rate</span>
                  </div>

                  {/* Capital Structure Summary */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h6 className="font-medium mb-2">Capital Structure</h6>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Equity Weight:</span>
                        <span className="font-medium">{formatPercent(waccCalculation.equityWeight)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Debt Weight:</span>
                        <span className="font-medium">{formatPercent(waccCalculation.debtWeight)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Total Capital:</span>
                        <span className="font-medium">${(waccCalculation.totalCapital / 1000).toFixed(0)}M</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calculation' && (
          <div className="space-y-6">
            <h4 className="font-semibold text-lg">WACC Calculation Breakdown</h4>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* CAPM Method */}
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-medium mb-4 text-blue-800">CAPM Method</h5>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Risk-Free Rate:</span>
                    <span className="font-medium">{formatPercent(modelInputs.dcf.wacc?.riskFreeRate || waccInputs.riskFreeRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beta × Market Risk Premium:</span>
                    <span className="font-medium">
                      {formatPercent((modelInputs.dcf.wacc?.beta || waccInputs.beta) * (modelInputs.dcf.wacc?.marketRiskPremium || waccInputs.marketRiskPremium))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Small Company Premium:</span>
                    <span className="font-medium">{formatPercent(modelInputs.dcf.wacc?.smallCompanyPremium || waccInputs.smallCompanyPremium)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Company-Specific Risk:</span>
                    <span className="font-medium">{formatPercent(modelInputs.dcf.wacc?.companySpecificRisk || waccInputs.companySpecificRisk)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Cost of Equity (CAPM):</span>
                    <span>{formatPercent(waccCalculation.costOfEquityCAPM)}</span>
                  </div>
                </div>
              </div>

              {/* Build-up Method */}
              <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                <h5 className="font-medium mb-4 text-green-800">Build-up Method</h5>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Risk-Free Rate:</span>
                    <span className="font-medium">{formatPercent(waccInputs.buildUpMethod.riskFreeRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Equity Risk Premium:</span>
                    <span className="font-medium">{formatPercent(waccInputs.buildUpMethod.equityRiskPremium)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size Risk Premium:</span>
                    <span className="font-medium">{formatPercent(waccInputs.buildUpMethod.sizeRiskPremium)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Industry Risk Premium:</span>
                    <span className="font-medium">{formatPercent(waccInputs.buildUpMethod.industryRiskPremium)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Company-Specific Risk:</span>
                    <span className="font-medium">{formatPercent(waccInputs.buildUpMethod.companySpecificRisk)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Cost of Equity (Build-up):</span>
                    <span>{formatPercent(waccCalculation.costOfEquityBuildUp)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Final WACC Calculation */}
            <div className="p-6 bg-gray-50 rounded-lg border">
              <h5 className="font-medium mb-4">Final WACC Calculation</h5>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>WACC (CAPM Method):</span>
                      <span className="font-medium">{formatPercent(waccCalculation.waccCAPM)}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      [{formatPercent(waccCalculation.costOfEquityCAPM)} × {formatPercent(waccCalculation.equityWeight)}] +
                      [{formatPercent(waccCalculation.costOfDebtAfterTax)} × {formatPercent(waccCalculation.debtWeight)}]
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>WACC (Build-up Method):</span>
                      <span className="font-medium">{formatPercent(waccCalculation.waccBuildUp)}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      [{formatPercent(waccCalculation.costOfEquityBuildUp)} × {formatPercent(waccCalculation.equityWeight)}] +
                      [{formatPercent(waccCalculation.costOfDebtAfterTax)} × {formatPercent(waccCalculation.debtWeight)}]
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Risk-Adjusted WACC:</span>
                    <span className="text-2xl font-bold text-blue-600">{formatPercent(waccCalculation.finalWACC)}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Average of CAPM and Build-up methods
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'benchmarks' && (
          <div className="space-y-6">
            <h4 className="font-semibold text-lg">Industry Benchmarks & Validation</h4>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h6 className="font-medium text-blue-800 mb-2">Your Company</h6>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>WACC:</span>
                    <span className="font-semibold">{formatPercent(waccCalculation.finalWACC)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beta:</span>
                    <span className="font-semibold">{(modelInputs.dcf.wacc?.beta || waccInputs.beta).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>D/E Ratio:</span>
                    <span className="font-semibold">{waccCalculation.debtToEquityRatio.toFixed(2)}x</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h6 className="font-medium text-green-800 mb-2">Industry Average</h6>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>WACC:</span>
                    <span className="font-semibold">{formatPercent(waccInputs.industryWACC)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beta:</span>
                    <span className="font-semibold">{waccInputs.industryBeta.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>D/E Ratio:</span>
                    <span className="font-semibold">{waccInputs.industryDebtEquityRatio.toFixed(2)}x</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h6 className="font-medium text-yellow-800 mb-2">Variance</h6>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>WACC Diff:</span>
                    <span
                      className={`font-semibold ${
                        waccCalculation.finalWACC > waccInputs.industryWACC ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {waccCalculation.finalWACC > waccInputs.industryWACC ? '+' : ''}
                      {formatPercent(waccCalculation.finalWACC - waccInputs.industryWACC)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beta Diff:</span>
                    <span
                      className={`font-semibold ${
                        (modelInputs.dcf.wacc?.beta || waccInputs.beta) > waccInputs.industryBeta ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {(modelInputs.dcf.wacc?.beta || waccInputs.beta) > waccInputs.industryBeta ? '+' : ''}
                      {((modelInputs.dcf.wacc?.beta || waccInputs.beta) - waccInputs.industryBeta).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Notes */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <BookOpen size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <h6 className="font-medium text-blue-800 mb-2">Validation Guidelines</h6>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• WACC should be within ±2% of industry average for similar companies</li>
                    <li>• Beta should reflect business risk relative to market (typically 0.8-1.5 for most companies)</li>
                    <li>• Cost of equity should exceed risk-free rate by at least 4-6% for private companies</li>
                    <li>• Debt/equity ratio should align with industry norms and company strategy</li>
                    <li>• Consider economic conditions and company-specific factors</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WACCCalculator;
