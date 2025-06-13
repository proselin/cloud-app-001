import 'reflect-metadata';

import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { NestExpressApplication } from '@nestjs/platform-express';
import { TransformInterceptor } from './app/intercept';
import { ConfigService } from '@nestjs/config';
import { setupOpenApi } from './app/config/openapi/swagger.config';
import { patchNestJsSwagger } from 'nestjs-zod';

patchNestJsSwagger();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.enableShutdownHooks();

  app.enableCors({
    origin: (origin, callback) => {
      // Allow all origins for development purposes
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  }
  );

  const configService = app.get(ConfigService);
  const port = +configService.getOrThrow('humid.server.port');
  const host = configService.getOrThrow('humid.server.host');

  // Set hash for each instance of the service - using dynamic import for ES module
  const { nanoid } = await import('nanoid');
  configService.set('services.hash', nanoid(8));

  setupOpenApi(app);

  app.listen(port, host, async () => {
    Logger.log('🚀 Application is running on: ' + (await app.getUrl()));
  });
}

bootstrap();
