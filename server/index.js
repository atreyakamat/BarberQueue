const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const db = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const bookingRoutes = require('./routes/bookings');
const queueRoutes = require('./routes/queue');
const userRoutes = require('./routes/users');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Security middleware
app.use(helmet());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use('/api/', limiter);

// CORS middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Run Knex migrations then start listening
async function boot() {
  try {
    // Verify PG connection
    await db.raw('SELECT 1');
    console.log('🐘 PostgreSQL connected');

    // Auto-run pending migrations
    const [batch, log] = await db.migrate.latest();
    if (log.length) {
      console.log(`📦 Ran ${log.length} migration(s) (batch ${batch})`);
    } else {
      console.log('📦 Migrations up-to-date');
    }
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    process.exit(1);
  }

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);

    socket.on('join-barber-room', (barberId) => {
      socket.join(`barber-${barberId}`);
    });

    socket.on('join-customer-room', (customerId) => {
      socket.join(`customer-${customerId}`);
    });

    socket.on('queue-update', (data) => {
      io.to(`barber-${data.barberId}`).emit('queue-updated', data);
    });

    socket.on('booking-update', (data) => {
      io.to(`customer-${data.customerId}`).emit('booking-updated', data);
    });

    socket.on('disconnect', () => {
      // silent disconnect
    });
  });

  // Make io + db accessible to routes
  app.use((req, res, next) => {
    req.io = io;
    req.db = db;
    next();
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/queue', queueRoutes);
  app.use('/api/users', userRoutes);

  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      await db.raw('SELECT 1');
      res.json({
        status: 'OK',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch {
      res.status(503).json({ status: 'ERROR', database: 'disconnected' });
    }
  });

  // Serve Frontend in Production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
    });
  } else {
    // 404 handler for API routes
    app.use('*', (req, res) => {
      res.status(404).json({ message: 'Route not found' });
    });
  }

  // Error handling middleware
  app.use((err, req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({
      message: 'Something went wrong!',
      error: process.env.NODE_ENV === 'development' ? err.message : {},
    });
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export for testing
module.exports = { app, server, io, boot };

// Start when run directly
if (require.main === module) {
  boot();
}
