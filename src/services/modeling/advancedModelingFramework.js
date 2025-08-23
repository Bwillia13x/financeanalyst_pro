/**
 * Advanced Modeling Framework
 * Monte Carlo Simulations, Optimization Algorithms, and Scenario Planning
 */

import { EventEmitter } from 'events';

class AdvancedModelingFramework extends EventEmitter {
  constructor() {
    super();
    this.monteCarlo = new MonteCarloEngine();
    this.optimizer = new OptimizationEngine();
    this.scenarioPlanner = new ScenarioPlanningEngine();
    this.sensitivity = new SensitivityAnalyzer();
  }

  // Monte Carlo Analysis
  async runMonteCarloSimulation(model, parameters, options = {}) {
    const { 
      iterations = 10000,
      confidenceLevels = [0.05, 0.25, 0.5, 0.75, 0.95],
      correlations = null,
      seed = null
    } = options;

    this.emit('simulation:start', { model: model.name, iterations });
    
    const results = await this.monteCarlo.simulate(model, parameters, {
      iterations,
      confidenceLevels,
      correlations,
      seed
    });

    this.emit('simulation:complete', { model: model.name, results });
    return results;
  }

  // Portfolio Optimization
  async optimizePortfolio(assets, constraints, objective = 'sharpe') {
    this.emit('optimization:start', { assets: assets.length, objective });
    
    const result = await this.optimizer.optimizePortfolio(assets, constraints, objective);
    
    this.emit('optimization:complete', { objective, result });
    return result;
  }

  // Scenario Planning
  async createScenarioAnalysis(baseCase, scenarios, weights = null) {
    this.emit('scenario:start', { scenarios: scenarios.length });
    
    const analysis = await this.scenarioPlanner.analyze(baseCase, scenarios, weights);
    
    this.emit('scenario:complete', { analysis });
    return analysis;
  }

  // Sensitivity Analysis
  async analyzeSensitivity(model, variables, ranges) {
    this.emit('sensitivity:start', { variables: variables.length });
    
    const analysis = await this.sensitivity.analyze(model, variables, ranges);
    
    this.emit('sensitivity:complete', { analysis });
    return analysis;
  }
}

/**
 * Monte Carlo Simulation Engine
 */
class MonteCarloEngine {
  constructor() {
    this.distributions = new DistributionLibrary();
  }

  async simulate(model, parameters, options) {
    const { iterations, confidenceLevels, correlations, seed } = options;
    
    if (seed) {
      this.seedRandom(seed);
    }

    const samples = this.generateSamples(parameters, iterations, correlations);
    const results = this.runModel(model, samples);
    
    return this.analyzeResults(results, confidenceLevels);
  }

  generateSamples(parameters, iterations, correlations) {
    const samples = {};
    
    // Generate independent samples first
    for (const [param, config] of Object.entries(parameters)) {
      samples[param] = this.distributions.sample(config.distribution, config.params, iterations);
    }

    // Apply correlations if specified
    if (correlations) {
      samples = this.applyCorrelations(samples, correlations);
    }

    return samples;
  }

  runModel(model, samples) {
    const results = [];
    const iterations = samples[Object.keys(samples)[0]].length;

    for (let i = 0; i < iterations; i++) {
      const inputs = {};
      for (const param of Object.keys(samples)) {
        inputs[param] = samples[param][i];
      }
      
      const output = model.calculate(inputs);
      results.push(output);
    }

    return results;
  }

  analyzeResults(results, confidenceLevels) {
    const sortedResults = [...results].sort((a, b) => a - b);
    const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
    const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length;
    const stdDev = Math.sqrt(variance);

    const percentiles = {};
    confidenceLevels.forEach(level => {
      const index = Math.floor(level * results.length);
      percentiles[`P${Math.round(level * 100)}`] = sortedResults[index];
    });

    return {
      summary: {
        mean,
        median: sortedResults[Math.floor(results.length / 2)],
        stdDev,
        min: Math.min(...results),
        max: Math.max(...results),
        skewness: this.calculateSkewness(results, mean, stdDev),
        kurtosis: this.calculateKurtosis(results, mean, stdDev)
      },
      percentiles,
      distribution: this.createHistogram(results),
      rawResults: results
    };
  }

