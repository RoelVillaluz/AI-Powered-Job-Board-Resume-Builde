// jest.config.mjs
export default {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  testMatch: ['**/backend/tests/**/*.test.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testTimeout: 30000,
  maxWorkers: 1,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  transformIgnorePatterns: [
    'node_modules/(?!(supertest)/)'
  ],
};