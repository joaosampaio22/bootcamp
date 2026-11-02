import base from './jest.config.mjs';

export default {
  ...base,
  testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
  testTimeout: 15000
};
