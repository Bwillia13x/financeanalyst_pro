/**
 * React Hook for Business Intelligence
 * Provides easy integration with BusinessIntelligenceService for React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import businessIntelligenceService from '../services/businessIntelligenceService';
// import { performanceMonitoring } from '../utils/performanceMonitoring'; // Missing module

/**
 * Main Business Intelligence hook
 */
export function useBusinessIntelligence(config = {}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [analytics, setAnalytics] = useState({});
  const [insights, setInsights] = useState([]);
  const [reports, setReports] = useState([]);
  const [benchmarks, _setBenchmarks] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const initialized = useRef(false);

  // Initialize Business Intelligence service
  useEffect(() => {
    if (initialized.current) return;

    const initializeService = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await businessIntelligenceService.initialize(config);
        setIsInitialized(true);
        initialized.current = true;

        // Track initialization success
        if (typeof performanceMonitoring !== 'undefined') {
          // performanceMonitoring.trackCustomMetric('bi_hook_init_success', 1);
        }
      } catch (err) {
        setError(err.message);
        console.error('Failed to initialize business intelligence:', err);

        if (typeof performanceMonitoring !== 'undefined') {
          // performanceMonitoring.trackCustomMetric('bi_hook_init_error', 1);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();

    // Cleanup on unmount
    return () => {
      if (initialized.current) {
        businessIntelligenceService.cleanup();
        initialized.current = false;
      }
    };
  }, []); // Remove config dependency to prevent re-initialization

  // Set up event listeners
  useEffect(() => {
    if (!isInitialized) return;

    const handleAutomatedReport = report => {
      setReports(prev => [report, ...prev.slice(0, 19)]); // Keep last 20 reports
    };

    const handleIntelligentInsights = newInsights => {
      setInsights(prev => [newInsights, ...prev.slice(0, 9)]); // Keep last 10 insights
    };

    const handleAnalyticsUpdate = data => {
      setAnalytics(prev => ({ ...prev, ...data }));
    };

    // Add event listeners
    businessIntelligenceService.on('automatedReportGenerated', handleAutomatedReport);
    businessIntelligenceService.on('intelligentInsightsGenerated', handleIntelligentInsights);
    businessIntelligenceService.on('analyticsUpdate', handleAnalyticsUpdate);

    // Load initial data
    const loadInitialData = async () => {
      try {
        const currentAnalytics = businessIntelligenceService.getCurrentAnalytics();
        setAnalytics(currentAnalytics);

        const actionableInsights = businessIntelligenceService.getActionableInsights();
        setInsights([{ insights: actionableInsights, timestamp: Date.now() }]);
      } catch (err) {
        console.error('Failed to load initial BI data:', err);
      }
    };

    loadInitialData();

    // Cleanup listeners
    return () => {
      businessIntelligenceService.off('automatedReportGenerated', handleAutomatedReport);
      businessIntelligenceService.off('intelligentInsightsGenerated', handleIntelligentInsights);
      businessIntelligenceService.off('analyticsUpdate', handleAnalyticsUpdate);
    };
  }, [isInitialized]);

  // Track page view
  const trackPageView = useCallback(
    (page, metadata = {}) => {
      if (isInitialized && businessIntelligenceService.trackPageView) {
        businessIntelligenceService.trackPageView(page, metadata);
      }
    },
    [isInitialized]
  );

  // Track feature usage
  const trackFeatureUsage = useCallback(
    (feature, action, metadata = {}) => {
      if (isInitialized && businessIntelligenceService.trackFeatureUsage) {
        businessIntelligenceService.trackFeatureUsage(feature, action, metadata);
      }
    },
    [isInitialized]
  );

  // Track user interaction
  const trackUserInteraction = useCallback(
    (interaction, target, metadata = {}) => {
      if (isInitialized && businessIntelligenceService.trackUserInteraction) {
        businessIntelligenceService.trackUserInteraction(interaction, target, metadata);
      }
    },
    [isInitialized]
  );

  // Track user action (explicit, high-level actions)
  const trackUserAction = useCallback(
    (action, target, metadata = {}) => {
      if (isInitialized && businessIntelligenceService.trackUserAction) {
        businessIntelligenceService.trackUserAction(action, target, metadata);
      }
    },
    [isInitialized]
  );

  // Generate report on demand
  const generateReport = useCallback(async () => {
    if (!isInitialized) return null;

    try {
      setIsLoading(true);
      const report = await (typeof businessIntelligenceService.generateReport === 'function'
        ? businessIntelligenceService.generateReport()
        : businessIntelligenceService.generateAutomatedReports());
      return report;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Get historical trends
  const getHistoricalTrends = useCallback(
    (metric, period = '30d') => {
      if (!isInitialized) return [];

      return businessIntelligenceService.getHistoricalTrends(metric, period);
    },
    [isInitialized]
  );

  // Export data
  const exportData = useCallback(
    (format = 'json', filters = {}) => {
      if (!isInitialized) return null;

      return businessIntelligenceService.exportData(format, filters);
    },
    [isInitialized]
  );

  return {
    isInitialized,
    analytics,
    insights,
    reports,
    benchmarks,
    isLoading,
    error,
    trackPageView,
    trackFeatureUsage,
    trackUserInteraction,
    trackUserAction,
    generateReport,
    getHistoricalTrends,
    exportData
  };
}

/**
 * Hook for usage analytics
 */
export function useUsageAnalytics() {
  const [usageMetrics, setUsageMetrics] = useState({
    sessions: 0,
    users: 0,
    pageViews: 0,
    features: {},
    engagement: {}
  });
  const [trends, setTrends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadUsageData = async () => {
      setIsLoading(true);
      try {
        // Simulate loading usage analytics
        const mockUsageData = {
          sessions: 1247,
          users: 892,
          pageViews: 5673,
          features: {
            portfolio_analysis: 456,
            risk_modeling: 324,
            market_data: 789,
            ai_analytics: 234,
            collaboration: 123
          },
          engagement: {
            avgSessionDuration: 1856, // seconds
            bounceRate: 0.24,
            pagesPerSession: 4.2,
            returnRate: 0.68
          }
        };

        const mockTrends = Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          sessions: Math.floor(40 + Math.random() * 20 + Math.sin(i / 7) * 10),
          users: Math.floor(30 + Math.random() * 15 + Math.sin(i / 7) * 8),
          engagement: 0.6 + Math.random() * 0.3 + Math.sin(i / 7) * 0.1
        }));

        setUsageMetrics(mockUsageData);
        setTrends(mockTrends);
      } catch (error) {
        console.error('Failed to load usage analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsageData();
  }, []);

  return {
    usageMetrics,
    trends,
    isLoading
  };
}

/**
 * Hook for performance analytics
 */
export function usePerformanceAnalytics() {
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [benchmarks, setBenchmarks] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadPerformanceData = async () => {
      setIsLoading(true);
      try {
        // Simulate loading performance analytics
        const mockPerformanceData = {
          responseTime: {
            average: 284,
            p95: 567,
            p99: 892
          },
          errorRate: 0.0023,
          uptime: 99.87,
          throughput: 1247,
          memoryUsage: 67.3,
          cpuUsage: 42.1
        };

        const mockBenchmarks = {
          responseTime: { target: 300, current: 284, status: 'good' },
          errorRate: { target: 0.005, current: 0.0023, status: 'excellent' },
          uptime: { target: 99.5, current: 99.87, status: 'excellent' }
        };

        const mockAlerts = [
          {
            id: 'alert_1',
            type: 'warning',
            metric: 'response_time',
            message: 'Response time increased by 15% in the last hour',
            timestamp: Date.now() - 3600000,
            severity: 'medium'
          }
        ];

        setPerformanceMetrics(mockPerformanceData);
        setBenchmarks(mockBenchmarks);
        setAlerts(mockAlerts);
      } catch (error) {
        console.error('Failed to load performance analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformanceData();
  }, []);

  return {
    performanceMetrics,
    benchmarks,
    alerts,
    isLoading
  };
}

/**
 * Hook for market intelligence
 */
export function useMarketIntelligence() {
  const [marketData, setMarketData] = useState({});
  const [trends, setTrends] = useState([]);
  const [signals, setSignals] = useState([]);
  const [correlations, setCorrelations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadMarketIntelligence = async () => {
      setIsLoading(true);
      try {
        // Simulate loading market intelligence
        const mockMarketData = {
          sentiment: 0.67, // 0-1 scale
          volatility: 0.23,
          trendStrength: 0.78,
          volume: 1.34, // relative to average
          momentum: 0.45
        };

        const mockTrends = [
          { symbol: 'AAPL', trend: 'bullish', strength: 0.78, duration: '5 days' },
          { symbol: 'GOOGL', trend: 'bearish', strength: 0.56, duration: '2 days' },
          { symbol: 'MSFT', trend: 'neutral', strength: 0.34, duration: '1 day' }
        ];

        const mockSignals = [
          {
            type: 'buy',
            symbol: 'TSLA',
            confidence: 0.72,
            reason: 'Golden cross pattern detected',
            timestamp: Date.now() - 1800000
          },
          {
            type: 'sell',
            symbol: 'NVDA',
            confidence: 0.64,
            reason: 'Overbought conditions',
            timestamp: Date.now() - 3600000
          }
        ];

        const mockCorrelations = [
          { assets: ['SPY', 'QQQ'], correlation: 0.89, period: '30d' },
          { assets: ['GLD', 'USD'], correlation: -0.67, period: '30d' },
          { assets: ['BTC', 'TECH'], correlation: 0.45, period: '30d' }
        ];

        setMarketData(mockMarketData);
        setTrends(mockTrends);
        setSignals(mockSignals);
        setCorrelations(mockCorrelations);
      } catch (error) {
        console.error('Failed to load market intelligence:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMarketIntelligence();
  }, []);

  return {
    marketData,
    trends,
    signals,
    correlations,
    isLoading
  };
}

/**
 * Hook for user behavior analytics
 */
export function useUserBehaviorAnalytics() {
  const [behaviorMetrics, setBehaviorMetrics] = useState({});
  const [userSegments, setUserSegments] = useState([]);
  const [journeyAnalysis, setJourneyAnalysis] = useState({});
  const [churnRisk, setChurnRisk] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadBehaviorData = async () => {
      setIsLoading(true);
      try {
        // Simulate loading behavior analytics
        const mockBehaviorMetrics = {
          avgSessionDuration: 1856,
          pagesPerSession: 4.2,
          bounceRate: 0.24,
          returnVisitorRate: 0.68,
          conversionRate: 0.034,
          featureAdoptionRate: 0.67
        };

        const mockUserSegments = [
          { name: 'Power Users', count: 156, engagement: 'high', retention: 0.92 },
          { name: 'Regular Users', count: 423, engagement: 'medium', retention: 0.74 },
          { name: 'New Users', count: 234, engagement: 'low', retention: 0.45 },
          { name: 'At Risk', count: 67, engagement: 'declining', retention: 0.23 }
        ];

        const mockJourneyAnalysis = {
          commonPaths: [
            ['login', 'dashboard', 'portfolio', 'analysis'],
            ['login', 'market_data', 'charts', 'alerts'],
            ['login', 'collaboration', 'workspace', 'models']
          ],
          dropoffPoints: [
            { step: 'registration', rate: 0.23 },
            { step: 'first_analysis', rate: 0.18 },
            { step: 'model_creation', rate: 0.15 }
          ],
          conversionFunnels: {
            trial_to_paid: 0.12,
            visitor_to_signup: 0.08,
            signup_to_active: 0.67
          }
        };

        const mockChurnRisk = [
          { userId: 'user_123', risk: 0.78, lastActive: '2 weeks ago', reason: 'low_engagement' },
          {
            userId: 'user_456',
            risk: 0.65,
            lastActive: '1 week ago',
            reason: 'feature_abandonment'
          },
          { userId: 'user_789', risk: 0.72, lastActive: '10 days ago', reason: 'support_issues' }
        ];

        setBehaviorMetrics(mockBehaviorMetrics);
        setUserSegments(mockUserSegments);
        setJourneyAnalysis(mockJourneyAnalysis);
        setChurnRisk(mockChurnRisk);
      } catch (error) {
        console.error('Failed to load behavior analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBehaviorData();
  }, []);

  return {
    behaviorMetrics,
    userSegments,
    journeyAnalysis,
    churnRisk,
    isLoading
  };
}

/**
 * Hook for automated insights
 */
export function useAutomatedInsights() {
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadInsights = async () => {
      setIsLoading(true);
      try {
        // Simulate loading automated insights
        const mockInsights = [
          {
            id: 'insight_1',
            type: 'performance',
            title: 'Response Time Optimization Opportunity',
            description: 'API response times can be improved by 23% through query optimization',
            impact: 'high',
            confidence: 0.87,
            actionable: true,
            timestamp: Date.now() - 3600000
          },
          {
            id: 'insight_2',
            type: 'user_behavior',
            title: 'Feature Adoption Pattern',
            description: 'Users who complete portfolio analysis are 3x more likely to upgrade',
            impact: 'medium',
            confidence: 0.92,
            actionable: true,
            timestamp: Date.now() - 7200000
          },
          {
            id: 'insight_3',
            type: 'market',
            title: 'Correlation Anomaly Detected',
            description: 'Unusual correlation between tech stocks and commodities detected',
            impact: 'medium',
            confidence: 0.74,
            actionable: false,
            timestamp: Date.now() - 10800000
          }
        ];

        const mockRecommendations = [
          {
            id: 'rec_1',
            category: 'performance',
            title: 'Implement Database Indexing',
            description: 'Add composite indexes on frequently queried columns',
            effort: 'medium',
            impact: 'high',
            priority: 9
          },
          {
            id: 'rec_2',
            category: 'user_experience',
            title: 'Streamline Onboarding Flow',
            description: 'Reduce registration steps from 5 to 3',
            effort: 'low',
            impact: 'medium',
            priority: 7
          },
          {
            id: 'rec_3',
            category: 'feature',
            title: 'Add Portfolio Comparison Tool',
            description: 'Enable side-by-side portfolio performance comparison',
            effort: 'high',
            impact: 'high',
            priority: 8
          }
        ];

        const mockPredictions = [
          {
            metric: 'user_growth',
            timeframe: '30d',
            prediction: 15.7, // % growth
            confidence: 0.84,
            factors: ['seasonal_trends', 'marketing_campaign', 'feature_releases']
          },
          {
            metric: 'churn_rate',
            timeframe: '30d',
            prediction: 4.2, // % churn
            confidence: 0.76,
            factors: ['engagement_decline', 'support_tickets', 'usage_patterns']
          },
          {
            metric: 'revenue',
            timeframe: '90d',
            prediction: 23.4, // % increase
            confidence: 0.69,
            factors: ['user_growth', 'conversion_rate', 'market_conditions']
          }
        ];

        setInsights(mockInsights);
        setRecommendations(mockRecommendations);
        setPredictions(mockPredictions);
      } catch (error) {
        console.error('Failed to load automated insights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInsights();
  }, []);

  return {
    insights,
    recommendations,
    predictions,
    isLoading
  };
}

export default useBusinessIntelligence;
