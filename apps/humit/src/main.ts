import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as process from 'node:process';
import { ProcessMessage } from './app/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * Start development
   */
  if (process.env.NODE_ENV !== 'production') {
    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    Logger.log(
      `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
    );
    return;
  }

  /**
   * Start standalone
   */
  if (process.env.NODE_ENV === 'production') {
    process.on('message', (data: ProcessMessage<any>) => {

    });
  }
}

bootstrap();
