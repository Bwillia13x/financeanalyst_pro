import React, { Suspense, lazy } from 'react';
import Routes from './Routes';
import PWAInstallPrompt from './components/PWA/PWAInstallPrompt';
import { KeyboardShortcutsProvider } from './components/ui/KeyboardShortcutsProvider';
import MobileLayout from './components/Mobile/MobileLayout';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ui/ErrorBoundary';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './components/ui/ThemeProvider';
import { usePerformanceDashboard } from './hooks/usePerformanceDashboard';
import { useAccessibility } from './hooks/useAccessibility';
import { initializePerformanceMonitoring } from './utils/performanceMonitoring';

function App() {
  // Initialize performance monitoring only
  React.useEffect(() => {
    initializePerformanceMonitoring();
  }, []);

  return (
    <div className="app" data-testid="app">
      <Routes />
    </div>
  );
}

export default App;
