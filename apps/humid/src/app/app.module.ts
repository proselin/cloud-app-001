import { Module } from '@nestjs/common';
import { DatabaseModule } from './config/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CrawlingModule } from './crawling/crawling.module';
import { LoggerModule } from './config/logger';

@Module({
  controllers: [],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    LoggerModule,
    HttpModule.register({
      global: true,
    }),
    CrawlingModule,
  ],
})
export class AppModule {}
