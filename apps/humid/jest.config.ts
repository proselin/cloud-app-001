export default {
  displayName: 'humid',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json'
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(nanoid)/)',
  ],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/humid',
  // Performance optimizations
  maxWorkers: '50%',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  globalTeardown: '<rootDir>/src/test-teardown.ts',
  // Enhanced coverage configuration with realistic thresholds
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.spec.{ts,js}',
    '!src/**/*.d.ts',
    '!src/test-setup.ts',
    '!src/test-teardown.ts',
    '!src/main.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 45,  // Current: 48.1% - slightly below current to allow for fluctuation
      functions: 55, // Current: 56.33% - slightly below current
      lines: 60,     // Current: 64.03% - slightly below current
      statements: 60 // Current: 62.08% - slightly below current
    }
  },
  // Memory leak prevention and monitoring
  detectOpenHandles: true
};
