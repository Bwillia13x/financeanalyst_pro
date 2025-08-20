import { BarChart3, Activity, Eye, Users, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';

import UserAnalyticsDashboard from '../components/Analytics/UserAnalyticsDashboard';
import PerformanceDashboard from '../components/PerformanceDashboard/PerformanceDashboard';
import SEOHead from '../components/SEO/SEOHead';
import { Card } from '../components/ui/Card';
import Header from '../components/ui/Header';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('usage');

  const tabs = [
    { id: 'usage', label: 'Usage Analytics', icon: Eye },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'users', label: 'User Insights', icon: Users },
    { id: 'business', label: 'Business Intelligence', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <SEOHead
        title="Platform Analytics | FinanceAnalyst Pro"
        description="Monitor platform usage, performance metrics, user engagement, and business intelligence with comprehensive analytics dashboards."
        canonical="/analytics"
        keywords="platform analytics, usage metrics, performance monitoring, user insights, business intelligence, financial analytics"
      />

      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-8 h-8 text-emerald-600 mr-3" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Platform Analytics
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 max-w-3xl">
            Comprehensive analytics and insights into platform usage, performance metrics,
            and user engagement patterns to optimize your financial analysis workflow.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-8" aria-label="Analytics tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                  >
                    <Icon
                      className={`-ml-0.5 mr-2 h-5 w-5 ${
                        activeTab === tab.id
                          ? 'text-emerald-500'
                          : 'text-slate-400 group-hover:text-slate-500'
                      }`}
                    />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div>
          {activeTab === 'usage' && (
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <Eye className="w-6 h-6 text-emerald-600 mr-2" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Usage Analytics Dashboard
                </h2>
              </div>
              <UserAnalyticsDashboard />
            </Card>
          )}

          {activeTab === 'performance' && (
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <Activity className="w-6 h-6 text-emerald-600 mr-2" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Performance Monitoring
                </h2>
              </div>
              <PerformanceDashboard />
            </Card>
          )}

          {activeTab === 'users' && (
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <Users className="w-6 h-6 text-emerald-600 mr-2" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  User Insights & Engagement
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* User Metrics Cards */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">2,847</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Active Users</div>
                  <div className="text-xs text-green-600 mt-1">+12.3% from last month</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">4.2</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Avg Session Duration</div>
                  <div className="text-xs text-green-600 mt-1">+0.3 hours</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">847</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Models Created</div>
                  <div className="text-xs text-blue-600 mt-1">This week</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">94.2%</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">User Satisfaction</div>
                  <div className="text-xs text-green-600 mt-1">+2.1% improvement</div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-8 text-slate-500 dark:text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  Detailed user analytics and engagement metrics coming soon
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'business' && (
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <TrendingUp className="w-6 h-6 text-emerald-600 mr-2" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Business Intelligence
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Revenue Metrics */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Revenue Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">ARR</span>
                      <span className="font-semibold text-slate-900 dark:text-white">$2.4M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">MRR Growth</span>
                      <span className="font-semibold text-green-600">+18.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Churn Rate</span>
                      <span className="font-semibold text-red-600">2.1%</span>
                    </div>
                  </div>
                </div>

                {/* Feature Usage */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Feature Adoption</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">DCF Models</span>
                      <span className="font-semibold text-slate-900 dark:text-white">89%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Portfolio Tools</span>
                      <span className="font-semibold text-slate-900 dark:text-white">67%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">AI Insights</span>
                      <span className="font-semibold text-slate-900 dark:text-white">45%</span>
                    </div>
                  </div>
                </div>

                {/* Support Metrics */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Support Quality</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Response Time</span>
                      <span className="font-semibold text-slate-900 dark:text-white">2.1h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Resolution Rate</span>
                      <span className="font-semibold text-green-600">96.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Satisfaction</span>
                      <span className="font-semibold text-slate-900 dark:text-white">4.8/5</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics;
