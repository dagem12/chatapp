# Chat App Backend

A chat application backend built with NestJS, PostgreSQL, Redis, and WebSockets. This application provides real-time messaging capabilities with user authentication, conversation management, and message persistence.

## Features

- **Real-time Messaging**: WebSocket-based real-time communication
- **User Authentication**: JWT-based authentication with secure password hashing
- **Conversation Management**: Create and manage conversations with multiple participants
- **Message Operations**: Send, edit, delete, and mark messages as read
- **User Search**: Search for users by username or email
- **Online Status**: Track user online/offline status
- **Database Persistence**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session management and caching
- **Health Monitoring**: Health check endpoints for monitoring
- **Logging**: Comprehensive logging with Winston
- **Docker Support**: Full Docker containerization
- **PM2 Cluster**: Production-ready PM2 cluster configuration

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (NestJS)      │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Redis Cache   │
                       └─────────────────┘
```

## Project Structure

```
backend/
├── prisma/                         # Database configuration
│   ├── migrations/                 # Database migrations
│   │   └── 20251003161729_migration1/
│   │       └── migration.sql
│   ├── schema.prisma              # Database schema
│   └── seed.ts                    # Database seeding
├── scripts/                        # Utility scripts
│   ├── init-db.sql                # Database initialization
│   ├── pm2-management.js          # PM2 management script
│   ├── setup-db.js                # Database setup script
│   ├── setup-docker.bat           # Windows Docker setup
│   ├── setup-docker.sh            # Linux/macOS Docker setup
│   └── setup-redis.js             # Redis setup script
├── src/                           # Source code
│   ├── auth/                      # Authentication module
│   │   ├── dto/                   # Data Transfer Objects
│   │   ├── guards/                # Authentication guards
│   │   ├── interfaces/            # TypeScript interfaces
│   │   ├── strategies/            # Passport strategies
│   │   ├── auth.controller.ts     # Auth endpoints
│   │   ├── auth.module.ts         # Auth module
│   │   └── auth.service.ts        # Auth business logic
│   ├── common/                    # Shared utilities
│   │   └── pipes/                 # Custom validation pipes
│   ├── config/                    # Configuration modules
│   │   ├── redis.config.ts        # Redis configuration
│   │   └── redis.module.ts        # Redis module
│   ├── health/                    # Health check module
│   │   ├── health.controller.ts   # Health endpoints
│   │   └── health.module.ts       # Health module
│   ├── logger/                    # Logging system
│   │   ├── filters/               # Exception filters
│   │   ├── interceptors/          # Logging interceptors
│   │   ├── middleware/            # Logging middleware
│   │   ├── logger.module.ts       # Logger module
│   │   ├── logger.service.ts      # Logger service
│   │   └── README.md              # Logger documentation
│   ├── messages/                  # Messaging module
│   │   ├── dto/                   # Message DTOs
│   │   ├── interfaces/            # Message interfaces
│   │   ├── messages.controller.ts # Message endpoints
│   │   ├── messages.gateway.ts    # WebSocket gateway
│   │   ├── messages.module.ts     # Messages module
│   │   ├── messages.service.ts    # Message business logic
│   │   └── README.md              # Messages documentation
│   ├── prisma/                    # Database module
│   │   ├── prisma.module.ts       # Prisma module
│   │   └── prisma.service.ts      # Database service
│   ├── users/                     # Users module
│   │   ├── dto/                   # User DTOs
│   │   ├── users.controller.ts    # User endpoints
│   │   ├── users.module.ts        # Users module
│   │   └── users.service.ts       # User business logic
│   ├── app.controller.ts          # Main app controller
│   ├── app.module.ts              # Root module
│   ├── app.service.ts             # Main app service
│   └── main.ts                    # Application entry point
├── test/                          # Test files
│   ├── app.e2e-spec.ts           # End-to-end tests
│   ├── jest-e2e.json             # E2E test configuration
│   └── redis-integration.e2e-spec.ts # Redis integration tests
├── .env.example                   # Environment variables template
├── .gitignore                     # Git exclusions
├── docker-compose.yml             # Docker orchestration
├── Dockerfile                     # Docker build configuration
├── ecosystem.config.js            # PM2 configuration
├── package.json                   # Dependencies and scripts
├── README.md                      # This documentation
└── tsconfig.json                  # TypeScript configuration
```

### Key Directories

- **`src/`** - Main source code organized by feature modules
- **`docs/`** - Comprehensive documentation for setup and deployment
- **`scripts/`** - Utility scripts for database, Docker, and PM2 management
- **`prisma/`** - Database schema, migrations, and seeding
- **`test/`** - Test files for unit, integration, and e2e testing

## Prerequisites

- Node.js 20+ 
- Docker & Docker Compose
- PostgreSQL 16+ (if running locally)
- Redis 7+ (if running locally)

## Quick Start with Docker

### 1. Clone and Setup

```bash
git clone <repository-url>
cd backend
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

