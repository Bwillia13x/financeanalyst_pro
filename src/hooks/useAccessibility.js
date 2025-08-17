import { useState, useEffect, useCallback, useRef } from 'react';

import { accessibilityTester } from '../utils/accessibilityTesting';
import { reportPerformanceMetric } from '../utils/performanceMonitoring';

// React hook for accessibility testing
export function useAccessibility(options = {}) {
  const {
    enabled = process.env.NODE_ENV === 'development',
    autoTest = false,
    testInterval = null,
    componentType = 'generic',
    onViolations = null,
    onSuccess = null
  } = options;

  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [violations, setViolations] = useState([]);
  const [score, setScore] = useState(null);
  const [lastTestTime, setLastTestTime] = useState(null);

  const elementRef = useRef(null);
  const intervalRef = useRef(null);

  // Run accessibility tests
  const runTests = useCallback(async(element = null, testOptions = {}) => {
    if (!enabled) return null;

    const targetElement = element || elementRef.current || document;
    setIsLoading(true);

    try {
      const testResults = await accessibilityTester.runTests(targetElement, testOptions);

      setResults(testResults);
      setViolations(testResults.violations || []);
      setScore(accessibilityTester.calculateAccessibilityScore());
      setLastTestTime(Date.now());

      // Report to performance monitoring
      reportPerformanceMetric('accessibility_test', {
        violations: testResults.violations?.length || 0,
        score: accessibilityTester.calculateAccessibilityScore(),
        componentType,
        timestamp: Date.now()
      });

      // Call callbacks
      if (testResults.violations?.length > 0) {
        onViolations?.(testResults.violations);
      } else {
        onSuccess?.(testResults);
      }

      return testResults;
    } catch (error) {
      console.error('Accessibility test failed:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enabled, componentType, onViolations, onSuccess]);

  // Test specific financial component
  const testFinancialComponent = useCallback(async(selector, type = componentType) => {
    if (!enabled) return null;

    setIsLoading(true);
    try {
      const testResults = await accessibilityTester.testFinancialComponent(selector, type);

      setResults(testResults);
      setViolations(testResults.violations || []);
      setScore(accessibilityTester.calculateAccessibilityScore());
      setLastTestTime(Date.now());

      // Report specific component test
      reportPerformanceMetric('financial_component_accessibility', {
        componentType: type,
        violations: testResults.violations?.length || 0,
        score: accessibilityTester.calculateAccessibilityScore(),
        timestamp: Date.now()
      });

      return testResults;
    } catch (error) {
      console.error('Financial component accessibility test failed:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enabled, componentType]);

  // Test keyboard navigation
  const testKeyboardNavigation = useCallback(async() => {
    if (!enabled) return null;

    try {
      const navResults = await accessibilityTester.testKeyboardNavigation();

      reportPerformanceMetric('keyboard_navigation_test', {
        focusableElements: navResults.focusableElementsCount,
        tabOrderIssues: navResults.tabOrderIssues?.length || 0,
        focusVisibilityIssues: navResults.focusVisibilityIssues?.length || 0,
        passed: navResults.passed,
        timestamp: Date.now()
      });

      return navResults;
    } catch (error) {
      console.error('Keyboard navigation test failed:', error);
      return null;
    }
  }, [enabled]);

  // Test color contrast
  const testColorContrast = useCallback(async() => {
    if (!enabled) return null;

    try {
      const contrastResults = await accessibilityTester.testColorContrast();

      reportPerformanceMetric('color_contrast_test', {
        totalElements: contrastResults.totalElements,
        contrastIssues: contrastResults.contrastIssues?.length || 0,
        passed: contrastResults.passed,
        timestamp: Date.now()
      });

      return contrastResults;
    } catch (error) {
      console.error('Color contrast test failed:', error);
      return null;
    }
  }, [enabled]);

  // Test form accessibility
  const testFormAccessibility = useCallback(async() => {
    if (!enabled) return null;

    try {
      const formResults = await accessibilityTester.testFormAccessibility();

      reportPerformanceMetric('form_accessibility_test', {
        totalForms: formResults.totalForms,
        formIssues: formResults.formIssues?.length || 0,
        passed: formResults.passed,
        timestamp: Date.now()
      });

      return formResults;
    } catch (error) {
      console.error('Form accessibility test failed:', error);
      return null;
    }
  }, [enabled]);

  // Generate comprehensive report
  const generateReport = useCallback(() => {
    if (!results) return null;

    try {
      const report = accessibilityTester.generateReport();

      // Store report data for performance monitoring
      reportPerformanceMetric('accessibility_report_generated', {
        score: report.summary.score,
        violations: report.summary.violations,
        totalChecks: report.summary.totalChecks,
        timestamp: Date.now()
      });

      return report;
    } catch (error) {
      console.error('Failed to generate accessibility report:', error);
      return null;
    }
  }, [results]);

  // Set up automatic testing
  useEffect(() => {
    if (!enabled || !autoTest) return;

    const runAutoTest = () => {
      runTests();
    };

    // Run initial test
    runAutoTest();

    // Set up interval if specified
    if (testInterval) {
      intervalRef.current = setInterval(runAutoTest, testInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, autoTest, testInterval, runTests]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // State
    results,
    violations,
    score,
    isLoading,
    lastTestTime,

    // Test functions
    runTests,
    testFinancialComponent,
    testKeyboardNavigation,
    testColorContrast,
    testFormAccessibility,
    generateReport,

    // Element ref for targeting tests
    elementRef
  };
}

// Hook for monitoring accessibility across the entire app
export function useAppAccessibility() {
  const [globalScore, setGlobalScore] = useState(null);
  const [recentViolations, setRecentViolations] = useState([]);
  const [testHistory, setTestHistory] = useState([]);

  const runGlobalAccessibilityCheck = useCallback(async() => {
    try {
      // Run comprehensive tests on the entire document
      const results = await accessibilityTester.runTests(document);
      const score = accessibilityTester.calculateAccessibilityScore();

      setGlobalScore(score);
      setRecentViolations(results.violations || []);

      // Update test history
      const historyEntry = {
        timestamp: Date.now(),
        score,
        violations: results.violations?.length || 0,
        url: window.location.pathname
      };

      setTestHistory(prev => [...prev.slice(-9), historyEntry]); // Keep last 10 entries

      // Report global metrics
      reportPerformanceMetric('global_accessibility_check', {
        score,
        violations: results.violations?.length || 0,
        url: window.location.pathname,
        timestamp: Date.now()
      });

      return results;
    } catch (error) {
      console.error('Global accessibility check failed:', error);
      return null;
    }
  }, []);

  // Check accessibility when route changes
  useEffect(() => {
    const checkOnRouteChange = () => {
      setTimeout(() => {
        runGlobalAccessibilityCheck();
      }, 1000); // Allow time for route to fully load
    };

    // Listen for navigation changes
    window.addEventListener('popstate', checkOnRouteChange);

    // Run initial check
    checkOnRouteChange();

    return () => {
      window.removeEventListener('popstate', checkOnRouteChange);
    };
  }, [runGlobalAccessibilityCheck]);

  return {
    globalScore,
    recentViolations,
    testHistory,
    runGlobalAccessibilityCheck
  };
}

// Hook for accessibility testing in financial components
export function useFinancialAccessibility(componentType) {
  const accessibility = useAccessibility({
    componentType,
    autoTest: true,
    testInterval: 30000, // Test every 30 seconds in development
    onViolations: (violations) => {
      // Log financial component specific violations
      console.warn(`Financial component (${componentType}) accessibility violations:`, violations);
    }
  });

  // Enhanced testing for financial components
  const testFinancialFeatures = useCallback(async() => {
    const results = {};

    try {
      // Test keyboard navigation (critical for financial apps)
      results.keyboardNav = await accessibility.testKeyboardNavigation();

      // Test color contrast (important for reading financial data)
      results.colorContrast = await accessibility.testColorContrast();

      // Test forms if component contains them
      results.formAccessibility = await accessibility.testFormAccessibility();

      // Generate comprehensive report
      results.report = accessibility.generateReport();

      return results;
    } catch (error) {
      console.error('Financial accessibility testing failed:', error);
      return null;
    }
  }, [accessibility, componentType]);

  return {
    ...accessibility,
    testFinancialFeatures
  };
}

// Hook for real-time accessibility monitoring
export function useAccessibilityMonitor(options = {}) {
  const {
    threshold = 80, // Minimum acceptable score
    alertOnViolations = true,
    monitorInterval = 60000 // Check every minute
  } = options;

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const intervalRef = useRef(null);

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);

    const monitor = async() => {
      try {
        const results = await accessibilityTester.runTests(document);
        const score = accessibilityTester.calculateAccessibilityScore();

        // Check if score is below threshold
        if (score < threshold) {
          const alert = {
            id: Date.now(),
            type: 'low_score',
            message: `Accessibility score (${score}) is below threshold (${threshold})`,
            score,
            violations: results.violations?.length || 0,
            timestamp: Date.now()
          };

          setAlerts(prev => [...prev, alert]);

          if (alertOnViolations) {
            console.warn('Accessibility Alert:', alert.message);
          }
        }

        // Check for critical violations
        const criticalViolations = results.violations?.filter(v => v.impact === 'critical') || [];
        if (criticalViolations.length > 0 && alertOnViolations) {
          const alert = {
            id: Date.now(),
            type: 'critical_violations',
            message: `${criticalViolations.length} critical accessibility violations found`,
            violations: criticalViolations,
            timestamp: Date.now()
          };

          setAlerts(prev => [...prev, alert]);
          console.error('Critical Accessibility Violations:', criticalViolations);
        }

        // Report monitoring metrics
        reportPerformanceMetric('accessibility_monitoring', {
          score,
          violations: results.violations?.length || 0,
          criticalViolations: criticalViolations.length,
          timestamp: Date.now()
        });

      } catch (error) {
        console.error('Accessibility monitoring failed:', error);
      }
    };

    // Run initial check
    monitor();

    // Set up interval
    intervalRef.current = setInterval(monitor, monitorInterval);
  }, [isMonitoring, threshold, alertOnViolations, monitorInterval]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isMonitoring,
    alerts,
    startMonitoring,
    stopMonitoring,
    clearAlerts
  };
}
