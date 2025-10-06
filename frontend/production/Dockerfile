# Multi-stage build for React frontend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files from parent directory (frontend root)
COPY ../package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code from parent directory
COPY ../src ./src
COPY ../public ./public
COPY ../index.html ./
COPY ../vite.config.ts ./
COPY ../tsconfig*.json ./

# Build the application
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
