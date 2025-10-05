import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: [
        {
          emit: 'stdout',
          level: 'error',
        },
        {
          emit: 'stdout',
          level: 'warn',
        },
        {
          emit: 'stdout',
          level: 'info',
        },
        ...(process.env.NODE_ENV === 'development' ? [{
          emit: 'stdout' as const,
          level: 'query' as const,
        }] : []),
      ],
      // Connection pool settings for better performance with multiple instances
      // Note: Connection pooling is handled at the database URL level
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to database...');
    const maxRetries = 5;
    const retryDelay = 2000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Database connected successfully');
        return;
      } catch (error) {
        this.logger.error(`Database connection attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt === maxRetries) {
          this.logger.error('Failed to connect to database after all retries', error.stack);
          throw error;
        }
        
        this.logger.log(`Retrying database connection in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    try {
      await this.$disconnect();
      this.logger.log('Database disconnected successfully');
    } catch (error) {
      this.logger.error('Failed to disconnect from database', error.stack);
    }
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error.stack);
      return false;
    }
  }
}
