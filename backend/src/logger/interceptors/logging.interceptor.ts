import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('LoggingInterceptor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, query, params } = request;
    const user = (request as any).user;
    const startTime = Date.now();

    // Log request details
    this.logger.log(
      `Request: ${method} ${url}`,
      {
        method,
        url,
        body: this.sanitizeBody(body),
        query,
        params,
        userId: user?.id,
        userEmail: user?.email,
      },
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - startTime;
          this.logger.log(
            `Response: ${method} ${url} - ${responseTime}ms`,
            {
              method,
              url,
              responseTime,
              statusCode: 200,
              userId: user?.id,
            },
          );
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          this.logger.error(
            `Error: ${method} ${url} - ${error.message} - ${responseTime}ms`,
            {
              method,
              url,
              error: error.message,
              stack: error.stack,
              responseTime,
              userId: user?.id,
            },
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}
