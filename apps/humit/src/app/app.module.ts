import { Module } from '@nestjs/common';
import { DatabaseModule } from './config/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CrawlingModule } from './crawling/crawling.module';

@Module({
  controllers: [],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    HttpModule.register({
      global: true,
    }),
    CrawlingModule,
  ],
})
export class AppModule {}