  applyCorrelations(samples, correlationMatrix) {
    // Cholesky decomposition for correlated random variables
    const variables = Object.keys(samples);
    const L = this.choleskyDecomposition(correlationMatrix);
    
    const correlatedSamples = {};
    variables.forEach(variable => {
      correlatedSamples[variable] = [...samples[variable]];
    });

    for (let i = 0; i < samples[variables[0]].length; i++) {
      const uncorrelated = variables.map(v => samples[v][i]);
      const correlated = this.multiplyMatrixVector(L, uncorrelated);
      
      variables.forEach((variable, index) => {
        correlatedSamples[variable][i] = correlated[index];
      });
    }

    return correlatedSamples;
  }

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

  multiplyMatrixVector(matrix, vector) {
    return matrix.map(row => 
      row.reduce((sum, val, index) => sum + val * vector[index], 0)
    );
  }

  calculateSkewness(data, mean, stdDev) {
    const n = data.length;
    const sum = data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
    return (n / ((n - 1) * (n - 2))) * sum;
  }

  calculateKurtosis(data, mean, stdDev) {
    const n = data.length;
    const sum = data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0);
    return (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
  }

  createHistogram(data, bins = 50) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins;
    
    const histogram = Array(bins).fill(0);
    
    data.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      histogram[binIndex]++;
    });

    return histogram.map((count, index) => ({
      x: min + (index + 0.5) * binWidth,
      y: count / data.length
    }));
  }

  seedRandom(seed) {
    // Simple seeded random number generator
    let m = 0x80000000;
    let a = 1103515245;
    let c = 12345;
    let state = seed;
    
    Math.random = function() {
      state = (a * state + c) % m;
      return state / (m - 1);
    };
  }
}

/**
 * Distribution Library
 */
class DistributionLibrary {
  sample(distribution, params, count) {
    const samples = [];
    
    for (let i = 0; i < count; i++) {
      samples.push(this[distribution](params));
    }
    
    return samples;
  }

  normal(params) {
    const { mean = 0, stdDev = 1 } = params;
    
    // Box-Muller transformation
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    return mean + z0 * stdDev;
  }

  lognormal(params) {
    const { mu = 0, sigma = 1 } = params;
    return Math.exp(this.normal({ mean: mu, stdDev: sigma }));
  }

