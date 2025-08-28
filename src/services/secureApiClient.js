import axios from 'axios';

import { API_CONFIG } from './apiConfig.js';

/**
 * Secure API Client for FinanceAnalyst Pro
 * This client communicates with our secure backend instead of making direct API calls
 * All API keys are now handled securely on the server side
 */
class SecureApiClient {
  constructor() {
    this.baseURL =
      API_CONFIG?.BACKEND_PROXY?.baseURL ||
      import.meta.env.VITE_API_BASE_URL ||
      'http://localhost:3001/api';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // =============================================================================
  // GENERIC HTTP METHODS (delegate to axios instance)
  // =============================================================================

  get(url, config = {}) {
    return this.client.get(url, config);
  }

  post(url, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  put(url, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  delete(url, config = {}) {
    return this.client.delete(url, config);
  }

  // =============================================================================
  // MARKET DATA METHODS
  // =============================================================================

  /**
   * Get real-time quote for a symbol
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Quote data
   */
  async getQuote(symbol) {
    const response = await this.client.get(`/market-data/quote/${symbol.toUpperCase()}`);
    return response.data;
  }

  /**
   * Get historical price data
   * @param {string} symbol - Stock symbol
   * @param {string} range - Time range (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y)
   * @param {string} interval - Data interval (1m, 5m, 15m, 30m, 60m, 1d, etc.)
   * @returns {Promise<Object>} Historical data
   */
  async getHistoricalData(symbol, range = '1mo', interval = '1d') {
    const response = await this.client.get(`/market-data/historical/${symbol.toUpperCase()}`, {
      params: { range, interval }
    });
    return response.data;
  }

  /**
   * Get intraday price data
   * @param {string} symbol - Stock symbol
   * @param {string} interval - Intraday interval (1min, 5min, 15min, 30min, 60min)
   * @returns {Promise<Object>} Intraday data
   */
  async getIntradayData(symbol, interval = '5min') {
    const response = await this.client.get(`/market-data/intraday/${symbol.toUpperCase()}`, {
      params: { interval }
    });
    return response.data;
  }

  /**
   * Get quotes for multiple symbols
   * @param {string[]} symbols - Array of stock symbols
   * @returns {Promise<Object>} Batch quote data
   */
  async getBatchQuotes(symbols) {
    const response = await this.client.post('/market-data/batch', {
      symbols: symbols.map(s => s.toUpperCase())
    });
    return response.data;
  }

  // =============================================================================
  // FINANCIAL STATEMENTS METHODS
  // =============================================================================

  /**
   * Get income statement
   * @param {string} symbol - Stock symbol
   * @param {string} period - 'annual' or 'quarter'
   * @param {number} limit - Number of periods to retrieve
   * @returns {Promise<Object>} Income statement data
   */
  async getIncomeStatement(symbol, period = 'annual', limit = 5) {
    const response = await this.client.get(`/financial-statements/income/${symbol.toUpperCase()}`, {
      params: { period, limit }
    });
    return response.data;
  }

  /**
   * Get balance sheet
   * @param {string} symbol - Stock symbol
   * @param {string} period - 'annual' or 'quarter'
   * @param {number} limit - Number of periods to retrieve
   * @returns {Promise<Object>} Balance sheet data
   */
  async getBalanceSheet(symbol, period = 'annual', limit = 5) {
    const response = await this.client.get(
      `/financial-statements/balance/${symbol.toUpperCase()}`,
      {
        params: { period, limit }
      }
    );
    return response.data;
  }

  /**
   * Get cash flow statement
   * @param {string} symbol - Stock symbol
   * @param {string} period - 'annual' or 'quarter'
   * @param {number} limit - Number of periods to retrieve
   * @returns {Promise<Object>} Cash flow data
   */
  async getCashFlowStatement(symbol, period = 'annual', limit = 5) {
    const response = await this.client.get(
      `/financial-statements/cash-flow/${symbol.toUpperCase()}`,
      {
        params: { period, limit }
      }
    );
    return response.data;
  }

  /**
   * Get financial ratios
   * @param {string} symbol - Stock symbol
   * @param {string} period - 'annual' or 'quarter'
   * @param {number} limit - Number of periods to retrieve
   * @returns {Promise<Object>} Financial ratios data
   */
  async getFinancialRatios(symbol, period = 'annual', limit = 5) {
    const response = await this.client.get(`/financial-statements/ratios/${symbol.toUpperCase()}`, {
      params: { period, limit }
    });
    return response.data;
  }

  // =============================================================================
  // COMPANY DATA METHODS
  // =============================================================================

  /**
   * Get company profile and overview
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Company profile data
   */
  async getCompanyProfile(symbol) {
    const response = await this.client.get(`/company-data/profile/${symbol.toUpperCase()}`);
    return response.data;
  }

  /**
   * Get peer companies
   * @param {string} symbol - Stock symbol
   * @param {number} limit - Number of peers to retrieve
   * @returns {Promise<Object>} Peer companies data
   */
  async getPeerCompanies(symbol, limit = 10) {
    const response = await this.client.get(`/company-data/peers/${symbol.toUpperCase()}`, {
      params: { limit }
    });
    return response.data;
  }

  /**
   * Get DCF valuation
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} DCF valuation data
   */
  async getDCFValuation(symbol) {
    const response = await this.client.get(`/company-data/dcf/${symbol.toUpperCase()}`);
    return response.data;
  }

  /**
   * Get earnings data
   * @param {string} symbol - Stock symbol
   * @param {number} limit - Number of earnings periods to retrieve
   * @returns {Promise<Object>} Earnings data
   */
  async getEarnings(symbol, limit = 8) {
    const response = await this.client.get(`/company-data/earnings/${symbol.toUpperCase()}`, {
      params: { limit }
    });
    return response.data;
  }

  // =============================================================================
  // ECONOMIC DATA METHODS
  // =============================================================================

  /**
   * Get FRED economic data
   * @param {string} seriesId - FRED series ID
   * @param {number} limit - Number of observations to retrieve
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   * @returns {Promise<Object>} Economic data
   */
  async getFREDData(seriesId, limit = 100, startDate = null, endDate = null) {
    const params = { limit };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await this.client.get(`/economic-data/fred/${seriesId.toUpperCase()}`, {
      params
    });
    return response.data;
  }

  /**
   * Get popular economic indicators
   * @returns {Promise<Object>} Economic indicators data
   */
  async getEconomicIndicators() {
    const response = await this.client.get('/economic-data/indicators');
    return response.data;
  }

  /**
   * Get treasury yield curve data
   * @returns {Promise<Object>} Treasury rates data
   */
  async getTreasuryRates() {
    const response = await this.client.get('/economic-data/treasury-rates');
    return response.data;
  }

  // =============================================================================
  // HEALTH AND STATUS METHODS
  // =============================================================================

  /**
   * Check backend health
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    const response = await this.client.get('/health');
    return response.data;
  }

  /**
   * Check service health (API providers)
   * @returns {Promise<Object>} Service health status
   */
  async getServiceHealth() {
    const response = await this.client.get('/health/services');
    return response.data;
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheStats() {
    const response = await this.client.get('/health/cache');
    return response.data;
  }

  // =============================================================================
  // COMPATIBILITY METHODS (for existing frontend code)
  // =============================================================================

  /**
   * Fetch market data (compatibility method)
   * @param {string} ticker - Stock symbol
   * @param {string} range - Time range
   * @returns {Promise<Object>} Market data in expected format
   */
  async fetchMarketData(ticker, range = '1y') {
    try {
      const raw = await this.getHistoricalData(ticker, range);

      // If the backend/test returns Yahoo-style 'chart' payload, normalize minimal fields
      if (raw?.chart?.result?.[0]) {
        const node = raw.chart.result[0];
        const meta = node?.meta || {};
        return {
          symbol: meta.symbol || ticker.toUpperCase(),
          currentPrice: meta.regularMarketPrice,
          previousClose: meta.previousClose,
          marketCap: meta.marketCap,
          volume: meta.regularMarketVolume,
          currency: meta.currency,
          source: 'YAHOO_FINANCE'
        };
      }

      // Transform to match expected format from old API service (defensive against missing arrays)
      const rows = Array.isArray(raw?.data) ? raw.data : [];
      const lastClose = rows.length ? rows[rows.length - 1]?.close : undefined;
      return {
        symbol: raw?.symbol || ticker.toUpperCase(),
        range: raw?.range || range,
        data: rows,
        meta: raw?.meta,
        timestamps: rows.map(d => d.timestamp),
        prices: {
          close: rows.map(d => d.close),
          high: rows.map(d => d.high),
          low: rows.map(d => d.low),
          open: rows.map(d => d.open)
        },
        volume: rows.map(d => d.volume),
        source: raw?.source,
        // Convenience fields consumed by some tests/widgets
        currentPrice: raw?.meta?.regularMarketPrice ?? lastClose,
        previousClose: raw?.meta?.previousClose
      };
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      throw error;
    }
  }

  /**
   * Fetch financial statements (compatibility method)
   * @param {string} ticker - Stock symbol
   * @param {string} statement - Statement type
   * @param {string} period - 'annual' or 'quarter'
   * @param {number} limit - Number of periods
   * @returns {Promise<Object>} Financial statement data
   */
  async fetchFinancialStatements(
    ticker,
    statement = 'income-statement',
    period = 'annual',
    limit = 5
  ) {
    try {
      let data;

      switch (statement) {
        case 'income-statement':
          data = await this.getIncomeStatement(ticker, period, limit);
          break;
        case 'balance-sheet-statement':
          data = await this.getBalanceSheet(ticker, period, limit);
          break;
        case 'cash-flow-statement':
          data = await this.getCashFlowStatement(ticker, period, limit);
          break;
        default:
          throw new Error(`Unsupported statement type: ${statement}`);
      }

      // Support both { data: [...] } and raw array shapes
      return data?.data ?? data; // Return just the data array for compatibility
    } catch (error) {
      console.error('Failed to fetch financial statements:', error);
      throw error;
    }
  }

  /**
   * Fetch peer comparables (compatibility method)
   * @param {string} ticker - Stock symbol
   * @returns {Promise<Array>} Peer companies array
   */
  async fetchPeerComparables(ticker) {
    try {
      const data = await this.getPeerCompanies(ticker);
      return data.peers;
    } catch (error) {
      console.error('Failed to fetch peer comparables:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new SecureApiClient();
