/**
 * Automated Insights & Key Driver Analysis Component
 * Provides AI-powered insights, recommendations, and key driver analysis
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Eye,
  RefreshCw,
  Download,
  Share2,
  Settings,
  Filter,
  Search,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ArrowRight,
  Info,
  Bookmark,
  Clock,
  Users,
  DollarSign,
  Percent,
  Calculator
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  GitBranch
} from 'recharts';

const AutomatedInsights = ({ modelData, financialData, onDataChange }) => {
  const [activeTab, setActiveTab] = useState('insights');
  const [insights, setInsights] = useState([
    {
      id: 1,
      type: 'opportunity',
      title: 'WACC Optimization Opportunity',
      description: 'Current WACC of 9.2% is 180bps above industry median. Optimizing capital structure could increase valuation by 15-20%.',
      impact: 'high',
      confidence: 85,
      category: 'valuation',
      recommendation: 'Consider increasing debt-to-equity ratio to 0.6x from current 0.4x',
      potentialValue: '+$180M',
      priority: 1,
      aiGenerated: true,
      timestamp: new Date('2024-01-15T14:30:00Z'),
      tags: ['wacc', 'capital-structure', 'optimization'],
      actions: ['Analyze debt capacity', 'Model optimal capital structure', 'Stress test scenarios']
    },
    {
      id: 2,
      type: 'risk',
      title: 'Revenue Concentration Risk',
      description: 'Top 3 customers represent 62% of total revenue, creating concentration risk that affects valuation multiple.',
      impact: 'medium',
      confidence: 92,
      category: 'risk',
      recommendation: 'Apply 10-15% discount to peer multiples due to customer concentration',
      potentialValue: '-$95M',
      priority: 2,
      aiGenerated: true,
      timestamp: new Date('2024-01-15T10:15:00Z'),
      tags: ['customer-concentration', 'risk', 'multiples'],
      actions: ['Customer diversification strategy', 'Contract analysis', 'Revenue forecasting']
    },
    {
      id: 3,
      type: 'trend',
      title: 'Market Multiple Expansion',
      description: 'Industry EV/EBITDA multiples have expanded 25% over last 12 months, suggesting valuation upside.',
      impact: 'high',
      confidence: 78,
      category: 'market',
      recommendation: 'Update exit multiples to reflect current market conditions',
      potentialValue: '+$240M',
      priority: 1,
      aiGenerated: true,
      timestamp: new Date('2024-01-14T16:45:00Z'),
      tags: ['multiples', 'market-trends', 'exit-valuation'],
      actions: ['Update comparable analysis', 'Refresh exit assumptions', 'Market timing analysis']
    }
  ]);

  const [keyDrivers, setKeyDrivers] = useState([
    {
      id: 1,
      name: 'Revenue Growth Rate',
      currentValue: '12%',
      impact: 'high',
      sensitivity: 85,
      elasticity: 2.4,
      range: { min: '8%', max: '18%' },
      valuationImpact: { min: '-$150M', max: '+$280M' },
      benchmarks: { peer: '10%', industry: '11%', historical: '14%' }
    },
    {
      id: 2,
      name: 'EBITDA Margin',
      currentValue: '24%',
      impact: 'high',
      sensitivity: 78,
      elasticity: 1.8,
      range: { min: '20%', max: '28%' },
      valuationImpact: { min: '-$120M', max: '+$200M' },
      benchmarks: { peer: '22%', industry: '25%', historical: '23%' }
    },
    {
      id: 3,
      name: 'Terminal Growth Rate',
      currentValue: '2.5%',
      impact: 'medium',
      sensitivity: 65,
      elasticity: 1.2,
      range: { min: '1.5%', max: '3.5%' },
      valuationImpact: { min: '-$80M', max: '+$120M' },
      benchmarks: { peer: '2.0%', industry: '2.5%', historical: '3.0%' }
    },
    {
      id: 4,
      name: 'WACC',
      currentValue: '9.2%',
      impact: 'high',
      sensitivity: 82,
      elasticity: -1.6,
      range: { min: '7.5%', max: '11%' },
      valuationImpact: { min: '-$90M', max: '+$160M' },
      benchmarks: { peer: '8.5%', industry: '7.4%', historical: '8.8%' }
    }
  ]);

  const [performanceMetrics] = useState({
    modelAccuracy: 94,
    predictionConfidence: 87,
    insightsGenerated: 24,
    recommendationsImplemented: 18,
    valuationImprovement: 12.5
  });

  const [sensitivityData] = useState([
    { driver: 'Revenue Growth', scenario: 'Base', value: 1200, impact: 0 },
    { driver: 'Revenue Growth', scenario: 'Upside', value: 1480, impact: 23 },
    { driver: 'Revenue Growth', scenario: 'Downside', value: 1050, impact: -12 },
    { driver: 'EBITDA Margin', scenario: 'Base', value: 1200, impact: 0 },
    { driver: 'EBITDA Margin', scenario: 'Upside', value: 1400, impact: 17 },
    { driver: 'EBITDA Margin', scenario: 'Downside', value: 1080, impact: -10 },
    { driver: 'WACC', scenario: 'Base', value: 1200, impact: 0 },
    { driver: 'WACC', scenario: 'Upside', value: 1360, impact: 13 },
    { driver: 'WACC', scenario: 'Downside', value: 1110, impact: -8 }
  ]);

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'risk':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'trend':
        return <Activity className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatCurrency = (value) => {
    if (typeof value === 'string' && (value.includes('$') || value.includes('M'))) {
      return value;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value * 1000000);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Brain className="w-6 h-6 mr-3" />
            AI-Powered Insights & Analytics
          </h2>
          <p className="text-violet-100 mt-2">
            Automated insights, key driver analysis, and intelligent recommendations
          </p>
        </div>

        {/* Performance Dashboard */}
        <div className="border-b border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-violet-600">{performanceMetrics.modelAccuracy}%</div>
              <div className="text-sm text-gray-600">Model Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{performanceMetrics.predictionConfidence}%</div>
              <div className="text-sm text-gray-600">Prediction Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{performanceMetrics.insightsGenerated}</div>
              <div className="text-sm text-gray-600">Insights Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{performanceMetrics.recommendationsImplemented}</div>
              <div className="text-sm text-gray-600">Recommendations Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">+{performanceMetrics.valuationImprovement}%</div>
              <div className="text-sm text-gray-600">Valuation Improvement</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'insights', label: 'AI Insights', icon: Lightbulb, count: insights.length },
              { id: 'drivers', label: 'Key Drivers', icon: Target, count: keyDrivers.length },
              { id: 'sensitivity', label: 'Sensitivity Analysis', icon: BarChart3, count: 0 },
              { id: 'recommendations', label: 'Recommendations', icon: CheckCircle, count: 3 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-violet-500 text-violet-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* AI Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Automated Insights</h3>
                <div className="flex space-x-3">
                  <button className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Insights
                  </button>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure AI
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {insights.map((insight) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 rounded-lg p-6 border-l-4 border-l-violet-500"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        {getTypeIcon(insight.type)}
                        <div>
                          <h4 className="font-medium text-gray-900 flex items-center">
                            {insight.title}
                            {insight.aiGenerated && (
                              <span className="ml-2 bg-violet-100 text-violet-800 px-2 py-1 rounded text-xs font-medium">
                                AI Generated
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getImpactColor(insight.impact)}`}>
                          {insight.impact} impact
                        </span>
                        <span className="text-sm text-gray-500">{insight.confidence}% confidence</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Recommendation</div>
                        <p className="text-sm text-gray-900">{insight.recommendation}</p>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Potential Impact</div>
                        <p
                          className={`text-sm font-medium ${
                            insight.potentialValue.includes('+') ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {insight.potentialValue}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {insight.tags.map((tag) => (
                            <span key={tag} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-green-600 p-2">
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-red-600 p-2">
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-blue-600 p-2">
                          <Bookmark className="w-4 h-4" />
                        </button>
                        <button className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded text-sm">
                          Apply
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Key Drivers Tab */}
          {activeTab === 'drivers' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Key Value Drivers</h3>

              <div className="space-y-4">
                {keyDrivers.map((driver) => (
                  <div key={driver.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">{driver.name}</h4>
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl font-bold text-violet-600">{driver.currentValue}</span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getImpactColor(driver.impact)}`}>
                          {driver.impact} impact
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Sensitivity Metrics */}
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Sensitivity Metrics</div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Sensitivity Score:</span>
                            <span className="font-medium">{driver.sensitivity}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Elasticity:</span>
                            <span className="font-medium">{driver.elasticity}x</span>
                          </div>
                        </div>
                      </div>

                      {/* Range Analysis */}
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Range & Impact</div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Range:</span>
                            <span className="font-medium">{driver.range.min} - {driver.range.max}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Value Impact:</span>
                            <span className="font-medium">{driver.valuationImpact.min} / {driver.valuationImpact.max}</span>
                          </div>
                        </div>
                      </div>

                      {/* Benchmarks */}
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Benchmarks</div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Peer Average:</span>
                            <span className="font-medium">{driver.benchmarks.peer}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Industry:</span>
                            <span className="font-medium">{driver.benchmarks.industry}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Historical:</span>
                            <span className="font-medium">{driver.benchmarks.historical}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Sensitivity Score</span>
                        <span>{driver.sensitivity}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-violet-600 h-2 rounded-full"
                          style={{ width: `${driver.sensitivity}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sensitivity Analysis Tab */}
          {activeTab === 'sensitivity' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Sensitivity Analysis</h3>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Key Driver Impact on Valuation</h4>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={sensitivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="driver" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left" dataKey="value" fill="#8B5CF6"
                      name="Valuation ($M)"
                    />
                    <Line
                      yAxisId="right" type="monotone" dataKey="impact"
                      stroke="#10B981" name="Impact %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">AI Recommendations</h3>

              <div className="bg-violet-50 border border-violet-200 rounded-lg p-6">
                <div className="flex items-start">
                  <Zap className="w-6 h-6 text-violet-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-violet-900">Smart Recommendations Engine</h4>
                    <p className="text-sm text-violet-700 mt-1">
                      Our AI analyzes your model and provides intelligent recommendations to optimize valuation and reduce risk.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {insights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      {getTypeIcon(insight.type)}
                      <span className="text-xs text-gray-500">Priority {insight.priority}</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{insight.recommendation}</p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${
                          insight.potentialValue.includes('+') ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {insight.potentialValue}
                      </span>
                      <button className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded text-xs">
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutomatedInsights;
