/**
 * Test Configuration for FinanceAnalyst Pro
 * Comprehensive test settings for different environments and test types
 * Configurable test suites, timeouts, and reporting options
 */

export const testConfig = {
  // General test settings
  general: {
    timeout: 30000, // 30 seconds per test
    retries: 3,
    parallel: false,
    verbose: true,
    bail: false, // Stop on first failure
    slowTestThreshold: 1000, // Mark tests slower than 1s as slow
    grep: null, // Filter tests by pattern
    invert: false // Invert grep pattern
  },

  // Environment-specific settings
  environments: {
    development: {
      baseUrl: 'http://localhost:3000',
      apiUrl: 'http://localhost:3001/api',
      database: 'memory',
      cache: 'disabled',
      logging: 'debug'
    },

    staging: {
      baseUrl: 'https://staging.financeanalyst.com',
      apiUrl: 'https://staging-api.financeanalyst.com',
      database: 'staging',
      cache: 'enabled',
      logging: 'info'
    },

    production: {
      baseUrl: 'https://app.financeanalyst.com',
      apiUrl: 'https://api.financeanalyst.com',
      database: 'production',
      cache: 'enabled',
      logging: 'warn'
    },

    test: {
      baseUrl: 'http://localhost:3000',
      apiUrl: 'http://localhost:3001/api',
      database: 'test',
      cache: 'disabled',
      logging: 'debug'
    }
  },

  // Test categories configuration
  categories: {
    unit: {
      enabled: true,
      files: [
        'src/services/**/*.test.js',
        'src/components/**/*.test.js',
        'src/utils/**/*.test.js'
      ],
      timeout: 10000,
      retries: 2,
      coverage: true
    },

    integration: {
      enabled: true,
      files: [
        'src/test/integration/**/*.test.js'
      ],
      timeout: 30000,
      retries: 3,
      coverage: true,
      setup: ['database', 'cache', 'api']
    },

    e2e: {
      enabled: true,
      files: [
        'src/test/e2e/**/*.test.js'
      ],
      timeout: 60000,
      retries: 2,
      coverage: false,
      browser: 'chrome',
      headless: true,
      viewport: { width: 1280, height: 720 }
    },

    performance: {
      enabled: true,
      files: [
        'src/test/performance/**/*.test.js'
      ],
      timeout: 120000,
      retries: 1,
      coverage: false,
      thresholds: {
        performance: 90,
        accessibility: 90,
        'best-practices': 90,
        seo: 90
      }
    },

    security: {
      enabled: true,
      files: [
        'src/test/security/**/*.test.js'
      ],
      timeout: 45000,
      retries: 2,
      coverage: true,
      scanners: ['snyk', 'owasp', 'custom']
    },

    mobile: {
      enabled: true,
      files: [
        'src/test/mobile/**/*.test.js'
      ],
      timeout: 60000,
      retries: 2,
      coverage: true,
      devices: [
        { name: 'iPhone SE', width: 375, height: 667 },
        { name: 'iPhone 12', width: 390, height: 844 },
        { name: 'iPad', width: 768, height: 1024 },
        { name: 'Samsung Galaxy S21', width: 360, height: 800 }
      ]
    },

    accessibility: {
      enabled: true,
      files: [
        'src/test/accessibility/**/*.test.js'
      ],
      timeout: 30000,
      retries: 2,
      coverage: false,
      standards: ['WCAG2A', 'WCAG2AA'],
      tools: ['axe-core', 'pa11y']
    },

    visual: {
      enabled: false, // Disabled by default
      files: [
        'src/test/visual/**/*.test.js'
      ],
      timeout: 60000,
      retries: 1,
      coverage: false,
      baselinePath: 'src/test/visual/baselines',
      diffPath: 'src/test/visual/diffs'
    }
  },

  // Test data configuration
  testData: {
    users: {
      admin: {
        email: 'admin@test.com',
        password: 'Admin123!',
        role: 'super-admin',
        firstName: 'Test',
        lastName: 'Admin'
      },

      analyst: {
        email: 'analyst@test.com',
        password: 'Analyst123!',
        role: 'analyst',
        firstName: 'Test',
        lastName: 'Analyst'
      },

      viewer: {
        email: 'viewer@test.com',
        password: 'Viewer123!',
        role: 'viewer',
        firstName: 'Test',
        lastName: 'Viewer'
      }
    },

    portfolios: {
      sample: {
        userId: 'test-user',
        holdings: [
          { symbol: 'AAPL', quantity: 100, price: 150.00 },
          { symbol: 'GOOGL', quantity: 50, price: 2800.00 },
          { symbol: 'MSFT', quantity: 75, price: 300.00 }
        ]
      }
    },

    marketData: {
      sample: {
        AAPL: { symbol: 'AAPL', price: 150.50, change: 2.5, volume: 1000000 },
        GOOGL: { symbol: 'GOOGL', price: 2805.00, change: -1.2, volume: 500000 },
        MSFT: { symbol: 'MSFT', price: 305.75, change: 1.8, volume: 750000 }
      }
    }
  },

  // API mocking configuration
  apiMocks: {
    enabled: true,
    delay: 100, // Mock response delay in ms
    endpoints: {
      '/api/auth/login': {
        method: 'POST',
        response: {
          success: true,
          token: 'mock-jwt-token',
          user: { id: 'test-user', email: 'test@example.com' }
        }
      },

      '/api/market/quote': {
        method: 'GET',
        response: {
          symbol: 'AAPL',
          price: 150.50,
          change: 2.5,
          volume: 1000000
        }
      },

      '/api/portfolio': {
        method: 'GET',
        response: [
          { symbol: 'AAPL', quantity: 100, price: 150.00 },
          { symbol: 'GOOGL', quantity: 50, price: 2800.00 }
        ]
      }
    }
  },

  // Browser configuration for E2E tests
  browser: {
    chrome: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      viewport: { width: 1280, height: 720 }
    },

    firefox: {
      headless: true,
      args: ['-headless'],
      viewport: { width: 1280, height: 720 }
    },

    safari: {
      headless: false, // Safari doesn't support headless
      viewport: { width: 1280, height: 720 }
    }
  },

  // Performance thresholds
  performance: {
    thresholds: {
      'Time to First Byte': 800, // ms
      'First Contentful Paint': 1800, // ms
      'Largest Contentful Paint': 2500, // ms
      'First Input Delay': 100, // ms
      'Cumulative Layout Shift': 0.1,
      'Speed Index': 3000, // ms
      'Total Blocking Time': 200 // ms
    },

    budgets: {
      javascript: { size: 500 * 1024 }, // 500KB
      css: { size: 100 * 1024 }, // 100KB
      images: { size: 2 * 1024 * 1024 }, // 2MB
      fonts: { size: 500 * 1024 }, // 500KB
      total: { size: 5 * 1024 * 1024 } // 5MB
    }
  },

  // Coverage configuration
  coverage: {
    enabled: true,
    reporter: ['text', 'lcov', 'html'],
    exclude: [
      'node_modules/',
      'src/test/',
      'src/**/*.test.js',
      'src/**/*.spec.js',
      'public/',
      'dist/',
      'build/'
    ],
    thresholds: {
      global: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    }
  },

  // Reporting configuration
  reporting: {
    enabled: true,
    formats: ['console', 'json', 'html', 'junit'],
    outputDir: 'test-results',
    filename: 'test-report',
    includeScreenshots: true,
    includeVideos: false,
    includeLogs: true
  },

  // Notification configuration
  notifications: {
    enabled: true,
    onFailure: true,
    onSuccess: false,
    channels: {
      console: true,
      slack: false,
      email: false,
      webhook: false
    },
    slack: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: '#test-results',
      username: 'Test Runner'
    },
    email: {
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      },
      from: 'test-runner@financeanalyst.com',
      to: ['qa@financeanalyst.com'],
      subject: 'FinanceAnalyst Pro Test Results'
    }
  },

  // Database configuration for tests
  database: {
    test: {
      type: 'sqlite',
      filename: ':memory:',
      logging: false,
      sync: true
    },

    integration: {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: 'financeanalyst_test',
      username: process.env.DB_USER || 'test',
      password: process.env.DB_PASS || 'test',
      logging: false
    }
  },

  // Cache configuration for tests
  cache: {
    test: {
      enabled: false
    },

    integration: {
      enabled: true,
      ttl: 300, // 5 minutes
      maxSize: 100 * 1024 * 1024 // 100MB
    }
  },

  // Security test configuration
  security: {
    scanners: {
      owasp: {
        enabled: true,
        config: {
          severity: ['high', 'medium'],
          excludePaths: ['/api/health', '/api/status']
        }
      },

      snyk: {
        enabled: true,
        config: {
          severity: 'high',
          exclude: ['node_modules/**']
        }
      }
    },

    policies: {
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },

      sessionPolicy: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: true,
        httpOnly: true,
        sameSite: 'strict'
      }
    }
  },

  // Mobile test configuration
  mobile: {
    devices: [
      {
        name: 'iPhone SE',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
      },

      {
        name: 'iPhone 12',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true
      },

      {
        name: 'iPad',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2,
        isMobile: false,
        hasTouch: true
      },

      {
        name: 'Samsung Galaxy S21',
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        viewport: { width: 360, height: 800 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true
      }
    ],

    gestures: {
      swipe: {
        threshold: 50,
        velocity: 0.3
      },

      pinch: {
        threshold: 0.1,
        minScale: 0.5,
        maxScale: 2.0
      },

      longPress: {
        duration: 500
      }
    }
  },

  // Accessibility test configuration
  accessibility: {
    standards: ['WCAG2A', 'WCAG2AA', 'Section508'],
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'screen-reader': { enabled: true },
      'semantic-html': { enabled: true },
      'focus-management': { enabled: true },
      'alt-text': { enabled: true }
    },

    viewports: [
      { width: 320, height: 568 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1024, height: 768 }, // Desktop
      { width: 1920, height: 1080 } // Large screen
    ]
  },

  // Continuous Integration configuration
  ci: {
    enabled: process.env.CI === 'true',
    parallel: true,
    shard: process.env.CI_SHARD,
    totalShards: process.env.CI_TOTAL_SHARDS,
    buildNumber: process.env.BUILD_NUMBER,
    commitHash: process.env.COMMIT_HASH,
    branch: process.env.BRANCH_NAME
  }
};

