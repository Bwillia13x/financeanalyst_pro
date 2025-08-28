module.exports = {
  testEnvironment: 'node',
  transform: {},
  testEnvironmentOptions: { url: 'http://localhost' },
  // Allow CI to pass even if no backend tests are present yet
  passWithNoTests: true,

  // Coverage settings to ensure Codecov can find backend coverage
  collectCoverage: true,
  coverageProvider: 'v8',
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'services/**/*.js',
    'server.js',
    '!**/node_modules/**'
  ],

  // Basic test discovery (kept broad)
  testMatch: ['**/__tests__/**/*.test.{js,mjs}', '**/*.test.{js,mjs}'],
  moduleFileExtensions: ['js', 'mjs', 'json'],
  roots: ['<rootDir>']
};
