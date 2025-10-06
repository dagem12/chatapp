@echo off
setlocal enabledelayedexpansion

REM Chat App Backend Docker Setup Script for Windows
REM This script helps set up the Docker environment for the Chat App Backend

echo.
echo Chat App Backend Docker Setup
echo =================================
echo.

REM Check if Docker is installed
echo [INFO] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo [SUCCESS] Docker and Docker Compose are installed
echo.

REM Check if .env file exists
echo [INFO] Checking environment configuration...

if not exist .env (
    echo [WARNING] .env file not found. Creating from .env.example...
    
    if exist .env.example (
        copy .env.example .env >nul
        echo [SUCCESS] .env file created from .env.example
        echo.
        echo [WARNING] Please edit .env file with your configuration before continuing
        echo.
        echo Required changes:
        echo 1. Set JWT_SECRET to a secure random string
        echo 2. Set POSTGRES_PASSWORD to a strong password
        echo 3. Set REDIS_PASSWORD to a strong password
        echo.
        pause
    ) else (
        echo [ERROR] .env.example file not found. Please create .env file manually.
        pause
        exit /b 1
    )
) else (
    echo [SUCCESS] .env file found
)

echo.

REM Ask if user wants to generate secure passwords
set /p generate_passwords="Do you want to generate secure passwords automatically? (y/n): "

if /i "%generate_passwords%"=="y" (
    echo [INFO] Generating secure passwords...
    
    REM Generate JWT secret (32 characters)
    set JWT_SECRET=
    for /l %%i in (1,1,32) do (
        set /a "rand=!random! %% 62"
        if !rand! lss 26 (
            set /a "char=65 + !rand!"
        ) else if !rand! lss 52 (
            set /a "char=97 + !rand! - 26"
        ) else (
            set /a "char=48 + !rand! - 52"
        )
        for %%c in (!char!) do set JWT_SECRET=!JWT_SECRET!!chr%%c!
    )
    
    REM Generate PostgreSQL password (16 characters)
    set POSTGRES_PASSWORD=
    for /l %%i in (1,1,16) do (
        set /a "rand=!random! %% 62"
        if !rand! lss 26 (
            set /a "char=65 + !rand!"
        ) else if !rand! lss 52 (
            set /a "char=97 + !rand! - 26"
        ) else (
            set /a "char=48 + !rand! - 52"
        )
        for %%c in (!char!) do set POSTGRES_PASSWORD=!POSTGRES_PASSWORD!!chr%%c!
    )
    
    REM Generate Redis password (16 characters)
    set REDIS_PASSWORD=
    for /l %%i in (1,1,16) do (
        set /a "rand=!random! %% 62"
        if !rand! lss 26 (
            set /a "char=65 + !rand!"
        ) else if !rand! lss 52 (
            set /a "char=97 + !rand! - 26"
        ) else (
            set /a "char=48 + !rand! - 52"
        )
        for %%c in (!char!) do set REDIS_PASSWORD=!REDIS_PASSWORD!!chr%%c!
    )
    
    echo [SUCCESS] Generated secure passwords
    
    REM Update .env file with generated passwords
    echo [INFO] Updating .env file with secure passwords...
    
    REM Backup original .env
    copy .env .env.backup >nul
    
    REM Update passwords in .env file using PowerShell
    powershell -Command "(Get-Content .env) -replace 'JWT_SECRET=.*', 'JWT_SECRET=%JWT_SECRET%' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'POSTGRES_PASSWORD=.*', 'POSTGRES_PASSWORD=%POSTGRES_PASSWORD%' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'REDIS_PASSWORD=.*', 'REDIS_PASSWORD=%REDIS_PASSWORD%' | Set-Content .env"
    
    echo [SUCCESS] Updated .env file with secure passwords
) else (
    echo [WARNING] Please ensure you have set secure passwords in .env file
)

echo.

REM Create necessary directories
echo [INFO] Creating necessary directories...
if not exist logs mkdir logs
if not exist uploads mkdir uploads
echo [SUCCESS] Created directories: logs\, uploads\
echo.

REM Start Docker services
echo [INFO] Starting Docker services...
docker-compose pull
docker-compose up -d
echo [SUCCESS] Docker services started
echo.

REM Wait for services to be healthy
echo [INFO] Waiting for services to be healthy...

echo [INFO] Waiting for PostgreSQL...
:wait_postgres
docker-compose exec -T postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_postgres
)

echo [INFO] Waiting for Redis...
:wait_redis
docker-compose exec -T redis redis-cli ping >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_redis
)

echo [INFO] Waiting for Backend...
:wait_backend
curl -f http://localhost:3002/health >nul 2>&1
if errorlevel 1 (
    timeout /t 5 /nobreak >nul
    goto wait_backend
)

echo [SUCCESS] All services are healthy
echo.

REM Run database migrations and seeding
echo [INFO] Setting up database...
timeout /t 10 /nobreak >nul

echo [INFO] Running database migrations...
docker-compose exec -T backend npx prisma migrate deploy

echo [INFO] Seeding database...
docker-compose exec -T backend npm run db:seed

echo [SUCCESS] Database setup completed
echo.

REM Display service information
echo.
echo Setup completed successfully!
echo ================================
echo.
echo Services:
echo   • Backend API: http://localhost:3002
echo   • Health Check: http://localhost:3002/health
echo   • API Docs: http://localhost:3002/api
echo   • PostgreSQL: localhost:5433
echo   • Redis: localhost:6380
echo.
echo Useful commands:
echo   • View logs: docker-compose logs -f
echo   • Stop services: docker-compose down
echo   • Restart services: docker-compose restart
echo   • Check status: docker-compose ps
echo.
echo Database management:
echo   • Prisma Studio: docker-compose exec backend npx prisma studio
echo   • Run migrations: docker-compose exec backend npx prisma migrate deploy
echo   • Seed database: docker-compose exec backend npm run db:seed
echo.

pause
