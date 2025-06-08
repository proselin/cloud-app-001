import DailyRotateFile from 'winston-daily-rotate-file';
import { createLogger, format, LoggerOptions, transports } from 'winston';

export function getLoggerConfig(
  name: string,
  nestWinstonUtil?: {
    format: {
      nestLike: any;
    };
  }
): LoggerOptions {
  if (process.env['NODE_ENV'] === 'development') {
    if (!nestWinstonUtil) {
      return {
        format: format.combine(
          format.colorize(),
          format.simple(),
          format.label({ label: name }),
          format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          format.printf(({ level, message, label, timestamp }) => {
            return `[${label}] - ${timestamp} [${level}]: ${message}`; // LOG FORMAT
          })
        ),
        transports: [
          new transports.Console(),
          new transports.File({
            filename: `logs/${name}/dev-combined.log`,
          }),
        ],
      };
    }
    return {
      format: format.combine(
        format.timestamp(),
        format.ms(),
        nestWinstonUtil.format.nestLike(name, {
          colors: true,
          prettyPrint: true,
          processId: true,
          appName: true,
        })
      ),
      transports: [
        new transports.Console(),
        new transports.File({
          format: format.combine(
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            format.errors({ stack: false }),
            format.json(),
            format.label({ label: name })
          ),
          filename: `logs/${name}/dev-combined.log`,
        }),
      ],
    };
  }
  return {
    level: 'info',
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: false }),
      format.json(),
      format.label({ label: name })
    ),
    transports: [
      new transports.Console({
        format: format.combine(format.json(), format.label({ label: name })),
      }),
      new transports.File({
        filename: `logs/${name}/error.log`,
        level: 'error',
        format: format.combine(
          format.timestamp(),
          format.json(),
          format.label({ label: name })
        ),
      }),
      new transports.File({
        filename: `logs/${name}/combined.log`,
        format: format.combine(
          format.timestamp(),
          format.json(),
          format.label({ label: name })
        ),
      }),
      new DailyRotateFile({
        filename: `logs/${name}/application-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d', // Retain logs for 14 days
        level: 'info',
        format: format.combine(
          format.timestamp(),
          format.json(),
          format.label({ label: name })
        ),
      }),
      new DailyRotateFile({
        filename: `logs/${name}/error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d', // Retain error logs for 30 days
        level: 'error',
        format: format.combine(
          format.timestamp(),
          format.json(),
          format.label({ label: name })
        ),
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

export function createChildProcessOptions(name: string) {
  if (process.env['NODE_ENV'] === 'development') {
    return {
      format: format.combine(
        format.simple(),
        format.label({ label: name }),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ level, message, label, timestamp }) => {
          return `[${label}] - ${timestamp} [${level}]: ${message}`; // LOG FORMAT
        })
      ),
      transports: [
        new transports.Console(),
        new transports.File({
          filename: `logs/${name}/dev-combined.log`,
        }),
      ],
    };
  }

  return {
    level: 'info',
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: false }),
      format.json(),
      format.label({ label: name })
    ),
    transports: [
      new transports.Console({
        format: format.combine(format.json(), format.label({ label: name })),
      }),
      new transports.File({
        filename: `logs/${name}/error.log`,
        level: 'error',
        format: format.combine(
          format.timestamp(),
          format.json(),
          format.label({ label: name })
        ),
      }),
      new transports.File({
        filename: `logs/${name}/combined.log`,
        format: format.combine(
          format.timestamp(),
          format.json(),
          format.label({ label: name })
        ),
      }),
      new DailyRotateFile({
        filename: `logs/${name}/application-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d', // Retain logs for 14 days
        level: 'info',
        format: format.combine(
          format.timestamp(),
          format.json(),
          format.label({ label: name })
        ),
      }),
      new DailyRotateFile({
        filename: `logs/${name}/error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d', // Retain error logs for 30 days
        level: 'error',
        format: format.combine(
          format.timestamp(),
          format.json(),
          format.label({ label: name })
        ),
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

export function createChildProcessLogger(name: string) {
  return createLogger(createChildProcessOptions(name));
}

export function createLoggerInstant(name: string) {
  return createLogger(getLoggerConfig(name));
}
