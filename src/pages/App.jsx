import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Calculator, 
  PieChart, 
  Database, 
  Settings, 
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

import Header from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useKeyboardShortcutsContext } from '../components/ui/KeyboardShortcutsProvider';

const App = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { showCommandPalette } = useKeyboardShortcutsContext();

  const quickActions = [
    {
      id: 'new-dcf',
      title: 'New DCF Model',
      description: 'Start a discounted cash flow analysis',
      icon: Calculator,
      color: 'bg-blue-500',
      action: () => navigate('/models?type=dcf'),
    },
    {
      id: 'portfolio-overview',
      title: 'Portfolio Overview',
      description: 'View your portfolio performance',
      icon: PieChart,
      color: 'bg-green-500',
      action: () => navigate('/portfolio'),
    },
    {
      id: 'market-data',
      title: 'Live Market Data',
      description: 'Access real-time market information',
      icon: TrendingUp,
      color: 'bg-purple-500',
      action: () => navigate('/real-time-market-data-center'),
    },
    {
      id: 'data-sources',
      title: 'Data Sources',
      description: 'Manage your data connections',
      icon: Database,
      color: 'bg-orange-500',
      action: () => navigate('/data'),
    },
  ];

  const recentActivity = [
    { id: 1, title: 'AAPL DCF Analysis', time: '2 hours ago', type: 'model' },
    { id: 2, title: 'Portfolio Rebalancing', time: '1 day ago', type: 'portfolio' },
    { id: 3, title: 'Tech Sector Report', time: '2 days ago', type: 'report' },
    { id: 4, title: 'Market Data Sync', time: '3 days ago', type: 'data' },
  ];

  const platforms = [
    {
      title: 'Financial Models',
      description: 'DCF, LBO, Comps, and EPV models',
      icon: Calculator,
      route: '/models',
      stats: '4 Model Types',
      color: 'bg-blue-50 border-blue-200',
    },
    {
      title: 'Portfolio Management',
      description: 'Holdings, risk analysis, and attribution',
      icon: PieChart,
      route: '/portfolio',
      stats: 'Live Tracking',
      color: 'bg-green-50 border-green-200',
    },
    {
      title: 'Market Data Center',
      description: 'Real-time data and market analysis',
      icon: Activity,
      route: '/real-time-market-data-center',
      stats: 'Real-time',
      color: 'bg-purple-50 border-purple-200',
    },
    {
      title: 'Valuation Workbench',
      description: 'Advanced valuation tools and models',
      icon: BarChart3,
      route: '/valuation-workbench',
      stats: 'Pro Tools',
      color: 'bg-orange-50 border-orange-200',
    },
    {
      title: 'AI Insights',
      description: 'AI-powered financial analysis',
      icon: Brain,
      route: '/ai-insights',
      stats: 'AI-Powered',
      color: 'bg-indigo-50 border-indigo-200',
    },
    {
      title: 'Reports & Analytics',
      description: 'Generate comprehensive reports',
      icon: FileText,
      route: '/reports',
      stats: 'Custom Reports',
      color: 'bg-pink-50 border-pink-200',
    },
  ];

  const handleQuickAction = useCallback((action) => {
    action();
  }, []);

  // Local keyboard handler removed; global Cmd/Ctrl+K handled by KeyboardShortcutsProvider

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Analysis Platform</h1>
            <p className="text-gray-600">
              Professional-grade tools for comprehensive financial analysis and portfolio management
            </p>
          </div>

          {/* Command Palette Trigger */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search models, portfolios, or use Cmd+K for command palette..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={() => showCommandPalette()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 text-gray-400">
                <Command className="w-4 h-4" />
                <span className="text-sm">K</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <motion.div
                  key={action.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
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
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Platforms */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Platforms</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {platforms.map((platform) => (
                  <motion.div
                    key={platform.title}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link to={platform.route}>
                      <Card className={`p-6 transition-all duration-200 hover:shadow-lg ${platform.color}`}>
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
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 py-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-600">{item.time}</p>
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
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Favorites
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">AAPL DCF Model</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Growth Portfolio</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Tech Comps</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Card>

              {/* Quick Stats */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Models</span>
                    <span className="text-sm font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Portfolio Value</span>
                    <span className="text-sm font-medium text-green-600">$125,430</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Data Sources</span>
                    <span className="text-sm font-medium">5 Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Sync</span>
                    <span className="text-sm font-medium">2 min ago</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
      
    </div>
  );
};

export default App;