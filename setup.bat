@echo off
echo 🚀 Starting BarberQueue Development Setup...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Install server dependencies
echo 📦 Installing server dependencies...
cd server
npm install
cd ..

REM Install client dependencies
echo 📦 Installing client dependencies...
cd client
npm install
cd ..

REM Create environment files
echo 🔧 Setting up environment files...
if not exist server\.env (
    copy server\.env.example server\.env
    echo    Created server\.env
)

if not exist client\.env (
    echo REACT_APP_API_URL=http://localhost:5000/api > client\.env
    echo REACT_APP_SOCKET_URL=http://localhost:5000 >> client\.env
    echo    Created client\.env
)

echo ✅ Setup complete!
echo.
echo 🎯 To start the development server:
echo    npm run dev
echo.
echo 🔗 URLs:
echo    Frontend: http://localhost:3000
echo    Backend: http://localhost:5000
echo    API: http://localhost:5000/api
echo.
echo 🔐 Demo Login Credentials:
echo    Customer: 9876543213 / password123
echo    Barber: 9876543210 / password123
echo    Admin: 9999999999 / admin123
echo.
echo 💡 To seed the database with sample data:
echo    cd server
echo    npm run seed
echo.
pause
