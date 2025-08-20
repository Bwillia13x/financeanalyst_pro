import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import App from './App';
import { store } from './store/store';
import ProductionErrorBoundary from './components/ErrorBoundary/ProductionErrorBoundary';
import productionMonitoring from './services/productionMonitoring';
import { initializePerformanceMonitoring } from './utils/performanceMonitoring';
import { initializeSecurity } from './utils/securityHeaders';
import { initializePWA, unregisterSW } from './utils/serviceWorker';
import './styles/tailwind.css';
import './styles/index.css';
import './utils/monitoring';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ProductionErrorBoundary level="app">
    <Provider store={store}>
      <App />
    </Provider>
  </ProductionErrorBoundary>
);

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
    // eslint-disable-next-line no-console
    console.warn('PWA is disabled in development to prevent caching issues with HMR.');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Attempted to disable PWA in development, but encountered:', e);
  }
}

// Initialize performance monitoring
initializePerformanceMonitoring();

// Initialize production monitoring
productionMonitoring.init();

// Log initialization complete
console.log('🚀 FinanceAnalyst Pro initialized with security nonce:', securityNonce);
