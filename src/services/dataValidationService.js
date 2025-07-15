import { apiLogger } from '../utils/apiLogger.js';

/**
 * Data validation and quality assurance service
 * Ensures data integrity and consistency across different sources
 */
class DataValidationService {
  constructor() {
    this.validationRules = this.initializeValidationRules();
    this.qualityMetrics = new Map();
    this.anomalyDetection = new Map();
  }

  /**
   * Initialize validation rules for different data types
   */
  initializeValidationRules() {
    return {
      marketData: {
        required: ['symbol', 'currentPrice', 'volume'],
        numeric: ['currentPrice', 'previousClose', 'change', 'changePercent', 'volume', 'marketCap'],
        ranges: {
          currentPrice: { min: 0, max: 100000 },
          volume: { min: 0, max: 1e12 },
          changePercent: { min: -50, max: 50 }
        },
        formats: {
          symbol: /^[A-Z]{1,5}$/,
          timestamp: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
        }
      },
      financialStatements: {
        required: ['revenue', 'netIncome'],
        numeric: ['revenue', 'netIncome', 'totalDebt', 'cashAndCashEquivalents'],
        ranges: {
          revenue: { min: 0, max: 1e12 },
          netIncome: { min: -1e11, max: 1e11 }
        }
      },
      companyProfile: {
        required: ['symbol', 'companyName', 'sector'],
        numeric: ['mktCap', 'pe', 'pb', 'beta'],
        ranges: {
          pe: { min: 0, max: 1000 },
          pb: { min: 0, max: 100 },
          beta: { min: -5, max: 5 }
        }
      }
    };
  }

