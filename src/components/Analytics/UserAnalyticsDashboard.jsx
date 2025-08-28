import { motion } from 'framer-motion';
import { BarChart3, Users, Clock, Activity, Target, Eye, Zap, Calendar } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

import analyticsService from '../../services/analyticsService';

/**
 * Comprehensive user analytics and usage tracking dashboard
 */

const UserAnalyticsDashboard = ({ className = '' }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();

    // Set up auto-refresh
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const loadDashboardData = () => {
    setIsLoading(true);

    // Simulate loading delay for real-world feel
    setTimeout(() => {
      const data = analyticsService.getDashboardData();
      setDashboardData(data);
      setIsLoading(false);
    }, 500);
  };

  const formatDuration = ms => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatNumber = num => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getGrowthColor = value => {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  const generateFeatureUsageChart = () => {
    if (!dashboardData?.featureUsage?.topFeatures) return [];

    return dashboardData.featureUsage.topFeatures.slice(0, 8).map(feature => ({
      name: feature.feature.replace('_', ' ').toUpperCase(),
      usage: feature.count,
      sessions: feature.sessions.size
    }));
  };

  const generateTimePatternChart = () => {
    if (!dashboardData?.userBehavior?.timePattern?.hourlyActivity) return [];

    return dashboardData.userBehavior.timePattern.hourlyActivity.map((activity, hour) => ({
      hour: `${hour}:00`,
      activity
    }));
  };

  const generateSessionDistributionChart = () => {
    if (!dashboardData?.sessions?.sessionDistribution) return [];

    const dist = dashboardData.sessions.sessionDistribution;
    return [
      { name: 'Short (< 1m)', value: dist.short, color: '#ef4444' },
      { name: 'Medium (1-10m)', value: dist.medium, color: '#f59e0b' },
      { name: 'Long (> 10m)', value: dist.long, color: '#10b981' }
    ];
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded" />
            ))}
          </div>
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No analytics data available</p>
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
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                User Analytics Dashboard
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Real-time usage insights and performance metrics
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedTimeframe}
              onChange={e => setSelectedTimeframe(e.target.value)}
              className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Total Sessions
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatNumber(dashboardData.summary.totalSessions)}
                </p>
                <p className={`text-sm ${getGrowthColor(dashboardData.trends.dailyGrowth)}`}>
                  {dashboardData.trends.dailyGrowth > 0 ? '+' : ''}
                  {dashboardData.trends.dailyGrowth.toFixed(1)}% today
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </motion.div>

          {/* Average Session Length */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800/50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Avg Session
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatDuration(dashboardData.summary.averageSessionLength)}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {dashboardData.sessions.averagePageViews.toFixed(1)} pages/session
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </motion.div>

          {/* Feature Usage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Active Features
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {dashboardData.summary.activeFeaturesCount}
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  {dashboardData.summary.mostUsedFeature?.feature || 'N/A'} most used
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </motion.div>

          {/* Performance Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/50 dark:to-orange-800/50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  Perf Score
                </p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {Math.round(dashboardData.performance.averageLoadTime || 0)}ms
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  {dashboardData.summary.errorCount} errors
                </p>
              </div>
              <Zap className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Feature Usage Chart */}
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Feature Usage
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={generateFeatureUsageChart()}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="usage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Session Distribution */}
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Session Duration
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={generateSessionDistributionChart()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {generateSessionDistributionChart().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Activity Chart */}
        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Usage Patterns (24 Hours)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={generateTimePatternChart()}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Area
                type="monotone"
                dataKey="activity"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Current Session Info */}
        {dashboardData.summary.currentSession && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Current Session
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Duration</p>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  {formatDuration(Date.now() - dashboardData.summary.currentSession.startTime)}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Page Views</p>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  {dashboardData.summary.currentSession.pageViews}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Features Used</p>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  {dashboardData.summary.currentSession.features.size}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAnalyticsDashboard;
