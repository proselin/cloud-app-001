import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { PerformanceService } from '../common/services/performance.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly performanceService: PerformanceService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap({
        next: () => {
          this.recordMetric(request, response, startTime);
        },
        error: (error) => {
          this.recordMetric(request, response, startTime, error);
        },
      }),
    );
  }

  private recordMetric(
    request: Request,
    response: Response,
    startTime: number,
    error?: Error,
  ): void {
    const duration = Date.now() - startTime;

    this.performanceService.recordMetric({
      method: request.method,
      endpoint: this.sanitizeEndpoint(request.route?.path || request.path),
      duration,
      timestamp: Date.now(),
      statusCode: response.statusCode,
      error: error?.message,
    });
  }

  private sanitizeEndpoint(path: string): string {
    // Replace route parameters with placeholders to group similar endpoints
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
      .replace(/\/[a-f0-9]{24}/g, '/:objectId');
  }
}
