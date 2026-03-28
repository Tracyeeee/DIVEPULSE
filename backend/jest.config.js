/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 30000,
  setupFilesAfterEnv: ['./tests/setup.js'],
  moduleFileExtensions: ['js', 'json'],
  transform: {},
  // ESM support
  extensionsToTreatAsEsm: [],
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};
