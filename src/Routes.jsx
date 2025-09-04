import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

import LoadingSpinner from './components/ui/LoadingSpinner';
import MainLayout from './components/ui/MainLayout';
import NotFound from './pages/NotFound';

// Lazy load components for better performance
const Landing = lazy(() => import('./pages/Landing'));
const PrivateAnalysis = lazy(() => import('./pages/PrivateAnalysis'));
const Analytics = lazy(() => import('./pages/Analytics'));
const ModelLab = lazy(() => import('./pages/ModelLab'));
const ValuationWorkbench = lazy(() => import('./pages/ValuationWorkbench'));
const PortfolioManagement = lazy(() => import('./pages/PortfolioManagement'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AdvancedAnalytics = lazy(() => import('./pages/AdvancedAnalytics'));
const RealtimeDashboard = lazy(() => import('./pages/RealtimeDashboard'));
const MarketAnalysis = lazy(() => import('./pages/MarketAnalysis'));
const Security = lazy(() => import('./pages/Security'));
const Performance = lazy(() => import('./pages/Performance'));
const Mobile = lazy(() => import('./pages/Mobile'));

// Demo pages
const AdvancedAnalyticsDemo = lazy(() => import('./pages/AdvancedAnalyticsDemo'));
const DataVisualizationDemo = lazy(() => import('./pages/DataVisualizationDemo'));
const EnhancedChartsDemo = lazy(() => import('./pages/EnhancedChartsDemo'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes without layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Main layout with AI assistant */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Landing />} />
          <Route path="private-analysis" element={<PrivateAnalysis />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="model-lab" element={<ModelLab />} />
          <Route path="valuation-workbench" element={<ValuationWorkbench />} />
          <Route path="portfolio" element={<PortfolioManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="advanced-analytics" element={<AdvancedAnalytics />} />
          <Route path="realtime-dashboard" element={<RealtimeDashboard />} />
          <Route path="market-analysis" element={<MarketAnalysis />} />
          <Route path="security" element={<Security />} />
          <Route path="performance" element={<Performance />} />
          <Route path="mobile" element={<Mobile />} />

          {/* Demo routes */}
          <Route path="demos/advanced-analytics" element={<AdvancedAnalyticsDemo />} />
          <Route path="demos/data-visualization" element={<DataVisualizationDemo />} />
          <Route path="demos/enhanced-charts" element={<EnhancedChartsDemo />} />
        </Route>

        {/* Catch-all route for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
