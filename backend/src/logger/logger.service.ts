import { Injectable, LoggerService as NestLoggerService, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { context, trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Custom logging methods for specific use cases
  logRequest(method: string, url: string, userAgent?: string, ip?: string) {
    this.logger.info(`Incoming Request: ${method} ${url}`, {
      context: 'HTTP',
      method,
      url,
      userAgent,
      ip,
    });
  }

  logResponse(method: string, url: string, statusCode: number, responseTime: number) {
    this.logger.info(`Outgoing Response: ${method} ${url} ${statusCode}`, {
      context: 'HTTP',
      method,
      url,
      statusCode,
      responseTime,
    });
  }

  logDatabaseQuery(query: string, params?: any, duration?: number) {
    this.logger.debug(`Database Query: ${query}`, {
      context: 'Database',
      query,
      params,
      duration,
    });
  }

  logAuthEvent(event: string, userId?: string, details?: any) {
    this.logger.info(`Auth Event: ${event}`, {
      context: 'Auth',
      event,
      userId,
      details,
    });
  }

  logMessageEvent(event: string, messageId?: string, userId?: string, details?: any) {
    this.logger.info(`Message Event: ${event}`, {
      context: 'Message',
      event,
      messageId,
      userId,
      details,
    });
  }
}
