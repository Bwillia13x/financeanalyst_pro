import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes as RouterRoutes, Route, useLocation } from 'react-router-dom';

import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import { KeyboardShortcutsProvider } from './components/ui/KeyboardShortcutsProvider';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy load pages for code splitting and better performance
const FinancialModelWorkspace = lazy(() => import('./pages/financial-model-workspace'));
const Home = lazy(() => import('./pages/Landing'));
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
const AdvancedCharting = lazy(() => import('./pages/AdvancedCharting'));
const MarketAnalysis = lazy(() => import('./pages/MarketAnalysis'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const AIInsights = lazy(() => import('./pages/AIInsights'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AdvancedAnalytics = lazy(() => import('./pages/AdvancedAnalytics'));
const FinancialInputsDemo = lazy(() => import('./components/FinancialInputsDemo'));
const Models = lazy(() => import('./pages/Models'));
const App = lazy(() => import('./pages/App'));
const Data = lazy(() => import('./pages/Data'));
const Integrations = lazy(() => import('./pages/Integrations'));
const NotFound = lazy(() => import('./pages/NotFound'));
const MonitoringDebugPanel = lazy(() => import('./components/MonitoringDebugPanel'));

// Detect automated/CI environments (Playwright, LHCI, etc.)
const isAutomatedEnv = (() => {
  try {
    const params = new URLSearchParams(window.location.search);
    return (
      navigator.webdriver === true || params.has('lhci') || params.has('ci') || params.has('audit')
    );
  } catch {
    return navigator.webdriver === true;
  }
})();

// Track route changes for analytics (disabled in automated envs)
const RouteChangeTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname + (location.search || '');
    if (isAutomatedEnv) return;
    // Dynamically import monitoring to avoid side effects during tests
    import('./utils/monitoring')
      .then(mod => {
        if (mod?.default?.trackPageView) {
          mod.default.trackPageView(path);
        }
      })
      .catch(() => {
        // Optional analytics; ignore errors in non-critical paths
      });
  }, [location.pathname, location.search]);

  return null;
};

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouteChangeTracker />
        <KeyboardShortcutsProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <RouterRoutes>
              {/* Define your routes here */}
              <Route path="/" element={<Home />} />
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
              <Route path="/advanced-charts" element={<AdvancedCharting />} />
              <Route path="/market-analysis" element={<MarketAnalysis />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/ai-insights" element={<AIInsights />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/advanced-analytics" element={<AdvancedAnalytics />} />
              <Route path="/portfolio-management" element={<PortfolioManagement />} />
              <Route path="/portfolio" element={<PortfolioManagement />} />
              <Route path="/models" element={<Models />} />
              <Route path="/app" element={<App />} />
              <Route path="/data" element={<Data />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/canvas" element={<ThesisCanvas />} />
              <Route path="/private-analysis" element={<PrivateAnalysis />} />
              <Route path="/financial-inputs-demo" element={<FinancialInputsDemo />} />
              {(import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true' ||
                import.meta.env.VITE_APP_ENV !== 'production') && (
                <Route path="/monitoring-debug" element={<MonitoringDebugPanel />} />
              )}
              <Route path="*" element={<NotFound />} />
            </RouterRoutes>
          </Suspense>
        </KeyboardShortcutsProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
