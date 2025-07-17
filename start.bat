@echo off
echo 🚀 Starting BarberQueue Application...
echo.

REM Check if MongoDB is running
echo 🔍 Checking MongoDB service...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo 📡 Starting MongoDB service...
    net start MongoDB
    if %errorlevel% neq 0 (
        echo ❌ Failed to start MongoDB. Please start it manually.
        pause
        exit /b 1
    )
)
echo ✅ MongoDB is running

REM Start the backend server
echo 🔧 Starting backend server...
start "BarberQueue Backend" cmd /k "cd /d c:\Projects\BarberQueue\server && npm start"

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Start the frontend client
echo 🎨 Starting frontend client...
start "BarberQueue Frontend" cmd /k "cd /d c:\Projects\BarberQueue\client && npm start"

echo.
echo ✅ BarberQueue is starting up!
echo.
echo 🌐 Frontend will be available at: http://localhost:3000
echo 🔧 Backend API available at: http://localhost:5000
echo.
echo 🔐 Login Credentials:
echo   Admin: 9999999999 / admin123
echo   Barber: 9876543210 / password123
echo   Customer: 9876543213 / password123
echo.
echo Press any key to close this window...
pause >nul
