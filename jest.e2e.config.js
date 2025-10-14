/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/e2e'],
  testMatch: [
    '**/e2e/**/*.test.ts',
    '**/e2e/**/*.spec.ts'
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
  coverageDirectory: 'coverage/e2e',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.e2e.setup.ts'],
  testTimeout: 120000, // 2 minutes for E2E tests
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
    '/tests/integration/'
  ],
  globalSetup: '<rootDir>/tests/setup/global.e2e.setup.ts',
  globalTeardown: '<rootDir>/tests/setup/global.e2e.teardown.ts',
  maxWorkers: 1, // Run E2E tests sequentially
  forceExit: true,
  detectOpenHandles: true,
  retryTimes: 2, // Retry flaky E2E tests
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'e2e-results.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }]
  ]
};