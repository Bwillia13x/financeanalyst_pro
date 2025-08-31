/**
 * Institutional Performance Configuration
 * Advanced code splitting and optimization for FinanceAnalyst Pro
 */

import { defineConfig } from 'vite';
import { splitVendorChunkPlugin } from 'vite';

export const performanceConfig = {
  build: {
    // ===== INSTITUTIONAL PERFORMANCE BUDGETS =====
    rollupOptions: {
      output: {
        // Advanced code splitting strategy
        manualChunks: id => {
          // ===== CORE FRAMEWORK CHUNKS =====
          if (id.includes('node_modules')) {
            // React core (smallest, always needed)
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }

            // React Router (navigation, always needed)
            if (id.includes('react-router')) {
              return 'react-router';
            }

            // State management (small, always needed)
            if (id.includes('redux') || id.includes('@reduxjs/toolkit')) {
              return 'state-vendor';
            }

            // ===== HEAVY VENDOR CHUNKS =====
            // D3 and visualization libraries
            if (id.includes('d3') || id.includes('recharts')) {
              return 'd3-vendor';
            }

            // UI component libraries
            if (
              id.includes('lucide-react') ||
              id.includes('framer-motion') ||
              id.includes('class-variance-authority') ||
              id.includes('@radix-ui')
            ) {
              return 'ui-vendor';
            }

            // AI and ML libraries
            if (id.includes('openai') || id.includes('ai') || id.includes('ml')) {
              return 'ai-vendor';
            }

            // Security and crypto libraries
            if (id.includes('crypto-js') || id.includes('bcrypt') || id.includes('jsonwebtoken')) {
              return 'security-vendor';
            }

            // Monitoring and analytics
            if (id.includes('@sentry') || id.includes('performance') || id.includes('monitoring')) {
              return 'monitoring-vendor';
            }

            // Data processing libraries
            if (id.includes('papaparse') || id.includes('xlsx') || id.includes('jszip')) {
              return 'data-vendor';
            }

            // HTTP client and utilities
            if (id.includes('axios') || id.includes('date-fns')) {
              return 'utils-vendor';
            }

            // Catch-all for remaining vendor code
            return 'vendor';
          }

          // ===== APPLICATION CODE SPLITTING =====
          // Large feature modules
          if (id.includes('src/pages/financial-model-workspace')) {
            return 'workspace-core';
          }

          if (
            id.includes('src/pages/ValuationWorkbench') ||
            id.includes('src/pages/valuation-tool')
          ) {
            return 'valuation-tools';
          }

          if (id.includes('src/pages/ModelLab') || id.includes('src/pages/ModelingTools')) {
            return 'modeling-tools';
          }

          // Heavy component libraries
          if (
            id.includes('src/components/PrivateAnalysis') ||
            id.includes('src/components/FinancialSpreadsheet')
          ) {
            return 'analysis-tools';
          }

          if (
            id.includes('src/components/AdvancedCharting') ||
            id.includes('src/components/Charts')
          ) {
            return 'charting-tools';
          }

          // AI and ML components
          if (
            id.includes('src/components/AI') ||
            id.includes('src/components/AIFinancialAssistant')
          ) {
            return 'ai-features';
          }

          // Portfolio and reporting
          if (id.includes('src/components/Portfolio') || id.includes('src/pages/Reports')) {
            return 'portfolio-tools';
          }

          // Terminal and CLI features
          if (
            id.includes('src/components/CLI') ||
            id.includes('src/components/TerminalInterface')
          ) {
            return 'terminal-features';
          }

          // Utility and helper modules
          if (id.includes('src/utils') || id.includes('src/hooks')) {
            return 'app-utils';
          }
        },

        // Optimize chunk file names for caching
        chunkFileNames: chunkInfo => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.js', '')
            : 'chunk';

          // Use content hash for better caching
          return `assets/${facadeModuleId}-[hash].js`;
        },

        // Optimize asset file names
        assetFileNames: assetInfo => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash][extname]`;
          }

          if (/woff2?|eot|ttf|otf/i.test(extType)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }

          return `assets/[name]-[hash][extname]`;
        }
      },

      // External dependencies (loaded via CDN in production)
      external:
        process.env.NODE_ENV === 'production'
          ? [
              // Add CDN-loaded dependencies here if needed
            ]
          : []
    },

    // ===== PERFORMANCE BUDGETS =====
    // Institutional-grade performance targets
    chunkSizeWarningLimit: 1000, // Warn at 1000kb
    reportCompressedSize: true, // Show compressed sizes

    // Advanced minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
        pure_funcs:
          process.env.NODE_ENV === 'production'
            ? ['console.log', 'console.info', 'console.debug']
            : []
      },
      mangle: {
        safari10: true
      }
    },

    // Source maps for production debugging
    sourcemap: process.env.NODE_ENV === 'production',

    // CSS code splitting
    cssCodeSplit: true,

    // Target modern browsers for smaller bundles
    target: 'es2020',

    // Aggressive tree shaking
    modulePreload: {
      polyfill: false
    }
  },

  // ===== OPTIMIZATION PLUGINS =====
  plugins: [
    // Advanced vendor chunk splitting
    splitVendorChunkPlugin(),

    // Custom performance optimization plugins
    {
      name: 'performance-monitor',
      generateBundle(options, bundle) {
        let totalSize = 0;
        let largestChunk = { name: '', size: 0 };

        console.log('\n📊 Bundle Analysis:');
        console.log('═'.repeat(60));

        Object.entries(bundle).forEach(([fileName, chunk]) => {
          if (chunk.type === 'chunk') {
            const size = chunk.code.length;
            totalSize += size;

            if (size > largestChunk.size) {
              largestChunk = { name: fileName, size };
            }

            // Log large chunks for optimization opportunities
            if (size > 500 * 1024) {
              // > 500kb
              console.log(`🚨 Large chunk: ${fileName} - ${(size / 1024 / 1024).toFixed(2)} MB`);
            } else if (size > 100 * 1024) {
              // > 100kb
              console.log(`⚠️  Medium chunk: ${fileName} - ${(size / 1024).toFixed(1)} kB`);
            }
          }
        });

        console.log(`📈 Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(
          `🎯 Largest chunk: ${largestChunk.name} - ${(largestChunk.size / 1024 / 1024).toFixed(2)} MB`
        );
        console.log('═'.repeat(60));
      }
    }
  ],

  // ===== DEPENDENCY OPTIMIZATION =====
  optimizeDeps: {
    // Pre-bundle these for faster dev server
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'framer-motion',
      'lucide-react'
    ],

    // Exclude these from pre-bundling (lazy load)
    exclude: ['openai', 'd3', 'recharts', '@sentry/browser', 'xlsx', 'jspdf']
  },

  // ===== SERVER OPTIMIZATION =====
  server: {
    fs: {
      // Allow serving files from packages for development
      allow: ['../../']
    },

    // Enable HMR with better performance
    hmr: {
      overlay: false // Disable error overlay for cleaner dev experience
    }
  },

  // ===== BUILD OPTIMIZATION =====
  esbuild: {
    // Remove console.log in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],

    // Enable JSX runtime for smaller bundles
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment'
  }
};

export default performanceConfig;
