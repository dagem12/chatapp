# PM2 Cluster Configuration for Chat Application

This document describes the PM2 cluster configuration for the chat application with Redis support for multi-instance scaling.

## Overview

The application is configured to run in cluster mode with PM2, enabling:
- **Load Balancing**: Multiple instances handle incoming requests
- **High Availability**: Automatic restart on failure
- **Redis Clustering**: Shared state across instances via Redis
- **Socket.IO Scaling**: Real-time communication across instances

## Configuration Files

### 1. Ecosystem Configuration (`ecosystem.config.js`)

The main PM2 configuration file that defines:
- **Cluster Mode**: 2 instances running in cluster mode
- **Environment Variables**: Redis and database configuration
- **Process Management**: Restart policies, memory limits, logging
- **Health Monitoring**: Graceful shutdown and health checks

### 2. PM2 Management Script (`scripts/pm2-management.js`)

A comprehensive management script providing:
- **Process Control**: Start, stop, restart, reload operations
- **Monitoring**: Status, logs, real-time monitoring
- **Scaling**: Dynamic instance scaling
- **Maintenance**: Configuration saving, startup setup

## Environment Configuration

### Development Environment
```javascript
env: {
  NODE_ENV: 'development',
  PORT: 3000,
  REDIS_HOST: 'localhost',
  REDIS_PORT: 6379,
  REDIS_PASSWORD: '',
  REDIS_DB: 0,
  // Redis connection settings for clustering
  REDIS_RETRY_DELAY_ON_FAILOVER: 100,
  REDIS_MAX_RETRIES_PER_REQUEST: 3,
  REDIS_LAZY_CONNECT: false,
  REDIS_KEEP_ALIVE: 30000,
  REDIS_CONNECT_TIMEOUT: 10000,
  REDIS_COMMAND_TIMEOUT: 5000,
  // Database connection pool settings
  DATABASE_URL: process.env.DATABASE_URL,
  PRISMA_CONNECTION_LIMIT: 10,
  // Socket.IO Redis adapter settings
  SOCKET_IO_REDIS_ADAPTER: true,
  // PM2 instance identification
  PM2_INSTANCE_ID: process.env.pm_id || 0,
}
```

### Production Environment
```javascript
env_production: {
  NODE_ENV: 'production',
  PORT: 3000,
  // Redis configuration for production
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_DB: process.env.REDIS_DB || 0,
  // Enhanced connection settings for production
  REDIS_RETRY_DELAY_ON_FAILOVER: 100,
  REDIS_MAX_RETRIES_PER_REQUEST: 3,
  REDIS_LAZY_CONNECT: false,
  REDIS_KEEP_ALIVE: 30000,
  REDIS_CONNECT_TIMEOUT: 10000,
  REDIS_COMMAND_TIMEOUT: 5000,
  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL,
  PRISMA_CONNECTION_LIMIT: 15,
  // Socket.IO Redis adapter settings
  SOCKET_IO_REDIS_ADAPTER: true,
  // PM2 instance identification
  PM2_INSTANCE_ID: process.env.pm_id || 0,
}
```

## PM2 Management Commands

### Basic Operations
```bash
# Start the application
npm run pm2:start

# Stop the application
npm run pm2:stop

# Restart the application
npm run pm2:restart

# Reload (zero-downtime restart)
npm run pm2:reload

# Delete from PM2
npm run pm2:delete
```

### Monitoring and Logs
```bash
# Show application status
npm run pm2:status

# Show logs (last 50 lines)
npm run pm2:logs

# Show logs (custom number of lines)
npm run pm2:logs 100

# Start real-time monitor
npm run pm2:monitor

# Show cluster information
npm run pm2:info
```

### Scaling and Management
```bash
# Scale to 4 instances
npm run pm2:scale 4

# Check Redis connection
npm run pm2:redis

# Save PM2 configuration
npm run pm2:save

# Setup auto-startup
npm run pm2:startup

# Reset application (delete and start fresh)
npm run pm2:reset
```

### Direct PM2 Management Script
```bash
# Using the management script directly
node scripts/pm2-management.js start
node scripts/pm2-management.js scale 4
node scripts/pm2-management.js logs 100
node scripts/pm2-management.js monitor
node scripts/pm2-management.js help
```

## Cluster Architecture

### Instance Configuration
- **Instances**: 2 (configurable)
- **Mode**: Cluster mode for load balancing
- **Memory Limit**: 1GB per instance
- **Restart Policy**: Auto-restart on failure
- **Graceful Shutdown**: 10-second timeout

### Redis Integration
- **Pub/Sub**: Cross-instance communication
- **Socket.IO Adapter**: Real-time scaling
- **Caching**: Shared cache across instances
- **Session Management**: Distributed sessions

### Database Connection Pooling
- **Development**: 10 connections per instance
- **Production**: 15 connections per instance
- **Total Pool**: Automatically managed by Prisma

## Process Management Features

