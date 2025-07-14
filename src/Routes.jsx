import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes as RouterRoutes, Route } from 'react-router-dom';

import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy load pages for code splitting and better performance
const FinancialModelWorkspace = lazy(() => import('./pages/financial-model-workspace'));
const RealTimeMarketDataCenter = lazy(() => import('./pages/real-time-market-data-center'));
const ScenarioAnalysisSensitivityTools = lazy(
  () => import('./pages/scenario-analysis-sensitivity-tools')
);
const NotFound = lazy(() => import('./pages/NotFound'));

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <Suspense fallback={<LoadingSpinner />}>
          <RouterRoutes>
            {/* Define your routes here */}
            <Route path="/" element={<FinancialModelWorkspace />} />
            <Route path="/financial-model-workspace" element={<FinancialModelWorkspace />} />
            <Route path="/real-time-market-data-center" element={<RealTimeMarketDataCenter />} />
            <Route
              path="/scenario-analysis-sensitivity-tools"
              element={<ScenarioAnalysisSensitivityTools />}
            />
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
