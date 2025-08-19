import { useEffect, useState } from 'react';

import AIFinancialAssistant from './components/AIAssistant/AIFinancialAssistant';
import PersistentCLI from './components/CLI/PersistentCLI';
import ErrorBoundary from './components/ErrorBoundary';
import PerformanceDashboard from './components/PerformanceDashboard';
import SEOProvider from './components/SEO/SEOProvider';
import { usePerformanceDashboard } from './hooks/usePerformanceDashboard';
import Routes from './Routes';
import { initializePerformanceMonitoring } from './utils/performanceMonitoring';

function App() {
  const { isVisible, hideDashboard } = usePerformanceDashboard();
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState({
    path: window.location.pathname,
    timestamp: new Date().toISOString()
  });
  const [portfolioData, setPortfolioData] = useState(null);
  const [marketData, setMarketData] = useState(null);

  // Initialize performance monitoring on app start
  useEffect(() => {
    initializePerformanceMonitoring();
  }, []);

  // Update context when route changes
  useEffect(() => {
    setCurrentContext({
      path: window.location.pathname,
      timestamp: new Date().toISOString()
    });
  }, [window.location.pathname]);

  // Global keyboard shortcut for AI Assistant (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsAIAssistantOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleNavigation = (route) => {
    window.location.href = route;
  };

  return (
    <ErrorBoundary>
      <SEOProvider>
        <Routes />
        <PerformanceDashboard
          isVisible={isVisible}
          onClose={hideDashboard}
        />
        <AIFinancialAssistant
          isOpen={isAIAssistantOpen}
          onToggle={() => setIsAIAssistantOpen(prev => !prev)}
          currentContext={currentContext}
          portfolioData={portfolioData}
          marketData={marketData}
        />

        {/* Persistent CLI - Always visible at bottom */}
        <PersistentCLI
          currentContext={currentContext}
          portfolioData={portfolioData}
          marketData={marketData}
          onNavigate={handleNavigation}
        />

        {/* Floating AI Assistant Button */}
        {!isAIAssistantOpen && (
          <button
            onClick={() => setIsAIAssistantOpen(true)}
            className="fixed bottom-20 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200 z-40"
            title="Open AI Financial Assistant (Cmd+K)"
          >
            <svg
              className="w-6 h-6" fill="none" stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </button>
        )}
      </SEOProvider>
    </ErrorBoundary>
  );
}

export default App;
