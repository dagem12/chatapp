# Chat App

A real-time chat application built with React, TypeScript, NestJS, PostgreSQL, and Redis. Features real-time messaging, user authentication, responsive design, and scalable architecture.

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/dagem12/chatapp)
[![TypeScript](https://img.shields.io/badge/TypeScript-91.2%25-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-Framework-red)](https://nestjs.com/)

## Overview

This is a full-stack chat application that provides real-time messaging capabilities with a modern, responsive user interface. The application is built using industry-standard technologies and follows best practices for scalability and maintainability.

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

## Features

- **Real-time messaging** with WebSocket support
- **User authentication** with JWT tokens
- **Responsive design** for desktop and mobile
- **Message history** with pagination
- **Online/offline status** indicators
- **Unread message counts** and notifications
- **User search** and conversation management
- **Typing indicators** for real-time feedback
- **Message status** tracking (sent, delivered, read)
- **Docker support** for easy deployment
- **PM2 cluster** configuration for production

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Material-UI (MUI)** for UI components
- **Socket.IO Client** for real-time communication
- **Axios** for HTTP requests
- **React Router** for navigation
- **Vite** for fast development and building

### Backend
- **NestJS** framework with TypeScript
- **PostgreSQL** database with Prisma ORM
- **Redis** for caching and session management
- **Socket.IO** for real-time WebSocket communication
- **JWT** for authentication
- **Winston** for logging
- **Docker** for containerization

## Documentation

### Frontend Documentation
For detailed frontend setup, development, and deployment instructions, see:
**[Frontend README](frontend/README.md)**

### Backend Documentation
For detailed backend setup, API documentation, and deployment instructions, see:
**[Backend README](backend/README.md)**

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+
- Redis 7+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dagem12/chatapp.git
   cd chatapp
   ```

2. **Start with Docker (Recommended)**
   ```bash
   # Start backend services first
   cd backend
   docker-compose up -d
   
   # Wait for backend to be ready, then start frontend
   cd ../frontend/production
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   ```

3. **Manual Setup**
   ```bash
   # Backend setup
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run db:migrate
   npm run start:dev
   
   # Frontend setup (in another terminal)
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

## Screenshots

### Authentication

#### Login Screen - Web
![Login Web](frontend/screenshots/Login_web.png)
*Clean and modern login interface with form validation*

#### Register Screen - Web
![Register Web](frontend/screenshots/Register_web.png)
*User registration with password confirmation and validation*

### Chat Interface

#### Chat Screen - Web
![Chat Web](frontend/screenshots/Chat_screen_web.png)
*Full desktop chat interface with sidebar and main chat window*

#### Chat Screen - Web (Alternative View)
![Chat Web 2](frontend/screenshots/Chat_screen2_web.png)
*Desktop chat interface showing conversation details*


### Conversation Management


#### Search for Messages
![Search Messages](frontend/screenshots/search_for_message.png)
*Search functionality to find specific messages in conversations*

### New Conversation

#### Start New Conversation - Web
![New Chat Web](frontend/screenshots/Start_New_Conversation_web.png)
*Create new conversation interface on desktop*

#### User Search - Web
![User Search Web](frontend/screenshots/Start_New_Conversation_Search_web.png)
*Search for users to start conversations on desktop*

### User Profile

#### Profile Settings - Web
![Profile Web](frontend/screenshots/profile_setting_web.png)
*User profile and settings interface*

## Project Structure

```
chatapp/
├── frontend/                 # React frontend application
│   ├── src/                 # Source code
│   ├── public/              # Static assets
│   ├── screenshots/         # Application screenshots
│   ├── production/          # Production Docker configuration
│   │   ├── docker-compose.yml
│   │   ├── Dockerfile
│   │   ├── nginx.conf
│   │   └── env.example
│   ├── package.json         # Frontend dependencies
│   └── README.md            # Frontend documentation
├── backend/                 # NestJS backend application
│   ├── src/                 # Source code
│   ├── prisma/              # Database schema and migrations
│   ├── scripts/             # Utility scripts
│   ├── logs/                # Application logs
│   ├── docker-compose.yml   # Backend Docker orchestration
│   ├── Dockerfile           # Backend container configuration
│   ├── package.json         # Backend dependencies
│   └── README.md            # Backend documentation
└── README.md               # This file
```



## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Conversations
- `GET /api/conversations` - Get user conversations
- `GET /api/conversations/:id` - Get specific conversation
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id/messages` - Get conversation messages
- `POST /api/conversations/:id/messages` - Send message

### Users
- `GET /api/users/search` - Search users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Health
- `GET /api/health` - Application health check
- `GET /api/health/db` - Database health check

## WebSocket Events

### Client to Server
- `join-conversation` - Join a conversation room
- `leave-conversation` - Leave a conversation room
- `send-message` - Send a new message
- `typing` - Send typing indicator
- `mark-as-read` - Mark messages as read

### Server to Client
- `new-message` - Receive new message
- `message-sent` - Message sent confirmation
- `message-read` - Message read confirmation
- `user-typing` - User typing indicator
- `user-online` - User came online
- `user-offline` - User went offline
- `conversation-updated` - Conversation was updated

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3002
DATABASE_URL=postgresql://user:password@localhost:5433/chat_app
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=redis123
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3002/api
VITE_SOCKET_URL=http://localhost:3002
VITE_APP_NAME=Chat App
VITE_APP_VERSION=1.0.0
```

## Deployment

### Production Deployment with Docker

The application is designed for production deployment using Docker Compose with separate configurations for frontend and backend.

#### 1. Backend Deployment

```bash
# Navigate to backend directory
cd backend

# Create environment file
cp .env.example .env
# Edit .env with your production values

# Start backend services (PostgreSQL, Redis, Backend)
docker-compose up -d

# Check status
docker-compose ps
```

**Backend Services:**
- **Backend API**: `http://YOUR_SERVER_IP:3000`
- **PostgreSQL**: Port 5433 (external), 5432 (internal)
- **Redis**: Port 6380 (external), 6379 (internal)
- **Network**: `backend_chat-network`

#### 2. Frontend Deployment

```bash
# Navigate to frontend production directory
cd frontend/production

# Create environment file
cp env.example .env
# Edit .env with your production values

# Build and start frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

**Frontend Configuration:**
- **Frontend**: `http://YOUR_SERVER_IP:3333`
- **Network**: Connects to `backend_chat-network`
- **Proxy**: Nginx proxies API requests to backend
- **Container**: `chat-app-frontend`

#### 3. Environment Variables

**Backend (.env):**
```env
NODE_ENV=production
PORT=3002
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/chat_app
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis123
JWT_SECRET=your-secure-jwt-secret
CORS_ORIGIN=http://YOUR_SERVER_IP:3333
POSTGRES_PASSWORD=postgres123
```

**Frontend (.env):**
```env
VITE_API_URL=http://YOUR_SERVER_IP:3000
VITE_SOCKET_URL=http://YOUR_SERVER_IP:3000
VITE_APP_NAME=Chat App
VITE_APP_VERSION=1.0.0
BACKEND_HOST=chat-app-backend
BACKEND_PORT=3000
FRONTEND_PORT=3333
```

#### 4. Health Checks

```bash
# Backend health
curl http://YOUR_SERVER_IP:3000/health

# Frontend health
curl http://YOUR_SERVER_IP:3333

# Check all containers
docker ps

# Check container health status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

#### 5. Container Management

```bash
# Stop all services
cd backend && docker-compose down
cd ../frontend/production && docker-compose down

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Development Deployment

For development, use the standard npm commands:

```bash
# Backend
cd backend
npm run start:dev

# Frontend
cd frontend
npm run dev
```

## Development

### Available Scripts

#### Backend
```bash
npm run start:dev    # Start development server
npm run build        # Build for production
npm run start:prod   # Start production server
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database
```

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Troubleshooting

### Docker Issues

#### Backend Container Unhealthy
If the backend container shows as "unhealthy", check the following:

1. **Port Configuration**: Ensure the health check is using the correct port
   ```bash
   # Check container logs
   docker logs chat-app-backend
   
   # Check health status
   docker inspect chat-app-backend --format='{{json .State.Health}}'
   ```

2. **Database Connection**: Verify PostgreSQL is running and accessible
   ```bash
   # Check PostgreSQL container
   docker logs chat-app-postgres
   
   # Test database connection
   docker exec -it chat-app-postgres psql -U postgres -d chat_app -c "SELECT 1;"
   ```

3. **Redis Connection**: Verify Redis is running
   ```bash
   # Check Redis container
   docker logs chat-app-redis
   
   # Test Redis connection
   docker exec -it chat-app-redis redis-cli ping
   ```

#### Common Solutions

1. **Restart Services**:
   ```bash
   cd backend
   docker-compose down
   docker-compose up -d
   ```

2. **Rebuild Containers**:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. **Check Network Connectivity**:
   ```bash
   # Verify containers can communicate
   docker network ls
   docker network inspect backend_chat-network
   ```

### Environment Variables

Make sure all required environment variables are set correctly:

- **Backend**: Check `.env` file in `backend/` directory
- **Frontend**: Check `.env` file in `frontend/production/` directory
- **Database**: Ensure `DATABASE_URL` is correct
- **Redis**: Verify `REDIS_HOST` and `REDIS_PASSWORD`

### Port Conflicts

If you encounter port conflicts:

- **PostgreSQL**: Default external port is 5433
- **Redis**: Default external port is 6380  
- **Backend**: Default external port is 3000
- **Frontend**: Default external port is 3333

Change ports in your `.env` files if needed.

#