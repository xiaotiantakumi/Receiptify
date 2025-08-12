const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  globals: {
    TextDecoder: require('util').TextDecoder,
    TextEncoder: require('util').TextEncoder,
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/receiptify-nx/',
  ],
  moduleNameMapper: {
    // Mock Azure SDK modules to avoid ESM import issues
    '^@azure/storage-blob$': '<rootDir>/__mocks__/azure-storage-blob.js',
    '^@azure/data-tables$': '<rootDir>/__mocks__/azure-data-tables.js',
    '^@azure/core-rest-pipeline$': '<rootDir>/__mocks__/azure-core-rest-pipeline.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@azure)/)',
  ],
};

module.exports = createJestConfig(customJestConfig);