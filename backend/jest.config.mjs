// jest.config.mjs
export default {
  testEnvironment: 'node',
  verbose: true,
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
    '^.+\\.js$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  extensionsToTreatAsEsm: ['.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  testMatch: ["**/?(*.)+(test).[jt]s"],
  testTimeout: 30000,
  maxWorkers: 1,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  transformIgnorePatterns: [
    'node_modules/(?!(supertest|natural|afinn-165)/)'
  ],
};