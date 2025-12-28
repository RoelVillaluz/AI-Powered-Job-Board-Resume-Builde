import { jest } from '@jest/globals';

// Set test timeout to 30 seconds
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests (optional)
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test environment check
if (process.env.NODE_ENV !== 'test') {
  throw new Error('Tests must be run with NODE_ENV=test');
}

// Ensure test database URI contains 'test'
if (process.env.MONGO_TEST_URI && !process.env.MONGO_TEST_URI.includes('test')) {
  throw new Error('MONGO_TEST_URI must contain "test" to prevent accidental production DB usage');
}