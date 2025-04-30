import { Module } from '@nestjs/common';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule
} from 'nest-winston';
import { ConfigService } from '@nestjs/config';
//eslint-disable-next-line
// @ts-ignore
import winston from 'winston';
//eslint-disable-next-line
// @ts-ignore
import DailyRotateFile from 'winston-daily-rotate-file';


@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        if (configService.get('node_env') == 'development') {
          return {
            transports: [
              new winston.transports.Console({
                format: winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.ms(),
                  nestWinstonModuleUtilities.format.nestLike(
                    configService.get('appName', 'Nest'),
                    {
                      colors: true,
                      prettyPrint: true,
                      processId: true,
                      appName: true
                    }
                  )
                )
              }),
              new winston.transports.File({
                filename: 'logs/combined.log',
                format: winston.format.combine(
                  winston.format.timestamp({
                    format: () =>
                      new Intl.DateTimeFormat('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }).format(new Date())
                  }),
                  winston.format.json()
                )
              })
            ]
          };
        }
        return {
          level: 'info',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json() // Use JSON format for structured logging
          ),
          transports: [
            new winston.transports.Console({
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
                winston.format.ms(),
                winston.format.metadata()
              )
            }),
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
              )
            }),
            new winston.transports.File({
              filename: 'logs/combined.log',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
              )
            }),
            new DailyRotateFile({
              filename: 'logs/application-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxSize: '20m',
              maxFiles: '14d', // Retain logs for 14 days
              level: 'info',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
              )
            }),
            new DailyRotateFile({
              filename: 'logs/error-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxSize: '20m',
              maxFiles: '30d', // Retain error logs for 30 days
              level: 'error',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
              )
            })
          ],
          exceptionHandlers: [
            new winston.transports.File({ filename: 'logs/exceptions.log' })
          ],
          rejectionHandlers: [
            new winston.transports.File({ filename: 'logs/rejections.log' })
          ]
        };
      }
    })
  ]
})
export class LoggerModule {
}
