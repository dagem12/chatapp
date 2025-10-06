# Production Deployment

This folder contains all the production deployment configurations for the Chat App frontend.

## Files

- **Dockerfile** - Multi-stage Docker build for production with Nginx
- **docker-compose.yml** - Docker Compose configuration for production deployment
- **nginx.conf** - Nginx configuration for production web server
- **env.example** - Environment variables template


## Usage

### For Development
- Use `npm run dev` from the main frontend directory
- No need to use files in this production folder

### For Production Deployment

1. Navigate to this production folder: `cd frontend/production`
2. Copy the example file: `cp env.example .env` (creates `.env` in `frontend/production/`)
3. Edit `.env` with your production values
4. Make sure Docker Desktop is running
5. Build and run with Docker Compose: `docker-compose up -d`

### Build Context
- The Docker build context is set to the parent directory (`..`) to access the source code
- The Dockerfile is located in this production folder
- This allows the build to access both the source code and production configurations




### Default Values
If no .env file or environment variables are set, Docker Compose will use the default values defined in docker-compose.yml.

## Notes

- These files are separated from development code for better organization
- All production-specific configurations are contained in this folder
- Development uses the standard Vite dev server without Docker/Nginx
