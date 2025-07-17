#!/bin/bash

# BarberQueue Development Setup Script

echo "🚀 Starting BarberQueue Development Setup..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   Run: mongod"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

# Create environment files
echo "🔧 Setting up environment files..."
if [ ! -f server/.env ]; then
    cp server/.env.example server/.env
    echo "   Created server/.env"
fi

if [ ! -f client/.env ]; then
    echo "REACT_APP_API_URL=http://localhost:5000/api" > client/.env
    echo "REACT_APP_SOCKET_URL=http://localhost:5000" >> client/.env
    echo "   Created client/.env"
fi

# Seed the database
echo "🌱 Seeding database with sample data..."
cd server && npm run seed && cd ..

echo "✅ Setup complete!"
echo ""
echo "🎯 To start the development server:"
echo "   npm run dev"
echo ""
echo "🔗 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:5000"
echo "   API: http://localhost:5000/api"
echo ""
echo "🔐 Demo Login Credentials:"
echo "   Customer: 9876543213 / password123"
echo "   Barber: 9876543210 / password123"
echo "   Admin: 9999999999 / admin123"
