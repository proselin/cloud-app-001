import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'better-sqlite3',
          appName: 'Humit',
          database: 'data.db',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          autoLoadEntities: true,
          synchronize: true, // only for dev! turns models into tables
          logging: true,
          timeout: 30000,
        } ;
      },
    }),
  ],
})
export class DatabaseModule {}