**Important**: Update the following values in your `.env` file:
- `JWT_SECRET`: Use a secure random string
- `POSTGRES_PASSWORD`: Set a strong password
- `REDIS_PASSWORD`: Set a strong password

### 3. Start Services

```bash
# Start all services (PostgreSQL, Redis, Backend)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Check service status
docker-compose ps
```

### 4. Initialize Database

The database will be automatically migrated and seeded when you start the services. If you need to run migrations manually:

```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed the database
docker-compose exec backend npm run db:seed
```

### 5. Access the Application

- **API**: http://ip:port
- **Health Check**: http://ip:port/health
- **API Documentation**: http://ip:port/api (Swagger UI)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

```bash
# Start PostgreSQL and Redis (using Docker)
docker-compose up -d postgres redis

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database
npm run db:seed
```

### 3. Start Development Server

```bash
# Start in development mode
npm run start:dev

# Or start with debugging
npm run start:debug
```

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Backend API | 3000 | Main application API |
| PostgreSQL | 5433 | Database (non-standard port) |
| Redis | 6380 | Cache (non-standard port) |

*Note: Non-standard ports are used to avoid conflicts with existing services.*

## API Endpoints

### Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | User login | No |
| GET | `/auth/me` | Get current user profile | Yes |
| PUT | `/auth/profile` | Update user profile | Yes |
| PUT | `/auth/change-password` | Change password | Yes |
| PUT | `/auth/online-status` | Update online status | Yes |

### Users (`/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/search?q={query}` | Search users | Yes |

### Messages (`/messages`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/messages` | Create new message | Yes |
| GET | `/messages/conversation/{id}` | Get conversation messages | Yes |
| PUT | `/messages/{id}` | Update message | Yes |
| DELETE | `/messages/{id}` | Delete message | Yes |
| PUT | `/messages/mark-as-read` | Mark messages as read | Yes |

### Conversations (`/conversations`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/conversations` | Create new conversation | Yes |
| GET | `/conversations` | Get user conversations | Yes |
| GET | `/conversations/{id}` | Get conversation details | Yes |

### Health (`/health`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Application health check | No |
| GET | `/health/db` | Database health check | No |

## CORS Configuration

The application supports multiple CORS origins for both HTTP and WebSocket connections. Configure allowed origins using the `CORS_ORIGIN` environment variable:

```bash
# Single origin
CORS_ORIGIN=http://localhost:3000

# Multiple origins (comma-separated)
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,https://yourdomain.com

# Allow all origins (development only)
CORS_ORIGIN=*
```

**Important Notes:**
- Origins are separated by commas without spaces
- Both HTTP API and WebSocket connections use the same CORS configuration
- In production, always specify exact origins instead of using wildcards
- Default fallback is `http://localhost:5173` if `CORS_ORIGIN` is not set

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Example Authentication Flow

```bash
# 1. Register a new user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "securepassword"
  }'

# 2. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'

# 3. Use the token for authenticated requests
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Database Schema

### Users
- `id`: Unique identifier (CUID)
- `email`: User email (unique)
- `username`: Username (unique)
- `password`: Hashed password
- `avatar`: Optional avatar URL
- `isOnline`: Online status
- `lastSeen`: Last seen timestamp

### Conversations
- `id`: Unique identifier (CUID)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Messages
- `id`: Unique identifier (CUID)
- `content`: Message content
- `messageType`: Type of message (text, image, etc.)
- `isRead`: Read status
- `isEdited`: Edit status
- `isDeleted`: Soft delete status
- `senderId`: Reference to sender user
- `conversationId`: Reference to conversation

## Production Deployment with PM2

### Load Balancer Configuration

When deploying behind a load balancer (like Nginx), it's crucial to configure sticky sessions for WebSocket connections and session management:

#### Nginx Configuration Example

```nginx
upstream backend {
    # Use IP hash for sticky sessions
    ip_hash;
    
    server server1:port;
    server server2:port;
    server server3:port;
}

