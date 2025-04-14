import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ChildProcessTransport } from '@cloud/nest-process-transport';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      bufferLogs: true,
      strategy: new ChildProcessTransport()
    }
  );
  await app.listen();
  Logger.log(`🚀 Humit Application is running`);
}

bootstrap();
