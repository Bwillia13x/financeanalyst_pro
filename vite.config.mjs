import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { imageOptimization } from './vite-plugins/imageOptimization.js'

// https://vitejs.dev/config/
export default defineConfig({
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
  server: {
    fs: {
      allow: [
        '/Users/benjaminwilliams/Desktop/financeanalyst_pro',
        '/Users/benjaminwilliams/haven_test',
        '/Users/benjaminwilliams/local_financepro/financeanalyst_pro',
        '/Users/benjaminwilliams/financeanalyst_pro-1',
      ],
    },
    proxy: {
      '/v8/finance/chart': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core libraries - critical path
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-core';
          }
          
          // React router - can be loaded separately
          if (id.includes('react-router')) {
            return 'react-router';
          }
          
          // Heavy financial calculation engines - lazy load
          if (id.includes('src/services/financialModelingEngine') || 
              id.includes('src/services/monteCarloEngine') ||
              id.includes('src/services/lboModelingEngine')) {
            return 'financial-engines';
          }
          
          // Web workers - separate chunk
          if (id.includes('src/workers/') || id.includes('src/services/workerManager')) {
            return 'web-workers';
          }
          
          // Heavy visualization libraries - only load when charts are needed
          if (id.includes('recharts') || id.includes('d3')) {
            return 'charts-vendor';
          }
          
          // Animation libraries - load on demand
          if (id.includes('framer-motion')) {
            return 'animations';
          }
          
          // Icon libraries - can be split
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          
          // Data processing libraries
          if (id.includes('axios') || id.includes('date-fns') || id.includes('papaparse')) {
            return 'data-vendor';
          }
          
          // Utility libraries - small, can be grouped
          if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
            return 'utils-vendor';
          }
          
          // SEO and meta libraries
          if (id.includes('helmet')) {
            return 'seo-vendor';
          }
          
          // Redux and state management
          if (id.includes('redux') || id.includes('@reduxjs')) {
            return 'state-vendor';
          }
          
          // Private Analysis components - lazy load heavy financial components
          if (id.includes('src/components/PrivateAnalysis/') && 
              (id.includes('AdvancedDCF') || id.includes('AdvancedLBO') || 
               id.includes('MonteCarloSimulation') || id.includes('EnhancedScenarioAnalysis'))) {
            return 'private-analysis-heavy';
          }
          
          // Standard Private Analysis components
          if (id.includes('src/components/PrivateAnalysis/')) {
            return 'private-analysis';
          }
          
          // Valuation Tools - separate chunk for financial modeling
          if (id.includes('src/components/ValuationTool/')) {
            return 'valuation-tools';
          }
          
          // UI Charts - lazy load
          if (id.includes('src/components/ui/charts/')) {
            return 'ui-charts';
          }
          
          // Standard UI components
          if (id.includes('src/components/ui/')) {
            return 'ui-components';
          }
          
          // Test and development libraries - exclude from production
          if (id.includes('vitest') || id.includes('testing-library')) {
            return 'test-vendor';
          }
          
          // Authentication and security
          if (id.includes('src/services/auth') || id.includes('src/services/encryption')) {
            return 'security';
          }
          
          // Persistence and storage
          if (id.includes('src/services/persistence/')) {
            return 'persistence';
          }
          
          // Node modules that aren't specifically chunked
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    sourcemap: true,
    chunkSizeWarningLimit: 500, // Reduced from 800 for better performance
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'], // Remove specific console calls
        passes: 2 // Multiple passes for better compression
      },
      mangle: {
        safari10: true // Better Safari compatibility
      }
    },
    // Enable more aggressive optimizations
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // Inline smaller assets
    reportCompressedSize: false // Faster builds
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
