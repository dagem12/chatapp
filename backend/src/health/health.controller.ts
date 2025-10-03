import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Check application health' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  @ApiResponse({ status: 500, description: 'Application is unhealthy' })
  async checkHealth() {
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime(),
      };
    } catch (error) {
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
    try {
      const result = await this.prisma.$queryRaw`SELECT NOW() as current_time`;
      return {
        status: 'connected',
        timestamp: new Date().toISOString(),
        database_time: result[0].current_time,
      };
    } catch (error) {
      return {
        status: 'disconnected',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
