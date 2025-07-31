import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import App from './App';
import { store } from './store/store';
import { initializePWA } from './utils/serviceWorker';
import { initializePerformanceMonitoring } from './utils/performanceMonitoring';
import { initializeSecurity } from './utils/securityHeaders';
import './styles/tailwind.css';
import './styles/index.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <App />
  </Provider>
);

// Initialize security measures
const securityNonce = initializeSecurity();

// Initialize PWA features
initializePWA();

// Initialize performance monitoring
initializePerformanceMonitoring();

// Log initialization complete
console.log('🚀 FinanceAnalyst Pro initialized with security nonce:', securityNonce);
