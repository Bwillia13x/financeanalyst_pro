import React, { Suspense, lazy, useState } from 'react';
import { Bot, Download, Command } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const AIFinancialAssistant = lazy(() => import('../AIAssistant/AIFinancialAssistant'));
const ExportPanel = lazy(() => import('../ExportPanel/ExportPanel'));
// CLI is mounted globally in App
import OfflineIndicator from '../PWA/OfflineIndicator';
import PWAInstallPrompt from '../PWA/PWAInstallPrompt';
import Header from './Header';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);
  // CLI visibility is managed globally in App

  const toggleAIAssistant = () => {
    setIsAIAssistantOpen(!isAIAssistantOpen);
  };

  const toggleCLI = () => {
    window.dispatchEvent(new Event('toggle-cli'));
  };

  const toggleExportPanel = () => {
    setIsExportPanelOpen(!isExportPanelOpen);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
            <Header />
      <main className="flex-1 pt-[60px]" id="main-content" role="main" tabIndex="-1" aria-label="Main content">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {import.meta.env.DEV && (
            <div className="mb-4 rounded-md border border-dashed border-border bg-muted p-3 text-xs flex items-center justify-between" data-testid="dev-banner">
              <span className="text-muted-foreground">Development build active</span>
              <button
                type="button"
                onClick={() => navigate('/__dev/nav')}
                className="px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90"
                aria-label="Open Dev Navigation (Alt+D)"
                title="Open Dev Navigation (Alt+D)"
              >
                Open DevNav (Alt+D)
              </button>
            </div>
          )}
          {/* Route debugging hook for tests */}
          <div data-testid="route-path" data-path={location.pathname} className="hidden" />
          <Outlet />
        </div>
      </main>

      {/* PWA Components */}
      <OfflineIndicator />
      <PWAInstallPrompt />

      {/* Minimal Floating Actions */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2">
        <button
          onClick={toggleExportPanel}
          className="bg-secondary text-secondary-foreground p-3 rounded-full shadow-elevation-2 hover:shadow-elevation-1 transition-smooth focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Export"
          title="Export"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={toggleAIAssistant}
          className="bg-primary text-primary-foreground p-3 rounded-full shadow-elevation-2 hover:shadow-elevation-1 transition-smooth focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="AI Assistant"
          title="AI Assistant"
        >
          <Bot className="w-5 h-5" />
        </button>
        <button
          onClick={toggleCLI}
          className="bg-foreground text-background p-3 rounded-full shadow-elevation-2 hover:shadow-elevation-1 transition-smooth focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="CLI"
          title="CLI"
        >
          <Command className="w-5 h-5" />
        </button>
      </div>

      {/* AI Assistant Component */}
      <Suspense fallback={null}>
        <AIFinancialAssistant
          isOpen={isAIAssistantOpen}
          onToggle={toggleAIAssistant}
          currentContext={{ page: 'main' }}
        />
      </Suspense>

      {/* Export Panel Component */}
      <Suspense fallback={null}>
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
      </Suspense>
      {/* CLI is mounted globally in App */}
    </div>
  );
};

export default MainLayout;
