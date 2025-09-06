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
  Settings
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

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

  const formatPercent = (value, decimals = 1) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
    return (value * 100).toFixed(decimals) + '%';
  };

  const getScoreColor = score => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getRatingColor = rating => {
    if (['AAA', 'AA', 'A', 'Low'].includes(rating)) return 'text-success';
    if (['BBB', 'BB', 'Medium'].includes(rating)) return 'text-warning';
    return 'text-destructive';
  };

  const getTrendIcon = trend => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Target className="w-4 h-4 text-accent" />;
    }
  };

  return (
    <div className={`bg-card border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/20 rounded-lg">
            <Leaf className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">ESG Analysis</h3>
            <p className="text-xs text-foreground-secondary">
              {selectedSymbol} • {symbols.length} companies analyzed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSymbol}
            onChange={e => setSelectedSymbol(e.target.value)}
            className="px-3 py-1 bg-muted border border-border rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {symbols.map(symbol => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            aria-label="Advanced settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={analyzeCompanyESG}
            disabled={loading}
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            aria-label="Refresh analysis"
          >
            <RefreshCw className={`${loading ? 'animate-spin' : ''} w-4 h-4`} />
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
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-success border-b-2 border-success bg-success/10'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-muted/50'
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
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground-secondary">Overall ESG Score</span>
                  <Award className="w-4 h-4 text-success" />
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(esgMetrics.companyScore)}`}>
                  {formatScore(esgMetrics.companyScore)}
                </div>
                <div className={`text-xs ${getRatingColor(esgMetrics.rating)}`}>
                  {esgMetrics.rating}
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground-secondary">Portfolio ESG</span>
                  <PieChart className="w-4 h-4 text-accent" />
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(esgMetrics.portfolioScore)}`}>
                  {formatScore(esgMetrics.portfolioScore)}
                </div>
                <div className="text-xs text-foreground-secondary">Weighted average</div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground-secondary">Carbon Intensity</span>
                  <Globe className="w-4 h-4 text-warning" />
                </div>
                <div
                  className={`text-2xl font-bold ${getScoreColor(100 - esgMetrics.carbonFootprint)}`}
                >
                  {esgMetrics.carbonFootprint?.toFixed(1)}
                </div>
                <div className="text-xs text-foreground-secondary">tons CO2e/$M revenue</div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground-secondary">ESG Trend</span>
                  {getTrendIcon(esgMetrics.trend)}
                </div>
                <div className="text-lg font-bold text-foreground capitalize">{esgMetrics.trend}</div>
                <div className="text-xs text-foreground-secondary">{esgMetrics.percentile}th percentile</div>
              </div>
            </div>

            {/* ESG Components */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="w-5 h-5 text-success" />
                  <h4 className="text-foreground font-medium">Environmental</h4>
                </div>
                <div
                  className={`text-3xl font-bold mb-2 ${getScoreColor(esgMetrics.environmentalScore)}`}
                >
                  {formatScore(esgMetrics.environmentalScore)}
                </div>
                <div className="space-y-1 text-xs text-foreground-secondary">
                  <div>Carbon Emissions: Low</div>
                  <div>Energy Efficiency: High</div>
                  <div>Climate Strategy: Excellent</div>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-accent" />
                  <h4 className="text-foreground font-medium">Social</h4>
                </div>
                <div className={`text-3xl font-bold mb-2 ${getScoreColor(esgMetrics.socialScore)}`}>
                  {formatScore(esgMetrics.socialScore)}
                </div>
                <div className="space-y-1 text-xs text-foreground-secondary">
                  <div>Labor Practices: Good</div>
                  <div>Human Rights: Good</div>
                  <div>Diversity: Average</div>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-accent" />
                  <h4 className="text-foreground font-medium">Governance</h4>
                </div>
                <div
                  className={`text-3xl font-bold mb-2 ${getScoreColor(esgMetrics.governanceScore)}`}
                >
                  {formatScore(esgMetrics.governanceScore)}
                </div>
                <div className="space-y-1 text-xs text-foreground-secondary">
                  <div>Board Composition: Excellent</div>
                  <div>Transparency: Good</div>
                  <div>Risk Management: Good</div>
                </div>
              </div>
            </div>

            {/* Controversies and Recommendations */}
            {esgMetrics.controversies > 0 && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <div>
                    <div className="text-warning font-medium">ESG Controversies Detected</div>
                    <div className="text-sm text-warning/90">
                      {esgMetrics.controversies} controversies identified. Review recommended.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ESG Recommendations */}
            {esgData?.recommendations && esgData.recommendations.length > 0 && (
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-foreground font-medium mb-3">ESG Recommendations</h4>
                <div className="space-y-2">
                  {esgData.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded"
                    >
                      <div>
                        <div className="text-foreground font-medium">{rec.recommendation}</div>
                        <div className="text-sm text-foreground-secondary">
                          {rec.category} • {rec.priority} Priority
                        </div>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-xs ${
                          rec.priority === 'High'
                            ? 'bg-destructive/20 text-destructive'
                            : rec.priority === 'Medium'
                              ? 'bg-warning/20 text-warning'
                              : 'bg-success/20 text-success'
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
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-foreground font-medium mb-4">Carbon Footprint</h4>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Total Emissions</span>
                    <span className="text-foreground font-medium">
                      {(esgMetrics.carbonData.totalEmissions / 1000000).toFixed(1)}M tons CO2e
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Carbon Intensity</span>
                    <span className="text-foreground font-medium">
                      {esgMetrics.carbonData.intensity.toFixed(1)} tons/$M revenue
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Reduction Target</span>
                    <span className="text-success font-medium">
                      {(esgMetrics.carbonData.reductionTarget * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Current Progress</span>
                    <span className="text-accent font-medium">
                      {(esgMetrics.carbonData.currentProgress * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-foreground font-medium mb-4">Emissions Breakdown</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground-secondary">Scope 1 (Direct)</span>
                      <span className="text-foreground">
                        {(esgMetrics.carbonData.scope1 / 1000).toFixed(0)}K tons
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-destructive h-2 rounded-full"
                        style={{
                          width: `${(esgMetrics.carbonData.scope1 / esgMetrics.carbonData.totalEmissions) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground-secondary">Scope 2 (Indirect)</span>
                      <span className="text-foreground">
                        {(esgMetrics.carbonData.scope2 / 1000).toFixed(0)}K tons
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full"
                        style={{
                          width: `${(esgMetrics.carbonData.scope2 / esgMetrics.carbonData.totalEmissions) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground-secondary">Scope 3 (Value Chain)</span>
                      <span className="text-foreground">
                        {(esgMetrics.carbonData.scope3 / 1000).toFixed(0)}K tons
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-success h-2 rounded-full"
                        style={{
                          width: `${(esgMetrics.carbonData.scope3 / esgMetrics.carbonData.totalEmissions) * 100}%`
                        }}
                      />
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
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-foreground font-medium mb-4">SFDR Compliance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Compliance Score</span>
                    <span
                      className={`font-medium ${getScoreColor(esgMetrics.compliance.SFDR.status)}`}
                    >
                      {esgMetrics.compliance.SFDR.status.toFixed(0)}%
                    </span>
                  </div>

                  <div className="text-sm text-foreground-secondary">
                    <div className="font-medium text-foreground mb-2">Requirements:</div>
                    <ul className="space-y-1">
                      {esgMetrics.compliance.SFDR.requirements.map((req, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-success" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {esgMetrics.compliance.SFDR.gaps.length > 0 && (
                    <div className="text-sm text-destructive">
                      <div className="font-medium text-foreground mb-2">Gaps to Address:</div>
                      <ul className="space-y-1">
                        {esgMetrics.compliance.SFDR.gaps.map((gap, index) => (
                          <li key={index}>• {gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-foreground font-medium mb-4">TCFD Compliance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Compliance Score</span>
                    <span
                      className={`font-medium ${getScoreColor(esgMetrics.compliance.TCFD.status)}`}
                    >
                      {esgMetrics.compliance.TCFD.status.toFixed(0)}%
                    </span>
                  </div>

                  <div className="text-sm text-foreground-secondary">
                    <div className="font-medium text-foreground mb-2">Requirements:</div>
                    <ul className="space-y-1">
                      {esgMetrics.compliance.TCFD.requirements.map((req, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-success" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {esgMetrics.compliance.TCFD.gaps.length > 0 && (
                    <div className="text-sm text-destructive">
                      <div className="font-medium text-foreground mb-2">Gaps to Address:</div>
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

              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-foreground-secondary mb-1">Carbon Intensity</div>
                <div
                  className={`text-2xl font-bold ${getScoreColor(100 - portfolioAnalysis.carbonFootprint)}`}
                >
                  {portfolioAnalysis.carbonFootprint.toFixed(1)}
                </div>
                <div className="text-xs text-foreground-secondary mt-1">Average intensity</div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-foreground-secondary mb-1">Assets Analyzed</div>
                <div className="text-2xl font-bold text-accent">
                  {portfolioAnalysis.assetBreakdown.length}
                </div>
                <div className="text-xs text-foreground-secondary mt-1">ESG scores available</div>
              </div>
            </div>

            {/* Asset ESG Breakdown */}
            <div className="bg-muted rounded-lg p-4">
              <h4 className="text-foreground font-medium mb-4">Asset ESG Breakdown</h4>
              <div className="space-y-3">
                {portfolioAnalysis.assetBreakdown.map(asset => (
                  <div
                    key={asset.symbol}
                    className="flex items-center justify-between p-3 bg-muted rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-accent rounded-full" />
                      <span className="text-foreground font-medium">{asset.symbol}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className={`text-sm font-medium ${getScoreColor(asset.esgScore)}`}>
                          {formatScore(asset.esgScore)}
                        </div>
                        <div className="text-xs text-foreground-secondary">ESG Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-foreground font-medium">
                          {formatPercent(asset.weight)}
                        </div>
                        <div className="text-xs text-foreground-secondary">Weight</div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-sm font-medium ${getScoreColor(100 - asset.carbonIntensity)}`}
                        >
                          {asset.carbonIntensity.toFixed(1)}
                        </div>
                        <div className="text-xs text-foreground-secondary">Carbon</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ESG Recommendations */}
            {portfolioAnalysis.recommendations && portfolioAnalysis.recommendations.length > 0 && (
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-foreground font-medium mb-4">Portfolio Recommendations</h4>
                <div className="space-y-3">
                  {portfolioAnalysis.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 bg-muted rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-foreground font-medium capitalize">{rec.type}</div>
                        <div
                          className={`px-2 py-1 rounded text-xs ${
                            rec.priority === 'High'
                              ? 'bg-destructive/20 text-destructive'
                              : rec.priority === 'Medium'
                                ? 'bg-warning/20 text-warning'
                                : 'bg-success/20 text-success'
                          }`}
                        >
                          {rec.priority} Priority
                        </div>
                      </div>
                      <div className="text-sm text-foreground-secondary">{rec.description}</div>
                      {rec.assets && rec.assets.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {rec.assets.map(asset => (
                            <span
                              key={asset}
                              className="px-2 py-1 bg-muted rounded text-xs text-foreground"
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-success" />
            <span className="ml-3 text-foreground-secondary">Analyzing ESG data...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ESGAnalysisDashboard;
