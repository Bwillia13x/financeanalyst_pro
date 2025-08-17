import { useEffect, useState } from 'react';

import CommandPalette from './components/CommandPalette/CommandPalette';
import ErrorBoundary from './components/ErrorBoundary';
import PerformanceDashboard from './components/PerformanceDashboard';
import SEOProvider from './components/SEO/SEOProvider';
import { usePerformanceDashboard } from './hooks/usePerformanceDashboard';
import Routes from './Routes';
import { initializePerformanceMonitoring } from './utils/performanceMonitoring';

function App() {
  const { isVisible, hideDashboard } = usePerformanceDashboard();
  const [isPaletteOpen, setPaletteOpen] = useState(false);

  // Initialize performance monitoring on app start
  useEffect(() => {
    initializePerformanceMonitoring();
  }, []);

  // Global keyboard shortcut for Command Palette (Cmd/Ctrl + K)
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const isTyping = ['input', 'textarea', 'select'].includes(tag) || e.target?.isContentEditable;
      if (isTyping) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <ErrorBoundary>
      <SEOProvider>
        <Routes />
        <CommandPalette
          isOpen={isPaletteOpen}
          onClose={() => setPaletteOpen(false)}
        />
        <PerformanceDashboard
          isVisible={isVisible}
          onClose={hideDashboard}
        />
      </SEOProvider>
    </ErrorBoundary>
  );
}

export default App;

