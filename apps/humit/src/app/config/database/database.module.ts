import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { resolve } from 'node:path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => {
        return {
          type: 'better-sqlite3',
          appName: 'Humit',
          database: resolve('assets', 'humit.db'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          autoLoadEntities: true,
          synchronize: true, // only for dev! turns models into tables
          logging: true,
          retryAttempts: 1,
          timeout: 30000,
        } ;
      },
    }),
  ],
})
export class DatabaseModule {}
