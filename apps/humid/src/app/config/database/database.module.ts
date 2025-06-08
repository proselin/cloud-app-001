import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import "better-sqlite3"
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService:ConfigService) => {
        return {
          type: 'better-sqlite3',
          appName: 'Humid',
          database: configService.getOrThrow('db.location'),
          autoLoadEntities: true,
          synchronize: true, // only for dev! turns models into tables
          retryAttempts: 1,
          timeout: 30000,
        } ;
      },
    }),
  ],
})
export class DatabaseModule {}
