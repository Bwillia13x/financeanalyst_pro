import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import App from './App';
import ProductionErrorBoundary from './components/ErrorBoundary/ProductionErrorBoundary';
import { store } from './store/store';
import { initializePerformanceMonitoring } from './utils/performanceMonitoring';
import { initializeSecurity } from './utils/securityHeaders';
import { initializePWA, unregisterSW } from './utils/serviceWorker';
import './styles/tailwind.css';
import './styles/index.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ProductionErrorBoundary level="app">
    <Provider store={store}>
      <App />
    </Provider>
  </ProductionErrorBoundary>
);

// Detect automated/CI environments (e.g., Playwright, LHCI)
const isAutomatedEnv = (() => {
  try {
    const params = new URLSearchParams(window.location.search);
    return (
      navigator.webdriver === true ||
      params.has('lhci') ||
      params.has('ci') ||
      params.has('audit')
    );
  } catch {
    return navigator.webdriver === true;
  }
})();

// Initialize security measures
const securityNonce = initializeSecurity();

// Initialize PWA features only outside development to avoid HMR/cache interference
if (!import.meta.env.DEV) {
  initializePWA();
} else {
  // Ensure any previously registered service workers are removed during dev
  try {
    unregisterSW();
    // Also attempt a direct cleanup to be thorough
    if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
    }

    console.warn('PWA is disabled in development to prevent caching issues with HMR.');
  } catch (e) {

    console.warn('Attempted to disable PWA in development, but encountered:', e);
  }
}

// Initialize monitoring only when NOT in automated environments to keep tests stable
if (!isAutomatedEnv) {
  // Performance monitoring
  initializePerformanceMonitoring();

  // Dynamically import monitoring modules to avoid side effects during tests
  import('./services/productionMonitoring')
    .then((mod) => {
      // Singleton instance exports as default; ensure initialized if exposed
      if (mod?.default?.init) {
        mod.default.init();
      }
    })
    .catch((e) => console.warn('Skipping production monitoring initialization:', e));

  import('./utils/monitoring').catch(() => {
    /* Analytics monitoring is optional; ignore errors */
  });
} else {
  console.warn('Automated environment detected; monitoring disabled for stability.');
}

// Log initialization complete
console.log('🚀 FinanceAnalyst Pro initialized with security nonce:', securityNonce);
