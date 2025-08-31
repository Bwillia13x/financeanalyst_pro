import React, { useState, useEffect, useMemo } from 'react';
import {
  Leaf,
  Users,
  Shield,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Globe,
  Award,
  RefreshCw,
  Settings,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

import esgService from '../../services/esg/esgService';

const ESGAnalysisDashboard = ({
  portfolio = {},
  symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA'],
  onESGAnalysis,
  className = ''
}) => {
  const [esgData, setEsgData] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState(symbols[0]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState(null);

  // Default portfolio
  const defaultPortfolio = {
    assets: symbols.map(symbol => ({ symbol, weight: 1 / symbols.length })),
    ...portfolio
  };

  // Analyze ESG data on mount and when symbols change
  useEffect(() => {
    if (selectedSymbol) {
      analyzeCompanyESG();
    }
    analyzePortfolioESG();
  }, [selectedSymbol, symbols]);

  const analyzeCompanyESG = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await esgService.calculateESGScore(selectedSymbol, {
        includeHistorical: true,
        includePeers: true
      });
      setEsgData(result);
      onESGAnalysis?.(result);
    } catch (err) {
      setError(err.message);
      console.error('ESG analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzePortfolioESG = async () => {
    try {
      const result = await esgService.analyzeESGPortfolio(defaultPortfolio, {
        minESGScore: 60,
        maxCarbonIntensity: 150,
        excludeControversial: true
      });
      setPortfolioAnalysis(result);
    } catch (err) {
      console.error('Portfolio ESG analysis error:', err);
    }
  };

  // Calculate ESG metrics
  const esgMetrics = useMemo(() => {
    if (!esgData || !portfolioAnalysis) return null;

    return {
      companyScore: esgData.overallScore,
      portfolioScore: portfolioAnalysis.portfolioESGScore,
      carbonFootprint: portfolioAnalysis.carbonFootprint,
      environmentalScore: esgData.components?.environmental || 0,
      socialScore: esgData.components?.social || 0,
      governanceScore: esgData.components?.governance || 0,
      rating: esgData.rating,
      trend: esgData.trend?.direction || 'stable',
      percentile: esgData.peerComparison?.percentile || 0,
      controversies: esgData.controversies?.length || 0,
      compliance: esgData.compliance,
      carbonData: esgData.carbonFootprint
    };
  }, [esgData, portfolioAnalysis]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'environmental', label: 'Environmental', icon: Leaf },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'governance', label: 'Governance', icon: Shield },
    { id: 'compliance', label: 'Compliance', icon: CheckCircle },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart }
  ];

  const formatScore = score => {
    return score ? score.toFixed(1) : 'N/A';
  };

  const getScoreColor = score => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRatingColor = rating => {
    if (['AAA', 'AA', 'A', 'Low'].includes(rating)) return 'text-green-400';
    if (['BBB', 'BB', 'Medium'].includes(rating)) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendIcon = trend => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Target className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Leaf className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">ESG Analysis</h3>
            <p className="text-xs text-slate-400">
              {selectedSymbol} • {symbols.length} companies analyzed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSymbol}
            onChange={e => setSelectedSymbol(e.target.value)}
            className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
          >
            {symbols.map(symbol => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Advanced settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={analyzeCompanyESG}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Refresh analysis"
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
      <div className="flex border-b border-slate-700 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-green-400 border-b-2 border-green-400 bg-green-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && esgMetrics && (
          <div className="space-y-6">
            {/* Key ESG Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Overall ESG Score</span>
                  <Award className="w-4 h-4 text-green-400" />
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(esgMetrics.companyScore)}`}>
                  {formatScore(esgMetrics.companyScore)}
                </div>
                <div className={`text-xs ${getRatingColor(esgMetrics.rating)}`}>
                  {esgMetrics.rating}
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Portfolio ESG</span>
                  <PieChart className="w-4 h-4 text-blue-400" />
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(esgMetrics.portfolioScore)}`}>
                  {formatScore(esgMetrics.portfolioScore)}
                </div>
                <div className="text-xs text-slate-400">Weighted average</div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Carbon Intensity</span>
                  <Globe className="w-4 h-4 text-orange-400" />
                </div>
                <div
                  className={`text-2xl font-bold ${getScoreColor(100 - esgMetrics.carbonFootprint)}`}
                >
                  {esgMetrics.carbonFootprint?.toFixed(1)}
                </div>
                <div className="text-xs text-slate-400">tons CO2e/$M revenue</div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">ESG Trend</span>
                  {getTrendIcon(esgMetrics.trend)}
                </div>
                <div className="text-lg font-bold text-white capitalize">{esgMetrics.trend}</div>
                <div className="text-xs text-slate-400">{esgMetrics.percentile}th percentile</div>
              </div>
            </div>

            {/* ESG Components */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="w-5 h-5 text-green-400" />
                  <h4 className="text-white font-medium">Environmental</h4>
                </div>
                <div
                  className={`text-3xl font-bold mb-2 ${getScoreColor(esgMetrics.environmentalScore)}`}
                >
                  {formatScore(esgMetrics.environmentalScore)}
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  <div>Carbon Emissions: Low</div>
                  <div>Energy Efficiency: High</div>
                  <div>Climate Strategy: Excellent</div>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-blue-400" />
                  <h4 className="text-white font-medium">Social</h4>
                </div>
                <div className={`text-3xl font-bold mb-2 ${getScoreColor(esgMetrics.socialScore)}`}>
                  {formatScore(esgMetrics.socialScore)}
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  <div>Labor Practices: Good</div>
                  <div>Human Rights: Good</div>
                  <div>Diversity: Average</div>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <h4 className="text-white font-medium">Governance</h4>
                </div>
                <div
                  className={`text-3xl font-bold mb-2 ${getScoreColor(esgMetrics.governanceScore)}`}
                >
                  {formatScore(esgMetrics.governanceScore)}
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  <div>Board Composition: Excellent</div>
                  <div>Transparency: Good</div>
                  <div>Risk Management: Good</div>
                </div>
              </div>
            </div>

            {/* Controversies and Recommendations */}
            {esgMetrics.controversies > 0 && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="text-yellow-300 font-medium">ESG Controversies Detected</div>
                    <div className="text-sm text-yellow-200">
                      {esgMetrics.controversies} controversies identified. Review recommended.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ESG Recommendations */}
            {esgData?.recommendations && esgData.recommendations.length > 0 && (
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">ESG Recommendations</h4>
                <div className="space-y-2">
                  {esgData.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-600/50 rounded"
                    >
                      <div>
                        <div className="text-white font-medium">{rec.recommendation}</div>
                        <div className="text-sm text-slate-400">
                          {rec.category} • {rec.priority} Priority
                        </div>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-xs ${
                          rec.priority === 'High'
                            ? 'bg-red-500/20 text-red-300'
                            : rec.priority === 'Medium'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-green-500/20 text-green-300'
                        }`}
                      >
                        {rec.impact} Impact
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'environmental' && esgMetrics?.carbonData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-4">Carbon Footprint</h4>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Emissions</span>
                    <span className="text-white font-medium">
                      {(esgMetrics.carbonData.totalEmissions / 1000000).toFixed(1)}M tons CO2e
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Carbon Intensity</span>
                    <span className="text-white font-medium">
                      {esgMetrics.carbonData.intensity.toFixed(1)} tons/$M revenue
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reduction Target</span>
                    <span className="text-green-400 font-medium">
                      {(esgMetrics.carbonData.reductionTarget * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Progress</span>
                    <span className="text-blue-400 font-medium">
                      {(esgMetrics.carbonData.currentProgress * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-4">Emissions Breakdown</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Scope 1 (Direct)</span>
                      <span className="text-white">
                        {(esgMetrics.carbonData.scope1 / 1000).toFixed(0)}K tons
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{
                          width: `${(esgMetrics.carbonData.scope1 / esgMetrics.carbonData.totalEmissions) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Scope 2 (Indirect)</span>
                      <span className="text-white">
                        {(esgMetrics.carbonData.scope2 / 1000).toFixed(0)}K tons
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(esgMetrics.carbonData.scope2 / esgMetrics.carbonData.totalEmissions) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Scope 3 (Value Chain)</span>
                      <span className="text-white">
                        {(esgMetrics.carbonData.scope3 / 1000).toFixed(0)}K tons
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${(esgMetrics.carbonData.scope3 / esgMetrics.carbonData.totalEmissions) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && esgMetrics?.compliance && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-4">SFDR Compliance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Compliance Score</span>
                    <span
                      className={`font-medium ${getScoreColor(esgMetrics.compliance.SFDR.status)}`}
                    >
                      {esgMetrics.compliance.SFDR.status.toFixed(0)}%
                    </span>
                  </div>

                  <div className="text-sm text-slate-400">
                    <div className="font-medium text-white mb-2">Requirements:</div>
                    <ul className="space-y-1">
                      {esgMetrics.compliance.SFDR.requirements.map((req, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {esgMetrics.compliance.SFDR.gaps.length > 0 && (
                    <div className="text-sm text-red-400">
                      <div className="font-medium text-white mb-2">Gaps to Address:</div>
                      <ul className="space-y-1">
                        {esgMetrics.compliance.SFDR.gaps.map((gap, index) => (
                          <li key={index}>• {gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-4">TCFD Compliance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Compliance Score</span>
                    <span
                      className={`font-medium ${getScoreColor(esgMetrics.compliance.TCFD.status)}`}
                    >
                      {esgMetrics.compliance.TCFD.status.toFixed(0)}%
                    </span>
                  </div>

                  <div className="text-sm text-slate-400">
                    <div className="font-medium text-white mb-2">Requirements:</div>
                    <ul className="space-y-1">
                      {esgMetrics.compliance.TCFD.requirements.map((req, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {esgMetrics.compliance.TCFD.gaps.length > 0 && (
                    <div className="text-sm text-red-400">
                      <div className="font-medium text-white mb-2">Gaps to Address:</div>
                      <ul className="space-y-1">
                        {esgMetrics.compliance.TCFD.gaps.map((gap, index) => (
                          <li key={index}>• {gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && portfolioAnalysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Portfolio ESG Score</div>
                <div
                  className={`text-2xl font-bold ${getScoreColor(portfolioAnalysis.portfolioESGScore)}`}
                >
                  {formatScore(portfolioAnalysis.portfolioESGScore)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {portfolioAnalysis.compliant ? 'Meets constraints' : 'Violates constraints'}
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Carbon Intensity</div>
                <div
                  className={`text-2xl font-bold ${getScoreColor(100 - portfolioAnalysis.carbonFootprint)}`}
                >
                  {portfolioAnalysis.carbonFootprint.toFixed(1)}
                </div>
                <div className="text-xs text-slate-400 mt-1">Average intensity</div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Assets Analyzed</div>
                <div className="text-2xl font-bold text-blue-400">
                  {portfolioAnalysis.assetBreakdown.length}
                </div>
                <div className="text-xs text-slate-400 mt-1">ESG scores available</div>
              </div>
            </div>

            {/* Asset ESG Breakdown */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-4">Asset ESG Breakdown</h4>
              <div className="space-y-3">
                {portfolioAnalysis.assetBreakdown.map((asset, index) => (
                  <div
                    key={asset.symbol}
                    className="flex items-center justify-between p-3 bg-slate-600/50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-white font-medium">{asset.symbol}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className={`text-sm font-medium ${getScoreColor(asset.esgScore)}`}>
                          {formatScore(asset.esgScore)}
                        </div>
                        <div className="text-xs text-slate-400">ESG Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-white font-medium">
                          {formatPercent(asset.weight)}
                        </div>
                        <div className="text-xs text-slate-400">Weight</div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-sm font-medium ${getScoreColor(100 - asset.carbonIntensity)}`}
                        >
                          {asset.carbonIntensity.toFixed(1)}
                        </div>
                        <div className="text-xs text-slate-400">Carbon</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ESG Recommendations */}
            {portfolioAnalysis.recommendations && portfolioAnalysis.recommendations.length > 0 && (
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-4">Portfolio Recommendations</h4>
                <div className="space-y-3">
                  {portfolioAnalysis.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 bg-slate-600/50 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-white font-medium capitalize">{rec.type}</div>
                        <div
                          className={`px-2 py-1 rounded text-xs ${
                            rec.priority === 'High'
                              ? 'bg-red-500/20 text-red-300'
                              : rec.priority === 'Medium'
                                ? 'bg-yellow-500/20 text-yellow-300'
                                : 'bg-green-500/20 text-green-300'
                          }`}
                        >
                          {rec.priority} Priority
                        </div>
                      </div>
                      <div className="text-sm text-slate-400">{rec.description}</div>
                      {rec.assets && rec.assets.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {rec.assets.map(asset => (
                            <span
                              key={asset}
                              className="px-2 py-1 bg-slate-500/50 rounded text-xs text-white"
                            >
                              {asset}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <span className="ml-3 text-slate-300">Analyzing ESG data...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ESGAnalysisDashboard;
