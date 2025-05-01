import { WinstonModule } from 'nest-winston';
import { getLoggerConfig } from '@cloud/libs/logger';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: () => {
        return getLoggerConfig('Humid');
      },
    }),
  ],
})
export class LoggerModule {}