### Health Monitoring
- **Health Check Grace Period**: 3 seconds
- **Min Uptime**: 10 seconds before restart
- **Max Restarts**: 5 restarts per hour
- **Restart Delay**: 4 seconds between restarts

### Logging Configuration
- **Error Logs**: `./logs/err.log`
- **Output Logs**: `./logs/out.log`
- **Combined Logs**: `./logs/combined.log`
- **Log Format**: Timestamped logs
- **Log Merging**: Enabled for cluster mode

### Memory Management
- **Memory Limit**: 1GB per instance
- **Auto Restart**: On memory limit exceeded
- **Node.js Args**: `--max-old-space-size=1024`

## Deployment Workflow

### 1. Development Setup
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start in development mode
npm run pm2:start

# Monitor the application
npm run pm2:monitor
```

### 2. Production Deployment
```bash
# Set production environment variables
export NODE_ENV=production
export REDIS_HOST=your-redis-host
export REDIS_PASSWORD=your-redis-password
export DATABASE_URL=your-database-url

# Build the application
npm run build

# Start in production mode
NODE_ENV=production npm run pm2:start

# Save PM2 configuration
npm run pm2:save

# Setup auto-startup
npm run pm2:startup
```

### 3. Scaling Operations
```bash
# Scale up for high load
npm run pm2:scale 4

# Scale down for maintenance
npm run pm2:scale 2

# Monitor scaling
npm run pm2:status
```

## Troubleshooting

### Common Issues

#### 1. Redis Connection Issues
```bash
# Check Redis connection
npm run pm2:redis

# Check Redis logs
npm run pm2:logs | grep -i redis
```

#### 2. Memory Issues
```bash
# Check memory usage
npm run pm2:status

# Restart if memory limit exceeded
npm run pm2:restart
```

#### 3. Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :3000

# Kill conflicting processes
sudo kill -9 <PID>
```

#### 4. Database Connection Issues
```bash
# Check database logs
npm run pm2:logs | grep -i database

# Restart database connections
npm run pm2:reload
```

### Log Analysis
```bash
# View error logs
tail -f logs/err.log

# View output logs
tail -f logs/out.log

# View combined logs
tail -f logs/combined.log

# Search for specific errors
grep -i "error" logs/combined.log
```

## Performance Optimization

### Redis Optimization
- **Connection Pooling**: Optimized connection settings
- **Keep-Alive**: 30-second keep-alive for connections
- **Timeout Settings**: 10-second connect, 5-second command timeout
- **Retry Logic**: 3 retries with 100ms delay

### Database Optimization
- **Connection Limits**: Tuned for cluster mode
- **Connection Pooling**: Managed by Prisma
- **Query Optimization**: Indexed queries for performance

### Node.js Optimization
- **Memory Management**: 1GB limit per instance
- **Garbage Collection**: Optimized for chat workloads
- **Event Loop**: Non-blocking I/O operations

## Security Considerations

### Environment Variables
- **Sensitive Data**: Stored in environment variables
- **Redis Password**: Required for production
- **Database URL**: Secure connection strings
- **JWT Secrets**: Secure token generation

### Network Security
- **Redis Access**: Restricted to application instances
- **Database Access**: Connection pooling with limits
- **Port Binding**: Localhost binding for development

## Monitoring and Alerting

### PM2 Monitoring
- **Real-time Monitoring**: `npm run pm2:monitor`
- **Status Checks**: `npm run pm2:status`
- **Log Monitoring**: `npm run pm2:logs`

### Health Checks
- **Application Health**: Built-in health endpoints
- **Redis Health**: Connection monitoring
- **Database Health**: Connection pool monitoring

### Alerting Setup
- **Memory Alerts**: Configure memory thresholds
- **CPU Alerts**: Monitor CPU usage
- **Error Alerts**: Monitor error rates
- **Uptime Alerts**: Monitor application availability

## Best Practices

### Development
1. **Use PM2 Management Script**: Leverage the management script for consistency
2. **Monitor Logs**: Regularly check logs for issues
3. **Test Scaling**: Test scaling operations in development
4. **Redis Testing**: Verify Redis connectivity before deployment

### Production
1. **Environment Variables**: Use secure environment variables
2. **Auto-startup**: Configure PM2 startup for server reboots
3. **Log Rotation**: Implement log rotation for long-running instances
4. **Monitoring**: Set up comprehensive monitoring and alerting
5. **Backup**: Regular backup of PM2 configuration and logs

### Maintenance
1. **Regular Updates**: Keep PM2 and dependencies updated
2. **Log Cleanup**: Regular cleanup of old log files
3. **Performance Monitoring**: Monitor performance metrics
4. **Security Updates**: Regular security updates and patches

## Conclusion

This PM2 cluster configuration provides a robust, scalable foundation for the chat application with Redis support. The configuration enables high availability, load balancing, and seamless scaling while maintaining data consistency across instances through Redis.

For additional support or questions, refer to the PM2 documentation or contact the development team.
