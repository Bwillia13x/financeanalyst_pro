import { lazy } from 'react';

/**
 * Lazy-loaded components for code splitting and bundle optimization
 * Reduces initial bundle size by loading components on demand
 */

// Core Analysis Components
export const LazyFinancialSpreadsheet = lazy(
  () => import('../components/PrivateAnalysis/FinancialSpreadsheet')
);

export const LazyModelingTools = lazy(() => import('../components/PrivateAnalysis/ModelingTools'));

export const LazyAnalysisResults = lazy(
  () => import('../components/PrivateAnalysis/AnalysisResults')
);

// Advanced Analysis Tools
export const LazyAdvancedLBOTool = lazy(
  () => import('../components/PrivateAnalysis/AdvancedLBOTool')
);

export const LazyFinancialModelWorkspace = lazy(
  () => import('../components/PrivateAnalysis/FinancialModelWorkspace')
);

export const LazyEnhancedScenarioAnalysis = lazy(
  () => import('../components/PrivateAnalysis/EnhancedScenarioAnalysis')
);

export const LazyEnhancedMarketDataDashboard = lazy(
  () => import('../components/PrivateAnalysis/EnhancedMarketDataDashboard')
);

export const LazyMonteCarloIntegrationHub = lazy(
  () => import('../components/PrivateAnalysis/MonteCarloIntegrationHub')
);

export const LazyDataExportImport = lazy(() => import('../components/DataExportImport'));

// Page Components
export const LazyPortfolioManagement = lazy(() => import('../pages/PortfolioManagement'));

export const LazyMarketAnalysis = lazy(() => import('../pages/MarketAnalysis'));

// Chart and Visualization Components
export const LazyAdvancedFinancialCharts = lazy(
  () => import('../components/ui/AdvancedFinancialCharts')
);

export const LazyVirtualizedTable = lazy(() => import('../components/ui/VirtualizedTable'));

export const LazyVirtualizedFinancialSpreadsheet = lazy(
  () => import('../components/PrivateAnalysis/VirtualizedFinancialSpreadsheet')
);

// Heavy UI Components
export const LazyContextualInsightsSidebar = lazy(
  () => import('../components/PrivateAnalysis/ContextualInsightsSidebar')
);

// Export-related components (heavy dependencies)
export const LazyExportService = lazy(() =>
  import('../services/exportService').then(module => ({ default: module.default }))
);

/**
 * Preload strategies for better user experience
 */
export const preloadCriticalComponents = () => {
  // Preload components likely to be used immediately after page load
  import('../components/PrivateAnalysis/FinancialSpreadsheet');
  import('../components/PrivateAnalysis/ModelingTools');
};

export const preloadAnalysisComponents = () => {
  // Preload when user starts working with data
  import('../components/PrivateAnalysis/AnalysisResults');
  import('../components/ui/AdvancedFinancialCharts');
};

export const preloadAdvancedTools = () => {
  // Preload when user demonstrates advanced usage
  import('../components/PrivateAnalysis/AdvancedLBOTool');
  import('../components/PrivateAnalysis/EnhancedScenarioAnalysis');
  import('../components/PrivateAnalysis/MonteCarloIntegrationHub');
};

export const preloadExportTools = () => {
  // Preload when user shows intent to export
  import('../services/exportService');
  import('../components/DataExportImport');
};
