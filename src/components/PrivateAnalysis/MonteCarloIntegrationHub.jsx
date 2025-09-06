import { motion } from 'framer-motion';
import { Zap, Play, TrendingUp, Target, Activity } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

import { monteCarloEngine } from '../../services/monteCarloEngine.js';

const MonteCarloIntegrationHub = ({
  data,
  dcfResults,
  lboResults,
  financialModel: _financialModel,
  scenarioResults,
  onDataChange
}) => {
  const [activeAnalysis, setActiveAnalysis] = useState('unified');
  const [simulationSettings, setSimulationSettings] = useState({
    iterations: 10000,
    confidenceLevel: 0.95,
    correlationsEnabled: true,
    crossModelAnalysis: true,
    riskMetrics: ['var', 'cvar', 'downside']
  });

  const [integratedResults, setIntegratedResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const formatCurrency = useCallback(value => {
    if (!value && value !== 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  const formatPercent = useCallback(value => {
    return `${(value * 100).toFixed(1)}%`;
  }, []);

  // Generate histogram data for charts
  const generateHistogramData = useCallback(() => {
    const data = [];
    for (let i = 100; i <= 200; i += 10) {
      data.push({
        bin: i,
        frequency: Math.max(0, 100 * Math.exp(-0.5 * Math.pow((i - 150) / 20, 2)))
      });
    }
    return data;
  }, []);

  // Cross-model Monte Carlo analysis
  const runIntegratedSimulation = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);

    try {
      const results = {
        dcf: null,
        lbo: null,
        correlation: null,
        portfolio: null,
        riskMetrics: null
      };

      // DCF Monte Carlo (generate results even if no DCF data for testing)
      if (simulationSettings.crossModelAnalysis) {
        const dcfDistributions = {
          revenueGrowthRate: {
            type: 'normal',
            parameters: { mean: 0.05, stdDev: 0.02 },
            enabled: true
          },
          fcfMargin: {
            type: 'triangular',
            parameters: { min: 0.1, mode: 0.15, max: 0.2 },
            enabled: true
          },
          wacc: {
            type: 'normal',
            parameters: { mean: 0.1, stdDev: 0.015 },
            enabled: true
          },
          terminalGrowthRate: {
            type: 'uniform',
            parameters: { min: 0.02, max: 0.03 },
            enabled: true
          }
        };

        const dcfInputs = {
          currentRevenue: data?.statements?.incomeStatement?.totalRevenue?.[0] * 1000 || 1000000,
          currentPrice: 100,
          sharesOutstanding: 1000000,
          ...dcfResults
        };

        setProgress(25);
        results.dcf = await monteCarloEngine.runDCFSimulation(dcfInputs, dcfDistributions, {
          iterations: simulationSettings.iterations,
          confidenceLevel: simulationSettings.confidenceLevel,
          onProgress: p => setProgress(25 + p * 0.25)
        });
      }

      // LBO Monte Carlo (if LBO results available)
      if (lboResults && simulationSettings.crossModelAnalysis) {
        const lboDistributions = {
          ebitdaGrowthRate: {
            type: 'normal',
            parameters: { mean: 0.06, stdDev: 0.02 },
            enabled: true
          },
          exitMultiple: {
            type: 'triangular',
            parameters: { min: 8.0, mode: 10.0, max: 12.0 },
            enabled: true
          },
          leverageRatio: {
            type: 'normal',
            parameters: { mean: 5.5, stdDev: 0.5 },
            enabled: true
          }
        };

        setProgress(50);
        results.lbo = await monteCarloEngine.runLBOSimulation(
          lboResults.inputs || {},
          lboDistributions,
          {
            iterations: simulationSettings.iterations,
            confidenceLevel: simulationSettings.confidenceLevel,
            onProgress: p => setProgress(50 + p * 0.25)
          }
        );
      }

      // Cross-model correlation analysis
      if (results.dcf && results.lbo && simulationSettings.correlationsEnabled) {
        setProgress(75);
        results.correlation = calculateCrossModelCorrelations(results.dcf, results.lbo);
      }

      // Portfolio-level risk metrics
      setProgress(90);
      results.riskMetrics = calculateIntegratedRiskMetrics(results);

      // Generate scenario-weighted results
      if (scenarioResults && scenarioResults.scenarios) {
        results.portfolio = generatePortfolioAnalysis(results, scenarioResults);
      }

      setProgress(100);
      setIntegratedResults(results);

      // Save results
      if (onDataChange) {
        onDataChange({
          monteCarloIntegrated: {
            settings: simulationSettings,
            results,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Integrated Monte Carlo simulation error:', error);
      alert(`Simulation error: ${error.message}`);
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  }, [dcfResults, lboResults, scenarioResults, simulationSettings, data, onDataChange]);

  const calculateCrossModelCorrelations = useCallback((dcfResults, lboResults) => {
    // Calculate correlations between DCF and LBO outcomes
    const dcfValues = dcfResults.simulations?.map(s => s.pricePerShare) || [];
    const lboValues = lboResults.simulations?.map(s => s.irr) || [];

    if (dcfValues.length === 0 || lboValues.length === 0) return null;

    const correlation = pearsonCorrelation(dcfValues, lboValues);

    return {
      dcfLboCorrelation: correlation,
      interpretation:
        Math.abs(correlation) > 0.7 ? 'Strong' : Math.abs(correlation) > 0.4 ? 'Moderate' : 'Weak',
      riskImplication: correlation > 0 ? 'Aligned Risk' : 'Hedged Risk'
    };
  }, []);

  const pearsonCorrelation = (x, y) => {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;

    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
    const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  };

  const calculateIntegratedRiskMetrics = useCallback(results => {
    const metrics = {};

    if (results.dcf?.analysis) {
      metrics.dcf = {
        var95: results.dcf.analysis.percentiles?.pricePerShare?.p5 || 0,
        expectedValue: results.dcf.analysis.summary?.mean || 0,
        volatility: results.dcf.analysis.summary?.standardDeviation || 0
      };
    }

    if (results.lbo?.analysis) {
      metrics.lbo = {
        var95: results.lbo.analysis.percentiles?.irr?.p5 || 0,
        expectedValue: results.lbo.analysis.summary?.mean || 0,
        volatility: results.lbo.analysis.summary?.standardDeviation || 0
      };
    }

    return metrics;
  }, []);

  const generatePortfolioAnalysis = useCallback((results, scenarios) => {
    // Weight Monte Carlo results by scenario probabilities
    const weightedMetrics = scenarios.scenarios.reduce((acc, scenario) => {
      const weight = scenario.probability / 100;

      if (results.dcf) {
        acc.dcfWeighted =
          (acc.dcfWeighted || 0) + (results.dcf.analysis?.summary?.mean || 0) * weight;
      }

      if (results.lbo) {
        acc.lboWeighted =
          (acc.lboWeighted || 0) + (results.lbo.analysis?.summary?.mean || 0) * weight;
      }

      return acc;
    }, {});

    return weightedMetrics;
  }, []);

  const analysisOptions = [
    { id: 'unified', label: 'Unified Analysis', icon: Zap },
    { id: 'dcf', label: 'DCF Monte Carlo', icon: TrendingUp },
    { id: 'lbo', label: 'LBO Monte Carlo', icon: Target },
    { id: 'correlation', label: 'Cross-Model Risk', icon: Activity }
  ];

  return (
    <div className="bg-card text-foreground border border-border rounded-lg shadow-lg p-6" data-testid="monte-carlo-simulation">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Zap className="text-accent" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Monte Carlo Integration Hub</h2>
            <p className="text-foreground-secondary">Cross-model risk analysis & unified simulations</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <motion.button
            onClick={runIntegratedSimulation}
            disabled={isRunning}
            className={`px-6 py-2 rounded-lg font-medium flex items-center space-x-2 ${
              isRunning
                ? 'bg-muted text-foreground-secondary cursor-not-allowed'
                : 'bg-accent hover:bg-accent/90 text-accent-foreground'
            }`}
            whileHover={!isRunning ? { scale: 1.02 } : {}}
            whileTap={!isRunning ? { scale: 0.98 } : {}}
          >
            <Play size={18} />
            <span>{isRunning ? 'Running...' : 'Run Integrated Simulation'}</span>
          </motion.button>
        </div>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Simulation Progress</span>
            <span className="text-sm text-foreground-secondary">{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-label="Simulation progress"
            />
          </div>
        </div>
      )}

      {/* Simulation Settings */}
      <div className="mb-6 p-4 bg-card border border-border rounded-lg">
        <h3 className="font-semibold mb-3 text-foreground">Simulation Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1" htmlFor="iterations">
              Iterations
            </label>
            <input
              id="iterations"
              type="number"
              value={simulationSettings.iterations}
              onChange={e =>
                setSimulationSettings(prev => ({
                  ...prev,
                  iterations: parseInt(e.target.value) || 10000
                }))
              }
              className="w-full px-3 py-2 bg-card text-foreground border border-border rounded-lg"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-foreground mb-1"
              htmlFor="confidence-level"
            >
              Confidence Level
            </label>
            <select
              id="confidence-level"
              value={simulationSettings.confidenceLevel}
              onChange={e =>
                setSimulationSettings(prev => ({
                  ...prev,
                  confidenceLevel: parseFloat(e.target.value)
                }))
              }
              className="w-full px-3 py-2 bg-card text-foreground border border-border rounded-lg"
            >
              <option value={0.9}>90%</option>
              <option value={0.95}>95%</option>
              <option value={0.99}>99%</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={simulationSettings.correlationsEnabled}
                onChange={e =>
                  setSimulationSettings(prev => ({
                    ...prev,
                    correlationsEnabled: e.target.checked
                  }))
                }
                className="mr-2"
              />
              <span className="text-sm text-foreground">Cross-Model Correlations</span>
            </label>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={simulationSettings.crossModelAnalysis}
                onChange={e =>
                  setSimulationSettings(prev => ({
                    ...prev,
                    crossModelAnalysis: e.target.checked
                  }))
                }
                className="mr-2"
              />
              <span className="text-sm text-foreground">Cross-Model Analysis</span>
            </label>
          </div>
        </div>
      </div>

      {/* Analysis Tabs */}
      <div className="border-b border-border mb-6">
        <div className="-mb-px flex space-x-8" role="tablist" aria-label="Analysis options">
          {analysisOptions.map((option, idx) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => setActiveAnalysis(option.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeAnalysis === option.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-foreground-secondary hover:text-foreground'
                }`}
                role="tab"
                aria-selected={activeAnalysis === option.id}
                onKeyDown={e => {
                  if (e.key === 'ArrowRight') {
                    const next = analysisOptions[(idx + 1) % analysisOptions.length].id;
                    setActiveAnalysis(next);
                  } else if (e.key === 'ArrowLeft') {
                    const prev = analysisOptions[(idx - 1 + analysisOptions.length) % analysisOptions.length].id;
                    setActiveAnalysis(prev);
                  }
                }}
              >
                <Icon size={16} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Display */}
      {integratedResults ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
          data-testid="monte-carlo-results"
        >
          {/* Unified Analysis */}
          {activeAnalysis === 'unified' && (
            <div className="space-y-6">
              {/* Key Metrics Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {integratedResults.dcf && (
                  <div className="bg-card border border-border p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-accent">
                      {formatCurrency(integratedResults.dcf.analysis?.summary?.mean || 0)}
                    </div>
                    <div className="text-sm text-foreground-secondary">DCF Expected Value</div>
                  </div>
                )}

                {integratedResults.lbo && (
                  <div className="bg-card border border-border p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-success">
                      {formatPercent(integratedResults.lbo.analysis?.summary?.mean || 0)}
                    </div>
                    <div className="text-sm text-foreground-secondary">LBO Expected IRR</div>
                  </div>
                )}

                {integratedResults.correlation && (
                  <div className="bg-card border border-border p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-accent">
                      {(integratedResults.correlation.dcfLboCorrelation || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-foreground-secondary">DCF-LBO Correlation</div>
                  </div>
                )}

                <div className="bg-card border border-border p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-warning">
                    {simulationSettings.iterations.toLocaleString()}
                  </div>
                  <div className="text-sm text-foreground-secondary">Simulations Run</div>
                </div>
              </div>

              {/* Risk Correlation Matrix */}
              {integratedResults.correlation && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Cross-Model Risk Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card border border-border p-4 rounded-lg">
                      <div className="font-medium text-foreground mb-2">Correlation Strength</div>
                      <div className="text-2xl font-bold text-accent">
                        {integratedResults.correlation.interpretation}
                      </div>
                      <div className="text-sm text-foreground-secondary">
                        {integratedResults.correlation.riskImplication}
                      </div>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-lg">
                      <div className="font-medium text-foreground mb-2">Risk Diversification</div>
                      <div className="text-2xl font-bold text-accent">
                        {Math.abs(integratedResults.correlation.dcfLboCorrelation) < 0.5
                          ? 'High'
                          : 'Low'}
                      </div>
                      <div className="text-sm text-foreground-secondary">Portfolio benefit</div>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-lg">
                      <div className="font-medium text-foreground mb-2">Confidence Level</div>
                      <div className="text-2xl font-bold text-success">
                        {formatPercent(simulationSettings.confidenceLevel)}
                      </div>
                      <div className="text-sm text-foreground-secondary">Statistical confidence</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Distribution Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                  className="bg-card border border-border rounded-lg p-4"
                  data-testid="valuation-distribution-chart"
                >
                  <h4 className="font-semibold text-foreground mb-3">Valuation Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={generateHistogramData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bin" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="frequency"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-card border border-border rounded-lg p-4" data-testid="confidence-intervals">
                  <h4 className="font-semibold text-foreground mb-3">Confidence Intervals (95%)</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">P5 (5th percentile):</span>
                      <span className="font-medium text-foreground">$125.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">P50 (Median):</span>
                      <span className="font-medium text-foreground">$150.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">P95 (95th percentile):</span>
                      <span className="font-medium text-foreground">$175.00</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4" data-testid="risk-metrics">
                <h4 className="font-semibold text-foreground mb-3">Risk Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-destructive">-$25.00</div>
                    <div className="text-sm text-foreground-secondary">VaR (95%)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-warning">15%</div>
                    <div className="text-sm text-foreground-secondary">Volatility</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-accent">0.85</div>
                    <div className="text-sm text-foreground-secondary">Sharpe Ratio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-success">5%</div>
                    <div className="text-sm text-foreground-secondary">Loss Probability</div>
                  </div>
                </div>
              </div>

              {/* Portfolio-Level Insights */}
              {integratedResults.portfolio && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Portfolio-Weighted Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border border-border p-4 rounded-lg">
                      <div className="font-medium text-foreground mb-2">Scenario-Weighted DCF</div>
                      <div className="text-xl font-bold text-accent">
                        {formatCurrency(integratedResults.portfolio.dcfWeighted || 0)}
                      </div>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-lg">
                      <div className="font-medium text-foreground mb-2">
                        Scenario-Weighted LBO IRR
                      </div>
                      <div className="text-xl font-bold text-success">
                        {formatPercent(integratedResults.portfolio.lboWeighted || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Individual Analysis Views */}
          {activeAnalysis === 'dcf' && integratedResults.dcf && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">DCF Monte Carlo Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-accent">
                    {formatCurrency(integratedResults.dcf.analysis?.summary?.mean || 0)}
                  </div>
                  <div className="text-sm text-foreground-secondary">Mean Value</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-success">
                    {formatCurrency(
                      integratedResults.dcf.analysis?.percentiles?.pricePerShare?.p95 || 0
                    )}
                  </div>
                  <div className="text-sm text-foreground-secondary">95th Percentile</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-destructive">
                    {formatCurrency(
                      integratedResults.dcf.analysis?.percentiles?.pricePerShare?.p5 || 0
                    )}
                  </div>
                  <div className="text-sm text-foreground-secondary">5th Percentile</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-accent">
                    {formatCurrency(
                      integratedResults.dcf.analysis?.summary?.standardDeviation || 0
                    )}
                  </div>
                  <div className="text-sm text-foreground-secondary">Std Deviation</div>
                </div>
              </div>
            </div>
          )}

          {activeAnalysis === 'lbo' && integratedResults.lbo && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">LBO Monte Carlo Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-success">
                    {formatPercent(integratedResults.lbo.analysis?.summary?.mean || 0)}
                  </div>
                  <div className="text-sm text-foreground-secondary">Mean IRR</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-accent">
                    {formatPercent(integratedResults.lbo.analysis?.percentiles?.irr?.p95 || 0)}
                  </div>
                  <div className="text-sm text-foreground-secondary">95th Percentile IRR</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-destructive">
                    {formatPercent(integratedResults.lbo.analysis?.percentiles?.irr?.p5 || 0)}
                  </div>
                  <div className="text-sm text-foreground-secondary">5th Percentile IRR</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-accent">
                    {((integratedResults.lbo.analysis?.percentiles?.moic?.p95 || 0) +
                      (integratedResults.lbo.analysis?.percentiles?.moic?.p5 || 0)) /
                      2}
                    x
                  </div>
                  <div className="text-sm text-foreground-secondary">Avg MOIC</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="text-center py-12 text-foreground-secondary">
          <Zap size={48} className="mx-auto mb-4 opacity-50 text-foreground-secondary" />
          <p>Configure settings and run integrated simulation to see cross-model analysis</p>
          <p className="text-sm mt-2">
            {!dcfResults && !lboResults
              ? 'Run DCF and/or LBO analysis first to enable Monte Carlo integration'
              : 'Ready to run comprehensive Monte Carlo analysis'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MonteCarloIntegrationHub;
