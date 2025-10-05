import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from '../src/config/redis.config';
import { createClient } from 'redis';

describe('Redis Integration (e2e)', () => {
  let app: INestApplication;
  let redisService: RedisService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
      ],
      providers: [RedisService],
    }).compile();

    app = moduleFixture.createNestApplication();
    redisService = moduleFixture.get<RedisService>(RedisService);
    await app.init();
  });

  afterAll(async () => {
    await redisService.disconnect();
    await app.close();
  });

  it('should connect to Redis successfully', async () => {
    const { pubClient, subClient } = await redisService.createClients();
    
    expect(pubClient).toBeDefined();
    expect(subClient).toBeDefined();
    expect(pubClient.isOpen).toBe(true);
    expect(subClient.isOpen).toBe(true);
  });

  it('should perform basic Redis operations', async () => {
    const { pubClient } = await redisService.createClients();
    
    // Test set and get
    await pubClient.set('test:key', 'test:value');
    const value = await pubClient.get('test:key');
    expect(value).toBe('test:value');
    
    // Clean up
    await pubClient.del('test:key');
  });

  it('should perform pub/sub operations', async () => {
    const { pubClient, subClient } = await redisService.createClients();
    
    let receivedMessage = '';
    
    // Subscribe to channel
    await subClient.subscribe('test:channel', (message) => {
      receivedMessage = message;
    });
    
    // Publish message
    await pubClient.publish('test:channel', 'Hello Redis!');
    
    // Wait for message to be received
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(receivedMessage).toBe('Hello Redis!');
  });

  it('should handle Redis connection errors gracefully', async () => {
    // Test with invalid Redis configuration
    const invalidRedisService = new RedisService({
      get: (key: string, defaultValue?: any) => {
        if (key === 'REDIS_HOST') return 'invalid-host';
        if (key === 'REDIS_PORT') return 9999;
        return defaultValue;
      },
    } as any);

    await expect(invalidRedisService.createClients()).rejects.toThrow();
  });
});
