import { BarChart3, Calculator, Settings, RefreshCw, AlertTriangle, CheckCircle, Target, Zap } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

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

  const getMoneynessColor = m => {
    switch (m) {
      case 'deep-in-the-money':
      case 'in-the-money':
        return 'text-success';
      case 'at-the-money':
      case 'out-of-the-money':
        return 'text-warning';
      case 'deep-out-of-the-money':
        return 'text-destructive';
      default:
        return 'text-foreground-secondary';
    }
  };

  const getGreekColor = (value, type) => {
    const numValue = parseFloat(value);
    if (type === 'delta') {
      return numValue > 0.5
        ? 'text-success'
        : numValue < -0.5
          ? 'text-destructive'
          : 'text-warning';
    }
    if (type === 'gamma' || type === 'vega') {
      return numValue > 0 ? 'text-success' : 'text-destructive';
    }
    if (type === 'theta') {
      return numValue < 0 ? 'text-destructive' : 'text-success';
    }
    return 'text-accent';
  };

  return (
    <div className={`bg-card border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/20 rounded-lg">
            <Calculator className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Options Analysis</h3>
            <p className="text-xs text-foreground-secondary">
              {underlyingSymbol} @ {formatCurrency(underlyingPrice)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            aria-label="Advanced settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={calculateOptionPrice}
            disabled={loading}
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
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
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="text-destructive">{error}</span>
            </div>
          </div>
        )}

        {/* Basic Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="opt-type" className="block text-sm text-foreground-secondary mb-2">Option Type</label>
            <select
              value={optionParams.type}
              onChange={e => handleParamChange('type', e.target.value)}
              id="opt-type"
              className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="call">Call</option>
              <option value="put">Put</option>
            </select>
          </div>

          <div>
            <label htmlFor="strike-price" className="block text-sm text-foreground-secondary mb-2">Strike Price</label>
            <input
              type="number"
              value={optionParams.strikePrice}
              onChange={e => handleParamChange('strikePrice', e.target.value)}
              step="0.01"
              id="strike-price"
              className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="time-expiry" className="block text-sm text-foreground-secondary mb-2">Time to Expiry</label>
            <select
              value={optionParams.timeToExpiry}
              onChange={e => handleParamChange('timeToExpiry', e.target.value)}
              id="time-expiry"
              className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={0.0833}>1 Month</option>
              <option value={0.25}>3 Months</option>
              <option value={0.5}>6 Months</option>
              <option value={1}>1 Year</option>
              <option value={2}>2 Years</option>
            </select>
          </div>

          <div>
            <label htmlFor="volatility" className="block text-sm text-foreground-secondary mb-2">Volatility</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.01"
                value={optionParams.volatility}
                onChange={e => handleParamChange('volatility', e.target.value)}
                id="volatility"
                className="flex-1"
              />
              <span className="text-sm text-foreground w-12">
                {(optionParams.volatility * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Advanced Parameters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <label htmlFor="risk-free-rate" className="block text-sm text-foreground-secondary mb-2">Risk-Free Rate</label>
              <input
                type="number"
                value={optionParams.riskFreeRate}
                onChange={e => handleParamChange('riskFreeRate', e.target.value)}
                step="0.001"
                id="risk-free-rate"
                className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label htmlFor="dividend-yield" className="block text-sm text-foreground-secondary mb-2">Dividend Yield</label>
              <input
                type="number"
                value={optionParams.dividendYield}
                onChange={e => handleParamChange('dividendYield', e.target.value)}
                step="0.001"
                id="dividend-yield"
                className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label htmlFor="pricing-model" className="block text-sm text-foreground-secondary mb-2">Pricing Model</label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                id="pricing-model"
                className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground-secondary">Option Price</span>
                  <Target className="w-4 h-4 text-accent" />
                </div>
                <div className="text-2xl font-bold text-foreground">${optionMetrics.price}</div>
                <div className="text-xs text-foreground-secondary mt-1">{pricingResult.model}</div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground-secondary">Intrinsic Value</span>
                  <CheckCircle className="w-4 h-4 text-success" />
                </div>
                <div className="text-xl font-semibold text-success">
                  ${optionMetrics.intrinsicValue}
                </div>
                <div className="text-xs text-foreground-secondary mt-1">
                  <span className={`capitalize ${getMoneynessColor(moneyness)}`}>
                    {moneyness?.replace('-', ' ')}
                  </span>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground-secondary">Time Value</span>
                  <Zap className="w-4 h-4 text-accent" />
                </div>
                <div className="text-xl font-semibold text-accent">
                  ${optionMetrics.timeValue}
                </div>
                <div className="text-xs text-foreground-secondary mt-1">Extrinsic value</div>
              </div>
            </div>

            {/* Greeks */}
            <div className="bg-muted rounded-lg p-4">
              <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
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
                  <div className="text-xs text-foreground-secondary">Delta</div>
                </div>

                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${getGreekColor(optionMetrics.gamma, 'gamma')}`}
                  >
                    {optionMetrics.gamma}
                  </div>
                  <div className="text-xs text-foreground-secondary">Gamma</div>
                </div>

                <div className="text-center">
                  <div className={`text-lg font-bold ${getGreekColor(optionMetrics.vega, 'vega')}`}>
                    {optionMetrics.vega}
                  </div>
                  <div className="text-xs text-foreground-secondary">Vega</div>
                </div>

                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${getGreekColor(optionMetrics.theta, 'theta')}`}
                  >
                    {optionMetrics.theta}
                  </div>
                  <div className="text-xs text-foreground-secondary">Theta</div>
                </div>

                <div className="text-center">
                  <div className={`text-lg font-bold ${getGreekColor(optionMetrics.rho, 'rho')}`}>
                    {optionMetrics.rho}
                  </div>
                  <div className="text-xs text-foreground-secondary">Rho</div>
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">Risk Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Leverage</span>
                    <span className="text-sm text-foreground">{optionMetrics.leverage}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Elasticity</span>
                    <span className="text-sm text-foreground">{optionMetrics.elasticity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Break-even</span>
                    <span className="text-sm text-foreground">
                      $
                      {optionParams.type === 'call'
                        ? (optionParams.strikePrice + parseFloat(optionMetrics.price)).toFixed(2)
                        : (optionParams.strikePrice - parseFloat(optionMetrics.price)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">Model Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Model</span>
                    <span className="text-sm text-foreground">{pricingResult.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Spot Price</span>
                    <span className="text-sm text-foreground">${underlyingPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Strike Price</span>
                    <span className="text-sm text-foreground">
                      ${optionParams.strikePrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Time to Expiry</span>
                    <span className="text-sm text-foreground">
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
            <span className="ml-3 text-foreground-secondary">Calculating option price...</span>
          </div>
        )}

        {/* Reset Button */}
        <div className="flex justify-center pt-4 border-t border-border">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-sm rounded border border-border transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default OptionsAnalysisDashboard;
