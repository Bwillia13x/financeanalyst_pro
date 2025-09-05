module.exports = {
  testEnvironment: 'node',
  preset: undefined,
  transform: {}, // Let Jest handle ES modules natively
  testMatch: ['**/__tests__/**/*.test.mjs', '**/*.test.mjs'],
  moduleFileExtensions: ['js', 'mjs', 'json'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.mjs$': '$1' // Map .mjs extensions
  },
  testEnvironmentOptions: { url: 'http://localhost' },
  // Allow CI to pass even if no backend tests are present yet
  passWithNoTests: true,

  // Coverage settings - skip for now to focus on tests
  collectCoverage: false,

  // Mock Prisma
  setupFilesAfterEnv: ['<rootDir>/jest.setup.mjs'] // Change to .mjs to match imports
};
