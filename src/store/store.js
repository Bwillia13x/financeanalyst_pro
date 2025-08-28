import { configureStore } from '@reduxjs/toolkit';

import analysisReducer from './analysisStore';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    analysis: analysisReducer
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
