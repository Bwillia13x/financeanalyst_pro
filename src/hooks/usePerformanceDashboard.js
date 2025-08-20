import { useState, useCallback, useEffect } from 'react';

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
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        toggleDashboard();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleDashboard]);

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
            console.warn('Performance issues detected. Press Ctrl/Cmd + Shift + P to open dashboard.');
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