  triangular(params) {
    const { min, max, mode } = params;
    const u = Math.random();
    
    if (u < (mode - min) / (max - min)) {
      return min + Math.sqrt(u * (max - min) * (mode - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
  }

  uniform(params) {
    const { min = 0, max = 1 } = params;
    return min + Math.random() * (max - min);
  }

  exponential(params) {
    const { lambda = 1 } = params;
    return -Math.log(Math.random()) / lambda;
  }

  beta(params) {
    const { alpha, beta } = params;
    
    // Using gamma distribution approximation
    const x = this.gamma({ shape: alpha, scale: 1 });
    const y = this.gamma({ shape: beta, scale: 1 });
    
    return x / (x + y);
  }

  gamma(params) {
    const { shape, scale = 1 } = params;
    
    // Marsaglia and Tsang method
    if (shape < 1) {
      return this.gamma({ shape: shape + 1, scale }) * Math.pow(Math.random(), 1 / shape);
    }
    
    const d = shape - 1/3;
    const c = 1 / Math.sqrt(9 * d);
    
    let v, x;
    do {
      do {
        x = this.normal({ mean: 0, stdDev: 1 });
        v = 1 + c * x;
      } while (v <= 0);
      
      v = v * v * v;
      const u = Math.random();
      
      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v * scale;
      }
      
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    } while (true);
  }
}

/**
 * Optimization Engine
 */
class OptimizationEngine {
  constructor() {
    this.tolerance = 1e-8;
    this.maxIterations = 1000;
  }

  async optimizePortfolio(assets, constraints, objective) {
    const n = assets.length;
    
    // Extract expected returns and covariance matrix
    const expectedReturns = assets.map(asset => asset.expectedReturn);
    const covarianceMatrix = this.buildCovarianceMatrix(assets);
    
    const result = await this.solveOptimization({
      expectedReturns,
      covarianceMatrix,
      constraints,
      objective,
      n
    });

    return {
      weights: result.weights,
      expectedReturn: this.calculatePortfolioReturn(result.weights, expectedReturns),
      volatility: this.calculatePortfolioVolatility(result.weights, covarianceMatrix),
      sharpeRatio: result.sharpeRatio,
      metrics: result.metrics,
      constraints: constraints,
      objective
    };
  }

  async solveOptimization(params) {
    const { expectedReturns, covarianceMatrix, constraints, objective, n } = params;
    
    switch (objective) {
      case 'sharpe':
        return this.maximizeSharpe(expectedReturns, covarianceMatrix, constraints);
      case 'return':
        return this.maximizeReturn(expectedReturns, covarianceMatrix, constraints);
      case 'volatility':
        return this.minimizeVolatility(expectedReturns, covarianceMatrix, constraints);
      case 'var':
        return this.minimizeVaR(expectedReturns, covarianceMatrix, constraints);
      default:
        throw new Error(`Unknown objective: ${objective}`);
    }
  }

  maximizeSharpe(returns, covariance, constraints) {
    // Convert to quadratic programming problem
    // Maximize: w^T * μ / sqrt(w^T * Σ * w)
    
    const riskFreeRate = constraints.riskFreeRate || 0.02;
    const excessReturns = returns.map(r => r - riskFreeRate);
    
    // Use iterative approach for non-linear Sharpe ratio optimization
    let bestWeights = null;
    let bestSharpe = -Infinity;
    
    for (let i = 0; i < this.maxIterations; i++) {
      const weights = this.generateFeasibleWeights(returns.length, constraints);
      const portfolioReturn = this.calculatePortfolioReturn(weights, returns);
      const portfolioVol = this.calculatePortfolioVolatility(weights, covariance);
      const sharpe = (portfolioReturn - riskFreeRate) / portfolioVol;
      
      if (sharpe > bestSharpe) {
        bestSharpe = sharpe;
        bestWeights = [...weights];
      }
    }

    return {
      weights: bestWeights,
      sharpeRatio: bestSharpe,
      metrics: this.calculateMetrics(bestWeights, returns, covariance)
    };
  }

  minimizeVolatility(returns, covariance, constraints) {
    // Quadratic programming: minimize w^T * Σ * w subject to constraints
    const n = returns.length;
    let bestWeights = null;
    let bestVolatility = Infinity;
    
    for (let i = 0; i < this.maxIterations; i++) {
      const weights = this.generateFeasibleWeights(n, constraints);
      const volatility = this.calculatePortfolioVolatility(weights, covariance);
      
      if (volatility < bestVolatility) {
        bestVolatility = volatility;
        bestWeights = [...weights];
      }
    }

    return {
      weights: bestWeights,
      volatility: bestVolatility,
      metrics: this.calculateMetrics(bestWeights, returns, covariance)
    };
  }

  generateFeasibleWeights(n, constraints) {
    const weights = Array(n).fill().map(() => Math.random());
    const sum = weights.reduce((a, b) => a + b, 0);
    
    // Normalize to sum to 1
    const normalizedWeights = weights.map(w => w / sum);
    
    // Apply constraints
    return this.applyConstraints(normalizedWeights, constraints);
  }

  applyConstraints(weights, constraints) {
    const { 
      minWeight = 0,
      maxWeight = 1,
      maxSectorExposure = {},
      turnoverLimit = null
    } = constraints;

    // Apply min/max weight constraints
    const constrainedWeights = weights.map(w => 
      Math.max(minWeight, Math.min(maxWeight, w))
    );

    // Renormalize
    const sum = constrainedWeights.reduce((a, b) => a + b, 0);
    return constrainedWeights.map(w => w / sum);
  }

  buildCovarianceMatrix(assets) {
    const n = assets.length;
    const matrix = Array(n).fill().map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = Math.pow(assets[i].volatility, 2);
        } else {
          const correlation = assets[i].correlations?.[assets[j].symbol] || 0;
          matrix[i][j] = correlation * assets[i].volatility * assets[j].volatility;
        }
      }
    }
    
