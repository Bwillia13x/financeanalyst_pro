import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: [
      'src/components/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'src/components/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'src/hooks/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/**',
      'src/test/integration/**',
      'tests/e2e/**',
      'tests/performance/**',
      'tests/security/**',
      'tests/smoke/**',
    ],
    pool: 'forks',
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    bail: 1,
    testTimeout: 20000,
    hookTimeout: 20000,
    reporters: ['default', 'hanging-process'],
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
