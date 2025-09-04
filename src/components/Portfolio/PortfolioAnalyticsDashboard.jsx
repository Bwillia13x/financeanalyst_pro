import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Activity,
  PieChart,
  Zap,
  Shield,
  RefreshCw,
  Settings,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import portfolioAnalyticsService from '../../services/financial/portfolioAnalyticsService';

const PortfolioAnalyticsDashboard = ({
  portfolio = {},
  marketData = {},
  onAnalyticsCalculated,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [varMethod, setVarMethod] = useState('parametric');
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [timeHorizon, setTimeHorizon] = useState(1);
  const [analyticsResults, setAnalyticsResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Default portfolio structure
  const defaultPortfolio = {
    assets: [
      { symbol: 'AAPL', price: 150, quantity: 100, weight: 0.4, volatility: 0.25 },
      { symbol: 'MSFT', price: 300, quantity: 50, weight: 0.3, volatility: 0.22 },
      { symbol: 'GOOGL', price: 2500, quantity: 20, weight: 0.2, volatility: 0.28 },
      { symbol: 'TSLA', price: 200, quantity: 25, weight: 0.1, volatility: 0.45 }
    ],
    weights: [0.4, 0.3, 0.2, 0.1],
    covarianceMatrix: [
      [0.0625, 0.015, 0.018, 0.025],
      [0.015, 0.0484, 0.014, 0.02],
      [0.018, 0.014, 0.0784, 0.03],
      [0.025, 0.02, 0.03, 0.2025]
    ],
    portfolioValue: 77500,
    ...portfolio
  };

  // Calculate analytics when parameters change
  useEffect(() => {
    calculateAnalytics();
  }, [varMethod, confidenceLevel, timeHorizon]);

  const calculateAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate VaR
      const varResult = portfolioAnalyticsService.calculateVaR(
        defaultPortfolio,
        confidenceLevel,
        timeHorizon,
        varMethod
      );

      // Calculate stress test scenarios
      const stressScenarios = [
        {
          name: 'Market Crash 2008',
          type: 'percentage',
          shocks: { AAPL: -0.4, MSFT: -0.35, GOOGL: -0.45, TSLA: -0.6 },
          timeHorizon: 1
        },
        {
          name: 'Tech Sector Decline',
          type: 'percentage',
          shocks: { AAPL: -0.25, MSFT: -0.3, GOOGL: -0.35, TSLA: -0.4 },
          timeHorizon: 1
        },
        {
          name: 'Interest Rate Hike',
          type: 'percentage',
          shocks: { AAPL: -0.1, MSFT: -0.08, GOOGL: -0.12, TSLA: -0.15 },
          timeHorizon: 1
        }
      ];

      const stressTestResult = portfolioAnalyticsService.stressTestPortfolio(
        defaultPortfolio,
        stressScenarios
      );

      // Mock factor data for risk attribution
      const factors = [
        { name: 'Market', variance: 0.04, importance: 1.0 },
        { name: 'Value', variance: 0.02, importance: 0.8 },
        { name: 'Growth', variance: 0.03, importance: 0.9 },
        { name: 'Size', variance: 0.025, importance: 0.7 }
      ];

      const riskAttributionResult = portfolioAnalyticsService.riskAttribution(
        defaultPortfolio,
        factors
      );

      const results = {
        var: varResult,
        stressTest: stressTestResult,
        riskAttribution: riskAttributionResult,
        timestamp: Date.now()
      };

      setAnalyticsResults(results);
      onAnalyticsCalculated?.(results);
    } catch (err) {
      setError(err.message);
      console.error('Analytics calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    if (!analyticsResults) return null;

    const { var: varResult, stressTest } = analyticsResults;

    return {
      totalValue: defaultPortfolio.portfolioValue,
      var: varResult.var,
      varPercentage: (varResult.var / defaultPortfolio.portfolioValue) * 100,
      expectedShortfall: varResult.expectedShortfall,
      volatility: Math.sqrt(
        defaultPortfolio.covarianceMatrix.reduce(
          (sum, row, i) =>
            sum +
            row.reduce(
              (rowSum, val, j) =>
                rowSum + val * defaultPortfolio.weights[i] * defaultPortfolio.weights[j],
              0
            ),
          0
        )
      ),
      worstCaseScenario: stressTest.worstCase,
      diversificationRatio: calculateDiversificationRatio(defaultPortfolio)
    };
  }, [analyticsResults]);

  const calculateDiversificationRatio = portfolio => {
    const { weights, covarianceMatrix } = portfolio;
    const portfolioVariance = weights.reduce(
      (sum, w, i) =>
        sum + w * covarianceMatrix[i].reduce((rowSum, cov, j) => rowSum + cov * weights[j], 0),
      0
    );

    const weightedAvgVariance = weights.reduce((sum, w, i) => sum + w * covarianceMatrix[i][i], 0);

    return Math.sqrt(weightedAvgVariance) / Math.sqrt(portfolioVariance);
  };

  const formatCurrency = value => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value, decimals = 2) => {
    return (value * 100).toFixed(decimals) + '%';
  };

  const getRiskColor = (value, threshold = 0.1) => {
    if (value > threshold) return 'text-red-400';
    if (value > threshold * 0.5) return 'text-yellow-400';
    return 'text-green-400';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'var', label: 'VaR Analysis', icon: Shield },
    { id: 'stress', label: 'Stress Testing', icon: AlertTriangle },
    { id: 'attribution', label: 'Risk Attribution', icon: PieChart },
    { id: 'factors', label: 'Factor Analysis', icon: Activity }
  ];

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Portfolio Analytics</h3>
            <p className="text-xs text-slate-400">
              {formatCurrency(defaultPortfolio.portfolioValue)} Portfolio Value
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Advanced settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={calculateAnalytics}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Recalculate"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg m-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-700">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="p-4 border-b border-slate-700 bg-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">VaR Method</label>
              <select
                value={varMethod}
                onChange={e => setVarMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
              >
                <option value="parametric">Parametric</option>
                <option value="historical">Historical</option>
                <option value="monte_carlo">Monte Carlo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Confidence Level</label>
              <select
                value={confidenceLevel}
                onChange={e => setConfidenceLevel(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
              >
                <option value={0.95}>95%</option>
                <option value={0.99}>99%</option>
                <option value={0.999}>99.9%</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Time Horizon (Days)</label>
              <select
                value={timeHorizon}
                onChange={e => setTimeHorizon(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
              >
                <option value={1}>1 Day</option>
                <option value={5}>5 Days</option>
                <option value={10}>10 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            {portfolioMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Portfolio Value</span>
                    <Target className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(portfolioMetrics.totalValue)}
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">
                      VaR ({(confidenceLevel * 100).toFixed(0)}%)
                    </span>
                    <Shield className="w-4 h-4 text-red-400" />
                  </div>
                  <div
                    className={`text-xl font-bold ${getRiskColor(portfolioMetrics.varPercentage / 100)}`}
                  >
                    {formatCurrency(portfolioMetrics.var)}
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatPercent(portfolioMetrics.varPercentage / 100)}
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Volatility</span>
                    <Activity className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className={`text-xl font-bold ${getRiskColor(portfolioMetrics.volatility)}`}>
                    {formatPercent(portfolioMetrics.volatility)}
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Diversification</span>
                    <PieChart className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-xl font-bold text-green-400">
                    {(portfolioMetrics.diversificationRatio * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            )}

            {/* Asset Allocation */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-4">Asset Allocation</h4>
              <div className="space-y-3">
                {defaultPortfolio.assets.map((asset, index) => (
                  <div key={asset.symbol} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-sm text-white">{asset.symbol}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-400">
                        {formatCurrency(asset.price * asset.quantity)}
                      </span>
                      <span className="text-sm text-white font-medium">
                        {formatPercent(asset.weight)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Warnings */}
            {portfolioMetrics && portfolioMetrics.varPercentage > 5 && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="text-yellow-300 font-medium">High Risk Warning</div>
                    <div className="text-sm text-yellow-200">
                      Your portfolio has a VaR of{' '}
                      {formatPercent(portfolioMetrics.varPercentage / 100)} at{' '}
                      {confidenceLevel * 100}% confidence. Consider diversification or risk
                      management strategies.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'var' && analyticsResults && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* VaR Summary */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-4">VaR Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">
                      VaR ({analyticsResults.var.confidenceLevel * 100}%)
                    </span>
                    <span className="text-sm text-white font-medium">
                      {formatCurrency(analyticsResults.var.var)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Expected Shortfall</span>
                    <span className="text-sm text-white font-medium">
                      {formatCurrency(analyticsResults.var.expectedShortfall)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Method</span>
                    <span className="text-sm text-blue-400 capitalize">
                      {analyticsResults.var.method.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Time Horizon</span>
                    <span className="text-sm text-white">
                      {analyticsResults.var.timeHorizon} day
                      {analyticsResults.var.timeHorizon > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* VaR Components */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-4">VaR by Asset</h4>
                <div className="space-y-3">
                  {analyticsResults.var.components?.map((component, index) => (
                    <div key={component.asset} className="flex justify-between items-center">
                      <span className="text-sm text-slate-300">{component.asset}</span>
                      <div className="text-right">
                        <div className="text-sm text-white font-medium">
                          {formatCurrency(component.varContribution)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {component.percentageContribution.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stress' && analyticsResults && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {analyticsResults.stressTest.stressTestResults.map((scenario, index) => (
                <div key={scenario.scenario} className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-white">{scenario.scenario}</h4>
                    <div
                      className={`text-lg font-bold ${
                        scenario.impactPercentage < -5
                          ? 'text-red-400'
                          : scenario.impactPercentage < -2
                            ? 'text-yellow-400'
                            : 'text-green-400'
                      }`}
                    >
                      {formatPercent(scenario.impactPercentage / 100)}
                    </div>
                  </div>

                  <div className="text-sm text-slate-400 mb-3">
                    Portfolio Impact: {formatCurrency(scenario.portfolioImpact)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {scenario.assetImpacts.map((impact, assetIndex) => (
                      <div key={impact.symbol} className="text-center">
                        <div className="text-xs text-slate-400">{impact.symbol}</div>
                        <div
                          className={`text-sm font-medium ${
                            impact.weightedImpact < 0 ? 'text-red-400' : 'text-green-400'
                          }`}
                        >
                          {formatCurrency(impact.weightedImpact)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'attribution' && analyticsResults && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risk Attribution Summary */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-4">Risk Attribution</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Total Portfolio Risk</span>
                    <span className="text-sm text-white font-medium">
                      {formatPercent(analyticsResults.riskAttribution.totalPortfolioRisk)}
                    </span>
                  </div>

                  {Object.entries(analyticsResults.riskAttribution.percentageContributions).map(
                    ([factor, contribution]) => (
                      <div key={factor} className="flex justify-between">
                        <span className="text-sm text-slate-400">{factor} Factor</span>
                        <span className="text-sm text-white font-medium">
                          {contribution.toFixed(1)}%
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Factor Contributions Chart */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-4">Factor Contributions</h4>
                <div className="space-y-3">
                  {Object.entries(analyticsResults.riskAttribution.factorContributions).map(
                    ([factor, contribution]) => (
                      <div key={factor} className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-600 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(contribution / analyticsResults.riskAttribution.totalPortfolioRisk) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-16">
                          {formatPercent(contribution)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'factors' && (
          <div className="space-y-6">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-4">Factor Investing</h4>
              <div className="text-sm text-slate-400">
                Factor optimization and analysis features coming soon. This will include:
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Multi-factor portfolio construction</li>
                  <li>Factor exposure analysis</li>
                  <li>Risk-adjusted factor returns</li>
                  <li>Factor timing strategies</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <span className="ml-3 text-slate-300">Calculating portfolio analytics...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioAnalyticsDashboard;
