import { LoggerService, LogLevel } from '@nestjs/common';

export class LocalLogger implements LoggerService {
  private logLevel = new Set<LogLevel | string>([
    'fatal',
    'info',
    'warn',
    'error',
  ]);

  log(message: any, ...optionalParams: any[]) {
    if (!this.logLevel.has('info')) return;
    console.log(message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    if (!this.logLevel.has('error')) return;
    console.error(message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    if (!this.logLevel.has('warn')) return;
    console.warn(message, ...optionalParams);
  }

  debug?(message: any, ...optionalParams: any[]) {
    if (!this.logLevel.has('debug')) return;
    console.debug(message, ...optionalParams);
  }

  verbose?(message: any, ...optionalParams: any[]) {
    if (!this.logLevel.has('verbose')) return;
    console.log(message, ...optionalParams);
  }

  fatal?(message: any, ...optionalParams: any[]) {
    if (!this.logLevel.has('fatal')) return;
    console.error(message, ...optionalParams);
  }

  setLogLevels?(levels: LogLevel[]) {
    this.logLevel = new Set(levels);
  }
}
