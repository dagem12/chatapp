#!/bin/bash

# Frontend Docker Setup Script
# This script helps set up the frontend with Docker Compose

set -e

echo "Frontend Docker Setup"
echo "========================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env.example file if it doesn't exist
if [ ! -f .env.example ]; then
    echo "Creating .env.example file..."
    cat > .env.example << 'EOF'
# Frontend Docker Compose Environment Configuration

# Port Configuration
FRONTEND_PORT=3000                    # Port where frontend container runs
NGINX_PORT=80                         # Port for nginx-proxy service
NGINX_SSL_PORT=443                    # Port for SSL/HTTPS (optional)

# Backend Configuration
BACKEND_HOST=host.docker.internal     # Backend server host (host.docker.internal for Docker)
BACKEND_PORT=3000                     # Backend server port

# Application Configuration (Vite Environment Variables)
VITE_API_URL=http://localhost:3000    # Backend API base URL (used by frontend)
VITE_SOCKET_URL=http://localhost:3000 # Socket.IO server URL (used by frontend)
VITE_APP_NAME=Chat App                # Application name displayed in UI
VITE_APP_VERSION=1.0.0                # Application version

# Production Configuration (uncomment and update for production)
# BACKEND_HOST=192.168.1.100          # Your server IP address
# BACKEND_PORT=3000                   # Your backend port
# VITE_API_URL=http://yourdomain.com:3000  # Production API URL
# VITE_SOCKET_URL=http://yourdomain.com:3000 # Production Socket URL
# VITE_APP_NAME=Your Chat App         # Production app name
# VITE_APP_VERSION=1.0.0              # Production version

# For backend load balancing, edit nginx.conf and uncomment multiple server lines
EOF
    echo ".env.example file created."
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo ".env file created. Please edit it with your configuration."
else
    echo ".env file already exists."
fi

# Check for existing Nginx installation
echo "Checking for existing Nginx installation..."
if command -v nginx &> /dev/null; then
    echo "Nginx detected on host system"
    echo "The container will run in proxy mode"
    echo "   - Frontend will be available at http://localhost:3000"
    echo "   - Configure your host Nginx to proxy to this port"
    echo ""
    echo "Example host Nginx configuration:"
    echo "location / {"
    echo "    proxy_pass http://localhost:3000;"
    echo "    proxy_set_header Host \$host;"
    echo "    proxy_set_header X-Real-IP \$remote_addr;"
    echo "}"
else
    echo "No Nginx detected on host system"
    echo "The container will run in standalone mode"
    echo "   - Frontend will be available at http://localhost:80"
    echo "   - Built-in Nginx will serve the application"
fi

echo ""
echo "Starting Docker containers..."

# Start the containers
docker-compose up -d

echo ""
echo "Frontend Docker setup completed!"
echo ""
echo "Container Status:"
docker-compose ps

echo ""
echo "Next steps:"
if command -v nginx &> /dev/null; then
    echo "1. Configure your host Nginx to proxy to http://localhost:3000"
    echo "2. Access your application through your Nginx configuration"
else
    echo "1. Access your application at http://localhost:80"
    echo "2. Or use the nginx-proxy service: docker-compose --profile proxy up -d"
fi

echo ""
echo "Useful commands:"
echo "  View logs:     docker-compose logs -f"
echo "  Stop:          docker-compose down"
echo "  Restart:       docker-compose restart"
echo "  Update:        docker-compose pull && docker-compose up -d"
