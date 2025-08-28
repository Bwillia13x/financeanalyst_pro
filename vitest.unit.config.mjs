import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: './src/test/setup.js',
    testTimeout: 15000,
    hookTimeout: 15000,
    reporters: ['default', 'hanging-process'],
    include: [
      'src/utils/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'src/store/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'src/config/**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/**',
      'src/test/integration/**',
      'src/services/**',
      'src/components/**',
      'src/pages/**',
    ],
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },
    bail: 1,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/test/**',
        'src/**/*.stories.{js,jsx,ts,tsx}',
        'public/**',
        'scripts/**',
      ],
    },
  },
})
