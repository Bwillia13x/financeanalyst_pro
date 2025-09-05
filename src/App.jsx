import React, { Suspense, lazy } from 'react';

import MobileLayout from './components/Mobile/MobileLayout';
import PWAInstallPrompt from './components/PWA/PWAInstallPrompt';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { KeyboardShortcutsProvider } from './components/ui/KeyboardShortcutsProvider';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { useTheme } from './components/ui/ThemeProvider';
import { useAuth } from './contexts/AuthContext';
import { useAccessibility } from './hooks/useAccessibility';
import { usePerformanceDashboard } from './hooks/usePerformanceDashboard';
import Routes from './Routes';
import { initializePerformanceMonitoring } from './utils/performanceMonitoring';
import { initializePerformanceTracking } from './utils/performanceTracker';

function App() {
  console.log('App component rendering...');
  // Initialize performance monitoring and tracking
  React.useEffect(() => {
    initializePerformanceMonitoring();
    initializePerformanceTracking();
  }, []);

  return (
    <div className="app" data-testid="app">
      <Routes />
    </div>
  );
}

export default App;
