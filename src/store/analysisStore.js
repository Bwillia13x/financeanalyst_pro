import { configureStore, createSlice } from '@reduxjs/toolkit';

// Analysis slice for unified state management
const analysisSlice = createSlice({
  name: 'analysis',
  initialState: {
    // Financial data shared across all models
    financialData: null,
    adjustedValues: {},

    // Model-specific results
    dcf: {
      inputs: null,
      results: null,
      status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
      error: null,
      lastCalculated: null
    },
    lbo: {
      inputs: null,
      results: null,
      status: 'idle',
      error: null,
      lastCalculated: null
    },
    threeStatement: {
      inputs: null,
      results: null,
      status: 'idle',
      error: null,
      lastCalculated: null
    },
    scenarios: {
      scenarios: [],
      results: null,
      status: 'idle',
      error: null,
      lastCalculated: null
    },
    monteCarlo: {
      settings: {
        iterations: 10000,
        confidenceLevel: 0.95,
        correlationsEnabled: true,
        crossModelAnalysis: true
      },
      results: null,
      status: 'idle',
      error: null,
      lastCalculated: null
    },

    // Cross-model analysis
    correlations: {
      dcfLbo: null,
      dcfScenarios: null,
      lboScenarios: null
    },

    // UI state
    activeModel: 'dcf', // 'dcf' | 'lbo' | 'threeStatement' | 'scenarios' | 'monteCarlo'
    isDirty: false,
    lastSaved: null,

    // Collaboration state
    collaborators: [],
    isCollaborationEnabled: false,

    // Performance tracking
    calculationTimes: {},

    // Persistence
    savedAnalyses: {}
  },
  reducers: {
    // Financial data management
    setFinancialData: (state, action) => {
      state.financialData = action.payload;
      state.isDirty = true;
    },
    setAdjustedValues: (state, action) => {
      state.adjustedValues = { ...state.adjustedValues, ...action.payload };
      state.isDirty = true;
    },

    // DCF actions
    setDcfInputs: (state, action) => {
      state.dcf.inputs = action.payload;
      state.isDirty = true;
    },
    setDcfLoading: state => {
      state.dcf.status = 'loading';
      state.dcf.error = null;
    },
    setDcfResults: (state, action) => {
      if (action.payload && action.payload.error) {
        // Handle error case
        state.dcf.results = null;
        state.dcf.error = action.payload.error;
        state.dcf.status = 'failed';
      } else {
        // Handle success case
        state.dcf.results = action.payload;
        state.dcf.status = 'succeeded';
        state.dcf.error = null;
        state.dcf.lastCalculated = new Date().toISOString();
      }
      state.isDirty = true;
    },
    setDcfError: (state, action) => {
      state.dcf.error = action.payload;
      state.dcf.status = 'failed';
    },

    // LBO actions
    setLboInputs: (state, action) => {
      state.lbo.inputs = action.payload;
      state.isDirty = true;
    },
    setLboLoading: state => {
      state.lbo.status = 'loading';
      state.lbo.error = null;
    },
    setLboResults: (state, action) => {
      state.lbo.results = action.payload;
      state.lbo.status = 'succeeded';
      state.lbo.lastCalculated = new Date().toISOString();
      state.isDirty = true;
    },
    setLboError: (state, action) => {
      state.lbo.error = action.payload;
      state.lbo.status = 'failed';
    },

    // 3-Statement model actions
    setThreeStatementInputs: (state, action) => {
      state.threeStatement.inputs = action.payload;
      state.isDirty = true;
    },
    setThreeStatementLoading: state => {
      state.threeStatement.status = 'loading';
      state.threeStatement.error = null;
    },
    setThreeStatementResults: (state, action) => {
      state.threeStatement.results = action.payload;
      state.threeStatement.status = 'succeeded';
      state.threeStatement.lastCalculated = new Date().toISOString();
      state.isDirty = true;
    },
    setThreeStatementError: (state, action) => {
      state.threeStatement.error = action.payload;
      state.threeStatement.status = 'failed';
    },

    // Scenario analysis actions
    setScenarios: (state, action) => {
      state.scenarios.scenarios = action.payload;
      state.isDirty = true;
    },
    addScenario: (state, action) => {
      state.scenarios.scenarios.push(action.payload);
      state.isDirty = true;
    },
    updateScenario: (state, action) => {
      // Handle both { id, updates } and entire scenario object patterns
      let id, updates;
      if (action.payload.updates) {
        ({ id, updates } = action.payload);
      } else {
        // Assume entire scenario object is passed
        id = action.payload.id;
        updates = action.payload;
      }

      const index = state.scenarios.scenarios.findIndex(s => s.id === id);
      if (index !== -1) {
        state.scenarios.scenarios[index] = { ...state.scenarios.scenarios[index], ...updates };
        state.isDirty = true;
      }
    },
    removeScenario: (state, action) => {
      state.scenarios.scenarios = state.scenarios.scenarios.filter(s => s.id !== action.payload);
      state.isDirty = true;
    },
    setScenariosLoading: state => {
      state.scenarios.status = 'loading';
      state.scenarios.error = null;
    },
    setScenariosResults: (state, action) => {
      state.scenarios.results = action.payload;
      state.scenarios.status = 'succeeded';
      state.scenarios.lastCalculated = new Date().toISOString();
      state.isDirty = true;
    },
    setScenariosError: (state, action) => {
      state.scenarios.error = action.payload;
      state.scenarios.status = 'failed';
    },

    // Monte Carlo actions
    setMonteCarloSettings: (state, action) => {
      state.monteCarlo.settings = { ...state.monteCarlo.settings, ...action.payload };
      state.isDirty = true;
    },
    setMonteCarloLoading: state => {
      state.monteCarlo.status = 'loading';
      state.monteCarlo.error = null;
    },
    setMonteCarloResults: (state, action) => {
      state.monteCarlo.results = action.payload;
      state.monteCarlo.status = 'succeeded';
      state.monteCarlo.lastCalculated = new Date().toISOString();
      state.isDirty = true;
    },
    setMonteCarloError: (state, action) => {
      state.monteCarlo.error = action.payload;
      state.monteCarlo.status = 'failed';
    },

    // Cross-model correlation tracking
    setCorrelations: (state, action) => {
      state.correlations = { ...state.correlations, ...action.payload };
    },

    // UI state management
    setActiveModel: (state, action) => {
      state.activeModel = action.payload;
    },

    // Persistence actions
    saveAnalysis: (state, action) => {
      // Handle both string name and object payload
      const name = typeof action.payload === 'string' ? action.payload : action.payload.name;
      const id = typeof action.payload === 'object' ? action.payload.id : undefined;

      const analysis = {
        id: id || Date.now().toString(),
        name,
        timestamp: new Date().toISOString(),
        financialData: state.financialData,
        adjustedValues: state.adjustedValues,
        models: {
          dcf: state.dcf,
          lbo: state.lbo,
          threeStatement: state.threeStatement,
          scenarios: state.scenarios,
          monteCarlo: state.monteCarlo
        },
        correlations: state.correlations
      };

      // Store as object with name as key
      state.savedAnalyses[name] = analysis;
      state.isDirty = false;
      state.lastSaved = analysis.timestamp;
    },

    loadAnalysis: (state, action) => {
      // Handle both analysis name string and analysis object
      let analysis;
      if (typeof action.payload === 'string') {
        // Loading by name
        analysis = state.savedAnalyses[action.payload];
        if (!analysis) {
          console.warn(`Analysis '${action.payload}' not found`);
          return;
        }
      } else {
        // Loading by object
        analysis = action.payload;
      }

      state.financialData = analysis.financialData;
      state.adjustedValues = analysis.adjustedValues;
      state.dcf = analysis.models?.dcf || state.dcf;
      state.lbo = analysis.models?.lbo || state.lbo;
      state.threeStatement = analysis.models?.threeStatement || state.threeStatement;
      state.scenarios = analysis.models?.scenarios || state.scenarios;
      state.monteCarlo = analysis.models?.monteCarlo || state.monteCarlo;
      state.correlations = analysis.correlations || {};
      state.isDirty = false;
      state.lastSaved = analysis.timestamp;
    },

    deleteAnalysis: (state, action) => {
      // Handle deletion by name or id
      if (typeof action.payload === 'string') {
        // Try deleting by name first
        if (state.savedAnalyses[action.payload]) {
          delete state.savedAnalyses[action.payload];
        } else {
          // Try deleting by id
          for (const [name, analysis] of Object.entries(state.savedAnalyses)) {
            if (analysis.id === action.payload) {
              delete state.savedAnalyses[name];
              break;
            }
          }
        }
      }
    },

    // Collaboration actions
    setCollaborators: (state, action) => {
      state.collaborators = action.payload;
    },
    enableCollaboration: state => {
      state.isCollaborationEnabled = true;
    },
    disableCollaboration: state => {
      state.isCollaborationEnabled = false;
      state.collaborators = [];
    },

    // Performance tracking
    recordCalculationTime: (state, action) => {
      const { model, duration } = action.payload;
      state.calculationTimes[model] = {
        lastDuration: duration,
        timestamp: new Date().toISOString()
      };
    },

    // Reset actions
    resetModel: (state, action) => {
      const model = action.payload;
      state[model] = {
        inputs: null,
        results: null,
        status: 'idle',
        error: null,
        lastCalculated: null
      };
      state.isDirty = true;
    },

    resetAll: state => {
      // Preserve saved analyses when resetting
      const savedAnalyses = state.savedAnalyses;
      Object.assign(state, analysisSlice.getInitialState());
      state.savedAnalyses = savedAnalyses;
    }
  }
});

