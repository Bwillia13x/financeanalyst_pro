import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

import advancedAIService from '../../services/ai/advancedAIService';

const AIInsightsDashboard = ({
  data,
  context = {},
  onInsightAction,
  className = '',
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [insights, setInsights] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Configuration state
  const [config, setConfig] = useState({
    enablePredictions: true,
    enableAnomalies: true,
    enableSentiment: true,
    predictionHorizon: 12,
    anomalySensitivity: 0.7,
    showConfidence: true
  });

  // Initialize AI service
  useEffect(() => {
    const initializeAI = async () => {
      try {
        await advancedAIService.initialize();
        await loadInsights();
      } catch (err) {
        setError('Failed to initialize AI service');
        console.error('AI initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAI();
  }, []);

  // Auto-refresh insights
  useEffect(() => {
    if (!autoRefresh || loading) return;

    const interval = setInterval(() => {
      loadInsights();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loading]);

  // Load all AI insights
  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const results = await Promise.allSettled([
        config.enablePredictions
          ? advancedAIService.predictFinancialMetrics(data, {
              horizon: config.predictionHorizon
            })
          : Promise.resolve(null),
        config.enableAnomalies
          ? advancedAIService.detectAnomalies(data, {
              sensitivity: config.anomalySensitivity
            })
          : Promise.resolve(null),
        config.enableSentiment && context.text
          ? advancedAIService.analyzeSentiment(context.text)
          : Promise.resolve(null),
        advancedAIService.generateInsights(data, context)
      ]);

      // Process predictions
      if (results[0].status === 'fulfilled' && results[0].value) {
        setPredictions(results[0].value.predictions || []);
      }

      // Process anomalies
      if (results[1].status === 'fulfilled' && results[1].value) {
        setAnomalies(results[1].value.anomalies || []);
      }

      // Process sentiment
      if (results[2].status === 'fulfilled' && results[2].value) {
        setSentiment(results[2].value);
      }

      // Process general insights
      if (results[3].status === 'fulfilled' && results[3].value) {
        setInsights(results[3].value.insights || []);
      }

      setLastUpdate(new Date());
    } catch (err) {
      setError('Failed to load AI insights');
      console.error('AI insights error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    loadInsights();
  };

  // Handle insight action
  const handleInsightAction = (insight, action) => {
    onInsightAction?.(insight, action);

    // Send feedback to AI service for learning
    window.dispatchEvent(
      new CustomEvent('ai-feedback', {
        detail: {
          type: 'insight_action',
          data: insight,
          feedback: { action, timestamp: Date.now() }
        }
      })
    );
  };

  // Get insight priority color
  const getInsightPriorityColor = insight => {
    if (insight.confidence > 0.8) return 'text-red-400 border-red-500/30';
    if (insight.confidence > 0.6) return 'text-yellow-400 border-yellow-500/30';
    return 'text-blue-400 border-blue-500/30';
  };

  // Get sentiment color
  const getSentimentColor = sentiment => {
    switch (sentiment?.sentiment) {
      case 'positive':
        return 'text-green-400';
      case 'negative':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalInsights = insights.length;
    const highConfidence = insights.filter(i => i.confidence > 0.8).length;
    const anomaliesCount = anomalies.length;
    const avgPredictionConfidence =
      predictions.length > 0
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
        : 0;

    return {
      totalInsights,
      highConfidence,
      anomaliesCount,
      avgPredictionConfidence
    };
  }, [insights, anomalies, predictions]);

  if (loading && !lastUpdate) {
    return (
      <div className={`bg-slate-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-slate-300">Loading AI insights...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Lightbulb className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Insights</h3>
            {lastUpdate && (
              <p className="text-xs text-slate-400">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-slate-700 bg-slate-900/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enablePredictions}
                  onChange={e => setConfig({ ...config, enablePredictions: e.target.checked })}
                  className="rounded border-slate-600"
                />
                <span className="text-sm text-slate-300">Predictions</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableAnomalies}
                  onChange={e => setConfig({ ...config, enableAnomalies: e.target.checked })}
                  className="rounded border-slate-600"
                />
                <span className="text-sm text-slate-300">Anomaly Detection</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.enableSentiment}
                  onChange={e => setConfig({ ...config, enableSentiment: e.target.checked })}
                  className="rounded border-slate-600"
                />
                <span className="text-sm text-slate-300">Sentiment Analysis</span>
              </label>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Prediction Horizon (months)
                </label>
                <input
                  type="number"
                  value={config.predictionHorizon}
                  onChange={e =>
                    setConfig({ ...config, predictionHorizon: parseInt(e.target.value) })
                  }
                  min="1"
                  max="24"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Anomaly Sensitivity</label>
                <input
                  type="range"
                  value={config.anomalySensitivity}
                  onChange={e =>
                    setConfig({ ...config, anomalySensitivity: parseFloat(e.target.value) })
                  }
                  min="0.1"
                  max="0.9"
                  step="0.1"
                  className="w-full"
                />
                <span className="text-xs text-slate-400">{config.anomalySensitivity}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-slate-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{summaryStats.totalInsights}</div>
          <div className="text-xs text-slate-400">Insights</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{summaryStats.highConfidence}</div>
          <div className="text-xs text-slate-400">High Confidence</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{summaryStats.anomaliesCount}</div>
          <div className="text-xs text-slate-400">Anomalies</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">
            {summaryStats.avgPredictionConfidence > 0
              ? (summaryStats.avgPredictionConfidence * 100).toFixed(0)
              : 0}
            %
          </div>
          <div className="text-xs text-slate-400">Prediction Confidence</div>
        </div>
      </div>

      {/* Content */}
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

        {/* Sentiment Analysis */}
        {sentiment && config.enableSentiment && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h4 className="text-sm font-semibold text-white">Market Sentiment</h4>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-2xl font-bold ${getSentimentColor(sentiment)}`}>
                {sentiment.sentiment?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"
                    style={{ width: `${sentiment.score * 100}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Confidence: {(sentiment.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Anomalies */}
        {anomalies.length > 0 && config.enableAnomalies && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <h4 className="text-sm font-semibold text-white">Detected Anomalies</h4>
            </div>
            <div className="space-y-2">
              {anomalies.slice(0, 3).map((anomaly, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-600/50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        anomaly.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                    />
                    <span className="text-sm text-slate-300">
                      {anomaly.type === 'spike' ? 'Spike' : 'Dip'} at index {anomaly.index}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Z-score: {anomaly.zScore?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4" />
              Key Insights
            </h4>
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getInsightPriorityColor(insight)} bg-slate-700/30`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-white">{insight.title}</h5>
                  <div className="flex items-center gap-2">
                    {config.showConfidence && (
                      <span className="text-xs bg-slate-600 px-2 py-1 rounded">
                        {(insight.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                    <div
                      className={`w-2 h-2 rounded-full ${
                        insight.type?.includes('positive')
                          ? 'bg-green-500'
                          : insight.type?.includes('negative')
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-sm text-slate-300 mb-3">{insight.description}</p>
                {insight.action && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInsightAction(insight, 'apply')}
                      className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
                    >
                      Apply Suggestion
                    </button>
                    <button
                      onClick={() => handleInsightAction(insight, 'dismiss')}
                      className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Predictions Preview */}
        {predictions.length > 0 && config.enablePredictions && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <LineChart className="w-5 h-5 text-purple-400" />
              <h4 className="text-sm font-semibold text-white">Predictions</h4>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-white">
                  {predictions[0]?.value?.toLocaleString() || 'N/A'}
                </div>
                <div className="text-xs text-slate-400">Next Period</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {predictions[5]?.value?.toLocaleString() || 'N/A'}
                </div>
                <div className="text-xs text-slate-400">6 Months</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {predictions[predictions.length - 1]?.value?.toLocaleString() || 'N/A'}
                </div>
                <div className="text-xs text-slate-400">12 Months</div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {insights.length === 0 &&
          anomalies.length === 0 &&
          predictions.length === 0 &&
          !loading && (
            <div className="text-center py-8">
              <EyeOff className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h4 className="text-slate-400 mb-2">No AI Insights Available</h4>
              <p className="text-sm text-slate-500">
                AI analysis will appear here once sufficient data is available.
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

export default AIInsightsDashboard;
