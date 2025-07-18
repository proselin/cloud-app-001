import 'reflect-metadata';

import { Logger, VersioningType, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { NestExpressApplication } from '@nestjs/platform-express';
import { TransformInterceptor } from './app/intercept';
import { ConfigService } from '@nestjs/config';
import { setupOpenApi } from './app/config/openapi/swagger.config';
import { patchNestJsSwagger } from 'nestjs-zod';
import compression from 'compression';
import helmet from 'helmet';
import { Request, Response } from 'express';

patchNestJsSwagger();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // Compression middleware
  app.use(compression({
    filter: (req: Request, res: Response) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024, // Only compress responses larger than 1KB
  }));

  // Global validation pipe with optimization
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     transform: true,
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //     disableErrorMessages: false,
  //     validationError: { target: false, value: false },
  //   })
  // );

  app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.enableShutdownHooks();

  // Optimized CORS configuration
  app.enableCors({
    origin: (origin, callback) => {
      // Allow all origins for development purposes
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    maxAge: 86400, // Cache preflight response for 24 hours
  });

  // Set request size limits
  const express = require('express');
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  const configService = app.get(ConfigService);
  const port = +configService.getOrThrow('humid.server.port');
  const host = configService.getOrThrow('humid.server.host');

  // Set hash for each instance of the service - using dynamic import for ES module
  const { nanoid } = await import('nanoid');
  configService.set('services.hash', nanoid(8));

  setupOpenApi(app);

  app.listen(port, host, async () => {
    const url = await app.getUrl();
    Logger.log(`🚀 Application is running on: ${url}`);
    Logger.log(`📚 API Documentation: ${url}/api`);
    Logger.log(`💻 Health Check: ${url}/health`);
    Logger.log(`📊 Performance Stats: ${url}/health/performance/stats`);
  });
}

bootstrap();
