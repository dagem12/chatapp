# Redis Integration for Socket.IO

This document explains how Redis is integrated with Socket.IO to enable multi-instance scaling and message synchronization across PM2 clusters.

## Overview

The chat application uses Redis as a message broker for Socket.IO to enable:
- **Multi-instance scaling**: Run multiple backend instances
- **Message synchronization**: Messages are synchronized across all instances
- **Load balancing**: Distribute WebSocket connections across instances
- **High availability**: If one instance fails, others continue working

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Frontend      │    │   Frontend      │
│   (User 1)      │    │   (User 2)      │    │   (User 3)      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │ WebSocket            │ WebSocket            │ WebSocket
          │                      │                      │
┌─────────▼───────┐    ┌─────────▼───────┐    ┌─────────▼───────┐
│  Backend        │    │  Backend        │    │  Backend        │
│  Instance 1     │    │  Instance 2     │    │  Instance 3     │
│  (Port 3000)    │    │  (Port 3001)    │    │  (Port 3002)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Redis Server       │
                    │   (Message Broker)      │
                    │   - Pub/Sub            │
                    │   - Room Management    │
                    │   - Message Sync       │
                    └─────────────────────────┘
```

## Components

### 1. Redis Service (`src/config/redis.config.ts`)

The `RedisService` class manages Redis connections:
- Creates publisher and subscriber clients
- Handles connection events and errors
- Provides connection management methods

### 2. Redis Module (`src/config/redis.module.ts`)

Global module that provides Redis service to the entire application.

### 3. Socket.IO Gateway (`src/messages/messages.gateway.ts`)

Updated to use Redis adapter:
- Initializes Redis adapter in `afterInit` method
- Gracefully falls back to single-instance mode if Redis fails
- Maintains all existing functionality

### 4. PM2 Configuration (`ecosystem.config.js`)

Configuration for running multiple instances:
- Cluster mode with 2 instances
- Environment-specific settings
- Logging and monitoring

## Setup Instructions

### 1. Install Redis

**Windows:**
```bash
# Download from https://redis.io/download
# Or use Chocolatey
choco install redis-64
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### 2. Configure Redis

Update your `.env` file:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 3. Test Redis Connection

```bash
cd backend
node scripts/setup-redis.js
```

### 4. Build and Run

```bash
# Build the application
npm run build

# Run with PM2 (multiple instances)
pm2 start ecosystem.config.js

# Or run in development mode
npm run start:dev
```

## PM2 Commands

```bash
# Start all instances
pm2 start ecosystem.config.js

# Stop all instances
pm2 stop ecosystem.config.js

# Restart all instances
pm2 restart ecosystem.config.js

# View logs
pm2 logs

# Monitor instances
pm2 monit

# Scale instances
pm2 scale ecosystem.config.js 4  # Run 4 instances

# Delete all instances
pm2 delete ecosystem.config.js
```

## How It Works

### Message Broadcasting

1. **User sends message** → Frontend sends to any backend instance
2. **Backend processes message** → Saves to database
3. **Redis adapter broadcasts** → Message sent to Redis
4. **All instances receive** → Redis distributes to all connected instances
5. **Clients receive message** → All connected clients get the message

### Room Management

- **Join room**: When user joins conversation, Redis syncs room membership
- **Leave room**: When user leaves, Redis removes from room across all instances
- **Room events**: All room events are synchronized via Redis

### Connection Management

- **User online**: Status updates are broadcast to all instances
- **User offline**: Disconnection events are synchronized
- **Load balancing**: New connections are distributed across instances

## Monitoring

### Redis Monitoring

```bash
# Connect to Redis CLI
redis-cli

# Monitor Redis commands
MONITOR

# Check Redis info
INFO

# Check connected clients
CLIENT LIST
```

### PM2 Monitoring

```bash
# View process status
pm2 status

# View detailed logs
pm2 logs --lines 100

# Monitor resource usage
pm2 monit
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check if Redis server is running
   - Verify host/port configuration
   - Check firewall settings

2. **Messages Not Syncing**
   - Verify Redis adapter is initialized
   - Check Redis logs for errors
   - Ensure all instances are connected to same Redis

3. **High Memory Usage**
   - Monitor Redis memory usage
   - Check for memory leaks in application
   - Consider Redis memory optimization

### Debug Mode

Enable debug logging:
```env
DEBUG=socket.io:*
```

### Health Checks

The application includes health checks for Redis:
- Connection status
- Pub/Sub functionality
- Message delivery

## Performance Considerations

### Redis Configuration

For production, consider:
- Redis persistence settings
- Memory optimization
- Connection pooling
- Clustering for high availability

### Scaling

- **Horizontal scaling**: Add more backend instances
- **Vertical scaling**: Increase instance resources
- **Redis clustering**: For very high load scenarios

## Security

- Use Redis AUTH for password protection
- Configure Redis to bind to specific interfaces
- Use TLS for Redis connections in production
- Implement proper firewall rules

## Production Deployment

1. **Redis Server**: Use managed Redis service (AWS ElastiCache, Redis Cloud)
2. **Load Balancer**: Configure sticky sessions or use Redis for session management
3. **Monitoring**: Set up Redis and application monitoring
4. **Backup**: Configure Redis persistence and backups
5. **Security**: Enable Redis AUTH and TLS

## Testing

Test multi-instance functionality:

1. Start multiple instances with PM2
2. Connect clients to different instances
3. Send messages and verify synchronization
4. Test room joining/leaving
5. Test user online/offline status

```bash
# Test script
npm run test:redis
```

This Redis integration ensures your chat application can scale horizontally while maintaining real-time message synchronization across all instances.
