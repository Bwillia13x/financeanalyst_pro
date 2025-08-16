/**
 * Financial Calculation Web Worker
 * Handles intensive financial calculations off the main thread
 */

// Import calculation engines
import { FinancialModelingEngine } from '../services/financialModelingEngine.js';
import { MonteCarloEngine } from '../services/monteCarloEngine.js';
import { LBOModelingEngine } from '../services/lboModelingEngine.js';

class FinancialWorker {
  constructor() {
    this.financialEngine = new FinancialModelingEngine();
    this.monteCarloEngine = new MonteCarloEngine();
    this.lboEngine = new LBOModelingEngine();
    
    // Cache for repeated calculations
    this.calculationCache = new Map();
  }

  /**
   * Process financial calculation requests
   */
  processMessage(data) {
    const { type, payload, requestId } = data;
    
    try {
      let result;
      const cacheKey = this.generateCacheKey(type, payload);
      
      // Check cache first for performance
      if (this.calculationCache.has(cacheKey)) {
        result = this.calculationCache.get(cacheKey);
        this.postMessage({
          type: 'CALCULATION_COMPLETE',
          requestId,
          result,
          cached: true
        });
        return;
      }

      switch (type) {
        case 'DCF_CALCULATION':
          result = this.calculateDCF(payload);
          break;
          
        case 'MONTE_CARLO_SIMULATION':
          result = this.runMonteCarloSimulation(payload);
          break;
          
        case 'LBO_ANALYSIS':
          result = this.calculateLBO(payload);
          break;
          
        case 'SENSITIVITY_ANALYSIS':
          result = this.runSensitivityAnalysis(payload);
          break;
          
        case 'CORRELATION_ANALYSIS':
          result = this.calculateCorrelations(payload);
          break;
          
        case 'FINANCIAL_RATIOS':
          result = this.calculateFinancialRatios(payload);
          break;
          
        default:
          throw new Error(`Unknown calculation type: ${type}`);
      }

      // Cache the result
      if (result && this.calculationCache.size < 1000) { // Limit cache size
        this.calculationCache.set(cacheKey, result);
      }

      this.postMessage({
        type: 'CALCULATION_COMPLETE',
        requestId,
        result,
        cached: false
      });
      
    } catch (error) {
      this.postMessage({
        type: 'CALCULATION_ERROR',
        requestId,
        error: {
          message: error.message,
          stack: error.stack
        }
      });
    }
  }

  /**
   * Calculate DCF valuation
   */
  calculateDCF(payload) {
    const { inputs, scenarios, options } = payload;
    
    // Add performance tracking
    const startTime = performance.now();
    
    const result = this.financialEngine.buildDCFModel(inputs, scenarios);
    
    const endTime = performance.now();
    result.calculationTime = endTime - startTime;
    
    return result;
  }

  /**
   * Run Monte Carlo simulation
   */
  async runMonteCarloSimulation(payload) {
    const { baseInputs, distributions, options } = payload;
    
    const startTime = performance.now();
    
    // Progress reporting for long simulations
    const progressCallback = (progress) => {
      this.postMessage({
        type: 'SIMULATION_PROGRESS',
        progress
      });
    };
    
    const result = await this.monteCarloEngine.runDCFSimulation(
      baseInputs, 
      distributions, 
      { ...options, progressCallback }
    );
    
    const endTime = performance.now();
    result.calculationTime = endTime - startTime;
    
    return result;
  }

  /**
   * Calculate LBO analysis
   */
  calculateLBO(payload) {
    const { inputs, scenarios } = payload;
    
    const startTime = performance.now();
    
    const result = this.lboEngine.buildLBOModel(inputs, scenarios);
    
    const endTime = performance.now();
    result.calculationTime = endTime - startTime;
    
    return result;
  }

  /**
   * Run sensitivity analysis
   */
  runSensitivityAnalysis(payload) {
    const { baseCase, variables, ranges } = payload;
    const results = {};
    
    // Calculate sensitivity for each variable
    for (const [variable, range] of Object.entries(ranges)) {
      results[variable] = this.calculateVariableSensitivity(baseCase, variable, range);
    }
    
    return {
      sensitivities: results,
      baseCase
    };
  }

  /**
   * Calculate variable sensitivity
   */
  calculateVariableSensitivity(baseCase, variable, range) {
    const { min, max, steps = 11 } = range;
    const stepSize = (max - min) / (steps - 1);
    const results = [];
    
    for (let i = 0; i < steps; i++) {
      const value = min + (stepSize * i);
      const modifiedInputs = { ...baseCase, [variable]: value };
      
      // Recalculate with modified variable
      const result = this.financialEngine.buildDCFModel(modifiedInputs);
      
      results.push({
        [variable]: value,
        valuation: result.valuation,
        percentChange: ((result.valuation - baseCase.valuation) / baseCase.valuation) * 100
      });
    }
    
    return results;
  }

