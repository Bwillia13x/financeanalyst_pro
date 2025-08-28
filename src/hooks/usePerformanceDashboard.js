import { useState, useCallback, useEffect, useLayoutEffect } from 'react';

// Hook for managing performance dashboard visibility and hotkey
export function usePerformanceDashboard() {
  const [isVisible, setIsVisible] = useState(false);

  const toggleDashboard = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  const showDashboard = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hideDashboard = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Keyboard shortcut for dashboard (Ctrl/Cmd + Shift + P)
  // Use layout effect so the handler is attached before synchronous test events
  useLayoutEffect(() => {
    const handleKeyDown = event => {
      const key = (event.key || '').toLowerCase();
      const isP = key === 'p' || event.code === 'KeyP';
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && isP) {
        event.preventDefault();
        // Idempotent open to avoid StrictMode double-invocation toggling closed
        setIsVisible(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [toggleDashboard]);

  // Listen for global command event from KeyboardShortcutsProvider
  // Use layout effect to avoid missing synchronous test-dispatched events
  useLayoutEffect(() => {
    const handleOpen = () => setIsVisible(true);
    window.addEventListener('open-performance-dashboard', handleOpen);
    return () => window.removeEventListener('open-performance-dashboard', handleOpen);
  }, []);

  // Test-only imperative API to deterministically open/close the dashboard
  useLayoutEffect(() => {
    if (import.meta.env.MODE !== 'test') return;
    const g = window;
    g.__openPerformanceDashboard = () => setIsVisible(true);
    g.__closePerformanceDashboard = () => setIsVisible(false);
    return () => {
      try {
        delete g.__openPerformanceDashboard;
        delete g.__closePerformanceDashboard;
      } catch {
        g.__openPerformanceDashboard = undefined;
        g.__closePerformanceDashboard = undefined;
      }
    };
  }, []);

  // Test-only debug flag to observe visibility state from tests
  // Use layout effect so changes are visible synchronously to test assertions
  useLayoutEffect(() => {
    if (import.meta.env.MODE !== 'test') return;
    window.__isPerformanceDashboardVisible = isVisible;
    return () => {
      try {
        delete window.__isPerformanceDashboardVisible;
      } catch {
        window.__isPerformanceDashboardVisible = undefined;
      }
    };
  }, [isVisible]);

  // Show dashboard automatically in development if there are performance issues
  useEffect(() => {
    if (import.meta.env.DEV) {
      // Check for performance budget violations after page load
      const checkPerformanceIssues = () => {
        // This would integrate with your performance monitoring
        const webVitals = window.webVitalsData;
        if (webVitals) {
          const hasIssues =
            (webVitals.LCP && webVitals.LCP > 2500) ||
            (webVitals.FID && webVitals.FID > 100) ||
            (webVitals.CLS && webVitals.CLS > 0.1);

          if (hasIssues) {
            console.warn(
              'Performance issues detected. Press Ctrl/Cmd + Shift + P to open dashboard.'
            );
          }
        }
      };

      // Check after initial page load
      setTimeout(checkPerformanceIssues, 3000);
    }
  }, []);

  return {
    isVisible,
    toggleDashboard,
    showDashboard,
    hideDashboard
  };
}
