// Lighthouse CI Configuration for FinanceAnalyst Pro (CJS)

module.exports = {
  ci: {
    collect: {
      // Start a real preview server so SPA fallback works and avoids NO_FCP
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      url: ['http://localhost:4173/?lhci=1&pwa=0'],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        // Block potentially disruptive 3rd-party scripts during CI
        blockedUrlPatterns: [
          '*static.rocket.new*',
          '*application.rocket.new*',
          '*builtwithrocket.new*'
        ]
      }
    },
    assert: {
      assertions: {
        // Performance budgets
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        
        // Core Web Vitals
        'metrics:largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'metrics:first-input-delay': ['error', { maxNumericValue: 100 }],
        'metrics:cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'metrics:first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'metrics:interactive': ['error', { maxNumericValue: 3800 }],
        'metrics:speed-index': ['error', { maxNumericValue: 3400 }],
        
        // Bundle size audits
        'resource-summary:script:size': ['error', { maxNumericValue: 1024000 }], // 1MB JS
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 102400 }], // 100KB CSS
        'resource-summary:image:size': ['error', { maxNumericValue: 512000 }], // 500KB images
        'resource-summary:total:size': ['error', { maxNumericValue: 2048000 }], // 2MB total
        
        // Security and best practices
        'uses-https': 'error',
        'uses-http2': 'error',
        'uses-text-compression': 'error',
        'efficient-animated-content': 'error',
        'modern-image-formats': 'warn',
        'unused-css-rules': 'warn',
        'unused-javascript': 'warn',
        
        // Accessibility requirements
        'color-contrast': 'error',
        'html-has-lang': 'error',
        'html-lang-valid': 'error',
        'meta-viewport': 'error',
        'document-title': 'error',
        'link-name': 'error',
        'button-name': 'error',
        'image-alt': 'error',
        'input-image-alt': 'error',
        'label': 'error',
        'aria-allowed-attr': 'error',
        'aria-required-attr': 'error',
        'aria-valid-attr-value': 'error',
        'aria-valid-attr': 'error',
        'heading-order': 'error',
        'landmark-one-main': 'error',
        'skip-link': 'error',
        
        // SEO requirements
        'meta-description': 'error',
        'canonical': 'error',
        'robots-txt': 'error',
        'hreflang': 'off', // Not applicable for single-language app
        'structured-data': 'warn'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    server: {
      port: 9001,
      storage: './lighthouse-reports'
    }
  }
};
