import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
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
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url))
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
          // Split React core from React ecosystem
          if (id.includes('react') && !id.includes('react-dom') && !id.includes('react-router')) {
            return 'react-core';
          }
          if (id.includes('react-dom')) {
            return 'react-dom';
          }
          if (id.includes('react-router')) {
            return 'react-router';
          }
          
          // Split chart libraries more granularly
          if (id.includes('recharts')) {
            return 'recharts-vendor';
          }
          if (id.includes('d3')) {
            return 'd3-vendor';
          }
          
          // Advanced Analytics - separate chunk for new features
          if (id.includes('AdvancedAnalytics') || id.includes('advancedAnalyticsService')) {
            return 'advanced-analytics';
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
          if (id.includes('framer-motion') || id.includes('lucide-react')) {
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
        drop_console: true,
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
  },
})

