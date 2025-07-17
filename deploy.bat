@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting BarberQueue Deployment Process...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    exit /b 1
)

REM Set environment variables
set NODE_ENV=production
set PORT=5000
if "%MONGODB_URI%"=="" set MONGODB_URI=mongodb://localhost:27017/barberqueue
if "%JWT_SECRET%"=="" set JWT_SECRET=barberqueue-super-secret-jwt-key-2024
if "%CLIENT_URL%"=="" set CLIENT_URL=http://localhost:3000

echo ✅ Environment configured

REM Install server dependencies
echo 📦 Installing server dependencies...
cd server
call npm install --only=production
if %errorlevel% neq 0 (
    echo ❌ Failed to install server dependencies
    exit /b 1
)
echo ✅ Server dependencies installed

REM Install client dependencies
echo 📦 Installing client dependencies...
cd ..\client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install client dependencies
    exit /b 1
)
echo ✅ Client dependencies installed

REM Build the client
echo 🏗️ Building client for production...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build client
    exit /b 1
)
echo ✅ Client built successfully

REM Create production .env file
echo 🔧 Creating production environment file...
cd ..\server
(
echo NODE_ENV=production
echo PORT=5000
echo MONGODB_URI=%MONGODB_URI%
echo JWT_SECRET=%JWT_SECRET%
echo CLIENT_URL=%CLIENT_URL%
) > .env.production
echo ✅ Production environment file created

REM Create PM2 ecosystem file
echo 🔧 Creating PM2 ecosystem file...
cd ..
(
echo module.exports = {
echo   apps: [
echo     {
echo       name: 'barberqueue-api',
echo       script: './server/index.js',
echo       env: {
echo         NODE_ENV: 'development',
echo         PORT: 5000
echo       },
echo       env_production: {
echo         NODE_ENV: 'production',
echo         PORT: 5000
echo       },
echo       instances: 1,
echo       exec_mode: 'cluster',
echo       watch: false,
echo       max_memory_restart: '1G',
echo       error_file: './logs/api-error.log',
echo       out_file: './logs/api-out.log',
echo       log_file: './logs/api-combined.log',
echo       time: true
echo     }
echo   ]
echo };
) > ecosystem.config.js
echo ✅ PM2 ecosystem file created

REM Create logs directory
if not exist logs mkdir logs
echo ✅ Logs directory created

REM Create Dockerfile
echo 🐳 Creating Dockerfile...
(
echo FROM node:18-alpine
echo.
echo # Create app directory
echo WORKDIR /app
echo.
echo # Copy package files
echo COPY server/package*.json ./server/
echo COPY client/package*.json ./client/
echo.
echo # Install dependencies
echo RUN cd server ^&^& npm ci --only=production
echo RUN cd client ^&^& npm ci
echo.
echo # Copy source code
echo COPY server/ ./server/
echo COPY client/ ./client/
echo.
echo # Build client
echo RUN cd client ^&^& npm run build
echo.
echo # Expose port
echo EXPOSE 5000
echo.
echo # Create non-root user
echo RUN addgroup -g 1001 -S nodejs
echo RUN adduser -S barberqueue -u 1001
echo.
echo # Change ownership
echo RUN chown -R barberqueue:nodejs /app
echo USER barberqueue
echo.
echo # Start the application
echo CMD ["node", "server/index.js"]
) > Dockerfile
echo ✅ Dockerfile created

echo.
echo ✅ 🎉 Deployment preparation completed successfully!
echo.
echo Next steps:
echo 1. Review and update environment variables in server/.env.production
echo 2. Choose your deployment method:
echo    • Docker: docker-compose up -d
echo    • PM2: pm2 start ecosystem.config.js --env production
echo    • Manual: Follow instructions in DEPLOYMENT.md
echo.
echo Default credentials:
echo • Admin: 9999999999 / admin123
echo • Barber: 9876543210 / password123
echo • Customer: 9876543213 / password123
echo.
echo ✅ Happy deploying! 🚀

pause
