# Logging System

This directory contains the comprehensive logging system for the chat application backend.

## Components

### Logger Module (`logger.module.ts`)
- Configures Winston logger with multiple transports
- Console logging with colorized output
- File logging for errors (`logs/error.log`)
- Combined logging for all events (`logs/combined.log`)

### Logger Service (`logger.service.ts`)
- Custom logger service with specialized logging methods
- Request/response logging
- Database query logging
- Authentication event logging
- Message event logging

### Middleware (`middleware/logging.middleware.ts`)
- HTTP request/response logging middleware
- Tracks request method, URL, IP, user agent
- Measures response time
- Logs response status codes

### Interceptors (`interceptors/logging.interceptor.ts`)
- Request/response interceptor for detailed logging
- Sanitizes sensitive data (passwords, tokens)
- Tracks user context and request details
- Measures execution time

### Exception Filters (`filters/logging-exception.filter.ts`)
- Global exception filter for error logging
- Captures full error context
- Logs stack traces and request details
- Provides structured error responses

## Log Files

- `logs/error.log` - Contains only error-level logs
- `logs/combined.log` - Contains all log levels
- Console output - Colorized logs for development

## Usage

The logging system is automatically integrated into:
- All controllers (Auth, Messages, Health)
- All services (Auth, Messages, Prisma)
- Global request/response handling
- Exception handling

## Log Levels

- `error` - Error conditions
- `warn` - Warning conditions
- `info` - Informational messages
- `debug` - Debug-level messages
- `verbose` - Verbose messages

## Configuration

Logging configuration can be modified in `logger.module.ts` to:
- Change log file locations
- Modify log formats
- Add additional transports
- Configure log levels
