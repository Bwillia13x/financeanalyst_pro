import FinancialAnalyticsEngine from './FinancialAnalyticsEngine.js';

/**
 * Advanced Statistical Analysis Engine
 *
 * Comprehensive statistical testing and analysis tools for financial data
 * including hypothesis testing, distribution analysis, and time series statistics
 */

class StatisticalAnalysisEngine extends FinancialAnalyticsEngine {
  constructor(options = {}) {
    super(options);
    this.significanceLevel = options.significanceLevel || 0.05;
    this.distributionTests = {
      NORMALITY: 'normality',
      HOMOSCEDASTICITY: 'homoscedasticity',
      AUTOCORRELATION: 'autocorrelation',
      STATIONARITY: 'stationarity'
    };
  }

  // ===== HYPOTHESIS TESTING =====

  /**
   * One-sample t-test
   * @param {Array} data - Sample data
   * @param {number} mu - Hypothesized population mean
   * @returns {Object} T-test results
   */
  oneSampleTTest(data, mu = 0) {
    const cacheKey = `t_test_${data.length}_${mu}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Insufficient data for t-test');
    }

    const n = data.length;
    const sampleMean = data.reduce((sum, val) => sum + val, 0) / n;
    const sampleVariance =
      data.reduce((sum, val) => sum + Math.pow(val - sampleMean, 2), 0) / (n - 1);
    const sampleStd = Math.sqrt(sampleVariance);

    const tStatistic = sampleStd !== 0 ? (sampleMean - mu) / (sampleStd / Math.sqrt(n)) : 0;
    const degreesOfFreedom = n - 1;
    const pValue = this.calculatePValue(Math.abs(tStatistic), degreesOfFreedom);

    const confidenceInterval = this.calculateConfidenceInterval(
      sampleMean,
      sampleStd,
      n,
      this.confidenceLevel
    );

    const result = {
      test: 'One-sample t-test',
      nullHypothesis: `Population mean = ${mu}`,
      alternativeHypothesis: `Population mean ≠ ${mu}`,
      sampleSize: n,
      sampleMean: this.round(sampleMean),
      sampleStd: this.round(sampleStd),
      hypothesizedMean: mu,
      tStatistic: this.round(tStatistic),
      degreesOfFreedom,
      pValue: this.round(pValue),
      confidenceLevel: this.confidenceLevel,
      confidenceInterval: {
        lower: this.round(confidenceInterval.lower),
        upper: this.round(confidenceInterval.upper)
      },
      rejectNull: pValue < this.significanceLevel,
      significance: this.significanceLevel
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Two-sample t-test
   * @param {Array} sample1 - First sample
   * @param {Array} sample2 - Second sample
   * @param {boolean} equalVariance - Assume equal variance
   * @returns {Object} Two-sample t-test results
   */
  twoSampleTTest(sample1, sample2, equalVariance = false) {
    const cacheKey = `two_t_test_${sample1.length}_${sample2.length}_${equalVariance}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (
      !Array.isArray(sample1) ||
      !Array.isArray(sample2) ||
      sample1.length < 2 ||
      sample2.length < 2
    ) {
      throw new Error('Insufficient data for two-sample t-test');
    }

    const n1 = sample1.length;
    const n2 = sample2.length;
    const mean1 = sample1.reduce((sum, val) => sum + val, 0) / n1;
    const mean2 = sample2.reduce((sum, val) => sum + val, 0) / n2;

    const var1 = sample1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (n1 - 1);
    const var2 = sample2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (n2 - 1);

    let tStatistic, degreesOfFreedom, pooledVariance;

    if (equalVariance) {
      // Pooled variance t-test
      pooledVariance = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
      const stdError = Math.sqrt(pooledVariance * (1 / n1 + 1 / n2));
      tStatistic = stdError !== 0 ? (mean1 - mean2) / stdError : 0;
      degreesOfFreedom = n1 + n2 - 2;
    } else {
      // Welch's t-test (unequal variance)
      const stdError = Math.sqrt(var1 / n1 + var2 / n2);
      tStatistic = stdError !== 0 ? (mean1 - mean2) / stdError : 0;
      degreesOfFreedom =
        Math.pow(var1 / n1 + var2 / n2, 2) /
        (Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1));
    }

    const pValue = this.calculatePValue(Math.abs(tStatistic), degreesOfFreedom);

