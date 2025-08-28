import React, { useState, useEffect, useCallback } from 'react';

import { useAccessibilityMonitor } from '../../hooks/useAccessibility';

const PerformanceDashboard = ({ isVisible = false, onClose }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(75);

  const {
    alerts,
    startMonitoring: startAccessibilityMonitoring,
    stopMonitoring: stopAccessibilityMonitoring,
    clearAlerts
  } = useAccessibilityMonitor({
    threshold: alertThreshold,
    monitorInterval: refreshInterval
  });

  // Refresh dashboard data
  const refreshData = useCallback(() => {
    import('../../utils/performanceMonitoring')
      .then(mod => {
        if (mod?.getPerformanceDashboardData) {
          try {
            const data = mod.getPerformanceDashboardData();
            setDashboardData(data);
          } catch (error) {
            console.error('Failed to refresh performance dashboard:', error);
          }
        }
      })
      .catch(error => {
        console.error('Failed to load performance monitoring:', error);
      });
  }, []);

  // Toggle monitoring
  const toggleMonitoring = useCallback(() => {
    if (isMonitoring) {
      stopAccessibilityMonitoring();
      setIsMonitoring(false);
    } else {
      startAccessibilityMonitoring();
      setIsMonitoring(true);
    }
  }, [isMonitoring, startAccessibilityMonitoring, stopAccessibilityMonitoring]);

  // Initialize and set up refresh interval
  useEffect(() => {
    if (!isVisible) return;

    // Initialize performance monitoring if not already done
    import('../../utils/performanceMonitoring')
      .then(mod => {
        if (mod?.initializePerformanceMonitoring) {
          mod.initializePerformanceMonitoring();
        }
      })
      .catch(() => {
        // Performance monitoring is optional; ignore errors
      });

    // Initial data fetch
    refreshData();

    // In test mode, skip setting an interval to avoid keeping the worker alive
    if (import.meta.env.MODE === 'test') {
      return () => {};
    }

    // Set up refresh interval (non-test only)
    const interval = setInterval(refreshData, refreshInterval);

    return () => {
      clearInterval(interval);
    };
  }, [isVisible, refreshData, refreshInterval]);

  // Format metric values for display
  const formatMetric = (value, unit = 'ms') => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      return `${Math.round(value)}${unit}`;
    }
    return value;
  };

  // Get metric status (good, needs improvement, poor)
  const getMetricStatus = (metric, value) => {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metric];
    if (!threshold || value === null) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  // Get status color
  const getStatusColor = status => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Only gate on visibility. Render a lightweight shell immediately so tests
  // can assert the heading without waiting for async data.
  if (!isVisible) {
    return null;
  }

  // Safe fallbacks while data is loading
  const webVitals = dashboardData?.webVitals ?? {};
  const budgetViolations = dashboardData?.budgetViolations ?? [];
  const accessibility = dashboardData?.accessibility ?? {
    currentScore: null,
    averageScore: null,
    averageViolations: null,
    trends: {}
  };
  const performance = dashboardData?.performance ?? { recentMetrics: [], webVitalHistory: [] };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
            <p className="text-sm text-gray-600 mt-1">
              Real-time monitoring for FinanceAnalyst Pro
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleMonitoring}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isMonitoring
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200"
            >
              Refresh
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Loading state shown until dashboardData is available */}
          {!dashboardData && (
            <div role="status" aria-live="polite" className="text-sm text-gray-600">
              Loading performance data...
            </div>
          )}

          {/* Web Vitals */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Web Vitals</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(webVitals).map(([metric, value]) => {
                const status = getMetricStatus(metric, value);
                const statusColor = getStatusColor(status);

                return (
                  <div key={metric} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">{metric}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {status}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatMetric(value, metric === 'CLS' ? '' : 'ms')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Budget Violations */}
          {budgetViolations.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Performance Budget Violations
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="space-y-2">
                  {budgetViolations.map((violation, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-800">
                        {violation.metric}: {formatMetric(violation.value)}
                      </span>
                      <span className="text-sm text-red-600">
                        Over budget by {formatMetric(violation.overBy)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Accessibility */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Accessibility</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Current Score</h4>
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-gray-900">
                    {accessibility.currentScore}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">/100</span>
                  {accessibility.trends.scoreImproving && (
                    <span className="ml-2 text-green-600">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Average Violations</h4>
                <span className="text-3xl font-bold text-gray-900">
                  {accessibility.averageViolations}
                </span>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Average Score</h4>
                <span className="text-3xl font-bold text-gray-900">
                  {accessibility.averageScore}
                </span>
              </div>
            </div>

            {/* Accessibility Alerts */}
            {alerts.length > 0 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-yellow-800">Active Alerts</h4>
                  <button
                    onClick={clearAlerts}
                    className="text-xs text-yellow-600 hover:text-yellow-800"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-2">
                  {alerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className="text-sm text-yellow-700">
                      <span className="font-medium">{alert.type}:</span> {alert.message}
                    </div>
                  ))}
                  {alerts.length > 5 && (
                    <div className="text-xs text-yellow-600">
                      And {alerts.length - 5} more alerts...
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Recent Performance Metrics */}
          {performance.recentMetrics.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Performance Events
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Component
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {performance.recentMetrics.slice(0, 10).map((metric, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {metric.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {metric.component || metric.componentType || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {metric.violations !== undefined
                              ? `${metric.violations} violations`
                              : metric.score !== undefined
                                ? `Score: ${metric.score}`
                                : metric.duration !== undefined
                                  ? `${Math.round(metric.duration)}ms`
                                  : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(metric.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Settings */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monitoring Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label
                  htmlFor="refresh-interval"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Refresh Interval (seconds)
                </label>
                <select
                  id="refresh-interval"
                  value={refreshInterval / 1000}
                  onChange={e => setRefreshInterval(parseInt(e.target.value) * 1000)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                </select>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label
                  htmlFor="alert-threshold"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Accessibility Alert Threshold
                </label>
                <select
                  id="alert-threshold"
                  value={alertThreshold}
                  onChange={e => setAlertThreshold(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value={60}>60 (Strict)</option>
                  <option value={75}>75 (Moderate)</option>
                  <option value={85}>85 (Lenient)</option>
                  <option value={95}>95 (Very Lenient)</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
