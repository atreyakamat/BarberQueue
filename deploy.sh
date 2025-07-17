#!/bin/bash

# BarberQueue Deployment Script
# This script builds and prepares the application for deployment

echo "🚀 Starting BarberQueue Deployment Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    print_warning "MongoDB not found in PATH. Make sure MongoDB is installed and running."
fi

# Set environment variables
export NODE_ENV=production
export PORT=5000
export MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/barberqueue}
export JWT_SECRET=${JWT_SECRET:-barberqueue-super-secret-jwt-key-2024}
export CLIENT_URL=${CLIENT_URL:-http://localhost:3000}

print_status "Environment configured"

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install --only=production
if [ $? -ne 0 ]; then
    print_error "Failed to install server dependencies"
    exit 1
fi
print_status "Server dependencies installed"

# Install client dependencies
echo "📦 Installing client dependencies..."
cd ../client
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install client dependencies"
    exit 1
fi
print_status "Client dependencies installed"

# Build the client
echo "🏗️ Building client for production..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build client"
    exit 1
fi
print_status "Client built successfully"

# Create production .env file
echo "🔧 Creating production environment file..."
cd ../server
cat > .env.production << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=${MONGODB_URI}
JWT_SECRET=${JWT_SECRET}
CLIENT_URL=${CLIENT_URL}
EOF
print_status "Production environment file created"

# Create PM2 ecosystem file
echo "🔧 Creating PM2 ecosystem file..."
cd ..
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'barberqueue-api',
      script: './server/index.js',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true
    }
  ]
};
EOF
print_status "PM2 ecosystem file created"

# Create logs directory
mkdir -p logs
print_status "Logs directory created"

# Create Dockerfile
echo "🐳 Creating Dockerfile..."
cat > Dockerfile << EOF
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN cd server && npm ci --only=production
RUN cd client && npm ci

# Copy source code
COPY server/ ./server/
COPY client/ ./client/

# Build client
RUN cd client && npm run build

# Expose port
EXPOSE 5000

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S barberqueue -u 1001

# Change ownership
RUN chown -R barberqueue:nodejs /app
USER barberqueue

# Start the application
CMD ["node", "server/index.js"]
EOF
print_status "Dockerfile created"

# Create docker-compose.yml
echo "🐳 Creating docker-compose.yml..."
cat > docker-compose.yml << EOF
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/barberqueue
      - JWT_SECRET=barberqueue-super-secret-jwt-key-2024
      - CLIENT_URL=http://localhost:3000
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./client/build:/usr/share/nginx/html
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongodb_data:
EOF
print_status "Docker Compose file created"

# Create nginx configuration
echo "🌐 Creating nginx configuration..."
cat > nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Serve static files
        location / {
            try_files \$uri \$uri/ /index.html;
        }

        # Proxy API requests to Node.js server
        location /api {
            proxy_pass http://app:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        # WebSocket support for Socket.io
        location /socket.io {
            proxy_pass http://app:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF
print_status "Nginx configuration created"

# Create deployment README
echo "📝 Creating deployment README..."
cat > DEPLOYMENT.md << EOF
# BarberQueue Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+ installed
- MongoDB installed and running
- Git installed

### Setup
1. Clone the repository
2. Run the setup script: \`./setup.sh\`
3. Start the development servers:
   - Backend: \`cd server && npm run dev\`
   - Frontend: \`cd client && npm start\`

### Default Credentials
- Admin: 9999999999 / admin123
- Barber: 9876543210 / password123
- Customer: 9876543213 / password123

## Production Deployment

### Option 1: Docker Deployment
1. Make sure Docker and Docker Compose are installed
2. Run: \`docker-compose up -d\`
3. Access the application at \`http://localhost\`

### Option 2: PM2 Deployment
1. Install PM2: \`npm install -g pm2\`
2. Run deployment script: \`./deploy.sh\`
3. Start with PM2: \`pm2 start ecosystem.config.js --env production\`

### Option 3: Manual Deployment
1. Set environment variables in server/.env.production
2. Install dependencies: \`npm install --only=production\`
3. Build client: \`cd client && npm run build\`
4. Start server: \`cd server && npm start\`

## Environment Variables

### Required
- \`MONGODB_URI\`: MongoDB connection string
- \`JWT_SECRET\`: Secret key for JWT tokens
- \`PORT\`: Port for the server (default: 5000)
- \`CLIENT_URL\`: Frontend URL for CORS (default: http://localhost:3000)

### Optional
- \`NODE_ENV\`: Environment mode (development/production)

## Database Setup

### MongoDB Atlas (Recommended for Production)
1. Create account at https://cloud.mongodb.com
2. Create a new cluster
3. Get connection string
4. Set MONGODB_URI environment variable

### Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Use default connection: \`mongodb://localhost:27017/barberqueue\`

## Features

### For Customers
- Browse barbers and services
- Book appointments
- View real-time queue status
- Manage bookings
- Get notifications

### For Barbers
- Manage services and pricing
- View and manage bookings
- Update queue status
- Analytics dashboard

### For Admins
- User management
- System analytics
- Service management

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- GET /api/auth/profile - Get user profile

### Users
- GET /api/users/barbers - Get all barbers
- GET /api/users/barber/:id - Get specific barber
- GET /api/users/barber/:id/slots - Get available slots

### Services
- GET /api/services - Get all services
- POST /api/services - Create service (barber only)
- PUT /api/services/:id - Update service
- DELETE /api/services/:id - Delete service

### Bookings
- POST /api/bookings - Create booking
- GET /api/bookings/my-bookings - Get user bookings
- GET /api/bookings/barber-bookings - Get barber bookings
- PUT /api/bookings/:id - Update booking
- DELETE /api/bookings/:id - Cancel booking

### Queue
- GET /api/queue/:barberId - Get queue status
- POST /api/queue/join - Join queue
- PUT /api/queue/update - Update queue position
- DELETE /api/queue/leave - Leave queue

## Real-time Features

The application uses Socket.io for real-time communication:
- Live queue updates
- Booking notifications
- Status changes
- Chat support (if enabled)

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation
- SQL injection prevention
- XSS protection

## Performance Optimization

- Database indexing
- Caching strategies
- Image optimization
- Code splitting
- Lazy loading
- Compression

## Monitoring

- Application logs
- Error tracking
- Performance metrics
- Database monitoring
- User analytics

## Support

For issues and questions:
- Check the logs in /logs directory
- Review API documentation
- Contact support team
EOF
print_status "Deployment README created"

echo ""
print_status "🎉 Deployment preparation completed successfully!"
echo ""
echo "Next steps:"
echo "1. Review and update environment variables in server/.env.production"
echo "2. Choose your deployment method:"
echo "   • Docker: docker-compose up -d"
echo "   • PM2: pm2 start ecosystem.config.js --env production"
echo "   • Manual: Follow instructions in DEPLOYMENT.md"
echo ""
echo "Default credentials:"
echo "• Admin: 9999999999 / admin123"
echo "• Barber: 9876543210 / password123"
echo "• Customer: 9876543213 / password123"
echo ""
print_status "Happy deploying! 🚀"
