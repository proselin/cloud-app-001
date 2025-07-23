import { Module } from '@nestjs/common';
import { DatabaseModule } from './config/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CrawlingModule } from './crawling/crawling.module';
import { LoggerModule } from './config/logger';
import { FileIoModule } from './file-io/file-io.module';
import { ComicModule } from './comic/comic.module';
import { ChapterModule } from './chapter/chapter.module';
import { HealthModule } from './health/health.module';
import { CommonModule } from './common/common.module';
import { loadConfig } from './config/env/load-config';
import {
  HttpErrorLoggingInterceptor,
  LoggingInterceptor,
  TimeoutInterceptor,
  PerformanceInterceptor,
} from './intercept';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  controllers: [],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: loadConfig,
    }),
    HttpModule.register({
      global: true,
      timeout: 30000,
      maxRedirects: 5,
    }),
    CommonModule,
    DatabaseModule,
    LoggerModule,
    FileIoModule,
    ComicModule,
    ChapterModule,
    CrawlingModule,
    HealthModule,
  ],
  providers: [
    LoggingInterceptor,
    HttpErrorLoggingInterceptor,
    PerformanceInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: TimeoutInterceptor,
    // },
  ],
})
export class AppModule {}
