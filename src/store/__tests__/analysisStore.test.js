import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import analysisReducer, {
  setFinancialData,
  setAdjustedValues,
  setDcfInputs,
  setDcfResults,
  setLboInputs,
  setLboResults,
  setThreeStatementInputs,
  setThreeStatementResults,
  setScenarios,
  addScenario,
  updateScenario,
  removeScenario,
  setMonteCarloSettings,
  setMonteCarloResults,
  saveAnalysis,
  loadAnalysis,
  selectFinancialData,
  selectDcfResults,
  selectLboResults,
  selectScenarios,
  selectMonteCarloResults,
  selectDataCompleteness
} from '../analysisStore';

// Mock data for testing
const mockFinancialData = {
  statements: {
    incomeStatement: {
      revenue: [1000, 1100, 1200],
      grossProfit: [600, 660, 720],
      operatingIncome: [200, 220, 240],
      netIncome: [100, 110, 120]
    },
    balanceSheet: {
      totalAssets: [2000, 2200, 2400],
      totalLiabilities: [1200, 1300, 1400],
      shareholderEquity: [800, 900, 1000]
    },
    cashFlow: {
      operatingCashFlow: [150, 165, 180],
      investingCashFlow: [-50, -55, -60],
      financingCashFlow: [-80, -88, -96]
    }
  }
};

const mockDCFInputs = {
  wacc: 0.1,
  terminalGrowthRate: 0.025,
  projectionYears: 5
};

const mockDCFResults = {
  presentValue: 2500,
  terminalValue: 3000,
  enterpriseValue: 5500,
  equityValue: 4500,
  valuePerShare: 45
};

