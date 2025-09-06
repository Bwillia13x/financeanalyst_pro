import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { imageOptimization } from './vite-plugins/imageOptimization.js'
import { performanceConfig } from './src/config/vite.config.performance.js'

// When running Lighthouse CI in audit mode, we want to build only the minimal audit page
// and avoid pulling the full app's vendor chunk into the audit entry.
const isAuditBuild = process.env.VITE_BUILD_TARGET === 'audit'
const isPerformanceBuild = process.env.VITE_BUILD_MODE === 'performance'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __ENABLE_DEMOS__: process.env.VITE_ENABLE_DEMOS === 'true',
    __MOBILE_SECONDARY_NAV_DRAWER__: process.env.VITE_MOBILE_SECONDARY_NAV_DRAWER === 'true',
    __VERBOSE_LOGGING__: process.env.VITE_VERBOSE_LOGGING !== 'false',
    __ENABLE_SENTRY__: Boolean(process.env.VITE_SENTRY_DSN),
    __ENABLE_A11Y_DEV__: process.env.VITE_ENABLE_A11Y_DEV === 'true',
  },
  plugins: [
    react(),
    imageOptimization({
      sizes: [320, 640, 768, 1024, 1280, 1920],
      quality: 80,
      formats: ['webp', 'avif'],
      includeOriginal: true,
      enableInDev: false
    })
  ],
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
      // Avoid bundling axe-core in production: alias accessibilityTesting to a stub unless explicitly enabled
      'src/utils/accessibilityTesting': (process.env.VITE_ENABLE_A11Y_DEV === 'true')
        ? fileURLToPath(new URL('./src/utils/accessibilityTesting.js', import.meta.url))
        : fileURLToPath(new URL('./src/utils/accessibilityTesting.stub.js', import.meta.url)),
      // Extra belt-and-suspenders: if a11y dev is disabled, point 'axe-core' to a tiny stub
      ...(process.env.VITE_ENABLE_A11Y_DEV === 'true'
        ? {}
        : {
            'axe-core': fileURLToPath(new URL('./src/utils/axe-core.stub.js', import.meta.url)),
          })
    },
    // Avoid multiple React copies in dev which can cause invalid hook calls
    dedupe: ['react', 'react-dom']
  },
  server: {
    // Fix HMR/WebSocket port mismatch by pinning the dev server
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
    fs: {
      allow: [
        '/Users/benjaminwilliams/Desktop/financeanalyst_pro',
        '/Users/benjaminwilliams/haven_test',
        '/Users/benjaminwilliams/local_financepro/financeanalyst_pro',
        '/Users/benjaminwilliams/financeanalyst_pro-1',
        '/Users/benjaminwilliams/valor-ivx-pro(08.17.2025)/financeanalyst_pro',
        '/Users/benjaminwilliams/financeanalyst_pro',
        process.cwd(), // Add current working directory to filesystem access
      ],
    },
    // Explicitly configure headers and CORS for JavaScript module loading
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
    proxy: {
      '/v8/finance/chart': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
      },
    },
  },
  build: isPerformanceBuild ? {
    // ===== INSTITUTIONAL PERFORMANCE BUILD =====
    ...performanceConfig.build,

    // Override with existing audit handling
    rollupOptions: {
      ...performanceConfig.build.rollupOptions,
      input: isAuditBuild
        ? {
            audit: fileURLToPath(new URL('./audit.html', import.meta.url)),
          }
        : {
            main: fileURLToPath(new URL('./index.html', import.meta.url)),
            audit: fileURLToPath(new URL('./audit.html', import.meta.url)),
          }
    }
  } : {
    // ===== STANDARD BUILD =====
    rollupOptions: {
      // Build only the minimal audit page for audit builds; otherwise build both pages
      input: isAuditBuild
        ? {
            audit: fileURLToPath(new URL('./audit.html', import.meta.url)),
          }
        : {
            main: fileURLToPath(new URL('./index.html', import.meta.url)),
            audit: fileURLToPath(new URL('./audit.html', import.meta.url)),
          },
      output: {
        manualChunks: (id) => {
          // Keep the audit bundle extremely small by not aggregating a global vendor chunk
          if (isAuditBuild) {
            if (/node_modules\/react\//.test(id)) {
              return 'react-core'
            }
            if (/node_modules\/react-dom\//.test(id)) {
              return 'react-dom'
            }
            // Let Rollup decide for other modules; avoid pulling unrelated deps
            return undefined
          }
          // Split React core from React ecosystem with precise matching to avoid oversized chunks
          if (/node_modules\/react\//.test(id)) {
            return 'react-core';
          }
          if (/node_modules\/react-dom\//.test(id)) {
            return 'react-dom';
          }
          if (/node_modules\/(react-router|react-router-dom)\//.test(id)) {
            return 'react-router';
          }

          // Split chart libraries more granularly
          if (id.includes('recharts')) {
            return 'recharts-vendor';
          }
          if (id.includes('d3')) {
            return 'd3-vendor';
          }

          // Icons can be large; split lucide-react separately from other UI
          if (id.includes('lucide-react')) {
            return 'icons-vendor';
          }

          // Advanced Analytics - separate chunk for new features
          if (id.includes('AdvancedAnalytics') || id.includes('advancedAnalyticsService')) {
            return 'advanced-analytics';
          }

          // Analytics pages and BI panels
          if (id.includes('/pages/Analytics') || id.includes('/components/Analytics')) {
            return 'analytics-pages';
          }
          if (id.includes('/components/BusinessIntelligence')) {
            return 'bi-dashboard';
          }

          // Performance pages and dashboards
          if (id.includes('/pages/Performance') || id.includes('/components/Performance/')) {
            return 'performance-pages';
          }

          // Let React.lazy drive code-splitting for Private Analysis; no forced manual chunk

          // Export libraries - heavy dependencies
          if (id.includes('xlsx') || id.includes('jspdf') || id.includes('jspdf-autotable')) {
            return 'export-vendor';
          }

          // Crypto and security libraries
          if (id.includes('crypto-js') || id.includes('bcrypt')) {
            return 'security-vendor';
          }

          // OpenAI and AI libraries
          if (id.includes('openai') || id.includes('ai')) {
            return 'ai-vendor';
          }

          // Virtualization libraries
          if (id.includes('react-window') || id.includes('react-virtualized')) {
            return 'virtualization-vendor';
          }

          // Animation and UI libraries
          if (id.includes('framer-motion')) {
            return 'ui-vendor';
          }

          // Data processing libraries
          if (id.includes('axios') || id.includes('date-fns') || id.includes('papaparse')) {
            return 'data-vendor';
          }

          // Utility libraries
          if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
            return 'utils-vendor';
          }

          // Redux and state management
          if (id.includes('redux') || id.includes('@reduxjs')) {
            return 'state-vendor';
          }

          // Monitoring and error tracking
          if (id.includes('sentry') || id.includes('@sentry')) {
            return 'monitoring-vendor';
          }

          // Node modules that aren't specifically chunked
          if (id.includes('node_modules')) {
            // Split remaining node_modules by package to avoid a massive vendor chunk
            const match = id.split('node_modules/')[1];
            if (match) {
              const parts = match.split('/');
              const pkg = parts[0].startsWith('@') ? `${parts[0]}-${parts[1]}` : parts[0];
              const safe = pkg.replace(/^@/, '').replace(/\//g, '-');
              return `vendor-${safe}`;
            }
            return 'vendor';
          }
        }
      }
    },
    sourcemap: true,
    chunkSizeWarningLimit: 800,
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        // Keep warnings and errors; remove noisy logs in production
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
        unsafe_arrows: true,
        unsafe_methods: true
      },
      mangle: {
        safari10: true
      }
    },
    // Enable tree shaking
    treeshake: {
      preset: 'recommended'
    },
    // Optimize chunks for better caching
    assetsInlineLimit: 4096,
    cssCodeSplit: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'tests/integration/**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/e2e/**',
      'tests/performance/**',
      'tests/security/**',
      'tests/smoke/**',
    ],
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/**/*.test.{js,jsx,ts,tsx}',
        'src/**/*.spec.{js,jsx,ts,tsx}',
        'src/**/*.config.js',
        'src/**/*.config.mjs',
        'src/**/*.setup.js',
        'src/**/*.d.ts',
        'src/**/*.stories.{js,jsx,ts,tsx}',
        'src/main.jsx',
        'src/index.jsx',
        'src/vite-env.d.ts',
        'src/types/',
        'src/examples/',
        'src/docs/',
        'public/',
        'scripts/',
        'tests/',
        'test-results/',
        'coverage/',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        './src/components/': {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75,
        },
        './src/hooks/': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        './src/utils/': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        './src/services/': {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75,
        },
        './src/store/': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      all: true,
      include: ['src/**/*.{js,jsx,ts,tsx}'],
    },
  },
})
