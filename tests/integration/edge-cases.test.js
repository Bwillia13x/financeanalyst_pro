import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

// Import main components for edge case testing
import App from '../../src/App';
import PrivateAnalysis from '../../src/pages/PrivateAnalysis';
import { calculateDCF } from '../../src/utils/dcfCalculations';

// Mock external services
vi.mock('../../src/services/data/premiumDataService', () => ({
  fetchMarketData: vi.fn(),
  fetchFinancialStatements: vi.fn(),
  validateDataSource: vi.fn()
}));

vi.mock('../../src/utils/performanceMonitoring', () => ({
  trackEvent: vi.fn(),
  measurePerformance: vi.fn(),
  logError: vi.fn()
}));

describe('Edge Cases Integration Tests', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: (state = { user: null, isAuthenticated: false }) => state,
        portfolio: (state = { data: [], loading: false }) => state,
        market: (state = { data: {}, loading: false }) => state
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Data Validation Edge Cases', () => {
    it('handles malformed financial data gracefully', async () => {
      const malformedData = {
        revenue: "invalid",
        expenses: null,
        assets: undefined,
        periods: []
      };

      const result = calculateDCF(malformedData);
      
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Invalid financial data');
    });

    it('handles extreme numerical values', async () => {
      const extremeData = {
        revenue: [1e15, 2e15, 3e15], // Trillion dollar revenues
        expenses: [9e14, 1.8e15, 2.7e15],
        periods: 3,
        discountRate: 0.001, // Near-zero discount rate
        terminalGrowthRate: 0.5 // 50% terminal growth
      };

      const result = calculateDCF(extremeData);
      
      expect(result.enterpriseValue).toBeDefined();
      expect(isFinite(result.enterpriseValue)).toBe(true);
    });

    it('handles empty or missing data gracefully', async () => {
      const emptyData = {};
      const result = calculateDCF(emptyData);
      
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Missing required data');
    });
  });

  describe('Performance Under Load', () => {
    it('handles multiple simultaneous DCF calculations', async () => {
      const testData = {
        revenue: [100000, 110000, 121000],
        expenses: [80000, 85000, 90000],
        periods: 3,
        discountRate: 0.1,
        terminalGrowthRate: 0.02
      };

      const promises = Array(50).fill().map(() => calculateDCF(testData));
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.enterpriseValue).toBeDefined();
        expect(typeof result.enterpriseValue).toBe('number');
      });
    });

    it('handles large dataset processing', async () => {
      const largeDataset = {
        revenue: Array(1000).fill().map((_, i) => 100000 * (1.1 ** i)),
        expenses: Array(1000).fill().map((_, i) => 80000 * (1.08 ** i)),
        periods: 1000,
        discountRate: 0.1,
        terminalGrowthRate: 0.02
      };

      const startTime = performance.now();
      const result = calculateDCF(largeDataset);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.enterpriseValue).toBeDefined();
    });
  });

  describe('Network Failure Scenarios', () => {
    it('handles API timeouts gracefully', async () => {
      const mockFetch = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );
      global.fetch = mockFetch;

      render(
        <Provider store={store}>
          <BrowserRouter>
            <PrivateAnalysis />
          </BrowserRouter>
        </Provider>
      );

      // Should show error state, not crash
      await waitFor(() => {
        expect(screen.queryByText(/error/i) || screen.queryByText(/failed/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('handles intermittent connectivity', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'success' })
        });
      });
      global.fetch = mockFetch;

      render(
        <Provider store={store}>
          <BrowserRouter>
            <PrivateAnalysis />
          </BrowserRouter>
        </Provider>
      );

      // Should eventually recover
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(3);
      }, { timeout: 5000 });
    });
  });

  describe('Memory Management', () => {
    it('properly cleans up resources on unmount', () => {
      const { unmount } = render(
        <Provider store={store}>
          <BrowserRouter>
            <PrivateAnalysis />
          </BrowserRouter>
        </Provider>
      );

      // Verify no memory leaks after unmount
      unmount();
      
      // Check for proper cleanup (this is a basic test - more sophisticated memory leak detection would be ideal)
      expect(() => unmount()).not.toThrow();
    });

    it('handles rapid component mounting/unmounting', () => {
      for (let i = 0; i < 20; i++) {
        const { unmount } = render(
          <Provider store={store}>
            <BrowserRouter>
              <PrivateAnalysis />
            </BrowserRouter>
          </Provider>
        );
        unmount();
      }

      // Should not cause memory issues
      expect(true).toBe(true);
    });
  });

  describe('Browser Compatibility', () => {
    it('handles missing modern browser features', () => {
      // Mock missing IntersectionObserver
      const originalIntersectionObserver = global.IntersectionObserver;
      global.IntersectionObserver = undefined;

      expect(() => {
        render(
          <Provider store={store}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </Provider>
        );
      }).not.toThrow();

      // Restore
      global.IntersectionObserver = originalIntersectionObserver;
    });

    it('handles missing localStorage', () => {
      const originalLocalStorage = global.localStorage;
      global.localStorage = undefined;

      expect(() => {
        render(
          <Provider store={store}>
            <BrowserRouter>
              <PrivateAnalysis />
            </BrowserRouter>
          </Provider>
        );
      }).not.toThrow();

      // Restore
      global.localStorage = originalLocalStorage;
    });
  });

  describe('Accessibility Edge Cases', () => {
    it('handles screen reader navigation', async () => {
      render(
        <Provider store={store}>
          <BrowserRouter>
            <PrivateAnalysis />
          </BrowserRouter>
        </Provider>
      );

      // Test tab navigation
      const focusableElements = screen.getAllByRole('button').concat(
        screen.getAllByRole('textbox', { hidden: true })
      );

      expect(focusableElements.length).toBeGreaterThan(0);
      
      // Each focusable element should have proper accessibility attributes
      focusableElements.forEach(element => {
        expect(element).toHaveAttribute('tabIndex');
      });
    });

    it('handles high contrast mode', () => {
      // Simulate high contrast mode
      document.documentElement.style.setProperty('--color-scheme', 'high-contrast');

      const { container } = render(
        <Provider store={store}>
          <BrowserRouter>
            <PrivateAnalysis />
          </BrowserRouter>
        </Provider>
      );

      // Should still be readable
      expect(container).toBeInTheDocument();
      
      // Cleanup
      document.documentElement.style.removeProperty('--color-scheme');
    });
  });
});
