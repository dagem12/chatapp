#!/bin/bash

echo "Starting database migration process..."

# Check if we're in a Docker environment
if [ -f /.dockerenv ]; then
    echo "Running inside Docker container"
    echo "Checking for existing migrations..."
    
    if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
        echo "Migrations found, applying existing migrations..."
        npx prisma migrate deploy
    else
        echo "No migrations found, creating initial migration..."
        npx prisma migrate dev --name init
    fi
else
    echo "Running on host system"
    echo "Using Docker Compose to run migrations..."
    
    # Check if migrations exist
    if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
        echo "Migrations found, applying existing migrations..."
        docker-compose run --rm migrate
    else
        echo "No migrations found, creating initial migration..."
        docker-compose run --rm backend npx prisma migrate dev --name init
    fi
fi

echo "Migration process completed!"
echo "You can now run seeding if needed: docker-compose run --rm seed"
