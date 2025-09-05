import { Bot, Download, BarChart3, Shield } from 'lucide-react';
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';

// Temporarily commenting out complex imports for debugging:
// import IndustryAnalyticsDashboard from '../IndustryAnalytics/IndustryAnalyticsDashboard';
// import OfflineIndicator from '../PWA/OfflineIndicator';
// import PWAInstallPrompt from '../PWA/PWAInstallPrompt';
import AIFinancialAssistant from '../AIAssistant/AIFinancialAssistant';
import ExportPanel from '../ExportPanel/ExportPanel';
// import IndustryAnalyticsDashboard from '../IndustryAnalytics/IndustryAnalyticsDashboard';
// import IndustryAnalyticsDashboard from '../IndustryAnalytics/IndustryAnalyticsDashboard';
// import IndustryAnalyticsDashboard from '../IndustryAnalytics/IndustryAnalyticsDashboard';
// import IndustryAnalyticsDashboard from '../IndustryAnalytics/IndustryAnalyticsDashboard';
// import IndustryAnalyticsDashboard from '../IndustryAnalytics/IndustryAnalyticsDashboard';
// import IndustryAnalyticsDashboard from '../IndustryAnalytics/IndustryAnalyticsDashboard';
import IndustryAnalyticsDashboard from '../IndustryAnalytics/IndustryAnalyticsDashboard';
// const IndustryAnalyticsDashboard = () => null;
// Placeholder components for disabled complex imports
// const IndustryAnalyticsDashboard = () => null;
// const OfflineIndicator = () => null;
// const PWAInstallPrompt = () => null;
// const IndustryAnalyticsDashboard = () => null;
// const OfflineIndicator = () => null;
// const IndustryAnalyticsDashboard = () => null;
// const OfflineIndicator = () => null;
// const PWAInstallPrompt = () => null;
// const IndustryAnalyticsDashboard = () => null;
// const OfflineIndicator = () => null;
// const PWAInstallPrompt = () => null;
// const IndustryAnalyticsDashboard = () => null;
// const OfflineIndicator = () => null;
// const PWAInstallPrompt = () => null;
// const PWAInstallPrompt = () => null;
// Commented out placeholder now that components are imported
// const OfflineIndicator = () => null;
// const PWAInstallPrompt = () => null;
// Commented out complex dashboard states for debugging
// import OfflineIndicator from '../PWA/OfflineIndicator';
// import PWAInstallPrompt from '../PWA/PWAInstallPrompt';
// import RiskManagementDashboard from '../RiskManagement/RiskManagementDashboard';
// const [isIndustryAnalyticsOpen, setIsIndustryAnalyticsOpen] = useState(false);
// import OfflineIndicator from '../PWA/OfflineIndicator';
// import PWAInstallPrompt from '../PWA/PWAInstallPrompt';
// import RiskManagementDashboard from '../RiskManagement/RiskManagementDashboard';
// const [isRiskManagementOpen, setIsRiskManagementOpen] = useState(false);
// import OfflineIndicator from '../PWA/OfflineIndicator';
// import PWAInstallPrompt from '../PWA/PWAInstallPrompt';
// import OfflineIndicator from '../PWA/OfflineIndicator';
// import PWAInstallPrompt from '../PWA/PWAInstallPrompt';
// import RiskManagementDashboard from '../RiskManagement/RiskManagementDashboard';
// import OfflineIndicator from '../PWA/OfflineIndicator';
// import PWAInstallPrompt from '../PWA/PWAInstallPrompt';
// import RiskManagementDashboard from '../RiskManagement/RiskManagementDashboard';
// import OfflineIndicator from '../PWA/OfflineIndicator';
// import PWAInstallPrompt from '../PWA/PWAInstallPrompt';
// import RiskManagementDashboard from '../RiskManagement/RiskManagementDashboard';
// import RiskManagementDashboard from '../RiskManagement/RiskManagementDashboard';
import OfflineIndicator from '../PWA/OfflineIndicator';
import PWAInstallPrompt from '../PWA/PWAInstallPrompt';
import RiskManagementDashboard from '../RiskManagement/RiskManagementDashboard';

import Header from './Header';

const MainLayout = () => {
  console.log('MainLayout component rendering...');
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);
  const [isIndustryAnalyticsOpen, setIsIndustryAnalyticsOpen] = useState(false);
// Commented out toggle functions for debugging
// const toggleIndustryAnalytics = () => {
//   setIsIndustryAnalyticsOpen(!isIndustryAnalyticsOpen);
// };