    return matrix;
  }

  calculatePortfolioReturn(weights, returns) {
    return weights.reduce((sum, weight, index) => sum + weight * returns[index], 0);
  }

  calculatePortfolioVolatility(weights, covariance) {
    let variance = 0;
    
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        variance += weights[i] * weights[j] * covariance[i][j];
      }
    }
    
    return Math.sqrt(variance);
  }

  calculateMetrics(weights, returns, covariance) {
    const portfolioReturn = this.calculatePortfolioReturn(weights, returns);
    const portfolioVol = this.calculatePortfolioVolatility(weights, covariance);
    
    return {
      expectedReturn: portfolioReturn,
      volatility: portfolioVol,
      sharpeRatio: portfolioReturn / portfolioVol,
      diversificationRatio: this.calculateDiversificationRatio(weights, covariance),
      maxDrawdown: this.estimateMaxDrawdown(portfolioReturn, portfolioVol),
      beta: this.calculateBeta(weights, returns, covariance)
    };
  }

  calculateDiversificationRatio(weights, covariance) {
    const weightedAvgVol = weights.reduce((sum, weight, index) => 
      sum + weight * Math.sqrt(covariance[index][index]), 0);
    const portfolioVol = this.calculatePortfolioVolatility(weights, covariance);
    
    return weightedAvgVol / portfolioVol;
  }

  estimateMaxDrawdown(expectedReturn, volatility) {
    // Simplified estimate based on normal distribution
    return -2.326 * volatility; // 99% confidence level
  }

  calculateBeta(weights, returns, covariance) {
    // Assuming market return is average of all assets
    const marketReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const portfolioReturn = this.calculatePortfolioReturn(weights, returns);
    
    // Simplified beta calculation
    return portfolioReturn / marketReturn;
  }
}

/**
 * Scenario Planning Engine
 */
class ScenarioPlanningEngine {
  async analyze(baseCase, scenarios, weights = null) {
    const defaultWeights = weights || scenarios.map(() => 1 / scenarios.length);
    
    const results = {
      baseCase: this.evaluateScenario(baseCase),
      scenarios: scenarios.map((scenario, index) => ({
        ...this.evaluateScenario(scenario),
        weight: defaultWeights[index],
        name: scenario.name || `Scenario ${index + 1}`
      })),
      weightedAverage: this.calculateWeightedAverage(scenarios, defaultWeights),
      riskMetrics: this.calculateRiskMetrics(scenarios, defaultWeights),
      sensitivityAnalysis: this.performSensitivityAnalysis(scenarios)
    };

    return results;
  }

  evaluateScenario(scenario) {
    const { inputs, model } = scenario;
    
    return {
      inputs,
      outputs: model.calculate(inputs),
      probability: scenario.probability || null,
      description: scenario.description || null
    };
  }

  calculateWeightedAverage(scenarios, weights) {
    const outputKeys = Object.keys(scenarios[0].outputs || {});
    const weightedOutputs = {};

    outputKeys.forEach(key => {
      weightedOutputs[key] = scenarios.reduce((sum, scenario, index) => 
        sum + (scenario.outputs[key] * weights[index]), 0);
    });

    return {
      outputs: weightedOutputs,
      weights: weights
    };
  }

  calculateRiskMetrics(scenarios, weights) {
    const values = scenarios.map(s => s.outputs.value || 0);
    const mean = values.reduce((sum, val, index) => sum + val * weights[index], 0);
    const variance = values.reduce((sum, val, index) => 
      sum + weights[index] * Math.pow(val - mean, 2), 0);
    
    return {
      expectedValue: mean,
      variance: variance,
      standardDeviation: Math.sqrt(variance),
      worstCase: Math.min(...values),
      bestCase: Math.max(...values),
      range: Math.max(...values) - Math.min(...values)
    };
  }

