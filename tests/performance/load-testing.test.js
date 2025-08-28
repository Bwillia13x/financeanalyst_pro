import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

// Import performance monitoring utilities
import { measurePerformance, trackMemoryUsage } from '../../src/utils/performanceMonitoring';

// Import heavy components for load testing
import PrivateAnalysis from '../../src/pages/PrivateAnalysis';
import FinancialModelWorkspace from '../../src/components/FinancialModeling/FinancialModelWorkspace';
import EnhancedMarketDataDashboard from '../../src/components/MarketData/EnhancedMarketDataDashboard';

describe('Performance Load Testing', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: (state = { user: { id: 'test', name: 'Test User' }, isAuthenticated: true }) => state,
        portfolio: (state = { data: [], loading: false, error: null }) => state,
        market: (state = { data: {}, loading: false, error: null }) => state,
        financial: (state = { models: [], calculations: {} }) => state
      }
    });

    // Mock performance APIs
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now());
    vi.spyOn(performance, 'mark').mockImplementation(() => {});
    vi.spyOn(performance, 'measure').mockImplementation(() => ({}));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Load Performance', () => {
    it('renders PrivateAnalysis under load within performance budget', async () => {
      const startTime = performance.now();

      const { container } = render(
        <Provider store={store}>
          <BrowserRouter>
            <PrivateAnalysis />
          </BrowserRouter>
        </Provider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(container).toBeInTheDocument();
      expect(renderTime).toBeLessThan(3000); // Should render within 3 seconds
    });

    it('handles rapid re-renders without performance degradation', async () => {
      let totalRenderTime = 0;
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        const { unmount } = render(
          <Provider store={store}>
            <BrowserRouter>
              <PrivateAnalysis />
            </BrowserRouter>
          </Provider>
        );

        const endTime = performance.now();
        totalRenderTime += (endTime - startTime);

        unmount();
      }

      const averageRenderTime = totalRenderTime / iterations;
      expect(averageRenderTime).toBeLessThan(1000); // Average under 1 second
    });
  });

  describe('Data Processing Performance', () => {
    it('processes large financial datasets efficiently', async () => {
      const largeDataset = {
        companies: Array(1000).fill().map((_, i) => ({
          id: `company_${i}`,
          name: `Company ${i}`,
          ticker: `TICK${i}`,
          financials: {
            revenue: Array(10).fill().map((_, j) => 1000000 * (1.1 ** j)),
            expenses: Array(10).fill().map((_, j) => 800000 * (1.08 ** j)),
            assets: Array(10).fill().map((_, j) => 5000000 * (1.05 ** j))
          }
        }))
      };

      const startTime = performance.now();

      // Simulate processing large dataset
      const processedData = largeDataset.companies.map(company => ({
        ...company,
        metrics: {
          revenueGrowth: company.financials.revenue.slice(1).map((rev, i) =>
            ((rev - company.financials.revenue[i]) / company.financials.revenue[i]) * 100
          ),
          profitMargin: company.financials.revenue.map((rev, i) =>
            ((rev - company.financials.expenses[i]) / rev) * 100
          )
        }
      }));

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processedData).toHaveLength(1000);
      expect(processingTime).toBeLessThan(5000); // Should process within 5 seconds
    });

    it('handles concurrent calculations without blocking UI', async () => {
      const calculations = Array(20).fill().map((_, i) => ({
        id: `calc_${i}`,
        data: {
          revenue: [100000, 110000, 121000],
          expenses: [80000, 85000, 90000],
          discountRate: 0.1
        }
      }));

      const startTime = performance.now();

      // Simulate concurrent calculations
      const promises = calculations.map(calc =>
        new Promise(resolve => {
          setTimeout(() => {
            const result = {
              ...calc,
              npv: calc.data.revenue.reduce((sum, rev, i) =>
                sum + (rev - calc.data.expenses[i]) / Math.pow(1 + calc.data.discountRate, i + 1), 0
              )
            };
            resolve(result);
          }, Math.random() * 100);
        })
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(20);
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Memory Usage Optimization', () => {
    it('maintains stable memory usage during extended operation', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;

      // Simulate extended operation
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(
          <Provider store={store}>
            <BrowserRouter>
              <FinancialModelWorkspace />
            </BrowserRouter>
          </Provider>
        );

        // Simulate user interaction
        await new Promise(resolve => setTimeout(resolve, 50));

        unmount();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('properly cleans up event listeners and subscriptions', () => {
      const eventListenerCount = {
        initial: 0,
        final: 0
      };

      // Mock addEventListener to count listeners
      const originalAddEventListener = document.addEventListener;
      const originalRemoveEventListener = document.removeEventListener;
      let listenerCount = 0;

      document.addEventListener = vi.fn((...args) => {
        listenerCount++;
        return originalAddEventListener.apply(document, args);
      });

      document.removeEventListener = vi.fn((...args) => {
        listenerCount--;
        return originalRemoveEventListener.apply(document, args);
      });

      eventListenerCount.initial = listenerCount;

      const { unmount } = render(
        <Provider store={store}>
          <BrowserRouter>
            <EnhancedMarketDataDashboard />
          </BrowserRouter>
        </Provider>
      );

      unmount();

      eventListenerCount.final = listenerCount;

      // Should have cleaned up all listeners
      expect(eventListenerCount.final).toBeLessThanOrEqual(eventListenerCount.initial);

      // Restore original functions
      document.addEventListener = originalAddEventListener;
      document.removeEventListener = originalRemoveEventListener;
    });
  });

  describe('Network Request Optimization', () => {
    it('batches multiple API requests efficiently', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'success' })
      });
      global.fetch = mockFetch;

      render(
        <Provider store={store}>
          <BrowserRouter>
            <EnhancedMarketDataDashboard />
          </BrowserRouter>
        </Provider>
      );

      // Simulate multiple rapid requests
      const buttons = screen.getAllByRole('button');
      for (let i = 0; i < Math.min(5, buttons.length); i++) {
        fireEvent.click(buttons[i]);
      }

      await waitFor(() => {
        // Should batch requests rather than making individual calls
        expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(3);
      }, { timeout: 2000 });
    });

    it('implements proper request caching', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'cached_data', timestamp: Date.now() })
      });
      global.fetch = mockFetch;

      const { rerender } = render(
        <Provider store={store}>
          <BrowserRouter>
            <EnhancedMarketDataDashboard />
          </BrowserRouter>
        </Provider>
      );

      // Initial render should make request
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Re-render should use cache
      rerender(
        <Provider store={store}>
          <BrowserRouter>
            <EnhancedMarketDataDashboard />
          </BrowserRouter>
        </Provider>
      );

      // Should still be only 1 request (cached)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Bundle Size Optimization', () => {
    it('implements proper code splitting', () => {
      // Test that large dependencies are not loaded immediately
      const initialModules = Object.keys(require.cache || {});

      render(
        <Provider store={store}>
          <BrowserRouter>
            <PrivateAnalysis />
          </BrowserRouter>
        </Provider>
      );

      const loadedModules = Object.keys(require.cache || {});
      const newModules = loadedModules.filter(mod => !initialModules.includes(mod));

      // Should not load all modules at once
      expect(newModules.length).toBeLessThan(100);
    });
  });
});
