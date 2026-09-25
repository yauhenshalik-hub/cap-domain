module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testMatch: ['**/test/**/*.test.js'],
  coveragePathIgnorePatterns: ['/test'],
  silent: true,
  setupFilesAfterEnv: ['./test/setup.js'],
  // default 5000ms hook timeout is too tight for cds.test() bootstrap on a cold CI runner
  testTimeout: 30000
};