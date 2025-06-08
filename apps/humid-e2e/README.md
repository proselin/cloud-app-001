# 🧪 Humid E2E Tests - Backend API Testing Suite

![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)

End-to-End testing suite for the Humid NestJS backend API using Jest. This project provides comprehensive API testing to ensure the Comic Crawling & Management System's backend services work correctly across different integration scenarios.

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Test Architecture](#-test-architecture)
- [Setup & Installation](#-setup--installation)
- [Running Tests](#-running-tests)
- [Writing Tests](#-writing-tests)
- [Test Utilities](#-test-utilities)
- [Database Testing](#-database-testing)
- [API Testing Patterns](#-api-testing-patterns)
- [CI/CD Integration](#-cicd-integration)
- [Best Practices](#-best-practices)

## 📝 Overview

The Humid E2E project is a Jest-based testing suite that validates the NestJS backend API's functionality through integration tests. It tests API endpoints, database interactions, web crawling services, and cross-service communication.

### Test Scope

- **API Endpoints**: RESTful API validation
- **Database Operations**: TypeORM and SQLite integration
- **Web Crawling**: Comic extraction and processing
- **File Operations**: Image storage and retrieval
- **Error Handling**: Exception and validation testing
- **Performance**: Response times and throughput

## 🚀 Features

### Core Testing Capabilities

- **API Integration Testing**: Full HTTP request/response cycles
- **Database Testing**: Transaction rollback and isolation
- **Mock Services**: External dependency mocking
- **File System Testing**: Image processing validation
- **Real-time Testing**: WebSocket and SSE testing
- **Performance Testing**: Load and stress testing

### Jest Integration

- **Global Setup/Teardown**: Database and service lifecycle
- **Test Isolation**: Independent test execution
- **Mocking**: Service and dependency mocking
- **Coverage**: Comprehensive test coverage reporting
- **Parallel Execution**: Fast test suite execution

## 🏗️ Test Architecture

```
src/
├── humid/                    # Main test specifications
│   ├── humid.spec.ts        # Core API integration tests
│   ├── comic.e2e-spec.ts   # Comic management endpoints
│   ├── chapter.e2e-spec.ts # Chapter handling tests
│   ├── crawling.e2e-spec.ts# Web crawling integration
│   └── auth.e2e-spec.ts    # Authentication testing
├── support/                  # Test utilities and setup
│   ├── global-setup.ts     # Global test environment setup
│   ├── global-teardown.ts  # Cleanup after all tests
│   ├── test-setup.ts       # Individual test setup
│   ├── database.helper.ts  # Database test utilities
│   ├── api.helper.ts       # API testing helpers
│   └── mock.factory.ts     # Test data factories
└── jest.config.ts           # Jest configuration
```

## 📦 Setup & Installation

### Prerequisites

```bash
# Ensure the Humid backend is available
nx serve humid

# Install dependencies (handled by workspace root)
npm install

# Setup test database
npm run test:db:setup
```

### Configuration

The E2E tests are configured in `jest.config.ts`:

```typescript
export default {
  displayName: 'humid-e2e',
  preset: '../../jest.preset.js',
  globalSetup: '<rootDir>/src/support/global-setup.ts',
  globalTeardown: '<rootDir>/src/support/global-teardown.ts',
  setupFiles: ['<rootDir>/src/support/test-setup.ts'],
  testEnvironment: 'node',
  testTimeout: 30000,
  collectCoverageFrom: [
    '../humid/src/**/*.ts',
    '!**/*.spec.ts',
    '!**/*.e2e-spec.ts'
  ],
  coverageDirectory: '../../coverage/humid-e2e'
};
```

## 🧪 Running Tests

### Development Mode

```bash
# Run all E2E tests
nx e2e humid-e2e

# Run tests in watch mode
nx e2e humid-e2e --watch

# Run specific test file
nx e2e humid-e2e --testPathPattern="comic.e2e-spec.ts"

# Run tests with verbose output
nx e2e humid-e2e --verbose
```

### Coverage and Reporting

```bash
# Run tests with coverage
nx e2e humid-e2e --coverage

# Generate detailed coverage report
nx e2e humid-e2e --coverage --coverageReporters=html

# Run tests with JSON reporter
nx e2e humid-e2e --reporters=default --reporters=jest-junit
```

### Debugging Tests

```bash
# Run tests in debug mode
nx e2e humid-e2e --runInBand --detectOpenHandles

# Run single test with debugging
nx e2e humid-e2e --testNamePattern="should crawl comic successfully" --runInBand
```

## ✍️ Writing Tests

### Basic API Test Structure

```typescript
describe('Comic API (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearDatabase();
    await seedTestData();
  });

  describe('/api/v1/comics (GET)', () => {
    it('should return paginated comics list', async () => {
      const response = await request(httpServer)
        .get('/api/v1/comics')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    it('should filter comics by genre', async () => {
      await createTestComic({ genres: ['Action', 'Adventure'] });
      await createTestComic({ genres: ['Romance', 'Comedy'] });

      const response = await request(httpServer)
        .get('/api/v1/comics')
        .query({ genre: 'Action' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].genres).toContain('Action');
    });
  });
});
```

### Database Integration Testing

```typescript
describe('Comic Entity Operations', () => {
  let comicRepository: Repository<Comic>;
  let chapterRepository: Repository<Chapter>;

  beforeAll(async () => {
    const connection = await getConnection();
    comicRepository = connection.getRepository(Comic);
    chapterRepository = connection.getRepository(Chapter);
  });

  beforeEach(async () => {
    await chapterRepository.clear();
    await comicRepository.clear();
  });

  it('should create comic with chapters', async () => {
    const comicData = {
      title: 'Test Comic',
      description: 'A test comic',
      status: 'ongoing',
      genres: ['Action']
    };

    const response = await request(httpServer)
      .post('/api/v1/comics')
      .send(comicData)
      .expect(201);

    const comic = await comicRepository.findOne({
      where: { id: response.body.id },
      relations: ['chapters']
    });

    expect(comic).toBeDefined();
    expect(comic.title).toBe(comicData.title);
    expect(comic.chapters).toBeInstanceOf(Array);
  });

  it('should handle duplicate comic titles', async () => {
    const comicData = { title: 'Duplicate Comic' };
    
    await createTestComic(comicData);
    
    const response = await request(httpServer)
      .post('/api/v1/comics')
      .send(comicData)
      .expect(409);

    expect(response.body.message).toContain('already exists');
  });
});
```

### Web Crawling Integration Tests

```typescript
describe('Comic Crawling Service (e2e)', () => {
  let crawlingService: CrawlingService;
  let mockHttpService: jest.Mocked<HttpService>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [CrawlingModule],
    })
    .overrideProvider(HttpService)
    .useValue({
      get: jest.fn(),
      post: jest.fn(),
    })
    .compile();

    crawlingService = module.get<CrawlingService>(CrawlingService);
    mockHttpService = module.get(HttpService);
  });

  it('should crawl comic from nettruyenrr.com', async () => {
    const mockHtmlResponse = `
      <html>
        <head><title>Test Comic</title></head>
        <body>
          <div class="title-detail">Test Comic Title</div>
          <div class="detail-content">Comic description</div>
          <div class="list-chapter">
            <div class="row" data-chapter="1">Chapter 1</div>
            <div class="row" data-chapter="2">Chapter 2</div>
          </div>
        </body>
      </html>
    `;

    mockHttpService.get.mockReturnValue(
      of({ data: mockHtmlResponse }) as any
    );

    const result = await request(httpServer)
      .post('/api/v1/crawling/comic')
      .send({ url: 'https://nettruyenrr.com/truyen-tranh/test-comic' })
      .expect(201);

    expect(result.body).toHaveProperty('title', 'Test Comic Title');
    expect(result.body).toHaveProperty('chapters');
    expect(result.body.chapters).toHaveLength(2);
  });

  it('should handle crawling errors gracefully', async () => {
    mockHttpService.get.mockReturnValue(
      throwError({ response: { status: 404 } }) as any
    );

    await request(httpServer)
      .post('/api/v1/crawling/comic')
      .send({ url: 'https://invalid-url.com' })
      .expect(404);
  });
});
```

## 🛠️ Test Utilities

### Database Helpers

```typescript
// src/support/database.helper.ts
export class DatabaseHelper {
  private static connection: Connection;

  static async getConnection(): Promise<Connection> {
    if (!this.connection) {
      this.connection = await createConnection({
        type: 'sqlite',
        database: ':memory:',
        entities: [Comic, Chapter, Image],
        synchronize: true,
        logging: false
      });
    }
    return this.connection;
  }

  static async clearDatabase(): Promise<void> {
    const connection = await this.getConnection();
    const entities = connection.entityMetadatas;

    for (const entity of entities) {
      const repository = connection.getRepository(entity.name);
      await repository.clear();
    }
  }

  static async seedTestData(): Promise<void> {
    const comicRepository = (await this.getConnection()).getRepository(Comic);
    
    const testComics = [
      {
        title: 'One Piece',
        description: 'Adventure manga',
        status: 'ongoing',
        genres: ['Adventure', 'Comedy']
      },
      {
        title: 'Naruto',
        description: 'Ninja manga',
        status: 'completed',
        genres: ['Action', 'Adventure']
      }
    ];

    await comicRepository.save(testComics);
  }
}
```

### API Helpers

```typescript
// src/support/api.helper.ts
export class ApiHelper {
  constructor(private httpServer: any) {}

  async createComic(comicData: Partial<Comic>): Promise<Comic> {
    const response = await request(this.httpServer)
      .post('/api/v1/comics')
      .send(comicData)
      .expect(201);
    
    return response.body;
  }

  async getComics(query: any = {}): Promise<any> {
    const response = await request(this.httpServer)
      .get('/api/v1/comics')
      .query(query)
      .expect(200);
    
    return response.body;
  }

  async crawlComic(url: string): Promise<any> {
    const response = await request(this.httpServer)
      .post('/api/v1/crawling/comic')
      .send({ url })
      .expect(201);
    
    return response.body;
  }

  async expectError(
    method: 'get' | 'post' | 'put' | 'delete',
    endpoint: string,
    expectedStatus: number,
    data?: any
  ): Promise<any> {
    const req = request(this.httpServer)[method](endpoint);
    
    if (data) {
      req.send(data);
    }
    
    const response = await req.expect(expectedStatus);
    return response.body;
  }
}
```

### Mock Factories

```typescript
// src/support/mock.factory.ts
export class MockFactory {
  static createComic(overrides: Partial<Comic> = {}): Comic {
    return {
      id: faker.datatype.uuid(),
      title: faker.lorem.words(3),
      description: faker.lorem.paragraph(),
      author: faker.name.fullName(),
      status: faker.helpers.arrayElement(['ongoing', 'completed', 'hiatus']),
      genres: faker.helpers.arrayElements(['Action', 'Adventure', 'Comedy'], 2),
      thumbnail: faker.image.imageUrl(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      chapters: [],
      ...overrides
    };
  }

  static createChapter(comicId: string, overrides: Partial<Chapter> = {}): Chapter {
    return {
      id: faker.datatype.uuid(),
      comicId,
      chapterNumber: faker.datatype.number({ min: 1, max: 1000 }),
      title: `Chapter ${faker.datatype.number()}`,
      url: faker.internet.url(),
      images: [],
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createCrawlResponse(): any {
    return {
      title: faker.lorem.words(3),
      description: faker.lorem.paragraph(),
      thumbnail: faker.image.imageUrl(),
      chapters: Array.from({ length: 10 }, (_, i) => ({
        number: i + 1,
        title: `Chapter ${i + 1}`,
        url: faker.internet.url()
      }))
    };
  }
}
```

## 💾 Database Testing

### Transaction Testing

```typescript
describe('Database Transactions', () => {
  it('should rollback on service error', async () => {
    const initialCount = await comicRepository.count();
    
    try {
      await request(httpServer)
        .post('/api/v1/comics')
        .send({
          title: 'Test Comic',
          // Missing required fields to trigger error
        })
        .expect(400);
    } catch (error) {
      // Expected error
    }

    const finalCount = await comicRepository.count();
    expect(finalCount).toBe(initialCount);
  });

  it('should handle concurrent operations', async () => {
    const promises = Array.from({ length: 5 }, (_, i) =>
      request(httpServer)
        .post('/api/v1/comics')
        .send({
          title: `Concurrent Comic ${i}`,
          description: 'Test comic'
        })
    );

    const responses = await Promise.all(promises);
    
    responses.forEach(response => {
      expect(response.status).toBe(201);
    });

    const count = await comicRepository.count();
    expect(count).toBe(5);
  });
});
```

### Migration Testing

```typescript
describe('Database Schema', () => {
  it('should handle schema migrations', async () => {
    const connection = await getConnection();
    const queryRunner = connection.createQueryRunner();

    // Test migration up
    await queryRunner.createTable(new Table({
      name: 'test_migration',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'name', type: 'varchar' }
      ]
    }));

    const hasTable = await queryRunner.hasTable('test_migration');
    expect(hasTable).toBe(true);

    // Test migration down
    await queryRunner.dropTable('test_migration');
    const hasTableAfterDrop = await queryRunner.hasTable('test_migration');
    expect(hasTableAfterDrop).toBe(false);

    await queryRunner.release();
  });
});
```

## 🔄 CI/CD Integration

### GitHub Actions Configuration

```yaml
# .github/workflows/api-e2e-tests.yml
name: API E2E Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  api-e2e-tests:
    runs-on: ubuntu-latest
    
    services:
      sqlite:
        image: nouchka/sqlite3:latest
        options: >-
          --health-cmd "sqlite3 --version"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup test database
        run: |
          npm run test:db:setup
          npm run test:db:migrate
      
      - name: Build Humid application
        run: nx build humid
      
      - name: Run E2E tests
        run: nx e2e humid-e2e --coverage
        env:
          NODE_ENV: test
          DATABASE_URL: sqlite::memory:
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/humid-e2e/lcov.info
          flags: e2e-tests
```

### Docker Testing Environment

```dockerfile
# docker/test.dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Setup test database
RUN npm run test:db:setup

# Run E2E tests
CMD ["npm", "run", "test:e2e"]
```

## 📊 Performance Testing

### Load Testing

```typescript
describe('API Performance', () => {
  it('should handle concurrent requests', async () => {
    const startTime = Date.now();
    
    const promises = Array.from({ length: 100 }, () =>
      request(httpServer)
        .get('/api/v1/comics')
        .expect(200)
    );

    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should handle 100 requests within 5 seconds
    expect(duration).toBeLessThan(5000);
  });

  it('should maintain response time under load', async () => {
    const measurements: number[] = [];
    
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      
      await request(httpServer)
        .get('/api/v1/comics/1')
        .expect(200);
      
      const duration = Date.now() - start;
      measurements.push(duration);
    }

    const averageResponseTime = measurements.reduce((a, b) => a + b) / measurements.length;
    
    // Average response time should be under 100ms
    expect(averageResponseTime).toBeLessThan(100);
  });
});
```

## 📋 Best Practices

### 1. Test Isolation

```typescript
// Ensure tests don't affect each other
beforeEach(async () => {
  await DatabaseHelper.clearDatabase();
  await DatabaseHelper.seedTestData();
});

// Use transactions for rollback
beforeEach(async () => {
  await getConnection().transaction(async manager => {
    // Test operations within transaction
  });
});
```

### 2. Error Testing

```typescript
// Test all error scenarios
describe('Error Handling', () => {
  it('should handle 404 for non-existent comic', async () => {
    await request(httpServer)
      .get('/api/v1/comics/non-existent-id')
      .expect(404)
      .expect(res => {
        expect(res.body.message).toContain('not found');
      });
  });

  it('should validate request payload', async () => {
    await request(httpServer)
      .post('/api/v1/comics')
      .send({ /* invalid data */ })
      .expect(400)
      .expect(res => {
        expect(res.body.errors).toBeDefined();
      });
  });
});
```

### 3. Async Testing

```typescript
// Handle async operations properly
it('should process crawling queue', async () => {
  const crawlPromise = request(httpServer)
    .post('/api/v1/crawling/comic')
    .send({ url: 'https://example.com' });

  // Wait for async processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const response = await crawlPromise;
  expect(response.status).toBe(201);
});
```

### 4. Resource Cleanup

```typescript
// Clean up resources after tests
afterEach(async () => {
  // Clear uploaded files
  await fs.rmdir('./uploads/test', { recursive: true });
  
  // Reset mocks
  jest.clearAllMocks();
});

afterAll(async () => {
  // Close database connections
  await getConnection().close();
  
  // Stop test servers
  await app.close();
});
```

---

This E2E testing suite ensures the Comic Crawling & Management System's backend API maintains reliability, performance, and correctness across all integration points and use cases.
