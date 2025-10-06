#!/bin/bash

# Chat App Backend Docker Setup Script
# This script helps set up the Docker environment for the Chat App Backend

set -e

echo "Chat App Backend Docker Setup"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if .env file exists
check_env_file() {
    print_status "Checking environment configuration..."
    
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success ".env file created from .env.example"
            print_warning "Please edit .env file with your configuration before continuing"
            echo ""
            echo "Required changes:"
            echo "1. Set JWT_SECRET to a secure random string"
            echo "2. Set POSTGRES_PASSWORD to a strong password"
            echo "3. Set REDIS_PASSWORD to a strong password"
            echo ""
            read -p "Press Enter to continue after editing .env file..."
        else
            print_error ".env.example file not found. Please create .env file manually."
            exit 1
        fi
    else
        print_success ".env file found"
    fi
}

# Generate secure passwords
generate_passwords() {
    print_status "Generating secure passwords..."
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    
    # Generate PostgreSQL password
    POSTGRES_PASSWORD=$(openssl rand -base64 16 2>/dev/null || head -c 16 /dev/urandom | base64)
    
    # Generate Redis password
    REDIS_PASSWORD=$(openssl rand -base64 16 2>/dev/null || head -c 16 /dev/urandom | base64)
    
    print_success "Generated secure passwords"
}

# Update .env file with generated passwords
update_env_file() {
    print_status "Updating .env file with secure passwords..."
    
    # Backup original .env
    cp .env .env.backup
    
    # Update passwords in .env file
    sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i.bak "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env
    sed -i.bak "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
    
    # Clean up backup files
    rm -f .env.bak
    
    print_success "Updated .env file with secure passwords"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    
    print_success "Created directories: logs/, uploads/"
}

# Start Docker services
start_services() {
    print_status "Starting Docker services..."
    
    # Pull latest images
    docker-compose pull
    
    # Start services
    docker-compose up -d
    
    print_success "Docker services started"
}

# Wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to be healthy..."
    
    # Wait for PostgreSQL
    print_status "Waiting for PostgreSQL..."
    timeout 60 bash -c 'until docker-compose exec -T postgres pg_isready -U postgres; do sleep 2; done'
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    timeout 60 bash -c 'until docker-compose exec -T redis redis-cli ping; do sleep 2; done'
    
    # Wait for Backend
    print_status "Waiting for Backend..."
    timeout 120 bash -c 'until curl -f http://localhost:3002/health > /dev/null 2>&1; do sleep 5; done'
    
    print_success "All services are healthy"
}

# Run database migrations and seeding
setup_database() {
    print_status "Setting up database..."
    
    # Wait a bit more for the backend to be fully ready
    sleep 10
    
    # Run migrations
    print_status "Running database migrations..."
    docker-compose exec -T backend npx prisma migrate deploy
    
    # Seed database
    print_status "Seeding database..."
    docker-compose exec -T backend npm run db:seed
    
    print_success "Database setup completed"
}

# Display service information
display_info() {
    echo ""
    echo "Setup completed successfully!"
    echo "================================"
    echo ""
    echo "Services:"
    echo "  • Backend API: http://localhost:3002"
    echo "  • Health Check: http://localhost:3002/health"
    echo "  • API Docs: http://localhost:3002/api"
    echo "  • PostgreSQL: localhost:5433"
    echo "  • Redis: localhost:6380"
    echo ""
    echo "Useful commands:"
    echo "  • View logs: docker-compose logs -f"
    echo "  • Stop services: docker-compose down"
    echo "  • Restart services: docker-compose restart"
    echo "  • Check status: docker-compose ps"
    echo ""
    echo "Database management:"
    echo "  • Prisma Studio: docker-compose exec backend npx prisma studio"
    echo "  • Run migrations: docker-compose exec backend npx prisma migrate deploy"
    echo "  • Seed database: docker-compose exec backend npm run db:seed"
    echo ""
}

# Main setup function
main() {
    echo "Starting Docker setup for Chat App Backend..."
    echo ""
    
    check_docker
    check_env_file
    
    # Ask if user wants to generate secure passwords
    echo ""
    read -p "Do you want to generate secure passwords automatically? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        generate_passwords
        update_env_file
    else
        print_warning "Please ensure you have set secure passwords in .env file"
    fi
    
    create_directories
    start_services
    wait_for_services
    setup_database
    display_info
}

# Handle script interruption
trap 'print_error "Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"
