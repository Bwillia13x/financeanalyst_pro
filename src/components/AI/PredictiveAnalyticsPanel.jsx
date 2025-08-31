import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  LineChart,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

import advancedAIService from '../../services/ai/advancedAIService';

const PredictiveAnalyticsPanel = ({
  data,
  metric = 'revenue',
  onPredictionUpdate,
  className = '',
  showUncertainty = true,
  predictionHorizon = 12
}) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(predictionHorizon);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);

  // Load predictions when data changes
  useEffect(() => {
    if (data && data.length > 0) {
      loadPredictions();
    }
  }, [data, selectedTimeframe, confidenceThreshold]);

  const loadPredictions = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await advancedAIService.predictFinancialMetrics(data, {
        horizon: selectedTimeframe,
        confidence: confidenceThreshold,
        includeUncertainty: showUncertainty,
        metric
      });

      setPredictions(result.predictions || []);
      onPredictionUpdate?.(result);
    } catch (err) {
      setError('Failed to generate predictions');
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate prediction statistics
  const predictionStats = useMemo(() => {
    if (!predictions.length) return null;

    const validPredictions = predictions.filter(p => p.confidence >= confidenceThreshold);
    const avgConfidence =
      validPredictions.reduce((sum, p) => sum + p.confidence, 0) / validPredictions.length;
    const trend =
      predictions.length > 1
        ? ((predictions[predictions.length - 1].value - predictions[0].value) /
            predictions[0].value) *
          100
        : 0;

    return {
      totalPredictions: predictions.length,
      validPredictions: validPredictions.length,
      avgConfidence,
      trend,
      currentValue: data[data.length - 1] || 0
    };
  }, [predictions, confidenceThreshold, data]);

  // Format currency values
  const formatValue = value => {
    if (typeof value !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Get confidence color
  const getConfidenceColor = confidence => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get trend icon and color
  const getTrendInfo = trend => {
    if (trend > 5) return { icon: TrendingUp, color: 'text-green-400', direction: 'up' };
    if (trend < -5) return { icon: TrendingDown, color: 'text-red-400', direction: 'down' };
    return { icon: Target, color: 'text-blue-400', direction: 'stable' };
  };

  const trendInfo = predictionStats ? getTrendInfo(predictionStats.trend) : null;

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Predictive Analytics</h3>
            <p className="text-xs text-slate-400 capitalize">{metric} Forecasting</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTimeframe}
            onChange={e => setSelectedTimeframe(parseInt(e.target.value))}
            className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white"
          >
            <option value={6}>6 Months</option>
            <option value={12}>12 Months</option>
            <option value={24}>24 Months</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Generating predictions...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg m-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && predictionStats && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-slate-700">
            <div className="text-center">
              <div className="text-xl font-bold text-white">
                {formatValue(predictionStats.currentValue)}
              </div>
              <div className="text-xs text-slate-400">Current Value</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">
                {formatValue(predictions[0]?.value)}
              </div>
              <div className="text-xs text-slate-400">Next Period</div>
            </div>
            <div className="text-center">
              <div
                className={`text-xl font-bold ${getConfidenceColor(predictionStats.avgConfidence)}`}
              >
                {(predictionStats.avgConfidence * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-slate-400">Avg Confidence</div>
            </div>
            <div className="text-center">
              <div className={`flex items-center justify-center gap-1`}>
                {trendInfo && <trendInfo.icon className={`w-4 h-4 ${trendInfo.color}`} />}
                <span className={`text-xl font-bold ${trendInfo.color}`}>
                  {predictionStats.trend > 0 ? '+' : ''}
                  {predictionStats.trend.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-slate-400">Trend</div>
            </div>
          </div>

          {/* Prediction Chart Preview */}
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <LineChart className="w-5 h-5 text-blue-400" />
              <h4 className="text-sm font-semibold text-white">Prediction Timeline</h4>
            </div>

            <div className="space-y-2">
              {predictions.slice(0, 6).map((prediction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-slate-300" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        Period {prediction.period}
                      </div>
                      <div className="text-xs text-slate-400">{formatValue(prediction.value)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {showUncertainty && prediction.upperBound && prediction.lowerBound && (
                      <div className="text-xs text-slate-400 text-right">
                        <div>{formatValue(prediction.upperBound)}</div>
                        <div>{formatValue(prediction.lowerBound)}</div>
                      </div>
                    )}

                    <div
                      className={`flex items-center gap-1 ${getConfidenceColor(prediction.confidence)}`}
                    >
                      {prediction.confidence >= 0.8 ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <span className="text-xs font-medium">
                        {(prediction.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Uncertainty Analysis */}
          {showUncertainty && predictions.some(p => p.upperBound && p.lowerBound) && (
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <BarChart3 className="w-5 h-5 text-orange-400" />
                <h4 className="text-sm font-semibold text-white">Uncertainty Analysis</h4>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-slate-300">
                  Predictions include uncertainty bounds based on historical volatility and
                  confidence levels.
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Best Case</div>
                    <div className="text-lg font-bold text-green-400">
                      {formatValue(Math.max(...predictions.map(p => p.upperBound || p.value)))}
                    </div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Worst Case</div>
                    <div className="text-lg font-bold text-red-400">
                      {formatValue(Math.min(...predictions.map(p => p.lowerBound || p.value)))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300">Confidence Threshold</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  value={confidenceThreshold}
                  onChange={e => setConfidenceThreshold(parseFloat(e.target.value))}
                  min="0.1"
                  max="0.9"
                  step="0.1"
                  className="w-20"
                />
                <span className="text-xs text-slate-400 w-8">
                  {(confidenceThreshold * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && !error && (!data || data.length === 0) && (
        <div className="p-8 text-center">
          <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h4 className="text-slate-400 mb-2">No Data Available</h4>
          <p className="text-sm text-slate-500">
            Add financial data to generate predictions and insights.
          </p>
        </div>
      )}
    </div>
  );
};

export default PredictiveAnalyticsPanel;
