import { Shield, AlertTriangle, TrendingUp, Activity, Bell, BellOff, RefreshCw, Zap } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import portfolioAnalyticsService from '../../services/financial/portfolioAnalyticsService';

const RiskManagementDashboard = ({
  portfolio = {},
  riskThresholds = {},
  onRiskAlert,
  className = ''
}) => {
  const [activeView] = useState('dashboard');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(true);
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Default risk thresholds
  const defaultThresholds = {
    varLimit: 0.05, // 5% VaR limit
    volatilityLimit: 0.25, // 25% volatility limit
    concentrationLimit: 0.3, // 30% single asset limit
    liquidityThreshold: 0.1, // 10% illiquidity warning
    ...riskThresholds
  };

  // Default portfolio
  const defaultPortfolio = {
    assets: [
      { symbol: 'AAPL', price: 150, quantity: 100, weight: 0.4, volatility: 0.25, liquidity: 0.95 },
      { symbol: 'MSFT', price: 300, quantity: 50, weight: 0.3, volatility: 0.22, liquidity: 0.92 },
      {
        symbol: 'GOOGL',
        price: 2500,
        quantity: 20,
        weight: 0.2,
        volatility: 0.28,
        liquidity: 0.88
      },
      { symbol: 'TSLA', price: 200, quantity: 25, weight: 0.1, volatility: 0.45, liquidity: 0.85 }
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

  // Calculate risk metrics
  useEffect(() => {
    calculateRiskMetrics();
    if (realTimeMonitoring) {
      const interval = setInterval(calculateRiskMetrics, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [realTimeMonitoring]);

  // Check for risk alerts
  useEffect(() => {
    if (riskMetrics && alertsEnabled) {
      checkRiskAlerts();
    }
  }, [riskMetrics, alertsEnabled]);

  const calculateRiskMetrics = async () => {
    setLoading(true);

    try {
      // Calculate VaR
      const varResult = portfolioAnalyticsService.calculateVaR(
        defaultPortfolio,
        0.95,
        1,
        'parametric'
      );

      // Calculate additional risk metrics
      const metrics = {
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
        maxDrawdown: calculateMaxDrawdown(defaultPortfolio),
        sharpeRatio: calculateSharpeRatio(defaultPortfolio),
        sortinoRatio: calculateSortinoRatio(defaultPortfolio),
        concentration: Math.max(...defaultPortfolio.weights),
        liquidityScore: defaultPortfolio.assets.reduce(
          (sum, asset) => sum + asset.liquidity * asset.weight,
          0
        ),
        beta: calculatePortfolioBeta(defaultPortfolio),
        valueAtRisk: varResult,
        timestamp: Date.now()
      };

      setRiskMetrics(metrics);
    } catch (error) {
      console.error('Risk calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRiskAlerts = () => {
    const newAlerts = [];

    if (riskMetrics) {
      // VaR Alert
      if (riskMetrics.varPercentage / 100 > defaultThresholds.varLimit) {
        newAlerts.push({
          id: 'var',
          type: 'warning',
          title: 'High VaR Alert',
          message: `Portfolio VaR (${riskMetrics.varPercentage.toFixed(1)}%) exceeds threshold (${(defaultThresholds.varLimit * 100).toFixed(1)}%)`,
          value: riskMetrics.varPercentage,
          threshold: defaultThresholds.varLimit * 100,
          timestamp: Date.now()
        });
      }

      // Volatility Alert
      if (riskMetrics.volatility > defaultThresholds.volatilityLimit) {
        newAlerts.push({
          id: 'volatility',
          type: 'warning',
          title: 'High Volatility Alert',
          message: `Portfolio volatility (${(riskMetrics.volatility * 100).toFixed(1)}%) exceeds threshold (${(defaultThresholds.volatilityLimit * 100).toFixed(1)}%)`,
          value: riskMetrics.volatility * 100,
          threshold: defaultThresholds.volatilityLimit * 100,
          timestamp: Date.now()
        });
      }

      // Concentration Alert
      if (riskMetrics.concentration > defaultThresholds.concentrationLimit) {
        newAlerts.push({
          id: 'concentration',
          type: 'info',
          title: 'Concentration Risk',
          message: `Single asset concentration (${(riskMetrics.concentration * 100).toFixed(1)}%) exceeds threshold (${(defaultThresholds.concentrationLimit * 100).toFixed(1)}%)`,
          value: riskMetrics.concentration * 100,
          threshold: defaultThresholds.concentrationLimit * 100,
          timestamp: Date.now()
        });
      }

      // Liquidity Alert
      if (riskMetrics.liquidityScore < defaultThresholds.liquidityThreshold) {
        newAlerts.push({
          id: 'liquidity',
          type: 'warning',
          title: 'Liquidity Risk',
          message: `Portfolio liquidity score (${(riskMetrics.liquidityScore * 100).toFixed(1)}%) below threshold (${(defaultThresholds.liquidityThreshold * 100).toFixed(1)}%)`,
          value: riskMetrics.liquidityScore * 100,
          threshold: defaultThresholds.liquidityThreshold * 100,
          timestamp: Date.now()
        });
      }
    }

    setAlerts(newAlerts);
    if (newAlerts.length > 0) {
      onRiskAlert?.(newAlerts);
    }
  };

  // Helper functions for risk calculations
  const calculateMaxDrawdown = _portfolio => {
    // Simplified max drawdown calculation
    return 0.15; // Mock value
  };

  const calculateSharpeRatio = portfolio => {
    const expectedReturn = 0.08; // Mock expected return
    const riskFreeRate = 0.03;
    const volatility = Math.sqrt(
      portfolio.covarianceMatrix.reduce(
        (sum, row, i) =>
          sum +
          row.reduce(
            (rowSum, val, j) => rowSum + val * portfolio.weights[i] * portfolio.weights[j],
            0
          ),
        0
      )
    );

    return (expectedReturn - riskFreeRate) / volatility;
  };

  const calculateSortinoRatio = _portfolio => {
    const expectedReturn = 0.08;
    const riskFreeRate = 0.03;
    const downsideVolatility = 0.18; // Mock downside volatility

    return (expectedReturn - riskFreeRate) / downsideVolatility;
  };

  const calculatePortfolioBeta = _portfolio => {
    // Simplified beta calculation
    return 1.05; // Mock value
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

  const getRiskColor = (value, threshold, inverse = false) => {
    if (inverse) {
      if (value < threshold) return 'text-destructive';
      if (value < threshold * 1.2) return 'text-warning';
      return 'text-success';
    } else {
      if (value > threshold) return 'text-destructive';
      if (value > threshold * 0.8) return 'text-warning';
      return 'text-success';
    }
  };

  const getAlertIcon = type => {
    switch (type) {
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Bell;
      default:
        return Shield;
    }
  };

  const dismissAlert = alertId => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  return (
    <div className={`bg-card border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/20 rounded-lg">
            <Shield className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Risk Management</h3>
            <p className="text-xs text-foreground-secondary">
              {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAlertsEnabled(!alertsEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              alertsEnabled
                ? 'text-success hover:bg-success/20'
                : 'text-foreground-secondary hover:bg-muted'
            }`}
            aria-label={alertsEnabled ? 'Disable alerts' : 'Enable alerts'}
          >
            {alertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setRealTimeMonitoring(!realTimeMonitoring)}
            className={`p-2 rounded-lg transition-colors ${
              realTimeMonitoring
                ? 'text-accent hover:bg-accent/20'
                : 'text-foreground-secondary hover:bg-muted'
            }`}
            aria-label={realTimeMonitoring ? 'Disable monitoring' : 'Enable monitoring'}
          >
            <Activity className="w-4 h-4" />
          </button>
          <button
            onClick={calculateRiskMetrics}
            disabled={loading}
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            aria-label="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="p-4 border-b border-border">
          <div className="space-y-3">
            {alerts.map(alert => {
              const Icon = getAlertIcon(alert.type);
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.type === 'warning'
                      ? 'bg-warning/10 border-warning/30'
                      : 'bg-accent/10 border-accent/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      className={`w-5 h-5 mt-0.5 ${
                        alert.type === 'warning' ? 'text-warning' : 'text-accent'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground">{alert.title}</h4>
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="text-foreground-secondary hover:text-foreground"
                          aria-label="Dismiss alert"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-sm text-foreground-secondary mt-1">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-foreground-secondary">
                        <span>Current: {alert.value.toFixed(1)}%</span>
                        <span>Threshold: {alert.threshold.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risk Metrics Dashboard */}
      {activeView === 'dashboard' && riskMetrics && (
        <div className="p-4 space-y-6">
          {/* Key Risk Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground-secondary">VaR (95%)</span>
                <Shield className="w-4 h-4 text-destructive" />
              </div>
              <div
                className={`text-xl font-bold ${getRiskColor(riskMetrics.varPercentage / 100, defaultThresholds.varLimit)}`}
              >
                {formatCurrency(riskMetrics.var)}
              </div>
              <div className="text-xs text-foreground-secondary">
                {formatPercent(riskMetrics.varPercentage / 100)}
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground-secondary">Volatility</span>
                <Activity className="w-4 h-4 text-accent" />
              </div>
              <div
                className={`text-xl font-bold ${getRiskColor(riskMetrics.volatility, defaultThresholds.volatilityLimit)}`}
              >
                {formatPercent(riskMetrics.volatility)}
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground-secondary">Sharpe Ratio</span>
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div className="text-xl font-bold text-success">
                {riskMetrics.sharpeRatio.toFixed(2)}
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground-secondary">Liquidity Score</span>
                <Zap className="w-4 h-4 text-accent" />
              </div>
              <div
                className={`text-xl font-bold ${getRiskColor(riskMetrics.liquidityScore, defaultThresholds.liquidityThreshold, true)}`}
              >
                {(riskMetrics.liquidityScore * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Risk Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk by Asset */}
            <div className="bg-muted rounded-lg p-4">
              <h4 className="text-sm font-semibold text-foreground mb-4">Risk by Asset</h4>
              <div className="space-y-3">
                {defaultPortfolio.assets.map((asset, index) => {
                  const varContribution = riskMetrics.valueAtRisk.components?.[index];
                  return (
                    <div key={asset.symbol} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-destructive rounded-full" />
                        <span className="text-sm text-foreground">{asset.symbol}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-foreground font-medium">
                          {formatCurrency(varContribution?.varContribution || 0)}
                        </div>
                        <div className="text-xs text-foreground-secondary">
                          {varContribution?.percentageContribution.toFixed(1) || 0}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risk Limits */}
            <div className="bg-muted rounded-lg p-4">
              <h4 className="text-sm font-semibold text-foreground mb-4">Risk Limits</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground-secondary">VaR Limit</span>
                    <span className="text-foreground">{formatPercent(defaultThresholds.varLimit)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-destructive h-2 rounded-full"
                      style={{
                        width: `${Math.min((riskMetrics.varPercentage / 100 / defaultThresholds.varLimit) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground-secondary">Volatility Limit</span>
                    <span className="text-foreground">
                      {formatPercent(defaultThresholds.volatilityLimit)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full"
                      style={{
                        width: `${Math.min((riskMetrics.volatility / defaultThresholds.volatilityLimit) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground-secondary">Concentration Limit</span>
                    <span className="text-foreground">
                      {formatPercent(defaultThresholds.concentrationLimit)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-warning h-2 rounded-full"
                      style={{
                        width: `${Math.min((riskMetrics.concentration / defaultThresholds.concentrationLimit) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-foreground-secondary mb-1">Max Drawdown</div>
              <div className="text-lg font-semibold text-destructive">
                {formatPercent(riskMetrics.maxDrawdown)}
              </div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-foreground-secondary mb-1">Sortino Ratio</div>
              <div className="text-lg font-semibold text-success">
                {riskMetrics.sortinoRatio.toFixed(2)}
              </div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-foreground-secondary mb-1">Portfolio Beta</div>
              <div className="text-lg font-semibold text-accent">
                {riskMetrics.beta.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-destructive" />
          <span className="ml-3 text-foreground-secondary">Calculating risk metrics...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !riskMetrics && (
        <div className="p-8 text-center">
          <Shield className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <h4 className="text-foreground-secondary mb-2">No Risk Data Available</h4>
          <p className="text-sm text-foreground-secondary">
            Risk metrics will appear here once portfolio data is loaded.
          </p>
        </div>
      )}
    </div>
  );
};

export default RiskManagementDashboard;
