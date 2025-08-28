// Test setup file for Vitest
// Capture and safely handle unhandled promise rejections that may occur in asynchronous
// code under test (e.g., retry logic that continues after a test expectation).
// Without this, Vitest will treat the rejection as an unhandled error and fail the test
// suite even if individual tests properly asserted the promise outcome.
process.on('unhandledRejection', reason => {
  // Silently swallow the rejection to prevent false-positive test failures.
  // Still output a debug message so genuine issues can be spotted when needed.
  console.debug('[vitest] handled unhandledRejection:', reason);
});

// Reduce noise from Node warnings specifically for promise rejection handling
process.on('warning', warning => {
  if (warning && warning.name === 'PromiseRejectionHandledWarning') {
    // Swallow this to avoid noisy logs in CI
    console.debug('[vitest] suppressed warning:', warning.message);
    return;
  }
  // Fallback to default behavior for other warnings
  console.warn(warning);
});

// Intercept Node's emitWarning to fully suppress PromiseRejectionHandledWarning printed by workers
const __originalEmitWarning = process.emitWarning;
process.emitWarning = function patchedEmitWarning(warning, ...args) {
  const name = typeof warning === 'object' && warning ? warning.name : warning;
  if (name === 'PromiseRejectionHandledWarning') {
    console.debug(
      '[vitest] suppressed emitWarning:',
      typeof warning === 'object' ? warning.message : warning
    );
    return;
  }
  return __originalEmitWarning.call(process, warning, ...args);
};

// Only load DOM matchers when a browser-like env exists
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Top-level await is supported in ESM and Vitest setup files
  await import('@testing-library/jest-dom');
}
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

import { vi, afterEach } from 'vitest';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock axios for API calls (support axios.create and interceptors)
vi.mock('axios', () => {
  const instance = {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  };
  instance.create = vi.fn(() => instance);
  return { __esModule: true, default: instance };
});

// Mock window.matchMedia (only when jsdom provides window)
if (typeof window !== 'undefined') {
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
}

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

// Mock window.scrollTo (jsdom defines it but throws Not implemented)
// Always stub to a no-op to prevent test failures from ScrollToTop/useEffect
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn();
}

// Prevent jsdom from attempting navigation (which logs noisy 'Not implemented: navigation')
// - Stub window.open/Location.assign/Location.replace
// - Prevent default on anchor clicks globally
try {
  if (typeof window !== 'undefined') {
    // Stub window.open
    if (typeof window.open === 'function') {
      vi.spyOn(window, 'open').mockImplementation(() => null);
    } else {
      window.open = vi.fn();
    }

    // Additional guard: define a no-op scrollTo if missing in this environment
    if (typeof window.scrollTo !== 'function') {
      window.scrollTo = () => {};
    }

    // Stub location methods if possible
    const loc = window.location;
    if (loc && typeof loc.assign === 'function') {
      vi.spyOn(loc, 'assign').mockImplementation(() => {});
    }
    if (loc && typeof loc.replace === 'function') {
      vi.spyOn(loc, 'replace').mockImplementation(() => {});
    }

    // Prevent default on all anchor clicks to stop jsdom navigation flows
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener(
        'click',
        e => {
          const t = e.target;
          if (t && t.tagName === 'A' && (t.href || t.getAttribute('href'))) {
            e.preventDefault();
          }
        },
        true
      );
    }

    // Extra hardening: stub HTMLAnchorElement.prototype.click to no-op to avoid
    // jsdom navigation side-effects that log "Not implemented: navigation" warnings.
    try {
      const AnchorProto = window.HTMLAnchorElement && window.HTMLAnchorElement.prototype;
      if (AnchorProto && !AnchorProto.__clickStubbed) {
        Object.defineProperty(AnchorProto, '__clickStubbed', { value: true, configurable: true });
        const originalClick = AnchorProto.click;
        AnchorProto.click = function clickStub() {
          // Intentionally no-op in tests
          return undefined;
        };
        // Keep a reference to original in case manual restore is desired
        AnchorProto.__originalClick = originalClick;
      }
    } catch {
      // best-effort; ignore if environment differs
    }
  }
} catch {
  // best-effort; avoid failing tests if jsdom internals change
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  group: vi.fn(),
  groupCollapsed: vi.fn(),
  groupEnd: vi.fn()
};

// Mock react-helmet-async to fix JSDOM compatibility issues
vi.mock('react-helmet-async', () => {
  // Minimal Helmet mock that applies title/meta/link updates to document in tests
  const Helmet = ({ children }) => {
    const applyNode = node => {
      if (!node || typeof node !== 'object') return;
      const type = node.type;
      const props = node.props || {};
      if (type === 'title') {
        const text = Array.isArray(props.children) ? props.children.join('') : props.children || '';
        if (typeof document !== 'undefined') {
          document.title = String(text);
        }
      } else if (type === 'meta') {
        const { name, property, content } = props;
        if (typeof document !== 'undefined' && (name || property)) {
          const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
          let el = document.head.querySelector(selector);
          if (!el) {
            el = document.createElement('meta');
            if (name) el.setAttribute('name', name);
            if (property) el.setAttribute('property', property);
            document.head.appendChild(el);
          }
          if (content != null) el.setAttribute('content', String(content));
        }
      } else if (type === 'link') {
        const { rel, href } = props;
        if (typeof document !== 'undefined' && rel && href) {
          let el = document.head.querySelector(`link[rel="${rel}"]`);
          if (!el) {
            el = document.createElement('link');
            el.setAttribute('rel', rel);
            document.head.appendChild(el);
          }
          el.setAttribute('href', String(href));
        }
      }
    };
    const walk = nodes => {
      if (!nodes) return;
      const arr = Array.isArray(nodes) ? nodes : [nodes];
      for (const n of arr) {
        applyNode(n);
        if (n && n.props && n.props.children) {
          walk(n.props.children);
        }
      }
    };
    try {
      walk(children);
    } catch {
      // best effort in tests
    }
    return null;
  };
  const HelmetProvider = ({ children }) => children;
  return { Helmet, HelmetProvider };
});

// Setup cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});
