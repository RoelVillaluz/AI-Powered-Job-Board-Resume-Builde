// jest.setup.cjs
const path = require('path');
const dotenv = require('dotenv');
const { jest: jestGlobals } = require('@jest/globals');

dotenv.config({ path: './.env.test' });

jestGlobals.setTimeout(30000);

global.console = {
  ...console,
  warn: jestGlobals.fn(),
  error: jestGlobals.fn(),
};

if (process.env.NODE_ENV !== 'test') {
  throw new Error('Tests must be run with NODE_ENV=test');
}

if (!process.env.MONGO_URI) {
  throw new Error('❌ MONGO_URI is not defined');
}

if (!process.env.MONGO_URI.includes('test')) {
  throw new Error('MONGO_URI must contain "test" to prevent accidental production DB usage');
}
