import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import 'pg';
import { NODE_ENV } from '../../common';
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.getOrThrow('db.host'),
          port: configService.getOrThrow('db.port'),
          username: configService.getOrThrow('db.username'),
          password: configService.getOrThrow('db.password'),
          database: configService.getOrThrow('db.database'),
          autoLoadEntities: configService.getOrThrow('node_env') === NODE_ENV.DEVELOPMENT,
          synchronize: configService.getOrThrow('node_env') === NODE_ENV.DEVELOPMENT,
          retryAttempts: 1,
          connectTimeoutMS: 30000,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
