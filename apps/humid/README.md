# 🔧 Humid - NestJS Backend API

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

**Core API server for comic crawling and data management**

## 📝 Overview

Humid is a robust NestJS 11 backend application that provides RESTful APIs for comic crawling, data management, and content serving. It features automated web scraping from nettruyenrr.com, SQLite database management with TypeORM, and comprehensive logging.

## 🚀 Features

### Core Functionality

- **Web Scraping Engine**: Automated comic crawling from nettruyenrr.com
- **RESTful API**: Versioned endpoints with OpenAPI/Swagger documentation
- **Database Management**: TypeORM integration with SQLite
- **Image Processing**: Local image storage and optimization
- **Error Handling**: Comprehensive exception handling with custom filters
- **Logging**: Winston-based logging with daily rotation

### API Capabilities

- Comic search and retrieval
- Chapter management
- Image serving and caching
- Real-time crawling status
- Suggestion endpoints for autocomplete

## 🏗️ Architecture

```text
src/
├── app/
│   ├── chapter/              # Chapter management module
│   ├── common/               # Shared utilities and entities
│   ├── crawling/             # Web scraping services
│   │   ├── controllers/      # Crawling endpoints
│   │   ├── services/         # Core crawling logic
│   │   └── extractor/        # Site-specific extractors
│   ├── entities/             # Database entities
│   ├── http/                 # HTTP client services
│   ├── file-io/              # File system operations
│   └── utils/                # Helper utilities
└── main.ts                   # Application bootstrap
```

## 🛠️ Technology Stack

| Component         | Technology             | Version | Purpose                  |
| ----------------- | ---------------------- | ------- | ------------------------ |
| **Framework**     | NestJS                 | 11.0.17 | REST API framework       |
| **Database**      | TypeORM + SQLite       | 0.3.21  | Data persistence         |
| **Web Scraping**  | Cheerio + Axios        | Latest  | Content extraction       |
| **Logging**       | Winston + nest-winston | Latest  | Application logging      |
| **Documentation** | Swagger/OpenAPI        | Latest  | API documentation        |
| **Validation**    | nestjs-zod             | Latest  | Request validation       |
| **Testing**       | Jest                   | Latest  | Unit & integration tests |

## 📊 Database Schema

### Entities

#### ComicEntity

```typescript
@Entity('comics')
export class ComicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  originalUrl: string;

  @Column({ default: 0 })
  chapterCount: number;

  @OneToOne(() => ImageEntity)
  @JoinColumn()
  thumbnail: ImageEntity;

  @OneToMany(() => ChapterEntity, (chapter) => chapter.comic)
  chapters: ChapterEntity[];
}
```

#### ChapterEntity

```typescript
@Entity('chapters')
export class ChapterEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  position: number;

  @Column({ default: 'pending' })
  crawlStatus: string;

  @ManyToOne(() => ComicEntity, (comic) => comic.chapters)
  comic: ComicEntity;

  @OneToMany(() => ImageEntity, (image) => image.chapter)
  images: ImageEntity[];
}
```

#### ImageEntity

```typescript
@Entity('images')
export class ImageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fileName: string;

  @Column()
  filePath: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;
}
```

## 🔌 API Endpoints

### Comic Management

```http
GET    /api/v1/comic              # List all comics
GET    /api/v1/comic/suggest?q={query} # Get comic suggestions for autocomplete
GET    /api/v1/comic/:id          # Get comic details by ID
```

### Chapter Management

```http
GET    /api/v1/chapter/:id                # Get chapter details
GET    /api/v1/chapter/navigation/:comicId # Get chapter navigation for a comic
GET    /api/v1/chapter/by-comic/:comicId   # Get all chapters for a comic
```

### Crawling Operations

```http
POST   /api/v1/crawl/by-url       # Crawl comic by URL
```

### Static File Serving

```http
GET    /static/imgs/*             # Serve image files
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Navigate to the humid directory:**

```bash
cd apps/humid
```

2. **Install dependencies** (from workspace root):

```bash
npm install
```

3. **Environment setup:**

The application uses default configurations, but you can customize:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  database: {
    path: 'resources/db/humid.db',
  },
  logging: {
    level: 'debug',
    dir: 'logs/Humid',
  },
};
```

### Development

1. **Start the development server:**

```bash
npx nx serve humid
```

The API will be available at `http://localhost:3000`

2. **Access API documentation:**

```bash
open http://localhost:3000/api
```

3. **View logs:**

```bash
tail -f logs/Humid/dev-combined.log
```

### Production Build

```bash
npx nx build humid
```

## 🧪 Testing

### Test Coverage Status

| Metric         | Coverage | Status               |
| -------------- | -------- | -------------------- |
| **Statements** | 51.32%   | 🟡 Needs Improvement |
| **Branches**   | 27.60%   | 🔴 Low Coverage      |
| **Functions**  | 36.28%   | 🟡 Needs Improvement |
| **Lines**      | 50.47%   | 🟡 Needs Improvement |