    const result = {
      test: equalVariance
        ? 'Two-sample t-test (equal variance)'
        : "Two-sample t-test (Welch's unequal variance)",
      nullHypothesis: 'Population means are equal',
      alternativeHypothesis: 'Population means are different',
      sample1: {
        size: n1,
        mean: this.round(mean1),
        variance: this.round(var1),
        std: this.round(Math.sqrt(var1))
      },
      sample2: {
        size: n2,
        mean: this.round(mean2),
        variance: this.round(var2),
        std: this.round(Math.sqrt(var2))
      },
      difference: this.round(mean1 - mean2),
      tStatistic: this.round(tStatistic),
      degreesOfFreedom: Math.floor(degreesOfFreedom),
      pValue: this.round(pValue),
      rejectNull: pValue < this.significanceLevel,
      significance: this.significanceLevel,
      equalVariance
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * F-test for equality of variances
   * @param {Array} sample1 - First sample
   * @param {Array} sample2 - Second sample
   * @returns {Object} F-test results
   */
  fTest(sample1, sample2) {
    const cacheKey = `f_test_${sample1.length}_${sample2.length}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (
      !Array.isArray(sample1) ||
      !Array.isArray(sample2) ||
      sample1.length < 2 ||
      sample2.length < 2
    ) {
      throw new Error('Insufficient data for F-test');
    }

    const n1 = sample1.length;
    const n2 = sample2.length;
    const var1 =
      sample1.reduce((sum, val, _, arr) => {
        const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
        return sum + Math.pow(val - mean, 2);
      }, 0) /
      (n1 - 1);

    const var2 =
      sample2.reduce((sum, val, _, arr) => {
        const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
        return sum + Math.pow(val - mean, 2);
      }, 0) /
      (n2 - 1);

    // F-statistic (larger variance over smaller variance)
    const fStatistic = var1 > var2 ? var1 / var2 : var2 / var1;
    const df1 = var1 > var2 ? n1 - 1 : n2 - 1;
    const df2 = var1 > var2 ? n2 - 1 : n1 - 1;

    // Simplified F-distribution p-value calculation
    const pValue = this.calculateFPValue(fStatistic, df1, df2);

    const result = {
      test: 'F-test for equality of variances',
      nullHypothesis: 'Population variances are equal',
      alternativeHypothesis: 'Population variances are different',
      sample1: {
        size: n1,
        variance: this.round(var1)
      },
      sample2: {
        size: n2,
        variance: this.round(var2)
      },
      fStatistic: this.round(fStatistic),
      degreesOfFreedom1: df1,
      degreesOfFreedom2: df2,
      pValue: this.round(pValue),
      rejectNull: pValue < this.significanceLevel,
      significance: this.significanceLevel
    };

    this.setCache(cacheKey, result);
    return result;
  }

  // ===== DISTRIBUTION ANALYSIS =====

  /**
   * Jarque-Bera test for normality
   * @param {Array} data - Sample data
   * @returns {Object} Normality test results
   */
  jarqueBeraTest(data) {
    const cacheKey = `jb_test_${data.length}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (!Array.isArray(data) || data.length < 3) {
      throw new Error('Insufficient data for Jarque-Bera test');
    }

    const n = data.length;
    const mean = data.reduce((sum, val) => sum + val, 0) / n;

    // Calculate skewness
    const skewness =
      data.reduce(
        (sum, val) =>
          sum +
          Math.pow(
            (val - mean) / Math.sqrt(data.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n),
            3
          ),
        0
      ) / n;

    // Calculate kurtosis
    const kurtosis =
      data.reduce(
        (sum, val) =>
          sum +
          Math.pow(
            (val - mean) / Math.sqrt(data.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n),
            4
          ),
        0
      ) / n;

    // Jarque-Bera statistic
    const jbStatistic = (n / 6) * (Math.pow(skewness, 2) + Math.pow(kurtosis - 3, 2) / 4);

    // Chi-square approximation for p-value
    const pValue = this.chiSquarePValue(jbStatistic, 2);

    const result = {
      test: 'Jarque-Bera test for normality',
      nullHypothesis: 'Data is normally distributed',
      alternativeHypothesis: 'Data is not normally distributed',
      sampleSize: n,
      skewness: this.round(skewness),
      kurtosis: this.round(kurtosis),
      jbStatistic: this.round(jbStatistic),
      degreesOfFreedom: 2,
      pValue: this.round(pValue),
      rejectNull: pValue < this.significanceLevel,
      significance: this.significanceLevel,
      interpretation:
        pValue < this.significanceLevel
          ? 'Reject normality - data is not normally distributed'
          : 'Fail to reject normality - data may be normally distributed'
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Augmented Dickey-Fuller test for stationarity
   * @param {Array} data - Time series data
   * @returns {Object} Stationarity test results
   */
  augmentedDickeyFullerTest(data) {
    const cacheKey = `adf_test_${data.length}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (!Array.isArray(data) || data.length < 10) {
      throw new Error('Insufficient data for Augmented Dickey-Fuller test');
    }

    // Simplified ADF test implementation
    const n = data.length;
    const diffData = [];

    // First difference
    for (let i = 1; i < n; i++) {
      diffData.push(data[i] - data[i - 1]);
    }

    // Create regression variables (simplified - using only intercept and lagged difference)
    const y = diffData.slice(1);
    const x0 = new Array(y.length).fill(1); // Intercept
    const x1 = data.slice(1, -1); // Lagged level
    const x2 = diffData.slice(0, -1); // Lagged difference

    const regression = this.multipleRegression(y, [x0, x1, x2]);
    const adfStatistic =
      regression.coefficients[1].value / regression.coefficients[1].standardError;

    // Critical values for ADF test (approximations)
    const criticalValues = {
      0.01: -3.43,
      0.05: -2.86,
      0.1: -2.57
    };

    const result = {
      test: 'Augmented Dickey-Fuller test for stationarity',
      nullHypothesis: 'Data has a unit root (non-stationary)',
      alternativeHypothesis: 'Data is stationary',
      sampleSize: n,
      adfStatistic: this.round(adfStatistic),
      criticalValues: {
        '1%': criticalValues[0.01],
        '5%': criticalValues[0.05],
        '10%': criticalValues[0.1]
      },
      pValue: this.round(this.calculateADFPValue(adfStatistic)),
      rejectNull: adfStatistic < criticalValues[this.significanceLevel],
      significance: this.significanceLevel,
      interpretation:
        adfStatistic < criticalValues[this.significanceLevel]
          ? 'Reject null hypothesis - data is stationary'
          : 'Fail to reject null hypothesis - data may have a unit root'
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Ljung-Box test for autocorrelation
   * @param {Array} data - Time series data
   * @param {number} lags - Number of lags to test
   * @returns {Object} Autocorrelation test results
   */
  ljungBoxTest(data, lags = 10) {
    const cacheKey = `ljung_box_${data.length}_${lags}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (!Array.isArray(data) || data.length < lags + 1) {
      throw new Error('Insufficient data for Ljung-Box test');
    }

    const n = data.length;
    const mean = data.reduce((sum, val) => sum + val, 0) / n;

    // Calculate autocorrelations
    const autocorrelations = [];
    for (let k = 1; k <= lags; k++) {
      let numerator = 0;
      let denominator = 0;

      for (let i = k; i < n; i++) {
        numerator += (data[i] - mean) * (data[i - k] - mean);
      }

      for (let i = 0; i < n; i++) {
        denominator += Math.pow(data[i] - mean, 2);
      }

      autocorrelations.push(numerator / denominator);
    }

    // Calculate Ljung-Box statistic
    let lbStatistic = 0;
    for (let k = 1; k <= lags; k++) {
      lbStatistic += Math.pow(autocorrelations[k - 1], 2) / (n - k);
    }
    lbStatistic *= n * (n + 2);

    const pValue = this.chiSquarePValue(lbStatistic, lags);

    const result = {
      test: 'Ljung-Box test for autocorrelation',
      nullHypothesis: 'No autocorrelation in the data',
      alternativeHypothesis: 'Data exhibits autocorrelation',
      sampleSize: n,
      lags,
      autocorrelations: autocorrelations.map(ac => this.round(ac)),
      lbStatistic: this.round(lbStatistic),
      degreesOfFreedom: lags,
      pValue: this.round(pValue),
      rejectNull: pValue < this.significanceLevel,
      significance: this.significanceLevel,
      interpretation:
        pValue < this.significanceLevel
          ? 'Reject null hypothesis - data exhibits autocorrelation'
          : 'Fail to reject null hypothesis - no significant autocorrelation'
    };

    this.setCache(cacheKey, result);
    return result;
  }

  // ===== TIME SERIES ANALYSIS =====

  /**
   * Granger causality test
   * @param {Array} y - Dependent variable
   * @param {Array} x - Independent variable
   * @param {number} lag - Number of lags
   * @returns {Object} Granger causality test results
   */
  grangerCausalityTest(y, x, lag = 1) {
    const cacheKey = `granger_${y.length}_${lag}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (!Array.isArray(y) || !Array.isArray(x) || y.length !== x.length || y.length < lag + 2) {
      throw new Error('Insufficient data for Granger causality test');
    }

    const n = y.length;

    // Create lagged variables
    const yLags = [];
    const xLags = [];
    const yDep = [];

    for (let i = lag; i < n; i++) {
      yDep.push(y[i]);
      yLags.push(y.slice(i - lag, i));
      xLags.push(x.slice(i - lag, i));
    }

    // Restricted model: y_t = a0 + a1*y_{t-1} + ... + a_lag*y_{t-lag}
    const restrictedModel = this.multipleRegression(yDep, [
      new Array(yDep.length).fill(1),
      ...this.transpose(yLags)
    ]);

    // Unrestricted model: y_t = a0 + a1*y_{t-1} + ... + a_lag*y_{t-lag} + b1*x_{t-1} + ... + b_lag*x_{t-lag}
    const unrestrictedModel = this.multipleRegression(yDep, [
      new Array(yDep.length).fill(1),
      ...this.transpose(yLags),
      ...this.transpose(xLags)
    ]);

    // F-statistic for Granger causality
    const ssrRestricted = restrictedModel.residuals.reduce((sum, r) => sum + r * r, 0);
    const ssrUnrestricted = unrestrictedModel.residuals.reduce((sum, r) => sum + r * r, 0);
    const fStatistic =
      (ssrRestricted - ssrUnrestricted) / lag / (ssrUnrestricted / (n - 2 * lag - 1));
    const pValue = this.calculateFPValue(fStatistic, lag, n - 2 * lag - 1);

    const result = {
      test: 'Granger causality test',
      nullHypothesis: 'X does not Granger-cause Y',
      alternativeHypothesis: 'X Granger-causes Y',
      sampleSize: n,
      lag,
      restrictedModel: {
        rSquared: restrictedModel.statistics.rSquared,
        aic: this.calculateAIC(restrictedModel),
        bic: this.calculateBIC(restrictedModel, n)
      },
      unrestrictedModel: {
        rSquared: unrestrictedModel.statistics.rSquared,
        aic: this.calculateAIC(unrestrictedModel),
        bic: this.calculateBIC(unrestrictedModel, n)
      },
      fStatistic: this.round(fStatistic),
      degreesOfFreedom1: lag,
      degreesOfFreedom2: n - 2 * lag - 1,
      pValue: this.round(pValue),
      rejectNull: pValue < this.significanceLevel,
      significance: this.significanceLevel,
      interpretation:
        pValue < this.significanceLevel
          ? 'Reject null hypothesis - X Granger-causes Y'
          : 'Fail to reject null hypothesis - no Granger causality detected'
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Engle-Granger cointegration test
   * @param {Array} series1 - First time series
   * @param {Array} series2 - Second time series
   * @returns {Object} Cointegration test results
   */
  engleGrangerTest(series1, series2) {
    const cacheKey = `eg_test_${series1.length}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (
      !Array.isArray(series1) ||
      !Array.isArray(series2) ||
      series1.length !== series2.length ||
      series1.length < 10
    ) {
      throw new Error('Insufficient data for Engle-Granger test');
    }

    const n = series1.length;

    // Step 1: Test for unit roots in individual series
    const adf1 = this.augmentedDickeyFullerTest(series1);
    const adf2 = this.augmentedDickeyFullerTest(series2);

    // Step 2: Regress series1 on series2
    const regression = this.multipleRegression(series1, [new Array(n).fill(1), series2]);

    // Step 3: Test residuals for stationarity
    const residuals = regression.residuals;
    const adfResiduals = this.augmentedDickeyFullerTest(residuals);

    const result = {
      test: 'Engle-Granger cointegration test',
      nullHypothesis: 'Series are not cointegrated',
      alternativeHypothesis: 'Series are cointegrated',
      sampleSize: n,
      individualTests: {
        series1: {
          stationary: adf1.rejectNull,
          adfStatistic: adf1.adfStatistic
        },
        series2: {
          stationary: adf2.rejectNull,
          adfStatistic: adf2.adfStatistic
        }
      },
      cointegrationRegression: {
        coefficients: regression.coefficients.map(coef => ({
          name: coef.variable,
          value: this.round(coef.value),
          tStatistic: this.round(coef.tStatistic),
          pValue: this.round(coef.pValue)
        })),
        rSquared: regression.statistics.rSquared
      },
      residualTest: {
        stationary: adfResiduals.rejectNull,
        adfStatistic: adfResiduals.adfStatistic,
        pValue: adfResiduals.pValue
      },
      cointegrated: adfResiduals.rejectNull,
      significance: this.significanceLevel
    };

    this.setCache(cacheKey, result);
    return result;
  }

  // ===== UTILITY METHODS =====

  /**
   * Calculate confidence interval
   */
  calculateConfidenceInterval(mean, std, n, confidenceLevel) {
    const alpha = 1 - confidenceLevel;
    const tCritical = this.calculateTCriticalValue(alpha / 2, n - 1);
    const marginOfError = tCritical * (std / Math.sqrt(n));

    return {
      lower: mean - marginOfError,
      upper: mean + marginOfError
    };
  }

  /**
   * Calculate critical t-value (approximation)
   */
  calculateTCriticalValue(alpha, df) {
    // Approximation for t-distribution critical values
    if (df > 30) {
      // Normal approximation
      return this.normalQuantile(1 - alpha);
    }

    // Simplified approximation for smaller df
    const z = this.normalQuantile(1 - alpha);
    return z + (z ** 3 + z) / (4 * df) + (5 * z ** 5 + 16 * z ** 3 + 3 * z) / (96 * df ** 2);
  }

  /**
   * Normal distribution quantile (inverse CDF)
   */
  normalQuantile(p) {
    // Approximation using inverse error function
    const a1 = -3.969683028665376e1;
    const a2 = 2.209460984245205e2;
    const a3 = -2.759285104469687e2;
    const a4 = 1.38357751867279e2;
    const a5 = -3.066479806614716e1;
    const a6 = 2.506628277459239;

    const b1 = -5.447609879822406e1;
    const b2 = 1.615858368580409e2;
    const b3 = -1.556989798598866e2;
    const b4 = 6.680131188771972e1;
    const b5 = -1.328068155288572e1;

    const c1 = -7.784894002430293e-3;
    const c2 = -3.223964580411365e-1;
    const c3 = -2.400758277161838;
    const c4 = -2.549732539343734;
    const c5 = 4.374664141464968;
    const c6 = 2.938163982698783;

    const d1 = 7.784695709041462e-3;
    const d2 = 3.224671290700398e-1;
    const d3 = 2.445134137142996;
    const d4 = 3.754408661907416;

    const q = p - 0.5;

    if (Math.abs(q) <= 0.425) {
      const r = 0.180625 - q * q;
      return (
        q *
          (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) *
          ((((b1 * r + b2) * r + b3) * r + b4) * r + b5) *
          r +
        1.0
      );
    } else {
      const r = q > 0 ? 1 - p : p;
      const r2 = Math.sqrt(-Math.log(r));
      let result =
        (((((c1 * r2 + c2) * r2 + c3) * r2 + c4) * r2 + c5) * r2 + c6) /
        ((((d1 * r2 + d2) * r2 + d3) * r2 + d4) * r2 + 1.0);
      return q > 0 ? result : -result;
    }
  }

  /**
   * Calculate F-distribution p-value (simplified)
   */
  calculateFPValue(fStatistic, df1, df2) {
    // Simplified F-distribution p-value using beta function approximation
    if (fStatistic <= 0) return 1;

    const x = df2 / (df2 + df1 * fStatistic);
    return this.incompleteBeta(x, df2 / 2, df1 / 2);
  }

  /**
   * Incomplete beta function (simplified)
   */
  incompleteBeta(x, a, b) {
    // Simplified implementation using continued fraction
    const bt = Math.exp(this.lnBeta(a, b) - a * Math.log(x) - b * Math.log(1 - x));

    if (x < (a + 1) / (a + b + 2)) {
      return (bt * this.betaContinuedFraction(x, a, b)) / a;
    } else {
      return 1 - (bt * this.betaContinuedFraction(1 - x, b, a)) / b;
    }
  }

  /**
   * Beta continued fraction
   */
  betaContinuedFraction(x, a, b, maxIterations = 100) {
    const eps = 1e-8;
    const fpmin = 1e-30;

    let qab = a + b;
    let qap = a + 1;
    let qam = a - 1;
    let c = 1;
    let d = 1 - (qab * x) / qap;

    if (Math.abs(d) < fpmin) d = fpmin;
    d = 1 / d;
    let h = d;

    for (let m = 1; m <= maxIterations; m++) {
      let m2 = 2 * m;
      let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
      d = 1 + aa * d;

      if (Math.abs(d) < fpmin) d = fpmin;
      c = 1 + aa / c;

      if (Math.abs(c) < fpmin) c = fpmin;
      d = 1 / d;
      h *= d * c;

      aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
      d = 1 + aa * d;

      if (Math.abs(d) < fpmin) d = fpmin;
      c = 1 + aa / c;

      if (Math.abs(c) < fpmin) c = fpmin;
      d = 1 / d;
      h *= d * c;

      if (Math.abs(1 - d * c) < eps) break;
    }

    return h;
  }

  /**
   * Log beta function
   */
  lnBeta(a, b) {
    return this.lnGamma(a) + this.lnGamma(b) - this.lnGamma(a + b);
  }

  /**
   * Log gamma function (simplified)
   */
  lnGamma(x) {
    const g = 7;
    const p = [
      0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
      -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
      1.5056327351493116e-7
    ];

    if (x < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * x)) - this.lnGamma(1 - x);

    x -= 1;
    let a = p[0];
    const t = x + g + 0.5;

    for (let i = 1; i < p.length; i++) {
      a += p[i] / (x + i);
    }

    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }

  /**
   * Chi-square p-value
   */
  chiSquarePValue(chiSquare, df) {
    // Simplified chi-square p-value using gamma function
    return 1 - this.incompleteGamma(chiSquare / 2, df / 2);
  }

  /**
   * Incomplete gamma function (simplified)
   */
  incompleteGamma(x, a) {
    // Simplified implementation
    const g = 0.57721566490153286060651209; // Euler-Mascheroni constant
    const gln = this.lnGamma(a);

    if (x < 0 || a <= 0) return 0;

    if (x < a + 1) {
      // Series representation
      let ap = a;
      let del = 1 / a;
      let sum = del;
      for (let n = 1; n <= 100; n++) {
        ap += 1;
        del *= x / ap;
        sum += del;
        if (Math.abs(del) < Math.abs(sum) * 1e-8) break;
      }
      return sum * Math.exp(-x + a * Math.log(x) - gln);
    } else {
      // Continued fraction representation
      let b = x + 1 - a;
      let c = 1 / 1e-30;
      let d = 1 / b;
      let h = d;
      for (let n = 1; n <= 100; n++) {
        const an = -n * (n - a);
        b += 2;
        d = an * d + b;
        if (Math.abs(d) < 1e-30) d = 1e-30;
        c = b + an / c;
        if (Math.abs(c) < 1e-30) c = 1e-30;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < 1e-8) break;
      }
      return 1 - Math.exp(-x + a * Math.log(x) - gln) * h;
    }
  }

  /**
   * Calculate ADF p-value (simplified)
   */
  calculateADFPValue(adfStatistic) {
    // Simplified p-value calculation for ADF statistic
    const absStat = Math.abs(adfStatistic);
    if (absStat > 4) return 0.0001;
    if (absStat > 3) return 0.001;
    if (absStat > 2.5) return 0.01;
    if (absStat > 2) return 0.05;
    if (absStat > 1.5) return 0.1;
    return 0.2;
  }

  /**
   * Transpose matrix
   */
  transpose(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  }
}

// Export singleton instance
export const statisticalAnalysisEngine = new StatisticalAnalysisEngine({
  cacheTimeout: 300000,
  precision: 6,
  significanceLevel: 0.05,
  confidenceLevel: 0.95
});

export default StatisticalAnalysisEngine;
