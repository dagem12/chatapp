import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(
      `Incoming Request: ${method} ${originalUrl} - IP: ${ip} - User-Agent: ${userAgent}`,
    );

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (chunk?: any, encoding?: any) {
      const responseTime = Date.now() - startTime;
      const { statusCode } = res;
      
      // Log outgoing response
      const logger = new Logger('HTTP');
      logger.log(
        `Outgoing Response: ${method} ${originalUrl} - Status: ${statusCode} - Response Time: ${responseTime}ms`,
      );

      // Call original end method
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  }
}