// Environment-specific overrides
const environment = process.env.NODE_ENV || 'test';
const envConfig = testConfig.environments[environment] || testConfig.environments.test;

// Merge environment config
Object.assign(testConfig, envConfig);

// Export configuration
export default testConfig;

// Helper functions
export const getTestConfig = (category = null) => {
  if (category) {
    return testConfig.categories[category] || {};
  }
  return testConfig;
};

export const getTestData = (type, key = null) => {
  if (key) {
    return testConfig.testData[type]?.[key] || {};
  }
  return testConfig.testData[type] || {};
};

export const getPerformanceThresholds = () => {
  return testConfig.performance.thresholds;
};

export const getCoverageConfig = () => {
  return testConfig.coverage;
};

export const isCategoryEnabled = (category) => {
  return testConfig.categories[category]?.enabled || false;
};

export const getTimeout = (category = null) => {
  if (category && testConfig.categories[category]) {
    return testConfig.categories[category].timeout;
  }
  return testConfig.general.timeout;
};

export const shouldRunInParallel = () => {
  return testConfig.ci.enabled ? testConfig.ci.parallel : testConfig.general.parallel;
};

// Validation function
export const validateConfig = () => {
  const errors = [];

  // Validate general settings
  if (testConfig.general.timeout < 1000) {
    errors.push('Test timeout must be at least 1000ms');
  }

  // Validate categories
  Object.entries(testConfig.categories).forEach(([name, config]) => {
    if (config.enabled && (!config.files || config.files.length === 0)) {
      errors.push(`Category '${name}' is enabled but has no test files`);
    }
  });

  // Validate performance thresholds
  Object.entries(testConfig.performance.thresholds).forEach(([metric, threshold]) => {
    if (typeof threshold !== 'number' || threshold <= 0) {
      errors.push(`Invalid performance threshold for ${metric}: ${threshold}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

// Initialize configuration validation
const validation = validateConfig();
if (!validation.valid) {
  console.warn('Test configuration validation failed:');
  validation.errors.forEach(error => console.warn(`  - ${error}`));
}

