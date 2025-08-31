import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// Mock window.ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock window.performance
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    ...window.performance,
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => [])
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') ||
        args[0].includes('ReactDOMTestUtils') ||
        args[0].includes('act()'))
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('ReactDOMTestUtils'))
    ) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock fetch for API calls
global.fetch = vi.fn();

// Helper function to create mock analytics data
global.createMockAnalyticsData = () => ({
  returns: Array.from({ length: 252 }, () => Math.random() * 0.1 - 0.05),
  prices: Array.from({ length: 252 }, (_, i) => 100 + i * 0.1 + Math.random() * 10),
  portfolio: {
    assets: [
      { symbol: 'AAPL', weight: 0.25, expectedReturn: 0.12, volatility: 0.25 },
      { symbol: 'MSFT', weight: 0.2, expectedReturn: 0.1, volatility: 0.22 },
      { symbol: 'GOOGL', weight: 0.15, expectedReturn: 0.11, volatility: 0.28 }
    ]
  }
});

// Helper to wait for async operations
global.waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to wait for a specific amount of time
global.wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Mock timers
vi.useFakeTimers();

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
  localStorageMock.clear();
  sessionStorageMock.clear();
});
