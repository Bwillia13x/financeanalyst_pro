import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts-vendor': ['recharts', 'd3'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'data-vendor': ['axios', 'date-fns'],
          'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority']
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