  /**
   * Calculate correlation matrix
   */
  calculateCorrelations(payload) {
    const { data, variables } = payload;
    const correlations = {};
    
    for (let i = 0; i < variables.length; i++) {
      correlations[variables[i]] = {};
      for (let j = 0; j < variables.length; j++) {
        if (i === j) {
          correlations[variables[i]][variables[j]] = 1;
        } else {
          correlations[variables[i]][variables[j]] = this.calculatePearsonCorrelation(
            data[variables[i]], 
            data[variables[j]]
          );
        }
      }
    }
    
    return correlations;
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  calculatePearsonCorrelation(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate comprehensive financial ratios
   */
  calculateFinancialRatios(payload) {
    const { financialData } = payload;
    const { incomeStatement, balanceSheet, cashFlow } = financialData;
    
    return {
      profitability: this.calculateProfitabilityRatios(incomeStatement, balanceSheet),
      liquidity: this.calculateLiquidityRatios(balanceSheet),
      leverage: this.calculateLeverageRatios(incomeStatement, balanceSheet),
      efficiency: this.calculateEfficiencyRatios(incomeStatement, balanceSheet),
      valuation: this.calculateValuationRatios(incomeStatement, balanceSheet, payload.marketData)
    };
  }

  /**
   * Calculate profitability ratios
   */
  calculateProfitabilityRatios(income, balance) {
    return {
      grossMargin: income.grossProfit / income.revenue,
      operatingMargin: income.operatingIncome / income.revenue,
      netMargin: income.netIncome / income.revenue,
      roa: income.netIncome / balance.totalAssets,
      roe: income.netIncome / balance.totalEquity,
      roic: income.operatingIncome * (1 - 0.21) / (balance.totalAssets - balance.currentLiabilities)
    };
  }

  /**
   * Calculate liquidity ratios
   */
  calculateLiquidityRatios(balance) {
    return {
      currentRatio: balance.currentAssets / balance.currentLiabilities,
      quickRatio: (balance.currentAssets - balance.inventory) / balance.currentLiabilities,
      cashRatio: balance.cash / balance.currentLiabilities
    };
  }

  /**
   * Calculate leverage ratios
   */
  calculateLeverageRatios(income, balance) {
    return {
      debtToEquity: balance.totalDebt / balance.totalEquity,
      debtToAssets: balance.totalDebt / balance.totalAssets,
      equityMultiplier: balance.totalAssets / balance.totalEquity,
      interestCoverage: income.operatingIncome / income.interestExpense
    };
  }

  /**
   * Calculate efficiency ratios
   */
  calculateEfficiencyRatios(income, balance) {
    return {
      assetTurnover: income.revenue / balance.totalAssets,
      inventoryTurnover: income.costOfGoodsSold / balance.inventory,
      receivablesTurnover: income.revenue / balance.accountsReceivable,
      payablesTurnover: income.costOfGoodsSold / balance.accountsPayable
    };
  }

  /**
   * Calculate valuation ratios
   */
  calculateValuationRatios(income, balance, marketData) {
    if (!marketData) return {};
    
    const { sharePrice, sharesOutstanding, marketCap } = marketData;
    
    return {
      peRatio: sharePrice / (income.netIncome / sharesOutstanding),
      pbRatio: sharePrice / (balance.totalEquity / sharesOutstanding),
      evEbitda: (marketCap + balance.totalDebt - balance.cash) / income.ebitda,
      evRevenue: (marketCap + balance.totalDebt - balance.cash) / income.revenue,
      priceToSales: marketCap / income.revenue
    };
  }

  /**
   * Generate cache key for calculations
   */
  generateCacheKey(type, payload) {
    return `${type}_${JSON.stringify(payload)}`;
  }

  /**
   * Clear calculation cache
   */
  clearCache() {
    this.calculationCache.clear();
  }

  /**
   * Post message back to main thread
   */
  postMessage(data) {
    if (typeof self !== 'undefined' && self.postMessage) {
      self.postMessage(data);
    }
  }
}

// Initialize worker
const worker = new FinancialWorker();

// Listen for messages from main thread
if (typeof self !== 'undefined') {
  self.onmessage = function(event) {
    worker.processMessage(event.data);
  };
}

export default FinancialWorker;