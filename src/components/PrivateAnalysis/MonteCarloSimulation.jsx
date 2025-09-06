import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Play,
  Square,
  Settings,
  Download,
  FileText,
  Zap
} from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  AreaChart,
  Area
} from 'recharts';

import { monteCarloEngine } from '../../services/monteCarloEngine.js';

const MonteCarloSimulation = ({ data, onDataChange: _onDataChange }) => {
  const [activeTab, setActiveTab] = useState('setup');
  const [simulationResults, setSimulationResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [simulationSettings, setSimulationSettings] = useState({
    iterations: 10000,
    confidenceLevel: 0.95,
    randomSeed: null,
    enableCorrelation: false
  });

  const [distributions, setDistributions] = useState({
    revenueGrowthRate: {
      type: 'normal',
      parameters: { mean: 0.1, stdDev: 0.03 },
      name: 'Revenue Growth Rate',
      enabled: true
    },
    fcfMargin: {
      type: 'triangular',
      parameters: { min: 0.12, mode: 0.15, max: 0.18 },
      name: 'FCF Margin',
      enabled: true
    },
    wacc: {
      type: 'normal',
      parameters: { mean: 0.1, stdDev: 0.015 },
      name: 'WACC',
      enabled: true
    },
    terminalGrowthRate: {
      type: 'uniform',
      parameters: { min: 0.02, max: 0.03 },
      name: 'Terminal Growth Rate',
      enabled: true
    }
  });

  const [correlationMatrix, setCorrelationMatrix] = useState([
    [1.0, 0.3, -0.2, 0.1],
    [0.3, 1.0, -0.4, 0.2],
    [-0.2, -0.4, 1.0, -0.3],
    [0.1, 0.2, -0.3, 1.0]
  ]);

  const distributionTypes = [
    { value: 'normal', label: 'Normal', parameters: ['mean', 'stdDev'] },
    { value: 'triangular', label: 'Triangular', parameters: ['min', 'mode', 'max'] },
    { value: 'uniform', label: 'Uniform', parameters: ['min', 'max'] },
    { value: 'lognormal', label: 'Log-Normal', parameters: ['mu', 'sigma'] },
    { value: 'beta', label: 'Beta', parameters: ['alpha', 'beta'] }
  ];

  const runSimulation = useCallback(async () => {
    try {
      // Validate data and settings before starting simulation

      setIsRunning(true);
      setProgress(0);

      const enabledDistributions = Object.fromEntries(
        Object.entries(distributions).filter(([_, dist]) => dist.enabled)
      );

      if (Object.keys(enabledDistributions).length === 0) {
        throw new Error(
          'No distributions are enabled. Please enable at least one variable distribution to run the simulation.'
        );
      }

      const options = {
        iterations: simulationSettings.iterations,
        confidenceLevel: simulationSettings.confidenceLevel,
        randomSeed: simulationSettings.randomSeed,
        correlationMatrix: simulationSettings.enableCorrelation ? correlationMatrix : null,
        onProgress: setProgress
      };

      // Extract current revenue from actual data structure
      const statements = data?.statements?.incomeStatement;
      const latestIndex = data?.periods?.length - 1 || 2;
      const currentRevenue = statements?.totalRevenue?.[latestIndex] || 1000000;
      const currentOperatingIncome = statements?.operatingIncome?.[latestIndex] || 150000;

      const baseInputs = {
        currentRevenue: currentRevenue * 1000, // Convert from thousands to actual values
        currentPrice: 100, // Default stock price for private company
        sharesOutstanding: 1000000, // Default shares outstanding
        currentOperatingIncome: currentOperatingIncome * 1000,
        ...Object.fromEntries(
          Object.entries(enabledDistributions).map(([key, dist]) => [
            key,
            dist.parameters.mean ||
              dist.parameters.mode ||
              (dist.parameters.min + dist.parameters.max) / 2
          ])
        )
      };

      const results = await monteCarloEngine.runDCFSimulation(
        baseInputs,
        enabledDistributions,
        options
      );

      setSimulationResults(results);
    } catch (error) {
      console.error('Monte Carlo simulation failed:', error);
      // Show error to user
      alert(`Monte Carlo simulation failed: ${error.message}`);
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  }, [distributions, simulationSettings, correlationMatrix, data]);

  const stopSimulation = useCallback(() => {
    monteCarloEngine.stopSimulation();
    setIsRunning(false);
  }, []);

  const updateDistribution = useCallback((variable, updates) => {
    setDistributions(prev => ({
      ...prev,
      [variable]: { ...prev[variable], ...updates }
    }));
  }, []);

  const updateCorrelation = useCallback((i, j, value) => {
    setCorrelationMatrix(prev => {
      const newMatrix = prev.map(row => [...row]);
      newMatrix[i][j] = value;
      newMatrix[j][i] = value; // Keep matrix symmetric
      return newMatrix;
    });
  }, []);

  const generateHistogramData = useMemo(() => {
    if (!simulationResults?.results) return [];

    const values = simulationResults.results.map(r => r.pricePerShare);
    const bins = 50;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins;

    const histogram = Array(bins)
      .fill(0)
      .map((_, i) => ({
        bin: min + i * binWidth,
        count: 0,
        frequency: 0
      }));

    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      histogram[binIndex].count++;
    });

    histogram.forEach(bin => {
      bin.frequency = bin.count / values.length;
    });

    return histogram;
  }, [simulationResults]);

  const generateScatterData = useMemo(() => {
    if (!simulationResults?.results) return [];

    return simulationResults.results.slice(0, 1000).map((result, _i) => ({
      x: result.inputs.revenueGrowthRate * 100,
      y: result.pricePerShare,
      upside: result.upside
    }));
  }, [simulationResults]);

  const formatCurrency = value => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const _formatPercent = value => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const tabs = [
    { id: 'setup', label: 'Setup', icon: Settings },
    { id: 'run', label: 'Run Simulation', icon: Play },
    { id: 'results', label: 'Results', icon: BarChart3 },
    { id: 'analysis', label: 'Analysis', icon: TrendingUp }
  ];

  return (
    <div
      className="bg-card text-foreground rounded-lg border border-border p-6"
      data-testid="monte-carlo-simulation"
    >
      <div className="mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center">
            <Zap className="inline-block mr-2 text-accent" />
            Monte Carlo Simulation
          </h2>
          <p className="text-foreground-secondary text-sm">
            Advanced risk analysis using probabilistic modeling • Generate thousands of scenarios •
            Measure uncertainty
          </p>
        </motion.div>
      </div>

      <div className="mb-6">
        <div className="flex space-x-2" role="tablist" aria-label="Monte Carlo sections">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-foreground-secondary hover:bg-muted/80 hover:text-foreground'
                }`}
                role="tab"
                aria-selected={activeTab === tab.id}
                onKeyDown={e => {
                  if (e.key === 'ArrowRight') {
                    const next = tabs[(idx + 1) % tabs.length].id;
                    setActiveTab(next);
                  } else if (e.key === 'ArrowLeft') {
                    const prev = tabs[(idx - 1 + tabs.length) % tabs.length].id;
                    setActiveTab(prev);
                  }
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <AnimatePresence mode="wait">
          {activeTab === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    🎛️ Simulation Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="iterations"
                        className="block text-sm font-medium text-foreground"
                      >
                        Iterations
                      </label>
                      <input
                        id="iterations"
                        type="number"
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        value={simulationSettings.iterations}
                        onChange={e =>
                          setSimulationSettings(prev => ({
                            ...prev,
                            iterations: parseInt(e.target.value)
                          }))
                        }
                        min="1000"
                        max="100000"
                        step="1000"
                      />
                      <small className="text-foreground-secondary">Leave empty for random</small>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="confidenceLevel"
                        className="block text-sm font-medium text-foreground"
                      >
                        Confidence Level
                      </label>
                      <select
                        id="confidenceLevel"
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        value={simulationSettings.confidenceLevel}
                        onChange={e =>
                          setSimulationSettings(prev => ({
                            ...prev,
                            confidenceLevel: parseFloat(e.target.value)
                          }))
                        }
                      >
                        <option value={0.9}>90%</option>
                        <option value={0.95}>95%</option>
                        <option value={0.99}>99%</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="randomSeed"
                        className="block text-sm font-medium text-foreground"
                      >
                        Random Seed (Optional)
                      </label>
                      <input
                        id="randomSeed"
                        type="number"
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        value={simulationSettings.randomSeed || ''}
                        onChange={e =>
                          setSimulationSettings(prev => ({
                            ...prev,
                            randomSeed: e.target.value ? parseInt(e.target.value) : null
                          }))
                        }
                        placeholder="Leave empty for random"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 text-foreground">
                        <input
                          type="checkbox"
                          className="w-4 h-4 bg-card border border-border rounded focus:ring-accent"
                          checked={simulationSettings.enableCorrelation}
                          onChange={e =>
                            setSimulationSettings(prev => ({
                              ...prev,
                              enableCorrelation: e.target.checked
                            }))
                          }
                        />
                        <span>Enable Variable Correlation</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    📊 Variable Distributions
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {Object.entries(distributions).map(([variable, dist]) => (
                      <div
                        key={variable}
                        className="bg-card border border-border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center space-x-2 text-foreground">
                            <input
                              type="checkbox"
                              checked={dist.enabled}
                              onChange={e =>
                                updateDistribution(variable, { enabled: e.target.checked })
                              }
                            />
                            <span className="font-medium">{dist.name}</span>
                          </label>
                        </div>

                        {dist.enabled && (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <label
                                htmlFor={`distributionType-${variable}`}
                                className="block text-sm font-medium text-foreground"
                              >
                                Distribution Type
                              </label>
                              <select
                                id={`distributionType-${variable}`}
                                className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                                value={dist.type}
                                onChange={e => {
                                  const newType = e.target.value;
                                  const _typeConfig = distributionTypes.find(
                                    t => t.value === newType
                                  );
                                  const newParameters = {};

                                  // Set default parameters for new type
                                  if (newType === 'normal') {
                                    newParameters.mean = 0.1;
                                  } else if (newType === 'triangular') {
                                    newParameters.min = 0.05;
                                    newParameters.mode = 0.1;
                                    newParameters.max = 0.15;
                                  } else if (newType === 'uniform') {
                                    newParameters.min = 0.05;
                                    newParameters.max = 0.15;
                                  }

                                  updateDistribution(variable, {
                                    type: newType,
                                    parameters: newParameters
                                  });
                                }}
                              >
                                {distributionTypes.map((type, _index) => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              {distributionTypes
                                .find(t => t.value === dist.type)
                                ?.parameters.map(param => (
                                  <div key={param} className="space-y-1">
                                    <label className="block text-xs font-medium text-foreground-secondary">
                                      {param.charAt(0).toUpperCase() + param.slice(1)}
                                    </label>
                                    <input
                                      className="w-full px-2 py-1 bg-card border border-border rounded text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                                      type="number"
                                      value={dist.parameters[param] || ''}
                                      onChange={e =>
                                        updateDistribution(variable, {
                                          parameters: {
                                            ...dist.parameters,
                                            [param]: parseFloat(e.target.value)
                                          }
                                        })
                                      }
                                      step="0.001"
                                    />
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {simulationSettings.enableCorrelation && (
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                      🔗 Correlation Matrix
                    </h3>
                    <div className="overflow-x-auto">
                      <table>
                        <thead>
                          <tr>
                            <th />
                            {Object.keys(distributions).map(variable => (
                              <th key={variable}>{distributions[variable].name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(distributions).map((variable, i) => (
                            <tr key={variable}>
                              <td className="font-medium text-foreground p-2 border border-border">
                                {distributions.map((dist, _index) => (
                                  <span key={_index}>{dist.name}</span>
                                ))}
                              </td>
                              {Object.keys(distributions).map((_, j) => (
                                <td key={j} className="p-2 border border-border">
                                  <input
                                    type="number"
                                    value={correlationMatrix[i][j]}
                                    onChange={e =>
                                      updateCorrelation(i, j, parseFloat(e.target.value))
                                    }
                                    min="-1"
                                    max="1"
                                    step="0.1"
                                    disabled={i === j}
                                    className="w-full px-2 py-1 bg-card border border-border rounded text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-muted disabled:text-foreground-secondary"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'run' && (
            <motion.div
              key="run"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-foreground">🚀 Simulation Control</h3>
                  <div className="flex items-center space-x-2">
                    {!isRunning ? (
                      <button
                        onClick={runSimulation}
                        className="bg-accent hover:bg-accent/90 disabled:bg-muted disabled:text-foreground-secondary text-accent-foreground px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                        disabled={Object.values(distributions).every(d => !d.enabled)}
                        data-action="run-simulation"
                      >
                        <Play size={16} />
                        <span>Run Simulation</span>
                      </button>
                    ) : (
                      <button
                        onClick={stopSimulation}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                      >
                        <Square size={16} />
                        <span>Stop Simulation</span>
                      </button>
                    )}
                  </div>
                </div>

                {isRunning && (
                  <div className="mt-4">
                    <div className="w-full bg-muted rounded-full h-2 mb-2">
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
                    <div className="text-sm text-foreground-secondary text-center">
                      {progress.toFixed(1)}% Complete (
                      {Math.floor((progress * simulationSettings.iterations) / 100)} /{' '}
                      {simulationSettings.iterations} iterations)
                    </div>
                  </div>
                )}

                <div className="bg-card border border-border rounded-lg p-4 mt-4">
                  <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    📋 Simulation Preview
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-card border border-border rounded-lg p-3 text-center">
                      <div className="text-sm text-foreground-secondary mb-1">Iterations</div>
                      <div className="text-xl font-bold text-foreground">
                        {simulationSettings.iterations.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-3 text-center">
                      <div className="text-sm text-foreground-secondary mb-1">Variables</div>
                      <div className="text-xl font-bold text-foreground">
                        {Object.values(distributions).filter(d => d.enabled).length}
                      </div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-3 text-center">
                      <div className="text-sm text-foreground-secondary mb-1">Confidence Level</div>
                      <div className="text-xl font-bold text-foreground">
                        {(simulationSettings.confidenceLevel * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-3 text-center">
                      <div className="text-sm text-foreground-secondary mb-1">Correlation</div>
                      <div className="text-xl font-bold text-foreground">
                        {simulationSettings.enableCorrelation ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {simulationResults ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-foreground flex items-center">
                      📊 Simulation Results
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors">
                        <Download size={16} />
                        Export Results
                      </button>
                      <button className="bg-card border border-border hover:bg-muted text-foreground px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors">
                        <FileText size={16} />
                        Generate Report
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(simulationResults.analysis.statistics).map(
                      ([metric, stats]) => (
                        <div key={metric} className="bg-card border border-border rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-foreground mb-3">
                            {metric === 'pricePerShare'
                              ? '💰 Price per Share'
                              : metric === 'enterpriseValue'
                                ? '🏢 Enterprise Value'
                                : '📈 Upside %'}
                          </h4>
                          <div className="text-2xl font-bold text-success mb-2">
                            {metric === 'upside'
                              ? `${stats.mean.toFixed(1)}%`
                              : formatCurrency(stats.mean)}
                          </div>
                          <div className="space-y-1 text-sm text-foreground-secondary">
                            <div>
                              Median:{' '}
                              {metric === 'upside'
                                ? `${stats.median.toFixed(1)}%`
                                : formatCurrency(stats.median)}
                            </div>
                            <div>
                              Std Dev:{' '}
                              {metric === 'upside'
                                ? `${stats.stdDev.toFixed(1)}%`
                                : formatCurrency(stats.stdDev)}
                            </div>
                            <div>
                              Min:{' '}
                              {metric === 'upside'
                                ? `${stats.min.toFixed(1)}%`
                                : formatCurrency(stats.min)}
                            </div>
                            <div>
                              Max:{' '}
                              {metric === 'upside'
                                ? `${stats.max.toFixed(1)}%`
                                : formatCurrency(stats.max)}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div
                      className="bg-card border border-border rounded-lg p-4"
                      data-testid="valuation-distribution-chart"
                    >
                      <h4 className="text-foreground">📊 Price Distribution</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={generateHistogramData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="bin" tickFormatter={formatCurrency} />
                          <YAxis />
                          <Tooltip
                            formatter={(value, _name) => [
                              `${(value * 100).toFixed(2)}%`,
                              'Frequency'
                            ]}
                            labelFormatter={value => `Price: ${formatCurrency(value)}`}
                          />
                          <Area
                            type="monotone"
                            dataKey="frequency"
                            stroke="#3B82F6"
                            fill="#3B82F6"
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-4">
                      <h4 className="text-foreground">🎯 Sensitivity Scatter Plot</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart data={generateScatterData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="x"
                            name="Revenue Growth Rate"
                            tickFormatter={value => `${value.toFixed(1)}%`}
                          />
                          <YAxis
                            dataKey="y"
                            name="Price per Share"
                            tickFormatter={formatCurrency}
                          />
                          <Tooltip
                            formatter={(value, name) => [
                              name === 'Revenue Growth Rate'
                                ? `${value.toFixed(2)}%`
                                : formatCurrency(value),
                              name
                            ]}
                          />
                          <Scatter name="Scenarios" fill="#10B981">
                            {generateScatterData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.upside > 0 ? '#10B981' : '#EF4444'}
                              />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle size={48} className="text-foreground-secondary mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Results Available</h3>
                  <p className="text-foreground-secondary">Run a simulation to see results here.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {simulationResults?.analysis ? (
                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-lg p-4" data-testid="risk-metrics">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                      ⚠️ Risk Metrics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(simulationResults.analysis.riskMetrics).map(
                        ([metric, value]) => (
                          <div
                            key={metric}
                            className="bg-card border border-border rounded-lg p-4"
                          >
                            <h4 className="text-sm font-medium text-foreground-secondary mb-2">
                              {metric === 'var95'
                                ? 'Value at Risk (95%)'
                                : metric === 'cvar95'
                                  ? 'Conditional VaR (95%)'
                                  : metric === 'probabilityOfLoss'
                                    ? 'Probability of Loss'
                                    : 'Sharpe Ratio'}
                            </h4>
                            <div className="text-xl font-bold text-destructive mb-1">
                              {metric === 'probabilityOfLoss'
                                ? `${(value * 100).toFixed(1)}%`
                                : formatCurrency(value)}
                            </div>
                            <div className="text-xs text-foreground-secondary">Risk measure</div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4" data-testid="confidence-intervals">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                      📊 Confidence Intervals (
                      {(
                        simulationResults.analysis.confidenceIntervals.pricePerShare?.level * 100
                      ).toFixed(0)}
                      %)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(simulationResults.analysis.confidenceIntervals).map(
                        ([metric, interval]) => (
                          <div
                            key={metric}
                            className="bg-card border border-border rounded-lg p-4"
                          >
                            <h4 className="text-lg font-semibold text-foreground mb-3">
                              {metric === 'pricePerShare'
                                ? 'Price per Share'
                                : metric === 'enterpriseValue'
                                  ? 'Enterprise Value'
                                  : 'Upside %'}
                            </h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-foreground-secondary">Lower Bound:</span>
                                <span className="font-medium text-foreground">
                                  {metric === 'upside'
                                    ? `${interval.lowerBound.toFixed(1)}%`
                                    : formatCurrency(interval.lowerBound)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-foreground-secondary">Upper Bound:</span>
                                <span className="font-medium text-foreground">
                                  {metric === 'upside'
                                    ? `${interval.upperBound.toFixed(1)}%`
                                    : formatCurrency(interval.upperBound)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-foreground-secondary">Width:</span>
                                <span className="font-medium text-accent">
                                  {metric === 'upside'
                                    ? `${interval.width.toFixed(1)}%`
                                    : formatCurrency(interval.width)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                      📊 Percentile Analysis
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-3 text-sm font-medium text-foreground-secondary">
                              Metric
                            </th>
                            <th className="text-right p-3 text-sm font-medium text-foreground-secondary">
                              5th %ile
                            </th>
                            <th className="text-right p-3 text-sm font-medium text-foreground-secondary">
                              25th %ile
                            </th>
                            <th className="text-right p-3 text-sm font-medium text-foreground-secondary">
                              50th %ile
                            </th>
                            <th className="text-right p-3 text-sm font-medium text-foreground-secondary">
                              75th %ile
                            </th>
                            <th className="text-right p-3 text-sm font-medium text-foreground-secondary">
                              95th %ile
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(simulationResults.analysis.percentiles).map(
                            ([metric, percentiles]) => (
                              <tr key={metric} className="border-b border-border">
                                <td className="p-3 text-sm text-foreground">
                                  {metric === 'pricePerShare'
                                    ? 'Price per Share'
                                    : metric === 'enterpriseValue'
                                      ? 'Enterprise Value'
                                      : 'Upside %'}
                                </td>
                                <td className="p-3 text-sm text-right text-foreground-secondary">
                                  {metric === 'upside'
                                    ? `${percentiles.p5.toFixed(1)}%`
                                    : formatCurrency(percentiles.p5)}
                                </td>
                                <td className="p-3 text-sm text-right text-foreground-secondary">
                                  {metric === 'upside'
                                    ? `${percentiles.p25.toFixed(1)}%`
                                    : formatCurrency(percentiles.p25)}
                                </td>
                                <td className="p-3 text-sm text-right text-accent font-medium">
                                  {metric === 'upside'
                                    ? `${percentiles.p50.toFixed(1)}%`
                                    : formatCurrency(percentiles.p50)}
                                </td>
                                <td className="p-3 text-sm text-right text-foreground-secondary">
                                  {metric === 'upside'
                                    ? `${percentiles.p75.toFixed(1)}%`
                                    : formatCurrency(percentiles.p75)}
                                </td>
                                <td className="p-3 text-sm text-right text-foreground-secondary">
                                  {metric === 'upside'
                                    ? `${percentiles.p95.toFixed(1)}%`
                                    : formatCurrency(percentiles.p95)}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle size={48} className="text-foreground-secondary mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Analysis Available</h3>
                  <p className="text-foreground-secondary">Run a simulation to see analysis here.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MonteCarloSimulation;
