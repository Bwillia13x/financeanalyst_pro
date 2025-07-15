/**
 * Financial Data Storage Service
 * Specialized storage utilities for financial models and market data
 */

import { storageService } from './storageService.js';
import { apiLogger } from '../utils/apiLogger.js';

/**
 * Financial Data Storage Manager
 */
class FinancialDataStorage {
  constructor() {
    this.storage = storageService;
  }

  /**
   * DCF Model Storage
   */
  async saveDCFModel(symbol, modelData) {
    try {
      const dcfData = {
        symbol: symbol.toUpperCase(),
        assumptions: modelData.assumptions || {},
        projections: modelData.projections || {},
        valuation: modelData.valuation || {},
        metadata: {
          createdAt: Date.now(),
          lastModified: Date.now(),
          version: '1.0',
          modelType: 'DCF',
          ...modelData.metadata
        }
      };

      await this.storage.setItem('dcfModel', symbol.toUpperCase(), dcfData);
      
      apiLogger.log('INFO', 'DCF model saved', { symbol, valuation: dcfData.valuation.intrinsicValue });
      return true;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to save DCF model', { symbol, error: error.message });
      throw error;
    }
  }

  async getDCFModel(symbol) {
    try {
      const data = await this.storage.getItem('dcfModel', symbol.toUpperCase());
      if (data) {
        apiLogger.log('DEBUG', 'DCF model retrieved', { symbol });
      }
      return data;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to retrieve DCF model', { symbol, error: error.message });
      return null;
    }
  }

  async listDCFModels() {
    return this.storage.listItems('dcfModel');
  }

  async deleteDCFModel(symbol) {
    return this.storage.removeItem('dcfModel', symbol.toUpperCase());
  }

  /**
   * LBO Model Storage
   */
  async saveLBOModel(symbol, modelData) {
    try {
      const lboData = {
        symbol: symbol.toUpperCase(),
        transaction: modelData.transaction || {},
        financing: modelData.financing || {},
        returns: modelData.returns || {},
        metadata: {
          createdAt: Date.now(),
          lastModified: Date.now(),
          version: '1.0',
          modelType: 'LBO',
          ...modelData.metadata
        }
      };

      await this.storage.setItem('lboModel', symbol.toUpperCase(), lboData);
      
      apiLogger.log('INFO', 'LBO model saved', { 
        symbol, 
        irr: lboData.returns.irr,
        moic: lboData.returns.moic 
      });
      return true;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to save LBO model', { symbol, error: error.message });
      throw error;
    }
  }

  async getLBOModel(symbol) {
    try {
      const data = await this.storage.getItem('lboModel', symbol.toUpperCase());
      if (data) {
        apiLogger.log('DEBUG', 'LBO model retrieved', { symbol });
      }
      return data;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to retrieve LBO model', { symbol, error: error.message });
      return null;
    }
  }

  async listLBOModels() {
    return this.storage.listItems('lboModel');
  }

  async deleteLBOModel(symbol) {
    return this.storage.removeItem('lboModel', symbol.toUpperCase());
  }

  /**
   * Monte Carlo Results Storage
   */
  async saveMonteCarloResults(modelId, resultsData) {
    try {
      const mcData = {
        modelType: resultsData.modelType || 'DCF',
        iterations: resultsData.iterations || 10000,
        results: resultsData.results || [],
        statistics: resultsData.statistics || {},
        metadata: {
          createdAt: Date.now(),
          modelId,
          symbol: resultsData.symbol,
          version: '1.0',
          ...resultsData.metadata
        }
      };

      await this.storage.setItem('monteCarloResults', modelId, mcData);
      
      apiLogger.log('INFO', 'Monte Carlo results saved', { 
        modelId, 
        iterations: mcData.iterations,
        mean: mcData.statistics.mean 
      });
      return true;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to save Monte Carlo results', { modelId, error: error.message });
      throw error;
    }
  }

