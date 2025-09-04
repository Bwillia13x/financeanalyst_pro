import {
  Plus,
  Minus,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  RefreshCw,
  Save,
  Download,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import optionsPricingService from '../../services/financial/optionsPricingService';

const OptionsStrategyBuilder = ({
  underlyingSymbol = 'AAPL',
  underlyingPrice = 150,
  onStrategyCalculated,
  className = ''
}) => {
  const [strategyName, setStrategyName] = useState('Custom Strategy');
  const [legs, setLegs] = useState([
    {
      id: 1,
      type: 'call',
      strike: 155,
      quantity: 1,
      timeToExpiry: 0.25
    }
  ]);

  const [marketParams, setMarketParams] = useState({
    volatility: 0.25,
    riskFreeRate: 0.05,
    dividendYield: 0.02
  });

  const [strategyResult, setStrategyResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate strategy when legs or market params change
  useEffect(() => {
    if (legs.length > 0) {
      calculateStrategy();
    }
  }, [legs, marketParams]);

  const calculateStrategy = async () => {
    setLoading(true);
    setError(null);

    try {
      const strategy = {
        name: strategyName,
        legs: legs.map(leg => ({
          type: leg.type,
          strike: leg.strike,
          quantity: leg.quantity,
          timeToExpiry: leg.timeToExpiry
        })),
        spotPrice: underlyingPrice,
        volatility: marketParams.volatility,
        riskFreeRate: marketParams.riskFreeRate
      };

      const result = optionsPricingService.calculateStrategy(strategy);
      setStrategyResult(result);
      onStrategyCalculated?.(result);
    } catch (err) {
      setError(err.message);
      console.error('Strategy calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addLeg = () => {
    const newLeg = {
      id: Math.max(...legs.map(l => l.id)) + 1,
      type: 'call',
      strike: underlyingPrice * 1.05,
      quantity: 1,
      timeToExpiry: 0.25
    };
    setLegs(prev => [...prev, newLeg]);
  };

  const removeLeg = id => {
    if (legs.length > 1) {
      setLegs(prev => prev.filter(leg => leg.id !== id));
    }
  };

  const updateLeg = (id, field, value) => {
    setLegs(prev =>
      prev.map(leg => (leg.id === id ? { ...leg, [field]: parseFloat(value) || value } : leg))
    );
  };

  const formatCurrency = value => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercent = value => {
    return (value * 100).toFixed(2) + '%';
  };

  // Strategy analysis
  const strategyAnalysis = useMemo(() => {
    if (!strategyResult) return null;

    const { summary, legs: legResults } = strategyResult;
    const { totalPremium, netDelta, netGamma, netVega, netTheta, netRho } = summary;

    return {
      totalPremium: formatCurrency(totalPremium),
      netDelta: netDelta.toFixed(2),
      netGamma: netGamma.toFixed(4),
      netVega: netVega.toFixed(2),
      netTheta: netTheta.toFixed(2),
      netRho: formatCurrency(netRho),
      maxProfit: calculateMaxProfit(legResults),
      maxLoss: calculateMaxLoss(legResults),
      breakevenPoints: calculateBreakevenPoints(legResults)
    };
  }, [strategyResult]);

  const calculateMaxProfit = legResults => {
    // Simplified max profit calculation
    const maxProfits = legResults.map(leg => {
      const premium = leg.adjustedPrice;
      if (leg.leg.type === 'call') {
        return leg.leg.quantity > 0 ? 'Unlimited' : -premium;
      } else {
        return leg.leg.quantity < 0 ? 'Unlimited' : -premium;
      }
    });

    if (maxProfits.includes('Unlimited')) return 'Unlimited';
    return formatCurrency(Math.max(...maxProfits.map(p => parseFloat(p) || 0)));
  };

  const calculateMaxLoss = legResults => {
    // Simplified max loss calculation
    const maxLosses = legResults.map(leg => {
      const premium = leg.adjustedPrice;
      if (leg.leg.type === 'call') {
        return leg.leg.quantity > 0 ? -premium : 'Unlimited';
      } else {
        return leg.leg.quantity < 0 ? -premium : 'Unlimited';
      }
    });

    if (maxLosses.includes('Unlimited')) return 'Unlimited';
    return formatCurrency(Math.min(...maxLosses.map(l => parseFloat(l) || 0)));
  };

  const calculateBreakevenPoints = legResults => {
    // Simplified breakeven calculation
    const breakevens = [];
    legResults.forEach(leg => {
      if (leg.leg.type === 'call' && leg.leg.quantity > 0) {
        breakevens.push(leg.leg.strike + leg.adjustedPrice / leg.leg.quantity);
      } else if (leg.leg.type === 'put' && leg.leg.quantity > 0) {
        breakevens.push(leg.leg.strike - leg.adjustedPrice / leg.leg.quantity);
      }
    });

    return breakevens.map(price => formatCurrency(price));
  };

  const getPositionType = legs => {
    const netDelta = legs.reduce((sum, leg) => sum + leg.adjustedGreeks.delta, 0);

    if (Math.abs(netDelta) < 0.1) return 'Delta Neutral';
    if (netDelta > 0.5) return 'Bullish';
    if (netDelta < -0.5) return 'Bearish';
    return 'Neutral';
  };

  const getStrategyType = legs => {
    if (legs.length === 1) return 'Single Option';
    if (legs.length === 2) {
      const [leg1, leg2] = legs;
      if (leg1.type === leg2.type && leg1.quantity === -leg2.quantity) {
        return 'Spread';
      }
      if (leg1.type !== leg2.type && leg1.strike === leg2.strike) {
        return 'Straddle';
      }
    }
    return 'Complex Strategy';
  };

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Target className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Options Strategy Builder</h3>
            <p className="text-xs text-slate-400">
              {underlyingSymbol} @ {formatCurrency(underlyingPrice)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={strategyName}
            onChange={e => setStrategyName(e.target.value)}
            className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            placeholder="Strategy name"
          />
          <button
            onClick={calculateStrategy}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Recalculate"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Market Parameters */}
      <div className="p-4 border-b border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Volatility</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.01"
                value={marketParams.volatility}
                onChange={e =>
                  setMarketParams({ ...marketParams, volatility: parseFloat(e.target.value) })
                }
                className="flex-1"
              />
              <span className="text-sm text-white w-12">
                {formatPercent(marketParams.volatility)}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Risk-Free Rate</label>
            <input
              type="number"
              value={marketParams.riskFreeRate}
              onChange={e =>
                setMarketParams({ ...marketParams, riskFreeRate: parseFloat(e.target.value) })
              }
              step="0.001"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Dividend Yield</label>
            <input
              type="number"
              value={marketParams.dividendYield}
              onChange={e =>
                setMarketParams({ ...marketParams, dividendYield: parseFloat(e.target.value) })
              }
              step="0.001"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Strategy Legs */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-white">Strategy Legs</h4>
          <button
            onClick={addLeg}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            aria-label="Add leg"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {legs.map((leg, index) => (
            <div key={leg.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
              <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type</label>
                  <select
                    value={leg.type}
                    onChange={e => updateLeg(leg.id, 'type', e.target.value)}
                    className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-xs"
                  >
                    <option value="call">Call</option>
                    <option value="put">Put</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Strike</label>
                  <input
                    type="number"
                    value={leg.strike}
                    onChange={e => updateLeg(leg.id, 'strike', e.target.value)}
                    step="0.01"
                    className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={leg.quantity}
                    onChange={e => updateLeg(leg.id, 'quantity', e.target.value)}
                    step="1"
                    className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Expiry</label>
                  <select
                    value={leg.timeToExpiry}
                    onChange={e => updateLeg(leg.id, 'timeToExpiry', e.target.value)}
                    className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-xs"
                  >
                    <option value={0.0833}>1M</option>
                    <option value={0.25}>3M</option>
                    <option value={0.5}>6M</option>
                    <option value={1}>1Y</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Premium</label>
                  <div className="text-xs text-white font-medium">
                    {strategyResult?.legs?.[index]?.adjustedPrice
                      ? formatCurrency(strategyResult.legs[index].adjustedPrice)
                      : '—'}
                  </div>
                </div>
              </div>

              {legs.length > 1 && (
                <button
                  onClick={() => removeLeg(leg.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                  aria-label="Remove leg"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg m-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Strategy Analysis */}
      {strategyResult && strategyAnalysis && (
        <div className="p-4 space-y-6">
          {/* Strategy Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Total Premium</div>
              <div
                className={`text-2xl font-bold ${parseFloat(strategyAnalysis.totalPremium.replace(/[$,]/g, '')) > 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {strategyAnalysis.totalPremium}
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Strategy Type</div>
              <div className="text-lg font-semibold text-blue-400">{getStrategyType(legs)}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Position</div>
              <div className="text-lg font-semibold text-purple-400">
                {getPositionType(strategyResult.legs)}
              </div>
            </div>
          </div>

          {/* Greeks */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Net Greeks
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div
                  className={`text-lg font-bold ${parseFloat(strategyAnalysis.netDelta) > 0 ? 'text-green-400' : parseFloat(strategyAnalysis.netDelta) < 0 ? 'text-red-400' : 'text-blue-400'}`}
                >
                  {strategyAnalysis.netDelta}
                </div>
                <div className="text-xs text-slate-400">Delta</div>
              </div>
              <div className="text-center">
                <div
                  className={`text-lg font-bold ${parseFloat(strategyAnalysis.netGamma) > 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {strategyAnalysis.netGamma}
                </div>
                <div className="text-xs text-slate-400">Gamma</div>
              </div>
              <div className="text-center">
                <div
                  className={`text-lg font-bold ${parseFloat(strategyAnalysis.netVega) > 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {strategyAnalysis.netVega}
                </div>
                <div className="text-xs text-slate-400">Vega</div>
              </div>
              <div className="text-center">
                <div
                  className={`text-lg font-bold ${parseFloat(strategyAnalysis.netTheta) < 0 ? 'text-red-400' : 'text-green-400'}`}
                >
                  {strategyAnalysis.netTheta}
                </div>
                <div className="text-xs text-slate-400">Theta</div>
              </div>
              <div className="text-center">
                <div
                  className={`text-lg font-bold ${parseFloat(strategyAnalysis.netRho.replace(/[$,]/g, '')) > 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {strategyAnalysis.netRho}
                </div>
                <div className="text-xs text-slate-400">Rho</div>
              </div>
            </div>
          </div>

          {/* Risk Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Max Profit</div>
              <div className="text-lg font-semibold text-green-400">
                {strategyAnalysis.maxProfit}
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Max Loss</div>
              <div className="text-lg font-semibold text-red-400">{strategyAnalysis.maxLoss}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Breakeven</div>
              <div className="text-sm font-semibold text-blue-400">
                {strategyAnalysis.breakevenPoints.length > 0
                  ? strategyAnalysis.breakevenPoints.join(', ')
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
          <span className="ml-3 text-slate-300">Building strategy...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !strategyResult && !error && (
        <div className="p-8 text-center">
          <Target className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h4 className="text-slate-400 mb-2">Build Your Options Strategy</h4>
          <p className="text-sm text-slate-500">
            Add options legs and adjust parameters to analyze complex strategies.
          </p>
        </div>
      )}
    </div>
  );
};

export default OptionsStrategyBuilder;
