// Security Headers Management and CSP Nonce Generation

// Generate secure nonce for CSP
export function generateNonce() {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array));
  }

  // Fallback for server-side or older browsers
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Store current nonce for the session
let currentNonce = null;

export function getCurrentNonce() {
  if (!currentNonce) {
    currentNonce = generateNonce();
  }
  return currentNonce;
}

// Refresh nonce (call on navigation or sensitive operations)
export function refreshNonce() {
  currentNonce = generateNonce();
  return currentNonce;
}

// CSP Policy Builder
export class CSPPolicyBuilder {
  constructor() {
    this.policies = {};
  }

  // Set default secure policies
  setDefaults() {
    this.policies = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Will be replaced with nonces in production
        "'unsafe-eval'", // Required for some financial calculations
        'https://static.rocket.new', // Third-party service
        // Monitoring & Analytics
        'https://www.googletagmanager.com',
        'https://static.hotjar.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for CSS-in-JS
        'https://fonts.googleapis.com'
      ],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'connect-src': [
        "'self'",
        'https://www.alphavantage.co',
        'https://financialmodelingprep.com',
        'https://data.sec.gov',
        'https://query1.finance.yahoo.com',
        'https://query2.finance.yahoo.com',
        'https://data.nasdaq.com',
        'https://fred.stlouisfed.org',
        // Monitoring & Analytics
        'https://www.google-analytics.com',
        'https://www.googletagmanager.com',
        'https://script.hotjar.com',
        'https://in.hotjar.com',
        'https://api.hotjar.com',
        'https://*.sentry.io',
        'https://*.ingest.sentry.io',
        'wss://*.hotjar.com'
      ],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': [],
      'block-all-mixed-content': []
    };
    return this;
  }

  // Add nonce to script-src and style-src
  addNonce(nonce) {
    if (this.policies['script-src']) {
      // Remove unsafe-inline when nonce is present
      this.policies['script-src'] = this.policies['script-src']
        .filter(src => src !== "'unsafe-inline'")
        .concat([`'nonce-${nonce}'`]);
    }

    if (this.policies['style-src']) {
      // Keep unsafe-inline for CSS-in-JS compatibility
      this.policies['style-src'] = this.policies['style-src'].concat([`'nonce-${nonce}'`]);
    }

    return this;
  }

  // Add specific domain to directive
  addSource(directive, source) {
    if (!this.policies[directive]) {
      this.policies[directive] = [];
    }
    if (!this.policies[directive].includes(source)) {
      this.policies[directive].push(source);
    }
    return this;
  }

  // Remove source from directive
  removeSource(directive, source) {
    if (this.policies[directive]) {
      this.policies[directive] = this.policies[directive].filter(src => src !== source);
    }
    return this;
  }

  // Build final CSP string
  build() {
    return Object.entries(this.policies)
      .map(([directive, sources]) => {
        if (sources.length === 0) {
          return directive;
        }
        return `${directive} ${sources.join(' ')}`;
      })
      .join('; ');
  }
}

// Security Headers Configuration
export const securityHeaders = {
  // Content Security Policy
  getCSP: (nonce = null) => {
    const builder = new CSPPolicyBuilder().setDefaults();

    if (nonce) {
      builder.addNonce(nonce);
    }

    // Add development-specific policies
    if (import.meta.env.DEV) {
      builder
        .addSource('script-src', 'http://localhost:*')
        .addSource('connect-src', 'ws://localhost:*')
        .addSource('connect-src', 'http://localhost:*');
    }

    return builder.build();
  },

  // HTTP Strict Transport Security
  getHSTS: () => {
    return 'max-age=31536000; includeSubDomains; preload';
  },

  // X-Frame-Options
  getFrameOptions: () => {
    return 'DENY';
  },

  // X-Content-Type-Options
  getContentTypeOptions: () => {
    return 'nosniff';
  },

  // Referrer-Policy
  getReferrerPolicy: () => {
    return 'strict-origin-when-cross-origin';
  },

  // Permissions-Policy
  getPermissionsPolicy: () => {
    return [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'autoplay=()',
      'fullscreen=*',
      'picture-in-picture=*'
    ].join(', ');
  },

  // Cross-Origin policies
  getCrossOriginEmbedderPolicy: () => {
    return 'require-corp';
  },

  getCrossOriginOpenerPolicy: () => {
    return 'same-origin';
  },

  getCrossOriginResourcePolicy: () => {
    return 'same-origin';
  }
};

