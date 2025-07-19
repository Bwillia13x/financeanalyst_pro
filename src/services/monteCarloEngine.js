import { apiLogger } from '../utils/apiLogger.js';

/**
 * Monte Carlo Simulation Engine
 * Provides advanced statistical modeling and risk analysis
 */
class MonteCarloEngine {
  constructor() {
    this.workers = [];
    this.isRunning = false;
    this.currentSimulation = null;
  }

  /**
   * Run Monte Carlo simulation for DCF analysis
   * @param {Object} baseInputs - Base DCF inputs
   * @param {Object} distributions - Variable distributions
   * @param {Object} options - Simulation options
   * @returns {Promise<Object>} Simulation results
   */
  async runDCFSimulation(baseInputs, distributions, options = {}) {
    const {
      iterations = 10000,
      confidenceLevel = 0.95,
      correlationMatrix = null,
      randomSeed = null
    } = options;

    apiLogger.log('INFO', 'Starting DCF Monte Carlo simulation', {
      iterations,
      variables: Object.keys(distributions).length
    });

    this.isRunning = true;
    const startTime = Date.now();

    try {
      // Initialize random number generator
      if (randomSeed) {
        this.setSeed(randomSeed);
      }

      // Generate correlated random samples
      const samples = this.generateCorrelatedSamples(
        distributions,
        iterations,
        correlationMatrix
      );

      // Run simulation iterations
      const results = [];
      const progressCallback = options.onProgress;

      for (let i = 0; i < iterations; i++) {
        if (!this.isRunning) {
          throw new Error('Simulation cancelled');
        }

        // Create scenario inputs
        const scenarioInputs = this.createScenarioInputs(baseInputs, samples[i], distributions);

        // Calculate DCF for this scenario
        const dcfResult = this.calculateDCFScenario(scenarioInputs);
        results.push({
          iteration: i + 1,
          pricePerShare: dcfResult.pricePerShare,
          enterpriseValue: dcfResult.enterpriseValue,
          upside: dcfResult.upside,
          inputs: scenarioInputs
        });

        // Report progress
        if (progressCallback && i % Math.floor(iterations / 100) === 0) {
          progressCallback((i / iterations) * 100);
        }
      }

      // Analyze results
      const analysis = this.analyzeResults(results, confidenceLevel);

      const endTime = Date.now();
      apiLogger.log('INFO', 'DCF Monte Carlo simulation completed', {
        iterations,
        duration: endTime - startTime,
        meanPrice: analysis.statistics.mean
      });

      return {
        type: 'DCF_MONTE_CARLO',
        timestamp: new Date().toISOString(),
        parameters: { iterations, confidenceLevel, randomSeed },
        results,
        analysis,
        duration: endTime - startTime
      };

    } catch (error) {
      this.isRunning = false;
      apiLogger.log('ERROR', 'DCF Monte Carlo simulation failed', { error: error.message });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run Monte Carlo simulation for LBO analysis
   * @param {Object} baseInputs - Base LBO inputs
   * @param {Object} distributions - Variable distributions
   * @param {Object} options - Simulation options
   * @returns {Promise<Object>} Simulation results
   */
  async runLBOSimulation(baseInputs, distributions, options = {}) {
    const {
      iterations = 10000,
      confidenceLevel = 0.95,
      correlationMatrix = null,
      randomSeed = null
    } = options;

    apiLogger.log('INFO', 'Starting LBO Monte Carlo simulation', {
      iterations,
      variables: Object.keys(distributions).length
    });

    this.isRunning = true;
    const startTime = Date.now();

    try {
      if (randomSeed) {
        this.setSeed(randomSeed);
      }

      const samples = this.generateCorrelatedSamples(
        distributions,
        iterations,
        correlationMatrix
      );

      const results = [];
      const progressCallback = options.onProgress;

      for (let i = 0; i < iterations; i++) {
        if (!this.isRunning) {
          throw new Error('Simulation cancelled');
        }

        const scenarioInputs = this.createScenarioInputs(baseInputs, samples[i], distributions);
        const lboResult = this.calculateLBOScenario(scenarioInputs);

        results.push({
          iteration: i + 1,
          irr: lboResult.irr,
          moic: lboResult.moic,
          totalReturn: lboResult.totalReturn,
          inputs: scenarioInputs
        });

        if (progressCallback && i % Math.floor(iterations / 100) === 0) {
          progressCallback((i / iterations) * 100);
        }
      }

      const analysis = this.analyzeResults(results, confidenceLevel, ['irr', 'moic', 'totalReturn']);

      const endTime = Date.now();
      apiLogger.log('INFO', 'LBO Monte Carlo simulation completed', {
        iterations,
        duration: endTime - startTime,
        meanIRR: analysis.statistics.irr?.mean
      });

      return {
        type: 'LBO_MONTE_CARLO',
        timestamp: new Date().toISOString(),
        parameters: { iterations, confidenceLevel, randomSeed },
        results,
        analysis,
        duration: endTime - startTime
      };

    } catch (error) {
      this.isRunning = false;
      apiLogger.log('ERROR', 'LBO Monte Carlo simulation failed', { error: error.message });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Generate correlated random samples using Cholesky decomposition
   * @param {Object} distributions - Variable distributions
   * @param {number} iterations - Number of iterations
   * @param {Array} correlationMatrix - Correlation matrix
   * @returns {Array} Array of sample sets
   */
  generateCorrelatedSamples(distributions, iterations, correlationMatrix) {
    const variables = Object.keys(distributions);
    const numVars = variables.length;
    const samples = [];

    // Generate independent samples first
    const independentSamples = [];
    for (let i = 0; i < iterations; i++) {
      const sample = {};
      variables.forEach(variable => {
        const dist = distributions[variable];
        sample[variable] = this.sampleFromDistribution(dist);
      });
      independentSamples.push(sample);
    }

    // Apply correlation if matrix is provided
    if (correlationMatrix && correlationMatrix.length === numVars) {
      const choleskyMatrix = this.choleskyDecomposition(correlationMatrix);

      for (let i = 0; i < iterations; i++) {
        const correlatedSample = {};
        const independentValues = variables.map(v => independentSamples[i][v]);
        const correlatedValues = this.applyCorrelation(independentValues, choleskyMatrix);

        variables.forEach((variable, index) => {
          correlatedSample[variable] = correlatedValues[index];
        });

        samples.push(correlatedSample);
      }
    } else {
      samples.push(...independentSamples);
    }

    return samples;
  }

  /**
   * Sample from a probability distribution
   * @param {Object} distribution - Distribution parameters
   * @returns {number} Random sample
   */
  sampleFromDistribution(distribution) {
    const { type, parameters } = distribution;

    switch (type) {
      case 'normal':
        return this.normalRandom(parameters.mean, parameters.stdDev);

      case 'lognormal':
        const normalSample = this.normalRandom(parameters.mu, parameters.sigma);
        return Math.exp(normalSample);

      case 'uniform':
        return parameters.min + Math.random() * (parameters.max - parameters.min);

      case 'triangular':
        return this.triangularRandom(parameters.min, parameters.mode, parameters.max);

      case 'beta':
        return this.betaRandom(parameters.alpha, parameters.beta);

      default:
        throw new Error(`Unsupported distribution type: ${type}`);
    }
  }

  /**
   * Generate normal random variable using Box-Muller transform
   * @param {number} mean - Mean
   * @param {number} stdDev - Standard deviation
   * @returns {number} Normal random variable
   */
  normalRandom(mean = 0, stdDev = 1) {
    if (this.spareNormal !== undefined) {
      const spare = this.spareNormal;
      this.spareNormal = undefined;
      return spare * stdDev + mean;
    }

    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);

    this.spareNormal = z1;
    return z0 * stdDev + mean;
  }

  /**
   * Generate triangular random variable
   * @param {number} min - Minimum value
   * @param {number} mode - Mode value
   * @param {number} max - Maximum value
   * @returns {number} Triangular random variable
   */
  triangularRandom(min, mode, max) {
    const u = Math.random();
    const c = (mode - min) / (max - min);

    if (u < c) {
      return min + Math.sqrt(u * (max - min) * (mode - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
  }

  /**
   * Generate beta random variable
   * @param {number} alpha - Alpha parameter
   * @param {number} beta - Beta parameter
   * @returns {number} Beta random variable
   */
  betaRandom(alpha, beta) {
    const x = this.gammaRandom(alpha);
    const y = this.gammaRandom(beta);
    return x / (x + y);
  }

  /**
   * Generate gamma random variable
   * @param {number} shape - Shape parameter
   * @returns {number} Gamma random variable
   */
  gammaRandom(shape) {
    // Marsaglia and Tsang's method for shape >= 1
    if (shape >= 1) {
      const d = shape - 1 / 3;
      const c = 1 / Math.sqrt(9 * d);

      while (true) {
        let x, v;
        do {
          x = this.normalRandom();
          v = 1 + c * x;
        } while (v <= 0);

        v = v * v * v;
        const u = Math.random();

        if (u < 1 - 0.0331 * x * x * x * x) {
          return d * v;
        }

        if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
          return d * v;
        }
      }
    } else {
      // For shape < 1, use transformation
      return this.gammaRandom(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }
  }

  /**
   * Perform Cholesky decomposition
   * @param {Array} matrix - Correlation matrix
   * @returns {Array} Lower triangular matrix
   */
  choleskyDecomposition(matrix) {
    const n = matrix.length;
    const L = Array(n).fill().map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        if (i === j) {
          let sum = 0;
          for (let k = 0; k < j; k++) {
            sum += L[j][k] * L[j][k];
          }
          L[j][j] = Math.sqrt(matrix[j][j] - sum);
        } else {
          let sum = 0;
          for (let k = 0; k < j; k++) {
            sum += L[i][k] * L[j][k];
          }
          L[i][j] = (matrix[i][j] - sum) / L[j][j];
        }
      }
    }

    return L;
  }

  /**
   * Apply correlation using Cholesky matrix
   * @param {Array} independentValues - Independent random values
   * @param {Array} choleskyMatrix - Cholesky decomposition matrix
   * @returns {Array} Correlated values
   */
  applyCorrelation(independentValues, choleskyMatrix) {
    const n = independentValues.length;
    const correlatedValues = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        correlatedValues[i] += choleskyMatrix[i][j] * independentValues[j];
      }
    }

    return correlatedValues;
  }

  /**
   * Create scenario inputs by applying random samples to base inputs
   * @param {Object} baseInputs - Base model inputs
   * @param {Object} samples - Random samples
   * @param {Object} distributions - Distribution definitions
   * @returns {Object} Scenario inputs
   */
  createScenarioInputs(baseInputs, samples, distributions) {
    const scenarioInputs = { ...baseInputs };

    Object.entries(samples).forEach(([variable, sample]) => {
      const distribution = distributions[variable];

      if (distribution.applyTo) {
        // Apply sample to specific input field
        scenarioInputs[distribution.applyTo] = sample;
      } else {
        // Direct assignment
        scenarioInputs[variable] = sample;
      }
    });

    return scenarioInputs;
  }

  /**
   * Calculate DCF scenario (simplified for Monte Carlo)
   * @param {Object} inputs - Scenario inputs
   * @returns {Object} DCF results
   */
  calculateDCFScenario(inputs) {
    // This would integrate with the financialModelingEngine
    // Simplified calculation for demonstration
    const {
      currentRevenue = 1000000000,
      revenueGrowthRate = 0.1,
      fcfMargin = 0.15,
      wacc = 0.1,
      terminalGrowthRate = 0.025,
      sharesOutstanding = 100000000,
      currentPrice = 100
    } = inputs;

    // Simple DCF calculation
    const projectionYears = 5;
    let totalPV = 0;
    let revenue = currentRevenue;

    for (let year = 1; year <= projectionYears; year++) {
      revenue *= (1 + revenueGrowthRate);
      const fcf = revenue * fcfMargin;
      const pv = fcf / Math.pow(1 + wacc, year);
      totalPV += pv;
    }

    // Terminal value
    const terminalFCF = revenue * fcfMargin * (1 + terminalGrowthRate);
    const terminalValue = terminalFCF / (wacc - terminalGrowthRate);
    const pvTerminal = terminalValue / Math.pow(1 + wacc, projectionYears);

    const enterpriseValue = totalPV + pvTerminal;
    const pricePerShare = enterpriseValue / sharesOutstanding;
    const upside = ((pricePerShare - currentPrice) / currentPrice) * 100;

    return {
      pricePerShare,
      enterpriseValue,
      upside
    };
  }

  /**
   * Calculate LBO scenario (simplified for Monte Carlo)
   * @param {Object} inputs - Scenario inputs
   * @returns {Object} LBO results
   */
  calculateLBOScenario(inputs) {
    // Simplified LBO calculation for demonstration
    const {
      ebitda = 100000000,
      ebitdaGrowthRate = 0.05,
      exitMultiple = 10,
      debtMultiple = 5,
      holdingPeriod = 5
    } = inputs;

    const purchasePrice = ebitda * 10; // Assume 10x entry multiple
    const debt = ebitda * debtMultiple;
    const equity = purchasePrice - debt;

    // Project exit EBITDA
    const exitEbitda = ebitda * Math.pow(1 + ebitdaGrowthRate, holdingPeriod);
    const exitValue = exitEbitda * exitMultiple;
    const remainingDebt = debt * 0.5; // Assume 50% paydown
    const exitProceeds = exitValue - remainingDebt;

    const totalReturn = exitProceeds / equity;
    const irr = Math.pow(totalReturn, 1 / holdingPeriod) - 1;

    return {
      irr,
      moic: totalReturn,
      totalReturn: exitProceeds
    };
  }

  /**
   * Analyze simulation results
   * @param {Array} results - Simulation results
   * @param {number} confidenceLevel - Confidence level
   * @param {Array} metrics - Metrics to analyze
   * @returns {Object} Statistical analysis
   */
  analyzeResults(results, confidenceLevel, metrics = ['pricePerShare', 'enterpriseValue', 'upside']) {
    const analysis = {
      statistics: {},
      percentiles: {},
      confidenceIntervals: {},
      riskMetrics: {}
    };

    metrics.forEach(metric => {
      const values = results.map(r => r[metric]).filter(v => v !== null && !isNaN(v)).sort((a, b) => a - b);

      if (values.length === 0) return;

      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      analysis.statistics[metric] = {
        mean,
        median: this.percentile(values, 0.5),
        stdDev,
        min: values[0],
        max: values[values.length - 1],
        count: values.length
      };

      analysis.percentiles[metric] = {
        p5: this.percentile(values, 0.05),
        p25: this.percentile(values, 0.25),
        p50: this.percentile(values, 0.5),
        p75: this.percentile(values, 0.75),
        p95: this.percentile(values, 0.95)
      };

      const alpha = 1 - confidenceLevel;
      const lowerBound = this.percentile(values, alpha / 2);
      const upperBound = this.percentile(values, 1 - alpha / 2);

      analysis.confidenceIntervals[metric] = {
        level: confidenceLevel,
        lowerBound,
        upperBound,
        width: upperBound - lowerBound
      };

      analysis.riskMetrics[metric] = {
        var: this.percentile(values, 0.05), // Value at Risk (5%)
        cvar: values.slice(0, Math.floor(values.length * 0.05)).reduce((sum, v) => sum + v, 0) / Math.floor(values.length * 0.05), // Conditional VaR
        skewness: this.calculateSkewness(values, mean, stdDev),
        kurtosis: this.calculateKurtosis(values, mean, stdDev)
      };
    });

    return analysis;
  }

  /**
   * Calculate percentile
   * @param {Array} sortedValues - Sorted array of values
   * @param {number} p - Percentile (0-1)
   * @returns {number} Percentile value
   */
  percentile(sortedValues, p) {
    const index = p * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sortedValues[lower];
    }

    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  /**
   * Calculate skewness
   * @param {Array} values - Array of values
   * @param {number} mean - Mean
   * @param {number} stdDev - Standard deviation
   * @returns {number} Skewness
   */
  calculateSkewness(values, mean, stdDev) {
    const n = values.length;
    const sum = values.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 3), 0);
    return (n / ((n - 1) * (n - 2))) * sum;
  }

  /**
   * Calculate kurtosis
   * @param {Array} values - Array of values
   * @param {number} mean - Mean
   * @param {number} stdDev - Standard deviation
   * @returns {number} Kurtosis
   */
  calculateKurtosis(values, mean, stdDev) {
    const n = values.length;
    const sum = values.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 4), 0);
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  }

  /**
   * Set random seed for reproducible results
   * @param {number} seed - Random seed
   */
  setSeed(seed) {
    // Simple linear congruential generator for reproducible results
    this.seed = seed;
    this.random = () => {
      this.seed = (this.seed * 9301 + 49297) % 233280;
      return this.seed / 233280;
    };
    Math.random = this.random;
  }

  /**
   * Stop running simulation
   */
  stopSimulation() {
    this.isRunning = false;
  }

  /**
   * Check if simulation is running
   * @returns {boolean} True if running
   */
  isSimulationRunning() {
    return this.isRunning;
  }
}

// Export singleton instance
export const monteCarloEngine = new MonteCarloEngine();
export default MonteCarloEngine;
