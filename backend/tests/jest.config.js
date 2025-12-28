export default {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: false, // Set to true when you want coverage reports
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  transform: {}, // Use native ESM
  testTimeout: 30000,
  maxWorkers: 1, // Run tests serially to avoid database conflicts
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};