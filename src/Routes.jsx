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
const ValuationTool = lazy(() => import('./components/ValuationTool/ValuationTool'));
const ValuationToolDocs = lazy(() => import('./components/ValuationTool/ValuationToolDocs'));
const ValuationToolDemo = lazy(() => import('./pages/valuation-tool-demo'));
const PrivateAnalysis = lazy(() => import('./pages/PrivateAnalysis'));
const ValuationWorkbench = lazy(() => import('./pages/ValuationWorkbench'));
const ModelLab = lazy(() => import('./pages/ModelLab'));
const PortfolioManagement = lazy(() => import('./pages/PortfolioManagement'));
const ThesisCanvas = lazy(() => import('./pages/ThesisCanvas'));
const FinancialInputsDemo = lazy(() => import('./components/FinancialInputsDemo'));
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
            <Route path="/valuation-tool" element={<ValuationTool />} />
            <Route path="/valuation-tool/docs" element={<ValuationToolDocs />} />
            <Route path="/valuation-tool/demo" element={<ValuationToolDemo />} />
            <Route path="/valuation-workbench" element={<ValuationWorkbench />} />
            <Route path="/model-lab" element={<ModelLab />} />
            <Route path="/portfolio-management" element={<PortfolioManagement />} />
            <Route path="/canvas" element={<ThesisCanvas />} />
            <Route path="/private-analysis" element={<PrivateAnalysis />} />
            <Route path="/financial-inputs-demo" element={<FinancialInputsDemo />} />
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
