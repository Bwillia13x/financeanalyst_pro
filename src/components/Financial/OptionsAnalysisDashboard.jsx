import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calculator,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap
} from 'lucide-react';

import optionsPricingService from '../../services/financial/optionsPricingService';

const OptionsAnalysisDashboard = ({
  underlyingSymbol = 'AAPL',
  underlyingPrice = 150,
  onOptionCalculated,
  className = ''
}) => {
  const [optionParams, setOptionParams] = useState({
    type: 'call',
    strikePrice: 155,
    timeToExpiry: 0.25, // 3 months
    volatility: 0.25, // 25%
    riskFreeRate: 0.05, // 5%
    dividendYield: 0.02 // 2%
  });

  const [pricingResult, setPricingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedModel, setSelectedModel] = useState('black-scholes');

  // Calculate option price when parameters change
  useEffect(() => {
    calculateOptionPrice();
  }, [optionParams, selectedModel]);

  const calculateOptionPrice = async () => {
    setLoading(true);
    setError(null);

    try {
      const option = {
        type: optionParams.type,
        spotPrice: underlyingPrice,
        strikePrice: optionParams.strikePrice,
        timeToExpiry: optionParams.timeToExpiry,
        volatility: optionParams.volatility,
        riskFreeRate: optionParams.riskFreeRate,
        dividendYield: optionParams.dividendYield
      };

      let result;
      if (selectedModel === 'black-scholes') {
        result = optionsPricingService.blackScholesPrice(option);
      } else if (selectedModel === 'binomial') {
        result = optionsPricingService.binomialPrice(option, 100);
      }

      setPricingResult(result);
      onOptionCalculated?.(result);
    } catch (err) {
      setError(err.message);
      console.error('Option calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate option metrics
  const optionMetrics = useMemo(() => {
    if (!pricingResult || !pricingResult.greeks) return null;

    const { price, intrinsicValue, timeValue, greeks } = pricingResult;
    const { delta, gamma, vega, theta, rho } = greeks;

    return {
      price: price.toFixed(2),
      intrinsicValue: intrinsicValue.toFixed(2),
      timeValue: timeValue.toFixed(2),
      delta: (delta * 100).toFixed(2) + '%',
      gamma: gamma.toFixed(4),
      vega: vega.toFixed(4),
      theta: theta.toFixed(4),
      rho: rho.toFixed(4),
      leverage: ((delta * underlyingPrice) / price).toFixed(2),
      elasticity: ((delta * underlyingPrice) / price).toFixed(2)
    };
  }, [pricingResult]);

  // Calculate moneyness
  const moneyness = useMemo(() => {
    if (!optionParams.strikePrice || !underlyingPrice) return null;

    const ratio = underlyingPrice / optionParams.strikePrice;
    if (ratio > 1.05) return 'deep-in-the-money';
    if (ratio > 1.02) return 'in-the-money';
    if (ratio > 0.98) return 'at-the-money';
    if (ratio > 0.95) return 'out-of-the-money';
    return 'deep-out-of-the-money';
  }, [optionParams.strikePrice, underlyingPrice]);

  const handleParamChange = (param, value) => {
    setOptionParams(prev => ({
      ...prev,
      [param]: parseFloat(value) || value
    }));
  };

  const resetToDefaults = () => {
    setOptionParams({
      type: 'call',
      strikePrice: Math.round(underlyingPrice * 1.05), // 5% OTM
      timeToExpiry: 0.25,
      volatility: 0.25,
      riskFreeRate: 0.05,
      dividendYield: 0.02
    });
  };

  const formatCurrency = value => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getMoneynessColor = moneyness => {
    switch (moneyness) {
      case 'deep-in-the-money':
        return 'text-green-400';
      case 'in-the-money':
        return 'text-green-300';
      case 'at-the-money':
        return 'text-yellow-400';
      case 'out-of-the-money':
        return 'text-orange-400';
      case 'deep-out-of-the-money':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getGreekColor = (value, type) => {
    const numValue = parseFloat(value);
    if (type === 'delta') {
      return numValue > 0.5
        ? 'text-green-400'
        : numValue < -0.5
          ? 'text-red-400'
          : 'text-yellow-400';
    }
    if (type === 'gamma' || type === 'vega') {
      return numValue > 0 ? 'text-green-400' : 'text-red-400';
    }
    if (type === 'theta') {
      return numValue < 0 ? 'text-red-400' : 'text-green-400';
    }
    return 'text-blue-400';
  };

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Calculator className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Options Analysis</h3>
            <p className="text-xs text-slate-400">
              {underlyingSymbol} @ {formatCurrency(underlyingPrice)}
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
            onClick={calculateOptionPrice}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Recalculate"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Basic Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Option Type</label>
            <select
              value={optionParams.type}
              onChange={e => handleParamChange('type', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            >
              <option value="call">Call</option>
              <option value="put">Put</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Strike Price</label>
            <input
              type="number"
              value={optionParams.strikePrice}
              onChange={e => handleParamChange('strikePrice', e.target.value)}
              step="0.01"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Time to Expiry</label>
            <select
              value={optionParams.timeToExpiry}
              onChange={e => handleParamChange('timeToExpiry', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            >
              <option value={0.0833}>1 Month</option>
              <option value={0.25}>3 Months</option>
              <option value={0.5}>6 Months</option>
              <option value={1}>1 Year</option>
              <option value={2}>2 Years</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Volatility</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.01"
                value={optionParams.volatility}
                onChange={e => handleParamChange('volatility', e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-white w-12">
                {(optionParams.volatility * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Advanced Parameters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-700/50 rounded-lg">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Risk-Free Rate</label>
              <input
                type="number"
                value={optionParams.riskFreeRate}
                onChange={e => handleParamChange('riskFreeRate', e.target.value)}
                step="0.001"
                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Dividend Yield</label>
              <input
                type="number"
                value={optionParams.dividendYield}
                onChange={e => handleParamChange('dividendYield', e.target.value)}
                step="0.001"
                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Pricing Model</label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
              >
                <option value="black-scholes">Black-Scholes</option>
                <option value="binomial">Binomial Tree</option>
              </select>
            </div>
          </div>
        )}

        {/* Results */}
        {pricingResult && optionMetrics && (
          <>
            {/* Price Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Option Price</span>
                  <Target className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white">${optionMetrics.price}</div>
                <div className="text-xs text-slate-400 mt-1">{pricingResult.model}</div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Intrinsic Value</span>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-xl font-semibold text-green-400">
                  ${optionMetrics.intrinsicValue}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  <span className={`capitalize ${getMoneynessColor(moneyness)}`}>
                    {moneyness?.replace('-', ' ')}
                  </span>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Time Value</span>
                  <Zap className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xl font-semibold text-purple-400">
                  ${optionMetrics.timeValue}
                </div>
                <div className="text-xs text-slate-400 mt-1">Extrinsic value</div>
              </div>
            </div>

            {/* Greeks */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Option Greeks
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${getGreekColor(optionMetrics.delta, 'delta')}`}
                  >
                    {optionMetrics.delta}
                  </div>
                  <div className="text-xs text-slate-400">Delta</div>
                </div>

                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${getGreekColor(optionMetrics.gamma, 'gamma')}`}
                  >
                    {optionMetrics.gamma}
                  </div>
                  <div className="text-xs text-slate-400">Gamma</div>
                </div>

                <div className="text-center">
                  <div className={`text-lg font-bold ${getGreekColor(optionMetrics.vega, 'vega')}`}>
                    {optionMetrics.vega}
                  </div>
                  <div className="text-xs text-slate-400">Vega</div>
                </div>

                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${getGreekColor(optionMetrics.theta, 'theta')}`}
                  >
                    {optionMetrics.theta}
                  </div>
                  <div className="text-xs text-slate-400">Theta</div>
                </div>

                <div className="text-center">
                  <div className={`text-lg font-bold ${getGreekColor(optionMetrics.rho, 'rho')}`}>
                    {optionMetrics.rho}
                  </div>
                  <div className="text-xs text-slate-400">Rho</div>
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">Risk Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Leverage</span>
                    <span className="text-sm text-white">{optionMetrics.leverage}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Elasticity</span>
                    <span className="text-sm text-white">{optionMetrics.elasticity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Break-even</span>
                    <span className="text-sm text-white">
                      $
                      {optionParams.type === 'call'
                        ? (optionParams.strikePrice + parseFloat(optionMetrics.price)).toFixed(2)
                        : (optionParams.strikePrice - parseFloat(optionMetrics.price)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">Model Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Model</span>
                    <span className="text-sm text-white">{pricingResult.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Spot Price</span>
                    <span className="text-sm text-white">${underlyingPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Strike Price</span>
                    <span className="text-sm text-white">
                      ${optionParams.strikePrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Time to Expiry</span>
                    <span className="text-sm text-white">
                      {(optionParams.timeToExpiry * 12).toFixed(1)} months
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-slate-300">Calculating option price...</span>
          </div>
        )}

        {/* Reset Button */}
        <div className="flex justify-center pt-4 border-t border-slate-700">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default OptionsAnalysisDashboard;
