#!/bin/sh

# Replace environment variables in built files
# This allows runtime configuration of environment variables

# Default values
VITE_API_URL=${VITE_API_URL:-http://localhost:3001/api}
VITE_SOCKET_URL=${VITE_SOCKET_URL:-http://localhost:3001}
VITE_APP_NAME=${VITE_APP_NAME:-Chat App}
VITE_APP_VERSION=${VITE_APP_VERSION:-1.0.0}

# Find all JS files and replace placeholders
find /usr/share/nginx/html -name "*.js" -exec sed -i "s|VITE_API_URL_PLACEHOLDER|$VITE_API_URL|g" {} \;
find /usr/share/nginx/html -name "*.js" -exec sed -i "s|VITE_SOCKET_URL_PLACEHOLDER|$VITE_SOCKET_URL|g" {} \;
find /usr/share/nginx/html -name "*.js" -exec sed -i "s|VITE_APP_NAME_PLACEHOLDER|$VITE_APP_NAME|g" {} \;
find /usr/share/nginx/html -name "*.js" -exec sed -i "s|VITE_APP_VERSION_PLACEHOLDER|$VITE_APP_VERSION|g" {} \;

echo "Environment variables configured:"
echo "VITE_API_URL=$VITE_API_URL"
echo "VITE_SOCKET_URL=$VITE_SOCKET_URL"
echo "VITE_APP_NAME=$VITE_APP_NAME"
echo "VITE_APP_VERSION=$VITE_APP_VERSION"
