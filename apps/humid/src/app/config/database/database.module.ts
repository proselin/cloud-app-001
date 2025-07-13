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
        const isProduction = configService.getOrThrow('node_env') === NODE_ENV.PRODUCTION;

        return {
          type: 'postgres',
          host: configService.getOrThrow('db.host'),
          port: configService.getOrThrow('db.port'),
          username: configService.getOrThrow('db.username'),
          password: configService.getOrThrow('db.password'),
          database: configService.getOrThrow('db.database'),
          autoLoadEntities: !isProduction,
          synchronize: !isProduction,
          retryAttempts: 3,
          retryDelay: 3000,
          connectTimeoutMS: 60000,
          acquireTimeoutMillis: 60000,
          timeout: 60000,
          // Connection pooling optimization
          extra: {
            connectionLimit: 10,
            max: 10,
            min: 2,
            idle: 10000,
            acquire: 30000,
            evict: 1000,
            handleDisconnects: true,
          },
          // Performance optimizations
          logging: !isProduction ? ['query', 'error', 'warn'] : ['error'],
          maxQueryExecutionTime: 5000, // Log slow queries
          cache: {
            duration: 30000, // 30 seconds cache
            type: 'database',
            options: {
              type: 'redis',
              redis: {
                host: configService.get('redis.host', 'localhost'),
                port: configService.get('redis.port', 6379),
              },
            },
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
