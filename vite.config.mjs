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
          // React core libraries
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
          
          // Heavy visualization libraries - only load when needed
          if (id.includes('recharts') || id.includes('d3')) {
            return 'charts-vendor';
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
          
          // Helmet and SEO libraries
          if (id.includes('helmet')) {
            return 'seo-vendor';
          }
          
          // Redux and state management
          if (id.includes('redux') || id.includes('@reduxjs')) {
            return 'state-vendor';
          }
          
          // Test and development libraries
          if (id.includes('vitest') || id.includes('testing-library')) {
            return 'test-vendor';
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
        drop_debugger: true
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
