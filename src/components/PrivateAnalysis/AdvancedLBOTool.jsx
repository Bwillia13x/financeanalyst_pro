import { motion } from 'framer-motion';
import { Building2, Calculator, DollarSign, BarChart3 } from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { lboModelingEngine } from '../../services/lboModelingEngine.js';

const AdvancedLBOTool = ({ data: _data, onDataChange }) => {
  const [activeTab, setActiveTab] = useState('inputs');
  const [lboResults, setLBOResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const [lboInputs, setLBOInputs] = useState({
    symbol: 'COMPANY',
    companyName: 'Target Company',
    purchasePrice: 500000000,
    ebitda: 75000000,
    revenue: 500000000,
    equityContribution: 0.35,
    debtPercentage: 0.6,
    equityPercentage: 0.4,
    seniorDebtMultiple: 4.0,
    subordinatedDebtMultiple: 1.5,
    seniorInterestRate: 0.055,
    subordinatedInterestRate: 0.095,
    ebitdaGrowthRate: 0.06,
    capexAsPercentOfRevenue: 0.03,
    nwcAsPercentOfRevenue: 0.02,
    holdingPeriod: 5,
    exitMultiple: 10.0,
    transactionFees: 0.02,
    managementFees: 0.02,
    taxRate: 0.21
  });

  const formatCurrency = useCallback(value => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  const formatPercent = useCallback(value => {
    return `${(value * 100).toFixed(1)}%`;
  }, []);

  const calculateLBO = useCallback(async () => {
    try {
      setIsCalculating(true);
      const modelInputs = {
        symbol: lboInputs.symbol,
        companyName: lboInputs.companyName,
        purchasePrice: lboInputs.purchasePrice,
        ebitda: lboInputs.ebitda,
        revenue: lboInputs.revenue,
        assumptions: {
          debt: {
            seniorDebtMultiple: lboInputs.seniorDebtMultiple,
            subordinatedDebtMultiple: lboInputs.subordinatedDebtMultiple,
            seniorInterestRate: lboInputs.seniorInterestRate,
            subordinatedInterestRate: lboInputs.subordinatedInterestRate
          },
          operating: {
            ebitdaGrowthRate: lboInputs.ebitdaGrowthRate,
            capexAsPercentOfRevenue: lboInputs.capexAsPercentOfRevenue,
            nwcAsPercentOfRevenue: lboInputs.nwcAsPercentOfRevenue,
            taxRate: lboInputs.taxRate
          },
          exit: {
            exitMultiple: lboInputs.exitMultiple
          },
          transaction: {
            holdingPeriod: lboInputs.holdingPeriod,
            transactionFees: lboInputs.transactionFees
          }
        }
      };

      const results = lboModelingEngine.buildLBOModel(modelInputs);
      setLBOResults(results);

      if (onDataChange) {
        onDataChange({
          lboModel: { inputs: lboInputs, results, timestamp: new Date().toISOString() }
        });
      }
    } catch (error) {
      console.error('LBO calculation error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsCalculating(false);
    }
  }, [lboInputs, onDataChange]);

  const handleInputChange = useCallback((field, value) => {
    setLBOInputs(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
    }));
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6" data-testid="advanced-lbo-tool">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Building2 className="text-blue-600" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Advanced LBO Modeling</h2>
            <p className="text-gray-600">Professional leveraged buyout analysis</p>
          </div>
        </div>

        <motion.button
          onClick={calculateLBO}
          disabled={isCalculating}
          className={`px-6 py-2 rounded-lg font-medium flex items-center space-x-2 ${
            isCalculating ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          data-action="calculate-lbo"
        >
          <Calculator size={18} />
          <span>{isCalculating ? 'Calculating...' : 'Calculate LBO'}</span>
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'inputs', label: 'Model Inputs', icon: DollarSign },
            { id: 'results', label: 'Results & Analysis', icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Inputs Tab */}
      {activeTab === 'inputs' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Transaction */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Transaction</h3>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="purchase-price"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Purchase Price
                  </label>
                  <input
                    id="purchase-price"
                    type="number"
                    value={lboInputs.purchasePrice}
                    onChange={e => handleInputChange('purchasePrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    data-parameter="purchase-price"
                  />
                  <p className="text-xs text-gray-500">{formatCurrency(lboInputs.purchasePrice)}</p>
                </div>
                <div>
                  <label
                    htmlFor="current-ebitda"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Current EBITDA
                  </label>
                  <input
                    id="current-ebitda"
                    type="number"
                    value={lboInputs.ebitda}
                    onChange={e => handleInputChange('ebitda', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    data-parameter="ebitda"
                  />
                </div>
                <div>
                  <label
                    htmlFor="holding-period"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Holding Period
                  </label>
                  <input
                    id="holding-period"
                    type="number"
                    value={lboInputs.holdingPeriod}
                    onChange={e => handleInputChange('holdingPeriod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    data-parameter="hold-period"
                  />
                </div>
              </div>
            </div>

            {/* Financing */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Financing</h3>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="debt-percentage"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Debt Percentage
                  </label>
                  <input
                    id="debt-percentage"
                    type="number"
                    step="0.01"
                    value={lboInputs.debtPercentage}
                    onChange={e => handleInputChange('debtPercentage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    data-parameter="debt-percentage"
                  />
                </div>
                <div>
                  <label
                    htmlFor="equity-percentage"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Equity Percentage
                  </label>
                  <input
                    id="equity-percentage"
                    type="number"
                    step="0.01"
                    value={lboInputs.equityPercentage}
                    onChange={e => handleInputChange('equityPercentage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    data-parameter="equity-percentage"
                  />
                </div>
                <div>
                  <label
                    htmlFor="senior-debt"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Senior Debt Multiple
                  </label>
                  <input
                    id="senior-debt"
                    type="number"
                    step="0.1"
                    value={lboInputs.seniorDebtMultiple}
                    onChange={e => handleInputChange('seniorDebtMultiple', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    data-parameter="senior-debt-multiple"
                  />
                </div>
                <div>
                  <label
                    htmlFor="sub-debt"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Sub Debt Multiple
                  </label>
                  <input
                    id="sub-debt"
                    type="number"
                    step="0.1"
                    value={lboInputs.subordinatedDebtMultiple}
                    onChange={e => handleInputChange('subordinatedDebtMultiple', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lbo-senior-rate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Senior Rate (%)
                  </label>
                  <input
                    id="lbo-senior-rate"
                    type="number"
                    step="0.001"
                    value={lboInputs.seniorInterestRate * 100}
                    onChange={e =>
                      handleInputChange('seniorInterestRate', (e.target.value || 0) / 100)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Operating */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Operating</h3>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="lbo-ebitda-growth"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    EBITDA Growth (%)
                  </label>
                  <input
                    id="lbo-ebitda-growth"
                    type="number"
                    step="0.01"
                    value={lboInputs.ebitdaGrowthRate * 100}
                    onChange={e =>
                      handleInputChange('ebitdaGrowthRate', (e.target.value || 0) / 100)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    data-parameter="ebitda-growth"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lbo-exit-multiple"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Exit Multiple
                  </label>
                  <input
                    id="lbo-exit-multiple"
                    type="number"
                    step="0.1"
                    value={lboInputs.exitMultiple}
                    onChange={e => handleInputChange('exitMultiple', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    data-parameter="exit-multiple"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lbo-tax-rate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tax Rate (%)
                  </label>
                  <input
                    id="lbo-tax-rate"
                    type="number"
                    step="0.01"
                    value={lboInputs.taxRate * 100}
                    onChange={e => handleInputChange('taxRate', (e.target.value || 0) / 100)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {lboResults ? (
            <div className="space-y-6" data-testid="lbo-results">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600" data-metric="equity-irr">
                    {formatPercent(lboResults.baseCase?.returnsAnalysis?.irr || 0)}
                  </div>
                  <div className="text-sm text-gray-600">IRR</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600" data-metric="equity-moic">
                    {(lboResults.baseCase?.returnsAnalysis?.moic || 0).toFixed(1)}x
                  </div>
                  <div className="text-sm text-gray-600">MOIC</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {(lboResults.transactionStructure?.debtToEbitda || 0).toFixed(1)}x
                  </div>
                  <div className="text-sm text-gray-600">Leverage</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(lboResults.baseCase?.exitAnalysis?.equityProceeds || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Exit Value</div>
                </div>
              </div>

              {/* Transaction Structure */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Transaction Structure</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between py-2">
                      <span>Purchase Price:</span>
                      <span className="font-medium">
                        {formatCurrency(lboResults.transactionStructure?.purchasePrice)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Total Debt:</span>
                      <span className="font-medium">
                        {formatCurrency(lboResults.transactionStructure?.totalDebt)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Equity Investment:</span>
                      <span className="font-medium">
                        {formatCurrency(lboResults.transactionStructure?.equityContribution)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between py-2">
                      <span>Entry Multiple:</span>
                      <span className="font-medium">
                        {(lboResults.transactionStructure?.entryMultiple || 0).toFixed(1)}x
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Debt/EBITDA:</span>
                      <span className="font-medium">
                        {(lboResults.transactionStructure?.debtToEbitda || 0).toFixed(1)}x
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Equity %:</span>
                      <span className="font-medium">
                        {formatPercent(lboResults.transactionStructure?.equityPercentage || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scenarios */}
              {lboResults.scenarios && Object.keys(lboResults.scenarios).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Scenario Analysis</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2">Scenario</th>
                          <th className="text-right py-2">IRR</th>
                          <th className="text-right py-2">MOIC</th>
                          <th className="text-right py-2">Exit Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 font-medium">Base Case</td>
                          <td className="text-right py-2">
                            {formatPercent(lboResults.baseCase?.returnsAnalysis?.irr || 0)}
                          </td>
                          <td className="text-right py-2">
                            {(lboResults.baseCase?.returnsAnalysis?.moic || 0).toFixed(1)}x
                          </td>
                          <td className="text-right py-2">
                            {formatCurrency(lboResults.baseCase?.exitAnalysis?.equityProceeds || 0)}
                          </td>
                        </tr>
                        {Object.entries(lboResults.scenarios).map(([name, scenario]) => (
                          <tr key={name} className="border-b border-gray-200">
                            <td className="py-2">{name}</td>
                            <td className="text-right py-2">
                              {formatPercent(scenario.returnsAnalysis?.irr || 0)}
                            </td>
                            <td className="text-right py-2">
                              {(scenario.returnsAnalysis?.moic || 0).toFixed(1)}x
                            </td>
                            <td className="text-right py-2">
                              {formatCurrency(scenario.exitAnalysis?.equityProceeds || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p>Run LBO calculation to see results</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AdvancedLBOTool;