  async getMonteCarloResults(modelId) {
    try {
      const data = await this.storage.getItem('monteCarloResults', modelId);
      if (data) {
        apiLogger.log('DEBUG', 'Monte Carlo results retrieved', { modelId });
      }
      return data;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to retrieve Monte Carlo results', { modelId, error: error.message });
      return null;
    }
  }

  async listMonteCarloResults() {
    return this.storage.listItems('monteCarloResults');
  }

  async deleteMonteCarloResults(modelId) {
    return this.storage.removeItem('monteCarloResults', modelId);
  }

  /**
   * Market Data Storage with TTL
   */
  async saveMarketData(symbol, marketData, ttlMinutes = 15) {
    try {
      const data = {
        symbol: symbol.toUpperCase(),
        data: marketData,
        timestamp: Date.now(),
        source: marketData.source || 'unknown',
        expiresAt: Date.now() + (ttlMinutes * 60 * 1000)
      };

      await this.storage.setItem('marketData', symbol.toUpperCase(), data);
      
      apiLogger.log('DEBUG', 'Market data cached', { 
        symbol, 
        source: data.source,
        ttlMinutes 
      });
      return true;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to cache market data', { symbol, error: error.message });
      throw error;
    }
  }

  async getMarketData(symbol) {
    try {
      const data = await this.storage.getItem('marketData', symbol.toUpperCase());
      
      if (data && data.expiresAt > Date.now()) {
        apiLogger.log('DEBUG', 'Market data cache hit', { symbol });
        return data.data;
      } else if (data) {
        // Data expired, remove it
        await this.deleteMarketData(symbol);
        apiLogger.log('DEBUG', 'Market data cache expired', { symbol });
      }
      
      return null;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to retrieve market data', { symbol, error: error.message });
      return null;
    }
  }

  async deleteMarketData(symbol) {
    return this.storage.removeItem('marketData', symbol.toUpperCase());
  }

  /**
   * User Preferences Storage
   */
  async saveUserPreferences(preferences) {
    try {
      const prefData = {
        theme: preferences.theme || 'light',
        layout: preferences.layout || {},
        notifications: preferences.notifications || {},
        privacy: preferences.privacy || {},
        metadata: {
          lastUpdated: Date.now(),
          version: '1.0'
        }
      };

      await this.storage.setItem('userPreferences', 'default', prefData);
      
      apiLogger.log('INFO', 'User preferences saved', { theme: prefData.theme });
      return true;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to save user preferences', { error: error.message });
      throw error;
    }
  }

  async getUserPreferences() {
    try {
      const data = await this.storage.getItem('userPreferences', 'default');
      if (data) {
        apiLogger.log('DEBUG', 'User preferences retrieved');
      }
      return data;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to retrieve user preferences', { error: error.message });
      return null;
    }
  }

  /**
   * Watchlist Storage
   */
  async saveWatchlist(name, symbols) {
    try {
      const watchlistData = {
        name,
        symbols: symbols.map(s => s.toUpperCase()),
        metadata: {
          createdAt: Date.now(),
          lastModified: Date.now(),
          symbolCount: symbols.length
        }
      };

      await this.storage.setItem('watchlist', name, watchlistData);
      
      apiLogger.log('INFO', 'Watchlist saved', { name, symbolCount: symbols.length });
      return true;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to save watchlist', { name, error: error.message });
      throw error;
    }
  }

  async getWatchlist(name) {
    try {
      const data = await this.storage.getItem('watchlist', name);
      if (data) {
        apiLogger.log('DEBUG', 'Watchlist retrieved', { name });
      }
      return data;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to retrieve watchlist', { name, error: error.message });
      return null;
    }
  }

  async listWatchlists() {
    return this.storage.listItems('watchlist');
  }

  async deleteWatchlist(name) {
    return this.storage.removeItem('watchlist', name);
  }

