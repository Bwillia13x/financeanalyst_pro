import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Target,
  Zap,
  Plus,
  Minus,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Eye,
  EyeOff,
  BarChart3,
  Activity
} from 'lucide-react';

import portfolioAnalyticsService from '../../services/financial/portfolioAnalyticsService';

const StressTestingDashboard = ({
  portfolio = {},
  marketData = {},
  onStressTestComplete,
  className = ''
}) => {
  const [scenarios, setScenarios] = useState([
    {
      id: 1,
      name: 'Market Crash 2008',
      type: 'percentage',
      shocks: {
        AAPL: -0.4,
        MSFT: -0.35,
        GOOGL: -0.45,
        TSLA: -0.6
      },
      timeHorizon: 1,
      probability: 0.05,
      active: true
    },
    {
      id: 2,
      name: 'Tech Sector Decline',
      type: 'percentage',
      shocks: {
        AAPL: -0.25,
        MSFT: -0.3,
        GOOGL: -0.35,
        TSLA: -0.4
      },
      timeHorizon: 1,
      probability: 0.15,
      active: true
    },
    {
      id: 3,
      name: 'Interest Rate Hike',
      type: 'percentage',
      shocks: {
        AAPL: -0.1,
        MSFT: -0.08,
        GOOGL: -0.12,
        TSLA: -0.15
      },
      timeHorizon: 1,
      probability: 0.3,
      active: true
    }
  ]);

  const [stressTestResults, setStressTestResults] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customScenario, setCustomScenario] = useState({
    name: '',
    type: 'percentage',
    shocks: {},
    timeHorizon: 1,
    probability: 0.1
  });

  // Default portfolio
  const defaultPortfolio = {
    assets: [
      { symbol: 'AAPL', price: 150, quantity: 100, weight: 0.4 },
      { symbol: 'MSFT', price: 300, quantity: 50, weight: 0.3 },
      { symbol: 'GOOGL', price: 2500, quantity: 20, weight: 0.2 },
      { symbol: 'TSLA', price: 200, quantity: 25, weight: 0.1 }
    ],
    weights: [0.4, 0.3, 0.2, 0.1],
    covarianceMatrix: [
      [0.0625, 0.015, 0.018, 0.025],
      [0.015, 0.0484, 0.014, 0.02],
      [0.018, 0.014, 0.0784, 0.03],
      [0.025, 0.02, 0.03, 0.2025]
    ],
    portfolioValue: 77500,
    ...portfolio
  };

  // Run stress tests when scenarios change
  useEffect(() => {
    runStressTests();
  }, [scenarios]);

  const runStressTests = async () => {
    setIsRunning(true);

    try {
      const activeScenarios = scenarios.filter(s => s.active);
      const results = portfolioAnalyticsService.stressTestPortfolio(
        defaultPortfolio,
        activeScenarios
      );

      setStressTestResults(results);
      onStressTestComplete?.(results);
    } catch (error) {
      console.error('Stress test error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const addScenario = () => {
    if (!customScenario.name.trim()) return;

    const newScenario = {
      id: Math.max(...scenarios.map(s => s.id)) + 1,
      ...customScenario,
      shocks: { ...customScenario.shocks },
      active: true
    };

    setScenarios(prev => [...prev, newScenario]);
    setCustomScenario({
      name: '',
      type: 'percentage',
      shocks: {},
      timeHorizon: 1,
      probability: 0.1
    });
  };

  const removeScenario = id => {
    setScenarios(prev => prev.filter(s => s.id !== id));
    if (selectedScenario?.id === id) {
      setSelectedScenario(null);
    }
  };

  const toggleScenario = id => {
    setScenarios(prev => prev.map(s => (s.id === id ? { ...s, active: !s.active } : s)));
  };

  const updateScenario = (id, field, value) => {
    setScenarios(prev => prev.map(s => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const updateCustomScenarioShock = (symbol, value) => {
    setCustomScenario(prev => ({
      ...prev,
      shocks: {
        ...prev.shocks,
        [symbol]: parseFloat(value) || 0
      }
    }));
  };

  const formatCurrency = value => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value, decimals = 2) => {
    return (value * 100).toFixed(decimals) + '%';
  };

  const getSeverityColor = impact => {
    const absImpact = Math.abs(impact);
    if (absImpact > 20) return 'text-red-400';
    if (absImpact > 10) return 'text-yellow-400';
    if (absImpact > 5) return 'text-orange-400';
    return 'text-green-400';
  };

  const getSeverityLevel = impact => {
    const absImpact = Math.abs(impact);
    if (absImpact > 20) return 'Critical';
    if (absImpact > 10) return 'High';
    if (absImpact > 5) return 'Medium';
    return 'Low';
  };

  // Calculate expected loss and other metrics
  const stressMetrics = useMemo(() => {
    if (!stressTestResults) return null;

    const { stressTestResults: results } = stressTestResults;

    const expectedLoss = results.reduce(
      (sum, scenario) => sum + scenario.portfolioImpact * scenario.probability,
      0
    );

    const worstCase = results.reduce((worst, current) =>
      Math.abs(current.portfolioImpact) > Math.abs(worst.portfolioImpact) ? current : worst
    );

    const tailRisk = results
      .filter(s => s.probability <= 0.1)
      .reduce((sum, scenario) => sum + scenario.portfolioImpact * scenario.probability, 0);

    return {
      expectedLoss,
      worstCase,
      tailRisk,
      scenariosTested: results.length,
      averageImpact: results.reduce((sum, s) => sum + s.portfolioImpact, 0) / results.length
    };
  }, [stressTestResults]);

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Stress Testing</h3>
            <p className="text-xs text-slate-400">
              {scenarios.filter(s => s.active).length} active scenario
              {scenarios.filter(s => s.active).length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Advanced settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={runStressTests}
            disabled={isRunning}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Run stress tests"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      {stressMetrics && (
        <div className="p-4 border-b border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Expected Loss</span>
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <div className={`text-xl font-bold ${getSeverityColor(stressMetrics.expectedLoss)}`}>
                {formatCurrency(stressMetrics.expectedLoss)}
              </div>
              <div className="text-xs text-slate-400">
                {formatPercent(stressMetrics.expectedLoss / defaultPortfolio.portfolioValue)}
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Worst Case</span>
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div
                className={`text-xl font-bold ${getSeverityColor(stressMetrics.worstCase.portfolioImpact)}`}
              >
                {formatCurrency(stressMetrics.worstCase.portfolioImpact)}
              </div>
              <div className="text-xs text-slate-400">{stressMetrics.worstCase.scenario}</div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Tail Risk</span>
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <div className={`text-xl font-bold ${getSeverityColor(stressMetrics.tailRisk)}`}>
                {formatCurrency(stressMetrics.tailRisk)}
              </div>
              <div className="text-xs text-slate-400">Low probability events</div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Scenarios</span>
                <BarChart3 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl font-bold text-blue-400">{stressMetrics.scenariosTested}</div>
              <div className="text-xs text-slate-400">Active tests</div>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Management */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-white">Stress Scenarios</h4>
          <button
            onClick={() => setSelectedScenario(selectedScenario ? null : {})}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Add Scenario
          </button>
        </div>

        {/* Scenario List */}
        <div className="space-y-3 mb-4">
          {scenarios.map(scenario => (
            <div
              key={scenario.id}
              className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                selectedScenario?.id === scenario.id
                  ? 'bg-orange-500/10 border-orange-500/50'
                  : 'bg-slate-700/50 border-slate-600 hover:bg-slate-600'
              }`}
              onClick={() => setSelectedScenario(scenario)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleScenario(scenario.id);
                    }}
                    className={`w-4 h-4 rounded border-2 transition-colors ${
                      scenario.active ? 'bg-orange-500 border-orange-500' : 'border-slate-400'
                    }`}
                    aria-label={scenario.active ? 'Deactivate scenario' : 'Activate scenario'}
                  />
                  <div>
                    <div className="text-sm font-medium text-white">{scenario.name}</div>
                    <div className="text-xs text-slate-400">
                      {scenario.type} • {scenario.timeHorizon} day
                      {scenario.timeHorizon > 1 ? 's' : ''} • {formatPercent(scenario.probability)}{' '}
                      prob
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {stressTestResults?.stressTestResults?.find(
                    r => r.scenario === scenario.name
                  ) && (
                    <div
                      className={`text-sm font-medium ${getSeverityColor(
                        stressTestResults.stressTestResults.find(r => r.scenario === scenario.name)
                          .portfolioImpact
                      )}`}
                    >
                      {formatPercent(
                        stressTestResults.stressTestResults.find(r => r.scenario === scenario.name)
                          .impactPercentage
                      )}
                    </div>
                  )}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      removeScenario(scenario.id);
                    }}
                    className="p-1 text-slate-400 hover:text-red-400"
                    aria-label="Remove scenario"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scenario Editor */}
        {selectedScenario && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-white mb-3">
              {selectedScenario.id ? 'Edit Scenario' : 'Create New Scenario'}
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Scenario Name</label>
                <input
                  type="text"
                  value={selectedScenario.name || ''}
                  onChange={e => updateScenario(selectedScenario.id, 'name', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Probability</label>
                <input
                  type="number"
                  value={selectedScenario.probability || 0.1}
                  onChange={e =>
                    updateScenario(selectedScenario.id, 'probability', parseFloat(e.target.value))
                  }
                  step="0.01"
                  min="0"
                  max="1"
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">Asset Shocks</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {defaultPortfolio.assets.map(asset => (
                  <div key={asset.symbol}>
                    <label className="block text-xs text-slate-400 mb-1">{asset.symbol}</label>
                    <input
                      type="number"
                      value={selectedScenario.shocks?.[asset.symbol] || 0}
                      onChange={e => {
                        const newShocks = {
                          ...selectedScenario.shocks,
                          [asset.symbol]: parseFloat(e.target.value) || 0
                        };
                        updateScenario(selectedScenario.id, 'shocks', newShocks);
                      }}
                      step="0.01"
                      className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedScenario(null)}
                className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setSelectedScenario(null)}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Custom Scenario Creator */}
        {selectedScenario === null && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-white mb-3">Create Custom Scenario</h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Scenario Name</label>
                <input
                  type="text"
                  value={customScenario.name}
                  onChange={e => setCustomScenario(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                  placeholder="e.g., Custom Market Shock"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Probability</label>
                <input
                  type="number"
                  value={customScenario.probability}
                  onChange={e =>
                    setCustomScenario(prev => ({
                      ...prev,
                      probability: parseFloat(e.target.value) || 0.1
                    }))
                  }
                  step="0.01"
                  min="0"
                  max="1"
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">Asset Shocks</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {defaultPortfolio.assets.map(asset => (
                  <div key={asset.symbol}>
                    <label className="block text-xs text-slate-400 mb-1">{asset.symbol}</label>
                    <input
                      type="number"
                      value={customScenario.shocks[asset.symbol] || 0}
                      onChange={e => updateCustomScenarioShock(asset.symbol, e.target.value)}
                      step="0.01"
                      className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={addScenario}
                disabled={!customScenario.name.trim()}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white text-sm rounded transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Scenario
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Visualization */}
      {stressTestResults && (
        <div className="p-4">
          <h4 className="text-sm font-semibold text-white mb-4">Stress Test Results</h4>

          <div className="space-y-4">
            {stressTestResults.stressTestResults.map((result, index) => (
              <div key={index} className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="text-sm font-medium text-white">{result.scenario}</h5>
                    <div className="text-xs text-slate-400">
                      Severity: {getSeverityLevel(result.portfolioImpact)}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${getSeverityColor(result.portfolioImpact)}`}>
                    {formatCurrency(result.portfolioImpact)}
                  </div>
                </div>

                <div className="text-sm text-slate-400 mb-3">
                  Portfolio Impact: {formatPercent(result.impactPercentage)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {result.assetImpacts.map((impact, assetIndex) => (
                    <div key={impact.symbol} className="text-center">
                      <div className="text-xs text-slate-400">{impact.symbol}</div>
                      <div
                        className={`text-sm font-medium ${
                          impact.weightedImpact < 0 ? 'text-red-400' : 'text-green-400'
                        }`}
                      >
                        {formatCurrency(impact.weightedImpact)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatPercent(
                          impact.weightedImpact /
                            (defaultPortfolio.assets[assetIndex].price *
                              defaultPortfolio.assets[assetIndex].quantity)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isRunning && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-slate-300">Running stress tests...</span>
        </div>
      )}
    </div>
  );
};

export default StressTestingDashboard;
