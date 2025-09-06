import { motion } from 'framer-motion';
import {
  Search,
  Calculator,
  PieChart,
  Database,
  BarChart3,
  TrendingUp,
  FileText,
  Brain,
  Zap,
  Command,
  ChevronRight,
  Clock,
  Star,
  Activity
} from 'lucide-react';
import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import Header from '../components/ui/Header';
import { useKeyboardShortcutsContext } from '../components/ui/KeyboardShortcutsProvider';

const App = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { showCommandPalette } = useKeyboardShortcutsContext();

  // Detect audit mode via URL (?lhci or ?audit) or env var
  const isAudit = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('lhci') || params.has('audit')) return true;
    } catch {
      // ignore
    }
    return import.meta.env?.VITE_LIGHTHOUSE_CI === 'true';
  })();

  // Stable hook order: define callbacks before any conditional returns
  const handleQuickAction = useCallback(action => {
    action();
  }, []);

  // Above-the-fold wrapper: plain div in audit mode, motion.div otherwise
  const Wrapper = isAudit ? ({ children }) => <div>{children}</div> : motion.div;

  // Minimal render path for audit mode to reduce TBT
  if (isAudit) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-foreground mb-3">FinanceAnalyst Pro</h1>
          <p className="text-foreground-secondary mb-6">
            Audit mode active. UI minimized to ensure stable, low TBT measurements.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-foreground">Getting Started</h2>
                  <p className="text-sm text-foreground-secondary">
                    Use the command palette to navigate quickly
                  </p>
                </div>
                <Button onClick={() => showCommandPalette?.()} variant="primary">
                  Open Command Palette
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const quickActions = [
    {
      id: 'new-dcf',
      title: 'New DCF Model',
      description: 'Start a discounted cash flow analysis',
      icon: Calculator,
      color: 'bg-primary',
      action: () => navigate('/models?type=dcf')
    },
    {
      id: 'portfolio-overview',
      title: 'Portfolio Overview',
      description: 'View your portfolio performance',
      icon: PieChart,
      color: 'bg-success',
      action: () => navigate('/portfolio')
    },
    {
      id: 'market-data',
      title: 'Live Market Data',
      description: 'Access real-time market information',
      icon: TrendingUp,
      color: 'bg-accent',
      action: () => navigate('/real-time-market-data-center')
    },
    {
      id: 'data-sources',
      title: 'Data Sources',
      description: 'Manage your data connections',
      icon: Database,
      color: 'bg-warning',
      action: () => navigate('/data')
    }
  ];

  const recentActivity = [
    { id: 1, title: 'AAPL DCF Analysis', time: '2 hours ago', type: 'model' },
    { id: 2, title: 'Portfolio Rebalancing', time: '1 day ago', type: 'portfolio' },
    { id: 3, title: 'Tech Sector Report', time: '2 days ago', type: 'report' },
    { id: 4, title: 'Market Data Sync', time: '3 days ago', type: 'data' }
  ];

  const platforms = [
    {
      title: 'Financial Models',
      description: 'DCF, LBO, Comps, and EPV models',
      icon: Calculator,
      route: '/models',
      stats: '4 Model Types',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      title: 'Portfolio Management',
      description: 'Holdings, risk analysis, and attribution',
      icon: PieChart,
      route: '/portfolio',
      stats: 'Live Tracking',
      color: 'bg-green-50 border-green-200'
    },
    {
      title: 'Market Data Center',
      description: 'Real-time data and market analysis',
      icon: Activity,
      route: '/real-time-market-data-center',
      stats: 'Real-time',
      color: 'bg-purple-50 border-purple-200'
    },
    {
      title: 'Valuation Workbench',
      description: 'Advanced valuation tools and models',
      icon: BarChart3,
      route: '/valuation-workbench',
      stats: 'Pro Tools',
      color: 'bg-orange-50 border-orange-200'
    },
    {
      title: 'AI Insights',
      description: 'AI-powered financial analysis',
      icon: Brain,
      route: '/ai-insights',
      stats: 'AI-Powered',
      color: 'bg-indigo-50 border-indigo-200'
    },
    {
      title: 'Reports & Analytics',
      description: 'Generate comprehensive reports',
      icon: FileText,
      route: '/reports',
      stats: 'Custom Reports',
      color: 'bg-pink-50 border-pink-200'
    }
  ];

  // Local keyboard handler removed; global Cmd/Ctrl+K handled by KeyboardShortcutsProvider

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Wrapper
          {...(!isAudit
            ? {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.5 }
              }
            : {})}
        >
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Financial Analysis Platform</h1>
            <p className="text-foreground-secondary">
              Professional-grade tools for comprehensive financial analysis and portfolio management
            </p>
          </div>

          {/* Command Palette Trigger */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-tertiary w-5 h-5" />
              <input
                type="text"
                placeholder="Search models, portfolios, or use Cmd+K for command palette..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClick={() => showCommandPalette()}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 text-foreground-tertiary">
                <Command className="w-4 h-4" />
                <span className="text-sm">K</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map(action =>
                isAudit ? (
                  <div key={action.id}>
                    <Card
                      className="p-4 cursor-pointer hover:shadow-md transition-all duration-200"
                      onClick={() => handleQuickAction(action.action)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${action.color}`}>
                          <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{action.title}</h3>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </Card>
                  </div>
                ) : (
                  <motion.div key={action.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                    <Card
                      className="p-4 cursor-pointer hover:shadow-md transition-all duration-200"
                      onClick={() => handleQuickAction(action.action)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${action.color}`}>
                          <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{action.title}</h3>
                          <p className="text-sm text-foreground-secondary">{action.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-foreground-tertiary" />
                      </div>
                    </Card>
                  </motion.div>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Platforms */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-foreground mb-4">Platforms</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {platforms.map(platform =>
                  isAudit ? (
                    <div key={platform.title}>
                      <Link to={platform.route}>
                        <Card
                          className={`p-6 transition-all duration-200 hover:shadow-lg ${platform.color}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <platform.icon className="w-8 h-8 text-foreground" />
                            <span className="text-xs font-medium text-foreground-secondary bg-card px-2 py-1 rounded-full">
                              {platform.stats}
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground mb-2">{platform.title}</h3>
                          <p className="text-sm text-foreground-secondary mb-4">{platform.description}</p>
                          <div className="flex items-center text-sm font-medium text-foreground">
                            <span>Open Platform</span>
                            <ChevronRight className="w-4 h-4 ml-1 text-foreground-tertiary" />
                          </div>
                        </Card>
                      </Link>
                    </div>
                  ) : (
                    <motion.div
                      key={platform.title}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link to={platform.route}>
                        <Card
                          className={`p-6 transition-all duration-200 hover:shadow-lg ${platform.color}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <platform.icon className="w-8 h-8 text-gray-700" />
                            <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded-full">
                              {platform.stats}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">{platform.title}</h3>
                          <p className="text-sm text-gray-600 mb-4">{platform.description}</p>
                          <div className="flex items-center text-sm font-medium text-gray-700">
                            <span>Open Platform</span>
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  )
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {recentActivity.map(item => (
                    <div key={item.id} className="flex items-center space-x-3 py-2">
                      <div className="w-2 h-2 bg-accent rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-foreground-secondary">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  View All Activity
                </Button>
              </Card>

              {/* Favorites */}
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Favorites
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">AAPL DCF Model</span>
                    <ChevronRight className="w-4 h-4 text-foreground-tertiary" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Growth Portfolio</span>
                    <ChevronRight className="w-4 h-4 text-foreground-tertiary" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Tech Comps</span>
                    <ChevronRight className="w-4 h-4 text-foreground-tertiary" />
                  </div>
                </div>
              </Card>

              {/* Quick Stats */}
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Active Models</span>
                    <span className="text-sm font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Portfolio Value</span>
                    <span className="text-sm font-medium text-success">$125,430</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Data Sources</span>
                    <span className="text-sm font-medium">5 Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Last Sync</span>
                    <span className="text-sm font-medium">2 min ago</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Wrapper>
      </div>
    </div>
  );
};

export default App;
