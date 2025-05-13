import { utilities, WinstonModule } from 'nest-winston';
import { getLoggerConfig } from '@cloud/libs/logger';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: () => {
        return getLoggerConfig('Humid', utilities);
      },
    }),
  ],
})
export class LoggerModule {}
