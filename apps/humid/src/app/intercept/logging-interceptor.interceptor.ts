import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private configService: ConfigService) {}

  private async getNanoid(): Promise<(size?: number) => string> {
    const { nanoid } = await import('nanoid');
    return nanoid;
  }

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.getArgs()[0];
    const nanoid = await this.getNanoid();
    const uuid = request?.cookies?.['msgid'] ?? nanoid(8);
    const serviceHash = this.configService.getOrThrow('services.hash');
    const handler = context.getHandler().name;
    const type = context.getType();
    const className = context.getClass().name;
    const url = request.url
    const method = String(request?.method ?? "Unknown").toUpperCase();

    Logger.log(
      `[${uuid}:${serviceHash}]:[${type}]::Request on ${method} - ${url} \n Body ${JSON.stringify(request?.body) ?? "NULL"} \n`,
      className
    );
    const now = Date.now();
    return next.handle().pipe(
      tap({
        next: () => {
          Logger.log(
            `[${uuid}:${serviceHash}]:[${type}]::Complete in ${
              Date.now() - now
            } ms`,
            className
          );
        },
        error: (err) => {
          Logger.error(
            `[${uuid}:${serviceHash}]:[${type}]:: Request error`,
            className
          );
          Logger.error(err, className);
        },
      })
    );
  }
}
