// Test setup file for Vitest
import '@testing-library/jest-dom';

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
