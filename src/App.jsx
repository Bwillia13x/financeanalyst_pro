import { useEffect } from 'react';

import { ErrorBoundaryProvider } from './components/ErrorBoundary';
import PerformanceDashboard from './components/PerformanceDashboard';
import SEOProvider from './components/SEO/SEOProvider';
import { usePerformanceDashboard } from './hooks/usePerformanceDashboard';
import Routes from './Routes';
import { initializePerformanceMonitoring } from './utils/performanceMonitoring';

function App() {
  const { isVisible, hideDashboard } = usePerformanceDashboard();

  // Initialize performance monitoring on app start
  useEffect(() => {
    initializePerformanceMonitoring();
  }, []);

  return (
    <ErrorBoundaryProvider>
      <SEOProvider>
        <Routes />
        <PerformanceDashboard
          isVisible={isVisible}
          onClose={hideDashboard}
        />
      </SEOProvider>
    </ErrorBoundaryProvider>
  );
}

export default App;