// const toggleRiskManagement = () => {
//   setIsRiskManagementOpen(!isRiskManagementOpen);
// };
  const [isRiskManagementOpen, setIsRiskManagementOpen] = useState(false);

  const toggleAIAssistant = () => {
    setIsAIAssistantOpen(!isAIAssistantOpen);
  };

  const toggleExportPanel = () => {
    setIsExportPanelOpen(!isExportPanelOpen);
  };

  const toggleIndustryAnalytics = () => {
    setIsIndustryAnalyticsOpen(!isIndustryAnalyticsOpen);
  };

  const toggleRiskManagement = () => {
    setIsRiskManagementOpen(!isRiskManagementOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Disabled complex PWA components for debugging */}
      {/* <OfflineIndicator />
      <PWAInstallPrompt /> */}
      <Header />

      <main className="flex-1">
      {/* <OfflineIndicator /> */}
      {/* <PWAInstallPrompt /> */}
      {/* <OfflineIndicator /> */}
      {/* <PWAInstallPrompt /> */}
      {/* <OfflineIndicator /> */}
      {/* <PWAInstallPrompt /> */}
      {/* Disabled PWA Components */}
      {/* <OfflineIndicator /> */}
      {/* <PWAInstallPrompt /> */}
        <Outlet />
      </main>

      {/* PWA Components */}
      <OfflineIndicator />
      <PWAInstallPrompt />

      {/* Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3">
        {/* Risk Management Button */}
        <button
          onClick={toggleRiskManagement}
          className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
          aria-label="Risk Management"
          title="Risk Assessment & Management"
        >
          <Shield className="w-6 h-6" />
        </button>

        {/* Industry Analytics Button */}
        <button
          onClick={toggleIndustryAnalytics}
          className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300"
          aria-label="Industry Analytics"
          title="Industry-Specific Analytics"
        >
          <BarChart3 className="w-6 h-6" />
        </button>

        {/* Export Button */}
        <button
          onClick={toggleExportPanel}
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
          aria-label="Export Data"
          title="Export Data"
        >
          <Download className="w-6 h-6" />
        </button>

        {/* AI Assistant Toggle Button */}
        <button
          onClick={toggleAIAssistant}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
          aria-label="Toggle AI Assistant"
          title="AI Financial Assistant"
        >
          <Bot className="w-6 h-6" />
        </button>
      </div>

      {/* AI Assistant Component */}
      <AIFinancialAssistant
        isOpen={isAIAssistantOpen}
        onToggle={toggleAIAssistant}
        currentContext={{ page: 'main' }}
      />

      {/* Export Panel Component */}
      <ExportPanel
        isOpen={isExportPanelOpen}
        onClose={toggleExportPanel}
        data={{
          // Sample data - in real usage this would come from current page/context
          summary: {
            totalAssets: 1000000,
            totalLiabilities: 500000,
            netWorth: 500000
          },
          portfolio: [
            { symbol: 'AAPL', shares: 100, price: 150.0, value: 15000.0 },
            { symbol: 'GOOGL', shares: 50, price: 2800.0, value: 140000.0 }
          ]
        }}
      />
      {/* Disabled complex components for debugging */}
      {/* <IndustryAnalyticsDashboard
        isOpen={isIndustryAnalyticsOpen}
        onClose={toggleIndustryAnalytics}
      />

      <RiskManagementDashboard
        isOpen={isRiskManagementOpen}
        onClose={toggleRiskManagement}
        portfolioData={{
          assets: [
            { type: 'equity', value: 500000, riskRating: 'medium', sector: 'technology' },
            { type: 'bond', value: 300000, riskRating: 'low', sector: 'government' },
            { type: 'derivative', value: 100000, riskRating: 'high', sector: 'commodity' }
          ],
          liabilities: [
            { type: 'debt', value: 200000, interestRate: 0.05, maturity: 5 },
            { type: 'equity', value: 700000, dividend: 0.03 }
          ],
          marketConditions: {
            volatility: 0.25,
            interestRate: 0.045,
            gdpGrowth: 0.025
          }
        }}
      /> */}
      {/* Disabled Industry Analytics Dashboard */}
      {/* <IndustryAnalyticsDashboard
        isOpen={isIndustryAnalyticsOpen}
        onClose={toggleIndustryAnalytics}
      {/* Disabled Risk Management Dashboard */}

      {/* Industry Analytics Dashboard */}
      <IndustryAnalyticsDashboard
        isOpen={isIndustryAnalyticsOpen}
        onClose={toggleIndustryAnalytics}
      />

      {/* Risk Management Dashboard */}
      <RiskManagementDashboard
        isOpen={isRiskManagementOpen}
        onClose={toggleRiskManagement}
        portfolioData={{
          assets: [
            { type: 'equity', value: 500000, riskRating: 'medium', sector: 'technology' },
            { type: 'bond', value: 300000, riskRating: 'low', sector: 'government' },
            { type: 'derivative', value: 100000, riskRating: 'high', sector: 'commodity' }
          ],
          liabilities: [
            { type: 'debt', value: 200000, interestRate: 0.05, maturity: 5 },
            { type: 'equity', value: 700000, dividend: 0.03 }
          ],
          marketConditions: {
            volatility: 0.25,
            interestRate: 0.045,
            gdpGrowth: 0.025
          }
        }}
      />
    </div>
  );
};

export default MainLayout;
