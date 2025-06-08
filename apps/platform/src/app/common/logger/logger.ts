import { createLoggerInstant } from '@cloud/libs/logger';

const logger = createLoggerInstant('Platform');

export class PlatformLogger {
  log(...args: any[]) {
    //eslint-disable-next-line
    // @ts-ignore
    logger.info(...args);
  }

  warn(...args: any[]) {
    //eslint-disable-next-line
    // @ts-ignore
    logger.warn(...args);
  }

  fatal(...args: any[]) {
    //eslint-disable-next-line
    // @ts-ignore
    logger.error(...args);
  }

  verbose(...args: any[]) {
    //eslint-disable-next-line
    // @ts-ignore
    logger.verbose(...args);
  }

  error(...args: any[]) {
    //eslint-disable-next-line
    // @ts-ignore
    logger.error(...args);
  }
}
