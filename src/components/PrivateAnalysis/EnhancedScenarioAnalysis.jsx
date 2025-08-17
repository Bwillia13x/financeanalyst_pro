import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, Target, Plus, Trash2,
  Play, Download, Settings, RefreshCw, AlertTriangle, CheckCircle
} from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';

const EnhancedScenarioAnalysis = ({ data, onDataChange, calculateDCF, lboModelingEngine }) => {
  const [activeView, setActiveView] = useState('scenarios');
  const [scenarios, setScenarios] = useState([
    {
      id: 1,
      name: 'Base Case',
      probability: 40,
      revenueGrowth: 5.0,
      marginExpansion: 0.5,
      exitMultiple: 10.0,
      capexIntensity: 3.0,
      isBase: true
    },
    {
      id: 2,
      name: 'Bull Case',
      probability: 30,
      revenueGrowth: 8.0,
      marginExpansion: 1.5,
      exitMultiple: 12.0,
      capexIntensity: 2.5,
      isBase: false
    },
    {
      id: 3,
      name: 'Bear Case',
      probability: 30,
      revenueGrowth: 2.0,
      marginExpansion: -0.5,
      exitMultiple: 8.0,
      capexIntensity: 4.0,
      isBase: false
    }
  ]);

  const [analysisSettings, setAnalysisSettings] = useState({
    modelType: 'dcf', // 'dcf', 'lbo', '3statement'
    outputMetric: 'enterpriseValue',
    includeCorrelations: false,
    numSimulations: 1000
  });

  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const formatCurrency = useCallback((value) => {
    if (!value && value !== 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  const formatPercent = useCallback((value) => {
    return `${(value || 0).toFixed(1)}%`;
  }, []);

  const runScenarioAnalysis = useCallback(async() => {
    setIsCalculating(true);

    try {
      const scenarioResults = [];

      for (const scenario of scenarios) {
        let result = null;

        if (analysisSettings.modelType === 'dcf') {
          // Run DCF analysis for each scenario
          const scenarioData = {
            ...data,
            statements: {
              ...data.statements,
              incomeStatement: {
                ...data.statements.incomeStatement,
                // Apply scenario assumptions to modify data
                totalRevenue: data.statements.incomeStatement.totalRevenue?.map((rev, idx) => {
                  if (idx === 0) return rev; // Base year unchanged
                  return rev * Math.pow(1 + scenario.revenueGrowth / 100, idx);
                })
              }
            }
          };

          result = calculateDCF ? calculateDCF(scenarioData) : null;
        } else if (analysisSettings.modelType === 'lbo' && lboModelingEngine) {
          // Run LBO analysis for each scenario
          const lboInputs = {
            symbol: data.symbol || 'COMPANY',
            companyName: data.companyName || 'Target Company',
            purchasePrice: 500000000,
            ebitda: 75000000,
            revenue: 500000000,
            assumptions: {
              operating: {
                ebitdaGrowthRate: scenario.revenueGrowth / 100,
                capexAsPercentOfRevenue: scenario.capexIntensity / 100
              },
              exit: {
                exitMultiple: scenario.exitMultiple
              }
            }
          };

          result = lboModelingEngine.buildLBOModel(lboInputs);
        }

        scenarioResults.push({
          ...scenario,
          result,
          enterpriseValue: result?.enterpriseValue || result?.baseCase?.exitAnalysis?.enterpriseValue || 0,
          equityValue: result?.equityValue || result?.baseCase?.exitAnalysis?.equityProceeds || 0,
          irr: result?.irr || result?.baseCase?.returnsAnalysis?.irr || 0,
          moic: result?.moic || result?.baseCase?.returnsAnalysis?.moic || 0
        });
      }

      // Calculate probability-weighted metrics
      const weightedValue = scenarioResults.reduce((sum, s) =>
        sum + (s.enterpriseValue * s.probability / 100), 0
      );

      const valueRange = {
        min: Math.min(...scenarioResults.map(s => s.enterpriseValue)),
        max: Math.max(...scenarioResults.map(s => s.enterpriseValue)),
        range: Math.max(...scenarioResults.map(s => s.enterpriseValue)) -
               Math.min(...scenarioResults.map(s => s.enterpriseValue))
      };

      // Risk metrics
      const standardDeviation = Math.sqrt(
        scenarioResults.reduce((sum, s) => {
          const deviation = s.enterpriseValue - weightedValue;
          return sum + (deviation * deviation * s.probability / 100);
        }, 0)
      );

      const coefficientOfVariation = standardDeviation / weightedValue;

      setResults({
        scenarios: scenarioResults,
        summary: {
          weightedValue,
          valueRange,
          standardDeviation,
          coefficientOfVariation,
          probabilityOfPositiveReturn: scenarioResults
            .filter(s => s.enterpriseValue > (data.currentMarketCap || 1000000000))
            .reduce((sum, s) => sum + s.probability, 0)
        },
        chartData: scenarioResults.map(s => ({
          name: s.name,
          value: s.enterpriseValue,
          probability: s.probability,
          irr: s.irr * 100,
          moic: s.moic
        }))
      });

    } catch (error) {
      console.error('Scenario analysis error:', error);
      alert(`Error running scenario analysis: ${error.message}`);
    } finally {
      setIsCalculating(false);
    }
  }, [scenarios, analysisSettings, data, calculateDCF, lboModelingEngine]);

  const addScenario = useCallback(() => {
    const newScenario = {
      id: Date.now(),
      name: `Scenario ${scenarios.length + 1}`,
      probability: Math.max(0, 100 - scenarios.reduce((sum, s) => sum + s.probability, 0)),
      revenueGrowth: 5.0,
      marginExpansion: 0.0,
      exitMultiple: 10.0,
      capexIntensity: 3.0,
      isBase: false
    };
    setScenarios(prev => [...prev, newScenario]);
  }, [scenarios]);

  const updateScenario = useCallback((id, field, value) => {
    setScenarios(prev => prev.map(scenario =>
      scenario.id === id ? { ...scenario, [field]: parseFloat(value) || value } : scenario
    ));
  }, []);

  const deleteScenario = useCallback((id) => {
    setScenarios(prev => prev.filter(scenario => scenario.id !== id && !scenario.isBase));
  }, []);

  const totalProbability = useMemo(() =>
    scenarios.reduce((sum, s) => sum + s.probability, 0), [scenarios]
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="text-purple-600" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Enhanced Scenario Analysis</h2>
            <p className="text-gray-600">Cross-model scenario planning & risk assessment</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <motion.button
            onClick={runScenarioAnalysis}
            disabled={isCalculating || totalProbability !== 100}
            className={`px-6 py-2 rounded-lg font-medium flex items-center space-x-2 ${
              isCalculating || totalProbability !== 100
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
            whileHover={!isCalculating && totalProbability === 100 ? { scale: 1.02 } : {}}
          >
            <Play size={18} />
            <span>{isCalculating ? 'Running...' : 'Run Analysis'}</span>
          </motion.button>
        </div>
      </div>

      {/* Model Selection & Settings */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model Type</label>
            <select
              value={analysisSettings.modelType}
              onChange={(e) => setAnalysisSettings(prev => ({ ...prev, modelType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="dcf">DCF Valuation</option>
              <option value="lbo">LBO Analysis</option>
              <option value="3statement">3-Statement Model</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Output Metric</label>
            <select
              value={analysisSettings.outputMetric}
              onChange={(e) => setAnalysisSettings(prev => ({ ...prev, outputMetric: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="enterpriseValue">Enterprise Value</option>
              <option value="equityValue">Equity Value</option>
              <option value="irr">IRR</option>
              <option value="moic">MOIC</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Simulations</label>
            <input
              type="number"
              value={analysisSettings.numSimulations}
              onChange={(e) => setAnalysisSettings(prev => ({ ...prev, numSimulations: parseInt(e.target.value) || 1000 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={analysisSettings.includeCorrelations}
                onChange={(e) => setAnalysisSettings(prev => ({ ...prev, includeCorrelations: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Include Correlations</span>
            </label>
          </div>
        </div>
      </div>

      {/* Probability Warning */}
      {totalProbability !== 100 && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center">
          <AlertTriangle className="text-amber-500 mr-2" size={20} />
          <span className="text-amber-800">
            Total probability is {totalProbability}%. Adjust scenarios to sum to 100%.
          </span>
        </div>
      )}

      {/* Scenarios Table */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Scenarios</h3>
          <motion.button
            onClick={addScenario}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2"
            whileHover={{ scale: 1.02 }}
          >
            <Plus size={16} />
            <span>Add Scenario</span>
          </motion.button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 px-4">Scenario</th>
                <th className="text-right py-3 px-4">Probability (%)</th>
                <th className="text-right py-3 px-4">Revenue Growth (%)</th>
                <th className="text-right py-3 px-4">Margin Expansion (bps)</th>
                <th className="text-right py-3 px-4">Exit Multiple</th>
                <th className="text-right py-3 px-4">CapEx Intensity (%)</th>
                <th className="text-center py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((scenario) => (
                <tr key={scenario.id} className={`border-b border-gray-200 ${scenario.isBase ? 'bg-blue-50' : ''}`}>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={scenario.name}
                      onChange={(e) => updateScenario(scenario.id, 'name', e.target.value)}
                      disabled={scenario.isBase}
                      className={`border border-gray-300 rounded px-2 py-1 ${scenario.isBase ? 'bg-gray-100' : ''}`}
                    />
                  </td>
                  <td className="text-right py-3 px-4">
                    <input
                      type="number"
                      step="1"
                      value={scenario.probability}
                      onChange={(e) => updateScenario(scenario.id, 'probability', e.target.value)}
                      className="w-20 text-right border border-gray-300 rounded px-2 py-1"
                    />
                  </td>
                  <td className="text-right py-3 px-4">
                    <input
                      type="number"
                      step="0.1"
                      value={scenario.revenueGrowth}
                      onChange={(e) => updateScenario(scenario.id, 'revenueGrowth', e.target.value)}
                      className="w-20 text-right border border-gray-300 rounded px-2 py-1"
                    />
                  </td>
                  <td className="text-right py-3 px-4">
                    <input
                      type="number"
                      step="0.1"
                      value={scenario.marginExpansion}
                      onChange={(e) => updateScenario(scenario.id, 'marginExpansion', e.target.value)}
                      className="w-20 text-right border border-gray-300 rounded px-2 py-1"
                    />
                  </td>
                  <td className="text-right py-3 px-4">
                    <input
                      type="number"
                      step="0.1"
                      value={scenario.exitMultiple}
                      onChange={(e) => updateScenario(scenario.id, 'exitMultiple', e.target.value)}
                      className="w-20 text-right border border-gray-300 rounded px-2 py-1"
                    />
                  </td>
                  <td className="text-right py-3 px-4">
                    <input
                      type="number"
                      step="0.1"
                      value={scenario.capexIntensity}
                      onChange={(e) => updateScenario(scenario.id, 'capexIntensity', e.target.value)}
                      className="w-20 text-right border border-gray-300 rounded px-2 py-1"
                    />
                  </td>
                  <td className="text-center py-3 px-4">
                    {!scenario.isBase && (
                      <button
                        onClick={() => deleteScenario(scenario.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(results.summary.weightedValue)}
              </div>
              <div className="text-sm text-gray-600">Expected Value</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(results.summary.valueRange.max)}
              </div>
              <div className="text-sm text-gray-600">Best Case</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(results.summary.valueRange.min)}
              </div>
              <div className="text-sm text-gray-600">Worst Case</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatPercent(results.summary.probabilityOfPositiveReturn)}
              </div>
              <div className="text-sm text-gray-600">Success Probability</div>
            </div>
          </div>

          {/* Scenario Results Chart */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Scenario Results</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Enterprise Value']} />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Risk Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Standard Deviation:</span>
                  <span className="font-medium">{formatCurrency(results.summary.standardDeviation)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Coefficient of Variation:</span>
                  <span className="font-medium">{(results.summary.coefficientOfVariation * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Value at Risk (5%):</span>
                  <span className="font-medium">{formatCurrency(results.summary.valueRange.min)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Upside Potential:</span>
                  <span className="font-medium">{formatCurrency(results.summary.valueRange.range)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Scenario Returns</h4>
              <div className="space-y-2 text-sm">
                {results.scenarios.map((scenario) => (
                  <div key={scenario.id} className="flex justify-between">
                    <span>{scenario.name}:</span>
                    <span className="font-medium">
                      {analysisSettings.outputMetric === 'irr' ? formatPercent(scenario.irr) :
                        analysisSettings.outputMetric === 'moic' ? `${scenario.moic.toFixed(1)}x` :
                          formatCurrency(scenario[analysisSettings.outputMetric])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {!results && (
        <div className="text-center py-12 text-gray-500">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
          <p>Configure scenarios and run analysis to see results</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedScenarioAnalysis;
