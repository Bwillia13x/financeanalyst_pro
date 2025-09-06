import { TrendingUp, Target, DollarSign, Leaf, BarChart3, RefreshCw, Settings } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import esgService from '../../services/esg/esgService';

const SustainableFinanceModel = ({
  portfolio = {},
  sustainabilityTargets = {},
  onModelComplete,
  className = ''
}) => {
  const [modelResults, setModelResults] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState('Moderate Transition');
  const [timeHorizon, setTimeHorizon] = useState(5);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Default portfolio
  const defaultPortfolio = {
    assets: [
      { symbol: 'AAPL', weight: 0.4 },
      { symbol: 'MSFT', weight: 0.3 },
      { symbol: 'GOOGL', weight: 0.2 },
      { symbol: 'TSLA', weight: 0.1 }
    ],
    portfolioValue: 77500,
    ...portfolio
  };

  // Default sustainability targets
  const defaultTargets = {
    carbonReductionTarget: 0.5, // 50% reduction
    esgScoreTarget: 80,
    timeHorizon: 5,
    ...sustainabilityTargets
  };

  // Run sustainable finance model
  useEffect(() => {
    runSustainableModel();
  }, [timeHorizon, selectedScenario]);

  const runSustainableModel = async () => {
    setLoading(true);

    try {
      const results = await esgService.modelSustainablePortfolio(defaultPortfolio, {
        carbonReductionTarget: defaultTargets.carbonReductionTarget,
        esgScoreTarget: defaultTargets.esgScoreTarget,
        timeHorizon
      });

      setModelResults(results);
      onModelComplete?.(results);
    } catch (error) {
      console.error('Sustainable finance modeling error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate scenario metrics
  const scenarioMetrics = useMemo(() => {
    if (!modelResults) return null;

    const scenario = modelResults.projections.find(p => p.scenario === selectedScenario);
    if (!scenario) return null;

    const current = modelResults.current;
    const projected = scenario;

    return {
      currentESG: current.portfolioESGScore,
      projectedESG: projected.projectedESG,
      esgImprovement: projected.esgImprovement,
      currentCarbon: current.carbonFootprint,
      projectedCarbon: projected.projectedCarbon,
      carbonReduction: projected.carbonReduction,
      meetsESGTarget: projected.projectedESG >= defaultTargets.esgScoreTarget,
      meetsCarbonTarget:
        projected.projectedCarbon <=
        current.carbonFootprint * (1 - defaultTargets.carbonReductionTarget),
      costLevel: projected.cost,
      timeToTarget: timeHorizon
    };
  }, [modelResults, selectedScenario, timeHorizon]);

  // Calculate financial impact
  const financialImpact = useMemo(() => {
    if (!scenarioMetrics) return null;

    // Simplified financial impact calculation
    const baseReturn = 0.08; // 8% base return
    const esgPremium = scenarioMetrics.esgImprovement * 0.001; // 0.1% premium per ESG point
    const carbonPremium = scenarioMetrics.carbonReduction * 0.005; // 0.5% premium per unit carbon reduction

    const enhancedReturn = baseReturn + esgPremium + carbonPremium;
    const projectedValue =
      defaultPortfolio.portfolioValue * Math.pow(1 + enhancedReturn, timeHorizon);
    const valueAdded =
      projectedValue - defaultPortfolio.portfolioValue * Math.pow(1 + baseReturn, timeHorizon);

    return {
      baseReturn: baseReturn * 100,
      enhancedReturn: enhancedReturn * 100,
      projectedValue,
      valueAdded,
      esgPremium: esgPremium * 100,
      carbonPremium: carbonPremium * 100
    };
  }, [scenarioMetrics, timeHorizon]);

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

  // scenario color helper removed (unused)

  const getCostColor = cost => {
    switch (cost) {
      case 'Low':
        return 'text-success';
      case 'Medium':
        return 'text-warning';
      case 'High':
        return 'text-destructive';
      default:
        return 'text-accent';
    }
  };

  const scenarios = [
    {
      name: 'Business as Usual',
      description: 'Continue current practices with minimal ESG improvements',
      carbonReduction: 0.1,
      esgImprovement: 5,
      cost: 'Low',
      risk: 'High'
    },
    {
      name: 'Moderate Transition',
      description: 'Gradual shift towards sustainable practices',
      carbonReduction: 0.3,
      esgImprovement: 15,
      cost: 'Medium',
      risk: 'Medium'
    },
    {
      name: 'Aggressive Sustainability',
      description: 'Rapid transition to sustainable business model',
      carbonReduction: 0.6,
      esgImprovement: 25,
      cost: 'High',
      risk: 'Low'
    }
  ];

  return (
    <div className={`bg-card border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/20 rounded-lg">
            <Target className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Sustainable Finance Model</h3>
            <p className="text-xs text-foreground-secondary">Model ESG impact on portfolio performance</p>
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
            onClick={runSustainableModel}
            disabled={loading}
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            aria-label="Re-run model"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Scenario Selection */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="scenario-select" className="block text-sm text-foreground-secondary mb-2">Sustainability Scenario</label>
            <select
              value={selectedScenario}
              onChange={e => setSelectedScenario(e.target.value)}
              id="scenario-select"
              className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {scenarios.map(scenario => (
                <option key={scenario.name} value={scenario.name}>
                  {scenario.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="time-horizon" className="block text-sm text-foreground-secondary mb-2">Time Horizon</label>
            <select
              value={timeHorizon}
              onChange={e => setTimeHorizon(parseInt(e.target.value))}
              id="time-horizon"
              className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={1}>1 Year</option>
              <option value={3}>3 Years</option>
              <option value={5}>5 Years</option>
              <option value={10}>10 Years</option>
            </select>
          </div>

          <div>
            <p className="block text-sm text-foreground-secondary mb-2">Portfolio Value</p>
            <div className="px-3 py-2 bg-muted border border-border rounded text-foreground text-sm">
              {formatCurrency(defaultPortfolio.portfolioValue)}
            </div>
          </div>
        </div>

        {/* Scenario Details */}
        {scenarios.find(s => s.name === selectedScenario) && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-success" />
              <h4 className="text-foreground font-medium">{selectedScenario}</h4>
              <span
                className={`px-2 py-1 rounded text-xs ${getCostColor(scenarios.find(s => s.name === selectedScenario).cost)}`}
              >
                {scenarios.find(s => s.name === selectedScenario).cost} Cost
              </span>
            </div>
            <p className="text-sm text-foreground-secondary">
              {scenarios.find(s => s.name === selectedScenario).description}
            </p>
          </div>
        )}
      </div>

      {/* Model Results */}
      {modelResults && scenarioMetrics && (
        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground-secondary">ESG Score</span>
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {scenarioMetrics.projectedESG.toFixed(1)}
              </div>
              <div className="text-xs text-success">+{scenarioMetrics.esgImprovement} points</div>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground-secondary">Carbon Reduction</span>
                <Leaf className="w-4 h-4 text-success" />
              </div>
              <div className="text-2xl font-bold text-success">
                {formatPercent(scenarioMetrics.carbonReduction)}
              </div>
              <div className="text-xs text-foreground-secondary">
                Target: {formatPercent(defaultTargets.carbonReductionTarget)}
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground-secondary">Projected Value</span>
                <DollarSign className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold text-accent">
                {formatCurrency(financialImpact?.projectedValue || 0)}
              </div>
              <div className="text-xs text-foreground-secondary">In {timeHorizon} years</div>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground-secondary">Value Added</span>
                <BarChart3 className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold text-accent">
                {formatCurrency(financialImpact?.valueAdded || 0)}
              </div>
              <div className="text-xs text-foreground-secondary">ESG premium</div>
            </div>
          </div>

          {/* ESG Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-muted rounded-lg p-4">
              <h4 className="text-foreground font-medium mb-4">ESG Score Progress</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground-secondary">Current Score</span>
                    <span className="text-foreground">{scenarioMetrics.currentESG.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-accent h-3 rounded-full"
                      style={{ width: `${(scenarioMetrics.currentESG / 100) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground-secondary">Projected Score</span>
                    <span className="text-foreground">{scenarioMetrics.projectedESG.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-success h-3 rounded-full"
                      style={{ width: `${(scenarioMetrics.projectedESG / 100) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground-secondary">Target Score</span>
                    <span className="text-foreground">{defaultTargets.esgScoreTarget}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-warning h-3 rounded-full"
                      style={{ width: `${(defaultTargets.esgScoreTarget / 100) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <h4 className="text-foreground font-medium mb-4">Carbon Reduction Progress</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground-secondary">Current Intensity</span>
                    <span className="text-foreground">{scenarioMetrics.currentCarbon.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-destructive h-3 rounded-full"
                      style={{
                        width: `${Math.min((scenarioMetrics.currentCarbon / 200) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground-secondary">Projected Intensity</span>
                    <span className="text-foreground">{scenarioMetrics.projectedCarbon.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-success h-3 rounded-full"
                      style={{
                        width: `${Math.min((scenarioMetrics.projectedCarbon / 200) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground-secondary">Target Reduction</span>
                    <span className="text-foreground">
                      {formatPercent(defaultTargets.carbonReductionTarget)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-warning h-3 rounded-full"
                      style={{ width: `${defaultTargets.carbonReductionTarget * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Impact */}
          {financialImpact && (
            <div className="bg-muted rounded-lg p-4">
              <h4 className="text-foreground font-medium mb-4">Financial Impact Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {financialImpact.enhancedReturn.toFixed(2)}%
                  </div>
                  <div className="text-sm text-foreground-secondary">Enhanced Return</div>
                  <div className="text-xs text-success mt-1">
                    +{(financialImpact.enhancedReturn - financialImpact.baseReturn).toFixed(2)}% ESG
                    premium
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-accent mb-1">
                    {formatCurrency(financialImpact.projectedValue)}
                  </div>
                  <div className="text-sm text-foreground-secondary">Projected Value</div>
                  <div className="text-xs text-foreground-secondary mt-1">{timeHorizon}-year projection</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-accent mb-1">
                    {formatCurrency(financialImpact.valueAdded)}
                  </div>
                  <div className="text-sm text-foreground-secondary">ESG Value Added</div>
                  <div className="text-xs text-foreground-secondary mt-1">Sustainable investing premium</div>
                </div>
              </div>
            </div>
          )}
          <div className="bg-muted rounded-lg p-4">
            <h4 className="text-foreground font-medium mb-4">Scenario Comparison</h4>

            <div className="space-y-3">
              {modelResults.projections.map(projection => (
                <div
                  key={projection.scenario}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    projection.scenario === selectedScenario
                      ? 'bg-success/10 border-success/30'
                      : 'bg-muted border-border'
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select scenario ${projection.scenario}`}
                  onClick={() => setSelectedScenario(projection.scenario)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedScenario(projection.scenario);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          projection.scenario === 'Business as Usual'
                            ? 'bg-destructive'
                            : projection.scenario === 'Moderate Transition'
                              ? 'bg-warning'
                              : 'bg-success'
                        }`}
                      />
                      <h5 className="text-foreground font-medium">{projection.scenario}</h5>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${getCostColor(projection.cost)}`}
                      >
                        {projection.cost} Cost
                      </span>
                      {projection.meetsTarget && (
                        <span className="px-2 py-1 rounded text-xs bg-success/20 text-success">
                          Meets Target
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-foreground-secondary">ESG Score</div>
                      <div className="text-foreground font-medium">
                        {projection.projectedESG.toFixed(1)}
                        <span className="text-success text-xs ml-1">
                          (+{projection.esgImprovement})
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-foreground-secondary">Carbon Reduction</div>
                      <div className="text-foreground font-medium">
                        {formatPercent(projection.carbonReduction)}
                      </div>
                    </div>

                    <div>
                      <div className="text-foreground-secondary">Carbon Intensity</div>
                      <div className="text-foreground font-medium">
                        {projection.projectedCarbon.toFixed(1)}
                      </div>
                    </div>

                    <div>
                      <div className="text-foreground-secondary">Risk Level</div>
                      <div className="text-foreground font-medium capitalize">
                        {scenarios.find(s => s.name === projection.scenario)?.risk || 'Medium'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-muted rounded-lg p-4">
            <h4 className="text-foreground font-medium mb-4">Strategic Recommendations</h4>

            <div className="space-y-3">
              {modelResults.recommendedScenario && (
                <div className="p-3 bg-success/10 border border-success/30 rounded">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-success" />
                    <div>
                      <div className="text-foreground font-medium">
                        Recommended: {modelResults.recommendedScenario.scenario}
                      </div>
                      <div className="text-sm text-success/90">
                        This scenario meets both ESG score and carbon reduction targets with{' '}
                        {modelResults.recommendedScenario.cost.toLowerCase()} implementation cost.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-accent/10 border border-accent/30 rounded">
                  <div className="text-foreground font-medium mb-2">ESG Integration Benefits</div>
                  <ul className="text-sm text-accent space-y-1">
                    <li>• Enhanced risk-adjusted returns</li>
                    <li>• Improved regulatory compliance</li>
                    <li>• Access to sustainable investment opportunities</li>
                    <li>• Better stakeholder engagement</li>
                  </ul>
                </div>

                <div className="p-3 bg-accent/10 border border-accent/30 rounded">
                  <div className="text-foreground font-medium mb-2">Implementation Considerations</div>
                  <ul className="text-sm text-accent space-y-1">
                    <li>• Start with material ESG factors</li>
                    <li>• Engage with company management</li>
                    <li>• Monitor progress regularly</li>
                    <li>• Consider transition risk management</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-success" />
          <span className="ml-3 text-foreground-secondary">Modeling sustainable finance scenario...</span>
        </div>
      )}
    </div>
  );
};

export default SustainableFinanceModel;
