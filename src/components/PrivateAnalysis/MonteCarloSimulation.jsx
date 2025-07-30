import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, AlertTriangle, Play, Square, Settings, Download, FileText } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, AreaChart, Area } from 'recharts';
import { monteCarloEngine } from '../../services/monteCarloEngine';

const MonteCarloSimulation = ({ data, onDataChange }) => {
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
      setIsRunning(true);
      setProgress(0);

      const enabledDistributions = Object.fromEntries(
        Object.entries(distributions).filter(([_, dist]) => dist.enabled)
      );

      const options = {
        iterations: simulationSettings.iterations,
        confidenceLevel: simulationSettings.confidenceLevel,
        randomSeed: simulationSettings.randomSeed,
        correlationMatrix: simulationSettings.enableCorrelation ? correlationMatrix : null,
        onProgress: setProgress
      };

      const baseInputs = {
        currentRevenue: data?.dcf?.currentRevenue || 1000000000,
        currentPrice: data?.dcf?.currentPrice || 100,
        sharesOutstanding: data?.dcf?.sharesOutstanding || 100000000,
        ...Object.fromEntries(
          Object.entries(enabledDistributions).map(([key, dist]) => [
            key,
            dist.parameters.mean || dist.parameters.mode || (dist.parameters.min + dist.parameters.max) / 2
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

    const histogram = Array(bins).fill(0).map((_, i) => ({
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

    return simulationResults.results.slice(0, 1000).map((result, i) => ({
      x: result.inputs.revenueGrowthRate * 100,
      y: result.pricePerShare,
      upside: result.upside
    }));
  }, [simulationResults]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const tabs = [
    { id: 'setup', label: 'Setup', icon: Settings },
    { id: 'run', label: 'Run Simulation', icon: Play },
    { id: 'results', label: 'Results', icon: BarChart3 },
    { id: 'analysis', label: 'Analysis', icon: TrendingUp }
  ];

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
            <Zap className="inline-block mr-2" />
            Monte Carlo Simulation
          </h2>
          <p className="text-gray-400 text-sm">
            Advanced risk analysis using probabilistic modeling • Generate thousands of scenarios • Measure uncertainty
          </p>
        </motion.div>
      </div>

      <div className="mb-6">
        {['setup', 'run', 'results', 'analysis'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
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
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    🎛️ Simulation Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-200">Iterations</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={simulationSettings.iterations}
                        onChange={(e) => setSimulationSettings(prev => ({
                          ...prev,
                          iterations: parseInt(e.target.value)
                        }))}
                        min="1000"
                        max="100000"
                        step="1000"
                      />
                      <small className="text-gray-400">Leave empty for random</small>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-200">Confidence Level</label>
                      <select
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={simulationSettings.confidenceLevel}
                        onChange={(e) => setSimulationSettings(prev => ({
                          ...prev,
                          confidenceLevel: parseFloat(e.target.value)
                        }))}
                      >
                        <option value={0.90}>90%</option>
                        <option value={0.95}>95%</option>
                        <option value={0.99}>99%</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-200">Random Seed (Optional)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={simulationSettings.randomSeed || ''}
                        onChange={(e) => setSimulationSettings(prev => ({
                          ...prev,
                          randomSeed: e.target.value ? parseInt(e.target.value) : null
                        }))}
                        placeholder="Leave empty for random"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 text-gray-200">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                          checked={simulationSettings.enableCorrelation}
                          onChange={(e) => setSimulationSettings(prev => ({
                            ...prev,
                            enableCorrelation: e.target.checked
                          }))}
                        />
                        <span>Enable Variable Correlation</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    📊 Variable Distributions
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {Object.entries(distributions).map(([variable, dist]) => (
                      <div key={variable} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center space-x-2 text-gray-200">
                            <input
                              type="checkbox"
                              checked={dist.enabled}
                              onChange={(e) => updateDistribution(variable, { enabled: e.target.checked })}
                            />
                            <span className="font-medium">{dist.name}</span>
                          </label>
                        </div>
                        
                        {dist.enabled && (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-200">Distribution Type</label>
                              <select
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={dist.type}
                                onChange={(e) => {
                                  const newType = e.target.value;
                                  const typeConfig = distributionTypes.find(t => t.value === newType);
                                  const newParameters = {};
                                  
                                  // Set default parameters for new type
                                  if (newType === 'normal') {
                                    newParameters.mean = 0.1;
                                    newParameters.stdDev = 0.02;
                                  } else if (newType === 'triangular') {
                                    newParameters.min = 0.05;
                                    newParameters.mode = 0.1;
                                    newParameters.max = 0.15;
                                  } else if (newType === 'uniform') {
                                    newParameters.min = 0.05;
                                    newParameters.max = 0.15;
                                  }
                                  
                                  updateDistribution(variable, { type: newType, parameters: newParameters });
                                }}
                              >
                                {distributionTypes.map(type => (
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
                                    <label className="block text-xs font-medium text-gray-300">{param.charAt(0).toUpperCase() + param.slice(1)}</label>
                                    <input
                                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      type="number"
                                      value={dist.parameters[param] || ''}
                                      onChange={(e) => updateDistribution(variable, {
                                        parameters: {
                                          ...dist.parameters,
                                          [param]: parseFloat(e.target.value)
                                        }
                                      })}
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
                  <div className={styles.correlationSection}>
                    <h3>🔗 Correlation Matrix</h3>
                    <div className={styles.correlationMatrix}>
                      <table>
                        <thead>
                          <tr>
                            <th></th>
                            {Object.keys(distributions).map(variable => (
                              <th key={variable}>{distributions[variable].name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(distributions).map((variable, i) => (
                            <tr key={variable}>
                              <td className={styles.correlationLabel}>
                                {distributions[variable].name}
                              </td>
                              {Object.keys(distributions).map((_, j) => (
                                <td key={j}>
                                  <input
                                    type="number"
                                    value={correlationMatrix[i][j]}
                                    onChange={(e) => updateCorrelation(i, j, parseFloat(e.target.value))}
                                    min="-1"
                                    max="1"
                                    step="0.1"
                                    disabled={i === j}
                                    className={styles.correlationInput}
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
              <div className={styles.runContainer}>
                <div className={styles.runHeader}>
                  <h3>🚀 Simulation Control</h3>
                  <div className="flex items-center space-x-2">
                    {!isRunning ? (
                      <button
                        onClick={runSimulation}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                        disabled={Object.values(distributions).every(d => !d.enabled)}
                      >
                        <Play size={16} />
                        <span>Run Simulation</span>
                      </button>
                    ) : (
                      <button
                        onClick={stopSimulation}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                      >
                        <Square size={16} />
                        <span>Stop Simulation</span>
                      </button>
                    )}
                  </div>
                </div>

                {isRunning && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-400 text-center">
                      {progress.toFixed(1)}% Complete ({Math.floor(progress * simulationSettings.iterations / 100)} / {simulationSettings.iterations} iterations)
                    </div>
                  </div>
                )}

                <div className="bg-gray-800 rounded-lg p-4 mt-4">
                  <h4>📋 Simulation Preview</h4>
                  <div className={styles.previewGrid}>
                    <div className={styles.previewCard}>
                      <div className={styles.previewLabel}>Iterations</div>
                      <div className={styles.previewValue}>
                        {simulationSettings.iterations.toLocaleString()}
                      </div>
                    </div>
                    <div className={styles.previewCard}>
                      <div className={styles.previewLabel}>Variables</div>
                      <div className={styles.previewValue}>
                        {Object.values(distributions).filter(d => d.enabled).length}
                      </div>
                    </div>
                    <div className={styles.previewCard}>
                      <div className={styles.previewLabel}>Confidence Level</div>
                      <div className={styles.previewValue}>
                        {(simulationSettings.confidenceLevel * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className={styles.previewCard}>
                      <div className={styles.previewLabel}>Correlation</div>
                      <div className={styles.previewValue}>
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
                <div className={styles.resultsContainer}>
                  <div className={styles.resultsHeader}>
                    <h3>📈 Simulation Results</h3>
                    <div className={styles.resultsActions}>
                      <button className={`${styles.button} ${styles.secondary}`}>
                        <Download size={16} />
                        Export Results
                      </button>
                      <button className={`${styles.button} ${styles.tertiary}`}>
                        <FileText size={16} />
                        Generate Report
                      </button>
                    </div>
                  </div>

                  <div className={styles.statisticsGrid}>
                    {Object.entries(simulationResults.analysis.statistics).map(([metric, stats]) => (
                      <div key={metric} className={styles.statisticCard}>
                        <h4>{metric === 'pricePerShare' ? 'Price per Share' : 
                             metric === 'enterpriseValue' ? 'Enterprise Value' : 
                             'Upside %'}</h4>
                        <div className={styles.statValue}>
                          {metric === 'upside' ? 
                            `${stats.mean.toFixed(1)}%` :
                            formatCurrency(stats.mean)
                          }
                        </div>
                        <div className={styles.statDetails}>
                          <div>Median: {metric === 'upside' ? `${stats.median.toFixed(1)}%` : formatCurrency(stats.median)}</div>
                          <div>Std Dev: {metric === 'upside' ? `${stats.stdDev.toFixed(1)}%` : formatCurrency(stats.stdDev)}</div>
                          <div>Min: {metric === 'upside' ? `${stats.min.toFixed(1)}%` : formatCurrency(stats.min)}</div>
                          <div>Max: {metric === 'upside' ? `${stats.max.toFixed(1)}%` : formatCurrency(stats.max)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.chartsSection}>
                    <div className={styles.chartCard}>
                      <h4>📊 Price Distribution</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={generateHistogramData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="bin" 
                            tickFormatter={formatCurrency}
                          />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => [
                              `${(value * 100).toFixed(2)}%`, 
                              'Frequency'
                            ]}
                            labelFormatter={(value) => `Price: ${formatCurrency(value)}`}
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

                    <div className={styles.chartCard}>
                      <h4>🎯 Sensitivity Scatter Plot</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart data={generateScatterData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="x" 
                            name="Revenue Growth Rate"
                            tickFormatter={(value) => `${value.toFixed(1)}%`}
                          />
                          <YAxis 
                            dataKey="y" 
                            name="Price per Share"
                            tickFormatter={formatCurrency}
                          />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'Revenue Growth Rate' ? `${value.toFixed(2)}%` : formatCurrency(value),
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
                <div className={styles.noResults}>
                  <AlertTriangle size={48} />
                  <h3>No Results Available</h3>
                  <p>Run a simulation to see results here.</p>
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
              {simulationResults ? (
                <div className={styles.analysisContainer}>
                  <div className={styles.riskMetricsSection}>
                    <h3>⚠️ Risk Metrics</h3>
                    <div className={styles.riskMetricsGrid}>
                      {Object.entries(simulationResults.analysis.riskMetrics).map(([metric, risks]) => (
                        <div key={metric} className={styles.riskCard}>
                          <h4>{metric === 'pricePerShare' ? 'Price per Share Risk' : 
                               metric === 'enterpriseValue' ? 'Enterprise Value Risk' : 
                               'Upside Risk'}</h4>
                          <div className={styles.riskMetric}>
                            <span>Value at Risk (5%):</span>
                            <span>{metric === 'upside' ? `${risks.var.toFixed(1)}%` : formatCurrency(risks.var)}</span>
                          </div>
                          <div className={styles.riskMetric}>
                            <span>Conditional VaR:</span>
                            <span>{metric === 'upside' ? `${risks.cvar.toFixed(1)}%` : formatCurrency(risks.cvar)}</span>
                          </div>
                          <div className={styles.riskMetric}>
                            <span>Skewness:</span>
                            <span>{risks.skewness.toFixed(3)}</span>
                          </div>
                          <div className={styles.riskMetric}>
                            <span>Kurtosis:</span>
                            <span>{risks.kurtosis.toFixed(3)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.confidenceIntervalsSection}>
                    <h3>🎯 Confidence Intervals ({(simulationResults.analysis.confidenceIntervals.pricePerShare?.level * 100).toFixed(0)}%)</h3>
                    <div className={styles.intervalsGrid}>
                      {Object.entries(simulationResults.analysis.confidenceIntervals).map(([metric, interval]) => (
                        <div key={metric} className={styles.intervalCard}>
                          <h4>{metric === 'pricePerShare' ? 'Price per Share' : 
                               metric === 'enterpriseValue' ? 'Enterprise Value' : 
                               'Upside %'}</h4>
                          <div className={styles.intervalRange}>
                            <div className={styles.intervalBound}>
                              <span>Lower Bound:</span>
                              <span>{metric === 'upside' ? `${interval.lowerBound.toFixed(1)}%` : formatCurrency(interval.lowerBound)}</span>
                            </div>
                            <div className={styles.intervalBound}>
                              <span>Upper Bound:</span>
                              <span>{metric === 'upside' ? `${interval.upperBound.toFixed(1)}%` : formatCurrency(interval.upperBound)}</span>
                            </div>
                            <div className={styles.intervalWidth}>
                              <span>Width:</span>
                              <span>{metric === 'upside' ? `${interval.width.toFixed(1)}%` : formatCurrency(interval.width)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.percentilesSection}>
                    <h3>📊 Percentile Analysis</h3>
                    <div className={styles.percentilesTable}>
                      <table>
                        <thead>
                          <tr>
                            <th>Metric</th>
                            <th>5th %ile</th>
                            <th>25th %ile</th>
                            <th>50th %ile</th>
                            <th>75th %ile</th>
                            <th>95th %ile</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(simulationResults.analysis.percentiles).map(([metric, percentiles]) => (
                            <tr key={metric}>
                              <td>{metric === 'pricePerShare' ? 'Price per Share' : 
                                   metric === 'enterpriseValue' ? 'Enterprise Value' : 
                                   'Upside %'}</td>
                              <td>{metric === 'upside' ? `${percentiles.p5.toFixed(1)}%` : formatCurrency(percentiles.p5)}</td>
                              <td>{metric === 'upside' ? `${percentiles.p25.toFixed(1)}%` : formatCurrency(percentiles.p25)}</td>
                              <td>{metric === 'upside' ? `${percentiles.p50.toFixed(1)}%` : formatCurrency(percentiles.p50)}</td>
                              <td>{metric === 'upside' ? `${percentiles.p75.toFixed(1)}%` : formatCurrency(percentiles.p75)}</td>
                              <td>{metric === 'upside' ? `${percentiles.p95.toFixed(1)}%` : formatCurrency(percentiles.p95)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.noResults}>
                  <AlertTriangle size={48} />
                  <h3>No Analysis Available</h3>
                  <p>Run a simulation to see analysis here.</p>
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