import { BarChart3, AlertTriangle, Target, Activity, PieChart, Shield, RefreshCw, Settings } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import portfolioAnalyticsService from '../../services/financial/portfolioAnalyticsService';

const PortfolioAnalyticsDashboard = ({
  portfolio = {},
  _marketData = {},
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
    if (value > threshold) return 'text-destructive';
    if (value > threshold * 0.5) return 'text-warning';
    return 'text-success';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'var', label: 'VaR Analysis', icon: Shield },
    { id: 'stress', label: 'Stress Testing', icon: AlertTriangle },
    { id: 'attribution', label: 'Risk Attribution', icon: PieChart },
    { id: 'factors', label: 'Factor Analysis', icon: Activity }
  ];

  return (
    <div className={`bg-card border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Portfolio Analytics</h3>
            <p className="text-xs text-foreground-secondary">
              {formatCurrency(defaultPortfolio.portfolioValue)} Portfolio Value
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            aria-label="Advanced settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={calculateAnalytics}
            disabled={loading}
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            aria-label="Recalculate"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg m-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <span className="text-destructive">{error}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-accent border-b-2 border-accent bg-accent/10'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-muted'
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
        <div className="p-4 border-b border-border bg-muted">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="var-method" className="block text-sm text-foreground-secondary mb-2">VaR Method</label>
              <select
                value={varMethod}
                onChange={e => setVarMethod(e.target.value)}
                id="var-method"
                className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="parametric">Parametric</option>
                <option value="historical">Historical</option>
                <option value="monte_carlo">Monte Carlo</option>
              </select>
            </div>
            <div>
              <label htmlFor="confidence-level" className="block text-sm text-foreground-secondary mb-2">Confidence Level</label>
              <select
                value={confidenceLevel}
                onChange={e => setConfidenceLevel(parseFloat(e.target.value))}
                id="confidence-level"
                className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value={0.95}>95%</option>
                <option value={0.99}>99%</option>
                <option value={0.999}>99.9%</option>
              </select>
            </div>
            <div>
              <label htmlFor="time-horizon-days" className="block text-sm text-foreground-secondary mb-2">Time Horizon (Days)</label>
              <select
                value={timeHorizon}
                onChange={e => setTimeHorizon(parseInt(e.target.value))}
                id="time-horizon-days"
                className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground-secondary">Portfolio Value</span>
                    <Target className="w-4 h-4 text-accent" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(portfolioMetrics.totalValue)}
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground-secondary">
                      VaR ({(confidenceLevel * 100).toFixed(0)}%)
                    </span>
                    <Shield className="w-4 h-4 text-destructive" />
                  </div>
                  <div
                    className={`text-xl font-bold ${getRiskColor(portfolioMetrics.varPercentage / 100)}`}
                  >
                    {formatCurrency(portfolioMetrics.var)}
                  </div>
                  <div className="text-xs text-foreground-secondary">
                    {formatPercent(portfolioMetrics.varPercentage / 100)}
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground-secondary">Volatility</span>
                    <Activity className="w-4 h-4 text-accent" />
                  </div>
                  <div className={`text-xl font-bold ${getRiskColor(portfolioMetrics.volatility)}`}>
                    {formatPercent(portfolioMetrics.volatility)}
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground-secondary">Diversification</span>
                    <PieChart className="w-4 h-4 text-success" />
                  </div>
                  <div className="text-xl font-bold text-success">
                    {(portfolioMetrics.diversificationRatio * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            )}

            {/* Asset Allocation */}
            <div className="bg-muted rounded-lg p-4">
              <h4 className="text-sm font-semibold text-foreground mb-4">Asset Allocation</h4>
              <div className="space-y-3">
                {defaultPortfolio.assets.map(asset => (
                  <div key={asset.symbol} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-accent rounded-full" />
                      <span className="text-sm text-foreground">{asset.symbol}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-foreground-secondary">
                        {formatCurrency(asset.price * asset.quantity)}
                      </span>
                      <span className="text-sm text-foreground font-medium">
                        {formatPercent(asset.weight)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Warnings */}
            {portfolioMetrics && portfolioMetrics.varPercentage > 5 && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <div>
                    <div className="text-warning font-medium">High Risk Warning</div>
                    <div className="text-sm text-warning/90">
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
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-sm font-semibold text-foreground mb-4" id="var-summary">VaR Summary</h4>
                <div className="space-y-3" aria-labelledby="var-summary">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">
                      VaR ({analyticsResults.var.confidenceLevel * 100}%)
                    </span>
                    <span className="text-sm text-foreground font-medium">
                      {formatCurrency(analyticsResults.var.var)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Expected Shortfall</span>
                    <span className="text-sm text-foreground font-medium">
                      {formatCurrency(analyticsResults.var.expectedShortfall)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Method</span>
                    <span className="text-sm text-accent capitalize">
                      {analyticsResults.var.method.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Time Horizon</span>
                    <span className="text-sm text-foreground">
                      {analyticsResults.var.timeHorizon} day
                      {analyticsResults.var.timeHorizon > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* VaR Components */}
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-sm font-semibold text-foreground mb-4" id="var-components">VaR by Asset</h4>
                <div className="space-y-3" aria-labelledby="var-components">
                  {analyticsResults.var.components?.map(component => (
                    <div key={component.asset} className="flex justify-between items-center">
                      <span className="text-sm text-foreground">{component.asset}</span>
                      <div className="text-right">
                        <div className="text-sm text-foreground font-medium">
                          {formatCurrency(component.varContribution)}
                        </div>
                        <div className="text-xs text-foreground-secondary">
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
              {analyticsResults.stressTest.stressTestResults.map(scenario => (
                <div key={scenario.scenario} className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-foreground">{scenario.scenario}</h4>
                    <div
                      className={`text-lg font-bold ${
                        scenario.impactPercentage < -5
                          ? 'text-destructive'
                          : scenario.impactPercentage < -2
                            ? 'text-warning'
                            : 'text-success'
                      }`}
                    >
                      {formatPercent(scenario.impactPercentage / 100)}
                    </div>
                  </div>

                  <div className="text-sm text-foreground-secondary mb-3">
                    Portfolio Impact: {formatCurrency(scenario.portfolioImpact)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {scenario.assetImpacts.map(impact => (
                      <div key={impact.symbol} className="text-center">
                        <div className="text-xs text-foreground-secondary">{impact.symbol}</div>
                        <div
                          className={`text-sm font-medium ${
                            impact.weightedImpact < 0 ? 'text-destructive' : 'text-success'
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
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-sm font-semibold text-foreground mb-4">Risk Attribution</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground-secondary">Total Portfolio Risk</span>
                    <span className="text-sm text-foreground font-medium">
                      {formatPercent(analyticsResults.riskAttribution.totalPortfolioRisk)}
                    </span>
                  </div>

                  {Object.entries(analyticsResults.riskAttribution.percentageContributions).map(
                    ([factor, contribution]) => (
                      <div key={factor} className="flex justify-between">
                        <span className="text-sm text-foreground-secondary">{factor} Factor</span>
                        <span className="text-sm text-foreground font-medium">
                          {contribution.toFixed(1)}%
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Factor Contributions Chart */}
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-sm font-semibold text-foreground mb-4">Factor Contributions</h4>
                <div className="space-y-3">
                  {Object.entries(analyticsResults.riskAttribution.factorContributions).map(
                    ([factor, contribution]) => (
                      <div key={factor} className="flex items-center gap-3">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-accent h-2 rounded-full"
                            style={{
                              width: `${(contribution / analyticsResults.riskAttribution.totalPortfolioRisk) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-xs text-foreground-secondary w-16">
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
            <div className="bg-muted rounded-lg p-4">
              <h4 className="text-sm font-semibold text-foreground mb-4">Factor Investing</h4>
              <div className="text-sm text-foreground-secondary">
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
            <span className="ml-3 text-foreground-secondary">Calculating portfolio analytics...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioAnalyticsDashboard;
