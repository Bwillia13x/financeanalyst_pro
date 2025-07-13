import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
// Add your imports here
import FinancialModelWorkspace from "pages/financial-model-workspace";
import RealTimeMarketDataCenter from "pages/real-time-market-data-center";
import ScenarioAnalysisSensitivityTools from "pages/scenario-analysis-sensitivity-tools";
import NotFound from "pages/NotFound";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your routes here */}
        <Route path="/" element={<FinancialModelWorkspace />} />
        <Route path="/financial-model-workspace" element={<FinancialModelWorkspace />} />
        <Route path="/real-time-market-data-center" element={<RealTimeMarketDataCenter />} />
        <Route path="/scenario-analysis-sensitivity-tools" element={<ScenarioAnalysisSensitivityTools />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;