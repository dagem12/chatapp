# Multi-stage build for React frontend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files from parent directory (frontend root)
COPY ../package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code from parent directory
COPY ../src ./src
COPY ../public ./public
COPY ../index.html ./
COPY ../vite.config.ts ./
COPY ../tsconfig*.json ./

# Copy environment variables for build
COPY production/.env ./

# Build the application with environment variables
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ARG VITE_APP_NAME
ARG VITE_APP_VERSION
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION

RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration from production directory
COPY production/nginx.conf /etc/nginx/nginx.conf

# Copy .env file for runtime configuration (optional)
COPY production/.env /app/.env

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
