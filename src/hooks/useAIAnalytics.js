/**
 * useAIAnalytics Hook
 * React hook for integrating AI-powered financial analytics
 * Provides pattern recognition, predictions, and intelligent insights
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import aiAnalyticsService from '../services/aiAnalyticsService';
import { reportPerformanceMetric } from '../utils/performanceMonitoring';

export function useAIAnalytics(options = {}) {
  const {
    autoAnalyze = false,
    analysisInterval = 30000, // 30 seconds
    enableRealTimeInsights = true,
    riskTolerance = 'moderate',
    analysisType = 'comprehensive'
  } = options;

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [insights, setInsights] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [riskMetrics, setRiskMetrics] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);

  // Refs for cleanup and intervals
  const intervalRef = useRef(null);
  const analysisCountRef = useRef(0);

  /**
   * Initialize AI Analytics Service
   */
  const initialize = useCallback(async() => {
    if (isInitialized) return;

    try {
      setIsLoading(true);
      await aiAnalyticsService.initialize();
      setIsInitialized(true);
      setError(null);

      // Report initialization
      reportPerformanceMetric('ai_analytics_init', {
        success: true,
        timestamp: Date.now()
      });
    } catch (err) {
      setError(`Failed to initialize AI Analytics: ${err.message}`);
      reportPerformanceMetric('ai_analytics_init', {
        success: false,
        error: err.message,
        timestamp: Date.now()
      });
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  /**
   * Analyze financial data with AI
   */
  const analyzeData = useCallback(async(data, customOptions = {}) => {
    if (!isInitialized) {
      await initialize();
    }

    if (!data || !data.prices || data.prices.length === 0) {
      setError('Invalid or insufficient data for analysis');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const analysisOptions = {
        analysisType,
        riskTolerance,
        includePatterns: true,
        includePredictions: true,
        includeRiskAnalysis: true,
        ...customOptions
      };

      const startTime = Date.now();
      const result = await aiAnalyticsService.analyzeFinancialData(data, analysisOptions);
      const analysisTime = Date.now() - startTime;

      // Update state with results
      setAnalysis(result);
      setInsights(result.insights || []);
      setPatterns(result.patterns || []);
      setPredictions(result.predictions || []);
      setRiskMetrics(result.riskMetrics || {});
      setRecommendations(result.recommendations || []);

      // Track analysis performance
      analysisCountRef.current += 1;
      reportPerformanceMetric('ai_analysis_completed', {
        analysisTime,
        dataPoints: data.prices.length,
        insightsGenerated: result.insights.length,
        patternsDetected: result.patterns.length,
        predictionsGenerated: result.predictions.length,
        confidence: result.confidence,
        analysisCount: analysisCountRef.current,
        timestamp: Date.now()
      });

      return result;
    } catch (err) {
      const errorMessage = `AI Analysis failed: ${err.message}`;
      setError(errorMessage);

      reportPerformanceMetric('ai_analysis_error', {
        error: err.message,
        dataPoints: data.prices?.length || 0,
        timestamp: Date.now()
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, initialize, analysisType, riskTolerance]);

  /**
   * Get real-time insights for streaming data
   */
  const getRealtimeInsights = useCallback(async(streamingData) => {
    if (!isInitialized || isLoading) return [];

    try {
      // Quick analysis for real-time insights
      const quickAnalysis = await aiAnalyticsService.analyzeFinancialData(streamingData, {
        analysisType: 'quick',
        includePatterns: false,
        includePredictions: false,
        includeRiskAnalysis: true
      });

      return quickAnalysis.insights || [];
    } catch (err) {
      console.warn('Real-time insights failed:', err);
      return [];
    }
  }, [isInitialized, isLoading]);

  /**
   * Start automatic analysis with interval
   */
  const startAutoAnalysis = useCallback((data) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (data && data.prices && data.prices.length > 0) {
        analyzeData(data, { analysisType: 'quick' });
      }
    }, analysisInterval);
  }, [analyzeData, analysisInterval]);

  /**
   * Stop automatic analysis
   */
  const stopAutoAnalysis = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Get filtered insights by type and severity
   */
  const getFilteredInsights = useCallback((filters = {}) => {
    const { type, severity, minConfidence = 0 } = filters;

    return insights.filter(insight => {
      if (type && insight.type !== type) return false;
      if (severity && insight.severity !== severity) return false;
      if (insight.confidence && insight.confidence < minConfidence) return false;
      return true;
    });
  }, [insights]);

  /**
   * Get high-priority recommendations
   */
  const getHighPriorityRecommendations = useCallback(() => {
    return recommendations.filter(rec => rec.priority === 'high');
  }, [recommendations]);

  /**
   * Get pattern analysis summary
   */
  const getPatternSummary = useCallback(() => {
    const summary = {
      totalPatterns: patterns.length,
      highConfidencePatterns: patterns.filter(p => p.confidence > 0.8).length,
      bullishPatterns: patterns.filter(p =>
        ['double_bottom', 'cup_and_handle', 'ascending_triangle'].includes(p.type)
      ).length,
      bearishPatterns: patterns.filter(p =>
        ['head_and_shoulders', 'double_top', 'descending_triangle'].includes(p.type)
      ).length,
      averageConfidence: patterns.length > 0
        ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
        : 0
    };

    return summary;
  }, [patterns]);

  /**
   * Get prediction summary
   */
  const getPredictionSummary = useCallback(() => {
    if (predictions.length === 0) return null;

    const shortTerm = predictions.find(p => p.horizon === '1w');
    const mediumTerm = predictions.find(p => p.horizon === '1m');
    const longTerm = predictions.find(p => p.horizon === '3m');

    return {
      shortTerm: shortTerm ? {
        price: shortTerm.predictedPrice,
        confidence: shortTerm.confidence,
        horizon: shortTerm.horizon
      } : null,
      mediumTerm: mediumTerm ? {
        price: mediumTerm.predictedPrice,
        confidence: mediumTerm.confidence,
        horizon: mediumTerm.horizon
      } : null,
      longTerm: longTerm ? {
        price: longTerm.predictedPrice,
        confidence: longTerm.confidence,
        horizon: longTerm.horizon
      } : null,
      averageConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
    };
  }, [predictions]);

  /**
   * Get risk assessment summary
   */
  const getRiskSummary = useCallback(() => {
    if (!riskMetrics || Object.keys(riskMetrics).length === 0) return null;

    return {
      overallRisk: riskMetrics.riskCategory || 'Unknown',
      riskScore: riskMetrics.riskScore || 0,
      volatility: riskMetrics.volatility || 0,
      sharpeRatio: riskMetrics.sharpeRatio || 0,
      maxDrawdown: riskMetrics.maxDrawdown || 0,
      valueAtRisk: riskMetrics.valueAtRisk || 0,
      recommendation: riskMetrics.riskScore > 7
        ? 'High risk - implement strict controls'
        : riskMetrics.riskScore > 4
          ? 'Moderate risk - monitor closely'
          : 'Low risk - stable investment'
    };
  }, [riskMetrics]);

  /**
   * Export analysis data
   */
  const exportAnalysis = useCallback(() => {
    if (!analysis) return null;

    return {
      analysis,
      summary: {
        timestamp: analysis.timestamp,
        confidence: analysis.confidence,
        analysisType: analysis.analysisType,
        patterns: getPatternSummary(),
        predictions: getPredictionSummary(),
        risk: getRiskSummary(),
        insights: insights.length,
        recommendations: recommendations.length
      }
    };
  }, [analysis, insights, recommendations, getPatternSummary, getPredictionSummary, getRiskSummary]);

  /**
   * Clear all analysis data
   */
  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setInsights([]);
    setPatterns([]);
    setPredictions([]);
    setRiskMetrics({});
    setRecommendations([]);
    setError(null);
  }, []);

  /**
   * Get service health status
   */
  const getServiceHealth = useCallback(() => {
    return aiAnalyticsService.getServiceHealth();
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Setup auto analysis
  useEffect(() => {
    if (autoAnalyze && enableRealTimeInsights) {
      // Auto analysis will be started when data is provided
    }

    return () => {
      stopAutoAnalysis();
    };
  }, [autoAnalyze, enableRealTimeInsights, stopAutoAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoAnalysis();
    };
  }, [stopAutoAnalysis]);

  return {
    // State
    isLoading,
    isInitialized,
    analysis,
    insights,
    patterns,
    predictions,
    riskMetrics,
    recommendations,
    error,

    // Actions
    initialize,
    analyzeData,
    getRealtimeInsights,
    startAutoAnalysis,
    stopAutoAnalysis,
    clearAnalysis,
    exportAnalysis,

    // Utilities
    getFilteredInsights,
    getHighPriorityRecommendations,
    getPatternSummary,
    getPredictionSummary,
    getRiskSummary,
    getServiceHealth,

    // Metrics
    analysisCount: analysisCountRef.current
  };
}

/**
 * Hook for specific pattern analysis
 */
export function usePatternAnalysis(data, options = {}) {
  const { analyzeData, patterns, isLoading } = useAIAnalytics(options);

  const analyzePatterns = useCallback(async() => {
    if (!data) return [];

    const result = await analyzeData(data, {
      includePatterns: true,
      includePredictions: false,
      includeRiskAnalysis: false
    });

    return result?.patterns || [];
  }, [data, analyzeData]);

  return {
    patterns,
    isLoading,
    analyzePatterns
  };
}

/**
 * Hook for prediction analysis
 */
export function usePredictionAnalysis(data, options = {}) {
  const { analyzeData, predictions, isLoading } = useAIAnalytics(options);

  const generatePredictions = useCallback(async() => {
    if (!data) return [];

    const result = await analyzeData(data, {
      includePatterns: false,
      includePredictions: true,
      includeRiskAnalysis: false
    });

    return result?.predictions || [];
  }, [data, analyzeData]);

  return {
    predictions,
    isLoading,
    generatePredictions
  };
}

/**
 * Hook for risk analysis
 */
export function useRiskAnalysis(data, riskTolerance = 'moderate') {
  const { analyzeData, riskMetrics, isLoading } = useAIAnalytics({ riskTolerance });

  const analyzeRisk = useCallback(async() => {
    if (!data) return {};

    const result = await analyzeData(data, {
      includePatterns: false,
      includePredictions: false,
      includeRiskAnalysis: true
    });

    return result?.riskMetrics || {};
  }, [data, analyzeData]);

  return {
    riskMetrics,
    isLoading,
    analyzeRisk
  };
}

export default useAIAnalytics;
