import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, BarChart3, Brain, ChevronDown, ChevronRight, Lightbulb, PieChart, RefreshCw, Shield, Sparkles, Target, TrendingUp, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import aiInsightsService from '../../services/aiInsightsService';
import Button from '../ui/Button';

/**
 * AI-powered insights panel providing intelligent financial analysis
 */

const AIInsightsPanel = ({
  financialData,
  industry = 'technology',
  onInsightClick,
  className = ''
}) => {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState(new Set(['summary']));

  useEffect(() => {
    if (financialData) {
      generateInsights();
    }
  }, [financialData, industry]);

  const generateInsights = async() => {
    setIsLoading(true);
    setError(null);

    try {
      const options = {
        industry,
        analysisTypes: ['revenue', 'profitability', 'valuation', 'risk', 'growth', 'efficiency'],
        includeRecommendations: true,
        confidenceThreshold: 0.7
      };

      const generatedInsights = await aiInsightsService.generateInsights(financialData, options);
      setInsights(generatedInsights);
    } catch (err) {
      setError(err.message);
      console.error('Failed to generate insights:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence > 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence > 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent': return 'text-green-600 dark:text-green-400';
      case 'good': return 'text-blue-600 dark:text-blue-400';
      case 'fair': return 'text-yellow-600 dark:text-yellow-400';
      case 'poor': return 'text-red-600 dark:text-red-400';
      default: return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'high': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'medium': return <BarChart3 className="w-4 h-4 text-yellow-600" />;
      case 'low': return <Activity className="w-4 h-4 text-blue-600" />;
      default: return <PieChart className="w-4 h-4 text-slate-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Generating AI Insights...
          </h3>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            AI Insights Error
          </h3>
        </div>
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button variant="outline" onClick={generateInsights}>
          Retry Analysis
        </Button>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">
            Add financial data to generate AI insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                AI Financial Insights
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Generated {new Date(insights.generatedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 ${getConfidenceColor(insights.confidence)}`}>
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">
                {Math.round(insights.confidence * 100)}% confidence
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={generateInsights}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="p-6">
        <button
          onClick={() => toggleSection('summary')}
          className="flex items-center justify-between w-full text-left mb-4"
        >
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
            Executive Summary
          </h4>
          {expandedSections.has('summary') ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
        </button>

        <AnimatePresence>
          {expandedSections.has('summary') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      Financial Health
                    </span>
                  </div>
                  <span className={`text-lg font-bold capitalize ${getHealthColor(insights.summary.overallHealth)}`}>
                    {insights.summary.overallHealth}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      Key Opportunities
                    </span>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {insights.opportunities.length}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Insights by Category */}
      <div className="border-t border-slate-200 dark:border-slate-700">
        {Object.entries(insights.analyses).map(([category, analysis]) => (
          <div key={category} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
            <button
              onClick={() => toggleSection(category)}
              className="flex items-center justify-between w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-1 rounded ${analysis.priority === 'high' ? 'bg-red-100 dark:bg-red-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
                  {category === 'revenue' && <TrendingUp className="w-4 h-4" />}
                  {category === 'profitability' && <BarChart3 className="w-4 h-4" />}
                  {category === 'valuation' && <PieChart className="w-4 h-4" />}
                  {category === 'risk' && <Shield className="w-4 h-4" />}
                  {category === 'growth' && <Zap className="w-4 h-4" />}
                  {category === 'efficiency' && <Activity className="w-4 h-4" />}
                </div>
                <div>
                  <h5 className="font-medium text-slate-900 dark:text-white capitalize">
                    {category} Analysis
                  </h5>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {analysis.analysis.insights?.length || 0} insights
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full ${analysis.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                  {analysis.priority}
                </span>
                {expandedSections.has(category) ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {expandedSections.has(category) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-4"
                >
                  {/* Analysis Insights */}
                  {analysis.analysis.insights && (
                    <div className="space-y-2 mb-4">
                      {analysis.analysis.insights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {insight}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <h6 className="font-medium text-slate-900 dark:text-white text-sm">
                        Recommendations
                      </h6>
                      {analysis.suggestions.map((suggestion, index) => (
                        <button
                          type="button"
                          key={index}
                          className="flex items-start space-x-3 w-full text-left p-3 bg-slate-50 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                          onClick={() => onInsightClick?.(suggestion)}
                        >
                          {getImpactIcon(suggestion.impact)}
                          <div className="flex-1">
                            <h6 className="font-medium text-slate-900 dark:text-white text-sm">
                              {suggestion.title}
                            </h6>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              {suggestion.description}
                            </p>
                            <div className="flex items-center space-x-3 mt-2 text-xs">
                              <span className="text-slate-500 dark:text-slate-400">
                                Impact: <span className="font-medium">{suggestion.impact}</span>
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">
                                Effort: <span className="font-medium">{suggestion.effort}</span>
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">
                                Timeline: <span className="font-medium">{suggestion.timeframe}</span>
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onInsightClick?.('generate_report')}
            className="flex items-center space-x-2"
          >
            <Brain className="w-4 h-4" />
            <span>Generate Report</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={generateInsights}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPanel;
