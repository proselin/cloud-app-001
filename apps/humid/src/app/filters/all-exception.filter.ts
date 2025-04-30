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
    Logger.error(JSON.stringify(exception), AllExceptionFilter.name);
    return throwError(() => exception);
  }
}