  performSensitivityAnalysis(scenarios) {
    const inputKeys = Object.keys(scenarios[0].inputs || {});
    const sensitivity = {};

    inputKeys.forEach(key => {
      const inputValues = scenarios.map(s => s.inputs[key]);
      const outputValues = scenarios.map(s => s.outputs.value || 0);
      
      sensitivity[key] = this.calculateCorrelation(inputValues, outputValues);
    });

    return sensitivity;
  }

  calculateCorrelation(x, y) {
    const n = x.length;
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const deltaX = x[i] - meanX;
      const deltaY = y[i] - meanY;
      
      numerator += deltaX * deltaY;
      denomX += deltaX * deltaX;
      denomY += deltaY * deltaY;
    }
    
    return numerator / Math.sqrt(denomX * denomY);
  }
}

/**
 * Sensitivity Analyzer
 */
class SensitivityAnalyzer {
  async analyze(model, variables, ranges) {
    const results = {
      singleVariable: await this.singleVariableAnalysis(model, variables, ranges),
      multiVariable: await this.multiVariableAnalysis(model, variables, ranges),
      tornadoDiagram: await this.createTornadoDiagram(model, variables, ranges)
    };

    return results;
  }

  async singleVariableAnalysis(model, variables, ranges) {
    const results = {};

    for (const variable of variables) {
      const range = ranges[variable];
      const steps = range.steps || 20;
      const min = range.min;
      const max = range.max;
      const stepSize = (max - min) / (steps - 1);

      const analysis = [];
      for (let i = 0; i < steps; i++) {
        const value = min + i * stepSize;
        const inputs = { ...model.baseInputs, [variable]: value };
        const output = model.calculate(inputs);
        
        analysis.push({
          input: value,
          output: output.value || output,
          change: ((output.value || output) - model.baseOutput) / model.baseOutput
        });
      }

      results[variable] = analysis;
    }

    return results;
  }

  async multiVariableAnalysis(model, variables, ranges) {
    // Two-variable sensitivity analysis
    const results = {};

    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const var1 = variables[i];
        const var2 = variables[j];
        const key = `${var1}_vs_${var2}`;

        results[key] = await this.twoVariableAnalysis(model, var1, var2, ranges);
      }
    }

    return results;
  }

  async twoVariableAnalysis(model, variable1, variable2, ranges) {
    const range1 = ranges[variable1];
    const range2 = ranges[variable2];
    const steps1 = range1.steps || 10;
    const steps2 = range2.steps || 10;

    const results = [];
    
    for (let i = 0; i < steps1; i++) {
      const value1 = range1.min + i * (range1.max - range1.min) / (steps1 - 1);
      
      for (let j = 0; j < steps2; j++) {
        const value2 = range2.min + j * (range2.max - range2.min) / (steps2 - 1);
        
        const inputs = { 
          ...model.baseInputs, 
          [variable1]: value1, 
          [variable2]: value2 
        };
        const output = model.calculate(inputs);

        results.push({
          [variable1]: value1,
          [variable2]: value2,
          output: output.value || output,
          change: ((output.value || output) - model.baseOutput) / model.baseOutput
        });
      }
    }

    return results;
  }

  async createTornadoDiagram(model, variables, ranges) {
    const sensitivities = [];

    for (const variable of variables) {
      const range = ranges[variable];
      
      // Calculate output at min and max values
      const inputsMin = { ...model.baseInputs, [variable]: range.min };
      const inputsMax = { ...model.baseInputs, [variable]: range.max };
      
      const outputMin = model.calculate(inputsMin);
      const outputMax = model.calculate(inputsMax);
      
      const impact = Math.abs((outputMax.value || outputMax) - (outputMin.value || outputMin));
      
      sensitivities.push({
        variable,
        impact,
        minOutput: outputMin.value || outputMin,
        maxOutput: outputMax.value || outputMax,
        range: range.max - range.min
      });
    }

    // Sort by impact (descending)
    return sensitivities.sort((a, b) => b.impact - a.impact);
  }
}

export default AdvancedModelingFramework;
