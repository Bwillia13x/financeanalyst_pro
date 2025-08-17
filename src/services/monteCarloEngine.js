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
   * Sample from a probability distribution with enhanced types
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

      case 'exponential':
        return this.exponentialRandom(parameters.lambda);

      case 'weibull':
        return this.weibullRandom(parameters.shape, parameters.scale);

      case 'pareto':
        return this.paretoRandom(parameters.scale, parameters.shape);

      case 'student_t':
        return this.studentTRandom(parameters.df);

      case 'chi_squared':
        return this.chiSquaredRandom(parameters.df);

      default:
        throw new Error(`Unsupported distribution type: ${type}`);
    }
  }

  /**
   * Generate exponential random variable
   * @param {number} lambda - Rate parameter
   * @returns {number} Exponential random variable
   */
  exponentialRandom(lambda) {
    return -Math.log(1 - Math.random()) / lambda;
  }

  /**
   * Generate Weibull random variable
   * @param {number} shape - Shape parameter (k)
   * @param {number} scale - Scale parameter (lambda)
   * @returns {number} Weibull random variable
   */
  weibullRandom(shape, scale) {
    const u = Math.random();
    return scale * Math.pow(-Math.log(1 - u), 1 / shape);
  }

  /**
   * Generate Pareto random variable
   * @param {number} scale - Scale parameter (xm)
   * @param {number} shape - Shape parameter (alpha)
   * @returns {number} Pareto random variable
   */
  paretoRandom(scale, shape) {
    const u = Math.random();
    return scale / Math.pow(u, 1 / shape);
  }

  /**
   * Generate Student's t random variable
   * @param {number} df - Degrees of freedom
   * @returns {number} Student's t random variable
   */
  studentTRandom(df) {
    if (df <= 0) throw new Error('Degrees of freedom must be positive');

    const normal = this.normalRandom(0, 1);
    const chiSq = this.chiSquaredRandom(df);

    return normal / Math.sqrt(chiSq / df);
  }

  /**
   * Generate Chi-squared random variable
   * @param {number} df - Degrees of freedom
   * @returns {number} Chi-squared random variable
   */
  chiSquaredRandom(df) {
    if (df <= 0) throw new Error('Degrees of freedom must be positive');

    return this.gammaRandom(df / 2) * 2;
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
   * Analyze simulation results with enhanced statistical measures
   * @param {Array} results - Simulation results
   * @param {number} confidenceLevel - Confidence level
   * @param {Array} metrics - Metrics to analyze
   * @returns {Object} Comprehensive statistical analysis
   */
  analyzeResults(results, confidenceLevel, metrics = ['pricePerShare', 'enterpriseValue', 'upside']) {
    const analysis = {
      statistics: {},
      percentiles: {},
      confidenceIntervals: {},
      riskMetrics: {},
      distributionTests: {},
      correlations: {}
    };

    metrics.forEach(metric => {
      const values = results.map(r => r[metric]).filter(v => v !== null && !isNaN(v)).sort((a, b) => a - b);

      if (values.length === 0) return;

      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const sampleStdDev = Math.sqrt(variance * values.length / (values.length - 1)); // Bessel's correction

      analysis.statistics[metric] = {
        mean,
        median: this.percentile(values, 0.5),
        mode: this.calculateMode(values),
        stdDev,
        sampleStdDev,
        variance,
        min: values[0],
        max: values[values.length - 1],
        range: values[values.length - 1] - values[0],
        count: values.length,
        // Additional robust statistics
        trimmedMean: this.calculateTrimmedMean(values, 0.1), // 10% trimmed mean
        mad: this.calculateMAD(values), // Median Absolute Deviation
        iqr: this.percentile(values, 0.75) - this.percentile(values, 0.25)
      };

      analysis.percentiles[metric] = {
        p1: this.percentile(values, 0.01),
        p5: this.percentile(values, 0.05),
        p10: this.percentile(values, 0.10),
        p25: this.percentile(values, 0.25),
        p50: this.percentile(values, 0.5),
        p75: this.percentile(values, 0.75),
        p90: this.percentile(values, 0.90),
        p95: this.percentile(values, 0.95),
        p99: this.percentile(values, 0.99)
      };

      const alpha = 1 - confidenceLevel;
      const lowerBound = this.percentile(values, alpha / 2);
      const upperBound = this.percentile(values, 1 - alpha / 2);

      analysis.confidenceIntervals[metric] = {
        level: confidenceLevel,
        lowerBound,
        upperBound,
        width: upperBound - lowerBound,
        // Bootstrap confidence intervals
        bootstrapCI: this.calculateBootstrapCI(values, confidenceLevel)
      };

      const var95 = this.percentile(values, 0.05);
      const var99 = this.percentile(values, 0.01);
      const cvar95 = values.slice(0, Math.floor(values.length * 0.05)).reduce((sum, v) => sum + v, 0) / Math.floor(values.length * 0.05);
      const cvar99 = values.slice(0, Math.floor(values.length * 0.01)).reduce((sum, v) => sum + v, 0) / Math.floor(values.length * 0.01);

      analysis.riskMetrics[metric] = {
        var95, // Value at Risk (5%)
        var99, // Value at Risk (1%)
        cvar95, // Conditional VaR (5%)
        cvar99, // Conditional VaR (1%)
        skewness: this.calculateSkewness(values, mean, stdDev),
        kurtosis: this.calculateKurtosis(values, mean, stdDev),
        excessKurtosis: this.calculateKurtosis(values, mean, stdDev) - 3,
        // Tail risk measures
        expectedShortfall: cvar95,
        maxDrawdown: this.calculateMaxDrawdown(values),
        // Risk-adjusted returns
        sharpeRatio: this.calculateSharpeRatio(values, 0.02), // Assuming 2% risk-free rate
        sortinoRatio: this.calculateSortinoRatio(values, mean)
      };

      // Distribution fitting tests
      analysis.distributionTests[metric] = {
        jarqueBera: this.jarqueBeraTest(values),
        kolmogorovSmirnov: this.ksTestNormality(values),
        shapiroWilk: values.length <= 5000 ? this.shapiroWilkTest(values) : null
      };
    });

    // Calculate correlation matrix between metrics
    if (metrics.length > 1) {
      analysis.correlations = this.calculateCorrelationMatrix(results, metrics);
    }

    return analysis;
  }

  /**
   * Calculate mode of dataset
   */
  calculateMode(values) {
    const frequency = {};
    values.forEach(v => {
      const rounded = Math.round(v * 100) / 100; // Round to avoid floating point issues
      frequency[rounded] = (frequency[rounded] || 0) + 1;
    });

    const maxFreq = Math.max(...Object.values(frequency));
    const modes = Object.keys(frequency).filter(k => frequency[k] === maxFreq);

    return modes.length === 1 ? parseFloat(modes[0]) : null;
  }

  /**
   * Calculate trimmed mean
   */
  calculateTrimmedMean(sortedValues, trimProportion = 0.1) {
    const trimCount = Math.floor(sortedValues.length * trimProportion);
    const trimmedValues = sortedValues.slice(trimCount, -trimCount || undefined);
    return trimmedValues.reduce((sum, v) => sum + v, 0) / trimmedValues.length;
  }

  /**
   * Calculate Median Absolute Deviation
   */
  calculateMAD(values) {
    const median = this.percentile(values, 0.5);
    const deviations = values.map(v => Math.abs(v - median)).sort((a, b) => a - b);
    return this.percentile(deviations, 0.5);
  }

  /**
   * Calculate bootstrap confidence interval
   */
  calculateBootstrapCI(values, confidenceLevel, bootstrapSamples = 1000) {
    const bootstrapMeans = [];

    for (let i = 0; i < bootstrapSamples; i++) {
      const sample = [];
      for (let j = 0; j < values.length; j++) {
        sample.push(values[Math.floor(Math.random() * values.length)]);
      }
      bootstrapMeans.push(sample.reduce((sum, v) => sum + v, 0) / sample.length);
    }

    bootstrapMeans.sort((a, b) => a - b);
    const alpha = 1 - confidenceLevel;

    return {
      lowerBound: this.percentile(bootstrapMeans, alpha / 2),
      upperBound: this.percentile(bootstrapMeans, 1 - alpha / 2)
    };
  }

  /**
   * Calculate maximum drawdown
   */
  calculateMaxDrawdown(values) {
    let peak = values[0];
    let maxDrawdown = 0;

    for (const value of values) {
      if (value > peak) {
        peak = value;
      }
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  /**
   * Calculate Sharpe ratio approximation
   */
  calculateSharpeRatio(values, riskFreeRate = 0.02) {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return stdDev > 0 ? (mean - riskFreeRate) / stdDev : 0;
  }

  /**
   * Calculate Sortino ratio
   */
  calculateSortinoRatio(values, targetReturn) {
    const excessReturns = values.map(v => v - targetReturn);
    const negativeReturns = excessReturns.filter(r => r < 0);

    if (negativeReturns.length === 0) return Infinity;

    const downsideDeviation = Math.sqrt(
      negativeReturns.reduce((sum, r) => sum + r * r, 0) / negativeReturns.length
    );

    const meanExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;

    return downsideDeviation > 0 ? meanExcessReturn / downsideDeviation : 0;
  }

  /**
   * Jarque-Bera test for normality
   */
  jarqueBeraTest(values) {
    const n = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const skewness = this.calculateSkewness(values, mean, stdDev);
    const kurtosis = this.calculateKurtosis(values, mean, stdDev);

    const jb = (n / 6) * (Math.pow(skewness, 2) + Math.pow(kurtosis - 3, 2) / 4);
    const pValue = 1 - this.chiSquaredCDF(jb, 2); // Approximate p-value

    return {
      statistic: jb,
      pValue,
      isNormal: pValue > 0.05
    };
  }

  /**
   * Approximate chi-squared CDF
   */
  chiSquaredCDF(x, df) {
    if (x <= 0) return 0;
    return this.incompleteGamma(df / 2, x / 2);
  }

  /**
   * Incomplete gamma function approximation
   */
  incompleteGamma(a, x) {
    // Returns the regularized lower incomplete gamma P(a, x)
    if (x <= 0) return 0;
    if (a <= 0) return NaN;

    if (x < a + 1) {
      // Series expansion for P(a, x)
      return this.incompleteGammaLowerSeries(a, x);
    }
    // Continued fraction for Q(a, x), then P = 1 - Q
    return 1 - this.incompleteGammaUpperContinuedFraction(a, x);
  }

  /**
   * Series expansion for regularized lower incomplete gamma P(a, x)
   */
  incompleteGammaLowerSeries(a, x) {
    const gln = this.logGamma(a);
    let sum = 1 / a;
    let term = sum;
    for (let n = 1; n <= 200; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-15) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - gln);
  }

  /**
   * Continued fraction for regularized upper incomplete gamma Q(a, x)
   * Based on Lentz's algorithm (Numerical Recipes)
   */
  incompleteGammaUpperContinuedFraction(a, x) {
    const gln = this.logGamma(a);
    const eps = 1e-14;
    const maxIterations = 200;
    const tiny = 1e-300;

    let b = x + 1 - a;
    let c = 1 / tiny;
    let d = 1 / b;
    let h = d;

    for (let i = 1; i <= maxIterations; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < tiny) d = tiny;
      c = b + an / c;
      if (Math.abs(c) < tiny) c = tiny;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < eps) break;
    }

    return Math.exp(-x + a * Math.log(x) - gln) * h;
  }

  /**
   * Log gamma function approximation
   */
  logGamma(x) {
    const coef = [
      76.18009172947146, -86.50532032941677, 24.01409824083091,
      -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5
    ];

    let j = 0;
    let ser = 1.000000000190015;
    let xx = x;
    let y = xx = x;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);

    for (; j < 6; j++) {
      ser += coef[j] / ++y;
    }

    return -tmp + Math.log(2.5066282746310005 * ser / xx);
  }

  /**
   * Kolmogorov-Smirnov test for normality
   */
  ksTestNormality(values) {
    const n = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    let maxD = 0;

    for (let i = 0; i < n; i++) {
      const empirical = (i + 1) / n;
      const theoretical = this.normalCDF((values[i] - mean) / stdDev);
      const d = Math.abs(empirical - theoretical);
      if (d > maxD) maxD = d;
    }

    const critical = 1.36 / Math.sqrt(n); // Critical value at 5% significance

    return {
      statistic: maxD,
      critical,
      isNormal: maxD < critical
    };
  }

  /**
   * Normal CDF approximation
   */
  normalCDF(x) {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  erf(x) {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Shapiro-Wilk test for normality (simplified)
   */
  shapiroWilkTest(values) {
    // Simplified implementation - in practice, would use lookup tables
    const n = values.length;
    if (n < 3 || n > 5000) return null;

    const sortedValues = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, v) => sum + v, 0) / n;

    // This is a very simplified approximation
    const numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      denominator += Math.pow(sortedValues[i] - mean, 2);
    }

    // Simplified calculation - real implementation would use Shapiro-Wilk coefficients
    const w = numerator / denominator;

    return {
      statistic: w,
      isNormal: w > 0.9 // Very rough approximation
    };
  }

  /**
   * Calculate correlation matrix between metrics
   */
  calculateCorrelationMatrix(results, metrics) {
    const correlationMatrix = {};

    for (let i = 0; i < metrics.length; i++) {
      correlationMatrix[metrics[i]] = {};
      for (let j = 0; j < metrics.length; j++) {
        if (i === j) {
          correlationMatrix[metrics[i]][metrics[j]] = 1.0;
        } else {
          const valuesI = results.map(r => r[metrics[i]]).filter(v => v !== null && !isNaN(v));
          const valuesJ = results.map(r => r[metrics[j]]).filter(v => v !== null && !isNaN(v));

          correlationMatrix[metrics[i]][metrics[j]] = this.calculateCorrelation(valuesI, valuesJ);
        }
      }
    }

    return correlationMatrix;
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  calculateCorrelation(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const meanX = x.reduce((sum, v) => sum + v, 0) / n;
    const meanY = y.reduce((sum, v) => sum + v, 0) / n;

    let numerator = 0;
    let sumXX = 0;
    let sumYY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      sumXX += dx * dx;
      sumYY += dy * dy;
    }

    const denominator = Math.sqrt(sumXX * sumYY);
    return denominator > 0 ? numerator / denominator : 0;
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
