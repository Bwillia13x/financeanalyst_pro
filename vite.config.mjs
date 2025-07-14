import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tagger from "@dhiwise/component-tagger";

// https://vitejs.dev/config/
export default defineConfig({
  // This changes the out put dir from dist to build
  // comment this out if that isn't relevant for your project
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 800, // Reduced from 1000 to catch large chunks earlier
    // Enable source maps for production debugging
    sourcemap: true,
    // Optimize assets
    assetsInlineLimit: 4096,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Additional optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    // Optimize bundle with manual chunks
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core - essential for app startup
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }

          // Charts library - lazy loaded, separate chunk
          if (id.includes('recharts') || id.includes('d3')) {
            return 'charts-vendor';
          }

          // Animation library - used in specific components
          if (id.includes('framer-motion')) {
            return 'animation-vendor';
          }

          // Icons - used throughout but can be separate
          if (id.includes('lucide-react')) {
            return 'icons-vendor';
          }

          // HTTP client and utilities
          if (id.includes('axios') || id.includes('date-fns')) {
            return 'data-vendor';
          }

          // CSS utilities - small but frequently used
          if (id.includes('clsx') || id.includes('class-variance-authority') || id.includes('tailwind-merge')) {
            return 'utils-vendor';
          }

          // Large node_modules packages get their own chunks
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  plugins: [tsconfigPaths(), react(), tagger()],
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'lucide-react',
      'recharts',
      'd3',
      'date-fns',
      'framer-motion'
    ]
  },
  server: {
    port: "4028",
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: ['.amazonaws.com', '.builtwithrocket.new']
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
      ],
    },
  },
});