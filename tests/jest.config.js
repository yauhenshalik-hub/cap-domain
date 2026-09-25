module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testMatch: ['**/test/**/*.test.js'],
  coveragePathIgnorePatterns: ['/test'],
  silent: true,
  setupFilesAfterEnv: ['./test/setup.js']
};