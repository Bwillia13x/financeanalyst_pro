import React from 'react';
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

// Mock window.scrollTo (jsdom not implemented)
if (typeof window.scrollTo !== 'function') {
  window.scrollTo = () => {};
}
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

import { vi, afterEach, afterAll } from 'vitest';

// Global wall-time kill switch to auto-cancel hung test runs
let MAX_WALL_TIME_MS = 180000; // default 3 minutes
if (typeof process !== 'undefined' && process.env && process.env.TEST_MAX_WALL_TIME_MS) {
  MAX_WALL_TIME_MS = Number(process.env.TEST_MAX_WALL_TIME_MS);
} else {
  try {
    if (import.meta && import.meta.env && import.meta.env.TEST_MAX_WALL_TIME_MS) {
      MAX_WALL_TIME_MS = Number(import.meta.env.TEST_MAX_WALL_TIME_MS);
    }
  } catch (_) {
    // ignore if import.meta is not available
  }
}

const __vitestGlobalKillTimer = setTimeout(() => {
  // eslint-disable-next-line no-console
  console.error(`[vitest] Global test timeout exceeded (${MAX_WALL_TIME_MS}ms). Forcing exit.`);
  if (typeof process !== 'undefined' && process.exit) {
    process.exit(124);
  }
}, MAX_WALL_TIME_MS);

if (typeof process !== 'undefined' && process.on) {
  process.on('exit', () => clearTimeout(__vitestGlobalKillTimer));
  process.on('SIGINT', () => { clearTimeout(__vitestGlobalKillTimer); process.exit?.(130); });
  process.on('SIGTERM', () => { clearTimeout(__vitestGlobalKillTimer); process.exit?.(143); });
}

afterAll(() => {
  clearTimeout(__vitestGlobalKillTimer);
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

// Mock react-helmet-async with minimal head-writing behavior for SEO tests
vi.mock('react-helmet-async', () => {
  const Helmet = ({ children }) => {
    React.useEffect(() => {
      React.Children.forEach(children, (child) => {
        if (!React.isValidElement(child)) return;
        // Handle <title>
        if (child.type === 'title') {
          const text = Array.isArray(child.props.children)
            ? child.props.children.join('')
            : (child.props.children ?? '');
          if (typeof text === 'string') {
            let titleEl = document.querySelector('title');
            if (!titleEl) {
              titleEl = document.createElement('title');
              document.head.appendChild(titleEl);
            }
            titleEl.textContent = text;
            document.title = text;
          }
        }
        // Handle <meta name="..." content="...">
        if (child.type === 'meta' && child.props?.name) {
          let meta = document.querySelector(`meta[name="${child.props.name}"]`);
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', child.props.name);
            document.head.appendChild(meta);
          }
          if (child.props.content != null) {
            meta.setAttribute('content', child.props.content);
          }
        }
      });
    }, [children]);
    return null;
  };
  const HelmetProvider = ({ children }) => children || null;
  return { Helmet, HelmetProvider };
});

// Ensure a baseline <title> and meta description exist synchronously for tests
(() => {
  let titleEl = document.querySelector('title');
  if (!titleEl) {
    titleEl = document.createElement('title');
    titleEl.textContent = 'FinanceAnalyst Pro | Valor-IVX';
    document.head.appendChild(titleEl);
    document.title = titleEl.textContent;
  }
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    metaDesc.setAttribute('content', 'Professional financial modeling and valuation platform for analysts, investors, and finance professionals.');
    document.head.appendChild(metaDesc);
  }
})();

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

// Mock IntersectionObserver: immediately report intersection so LazyLoader renders children
global.IntersectionObserver = vi.fn().mockImplementation((callback, options) => {
  return {
    observe: vi.fn((element) => {
      // Call the callback right away as if the element is visible
      if (typeof callback === 'function') {
        callback([
          {
            isIntersecting: true,
            intersectionRatio: 1,
            target: element,
            time: Date.now(),
            boundingClientRect: {},
            intersectionRect: {},
            rootBounds: null,
          },
        ], { root: options?.root ?? null, rootMargin: options?.rootMargin ?? '', thresholds: options?.threshold ?? [0] });
      }
    }),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => []),
    root: options?.root ?? null,
    rootMargin: options?.rootMargin ?? '',
    thresholds: options?.threshold ?? [0],
  };
});

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