  /**
   * Validate data against defined rules
   * @param {Object} data - Data to validate
   * @param {string} dataType - Type of data
   * @returns {Object} Validation result
   */
  validateData(data, dataType) {
    const rules = this.validationRules[dataType];
    if (!rules) {
      return { isValid: false, errors: [`Unknown data type: ${dataType}`] };
    }

    const errors = [];
    const warnings = [];

    // Check required fields
    for (const field of rules.required || []) {
      if (data[field] === undefined || data[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate numeric fields
    for (const field of rules.numeric || []) {
      if (data[field] !== undefined && data[field] !== null) {
        const value = parseFloat(data[field]);
        if (isNaN(value)) {
          errors.push(`Field ${field} must be numeric, got: ${data[field]}`);
        } else {
          // Check ranges
          const range = rules.ranges?.[field];
          if (range) {
            if (value < range.min || value > range.max) {
              warnings.push(`Field ${field} value ${value} outside expected range [${range.min}, ${range.max}]`);
            }
          }
        }
      }
    }

    // Validate formats
    for (const [field, pattern] of Object.entries(rules.formats || {})) {
      if (data[field] && !pattern.test(data[field])) {
        errors.push(`Field ${field} format invalid: ${data[field]}`);
      }
    }

    // Additional business logic validations
    const businessValidation = this.validateBusinessLogic(data, dataType);
    errors.push(...businessValidation.errors);
    warnings.push(...businessValidation.warnings);

    const isValid = errors.length === 0;
    
    // Log validation results
    if (!isValid) {
      apiLogger.log('ERROR', `Data validation failed for ${dataType}`, { errors, warnings });
    } else if (warnings.length > 0) {
      apiLogger.log('WARN', `Data validation warnings for ${dataType}`, { warnings });
    }

    return {
      isValid,
      errors,
      warnings,
      qualityScore: this.calculateQualityScore(errors, warnings)
    };
  }

  /**
   * Validate business logic rules
   * @param {Object} data - Data to validate
   * @param {string} dataType - Type of data
   * @returns {Object} Business validation result
   */
  validateBusinessLogic(data, dataType) {
    const errors = [];
    const warnings = [];

    switch (dataType) {
      case 'marketData':
        // Price consistency checks
        if (data.currentPrice && data.previousClose) {
          const calculatedChange = data.currentPrice - data.previousClose;
          const calculatedChangePercent = (calculatedChange / data.previousClose) * 100;
          
          if (data.change && Math.abs(data.change - calculatedChange) > 0.01) {
            warnings.push(`Price change inconsistency: reported ${data.change}, calculated ${calculatedChange.toFixed(2)}`);
          }
          
          if (data.changePercent && Math.abs(data.changePercent - calculatedChangePercent) > 0.1) {
            warnings.push(`Change percent inconsistency: reported ${data.changePercent}%, calculated ${calculatedChangePercent.toFixed(2)}%`);
          }
        }

        // Day range validation
        if (data.currentPrice && data.dayHigh && data.dayLow) {
          if (data.currentPrice > data.dayHigh) {
            warnings.push(`Current price ${data.currentPrice} exceeds day high ${data.dayHigh}`);
          }
          if (data.currentPrice < data.dayLow) {
            warnings.push(`Current price ${data.currentPrice} below day low ${data.dayLow}`);
          }
          if (data.dayLow > data.dayHigh) {
            errors.push(`Day low ${data.dayLow} greater than day high ${data.dayHigh}`);
          }
        }
        break;

      case 'financialStatements':
        // Financial ratio validations
        if (data.revenue && data.netIncome) {
          const netMargin = (data.netIncome / data.revenue) * 100;
          if (netMargin < -100 || netMargin > 100) {
            warnings.push(`Unusual net profit margin: ${netMargin.toFixed(2)}%`);
          }
        }

        // Balance sheet validations
        if (data.totalCurrentAssets && data.totalCurrentLiabilities) {
          const currentRatio = data.totalCurrentAssets / data.totalCurrentLiabilities;
          if (currentRatio < 0.1 || currentRatio > 20) {
            warnings.push(`Unusual current ratio: ${currentRatio.toFixed(2)}`);
          }
        }
        break;

      case 'companyProfile':
        // Valuation metric validations
        if (data.pe && (data.pe < 0 || data.pe > 500)) {
          warnings.push(`Unusual P/E ratio: ${data.pe}`);
        }
        
        if (data.pb && (data.pb < 0 || data.pb > 50)) {
          warnings.push(`Unusual P/B ratio: ${data.pb}`);
        }
        break;
    }

    return { errors, warnings };
  }

  /**
   * Calculate data quality score
   * @param {Array} errors - Validation errors
   * @param {Array} warnings - Validation warnings
   * @returns {number} Quality score (0-100)
   */
  calculateQualityScore(errors, warnings) {
    if (errors.length > 0) {
      return Math.max(0, 50 - (errors.length * 10));
    }
    
    return Math.max(70, 100 - (warnings.length * 5));
  }

  /**
   * Cross-validate data from multiple sources
   * @param {Array} dataSources - Array of data objects from different sources
   * @param {string} dataType - Type of data
   * @returns {Object} Cross-validation result
   */
  crossValidateData(dataSources, dataType) {
    if (dataSources.length < 2) {
      return { isConsistent: true, discrepancies: [], recommendedSource: dataSources[0]?.source };
    }

    const discrepancies = [];
    const numericFields = this.validationRules[dataType]?.numeric || [];

    // Compare numeric fields across sources
    for (const field of numericFields) {
      const values = dataSources
        .filter(data => data[field] !== undefined && data[field] !== null)
        .map(data => ({ value: parseFloat(data[field]), source: data.source }));

      if (values.length > 1) {
        const mean = values.reduce((sum, item) => sum + item.value, 0) / values.length;
        const maxDeviation = Math.max(...values.map(item => Math.abs(item.value - mean)));
        const threshold = mean * 0.05; // 5% threshold

        if (maxDeviation > threshold) {
          discrepancies.push({
            field,
            values,
            mean,
            maxDeviation,
            threshold
          });
        }
      }
    }

    // Determine recommended source based on quality scores
    const sourceQuality = dataSources.map(data => {
      const validation = this.validateData(data, dataType);
      return {
        source: data.source,
        qualityScore: validation.qualityScore,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length
      };
    });

    const recommendedSource = sourceQuality
      .sort((a, b) => b.qualityScore - a.qualityScore)[0]?.source;

    return {
      isConsistent: discrepancies.length === 0,
      discrepancies,
      sourceQuality,
      recommendedSource
    };
  }

  /**
   * Detect anomalies in time series data
   * @param {Array} timeSeries - Array of data points with timestamps
   * @param {string} field - Field to analyze
   * @returns {Array} Detected anomalies
   */
  detectAnomalies(timeSeries, field) {
    if (timeSeries.length < 10) {
      return []; // Need sufficient data for anomaly detection
    }

    const values = timeSeries.map(point => parseFloat(point[field])).filter(v => !isNaN(v));
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const anomalies = [];
    const threshold = 2.5; // 2.5 standard deviations

    timeSeries.forEach((point, index) => {
      const value = parseFloat(point[field]);
      if (!isNaN(value)) {
        const zScore = Math.abs((value - mean) / stdDev);
        if (zScore > threshold) {
          anomalies.push({
            index,
            timestamp: point.timestamp,
            value,
            zScore,
            deviation: value - mean,
            severity: zScore > 3 ? 'high' : 'medium'
          });
        }
      }
    });

    return anomalies;
  }

  /**
   * Get validation summary for a dataset
   * @param {Object} data - Data to summarize
   * @param {string} dataType - Type of data
   * @returns {Object} Validation summary
   */
  getValidationSummary(data, dataType) {
    const validation = this.validateData(data, dataType);
    
    return {
      dataType,
      timestamp: new Date().toISOString(),
      isValid: validation.isValid,
      qualityScore: validation.qualityScore,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      completeness: this.calculateCompleteness(data, dataType),
      freshness: this.calculateFreshness(data),
      source: data.source || 'unknown'
    };
  }

  /**
   * Calculate data completeness percentage
   * @param {Object} data - Data to analyze
   * @param {string} dataType - Type of data
   * @returns {number} Completeness percentage
   */
  calculateCompleteness(data, dataType) {
    const rules = this.validationRules[dataType];
    if (!rules) return 0;

    const allFields = [
      ...(rules.required || []),
      ...(rules.numeric || []),
      ...Object.keys(rules.formats || {})
    ];

    const uniqueFields = [...new Set(allFields)];
    const presentFields = uniqueFields.filter(field => 
      data[field] !== undefined && data[field] !== null && data[field] !== ''
    );

    return (presentFields.length / uniqueFields.length) * 100;
  }

  /**
   * Calculate data freshness score
   * @param {Object} data - Data to analyze
   * @returns {number} Freshness score (0-100)
   */
  calculateFreshness(data) {
    if (!data.timestamp) return 50; // Unknown freshness

    const dataTime = new Date(data.timestamp);
    const now = new Date();
    const ageMinutes = (now - dataTime) / (1000 * 60);

    // Score based on age (fresher = higher score)
    if (ageMinutes < 5) return 100;
    if (ageMinutes < 15) return 90;
    if (ageMinutes < 60) return 80;
    if (ageMinutes < 240) return 70;
    if (ageMinutes < 1440) return 60;
    return 40;
  }
}

// Export singleton instance
export const dataValidationService = new DataValidationService();
export default DataValidationService;
