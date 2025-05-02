import {
  ArgumentsHost,
  Catch,
  Logger,
  RpcExceptionFilter,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';

@Catch()
export class AllExceptionFilter implements RpcExceptionFilter {
  catch(exception: any, host: ArgumentsHost): Observable<any> {
    Logger.error(exception, AllExceptionFilter.name);
    return throwError(() => {
      if(exception instanceof Error) {
        return exception.message
      }
      if("message" in exception) {
        return exception.message;
      }
      if("error" in exception) {
        return exception.error;
      }
    });
  }
}
