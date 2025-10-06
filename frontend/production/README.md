# Frontend Production Deployment

This folder contains all the production deployment configurations for the Chat App frontend.

## Files

- **Dockerfile** - Multi-stage Docker build for production with Nginx
- **docker-compose.yml** - Docker Compose configuration for production deployment
- **nginx.conf** - Nginx configuration for production web server
- **env.example** - Environment variables template

## Prerequisites

- Docker and Docker Compose installed
- Backend services running (see `backend/README.md`)
- Backend network `backend_chat-network` must exist

## Quick Start

1. **Navigate to production folder:**
   ```bash
   cd frontend/production
   ```

2. **Create environment file:**
   ```bash
   cp env.example .env
   ```

3. **Edit `.env` with your values:**
   ```bash
   # API Configuration - Use external IP for browser access
   VITE_API_URL=http://YOUR_SERVER_IP:3000
   VITE_SOCKET_URL=http://YOUR_SERVER_IP:3000
   
   # Backend Configuration (for nginx proxy)
   BACKEND_HOST=chat-app-backend
   BACKEND_PORT=3000
   
   # Port Configuration
   FRONTEND_PORT=3333
   ```

4. **Build and run:**
   ```bash
   docker-compose build --no-cache frontend
   docker-compose up -d frontend
   ```

## Configuration Details

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | API base URL for browser requests | `http://196.189.149.214:3000` | Yes |
| `VITE_SOCKET_URL` | WebSocket URL for browser requests | `http://196.189.149.214:3000` | Yes |
| `BACKEND_HOST` | Backend container name for nginx proxy | `chat-app-backend` | Yes |
| `BACKEND_PORT` | Backend container port | `3000` | Yes |
| `FRONTEND_PORT` | External port for frontend | `3333` | No |

### Network Configuration

- **External Network**: Frontend connects to `backend_chat-network` (created by backend)
- **Internal Communication**: Nginx proxies API requests to `chat-app-backend:3000`
- **Browser Access**: Frontend accessible on `http://YOUR_SERVER_IP:3333`

### Build Process

- **Build Context**: Parent directory (`..`) to access source code
- **Environment Variables**: Passed during build time via Docker build args
- **Multi-stage Build**: Node.js build stage + Nginx production stage

## Troubleshooting

### Common Issues

1. **"host not found in upstream" error:**
   - Ensure backend is running: `docker ps | grep backend`
   - Check network exists: `docker network ls | grep chat-network`

2. **Frontend still uses localhost:**
   - Rebuild with no cache: `docker-compose build --no-cache frontend`
   - Verify `.env` file exists and has correct values

3. **Port conflicts:**
   - Change `FRONTEND_PORT` in `.env` if port 3333 is in use

### Health Checks

- **Frontend Health**: `curl http://localhost:3333`
- **Container Logs**: `docker logs chat-app-frontend`
- **Network Connectivity**: `docker exec chat-app-frontend nslookup chat-app-backend`

## Development vs Production

- **Development**: Use `npm run dev` from main frontend directory
- **Production**: Use Docker Compose from this production folder
- **Environment Variables**: Development uses `.env` in frontend root, production uses `.env` in this folder
