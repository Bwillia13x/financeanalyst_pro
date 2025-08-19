/**
 * Personalization Engine
 * Learns user preferences and adapts the interface
 * Surfaces relevant metrics and customizes layouts based on usage patterns
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  // User,
  Brain,
  // Star,
  // Heart,
  // Eye,
  // Clock,
  // TrendingUp,
  // BarChart3,
  // Settings,
  Sparkles,
  // Target,
  // Bookmark,
  // Filter,
  // Layout,
  // Palette,
  // Zap,
  // ArrowUp,
  // ArrowDown,
  MoreHorizontal
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

const PersonalizationEngine = ({
  userId,
  onPreferencesChange,
  onLayoutChange,
  children
}) => {
  const [_userProfile, _setUserProfile] = useState(null);
  const [preferences, setPreferences] = useState({});
  const [_usagePatterns, _setUsagePatterns] = useState({});
  const [adaptiveLayout, setAdaptiveLayout] = useState({});
  const [learningMode, setLearningMode] = useState(true);
  const [showPersonalizationPanel, setShowPersonalizationPanel] = useState(false);

  // User behavior tracking
  const [interactions, setInteractions] = useState({
    viewedMetrics: new Map(),
    usedFeatures: new Map(),
    timeSpent: new Map(),
    preferredCharts: new Map(),
    savedAnalyses: [],
    frequentActions: new Map()
  });

  // Default user preferences
  const defaultPreferences = {
    interface: {
      theme: 'professional',
      density: 'comfortable',
      animations: 'meaningful',
      shortcuts: 'enabled'
    },
    metrics: {
      favorite: ['revenue', 'ebitda', 'enterprise_value', 'irr'],
      alwaysVisible: ['enterprise_value', 'equity_value'],
      hidden: [],
      customOrder: []
    },
    charts: {
      preferredTypes: ['line', 'bar'],
      colorScheme: 'professional',
      defaultPeriods: 5
    },
    workflow: {
      defaultView: 'private-analysis',
      autoSave: true,
      quickAccess: ['dcf', 'lbo', 'scenarios'],
      notifications: 'important'
    },
    layout: {
      sidebarCollapsed: false,
      panelPositions: {},
      widgetOrder: [],
      customDashboard: null
    }
  };

  // Learning algorithms for user behavior
  const learningAlgorithms = {
    // Track which metrics user views most frequently
    trackMetricViewing: (metricId, duration) => {
      setInteractions(prev => {
        const newMap = new Map(prev.viewedMetrics);
        const current = newMap.get(metricId) || { count: 0, totalTime: 0, lastViewed: null };
        newMap.set(metricId, {
          count: current.count + 1,
          totalTime: current.totalTime + duration,
          lastViewed: Date.now(),
          avgTime: (current.totalTime + duration) / (current.count + 1)
        });
        return { ...prev, viewedMetrics: newMap };
      });
    },

    // Learn preferred chart types
    trackChartUsage: (chartType, context) => {
      setInteractions(prev => {
        const newMap = new Map(prev.preferredCharts);
        const current = newMap.get(chartType) || { count: 0, contexts: [] };
        newMap.set(chartType, {
          count: current.count + 1,
          contexts: [...current.contexts, context].slice(-10) // Keep last 10 contexts
        });
        return { ...prev, preferredCharts: newMap };
      });
    },

    // Track feature usage patterns
    trackFeatureUsage: (featureId, success = true) => {
      setInteractions(prev => {
        const newMap = new Map(prev.usedFeatures);
        const current = newMap.get(featureId) || {
          count: 0,
          successRate: 1,
          lastUsed: null,
          timeOfDay: [],
          dayOfWeek: []
        };

        const now = new Date();
        newMap.set(featureId, {
          count: current.count + 1,
          successRate: (current.successRate * current.count + (success ? 1 : 0)) / (current.count + 1),
          lastUsed: Date.now(),
          timeOfDay: [...current.timeOfDay, now.getHours()].slice(-20),
          dayOfWeek: [...current.dayOfWeek, now.getDay()].slice(-20)
        });
        return { ...prev, usedFeatures: newMap };
      });
    }
  };

  // Generate personalized recommendations
  const generateRecommendations = useCallback(() => {
    const recommendations = [];

    // Metric visibility recommendations
    const metricUsage = Array.from(interactions.viewedMetrics.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 6);

    if (metricUsage.length > 0) {
      recommendations.push({
        type: 'metric_visibility',
        title: 'Prioritize Your Key Metrics',
        description: `You frequently view ${metricUsage[0][0]}. Would you like to pin it to your dashboard?`,
        action: () => addToFavoriteMetrics(metricUsage[0][0]),
        confidence: 0.8
      });
    }

    // Chart type recommendations
    const chartUsage = Array.from(interactions.preferredCharts.entries())
      .sort(([, a], [, b]) => b.count - a.count);

    if (chartUsage.length > 0) {
      recommendations.push({
        type: 'chart_preference',
        title: 'Set Default Chart Type',
        description: `You prefer ${chartUsage[0][0]} charts. Set as default?`,
        action: () => setDefaultChartType(chartUsage[0][0]),
        confidence: 0.7
      });
    }

    // Workflow recommendations
    const featureUsage = Array.from(interactions.usedFeatures.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 3);

    if (featureUsage.length > 0) {
      recommendations.push({
        type: 'quick_access',
        title: 'Quick Access Shortcuts',
        description: `Add ${featureUsage[0][0]} to your quick access bar?`,
        action: () => addToQuickAccess(featureUsage[0][0]),
        confidence: 0.6
      });
    }

    return recommendations;
  }, [interactions]);

  // Adaptive layout generation
  const generateAdaptiveLayout = useCallback(() => {
    const layout = { ...defaultPreferences.layout };

    // Prioritize frequently viewed metrics
    const prioritizedMetrics = Array.from(interactions.viewedMetrics.entries())
      .sort(([, a], [, b]) => (b.count * b.avgTime) - (a.count * a.avgTime))
      .slice(0, 8)
      .map(([metricId]) => metricId);

    layout.metricPriority = prioritizedMetrics;

    // Adapt sidebar based on usage
    const totalInteractions = Array.from(interactions.usedFeatures.values())
      .reduce((sum, feature) => sum + feature.count, 0);

    layout.sidebarCollapsed = totalInteractions > 50; // Collapse for power users

    // Generate dashboard layout
    const dashboardWidgets = [
      ...prioritizedMetrics.slice(0, 4).map(metric => ({
        type: 'metric',
        id: metric,
        size: 'small'
      })),
      {
        type: 'chart',
        id: 'primary_chart',
        size: 'large',
        chartType: Array.from(interactions.preferredCharts.entries())[0]?.[0] || 'line'
      }
    ];

    layout.dashboardWidgets = dashboardWidgets;

    setAdaptiveLayout(layout);
    return layout;
  }, [interactions]);

  // Preference management functions
  const addToFavoriteMetrics = (metricId) => {
    setPreferences(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        favorite: [...(prev.metrics?.favorite || []), metricId].slice(-6)
      }
    }));
  };

  const setDefaultChartType = (chartType) => {
    setPreferences(prev => ({
      ...prev,
      charts: {
        ...prev.charts,
        preferredTypes: [chartType, ...(prev.charts?.preferredTypes || []).filter(t => t !== chartType)]
      }
    }));
  };

  const addToQuickAccess = (featureId) => {
    setPreferences(prev => ({
      ...prev,
      workflow: {
        ...prev.workflow,
        quickAccess: [...(prev.workflow?.quickAccess || []), featureId].slice(-5)
      }
    }));
  };

  // Load user profile and preferences
  useEffect(() => {
    const loadUserData = async() => {
      try {
        // In production, this would load from your backend
        const savedPreferences = localStorage.getItem(`preferences_${userId}`);
        const savedInteractions = localStorage.getItem(`interactions_${userId}`);

        if (savedPreferences) {
          setPreferences(JSON.parse(savedPreferences));
        } else {
          setPreferences(defaultPreferences);
        }

        if (savedInteractions) {
          const parsed = JSON.parse(savedInteractions);
          setInteractions({
            viewedMetrics: new Map(parsed.viewedMetrics || []),
            usedFeatures: new Map(parsed.usedFeatures || []),
            timeSpent: new Map(parsed.timeSpent || []),
            preferredCharts: new Map(parsed.preferredCharts || []),
            savedAnalyses: parsed.savedAnalyses || [],
            frequentActions: new Map(parsed.frequentActions || [])
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setPreferences(defaultPreferences);
      }
    };

    if (userId) {
      loadUserData();
    }
  }, [userId]);

  // Save preferences and interactions
  useEffect(() => {
    if (userId && Object.keys(preferences).length > 0) {
      localStorage.setItem(`preferences_${userId}`, JSON.stringify(preferences));
      if (onPreferencesChange) {
        onPreferencesChange(preferences);
      }
    }
  }, [userId, preferences, onPreferencesChange]);

  useEffect(() => {
    if (userId && interactions.viewedMetrics.size > 0) {
      const serializable = {
        viewedMetrics: Array.from(interactions.viewedMetrics.entries()),
        usedFeatures: Array.from(interactions.usedFeatures.entries()),
        timeSpent: Array.from(interactions.timeSpent.entries()),
        preferredCharts: Array.from(interactions.preferredCharts.entries()),
        savedAnalyses: interactions.savedAnalyses,
        frequentActions: Array.from(interactions.frequentActions.entries())
      };
      localStorage.setItem(`interactions_${userId}`, JSON.stringify(serializable));
    }
  }, [userId, interactions]);

  // Generate adaptive layout when interactions change
  useEffect(() => {
    if (learningMode && interactions.viewedMetrics.size > 5) {
      const layout = generateAdaptiveLayout();
      if (onLayoutChange) {
        onLayoutChange(layout);
      }
    }
  }, [interactions, learningMode, generateAdaptiveLayout, onLayoutChange]);

  // Personalization panel component
  const PersonalizationPanel = () => {
    const [activeTab, setActiveTab] = useState('insights');
    const recommendations = generateRecommendations();

    return (
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 z-50 overflow-hidden"
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Personalization</h3>
            </div>
            <button
              onClick={() => setShowPersonalizationPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="mt-3 flex space-x-1">
            {['insights', 'preferences', 'layout'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-sm rounded ${
                  activeTab === tab
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'insights' && (
            <div className="p-4 space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">AI Insights</span>
                </div>
                <p className="text-xs text-purple-700">
                  Based on your usage patterns, we&apos;ve learned your preferences.
                </p>
              </div>

              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{rec.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={rec.action}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Apply
                      </button>
                      <button className="text-gray-400 hover:text-gray-600 px-1">
                        <MoreHorizontal className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <div className="text-xs text-gray-500">
                      Confidence: {Math.round(rec.confidence * 100)}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="interface-theme" className="text-sm font-medium text-gray-700">Interface Theme</label>
                <select
                  id="interface-theme"
                  value={preferences.interface?.theme || 'professional'}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    interface: { ...prev.interface, theme: e.target.value }
                  }))}
                  className="mt-1 w-full text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="professional">Professional</option>
                  <option value="executive">Executive</option>
                  <option value="consulting">Consulting</option>
                  <option value="investment">Investment</option>
                </select>
              </div>

              <div>
                <label htmlFor="interface-density" className="text-sm font-medium text-gray-700">Density</label>
                <select
                  id="interface-density"
                  value={preferences.interface?.density || 'comfortable'}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    interface: { ...prev.interface, density: e.target.value }
                  }))}
                  className="mt-1 w-full text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>

              <div>
                <label htmlFor="default-chart-type" className="text-sm font-medium text-gray-700">Default Chart Type</label>
                <select
                  id="default-chart-type"
                  value={preferences.charts?.preferredTypes?.[0] || 'line'}
                  onChange={(e) => setDefaultChartType(e.target.value)}
                  className="mt-1 w-full text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="waterfall">Waterfall Chart</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Learning Mode</span>
                <button
                  onClick={() => setLearningMode(!learningMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    learningMode ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      learningMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Usage Analytics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Metrics Viewed</span>
                    <span className="font-medium">{interactions.viewedMetrics.size}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Features Used</span>
                    <span className="font-medium">{interactions.usedFeatures.size}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Charts Created</span>
                    <span className="font-medium">{interactions.preferredCharts.size}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={generateAdaptiveLayout}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm"
              >
                Generate Adaptive Layout
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Enhanced children with personalization context
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        ...child.props,
        userPreferences: preferences,
        adaptiveLayout,
        trackMetricViewing: learningAlgorithms.trackMetricViewing,
        trackChartUsage: learningAlgorithms.trackChartUsage,
        trackFeatureUsage: learningAlgorithms.trackFeatureUsage,
        learningMode
      });
    }
    return child;
  });

  return (
    <div className="relative">
      {enhancedChildren}

      {/* Personalization Trigger */}
      <motion.button
        onClick={() => setShowPersonalizationPanel(true)}
        className="fixed bottom-20 right-4 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg z-40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Brain className="w-5 h-5" />
      </motion.button>

      {/* Personalization Panel */}
      <AnimatePresence>
        {showPersonalizationPanel && <PersonalizationPanel />}
      </AnimatePresence>
    </div>
  );
};

export default PersonalizationEngine;
