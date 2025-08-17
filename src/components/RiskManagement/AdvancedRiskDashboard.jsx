/**
 * Advanced Risk Management Dashboard
 * VaR, stress testing, portfolio risk analytics, and regulatory risk measures
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, TrendingDown, BarChart3, Target,
  Activity, Clock, DollarSign, Percent, Zap, Users, FileText
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, AreaChart, Area, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

import RiskManagementEngine from '../../services/riskManagementEngine';

const AdvancedRiskDashboard = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [stressTestResults, setStressTestResults] = useState(null);
  const [activeTab, setActiveTab] = useState('var');
  const [selectedRiskModel, setSelectedRiskModel] = useState('historical');
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);

  const engine = useMemo(() => new RiskManagementEngine(), []);

  // Sample portfolio data
  const samplePortfolio = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      marketValue: 500000,
      weight: 0.25,
      expectedReturn: 0.12,
      volatility: 0.25,
      beta: 1.2,
      assetClass: 'equity',
      tier1Eligible: false,
      sector: 'Technology',
      var: 15000
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      marketValue: 400000,
      weight: 0.20,
      expectedReturn: 0.14,
      volatility: 0.28,
      beta: 1.1,
      assetClass: 'equity',
      tier1Eligible: false,
      sector: 'Technology',
      var: 14000
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      marketValue: 350000,
      weight: 0.175,
      expectedReturn: 0.13,
      volatility: 0.22,
      beta: 0.9,
      assetClass: 'equity',
      tier1Eligible: false,
      sector: 'Technology',
      var: 9500
    },
    {
      symbol: 'JPM',
      name: 'JPMorgan Chase',
      marketValue: 300000,
      weight: 0.15,
      expectedReturn: 0.10,
      volatility: 0.30,
      beta: 1.4,
      assetClass: 'equity',
      tier1Eligible: false,
      sector: 'Financial',
      var: 12000
    },
    {
      symbol: 'UST_10Y',
      name: 'US Treasury 10Y',
      marketValue: 450000,
      weight: 0.225,
      expectedReturn: 0.04,
      volatility: 0.08,
      beta: -0.2,
      assetClass: 'fixed_income',
      tier1Eligible: true,
      sector: 'Government',
      var: 2500
    }
  ];

  const covarianceMatrix = [
    [0.0625, 0.0400, 0.0350, 0.0450, -0.0050],
    [0.0400, 0.0784, 0.0380, 0.0520, -0.0040],
    [0.0350, 0.0380, 0.0484, 0.0420, -0.0035],
    [0.0450, 0.0520, 0.0420, 0.0900, -0.0020],
    [-0.0050, -0.0040, -0.0035, -0.0020, 0.0064]
  ];

  useEffect(() => {
    setPortfolio(samplePortfolio);

    // Calculate portfolio risk metrics
    const portfolioRisk = engine.calculatePortfolioRisk(samplePortfolio, covarianceMatrix, confidenceLevel);

    // Generate historical returns for VaR calculation
    const historicalReturns = Array.from({ length: 252 }, () =>
      Math.random() * 0.06 - 0.03 // Random returns between -3% and 3%
    );

    const historicalVaR = engine.calculateHistoricalVaR(historicalReturns, confidenceLevel);
    const parametricVaR = engine.calculateParametricVaR(
      portfolioRisk.portfolioMetrics.expectedReturn,
      portfolioRisk.portfolioMetrics.volatility,
      confidenceLevel
    );

    setRiskMetrics({
      ...portfolioRisk,
      historicalVaR,
      parametricVaR,
      totalPortfolioValue: samplePortfolio.reduce((sum, pos) => sum + pos.marketValue, 0)
    });

    // Perform stress testing
    const stressEvents = [
      {
        name: '2008 Financial Crisis',
        date: '2008-09-15',
        description: 'Lehman Brothers collapse scenario',
        assetReturns: [-0.35, -0.40, -0.32, -0.55, 0.15] // Bonds performed well
      },
      {
        name: 'COVID-19 Pandemic',
        date: '2020-03-20',
        description: 'Market crash due to pandemic',
        assetReturns: [-0.25, -0.22, -0.20, -0.38, 0.08]
      },
      {
        name: 'Tech Bubble Burst',
        date: '2000-03-10',
        description: 'Dot-com bubble collapse',
        assetReturns: [-0.45, -0.50, -0.42, -0.15, 0.12]
      }
    ];

    const stressResults = engine.performHistoricalStressTest(samplePortfolio, stressEvents);
    setStressTestResults(stressResults);
  }, [engine, confidenceLevel]);

  const VaRAnalysis = () => {
    if (!riskMetrics) return null;

    const varComparison = [
      {
        method: 'Historical VaR',
        value: riskMetrics.historicalVaR.var * riskMetrics.totalPortfolioValue,
        percentage: (riskMetrics.historicalVaR.var * 100).toFixed(2)
      },
      {
        method: 'Parametric VaR',
        value: riskMetrics.parametricVaR.var * riskMetrics.totalPortfolioValue,
        percentage: (riskMetrics.parametricVaR.var * 100).toFixed(2)
      },
      {
        method: 'Expected Shortfall',
        value: riskMetrics.historicalVaR.expectedShortfall * riskMetrics.totalPortfolioValue,
        percentage: (riskMetrics.historicalVaR.expectedShortfall * 100).toFixed(2)
      }
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Shield className="mr-2" />
          Value at Risk Analysis
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3">VaR Comparison ({(confidenceLevel * 100)}% Confidence)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={varComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'VaR']} />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Risk Metrics Summary</h4>
            <div className="space-y-3">
              {[
                {
                  label: '1-Day VaR (95%)',
                  value: `$${(riskMetrics.historicalVaR.var * riskMetrics.totalPortfolioValue).toLocaleString()}`,
                  subtext: `${(riskMetrics.historicalVaR.var * 100).toFixed(2)}% of portfolio`
                },
                {
                  label: 'Expected Shortfall',
                  value: `$${(riskMetrics.historicalVaR.expectedShortfall * riskMetrics.totalPortfolioValue).toLocaleString()}`,
                  subtext: 'Average loss beyond VaR'
                },
                {
                  label: 'Portfolio Volatility',
                  value: `${(riskMetrics.portfolioMetrics.volatility * 100).toFixed(2)}%`,
                  subtext: 'Annualized standard deviation'
                },
                {
                  label: 'Sharpe Ratio',
                  value: riskMetrics.portfolioMetrics.sharpeRatio.toFixed(2),
                  subtext: 'Risk-adjusted return'
                }
              ].map((metric) => (
                <div key={metric.label} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">{metric.label}</span>
                    <span className="font-bold text-lg">{metric.value}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{metric.subtext}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-semibold mb-3">Risk Contribution by Asset</h4>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Asset</th>
                  <th className="text-left py-2">Weight</th>
                  <th className="text-left py-2">Component VaR</th>
                  <th className="text-left py-2">% Contribution</th>
                  <th className="text-left py-2">Marginal VaR</th>
                  <th className="text-left py-2">Beta</th>
                </tr>
              </thead>
              <tbody>
                {riskMetrics.riskContribution.map((asset) => (
                  <tr key={asset.asset} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-medium">{asset.asset}</td>
                    <td className="py-2">{(asset.weight * 100).toFixed(1)}%</td>
                    <td className="py-2">{asset.componentVaR.toFixed(4)}</td>
                    <td className="py-2">{asset.percentageContribution.toFixed(1)}%</td>
                    <td className="py-2">{asset.marginalVaR.toFixed(4)}</td>
                    <td className="py-2">{asset.beta.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    );
  };

  const StressTesting = () => {
    if (!stressTestResults) return null;

    const stressChartData = stressTestResults.stressTestResults.map(result => ({
      scenario: result.eventName,
      return: (result.portfolioReturn * 100).toFixed(2),
      value: result.portfolioValue
    }));

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <AlertTriangle className="mr-2" />
          Stress Testing Analysis
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3">Historical Stress Scenarios</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stressChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="scenario" angle={-45} textAnchor="end"
                  height={100}
                />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => [`${value}%`, 'Portfolio Return']} />
                <Bar dataKey="return" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Stress Test Summary</h4>
            <div className="space-y-3">
              <div className="p-4 border-2 border-red-200 bg-red-50 rounded-lg">
                <h5 className="font-semibold text-red-800 mb-2">Worst Case Scenario</h5>
                <p className="text-sm text-red-700">{stressTestResults.worstCase.eventName}</p>
                <p className="text-lg font-bold text-red-800">
                  {(stressTestResults.worstCase.portfolioReturn * 100).toFixed(2)}% loss
                </p>
                <p className="text-sm text-red-600">
                  Portfolio Value: ${stressTestResults.worstCase.portfolioValue.toLocaleString()}
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Stress Return:</span>
                  <span className="font-bold text-red-600">
                    {(stressTestResults.averageStressReturn * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-600">Scenarios Tested:</span>
                  <span className="font-bold">{stressTestResults.stressTestResults.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-semibold mb-3">Detailed Scenario Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stressTestResults.stressTestResults.map((result) => (
              <div key={result.eventName} className="p-4 border rounded-lg">
                <h5 className="font-semibold mb-1">{result.eventName}</h5>
                <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                <p className="text-lg font-bold text-red-600">
                  {(result.portfolioReturn * 100).toFixed(2)}% loss
                </p>
                <p className="text-sm text-gray-500">
                  Value: ${result.portfolioValue.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  const LiquidityRisk = () => {
    const liquidityData = portfolio.map(position => ({
      symbol: position.symbol,
      liquidityScore: Math.random() * 0.8 + 0.2, // Mock liquidity score
      bidAskSpread: Math.random() * 0.02,
      volumeRatio: Math.random() * 0.5,
      liquidityHorizon: Math.floor(Math.random() * 30) + 1
    }));

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Activity className="mr-2" />
          Liquidity Risk Analysis
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3">Liquidity Scores by Asset</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={liquidityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="symbol" />
                <YAxis domain={[0, 1]} />
                <Tooltip formatter={(value) => [value.toFixed(2), 'Liquidity Score']} />
                <Bar dataKey="liquidityScore" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Liquidity Metrics</h4>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Asset</th>
                    <th className="text-left py-2">Score</th>
                    <th className="text-left py-2">Spread</th>
                    <th className="text-left py-2">Horizon</th>
                  </tr>
                </thead>
                <tbody>
                  {liquidityData.map((asset) => (
                    <tr key={asset.symbol} className="border-b hover:bg-gray-50">
                      <td className="py-2 font-medium">{asset.symbol}</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            asset.liquidityScore > 0.7 ? 'bg-green-100 text-green-800' :
                              asset.liquidityScore > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                          }`}
                        >
                          {asset.liquidityScore.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2">{(asset.bidAskSpread * 100).toFixed(2)}%</td>
                      <td className="py-2">{asset.liquidityHorizon} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const RegulatoryCapital = () => {
    const riskWeights = {
      equity: 1.0,
      fixed_income: 0.2,
      cash: 0.0
    };

    const baselMetrics = riskMetrics ?
      engine.calculateBaselIIIMetrics(portfolio, riskWeights) : null;

    if (!baselMetrics) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <FileText className="mr-2" />
          Regulatory Capital Requirements
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3">Basel III Ratios</h4>
            <div className="space-y-4">
              {[
                {
                  label: 'Tier 1 Capital Ratio',
                  value: (baselMetrics.tier1Ratio * 100).toFixed(2),
                  threshold: 6.0,
                  current: baselMetrics.tier1Ratio * 100
                },
                {
                  label: 'Leverage Ratio',
                  value: (baselMetrics.leverageRatio * 100).toFixed(2),
                  threshold: 3.0,
                  current: baselMetrics.leverageRatio * 100
                }
              ].map((ratio) => (
                <div key={ratio.label} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{ratio.label}</span>
                    <span
                      className={`font-bold text-lg ${
                        ratio.current >= ratio.threshold ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {ratio.value}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        ratio.current >= ratio.threshold ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(ratio.current / ratio.threshold * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum: {ratio.threshold}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Capital Adequacy</h4>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-600">Risk-Weighted Assets:</span>
                  <span className="font-bold">${baselMetrics.riskWeightedAssets.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tier 1 Capital:</span>
                  <span className="font-bold">${baselMetrics.tier1Capital.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-600">Minimum Capital:</span>
                  <span className="font-bold">${baselMetrics.minimumCapitalRequirement.toLocaleString()}</span>
                </div>
              </div>
              <div
                className={`p-3 rounded ${
                  baselMetrics.capitalSurplus > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex justify-between">
                  <span className={baselMetrics.capitalSurplus > 0 ? 'text-green-700' : 'text-red-700'}>
                    Capital {baselMetrics.capitalSurplus > 0 ? 'Surplus' : 'Deficit'}:
                  </span>
                  <span className={`font-bold ${baselMetrics.capitalSurplus > 0 ? 'text-green-700' : 'text-red-700'}`}>
                    ${Math.abs(baselMetrics.capitalSurplus).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Risk Management</h1>
          <p className="text-gray-600">Comprehensive portfolio risk analytics, VaR, stress testing, and regulatory compliance</p>
        </header>

        {/* Risk Controls */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Confidence Level:</label>
              <select
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(parseFloat(e.target.value))}
                className="border rounded px-2 py-1"
              >
                <option value={0.90}>90%</option>
                <option value={0.95}>95%</option>
                <option value={0.99}>99%</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Risk Model:</label>
              <select
                value={selectedRiskModel}
                onChange={(e) => setSelectedRiskModel(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="historical">Historical</option>
                <option value="parametric">Parametric</option>
                <option value="monte_carlo">Monte Carlo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-blue-50 p-1 rounded-lg">
            {[
              { id: 'var', label: 'VaR Analysis', icon: Shield },
              { id: 'stress', label: 'Stress Testing', icon: AlertTriangle },
              { id: 'liquidity', label: 'Liquidity Risk', icon: Activity },
              { id: 'regulatory', label: 'Regulatory Capital', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'var' && <VaRAnalysis />}
          {activeTab === 'stress' && <StressTesting />}
          {activeTab === 'liquidity' && <LiquidityRisk />}
          {activeTab === 'regulatory' && <RegulatoryCapital />}
        </AnimatePresence>

        {/* Risk Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {riskMetrics && [
            {
              label: 'Portfolio VaR (1D)',
              value: `$${(riskMetrics.historicalVaR.var * riskMetrics.totalPortfolioValue).toLocaleString()}`,
              icon: Shield,
              color: 'red',
              risk: true
            },
            {
              label: 'Expected Shortfall',
              value: `$${(riskMetrics.historicalVaR.expectedShortfall * riskMetrics.totalPortfolioValue).toLocaleString()}`,
              icon: TrendingDown,
              color: 'red',
              risk: true
            },
            {
              label: 'Sharpe Ratio',
              value: riskMetrics.portfolioMetrics.sharpeRatio.toFixed(2),
              icon: Target,
              color: 'green'
            },
            {
              label: 'Portfolio Beta',
              value: '1.08',
              icon: BarChart3,
              color: 'blue'
            }
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label} className={`bg-white rounded-lg shadow p-4 ${
                  metric.risk ? 'border-l-4 border-red-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{metric.label}</p>
                    <p className="text-xl font-bold">{metric.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 text-${metric.color}-600`} />
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default AdvancedRiskDashboard;
