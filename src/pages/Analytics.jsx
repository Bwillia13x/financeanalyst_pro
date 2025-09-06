import { BarChart3, Activity, Eye, Users, TrendingUp } from 'lucide-react';
import React, { useState, Suspense, lazy } from 'react';

const UserAnalyticsDashboard = lazy(() => import('../components/Analytics/UserAnalyticsDashboard'));
const PerformanceDashboard = lazy(() => import('../components/PerformanceDashboard/PerformanceDashboard'));
import SEOHead from '../components/SEO/SEOHead';
import { Card } from '../components/ui/Card';
import Header from '../components/ui/Header';
import MetricCard from '../components/ui/MetricCard';
import TabNav from '../components/ui/TabNav';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('usage');

  const tabs = [
    { id: 'usage', label: 'Usage Analytics', icon: Eye },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'users', label: 'User Insights', icon: Users },
    { id: 'business', label: 'Business Intelligence', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
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
            <BarChart3 className="w-8 h-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-foreground">
              Platform Analytics
            </h1>
          </div>
          <p className="text-foreground-secondary max-w-3xl">
            Comprehensive analytics and insights into platform usage, performance metrics, and user
            engagement patterns to optimize your financial analysis workflow.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <TabNav items={tabs} activeId={activeTab} onChange={setActiveTab} />
        </div>

        {/* Content Area */}
        <div>
          {activeTab === 'usage' && (
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <Eye className="w-6 h-6 text-primary mr-2" />
                <h2 className="text-xl font-semibold text-foreground">
                  Usage Analytics Dashboard
                </h2>
              </div>
              <Suspense fallback={<div className="text-sm text-foreground-secondary">Loading usage analytics…</div>}>
                <UserAnalyticsDashboard />
              </Suspense>
            </Card>
          )}

          {activeTab === 'performance' && (
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <Activity className="w-6 h-6 text-primary mr-2" />
                <h2 className="text-xl font-semibold text-foreground">
                  Performance Monitoring
                </h2>
              </div>
              <Suspense fallback={<div className="text-sm text-foreground-secondary">Loading performance dashboard…</div>}>
                <PerformanceDashboard />
              </Suspense>
            </Card>
          )}

          {activeTab === 'users' && (
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <Users className="w-6 h-6 text-primary mr-2" />
                <h2 className="text-xl font-semibold text-foreground">
                  User Insights & Engagement
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard label="Active Users" value="2,847" color="primary" caption="+12.3% from last month" captionColor="success" />
                <MetricCard label="Avg Session Duration" value="4.2" color="success" caption="+0.3 hours" captionColor="success" />
                <MetricCard label="Models Created" value="847" color="primary" caption="This week" captionColor="primary" />
                <MetricCard label="User Satisfaction" value="94.2%" color="success" caption="+2.1% improvement" captionColor="success" />
              </div>

              <div className="mt-6 text-center">
                <div className="bg-muted rounded-lg p-8 text-foreground-secondary">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  Detailed user analytics and engagement metrics coming soon
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'business' && (
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <TrendingUp className="w-6 h-6 text-primary mr-2" />
                <h2 className="text-xl font-semibold text-foreground">
                  Business Intelligence
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Revenue Metrics */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Revenue Metrics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">ARR</span>
                      <span className="font-semibold text-foreground">$2.4M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">MRR Growth</span>
                      <span className="font-semibold text-success">+18.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Churn Rate</span>
                      <span className="font-semibold text-destructive">2.1%</span>
                    </div>
                  </div>
                </div>

                {/* Feature Usage */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Feature Adoption
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">DCF Models</span>
                      <span className="font-semibold text-foreground">89%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Portfolio Tools</span>
                      <span className="font-semibold text-foreground">67%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">AI Insights</span>
                      <span className="font-semibold text-foreground">45%</span>
                    </div>
                  </div>
                </div>

                {/* Support Metrics */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Support Quality
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Response Time</span>
                      <span className="font-semibold text-foreground">2.1h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Resolution Rate</span>
                      <span className="font-semibold text-success">96.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Satisfaction</span>
                      <span className="font-semibold text-foreground">4.8/5</span>
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
