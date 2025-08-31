import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Settings,
  RefreshCw,
  Plus,
  Minus,
  Filter,
  Eye,
  EyeOff,
  Activity,
  PieChart
} from 'lucide-react';

import portfolioAnalyticsService from '../../services/financial/portfolioAnalyticsService';

const FactorInvestingDashboard = ({
  portfolio = {},
  availableFactors = [],
  onFactorOptimization,
  className = ''
}) => {
  const [selectedFactors, setSelectedFactors] = useState(['Market', 'Value', 'Growth', 'Size']);
  const [factorTargets, setFactorTargets] = useState({
    Market: 1.0,
    Value: 0.2,
    Growth: 0.3,
    Size: -0.1
  });
  const [optimizationConstraints, setOptimizationConstraints] = useState({
    maxWeight: 0.3,
    minWeight: 0.0,
    targetVolatility: 0.15,
    factorImportance: {
      Market: 1.0,
      Value: 0.8,
      Growth: 0.9,
      Size: 0.7
    }
  });
  const [optimizedPortfolio, setOptimizedPortfolio] = useState(null);
  const [factorAnalysis, setFactorAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Default factors
  const defaultFactors = [
    {
      name: 'Market',
      description: 'Overall market exposure',
      historicalReturn: 0.08,
      volatility: 0.15,
      importance: 1.0
    },
    {
      name: 'Value',
      description: 'Value vs growth stocks',
      historicalReturn: 0.06,
      volatility: 0.12,
      importance: 0.8
    },
    {
      name: 'Growth',
      description: 'Growth-oriented companies',
      historicalReturn: 0.1,
      volatility: 0.18,
      importance: 0.9
    },
    {
      name: 'Size',
      description: 'Small vs large cap',
      historicalReturn: 0.07,
      volatility: 0.16,
      importance: 0.7
    },
    {
      name: 'Quality',
      description: 'High-quality companies',
      historicalReturn: 0.09,
      volatility: 0.14,
      importance: 0.6
    },
    {
      name: 'Momentum',
      description: 'Recent performance',
      historicalReturn: 0.11,
      volatility: 0.2,
      importance: 0.5
    }
  ];

  // Default portfolio with factor exposures
  const defaultPortfolio = {
    assets: [
      {
        symbol: 'AAPL',
        price: 150,
        quantity: 100,
        weight: 0.4,
        Market: 1.0,
        Value: -0.2,
        Growth: 0.8,
        Size: -0.3,
        Quality: 0.6,
        Momentum: 0.4
      },
      {
        symbol: 'MSFT',
        price: 300,
        quantity: 50,
        weight: 0.3,
        Market: 1.0,
        Value: 0.1,
        Growth: 0.9,
        Size: -0.2,
        Quality: 0.8,
        Momentum: 0.6
      },
      {
        symbol: 'GOOGL',
        price: 2500,
        quantity: 20,
        weight: 0.2,
        Market: 1.0,
        Value: -0.1,
        Growth: 1.0,
        Size: -0.1,
        Quality: 0.7,
        Momentum: 0.8
      },
      {
        symbol: 'TSLA',
        price: 200,
        quantity: 25,
        weight: 0.1,
        Market: 1.0,
        Value: -0.8,
        Growth: 1.2,
        Size: -0.4,
        Quality: 0.3,
        Momentum: 1.0
      }
    ],
    weights: [0.4, 0.3, 0.2, 0.1],
    portfolioValue: 77500,
    ...portfolio
  };

  // Calculate factor analysis on mount
  useEffect(() => {
    analyzeFactors();
  }, []);

  // Optimize portfolio when factors or targets change
  useEffect(() => {
    if (selectedFactors.length > 0) {
      optimizePortfolio();
    }
  }, [selectedFactors, factorTargets, optimizationConstraints]);

  const analyzeFactors = () => {
    const analysis = {
      currentExposures: {},
      factorReturns: {},
      factorVolatilities: {},
      factorCorrelations: {},
      timestamp: Date.now()
    };

    // Calculate current factor exposures
    selectedFactors.forEach(factor => {
      const totalExposure = defaultPortfolio.assets.reduce(
        (sum, asset) => sum + (asset[factor] || 0) * asset.weight,
        0
      );
      analysis.currentExposures[factor] = totalExposure;

      // Mock factor returns and volatilities
      analysis.factorReturns[factor] =
        defaultFactors.find(f => f.name === factor)?.historicalReturn || 0.08;
      analysis.factorVolatilities[factor] =
        defaultFactors.find(f => f.name === factor)?.volatility || 0.15;
    });

    // Calculate factor correlations (simplified)
    selectedFactors.forEach(factor1 => {
      analysis.factorCorrelations[factor1] = {};
      selectedFactors.forEach(factor2 => {
        analysis.factorCorrelations[factor1][factor2] =
          factor1 === factor2 ? 1.0 : Math.random() * 0.3 + 0.1; // Mock correlation
      });
    });

    setFactorAnalysis(analysis);
  };

  const optimizePortfolio = async () => {
    setLoading(true);

    try {
      // Prepare target factors for optimization
      const targetFactors = selectedFactors.map(factor => ({
        name: factor,
        target: factorTargets[factor] || 0,
        importance: optimizationConstraints.factorImportance[factor] || 1.0,
        exposures: defaultPortfolio.assets.map(asset => asset[factor] || 0)
      }));

      const result = portfolioAnalyticsService.factorOptimization(
        targetFactors,
        optimizationConstraints
      );

      setOptimizedPortfolio(result);
      onFactorOptimization?.(result);
    } catch (error) {
      console.error('Factor optimization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFactor = factorName => {
    if (!selectedFactors.includes(factorName)) {
      setSelectedFactors(prev => [...prev, factorName]);
    }
  };

  const removeFactor = factorName => {
    setSelectedFactors(prev => prev.filter(f => f !== factorName));
    setFactorTargets(prev => {
      const newTargets = { ...prev };
      delete newTargets[factorName];
      return newTargets;
    });
  };

  const updateFactorTarget = (factor, target) => {
    setFactorTargets(prev => ({
      ...prev,
      [factor]: parseFloat(target) || 0
    }));
  };

  const updateFactorImportance = (factor, importance) => {
    setOptimizationConstraints(prev => ({
      ...prev,
      factorImportance: {
        ...prev.factorImportance,
        [factor]: parseFloat(importance) || 1.0
      }
    }));
  };

  const formatPercent = (value, decimals = 2) => {
    return (value * 100).toFixed(decimals) + '%';
  };

  const formatCurrency = value => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getFactorColor = exposure => {
    if (exposure > 0.5) return 'text-green-400';
    if (exposure < -0.5) return 'text-red-400';
    if (exposure > 0.2) return 'text-green-300';
    if (exposure < -0.2) return 'text-red-300';
    return 'text-blue-400';
  };

  const getTargetColor = (current, target) => {
    const diff = Math.abs(current - target);
    if (diff < 0.1) return 'text-green-400';
    if (diff < 0.3) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Factor Investing</h3>
            <p className="text-xs text-slate-400">
              {selectedFactors.length} factor{selectedFactors.length !== 1 ? 's' : ''} selected
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
            onClick={optimizePortfolio}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Re-optimize"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Factor Selection */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-white">Available Factors</h4>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Click to add factors</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {defaultFactors.map(factor => {
            const isSelected = selectedFactors.includes(factor.name);
            return (
              <button
                key={factor.name}
                onClick={() => (isSelected ? removeFactor(factor.name) : addFactor(factor.name))}
                className={`p-3 rounded-lg border transition-colors ${
                  isSelected
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-600'
                }`}
              >
                <div className="text-xs font-medium">{factor.name}</div>
                <div className="text-xs opacity-75 mt-1">
                  {formatPercent(factor.historicalReturn)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Factor Analysis */}
      {factorAnalysis && (
        <div className="p-4 border-b border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-4">Current Factor Exposures</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedFactors.map(factor => {
              const currentExposure = factorAnalysis.currentExposures[factor] || 0;
              const targetExposure = factorTargets[factor] || 0;

              return (
                <div key={factor} className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">{factor}</span>
                    <div className={`text-xs ${getTargetColor(currentExposure, targetExposure)}`}>
                      Target: {targetExposure.toFixed(2)}
                    </div>
                  </div>

                  <div className={`text-lg font-bold mb-1 ${getFactorColor(currentExposure)}`}>
                    {currentExposure.toFixed(2)}
                  </div>

                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={factorTargets[factor] || 0}
                    onChange={e => updateFactorTarget(factor, e.target.value)}
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Optimization Results */}
      {optimizedPortfolio && (
        <div className="p-4 border-b border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-4">Optimized Portfolio</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Optimized Weights */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-white mb-3">Asset Allocation</h5>
              <div className="space-y-3">
                {defaultPortfolio.assets.map((asset, index) => {
                  const optimizedWeight = optimizedPortfolio.optimizedWeights[index];
                  const currentWeight = asset.weight;

                  return (
                    <div key={asset.symbol} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{asset.symbol}</span>
                      <div className="text-right">
                        <div className="text-sm text-white font-medium">
                          {formatPercent(optimizedWeight)}
                        </div>
                        <div className="text-xs text-slate-400">
                          Was: {formatPercent(currentWeight)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Factor Achievement */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-white mb-3">Factor Targets</h5>
              <div className="space-y-3">
                {selectedFactors.map(factor => {
                  const target = factorTargets[factor] || 0;
                  // Calculate achieved exposure
                  const achieved = optimizedPortfolio.optimizedWeights.reduce(
                    (sum, weight, index) =>
                      sum + weight * (defaultPortfolio.assets[index][factor] || 0),
                    0
                  );

                  return (
                    <div key={factor} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{factor}</span>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getTargetColor(achieved, target)}`}>
                          {achieved.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400">Target: {target.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="p-4 border-b border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-4">Optimization Constraints</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weight Constraints */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Max Weight per Asset: {formatPercent(optimizationConstraints.maxWeight)}
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={optimizationConstraints.maxWeight}
                  onChange={e =>
                    setOptimizationConstraints(prev => ({
                      ...prev,
                      maxWeight: parseFloat(e.target.value)
                    }))
                  }
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Min Weight per Asset: {formatPercent(optimizationConstraints.minWeight)}
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="0.1"
                  step="0.01"
                  value={optimizationConstraints.minWeight}
                  onChange={e =>
                    setOptimizationConstraints(prev => ({
                      ...prev,
                      minWeight: parseFloat(e.target.value)
                    }))
                  }
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Factor Importance */}
            <div>
              <h5 className="text-sm font-medium text-white mb-3">Factor Importance</h5>
              <div className="space-y-3">
                {selectedFactors.map(factor => (
                  <div key={factor} className="flex items-center gap-3">
                    <span className="text-sm text-slate-300 w-16">{factor}</span>
                    <input
                      type="range"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={optimizationConstraints.factorImportance[factor] || 1.0}
                      onChange={e => updateFactorImportance(factor, e.target.value)}
                      className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-white w-12">
                      {(optimizationConstraints.factorImportance[factor] || 1.0).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Factor Performance */}
      <div className="p-4">
        <h4 className="text-sm font-semibold text-white mb-4">Factor Performance</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {defaultFactors.map(factor => {
            const isSelected = selectedFactors.includes(factor.name);

            return (
              <div
                key={factor.name}
                className={`p-4 rounded-lg border ${
                  isSelected
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-slate-700/50 border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{factor.name}</span>
                  {isSelected && <Target className="w-4 h-4 text-purple-400" />}
                </div>

                <div className="text-xs text-slate-400 mb-3">{factor.description}</div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Return</span>
                    <span
                      className={`text-xs font-medium ${factor.historicalReturn > 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {formatPercent(factor.historicalReturn)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Volatility</span>
                    <span className="text-xs text-white">{formatPercent(factor.volatility)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Sharpe</span>
                    <span className="text-xs text-white">
                      {((factor.historicalReturn - 0.03) / factor.volatility).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-slate-300">Optimizing portfolio...</span>
        </div>
      )}
    </div>
  );
};

export default FactorInvestingDashboard;
