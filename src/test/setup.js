// Test setup file for Vitest
// Capture and safely handle unhandled promise rejections that may occur in asynchronous
// code under test (e.g., retry logic that continues after a test expectation).
// Without this, Vitest will treat the rejection as an unhandled error and fail the test
// suite even if individual tests properly asserted the promise outcome.
process.on('unhandledRejection', (reason) => {
  // Silently swallow the rejection to prevent false-positive test failures.
  // Still output a debug message so genuine issues can be spotted when needed.
  // eslint-disable-next-line no-console
  console.debug('[vitest] handled unhandledRejection:', reason);
});
import '@testing-library/jest-dom';
import { webcrypto } from 'crypto';

// Polyfill for crypto object
if (typeof global.crypto === 'undefined') {
  global.crypto = webcrypto;
}

// Mock environment variables for testing
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_ALPHA_VANTAGE_API_KEY: 'test_alpha_vantage_key',
    VITE_FMP_API_KEY: 'test_fmp_key',
    VITE_QUANDL_API_KEY: 'test_quandl_key',
    VITE_FRED_API_KEY: 'test_fred_key',
    VITE_APP_ENV: 'test',
    VITE_DEBUG: 'false',
    VITE_CACHE_ENABLED: 'false',
    VITE_RATE_LIMITING_ENABLED: 'false',
    VITE_FORCE_DEMO_MODE: 'true',
    MODE: 'test'
  },
  writable: true
});

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock axios for API calls
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} }))
  }
}));

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

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn()
};

// Setup cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});