// Export actions
export const {
  setFinancialData,
  setAdjustedValues,
  setDcfInputs,
  setDcfLoading,
  setDcfResults,
  setDcfError,
  setLboInputs,
  setLboLoading,
  setLboResults,
  setLboError,
  setThreeStatementInputs,
  setThreeStatementLoading,
  setThreeStatementResults,
  setThreeStatementError,
  setScenarios,
  addScenario,
  updateScenario,
  removeScenario,
  setScenariosLoading,
  setScenariosResults,
  setScenariosError,
  setMonteCarloSettings,
  setMonteCarloLoading,
  setMonteCarloResults,
  setMonteCarloError,
  setCorrelations,
  setActiveModel,
  saveAnalysis,
  loadAnalysis,
  deleteAnalysis,
  setCollaborators,
  enableCollaboration,
  disableCollaboration,
  recordCalculationTime,
  resetModel,
  resetAll
} = analysisSlice.actions;

// Selectors
export const selectFinancialData = state => state.analysis.financialData;
export const selectAdjustedValues = state => state.analysis.adjustedValues;
export const selectDcf = state => state.analysis.dcf;
export const selectLbo = state => state.analysis.lbo;
export const selectThreeStatement = state => state.analysis.threeStatement;
export const selectScenarios = state => state.analysis.scenarios.scenarios;
export const selectMonteCarlo = state => state.analysis.monteCarlo;
export const selectCorrelations = state => state.analysis.correlations;
export const selectActiveModel = state => state.analysis.activeModel;
export const selectIsDirty = state => state.analysis.isDirty;
export const selectLastSaved = state => state.analysis.lastSaved;
export const selectSavedAnalyses = state => state.analysis.savedAnalyses;
export const selectCollaborators = state => state.analysis.collaborators;
export const selectIsCollaborationEnabled = state => state.analysis.isCollaborationEnabled;
export const selectCalculationTimes = state => state.analysis.calculationTimes;

