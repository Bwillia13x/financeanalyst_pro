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
import { HelmetProvider } from 'react-helmet-async';

// Import main CSS file
import './styles/index.css';

import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import analytics, { trackFeatureAccess } from './utils/analytics.jsx';
import { featureFlags } from './config/featureFlags';
// Performance monitoring initializes in App
// Use the singleton instance for PWA features
import pwaService from './utils/pwaService';
import { initializeSecurity } from './utils/securityHeaders';
import { unregisterSW } from './utils/serviceWorker';

// Mount root safely
const container = document.getElementById('root');
if (!container) {
  // Fail fast in a controlled way if the root is missing
  throw new Error('Root container not found in DOM');
}
const root = createRoot(container);

// Initialize analytics once here
analytics.initializeAnalytics();

// Track app initialization (respect verbose flag in development)
try {
  if (import.meta.env.DEV || featureFlags.VERBOSE_LOGGING) {
    trackFeatureAccess('app_initialized', {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
  }
} catch {}

// Render the application with routing
root.render(
  <HelmetProvider>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </HelmetProvider>
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
if (!import.meta.env.DEV) {
  pwaService.init().catch(() => {});
} else {
  // Ensure any previously registered service workers are removed during dev
  try {
    unregisterSW();
    if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
    }
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

  // Initialize Sentry Performance Monitoring lazily during idle time (only if enabled at build)
  if (__ENABLE_SENTRY__) {
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
          // Optional: development-only environment prints
          if (import.meta.env.DEV && featureFlags.VERBOSE_LOGGING) {
            console.log('🔍 Environment variable check (dev only)');
            console.log('MODE:', import.meta.env.MODE);
          }

          // Only initialize Sentry if we have a valid DSN
          const dsn = import.meta.env.VITE_SENTRY_DSN;
          if (!dsn || dsn.includes('your_') || dsn.includes('_dsn_here')) {
            console.warn('Sentry DSN not configured, skipping Sentry initialization');
            return;
          }

          Sentry.init({
            dsn: dsn,
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
  }

  // Performance monitoring after Sentry (already initialized statically above)
  idle(() => {
    if (import.meta.env.DEV) {
      console.log('Performance monitoring initialization completed');
    }
    // Collect and forward Core Web Vitals
    import('web-vitals')
      .then(({ onCLS, onFID, onLCP, onINP, onFCP }) => {
        const send = (metric) => {
          try {
            // shape: { name, value, id, rating }
            fetch('/api/errors', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'web-vital',
                name: metric.name,
                value: metric.value,
                id: metric.id,
                rating: metric.rating,
                url: window.location.pathname,
                ts: Date.now()
              })
            }).catch(() => {});
          } catch {}
        };
        onCLS(send);
        onFID(send);
        onLCP(send);
        onINP?.(send);
        onFCP(send);
      })
      .catch(() => {});
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

if (import.meta.env.DEV && featureFlags.VERBOSE_LOGGING) {
  console.log('🚀 Valor-IVX initialized with security nonce:', securityNonce);
}