### Running Tests

**Unit tests:**

```bash
npx nx test humid
```

**Test with coverage:**

```bash
npx nx test humid --configuration=ci
```

**Watch mode:**

```bash
npx nx test humid --watch
```

### Test Structure

```text
src/
├── app/
│   ├── chapter/
│   │   ├── chapter.service.spec.ts
│   │   └── chapter.controller.spec.ts
│   ├── entities/
│   │   └── comic.entity.spec.ts        # ✅ 79.16% coverage
│   ├── crawling/
│   │   └── services/
│   │       ├── nettruyen-comic.service.spec.ts
│   │       ├── nettruyen-chapter.service.spec.ts
│   │       └── nettruyen-image.service.spec.ts
│   └── utils/
│       ├── function.spec.ts
│       └── response-mapper.spec.ts
```

## 🕷️ Web Crawling

### Supported Sites

#### NetTruyenRR.com

- **Full Support**: Complete comic metadata extraction
- **Chapter Detection**: Automatic chapter discovery
- **Image Crawling**: High-quality image download
- **Error Handling**: Robust retry mechanisms

### Crawling Workflow

1. **URL Analysis**: Parse and validate comic URLs
2. **Metadata Extraction**: Extract title, chapters, thumbnails
3. **Database Storage**: Save comic information
4. **Image Download**: Crawl and store images locally
5. **Status Updates**: Track crawling progress

### Example Usage

```typescript
// Crawl a comic by URL
const result = await fetch('/api/v1/crawl/by-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.nettruyenrr.com/truyen-tranh/comic-name',
  }),
});
```

## 📝 Logging

### Log Levels

- **Error**: Application errors and exceptions
- **Warn**: Warning messages and deprecated usage
- **Info**: General application information
- **Debug**: Detailed debugging information

### Log Files

```text
logs/Humid/
├── dev-combined.log          # All log levels combined
├── dev-error.log             # Error logs only
└── dev-debug.log             # Debug logs only
```

### Log Format

```json
{
  "timestamp": "2025-06-08T12:30:45.123Z",
  "level": "info",
  "message": "Comic crawled successfully",
  "context": "NettruyenComicService",
  "metadata": {
    "comicId": 123,
    "chaptersFound": 45
  }
}
```

## ⚙️ Configuration

### Environment Variables

```bash
NODE_ENV=development
PORT=3000
DATABASE_PATH=resources/db/humid.db
LOG_LEVEL=debug
```

### Database Configuration

```typescript
TypeOrmModule.forRoot({
  type: 'sqlite',
  database: 'resources/db/humid.db',
  entities: [ComicEntity, ChapterEntity, ImageEntity],
  synchronize: true, // Auto-create tables
  logging: process.env.NODE_ENV === 'development',
});
```

### CORS Configuration

```typescript
app.enableCors({
  origin: ['http://localhost:4200'], // Angular dev server
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

## 🔒 Error Handling

### Custom Exception Filters

- **HttpExceptionFilter**: Handles HTTP exceptions
- **ValidationExceptionFilter**: Handles validation errors
- **DatabaseExceptionFilter**: Handles database errors

### Error Response Format

```typescript
{
  statusCode: 400,
  message: "Validation failed",
  error: "Bad Request",
  timestamp: "2025-06-08T12:30:45.123Z",
  path: "/api/v1/comic"
}
```

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/apps/humid ./
EXPOSE 3000
CMD ["node", "main.js"]
```

### Environment Setup

```bash
# Production environment
NODE_ENV=production
PORT=3000
DATABASE_PATH=/app/data/humid.db
LOG_LEVEL=info
```

## 📈 Performance

### Optimization Features

- **Database Indexing**: Optimized queries for comics and chapters
- **Image Caching**: Local file system caching
- **Lazy Loading**: Efficient relationship loading
- **Connection Pooling**: Database connection optimization

### Monitoring

- **Health Checks**: `/health` endpoint for monitoring
- **Metrics**: Request timing and error rates
- **Database Performance**: Query execution time tracking

## 🔗 Related Projects

- [Cloud (Angular Frontend)](../cloud/README.md)
- [Logger (Shared Library)](../../libs/shared/back/logger/README.md)

## 🤝 Contributing

1. **Development Setup**: Follow the getting started guide
2. **Testing**: Ensure all tests pass before submitting
3. **Linting**: Run `npx nx lint humid` to check code style
4. **Documentation**: Update API documentation for new endpoints

## 📚 Resources

- [NestJS Documentation](https://nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Swagger/OpenAPI](https://swagger.io)
- [Winston Logging](https://github.com/winstonjs/winston)

---

**Part of the Comic Crawling & Management System monorepo**
