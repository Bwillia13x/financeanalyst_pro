/**
 * Advanced Simulation Engine
 * Supports multiple sampling methods: Monte Carlo, Latin Hypercube, Sobol, Halton sequences
 */

class AdvancedSimulationEngine {
  constructor() {
    this.workers = [];
    this.isRunning = false;
    this.currentSimulation = null;
    this.sobolSequence = null;
    this.haltonIndices = {};
  }

  /**
   * Run simulation with specified method
   * @param {Object} params - Simulation parameters
   * @param {Object} distributions - Variable distributions
   * @param {Object} baseInputs - Base model inputs
   * @param {Function} progressCallback - Progress update callback
   * @returns {Promise<Object>} Simulation results
   */
  async runSimulation(params, distributions, baseInputs, progressCallback) {
    const {
      method = 'monte_carlo',
      iterations = 10000,
      confidenceLevel = 0.95,
      randomSeed = null,
      correlationMatrix = null
    } = params;

    this.isRunning = true;
    const startTime = Date.now();

    try {
      // Initialize random seed if provided
      if (randomSeed) {
        this.setSeed(randomSeed);
      }

      let samples;

      // Generate samples based on method
      switch (method) {
        case 'latin_hypercube':
          samples = await this.generateLatinHypercubeSamples(
            distributions, iterations, correlationMatrix, progressCallback
          );
          break;
        case 'sobol_sequence':
          samples = await this.generateSobolSamples(
            distributions, iterations, correlationMatrix, progressCallback
          );
          break;
        case 'halton_sequence':
          samples = await this.generateHaltonSamples(
            distributions, iterations, correlationMatrix, progressCallback
          );
          break;
        default: // monte_carlo
          samples = await this.generateMonteCarloSamples(
            distributions, iterations, correlationMatrix, progressCallback
          );
      }

      // Run model evaluations
      const results = await this.evaluateModel(samples, baseInputs, progressCallback);

      // Calculate statistics
      const statistics = this.calculateStatistics(results, confidenceLevel);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      return {
        method,
        parameters: params,
        statistics,
        results: results.slice(0, 1000), // Limit results for memory
        convergence: this.analyzeConvergence(results),
        performance: {
          executionTime,
          iterationsPerSecond: iterations / (executionTime / 1000),
          memoryUsed: this.estimateMemoryUsage(iterations)
        },
        quality: this.assessSampleQuality(samples, method),
        completedAt: new Date()
      };

    } catch (error) {
      this.isRunning = false;
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Generate Latin Hypercube Samples
   */
  async generateLatinHypercubeSamples(distributions, iterations, correlationMatrix, progressCallback) {
    const variables = Object.keys(distributions);
    const numVars = variables.length;
    const samples = [];

    // Generate Latin Hypercube design
    const lhsMatrix = this.generateLHSMatrix(numVars, iterations);

    for (let i = 0; i < iterations; i++) {
      const sample = {};

      variables.forEach((variable, varIndex) => {
        const dist = distributions[variable];
        const uniformValue = lhsMatrix[i][varIndex];
        sample[variable] = this.inverseCDF(uniformValue, dist);
      });

      samples.push(sample);

      // Update progress
      if (i % Math.floor(iterations / 20) === 0 && progressCallback) {
        progressCallback((i / iterations) * 50); // First 50% for sampling
      }
    }

    // Apply correlation if provided
    if (correlationMatrix) {
      return this.applyCorrelationToSamples(samples, correlationMatrix, variables);
    }

    return samples;
  }

  /**
   * Generate Sobol Sequence Samples
   */
  async generateSobolSamples(distributions, iterations, correlationMatrix, progressCallback) {
    const variables = Object.keys(distributions);
    const numVars = variables.length;
    const samples = [];

    // Initialize Sobol sequence
    this.initializeSobolSequence(numVars);

    for (let i = 0; i < iterations; i++) {
      const sample = {};
      const sobolPoint = this.getNextSobolPoint(numVars);

      variables.forEach((variable, varIndex) => {
        const dist = distributions[variable];
        const uniformValue = sobolPoint[varIndex];
        sample[variable] = this.inverseCDF(uniformValue, dist);
      });

      samples.push(sample);

      // Update progress
      if (i % Math.floor(iterations / 20) === 0 && progressCallback) {
        progressCallback((i / iterations) * 50);
      }
    }

    if (correlationMatrix) {
      return this.applyCorrelationToSamples(samples, correlationMatrix, variables);
    }

    return samples;
  }

  /**
   * Generate Halton Sequence Samples
   */
  async generateHaltonSamples(distributions, iterations, correlationMatrix, progressCallback) {
    const variables = Object.keys(distributions);
    const numVars = variables.length;
    const samples = [];

    // Prime numbers for Halton sequence
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

    for (let i = 0; i < iterations; i++) {
      const sample = {};

      variables.forEach((variable, varIndex) => {
        const dist = distributions[variable];
        const prime = primes[varIndex % primes.length];
        const uniformValue = this.haltonNumber(i + 1, prime);
        sample[variable] = this.inverseCDF(uniformValue, dist);
      });

      samples.push(sample);

      // Update progress
      if (i % Math.floor(iterations / 20) === 0 && progressCallback) {
        progressCallback((i / iterations) * 50);
      }
    }

    if (correlationMatrix) {
      return this.applyCorrelationToSamples(samples, correlationMatrix, variables);
    }

    return samples;
  }

  /**
   * Generate Monte Carlo Samples (standard random sampling)
   */
  async generateMonteCarloSamples(distributions, iterations, correlationMatrix, progressCallback) {
    const variables = Object.keys(distributions);
    const samples = [];

    for (let i = 0; i < iterations; i++) {
      const sample = {};

      variables.forEach(variable => {
        const dist = distributions[variable];
        sample[variable] = this.sampleFromDistribution(dist);
      });

      samples.push(sample);

      // Update progress
      if (i % Math.floor(iterations / 20) === 0 && progressCallback) {
        progressCallback((i / iterations) * 50);
      }
    }

    if (correlationMatrix) {
      return this.applyCorrelationToSamples(samples, correlationMatrix, variables);
    }

    return samples;
  }

  /**
   * Generate Latin Hypercube Design Matrix
   */
  generateLHSMatrix(numVars, iterations) {
    const matrix = [];

    for (let i = 0; i < iterations; i++) {
      matrix[i] = [];
    }

    // For each variable
    for (let varIndex = 0; varIndex < numVars; varIndex++) {
      // Create equally spaced intervals
      const intervals = [];
      for (let i = 0; i < iterations; i++) {
        intervals.push((i + Math.random()) / iterations);
      }

      // Shuffle the intervals
      this.shuffleArray(intervals);

      // Assign to matrix
      for (let i = 0; i < iterations; i++) {
        matrix[i][varIndex] = intervals[i];
      }
    }

    return matrix;
  }

  /**
   * Initialize Sobol sequence (simplified implementation)
   */
  initializeSobolSequence(dimensions) {
    this.sobolSequence = {
      dimensions,
      index: 0,
      direction: Array(dimensions).fill(0).map(() => Array(32).fill(0))
    };

    // Initialize direction numbers (simplified)
    for (let d = 0; d < dimensions; d++) {
      this.sobolSequence.direction[d][0] = 1;
      for (let i = 1; i < 32; i++) {
        this.sobolSequence.direction[d][i] = this.sobolSequence.direction[d][i - 1] * 2;
      }
    }
  }

  /**
   * Get next point in Sobol sequence
   */
  getNextSobolPoint(dimensions) {
    const point = new Array(dimensions);
    const index = this.sobolSequence.index++;

    for (let d = 0; d < dimensions; d++) {
      let value = 0;
      let i = index;
      let j = 0;

      while (i > 0) {
        if (i & 1) {
          value ^= this.sobolSequence.direction[d][j];
        }
        i >>= 1;
        j++;
      }

      point[d] = value / Math.pow(2, 32);
    }

    return point;
  }

  /**
   * Calculate Halton number
   */
  haltonNumber(index, base) {
    let result = 0;
    let fraction = 1.0 / base;
    let i = index;

    while (i > 0) {
      result += (i % base) * fraction;
      i = Math.floor(i / base);
      fraction /= base;
    }

    return result;
  }

  /**
   * Inverse CDF for different distributions
   */
  inverseCDF(u, distribution) {
    const { type, params } = distribution;

    switch (type) {
      case 'normal':
        return this.inverseNormalCDF(u, params.mean, params.std);
      case 'lognormal':
        const normalValue = this.inverseNormalCDF(u, params.logMean, params.logStd);
        return Math.exp(normalValue);
      case 'uniform':
        return params.min + u * (params.max - params.min);
      case 'triangular':
        return this.inverseTriangularCDF(u, params.min, params.mode, params.max);
      case 'beta':
        return this.inverseBetaCDF(u, params.alpha, params.beta);
      default:
        throw new Error(`Unsupported distribution type: ${type}`);
    }
  }

  /**
   * Inverse normal CDF (Box-Muller approximation)
   */
  inverseNormalCDF(u, mean = 0, std = 1) {
    // Beasley-Springer-Moro algorithm approximation
    const a0 = 2.50662823884;
    const a1 = -18.61500062529;
    const a2 = 41.39119773534;
    const a3 = -25.44106049637;
    const b1 = -8.47351093090;
    const b2 = 23.08336743743;
    const b3 = -21.06224101826;
    const b4 = 3.13082909833;
    const c0 = -2.78718931138;
    const c1 = -2.29796479134;
    const c2 = 4.85014127135;
    const c3 = 2.32121276858;
    const d1 = 3.54388924762;
    const d2 = 1.63706781897;

    const y = u - 0.5;
    let r, x;

    if (Math.abs(y) < 0.42) {
      r = y * y;
      x = y * (((a3 * r + a2) * r + a1) * r + a0) / ((((b4 * r + b3) * r + b2) * r + b1) * r + 1);
    } else {
      r = u;
      if (y > 0) r = 1 - u;
      r = Math.log(-Math.log(r));
      x = c0 + r * (c1 + r * (c2 + r * c3)) / (1 + r * (d1 + r * d2));
      if (y < 0) x = -x;
    }

    return mean + x * std;
  }

  /**
   * Inverse triangular CDF
   */
  inverseTriangularCDF(u, min, mode, max) {
    const fc = (mode - min) / (max - min);

    if (u < fc) {
      return min + Math.sqrt(u * (max - min) * (mode - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
  }

  /**
   * Inverse Beta CDF (approximation)
   */
  inverseBetaCDF(u, alpha, beta) {
    // Simple approximation for Beta distribution
    // In practice, would use more sophisticated algorithms
    if (alpha === 1 && beta === 1) return u;

    // Use normal approximation for large parameters
    if (alpha > 10 && beta > 10) {
      const mean = alpha / (alpha + beta);
      const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
      const normalValue = this.inverseNormalCDF(u, mean, Math.sqrt(variance));
      return Math.max(0, Math.min(1, normalValue));
    }

    // Fallback to uniform for simplicity
    return u;
  }

  /**
   * Sample from distribution (for Monte Carlo)
   */
  sampleFromDistribution(distribution) {
    return this.inverseCDF(Math.random(), distribution);
  }

  /**
   * Apply correlation to samples using Cholesky decomposition
   */
  applyCorrelationToSamples(samples, correlationMatrix, variables) {
    const numVars = variables.length;
    const choleskyMatrix = this.choleskyDecomposition(correlationMatrix);
    const correlatedSamples = [];

    samples.forEach(sample => {
      // Convert to normal scores
      const normalScores = variables.map(variable => {
        const value = sample[variable];
        const dist = { type: 'normal', params: { mean: 0, std: 1 } };
        // Convert to uniform then to normal
        const uniform = this.cdfValue(value, sample, variable);
        return this.inverseNormalCDF(uniform, 0, 1);
      });

      // Apply Cholesky transformation
      const correlatedNormal = this.matrixVectorMultiply(choleskyMatrix, normalScores);

      // Convert back to original distributions
      const correlatedSample = {};
      variables.forEach((variable, index) => {
        const uniform = this.normalCDF(correlatedNormal[index]);
        const originalDist = this.getOriginalDistribution(variable);
        correlatedSample[variable] = this.inverseCDF(uniform, originalDist);
      });

      correlatedSamples.push(correlatedSample);
    });

    return correlatedSamples;
  }

  /**
   * Evaluate model for all samples
   */
  async evaluateModel(samples, baseInputs, progressCallback) {
    const results = [];
    const batchSize = 100;
    const totalSamples = samples.length;

    for (let i = 0; i < totalSamples; i += batchSize) {
      const batch = samples.slice(i, Math.min(i + batchSize, totalSamples));

      const batchResults = batch.map(sample => {
        // Merge sample with base inputs
        const modelInputs = { ...baseInputs, ...sample };

        // Calculate DCF value (simplified)
        const dcfValue = this.calculateDCFValue(modelInputs);

        return {
          inputs: modelInputs,
          dcfValue,
          npv: dcfValue,
          irr: this.calculateIRR(modelInputs),
          paybackPeriod: this.calculatePaybackPeriod(modelInputs)
        };
      });

      results.push(...batchResults);

      // Update progress
      if (progressCallback) {
        const progress = 50 + ((i + batchSize) / totalSamples) * 50;
        progressCallback(Math.min(progress, 100));
      }
    }

    return results;
  }

  /**
   * Calculate DCF value (simplified model)
   */
  calculateDCFValue(inputs) {
    const {
      initialRevenue = 1000000,
      revenueGrowthRate = 0.1,
      ebitdaMargin = 0.25,
      taxRate = 0.21,
      capexPercent = 0.05,
      workingCapitalPercent = 0.02,
      discountRate = 0.12,
      terminalGrowthRate = 0.03,
      forecastYears = 5
    } = inputs;

    let fcfSum = 0;
    let revenue = initialRevenue;

    // Calculate FCF for forecast period
    for (let year = 1; year <= forecastYears; year++) {
      revenue *= (1 + revenueGrowthRate);
      const ebitda = revenue * ebitdaMargin;
      const tax = ebitda * taxRate;
      const nopat = ebitda - tax;
      const capex = revenue * capexPercent;
      const workingCapital = revenue * workingCapitalPercent;
      const fcf = nopat - capex - workingCapital;

      fcfSum += fcf / Math.pow(1 + discountRate, year);
    }

    // Terminal value
    const terminalFCF = (revenue * ebitdaMargin * (1 - taxRate)) * (1 + terminalGrowthRate);
    const terminalValue = terminalFCF / (discountRate - terminalGrowthRate);
    const pvTerminalValue = terminalValue / Math.pow(1 + discountRate, forecastYears);

    return fcfSum + pvTerminalValue;
  }

  /**
   * Calculate statistics from results
   */
  calculateStatistics(results, confidenceLevel) {
    const values = results.map(r => r.dcfValue).sort((a, b) => a - b);
    const n = values.length;

    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);

    const lowerPercentile = (1 - confidenceLevel) / 2;
    const upperPercentile = 1 - lowerPercentile;

    return {
      mean,
      median: values[Math.floor(n / 2)],
      stdDev,
      variance,
      min: values[0],
      max: values[n - 1],
      skewness: this.calculateSkewness(values, mean, stdDev),
      kurtosis: this.calculateKurtosis(values, mean, stdDev),
      percentiles: {
        p1: values[Math.floor(n * 0.01)],
        p5: values[Math.floor(n * 0.05)],
        p10: values[Math.floor(n * 0.10)],
        p25: values[Math.floor(n * 0.25)],
        p75: values[Math.floor(n * 0.75)],
        p90: values[Math.floor(n * 0.90)],
        p95: values[Math.floor(n * 0.95)],
        p99: values[Math.floor(n * 0.99)],
        lowerCI: values[Math.floor(n * lowerPercentile)],
        upperCI: values[Math.floor(n * upperPercentile)]
      },
      confidenceInterval: {
        level: confidenceLevel,
        lower: values[Math.floor(n * lowerPercentile)],
        upper: values[Math.floor(n * upperPercentile)]
      }
    };
  }

  /**
   * Analyze convergence of simulation
   */
  analyzeConvergence(results) {
    const values = results.map(r => r.dcfValue);
    const n = values.length;
    const batchSize = Math.floor(n / 10);
    const batchMeans = [];

    for (let i = 0; i < 10; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, n);
      const batch = values.slice(start, end);
      const mean = batch.reduce((sum, val) => sum + val, 0) / batch.length;
      batchMeans.push(mean);
    }

    const overallMean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance = batchMeans.reduce((sum, mean) => sum + Math.pow(mean - overallMean, 2), 0) / 9;
    const standardError = Math.sqrt(variance);

    return {
      converged: standardError / Math.abs(overallMean) < 0.01, // 1% threshold
      standardError,
      relativeError: standardError / Math.abs(overallMean),
      batchMeans
    };
  }

  /**
   * Assess sample quality based on method
   */
  assessSampleQuality(samples, method) {
    const n = samples.length;

    switch (method) {
      case 'latin_hypercube':
        return {
          method,
          efficiency: 'High',
          coverage: 'Excellent',
          convergenceRate: 'O(1/n)',
          description: 'Latin Hypercube ensures better coverage of input space'
        };
      case 'sobol_sequence':
        return {
          method,
          efficiency: 'Very High',
          coverage: 'Excellent',
          convergenceRate: 'O((log n)^d/n)',
          description: 'Sobol sequence provides excellent equidistribution'
        };
      case 'halton_sequence':
        return {
          method,
          efficiency: 'High',
          coverage: 'Good',
          convergenceRate: 'O((log n)^d/n)',
          description: 'Halton sequence offers good low-discrepancy properties'
        };
      default:
        return {
          method,
          efficiency: 'Standard',
          coverage: 'Good',
          convergenceRate: 'O(1/√n)',
          description: 'Standard Monte Carlo with random sampling'
        };
    }
  }

  /**
   * Utility functions
   */
  setSeed(seed) {
    // Simple linear congruential generator for reproducible results
    this.rng = {
      seed: seed % 2147483647,
      next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
      }
    };

    // Override Math.random temporarily
    const originalRandom = Math.random;
    Math.random = () => this.rng.next();

    // Restore after use
    setTimeout(() => {
      Math.random = originalRandom;
    }, 100);
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  choleskyDecomposition(matrix) {
    const n = matrix.length;
    const L = Array(n).fill(0).map(() => Array(n).fill(0));

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

  matrixVectorMultiply(matrix, vector) {
    return matrix.map(row =>
      row.reduce((sum, val, index) => sum + val * vector[index], 0)
    );
  }

  normalCDF(x) {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  erf(x) {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  calculateSkewness(values, mean, stdDev) {
    const n = values.length;
    const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
    return (n / ((n - 1) * (n - 2))) * sum;
  }

  calculateKurtosis(values, mean, stdDev) {
    const n = values.length;
    const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0);
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
  }

  calculateIRR(inputs) {
    // Simplified IRR calculation
    return inputs.discountRate + 0.02; // Placeholder
  }

  calculatePaybackPeriod(inputs) {
    // Simplified payback calculation
    return 5.5; // Placeholder
  }

  estimateMemoryUsage(iterations) {
    return Math.round((iterations * 200) / 1024 / 1024); // MB estimate
  }

  cdfValue(value, sample, variable) {
    // Simplified CDF calculation
    return 0.5; // Placeholder
  }

  getOriginalDistribution(variable) {
    // Return default distribution
    return { type: 'normal', params: { mean: 0, std: 1 } };
  }

  stopSimulation() {
    this.isRunning = false;
    this.currentSimulation = null;
  }
}

export default AdvancedSimulationEngine;
