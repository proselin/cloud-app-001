import { utilities, WinstonModule } from 'nest-winston';
import { getLoggerConfig } from './logger';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    // WinstonModule.forRootAsync({
    //   useFactory: () => {
    //     return getLoggerConfig('Humid', utilities);
    //   },
    // }),
  ],
})
export class LoggerModule {}
