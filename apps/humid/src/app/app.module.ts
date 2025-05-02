import { Module } from '@nestjs/common';
import { DatabaseModule } from './config/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CrawlingModule } from './crawling/crawling.module';
import { LoggerModule } from './config/logger';
import { FileIoModule } from './file-io/file-io.module';

@Module({
  controllers: [],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule.register({
      global: true,
    }),
    DatabaseModule,
    LoggerModule,
    FileIoModule,
    CrawlingModule,
  ],
})
export class AppModule {}
