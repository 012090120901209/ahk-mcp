/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: [
    '**/integration/**/*.test.ts',
    '**/integration/**/*.spec.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/__mocks__/**',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.integration.setup.ts'],
  testTimeout: 60000,
  verbose: true,
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/tests/unit/',
    '/tests/e2e/'
  ],
  globalSetup: '<rootDir>/tests/setup/global.integration.setup.ts',
  globalTeardown: '<rootDir>/tests/setup/global.integration.teardown.ts',
  maxWorkers: 1, // Run integration tests sequentially to avoid conflicts
  forceExit: true,
  detectOpenHandles: true
};