// Computed selectors
export const selectIsAnyModelLoading = state => {
  return (
    state.analysis.dcf.status === 'loading' ||
    state.analysis.lbo.status === 'loading' ||
    state.analysis.threeStatement.status === 'loading' ||
    state.analysis.scenarios.status === 'loading' ||
    state.analysis.monteCarlo.status === 'loading'
  );
};

export const selectModelResults = state => ({
  dcf: state.analysis.dcf.results,
  lbo: state.analysis.lbo.results,
  threeStatement: state.analysis.threeStatement.results,
  scenarios: state.analysis.scenarios.results,
  monteCarlo: state.analysis.monteCarlo.results
});

export const selectDataCompleteness = state => {
  const financialData = state.analysis.financialData;
  if (!financialData?.statements) return 0;

  const coreFields = ['totalRevenue', 'totalCostOfGoodsSold', 'operatingIncome', 'netIncome'];
  const completedFields = coreFields.filter(
    field => financialData.statements.incomeStatement?.[field]?.[2] !== undefined
  ).length;

  return Math.round((completedFields / coreFields.length) * 100);
};

// Configure store
export const store = configureStore({
  reducer: {
    analysis: analysisSlice.reducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['analysis/saveAnalysis', 'analysis/loadAnalysis'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['analysis.lastSaved', 'analysis.dcf.lastCalculated']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

export default analysisSlice.reducer;
