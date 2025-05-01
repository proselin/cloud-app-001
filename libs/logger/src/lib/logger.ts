import DailyRotateFile from 'winston-daily-rotate-file';
import { createLogger, format, LoggerOptions, transports } from 'winston';

export function getLoggerConfig(name: string): LoggerOptions {
  if (process.env['NODE_ENV'] === 'development') {
    return {
      transports: [
        new transports.Console({
          format: format.combine(
            format.timestamp(),
            format.ms(),
            format.colorize(),
            format.prettyPrint(),
            format.align(),
            format.label({ label: name })
          ),
        }),
        new transports.File({
          filename: `logs/${name}/combined.log`,
          format: format.combine(
            format.timestamp({
              format: () =>
                new Intl.DateTimeFormat('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }).format(new Date()),
            }),
            format.json()
          ),
        }),
      ],
    };
  }
  return {
    level: 'info',
    format: format.combine(
      format.timestamp(),
      format.json(),
      format.ms(),
      format.label({ label: name })
    ),
    transports: [
      new transports.Console({
        format: format.combine(
          format.timestamp(),
          format.json(),
          format.ms(),
          format.label({ label: name })
        ),
      }),
      new transports.File({
        filename: `logs/${name}/error.log`,
        level: 'error',
        format: format.combine(format.timestamp(), format.json()),
      }),
      new transports.File({
        filename: `logs/${name}/combined.log`,
        format: format.combine(format.timestamp(), format.json()),
      }),
      new DailyRotateFile({
        filename: `logs/${name}/application-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d', // Retain logs for 14 days
        level: 'info',
        format: format.combine(format.timestamp(), format.json()),
      }),
      new DailyRotateFile({
        filename: `logs/${name}/error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d', // Retain error logs for 30 days
        level: 'error',
        format: format.combine(format.timestamp(), format.json()),
      }),
    ],
    exceptionHandlers: [
      new transports.File({ filename: `logs/${name}/exceptions.log` }),
    ],
    rejectionHandlers: [
      new transports.File({ filename: `logs/${name}/rejections.log` }),
    ],
  };
}

export function createLoggerInstant(name: string) {
  return createLogger(getLoggerConfig(name));
}

