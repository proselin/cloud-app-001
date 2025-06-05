import { Catch, Logger, ExceptionFilter as BaseExceptionFilter, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { INTERNAL_SERVER_ERROR } from '../exceptions/exceptions';
import { ZodError } from 'zod';

@Catch()
export class AllExceptionFilter implements BaseExceptionFilter {
  catch(exception: object | string, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();    Logger.error(exception, AllExceptionFilter.name);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = INTERNAL_SERVER_ERROR.getResponse();

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.errors;
    }

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: message,
      });
  }
}
