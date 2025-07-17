# MongoDB Atlas Setup Guide

## Option 1: Use MongoDB Atlas (Cloud Database) - Recommended

1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster (free tier M0)
4. Set up database access:
   - Go to "Database Access" → "Add New Database User"
   - Create username and password
   - Grant "Read and write to any database" permissions
5. Set up network access:
   - Go to "Network Access" → "Add IP Address"
   - Add "0.0.0.0/0" (allow access from anywhere) for development
6. Get connection string:
   - Go to "Database" → "Connect" → "Connect your application"
   - Copy the connection string

## Option 2: Alternative Local MongoDB Setup

If you prefer local installation, you can:

1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Run the installer as administrator
3. Follow the installation wizard
4. Start MongoDB service manually

## Environment Variables

After setting up MongoDB (either Atlas or local), update your .env file:

For MongoDB Atlas:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/barberqueue?retryWrites=true&w=majority
```

For Local MongoDB:
```
MONGODB_URI=mongodb://localhost:27017/barberqueue
```

## Next Steps

1. Update your .env file with the MongoDB connection string
2. Run the seed script to populate initial data
3. Test the application
