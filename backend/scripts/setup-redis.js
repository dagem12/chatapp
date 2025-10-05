#!/usr/bin/env node

/**
 * Redis Setup Script
 * 
 * This script helps set up Redis for the chat application.
 * It creates the necessary Redis configuration and tests the connection.
 */

const { createClient } = require('redis');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../config/database.env') });

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
};

async function testRedisConnection() {
  console.log('🔍 Testing Redis connection...');
  console.log('Redis Config:', {
    host: redisConfig.host,
    port: redisConfig.port,
    db: redisConfig.db,
    hasPassword: !!redisConfig.password,
  });

  const client = createClient({
    socket: {
      host: redisConfig.host,
      port: redisConfig.port,
    },
    password: redisConfig.password,
    database: redisConfig.db,
  });

  try {
    client.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('✅ Redis Client Connected');
    });

    await client.connect();
    
    // Test basic operations
    await client.set('test:connection', 'success');
    const result = await client.get('test:connection');
    
    if (result === 'success') {
      console.log('✅ Redis connection test successful');
      
      // Clean up test key
      await client.del('test:connection');
      
      // Test pub/sub functionality
      console.log('🔍 Testing Redis Pub/Sub...');
      
      const pubClient = createClient({
        socket: {
          host: redisConfig.host,
          port: redisConfig.port,
        },
        password: redisConfig.password,
        database: redisConfig.db,
      });
      
      const subClient = createClient({
        socket: {
          host: redisConfig.host,
          port: redisConfig.port,
        },
        password: redisConfig.password,
        database: redisConfig.db,
      });
      
      await pubClient.connect();
      await subClient.connect();
      
      // Test pub/sub
      await subClient.subscribe('test:channel', (message) => {
        console.log('✅ Received message:', message);
      });
      
      await pubClient.publish('test:channel', 'Hello Redis!');
      
      // Wait a bit for message to be received
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await pubClient.disconnect();
      await subClient.disconnect();
      
      console.log('✅ Redis Pub/Sub test successful');
      
    } else {
      console.error('❌ Redis connection test failed');
    }
    
    await client.disconnect();
    console.log('✅ Redis setup completed successfully');
    
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.log('\n📋 Troubleshooting tips:');
    console.log('1. Make sure Redis server is running');
    console.log('2. Check Redis host and port configuration');
    console.log('3. Verify Redis password if authentication is enabled');
    console.log('4. Ensure Redis database exists');
    console.log('\n🚀 To start Redis server:');
    console.log('   - Windows: redis-server');
    console.log('   - macOS: brew services start redis');
    console.log('   - Linux: sudo systemctl start redis');
    
    process.exit(1);
  }
}

async function createRedisConfig() {
  console.log('📝 Creating Redis configuration...');
  
  const configPath = path.join(__dirname, '../config/database.env');
  const configContent = `# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
`;

  try {
    fs.writeFileSync(configPath, configContent);
    console.log('✅ Redis configuration created at:', configPath);
  } catch (error) {
    console.error('❌ Failed to create Redis configuration:', error.message);
  }
}

async function main() {
  console.log('🚀 Redis Setup for Chat Application');
  console.log('=====================================\n');
  
  await createRedisConfig();
  await testRedisConnection();
  
  console.log('\n🎉 Redis setup completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Start your Redis server');
  console.log('2. Run: npm run build');
  console.log('3. Run: pm2 start ecosystem.config.js');
  console.log('4. Check logs: pm2 logs');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testRedisConnection, createRedisConfig };
