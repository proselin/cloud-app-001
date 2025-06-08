# 📝 Logger - Shared Logging Library

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Winston](https://img.shields.io/badge/winston-000000?style=for-the-badge&logo=winston&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)

A centralized logging utility library built with Winston for the Comic Crawling & Management System. Provides consistent logging patterns across all applications with advanced features like daily rotation, compression, and environment-specific configurations.

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [Log Levels](#-log-levels)
- [File Structure](#-file-structure)
- [API Reference](#-api-reference)
- [Best Practices](#-best-practices)

## 📝 Overview

The Logger library is a shared utility that provides standardized logging functionality across the entire Nx workspace. It's built on top of Winston and includes advanced features like daily log rotation, compression, and different configurations for development and production environments.

### Key Components

- **Development Logger**: Console + file output with colored formatting
- **Production Logger**: Structured JSON logging with rotation and compression
- **Child Process Logger**: Specialized logging for background processes
- **NestJS Integration**: Compatible with nest-winston for NestJS applications

## 🚀 Features

### Core Functionality

- **Multi-Transport Logging**: Console, file, and daily rotation transports
- **Environment-Aware**: Different configurations for dev/prod environments
- **Daily Rotation**: Automatic log file rotation with compression
- **Error Handling**: Dedicated exception and rejection handlers
- **Structured Logging**: JSON format for production environments
- **Label Support**: Service-specific log labeling
- **Child Process Support**: Specialized logging for background processes

### Production Features

- **Log Retention**: Configurable retention periods (14 days for info, 30 days for errors)
- **Compression**: Automatic gzip compression of rotated logs
- **Size Limits**: Maximum file size limits (20MB per file)
- **Error Separation**: Separate error logs for better monitoring
- **Exception Handling**: Automatic logging of unhandled exceptions and rejections

## 📦 Installation

This library is automatically available in the Nx workspace. To use it in your application:

```typescript
import { createLoggerInstant } from '@cloud/libs/logger';
```

### Dependencies

The library uses the following key dependencies:

- `winston`: Core logging library
- `winston-daily-rotate-file`: Daily log rotation
- `nest-winston`: NestJS integration (optional)

## 🔧 Usage

### Basic Usage

```typescript
import { createLoggerInstant } from '@cloud/libs/logger';

// Create a logger instance for your service
const logger = createLoggerInstant('MyService');

// Log messages at different levels
logger.info('Application started');
logger.warn('This is a warning');
logger.error('An error occurred', { error: new Error('Sample error') });
logger.verbose('Detailed information');
```

### NestJS Integration

```typescript
import { createLoggerInstant, getLoggerConfig } from '@cloud/libs/logger';
import { WinstonModule } from 'nest-winston';
import * as nestWinston from 'nest-winston';

// In your NestJS module
@Module({
  imports: [WinstonModule.forRoot(getLoggerConfig('MyApp', nestWinston))],
})
export class AppModule {}
```

### Child Process Logger

```typescript
import { createChildProcessLogger } from '@cloud/libs/logger';

// For background processes or workers
const processLogger = createChildProcessLogger('BackgroundWorker');
processLogger.info('Worker process started');
```

### Platform Integration (Electron)

```typescript
import { createLoggerInstant } from '@cloud/libs/logger';

export class PlatformLogger {
  private logger = createLoggerInstant('Platform');

  log(...args: any[]) {
    this.logger.info(...args);
  }

  warn(...args: any[]) {
    this.logger.warn(...args);
  }

  error(...args: any[]) {
    this.logger.error(...args);
  }
}
```

## ⚙️ Configuration

### Development Environment

```typescript
// Development configuration features:
{
  format: format.combine(
    format.colorize(),
    format.simple(),
    format.label({ label: serviceName }),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ level, message, label, timestamp }) => {
      return `[${label}] - ${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: `logs/${serviceName}/dev-combined.log`,
    }),
  ]
}
```

### Production Environment

```typescript
// Production configuration features:
{
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: false }),
    format.json(),
    format.label({ label: serviceName })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: `logs/${serviceName}/error.log`, level: 'error' }),
    new transports.File({ filename: `logs/${serviceName}/combined.log` }),
    new DailyRotateFile({
      filename: `logs/${serviceName}/application-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
}
```

## 📊 Log Levels

The logger supports standard Winston log levels:

| Level   | Priority | Description                    |
| ------- | -------- | ------------------------------ |
| error   | 0        | Error conditions               |
| warn    | 1        | Warning conditions             |
| info    | 2        | Informational messages         |
| verbose | 3        | Verbose informational messages |
| debug   | 4        | Debug-level messages           |
| silly   | 5        | Silly debug messages           |

### Usage Examples

```typescript
logger.error('Database connection failed', { error: err });
logger.warn('API rate limit approaching', { remaining: 10 });
logger.info('User logged in', { userId: '123', ip: '192.168.1.1' });
logger.verbose('Processing request', { requestId: 'req-456' });
logger.debug('Variable state', { variable: value });
```

## 📁 File Structure

```
logs/
├── ServiceName/
│   ├── application-2024-01-15.log     # Daily rotated info logs
│   ├── application-2024-01-15.log.gz  # Compressed older logs
│   ├── error-2024-01-15.log           # Daily rotated error logs
│   ├── combined.log                   # All logs combined
│   ├── error.log                      # Error logs only
│   ├── exceptions.log                 # Unhandled exceptions
│   ├── rejections.log                 # Unhandled promise rejections
│   └── dev-combined.log               # Development logs
```

### Log Rotation Policy

- **Info Logs**: Retained for 14 days
- **Error Logs**: Retained for 30 days
- **File Size**: Maximum 20MB per file
- **Compression**: Automatic gzip compression of rotated files

## 📚 API Reference

### Functions

#### `createLoggerInstant(name: string)`

Creates a Winston logger instance with standard configuration.

**Parameters:**

- `name`: Service or application name for log labeling

**Returns:** Winston Logger instance

#### `getLoggerConfig(name: string, nestWinstonUtil?: object)`

Gets the Winston configuration object for manual logger creation.

**Parameters:**

- `name`: Service name for log labeling
- `nestWinstonUtil`: Optional NestJS Winston utilities

**Returns:** Winston LoggerOptions object

#### `createChildProcessLogger(name: string)`

Creates a logger specifically configured for child processes.

**Parameters:**

- `name`: Process name for log labeling

**Returns:** Winston Logger instance

### TypeScript Types

```typescript
interface LoggerConfig {
  level?: string;
  format: winston.Format;
  transports: winston.transport[];
  exceptionHandlers?: winston.transport[];
  rejectionHandlers?: winston.transport[];
}
```

## 📋 Best Practices

### 1. Service Naming

```typescript
// Use descriptive service names
const logger = createLoggerInstant('ComicCrawler');
const logger = createLoggerInstant('UserService');
const logger = createLoggerInstant('DatabaseConnection');
```

### 2. Structured Logging

```typescript
// Include relevant context in logs
logger.info('Comic crawled successfully', {
  comicId: '123',
  title: 'Sample Comic',
  chapters: 50,
  duration: 1500,
});

logger.error('Failed to process request', {
  requestId: 'req-456',
  userId: '789',
  error: error.message,
  stack: error.stack,
});
```

### 3. Error Handling

```typescript
try {
  await processData();
} catch (error) {
  logger.error('Data processing failed', {
    error: error.message,
    stack: error.stack,
    input: sanitizedInput,
  });
  throw error;
}
```

### 4. Performance Logging

```typescript
const startTime = Date.now();
await performOperation();
const duration = Date.now() - startTime;

logger.info('Operation completed', {
  operation: 'dataProcessing',
  duration,
  recordsProcessed: count,
});
```

### 5. Environment Considerations

```typescript
// Different log levels for different environments
if (process.env.NODE_ENV === 'development') {
  logger.debug('Debug information', { data });
} else {
  logger.info('Operation summary', { summary });
}
```

## 🔧 Integration Examples

### NestJS Service

```typescript
@Injectable()
export class ComicService {
  private readonly logger = createLoggerInstant('ComicService');

  async crawlComic(url: string) {
    this.logger.info('Starting comic crawl', { url });

    try {
      const result = await this.performCrawl(url);
      this.logger.info('Comic crawl completed', {
        url,
        chapters: result.chapters.length,
        duration: result.duration,
      });
      return result;
    } catch (error) {
      this.logger.error('Comic crawl failed', {
        url,
        error: error.message,
      });
      throw error;
    }
  }
}
```

### Electron Main Process

```typescript
import { createLoggerInstant } from '@cloud/libs/logger';
import { app } from 'electron';

const logger = createLoggerInstant('ElectronMain');

app.whenReady().then(() => {
  logger.info('Electron app ready');
  createWindow();
});

app.on('window-all-closed', () => {
  logger.info('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

---

This shared logging library ensures consistent, structured, and maintainable logging across all applications in the Comic Crawling & Management System workspace.
