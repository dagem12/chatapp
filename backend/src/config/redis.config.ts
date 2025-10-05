import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { Logger, OnModuleInit, OnModuleDestroy, Injectable } from '@nestjs/common';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
  keepAlive?: number;
  family?: number;
  connectTimeout?: number;
  commandTimeout?: number;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private pubClient: RedisClientType;
  private subClient: RedisClientType;
  private redisClient: RedisClientType;
  private isInitialized = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeRedis();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async initializeRedis() {
    try {
      this.logger.log('Starting Redis initialization...');
      
      // Debug ConfigService availability
      this.logger.log('ConfigService available:', !!this.configService);
      
      if (!this.configService) {
        throw new Error('ConfigService is not available');
      }
      
      // Debug environment variables
      const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
      const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
      const redisPassword = this.configService.get<string>('REDIS_PASSWORD', '');
      const redisDb = this.configService.get<number>('REDIS_DB', 0);
      
      // Debug what ConfigService is actually returning
      this.logger.log('ConfigService values:', {
        REDIS_HOST: this.configService.get('REDIS_HOST'),
        REDIS_PORT: this.configService.get('REDIS_PORT'),
        REDIS_PASSWORD: this.configService.get('REDIS_PASSWORD'),
        REDIS_DB: this.configService.get('REDIS_DB'),
        NODE_ENV: this.configService.get('NODE_ENV'),
      });
      
      // Debug process.env directly
      this.logger.log('Process.env values:', {
        REDIS_HOST: process.env.REDIS_HOST,
        REDIS_PORT: process.env.REDIS_PORT,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
        REDIS_DB: process.env.REDIS_DB,
        NODE_ENV: process.env.NODE_ENV,
      });
      
      this.logger.log(`Redis config - Host: ${redisHost}, Port: ${redisPort}, DB: ${redisDb}, Password: ${redisPassword ? '[SET]' : '[EMPTY]'}`);
      
      await this.createClients();
      this.isInitialized = true;
      this.reconnectAttempts = 0;
      this.logger.log('Redis service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Redis service:', error.message || error);
      this.logger.error('Error stack:', error.stack);
      this.isInitialized = false;
      await this.handleReconnection();
    }
  }

  private async handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.logger.log(`Attempting to reconnect to Redis (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(async () => {
        try {
          await this.initializeRedis();
        } catch (error) {
          this.logger.error(`Reconnection attempt ${this.reconnectAttempts} failed:`, error);
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      this.logger.error('Max reconnection attempts reached. Redis service unavailable.');
    }
  }

  getClients() {
    return {
      pubClient: this.pubClient,
      subClient: this.subClient,
      redisClient: this.redisClient,
    };
  }

  get isServiceInitialized() {
    return this.isInitialized;
  }

  // Check if the service is fully ready for use
  get isServiceReady() {
    return this.isInitialized && 
           this.pubClient?.isOpen && 
           this.subClient?.isOpen && 
           this.redisClient?.isOpen;
  }

  async createClients(): Promise<{
    pubClient: RedisClientType;
    subClient: RedisClientType;
    redisClient: RedisClientType;
  }> {
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD', '');
    
    // Debug the password value
    this.logger.log(`Redis password debug: "${redisPassword}" (length: ${redisPassword?.length}, type: ${typeof redisPassword})`);
    
    const redisConfig: RedisConfig = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: (redisPassword && redisPassword.trim() !== '') ? redisPassword : undefined, // Only set password if it's not empty
      db: this.configService.get<number>('REDIS_DB', 0),
      retryDelayOnFailover: this.configService.get<number>('REDIS_RETRY_DELAY_ON_FAILOVER', 100),
      maxRetriesPerRequest: this.configService.get<number>('REDIS_MAX_RETRIES_PER_REQUEST', 3),
      lazyConnect: this.configService.get<boolean>('REDIS_LAZY_CONNECT', false),
      keepAlive: this.configService.get<number>('REDIS_KEEP_ALIVE', 30000),
      family: this.configService.get<number>('REDIS_FAMILY', 4),
      connectTimeout: this.configService.get<number>('REDIS_CONNECT_TIMEOUT', 10000),
      commandTimeout: this.configService.get<number>('REDIS_COMMAND_TIMEOUT', 5000),
    };

    this.logger.log(`Redis config: ${JSON.stringify(redisConfig)}`);

    const baseConfig = {
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
      },
      password: redisConfig.password,
      database: redisConfig.db,
    };

    this.logger.log(`Base config for Redis clients: ${JSON.stringify(baseConfig)}`);

    try {
      // Create publisher client
      this.logger.log('Creating publisher client...');
      this.pubClient = createClient(baseConfig);

      // Create subscriber client using duplicate() for Socket.IO Redis adapter compatibility
      this.logger.log('Creating subscriber client using duplicate()...');
      this.subClient = this.pubClient.duplicate();

      // Create general Redis client for caching
      this.logger.log('Creating general Redis client...');
      this.redisClient = createClient(baseConfig);

      this.logger.log('All Redis clients created successfully');
    } catch (error) {
      this.logger.error('Failed to create Redis clients:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        error: error
      });
      throw error;
    }

    // Handle connection events with better error handling
    this.pubClient.on('error', (err) => {
      this.logger.error(`Redis Publisher Client Error: ${err?.message || 'Unknown error'}`, err);
      this.isInitialized = false;
    });

    this.subClient.on('error', (err) => {
      this.logger.error(`Redis Subscriber Client Error: ${err?.message || 'Unknown error'}`, err);
      this.isInitialized = false;
    });

    this.redisClient.on('error', (err) => {
      this.logger.error(`Redis Client Error: ${err?.message || 'Unknown error'}`, err);
      this.isInitialized = false;
    });

    this.pubClient.on('connect', () => {
      this.logger.log('Redis Publisher Client Connected');
    });

    this.subClient.on('connect', () => {
      this.logger.log('Redis Subscriber Client Connected');
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis Client Connected');
    });

    // Handle disconnection events
    this.pubClient.on('disconnect', () => {
      this.logger.warn('Redis Publisher Client Disconnected');
      this.isInitialized = false;
    });

    this.subClient.on('disconnect', () => {
      this.logger.warn('Redis Subscriber Client Disconnected');
      this.isInitialized = false;
    });

    this.redisClient.on('disconnect', () => {
      this.logger.warn('Redis Client Disconnected');
      this.isInitialized = false;
    });

    // Connect to Redis with error handling
    try {
      this.logger.log('Attempting to connect Redis clients...');
      await Promise.all([
        this.pubClient.connect(),
        this.subClient.connect(),
        this.redisClient.connect(),
      ]);

      this.logger.log('Redis clients connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect Redis clients:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        error: error
      });
      throw error;
    }

    return {
      pubClient: this.pubClient,
      subClient: this.subClient,
      redisClient: this.redisClient,
    };
  }

  async disconnect(): Promise<void> {
    try {
      const disconnectPromises: Promise<void>[] = [];
      
      if (this.pubClient && this.pubClient.isOpen) {
        disconnectPromises.push(this.pubClient.disconnect());
      }
      if (this.subClient && this.subClient.isOpen) {
        disconnectPromises.push(this.subClient.disconnect());
      }
      if (this.redisClient && this.redisClient.isOpen) {
        disconnectPromises.push(this.redisClient.disconnect());
      }

      if (disconnectPromises.length > 0) {
        await Promise.all(disconnectPromises);
      }
      
      this.isInitialized = false;
      this.logger.log('Redis clients disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting Redis clients:', error);
    }
  }

  getPubClient(): RedisClientType {
    return this.pubClient;
  }

  getSubClient(): RedisClientType {
    return this.subClient;
  }

  getRedisClient(): RedisClientType {
    return this.redisClient;
  }

  isConnected(): boolean {
    return this.isInitialized && 
           this.pubClient?.isOpen && 
           this.subClient?.isOpen && 
           this.redisClient?.isOpen;
  }

  // Advanced Cache methods with performance optimizations
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping SET for key ${key}`);
      return;
    }
    
    try {
      const serializedValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redisClient.setEx(key, ttlSeconds, serializedValue);
      } else {
        await this.redisClient.set(key, serializedValue);
      }
    } catch (error) {
      this.logger.error(`Redis SET error for key ${key}:`, error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping GET for key ${key}`);
      return null;
    }
    
    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping DEL for key ${key}`);
      return;
    }
    
    try {
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(`Redis DEL error for key ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping EXISTS for key ${key}`);
      return false;
    }
    
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  // Batch operations for better performance
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isConnected() || keys.length === 0) {
      return keys.map(() => null);
    }
    
    try {
      const values = await this.redisClient.mGet(keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      this.logger.error(`Redis MGET error for keys ${keys.join(', ')}:`, error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Record<string, any>, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected() || Object.keys(keyValuePairs).length === 0) {
      return;
    }
    
    try {
      const serializedPairs: Record<string, string> = {};
      for (const [key, value] of Object.entries(keyValuePairs)) {
        serializedPairs[key] = JSON.stringify(value);
      }
      
      await this.redisClient.mSet(serializedPairs);
      
      // Set TTL for all keys if specified
      if (ttlSeconds) {
        const expirePromises = Object.keys(keyValuePairs).map(key => 
          this.redisClient.expire(key, ttlSeconds)
        );
        await Promise.all(expirePromises);
      }
    } catch (error) {
      this.logger.error(`Redis MSET error:`, error);
    }
  }

  // Pattern-based operations
  async delPattern(pattern: string): Promise<number> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping DEL pattern ${pattern}`);
      return 0;
    }
    
    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length === 0) return 0;
      
      const result = await this.redisClient.del(keys);
      return result;
    } catch (error) {
      this.logger.error(`Redis DEL pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  // Hash operations for structured data
  async hset(key: string, field: string, value: any): Promise<void> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping HSET for key ${key}`);
      return;
    }
    
    try {
      const serializedValue = JSON.stringify(value);
      await this.redisClient.hSet(key, field, serializedValue);
    } catch (error) {
      this.logger.error(`Redis HSET error for key ${key}, field ${field}:`, error);
    }
  }

  async hget<T>(key: string, field: string): Promise<T | null> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping HGET for key ${key}`);
      return null;
    }
    
    try {
      const value = await this.redisClient.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Redis HGET error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping HGETALL for key ${key}`);
      return {};
    }
    
    try {
      const hash = await this.redisClient.hGetAll(key);
      const result: Record<string, T> = {};
      
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Redis HGETALL error for key ${key}:`, error);
      return {};
    }
  }

  async hdel(key: string, fields: string[]): Promise<number> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping HDEL for key ${key}`);
      return 0;
    }
    
    try {
      return await this.redisClient.hDel(key, fields);
    } catch (error) {
      this.logger.error(`Redis HDEL error for key ${key}:`, error);
      return 0;
    }
  }

  // List operations for message queues
  async lpush(key: string, ...values: any[]): Promise<number> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping LPUSH for key ${key}`);
      return 0;
    }
    
    try {
      const serializedValues = values.map(value => JSON.stringify(value));
      return await this.redisClient.lPush(key, serializedValues);
    } catch (error) {
      this.logger.error(`Redis LPUSH error for key ${key}:`, error);
      return 0;
    }
  }

  async rpop<T>(key: string): Promise<T | null> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping RPOP for key ${key}`);
      return null;
    }
    
    try {
      const value = await this.redisClient.rPop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Redis RPOP error for key ${key}:`, error);
      return null;
    }
  }

  async llen(key: string): Promise<number> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping LLEN for key ${key}`);
      return 0;
    }
    
    try {
      return await this.redisClient.lLen(key);
    } catch (error) {
      this.logger.error(`Redis LLEN error for key ${key}:`, error);
      return 0;
    }
  }

  // Set operations for user sessions and online users
  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping SADD for key ${key}`);
      return 0;
    }
    
    try {
      return await this.redisClient.sAdd(key, members);
    } catch (error) {
      this.logger.error(`Redis SADD error for key ${key}:`, error);
      return 0;
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping SREM for key ${key}`);
      return 0;
    }
    
    try {
      return await this.redisClient.sRem(key, members);
    } catch (error) {
      this.logger.error(`Redis SREM error for key ${key}:`, error);
      return 0;
    }
  }

  async smembers(key: string): Promise<string[]> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping SMEMBERS for key ${key}`);
      return [];
    }
    
    try {
      return await this.redisClient.sMembers(key);
    } catch (error) {
      this.logger.error(`Redis SMEMBERS error for key ${key}:`, error);
      return [];
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping SISMEMBER for key ${key}`);
      return false;
    }
    
    try {
      const result = await this.redisClient.sIsMember(key, member);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis SISMEMBER error for key ${key}:`, error);
      return false;
    }
  }

  // Pub/Sub operations for real-time messaging
  async publish(channel: string, message: any): Promise<number> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping PUBLISH for channel ${channel}`);
      return 0;
    }
    
    try {
      const serializedMessage = JSON.stringify(message);
      return await this.pubClient.publish(channel, serializedMessage);
    } catch (error) {
      this.logger.error(`Redis PUBLISH error for channel ${channel}:`, error);
      return 0;
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping SUBSCRIBE for channel ${channel}`);
      return;
    }
    
    try {
      await this.subClient.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch (error) {
          this.logger.error(`Error parsing message from channel ${channel}:`, error);
        }
      });
    } catch (error) {
      this.logger.error(`Redis SUBSCRIBE error for channel ${channel}:`, error);
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    if (!this.isConnected()) {
      this.logger.warn(`Redis not connected, skipping UNSUBSCRIBE for channel ${channel}`);
      return;
    }
    
    try {
      await this.subClient.unsubscribe(channel);
    } catch (error) {
      this.logger.error(`Redis UNSUBSCRIBE error for channel ${channel}:`, error);
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }
    
    try {
      const result = await this.redisClient.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis PING error:', error);
      return false;
    }
  }

  // Get Redis info
  async info(): Promise<string> {
    if (!this.isConnected()) {
      return 'Redis not connected';
    }
    
    try {
      return await this.redisClient.info();
    } catch (error) {
      this.logger.error('Redis INFO error:', error);
      return 'Error getting Redis info';
    }
  }

  // Wait for clients to be ready with timeout
  async waitForClientsReady(timeoutMs = 10000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (this.isConnected() && 
          this.pubClient?.isOpen && 
          this.subClient?.isOpen && 
          this.redisClient?.isOpen) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.logger.warn('Redis clients not ready within timeout');
    return false;
  }

}