server {
    listen 80;
    server_name yourdomain.com;

    # WebSocket proxy configuration
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Sticky session configuration
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API proxy configuration
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```


#### Why Sticky Sessions Are Important

- **WebSocket Connections**: WebSocket connections must maintain connection to the same backend instance
- **Session Management**: User sessions and authentication tokens are tied to specific instances
- **Real-time Features**: Chat messages and notifications require consistent routing
- **Redis Integration**: While Redis handles cross-instance communication, initial connections need consistency

### 1. Build the Application

```bash
npm run build
```

### 2. Start with PM2

```bash
# Start PM2 cluster
npm run pm2:start

# Check status
npm run pm2:status

# View logs
npm run pm2:logs

# Monitor
npm run pm2:monitor
```

### 3. PM2 Management Commands

```bash
# Stop all instances
npm run pm2:stop

# Restart all instances
npm run pm2:restart

# Reload (zero-downtime)
npm run pm2:reload

# Scale instances
npm run pm2:scale 4

# Save PM2 configuration
npm run pm2:save

# Setup PM2 startup
npm run pm2:startup
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `production` | No |
| `PORT` | Application port | `3000` | No |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `POSTGRES_DB` | Database name | `chat_app` | No |
| `POSTGRES_USER` | Database user | `postgres` | No |
| `POSTGRES_PASSWORD` | Database password | - | Yes |
| `POSTGRES_PORT` | Database port | `5433` | No |
| `REDIS_HOST` | Redis host | `localhost` | No |
| `REDIS_PORT` | Redis port | `6380` | No |
| `REDIS_PASSWORD` | Redis password | - | Yes |
| `JWT_SECRET` | JWT secret key | - | Yes |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` | No |
| `CORS_ORIGIN` | CORS origins (comma-separated) | `http://localhost:3000,http://localhost:5173` | No |

## Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

## Monitoring & Logging

### Health Checks

- **Application Health**: `GET /health`
- **Database Health**: `GET /health/db`

### Logs

Logs are stored in the `logs/` directory:
- `combined.log`: All logs
- `error.log`: Error logs only
- `out-*.log`: PM2 output logs
- `err-*.log`: PM2 error logs

### Log Levels

- `error`: Error messages
- `warn`: Warning messages
- `info`: Informational messages
- `debug`: Debug messages (development only)

## Development Scripts

```bash
# Database operations
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:deploy      # Deploy migrations (production)
npm run db:seed        # Seed database
npm run db:reset       # Reset database
npm run db:studio      # Open Prisma Studio

# Redis operations
npm run redis:setup    # Setup Redis
npm run redis:test     # Test Redis connection

# PM2 operations
npm run pm2:start      # Start PM2 cluster
npm run pm2:stop       # Stop PM2 cluster
npm run pm2:restart    # Restart PM2 cluster
npm run pm2:reload     # Reload PM2 cluster
npm run pm2:status     # Check PM2 status
npm run pm2:logs       # View PM2 logs
npm run pm2:monitor    # Open PM2 monitor
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Check database logs
   docker-compose logs postgres
   ```

2. **Redis Connection Failed**
   ```bash
   # Check if Redis is running
   docker-compose ps redis
   
   # Test Redis connection
   docker-compose exec redis redis-cli ping
   ```

3. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :3000
   
   # Kill the process or change the port in .env
   ```

4. **JWT Token Issues**
   - Ensure `JWT_SECRET` is set in `.env`
   - Check token expiration
   - Verify token format in Authorization header

### Logs and Debugging

```bash
# View application logs
docker-compose logs -f backend

# View specific service logs
docker-compose logs postgres
docker-compose logs redis

# Access container shell
docker-compose exec backend sh
```

