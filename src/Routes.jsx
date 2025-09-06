import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';

import LoadingSpinner from './components/ui/LoadingSpinner';
import { RouteSkeleton } from './components/ui/Skeleton';
import MainLayout from './components/ui/MainLayout';
import NotFound from './pages/NotFound';
// Use compile-time flag for demo gating to enable tree-shaking
// eslint-disable-next-line no-undef
const ENABLE_DEMOS = typeof __ENABLE_DEMOS__ !== 'undefined' ? __ENABLE_DEMOS__ : false;

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
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Profile = lazy(() => import('./pages/Profile'));
const AdvancedAnalytics = lazy(() => import('./pages/AdvancedAnalytics'));
const RealtimeDashboard = lazy(() => import('./pages/RealtimeDashboard'));
const MarketAnalysis = lazy(() => import('./pages/MarketAnalysis'));
const Security = lazy(() => import('./pages/Security'));
const Performance = lazy(() => import('./pages/Performance'));
const Mobile = lazy(() => import('./pages/Mobile'));
const Changelog = lazy(() => import('./pages/Changelog'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Additional workspace and AI routes
const FinancialModelWorkspace = lazy(() => import('./pages/financial-model-workspace'));
const AIInsights = lazy(() => import('./pages/AIInsights'));
const RealtimeMarketData = lazy(() => import('./pages/real-time-market-data-center'));
const ScenarioAnalysis = lazy(() => import('./pages/scenario-analysis-sensitivity-tools'));
const ValuationTool = lazy(() => import('./pages/valuation-tool-demo'));
const AIActionLog = lazy(() => import('./pages/AIActionLog'));
const DevNav = lazy(() => import('./pages/DevNav'));

// Demo pages (gated by feature flag)
const AdvancedAnalyticsDemo = ENABLE_DEMOS
  ? lazy(() => import('./pages/AdvancedAnalyticsDemo'))
  : null;
const DataVisualizationDemo = ENABLE_DEMOS
  ? lazy(() => import('./pages/DataVisualizationDemo'))
  : null;
const EnhancedChartsDemo = ENABLE_DEMOS
  ? lazy(() => import('./pages/EnhancedChartsDemo'))
  : null;

const AppRoutes = () => {
  console.log('Routes component rendering...');
  return (
    <Suspense fallback={<RouteSkeleton />}>
      <Routes>
        {/* Public routes without layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Main layout with AI assistant */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Landing />} />
          <Route path="private-analysis" element={<PrivateAnalysis />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="model-lab" element={<ModelLab />} />
          <Route path="valuation-workbench" element={<ValuationWorkbench />} />
          <Route path="portfolio" element={<PortfolioManagement />} />
          <Route path="portfolio-management" element={<PortfolioManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="changelog" element={<Changelog />} />
          <Route path="advanced-analytics" element={<AdvancedAnalytics />} />
          <Route path="realtime-dashboard" element={<RealtimeDashboard />} />
          <Route path="market-analysis" element={<MarketAnalysis />} />
          <Route path="security" element={<Security />} />
          <Route path="performance" element={<Performance />} />
          <Route path="mobile" element={<Mobile />} />

          {/* Workspace and AI routes */}
          <Route path="financial-model-workspace" element={<FinancialModelWorkspace />} />
          <Route path="ai-insights" element={<AIInsights />} />
          <Route path="real-time-market-data" element={<RealtimeMarketData />} />
          <Route path="scenario-analysis" element={<ScenarioAnalysis />} />
          <Route path="valuation-tool" element={<ValuationTool />} />
          <Route
            path="ai-log"
            element={
              <AdminRoute>
                <AIActionLog />
              </AdminRoute>
            }
          />

          {/* Demo routes - only mount when enabled */}
          {ENABLE_DEMOS && (
            <>
              <Route path="demos/advanced-analytics" element={<AdvancedAnalyticsDemo />} />
              <Route path="demos/data-visualization" element={<DataVisualizationDemo />} />
              <Route path="demos/enhanced-charts" element={<EnhancedChartsDemo />} />
            </>
          )}

          {/* Dev-only helper nav */}
          {import.meta.env.DEV && (
            <Route path="__dev/nav" element={<DevNav />} />
          )}
        </Route>

        {/* Profile (authenticated) */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        {/* Catch-all route for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
