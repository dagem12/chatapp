import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError } from '@prisma/client/runtime/library';

@Catch()
export class LoggingExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    // Handle Prisma errors
    if (exception instanceof PrismaClientKnownRequestError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Database operation failed';
      error = 'Database Error';
      
      // Log the full Prisma error details
      this.logger.error(
        `Prisma Error: ${exception.code} - ${exception.message}`,
        {
          code: exception.code,
          meta: exception.meta,
          stack: exception.stack,
          path: request.url,
          method: request.method,
        },
      );
    } else if (exception instanceof PrismaClientUnknownRequestError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Database connection failed';
      error = 'Database Error';
      
      // Log the full Prisma error details
      this.logger.error(
        `Prisma Unknown Error: ${exception.message}`,
        {
          stack: exception.stack,
          path: request.url,
          method: request.method,
        },
      );
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || error;
      }
      
      // Log HTTP exceptions with full context
      this.logger.error(
        `HTTP Exception: ${error} - ${message}`,
        {
          statusCode: status,
          path: request.url,
          method: request.method,
          stack: exception.stack,
        },
      );
    } else if (exception instanceof Error) {
      message = 'Internal server error';
      error = 'Internal Server Error';
      
      // Log all other errors with full context
      this.logger.error(
        `Unknown Error: ${exception.name} - ${exception.message}`,
        {
          name: exception.name,
          stack: exception.stack,
          path: request.url,
          method: request.method,
        },
      );
    }

    // Return simplified error response to frontend
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
    };

    response.status(status).json(errorResponse);
  }
}
