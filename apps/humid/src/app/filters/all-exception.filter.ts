import { Catch, Logger, RpcExceptionFilter } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { INTERNAL_SERVER_ERROR } from '../exceptions/exceptions';
import { ZodError } from 'zod';

@Catch()
export class AllExceptionFilter implements RpcExceptionFilter {
  catch(exception: object | string): Observable<string | object> {
    Logger.error(exception, AllExceptionFilter.name);
    return throwError(() => {
      if (exception instanceof RpcException) {
        return exception.getError();
      }
      if(exception instanceof ZodError) {
        return new RpcException(exception).getError()
      }
      return INTERNAL_SERVER_ERROR.getError();
    });
  }
}
