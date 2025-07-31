import { motion } from 'framer-motion';
import { Calculator, Download, BarChart3, TrendingUp, AlertCircle, ArrowLeft } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

import { calculateEnhancedDCF, calculateSensitivityAnalysis } from '../../utils/dcfCalculations';

import DCFInputs from './DCFInputs';

const EnhancedDCFTool = ({ onBack }) => {
  const [inputs, setInputs] = useState({
    currentRevenue: 100000000, // $100M
    projectionYears: 5,
    terminalGrowthRate: 0.025, // 2.5%
    discountRate: 0.12, // 12%
    yearlyData: {},
    balanceSheet: {}
  });

  const [results, setResults] = useState(null);
  const [sensitivityResults, setSensitivityResults] = useState(null);
  const [activeTab, setActiveTab] = useState('inputs');
  const [loading, setLoading] = useState(false);

  // Calculate DCF when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateDCF();
    }, 500);
    return () => clearTimeout(timer);
  }, [inputs]);

  const calculateDCF = async() => {
    if (!inputs.currentRevenue || inputs.currentRevenue <= 0) {
      setResults(null);
      setSensitivityResults(null);
      return;
    }

    setLoading(true);
    try {
      const dcfResults = calculateEnhancedDCF(inputs);
      setResults(dcfResults);

      // Calculate sensitivity analysis
      const sensitivity = calculateSensitivityAnalysis(inputs);
      setSensitivityResults(sensitivity);
    } catch (error) {
      console.error('DCF calculation error:', error);
      setResults(null);
      setSensitivityResults(null);
    }
    setLoading(false);
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    if (!value && value !== 0) return '0%';
    return `${(value).toFixed(1)}%`;
  };

  const generateChartData = () => {
    if (!results) return [];

    return results.years.map((year, index) => ({
      year: `Year ${year}`,
      freeCashFlow: results.freeCashFlows[index],
      presentValue: results.presentValues[index]
    }));
  };

  const renderProjectionTable = () => {
    if (!results?.projectionTable) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Financial Projections</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                {results.projectionTable.map((row, index) => (
                  <th key={index} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year {row.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Revenue</td>
                {results.projectionTable.map((row, index) => (
                  <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(row.revenue)}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Revenue Growth %</td>
                {results.projectionTable.map((row, index) => (
                  <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatPercent(row.revenueGrowth)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">EBITDA</td>
                {results.projectionTable.map((row, index) => (
                  <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(row.ebitda)}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">EBIT</td>
                {results.projectionTable.map((row, index) => (
                  <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(row.ebit)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">NOPAT</td>
                {results.projectionTable.map((row, index) => (
                  <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(row.nopat)}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">CapEx</td>
                {results.projectionTable.map((row, index) => (
                  <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(row.capex)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Δ Working Capital</td>
                {results.projectionTable.map((row, index) => (
                  <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(row.deltaWorkingCapital)}
                  </td>
                ))}
              </tr>
              <tr className="bg-blue-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900">Free Cash Flow</td>
                {results.projectionTable.map((row, index) => (
                  <td key={index} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900 text-right">
                    {formatCurrency(row.freeCashFlow)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSensitivityTable = () => {
    if (!sensitivityResults) return null;

    const { matrix, waccRange, terminalGrowthRange } = sensitivityResults;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Sensitivity Analysis - Implied Share Price
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Impact of WACC and Terminal Growth Rate changes on valuation
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 bg-gray-50">
                  WACC \ Terminal Growth
                </th>
                {terminalGrowthRange.map(rate => (
                  <th key={rate} className="px-4 py-3 text-center text-xs font-medium text-gray-500 bg-gray-50">
                    {formatPercent(rate)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatPercent(waccRange[rowIndex])}
                  </td>
                  {row.map((cell, cellIndex) => {
                    const isBaseCase = rowIndex === Math.floor(matrix.length / 2) &&
                                      cellIndex === Math.floor(row.length / 2);
                    return (
                      <td
                        key={cellIndex}
                        className={`px-4 py-3 text-sm text-center ${
                          isBaseCase ? 'bg-blue-100 font-bold text-blue-900' : 'text-gray-900'
                        }`}
                      >
                        ${cell.sharePrice.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'inputs', name: 'Model Inputs', icon: Calculator },
    { id: 'results', name: 'Results', icon: TrendingUp },
    { id: 'charts', name: 'Charts', icon: BarChart3 },
    { id: 'sensitivity', name: 'Sensitivity', icon: AlertCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Back to Overview
              </button>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enhanced DCF Analysis Tool
          </h1>
          <p className="text-gray-600">
            Professional discounted cash flow modeling with year-by-year projections and sensitivity analysis
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {activeTab === 'inputs' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <DCFInputs inputs={inputs} setInputs={setInputs} />
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6">
              {loading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  <p className="mt-2 text-gray-600">Calculating...</p>
                </div>
              )}

              {results && !loading && (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-500">Enterprise Value</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        {formatCurrency(results.enterpriseValue)}
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-500">Equity Value</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        {formatCurrency(results.equityValue)}
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-500">Share Price</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        ${results.impliedSharePrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-500">Terminal Value</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        {formatCurrency(results.presentValueTerminal)}
                      </div>
                    </div>
                  </div>

                  {/* Projection Table */}
                  {renderProjectionTable()}

                  {/* Valuation Bridge */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Valuation Bridge</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">PV of Projection Period FCFs</span>
                        <span className="font-semibold">{formatCurrency(results.cumulativePV)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">PV of Terminal Value</span>
                        <span className="font-semibold">{formatCurrency(results.presentValueTerminal)}</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between items-center">
                        <span className="text-gray-900 font-semibold">Enterprise Value</span>
                        <span className="font-bold text-lg">{formatCurrency(results.enterpriseValue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Less: Net Debt</span>
                        <span className="font-semibold">{formatCurrency(results.netDebt)}</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between items-center">
                        <span className="text-gray-900 font-semibold">Equity Value</span>
                        <span className="font-bold text-lg text-blue-600">{formatCurrency(results.equityValue)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'charts' && (
            <div className="space-y-6">
              {results && (
                <>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Cash Flow Projections
                    </h3>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={generateChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis
                            tickFormatter={(value) =>
                              new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                notation: 'compact'
                              }).format(value)
                            }
                          />
                          <Tooltip
                            formatter={(value) => [
                              new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                              }).format(value)
                            ]}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="freeCashFlow"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="Free Cash Flow"
                          />
                          <Line
                            type="monotone"
                            dataKey="presentValue"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="Present Value"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'sensitivity' && (
            <div className="space-y-6">
              {sensitivityResults && renderSensitivityTable()}
            </div>
          )}
        </motion.div>

        {/* Export Button */}
        {results && (
          <div className="mt-8 text-center">
            <button
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              onClick={() => {
                // Export functionality would go here
                console.log('Export results:', results);
              }}
            >
              <Download className="w-5 h-5 mr-2" />
              Export Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDCFTool;
