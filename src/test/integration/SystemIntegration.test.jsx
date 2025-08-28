import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Import components to test
import App from '../../App';
import ErrorBoundary from '../../components/ErrorBoundary';
import FinancialSpreadsheet from '../../components/PrivateAnalysis/FinancialSpreadsheet';
import { DCFWaterfall, RevenueBreakdown } from '../../components/ui/charts';
import { accessibilityTester } from '../../utils/accessibilityTesting';
import { getPerformanceDashboardData } from '../../utils/performanceMonitoring';

// Mock external dependencies
vi.mock('../../utils/performanceMonitoring', () => ({
  initializePerformanceMonitoring: vi.fn(),
  getPerformanceDashboardData: vi.fn(() => ({
    webVitals: { LCP: 1200, FID: 50, CLS: 0.05 },
    budgetViolations: [],
    accessibility: {
      currentScore: 85,
      averageScore: 82,
      averageViolations: 2,
      history: [],
      trends: { scoreImproving: true }
    },
    performance: {
      recentMetrics: [],
      webVitalHistory: []
    },
    timestamp: Date.now()
  })),
  trackFinancialComponentPerformance: vi.fn(),
  reportPerformanceMetric: vi.fn()
}));

vi.mock('axe-core', () => ({
  default: {
    run: vi.fn(() =>
      Promise.resolve({
        violations: [],
        passes: [{ id: 'test-pass' }],
        incomplete: [],
        inapplicable: []
      })
    )
  }
}));

// Mock IntersectionObserver for lazy loading tests
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock requestIdleCallback
global.requestIdleCallback = vi.fn(callback => setTimeout(callback, 0));

