import { Module } from '@nestjs/common';
import { DatabaseModule } from './config/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CrawlingModule } from './crawling/crawling.module';
import { LoggerModule } from './config/logger';
import { FileIoModule } from './file-io/file-io.module';
import { ComicModule } from './comic/comic.module';
import { ChapterModule } from './chapter/chapter.module';
import { loadConfig } from './config/env/load-config';
import { resolve } from 'node:path';
import { LoggingInterceptor, TimeoutInterceptor } from './intercept';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  controllers: [],
  imports: [
    ConfigModule.forRoot({
      envFilePath: resolve('resources', 'config', '.env.humid'),
      isGlobal: true,
      validate: loadConfig,
    }),
    HttpModule.register({
      global: true,
    }),
    DatabaseModule,
    LoggerModule,
    FileIoModule,
    ComicModule,
    ChapterModule,
    CrawlingModule,
  ],
  providers: [
    LoggingInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
  ],
})
export class AppModule {}
