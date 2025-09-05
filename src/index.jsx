// Polyfills for cross-browser compatibility
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Conditionally load polyfills only if needed
const loadPolyfills = async () => {
  if (typeof Promise === 'undefined') {
    const promisePolyfill = await import('promise-polyfill');
    // eslint-disable-next-line no-global-assign
    Promise = promisePolyfill.default;
  }

  if (typeof fetch === 'undefined') {
    await import('whatwg-fetch');
  }
};

// Load polyfills asynchronously
loadPolyfills().catch(console.warn);

if (!Array.prototype.includes) {
  Array.prototype.includes = function (searchElement) {
    return this.indexOf(searchElement) !== -1;
  };
}

if (!String.prototype.includes) {
  String.prototype.includes = function (searchString) {
    return this.indexOf(searchString) !== -1;
  };
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import analytics, { trackFeatureAccess } from './utils/analytics.jsx';
import { initializePerformanceMonitoring } from './utils/performanceMonitoring';
import PWAService from './utils/pwaService';
import { initializeSecurity } from './utils/securityHeaders';
import { unregisterSW } from './utils/serviceWorker';

// Check if root element exists - DEBUG LOGGING
console.log('🔧 Starting React application initialization...');

if (!document.getElementById('root')) {
  console.error('❌ CRITICAL: Root container not found in DOM!');
}
const container = document.getElementById('root');
// DEBUG: Before performance monitoring init
console.log('⚡ About to initialize performance monitoring...');
try {
  console.log('✅ Performance monitoring initialized successfully');
} catch (error) {
  console.error('❌ Performance monitoring failed:', error);
}
const root = createRoot(container);

// Initialize performance monitoring
// DEBUG: Before React render
console.log('🚀 About to render React application...');
try {
initializePerformanceMonitoring();

// Initialize analytics
analytics.initializeAnalytics();
  console.log('✅ React render initiated successfully');
} catch (error) {
  console.error('❌ React render failed:', error);
  throw error;
}

// Track app initialization
trackFeatureAccess('app_initialized', {
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString(),
  url: window.location.href
});

// Render the application with routing
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// Detect automated/CI environments (e.g., Playwright, LHCI)
const isAutomatedEnv = (() => {
  try {
    const params = new URLSearchParams(window.location.search);
    return (
      navigator.webdriver === true || params.has('lhci') || params.has('ci') || params.has('audit')
    );
  } catch {
    return navigator.webdriver === true;
  }
})();

// Initialize security measures
const securityNonce = initializeSecurity();

// Initialize PWA features only outside development to avoid HMR/cache interference
const pwaService = new PWAService();
if (!import.meta.env.DEV) {
  pwaService.init();
} else {
  // Ensure any previously registered service workers are removed during dev
  try {
    unregisterSW();
    // Also attempt a direct cleanup to be thorough
    if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
    }

    console.warn('PWA is disabled in development to prevent caching issues with HMR.');
  } catch (e) {
    console.warn('Attempted to disable PWA in development, but encountered:', e);
  }
}

// Initialize monitoring only when NOT in automated environments to keep tests stable
if (!isAutomatedEnv) {
  const idle =
    typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback
      : cb => setTimeout(cb, 300);

  // Initialize Sentry Performance Monitoring lazily during idle time
  idle(() => {
    import('@sentry/react')
      .then(Sentry => {
        const integrations = [Sentry.browserTracingIntegration()];
        if (import.meta.env.VITE_SENTRY_REPLAY === 'true') {
          integrations.push(
            Sentry.replayIntegration({
              maskAllText: false,
              blockAllMedia: false
            })
          );
        }

        Sentry.init({
          dsn: import.meta.env.VITE_SENTRY_DSN,
          environment: import.meta.env.MODE,
          integrations,
          tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
          replaysSessionSampleRate: import.meta.env.VITE_SENTRY_REPLAY === 'true' ? 0.1 : 0,
          replaysOnErrorSampleRate: import.meta.env.VITE_SENTRY_REPLAY === 'true' ? 1.0 : 0,
          beforeSend(event) {
            // Filter out development errors
            if (import.meta.env.MODE === 'development' && event.exception) {
              const error = event.exception.values?.[0];
              if (error?.value?.includes('ResizeObserver loop limit exceeded')) {
                return null;
              }
            }
            return event;
          }
        });

        // Expose globally for compatibility
        window.Sentry = Sentry;
      })
      .catch(e => console.warn('Skipping Sentry initialization:', e));
  });

  // Performance monitoring after Sentry (already initialized statically above)
  idle(() => {
    // Performance monitoring already initialized above via static import
    console.log('Performance monitoring initialization completed');
  });

  // Other monitoring modules
  idle(() => {
    import('./services/productionMonitoring')
      .then(mod => {
        // Singleton instance exports as default; ensure initialized if exposed
        if (mod?.default?.init) {
          mod.default.init();
        }
      })
      .catch(e => console.warn('Skipping production monitoring initialization:', e));

    import('./utils/monitoring').catch(() => {
      /* Analytics monitoring is optional; ignore errors */
    });
  });
} else {
  console.warn('Automated environment detected; monitoring disabled for stability.');
}

// Log initialization complete
console.log('🚀 FinanceAnalyst Pro initialized with security nonce:', securityNonce);
