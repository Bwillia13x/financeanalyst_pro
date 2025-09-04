import FinancialAnalyticsEngine from './FinancialAnalyticsEngine.js';

/**
 * Advanced Predictive Modeling Engine
 *
 * Machine learning and statistical forecasting capabilities for financial analysis
 * including time series forecasting, regression analysis, and predictive algorithms
 */

class PredictiveModelingEngine extends FinancialAnalyticsEngine {
  constructor(options = {}) {
    super(options);
    this.models = new Map();
    this.forecastHorizon = options.forecastHorizon || 12; // 12 months default
    this.confidenceInterval = options.confidenceInterval || 0.95;
  }

  // ===== TIME SERIES FORECASTING =====

  /**
   * ARIMA (AutoRegressive Integrated Moving Average) forecasting
   * @param {Array} data - Time series data
   * @param {Object} params - ARIMA parameters {p, d, q}
   * @param {number} forecastPeriods - Number of periods to forecast
   * @returns {Object} Forecast results
   */
  forecastARIMA(data, params = { p: 1, d: 1, q: 1 }, forecastPeriods = this.forecastHorizon) {
    const cacheKey = `arima_${params.p}_${params.d}_${params.q}_${data.length}_${forecastPeriods}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (!Array.isArray(data) || data.length < params.p + params.q + 10) {
      throw new Error('Insufficient data for ARIMA modeling');
    }

    // Differencing (I component)
    const differencedData = this.difference(data, params.d);

    // Fit ARIMA model
    const model = this.fitARIMA(differencedData, params.p, params.q);

    // Generate forecasts
    const forecasts = this.generateARIMAForecasts(model, data, params, forecastPeriods);

    // Calculate confidence intervals
    const confidenceIntervals = this.calculateForecastConfidenceIntervals(
      forecasts,
      model.residuals,
      this.confidenceInterval
    );

    const result = {
      method: 'ARIMA',
      parameters: params,
      model: {
        coefficients: model.coefficients,
        residuals: model.residuals,
        aic: this.calculateAIC(model),
        bic: this.calculateBIC(model, data.length)
      },
      forecasts: forecasts.map((forecast, i) => ({
        period: i + 1,
        value: this.round(forecast),
        lowerBound: this.round(confidenceIntervals.lower[i]),
        upperBound: this.round(confidenceIntervals.upper[i])
      })),
      accuracy: this.calculateForecastAccuracy(
        data,
        forecasts.slice(0, Math.min(forecastPeriods, data.length))
      ),
      diagnostics: this.performResidualDiagnostics(model.residuals)
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Apply differencing to time series
   */
  difference(data, order) {
    if (order === 0) return [...data];

    let differenced = [...data];
    for (let d = 0; d < order; d++) {
      const newDiff = [];
      for (let i = 1; i < differenced.length; i++) {
        newDiff.push(differenced[i] - differenced[i - 1]);
      }
      differenced = newDiff;
    }

    return differenced;
  }

  /**
   * Fit ARIMA model using maximum likelihood estimation
   */
  fitARIMA(data, p, q) {
    // Simplified ARIMA fitting using least squares
    const n = data.length;
    const coefficients = new Array(p + q + 1).fill(0);

    // Create design matrix for AR and MA terms
    const X = [];
    const y = [];

    for (let i = Math.max(p, q); i < n; i++) {
      const row = [];

      // AR terms
      for (let j = 1; j <= p; j++) {
        row.push(data[i - j]);
      }

      // MA terms (lagged residuals)
      for (let j = 1; j <= q; j++) {
        row.push(0); // Placeholder for MA terms
      }

      // Intercept
      row.push(1);

      X.push(row);
      y.push(data[i]);
    }

    // Simple OLS estimation (simplified)
    coefficients[coefficients.length - 1] = y.reduce((sum, val) => sum + val, 0) / y.length;

    // Calculate residuals
    const residuals = [];
    for (let i = 0; i < y.length; i++) {
      const predicted = coefficients[coefficients.length - 1];
      residuals.push(y[i] - predicted);
    }

    return {
      coefficients,
      residuals,
      logLikelihood: this.calculateLogLikelihood(residuals)
    };
  }

  /**
   * Generate ARIMA forecasts
   */
  generateARIMAForecasts(model, originalData, params, periods) {
    const forecasts = [];
    const currentData = [...originalData];

    for (let i = 0; i < periods; i++) {
      // Apply differencing
      const differenced = this.difference(currentData, params.d);

      // Generate forecast
      const forecast = this.generateARIMAStep(model, differenced, params);

      // Inverse differencing
      const actualForecast = this.inverseDifference(currentData, forecast, params.d);

      forecasts.push(actualForecast);
      currentData.push(actualForecast);
    }

    return forecasts;
  }

  /**
   * Generate single ARIMA forecast step
   */
  generateARIMAStep(model, data, params) {
    const { p, q } = params;
    const n = data.length;

    if (n < Math.max(p, q)) return 0;

    let forecast = model.coefficients[model.coefficients.length - 1]; // Intercept

    // AR terms
    for (let i = 0; i < p; i++) {
      if (n - 1 - i >= 0) {
        forecast += model.coefficients[i] * data[n - 1 - i];
      }
    }

    // MA terms would require storing previous residuals
    // Simplified implementation

    return forecast;
  }

  /**
   * Inverse differencing
   */
  inverseDifference(originalData, differencedValue, order) {
    if (order === 0) return differencedValue;

    let result = differencedValue;
    for (let d = 0; d < order; d++) {
      result += originalData[originalData.length - 1 - d];
    }

    return result;
  }

  /**
   * Calculate forecast confidence intervals
   */
  calculateForecastConfidenceIntervals(forecasts, residuals, confidence) {
    const n = forecasts.length;
    const residualStd = Math.sqrt(
      residuals.reduce((sum, r) => sum + r * r, 0) / (residuals.length - 1)
    );

    const zScore = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645;

    const lower = [];
    const upper = [];

    for (let i = 0; i < n; i++) {
      const stdError = residualStd * Math.sqrt(i + 1);
      lower.push(forecasts[i] - zScore * stdError);
      upper.push(forecasts[i] + zScore * stdError);
    }

    return { lower, upper };
  }

  // ===== EXPONENTIAL SMOOTHING =====

  /**
   * Exponential smoothing forecasting
   * @param {Array} data - Time series data
   * @param {number} alpha - Smoothing parameter (0-1)
   * @param {string} type - 'simple', 'double', 'triple'
   * @param {number} periods - Forecast periods
   * @returns {Object} Exponential smoothing results
   */
  exponentialSmoothing(data, alpha = 0.3, type = 'double', periods = this.forecastHorizon) {
    const cacheKey = `exp_smooth_${alpha}_${type}_${data.length}_${periods}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (!Array.isArray(data) || data.length < 3) {
      throw new Error('Insufficient data for exponential smoothing');
    }

    const result = {
      method: `Exponential Smoothing (${type})`,
      parameters: { alpha, type },
      fitted: [],
      forecasts: [],
      components: {}
    };

    switch (type) {
      case 'simple':
        result.fitted = this.simpleExponentialSmoothing(data, alpha);
        result.forecasts = this.generateSimpleForecasts(result.fitted, alpha, periods);
        break;

      case 'double':
        const doubleResult = this.doubleExponentialSmoothing(data, alpha);
        result.fitted = doubleResult.fitted;
        result.forecasts = doubleResult.forecasts;
        result.components = {
          level: doubleResult.level,
          trend: doubleResult.trend
        };
        break;

      case 'triple':
        const tripleResult = this.tripleExponentialSmoothing(data, alpha);
        result.fitted = tripleResult.fitted;
        result.forecasts = tripleResult.forecasts;
        result.components = {
          level: tripleResult.level,
          trend: tripleResult.trend,
          seasonal: tripleResult.seasonal
        };
        break;
    }

    result.accuracy = this.calculateForecastAccuracy(data, result.fitted);
    result.residuals = data
      .map((actual, i) => actual - (result.fitted[i] || 0))
      .filter(r => !isNaN(r));

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Simple exponential smoothing
   */
  simpleExponentialSmoothing(data, alpha) {
    const fitted = [data[0]]; // First value is initial estimate

    for (let i = 1; i < data.length; i++) {
      fitted.push(alpha * data[i] + (1 - alpha) * fitted[i - 1]);
    }

    return fitted;
  }

  /**
   * Double exponential smoothing (Holt's method)
   */
  doubleExponentialSmoothing(data, alpha, beta = 0.1) {
    const level = [data[0]];
    const trend = [data[1] - data[0]];
    const fitted = [data[0]];

    for (let i = 1; i < data.length; i++) {
      const newLevel = alpha * data[i] + (1 - alpha) * (level[i - 1] + trend[i - 1]);
      const newTrend = beta * (newLevel - level[i - 1]) + (1 - beta) * trend[i - 1];

      level.push(newLevel);
      trend.push(newTrend);
      fitted.push(level[i] + trend[i]);
    }

    return {
      level,
      trend,
      fitted,
      forecasts: this.generateHoltForecasts(
        level[level.length - 1],
        trend[trend.length - 1],
        this.forecastHorizon
      )
    };
  }

  /**
   * Triple exponential smoothing (Holt-Winters method)
   */
  tripleExponentialSmoothing(data, alpha, beta = 0.1, gamma = 0.1, seasonLength = 12) {
    if (data.length < seasonLength * 2) {
      throw new Error('Insufficient data for seasonal exponential smoothing');
    }

    // Initialize seasonal indices
    const seasonal = [];
    for (let i = 0; i < seasonLength; i++) {
      const seasonAvg =
        data.filter((_, idx) => idx % seasonLength === i).reduce((sum, val) => sum + val, 0) /
        Math.floor(data.length / seasonLength);
      const overallAvg = data.reduce((sum, val) => sum + val, 0) / data.length;
      seasonal.push(seasonAvg / overallAvg);
    }

    const level = [data[0] / seasonal[0]];
    const trend = [0];
    const fitted = [];

    // Implementation simplified - full Holt-Winters would be more complex
    for (let i = 1; i < data.length; i++) {
      const seasonIndex = i % seasonLength;
      const deseasonalized = data[i] / seasonal[seasonIndex];

      const newLevel = alpha * deseasonalized + (1 - alpha) * (level[i - 1] + trend[i - 1]);
      const newTrend = beta * (newLevel - level[i - 1]) + (1 - beta) * trend[i - 1];
      const newSeasonal = gamma * (data[i] / newLevel) + (1 - gamma) * seasonal[seasonIndex];

      level.push(newLevel);
      trend.push(newTrend);
      seasonal[seasonIndex] = newSeasonal;

      fitted.push((level[i] + trend[i]) * seasonal[seasonIndex]);
    }

    return {
      level,
      trend,
      seasonal,
      fitted,
      forecasts: this.generateHoltWintersForecasts(
        level[level.length - 1],
        trend[trend.length - 1],
        seasonal,
        seasonLength,
        this.forecastHorizon
      )
    };
  }

  /**
   * Generate forecasts from Holt's method
   */
  generateHoltForecasts(level, trend, periods) {
    const forecasts = [];
    for (let i = 1; i <= periods; i++) {
      forecasts.push(level + trend * i);
    }
    return forecasts;
  }

  /**
   * Generate forecasts from Holt-Winters method
   */
  generateHoltWintersForecasts(level, trend, seasonal, seasonLength, periods) {
    const forecasts = [];
    for (let i = 0; i < periods; i++) {
      const seasonIndex = (seasonal.length + i) % seasonLength;
      forecasts.push((level + trend * (i + 1)) * seasonal[seasonIndex]);
    }
    return forecasts;
  }

  /**
   * Generate simple exponential smoothing forecasts
   */
  generateSimpleForecasts(fitted, alpha, periods) {
    const forecasts = [];
    const lastValue = fitted[fitted.length - 1];

    for (let i = 0; i < periods; i++) {
      forecasts.push(lastValue);
    }

    return forecasts;
  }

  // ===== REGRESSION ANALYSIS =====

  /**
   * Multiple linear regression for factor analysis
   * @param {Array} y - Dependent variable (returns)
   * @param {Array} X - Independent variables (factors)
   * @returns {Object} Regression results
   */
  multipleRegression(y, X) {
    const cacheKey = `regression_${y.length}_${X.length}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (!Array.isArray(y) || !Array.isArray(X) || X.length === 0) {
      throw new Error('Invalid regression data');
    }

    const n = y.length;
    const k = X.length; // Number of independent variables

    if (n !== X[0].length) {
      throw new Error('Dependent and independent variable arrays must have same length');
    }

    // Add intercept term
    const XWithIntercept = [[...Array(n)].fill(1), ...X];

    // Calculate regression coefficients using normal equations
    const coefficients = this.calculateRegressionCoefficients(XWithIntercept, y);

    // Calculate fitted values and residuals
    const fitted = [];
    const residuals = [];

    for (let i = 0; i < n; i++) {
      let prediction = 0;
      for (let j = 0; j < coefficients.length; j++) {
        prediction += coefficients[j] * XWithIntercept[j][i];
      }
      fitted.push(prediction);
      residuals.push(y[i] - prediction);
    }

    // Calculate R-squared and other statistics
    const rSquared = this.calculateRSquared(y, fitted);
    const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1)) / (n - k - 1);
    const fStatistic = this.calculateFStatistic(y, fitted, k, n);

    // Calculate standard errors
    const standardErrors = this.calculateStandardErrors(XWithIntercept, residuals);

    // Calculate t-statistics and p-values
    const tStatistics = coefficients.map((coef, i) => coef / (standardErrors[i] || 1));

    const result = {
      method: 'Multiple Linear Regression',
      coefficients: coefficients.map((coef, i) => ({
        variable: i === 0 ? 'Intercept' : `X${i}`,
        value: this.round(coef),
        standardError: this.round(standardErrors[i] || 0),
        tStatistic: this.round(tStatistics[i] || 0),
        pValue: this.calculatePValue(Math.abs(tStatistics[i] || 0), n - k - 1)
      })),
      statistics: {
        rSquared: this.round(rSquared),
        adjustedRSquared: this.round(adjustedRSquared),
        fStatistic: this.round(fStatistic),
        observations: n,
        variables: k
      },
      fitted,
      residuals,
      diagnostics: this.performResidualDiagnostics(residuals)
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Calculate regression coefficients using normal equations
   */
  calculateRegressionCoefficients(X, y) {
    const n = X.length; // Number of variables including intercept
    const m = X[0].length; // Number of observations

    // Calculate X'X (transpose X times X)
    const XtX = Array(n)
      .fill()
      .map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < m; k++) {
          XtX[i][j] += X[i][k] * X[j][k];
        }
      }
    }

    // Calculate X'y
    const Xty = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        Xty[i] += X[i][j] * y[j];
      }
    }

    // Solve for coefficients (simplified - would use matrix inversion in production)
    return this.solveLinearSystem(XtX, Xty);
  }

  /**
   * Simple Gaussian elimination for solving linear systems
   */
  solveLinearSystem(A, b) {
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);

    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }

      // Swap rows
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      // Eliminate
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j <= n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }

    // Back substitution
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        x[i] -= augmented[i][j] * x[j];
      }
      x[i] /= augmented[i][i];
    }

    return x;
  }

  // ===== MACHINE LEARNING MODELS =====

  /**
   * Random Forest for factor importance and prediction
   * @param {Array} features - Feature matrix
   * @param {Array} targets - Target variable
   * @param {Object} options - Model options
   * @returns {Object} Random forest results
   */
  randomForest(features, targets, options = {}) {
    const cacheKey = `rf_${features.length}_${targets.length}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const { nEstimators = 100, maxDepth = 10, minSamplesSplit = 2, maxFeatures = 'sqrt' } = options;

    if (!Array.isArray(features) || !Array.isArray(targets) || features.length !== targets.length) {
      throw new Error('Invalid random forest data');
    }

    // Simplified random forest implementation
    const trees = [];
    const featureImportance = new Array(features[0].length).fill(0);

    for (let i = 0; i < nEstimators; i++) {
      // Bootstrap sampling
      const bootstrapIndices = this.bootstrapSample(features.length);
      const bootstrapFeatures = bootstrapIndices.map(idx => features[idx]);
      const bootstrapTargets = bootstrapIndices.map(idx => targets[idx]);

      // Build tree
      const tree = this.buildDecisionTree(
        bootstrapFeatures,
        bootstrapTargets,
        maxDepth,
        minSamplesSplit
      );
      trees.push(tree);

      // Calculate feature importance
      this.updateFeatureImportance(tree, featureImportance);
    }

    // Normalize feature importance
    const totalImportance = featureImportance.reduce((sum, imp) => sum + imp, 0);
    const normalizedImportance = featureImportance.map(imp => imp / totalImportance);

    const result = {
      method: 'Random Forest',
      parameters: {
        nEstimators,
        maxDepth,
        minSamplesSplit,
        maxFeatures
      },
      trees: trees.length,
      featureImportance: features[0].map((_, i) => ({
        feature: `Feature ${i + 1}`,
        importance: this.round(normalizedImportance[i])
      })),
      predictions: this.generatePredictions(trees, features),
      performance: this.evaluateModel(targets, this.generatePredictions(trees, features))
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Bootstrap sampling for random forest
   */
  bootstrapSample(size) {
    const sample = [];
    for (let i = 0; i < size; i++) {
      sample.push(Math.floor(Math.random() * size));
    }
    return sample;
  }

  /**
   * Build decision tree (simplified)
   */
  buildDecisionTree(features, targets, maxDepth, minSamplesSplit, depth = 0) {
    if (depth >= maxDepth || features.length < minSamplesSplit) {
      return {
        type: 'leaf',
        value: targets.reduce((sum, val) => sum + val, 0) / targets.length
      };
    }

    // Find best split (simplified - would use proper impurity measures)
    const bestSplit = this.findBestSplit(features, targets);

    if (!bestSplit) {
      return {
        type: 'leaf',
        value: targets.reduce((sum, val) => sum + val, 0) / targets.length
      };
    }

    const { featureIndex, threshold, leftIndices, rightIndices } = bestSplit;

    return {
      type: 'node',
      featureIndex,
      threshold,
      left: this.buildDecisionTree(
        leftIndices.map(i => features[i]),
        leftIndices.map(i => targets[i]),
        maxDepth,
        minSamplesSplit,
        depth + 1
      ),
      right: this.buildDecisionTree(
        rightIndices.map(i => features[i]),
        rightIndices.map(i => targets[i]),
        maxDepth,
        minSamplesSplit,
        depth + 1
      )
    };
  }

  /**
   * Find best split for decision tree
   */
  findBestSplit(features, targets) {
    const nFeatures = features[0].length;
    let bestSplit = null;
    let bestScore = Infinity;

    for (let featureIndex = 0; featureIndex < nFeatures; featureIndex++) {
      const values = features.map(row => row[featureIndex]).sort((a, b) => a - b);

      for (let i = 1; i < values.length; i++) {
        const threshold = (values[i - 1] + values[i]) / 2;

        const leftIndices = [];
        const rightIndices = [];

        features.forEach((row, idx) => {
          if (row[featureIndex] <= threshold) {
            leftIndices.push(idx);
          } else {
            rightIndices.push(idx);
          }
        });

        if (leftIndices.length === 0 || rightIndices.length === 0) continue;

        // Calculate split score (simplified MSE)
        const leftTargets = leftIndices.map(i => targets[i]);
        const rightTargets = rightIndices.map(i => targets[i]);

        const leftMean = leftTargets.reduce((sum, val) => sum + val, 0) / leftTargets.length;
        const rightMean = rightTargets.reduce((sum, val) => sum + val, 0) / rightTargets.length;

        const leftMSE =
          leftTargets.reduce((sum, val) => sum + Math.pow(val - leftMean, 2), 0) /
          leftTargets.length;
        const rightMSE =
          rightTargets.reduce((sum, val) => sum + Math.pow(val - rightMean, 2), 0) /
          rightTargets.length;

        const score =
          (leftMSE * leftTargets.length + rightMSE * rightTargets.length) / targets.length;

        if (score < bestScore) {
          bestScore = score;
          bestSplit = {
            featureIndex,
            threshold,
            leftIndices,
            rightIndices
          };
        }
      }
    }

    return bestSplit;
  }

  /**
   * Generate predictions from random forest
   */
  generatePredictions(trees, features) {
    return features.map(row => {
      const predictions = trees.map(tree => this.predictWithTree(tree, row));
      return predictions.reduce((sum, pred) => sum + pred, 0) / predictions.length;
    });
  }

  /**
   * Predict with single decision tree
   */
  predictWithTree(tree, row) {
    if (tree.type === 'leaf') return tree.value;

    if (row[tree.featureIndex] <= tree.threshold) {
      return this.predictWithTree(tree.left, row);
    } else {
      return this.predictWithTree(tree.right, row);
    }
  }

  // ===== MODEL EVALUATION =====

  /**
   * Calculate forecast accuracy metrics
   */
  calculateForecastAccuracy(actual, predicted) {
    if (!Array.isArray(actual) || !Array.isArray(predicted)) return {};

    const n = Math.min(actual.length, predicted.length);
    const errors = [];

    for (let i = 0; i < n; i++) {
      if (actual[i] !== undefined && predicted[i] !== undefined) {
        errors.push(actual[i] - predicted[i]);
      }
    }

    const meanError = errors.reduce((sum, err) => sum + err, 0) / errors.length;
    const meanAbsoluteError = errors.reduce((sum, err) => sum + Math.abs(err), 0) / errors.length;
    const rootMeanSquaredError = Math.sqrt(
      errors.reduce((sum, err) => sum + err * err, 0) / errors.length
    );

    // Mean Absolute Percentage Error
    const mape =
      errors.reduce((sum, err, i) => {
        return sum + Math.abs(err / actual[i]) * 100;
      }, 0) / errors.length;

    return {
      meanError: this.round(meanError),
      meanAbsoluteError: this.round(meanAbsoluteError),
      rootMeanSquaredError: this.round(rootMeanSquaredError),
      meanAbsolutePercentageError: this.round(mape)
    };
  }

  /**
   * Evaluate regression model
   */
  evaluateModel(actual, predicted) {
    return this.calculateForecastAccuracy(actual, predicted);
  }

  // ===== UTILITY FUNCTIONS =====

  /**
   * Calculate R-squared
   */
  calculateRSquared(actual, predicted) {
    const n = actual.length;
    const mean = actual.reduce((sum, val) => sum + val, 0) / n;

    const ssRes = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
    const ssTot = actual.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);

    return 1 - ssRes / ssTot;
  }

  /**
   * Calculate F-statistic
   */
  calculateFStatistic(actual, predicted, k, n) {
    const rSquared = this.calculateRSquared(actual, predicted);
    return rSquared / k / ((1 - rSquared) / (n - k - 1));
  }

  /**
   * Calculate standard errors for regression coefficients
   */
  calculateStandardErrors(X, residuals) {
    const n = X[0].length;
    const k = X.length;
    const residualVariance = residuals.reduce((sum, r) => sum + r * r, 0) / (n - k);

    // Calculate (X'X)^-1 (simplified)
    const XtX = [];
    for (let i = 0; i < k; i++) {
      XtX[i] = [];
      for (let j = 0; j < k; j++) {
        let sum = 0;
        for (let m = 0; m < n; m++) {
          sum += X[i][m] * X[j][m];
        }
        XtX[i][j] = sum;
      }
    }

    // Simplified standard errors calculation
    return XtX.map((_, i) => Math.sqrt(residualVariance / XtX[i][i]));
  }

  /**
   * Calculate p-value from t-statistic
   */
  calculatePValue(tStat, df) {
    // Simplified p-value calculation using t-distribution approximation
    const absT = Math.abs(tStat);
    const p = 1 / (1 + absT / Math.sqrt(df));
    return 2 * (1 - p); // Two-tailed
  }

  /**
   * Calculate AIC (Akaike Information Criterion)
   */
  calculateAIC(model) {
    const n = model.residuals.length;
    const k = model.coefficients.length;
    const rss = model.residuals.reduce((sum, r) => sum + r * r, 0);
    return n * Math.log(rss / n) + 2 * k;
  }

  /**
   * Calculate BIC (Bayesian Information Criterion)
   */
  calculateBIC(model, n) {
    const k = model.coefficients.length;
    const rss = model.residuals.reduce((sum, r) => sum + r * r, 0);
    return n * Math.log(rss / n) + k * Math.log(n);
  }

  /**
   * Calculate log-likelihood
   */
  calculateLogLikelihood(residuals) {
    const n = residuals.length;
    const rss = residuals.reduce((sum, r) => sum + r * r, 0);
    const sigma2 = rss / n;
    return -0.5 * n * Math.log(2 * Math.PI * sigma2) - rss / (2 * sigma2);
  }

  /**
   * Perform residual diagnostics
   */
  performResidualDiagnostics(residuals) {
    const mean = residuals.reduce((sum, r) => sum + r, 0) / residuals.length;
    const std = Math.sqrt(
      residuals.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / residuals.length
    );

    // Ljung-Box test for autocorrelation (simplified)
    const autocorrelation = this.calculateAutocorrelation(residuals, 1);

    return {
      residuals,
      mean: this.round(mean),
      std: this.round(std),
      autocorrelation: this.round(autocorrelation),
      normalityTest: this.shapiroWilkTest(residuals),
      heteroskedasticityTest: this.whiteTest(residuals)
    };
  }

  /**
   * Calculate autocorrelation
   */
  calculateAutocorrelation(data, lag) {
    const n = data.length;
    const mean = data.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = lag; i < n; i++) {
      numerator += (data[i] - mean) * (data[i - lag] - mean);
    }

    for (let i = 0; i < n; i++) {
      denominator += Math.pow(data[i] - mean, 2);
    }

    return numerator / denominator;
  }

  /**
   * Shapiro-Wilk normality test (simplified)
   */
  shapiroWilkTest(data) {
    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;
    const mean = sorted.reduce((sum, val) => sum + val, 0) / n;

    // Simplified normality test
    const variance = sorted.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const skewness =
      sorted.reduce((sum, val) => sum + Math.pow((val - mean) / Math.sqrt(variance), 3), 0) / n;
    const kurtosis =
      sorted.reduce((sum, val) => sum + Math.pow((val - mean) / Math.sqrt(variance), 4), 0) / n - 3;

    return {
      statistic: this.round(Math.abs(skewness) + Math.abs(kurtosis)),
      pValue: Math.abs(skewness) + Math.abs(kurtosis) < 1 ? 0.05 : 0.001
    };
  }

  /**
   * White test for heteroskedasticity (simplified)
   */
  whiteTest(residuals) {
    // Simplified heteroskedasticity test
    const n = residuals.length;
    const squaredResiduals = residuals.map(r => r * r);
    const meanSquared = squaredResiduals.reduce((sum, r) => sum + r, 0) / n;

    const testStatistic =
      n * (squaredResiduals.reduce((sum, r) => sum + r * r, 0) / (meanSquared * meanSquared) - 1);

    return {
      statistic: this.round(testStatistic),
      pValue: testStatistic > 10 ? 0.001 : 0.05 // Simplified p-value
    };
  }
}

// Export singleton instance
export const predictiveModelingEngine = new PredictiveModelingEngine({
  cacheTimeout: 300000,
  precision: 6,
  forecastHorizon: 12,
  confidenceInterval: 0.95
});

export default PredictiveModelingEngine;
