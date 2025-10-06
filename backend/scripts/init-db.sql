-- Database initialization script for Chat App
-- This script runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist
-- (This is handled by POSTGRES_DB environment variable)

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create a user for the application (optional, using postgres user by default)
-- CREATE USER chat_app_user WITH PASSWORD 'secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE chat_app TO chat_app_user;

-- The actual tables will be created by Prisma migrations
