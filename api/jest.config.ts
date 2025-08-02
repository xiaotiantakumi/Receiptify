import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  roots: ["<rootDir>/src/tests"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  verbose: false,
  detectOpenHandles: true,
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  testTimeout: 60000,
  silent: true,
  coverageReporters: ["text", "lcov", "html"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/tests/**",
    "!src/**/*.spec.ts",
    "!src/**/*.test.ts",
    "!src/index.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 20,
      lines: 45,
      statements: 45,
    },
  },
};

export default config;