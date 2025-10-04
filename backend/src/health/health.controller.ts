import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Check application health' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  @ApiResponse({ status: 500, description: 'Application is unhealthy' })
  async checkHealth() {
    this.logger.log('Health check requested');
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      const healthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime(),
      };
      
      this.logger.log('Health check passed - application is healthy');
      return healthStatus;
    } catch (error) {
      this.logger.error('Health check failed - application is unhealthy', error.stack);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      };
    }
  }

  @Get('db')
  @ApiOperation({ summary: 'Check database connection' })
  @ApiResponse({ status: 200, description: 'Database is connected' })
  @ApiResponse({ status: 500, description: 'Database connection failed' })
  async checkDatabase() {
    this.logger.log('Database health check requested');
    try {
      const result = await this.prisma.$queryRaw<[{ current_time: Date }]>`SELECT NOW() as current_time`;
      const dbStatus = {
        status: 'connected',
        timestamp: new Date().toISOString(),
        database_time: result[0].current_time,
      };
      
      this.logger.log('Database health check passed - database is connected');
      return dbStatus;
    } catch (error) {
      this.logger.error('Database health check failed - database is disconnected', error.stack);
      return {
        status: 'disconnected',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
