# 🧪 Testing Guide for Humid Project

This document describes the testing setup and CI/CD pipeline for the Humid API project.

## 📋 Table of Contents

- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [CI/CD Pipeline](#cicd-pipeline)
- [Coverage Reports](#coverage-reports)
- [Testing Best Practices](#testing-best-practices)

## 🏗️ Test Structure

The Humid project uses **Jest** as the testing framework with the following structure:

```
apps/humid/src/
├── app/
│   ├── chapter/
│   │   ├── chapter.controller.spec.ts
│   │   └── chapter.service.spec.ts
│   ├── crawling/
│   │   ├── controllers/
│   │   │   └── crawl.controller.spec.ts
│   │   ├── extractor/
│   │   │   └── extract-nettruyen-impl.spec.ts
│   │   └── services/
│   │       ├── nettruyen-chapter.service.spec.ts
│   │       ├── nettruyen-comic.service.spec.ts
│   │       └── nettruyen-image.service.spec.ts
│   ├── entities/
│   │   └── comic.entity.spec.ts
│   ├── file-io/
│   │   └── file-io.service.spec.ts
│   ├── http/
│   │   └── nettruyen-http.service.spec.ts
│   └── utils/
│       ├── function.spec.ts
│       ├── response-mapper.spec.ts
│       └── utils.spec.ts
└── jest.config.ts
```

## 🚀 Running Tests

### Local Development

#### Using npm scripts:

```bash
# Run all tests
npm run test:humid

# Run tests in watch mode
npm run test:humid:watch

# Run tests with coverage
npm run test:humid:coverage

# Run complete test suite with linting
npm run test:humid:ci
```

#### Using Nx directly:

```bash
# Basic test run
npx nx test humid

# With coverage
npx nx test humid --configuration=ci

# Watch mode
npx nx test humid --watch

# Specific test file
npx nx test humid --testNamePattern="ChapterController"
```

#### Using custom scripts:

```bash
# PowerShell (Windows)
.\scripts\test-humid.ps1

# PowerShell with options
.\scripts\test-humid.ps1 -Watch
.\scripts\test-humid.ps1 -NoCoverage
.\scripts\test-humid.ps1 -Verbose

# Bash (Linux/macOS)
./scripts/test-humid.sh

# Bash with options
./scripts/test-humid.sh --watch
./scripts/test-humid.sh --no-coverage
./scripts/test-humid.sh --verbose
```

## 🔄 CI/CD Pipeline

The project includes two CI/CD workflows:

### 1. Code Quality Check (`.github/workflows/code-quality.yml`)

- **Triggers**: Push/PR to main branches
- **Scope**: All projects (humid, cloud)
- **Steps**:
  - Lint check
  - Build verification
  - **Required humid tests** with coverage
  - Optional cloud tests

### 2. Humid-Specific Pipeline (`.github/workflows/humid-ci.yml`)

- **Triggers**: Changes to humid app or shared libs
- **Comprehensive pipeline**:

#### 🧪 Test & Coverage Job

- Unit tests with Jest
- Coverage report generation
- Coverage comment on PRs
- Artifact upload

#### 🏗️ Build & Package Job

- Production build
- Artifact archiving

#### 🔗 Integration Tests Job

- Database service setup
- Integration test execution
- Environment-specific testing

#### 🔒 Security Scan Job

- Dependency audit
- Lint security checks
- Security report generation

#### 🚀 Deployment Jobs

- **Staging**: Deploy on `develop` branch
- **Production**: Deploy on `main`/`master` branch

## 📊 Coverage Reports

### Local Coverage

Coverage reports are generated in `coverage/apps/humid/`:

- **HTML Report**: `coverage/apps/humid/lcov-report/index.html`
- **JSON Summary**: `coverage/apps/humid/coverage-summary.json`
- **LCOV**: `coverage/apps/humid/lcov.info`

### CI Coverage

- Reports uploaded as GitHub artifacts
- Coverage comments on pull requests
- **Threshold**: 80% line coverage recommended

### Coverage Metrics

The pipeline tracks:

- **Lines**: Executed code lines
- **Statements**: JavaScript statements
- **Functions**: Function coverage
- **Branches**: Conditional branch coverage

## 🎯 Testing Best Practices

### 1. Test Organization

```typescript
// Group related tests
describe('ChapterController', () => {
  describe('POST /chapters', () => {
    it('should create a new chapter', async () => {
      // Test implementation
    });

    it('should validate required fields', async () => {
      // Test implementation
    });
  });
});
```

### 2. Mock External Dependencies

```typescript
// Mock HTTP services
jest.mock('../http/nettruyen-http.service');

// Mock file system operations
jest.mock('fs/promises');
```

### 3. Use Descriptive Test Names

```typescript
// ✅ Good
it('should return 404 when chapter not found', () => {});

// ❌ Bad
it('should work', () => {});
```

### 4. Test Both Success and Error Cases

```typescript
describe('crawlChapter', () => {
  it('should successfully crawl valid chapter URL', async () => {
    // Success case
  });

  it('should throw error for invalid URL', async () => {
    // Error case
  });
});
```

### 5. Use Setup and Cleanup

```typescript
describe('ChapterService', () => {
  let service: ChapterService;

  beforeEach(async () => {
    // Setup test module
  });

  afterEach(() => {
    // Cleanup mocks
    jest.clearAllMocks();
  });
});
```

## 🔧 Configuration

### Jest Configuration (`jest.config.ts`)

```typescript
export default {
  displayName: 'humid',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/humid',
};
```

### Coverage Thresholds

To enforce coverage thresholds, add to `jest.config.ts`:

```typescript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Tests timing out**

   ```bash
   # Increase timeout
   npx nx test humid --testTimeout=10000
   ```

2. **Memory issues**

   ```bash
   # Limit workers
   npx nx test humid --maxWorkers=1
   ```

3. **Mock not working**

   ```typescript
   // Clear mocks between tests
   afterEach(() => {
     jest.clearAllMocks();
   });
   ```

4. **Coverage not generating**
   ```bash
   # Use CI configuration
   npx nx test humid --configuration=ci
   ```

## 📝 Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass locally
3. Maintain coverage above 80%
4. Update this documentation if needed

For more information, see the [main project README](../../README.md).
