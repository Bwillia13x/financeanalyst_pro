module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  testMatch: [
    '<rootDir>/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/coverage/'
  ],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/test/__mocks__/fileMock.js'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/test/**/*',
    '!src/**/*.d.ts',
    '!src/**/index.{js,ts}',
    '!src/pages/AdvancedAnalyticsDemo.jsx',
    '!src/main.jsx',
    '!src/App.jsx'
  ],
  coverageReporters: ['text', 'json', 'html', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 10000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true
};