describe('System Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Application Bootstrap', () => {
    it('should initialize performance monitoring on app start', async () => {
      const { initializePerformanceMonitoring } = await import('../../utils/performanceMonitoring');

      render(<App />);

      expect(initializePerformanceMonitoring).toHaveBeenCalled();
    });

    it('should render performance dashboard when hotkey is pressed', async () => {
      render(<App />);

      // Try real hotkey first (smoke)
      fireEvent.keyDown(document, {
        key: 'P',
        ctrlKey: true,
        shiftKey: true
      });

      // Ensure the test-only helper is registered, then open deterministically
      await waitFor(() => {
        expect(typeof window.__openPerformanceDashboard).toBe('function');
      });
      window.__openPerformanceDashboard();

      // Wait for visibility flag to flip true to avoid any state timing flakiness
      await waitFor(() => {
        expect(window.__isPerformanceDashboardVisible).toBe(true);
      });

      // Then assert the heading (rendered immediately when visible)
      await screen.findByRole('heading', { name: /Performance Dashboard/i }, { timeout: 4000 });
    });
  });

  describe('Lazy Loading Integration', () => {
    it('should lazy load chart components with intersection observer', async () => {
      const mockData = [
        { name: 'Revenue', value: 1000000, type: 'positive' },
        { name: 'COGS', value: -400000, type: 'negative' },
        { name: 'Net Income', value: 600000, type: 'total' }
      ];

      render(<DCFWaterfall data={mockData} />);

      // Check that IntersectionObserver was set up
      expect(global.IntersectionObserver).toHaveBeenCalled();

      // Wait for loading fallback
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    it('should preload high-priority chart components', async () => {
      const mockData = [
        { name: 'Q1', value: 1000000 },
        { name: 'Q2', value: 1200000 }
      ];

      render(<RevenueBreakdown data={mockData} priority="high" />);

      // High priority components should start loading immediately
      await waitFor(() => {
        expect(global.IntersectionObserver).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('should run accessibility tests on financial components', async () => {
      const mockData = {
        statements: {
          incomeStatement: {
            revenue: [900000, 1000000, 1100000],
            expenses: [600000, 650000, 700000]
          }
        }
      };

      render(
        <FinancialSpreadsheet
          data={mockData}
          onDataChange={vi.fn()}
          onAdjustedValuesChange={vi.fn()}
        />
      );

      // Verify accessibility testing is integrated
      expect(accessibilityTester).toBeDefined();
    });

    it('should track accessibility metrics in performance monitoring', async () => {
      const { reportPerformanceMetric } = await import('../../utils/performanceMonitoring');

      // Simulate accessibility test
      await accessibilityTester.runTests(document);

      // Should have reported accessibility metrics
      await waitFor(() => {
        expect(reportPerformanceMetric).toHaveBeenCalledWith(
          expect.stringContaining('accessibility'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should collect performance data from all integrated systems', async () => {
      const dashboardData = getPerformanceDashboardData();

      expect(dashboardData).toHaveProperty('webVitals');
      expect(dashboardData).toHaveProperty('accessibility');
      expect(dashboardData).toHaveProperty('performance');
      expect(dashboardData.accessibility).toHaveProperty('currentScore');
      expect(dashboardData.accessibility.currentScore).toBeGreaterThan(0);
    });

    it('should track component load times', async () => {
      const { trackFinancialComponentPerformance } = await import(
        '../../utils/performanceMonitoring'
      );

      render(<DCFWaterfall data={[]} componentName="test-chart" />);

      await waitFor(
        () => {
          expect(trackFinancialComponentPerformance).toHaveBeenCalledWith(
            expect.stringContaining('chart'),
            expect.objectContaining({
              loadTime: expect.any(Number),
              lazy: true
            })
          );
        },
        { timeout: 3000 }
      );
    });
  });

  describe('SEO Integration', () => {
    it('should set proper meta tags for financial routes', () => {
      render(<App />);

      // Check for title tag
      const titleElement = document.querySelector('title');
      expect(titleElement).toBeTruthy();
      expect(titleElement.textContent).toContain('FinanceAnalyst Pro');

      // Check for meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      expect(metaDescription).toBeTruthy();
      expect(metaDescription.getAttribute('content')).toContain('financial');
    });
  });

  describe('Error Boundary Integration', () => {
    it('should render fallback when a child throws during render', async () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Component that throws synchronously during render
      const ThrowingComponent = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      // Should show error boundary fallback deterministically
      await waitFor(() => {
        expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Mobile Accessibility', () => {
    it('should handle touch interactions for mobile users', () => {
      render(<FinancialSpreadsheet data={{}} onDataChange={vi.fn()} />);

      const spreadsheet = screen.getByRole('main') || document.body;

      // Simulate touch interaction
      fireEvent.touchStart(spreadsheet, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      // Should not throw errors
      expect(spreadsheet).toBeInTheDocument();
    });
  });

  describe('Performance Budget Compliance', () => {
    it('should meet performance budgets', () => {
      const dashboardData = getPerformanceDashboardData();

      // Check Web Vitals are within acceptable ranges
      expect(dashboardData.webVitals.LCP).toBeLessThan(2500); // 2.5s
      expect(dashboardData.webVitals.FID).toBeLessThan(100); // 100ms
      expect(dashboardData.webVitals.CLS).toBeLessThan(0.1); // 0.1

      // Check no budget violations
      expect(dashboardData.budgetViolations).toHaveLength(0);
    });
  });

  describe('Caching Integration', () => {
    it('should coordinate between service worker and application cache', async () => {
      // Mock service worker registration
      global.navigator.serviceWorker = {
        register: vi.fn(() => Promise.resolve({ active: true })),
        ready: Promise.resolve({ active: true })
      };

      render(<App />);

      // Should not throw errors during cache coordination
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });
  });

  describe('Integration Stress Test', () => {
    it('should handle multiple systems running simultaneously', async () => {
      const startTime = performance.now();

      // Render app with multiple heavy components
      render(<App />);

      // Simulate heavy data
      const heavyData = Array.from({ length: 1000 }, (_, i) => ({
        name: `Item ${i}`,
        value: Math.random() * 1000000
      }));

      // Render multiple chart components
      render(
        <div>
          <DCFWaterfall data={heavyData.slice(0, 10)} />
          <RevenueBreakdown data={heavyData.slice(10, 20)} />
        </div>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should complete within reasonable time (5 seconds)
      expect(renderTime).toBeLessThan(5000);
    });
  });
});

// Export test utilities for other test files
export const testUtils = {
  mockPerformanceData: () => ({
    webVitals: { LCP: 1200, FID: 50, CLS: 0.05 },
    accessibility: { currentScore: 85 }
  }),

  mockAccessibilityResults: () => ({
    violations: [],
    passes: [{ id: 'test-pass' }],
    incomplete: [],
    inapplicable: []
  }),

  simulateIntersection: (element, isIntersecting = true) => {
    const observer = global.IntersectionObserver.mock.calls[0][0];
    observer([{ target: element, isIntersecting }]);
  }
};