// Apply CSP nonce to script and style elements
export function applyCspNonce(nonce) {
  if (typeof document === 'undefined') return;

  // Add nonce to inline scripts
  const inlineScripts = document.querySelectorAll('script:not([src])');
  inlineScripts.forEach(script => {
    script.setAttribute('nonce', nonce);
  });

  // Add nonce to inline styles
  const inlineStyles = document.querySelectorAll('style');
  inlineStyles.forEach(style => {
    style.setAttribute('nonce', nonce);
  });
}

// Create secure headers for server responses
export function createSecureHeaders(nonce = null) {
  const headers = {};

  // CSP with nonce
  headers['Content-Security-Policy'] = securityHeaders.getCSP(nonce);

  // Security headers
  headers['Strict-Transport-Security'] = securityHeaders.getHSTS();
  headers['X-Frame-Options'] = securityHeaders.getFrameOptions();
  headers['X-Content-Type-Options'] = securityHeaders.getContentTypeOptions();
  headers['Referrer-Policy'] = securityHeaders.getReferrerPolicy();
  headers['Permissions-Policy'] = securityHeaders.getPermissionsPolicy();

  // Cross-Origin policies
  if (import.meta.env.PROD) {
    headers['Cross-Origin-Embedder-Policy'] = securityHeaders.getCrossOriginEmbedderPolicy();
    headers['Cross-Origin-Opener-Policy'] = securityHeaders.getCrossOriginOpenerPolicy();
    headers['Cross-Origin-Resource-Policy'] = securityHeaders.getCrossOriginResourcePolicy();
  }

  return headers;
}

// Validate CSP compliance
export function validateCSPCompliance() {
  const violations = [];

  if (typeof document === 'undefined') return violations;

  // Check for inline scripts without nonces
  const inlineScripts = document.querySelectorAll('script:not([src]):not([nonce])');
  if (inlineScripts.length > 0) {
    violations.push({
      type: 'inline-script-without-nonce',
      count: inlineScripts.length,
      elements: Array.from(inlineScripts).slice(0, 3) // First 3 for debugging
    });
  }

  // Check for inline styles without nonces (less critical due to CSS-in-JS)
  const inlineStyles = document.querySelectorAll('style:not([nonce])');
  if (inlineStyles.length > 5) {
    // Allow some CSS-in-JS styles
    violations.push({
      type: 'excessive-inline-styles',
      count: inlineStyles.length,
      recommendation: 'Consider consolidating CSS-in-JS styles'
    });
  }

  // Check for unsafe external resources
  const externalScripts = document.querySelectorAll('script[src]');
  externalScripts.forEach(script => {
    const src = script.getAttribute('src');
    if (src && !src.startsWith('https://') && !src.startsWith('/')) {
      violations.push({
        type: 'insecure-external-script',
        src,
        element: script
      });
    }
  });

  return violations;
}

// CSP violation reporter
export function setupCSPReporting() {
  if (typeof document === 'undefined') return;

  document.addEventListener('securitypolicyviolation', event => {
    const violation = {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      disposition: event.disposition,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.warn('CSP Violation:', violation);

    // In production, send to monitoring service
    if (import.meta.env.PROD) {
      sendCSPViolation(violation);
    }
  });
}

function sendCSPViolation(violation) {
  // Send to your monitoring service
  fetch('/api/csp-violations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(violation)
  }).catch(error => {
    console.error('Failed to report CSP violation:', error);
  });
}

// Initialize security measures
export function initializeSecurity() {
  const nonce = getCurrentNonce();

  // Apply nonce to existing elements
  applyCspNonce(nonce);

  // Setup CSP violation reporting
  setupCSPReporting();

  // Validate compliance
  const violations = validateCSPCompliance();
  if (violations.length > 0) {
    console.warn('CSP compliance issues found:', violations);
  }

  // Setup periodic compliance checks
  setInterval(() => {
    const currentViolations = validateCSPCompliance();
    if (currentViolations.length > violations.length) {
      console.warn(
        'New CSP compliance issues detected:',
        currentViolations.slice(violations.length)
      );
    }
  }, 30000); // Check every 30 seconds

  console.log('Security measures initialized with nonce:', nonce);
  return nonce;
}

// Hook for React components to get current nonce
export function useSecurityNonce() {
  return getCurrentNonce();
}