  /**
   * Export all financial data
   */
  async exportAllData() {
    try {
      const exportData = {
        timestamp: Date.now(),
        version: '1.0',
        data: {
          dcfModels: {},
          lboModels: {},
          monteCarloResults: {},
          watchlists: {},
          userPreferences: null
        }
      };

      // Export DCF models
      const dcfModels = await this.listDCFModels();
      for (const symbol of dcfModels) {
        exportData.data.dcfModels[symbol] = await this.getDCFModel(symbol);
      }

      // Export LBO models
      const lboModels = await this.listLBOModels();
      for (const symbol of lboModels) {
        exportData.data.lboModels[symbol] = await this.getLBOModel(symbol);
      }

      // Export Monte Carlo results
      const mcResults = await this.listMonteCarloResults();
      for (const modelId of mcResults) {
        exportData.data.monteCarloResults[modelId] = await this.getMonteCarloResults(modelId);
      }

      // Export watchlists
      const watchlists = await this.listWatchlists();
      for (const name of watchlists) {
        exportData.data.watchlists[name] = await this.getWatchlist(name);
      }

      // Export user preferences
      exportData.data.userPreferences = await this.getUserPreferences();

      apiLogger.log('INFO', 'Data export completed', {
        dcfCount: dcfModels.length,
        lboCount: lboModels.length,
        mcCount: mcResults.length,
        watchlistCount: watchlists.length
      });

      return exportData;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to export data', { error: error.message });
      throw error;
    }
  }

  /**
   * Import financial data
   */
  async importData(importData) {
    try {
      let importCount = 0;

      // Import DCF models
      if (importData.data.dcfModels) {
        for (const [symbol, data] of Object.entries(importData.data.dcfModels)) {
          await this.saveDCFModel(symbol, data);
          importCount++;
        }
      }

      // Import LBO models
      if (importData.data.lboModels) {
        for (const [symbol, data] of Object.entries(importData.data.lboModels)) {
          await this.saveLBOModel(symbol, data);
          importCount++;
        }
      }

      // Import Monte Carlo results
      if (importData.data.monteCarloResults) {
        for (const [modelId, data] of Object.entries(importData.data.monteCarloResults)) {
          await this.saveMonteCarloResults(modelId, data);
          importCount++;
        }
      }

      // Import watchlists
      if (importData.data.watchlists) {
        for (const [name, data] of Object.entries(importData.data.watchlists)) {
          await this.saveWatchlist(name, data.symbols);
          importCount++;
        }
      }

      // Import user preferences
      if (importData.data.userPreferences) {
        await this.saveUserPreferences(importData.data.userPreferences);
        importCount++;
      }

      apiLogger.log('INFO', 'Data import completed', { importCount });
      return importCount;
    } catch (error) {
      apiLogger.log('ERROR', 'Failed to import data', { error: error.message });
      throw error;
    }
  }

  /**
   * Get storage statistics for financial data
   */
  async getFinancialDataStats() {
    const stats = await this.storage.getStorageStats();
    
    return {
      ...stats,
      financialData: {
        dcfModels: (await this.listDCFModels()).length,
        lboModels: (await this.listLBOModels()).length,
        monteCarloResults: (await this.listMonteCarloResults()).length,
        watchlists: (await this.listWatchlists()).length
      }
    };
  }

  /**
   * Clean up expired market data
   */
  async cleanupExpiredMarketData() {
    const marketDataKeys = this.storage.listItems('marketData');
    let cleanedCount = 0;

    for (const symbol of marketDataKeys) {
      const data = await this.storage.getItem('marketData', symbol);
      if (data && data.expiresAt <= Date.now()) {
        await this.deleteMarketData(symbol);
        cleanedCount++;
      }
    }

    apiLogger.log('INFO', 'Expired market data cleaned', { cleanedCount });
    return cleanedCount;
  }
}

// Create and export singleton instance
export const financialDataStorage = new FinancialDataStorage();
export default financialDataStorage;