describe('analysisSlice reducers', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        analysis: analysisSlice.reducer
      }
    });
  });

  describe('financial data management', () => {
    it('should set financial data', () => {
      store.dispatch(setFinancialData(mockFinancialData));
      
      const state = store.getState().analysis;
      expect(state.financialData).toEqual(mockFinancialData);
    });

    it('should update adjusted values', () => {
      const adjustments = { 'revenue_2023': 1150 };
      store.dispatch(setAdjustedValues(adjustments));

      const state = store.getState().analysis;
      expect(state.adjustedValues).toEqual(adjustments);
    });

    it('should merge adjusted values with existing ones', () => {
      store.dispatch(setAdjustedValues({ 'revenue_2023': 1150 }));
      store.dispatch(setAdjustedValues({ 'grossProfit_2023': 680 }));

      const state = store.getState().analysis;
      expect(state.adjustedValues).toEqual({
        'revenue_2023': 1150,
        'grossProfit_2023': 680
      });
    });
  });

  describe('DCF model state', () => {
    it('should set DCF inputs', () => {
      store.dispatch(setDcfInputs(mockDCFInputs));

      const state = store.getState().analysis;
      expect(state.dcf.inputs).toEqual(mockDCFInputs);
      expect(state.dcf.status).toBe('idle');
    });

    it('should set DCF results and update status', () => {
      store.dispatch(setDcfResults(mockDCFResults));

      const state = store.getState().analysis;
      expect(state.dcf.results).toEqual(mockDCFResults);
      expect(state.dcf.status).toBe('succeeded');
      expect(state.dcf.lastCalculated).toBeDefined();
      expect(state.dcf.error).toBeNull();
    });

    it('should handle DCF calculation errors', () => {
      const error = 'Invalid WACC value';
      store.dispatch(setDcfResults({ error }));

      const state = store.getState().analysis;
      expect(state.dcf.results).toBeNull();
      expect(state.dcf.status).toBe('failed');
      expect(state.dcf.error).toBe(error);
    });
  });

  describe('LBO model state', () => {
    it('should set LBO inputs', () => {
      const lboInputs = {
        purchasePrice: 1000,
        debtToEquity: 3,
        holdingPeriod: 5
      };
      
      store.dispatch(setLboInputs(lboInputs));

      const state = store.getState().analysis;
      expect(state.lbo.inputs).toEqual(lboInputs);
    });

    it('should set LBO results', () => {
      const lboResults = {
        irr: 0.25,
        moic: 2.5,
        totalReturns: 5000
      };
      
      store.dispatch(setLboResults(lboResults));

      const state = store.getState().analysis;
      expect(state.lbo.results).toEqual(lboResults);
      expect(state.lbo.status).toBe('succeeded');
    });
  });

  describe('scenario analysis', () => {
    it('should add a new scenario', () => {
      const scenario = {
        id: 'scenario-1',
        name: 'Optimistic',
        assumptions: { revenueGrowth: 0.15 }
      };
      
      store.dispatch(addScenario(scenario));
      
      const state = store.getState().analysis;
      expect(state.scenarios.scenarios).toHaveLength(1);
      expect(state.scenarios.scenarios[0]).toEqual(scenario);
    });

    it('should update existing scenario', () => {
      const scenario = {
        id: 'scenario-1',
        name: 'Optimistic',
        assumptions: { revenueGrowth: 0.15 }
      };
      
      store.dispatch(addScenario(scenario));
      
      const updatedScenario = {
        id: 'scenario-1',
        name: 'Very Optimistic',
        assumptions: { revenueGrowth: 0.20 }
      };
      
      store.dispatch(updateScenario(updatedScenario));
      
      const state = store.getState().analysis;
      expect(state.scenarios.scenarios).toHaveLength(1);
      expect(state.scenarios.scenarios[0].name).toBe('Very Optimistic');
      expect(state.scenarios.scenarios[0].assumptions.revenueGrowth).toBe(0.20);
    });

    it('should remove a scenario', () => {
      const scenario1 = { id: 'scenario-1', name: 'Optimistic' };
      const scenario2 = { id: 'scenario-2', name: 'Pessimistic' };
      
      store.dispatch(addScenario(scenario1));
      store.dispatch(addScenario(scenario2));
      store.dispatch(removeScenario('scenario-1'));
      
      const state = store.getState().analysis;
      expect(state.scenarios.scenarios).toHaveLength(1);
      expect(state.scenarios.scenarios[0].id).toBe('scenario-2');
    });
  });

  describe('Monte Carlo settings', () => {
    it('should update Monte Carlo settings', () => {
      const settings = {
        iterations: 50000,
        confidenceLevel: 0.99,
        correlationsEnabled: false
      };
      
      store.dispatch(setMonteCarloSettings(settings));
      
      const state = store.getState().analysis;
      expect(state.monteCarlo.settings).toEqual({
        ...state.monteCarlo.settings,
        ...settings
      });
    });

    it('should set Monte Carlo results', () => {
      const results = {
        mean: 45.2,
        median: 44.8,
        stdDev: 8.5,
        confidenceInterval: [32.1, 58.3],
        percentiles: { p10: 34.2, p90: 56.1 }
      };
      
      store.dispatch(setMonteCarloResults(results));
      
      const state = store.getState().analysis;
      expect(state.monteCarlo.results).toEqual(results);
      expect(state.monteCarlo.status).toBe('succeeded');
    });
  });

  describe('analysis persistence', () => {
    it('should save analysis', () => {
      store.dispatch(setFinancialData(mockFinancialData));
      store.dispatch(setDCFInputs(mockDCFInputs));
      
      const analysisName = 'Test Analysis';
      store.dispatch(saveAnalysis(analysisName));
      
      const state = store.getState().analysis;
      expect(state.lastSaved).toBeDefined();
      expect(state.savedAnalyses).toHaveProperty(analysisName);
    });

    it('should load analysis', () => {
      // First save an analysis
      store.dispatch(setFinancialData(mockFinancialData));
      store.dispatch(setDCFInputs(mockDCFInputs));
      store.dispatch(saveAnalysis('Test Analysis'));
      
      // Clear current state
      store.dispatch(clearAnalysis());
      
      // Load the analysis
      store.dispatch(loadAnalysis('Test Analysis'));
      
      const state = store.getState().analysis;
      expect(state.financialData).toEqual(mockFinancialData);
      expect(state.dcf.inputs).toEqual(mockDCFInputs);
    });

    it('should clear analysis', () => {
      store.dispatch(setFinancialData(mockFinancialData));
      store.dispatch(setDCFInputs(mockDCFInputs));
      store.dispatch(clearAnalysis());
      
      const state = store.getState().analysis;
      expect(state.financialData).toBeNull();
      expect(state.adjustedValues).toEqual({});
      expect(state.dcf.inputs).toBeNull();
      expect(state.dcf.results).toBeNull();
    });
  });
});

