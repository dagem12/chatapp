module.exports = {
  apps: [
    {
      name: 'chat-app-backend',
      script: 'dist/src/main.js',
      instances: 2, // Run 2 instances for load balancing
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        // Redis configuration for multi-instance scaling
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
        // Increase connection pool for multiple instances
        PRISMA_CONNECTION_LIMIT: 10,
        // Socket.IO Redis adapter settings
        SOCKET_IO_REDIS_ADAPTER: true,
        // PM2 instance identification
        PM2_INSTANCE_ID: process.env.pm_id || 0,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Redis configuration for production
        REDIS_HOST: process.env.REDIS_HOST || 'localhost',
        REDIS_PORT: process.env.REDIS_PORT || 6379,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
        REDIS_DB: process.env.REDIS_DB || 0,
        // Redis connection settings for production clustering
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
      },
      // PM2 configuration for cluster mode
      watch: false,
      max_memory_restart: '1G',
      error_file: '/tmp/pm2-err.log',
      out_file: '/tmp/pm2-out.log',
      log_file: '/tmp/pm2-combined.log',
      time: true,
      // Graceful shutdown settings
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 15000,
      // Instance-specific settings for clustering
      instance_var: 'INSTANCE_ID',
      // Restart settings for stability
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 4000,
      // Advanced PM2 settings for Redis clustering
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Health monitoring
      health_check_grace_period: 3000,
      // Process management
      autorestart: true,
      // Cluster-specific optimizations
      node_args: '--max-old-space-size=1024',
      // Redis connection pooling
      increment_var: 'PORT',
    },
  ],
};
