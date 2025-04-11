module.exports = {
  // The root of your source code
  roots: ['<rootDir>/src'],
  
  // File extensions Jest should look for
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Testing environment
  testEnvironment: 'jsdom',
  
  // Test files pattern
  testMatch: [
    '**/__tests__/**/*.ts?(x)',
    '**/?(*.)+(spec|test).ts?(x)'
  ],
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
    '\\.css$': 'jest-transform-stub',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': 'jest-transform-stub'
  },
  
  // Module name mapper for imports
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/setupTests.ts',
    '!src/__mocks__/**',
    '!src/utils/test-utils.ts'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70
    }
  },
  
  // Verbose output
  verbose: true,
  
  // Test each file in isolation
  isolatedModules: true,
  
  // Don't watch for changes if running in CI
  watchAll: false,
  
  // Cache results between runs
  cache: true,
  
  // Mock file for images
  moduleDirectories: [
    'node_modules',
    'src'
  ]
};