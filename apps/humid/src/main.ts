import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ChildProcessTransport } from '@cloud/libs/nest-process-transport';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ExceptionFilter } from './app/filters/rpc-exception.filter';
import { AllExceptionFilter } from './app/filters/all-exception.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      strategy: new ChildProcessTransport(),
    }
  );
  app.useGlobalFilters(new ExceptionFilter(), new AllExceptionFilter());
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  await app.listen();
  Logger.log(`🚀 Humit Application is running`);
}

bootstrap();