describe('analysisStore selectors', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        analysis: analysisSlice.reducer
      }
    });
  });

  it('should select financial data', () => {
    store.dispatch(setFinancialData(mockFinancialData));
    
    const state = store.getState();
    const financialData = selectFinancialData(state);
    expect(financialData).toEqual(mockFinancialData);
  });

  it('should select DCF results', () => {
    store.dispatch(setDCFResults(mockDCFResults));
    
    const state = store.getState();
    const dcfResults = selectDCFResults(state);
    expect(dcfResults).toEqual(mockDCFResults);
  });

  it('should select scenarios', () => {
    const scenario = { id: 'test', name: 'Test Scenario' };
    store.dispatch(addScenario(scenario));
    
    const state = store.getState();
    const scenarios = selectScenarios(state);
    expect(scenarios).toHaveLength(1);
    expect(scenarios[0]).toEqual(scenario);
  });

  it('should calculate data completeness', () => {
    store.dispatch(setFinancialData(mockFinancialData));
    
    const state = store.getState();
    const completeness = selectDataCompleteness(state);
    expect(completeness).toBeGreaterThan(0);
    expect(completeness).toBeLessThanOrEqual(100);
  });

  it('should handle null financial data in completeness calculation', () => {
    const state = store.getState();
    const completeness = selectDataCompleteness(state);
    expect(completeness).toBe(0);
  });
});

describe('data integrity and validation', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        analysis: analysisSlice.reducer
      }
    });
  });

  it('should maintain state consistency across operations', () => {
    // Set up complete analysis
    store.dispatch(setFinancialData(mockFinancialData));
    store.dispatch(setDCFInputs(mockDCFInputs));
    store.dispatch(setDCFResults(mockDCFResults));
    
    const scenario = { id: 'test', name: 'Test' };
    store.dispatch(addScenario(scenario));
    
    // Verify all data is present
    const state = store.getState().analysis;
    expect(state.financialData).toBeDefined();
    expect(state.dcf.inputs).toBeDefined();
    expect(state.dcf.results).toBeDefined();
    expect(state.scenarios.scenarios).toHaveLength(1);
  });

  it('should handle partial data gracefully', () => {
    // Set only some data
    store.dispatch(setDCFInputs(mockDCFInputs));
    
    const state = store.getState().analysis;
    expect(state.dcf.inputs).toEqual(mockDCFInputs);
    expect(state.financialData).toBeNull();
    expect(state.dcf.results).toBeNull();
  });

  it('should preserve timestamps for calculations', () => {
    store.dispatch(setDCFResults(mockDCFResults));
    
    const state1 = store.getState().analysis;
    const timestamp1 = state1.dcf.lastCalculated;
    
    // Wait a moment and calculate again
    setTimeout(() => {
      store.dispatch(setDCFResults({ ...mockDCFResults, presentValue: 2600 }));
      
      const state2 = store.getState().analysis;
      const timestamp2 = state2.dcf.lastCalculated;
      
      expect(timestamp2).not.toBe(timestamp1);
      expect(new Date(timestamp2)).toBeInstanceOf(Date);
    }, 10);
  });
});
