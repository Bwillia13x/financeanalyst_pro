import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calculator,
  Settings,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  Calendar,
  Target,
  Zap
} from 'lucide-react';

import derivativesService from '../../services/financial/derivativesService';

const DerivativesAnalysisDashboard = ({
  underlyingSymbol = 'AAPL',
  underlyingPrice = 150,
  onDerivativeCalculated,
  className = ''
}) => {
  const [derivativeType, setDerivativeType] = useState('forward');
  const [derivativeParams, setDerivativeParams] = useState({
    // Forward/Futures
    type: 'forward',
    contractSize: 100,
    strikePrice: 155,
    timeToDelivery: 0.25,
    riskFreeRate: 0.05,
    dividendYield: 0.02,
    storageCosts: 0.01,
    convenienceYield: 0.005,

    // Swaps
    notionalPrincipal: 1000000,
    fixedRate: 0.055,
    floatingRate: 0.045,
    paymentFrequency: 4, // quarterly
    timeToMaturity: 2,
    spread: 0.002
  });

  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate derivative value when parameters change
  useEffect(() => {
    calculateDerivativeValue();
  }, [derivativeType, derivativeParams]);

  const calculateDerivativeValue = async () => {
    setLoading(true);
    setError(null);

    try {
      let result;

      if (derivativeType === 'forward' || derivativeType === 'futures') {
        const contract = {
          type: derivativeType,
          underlyingAsset: underlyingSymbol,
          contractSize: derivativeParams.contractSize,
          spotPrice: underlyingPrice,
          strikePrice: derivativeParams.strikePrice,
          timeToDelivery: derivativeParams.timeToDelivery,
          riskFreeRate: derivativeParams.riskFreeRate,
          dividendYield: derivativeParams.dividendYield,
          storageCosts: derivativeParams.storageCosts,
          convenienceYield: derivativeParams.convenienceYield
        };

        result = derivativesService.forwardContractPricing(contract);
      } else if (derivativeType === 'swap') {
        const swap = {
          type: 'interest_rate',
          notionalPrincipal: derivativeParams.notionalPrincipal,
          fixedRate: derivativeParams.fixedRate,
          floatingRate: derivativeParams.floatingRate,
          paymentFrequency: derivativeParams.paymentFrequency,
          timeToMaturity: derivativeParams.timeToMaturity,
          riskFreeRate: derivativeParams.riskFreeRate,
          spread: derivativeParams.spread
        };

        result = derivativesService.swapValuation(swap);
      }

      setAnalysisResult(result);
      onDerivativeCalculated?.(result);
    } catch (err) {
      setError(err.message);
      console.error('Derivative calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleParamChange = (param, value) => {
    setDerivativeParams(prev => ({
      ...prev,
      [param]: parseFloat(value) || value
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

  const formatPercent = value => {
    return (value * 100).toFixed(2) + '%';
  };

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    if (!analysisResult) return null;

    if (derivativeType === 'forward' || derivativeType === 'futures') {
      const { forwardPrice, theoreticalValue, intrinsicValue, timeValue, sensitivities } =
        analysisResult;
      return {
        primaryValue: formatCurrency(theoreticalValue),
        primaryLabel: 'Theoretical Value',
        secondaryValue: formatCurrency(forwardPrice),
        secondaryLabel: 'Forward Price',
        intrinsicValue: formatCurrency(intrinsicValue),
        timeValue: formatCurrency(timeValue),
        delta: sensitivities.delta.toFixed(4),
        rho: formatCurrency(sensitivities.rho)
      };
    } else if (derivativeType === 'swap') {
      const { swapValue, pvFixed, pvFloating, duration, convexity } = analysisResult;
      return {
        primaryValue: formatCurrency(swapValue),
        primaryLabel: 'Swap Value',
        secondaryValue: formatCurrency(pvFloating - pvFixed),
        secondaryLabel: 'Net Present Value',
        fixedPV: formatCurrency(pvFixed),
        floatingPV: formatCurrency(pvFloating),
        duration: duration.toFixed(2) + ' years',
        convexity: convexity.toFixed(4)
      };
    }

    return null;
  }, [analysisResult, derivativeType]);

  const getValueColor = value => {
    const numValue = parseFloat(value.replace(/[$,%]/g, ''));
    if (numValue > 0) return 'text-green-400';
    if (numValue < 0) return 'text-red-400';
    return 'text-blue-400';
  };

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Calculator className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Derivatives Analysis</h3>
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
            onClick={calculateDerivativeValue}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Recalculate"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Derivative Type Selection */}
      <div className="p-4 border-b border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Derivative Type</label>
            <select
              value={derivativeType}
              onChange={e => setDerivativeType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            >
              <option value="forward">Forward Contract</option>
              <option value="futures">Futures Contract</option>
              <option value="swap">Interest Rate Swap</option>
            </select>
          </div>

          {/* Dynamic parameters based on derivative type */}
          {derivativeType === 'forward' || derivativeType === 'futures' ? (
            <>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Contract Size</label>
                <input
                  type="number"
                  value={derivativeParams.contractSize}
                  onChange={e => handleParamChange('contractSize', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Strike Price</label>
                <input
                  type="number"
                  value={derivativeParams.strikePrice}
                  onChange={e => handleParamChange('strikePrice', e.target.value)}
                  step="0.01"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Notional Principal</label>
                <input
                  type="number"
                  value={derivativeParams.notionalPrincipal}
                  onChange={e => handleParamChange('notionalPrincipal', e.target.value)}
                  step="100000"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Fixed Rate</label>
                <input
                  type="number"
                  value={derivativeParams.fixedRate}
                  onChange={e => handleParamChange('fixedRate', e.target.value)}
                  step="0.001"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                />
              </div>
            </>
          )}
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

      {/* Results */}
      {analysisResult && keyMetrics && (
        <div className="p-4 space-y-6">
          {/* Primary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">{keyMetrics.primaryLabel}</span>
                <Target className="w-4 h-4 text-blue-400" />
              </div>
              <div className={`text-2xl font-bold ${getValueColor(keyMetrics.primaryValue)}`}>
                {keyMetrics.primaryValue}
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">{keyMetrics.secondaryLabel}</span>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className={`text-2xl font-bold ${getValueColor(keyMetrics.secondaryValue)}`}>
                {keyMetrics.secondaryValue}
              </div>
            </div>
          </div>

          {/* Derivative-specific metrics */}
          {(derivativeType === 'forward' || derivativeType === 'futures') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Intrinsic Value</div>
                <div
                  className={`text-lg font-semibold ${getValueColor(keyMetrics.intrinsicValue)}`}
                >
                  {keyMetrics.intrinsicValue}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Time Value</div>
                <div className={`text-lg font-semibold ${getValueColor(keyMetrics.timeValue)}`}>
                  {keyMetrics.timeValue}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Delta</div>
                <div className="text-lg font-semibold text-blue-400">{keyMetrics.delta}</div>
              </div>
            </div>
          )}

          {derivativeType === 'swap' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">Present Values</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-300">Fixed Leg PV</span>
                    <span className="text-sm text-white">{keyMetrics.fixedPV}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-300">Floating Leg PV</span>
                    <span className="text-sm text-white">{keyMetrics.floatingPV}</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">Risk Metrics</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-300">Duration</span>
                    <span className="text-sm text-white">{keyMetrics.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-300">Convexity</span>
                    <span className="text-sm text-white">{keyMetrics.convexity}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Parameters */}
          {showAdvanced && (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-4">Advanced Parameters</h4>

              {derivativeType === 'forward' || derivativeType === 'futures' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Time to Delivery</label>
                    <select
                      value={derivativeParams.timeToDelivery}
                      onChange={e => handleParamChange('timeToDelivery', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    >
                      <option value={0.0833}>1 Month</option>
                      <option value={0.25}>3 Months</option>
                      <option value={0.5}>6 Months</option>
                      <option value={1}>1 Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Risk-Free Rate</label>
                    <input
                      type="number"
                      value={derivativeParams.riskFreeRate}
                      onChange={e => handleParamChange('riskFreeRate', e.target.value)}
                      step="0.001"
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Dividend Yield</label>
                    <input
                      type="number"
                      value={derivativeParams.dividendYield}
                      onChange={e => handleParamChange('dividendYield', e.target.value)}
                      step="0.001"
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Time to Maturity</label>
                    <select
                      value={derivativeParams.timeToMaturity}
                      onChange={e => handleParamChange('timeToMaturity', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    >
                      <option value={1}>1 Year</option>
                      <option value={2}>2 Years</option>
                      <option value={5}>5 Years</option>
                      <option value={10}>10 Years</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Payment Frequency</label>
                    <select
                      value={derivativeParams.paymentFrequency}
                      onChange={e => handleParamChange('paymentFrequency', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    >
                      <option value={1}>Annual</option>
                      <option value={2}>Semi-Annual</option>
                      <option value={4}>Quarterly</option>
                      <option value={12}>Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Spread (bps)</label>
                    <input
                      type="number"
                      value={derivativeParams.spread * 10000}
                      onChange={e => handleParamChange('spread', e.target.value / 10000)}
                      step="1"
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-slate-300">Calculating derivative value...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !analysisResult && !error && (
        <div className="p-8 text-center">
          <Calculator className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h4 className="text-slate-400 mb-2">Select Derivative Parameters</h4>
          <p className="text-sm text-slate-500">
            Choose a derivative type and adjust parameters to see the analysis.
          </p>
        </div>
      )}
    </div>
  );
};

export default DerivativesAnalysisDashboard;
