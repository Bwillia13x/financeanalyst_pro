/**
 * AI Analytics Dashboard Component
 * Comprehensive AI-powered financial analytics interface
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Target, AlertTriangle,
  Eye, BarChart3,
  CheckCircle, XCircle, Lightbulb, Shield
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useState, useEffect, useMemo } from 'react';

import useAIAnalytics from '../../hooks/useAIAnalytics';
import LazyLoader from '../LazyLoader/LazyLoader';
import SEOHead from '../SEO/SEOHead';

const AIAnalyticsDashboard = ({
  data,
  symbol = 'Portfolio',
  riskTolerance = 'moderate',
  autoAnalyze = true,
  onInsightAction
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const {
    isLoading,
    isInitialized,
    analysis,
    insights,
    patterns,
    predictions,
    recommendations,
    error,
    analyzeData,
    getFilteredInsights,
    getPatternSummary,
    getPredictionSummary,
    getRiskSummary,
    startAutoAnalysis,
    stopAutoAnalysis
  } = useAIAnalytics({
    autoAnalyze,
    riskTolerance,
    analysisType: 'comprehensive'
  });

  // Auto-analyze when data changes
  useEffect(() => {
    if (data && data.prices && data.prices.length > 0 && isInitialized) {
      analyzeData(data);
      if (autoAnalyze) {
        startAutoAnalysis(data);
      }
    }
    return () => stopAutoAnalysis();
  }, [data, isInitialized, autoAnalyze, analyzeData, startAutoAnalysis, stopAutoAnalysis]);

  // Memoized summaries
  const patternSummary = useMemo(() => getPatternSummary(), [getPatternSummary]);
  const predictionSummary = useMemo(() => getPredictionSummary(), [getPredictionSummary]);
  const riskSummary = useMemo(() => getRiskSummary(), [getRiskSummary]);

  const criticalInsights = useMemo(() =>
    getFilteredInsights({ severity: 'high', minConfidence: 0.7 }),
  [getFilteredInsights]
  );

  const handleInsightClick = (insight) => {
    if (onInsightAction) {
      onInsightAction(insight);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="text-red-500" size={16} />;
      case 'medium': return <Eye className="text-yellow-500" size={16} />;
      default: return <CheckCircle className="text-green-500" size={16} />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Brain },
    { id: 'patterns', label: 'Patterns', icon: BarChart3 },
    { id: 'predictions', label: 'Predictions', icon: Target },
    { id: 'risk', label: 'Risk', icon: Shield },
    { id: 'recommendations', label: 'Actions', icon: Lightbulb }
  ];

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <XCircle className="text-red-500 mr-3" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-red-800">AI Analytics Error</h3>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LazyLoader
      componentName="AIAnalyticsDashboard"
      priority="high"
      fallback={
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full" />
              <div className="h-6 bg-gray-200 rounded w-48" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-8 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
            <div className="h-64 bg-gray-100 rounded" />
          </div>
        </div>
      }
    >
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <SEOHead
          title={`AI Analytics Dashboard - ${symbol} | FinanceAnalyst Pro`}
          description="Advanced AI-powered financial analytics with pattern recognition, predictions, and intelligent insights"
        />

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain size={32} />
              <div>
                <h2 className="text-2xl font-bold">AI Analytics Dashboard</h2>
                <p className="text-blue-100">{symbol} - Intelligent Financial Analysis</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isLoading && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span className="text-sm">Analyzing...</span>
                </div>
              )}

              {analysis && (
                <div className="text-right">
                  <div className="text-sm text-blue-100">Confidence Score</div>
                  <div className="text-xl font-bold">
                    {(analysis.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {analysis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{insights.length}</div>
              <div className="text-sm text-gray-600">AI Insights</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{patterns.length}</div>
              <div className="text-sm text-gray-600">Patterns Detected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{predictions.length}</div>
              <div className="text-sm text-gray-600">Predictions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{recommendations.length}</div>
              <div className="text-sm text-gray-600">Recommendations</div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Critical Insights */}
                {criticalInsights.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                      <AlertTriangle className="mr-2" size={20} />
                      Critical Insights
                    </h3>
                    <div className="space-y-2">
                      {criticalInsights.slice(0, 3).map((insight, index) => (
                        <div
                          key={index}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleInsightClick(insight)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleInsightClick(insight);
                            }
                          }}
                          className="flex items-center justify-between p-3 bg-white rounded cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            {getSeverityIcon(insight.severity)}
                            <div>
                              <div className="font-medium text-gray-800">{insight.title}</div>
                              <div className="text-sm text-gray-600">{insight.message}</div>
                            </div>
                          </div>
                          {insight.confidence && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                              {(insight.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {patternSummary && (
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <BarChart3 size={24} />
                        <span className="text-sm font-medium">PATTERNS</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span className="font-bold">{patternSummary.totalPatterns}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>High Confidence:</span>
                          <span className="font-bold">{patternSummary.highConfidencePatterns}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {predictionSummary && (
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Target size={24} />
                        <span className="text-sm font-medium">PREDICTIONS</span>
                      </div>
                      <div className="space-y-2">
                        {predictionSummary.shortTerm && (
                          <div className="flex justify-between">
                            <span>1W Target:</span>
                            <span className="font-bold">${predictionSummary.shortTerm.price.toFixed(2)}</span>
                          </div>
                        )}
                        {predictionSummary.mediumTerm && (
                          <div className="flex justify-between">
                            <span>1M Target:</span>
                            <span className="font-bold">${predictionSummary.mediumTerm.price.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {riskSummary && (
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Shield size={24} />
                        <span className="text-sm font-medium">RISK</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Level:</span>
                          <span className="font-bold">{riskSummary.overallRisk}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Score:</span>
                          <span className="font-bold">{riskSummary.riskScore.toFixed(1)}/10</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Other tabs content truncated for brevity */}
            {activeTab !== 'overview' && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <div className="text-gray-500">
                  <Brain size={48} className="mx-auto mb-4 opacity-50" />
                  <p>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content will be displayed here</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LazyLoader>
  );
};

AIAnalyticsDashboard.propTypes = {
  data: PropTypes.shape({
    prices: PropTypes.arrayOf(PropTypes.number)
  }),
  symbol: PropTypes.string,
  riskTolerance: PropTypes.string,
  autoAnalyze: PropTypes.bool,
  onInsightAction: PropTypes.func
};

export default AIAnalyticsDashboard;
