# Build Stage for React Client
FROM node:18-alpine as client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Production Stage for Node Server
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy server files
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

COPY server/ ./server/

# Copy built client files from previous stage
COPY --from=client-builder /app/client/dist ./client/dist

# Expose the port the app runs on
EXPOSE 5000

# Start the server
CMD ["node", "server/index.js"]
