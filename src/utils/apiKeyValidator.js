// API Key Validation Utility
// Validates API keys and provides helpful feedback for setup

import axios from 'axios';

export class ApiKeyValidator {
  constructor() {
    this.validationResults = new Map();
    this.lastValidation = null;
  }

  /**
   * Validate all configured API keys
   * @returns {Promise<Object>} Validation results for all services
   */
  async validateAllKeys() {
    const results = {
      timestamp: new Date(),
      overall: 'unknown',
      services: {},
      recommendations: []
    };

    // Get all API keys from environment
    const apiKeys = {
      alphaVantage: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY,
      fmp: import.meta.env.VITE_FMP_API_KEY,
      quandl: import.meta.env.VITE_QUANDL_API_KEY,
      fred: import.meta.env.VITE_FRED_API_KEY
    };

    // Validate each service
    const validationPromises = [
      this.validateAlphaVantage(apiKeys.alphaVantage),
      this.validateFMP(apiKeys.fmp),
      this.validateQuandl(apiKeys.quandl),
      this.validateFRED(apiKeys.fred)
    ];

    try {
      const [alphaVantage, fmp, quandl, fred] = await Promise.allSettled(validationPromises);
      
      results.services = {
        alphaVantage: this.processValidationResult(alphaVantage),
        fmp: this.processValidationResult(fmp),
        quandl: this.processValidationResult(quandl),
        fred: this.processValidationResult(fred)
      };

      // Determine overall status
      const validServices = Object.values(results.services).filter(s => s.status === 'valid').length;
      const totalServices = Object.keys(results.services).length;

      if (validServices === 0) {
        results.overall = 'demo';
        results.recommendations.push('No valid API keys found. Running in demo mode with mock data.');
        results.recommendations.push('Add at least one API key (Alpha Vantage or FMP recommended) for live data.');
      } else if (validServices < totalServices) {
        results.overall = 'partial';
        results.recommendations.push(`${validServices}/${totalServices} API keys are valid. Some features may use demo data.`);
      } else {
        results.overall = 'complete';
        results.recommendations.push('All API keys are valid. Full functionality available.');
      }

      this.lastValidation = results;
      return results;

    } catch (error) {
      results.overall = 'error';
      results.error = error.message;
      results.recommendations.push('Error validating API keys. Check your internet connection.');
      return results;
    }
  }

  /**
   * Validate Alpha Vantage API key
   */
  async validateAlphaVantage(apiKey) {
    if (!apiKey || apiKey === 'demo') {
      return { status: 'missing', message: 'API key not configured' };
    }

    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: 'AAPL',
          apikey: apiKey
        },
        timeout: 10000
      });

      if (response.data['Error Message']) {
        return { status: 'invalid', message: 'Invalid API key' };
      }

      if (response.data['Note']) {
        return { status: 'rate_limited', message: 'API key valid but rate limited' };
      }

      if (response.data['Global Quote']) {
        return { status: 'valid', message: 'API key is valid and working' };
      }

      return { status: 'unknown', message: 'Unexpected response format' };

    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return { status: 'network_error', message: 'Network connection failed' };
      }
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Validate Financial Modeling Prep API key
   */
  async validateFMP(apiKey) {
    if (!apiKey || apiKey === 'demo') {
      return { status: 'missing', message: 'API key not configured' };
    }

    try {
      const response = await axios.get(`https://financialmodelingprep.com/api/v3/profile/AAPL`, {
        params: { apikey: apiKey },
        timeout: 10000
      });

      if (response.data.error) {
        return { status: 'invalid', message: 'Invalid API key' };
      }

      if (Array.isArray(response.data) && response.data.length > 0) {
        return { status: 'valid', message: 'API key is valid and working' };
      }

      return { status: 'unknown', message: 'Unexpected response format' };

    } catch (error) {
      if (error.response?.status === 401) {
        return { status: 'invalid', message: 'Invalid API key' };
      }
      if (error.response?.status === 429) {
        return { status: 'rate_limited', message: 'API key valid but rate limited' };
      }
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return { status: 'network_error', message: 'Network connection failed' };
      }
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Validate Quandl API key
   */
  async validateQuandl(apiKey) {
    if (!apiKey || apiKey === 'demo') {
      return { status: 'missing', message: 'API key not configured' };
    }

    try {
      const response = await axios.get('https://data.nasdaq.com/api/v3/datasets/WIKI/AAPL.json', {
        params: { api_key: apiKey, rows: 1 },
        timeout: 10000
      });

      if (response.data.quandl_error) {
        return { status: 'invalid', message: 'Invalid API key' };
      }

      if (response.data.dataset) {
        return { status: 'valid', message: 'API key is valid and working' };
      }

      return { status: 'unknown', message: 'Unexpected response format' };

    } catch (error) {
      if (error.response?.status === 401) {
        return { status: 'invalid', message: 'Invalid API key' };
      }
      if (error.response?.status === 429) {
        return { status: 'rate_limited', message: 'API key valid but rate limited' };
      }
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return { status: 'network_error', message: 'Network connection failed' };
      }
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Validate FRED API key
   */
  async validateFRED(apiKey) {
    if (!apiKey || apiKey === 'demo') {
      return { status: 'missing', message: 'API key not configured' };
    }

    try {
      const response = await axios.get('https://api.stlouisfed.org/fred/series', {
        params: {
          series_id: 'GDP',
          api_key: apiKey,
          file_type: 'json'
        },
        timeout: 10000
      });

      if (response.data.error_message) {
        return { status: 'invalid', message: 'Invalid API key' };
      }

      if (response.data.seriess) {
        return { status: 'valid', message: 'API key is valid and working' };
      }

      return { status: 'unknown', message: 'Unexpected response format' };

    } catch (error) {
      if (error.response?.status === 400) {
        return { status: 'invalid', message: 'Invalid API key' };
      }
      if (error.response?.status === 429) {
        return { status: 'rate_limited', message: 'API key valid but rate limited' };
      }
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return { status: 'network_error', message: 'Network connection failed' };
      }
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Process validation result from Promise.allSettled
   */
  processValidationResult(result) {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return { status: 'error', message: result.reason.message };
    }
  }

  /**
   * Get validation status for a specific service
   */
  getServiceStatus(serviceName) {
    if (!this.lastValidation) {
      return { status: 'unknown', message: 'Validation not run yet' };
    }
    return this.lastValidation.services[serviceName] || { status: 'unknown', message: 'Service not found' };
  }

  /**
   * Get overall validation status
   */
  getOverallStatus() {
    if (!this.lastValidation) {
      return 'unknown';
    }
    return this.lastValidation.overall;
  }

  /**
   * Get recommendations for improving API setup
   */
  getRecommendations() {
    if (!this.lastValidation) {
      return ['Run API key validation first'];
    }
    return this.lastValidation.recommendations;
  }

  /**
   * Check if demo mode should be used
   */
  shouldUseDemoMode() {
    const status = this.getOverallStatus();
    return status === 'demo' || status === 'unknown';
  }
}

// Export singleton instance
export const apiKeyValidator = new ApiKeyValidator();
export default ApiKeyValidator;
